import React, { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabase";
import { MapPin, School, Info, ArrowRight, Compass, Layers, ShieldCheck, HelpCircle, X } from "lucide-react";
import { motion } from "motion/react";
import SchoolDetailModal from "./SchoolDetailModal";

interface SchoolData {
  id: string;
  name: string;
  jenis_sekolah: string;
  logo_url?: string;
  image_url?: string;
  address?: string;
  principal_name?: string;
  student_count?: number;
  teacher_count?: number;
  map_embed_url?: string;
  akreditasi?: string;
  latitude?: string;
  longitude?: string;
  map_icon?: string;
}

const PREDEFINED_COORDS: Record<string, { lat: number; lng: number }> = {
  "upt sdn mentoso": { lat: -6.832742, lng: 112.022335 },
  "sdn mentoso": { lat: -6.832742, lng: 112.022335 },
  "mentoso": { lat: -6.832742, lng: 112.022335 },
  "upt sdn remen 1": { lat: -6.808304, lng: 112.008123 },
  "sdn remen 1": { lat: -6.808304, lng: 112.008123 },
  "remen 1": { lat: -6.808304, lng: 112.008123 },
  "upt sdn remen 2": { lat: -6.815214, lng: 112.015244 },
  "sdn remen 2": { lat: -6.815214, lng: 112.015244 },
  "remen 2": { lat: -6.815214, lng: 112.015244 },
  "upt sdn tasikharjo": { lat: -6.828311, lng: 111.983844 },
  "sdn tasikharjo": { lat: -6.828311, lng: 111.983844 },
  "tasikharjo": { lat: -6.828311, lng: 111.983844 },
  "sdn jenu 1": { lat: -6.88512, lng: 112.0132 },
  "sdn jenu 2": { lat: -6.88750, lng: 112.0172 },
  "sdn jenu 3": { lat: -6.88920, lng: 112.0205 }
};

// Extremely robust coordinate parser matching direct coordinates inputs as well as Google Maps embed URLs
function extractCoordsFromEmbedUrl(url: string) {
  if (!url) return null;
  const clean = url.trim();

  // If input is just directly raw point coordinates, e.g., "-6.832742, 112.022335"
  const rawPairMatch = clean.match(/^([+-]?\d+\.\d+)\s*,\s*([+-]?\d+\.\d+)$/);
  if (rawPairMatch) {
    return {
      lat: parseFloat(rawPairMatch[1]),
      lng: parseFloat(rawPairMatch[2])
    };
  }

  // Same as raw pair but space separated, e.g., "-6.832742 112.022335"
  const rawPairSpaceMatch = clean.match(/^([+-]?\d+\.\d+)\s+([+-]?\d+\.\d+)$/);
  if (rawPairSpaceMatch) {
    return {
      lat: parseFloat(rawPairSpaceMatch[1]),
      lng: parseFloat(rawPairSpaceMatch[2])
    };
  }

  // 1. Google maps embed url style containing pb=!1m18!1m12!1m3!2dLONGITUDE!3dLATITUDE
  const dMatch = url.match(/!2d(-?\d+\.\d+)/);
  const tMatch = url.match(/!3d(-?\d+\.\d+)/);
  if (dMatch && tMatch) {
    const lat = parseFloat(tMatch[1]);
    const lng = parseFloat(dMatch[1]);
    return { lat, lng };
  }

  // 2. Check for @lat,lng style
  const atMatch = url.match(/@(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
  if (atMatch) {
    return {
      lat: parseFloat(atMatch[1]),
      lng: parseFloat(atMatch[2])
    };
  }

  // 3. Check for q=lat,lng or query=lat,lng or ll=lat,lng
  const qMatch = url.match(/[?&](q|cbll|query|ll)=(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
  if (qMatch) {
    return {
      lat: parseFloat(qMatch[2]),
      lng: parseFloat(qMatch[3])
    };
  }

  // 4. Fallback search for any "latitude,longitude" pair match anywhere in URL query/path
  const genericCoordsMatch = url.match(/(-?[5678]\.\d+)\s*,\s*(11[12]\.\d+)/); // Jenu latitude is around -6.8, longitude around 112.0
  if (genericCoordsMatch) {
    return {
      lat: parseFloat(genericCoordsMatch[1]),
      lng: parseFloat(genericCoordsMatch[2])
    };
  }

  return null;
}

// Haversine distance calculator between two points on the globe in Kilometers
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; 
}

// Reliable coordinate getter with predefined mappings and scatter algorithms
function getSchoolCoords(school: SchoolData, idx: number, schoolsCount: number) {
  // 1. Try direct exact lat/long coordinates first
  if (school.latitude && school.longitude) {
    const lLat = parseFloat(school.latitude);
    const lLng = parseFloat(school.longitude);
    if (!isNaN(lLat) && !isNaN(lLng)) {
      return { lat: lLat, lng: lLng };
    }
  }

  // 2. Try embed url / user input second
  if (school.map_embed_url) {
    const coords = extractCoordsFromEmbedUrl(school.map_embed_url);
    if (coords) return coords;
  }

  // 2. Try predefined mapping by exact lowercase trim
  const key = school.name.toLowerCase().trim();
  if (PREDEFINED_COORDS[key]) {
    return PREDEFINED_COORDS[key];
  }

  // 3. Fallback: search key partial matching
  for (const [nameKey, value] of Object.entries(PREDEFINED_COORDS)) {
    if (key.includes(nameKey) || nameKey.includes(key)) {
      return value;
    }
  }

  // 4. Otherwise scatter neatly around the Jenu geographic center coordinates
  const centerLat = -6.832;
  const centerLng = 112.010;
  const angle = (idx * 2 * Math.PI) / (schoolsCount || 1);
  const radius = 0.012 + idx * 0.002; 
  return {
    lat: centerLat + Math.sin(angle) * radius,
    lng: centerLng + Math.cos(angle) * radius
  };
}

interface Landmark {
  name: string;
  lat: number;
  lng: number;
  icon: string;
  color: string;
  description?: string;
  image_url?: string;
  embed_code?: string;
}

const LANDMARKS: Landmark[] = [
  { name: "Pabrik TPPI", lat: -6.786, lng: 111.966, icon: "🏭", color: "bg-orange-500 text-white", description: "PT Trans-Pacific Petrochemical Indotama (TPPI) merupakan salah satu pabrik petrokimia terbesar di Tuban, Jawa Timur.", image_url: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=800&q=80" },
  { name: "Pertamina TBBM", lat: -6.790, lng: 111.987, icon: "🛢️", color: "bg-red-600 text-white", description: "Terminal Bahan Bakar Minyak (TBBM) Tuban sebagai salah satu tulang punggung suplai energi utama di Jawa Timur.", image_url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80" },
  { name: "PLTU T. Awar-Awar", lat: -6.790, lng: 111.996, icon: "⚡", color: "bg-yellow-500 text-white", description: "Pembangkit Listrik Tenaga Uap (PLTU) Tanjung Awar-Awar penyuplai pasokan listrik masif sistem kelistrikan Jawa-Bali.", image_url: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=800&q=80" },
  { name: "Pantai Panduri", lat: -6.804, lng: 112.030, icon: "🏖️", color: "bg-blue-400 text-white", description: "Destinasi wisata keindahan alam pantai dengan cemara udang hijau rimbun yang membentang asri di pesisir Jenu.", image_url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80" },
  { name: "Pantai Pasir Putih", lat: -6.790, lng: 111.979, icon: "🌴", color: "bg-emerald-400 text-white", description: "Pantai berpasir putih elok dengan deburan ombak bersahabat, tempat bersantai terbaik bersama sanak keluarga.", image_url: "https://images.unsplash.com/photo-1520520731457-9283dd14aa66?auto=format&fit=crop&w=800&q=80" },
  { name: "Pantai Sumur Pawon", lat: -6.801, lng: 112.001, icon: "🌊", color: "bg-cyan-400 text-white", description: "Mutiara pesisir pantai tersembunyi berpenduduk nelayan yang menyajikan ketenangan pesona alam bahari murni.", image_url: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&w=800&q=80" },
];

export default function MapGugus() {
  const [schools, setSchools] = useState<SchoolData[]>([]);
  const [dbLandmarks, setDbLandmarks] = useState<Landmark[]>(LANDMARKS);
  const [selectedSchool, setSelectedSchool] = useState<SchoolData | null>(null);
  const [detailSchool, setDetailSchool] = useState<SchoolData | null>(null);
  const [selectedLandmark, setSelectedLandmark] = useState<Landmark | null>(null);
  const [hoveredSchoolId, setHoveredSchoolId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [leafletReady, setLeafletReady] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const activePolylineRef = useRef<any>(null);

  // Load Landmarks
  useEffect(() => {
    async function fetchLandmarks() {
      if (!supabase) return;
      const { data, error } = await supabase.from('landmarks').select('*');
      if (!error && data) {
        if (data.length === 0) {
          setDbLandmarks([]);
        } else {
          const mapped = data.map((item: any) => {
            const latVal = parseFloat(item.latitude);
            const lngVal = parseFloat(item.longitude);
            const baseColor = item.color || "bg-blue-500 text-white";
            return {
              name: item.name || "",
              lat: isNaN(latVal) ? 0 : latVal,
              lng: isNaN(lngVal) ? 0 : lngVal,
              icon: item.icon || "📍",
              color: baseColor.replace("_hidden", ""),
              is_visible: !baseColor.includes("_hidden"),
              description: item.description || "",
              image_url: item.image_url || "",
              embed_code: item.embed_code || "",
            };
          }).filter((item: any) => item.lat !== 0 && item.lng !== 0 && item.is_visible);
          
          setDbLandmarks(mapped);
        }
      }
    }
    fetchLandmarks();
  }, []);

  // 1. Load Leaflet CDN Assets
  useEffect(() => {
    // Inject Link CSS
    const linkId = "leaflet-css-cdn";
    if (!document.getElementById(linkId)) {
      const link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      link.crossOrigin = "";
      document.head.appendChild(link);
    }

    // Inject JS Script
    const scriptId = "leaflet-js-cdn";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.crossOrigin = "";
      script.onload = () => {
        setLeafletReady(true);
      };
      document.body.appendChild(script);
    } else {
      if ((window as any).L) {
        setLeafletReady(true);
      }
    }
  }, []);

  // 2. Fetch Schools from Supabase
  useEffect(() => {
    async function loadSchools() {
      if (!supabase) return;
      try {
        const { data, error } = await supabase
          .from("schools")
          .select("*")
          .order("jenis_sekolah", { ascending: true });
        if (error) throw error;
        setSchools(data || []);
      } catch (err) {
        console.error("Error loading schools for map:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadSchools();
  }, []);

  // 3. Initialize and Update Map
  useEffect(() => {
    if (!leafletReady || isLoading || !mapContainerRef.current || schools.length === 0) return;

    const L = (window as any).L;
    if (!L) return;

    // Check if map is already initialized, clear it if true
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    // Default center around Jenu, Tuban
    const centerLat = -6.832;
    const centerLng = 112.010;

    // Initialize Map
    const map = L.map(mapContainerRef.current, {
      center: [centerLat, centerLng],
      zoom: 13,
      scrollWheelZoom: false,
      zoomControl: true,
    });

    mapRef.current = map;

    // Load beautiful minimalist tiles
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 20
    }).addTo(map);

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Plot each school
    schools.forEach((school, index) => {
      const coords = getSchoolCoords(school, index, schools.length);
      const isInti = school.jenis_sekolah === "Sekolah Inti";

      // Design unique HTML for the custom marker featuring School Building Icon & Name Label
      // Using accurate CSS alignment inside a fixed 140x100 box so the anchor point rests precisely on [70, 100]
      let markerColor = isInti 
        ? "bg-gradient-to-br from-main-blue to-blue-700" 
        : "bg-gradient-to-br from-leaf-green to-emerald-700";
        
      let stalkColor = isInti ? "bg-main-blue" : "bg-leaf-green";
      let iconContent = `
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      `;

      if (school.map_icon) {
        const parts = school.map_icon.split("|");
        const colorName = parts[0] || "";
        const iconEmoji = parts[1] || "";
        
        if (colorName) {
          if (colorName === "blue") {
            markerColor = "bg-gradient-to-br from-main-blue to-blue-700";
            stalkColor = "bg-main-blue";
          } else if (colorName === "green") {
            markerColor = "bg-gradient-to-br from-leaf-green to-emerald-700";
            stalkColor = "bg-leaf-green";
          } else if (colorName === "orange") {
            markerColor = "bg-gradient-to-br from-main-orange to-orange-700";
            stalkColor = "bg-main-orange";
          } else if (colorName === "indigo") {
            markerColor = "bg-gradient-to-br from-indigo-500 to-indigo-800";
            stalkColor = "bg-indigo-600";
          } else if (colorName === "purple") {
            markerColor = "bg-gradient-to-br from-purple-500 to-purple-800";
            stalkColor = "bg-purple-600";
          } else if (colorName === "rose") {
            markerColor = "bg-gradient-to-br from-rose-500 to-rose-800";
            stalkColor = "bg-rose-600";
          } else if (colorName === "amber") {
            markerColor = "bg-gradient-to-br from-amber-500 to-amber-700";
            stalkColor = "bg-amber-600";
          }
        }
        
        if (iconEmoji) {
          iconContent = `<span class="text-sm font-extrabold select-none leading-none">${iconEmoji}</span>`;
        }
      }

      const markerHtml = `
        <div class="flex flex-col items-center justify-end h-full select-none" style="width: 140px; height: 100px; overflow: visible;">
          <!-- Tooltip Label -->
          <div class="px-2.5 py-1 rounded-lg shadow-md border text-[10px] font-extrabold text-center bg-white text-soft-black border-gray-100 whitespace-nowrap leading-tight ${isInti ? "ring-2 ring-main-blue/30 scale-102" : "scale-95"} mb-1 transition-all duration-300">
            ${school.name}
          </div>
          <!-- Pin body -->
          <div class="relative flex flex-col items-center justify-center">
            <!-- Ripple Effect for Sekolah Inti -->
            ${isInti ? `
              <div class="absolute w-8 h-8 bg-main-blue/20 rounded-full animate-ping"></div>
              <div class="absolute w-6 h-6 bg-main-blue/30 rounded-full animate-pulse"></div>
            ` : ""}
            
            <!-- Icon frame -->
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white transition-all transform hover:scale-110 active:scale-95 cursor-pointer ${markerColor}">
              ${iconContent}
            </div>
            
            <!-- Pin stalk -->
            <div class="w-1.5 h-2 -mt-[2px] ${stalkColor} mx-auto rounded-b shadow-sm"></div>
          </div>
        </div>
      `;

      // Create Leaflet DivIcon with proper dimensions ensuring zero drifts on zoom in/out
      const customIcon = L.divIcon({
        html: markerHtml,
        className: "custom-school-marker",
        iconSize: [140, 100],
        iconAnchor: [70, 100]
      });

      // Add to map
      const marker = L.marker([coords.lat, coords.lng], { icon: customIcon })
        .addTo(map)
        .on("click", () => {
          setSelectedLandmark(null);
          setSelectedSchool(school);
          map.setView([coords.lat, coords.lng], 15, { animate: true, duration: 1 });
        })
        .on("mouseover", () => {
          setHoveredSchoolId(school.id);
        })
        .on("mouseout", () => {
          setHoveredSchoolId(null);
        });

      markersRef.current.push(marker);
    });

    // Plot landmarks
    dbLandmarks.forEach((landmark) => {
      const markerHtml = `
        <div class="flex flex-col items-center justify-end h-full select-none group" style="width: 140px; height: 100px; overflow: visible;">
           <!-- Tooltip Label -->
           <div class="opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out pointer-events-none transform translate-y-1 group-hover:translate-y-0 scale-95 group-hover:scale-100 px-2.5 py-1 rounded-lg shadow-md border text-[10px] font-extrabold text-center bg-white backdrop-blur-sm text-soft-black border-gray-100 whitespace-nowrap leading-tight mb-1">
             ${landmark.name}
           </div>
           <!-- Pin body -->
           <div class="relative flex flex-col items-center justify-center">
             <!-- Icon frame -->
             <div class="w-7 h-7 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white transition-all transform hover:scale-115 cursor-help ${landmark.color}">
               <span class="text-xs font-extrabold select-none leading-none">${landmark.icon}</span>
             </div>
             <!-- Pin stalk -->
             <div class="w-1.5 h-2 -mt-[2px] opacity-80 ${landmark.color.split(' ')[0]} mx-auto rounded-b shadow-sm"></div>
           </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: "custom-landmark-marker",
        iconSize: [140, 100],
        iconAnchor: [70, 100]
      });

      const marker = L.marker([landmark.lat, landmark.lng], { icon: customIcon })
        .addTo(map)
        .on("click", () => {
          setSelectedSchool(null);
          setSelectedLandmark(landmark);
          map.setView([landmark.lat, landmark.lng], 16, { animate: true, duration: 1 });
        });

      // We ONLY add landmarks to the feature group bounds if requested, but let's 
      // add them so the map zooms out enough to show everything!
      markersRef.current.push(marker);
    });

    // Auto-adjust fit map boundaries to show all plotted schools nicely
    if (markersRef.current.length > 0) {
      const group = new L.featureGroup(markersRef.current);
      map.fitBounds(group.getBounds().pad(0.15));
    }

    return () => {
      markersRef.current.forEach(m => m.remove());
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [leafletReady, isLoading, schools, dbLandmarks]);

  // 4. Update Connecting Distance Visual Polylines dynamically
  useEffect(() => {
    if (!leafletReady || isLoading || !mapRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    // Erase old polyline group if drawing exists
    if (activePolylineRef.current) {
      activePolylineRef.current.remove();
      activePolylineRef.current = null;
    }

    // Capture target school (prioritize hover state above click/selected state)
    const targetSchoolId = hoveredSchoolId || selectedSchool?.id;
    if (!targetSchoolId) return;

    const targetSchool = schools.find((s) => s.id === targetSchoolId);
    if (!targetSchool || targetSchool.jenis_sekolah === "Sekolah Inti") return;

    // Locate the "Sekolah Inti" to connect with
    const sekolahInti = schools.find((s) => s.jenis_sekolah === "Sekolah Inti") || schools[0];
    if (!sekolahInti || sekolahInti.id === targetSchool.id) return;

    const idxInti = schools.findIndex((s) => s.id === sekolahInti.id);
    const coordsInti = getSchoolCoords(sekolahInti, idxInti, schools.length);

    const idxTarget = schools.findIndex((s) => s.id === targetSchool.id);
    const coordsTarget = getSchoolCoords(targetSchool, idxTarget, schools.length);

    if (!coordsInti || !coordsTarget) return;

    // Calculate actual geodesic distance
    const dist = calculateDistance(coordsInti.lat, coordsInti.lng, coordsTarget.lat, coordsTarget.lng);

    // Build decorative connection styling
    const pathGroup = L.featureGroup();

    // Fat semi-translucent hover background line for smooth presentation
    const bgLine = L.polyline([[coordsInti.lat, coordsInti.lng], [coordsTarget.lat, coordsTarget.lng]], {
      color: "#f59e0b", // Amber
      weight: 12,
      opacity: 0.12,
      lineCap: "round"
    });

    // Bright main dotted dashboard line
    const dashLine = L.polyline([[coordsInti.lat, coordsInti.lng], [coordsTarget.lat, coordsTarget.lng]], {
      color: "#f97316", // Orange-500
      weight: 3.5,
      dashArray: "10, 8",
      opacity: 0.95,
      lineCap: "round"
    });

    bgLine.addTo(pathGroup);
    dashLine.addTo(pathGroup);

    // Dynamic centered distance tooltip marker plotting
    const midLat = (coordsInti.lat + coordsTarget.lat) / 2;
    const midLng = (coordsInti.lng + coordsTarget.lng) / 2;
    const distanceStr = `Sinergi Jarak: ${dist.toFixed(2)} km`;

    const tooltipMarker = L.marker([midLat, midLng], {
      icon: L.divIcon({
        className: 'premium-distance-marker-container',
        html: `<div class="flex items-center justify-center pointer-events-none" style="transform: translate(-50%, -50%);"><span class="premium-distance-tooltip">${distanceStr}</span></div>`,
        iconAnchor: [0, 0]
      })
    });

    tooltipMarker.addTo(pathGroup);

    // Render group on the live map layer
    pathGroup.addTo(mapRef.current);
    activePolylineRef.current = pathGroup;

    return () => {
      if (activePolylineRef.current) {
        activePolylineRef.current.remove();
        activePolylineRef.current = null;
      }
    };
  }, [selectedSchool, hoveredSchoolId, schools, leafletReady, isLoading]);


  // Focus Map to specified school
  const zoomToSchool = (school: SchoolData) => {
    if (!mapRef.current) return;
    setSelectedLandmark(null);
    setSelectedSchool(school);

    // Get coordinates using identical logic values
    const idx = schools.findIndex(s => s.id === school.id);
    const coords = getSchoolCoords(school, idx, schools.length);

    if (coords) {
      mapRef.current.setView([coords.lat, coords.lng], 15.5, {
        animate: true,
        duration: 1.2
      });
    }
  };

  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-main-orange/20 shadow-xl p-4 sm:p-6 relative">
      <style>{`
        /* Self-contained CSS injection ensuring 100% stable layout assets style */
        .custom-school-marker {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          overflow: visible !important;
        }
        .premium-distance-tooltip {
          background: #0f172a !important; /* Slate-900 */
          color: #ffffff !important;
          border: 1.5px solid #f97316 !important; /* Orange */
          font-weight: 800 !important;
          font-family: inherit !important;
          font-size: 10px !important;
          border-radius: 9999px !important;
          padding: 4px 10px !important;
          box-shadow: 0 4px 14px rgba(249,115,22,0.3) !important;
          white-space: nowrap !important;
          display: inline-block !important;
          letter-spacing: 0.025em;
          animation: tooltipPulse 1.5s infinite ease-in-out;
        }
        @keyframes tooltipPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }
        .premium-distance-marker-container {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          width: 0px !important;
          height: 0px !important;
        }
      `}</style>

      {/* Map Control Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-main-orange/10 rounded-2xl flex items-center justify-center text-main-orange">
            <Compass className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <h4 className="font-heading font-extrabold text-lg text-soft-black">Peta Digital Jaringan Pendidikan</h4>
            <p className="text-xs text-gray-500">Pemetaan visual lokasi Sekolah Inti & Sekolah Imbas Gugus 03 Melati</p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs bg-gray-50 p-2 sm:p-3 rounded-2xl border border-gray-100 font-bold">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-xl shadow-sm border border-gray-200/50">
            <div className="w-3.5 h-3.5 bg-gradient-to-tr from-main-blue to-blue-500 rounded-full flex items-center justify-center text-[8px] text-white">
              <span className="font-extrabold">I</span>
            </div>
            <span className="text-main-blue">Sekolah Inti</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-xl shadow-sm border border-gray-200/50">
            <div className="w-3.5 h-3.5 bg-gradient-to-tr from-leaf-green to-emerald-500 rounded-full flex items-center justify-center text-[8px] text-white">
              <span className="font-extrabold">M</span>
            </div>
            <span className="text-leaf-green">Sekolah Imbas</span>
          </div>
        </div>
      </div>

      {/* Main Container Core */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar School List Selection Panel */}
        <div className="lg:col-span-4 max-h-[600px] overflow-y-auto pr-1 space-y-2.5 scrollbar-thin scrollbar-thumb-gray-200">
          <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-2 pl-1 block">Daftar Sekolah Anggota</p>
          {schools.length === 0 ? (
            <div className="text-center text-xs text-gray-400 py-6">Memuat daftar sekolah...</div>
          ) : (
            (() => {
              const sekolahInti = schools.find(s => s.jenis_sekolah === "Sekolah Inti") || schools[0];
              const idxInti = schools.findIndex(s => s.id === sekolahInti?.id);
              const coordsInti = sekolahInti ? getSchoolCoords(sekolahInti, idxInti, schools.length) : null;

              // Pre-calculate distance for each school to allow sorting while preserving coordinate calculation indexes
              const schoolsWithDistance = schools.map((school, idx) => {
                const coordsTarget = getSchoolCoords(school, idx, schools.length);
                let dist = 0;
                if (coordsInti && school.id !== sekolahInti?.id) {
                  dist = calculateDistance(coordsInti.lat, coordsInti.lng, coordsTarget.lat, coordsTarget.lng);
                }
                return {
                  school,
                  idx,
                  dist,
                };
              });

              // Sort by distance (Sekolah Inti always strictly first, others sorted ascending from closest to furthest)
              const sortedSchools = [...schoolsWithDistance].sort((a, b) => {
                const aIsInti = a.school.jenis_sekolah === "Sekolah Inti";
                const bIsInti = b.school.jenis_sekolah === "Sekolah Inti";
                if (aIsInti && !bIsInti) return -1;
                if (!aIsInti && bIsInti) return 1;
                return a.dist - b.dist;
              });

              return sortedSchools.map(({ school, idx, dist }) => {
                const isInti = school.jenis_sekolah === "Sekolah Inti";
                const isCurrent = selectedSchool?.id === school.id;
                
                // Calculate distance info directly for display in the sidebar
                let distanceStr = "";
                if (coordsInti && school.id !== sekolahInti?.id) {
                  distanceStr = `${dist.toFixed(2)} km dari Sekolah Inti`;
                }

                return (
                  <button
                    key={school.id}
                    onClick={() => zoomToSchool(school)}
                    onMouseEnter={() => setHoveredSchoolId(school.id)}
                    onMouseLeave={() => setHoveredSchoolId(null)}
                    className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center gap-3 cursor-pointer group ${
                      isCurrent
                        ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-main-blue ring-1 ring-main-blue/20"
                        : "bg-white hover:bg-gray-50 border-gray-100 hover:border-gray-200"
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                      isInti 
                        ? "bg-blue-100/50 border-blue-200 text-main-blue" 
                        : "bg-green-100/50 border-green-200 text-leaf-green"
                    }`}>
                      <School className="w-4.5 h-4.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-extrabold text-xs text-soft-black whitespace-normal break-words leading-tight group-hover:text-main-blue transition-colors">
                        {school.name}
                      </p>
                      <div className="flex flex-col mt-0.5">
                        <span className={`text-[9px] font-black uppercase tracking-wider ${isInti ? "text-main-blue" : "text-leaf-green"}`}>
                          {school.jenis_sekolah}
                        </span>
                        {distanceStr && (
                          <span className="text-[9px] text-gray-500 font-extrabold mt-0.5 inline-flex items-center gap-1 bg-gray-100 rounded-md px-1.5 py-0.5 w-max">
                            <MapPin className="w-2.5 h-2.5 text-main-orange" /> {distanceStr}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              });
            })()
          )}
        </div>

        {/* Map Stage Viewer */}
        <div className="lg:col-span-8 relative bg-gray-50 rounded-3xl border border-gray-100 overflow-hidden shadow-inner h-[450px] sm:h-[600px]">
          {(!leafletReady || isLoading) && (
            <div className="absolute inset-0 bg-white/75 backdrop-blur-sm z-[1000] flex flex-col items-center justify-center p-6 text-center">
              <div className="w-12 h-12 border-4 border-main-blue border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest leading-none">Menyiapkan peta digital...</p>
            </div>
          )}
          
          {/* Map canvas container */}
          <div ref={mapContainerRef} className="w-full h-full" style={{ zIndex: 10 }} />

          {/* Floating School Detail Popup Indicator Overlay */}
          {selectedSchool && (
            <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 bg-white/95 backdrop-blur-md rounded-2.5rem p-4 border border-gray-100 shadow-2xl z-[1000] max-w-sm w-auto animate-fade-in-up">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden shrink-0">
                  <img
                    src={selectedSchool.logo_url || "https://www.image2url.com/r2/default/images/1778156189287-e4930eb4-3c36-4ace-8420-ca8908132e66.png"}
                    alt="Logo"
                    className="w-full h-full object-contain p-1"
                  />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                    selectedSchool.jenis_sekolah === "Sekolah Inti"
                      ? "bg-main-blue/10 text-main-blue"
                      : "bg-leaf-green/10 text-leaf-green"
                  }`}>
                    {selectedSchool.jenis_sekolah}
                  </span>
                  <p className="font-extrabold text-sm text-soft-black mt-1 leading-tight">{selectedSchool.name}</p>
                  <p className="text-[11px] text-gray-500 font-semibold mt-0.5 leading-tight truncate">
                    Kepsek: {selectedSchool.principal_name || "-"}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-400 font-bold uppercase tracking-wide">
                    <span>Siswa: <strong className="text-soft-black font-extrabold">{selectedSchool.student_count || 0}</strong></span>
                    <span>Guru: <strong className="text-soft-black font-extrabold">{selectedSchool.teacher_count || 0}</strong></span>
                  </div>
                </div>
              </div>

              {/* Action row */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100/80">
                <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3 text-leaf-green" /> Verifikasi Gugus
                </span>
                <a
                  href="#sekolah"
                  onClick={(e) => {
                    e.preventDefault();
                    if (selectedSchool) {
                      setDetailSchool(selectedSchool);
                    }
                    // Scroll to sekolah section
                    const el = document.getElementById("sekolah");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                    
                    // Dispatch custom event to open school detail modal
                    const event = new CustomEvent('open-school-detail', { detail: selectedSchool });
                    window.dispatchEvent(event);
                  }}
                  className="px-3.5 py-1.5 bg-soft-black hover:bg-main-blue text-white rounded-xl text-[10px] font-extrabold uppercase tracking-widest transition-all hover:scale-103 shadow active:scale-95 flex items-center gap-1.5 cursor-pointer leading-tight"
                >
                  Lihat Detail <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          {/* Floating Landmark Detail Popup Indicator Overlay */}
          {selectedLandmark && (
            <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 bg-white/95 backdrop-blur-md rounded-3xl p-5 border border-gray-100 shadow-2xl z-[1000] max-w-sm w-auto animate-fade-in-up max-h-[85%] overflow-y-auto scrollbar-thin">
              {/* Header Close button */}
              <div className="flex items-center justify-between mb-3 gap-2">
                <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 rounded-lg text-[9px] font-black uppercase text-amber-600 tracking-widest leading-none shrink-0">
                  📍 Titik Landmark
                </span>
                <button
                  onClick={() => setSelectedLandmark(null)}
                  className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Cover Image */}
              {selectedLandmark.image_url && (
                <div className="w-full h-36 rounded-2xl overflow-hidden mb-3.5 border border-gray-150 relative bg-gray-50 shrink-0">
                  <img
                    referrerPolicy="no-referrer"
                    src={selectedLandmark.image_url}
                    alt={selectedLandmark.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Hide image if it fails to load
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                </div>
              )}

              {/* Title & Info */}
              <div className="text-left">
                <div className="flex items-start gap-2">
                  <span className="text-xl shrink-0 leading-none mt-0.5">{selectedLandmark.icon}</span>
                  <h5 className="font-extrabold text-sm sm:text-base text-soft-black leading-snug">{selectedLandmark.name}</h5>
                </div>
                
                {selectedLandmark.description && (
                  <p className="text-xs text-gray-500 mt-2 leading-relaxed font-semibold">
                    {selectedLandmark.description}
                  </p>
                )}

                {/* Embedded Widget */}
                {selectedLandmark.embed_code && (
                  <div className="mt-3.5">
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1.5 pl-0.5">PETA NAVIGASI (LIVE)</p>
                    {(() => {
                      const embed = selectedLandmark.embed_code;
                      if (!embed) return null;
                      if (embed.includes("<iframe")) {
                        let cleaned = embed
                          .replace(/width="[0-9%]+"/g, 'width="100%"')
                          .replace(/height="[0-9%]+"/g, 'height="100%"');
                        return (
                          <div 
                            className="w-full h-40 rounded-2xl overflow-hidden border border-gray-100 shadow-inner"
                            dangerouslySetInnerHTML={{ __html: cleaned }}
                          />
                        );
                      }
                      if (embed.startsWith("http")) {
                        return (
                          <iframe
                            src={embed}
                            className="w-full h-40 rounded-2xl overflow-hidden border border-gray-100 shadow-inner"
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                          />
                        );
                      }
                      return null;
                    })()}
                  </div>
                )}
                
                {/* Coordinates */}
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between gap-4">
                  <span className="text-[9px] font-mono font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded inline-block truncate">
                    {selectedLandmark.lat.toFixed(5)}, {selectedLandmark.lng.toFixed(5)}
                  </span>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${selectedLandmark.lat},${selectedLandmark.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-main-blue hover:bg-hover-blue text-white rounded-xl text-[9px] font-extrabold uppercase tracking-widest transition-all shadow active:scale-95 flex items-center gap-1 cursor-pointer leading-tight shrink-0"
                  >
                    Google Maps <ArrowRight className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* School Detail Modal Overlay */}
      <SchoolDetailModal school={detailSchool} onClose={() => setDetailSchool(null)} />
    </div>
  );
}
