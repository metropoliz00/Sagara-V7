import React, { useEffect, useRef, useState } from "react";
import { Stage, Layer, Text, Image as KonvaImage } from "react-konva";
import useImage from "use-image";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { saveAs } from "file-saver";
import { supabase } from "../lib/supabase";

const StageComponent = Stage as any;
const LayerComponent = Layer as any;
const TextComponent = Text as any;
const KonvaImageComponent = KonvaImage as any;
import {
  Award,
  Save,
  Download,
  Plus,
  Trash2,
  Move,
  Type,
  Settings,
  RefreshCw,
  Image as ImageIcon,
  Database,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ImageUpload from "./ImageUpload";
import { useAlert } from "../contexts/AlertContext";

// =================================
// TYPES
// =================================

interface FieldType {
  id: string;
  field_name: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontWeight: string;
  color: string;
  page?: number;
  align?: "left" | "center" | "right";
}

interface PlaceholderConfig {
  label: string;
  placeholder: string;
  dbField: string;
}

interface CertificateConfig {
  templateUrl: string;
  templateUrl2?: string;
  fields: FieldType[];
  canvasWidth: number;
  canvasHeight: number;
  placeholders?: PlaceholderConfig[];
}

// =================================
// IMAGE COMPONENT
// =================================

function URLImage({ src }: { src: string }) {
  const [image] = useImage(src, "anonymous");
  return image ? <KonvaImageComponent image={image} width={1000} height={700} /> : null;
}

// =================================
// MAIN COMPONENT
// =================================

export function useCertificateGenerator() {
  const { alert } = useAlert();

  const generateTeacherPDF = async (
    teacher: any,
    training: any,
    config: CertificateConfig,
    certNumber?: string,
  ) => {
    try {
      const pdfDoc = await PDFDocument.create();
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

      const replacePlaceholders = (text: string) => {
        let result = text;
        const placeholders = config.placeholders || [
          { label: "Nama Lengkap", placeholder: "[nama]", dbField: "nama" },
          { label: "NIP", placeholder: "[nip]", dbField: "nip" },
          {
            label: "Satuan Kerja",
            placeholder: "[sekolah]",
            dbField: "sekolah",
          },
          {
            label: "Judul Pelatihan",
            placeholder: "[title]",
            dbField: "title",
          },
          {
            label: "Nomor Sertifikat",
            placeholder: "[certificate_number]",
            dbField: "certificate_number",
          },
          {
            label: "Tgl Pelaksanaan",
            placeholder: "[date_start]",
            dbField: "date_start",
          },
        ];

        placeholders.forEach((p) => {
          const regex = new RegExp(
            p.placeholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
            "g",
          );

          if (p.dbField === "certificate_number") {
            result = result.replace(regex, certNumber || "-");
          } else if (p.dbField === "date_start") {
            const val = training.date_start
              ? new Date(training.date_start).toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta", 
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : "-";
            result = result.replace(regex, val);
          } else {
            // Check teacher first then training
            const val = teacher[p.dbField] || training[p.dbField] || "-";
            result = result.replace(regex, val.toString());
          }
        });
        return result;
      };

      // Helper to embed image safely and with compression (target size 200-300 KB)
      const embedImage = async (url: string) => {
        try {
          const jpegDataUrl = await new Promise<string>((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
              const canvas = document.createElement("canvas");
              
              const maxWidth = 1400;
              let width = img.width;
              let height = img.height;
              if (width > maxWidth) {
                const ratio = maxWidth / width;
                width = maxWidth;
                height = img.height * ratio;
              }
              
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext("2d");
              if (!ctx) return reject("Canvas context error");
              
              // Draw white background in case source image has transparency
              ctx.fillStyle = "#FFFFFF";
              ctx.fillRect(0, 0, width, height);
              ctx.drawImage(img, 0, 0, width, height);
              
              // Compress to JPEG with 0.70 quality
              resolve(canvas.toDataURL("image/jpeg", 0.70));
            };
            img.onerror = () => reject("Image load error");
            img.src = url;
          });
          
          const res = await fetch(jpegDataUrl);
          const buffer = await res.arrayBuffer();
          return await pdfDoc.embedJpg(buffer);
        } catch (err) {
          console.error("Embed error, attempting fallback:", err);
          try {
            const res = await fetch(url);
            const contentType = res.headers.get("content-type");
            const buffer = await res.arrayBuffer();
            const isPng = contentType?.includes("png") || url.toLowerCase().includes(".png") || url.startsWith("data:image/png");
            if (isPng) {
              return await pdfDoc.embedPng(buffer);
            }
            return await pdfDoc.embedJpg(buffer);
          } catch (fallbackErr) {
            console.error("Fallback embed error:", fallbackErr);
            return null;
          }
        }
      };

      // --- PAGE 1 ---
      const page1 = pdfDoc.addPage([
        config.canvasWidth || 1000,
        config.canvasHeight || 700,
      ]);
      if (config.templateUrl) {
        const image = await embedImage(config.templateUrl);
        if (image) {
          page1.drawImage(image, {
            x: 0,
            y: 0,
            width: config.canvasWidth || 1000,
            height: config.canvasHeight || 700,
          });
        }
      }

      config.fields
        .filter((f) => (f.page || 1) === 1)
        .forEach((field) => {
          const hex = field.color || "#000000";
          const r = parseInt(hex.slice(1, 3), 16) / 255;
          const g = parseInt(hex.slice(3, 5), 16) / 255;
          const b = parseInt(hex.slice(5, 7), 16) / 255;

          const fontToUse =
            field.fontWeight === "bold" ? fontBold : fontRegular;
          const textToDraw = replacePlaceholders(field.text);
          const textWidth = fontToUse.widthOfTextAtSize(
            textToDraw,
            field.fontSize,
          );

          let finalX = field.x;
          if (field.align === "center") {
            finalX = field.x - textWidth / 2;
          } else if (field.align === "right") {
            finalX = field.x - textWidth;
          }

          page1.drawText(textToDraw, {
            x: finalX,
            y: (config.canvasHeight || 700) - field.y - field.fontSize * 0.8,
            size: field.fontSize,
            font: fontToUse,
            color: rgb(r, g, b),
          });
        });

      // --- PAGE 2 ---
      const page2 = pdfDoc.addPage([
        config.canvasWidth || 1000,
        config.canvasHeight || 700,
      ]);
      if (config.templateUrl2) {
        const image = await embedImage(config.templateUrl2);
        if (image) {
          page2.drawImage(image, {
            x: 0,
            y: 0,
            width: config.canvasWidth || 1000,
            height: config.canvasHeight || 700,
          });
        }
      }

      config.fields
        .filter((f) => f.page === 2)
        .forEach((field) => {
          const hex = field.color || "#000000";
          const r = parseInt(hex.slice(1, 3), 16) / 255;
          const g = parseInt(hex.slice(3, 5), 16) / 255;
          const b = parseInt(hex.slice(5, 7), 16) / 255;

          const fontToUse =
            field.fontWeight === "bold" ? fontBold : fontRegular;
          const textToDraw = replacePlaceholders(field.text);
          const textWidth = fontToUse.widthOfTextAtSize(
            textToDraw,
            field.fontSize,
          );

          let finalX = field.x;
          if (field.align === "center") {
            finalX = field.x - textWidth / 2;
          } else if (field.align === "right") {
            finalX = field.x - textWidth;
          }

          page2.drawText(textToDraw, {
            x: finalX,
            y: (config.canvasHeight || 700) - field.y - field.fontSize * 0.8,
            size: field.fontSize,
            font: fontToUse,
            color: rgb(r, g, b),
          });
        });

      const pdfBytes = await pdfDoc.save();
      const namaLengkap =
        teacher.nama || teacher.full_name || teacher.name || "Peserta";
      
      const getExecutionYear = () => {
        if (training.date_start) {
          const d = new Date(training.date_start);
          if (!isNaN(d.getTime())) return d.getFullYear().toString();
        }
        if (training.date) {
          const match = training.date.match(/\b(20\d{2})\b/);
          if (match) return match[1];
        }
        return new Date().getFullYear().toString();
      };

      const executionYear = getExecutionYear();
      const fileName = `${namaLengkap}_${training.title || "Kegiatan"}_${executionYear}.pdf`;

      saveAs(
        new Blob([pdfBytes], { type: "application/pdf" }),
        fileName,
      );
    } catch (err: any) {
      alert("Gagal generate sertifikat: " + err.message, "Error", "error");
    }
  };

  return { generateTeacherPDF };
}

