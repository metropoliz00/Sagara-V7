import React, { useState, useEffect, useRef } from 'react';
import { Material, Subject, User } from '../types';
import { 
  BookOpen, Plus, Search, ExternalLink, Trash2, Edit2, 
  Filter, Calendar, Link as LinkIcon, FileText, X, Youtube,
  Eye, EyeOff, Sparkles, Award, BookMarked, Video, Layers, Globe, PenTool, Binary,
  Upload, Download, FileSpreadsheet, Image as ImageIcon, ZoomIn, ZoomOut, RotateCcw,
  ClipboardList, FileCheck, Paperclip, CheckSquare
} from 'lucide-react';
import * as XLSX from 'xlsx';
import CustomModal from './CustomModal';

// Helper to compress image and convert to Base64 (lightweight but sharp)
const compressImageToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Max dimension of 2400px for outstanding visual detail and pristine text readability
        const MAX_DIM = 2400;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // 0.90 JPEG compression preserves crisp vectors and legible fine print at highly optimized file sizes
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.90);
          resolve(compressedBase64);
        } else {
          resolve(event.target?.result as string);
        }
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

// Helper to read task file (Image or PDF) to Base64
const readTaskFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (file.type.startsWith('image/')) {
      compressImageToBase64(file).then(resolve).catch(reject);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string) || '');
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    }
  });
};

interface MaterialsViewProps {
  materials: Material[];
  subjects: Subject[];
  currentUser: User | null;
  classId: string;
  onAddMaterial: (material: Omit<Material, 'id' | 'createdAt'> & { createdAt?: string }) => Promise<void>;
  onUpdateMaterial: (material: Material) => Promise<void>;
  onDeleteMaterial: (id: string) => Promise<void>;
  onShowNotification: (message: string, type: 'success' | 'error' | 'warning') => void;
}


// Helper to get beautiful, modern theme palettes tailored per subject
const getSubjectTheme = (subjectId: string, subjectName: string) => {
  const name = subjectName.toLowerCase();
  
  if (name.includes('matematika') || name.includes('mtk') || name.includes('hitung')) {
    return {
      border: 'border-orange-100 hover:border-orange-200',
      text: 'text-orange-600',
      badge: 'bg-orange-50/80 text-orange-700 border-orange-100 hover:bg-orange-100/50',
      banner: 'bg-gradient-to-r from-orange-400 to-amber-400',
    };
  }
  if (name.includes('ipa') || name.includes('sains') || name.includes('fisika') || name.includes('biologi') || name.includes('kimia') || name.includes('science')) {
    return {
      border: 'border-sky-100 hover:border-sky-200',
      text: 'text-sky-600',
      badge: 'bg-sky-50/80 text-sky-700 border-sky-100 hover:bg-sky-100/50',
      banner: 'bg-gradient-to-r from-sky-400 to-blue-400',
    };
  }
  if (name.includes('agama') || name.includes('islam') || name.includes('kristen') || name.includes('buku') || name.includes('budi')) {
    return {
      border: 'border-emerald-100 hover:border-emerald-200',
      text: 'text-emerald-600',
      badge: 'bg-emerald-50/80 text-emerald-700 border-emerald-100 hover:bg-emerald-100/50',
      banner: 'bg-gradient-to-r from-emerald-400 to-teal-400',
    };
  }
  if (name.includes('sejarah') || name.includes('pkn') || name.includes('ips') || name.includes('sosial') || name.includes('geografi') || name.includes('negara')) {
    return {
      border: 'border-amber-100 hover:border-amber-200',
      text: 'text-amber-600',
      badge: 'bg-amber-50/80 text-amber-700 border-amber-100 hover:bg-amber-100/50',
      banner: 'bg-gradient-to-r from-amber-400 to-yellow-400',
    };
  }
  if (name.includes('bahasa') || name.includes('indonesia') || name.includes('inggris') || name.includes('english') || name.includes('jawa') || name.includes('sunda')) {
    return {
      border: 'border-rose-100 hover:border-rose-200',
      text: 'text-rose-600',
      badge: 'bg-rose-50/80 text-rose-700 border-rose-100 hover:bg-rose-100/50',
      banner: 'bg-gradient-to-r from-rose-400 to-pink-400',
    };
  }
  if (name.includes('seni') || name.includes('budaya') || name.includes('art') || name.includes('musik') || name.includes('prakarya')) {
    return {
      border: 'border-violet-100 hover:border-violet-200',
      text: 'text-violet-600',
      badge: 'bg-violet-50/80 text-violet-700 border-violet-100 hover:bg-violet-100/50',
      banner: 'bg-gradient-to-r from-violet-400 to-purple-400',
    };
  }
  if (name.includes('pjok') || name.includes('olahraga') || name.includes('jasmani') || name.includes('kesehatan') || name.includes('senam')) {
    return {
      border: 'border-teal-100 hover:border-teal-200',
      text: 'text-teal-600',
      badge: 'bg-teal-50/80 text-teal-700 border-teal-100 hover:bg-teal-100/50',
      banner: 'bg-gradient-to-r from-teal-400 to-cyan-400',
    };
  }

  // Fallback hashing based on key
  const palettes = [
    {
      border: 'border-indigo-100 hover:border-indigo-200',
      text: 'text-indigo-600',
      badge: 'bg-indigo-50/80 text-indigo-700 border-indigo-100 hover:bg-indigo-100/50',
      banner: 'bg-gradient-to-r from-indigo-400 to-violet-400',
    },
    {
      border: 'border-cyan-100 hover:border-cyan-200',
      text: 'text-cyan-600',
      badge: 'bg-cyan-50/80 text-cyan-700 border-cyan-100 hover:bg-cyan-100/50',
      banner: 'bg-gradient-to-r from-cyan-400 to-sky-400',
    },
    {
      border: 'border-fuchsia-100 hover:border-fuchsia-200',
      text: 'text-fuchsia-600',
      badge: 'bg-fuchsia-50/80 text-fuchsia-700 border-fuchsia-100 hover:bg-fuchsia-100/50',
      banner: 'bg-gradient-to-r from-fuchsia-400 to-pink-400',
    }
  ];

  const key = subjectId || subjectName || 'default';
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % palettes.length;
  return palettes[index];
};

