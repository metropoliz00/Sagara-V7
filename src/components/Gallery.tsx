import { motion, AnimatePresence } from "motion/react";
import { Play, ChevronLeft, ChevronRight, Video, Image as ImageIcon } from "lucide-react";
import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabase";

function getEmbedUrl(url: string) {
  if (!url) return "";
  if (url.includes("youtube.com/embed/")) return url;
  
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube.com/embed/${ytMatch[1]}`;
  }

  const vimeoMatch = url.match(/vimeo\.com\/(?:.*\/)?(\d+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  return url;
}

function isVideoItem(item: any) {
  if (!item) return false;
  if (item.type === 'video') return true;
  if (typeof item.media_url === 'string') {
    const url = item.media_url.toLowerCase();
    if (
      url.includes('youtube.com') ||
      url.includes('youtu.be') ||
      url.includes('vimeo.com') ||
      url.endsWith('.mp4') ||
      url.endsWith('.webm')
    ) {
      return true;
    }
  }
  return false;
}

interface Slide {
  type: 'video' | 'photo_grid';
  items: any[];
}

const getInitialGallery = (): any[] => {
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem('cached_gallery');
      if (cached) return JSON.parse(cached);
    } catch (e) {}
  }
  return [];
};

export default function Gallery() {
  const [items, setItems] = useState<any[]>(getInitialGallery);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [isLoading, setIsLoading] = useState<boolean>(() => items.length === 0);

  useEffect(() => {
    async function fetchGallery() {
      if (!supabase) return;
      try {
        const { data, error } = await supabase.from('gallery').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        if (data) {
          setItems(data);
          try {
            localStorage.setItem('cached_gallery', JSON.stringify(data));
          } catch (e) {}
        }
      } catch (err) {
        console.error("Gagal memuat galeri:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchGallery();
  }, []);

  const slides: Slide[] = useMemo(() => {
    const result: Slide[] = [];
    let photoBuffer: any[] = [];

    for (const item of items) {
      if (isVideoItem(item)) {
        if (photoBuffer.length > 0) {
          result.push({ type: 'photo_grid', items: photoBuffer });
          photoBuffer = [];
        }
        result.push({ type: 'video', items: [item] });
      } else {
        photoBuffer.push(item);
        if (photoBuffer.length === 4) {
          result.push({ type: 'photo_grid', items: photoBuffer });
          photoBuffer = [];
        }
      }
    }

    if (photoBuffer.length > 0) {
      result.push({ type: 'photo_grid', items: photoBuffer });
    }

    return result;
  }, [items]);

  useEffect(() => {
    if (!isAutoPlay || slides.length === 0) return;
    const currentSlide = slides[currentIndex];
    if (currentSlide?.type === 'video') return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [slides, currentIndex, isAutoPlay]);

  const next = () => {
    if (slides.length === 0) return;
    setIsAutoPlay(false);
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const prev = () => {
    if (slides.length === 0) return;
    setIsAutoPlay(false);
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const currentSlide = slides[currentIndex];

  return (
    <section id="galeri" className="py-24 bg-gradient-to-b from-white to-light-gray relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
      
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-leaf-green font-bold tracking-widest text-sm uppercase mb-3 px-4 py-1 bg-leaf-green/10 rounded-full w-max">Dokumentasi</h2>
              <h3 className="text-4xl md:text-5xl font-heading font-extrabold text-soft-black mb-6">Momen Berharga <span className="text-main-blue">Gugus 03</span></h3>
              <p className="text-gray-500 text-lg leading-relaxed">Saksikan dokumentasi visual dan video kegiatan kolaboratif yang dilaksanakan oleh seluruh anggota Gugus 03 Melati Kecamatan Jenu.</p>
            </motion.div>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={prev}
              className="w-12 h-12 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:bg-main-blue hover:text-white hover:border-main-blue transition-all shadow-sm active:scale-95 disabled:opacity-50"
              disabled={slides.length <= 1}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button 
              onClick={next}
              className="w-12 h-12 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:bg-main-blue hover:text-white hover:border-main-blue transition-all shadow-sm active:scale-95 disabled:opacity-50"
              disabled={slides.length <= 1}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        {isLoading ? (
           <div className="text-center text-gray-400 font-medium py-10">Memuat galeri...</div>
        ) : slides.length === 0 ? (
           <div className="text-center text-gray-400 font-medium py-10">Galeri belum tersedia.</div>
        ) : (
          <div className="relative group">
            <div className="aspect-video md:aspect-[21/9] rounded-[2rem] overflow-hidden bg-black shadow-2xl relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0 w-full h-full"
                >
                  {currentSlide.type === 'video' ? (
                    <div className="relative w-full h-full bg-slate-950 flex flex-col justify-center items-center overflow-hidden">
                      {(() => {
                        const videoItem = currentSlide.items[0];
                        const embedUrl = getEmbedUrl(videoItem.media_url);
                        const isDirectVideo = typeof videoItem.media_url === 'string' && videoItem.media_url.match(/\.(mp4|webm|ogg)$/i);

                        if (isDirectVideo) {
                          return (
                            <video
                              src={videoItem.media_url}
                              controls
                              className="w-full h-full object-contain"
                            />
                          );
                        } else if (embedUrl) {
                          return (
                            <iframe
                              src={embedUrl}
                              title={videoItem.title || "Video Galeri"}
                              className="w-full h-full border-0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          );
                        } else {
                          return (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400 p-6 text-center">
                              <Video className="w-12 h-12 mb-2 text-main-blue animate-pulse" />
                              <p className="text-sm font-bold text-white">{videoItem.title || "Video Kegiatan"}</p>
                              <p className="text-xs text-gray-500 mt-1">Link video belum dikonfigurasi</p>
                            </div>
                          );
                        }
                      })()}

                      {currentSlide.items[0]?.title && (
                        <div className="absolute top-4 left-4 z-10 pointer-events-none">
                          <span className="px-3.5 py-1.5 bg-black/70 backdrop-blur-md text-white text-xs font-bold rounded-full border border-white/20 shadow-lg flex items-center gap-2">
                            <Video className="w-4 h-4 text-pink-500" />
                            {currentSlide.items[0].title}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className={`w-full h-full p-4 gap-4 grid ${
                      currentSlide.items.length === 1 ? 'grid-cols-1' :
                      currentSlide.items.length === 2 ? 'grid-cols-2' :
                      'grid-cols-2 grid-rows-2'
                    }`}>
                      {currentSlide.items.map((item, idx) => (
                        <div key={idx} className="relative rounded-2xl overflow-hidden shadow-md group/photo bg-gray-900">
                          <img 
                            src={item.media_url} 
                            alt={item.title || `Foto ${idx + 1}`} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover/photo:scale-105"
                          />
                          {item.title && (
                            <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white text-xs font-bold opacity-0 group-hover/photo:opacity-100 transition-opacity truncate">
                              {item.title}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Slide Indicators */}
            <div className="flex justify-center items-center gap-2 mt-8">
              {slides.map((slide, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setIsAutoPlay(false);
                    setCurrentIndex(i);
                  }}
                  title={slide.type === 'video' ? `Video: ${slide.items[0]?.title || 'Kegiatan'}` : `Foto Kegiatan (${slide.items.length})`}
                  className={`transition-all duration-300 rounded-full flex items-center justify-center ${
                    currentIndex === i 
                      ? 'w-10 bg-main-blue h-3 text-white text-[9px] font-black' 
                      : 'w-3 bg-gray-300 h-3 hover:bg-gray-400'
                  }`}
                >
                  {currentIndex === i && (
                    slide.type === 'video' ? <Video className="w-2.5 h-2.5" /> : <ImageIcon className="w-2.5 h-2.5" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