function DraggableField({
  field,
  updateField,
}: {
  key?: string | number;
  field: FieldType;
  updateField: (id: string, updates: Partial<FieldType>) => void;
}) {
  const textRef = useRef<any>(null);

  useEffect(() => {
    if (textRef.current) {
      if (field.align === "center") {
        textRef.current.offsetX(textRef.current.width() / 2);
      } else if (field.align === "right") {
        textRef.current.offsetX(textRef.current.width());
      } else {
        textRef.current.offsetX(0);
      }
    }
  }, [field.text, field.fontSize, field.fontWeight, field.align]);

  return (
    <TextComponent
      ref={textRef}
      text={field.text}
      x={field.x}
      y={field.y}
      fontSize={field.fontSize}
      fontStyle={field.fontWeight === "bold" ? "bold" : "normal"}
      fontFamily="Helvetica"
      draggable
      fill={field.color}
      onDragMove={(e) => {
        const node = e.target;
        updateField(field.id, { x: node.x(), y: node.y() });
      }}
      onDragStart={() => {
        document.body.style.cursor = "grabbing";
      }}
      onDragEnd={(e) => {
        const node = e.target;
        updateField(field.id, { x: node.x(), y: node.y() });
        document.body.style.cursor = "grab";
      }}
      onMouseEnter={(e) => {
        const container = e.target.getStage()?.container();
        if (container) container.style.cursor = "grab";
      }}
      onMouseLeave={(e) => {
        const container = e.target.getStage()?.container();
        if (container) container.style.cursor = "default";
      }}
    />
  );
}

