import React, { useState, useEffect } from 'react';
import { Attachment, LearningPlan } from '../types';
import { Save, Trash2, Plus, FileText, LayoutTemplate, FileCheck, BrainCircuit, Edit2, X, Image, Bold, Italic, Underline, Heading1, Heading2, Heading3, List, ListOrdered, Table, Link2, Eye, EyeOff, PenTool, AlignLeft, AlignCenter, AlignRight, AlignJustify, Sparkles, Loader2, CheckCircle2, AlertCircle, ExternalLink, KeyRound, Check, Clock, RotateCcw } from 'lucide-react';
import { parseRichText, markdownToHtml, htmlToMarkdown, cleanAiText, cleanAiAttachmentText } from '../utils/textParser';
import { ContentModal } from './ContentModal';
import CustomModal from './CustomModal';


interface AttachmentEditorProps {
  attachments: Attachment[];
  onChange: (attachments: Attachment[]) => void;
  planData?: Pick<LearningPlan, 'topic' | 'subject' | 'classSemester' | 'timeAllocation' | 'profileDimensions'>;
  geminiApiKey?: string;
}

const getTypeBadgeStyle = (type: Attachment['type']) => {
  switch (type) {
    case 'Ringkasan Materi': return 'bg-blue-50 text-blue-700 border-blue-100';
    case 'LKM': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    case 'Rubrik Penilaian': return 'bg-amber-50 text-amber-700 border-amber-100';
    case 'Soal Sumatif': return 'bg-purple-50 text-purple-700 border-purple-100';
    case 'Asesmen Awal': return 'bg-orange-50 text-orange-700 border-orange-100';
    case 'Proses': return 'bg-teal-50 text-teal-700 border-teal-100';
    case 'Akhir': return 'bg-rose-50 text-rose-700 border-rose-100';
    case 'Media': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
    default: return 'bg-slate-50 text-slate-700 border-slate-100';
  }
};

const ALL_ATTACHMENT_TYPES: Attachment['type'][] = [
  'Ringkasan Materi',
  'Media',
  'LKM',
  'Rubrik Penilaian',
  'Soal Sumatif',
  'Asesmen Awal',
  'Proses',
  'Akhir'
];

export const DPL_OPTIONS: string[] = [
  'Keimanan dan Ketakwaan terhadap Tuhan YME',
  'Kewargaan',
  'Penalaran Kritis',
  'Kreativitas',
  'Kolaborasi',
  'Kemandirian',
  'Kesehatan',
  'Komunikasi'
];

const SIKAP_KEY_TO_DPL: Record<string, string> = {
  keimanan: 'Keimanan dan Ketakwaan terhadap Tuhan YME',
  kewargaan: 'Kewargaan',
  penalaranKritis: 'Penalaran Kritis',
  kreativitas: 'Kreativitas',
  kolaborasi: 'Kolaborasi',
  kemandirian: 'Kemandirian',
  kesehatan: 'Kesehatan',
  komunikasi: 'Komunikasi',
};