const MaterialsView: React.FC<MaterialsViewProps> = ({
  materials, subjects, currentUser, classId,
  onAddMaterial, onUpdateMaterial, onDeleteMaterial, onShowNotification
}) => {
  console.log("MaterialsView received materials:", materials, "for classId:", classId);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<{
    title: string;
    url: string;
    type: 'video' | 'material' | 'infographic';
  } | null>(null);
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setZoomScale(1);
    setPan({ x: 0, y: 0 });
  }, [previewItem]);

  useEffect(() => {
    if (zoomScale === 1) {
      setPan({ x: 0, y: 0 });
    }
  }, [zoomScale]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomScale <= 1) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
  };

  const handleMouseUpOrLeave = () => {
    setIsPanning(false);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Mata Pelajaran': subjects[0]?.name || 'Matematika',
        'Judul Materi': 'Aljabar Dasar Bagian 1',
        'Deskripsi': 'Pengenalan variabel, koefisien, dan persamaan linier satu variabel.',
        'Link Tautan (Opsional)': 'https://youtube.com/... atau https://drive.google.com/...',
        'Status Tampilkan (Ya/Tidak)': 'Ya'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Materi");
    XLSX.writeFile(wb, "Template_Materi_Pembelajaran.xlsx");
    onShowNotification("Template Excel berhasil diunduh!", "success");
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const bstr = event.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json<any>(ws);

        if (rawData.length === 0) {
          onShowNotification("Berkas Excel kosong atau format salah.", "error");
          return;
        }

        let importedCount = 0;
        for (const row of rawData) {
          const subjectName = row['Mata Pelajaran'];
          const title = row['Judul Materi'];
          const description = row['Deskripsi'] || '';
          const link = row['Link Tautan (Opsional)'] || '';
          const visibleText = String(row['Status Tampilkan (Ya/Tidak)'] || 'Ya').toLowerCase().trim();
          const isVisible = visibleText === 'ya' || visibleText === 'yes' || visibleText === 'true';

          if (subjectName && title) {
            const sub = subjects.find(s => s.name.toLowerCase() === String(subjectName).toLowerCase().trim());
            const subjectId = sub ? sub.id : (subjects[0]?.id || 'other');

            await onAddMaterial({
              classId,
              subjectId,
              title: String(title),
              description: String(description),
              link: String(link),
              isVisible,
              createdAt: new Date().toISOString()
            });
            importedCount++;
          }
        }

        if (importedCount > 0) {
          onShowNotification(`Berhasil mengimpor ${importedCount} materi pembelajaran!`, "success");
        } else {
          onShowNotification("Format kolom tidak sesuai atau tidak ada data valid.", "error");
        }
      } catch (err) {
        console.error(err);
        onShowNotification("Gagal membaca berkas Excel.", "error");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const handleExportExcel = () => {
    const activeMaterials = materials.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (item.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSubject = selectedSubject === 'all' || item.subjectId === selectedSubject;
      return matchesSearch && matchesSubject;
    });

    if (activeMaterials.length === 0) {
      onShowNotification("Tidak ada data materi untuk diekspor.", "warning");
      return;
    }

    const exportData = activeMaterials.map((item, idx) => {
      const sub = subjects.find(s => s.id === item.subjectId);
      return {
        'NO': idx + 1,
        'MATA PELAJARAN': sub ? sub.name : 'Lainnya',
        'JUDUL MATERI': item.title,
        'DESKRIPSI': item.description || '-',
        'LINK TAUTAN': item.link || '-',
        'TAMPILKAN': item.isVisible ? 'Ya' : 'Tidak',
        'TANGGAL BUAT': item.createdAt ? new Date(item.createdAt).toLocaleDateString('id-ID') : '-'
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Materi Pembelajaran");
    XLSX.writeFile(wb, `Dokumen_Materi_Pembelajaran_Kelas_${classId}.xlsx`);
    onShowNotification("Data materi berhasil diekspor ke Excel!", "success");
  };

  const getYoutubeEmbedUrl = (url: string) => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/\?|youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?\s*v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
  };

  const getGoogleDriveEmbedUrl = (url: string) => {
    if (!url) return null;
    const cleanUrl = url.trim();
    if (cleanUrl.includes('drive.google.com') || cleanUrl.includes('docs.google.com')) {
      // Handle /file/d/...
      let match = cleanUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        return `https://drive.google.com/file/d/${match[1]}/preview`;
      }
      
      // Handle /document/d/...
      match = cleanUrl.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        return `https://docs.google.com/document/d/${match[1]}/preview`;
      }

      // Handle /spreadsheets/d/...
      match = cleanUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        return `https://docs.google.com/spreadsheets/d/${match[1]}/preview`;
      }

      // Handle /presentation/d/...
      match = cleanUrl.match(/\/presentation\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        return `https://docs.google.com/presentation/d/${match[1]}/preview`;
      }

      // Handle open?id=...
      match = cleanUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        return `https://drive.google.com/file/d/${match[1]}/preview`;
      }
    }
    return null;
  };
  const [activeTab, setActiveTab] = useState<'all' | 'materi' | 'tugas'>('all');
  const [previewTaskItem, setPreviewTaskItem] = useState<Material | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [formData, setFormData] = useState({
    subjectId: '',
    title: '',
    description: '',
    link: '',
    videoLink: '',
    infographic: '',
    taskTitle: '',
    taskLink: '',
    taskFile: '',
    isVisible: true,
    createdAt: ''
  });

  const isTeacher = currentUser?.role === 'guru' || currentUser?.role === 'admin';
  console.log("MaterialsView RENDER - CurrentUser:", currentUser, "isTeacher:", isTeacher);

  useEffect(() => {
    const getFormattedDate = (dateStr?: string) => {
      const d = dateStr ? new Date(dateStr) : new Date();
      const tzOffset = d.getTimezoneOffset() * 60000;
      return (new Date(d.getTime() - tzOffset)).toISOString().slice(0, 10);
    };

    if (editingMaterial) {
      setFormData({
        subjectId: editingMaterial.subjectId,
        title: editingMaterial.title,
        description: editingMaterial.description || '',
        link: editingMaterial.link,
        videoLink: editingMaterial.videoLink || '',
        infographic: editingMaterial.infographic || '',
        taskTitle: editingMaterial.taskTitle || '',
        taskLink: editingMaterial.taskLink || '',
        taskFile: editingMaterial.taskFile || '',
        isVisible: editingMaterial.isVisible,
        createdAt: getFormattedDate(editingMaterial.createdAt)
      });
    } else {
      setFormData({
        subjectId: subjects[0]?.id || '',
        title: '',
        description: '',
        link: '',
        videoLink: '',
        infographic: '',
        taskTitle: '',
        taskLink: '',
        taskFile: '',
        isVisible: true,
        createdAt: getFormattedDate()
      });
    }
  }, [editingMaterial, subjects]);

  const filteredMaterials = materials.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (m.description?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (m.taskTitle?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSubject = selectedSubject === 'all' || m.subjectId === selectedSubject;
    const isVisibleToStudent = isTeacher || m.isVisible;

    const hasTask = !!(m.taskLink || m.taskFile || m.taskTitle);
    let matchesTab = true;
    if (activeTab === 'tugas') {
      matchesTab = hasTask;
    } else if (activeTab === 'materi') {
      matchesTab = !hasTask;
    }

    return matchesSearch && matchesSubject && isVisibleToStudent && matchesTab;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subjectId || !formData.title || !formData.link) {
      onShowNotification('Mohon lengkapi data materi', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const materialDate = formData.createdAt ? new Date(formData.createdAt).toISOString() : new Date().toISOString();
      if (editingMaterial) {
        await onUpdateMaterial({
          ...editingMaterial,
          subjectId: formData.subjectId,
          title: formData.title,
          description: formData.description,
          link: formData.link,
          videoLink: formData.videoLink,
          infographic: formData.infographic,
          taskTitle: formData.taskTitle,
          taskLink: formData.taskLink,
          taskFile: formData.taskFile,
          isVisible: formData.isVisible,
          createdAt: materialDate
        });
        onShowNotification('Materi berhasil diperbarui', 'success');
      } else {
        await onAddMaterial({
          classId,
          subjectId: formData.subjectId,
          title: formData.title,
          description: formData.description,
          link: formData.link,
          videoLink: formData.videoLink,
          infographic: formData.infographic,
          taskTitle: formData.taskTitle,
          taskLink: formData.taskLink,
          taskFile: formData.taskFile,
          isVisible: formData.isVisible,
          createdAt: materialDate
        });
        onShowNotification('Materi berhasil ditambahkan', 'success');
      }
      setIsModalOpen(false);
      setEditingMaterial(null);
    } catch (error) {
      // Error is handled in App.tsx but we catch it here to stop loading
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus materi ini?')) {
      onDeleteMaterial(id);
      onShowNotification('Materi berhasil dihapus', 'success');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Materi Pembelajaran</h2>
          <p className="text-gray-500">Kumpulan link materi pembelajaran yang dibagikan oleh guru.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".xlsx, .xls, .csv" />
          {isTeacher && (
            <>
              <button 
                onClick={handleDownloadTemplate}
                className="flex items-center space-x-2 bg-blue-50 text-blue-600 border border-blue-200 px-4 py-2 rounded-lg hover:bg-blue-100 transition text-sm font-semibold"
                title="Unduh Template Excel"
              >
                <Download size={18} />
                <span>Unduh Template</span>
              </button>
              <button 
                onClick={handleImportClick}
                className="flex items-center space-x-2 bg-amber-50 text-amber-600 border border-amber-200 px-4 py-2 rounded-lg hover:bg-amber-100 transition text-sm font-semibold"
                title="Import Materi dari Excel"
              >
                <Upload size={18} />
                <span>Import Excel</span>
              </button>
            </>
          )}
          <button 
            onClick={handleExportExcel}
            className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition text-sm font-semibold"
            title="Export Materi ke Excel"
          >
            <FileSpreadsheet size={18} />
            <span>Export Excel</span>
          </button>
          {isTeacher && (
            <button 
              onClick={() => { setEditingMaterial(null); setIsModalOpen(true); }}
              className="flex items-center space-x-2 px-4 py-2 bg-[#5AB2FF] text-white rounded-xl hover:bg-[#A0DEFF] transition-all shadow-md font-bold text-sm"
            >
              <Plus size={18} />
              <span>Tambah Materi</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters & Sub-Menu Navigation */}
      <div className="bg-white p-4 rounded-2xl border border-[#CAF4FF] shadow-sm flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'all'
                ? 'bg-white text-gray-800 shadow-sm border border-gray-200'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <BookOpen size={14} />
            <span>Semua ({materials.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('materi')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'materi'
                ? 'bg-white text-gray-800 shadow-sm border border-gray-200'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <FileText size={14} />
            <span>Materi</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tugas')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'tugas'
                ? 'bg-[#5AB2FF] text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <ClipboardList size={14} />
            <span>Tugas & Latihan ({materials.filter(m => m.taskLink || m.taskFile || m.taskTitle).length})</span>
          </button>
        </div>

        <div className="flex-1 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari judul, deskripsi, atau tugas..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-[#5AB2FF] outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <Filter size={18} className="text-gray-400" />
            <select 
              className="border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-[#5AB2FF] bg-white"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
            >
              <option value="all">Semua Mata Pelajaran</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Materials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMaterials.length > 0 ? (
          filteredMaterials.map(material => {
            const subject = subjects.find(s => s.id === material.subjectId);
            const theme = getSubjectTheme(material.subjectId, subject?.name || '');
            const hasTask = !!(material.taskLink || material.taskFile || material.taskTitle);
            
            // Choose icon based on subject name
            let SubjectIcon = BookOpen;
            const subName = (subject?.name || '').toLowerCase();
            if (subName.includes('matematika') || subName.includes('mtk') || subName.includes('hitung')) {
              SubjectIcon = Binary;
            } else if (subName.includes('ipa') || subName.includes('sains') || subName.includes('fisika') || subName.includes('biologi') || subName.includes('kimia') || subName.includes('science')) {
              SubjectIcon = Sparkles;
            } else if (subName.includes('seni') || subName.includes('budaya') || subName.includes('art') || subName.includes('prakarya') || subName.includes('musik')) {
              SubjectIcon = PenTool;
            } else if (subName.includes('olahraga') || subName.includes('pjok') || subName.includes('jasmani') || subName.includes('kesehatan')) {
              SubjectIcon = Award;
            } else if (subName.includes('sejarah') || subName.includes('pkn') || subName.includes('ips') || subName.includes('sosial') || subName.includes('geografi')) {
              SubjectIcon = Globe;
            } else if (subName.includes('agama') || subName.includes('islam') || subName.includes('kristen') || subName.includes('budi')) {
              SubjectIcon = BookMarked;
            } else if (subName.includes('bahasa') || subName.includes('indonesia') || subName.includes('inggris') || subName.includes('english')) {
              SubjectIcon = Layers;
            }

            return (
              <div 
                key={material.id} 
                className={`bg-white rounded-3xl border ${theme.border} overflow-hidden shadow-sm hover:shadow-xl hover:shadow-[#5AB2FF]/5 transition-all duration-300 group transform hover:-translate-y-1 flex flex-col justify-between h-full relative`}
              >
                {/* Accent Top Bar */}
                <div className={`h-[6px] w-full ${theme.banner}`} />
                
                {/* Card Content */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div className="flex gap-4">
                  <div className="flex-1 space-y-4">
                    {/* Header: Subject & Actions */}
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold border ${theme.badge} uppercase tracking-wider shadow-sm transition-colors duration-200 w-max`}>
                            <SubjectIcon size={12} className={theme.text} />
                            {subject?.name || 'Mata Pelajaran'}
                          </span>
                          {hasTask && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white shadow-sm uppercase tracking-wide">
                              <ClipboardList size={11} />
                              Ada Tugas
                            </span>
                          )}
                        </div>
                        {!material.isVisible && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200 uppercase tracking-wide w-max">
                            <EyeOff size={10} />
                            Draft (Siswa Sembunyi)
                          </span>
                        )}
                      </div>

                      {isTeacher && (
                        <div className="flex items-center space-x-1 bg-slate-50 p-1 rounded-xl border border-slate-100 shadow-sm opacity-90 hover:opacity-100 transition-all duration-200">
                          <button 
                            onClick={() => onUpdateMaterial({...material, isVisible: !material.isVisible})}
                            className={`p-1.5 rounded-lg transition-all duration-200 ${material.isVisible ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'}`}
                            title={material.isVisible ? 'Sembunyikan dari siswa' : 'Tampilkan ke siswa'}
                          >
                            {material.isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                          </button>
                          <button 
                            onClick={() => { setEditingMaterial(material); setIsModalOpen(true); }}
                            className="p-1.5 text-slate-500 hover:text-[#5AB2FF] hover:bg-[#5AB2FF]/10 rounded-lg transition-all duration-200"
                            title="Edit"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button 
                            onClick={() => handleDelete(material.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all duration-200"
                            title="Hapus"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {/* Title and Description */}
                    <div className="space-y-2">
                      <h3 className={`text-base font-extrabold text-[#2D3142] leading-snug group-hover:${theme.text} transition-colors duration-200 line-clamp-2`}>
                        {material.title}
                      </h3>
                      {material.description ? (
                        <p className="text-xs text-slate-500 line-clamp-4 leading-relaxed font-normal whitespace-pre-wrap">
                          {material.description}
                        </p>
                      ) : (
                        <p className="text-xs text-slate-300 italic font-light">Tidak ada deskripsi tambahan</p>
                      )}

                      {/* Quick Task Highlight box if task attached */}
                      {hasTask && (
                        <div className="bg-amber-50/80 p-2.5 rounded-xl border border-amber-200/80 flex items-center justify-between text-xs text-amber-900 font-medium mt-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <ClipboardList size={15} className="text-amber-600 shrink-0" />
                            <span className="truncate font-extrabold text-[11px] text-amber-800">
                              {material.taskTitle || "Tugas / Latihan Siswa"}
                            </span>
                          </div>
                          <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-md font-bold shrink-0 ml-2">
                            {material.taskFile ? (material.taskFile.startsWith('data:application/pdf') ? 'PDF' : 'Foto/Base64') : 'Link'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Thumbnail */}
                  {material.infographic && (
                    <div className="w-32 shrink-0 self-start mt-1">
                      <img 
                        src={material.infographic} 
                        alt="Poster" 
                        className="w-full h-auto rounded-lg object-cover shadow-sm border border-slate-100" 
                      />
                    </div>
                  )}
                </div>

                  {/* Footer Stats & Actions */}
                  <div className="pt-4 mt-5 border-t border-slate-100/80 flex items-center justify-between gap-2">
                    <div className="flex items-center text-[11px] text-slate-400 font-bold bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 shrink-0">
                      <Calendar size={12} className="mr-1 text-slate-400" />
                      <span>{new Date(material.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                    </div>
                    
                    <div className="flex gap-1.5 flex-wrap justify-end">
                      {/* Tombol Tugas */}
                      {hasTask ? (
                        <button
                          type="button"
                          onClick={() => setPreviewTaskItem(material)}
                          className="flex items-center gap-1.5 px-3 h-8 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-[11px] rounded-lg shadow-sm hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
                          title="Buka & Kerjakan Tugas"
                        >
                          <ClipboardList size={13} />
                          <span>Tugas</span>
                        </button>
                      ) : (
                        isTeacher && (
                          <button
                            type="button"
                            onClick={() => { setEditingMaterial(material); setIsModalOpen(true); }}
                            className="flex items-center gap-1 px-2.5 h-8 bg-slate-50 hover:bg-amber-50 text-slate-500 hover:text-amber-600 border border-slate-200 font-bold text-[11px] rounded-lg transition-all cursor-pointer"
                            title="Tambah Tugas ke Materi ini"
                          >
                            <Plus size={12} />
                            <span>Tugas</span>
                          </button>
                        )
                      )}

                      {material.infographic && (
                        <button 
                          onClick={() => setPreviewItem({
                            title: material.title,
                            url: material.infographic || '',
                            type: 'infographic'
                          })}
                          className="flex items-center gap-1 px-2.5 h-8 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-100 font-extrabold text-[11px] rounded-lg shadow-sm hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
                          title="Lihat Poster / Infografis"
                        >
                          <ImageIcon size={12} className="text-indigo-500" />
                          <span>Poster</span>
                        </button>
                      )}
                      {material.videoLink && (
                        <button 
                          onClick={() => setPreviewItem({
                            title: material.title,
                            url: material.videoLink || '',
                            type: 'video'
                          })}
                          className="flex items-center justify-center w-8 h-8 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 border border-red-100 shadow-sm cursor-pointer"
                          title="Tonton Video Edukasi"
                        >
                          <Youtube size={16} className="animate-pulse" />
                        </button>
                      )}
                      <button 
                        onClick={() => setPreviewItem({
                          title: material.title,
                          url: material.link,
                          type: 'material'
                        })}
                        className={`flex items-center gap-1.5 px-3 h-8 ${theme.badge} border font-extrabold text-[11px] rounded-lg shadow-sm hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer`}
                        title="Buka Materi / File Selengkapnya"
                      >
                        <ExternalLink size={12} />
                        <span>Materi</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-400 bg-white rounded-3xl border-2 border-dashed border-gray-100">
            <FileText size={48} className="mb-4 opacity-20" />
            <p className="text-lg font-medium">Belum ada materi yang tersedia</p>
            <p className="text-sm">Silakan hubungi guru untuk informasi lebih lanjut.</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className={`fixed inset-0 ${currentUser?.role !== 'siswa' ? 'lg:pl-72' : ''} z-[150] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm transition-all duration-300`}>
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-scale-in max-h-[85vh] md:max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-[#CAF4FF]/30 shrink-0">
              <h3 className="font-bold text-lg text-gray-800">
                {editingMaterial ? 'Edit Materi' : 'Tambah Materi Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden min-h-0">
              <div className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mata Pelajaran</label>
                  <select 
                    required
                    className="w-full border border-gray-200 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-[#5AB2FF] outline-none bg-white"
                    value={formData.subjectId}
                    onChange={e => setFormData({...formData, subjectId: e.target.value})}
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tanggal</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      required
                      type="date" 
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#5AB2FF] outline-none bg-white"
                      value={formData.createdAt}
                      onChange={e => setFormData({...formData, createdAt: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Judul Materi</label>
                  <input 
                    required
                    type="text" 
                    className="w-full border border-gray-200 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-[#5AB2FF] outline-none"
                    placeholder="Contoh: Bab 1 - Bilangan Bulat"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Deskripsi (Opsional)</label>
                  <textarea 
                    className="w-full border border-gray-200 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-[#5AB2FF] outline-none h-24 resize-none"
                    placeholder="Penjelasan singkat tentang materi..."
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Link Materi (URL)</label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      required
                      type="url" 
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#5AB2FF] outline-none"
                      placeholder="https://example.com/materi"
                      value={formData.link}
                      onChange={e => setFormData({...formData, link: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Link Video Youtube (Opsional)</label>
                  <div className="relative">
                    <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      type="url" 
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 outline-none"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={formData.videoLink || ''}
                      onChange={e => setFormData({...formData, videoLink: e.target.value})}
                    />
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wide">
                      Poster / Infografis Materi (Opsional)
                    </label>
                    {formData.infographic && (
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, infographic: ''})}
                        className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                      >
                        Hapus Poster
                      </button>
                    )}
                  </div>

                  {formData.infographic ? (
                    <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-white p-2 flex items-center gap-3">
                      {formData.infographic.startsWith('data:image/') ? (
                        <img 
                          src={formData.infographic} 
                          alt="Pratinjau Poster" 
                          className="w-16 h-16 object-cover rounded border border-gray-100"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 flex items-center justify-center rounded border border-indigo-100 shrink-0">
                          <ImageIcon size={24} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-extrabold text-slate-800 truncate">Poster Terpasang</p>
                        <p className="text-[10px] text-slate-400 truncate leading-tight">
                          {formData.infographic.startsWith('data:image/') 
                            ? 'Format gambar (Sangat ringan & tajam)' 
                            : formData.infographic}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* URL Option */}
                      <div className="relative flex items-center">
                        <ImageIcon className="absolute left-3 text-gray-400" size={16} />
                        <input 
                          type="url" 
                          className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#5AB2FF] outline-none"
                          placeholder="Link Gambar Poster (URL)..."
                          value={formData.infographic}
                          onChange={e => setFormData({...formData, infographic: e.target.value})}
                        />
                      </div>
                      
                      {/* File Upload Option */}
                      <label className="flex items-center justify-center gap-2 cursor-pointer border border-dashed border-gray-300 hover:border-[#5AB2FF] rounded-xl py-2 px-3 bg-white hover:bg-slate-50 transition-colors text-xs font-bold text-slate-600">
                        <Upload size={14} className="text-slate-400" />
                        <span>Unggah Foto Poster</span>
                        <input 
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                const base64 = await compressImageToBase64(file);
                                setFormData({...formData, infographic: base64});
                              } catch (err) {
                                onShowNotification('Gagal memproses gambar. Coba format lain.', 'error');
                              }
                            }
                          }}
                        />
                      </label>
                    </div>
                  )}
                </div>
                {/* Section Tugas & Latihan Siswa */}
                <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200/80 space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="flex items-center gap-1.5 text-xs font-extrabold text-amber-900 uppercase tracking-wide">
                      <ClipboardList size={15} className="text-amber-600" />
                      <span>Sematkan Tugas & Latihan Siswa (Opsional)</span>
                    </label>
                    {(formData.taskLink || formData.taskFile || formData.taskTitle) && (
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, taskTitle: '', taskLink: '', taskFile: ''})}
                        className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                      >
                        Hapus Tugas
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-amber-800 uppercase mb-1">
                      Judul / Petunjuk Soal Tugas
                    </label>
                    <input 
                      type="text" 
                      className="w-full border border-amber-200 p-2.5 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-400 outline-none bg-white"
                      placeholder="Contoh: Kerjakan Soal Latihan Bab 1 Hal 20..."
                      value={formData.taskTitle}
                      onChange={e => setFormData({...formData, taskTitle: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-amber-800 uppercase mb-1">
                      1. Link Tautan Tugas (Google Form, Drive, Quizizz, Website)
                    </label>
                    <div className="relative">
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500" size={15} />
                      <input 
                        type="url" 
                        className="w-full pl-9 pr-3 py-2 border border-amber-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-400 outline-none bg-white"
                        placeholder="https://forms.google.com/... atau link latihan online"
                        value={formData.taskLink}
                        onChange={e => setFormData({...formData, taskLink: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-amber-800 uppercase mb-1">
                      2. Unggah File / Berkas Tugas (Foto / PDF - Disimpan Base64)
                    </label>
                    
                    {formData.taskFile ? (
                      <div className="rounded-xl border border-amber-300 bg-white p-3 flex items-center justify-between gap-3 shadow-sm">
                        <div className="flex items-center gap-3 min-w-0">
                          {formData.taskFile.startsWith('data:image/') ? (
                            <img 
                              src={formData.taskFile} 
                              alt="Foto Tugas" 
                              className="w-12 h-12 object-cover rounded-lg border border-amber-200 shrink-0" 
                            />
                          ) : (
                            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-lg border border-red-200 flex items-center justify-center shrink-0 font-extrabold text-xs">
                              PDF
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-extrabold text-gray-800 truncate">
                              {formData.taskFile.startsWith('data:image/') ? 'Foto Berkas Tugas Terlampir' : 'Dokumen PDF Tugas Terlampir'}
                            </p>
                            <p className="text-[10px] text-amber-600 font-medium truncate">
                              Tersimpan rapi dalam format string Base64
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormData({...formData, taskFile: ''})}
                          className="px-2.5 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors shrink-0 cursor-pointer"
                        >
                          Ganti / Hapus
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center gap-2 cursor-pointer border-2 border-dashed border-amber-300 hover:border-amber-500 rounded-xl py-3 px-4 bg-white hover:bg-amber-50/50 transition-all text-xs font-bold text-amber-800 shadow-sm">
                        <Paperclip size={16} className="text-amber-600" />
                        <span>Pilih Foto atau Dokumen PDF Tugas</span>
                        <input 
                          type="file"
                          accept="image/*, application/pdf, .pdf"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                const base64 = await readTaskFileToBase64(file);
                                setFormData({...formData, taskFile: base64});
                                onShowNotification('File tugas berhasil diunggah (Base64)!', 'success');
                              } catch (err) {
                                onShowNotification('Gagal membaca file tugas. Coba file lain.', 'error');
                              }
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <label className="text-sm font-bold text-gray-700">Tampilkan ke Siswa</label>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, isVisible: !formData.isVisible})}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${formData.isVisible ? 'bg-[#5AB2FF]' : 'bg-gray-200'}`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${formData.isVisible ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>
              <div className="p-4 bg-gray-50 border-t border-gray-100 flex space-x-3 shrink-0 pb-safe">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors bg-white cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 bg-[#5AB2FF] text-white rounded-xl text-sm font-bold hover:bg-[#A0DEFF] transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>{editingMaterial ? 'Simpan Perubahan' : 'Tambah Materi'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pratinjau Tugas Modal */}
      {previewTaskItem && (
        <div className={`fixed inset-0 ${currentUser?.role !== 'siswa' ? 'lg:pl-72' : ''} z-[150] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-md animate-fade-in transition-all duration-300`}>
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-scale-in border border-amber-200">
            {/* Modal Header */}
            <div className="p-5 flex justify-between items-center bg-gradient-to-r from-amber-500 to-orange-500 text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-sm text-white">
                  <ClipboardList size={22} />
                </div>
                <div>
                  <span className="text-[10px] text-amber-100 font-extrabold uppercase tracking-wider block">
                    Tugas & Latihan Siswa
                  </span>
                  <h3 className="font-extrabold text-base md:text-lg text-white line-clamp-1">
                    {previewTaskItem.title}
                  </h3>
                </div>
              </div>
              <button 
                onClick={() => setPreviewTaskItem(null)} 
                className="p-1.5 hover:bg-white/20 rounded-full transition-colors text-white cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1 bg-amber-50/20">
              {/* Task Title & Instruction */}
              <div className="bg-white p-4 rounded-2xl border border-amber-200/80 shadow-sm space-y-2">
                <div className="flex items-center gap-2 text-amber-700 font-extrabold text-xs uppercase tracking-wider">
                  <CheckSquare size={16} />
                  <span>Petunjuk / Instruksi Tugas</span>
                </div>
                <h4 className="text-base font-extrabold text-gray-800">
                  {previewTaskItem.taskTitle || "Selesaikan tugas berikut sesuai instruksi dari guru."}
                </h4>
                {previewTaskItem.description && (
                  <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap pt-1 border-t border-gray-100 mt-2">
                    {previewTaskItem.description}
                  </p>
                )}
              </div>

              {/* Task Link Attachment */}
              {previewTaskItem.taskLink && (
                <div className="bg-white p-4 rounded-2xl border border-amber-200/80 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-gray-700 flex items-center gap-1.5">
                      <LinkIcon size={14} className="text-amber-600" />
                      Link Tautan Tugas / Form
                    </span>
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md font-bold">
                      Online Form / Link
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate font-mono bg-slate-50 p-2 rounded-lg border border-slate-200">
                    {previewTaskItem.taskLink}
                  </p>
                  <a
                    href={previewTaskItem.taskLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    <ExternalLink size={15} />
                    <span>Buka Link Tugas di Tab Baru</span>
                  </a>
                </div>
              )}

              {/* Task File Attachment (Base64 Photo or PDF) */}
              {previewTaskItem.taskFile && (
                <div className="bg-white p-4 rounded-2xl border border-amber-200/80 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-gray-700 flex items-center gap-1.5">
                      <Paperclip size={14} className="text-amber-600" />
                      Berkas Lampiran Tugas (Base64)
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold">
                      {previewTaskItem.taskFile.startsWith('data:application/pdf') ? 'Dokumen PDF' : 'Foto Gambar'}
                    </span>
                  </div>

                  {/* Render Image or PDF Preview */}
                  {previewTaskItem.taskFile.startsWith('data:image/') ? (
                    <div className="space-y-3">
                      <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-900 max-h-80 flex items-center justify-center">
                        <img 
                          src={previewTaskItem.taskFile} 
                          alt="Foto Tugas" 
                          className="max-h-80 object-contain w-full"
                        />
                      </div>
                      <div className="flex gap-2">
                        <a 
                          href={previewTaskItem.taskFile}
                          download={`Tugas_${previewTaskItem.title.replace(/\s+/g, '_')}.jpg`}
                          className="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow transition-all cursor-pointer"
                        >
                          <Download size={14} />
                          <span>Unduh Foto Tugas</span>
                        </a>
                      </div>
                    </div>
                  ) : previewTaskItem.taskFile.startsWith('data:application/pdf') ? (
                    <div className="space-y-3">
                      <iframe 
                        src={previewTaskItem.taskFile}
                        title="Dokumen PDF Tugas"
                        className="w-full h-80 rounded-xl border border-slate-200"
                      />
                      <a 
                        href={previewTaskItem.taskFile}
                        download={`Tugas_${previewTaskItem.title.replace(/\s+/g, '_')}.pdf`}
                        className="flex items-center justify-center gap-2 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer"
                      >
                        <Download size={14} />
                        <span>Unduh Dokumen PDF Tugas</span>
                      </a>
                    </div>
                  ) : (
                    <a 
                      href={previewTaskItem.taskFile}
                      download={`Tugas_${previewTaskItem.title.replace(/\s+/g, '_')}`}
                      className="flex items-center justify-center gap-2 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer"
                    >
                      <Download size={14} />
                      <span>Unduh File Tugas</span>
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end shrink-0">
              <button 
                type="button"
                onClick={() => setPreviewTaskItem(null)}
                className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewItem && (
        <div className={`fixed inset-0 ${currentUser?.role !== 'siswa' ? 'lg:pl-72' : ''} z-[150] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-md animate-fade-in transition-all duration-300`}>
          <div className="bg-slate-900 text-white rounded-3xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col h-[85vh] animate-scale-in border border-slate-800">
            {/* Modal Header */}
            <div className="p-4 md:p-5 flex justify-between items-center bg-slate-950/80 border-b border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${
                  previewItem.type === 'video' 
                    ? 'bg-red-500/10 text-red-500' 
                    : previewItem.type === 'infographic'
                    ? 'bg-indigo-500/10 text-indigo-400'
                    : 'bg-sky-500/10 text-sky-400'
                }`}>
                  {previewItem.type === 'video' ? <Youtube size={20} /> : previewItem.type === 'infographic' ? <ImageIcon size={20} /> : <FileText size={20} />}
                </div>
                <div className="text-left">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Pratinjau {previewItem.type === 'video' ? 'Video' : previewItem.type === 'infographic' ? 'Poster' : 'Materi'}
                  </span>
                  <h3 className="font-extrabold text-sm md:text-base text-slate-200 line-clamp-1 max-w-[200px] sm:max-w-[400px] md:max-w-[600px]">
                    {previewItem.title}
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {previewItem.type === 'infographic' && (
                  <a 
                    href={previewItem.url}
                    download={`Poster_${previewItem.title.replace(/\s+/g, '_')}.jpg`}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-xs md:text-sm font-bold text-white rounded-xl transition-all active:scale-95 duration-200 shrink-0 cursor-pointer"
                  >
                    <Download size={14} />
                    <span className="hidden sm:inline">Unduh Poster</span>
                  </a>
                )}
                <button 
                  onClick={() => setPreviewItem(null)} 
                  className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white cursor-pointer shrink-0"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Content / Preview Area */}
            <div className="flex-1 bg-slate-950 flex flex-col items-center justify-center relative p-4 overflow-auto">
              {previewItem.type === 'video' ? (
                (() => {
                  const embedUrl = getYoutubeEmbedUrl(previewItem.url);
                  if (embedUrl) {
                    return (
                      <div className="w-full max-w-4xl aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black border border-slate-800">
                        <iframe 
                          src={embedUrl}
                          title={previewItem.title}
                          className="w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                        />
                      </div>
                    );
                  } else {
                    return (
                      <div className="text-center p-6 space-y-4">
                        <p className="text-red-400 font-bold">Format link video tidak dikenali sebagai YouTube Embed</p>
                        <a 
                          href={previewItem.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-all shadow-md"
                        >
                          <Youtube size={18} />
                          <span>Buka Langsung di Youtube</span>
                        </a>
                      </div>
                    );
                  }
                })()
              ) : previewItem.type === 'infographic' ? (
                <div 
                  className="w-full h-full flex flex-col relative select-none bg-slate-950/40"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUpOrLeave}
                  onMouseLeave={handleMouseUpOrLeave}
                >
                  {/* Floating Zoom & Reset Control Bar */}
                  <div className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800/80 px-5 py-3 flex items-center justify-center gap-4 w-full shadow-md z-20">
                    <button 
                      type="button"
                      onClick={() => setZoomScale(prev => Math.max(0.5, prev - 0.25))}
                      disabled={zoomScale <= 0.5}
                      className="p-1.5 hover:bg-slate-800 rounded-full text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
                      title="Zoom Out"
                    >
                      <ZoomOut size={16} />
                    </button>
                    <span className="text-xs font-mono font-extrabold text-slate-300 select-none min-w-[40px] text-center tracking-tight">
                      {Math.round(zoomScale * 100)}%
                    </span>
                    <button 
                      type="button"
                      onClick={() => setZoomScale(prev => Math.min(4, prev + 0.25))}
                      disabled={zoomScale >= 4}
                      className="p-1.5 hover:bg-slate-800 rounded-full text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
                      title="Zoom In"
                    >
                      <ZoomIn size={16} />
                    </button>
                    <div className="w-px h-5 bg-slate-800" />
                    <button 
                      type="button"
                      onClick={() => {
                        setZoomScale(1);
                        setPan({ x: 0, y: 0 });
                      }}
                      disabled={zoomScale === 1 && pan.x === 0 && pan.y === 0}
                      className="p-1.5 hover:bg-slate-800 rounded-full text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
                      title="Reset Tampilan"
                    >
                      <RotateCcw size={14} />
                    </button>
                  </div>

                  {/* Interactive Panning Canvas */}
                  <div 
                    className={`w-full h-full flex items-center justify-center ${
                      zoomScale > 1 ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : ''
                    }`}
                  >
                    <div
                      style={{
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomScale})`,
                        transformOrigin: 'center center',
                        transition: isPanning ? 'none' : 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                      className="max-w-full max-h-[70vh] flex items-center justify-center"
                    >
                      <img 
                        src={previewItem.url} 
                        alt={previewItem.title} 
                        className="max-w-full max-h-[68vh] object-contain rounded-xl shadow-2xl border border-slate-800/80 bg-slate-900"
                        referrerPolicy="no-referrer"
                        draggable={false}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                (() => {
                  const driveEmbedUrl = getGoogleDriveEmbedUrl(previewItem.url);
                  const isDrive = !!driveEmbedUrl;
                  
                  return (
                    <div className="w-full h-full flex flex-col">
                      {!isDrive && (
                        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-center text-[11px] text-amber-200">
                          💡 Beberapa materi/file pelajaran dilindungi keamanan oleh penyedianya dan mungkin tidak dapat dimuat langsung di sini. Jika layar di bawah kosong, silakan klik tombol <strong>"Buka di Tab Baru"</strong> di sudut kanan atas.
                        </div>
                      )}
                      <iframe 
                        src={driveEmbedUrl || previewItem.url}
                        title={previewItem.title}
                        className="w-full h-full border-0 bg-white"
                        {...(!isDrive ? { sandbox: "allow-same-origin allow-scripts allow-forms allow-popups" } : {
                          allow: "autoplay",
                          sandbox: "allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
                        })}
                      />
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialsView;