export default function AdminCertificateEditor({ trainingId }: { trainingId?: string }) {
  const { alert } = useAlert();
  const stageRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activePage, setActivePage] = useState<number>(1);
  const [isCustomConfig, setIsCustomConfig] = useState(false);

  // TEMPLATE IMAGES
  const [templateUrl, setTemplateUrl] = useState("");
  const [templateUrl2, setTemplateUrl2] = useState("");

  // CANVAS SIZE (Landscape A4ish aspect)
  const CANVAS_WIDTH = 1000;
  const CANVAS_HEIGHT = 700;

  // FIELDS
  const [fields, setFields] = useState<FieldType[]>([
    {
      id: "nama",
      field_name: "Nama Peserta",
      text: "[nama]",
      x: 500,
      y: 350,
      fontSize: 40,
      fontWeight: "bold",
      color: "#000000",
      page: 1,
    },
  ]);

  const [availablePlaceholders, setAvailablePlaceholders] = useState<
    PlaceholderConfig[]
  >([
    { label: "Nama Lengkap", placeholder: "[nama]", dbField: "nama" },
    { label: "NIP", placeholder: "[nip]", dbField: "nip" },
    { label: "Pangkat/Gol", placeholder: "[pangkat]", dbField: "pangkat" },
    { label: "Satuan Kerja", placeholder: "[sekolah]", dbField: "sekolah" },
    { label: "Jabatan", placeholder: "[jabatan]", dbField: "jabatan" },
    {
      label: "Status Pegawai",
      placeholder: "[kepegawaian]",
      dbField: "kepegawaian",
    },
    { label: "Judul Pelatihan", placeholder: "[title]", dbField: "title" },
    {
      label: "Tgl Pelaksanaan",
      placeholder: "[date_start]",
      dbField: "date_start",
    },
    {
      label: "Nomor Sertifikat",
      placeholder: "[certificate_number]",
      dbField: "certificate_number",
    },
  ]);
  const [showAddPlaceholder, setShowAddPlaceholder] = useState(false);
  const [newPH, setNewPH] = useState({
    label: "",
    placeholder: "",
    dbField: "",
  });
  const [downloadEnabled, setDownloadEnabled] = useState<boolean>(true);

  // =================================
  // LOAD CONFIG FROM DB
  // =================================

  useEffect(() => {
    loadConfig();
  }, [trainingId]);

  async function loadConfig() {
    if (!supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("content")
        .eq("id", 1)
        .maybeSingle();

      if (error) throw error;

      // Access per-training config if trainingId is provided, else use global/default
      const allConfigs = data?.content?.certificate_configs || {};
      const hasCustom = trainingId ? !!allConfigs[trainingId] : false;
      setIsCustomConfig(hasCustom);

      let config = trainingId ? allConfigs[trainingId] : null;

      // Fallback 1: load default key from certificate_configs
      if (!config) {
        config = allConfigs["default"];
      }

      // Fallback 2: load legacy certificate_config key
      if (!config) {
        config = data?.content?.certificate_config as CertificateConfig;
      }

      if (config) {
        if (config.templateUrl) setTemplateUrl(config.templateUrl);
        if (config.templateUrl2) setTemplateUrl2(config.templateUrl2);
        if (config.fields)
          setFields(config.fields.map((f) => ({ ...f, page: f.page || 1 })));
        if (config.placeholders) setAvailablePlaceholders(config.placeholders);
        setDownloadEnabled(config.downloadEnabled !== false);
      } else {
        // Reset to default
        setTemplateUrl("");
        setTemplateUrl2("");
        setDownloadEnabled(true);
        setFields([
          {
            id: "nama",
            field_name: "Nama Peserta",
            text: "[nama]",
            x: 500,
            y: 350,
            fontSize: 40,
            fontWeight: "bold",
            color: "#000000",
            page: 1,
            align: "center",
          },
        ]);
        setAvailablePlaceholders([
          { label: "Nama Lengkap", placeholder: "[nama]", dbField: "nama" },
          { label: "NIP", placeholder: "[nip]", dbField: "nip" },
          { label: "Pangkat/Gol", placeholder: "[pangkat]", dbField: "pangkat" },
          { label: "Satuan Kerja", placeholder: "[sekolah]", dbField: "sekolah" },
          { label: "Jabatan", placeholder: "[jabatan]", dbField: "jabatan" },
          {
            label: "Status Pegawai",
            placeholder: "[kepegawaian]",
            dbField: "kepegawaian",
          },
          { label: "Judul Pelatihan", placeholder: "[title]", dbField: "title" },
          {
            label: "Tgl Pelaksanaan",
            placeholder: "[date_start]",
            dbField: "date_start",
          },
          {
            label: "Nomor Sertifikat",
            placeholder: "[certificate_number]",
            dbField: "certificate_number",
          },
        ]);
      }
    } catch (err) {
      console.error("Error loading certificate config:", err);
    } finally {
      setLoading(false);
    }
  }

  // =================================
  // UPDATE FIELD
  // =================================

  function updateField(id: string, updates: Partial<FieldType>) {
    setFields((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    );
  }

  // =================================
  // SAVE TO DB
  // =================================

  async function saveConfig() {
    if (!supabase) {
      alert(
        "Supabase tidak terhubung. Tidak dapat menyimpan.",
        "Error",
        "error",
      );
      return;
    }
    setSaving(true);
    try {
      // Get current content first or default to empty object
      const { data: current } = await supabase
        .from("site_settings")
        .select("content")
        .eq("id", 1)
        .maybeSingle();

      const activeKey = trainingId || "default";
      const configPayload = {
        templateUrl,
        templateUrl2,
        fields,
        availablePlaceholders,
        canvasWidth: CANVAS_WIDTH,
        canvasHeight: CANVAS_HEIGHT,
        downloadEnabled: downloadEnabled,
      };

      const newContent = {
        ...(current?.content || {}),
        certificate_configs: {
          ...(current?.content?.certificate_configs || {}),
          [activeKey]: configPayload,
        },
      };

      if (!trainingId || trainingId === "default") {
        newContent.certificate_config = configPayload;
      }

      const { error } = await supabase.from("site_settings").upsert({
        id: 1,
        content: newContent,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      // Auto generate certificates for participants who have 'attended' this activity
      try {
        await ensureCertificatesExist();
      } catch (err) {
        console.error("Auto generate certificates on template save failed:", err);
      }

      if (trainingId) {
        setIsCustomConfig(true);
      }

      await alert(
        "Konfigurasi sertifikat berhasil disimpan",
        "Sukses",
        "success",
      );
    } catch (err: any) {
      console.error(err);
      alert(err.message, "Gagal menyimpan", "error");
    } finally {
      setSaving(false);
    }
  }

  // =================================
  // GENERATE PREVIEW PDF
  // =================================

  async function generatePDF() {
    try {
      const pdfDoc = await PDFDocument.create();
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

      // Helper to embed image safely and with compression (target size 200-300 KB)
      const embedImage = async (url: string) => {
        try {
          const jpegDataUrl = await new Promise<string>((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
              const canvas = document.createElement("canvas");
              
              const maxWidth = 1400;
              let width = img.width;
              let height = img.height;
              if (width > maxWidth) {
                const ratio = maxWidth / width;
                width = maxWidth;
                height = img.height * ratio;
              }
              
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext("2d");
              if (!ctx) return reject("Canvas context error");
              
              // Draw white background in case source image has transparency
              ctx.fillStyle = "#FFFFFF";
              ctx.fillRect(0, 0, width, height);
              ctx.drawImage(img, 0, 0, width, height);
              
              // Compress to JPEG with 0.70 quality
              resolve(canvas.toDataURL("image/jpeg", 0.70));
            };
            img.onerror = () => reject("Image load error");
            img.src = url;
          });
          
          const res = await fetch(jpegDataUrl);
          const buffer = await res.arrayBuffer();
          return await pdfDoc.embedJpg(buffer);
        } catch (err) {
          console.error("Embed error, attempting fallback:", err);
          try {
            const res = await fetch(url);
            const contentType = res.headers.get("content-type");
            const buffer = await res.arrayBuffer();
            const isPng = contentType?.includes("png") || url.toLowerCase().includes(".png") || url.startsWith("data:image/png");
            if (isPng) {
              return await pdfDoc.embedPng(buffer);
            }
            return await pdfDoc.embedJpg(buffer);
          } catch (fallbackErr) {
            console.error("Fallback embed error:", fallbackErr);
            return null;
          }
        }
      };

      // --- PAGE 1 ---
      const page1 = pdfDoc.addPage([CANVAS_WIDTH, CANVAS_HEIGHT]);
      if (templateUrl) {
        const image = await embedImage(templateUrl);
        if (image) {
          page1.drawImage(image, {
            x: 0,
            y: 0,
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
          });
        } else {
          alert("Gagal memuat background halaman 1. Pastikan file valid.");
        }
      }

      fields
        .filter((f) => (f.page || 1) === 1)
        .forEach((field) => {
          const hex = field.color || "#000000";
          const r = parseInt(hex.slice(1, 3), 16) / 255;
          const g = parseInt(hex.slice(3, 5), 16) / 255;
          const b = parseInt(hex.slice(5, 7), 16) / 255;

          const fontToUse =
            field.fontWeight === "bold" ? fontBold : fontRegular;
          const textToDraw = field.text;
          const textWidth = fontToUse.widthOfTextAtSize(
            textToDraw,
            field.fontSize,
          );

          let finalX = field.x;
          if (field.align === "center") {
            finalX = field.x - textWidth / 2;
          } else if (field.align === "right") {
            finalX = field.x - textWidth;
          }

          page1.drawText(textToDraw, {
            x: finalX,
            y: CANVAS_HEIGHT - field.y - field.fontSize * 0.8,
            size: field.fontSize,
            font: fontToUse,
            color: rgb(r, g, b),
          });
        });

      // --- PAGE 2 ---
      const page2 = pdfDoc.addPage([CANVAS_WIDTH, CANVAS_HEIGHT]);
      if (templateUrl2) {
        const image = await embedImage(templateUrl2);
        if (image) {
          page2.drawImage(image, {
            x: 0,
            y: 0,
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
          });
        } else {
          alert("Gagal memuat background halaman 2. Pastikan file valid.");
        }
      }

      fields
        .filter((f) => f.page === 2)
        .forEach((field) => {
          const hex = field.color || "#000000";
          const r = parseInt(hex.slice(1, 3), 16) / 255;
          const g = parseInt(hex.slice(3, 5), 16) / 255;
          const b = parseInt(hex.slice(5, 7), 16) / 255;

          const fontToUse =
            field.fontWeight === "bold" ? fontBold : fontRegular;
          const textToDraw = field.text;
          const textWidth = fontToUse.widthOfTextAtSize(
            textToDraw,
            field.fontSize,
          );

          let finalX = field.x;
          if (field.align === "center") {
            finalX = field.x - textWidth / 2;
          } else if (field.align === "right") {
            finalX = field.x - textWidth;
          }

          page2.drawText(textToDraw, {
            x: finalX,
            y: CANVAS_HEIGHT - field.y - field.fontSize * 0.8,
            size: field.fontSize,
            font: fontToUse,
            color: rgb(r, g, b),
          });
        });

      const pdfBytes = await pdfDoc.save();
      saveAs(
        new Blob([pdfBytes], { type: "application/pdf" }),
        "preview-sertifikat.pdf",
      );
    } catch (err: any) {
      alert("Gagal generate PDF: " + err.message, "Error", "error");
    }
  }

  const addField = () => {
    const id = "field_" + Date.now();
    setFields([
      ...fields,
      {
        id,
        field_name: "Field Baru",
        text: "[Isi Field]",
        x: CANVAS_WIDTH / 2,
        y: CANVAS_HEIGHT / 2,
        fontSize: 20,
        fontWeight: "normal",
        color: "#000000",
        page: activePage,
        align: "center",
      },
    ]);
  };

  const removeField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-10 h-10 text-main-blue animate-spin" />
          <p className="text-gray-500 font-bold">Memuat Editor Sertifikat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Editor Section - Sticky on desktop to stay visible during scroll */}
      <div className="flex-1 space-y-6 lg:sticky lg:top-8 self-start z-10 bg-gray-50/50 pb-4">
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-main-blue/10 rounded-2xl flex items-center justify-center text-main-blue">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-heading">
                Desain Template Sertifikat
              </h2>
              <p className="text-xs text-gray-500">
                Atur tata letak teks pada sertifikat pelatihan.
              </p>
              {trainingId && (
                <div className="mt-1.5 flex items-center">
                  {isCustomConfig ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Desain Khas Kegiatan
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-500 border border-amber-200" title="Lakukan modifikasi lalu klik Simpan Layout untuk menyimpan desain unik untuk kegiatan ini">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                      Menggunakan Desain Default
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={saveConfig}
              disabled={saving}
              className="flex-1 sm:flex-none px-6 py-2.5 bg-main-blue text-white rounded-xl font-bold text-sm shadow-lg shadow-main-blue/20 flex items-center justify-center gap-2 hover:scale-[1.02] transition-all"
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? "Menyimpan..." : "Simpan Layout"}
            </button>
            <button
              onClick={generatePDF}
              className="flex-1 sm:flex-none px-6 py-2.5 bg-leaf-green text-white rounded-xl font-bold text-sm shadow-lg shadow-leaf-green/20 flex items-center justify-center gap-2 hover:scale-[1.02] transition-all"
            >
              <Download className="w-4 h-4" />
              Preview PDF
            </button>
          </div>
        </div>

        {/* Page Switcher */}
        <div className="flex bg-white p-2 rounded-2xl border border-gray-100 shadow-sm self-start">
          <button
            onClick={() => setActivePage(1)}
            className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${activePage === 1 ? "bg-main-blue text-white shadow-lg shadow-main-blue/20" : "text-gray-500 hover:bg-gray-50"}`}
          >
            Halaman 1 (Depan)
          </button>
          <button
            onClick={() => setActivePage(2)}
            className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${activePage === 2 ? "bg-main-blue text-white shadow-lg shadow-main-blue/20" : "text-gray-500 hover:bg-gray-50"}`}
          >
            Halaman 2 (Belakang)
          </button>
        </div>

        {/* Canvas Area */}
        <div className="bg-gray-100 p-4 rounded-[2rem] flex flex-col items-center justify-center border-2 border-dashed border-gray-200 min-h-[500px]">
          <div className="w-full flex items-center justify-between mb-4 px-4">
            <div className="flex items-center gap-2 text-main-blue">
              <Move className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">
                Editor Visual
              </span>
            </div>
            <p className="text-[10px] text-gray-500 italic">
              * Klik & Geser teks untuk mengatur posisi secara presisi.
            </p>
          </div>

          <div
            className="bg-white shadow-2xl relative overflow-auto max-w-full modern-scrollbar"
            style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
          >
            <StageComponent width={CANVAS_WIDTH} height={CANVAS_HEIGHT} ref={stageRef}>
              <LayerComponent listening={true}>
                {/* TEMPLATE */}
                {activePage === 1 ? (
                  templateUrl ? (
                    <URLImage src={templateUrl} />
                  ) : (
                    <KonvaImageComponent
                      image={undefined as any}
                      width={CANVAS_WIDTH}
                      height={CANVAS_HEIGHT}
                      fill="#f3f4f6"
                    />
                  )
                ) : templateUrl2 ? (
                  <URLImage src={templateUrl2} />
                ) : (
                  <KonvaImageComponent
                    image={undefined as any}
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    fill="#f3f4f6"
                  />
                )}

                {/* DRAG TEXT */}
                {fields
                  .filter((f) => (f.page || 1) === activePage)
                  .map((field) => (
                    <DraggableField
                      key={field.id}
                      field={field}
                      updateField={updateField}
                    />
                  ))}
              </LayerComponent>
            </StageComponent>
            {((activePage === 1 && !templateUrl) ||
              (activePage === 2 && !templateUrl2)) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center">
                <Settings className="w-16 h-16 text-gray-200 mb-4" />
                <p className="text-gray-400 font-medium">
                  Harap upload atau pilih file background sertifikat untuk
                  Halaman {activePage} melalui panel kontrol di samping.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Control Sidebar */}
      <div className="w-full lg:w-[400px] space-y-6">
        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-lg space-y-8 h-full">
          {/* Status Unduh Sertifikat Khas Kegiatan */}
          <div className="bg-amber-50/50 p-6 rounded-2xl border border-amber-100 space-y-4">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-600" />
              <div>
                <h3 className="font-bold text-gray-700 text-xs">Status Tombol Unduh</h3>
                <p className="text-[10px] text-gray-400">Atur akses tombol download sertifikat untuk kegiatan ini</p>
              </div>
            </div>
            
            <label className="flex items-center gap-3 cursor-pointer bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
              <input
                type="checkbox"
                className="w-4 h-4 accent-amber-500 rounded"
                checked={downloadEnabled}
                onChange={(e) => setDownloadEnabled(e.target.checked)}
              />
              <span className="text-xs font-bold text-gray-700">Aktifkan Sertifikat</span>
            </label>
          </div>

          {/* Template Selection */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-main-blue" />
              <h3 className="font-bold text-gray-700">Template Background</h3>
            </div>

            <div className="space-y-4">
              <ImageUpload
                label="Halaman Depan (PNG/JPG)"
                value={templateUrl}
                onChange={(val) => setTemplateUrl(val)}
                maxWidth={2000}
                maxHeight={2000}
              />

              <ImageUpload
                label="Halaman Belakang (PNG/JPG)"
                value={templateUrl2}
                onChange={(val) => setTemplateUrl2(val)}
                maxWidth={2000}
                maxHeight={2000}
              />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Type className="w-5 h-5 text-main-blue" />
                <h3 className="font-bold text-gray-700">Elemen Teks</h3>
              </div>
              <button
                onClick={addField}
                className="p-2 bg-main-blue/10 text-main-blue rounded-xl hover:bg-main-blue hover:text-white transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto modern-scrollbar pr-2">
              {fields
                .filter((f) => (f.page || 1) === activePage)
                .map((field) => (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={field.id}
                    className="p-5 bg-gray-50 rounded-2xl border border-gray-200 relative group"
                  >
                    <button
                      onClick={() => removeField(field.id)}
                      className="absolute -top-2 -right-2 p-1.5 bg-red-100 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white shadow-sm"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>

                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">
                          Nama Field / Label
                        </label>
                        <input
                          type="text"
                          value={field.field_name}
                          onChange={(e) =>
                            updateField(field.id, {
                              field_name: e.target.value,
                            })
                          }
                          className="w-full bg-white border border-gray-200 px-3 py-2 rounded-xl text-sm focus:border-main-blue outline-none"
                          placeholder="Contoh: Nama Guru"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">
                          Teks Preview
                        </label>
                        <textarea
                          value={field.text}
                          onChange={(e) =>
                            updateField(field.id, { text: e.target.value })
                          }
                          className="w-full bg-white border border-gray-200 px-3 py-2 rounded-xl text-sm focus:border-main-blue outline-none"
                          rows={2}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">
                            Ukuran Font
                          </label>
                          <input
                            type="number"
                            value={field.fontSize}
                            onChange={(e) =>
                              updateField(field.id, {
                                fontSize: Number(e.target.value),
                              })
                            }
                            className="w-full bg-white border border-gray-200 px-3 py-2 rounded-xl text-sm focus:border-main-blue outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">
                            Halaman
                          </label>
                          <select
                            value={field.page || 1}
                            onChange={(e) =>
                              updateField(field.id, {
                                page: Number(e.target.value),
                              })
                            }
                            className="w-full bg-white border border-gray-200 px-3 py-2 rounded-xl text-sm focus:border-main-blue outline-none"
                          >
                            <option value={1}>Halaman 1</option>
                            <option value={2}>Halaman 2</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">
                            Warna Teks
                          </label>
                          <input
                            type="color"
                            value={field.color}
                            onChange={(e) =>
                              updateField(field.id, { color: e.target.value })
                            }
                            className="w-full h-9 bg-white border border-gray-200 px-1 py-1 rounded-xl cursor-pointer"
                          />
                        </div>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">
                              Gaya
                            </label>
                            <button
                              onClick={() =>
                                updateField(field.id, {
                                  fontWeight:
                                    field.fontWeight === "bold"
                                      ? "normal"
                                      : "bold",
                                })
                              }
                              className={`w-full py-2 px-3 rounded-xl text-xs font-bold border transition-all ${field.fontWeight === "bold" ? "bg-main-blue text-white border-main-blue" : "bg-white text-gray-500 border-gray-200"}`}
                            >
                              Bold
                            </button>
                          </div>
                          <div className="flex-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">
                              Align
                            </label>
                            <select
                              value={field.align || "left"}
                              onChange={(e) =>
                                updateField(field.id, {
                                  align: e.target.value as
                                    | "left"
                                    | "center"
                                    | "right",
                                })
                              }
                              className="w-full py-2 px-3 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:border-main-blue outline-none"
                            >
                              <option value="left">Kiri</option>
                              <option value="center">Tengah</option>
                              <option value="right">Kanan</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">
                            Posisi X
                          </label>
                          <input
                            type="number"
                            value={Math.round(field.x)}
                            onChange={(e) =>
                              updateField(field.id, {
                                x: Number(e.target.value),
                              })
                            }
                            className="w-full bg-white border border-gray-200 px-3 py-2 rounded-xl text-sm focus:border-main-blue outline-none font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">
                            Posisi Y
                          </label>
                          <input
                            type="number"
                            value={Math.round(field.y)}
                            onChange={(e) =>
                              updateField(field.id, {
                                y: Number(e.target.value),
                              })
                            }
                            className="w-full bg-white border border-gray-200 px-3 py-2 rounded-xl text-sm focus:border-main-blue outline-none font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
            </div>
          </div>

          <div className="bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100 mt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-main-blue/10 rounded-xl flex items-center justify-center text-main-blue">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-main-blue uppercase tracking-widest">
                    Sinkronisasi Database
                  </p>
                  <p className="text-[10px] text-gray-500">
                    Klik untuk menambah element teks otomatis.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddPlaceholder(!showAddPlaceholder)}
                className="p-1.5 bg-main-blue/10 text-main-blue rounded-lg hover:bg-main-blue hover:text-white transition-all shadow-sm"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            {showAddPlaceholder && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-4 bg-white rounded-2xl border border-main-blue/20 shadow-sm space-y-3"
              >
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[8px] font-bold text-gray-400 uppercase mb-1 block">
                      Label
                    </label>
                    <input
                      placeholder="Nama Lengkap"
                      className="w-full border border-gray-100 p-2 rounded-lg text-[10px] outline-none focus:border-main-blue"
                      value={newPH.label}
                      onChange={(e) =>
                        setNewPH({ ...newPH, label: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-[8px] font-bold text-gray-400 uppercase mb-1 block">
                      Placeholder
                    </label>
                    <input
                      placeholder="[nama]"
                      className="w-full border border-gray-100 p-2 rounded-lg text-[10px] outline-none focus:border-main-blue"
                      value={newPH.placeholder}
                      onChange={(e) =>
                        setNewPH({ ...newPH, placeholder: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[8px] font-bold text-gray-400 uppercase mb-1 block">
                    Field DB (Key)
                  </label>
                  <input
                    placeholder="full_name"
                    className="w-full border border-gray-100 p-2 rounded-lg text-[10px] outline-none focus:border-main-blue"
                    value={newPH.dbField}
                    onChange={(e) =>
                      setNewPH({ ...newPH, dbField: e.target.value })
                    }
                  />
                </div>
                <button
                  onClick={() => {
                    if (!newPH.label || !newPH.placeholder || !newPH.dbField)
                      return;
                    setAvailablePlaceholders([...availablePlaceholders, newPH]);
                    setNewPH({ label: "", placeholder: "", dbField: "" });
                    setShowAddPlaceholder(false);
                  }}
                  className="w-full py-2 bg-main-blue text-white rounded-xl text-[10px] font-bold"
                >
                  Tambah Placeholder
                </button>
              </motion.div>
            )}

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {availablePlaceholders.map((p, idx) => (
                <div key={idx} className="relative group">
                  <button
                    type="button"
                    onClick={() => {
                      const newField: FieldType = {
                        id: Math.random().toString(36).substr(2, 9),
                        field_name: p.label,
                        text: p.placeholder,
                        x: CANVAS_WIDTH / 2,
                        y: CANVAS_HEIGHT / 2,
                        fontSize: 20,
                        fontWeight: "normal",
                        color: "#000000",
                        page: activePage,
                        align: "center",
                      };
                      setFields([...fields, newField]);
                    }}
                    className="w-full h-full flex flex-col bg-white p-3 rounded-2xl border border-blue-100 hover:border-main-blue hover:shadow-md transition-all text-left"
                  >
                    <span className="text-[9px] text-gray-400 font-bold uppercase mb-1">
                      {p.label}
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-main-blue font-bold">
                        {p.placeholder}
                      </span>
                      <Plus className="w-3 h-3 text-main-blue opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setAvailablePlaceholders(
                        availablePlaceholders.filter((_, i) => i !== idx),
                      );
                    }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-50 text-red-500 border border-red-100 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all shadow-sm z-10"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-white/50 rounded-xl border border-blue-50">
              <p className="text-[9px] text-gray-500 italic flex items-center gap-2">
                <span className="w-1 h-1 bg-main-blue rounded-full"></span>
                Klik pada kotak di atas untuk langsung menambahkan element teks
                ke sertifikat.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export async function ensureCertificatesExist(userId?: string) {
  if (!supabase) return;
  try {
    // 1. Fetch certificate configurations
    const { data: sData } = await supabase
      .from("site_settings")
      .select("content")
      .eq("id", 1)
      .single();

    const configs = sData?.content?.certificate_configs || {};
    const actIds = Object.keys(configs); // These are the IDs of trainings/events with templates

    if (actIds.length === 0) return;

    // 2. Fetch attended participants
    let partQuery = supabase
      .from("training_participants")
      .select("*")
      .eq("status", "attended");

    if (userId) {
      partQuery = partQuery.or(`user_id.eq.${userId},guest_account_id.eq.${userId}`);
    }

    const { data: participants } = await partQuery;
    if (!participants || participants.length === 0) return;

    // 3. Fetch existing certificate records to prevent duplicate generation
    let certQuery = supabase
      .from("training_certificates")
      .select("*");

    if (userId) {
      certQuery = certQuery.or(`user_id.eq.${userId},guest_account_id.eq.${userId}`);
    }

    const { data: existingCerts } = await certQuery;
    const existingSet = new Set<string>();
    existingCerts?.forEach((c: any) => {
      const uId = c.user_id || c.guest_account_id;
      if (uId) {
        existingSet.add(`${uId}_${c.training_id}`);
      }
    });

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const romanMonths = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

    // 4. Generate missing certificates
    for (const p of participants) {
      const actId = p.training_id || p.event_id;
      if (!actId) continue;

      // Check if there is a config for this activity, or fallback to default
      const hasConfig = !!configs[actId] || !!configs["default"];
      if (!hasConfig) continue;

      const pId = p.user_id || p.guest_account_id;
      if (pId) {
        const key = `${pId}_${actId}`;
        if (!existingSet.has(key)) {
          existingSet.add(key);

          // Unique combo user_activity is missing, let's create a certificate
          const randomPart = Math.floor(1000 + Math.random() * 9000);
          const certNumber = `${randomPart}/CERT-KKG/${romanMonths[month - 1]}/${year}`;

          const certPayload: any = {
            training_id: actId,
            certificate_number: certNumber,
            certificate_url: "Generated Individually",
            created_at: new Date().toISOString()
          };

          if (p.is_guest) {
            certPayload.guest_account_id = p.guest_account_id;
          } else {
            certPayload.user_id = p.user_id;
          }

          await supabase.from("training_certificates").insert(certPayload);
        }
      }
    }
  } catch (err) {
    console.error("Error auto-generating certificates:", err);
  }
}