export const AttachmentEditor: React.FC<AttachmentEditorProps> = ({ attachments = [], onChange, planData, geminiApiKey }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<Attachment['type']>('Ringkasan Materi');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    type: 'alert' | 'confirm' | 'success' | 'error';
    title?: string;
    message: string;
  }>({
    isOpen: false,
    type: 'alert',
    title: '',
    message: ''
  });

  // Rich text editor states
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkModalType, setLinkModalType] = useState<'link' | 'image'>('link');
  const [linkInputText, setLinkInputText] = useState('');
  const [linkInputUrl, setLinkInputUrl] = useState('');

  // Custom Table Generator states
  const [showTableModal, setShowTableModal] = useState(false);
  const [tableCols, setTableCols] = useState(3);
  const [tableRows, setTableRows] = useState(3);
  const [tableWidth, setTableWidth] = useState('100%');
  const [tableCaption, setTableCaption] = useState('');

  // AI Generator states
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);
  const [serverAiConfigured, setServerAiConfigured] = useState(false);
  const [customKeyInput, setCustomKeyInput] = useState('');
  const [isVerifyingKey, setIsVerifyingKey] = useState(false);
  const [keyVerifyResult, setKeyVerifyResult] = useState<{ success: boolean; text: string } | null>(null);
  const [showKeyPassword, setShowKeyPassword] = useState(false);
  const [isKeySavedLocally, setIsKeySavedLocally] = useState(false);
  const [aiSuccessToast, setAiSuccessToast] = useState<string | null>(null);

  // Soal Sumatif Custom Configuration states
  const [sumatifCounts, setSumatifCounts] = useState({
    pg: 10,
    isian: 0,
    bs: 0,
    uraian: 5
  });

  // Dimensi Profil Lulusan (DPL) Observasi Sikap Configuration
  const [selectedDplList, setSelectedDplList] = useState<string[]>([]);

  // Sync selected DPL from planData (RPM) or Observasi Sikap class config cache
  useEffect(() => {
    // 1. Prioritaskan dimensi yang dipilih pada RPM (planData.profileDimensions)
    if (planData?.profileDimensions && Array.isArray(planData.profileDimensions) && planData.profileDimensions.length > 0) {
      const normalized = planData.profileDimensions.map(d => {
        if (d.toLowerCase().includes('keiman')) return 'Keimanan dan Ketakwaan terhadap Tuhan YME';
        return d;
      });
      setSelectedDplList(normalized);
      return;
    }

    // 2. Cek apakah ada konfigurasi indikator DPL yang tersimpan dari observasi sikap
    try {
      let foundDpl: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('class_config_')) {
          const raw = localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed?.dpl_indicators && Array.isArray(parsed.dpl_indicators) && parsed.dpl_indicators.length > 0) {
              foundDpl = parsed.dpl_indicators;
              break;
            }
          }
        }
      }
      if (foundDpl.length > 0) {
        const mapped = foundDpl.map(k => SIKAP_KEY_TO_DPL[k] || k).filter(Boolean);
        if (mapped.length > 0) {
          setSelectedDplList(mapped);
          return;
        }
      }
    } catch {}

    // 3. Fallback default dimensi esensial
    setSelectedDplList(prev => prev.length > 0 ? prev : ['Penalaran Kritis', 'Kolaborasi', 'Kemandirian', 'Kreativitas']);
  }, [planData?.profileDimensions]);

  const isDplSelected = (dplName: string) => {
    return selectedDplList.some(d => 
      d === dplName || 
      (dplName.toLowerCase().includes('keiman') && d.toLowerCase().includes('keiman'))
    );
  };

  const handleToggleDpl = (dplName: string) => {
    setSelectedDplList(prev => {
      const isSelected = prev.some(d => d === dplName || (dplName.toLowerCase().includes('keiman') && d.toLowerCase().includes('keiman')));
      if (isSelected) {
        if (prev.length <= 1) return prev; // Pertahankan minimal 1 DPL
        return prev.filter(d => !(d === dplName || (dplName.toLowerCase().includes('keiman') && d.toLowerCase().includes('keiman'))));
      } else {
        return [...prev, dplName];
      }
    });
  };

  useEffect(() => {
    fetch('/api/ai/status')
      .then(res => res.json())
      .then(data => {
        if (data?.configured) {
          setServerAiConfigured(true);
        }
      })
      .catch(() => {});

    // Try loading local cached key if available
    try {
      const cached = localStorage.getItem('school_profile_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.geminiApiKey && !customKeyInput) {
          setCustomKeyInput(parsed.geminiApiKey);
        }
      }
    } catch {}
  }, []);

  // Countdown timer for rate limit recovery
  useEffect(() => {
    if (rateLimitCountdown <= 0) return;
    const timer = setInterval(() => {
      setRateLimitCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [rateLimitCountdown]);

  const handleVerifyCustomKey = async () => {
    const keyToTest = (customKeyInput.trim() || geminiApiKey || '').trim();
    if (!keyToTest && !serverAiConfigured) {
      setKeyVerifyResult({ success: false, text: 'Masukkan API Key terlebih dahulu pada kolom input.' });
      return;
    }

    setIsVerifyingKey(true);
    setKeyVerifyResult(null);

    try {
      const res = await fetch('/api/ai/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: keyToTest || undefined }),
      });

      const data = await res.json();
      if (data.success) {
        setKeyVerifyResult({ 
          success: true, 
          text: data.message || 'API Key Valid! Berhasil terhubung ke Gemini AI.' 
        });
      } else {
        const isRate = data.isRateLimit || /rate\s*exceeded|429|quota|batas\s*frekuensi|batas\s*kecepatan/i.test(data.error || '');
        setKeyVerifyResult({ 
          success: false, 
          text: isRate
            ? 'API Key terhubung ke Google AI, tetapi batas frekuensi per menit (15 request/menit) sedang penuh. Tunggu 10–15 detik lalu klik tombol "Uji API Key" kembali.'
            : (data.error || 'API Key ditolak. Periksa kembali API Key Anda.')
        });
      }
    } catch {
      setKeyVerifyResult({ 
        success: false, 
        text: 'Gagal menghubungi server verifikasi. Pastikan jaringan aktif.' 
      });
    } finally {
      setIsVerifyingKey(false);
    }
  };

  const handleSaveKeyLocally = () => {
    if (!customKeyInput.trim()) return;
    try {
      const cached = localStorage.getItem('school_profile_cache');
      const obj = cached ? JSON.parse(cached) : {};
      obj.geminiApiKey = customKeyInput.trim();
      localStorage.setItem('school_profile_cache', JSON.stringify(obj));
      setIsKeySavedLocally(true);
      setTimeout(() => setIsKeySavedLocally(false), 3000);
    } catch (e) {
      console.error("Gagal simpan key ke cache", e);
    }
  };

  const isAiConnected = !!(geminiApiKey?.trim() || serverAiConfigured || customKeyInput.trim());

  const editorRef = React.useRef<HTMLDivElement>(null);

  // Sync markdown content to editor ref (when opening modal, changing edit ID, or changing content)
  useEffect(() => {
    if (isModalOpen && editorRef.current) {
      const initialHtml = markdownToHtml(content);
      // Only write to innerHTML if editor is not active or empty to avoid losing cursor placement
      if (document.activeElement !== editorRef.current && editorRef.current.innerHTML !== initialHtml) {
        editorRef.current.innerHTML = initialHtml;
      }
    }
  }, [isModalOpen, editingId, content]);

  const insertHtmlAtCursor = (html: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      
      const el = document.createElement("div");
      el.innerHTML = html;
      
      const frag = document.createDocumentFragment();
      let node: Node | null;
      let lastNode: Node | null = null;
      while ((node = el.firstChild)) {
        lastNode = frag.appendChild(node);
      }
      
      range.insertNode(frag);
      
      if (editorRef.current) {
        setContent(htmlToMarkdown(editorRef.current.innerHTML));
      }
      
      if (lastNode) {
        const newRange = range.cloneRange();
        newRange.setStartAfter(lastNode);
        newRange.collapse(true);
        sel.removeAllRanges();
        sel.addRange(newRange);
      }
    } else if (editorRef.current) {
      editorRef.current.innerHTML += html;
    }
    
    // Sync state
    if (editorRef.current) {
      setContent(htmlToMarkdown(editorRef.current.innerHTML));
    }
  };

  const handleFormat = (command: string, value: string = '') => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    
    if (command === 'insertAlphaList') {
      document.execCommand('insertOrderedList');
      const selection = window.getSelection();
      if (selection && selection.focusNode) {
        const ol = (selection.focusNode as HTMLElement).closest?.('ol') || selection.focusNode.parentElement?.closest('ol');
        if (ol) {
          ol.style.listStyleType = 'lower-alpha';
          ol.setAttribute('type', 'a');
        }
      }
    } else {
      document.execCommand(command, false, value);
    }

    if (editorRef.current) {
      setContent(htmlToMarkdown(editorRef.current.innerHTML));
    }
  };

  const handleGenerateSoal = () => {
    const { topic, subject } = planData || {};
    const t = topic || '[Topik]';
    const s = subject || '[Mata Pelajaran]';
    
    let generated = `\nASESMEN SUMATIF: ${t}\n\n`;
    
    let currentNumber = 1;

    if (sumatifCounts.pg > 0) {
      generated += `Bagian A: Pilihan Ganda\n`;
      generated += Array.from({ length: sumatifCounts.pg }, () => {
        const str = `\n${currentNumber}. [Pertanyaan Pilihan Ganda nomor ${currentNumber} tentang ${t}...]\n` +
          `   a. [Pilihan A]\n` +
          `   b. [Pilihan B]\n` +
          `   c. [Pilihan C]\n` +
          `   d. [Pilihan D]\n`;
        currentNumber++;
        return str;
      }).join('');
    }

    if (sumatifCounts.isian > 0) {
      generated += `\nBagian B: Isian Singkat\n`;
      generated += Array.from({ length: sumatifCounts.isian }, () => {
        const str = `\n${currentNumber}. [Pertanyaan isian singkat nomor ${currentNumber}...]\n`;
        currentNumber++;
        return str;
      }).join('');
    }

    if (sumatifCounts.bs > 0) {
      generated += `\nBagian C: Benar - Salah\n`;
      generated += Array.from({ length: sumatifCounts.bs }, () => {
        const str = `\n${currentNumber}. [Pernyataan untuk nomor ${currentNumber} - Benar/Salah]\n`;
        currentNumber++;
        return str;
      }).join('');
    }

    if (sumatifCounts.uraian > 0) {
      generated += `\nBagian D: Uraian / Essay\n`;
      generated += Array.from({ length: sumatifCounts.uraian }, () => {
        const str = `\n${currentNumber}. Jelaskan secara mendalam mengenai penerapan ${t} dalam studi ${s}!\n`;
        currentNumber++;
        return str;
      }).join('');
    }

    const newHtml = markdownToHtml(generated);
    insertHtmlAtCursor(newHtml);
  };

  const getDefaultAiPrompt = (categoryType: Attachment['type']) => {
    const topic = planData?.topic || '[Materi Pokok]';
    const subject = planData?.subject || '[Mata Pelajaran]';
    const classSem = planData?.classSemester || '[Kelas/Semester]';
    const timeAllocation = planData?.timeAllocation || '[Alokasi Waktu]';

    const basePrefix = "Berikan HANYA isi materi atau butir soal secara langsung TANPA mengulang judul kategori atau materi pokok di awal, TANPA kalimat pengantar, TANPA sapaan, dan TANPA penjelasan awal.\n" +
      "ATURAN FORMAT DOKUMEN RESMI (SANGAT KETAT):\n" +
      "1. DILARANG KERAS menggunakan karakter bintang (*) sama sekali. Jangan gunakan format tebal/miring markdown (* atau ** atau ***). Jangan gunakan bintang untuk poin daftar.\n" +
      "2. DILARANG KERAS menggunakan karakter pagar (#, ##, ###) untuk judul. Tulis judul/subjudul bagian langsung menggunakan huruf kapital atau teks bersih (misal: 'A. Konsep Utama', 'B. Petunjuk Belajar').\n" +
      "3. DILARANG menggunakan karakter at (@), backtick (`), atau tilde (~).\n" +
      "4. Untuk butir daftar atau rincian poin, gunakan penomoran angka (1., 2., 3.), huruf (a., b., c.), atau tanda strip minus biasa (-).\n" +
      "5. Jangan sertakan karakter * # @ dsb dalam teks hasil generate.\n\n";

    switch (categoryType) {
      case 'Ringkasan Materi':
        return basePrefix + `Buatkan Ringkasan Materi pembelajaran yang mendalam, terstruktur rapi, dan mudah dipahami murid untuk mata pelajaran ${subject}, ${classSem}, dengan materi pokok "${topic}".
Susun secara lengkap mencakup:
1. Konsep Utama, Definisi Kunci, dan Tujuan Pembelajaran
2. Tabel Rangkuman Sub-Materi beserta penjelasan esensial dan contoh kontekstual nyata dalam kehidupan sehari-hari
3. Poin-poin intisari penting dan pemahaman bermakna bagi murid.`;

      case 'Media':
        return basePrefix + `Rancang panduan dan rekomendasi Media Pembelajaran yang interaktif, menarik, dan aplikatif untuk mata pelajaran ${subject}, ${classSem}, topik "${topic}".
Sertakan secara rinci:
1. Rekomendasi media visual, infografis, alat peraga konkret, atau simulasi digital yang relevan
2. Panduan/skenario integrasi media pada saat kegiatan inti pembelajaran di kelas
3. Sumber referensi media digital atau materi pendukung yang dapat langsung dimanfaatkan.`;

      case 'LKM':
        return basePrefix + `Buatkan Lembar Kerja Murid (LKM) yang interaktif, eksploratif, dan mengasah kolaborasi untuk mata pelajaran ${subject}, ${classSem}, materi pokok "${topic}".
Susun dengan format terstruktur:
1. Informasi Pembelajaran & Petunjuk Aktivitas Belajar Murid
2. Langkah-Langkah Eksplorasi / Penyelidikan Kelompok Murid
3. Tabel Lembar Pengamatan / Isian Data Hasil Investigasi Murid
4. Pertanyaan Refleksi, Analisis Masalah, dan Kesimpulan Murid.`;

      case 'Rubrik Penilaian': {
        const activeDpls = selectedDplList.length > 0 
          ? selectedDplList 
          : (planData?.profileDimensions && planData.profileDimensions.length > 0 
              ? planData.profileDimensions 
              : ['Penalaran Kritis', 'Kolaborasi', 'Kemandirian', 'Kreativitas']);

        const dplFormattedList = activeDpls.map((d, i) => `${i + 1}. Dimensi Profil Lulusan (DPL): ${d}`).join('\n');

        return basePrefix + `TUGAS: Susun Rubrik Penilaian Observasi Sikap - Dimensi Profil Lulusan (DPL) secara operasional, terukur, dan kontekstual untuk mata pelajaran ${subject}, ${classSem}, materi pokok "${topic}".

INFORMASI PENILAIAN OBSERVASI SIKAP (DPL):
- Mata Pelajaran: ${subject}
- Kelas / Semester: ${classSem}
- Materi Pokok: ${topic}
- Alokasi Waktu: ${timeAllocation}
- Teknik Penilaian: Observasi Sikap / Proses Pembelajaran (Asesmen Formatif)
- Bentuk Instrumen: Rubrik Penilaian Dimensi Profil Lulusan (DPL) & Jurnal Catatan Pengamatan Guru

DIMENSI PROFIL LULUSAN (DPL) YANG DIPILIH DARI RPM UNTUK DIOBSERVASI:
${dplFormattedList}

PEDOMAN TINGKATAN PREDIKAT & PENSKORAN RESMI (OBSERVASI SIKAP DPL):
- Skor 4: Sangat Baik (SB) -> Konsisten memperlihatkan perilaku, mandiri, dan menjadi teladan bagi rekan kelompok selama proses belajar.
- Skor 3: Baik (B) -> Sudah memperlihatkan perilaku secara teratur dan mandiri dalam kegiatan belajar.
- Skor 2: Cukup (C) -> Mulai memperlihatkan perilaku namun sesekali masih membutuhkan arahan atau pengingat guru.
- Skor 1: Kurang (K) / Perlu Bimbingan (PB) -> Belum memperlihatkan perilaku dan membutuhkan pendampingan intensif guru.
- Konversi Nilai Formatif: Nilai Formatif Observasi Sikap = Rata-Rata Skor DPL x 25 (Skala 100).
  Kriteria Rentang Predikat: 3.51 - 4.00 = SB, 2.51 - 3.50 = B, 1.51 - 2.50 = C, 1.00 - 1.50 = K.
  Nilai hasil observasi ini otomatis tersinkron ke Penilaian Formatif (Observasi Sikap) dan Rekap Formatif.

SUSUNAN KONTEN DOKUMEN (FORMAT LENGKAP):
1. PETUNJUK OBSERVASI SIKAP:
   Panduan ringkas bagi guru dalam mengamati perilaku murid selama proses pembelajaran materi ${topic}.

2. TABEL MATRIKS RUBRIK OBSERVASI SIKAP (DPL):
   Sajikan dalam format tabel markdown dengan kolom persis:
   | Dimensi Profil Lulusan (DPL) | Indikator Pengamatan Sikap Murid | Sangat Baik (SB) [Skor 4] | Baik (B) [Skor 3] | Cukup (C) [Skor 2] | Kurang (K) [Skor 1] |
   | :--- | :--- | :--- | :--- | :--- | :--- |
   
   WAJIB memuat baris terpisah untuk setiap Dimensi Profil Lulusan (DPL) yang dipilih (${activeDpls.join(', ')}). Deskriptor pada setiap tingkatan skor harus jelas, terukur, dan operasional sesuai aktivitas pembelajaran materi ${topic}.

3. LEMBAR CATATAN OBSERVASI SIKAP KELAS (JURNAL PENGAMATAN FORMATIF):
   Sajikan format tabel pengamatan guru dengan kolom:
   | No | Nama Murid | ${activeDpls.slice(0, 4).map(d => `${d} (1-4)`).join(' | ')} | Rata-Rata DPL | Predikat (SB/B/C/K) | Formatif (Skala 100) | Catatan Anekdot Guru |
   | :--- | :--- | ${activeDpls.slice(0, 4).map(() => ':---:').join(' | ')} | :---: | :---: | :---: | :--- |
   | 1. | [Nama Murid 1] | ${activeDpls.slice(0, 4).map(() => '').join(' | ')} | | | | |
   | 2. | [Nama Murid 2] | ${activeDpls.slice(0, 4).map(() => '').join(' | ')} | | | | |

4. PANDUAN TINDAK LANJUT OBSERVASI:
   Strategi pembinaan dan umpan balik bagi murid yang memperoleh predikat Sangat Baik (penguatan karakter) maupun Kurang/Cukup (bimbingan personal).

PENTING: Jangan sertakan karakter tanda pagar (#), asterisk (*), atau at (@) dalam teks agar rendering bersih dan rapi.`;
      }

      case 'Soal Sumatif': {
        const totalSoal = sumatifCounts.pg + sumatifCounts.isian + sumatifCounts.bs + sumatifCounts.uraian;
        const configDetails = [
          sumatifCounts.pg > 0 ? `- Pilihan Ganda: ${sumatifCounts.pg} soal` : '',
          sumatifCounts.isian > 0 ? `- Isian Singkat: ${sumatifCounts.isian} soal` : '',
          sumatifCounts.bs > 0 ? `- Benar-Salah: ${sumatifCounts.bs} soal` : '',
          sumatifCounts.uraian > 0 ? `- Uraian / Essay: ${sumatifCounts.uraian} soal` : ''
        ].filter(Boolean).join('\n');

        return basePrefix + `Konfigurasi Soal (Total: ${totalSoal} butir):
${configDetails}

Susun secara profesional dan lengkap mencakup:
1. Butir-butir soal berkualitas tinggi dengan stimulus kontekstual bermakna untuk mata pelajaran ${subject}, ${classSem}, materi pokok "${topic}".
2. Pastikan setiap butir soal diberikan penomoran angka yang berurutan (misal: 1, 2, 3, dst).
3. Kunci Jawaban Lengkap dan Pedoman Penskoran / Kriteria Rubrik Penilaian.`;
      }

      case 'Asesmen Awal':
        return basePrefix + `Buatkan instrumen Asesmen Awal (Diagnostik Kognitif & Non-Kognitif) untuk mata pelajaran ${subject}, ${classSem}, materi "${topic}".
Sertakan:
1. Pertanyaan pemantik pengukur pemahaman konsep prasyarat murid
2. Instrumen pemetaan gaya belajar dan kesiapan emosional belajar murid
3. Pedoman tindak lanjut pembelajaran berdiferensiasi berdasarkan hasil asesmen awal.`;

      case 'Proses':
        return basePrefix + `Buatkan instrumen Asesmen Formatif (Proses Pembelajaran) untuk mata pelajaran ${subject}, ${classSem}, topik "${topic}".
Sertakan:
1. Lembar Observasi Keterlibatan dan Keaktifan Murid saat proses belajar
2. Check-list lembar pantau diskusi dan kolaborasi kelompok
3. Panduan catatan anekdot dan umpan balik berkala (feedback loop) untuk guru dan murid.`;

      case 'Akhir':
        return basePrefix + `Buatkan instrumen Refleksi dan Asesmen Evaluasi Akhir Pembelajaran untuk mata pelajaran ${subject}, ${classSem}, materi pokok "${topic}".
Sertakan:
1. Lembar Refleksi Diri Murid (Self-Assessment) dan Refleksi Antarteman
2. Pertanyaan evaluasi pemahaman menyeluruh terhadap capaian pembelajaran
3. Rekomendasi tindak lanjut bagi murid (program remedial dan pengayaan).`;

      default:
        return basePrefix + `Buatkan dokumen lampiran pembelajaran untuk mata pelajaran ${subject}, materi "${topic}".`;
    }
  };

  const handleDirectAiGenerate = async () => {
    if (isGeneratingAi || selectedType === 'Media') return;

    const effectiveKey = (customKeyInput.trim() || geminiApiKey || '').trim();
    if (!effectiveKey && !serverAiConfigured) {
      setShowApiKeyModal(true);
      return;
    }

    const prompt = getDefaultAiPrompt(selectedType);

    setIsGeneratingAi(true);
    setIsRateLimited(false);

    try {
      let data: any = null;
      try {
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            prompt, 
            apiKey: effectiveKey || undefined 
          }),
        });
        if (response.ok) {
          data = await response.json();
        } else {
          throw new Error(`Server status ${response.status}`);
        }
      } catch (serverErr) {
        // Fallback for static hosting like Vercel where Express backend is not running
        if (!effectiveKey) {
          throw new Error("API Key Gemini belum dikonfigurasi.");
        }
        const { GoogleGenAI } = await import('@google/genai');
        const aiClient = new GoogleGenAI({ apiKey: effectiveKey });
        const modelsToTry = ["gemini-3.1-flash-lite", "gemini-flash-latest", "gemini-3.7-flash"];
        let generatedText = "";
        let lastErr: any = null;
        for (const m of modelsToTry) {
          try {
            const result = await aiClient.models.generateContent({
              model: m,
              contents: [{ role: 'user', parts: [{ text: prompt }] }]
            });
            if (result.text) {
              generatedText = result.text;
              break;
            }
          } catch (err: any) {
            lastErr = err;
          }
        }
        if (!generatedText && lastErr) {
          throw lastErr;
        }
        data = { text: generatedText };
      }

      if (data && data.text) {
        setIsRateLimited(false);
        setRateLimitCountdown(0);
        const cleaned = cleanAiAttachmentText(data.text);
        
        const topic = planData?.topic || '[Materi Pokok]';
        const subject = planData?.subject || '[Mata Pelajaran]';
        const classSem = planData?.classSemester || '[Kelas/Semester]';

        let header = '';
        switch (selectedType as string) {
          case 'Ringkasan Materi':
            header = `RINGKASAN MATERI\nMateri Pokok: ${topic}\n`;
            break;
          case 'Media':
            header = `MEDIA PEMBELAJARAN\nMateri Pokok: ${topic}\n`;
            break;
          case 'LKM':
            header = `LEMBAR KERJA MURID (LKM)\nMata Pelajaran: ${subject}\nKelas / Semester: ${classSem}\nMateri Pokok: ${topic}\n`;
            break;
          case 'Rubrik Penilaian':
            header = `RUBRIK PENILAIAN OBSERVASI SIKAP (DIMENSI PROFIL LULUSAN - DPL)\nMata Pelajaran: ${subject}\nKelas / Semester: ${classSem}\nMateri Pokok: ${topic}\nTeknik: Observasi Proses Pembelajaran (Formatif)\n`;
            break;
          case 'Soal Sumatif':
            header = `ASESMEN SUMATIF AKHIR\nMateri Pokok: ${topic}\n`;
            break;
          case 'Asesmen Awal':
            header = `LEMBAR ASESMEN DIAGNOSTIK / AWAL\nMateri Pokok: ${topic}\n`;
            break;
          case 'Proses':
            header = `LEMBAR OBSERVASI PROSES PEMBELAJARAN\nMateri Pokok: ${topic}\n`;
            break;
          case 'Akhir':
            header = `LEMBAR REFLEKSI & EVALUASI AKHIR\nMateri Pokok: ${topic}\n`;
            break;
          default:
            header = `${(selectedType as string).toUpperCase()}\nMateri Pokok: ${topic}\n`;
        }

        const combinedContent = `${header}\n${cleaned}`;
        const generatedHtml = markdownToHtml(combinedContent);
        
        // Otomatis isi kolom teks dengan hasil AI
        setContent(combinedContent);
        if (selectedType === 'Rubrik Penilaian') {
          if (!title.trim() || title === 'Rubrik Penilaian' || title.startsWith('Rubrik Penilaian -')) {
            setTitle(`Rubrik Observasi Sikap (DPL) - ${topic}`);
          }
        }
        if (editorRef.current) {
          editorRef.current.innerHTML = generatedHtml;
        }

        setAiSuccessToast(`Hasil AI untuk ${selectedType} berhasil digenerate dan otomatis terisi ke dalam kolom teks.`);
        setTimeout(() => {
          setAiSuccessToast(null);
        }, 4000);
      } else {
        const errorMsg = data?.error || "Gagal menghasilkan konten AI. Periksa kembali API Key Anda.";
        
        const rateLimitDetected = data?.isRateLimit || /rate\s*exceeded|429|quota|batas\s*frekuensi|batas\s*kecepatan|too\s*many\s*requests/i.test(errorMsg);
        if (rateLimitDetected) {
          setIsRateLimited(true);
          setRateLimitCountdown(15);
          setModalConfig({
            isOpen: true,
            type: 'alert',
            title: 'Batas Kecepatan Request Google AI (Rate Exceeded / 429)',
            message: 'Batas frekuensi request per menit (15 RPM) Google AI sedang penuh. Mohon tunggu sekitar 15 detik agar kuota pulih otomatis, lalu klik tombol "Generate AI" kembali.'
          });
        } else if (errorMsg.includes("401") || errorMsg.includes("UNAUTHENTICATED") || errorMsg.includes("ACCESS_TOKEN_TYPE_UNSUPPORTED") || errorMsg.includes("API Key") || errorMsg.includes("403")) {
          setShowApiKeyModal(true);
        } else {
          setModalConfig({
            isOpen: true,
            type: 'error',
            title: 'Gagal Generate Konten AI',
            message: errorMsg
          });
        }
      }
    } catch (e: any) {
      console.error("AI Generation failed:", e);
      const errStr = e?.message || String(e);
      const isRate = /rate\s*exceeded|429|quota|resource_exhausted/i.test(errStr);
      setModalConfig({
        isOpen: true,
        type: isRate ? 'alert' : 'error',
        title: isRate ? 'Batas Kecepatan Request Google AI (429)' : 'Gagal Generate Konten AI',
        message: isRate ? 'Batas frekuensi request Google AI sedang penuh. Mohon tunggu 15 detik lalu coba kembali.' : (errStr || 'Gagal menghubungi server AI. Pastikan jaringan internet aktif.')
      });
      setIsRateLimited(isRate);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleLineHeight = (value: string) => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    
    const range = sel.getRangeAt(0);
    let node: Node | null = range.commonAncestorContainer;
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentNode;
    }
    
    let blockNode = node as HTMLElement | null;
    while (blockNode && blockNode.id !== 'attachment-content-editor' && blockNode.tagName !== 'BODY') {
      const tag = blockNode.tagName.toLowerCase();
      if (['p', 'div', 'h1', 'h2', 'h3', 'li', 'td'].includes(tag)) {
        break;
      }
      blockNode = blockNode.parentElement;
    }

    if (blockNode && blockNode.id !== 'attachment-content-editor') {
      blockNode.style.lineHeight = value;
    } else {
      // Fallback: wrap selection in a div
      const selectedHtml = range.toString() || '&nbsp;';
      const wrapper = document.createElement('div');
      wrapper.style.lineHeight = value;
      wrapper.innerHTML = selectedHtml;
      range.deleteContents();
      range.insertNode(wrapper);
    }
    
    if (editorRef.current) {
      editorRef.current.focus();
      setContent(htmlToMarkdown(editorRef.current.innerHTML));
    }
  };

  const handleConfirmTable = () => {
    const cols = Math.max(1, Math.min(20, tableCols));
    const rows = Math.max(1, Math.min(50, tableRows));
    const width = tableWidth || '100%';
    const caption = tableCaption.trim();
    
    let tableHtml = `<table style="width: ${width}; border-collapse: collapse; margin: 10px auto; font-size: 12px; border: 1px solid #cbd5e1;">`;
    
    if (caption) {
      tableHtml += `<caption style="caption-side: top; padding: 5px; font-weight: bold; text-align: center; font-size: 14px; color: #1e293b;">${caption}</caption>`;
    }

    // Header row
    tableHtml += `<thead style="background-color: #f8fafc; border-bottom: 1px solid #cbd5e1;"><tr>`;
    for (let c = 1; c <= cols; c++) {
      tableHtml += `<th style="border: 1px solid #cbd5e1; padding: 6px 12px; font-weight: 600; text-align: center;">Kolom ${c}</th>`;
    }
    tableHtml += `</tr></thead><tbody>`;
    
    // Data rows
    for (let r = 1; r <= rows; r++) {
      tableHtml += `<tr>`;
      for (let c = 1; c <= cols; c++) {
        tableHtml += `<td style="border: 1px solid #cbd5e1; padding: 6px 12px;">&nbsp;</td>`;
      }
      tableHtml += `</tr>`;
    }
    tableHtml += `</tbody></table>`;

    insertHtmlAtCursor(tableHtml);
    setShowTableModal(false);
  };

  const handleOpenLinkModal = (type: 'link' | 'image') => {
    let initialText = '';
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      initialText = sel.toString();
    }
    setLinkModalType(type);
    setLinkInputText(initialText || (type === 'image' ? '' : 'Link Pendukung'));
    setLinkInputUrl('');
    setShowTableModal(false);
    setShowLinkModal(true);
  };

  const handleConfirmLink = () => {
    if (!linkInputUrl) return;
    const cleanUrl = linkInputUrl.trim();
    if (linkModalType === 'image') {
      const imgHtml = `<div style="text-align: center; margin: 10px 0;"><img src="${cleanUrl}" style="max-height: 250px; max-width: 100%; border-radius: 6px;" alt="Media" referrerpolicy="no-referrer" /></div>`;
      insertHtmlAtCursor(imgHtml);
    } else {
      const displayTxt = linkInputText.trim() || 'Link';
      const linkHtml = `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer" style="color: #4f46e5; text-decoration: underline; font-weight: 500;">${displayTxt}</a>`;
      insertHtmlAtCursor(linkHtml);
    }
    setLinkInputText('');
    setLinkInputUrl('');
    setShowLinkModal(false);
  };

  const handleSave = () => {
    // Sync content one last time from editor
    let finalContent = content;
    if (editorRef.current) {
      finalContent = htmlToMarkdown(editorRef.current.innerHTML);
    }
    
    if (!title || !finalContent) return;
    if (editingId) {
      onChange(attachments.map(att => att.id === editingId ? { ...att, type: selectedType, title, content: finalContent } : att));
      setEditingId(null);
    } else {
      const newAttachment: Attachment = {
        id: Date.now().toString(),
        type: selectedType,
        title,
        content: finalContent,
      };
      onChange([...attachments, newAttachment]);
    }
    setTitle('');
    setContent('');
    setSelectedType('Ringkasan Materi');
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    onChange(attachments.filter(a => a.id !== id));
  };

  const handleEdit = (attachment: Attachment) => {
    setEditingId(attachment.id);
    setSelectedType(attachment.type);
    setTitle(attachment.title);
    setContent(attachment.content);
    setIsModalOpen(true);
  };


  const availableTypes = ALL_ATTACHMENT_TYPES.filter(type => {
    // Show current type if editing
    if (editingId) {
      const editingAtt = attachments.find(a => a.id === editingId);
      if (editingAtt && editingAtt.type === type) return true;
    }
    // Filter out types already present in attachments
    return !attachments.some(att => att.type === type);
  });

  const getTemplate = (type: Attachment['type']) => {
    const { topic, subject, classSemester, timeAllocation, profileDimensions } = planData || {};
    const t = topic || '[Materi Pokok]';
    const s = subject || '[Mata Pelajaran]';
    const cs = classSemester || '[Kelas/Semester]';
    const ta = timeAllocation || '[Alokasi Waktu]';

    switch (type) {
      case 'Ringkasan Materi':
        return {
          title: `Ringkasan Materi - ${t}`,
          content: `RINGKASAN MATERI\nMateri Pokok: ${t}\n\n| Sub-Materi | Penjelasan Singkat | Contoh / Penerapan |\n| :--- | :--- | :--- |\n| [Konsep Utama 1] | [Penjelasan atau definisi singkat] | [Contoh dalam kehidupan nyata] |\n| [Konsep Utama 2] | [Penjelasan atau definisi singkat] | [Contoh dalam kehidupan nyata] |`
        };
      case 'LKM':
        return {
          title: `LKM - ${t}`,
          content: `LEMBAR KERJA MURID (LKM)\n\n| Informasi Pembelajaran | Detail Kelas |\n| :--- | :--- |\n| Mata Pelajaran | ${s} |\n| Kelas / Semester | ${cs} |\n| Materi Pokok | ${t} |\n| Alokasi Waktu | ${ta} |\n\n| Anggota Kelompok | No. Presensi | Peran Kelompok |\n| :--- | :--- | :--- |\n| 1. [Nama Murid] | | Ketua Kelompok |\n| 2. [Nama Murid] | | Notulis |\n| 3. [Nama Murid] | | Anggota |\n| 4. [Nama Murid] | | Anggota |\n| 5. [Nama Murid] | | Anggota |\n\nPetunjuk Kerja\n1. Diskusikan bersama kelompok mengenai topik di atas.\n2. Selesaikan pertanyaan penyelidikan secara kolaboratif.\n\nPertanyaan Penyelidikan\n- Pertanyaan 1: [Tuliskan pertanyaan analisis atau pemecahan masalah di sini]\n- Pertanyaan 2: [Tuliskan pertanyaan refleksi kelompok di sini]`
        };
      case 'Rubrik Penilaian':
        const selectedDims = selectedDplList.length > 0
          ? selectedDplList
          : (profileDimensions && profileDimensions.length > 0 ? profileDimensions : ['Penalaran Kritis', 'Kolaborasi', 'Kemandirian']);

        const rubrikRows = selectedDims.map(dim => 
          `| ${dim} | Menunjukkan sikap dan penerapan ${dim} dalam kegiatan pembelajaran materi ${t} | Menunjukkan konsistensi luar biasa, mandiri, dan menjadi teladan bagi rekan sekelas | Menunjukkan sikap aktif, teratur, dan mampu bertindak mandiri | Mulai menunjukkan sikap ${dim} namun sesekali masih membutuhkan pengingat guru | Belum menunjukkan sikap ${dim} dan memerlukan pendampingan intensif dari guru |`
        ).join('\n');

        const studentHeaderCols = selectedDims.slice(0, 4).map(d => `${d} (1-4)`).join(' | ');
        const studentDummyCols = selectedDims.slice(0, 4).map(() => '').join(' | ');
        const studentAlignCols = selectedDims.slice(0, 4).map(() => ':---:').join(' | ');

        return {
          title: `Rubrik Observasi Sikap (DPL) - ${t}`,
          content: `RUBRIK OBSERVASI SIKAP - DIMENSI PROFIL LULUSAN (DPL)\nMata Pelajaran: ${s}\nKelas / Semester: ${cs}\nMateri Pokok: ${t}\nAlokasi Waktu: ${ta}\nTeknik Penilaian: Observasi Proses Pembelajaran (Formatif)\n\nPetunjuk Penilaian:\n1. Guru mengamati perilaku murid selama proses pembelajaran materi ${t}.\n2. Berikan skor 1 sampai 4 pada setiap Dimensi Profil Lulusan (DPL) yang diamati:\n   - 4: Sangat Baik (SB)\n   - 3: Baik (B)\n   - 2: Cukup (C)\n   - 1: Kurang (K) / Perlu Bimbingan (PB)\n3. Nilai Formatif (Skala 100) = Rata-Rata Skor DPL x 25. Nilai tersinkron ke Buku Nilai Formatif Observasi Sikap.\n\n| Dimensi Profil Lulusan (DPL) | Indikator Pengamatan Sikap Murid | Sangat Baik (SB) [Skor 4] | Baik (B) [Skor 3] | Cukup (C) [Skor 2] | Kurang (K) [Skor 1] |\n| :--- | :--- | :--- | :--- | :--- | :--- |\n${rubrikRows}\n\nLEMBAR CATATAN OBSERVASI SIKAP KELAS (JURNAL FORMATIF)\n\n| No | Nama Murid | ${studentHeaderCols} | Rata-Rata DPL | Predikat | Formatif (x25) | Catatan Anekdot Guru |\n| :--- | :--- | ${studentAlignCols} | :---: | :---: | :---: | :--- |\n| 1. | [Nama Murid 1] | ${studentDummyCols} | | | | |\n| 2. | [Nama Murid 2] | ${studentDummyCols} | | | | |\n| 3. | [Nama Murid 3] | ${studentDummyCols} | | | | |`
        };
      case 'Soal Sumatif':
        return {
          title: `Soal Sumatif - ${t}`,
          content: `ASESMEN SUMATIF AKHIR\n\n| Lembar Jawab Murid | | Nilai |\n| :--- | :--- | :--- |\n| Nama Siswa | : _______________________________ | |\n| No. Absen / Kelas | : ________ / _________ | |\n| Hari / Tanggal | : _______________________________ | |\n\nBagian A: Pilihan Ganda\n1. [Tuliskan pertanyaan nomor 1 di sini...]\n   a. [Pilihan Jawaban A]\n   b. [Pilihan Jawaban B]\n   c. [Pilihan Jawaban C]\n   d. [Pilihan Jawaban D]\n\n2. [Tuliskan pertanyaan nomor 2 di sini...]\n   a. [Pilihan Jawaban A]\n   b. [Pilihan Jawaban B]\n   c. [Pilihan Jawaban C]\n   d. [Pilihan Jawaban D]\n\nBagian B: Uraian / Essai\n1. [Tuliskan soal uraian nomor 1 di sini...]\n2. [Tuliskan soal uraian nomor 2 di sini...]`
        };
      case 'Asesmen Awal':
        return {
          title: `Asesmen Awal - ${t}`,
          content: `LEMBAR ASESMEN DIAGNOSTIK / AWAL\n\n| Aspek Kesiapan / Pengetahuan | Kategori Soal Pemantik | Respon / Pemahaman Murid |\n| :--- | :--- | :--- |\n| Pengetahuan Prasyarat | [Pertanyaan pengukur pemahaman dasar] | |\n| Kesiapan Emosional | Bagaimana perasaanmu belajar hari ini? | [Sangat Antusias / Netral / Cemas] |\n| Minat Belajar | Gaya belajar apa yang kamu sukai? | [Visual / Audio / Kinestetik] |`
        };
      case 'Proses':
        return {
          title: `Asesmen Formatif (Proses) - ${t}`,
          content: `LEMBAR OBSERVASI PROSES PEMBELAJARAN (FORMATIF)\n\n| No. | Nama Siswa | Keaktifan Belajar (1-4) | Kerjasama Tim (1-4) | Kedisiplinan (1-4) | Catatan Guru |\n| :--- | :--- | :--- | :--- | :--- | :--- |\n| 1. | | | | | |\n| 2. | | | | | |\n| 3. | | | | | |`
        };
      case 'Akhir':
        return {
          title: `Asesmen Sumatif (Akhir) - ${t}`,
          content: `LEMBAR REFLEKSI & EVALUASI AKHIR PEMBELAJARAN\n\n| Pertanyaan Reflektif Siswa | Skor Kepuasan Diri (1-10) | Umpan Balik Tindak Lanjut |\n| :--- | :--- | :--- |\n| Apakah kamu memahami materi pokok hari ini? | | |\n| Seberapa sulit penugasan kelompok yang diberikan? | | |\n| Pelajaran berharga apa yang kamu dapatkan hari ini? | [Tuliskan komentar singkat] | |`
        };
      case 'Media':
        return {
          title: `Media - ${t}`,
          content: `MEDIA PEMBELAJARAN\nSilakan masukkan link gambar/foto media pembelajaran di bawah ini (setiap link di baris terpisah atau menggunakan format markdown):\n\nhttps://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800`
        };
      default:
        return { title: '', content: '' };
    }
  };

  const handleAddNew = () => {
    if (availableTypes.length === 0) {
      setModalConfig({
        isOpen: true,
        type: 'alert',
        title: 'Informasi Kategori',
        message: 'Semua kategori lampiran sudah ditambahkan.'
      });
      return;
    }
    setEditingId(null);
    const initialType = availableTypes[0];
    setSelectedType(initialType);
    const tmpl = getTemplate(initialType);
    setTitle(tmpl.title);
    setContent(tmpl.content);
    setIsModalOpen(true);
  };

  const getIcon = (type: Attachment['type']) => {
    switch (type) {
      case 'Ringkasan Materi': return <FileText className="w-5 h-5 text-blue-500" />;
      case 'LKM': return <LayoutTemplate className="w-5 h-5 text-green-500" />;
      case 'Rubrik Penilaian': return <FileCheck className="w-5 h-5 text-yellow-500" />;
      case 'Soal Sumatif': return <BrainCircuit className="w-5 h-5 text-purple-500" />;
      case 'Asesmen Awal': return <FileText className="w-5 h-5 text-orange-500" />;
      case 'Proses': return <FileText className="w-5 h-5 text-teal-500" />;
      case 'Akhir': return <FileText className="w-5 h-5 text-red-500" />;
      case 'Media': return <Image className="w-5 h-5 text-indigo-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <ContentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingId ? 'Edit Lampiran' : 'Tambah Lampiran Baru'}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Kategori Lampiran</label>
              <select 
                className="w-full p-2 bg-white border border-gray-300 rounded text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={selectedType}
                onChange={(e) => {
                  const newType = e.target.value as Attachment['type'];
                  setSelectedType(newType);
                  if (!editingId) {
                    const tmpl = getTemplate(newType);
                    setTitle(tmpl.title);
                    setContent(tmpl.content);
                  }
                }}
              >
                {availableTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Judul Dokumen / Lampiran</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Masukkan Judul Lampiran..."
                className="w-full p-2 bg-white border border-gray-300 rounded text-xs font-semibold text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                maxLength={120}
              />
            </div>
          </div>

          {selectedType === 'Soal Sumatif' && (
            <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-4 space-y-3 animate-in fade-in duration-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  Konfigurasi Generator Soal Sumatif AI
                </span>
                <span className="text-[10px] bg-purple-200/80 text-purple-900 font-bold px-2.5 py-0.5 rounded-full">
                  Custom AI Prompting
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-purple-900 block">Pilihan Ganda:</label>
                  <input
                    type="number"
                    min="0"
                    value={sumatifCounts.pg}
                    onChange={(e) => setSumatifCounts({ ...sumatifCounts, pg: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 bg-white border border-purple-300 rounded-lg font-semibold text-purple-950 focus:outline-none focus:ring-1 focus:ring-purple-500 shadow-2xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-purple-900 block">Isian Singkat:</label>
                  <input
                    type="number"
                    min="0"
                    value={sumatifCounts.isian}
                    onChange={(e) => setSumatifCounts({ ...sumatifCounts, isian: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 bg-white border border-purple-300 rounded-lg font-semibold text-purple-950 focus:outline-none focus:ring-1 focus:ring-purple-500 shadow-2xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-purple-900 block">Benar-Salah:</label>
                  <input
                    type="number"
                    min="0"
                    value={sumatifCounts.bs}
                    onChange={(e) => setSumatifCounts({ ...sumatifCounts, bs: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 bg-white border border-purple-300 rounded-lg font-semibold text-purple-950 focus:outline-none focus:ring-1 focus:ring-purple-500 shadow-2xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-purple-900 block">Uraian / Essay:</label>
                  <input
                    type="number"
                    min="0"
                    value={sumatifCounts.uraian}
                    onChange={(e) => setSumatifCounts({ ...sumatifCounts, uraian: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 bg-white border border-purple-300 rounded-lg font-semibold text-purple-950 focus:outline-none focus:ring-1 focus:ring-purple-500 shadow-2xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Konfigurasi DPL Observasi Sikap untuk Rubrik Penilaian */}
          {selectedType === 'Rubrik Penilaian' && (
            <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 space-y-3 animate-in fade-in duration-200 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                    Dimensi Profil Lulusan (DPL) Observasi Sikap
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {planData?.profileDimensions && planData.profileDimensions.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const normalized = planData.profileDimensions!.map(d => d.includes('Keiman') ? 'Keimanan dan Ketakwaan terhadap Tuhan YME' : d);
                        setSelectedDplList(normalized);
                      }}
                      className="text-[10px] text-amber-800 hover:text-amber-950 font-bold underline cursor-pointer"
                      title="Kembalikan ke dimensi yang dicentang pada form RPM"
                    >
                      Sesuai Pilihan RPM
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedDplList.length === DPL_OPTIONS.length) {
                        setSelectedDplList(planData?.profileDimensions && planData.profileDimensions.length > 0 ? planData.profileDimensions : ['Penalaran Kritis', 'Kolaborasi']);
                      } else {
                        setSelectedDplList([...DPL_OPTIONS]);
                      }
                    }}
                    className="text-[10px] text-amber-800 hover:text-amber-950 font-bold underline cursor-pointer"
                  >
                    {selectedDplList.length === DPL_OPTIONS.length ? 'Pilih Sebagian' : 'Pilih Semua (8 DPL)'}
                  </button>
                  <span className="text-[10px] bg-amber-200/80 text-amber-900 font-bold px-2.5 py-0.5 rounded-full">
                    {selectedDplList.length} DPL Terpilih
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-amber-800 leading-relaxed">
                Pilih dimensi sikap yang akan diobservasi saat pembelajaran. Hasil generate AI akan menyusun indikator dan matriks rubrik dengan istilah resmi DPL di RPM, skala skor 1–4, predikat SB/B/C/K, dan rumus konversi formatif ke buku nilai observasi sikap.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5">
                {DPL_OPTIONS.map(dpl => {
                  const selected = isDplSelected(dpl);
                  return (
                    <button
                      key={dpl}
                      type="button"
                      onClick={() => handleToggleDpl(dpl)}
                      className={`p-2 rounded-lg border text-left text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
                        selected 
                          ? 'bg-amber-600 text-white border-amber-700 shadow-2xs' 
                          : 'bg-white text-slate-700 border-amber-200 hover:bg-amber-100/50'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] shrink-0 ${
                        selected ? 'bg-white text-amber-700 font-bold' : 'border border-slate-300 bg-slate-50'
                      }`}>
                        {selected ? '✓' : ''}
                      </span>
                      <span className="truncate text-[11px] leading-tight" title={dpl}>{dpl}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-amber-200/60 text-[11px] text-amber-900">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold">Predikat Observasi Sikap:</span>
                  <span className="bg-white/80 px-2 py-0.5 rounded border border-amber-200 text-[10px] font-semibold">SB (4)</span>
                  <span className="bg-white/80 px-2 py-0.5 rounded border border-amber-200 text-[10px] font-semibold">B (3)</span>
                  <span className="bg-white/80 px-2 py-0.5 rounded border border-amber-200 text-[10px] font-semibold">C (2)</span>
                  <span className="bg-white/80 px-2 py-0.5 rounded border border-amber-200 text-[10px] font-semibold">K (1)</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const tmpl = getTemplate('Rubrik Penilaian');
                      setContent(tmpl.content);
                      setTitle(tmpl.title);
                      if (editorRef.current) {
                        editorRef.current.innerHTML = markdownToHtml(tmpl.content);
                      }
                    }}
                    className="text-[10px] text-amber-900 bg-white/90 hover:bg-white px-2 py-1 rounded border border-amber-300 font-bold transition cursor-pointer shadow-2xs"
                    title="Isi teks editor dengan format template tabel DPL yang dipilih saat ini"
                  >
                    Terapkan Template DPL
                  </button>
                  <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-200">
                    ✓ Sinkron ke Formatif (Observasi Sikap)
                  </span>
                </div>
              </div>
            </div>
          )}

          {showLinkModal && (
            <div className="bg-slate-100 border border-indigo-200 rounded-lg p-3 space-y-3 shadow-inner">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-widest">
                  {linkModalType === 'image' ? 'Sisipkan Media Gambar / Foto' : 'Sisipkan Hyperlink'}
                </h4>
                <button type="button" onClick={() => setShowLinkModal(false)} className="text-gray-400 hover:text-red-500">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                {linkModalType === 'link' && (
                  <div className="space-y-1">
                    <label className="font-semibold text-gray-700">Teks Tampilan:</label>
                    <input
                      type="text"
                      className="w-full p-2 border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      placeholder="Contoh: Baca Selengkapnya"
                      value={linkInputText}
                      onChange={e => setLinkInputText(e.target.value)}
                    />
                  </div>
                )}
                <div className="space-y-1 md:col-span-1">
                  <label className="font-semibold text-gray-700">
                    {linkModalType === 'image' ? 'URL Gambar / Foto (https://...):' : 'Alamat URL (Link):'}
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded bg-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder={linkModalType === 'image' ? 'https://images.unsplash.com/...' : 'https://google.com'}
                    value={linkInputUrl}
                    onChange={e => setLinkInputUrl(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-xs font-medium text-gray-700"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmLink}
                  disabled={!linkInputUrl}
                  className="px-4 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold disabled:opacity-50"
                >
                  Sisipkan
                </button>
              </div>
            </div>
          )}

          {showTableModal && (
            <div className="bg-slate-100 border border-indigo-200 rounded-lg p-3 space-y-3 shadow-inner">
              <div className="flex justify-between items-center border-b border-indigo-100 pb-1.5">
                <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-widest flex items-center gap-1.5">
                  <Table className="w-3.5 h-3.5" /> Buat Tabel Kustom Baru (Kosongan)
                </h4>
                <button type="button" onClick={() => setShowTableModal(false)} className="text-gray-400 hover:text-red-500">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700 flex items-center">Jumlah Kolom (1 - 20):</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    className="w-full p-2 border border-gray-300 rounded bg-white font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    value={tableCols}
                    onChange={e => setTableCols(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700 flex items-center">Jumlah Baris (1 - 50):</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    className="w-full p-2 border border-gray-300 rounded bg-white font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    value={tableRows}
                    onChange={e => setTableRows(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700 flex items-center">Lebar Tabel (Contoh: 100%, 75%, 500px):</label>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded bg-white font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Contoh: 100% atau 400px"
                    value={tableWidth}
                    onChange={e => setTableWidth(e.target.value)}
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="font-semibold text-gray-700 flex items-center">Judul / Caption Tabel (Otomatis Rata Tengah):</label>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded bg-white font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Contoh: Tabel 1: Ringkasan Materi"
                    value={tableCaption}
                    onChange={e => setTableCaption(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end border-t border-indigo-100 pt-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowTableModal(false)}
                  className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded font-medium text-gray-700 transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmTable}
                  className="px-4 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold transition shadow-sm"
                >
                  Sisipkan Tabel Kosong
                </button>
              </div>
            </div>
          )}

          {/* AI Generation Active Indicator */}
          {isGeneratingAi && (
            <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50 border border-indigo-200 text-indigo-950 rounded-xl p-3.5 flex items-center gap-3 animate-pulse shadow-2xs">
              <div className="p-2 bg-indigo-600 text-white rounded-lg shadow-xs shrink-0">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
              <div className="flex-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-indigo-950">Gemini AI sedang menyusun {selectedType}...</span>
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-full">Proses Otomatis</span>
                </div>
                <p className="text-[11px] text-indigo-700 mt-0.5">
                  Topik: <strong>{planData?.topic || 'Sesuai Rencana'}</strong> &bull; Mapel: <strong>{planData?.subject || 'Umum'}</strong>. Hasil akan otomatis langsung mengisi kolom teks editor di bawah.
                </p>
              </div>
            </div>
          )}

          {/* AI Success Toast Banner */}
          {aiSuccessToast && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl p-3 flex items-center justify-between text-xs shadow-xs animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-emerald-600 text-white rounded-md shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-bold text-emerald-950">Berhasil: </span>
                  <span>{aiSuccessToast}</span>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setAiSuccessToast(null)}
                className="text-emerald-700 hover:text-emerald-950 p-1 text-xs"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Rate Limit Alert & Countdown */}
          {isRateLimited && rateLimitCountdown > 0 && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 text-xs text-amber-900 shadow-xs animate-in fade-in duration-200">
              <div className="flex items-start gap-2.5">
                <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg shrink-0 mt-0.5">
                  <Clock className="w-4 h-4 animate-pulse" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-950">
                      Batas Kecepatan Request Google AI (Rate Exceeded / 429)
                    </span>
                    <span className="px-2 py-0.5 bg-amber-200/80 text-amber-900 font-mono font-bold text-[10px] rounded-full">
                      Pulih dalam {rateLimitCountdown}s
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Akun Google AI gratis memiliki batas frekuensi (15 request/menit). Kuota akan pulih otomatis setelah jeda waktu selesai.
                  </p>
                  <div className="pt-1 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDirectAiGenerate}
                      disabled={isGeneratingAi || rateLimitCountdown > 0}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded font-bold text-xs transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      {rateLimitCountdown > 0 ? (
                        <>
                          <Clock className="w-3.5 h-3.5 animate-spin" />
                          <span>Menunggu ({rateLimitCountdown}s)...</span>
                        </>
                      ) : (
                        <>
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Coba Generate Sekarang</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowApiKeyModal(true)}
                      className="px-2.5 py-1 bg-white border border-amber-300 text-amber-900 rounded font-semibold text-xs transition hover:bg-amber-100 cursor-pointer"
                    >
                      Ganti / Uji API Key
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col border border-gray-200 rounded-md overflow-hidden bg-white shadow-sm">
              {/* Rich formatting toolbar */}
              <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-50 border-b border-gray-200 select-none">
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); handleFormat('bold'); }}
                  className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition"
                  title="Tebal (Bold)"
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); handleFormat('italic'); }}
                  className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition"
                  title="Miring (Italic)"
                >
                  <Italic className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); handleFormat('underline'); }}
                  className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition"
                  title="Garis Bawah (Underline)"
                >
                  <Underline className="w-4 h-4" />
                </button>
                
                <div className="w-[1px] h-5 bg-gray-200 mx-1" />

                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); handleFormat('justifyLeft'); }}
                  className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition"
                  title="Rata Kiri"
                >
                  <AlignLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); handleFormat('justifyCenter'); }}
                  className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition"
                  title="Rata Tengah"
                >
                  <AlignCenter className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); handleFormat('justifyRight'); }}
                  className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition"
                  title="Rata Kanan"
                >
                  <AlignRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); handleFormat('justifyFull'); }}
                  className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition"
                  title="Rata Kanan Kiri (Justified)"
                >
                  <AlignJustify className="w-4 h-4" />
                </button>
                
                <div className="w-[1px] h-5 bg-gray-200 mx-1" />

                {/* Spasi (Line-Spacing) selector */}
                <div className="flex items-center gap-1 select-none">
                  <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Spasi:</span>
                  <select
                    onChange={(e) => {
                      const lh = e.target.value;
                      if (lh) handleLineHeight(lh);
                      e.target.value = '';
                    }}
                    defaultValue=""
                    className="p-0.5 text-xs border border-gray-300 rounded bg-white text-slate-700 hover:bg-slate-50 transition cursor-pointer font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    title="Atur Jarak Spasi Baris"
                  >
                    <option value="" disabled hidden>Atur</option>
                    <option value="1.0">1.0 (Rapat)</option>
                    <option value="1.25">1.25</option>
                    <option value="1.5">1.5 (Satu Setengah)</option>
                    <option value="2.0">2.0 (Ganda)</option>
                  </select>
                </div>

                <div className="w-[1px] h-5 bg-gray-200 mx-1" />

                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); handleFormat('formatBlock', '<h1>'); }}
                  className="px-2 py-1 flex items-center hover:bg-slate-200 rounded text-xs font-bold text-slate-700 transition"
                  title="Judul Utama (H1)"
                >
                  H1
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); handleFormat('formatBlock', '<h2>'); }}
                  className="px-2 py-1 flex items-center hover:bg-slate-200 rounded text-xs font-bold text-slate-700 transition"
                  title="Sub-judul Sedang (H2)"
                >
                  H2
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); handleFormat('formatBlock', '<h3>'); }}
                  className="px-2 py-1 flex items-center hover:bg-slate-200 rounded text-xs font-bold text-slate-700 transition"
                  title="Sub-judul Kecil (H3)"
                >
                  H3
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); handleFormat('formatBlock', '<p>'); }}
                  className="px-2 py-1 flex items-center hover:bg-slate-200 rounded text-xs font-medium text-slate-700 transition"
                  title="Teks Normal / Paragraph"
                >
                  P
                </button>

                <div className="w-[1px] h-5 bg-gray-200 mx-1" />

                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); handleFormat('insertUnorderedList'); }}
                  className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition"
                  title="Bullet List"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); handleFormat('insertOrderedList'); }}
                  className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition"
                  title="Numbered List (1, 2, 3)"
                >
                  <ListOrdered className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); handleFormat('insertAlphaList'); }}
                  className="px-1.5 py-1 hover:bg-slate-200 rounded text-slate-700 transition font-bold text-xs"
                  title="Alpha List (a, b, c)"
                >
                  a,b,c
                </button>

                {selectedType === 'Soal Sumatif' && (
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); handleGenerateSoal(); }}
                    className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded text-[10px] font-black border border-purple-200 flex items-center gap-1 transition-all"
                    title="Generate Soal Sumatif Otomatis"
                  >
                    <Sparkles size={12} className="text-purple-500" />
                    Asisten Soal
                  </button>
                )}

                {selectedType !== 'Media' && (
                  <button
                    type="button"
                    onClick={handleDirectAiGenerate}
                    disabled={isGeneratingAi}
                    className={`px-3 py-1 rounded text-xs font-bold border flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                      isGeneratingAi
                        ? 'bg-indigo-700 text-white border-indigo-800'
                        : isRateLimited && rateLimitCountdown > 0
                          ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-700'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-700'
                    }`}
                    title={`Klik untuk otomatis mengisi teks ${selectedType} dengan hasil AI`}
                  >
                    {isGeneratingAi ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Sedang Generate AI...</span>
                      </>
                    ) : isRateLimited && rateLimitCountdown > 0 ? (
                      <>
                        <Clock className="w-3.5 h-3.5 animate-pulse" />
                        <span>Tunggu ({rateLimitCountdown}s)</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>Generate AI</span>
                      </>
                    )}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowApiKeyModal(true)}
                  className={`p-1.5 rounded transition border cursor-pointer ${
                    isAiConnected 
                      ? 'text-slate-600 hover:bg-slate-200 border-transparent hover:border-slate-300' 
                      : 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-300'
                  }`}
                  title={isAiConnected ? "Pengaturan Gemini API Key (Terkoneksi)" : "Gemini API Key Belum Dikonfigurasi (Klik untuk Mengatur)"}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                </button>

                <div className="w-[1px] h-5 bg-gray-200 mx-1" />

                <button
                  type="button"
                  onClick={() => {
                    setShowTableModal(!showTableModal);
                    setShowLinkModal(false);
                  }}
                  className={`p-1.5 rounded transition flex items-center gap-1 text-xs ${
                    showTableModal 
                      ? 'bg-indigo-100 text-indigo-700 font-medium border border-indigo-200' 
                      : 'hover:bg-slate-200 text-slate-700'
                  }`}
                  title="Sisipkan Tabel Baru kustom"
                >
                  <Table className="w-4 h-4" /> Tabel
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenLinkModal('link')}
                  className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition flex items-center gap-1 text-xs"
                  title="Sisipkan Hyperlink"
                >
                  <Link2 className="w-4 h-4 text-slate-600" /> Link
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenLinkModal('image')}
                  className="p-1.5 hover:bg-indigo-50 hover:text-indigo-700 rounded text-indigo-600 transition flex items-center gap-1 text-xs font-medium"
                  title="Sisipkan Alamat Gambar"
                >
                  <Image className="w-4 h-4" /> Foto Media
                </button>

                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); insertHtmlAtCursor('<p><br></p>'); }}
                  className="px-2 py-1 hover:bg-slate-200 rounded text-[10px] text-indigo-700 transition ml-auto font-bold border border-indigo-200 flex items-center gap-1"
                  title="Tambah Baris Paragraf Baru"
                >
                  + Paragraf Baru
                </button>
              </div>

              {/* WYSIWYG Content Editable Screen */}
              <div
                id="attachment-content-editor"
                ref={editorRef}
                contentEditable={true}
                onInput={(e) => setContent(htmlToMarkdown(e.currentTarget.innerHTML))}
                onBlur={() => {
                  if (editorRef.current) {
                    setContent(htmlToMarkdown(editorRef.current.innerHTML));
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Spacebar') {
                    const selection = window.getSelection();
                    if (selection && selection.focusNode) {
                      const node = selection.focusNode;
                      const text = node.textContent || '';
                      const offset = selection.focusOffset;
                      
                      if (offset === 3 && text.startsWith('1. ')) {
                          e.preventDefault();
                          const range = selection.getRangeAt(0);
                          range.setStart(node, 0);
                          range.setEnd(node, 3);
                          range.deleteContents();
                          handleFormat('insertOrderedList');
                      } else if (offset === 3 && text.match(/^[a-zA-Z]\.\s/)) {
                          e.preventDefault();
                          const range = selection.getRangeAt(0);
                          range.setStart(node, 0);
                          range.setEnd(node, 3);
                          range.deleteContents();
                          handleFormat('insertAlphaList');
                      } else if (offset === 2 && (text.startsWith('- ') || text.startsWith('* '))) {
                          e.preventDefault();
                          const range = selection.getRangeAt(0);
                          range.setStart(node, 0);
                          range.setEnd(node, 2);
                          range.deleteContents();
                          handleFormat('insertUnorderedList');
                      }
                    }
                  }
                }}
                className="w-full p-8 min-h-[450px] max-h-[600px] overflow-y-auto bg-white text-slate-900 leading-normal font-sans focus:outline-none prose prose-slate prose-sm max-w-none shadow-inner"
                style={{ 
                  minHeight: '450px',
                  fontFamily: "'Inter', system-ui, sans-serif",
                  lineHeight: '1.6'
                }}
              />
            </div>

          <div className="flex gap-2 justify-end pt-2 border-t mt-4 border-gray-100">
            <button 
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-medium transition"
            >
              Batal
            </button>
            <button 
              type="button"
              onClick={handleSave}
              className="flex items-center px-5 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-semibold text-sm transition"
            >
              <Save className="w-4 h-4 mr-2" /> {editingId ? 'Simpan Perubahan' : 'Tambahkan Lampiran'}
            </button>
          </div>
        </div>
      </ContentModal>

      {attachments.length < 3 && (
        <button 
          type="button"
          onClick={handleAddNew}
          className="flex items-center px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-xs font-bold shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" /> Tambah Lampiran Baru
        </button>
      )}

      <div className="flex flex-col gap-3 pt-1">
        {attachments.map(att => (
          <div key={att.id} className="flex items-center gap-4 p-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-white transition-colors border border-slate-100 shrink-0">
              {getIcon(att.type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md border ${getTypeBadgeStyle(att.type)}`}>
                  {att.type}
                </span>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium italic">
                  <Eye size={12} className="shrink-0" />
                  <span>Detail tersedia di panel edit</span>
                </div>
              </div>
              <h4 className="text-sm font-bold text-slate-800 truncate group-hover:text-indigo-900 transition-colors">
                {att.title}
              </h4>
            </div>

            <div className="flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
              <button 
                type="button"
                onClick={() => handleEdit(att)} 
                className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                title="Edit Lampiran"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button 
                type="button"
                onClick={() => handleDelete(att.id)} 
                className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                title="Hapus Lampiran"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {attachments.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed border-slate-100 rounded-2xl">
            <FileText className="w-8 h-8 text-slate-200 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-400">Belum ada lampiran ditambahkan</p>
          </div>
        )}
      </div>

      <CustomModal
        isOpen={modalConfig.isOpen}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        onConfirm={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
        onCancel={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
      />

      {/* API Key Modal - Di atas pop up lampiran (z-[10050] > ContentModal z-[9999]) */}
      {showApiKeyModal && (
        <div 
          className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-[10050] p-4 animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowApiKeyModal(false);
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-5 space-y-4 border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Konfigurasi Google Gemini API Key</h3>
                  <p className="text-xs text-slate-500">Kunci API digunakan untuk fitur Generate AI otomatis</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowApiKeyModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">Status Koneksi AI:</span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[11px] border ${
                  isAiConnected 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isAiConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                  {isAiConnected ? 'Terkoneksi' : 'Belum Dikonfigurasi'}
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Gemini API Key (AIzaSy... / AQ...)
                </label>
                <div className="relative">
                  <input
                    type={showKeyPassword ? "text" : "password"}
                    placeholder={serverAiConfigured ? "Menggunakan API Key Server (atau masukkan untuk override)..." : "Tempel Gemini API Key di sini..."}
                    value={customKeyInput}
                    onChange={e => {
                      setCustomKeyInput(e.target.value);
                      setKeyVerifyResult(null);
                    }}
                    className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKeyPassword(!showKeyPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    tabIndex={-1}
                  >
                    {showKeyPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Belum punya kunci API?</span>
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-800 font-bold underline inline-flex items-center gap-1"
                >
                  Dapatkan API Key Gratis di Google AI Studio <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {keyVerifyResult && (
                <div className={`p-2.5 rounded-lg text-[11px] flex items-start gap-2 ${
                  keyVerifyResult.success 
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {keyVerifyResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 leading-relaxed">
                    <span className="font-semibold">{keyVerifyResult.success ? 'Berhasil: ' : 'Peringatan: '}</span>
                    {keyVerifyResult.text}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleVerifyCustomKey}
                disabled={isVerifyingKey}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isVerifyingKey ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menguji...</span>
                  </>
                ) : (
                  <>
                    <BrainCircuit className="w-3.5 h-3.5" />
                    <span>Uji Koneksi</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  handleSaveKeyLocally();
                  setShowApiKeyModal(false);
                }}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan & Selesai</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
