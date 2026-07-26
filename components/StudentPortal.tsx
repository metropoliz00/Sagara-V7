import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { Student, GradeRecord, LiaisonLog, AgendaItem, Material, BehaviorLog, PermissionRequest, KarakterAssessment, KARAKTER_INDICATORS, KarakterIndicatorKey, LearningDocumentation, BookLoan, BookInventory, ScheduleItem, SchoolProfileData, Graduate, EmploymentLink } from '../types';
import { MOCK_SUBJECTS, CALENDAR_CODES, PREFILLED_CALENDAR_2025, HOLIDAY_DESCRIPTIONS_2025_2026, WEEKDAYS } from '../constants';
import { 
  Search, Filter, User, Calendar, CalendarDays, Send, FileText, CheckCircle, XCircle, 
  BookOpen, Book, LayoutDashboard, Clock,
  Star, HeartHandshake, ListTodo,
  MapPin, CheckSquare, X, Medal, Heart, MessageCircle, Trophy,
  Edit, Save, Loader2, PlusCircle, History, MessageSquare,
  ClipboardList, Bell, Activity, Sparkles, GraduationCap, ChevronDown, School, AlertTriangle,
  Camera, ChevronLeft, ChevronRight, Link2, Download,
  Sun, Moon, CloudSun, Sunset, Coffee, Youtube, Printer, ExternalLink,
  Calculator, Globe, Compass, Music, Image as ImageIcon, ZoomIn, ZoomOut, RotateCcw
} from 'lucide-react';
import { apiService } from '../services/apiService';
import { useModal } from '../context/ModalContext';
import { getLocalISODate } from '../utils/dateUtils';
import SumatifView from './SumatifView';
import ManualBookView from './ManualBookView';
import MitigasiBencanaView from './MitigasiBencanaView';
import { ContentModal } from './ContentModal';
import { pdfjs, Document, Page } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;


const formatWaUrl = (phone?: string) => {
  if (!phone) return '#';
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  } else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  }
  return `https://wa.me/${cleaned}`;
};

function PDFViewer({ fileUrl }: { fileUrl: string }) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [error, setError] = useState<string | null>(null);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPageNumber(1);
    setError(null);
  }

  function onDocumentLoadError(err: Error) {
    console.error("PDF load error:", err);
    setError(err.message || "Gagal memuat dokumen PDF.");
  }

  return (
    <div className="flex flex-col items-center h-full w-full bg-slate-900 text-white overflow-hidden relative">
      {/* PDF Controls Header matching screenshot */}
      <div className="flex items-center justify-between w-full px-4 py-3 bg-slate-950 border-b border-slate-800 z-20 text-sm">
        <div className="flex items-center space-x-3">
          <div className="px-3 py-1 bg-slate-700/80 rounded-lg text-xs font-semibold text-white shadow-sm">
            Halaman {pageNumber} dari {numPages || '...'}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setScale(prev => Math.max(prev - 0.2, 0.5))}
            className="w-8 h-8 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center justify-center text-xs font-bold transition-all cursor-pointer shadow"
            title="Perkecil (-)"
          >
            -
          </button>
          <span className="text-xs font-mono px-2 py-1 bg-slate-800 rounded text-slate-200">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale(prev => Math.min(prev + 0.2, 2.5))}
            className="w-8 h-8 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center justify-center text-xs font-bold transition-all cursor-pointer shadow"
            title="Perbesar (+)"
          >
            +
          </button>
        </div>
      </div>

      {/* PDF View Container with Floating Navigation Arrows */}
      <div className="flex-1 w-full overflow-auto flex items-center justify-center p-6 bg-slate-900 relative">
        {/* Previous Page Floating Button */}
        {!error && numPages && numPages > 1 && (
          <button
            onClick={() => setPageNumber(prev => Math.max(prev - 1, 1))}
            disabled={pageNumber <= 1}
            className="absolute left-6 z-10 w-12 h-12 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-xl transition-all cursor-pointer"
            title="Halaman Sebelumnya"
          >
            <ChevronLeft size={24} />
          </button>
        )}

        {error ? (
          <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 max-w-md">
            <p className="text-red-400 font-bold">{error}</p>
            <p className="text-xs text-slate-400">File PDF mungkin dibatasi CORS atau tidak valid. Anda dapat membukanya melalui tombol tab baru.</p>
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow"
            >
              Buka PDF di Tab Baru
            </a>
          </div>
        ) : (
          <div className="shadow-2xl rounded-xl overflow-hidden bg-white border border-slate-700 p-2 my-auto">
            <Document
              file={fileUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="flex items-center justify-center p-16 text-slate-500 space-x-2">
                  <Loader2 className="animate-spin text-blue-500" size={28} />
                  <span className="text-sm font-medium">Memuat Halaman...</span>
                </div>
              }
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                className="bg-white"
              />
            </Document>
          </div>
        )}

        {/* Next Page Floating Button */}
        {!error && numPages && numPages > 1 && (
          <button
            onClick={() => setPageNumber(prev => Math.min(prev + 1, numPages || prev))}
            disabled={numPages !== null && pageNumber >= numPages}
            className="absolute right-6 z-10 w-12 h-12 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-xl transition-all cursor-pointer"
            title="Halaman Selanjutnya"
          >
            <ChevronRight size={24} />
          </button>
        )}
      </div>
    </div>
  );
}

interface StudentPortalProps {
  student: Student;
  allAttendance: any[];
  grades: GradeRecord[];
  liaisonLogs: LiaisonLog[];
  agendas: AgendaItem[];
  behaviorLogs: BehaviorLog[];
  permissionRequests: PermissionRequest[];
  karakterAssessments: KarakterAssessment[];
  onSaveLiaison: (log: Omit<LiaisonLog, 'id'>) => Promise<void>;
  onSavePermission: (date: string, records: any[]) => Promise<void>;
  onSaveKarakter: (studentId: string, assessment: Omit<KarakterAssessment, 'studentId' | 'classId'>) => Promise<void>;
  onUpdateStudent: (student: Student) => Promise<void>;
  learningDocumentation?: LearningDocumentation[];
  bookLoans: BookLoan[];
  materials?: Material[];
  schoolProfile?: SchoolProfileData;
  employmentLinks?: EmploymentLink[];
}

type PortalTab = 'dashboard' | 'attendance' | 'liaison' | 'profile' | 'character' | 'materi' | 'sumatif' | 'schedule' | 'manual_book' | 'kelulusan' | 'mitigasi';

const SUBJECT_COLORS: { [key: string]: string } = {
  'default': 'bg-gray-100 text-gray-700 border-gray-200',
  'PAI': 'bg-green-100 text-green-800 border-green-200',
  'Pend. Pancasila': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Bahasa Indonesia': 'bg-blue-100 text-blue-800 border-blue-200',
  'Matematika': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'IPAS': 'bg-slate-100 text-slate-800 border-slate-200',
  'Seni dan Budaya': 'bg-purple-100 text-purple-800 border-purple-200',
  'PJOK': 'bg-cyan-100 text-cyan-800 border-cyan-200',
  'Bahasa Jawa': 'bg-orange-100 text-orange-800 border-orange-200',
  'Bahasa Inggris': 'bg-rose-100 text-rose-800 border-rose-200',
  'KKA': 'bg-lime-100 text-lime-800 border-lime-200',
  'Upacara': 'bg-red-100 text-red-800 border-red-200',
  'Pembiasaan': 'bg-sky-100 text-sky-800 border-sky-200',
  'Ko-Kurikuler': 'bg-teal-100 text-teal-800 border-teal-200',
  'Literasi/Numerasi': 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',
  'Istirahat': 'bg-slate-600 text-white border-slate-700',
};

const SUBJECT_DECORATIONS: {
  [key: string]: {
    gradient: string;
    borderColor: string;
    shadow: string;
    textColor: string;
    subtitleColor: string;
    badgeBg: string;
    icon: any;
    accentColor: string;
    emoji: string;
  }
} = {
  'pai': {
    gradient: 'from-emerald-500/10 to-teal-500/5 hover:from-emerald-500/20 hover:to-teal-500/10',
    borderColor: 'border-emerald-100 hover:border-emerald-300',
    shadow: 'hover:shadow-emerald-100',
    textColor: 'text-emerald-950',
    subtitleColor: 'text-emerald-800/80',
    badgeBg: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    icon: HeartHandshake,
    accentColor: 'text-emerald-600 bg-white shadow-sm border border-emerald-100',
    emoji: '🕌'
  },
  'pancasila': {
    gradient: 'from-rose-500/10 to-amber-500/5 hover:from-rose-500/20 hover:to-amber-500/10',
    borderColor: 'border-rose-100 hover:border-rose-300',
    shadow: 'hover:shadow-rose-100',
    textColor: 'text-rose-955',
    subtitleColor: 'text-rose-800/80',
    badgeBg: 'bg-rose-100 text-rose-800 border border-rose-200',
    icon: Medal,
    accentColor: 'text-rose-600 bg-white shadow-sm border border-rose-100',
    emoji: '🦅'
  },
  'indo': {
    gradient: 'from-blue-500/10 to-sky-500/5 hover:from-blue-500/20 hover:to-sky-500/10',
    borderColor: 'border-blue-100 hover:border-blue-300',
    shadow: 'hover:shadow-blue-100',
    textColor: 'text-blue-950',
    subtitleColor: 'text-blue-800/80',
    badgeBg: 'bg-blue-100 text-blue-800 border border-blue-200',
    icon: BookOpen,
    accentColor: 'text-blue-600 bg-white shadow-sm border border-blue-100',
    emoji: '✍️'
  },
  'mat': {
    gradient: 'from-amber-500/10 to-yellow-500/5 hover:from-amber-500/20 hover:to-yellow-500/10',
    borderColor: 'border-amber-100 hover:border-amber-300',
    shadow: 'hover:shadow-amber-100',
    textColor: 'text-amber-950',
    subtitleColor: 'text-amber-800/80',
    badgeBg: 'bg-amber-100 text-amber-900 border border-amber-200',
    icon: Calculator,
    accentColor: 'text-amber-600 bg-white shadow-sm border border-amber-100',
    emoji: '🔢'
  },
  'ipas': {
    gradient: 'from-cyan-500/10 to-teal-500/5 hover:from-cyan-500/20 hover:to-teal-500/10',
    borderColor: 'border-cyan-100 hover:border-cyan-300',
    shadow: 'hover:shadow-cyan-100',
    textColor: 'text-cyan-950',
    subtitleColor: 'text-cyan-800/80',
    badgeBg: 'bg-cyan-100 text-cyan-800 border border-cyan-200',
    icon: Compass,
    accentColor: 'text-cyan-600 bg-white shadow-sm border border-cyan-100',
    emoji: '🧪'
  },
  'senibudaya': {
    gradient: 'from-purple-500/10 to-fuchsia-500/5 hover:from-purple-500/20 hover:to-fuchsia-500/10',
    borderColor: 'border-purple-100 hover:border-purple-300',
    shadow: 'hover:shadow-purple-100',
    textColor: 'text-purple-950',
    subtitleColor: 'text-purple-800/80',
    badgeBg: 'bg-purple-100 text-purple-800 border border-purple-200',
    icon: Music,
    accentColor: 'text-purple-600 bg-white shadow-sm border border-purple-100',
    emoji: '🎨'
  },
  'pjok': {
    gradient: 'from-orange-500/10 to-amber-500/5 hover:from-orange-500/20 hover:to-amber-500/10',
    borderColor: 'border-orange-100 hover:border-orange-300',
    shadow: 'hover:shadow-orange-100',
    textColor: 'text-orange-950',
    subtitleColor: 'text-orange-850/80',
    badgeBg: 'bg-orange-100 text-orange-800 border border-orange-200',
    icon: Trophy,
    accentColor: 'text-orange-600 bg-white shadow-sm border border-orange-100',
    emoji: '⚽'
  },
  'jawa': {
    gradient: 'from-pink-500/10 to-rose-500/5 hover:from-pink-500/20 hover:to-rose-500/10',
    borderColor: 'border-pink-100 hover:border-pink-300',
    shadow: 'hover:shadow-pink-100',
    textColor: 'text-pink-950',
    subtitleColor: 'text-pink-800/80',
    badgeBg: 'bg-pink-100 text-pink-800 border border-pink-200',
    icon: Book,
    accentColor: 'text-pink-600 bg-white shadow-sm border border-pink-100',
    emoji: '🎭'
  },
  'inggris': {
    gradient: 'from-indigo-500/10 to-violet-500/5 hover:from-indigo-500/20 hover:to-violet-500/10',
    borderColor: 'border-indigo-100 hover:border-indigo-300',
    shadow: 'hover:shadow-indigo-100',
    textColor: 'text-indigo-950',
    subtitleColor: 'text-indigo-700/80',
    badgeBg: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
    icon: Globe,
    accentColor: 'text-indigo-600 bg-white shadow-sm border border-indigo-100',
    emoji: '🇬🇧'
  },
  'default': {
    gradient: 'from-slate-500/10 to-slate-500/5 hover:from-slate-500/20 hover:to-slate-500/10',
    borderColor: 'border-slate-100 hover:border-slate-300',
    shadow: 'hover:shadow-slate-100',
    textColor: 'text-slate-800',
    subtitleColor: 'text-slate-600',
    badgeBg: 'bg-slate-100 text-slate-800 border border-slate-200',
    icon: BookOpen,
    accentColor: 'text-slate-600 bg-white shadow-sm border border-slate-100',
    emoji: '📚'
  }
};

const getYoutubeId = (url: string): string | null => {
  if (!url) return null;
  const lowerUrl = url.toLowerCase();
  
  // YouTube Shorts
  if (lowerUrl.includes('/shorts/')) {
    const parts = url.split('/shorts/');
    if (parts.length > 1) {
      const idPart = parts[1].split(/[?&#]/)[0];
      if (idPart && idPart.length === 11) {
        return idPart;
      }
    }
  }
  
  // YouTube watch?v= or &v= or youtu.be
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2] && match[2].length === 11) {
    return match[2];
  }
  
  // Fallback regex for direct string searches/wildcard
  const longRegExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const matchLong = url.match(longRegExp);
  if (matchLong && matchLong[1] && matchLong[1].length === 11) {
    return matchLong[1];
  }

  return null;
};

const getGoogleDriveId = (url: string): string | null => {
  if (!url) return null;
  const lowerUrl = url.toLowerCase();
  
  // Make sure it contains docs.google or drive.google
  if (!lowerUrl.includes('drive.google.com') && !lowerUrl.includes('docs.google.com')) {
    return null;
  }
  
  // Pattern: /file/d/ID
  const fileDMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]{15,})/);
  if (fileDMatch && fileDMatch[1]) {
    return fileDMatch[1];
  }
  
  // Pattern: ?id=ID or &id=ID
  const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]{15,})/);
  if (idMatch && idMatch[1]) {
    return idMatch[1];
  }
  
  // Fallback pattern if ID length differs
  const fallbackFileDMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fallbackFileDMatch && fallbackFileDMatch[1]) {
    return fallbackFileDMatch[1];
  }

  const fallbackIdMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (fallbackIdMatch && fallbackIdMatch[1]) {
    return fallbackIdMatch[1];
  }
  
  return null;
};

const getVimeoId = (url: string): string | null => {
  if (!url) return null;
  if (!url.toLowerCase().includes('vimeo')) return null;
  const match = url.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|showcase\/(?:\d+)\/video\/|)?(\d+)/i);
  if (match && match[1]) {
    return match[1];
  }
  const simpleMatch = url.match(/vimeo\.com\/([0-9]+)/);
  if (simpleMatch && simpleMatch[1]) {
    return simpleMatch[1];
  }
  return null;
};

const isVideoLink = (url: string): boolean => {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  if (
    lowerUrl.endsWith('.mp4') || 
    lowerUrl.includes('.mp4?') ||
    lowerUrl.endsWith('.webm') || 
    lowerUrl.includes('.webm?') ||
    lowerUrl.endsWith('.ogg') || 
    lowerUrl.includes('.ogg?') ||
    lowerUrl.endsWith('.mov') || 
    lowerUrl.includes('.mov?') ||
    lowerUrl.endsWith('.mkv') ||
    lowerUrl.includes('.mkv?')
  ) {
    return true;
  }
  if (
    lowerUrl.includes('youtube.com') || 
    lowerUrl.includes('shorts') ||
    lowerUrl.includes('youtu.be') ||
    lowerUrl.includes('drive.google.com') ||
    lowerUrl.includes('docs.google.com') ||
    lowerUrl.includes('vimeo.com')
  ) {
    return true;
  }
  return false;
};

const getMediaEmbedUrl = (url: string): string | null => {
  if (!url) return null;
  
  const ytId = getYoutubeId(url);
  if (ytId) {
    return `https://www.youtube.com/embed/${ytId}`;
  }
  
  const driveId = getGoogleDriveId(url);
  if (driveId) {
    return `https://drive.google.com/file/d/${driveId}/preview`;
  }
  
  const vimeoId = getVimeoId(url);
  if (vimeoId) {
    return `https://player.vimeo.com/video/${vimeoId}`;
  }
  
  return null;
};

const getYoutubeThumbnail = (url: string): string | null => {
  if (!url) return null;
  const ytId = getYoutubeId(url);
  if (ytId) {
    return `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`;
  }
  return null;
};

const getSubjectColor = (subjectName: string) => {
    if (subjectName.toLowerCase().includes('istirahat')) return SUBJECT_COLORS['Istirahat'];
    return SUBJECT_COLORS[subjectName] || SUBJECT_COLORS['default'];
};

const StudentPortal: React.FC<StudentPortalProps> = ({
  student, allAttendance, grades, liaisonLogs, agendas, behaviorLogs, permissionRequests, karakterAssessments,
  onSaveLiaison, onSavePermission, onSaveKarakter, onUpdateStudent, learningDocumentation = [], bookLoans = [], materials = [], schoolProfile,
  employmentLinks = []
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [inventory, setInventory] = useState<BookInventory[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(true);

  useEffect(() => {
    const fetchInventory = async () => {
      if (!student.classId) return;
      try {
        setLoadingInventory(true);
        const data = await apiService.getBookInventory(student.classId);
        setInventory(data);
      } catch (error) {
        console.error("Failed to fetch inventory in StudentPortal:", error);
      } finally {
        setLoadingInventory(false);
      }
    };
    fetchInventory();
  }, [student.classId, bookLoans]);

  const tabPathMap: Record<string, PortalTab> = {
    '/dashboard-student': 'dashboard',
    '/ringkasan': 'dashboard',
    '/dummy': 'dashboard',
    '/jadwal-pelajaran': 'schedule',
    '/izin-absensi': 'attendance',
    '/materi-belajar': 'materi',
    '/sumatif-siswa': 'sumatif',
    '/buku-penghubung-siswa': 'liaison',
    '/profil-siswa': 'profile',
    '/karakter-siswa': 'character',
    '/buku-panduan-siswa': 'manual_book',
    '/pengumuman-kelulusan': 'kelulusan',
    '/mitigasi-bencana': 'mitigasi'
  };

  const pathToTabMap: Record<PortalTab, string> = {
    'dashboard': '/dashboard-student',
    'schedule': '/jadwal-pelajaran',
    'attendance': '/izin-absensi',
    'materi': '/materi-belajar',
    'sumatif': '/sumatif-siswa',
    'liaison': '/buku-penghubung-siswa',
    'profile': '/profil-siswa',
    'character': '/karakter-siswa',
    'manual_book': '/buku-panduan-siswa',
    'kelulusan': '/pengumuman-kelulusan',
    'mitigasi': '/mitigasi-bencana'
  };

  const [activeTab, setActiveTab] = useState<PortalTab>(() => {
    return tabPathMap[location.pathname] || 'dashboard';
  });

  useEffect(() => {
    const tab = tabPathMap[location.pathname];
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [location.pathname]);

  const [viewingMaterialLink, setViewingMaterialLink] = useState<string | null>(null);
  const [viewingVideoLink, setViewingVideoLink] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [viewingPoster, setViewingPoster] = useState<Material | null>(null);
  const [viewingTask, setViewingTask] = useState<Material | null>(null);
  const [materialSearchQuery, setMaterialSearchQuery] = useState('');
  const [materialSelectedSubject, setMaterialSelectedSubject] = useState('ALL');
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setZoomScale(1);
    setPan({ x: 0, y: 0 });
  }, [viewingPoster]);

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

  const { showAlert } = useModal();
  
  const getDocumentEmbedUrl = (url: string) => {
    if (!url) return '';
    const cleanUrl = url.trim();
    if (cleanUrl.includes('drive.google.com') || cleanUrl.includes('docs.google.com')) {
      let match = cleanUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        return `https://drive.google.com/file/d/${match[1]}/preview`;
      }
      match = cleanUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        return `https://drive.google.com/file/d/${match[1]}/preview`;
      }
    }
    return cleanUrl;
  };

    const filteredMaterials = useMemo(() => {
    return materials.filter(m => {
      if (m.classId !== student.classId || !m.isVisible) return false;
      
      if (materialSelectedSubject !== 'ALL' && m.subjectId !== materialSelectedSubject) {
        return false;
      }

      if (materialSearchQuery.trim()) {
        const q = materialSearchQuery.toLowerCase().trim();
        const subject = MOCK_SUBJECTS.find(s => s.id === m.subjectId);
        const titleMatch = m.title?.toLowerCase().includes(q);
        const descMatch = m.description?.toLowerCase().includes(q);
        const subjMatch = subject?.name?.toLowerCase().includes(q) || m.subjectId?.toLowerCase().includes(q);
        const taskTitleMatch = m.taskTitle?.toLowerCase().includes(q);

        return titleMatch || descMatch || subjMatch || taskTitleMatch;
      }

      return true;
    });
  }, [materials, student.classId, materialSelectedSubject, materialSearchQuery]);

  const handleOpenMaterialLink = (url: string) => {
    const embedUrl = getDocumentEmbedUrl(url);
    setViewingMaterialLink(embedUrl);
  };

  const handleOpenVideo = async (videoUrl: string) => {
      let embedUrl = videoUrl;
      try {
          const url = new URL(embedUrl);
          if (url.hostname.includes('youtube.com')) {
             const v = url.searchParams.get('v');
             if (v) embedUrl = `https://www.youtube.com/embed/${v}?autoplay=1`;
          } else if (url.hostname === 'youtu.be') {
             const id = url.pathname.slice(1);
             embedUrl = `https://www.youtube.com/embed/${id}?autoplay=1`;
          }
      } catch(e) {}
      
      setViewingVideoLink(embedUrl);
      
      // Attempt to go fullscreen and landscape on mobile
      try {
          const docElm = document.documentElement as any;
          if (docElm.requestFullscreen) {
              await docElm.requestFullscreen();
          } else if (docElm.webkitRequestFullscreen) { /* Safari */
              await docElm.webkitRequestFullscreen();
          }
          
          if (screen.orientation && (screen.orientation as any).lock) {
              await (screen.orientation as any).lock('landscape');
          }
      } catch (e) {
          console.warn("Fullscreen/Orientation lock failed:", e);
      }
  };

  const handleCloseVideo = async () => {
      setViewingVideoLink(null);
      try {
          if (document.exitFullscreen) {
              await document.exitFullscreen();
          } else if ((document as any).webkitExitFullscreen) {
              await (document as any).webkitExitFullscreen();
          }
          if (screen.orientation && (screen.orientation as any).unlock) {
              (screen.orientation as any).unlock();
          }
      } catch (e) {
          console.warn("Exit Fullscreen/Orientation lock failed:", e);
      }
  };
  
  // -- STATES FOR DASHBOARD GRADES --
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(MOCK_SUBJECTS[0]?.id || 'pai');
  const [showRecapReport, setShowRecapReport] = useState(false);
  const [showSummative, setShowSummative] = useState(false);
  const [kktpMap, setKktpMap] = useState<Record<string, number>>({});
  const [academicCalendar, setAcademicCalendar] = useState<any>({});
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [journals, setJournals] = useState<any[]>([]);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);
  const [scheduleDate, setScheduleDate] = useState(new Date());

  const handlePrevScheduleDay = () => {
    setScheduleDate(prev => {
      const next = new Date(prev);
      next.setDate(next.getDate() - 1);
      return next;
    });
  };

  const handleNextScheduleDay = () => {
    setScheduleDate(prev => {
      const next = new Date(prev);
      next.setDate(next.getDate() + 1);
      return next;
    });
  };

  const handleTodayScheduleDay = () => {
    setScheduleDate(new Date());
  };

  // -- STATES FOR FORMS --
  const [permissionForm, setPermissionForm] = useState({
      date: getLocalISODate(),
      type: 'sick',
      reason: ''
  });
  const [isSubmittingPermission, setIsSubmittingPermission] = useState(false);

  const [liaisonForm, setLiaisonForm] = useState({
      category: 'Informasi',
      message: ''
  });
  const [isSubmittingLiaison, setIsSubmittingLiaison] = useState(false);

  // Character Assessment State
  const [karakterForm, setKarakterForm] = useState<Partial<KarakterAssessment>>({});
  const [isSavingKarakter, setIsSavingKarakter] = useState(false);

  // Graduation data
  const [graduationData, setGraduationData] = useState<Graduate | null>(null);
  const [isLoadingGraduation, setIsLoadingGraduation] = useState(false);

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState<Partial<Student>>(student);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // -- NOTIFICATION STATE --
  const [lastSeenLiaisonId, setLastSeenLiaisonId] = useState<string>(() => {
    return localStorage.getItem(`last_seen_liaison_${student.id}`) || '';
  });

  const hasNewTeacherMessage = useMemo(() => {
    const teacherLogs = liaisonLogs.filter(l => l.studentId === student.id && l.sender === 'Guru');
    if (teacherLogs.length === 0) return false;
    const latestId = teacherLogs[0].id; // logs are sorted by date desc in myLiaisonLogs, but here we check raw liaisonLogs
    
    // Sort to get the actual latest
    const sortedTeacherLogs = [...teacherLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const actualLatestId = sortedTeacherLogs[0].id;
    
    return actualLatestId !== lastSeenLiaisonId;
  }, [liaisonLogs, student.id, lastSeenLiaisonId]);

  // -- STATE FOR CLOCK --
  const [currentDate, setCurrentDate] = useState(new Date());

  const isCountdownActive = useMemo(() => {
    if (!schoolProfile?.graduationCountdownTime) return false;
    const target = new Date(schoolProfile.graduationCountdownTime).getTime();
    return target > currentDate.getTime();
  }, [schoolProfile?.graduationCountdownTime, currentDate]);

  const countdownRemaining = useMemo(() => {
    if (!schoolProfile?.graduationCountdownTime) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    const diff = new Date(schoolProfile.graduationCountdownTime).getTime() - currentDate.getTime();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return { days, hours, minutes, seconds };
  }, [schoolProfile?.graduationCountdownTime, currentDate]);

  // Carousel State
  const [carouselIndex, setCarouselIndex] = useState(0);
  const carouselTimeoutRef = useRef<number | null>(null);
  const imagesForCarousel = useMemo(() => learningDocumentation.filter(doc => doc.linkFoto && doc.linkFoto.trim() !== ''), [learningDocumentation]);

  // -- EFFECTS --
  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setProfileData(student);
  }, [student]);

  useEffect(() => {
      // Load existing character assessment if available
      if (karakterAssessments && karakterAssessments.length > 0) {
          const myAssessment = karakterAssessments.find(k => k.studentId === student.id);
          if (myAssessment) {
              setKarakterForm(myAssessment);
          }
      }
  }, [karakterAssessments, student.id]);

  // NEW: Check if Recap Report is enabled and load KKTP for this class
  useEffect(() => {
      const checkConfig = async () => {
          if (student.classId) {
              try {
                  const config = await apiService.getClassConfig(student.classId);
                  if (config) {
                      if (config.settings?.showStudentRecap) {
                          setShowRecapReport(true);
                      } else {
                          setShowRecapReport(false);
                      }
                      
                      if (config.settings?.showSummativeToStudents) {
                          setShowSummative(true);
                      } else {
                          setShowSummative(false);
                      }
                      
                      // Load KKTP data
                      let finalKktp: Record<string, number> = {};
                      const fetchedKktp = (config as any).KKTP || config.kktp;
                      if (fetchedKktp && Object.keys(fetchedKktp).length > 0) {
                          finalKktp = fetchedKktp;
                      } else {
                          // Fallback to MOCK_SUBJECTS if not configured
                          MOCK_SUBJECTS.forEach(s => {
                              finalKktp[s.id] = s.kkm;
                          });
                      }
                      setKktpMap(finalKktp);
                      
                      if (config.academicCalendar && Object.keys(config.academicCalendar).length > 0) {
                          setAcademicCalendar(config.academicCalendar);
                      } else {
                          // Try fetching global academic calendar
                          try {
                              const globalCalendar = await apiService.getAcademicCalendar('global');
                              if (globalCalendar && Object.keys(globalCalendar).length > 0) {
                                  setAcademicCalendar(globalCalendar);
                              } else {
                                  setAcademicCalendar(PREFILLED_CALENDAR_2025);
                              }
                          } catch (err) {
                              console.error("Failed to load global academic calendar", err);
                              setAcademicCalendar(PREFILLED_CALENDAR_2025);
                          }
                      }
                  }
              } catch (e) {
                  console.error("Failed to load class config for student");
              }
          }
      };
      checkConfig();
      
      const fetchSchedule = async () => {
          if (student.classId) {
              setIsLoadingSchedule(true);
              try {
                  const today = getLocalISODate();
                  const [scheduleData, journalData] = await Promise.all([
                      apiService.getSchedule(student.classId),
                      apiService.getLearningJournal(student.classId)
                  ]);
                  setSchedule(scheduleData);
                  // Filter journals for today to show teacher presence
                  setJournals(journalData.filter((j: any) => j.date === today));
              } catch (err) {
                  console.error("Failed to load schedule or journal", err);
              } finally {
                  setIsLoadingSchedule(false);
              }
          }
      };
      fetchSchedule();
  }, [student.classId]);

  // NEW: Fetch graduation data if Grade 6
  useEffect(() => {
      const fetchGraduation = async () => {
          if (student.classId?.startsWith('6') && schoolProfile?.isGraduationAnnounced && student.id) {
              setIsLoadingGraduation(true);
              try {
                  const data = await apiService.getGraduateByStudent(student);
                  if (data && data.isVisible !== false) {
                      setGraduationData(data);
                  } else {
                      setGraduationData(null);
                  }
              } catch (e) {
                  console.error("Error fetching graduation data:", e);
              } finally {
                  setIsLoadingGraduation(false);
              }
          }
      };
      
      if (activeTab === 'kelulusan') {
          fetchGraduation();
      }
  }, [student.classId, schoolProfile?.isGraduationAnnounced, student.id, activeTab]);
  
  // Carousel Logic
  useEffect(() => {
    const resetTimeout = () => {
      if (carouselTimeoutRef.current) clearTimeout(carouselTimeoutRef.current);
    };
    resetTimeout();
    // Pause auto-sliding if the active item is a video
    const activeItemIsVideo = imagesForCarousel.length > 0 && isVideoLink(imagesForCarousel[carouselIndex]?.linkFoto);
    if (imagesForCarousel.length > 1 && !activeItemIsVideo) {
      carouselTimeoutRef.current = window.setTimeout(
        () => setCarouselIndex((prev) => (prev + 1) % imagesForCarousel.length), 6000
      );
    }
    return () => resetTimeout();
  }, [carouselIndex, imagesForCarousel.length, imagesForCarousel]);

  useEffect(() => {
    if (activeTab === 'liaison' && hasNewTeacherMessage) {
        const teacherLogs = liaisonLogs.filter(l => l.studentId === student.id && l.sender === 'Guru');
        if (teacherLogs.length > 0) {
            const sortedTeacherLogs = [...teacherLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            const actualLatestId = sortedTeacherLogs[0].id;
            setLastSeenLiaisonId(actualLatestId);
            localStorage.setItem(`last_seen_liaison_${student.id}`, actualLatestId);
        }
    }
  }, [activeTab, hasNewTeacherMessage, liaisonLogs, student.id]);

  // -- HANDLERS --

  const handleProfileChange = (field: keyof Student, value: any) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
        await onUpdateStudent(profileData as Student);
        showAlert('Data berhasil diperbarui!', 'success');
        setIsEditingProfile(false);
    } catch (e) {
        showAlert('Gagal menyimpan profil.', 'error');
    } finally {
        setIsSavingProfile(false);
    }
  };

  const handleSubmitPermission = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!permissionForm.reason) {
          showAlert("Mohon isi alasan.", "error");
          return;
      }
      setIsSubmittingPermission(true);
      try {
          const records = [{
              studentId: student.id,
              classId: student.classId,
              status: permissionForm.type,
              notes: permissionForm.reason
          }];
          await onSavePermission(permissionForm.date, records);
          setPermissionForm({ ...permissionForm, reason: '' });
      } catch (e) {
          showAlert("Gagal mengirim pengajuan.", "error");
      } finally {
          setIsSubmittingPermission(false);
      }
  };

  const handleSubmitLiaison = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!liaisonForm.message) {
          showAlert("Pesan tidak boleh kosong.", "error");
          return;
      }
      setIsSubmittingLiaison(true);
      try {
          await onSaveLiaison({
              classId: student.classId,
              studentId: student.id,
              date: getLocalISODate(),
              sender: 'Wali Murid',
              category: liaisonForm.category,
              message: liaisonForm.message,
              status: 'Pending'
          });
          setLiaisonForm({ ...liaisonForm, message: '' });
      } catch (e) {
          showAlert("Gagal mengirim pesan.", "error");
      } finally {
          setIsSubmittingLiaison(false);
      }
  };

  const handleSaveKarakterLocal = async () => {
      setIsSavingKarakter(true);
      try {
          const assessmentToSave: Omit<KarakterAssessment, 'studentId' | 'classId'> = {
              bangunPagi: karakterForm.bangunPagi || '',
              beribadah: karakterForm.beribadah || '',
              berolahraga: karakterForm.berolahraga || '',
              makanSehat: karakterForm.makanSehat || '',
              gemarBelajar: karakterForm.gemarBelajar || '',
              bermasyarakat: karakterForm.bermasyarakat || '',
              tidurAwal: karakterForm.tidurAwal || '',
              catatan: karakterForm.catatan,
              afirmasi: karakterForm.afirmasi
          };
          await onSaveKarakter(student.id, assessmentToSave);
          showAlert("Self-assessment 7 Kebiasaan berhasil disimpan.", "success");
      } catch (e) {
          showAlert("Gagal menyimpan.", "error");
      } finally {
          setIsSavingKarakter(false);
      }
  };

  const handleKarakterChange = (key: KarakterIndicatorKey, value: string) => {
      setKarakterForm(prev => ({ ...prev, [key]: value }));
  };

  const goToPreviousSlide = () => setCarouselIndex((prev) => (prev - 1 + imagesForCarousel.length) % imagesForCarousel.length);
  const goToNextSlide = () => setCarouselIndex((prev) => (prev + 1) % imagesForCarousel.length);

  // -- COMPUTED DATA --

  const tzOffset = -currentDate.getTimezoneOffset() / 60;
  const tzName = tzOffset === 7 ? 'WIB' : tzOffset === 8 ? 'WITA' : tzOffset === 9 ? 'WIT' : `GMT${tzOffset > 0 ? '+' : ''}${tzOffset}`;
  const baseTimeStr = new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(currentDate).replace(/\./g, ':');
  
  const formattedTime = `${baseTimeStr} ${tzName}`;

  const formattedDate = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(currentDate).replace('Jumat', "Jum'at").replace('jumat', "jum'at");

  const getGreeting = useMemo(() => {
    const hour = currentDate.getHours();
    if (hour >= 5 && hour < 11) return "Pagi";
    if (hour >= 11 && hour < 15) return "Siang";
    if (hour >= 15 && hour < 19) return "Sore";
    return "Malam";
  }, [currentDate]);

  const getGreetingIcon = useMemo(() => {
    switch (getGreeting) {
      case 'Pagi': return <CloudSun className="text-yellow-400 mr-3 inline-block animate-pulse-slow" size={32} />;
      case 'Siang': return <Sun className="text-orange-500 mr-3 inline-block animate-spin-slow" size={32} />;
      case 'Sore': return <Sunset className="text-orange-400 mr-3 inline-block" size={32} />;
      case 'Malam': return <Moon className="text-indigo-400 mr-3 inline-block" size={32} />;
      default: return <Sun className="text-yellow-500 mr-3 inline-block" size={32} />;
    }
  }, [getGreeting]);


  const attendanceStats = useMemo(() => {
    // Filter for accumulated data based on academic semester
    // Semester 1 (Ganjil): July (6) - December (11)
    // Semester 2 (Genap): January (0) - June (5)
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const todayStr = getLocalISODate(now);

    const isSemester1 = currentMonth >= 6;
    const startMonth = isSemester1 ? 6 : 0;
    const endMonth = isSemester1 ? 11 : 5;

    const accumulatedRecords = allAttendance.filter((r: any) => {
        if (!r.date) return false;
        // Parse date manually to avoid timezone shifts
        const parts = r.date.split('-');
        if (parts.length !== 3) return false;
        const y = parseInt(parts[0]);
        const m = parseInt(parts[1]) - 1; // 0-indexed
        
        return String(r.studentId) === String(student.id) && 
               y === currentYear &&
               m >= startMonth &&
               m <= endMonth;
    });

    const counts = { present: 0, sick: 0, permit: 0, alpha: 0, dispensation: 0 };
    accumulatedRecords.forEach((r: any) => {
        if (counts[r.status as keyof typeof counts] !== undefined) {
            counts[r.status as keyof typeof counts]++;
        }
    });
    
    // Total Presence Percentage (Global) for the Header Badge
    const globalRecords = allAttendance.filter((r: any) => String(r.studentId) === String(student.id));
    const globalPresent = globalRecords.filter((r: any) => r.status === 'present' || r.status === 'dispensation').length;
    const globalTotal = globalRecords.length || 1;
    const percentage = Math.round((globalPresent / globalTotal) * 100);

    // Today's status
    const todayRecord = allAttendance.find((r: any) => String(r.studentId) === String(student.id) && r.date === todayStr);
    const todayStatus = todayRecord ? todayRecord.status : null;

    // Detect if today is a holiday
    const tYear = now.getFullYear();
    const tMonth = now.getMonth();
    const tDay = now.getDate();
    const tDayOfWeek = now.getDay(); // 0 = Sunday
    const tMonthKey = `${tYear}-${String(tMonth + 1).padStart(2, '0')}`;
    const tMonthCalendarData = academicCalendar?.[tMonthKey] || [];
    
    let isTodayHoliday = false;
    let holidayLabel = '';
    
    if (tMonthCalendarData[tDay - 1]) {
        const code = tMonthCalendarData[tDay - 1];
        if (CALENDAR_CODES[code]) {
            const label = academicCalendar?.__descriptions__?.[todayStr] || HOLIDAY_DESCRIPTIONS_2025_2026[todayStr] || CALENDAR_CODES[code].label;
            if (code.startsWith('L') || code === 'CB') {
                isTodayHoliday = true;
                holidayLabel = label;
            }
        }
    } else if (tDayOfWeek === 0) {
        isTodayHoliday = true;
        holidayLabel = 'Libur Akhir Pekan';
    }

    return { 
        percentage, 
        counts, 
        monthName: new Date(currentYear, endMonth).toLocaleString('id-ID', { month: 'long' }), 
        startMonthName: new Date(currentYear, startMonth).toLocaleString('id-ID', { month: 'long' }),
        semesterName: isSemester1 ? 'Ganjil' : 'Genap',
        year: currentYear,
        todayStatus,
        isTodayHoliday,
        holidayLabel
    };
  }, [student, allAttendance, academicCalendar]);

  const upcomingAgendas = useMemo(() => {
      return agendas
        .filter(a => !a.completed)
        .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [agendas]);

  const myLiaisonLogs = useMemo(() => {
      return liaisonLogs
        .filter(l => l.studentId === student.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [liaisonLogs, student.id]);

  const myPermissions = useMemo(() => {
      return permissionRequests
        .filter(p => p.studentId === student.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [permissionRequests, student.id]);

  // -- GRADES CALCULATION FOR DASHBOARD --
  const selectedGradeData = useMemo(() => {
      const studentGrades = grades.find(g => g.studentId === student.id);
      const subjectData = studentGrades?.subjects[selectedSubjectId] || { sum1: 0, sum2: 0, sum3: 0, sum4: 0, sas: 0 };
      
      const scores = [subjectData.sum1, subjectData.sum2, subjectData.sum3, subjectData.sum4, subjectData.sas];
      const filledScores = scores.filter(s => s > 0);
      const average = filledScores.length > 0 
          ? Math.round(filledScores.reduce((a, b) => a + b, 0) / filledScores.length) 
          : 0;

      return { ...subjectData, average };
  }, [grades, student.id, selectedSubjectId]);

  // -- RECAP DATA CALCULATION (If Enabled) --
  const myRecapData = useMemo(() => {
      if (!showRecapReport) return null;

      // 1. Calculate scores for all students in class to determine rank
      const classScores = grades
          .filter(g => g.classId === student.classId)
          .map(record => {
              let total = 0;
              MOCK_SUBJECTS.forEach(subj => {
                  const sData = record.subjects[subj.id];
                  if (sData) {
                      const vals = [sData.sum1, sData.sum2, sData.sum3, sData.sum4, sData.sas].filter(v => v > 0);
                      if (vals.length > 0) {
                          total += Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
                      }
                  }
              });
              return { studentId: record.studentId, total };
          })
          .sort((a, b) => b.total - a.total);

      const myRankIndex = classScores.findIndex(s => s.studentId === student.id);
      const rank = myRankIndex !== -1 ? myRankIndex + 1 : '-';
      
      // Determine class-wide active subjects (where at least one student in the class has numerical grades > 0)
      const classGrades = grades.filter(g => g.classId === student.classId);
      const activeSubjectsInClass = MOCK_SUBJECTS.filter(subj => {
          return classGrades.some(record => {
              const gData = record.subjects[subj.id];
              if (!gData) return false;
              const vals = [
                  Number(gData.sum1), 
                  Number(gData.sum2), 
                  Number(gData.sum3), 
                  Number(gData.sum4), 
                  Number(gData.sas)
              ].filter(v => typeof v === 'number' && !isNaN(v) && v > 0);
              return vals.length > 0;
          });
      });

      // 2. Prepare My Detailed Data
      const myRecord = grades.find(g => g.studentId === student.id);
      const subjectsData = activeSubjectsInClass.map(subj => {
          const sData = myRecord?.subjects[subj.id] || { sum1: 0, sum2: 0, sum3: 0, sum4: 0, sas: 0 };
          const vals = [
              Number(sData.sum1), 
              Number(sData.sum2), 
              Number(sData.sum3), 
              Number(sData.sum4), 
              Number(sData.sas)
          ].filter(v => typeof v === 'number' && !isNaN(v) && v > 0);
          const final = vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
          return {
              id: subj.id,
              name: subj.name,
              ...sData,
              final
          };
      });

      const myTotal = classScores.find(s => s.studentId === student.id)?.total || 0;

      return { subjects: subjectsData, rank, total: myTotal };
  }, [showRecapReport, grades, student.id, student.classId]);


  // -- TKA SCORE DATA FOR CLASS 6 --
  const myTkaData = useMemo(() => {
      if (!student.classId?.startsWith('6')) return null;
      
      const studentGrades = grades.find(g => g.studentId === student.id);
      const matSubject = studentGrades?.subjects?.['mat'];
      const indoSubject = studentGrades?.subjects?.['indo'];
      const ipaSubject = studentGrades?.subjects?.['ipas'];

      // Default TKA list
      const titlesSet = new Set<string>(['TKA 1']);
      if (matSubject?.tka_scores) {
        Object.keys(matSubject.tka_scores).forEach(t => titlesSet.add(t));
      }
      if (indoSubject?.tka_scores) {
        Object.keys(indoSubject.tka_scores).forEach(t => titlesSet.add(t));
      }
      if (ipaSubject?.tka_scores) {
        Object.keys(ipaSubject.tka_scores).forEach(t => titlesSet.add(t));
      }
      const titles = Array.from(titlesSet);

      return titles.map(title => {
        let matScore = matSubject?.tka_scores?.[title];
        if (matScore === undefined && title === 'TKA 1' && matSubject?.tka !== undefined) {
          matScore = matSubject.tka;
        }
        matScore = matScore || 0;

        let indoScore = indoSubject?.tka_scores?.[title];
        if (indoScore === undefined && title === 'TKA 1' && indoSubject?.tka !== undefined) {
          indoScore = indoSubject.tka;
        }
        indoScore = indoScore || 0;

        let ipaScore = ipaSubject?.tka_scores?.[title];
        if (ipaScore === undefined && title === 'TKA 1' && ipaSubject?.tka !== undefined) {
          ipaScore = ipaSubject.tka;
        }
        ipaScore = ipaScore || 0;

        return {
          title,
          mat: matScore,
          indo: indoScore,
          ipa: ipaScore,
          average: Math.round((matScore + indoScore + ipaScore) / 3)
        };
      });
  }, [grades, student.id, student.classId]);


  // -- CALENDAR STATE --
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const calendarDays = useMemo(() => {
      const year = calendarMonth.getFullYear();
      const month = calendarMonth.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      
      const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
      const monthCalendarData = academicCalendar?.[monthKey] || [];
      
      const days = [];
      // Pad start (0 = Sunday, 1 = Monday, etc.)
      for (let i = 0; i < firstDay.getDay(); i++) {
          days.push(null);
      }
      
      for (let i = 1; i <= lastDay.getDate(); i++) {
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
          const record = allAttendance.find((r: any) => String(r.studentId) === String(student.id) && r.date === dateStr);
          
          let holidayCode = null;
          let holidayLabel = null;
          let isSunday = new Date(year, month, i).getDay() === 0;
          
          if (monthCalendarData[i - 1]) {
              const code = monthCalendarData[i - 1];
              if (CALENDAR_CODES[code]) {
                  holidayCode = code;
                  const specificDescription = academicCalendar?.__descriptions__?.[dateStr] || HOLIDAY_DESCRIPTIONS_2025_2026[dateStr];
                  holidayLabel = specificDescription || CALENDAR_CODES[code].label;
              }
          } else if (isSunday) {
              holidayCode = 'LU';
              holidayLabel = 'Libur Akhir Pekan';
          }
          
          days.push({
              day: i,
              dateStr,
              status: record ? record.status : null,
              reason: record ? record.reason : null,
              holidayCode,
              holidayLabel
          });
      }
      return days;
  }, [calendarMonth, allAttendance, student.id, academicCalendar]);

  const prevMonth = () => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1));
  const nextMonth = () => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1));

  const currentDayName = useMemo(() => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', "Jum'at", 'Sabtu'];
    return days[currentDate.getDay()];
  }, [currentDate]);

  const todaySchedule = useMemo(() => {
    if (!schedule) return [];
    return schedule
      .filter(item => item && item.day && item.day.replace("'", "") === currentDayName.replace("'", ""))
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  }, [schedule, currentDayName]);

  const scheduleDayName = useMemo(() => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', "Jum'at", 'Sabtu'];
    return days[scheduleDate.getDay()];
  }, [scheduleDate]);

  const selectedSchedule = useMemo(() => {
    if (!schedule) return [];
    return schedule
      .filter(item => item && item.day && item.day.replace("'", "") === scheduleDayName.replace("'", ""))
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  }, [schedule, scheduleDayName]);

  const TABS = [
    { id: 'dashboard', label: 'Ringkasan', icon: LayoutDashboard },
    { id: 'profile', label: 'Profil Siswa', icon: User },
    { id: 'attendance', label: 'Izin & Absensi', icon: Calendar },
    { id: 'schedule', label: 'Jadwal Pelajaran', icon: Calendar },
    { id: 'materi', label: 'Materi', icon: BookOpen },
    { id: 'sumatif', label: 'Sumatif', icon: FileText },
    { id: 'liaison', label: 'Buku Penghubung', icon: MessageSquare },
    { id: 'character', label: 'Karakter', icon: HeartHandshake },
    { id: 'manual_book', label: 'Buku Panduan', icon: BookOpen },
  ];

  if (student?.classId?.startsWith('6') && schoolProfile?.isGraduationAnnounced) {
      TABS.push({ id: 'kelulusan', label: 'Kelulusan', icon: GraduationCap });
  }
  if (schoolProfile?.studentMitigationAccess) {
      TABS.push({ id: 'mitigasi', label: 'Mitigasi Bencana', icon: AlertTriangle });
  }

  const handleTabChange = (tabId: PortalTab) => {
    setActiveTab(tabId);
    setViewingMaterialLink(null);
    navigate(pathToTabMap[tabId]);
  };

  const currentKktp = kktpMap[selectedSubjectId] || MOCK_SUBJECTS.find(s => s.id === selectedSubjectId)?.kkm || 75;

  // Updated with short labels for mobile
  const scoreItems = [
      { key: 'sum1', label: 'Sumatif 1', short: 'S1' },
      { key: 'sum2', label: 'Sumatif 2', short: 'S2' },
      { key: 'sum3', label: 'Sumatif 3', short: 'S3' },
      { key: 'sum4', label: 'Sumatif 4', short: 'S4' },
      { key: 'sas', label: 'SAS', short: 'SAS' },
  ];

  const average = selectedGradeData.average;
  const hasAverage = average > 0;
  const isAverageBelowKktp = hasAverage && average < currentKktp;

  return (
    <div className="animate-fade-in pb-24 space-y-4 font-sans text-slate-800 max-w-[1280px] mx-auto">
      
      {/* 1. HEADER PROFILE */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-[#5AB2FF] to-[#A0DEFF] z-0"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row justify-center md:justify-between items-center mb-6 gap-4">
            <div className="flex items-center space-x-3 bg-white/70 backdrop-blur-sm px-4 py-2 rounded-xl shadow-sm border border-gray-100">
                <Calendar size={24} className="text-[#5AB2FF] shrink-0" />
                <div>
                    <p className="text-lg font-bold text-gray-800 tabular-nums tracking-wider">{formattedTime}</p>
                    <p className="text-xs font-medium text-gray-500 capitalize">{formattedDate}</p>
                </div>
            </div>
            
            <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold text-white drop-shadow-md hidden md:flex items-center">
                  {getGreetingIcon} Selamat {getGreeting}! 👋
                </h1>
                
                {/* Notification Bell for Students */}
                <button 
                    onClick={() => handleTabChange('liaison')}
                    className={`p-2.5 rounded-full transition-all relative shadow-sm border ${
                        hasNewTeacherMessage 
                        ? 'bg-red-500 text-white border-red-400 animate-vibrate' 
                        : 'bg-white/80 text-[#5AB2FF] border-white/50 hover:bg-white'
                    }`}
                    title="Pesan dari Guru"
                >
                    <Bell size={22} />
                    {hasNewTeacherMessage && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-pulse"></span>
                    )}
                </button>
            </div>
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-end gap-6">
              <div className="w-28 h-28 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white shrink-0">
                  <img src={(student.photo && student.photo.trim() !== '' && !student.photo.startsWith('ERROR')) ? student.photo : `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(student.name)}${student.gender === 'L' ? 'male' : 'female'}`} alt={student.name.toUpperCase()} className="w-full h-full object-cover object-top" />
              </div>

              <div className="flex-1 text-center md:text-left mb-1">
                  <h1 className={`font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#5AB2FF] to-blue-500 mb-2 break-words leading-tight ${
                      (student.name?.length || 0) > 25 
                          ? 'text-lg sm:text-2xl md:text-3xl' 
                          : 'text-2xl sm:text-3xl'
                  }`}>
                      {student.name.toUpperCase()}
                  </h1>
                  <div className="inline-flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm text-gray-600">
                      <span className="bg-gray-100 px-3 py-1 rounded-full font-bold border border-gray-200 shadow-sm flex items-center text-slate-700">
                          NIS: {student.nis}
                      </span>
                      {/* ADDED NISN */}
                      <span className="bg-[#CAF4FF] text-[#5AB2FF] px-3 py-1 rounded-full font-bold border border-blue-100 shadow-sm flex items-center">
                          NISN: {student.nisn || '-'}
                      </span>
                      <span className="flex items-center font-medium bg-white/50 px-2 py-1 rounded-lg">
                          <BookOpen size={16} className="mr-1.5 text-gray-400"/> Kelas {student.classId}
                      </span>
                  </div>
              </div>

              <div className="flex gap-3 mb-2 shrink-0 md:self-end">
                  <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl text-center min-w-[80px] shadow-sm">
                      <span className="block text-[10px] font-bold text-emerald-600 uppercase mb-1">Hadir (Total)</span>
                      <span className="text-xl font-black text-emerald-700">{attendanceStats.percentage}%</span>
                  </div>
                  <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl text-center min-w-[80px] shadow-sm">
                      <span className="block text-[10px] font-bold text-amber-600 uppercase mb-1">Poin Sikap</span>
                      <span className="text-xl font-black text-amber-700">{student.behaviorScore}</span>
                  </div>
              </div>
          </div>
      </div>

      {/* 2. STICKY NAVIGATION (Desktop Only) */}
      <div className="hidden md:block sticky top-0 z-30 bg-gray-50/95 backdrop-blur-md py-2 -mx-4 px-4 border-b border-gray-200 shadow-sm overflow-x-auto no-scrollbar">
        <div className="flex gap-2 min-w-max pb-1">
            {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                    <button 
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id as PortalTab)} 
                        className={`flex items-center px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap border ${
                            isActive 
                            ? 'bg-[#5AB2FF] text-white border-[#5AB2FF] shadow-md' 
                            : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-100'
                        }`}
                    >
                        <Icon size={16} className="mr-2"/> {tab.label}
                    </button>
                )
            })}
        </div>
      </div>

      {/* 3. MAIN CONTENT */}
      <div className="min-h-[500px]">
          
          {/* --- DASHBOARD TAB --- */}
          {activeTab === 'dashboard' && (
              <div className="space-y-6">
                  {/* Feature Menu Grid (Mobile Only) - User Request 4/5 */}
                  <div className="md:hidden grid grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                      {[
                          { id: 'materi', label: 'Materi', icon: BookOpen, color: 'bg-orange-50 text-orange-600' },
                          { id: 'sumatif', label: 'Sumatif', icon: FileText, color: 'bg-blue-50 text-blue-600' },
                          { id: 'attendance', label: 'Izin', icon: Calendar, color: 'bg-green-50 text-green-600' },
                          { id: 'character', label: '7KAIH', icon: HeartHandshake, color: 'bg-pink-50 text-pink-600' },
                          { id: 'liaison', label: 'Layanan', icon: Bell, color: 'bg-indigo-50 text-indigo-600' },
                          { id: 'schedule', label: 'Jadwal', icon: CalendarDays, color: 'bg-purple-50 text-purple-600' },
                          { id: 'manual_book', label: 'Panduan', icon: BookOpen, color: 'bg-slate-50 text-slate-600' },
                          ...(student?.classId?.startsWith('6') && schoolProfile?.isGraduationAnnounced 
                              ? [{ id: 'kelulusan', label: 'Lulus', icon: GraduationCap, color: 'bg-rose-50 text-rose-600' }] 
                              : [])
                      ].map((item) => {
                          const Icon = item.icon;
                          return (
                              <button
                                  key={item.id}
                                  onClick={() => handleTabChange(item.id as PortalTab)}
                                  className="flex flex-col items-center justify-center space-y-1 active:scale-95 transition-transform"
                              >
                                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${item.color}`}>
                                      <Icon size={24} />
                                  </div>
                                  <span className="text-[10px] font-bold text-gray-600 truncate w-full text-center">{item.label}</span>
                              </button>
                          );
                      })}
                  </div>

                  {/* 1. Catatan Guru - HIGHLIGHTED */}
                  {student.teacherNotes && (
                      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 rounded-2xl shadow-lg text-white animate-fade-in relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
                          <h4 className="font-bold text-lg mb-3 flex items-center relative z-10">
                              <MessageCircle size={22} className="mr-2"/> Catatan Wali Kelas
                          </h4>
                          <div className="relative z-10 bg-white/10 p-4 rounded-xl border border-white/20 backdrop-blur-sm">
                              <p className="text-sm text-white leading-relaxed italic">
                                  "{student.teacherNotes}"
                              </p>
                          </div>
                      </div>
                  )}

                  {/* 2. Accumulated Attendance Stats */}
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                      <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                          <Activity className="mr-2 text-[#5AB2FF]" size={18}/> Rekap Laporan Absensi Semester {attendanceStats.semesterName} ({attendanceStats.startMonthName} - {attendanceStats.monthName} {attendanceStats.year})
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                          <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-center">
                              <span className="text-2xl font-black text-emerald-600 block mb-1">{attendanceStats.counts.present + attendanceStats.counts.dispensation}</span>
                              <span className="text-xs font-bold text-emerald-700 uppercase">Hadir</span>
                          </div>
                          <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl text-center">
                              <span className="text-2xl font-black text-amber-600 block mb-1">{attendanceStats.counts.sick}</span>
                              <span className="text-xs font-bold text-amber-700 uppercase">Sakit</span>
                          </div>
                          <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-center">
                              <span className="text-2xl font-black text-blue-600 block mb-1">{attendanceStats.counts.permit}</span>
                              <span className="text-xs font-bold text-blue-700 uppercase">Izin</span>
                          </div>
                          <div className="bg-red-50 border border-red-100 p-4 rounded-xl text-center">
                              <span className="text-2xl font-black text-red-600 block mb-1">{attendanceStats.counts.alpha}</span>
                              <span className="text-xs font-bold text-red-700 uppercase">Alpha</span>
                          </div>
                      </div>
                      <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl flex items-center justify-between">
                          <span className="text-sm font-bold text-gray-700">Status Kehadiran Hari Ini:</span>
                          <span className={`text-sm font-bold px-3 py-1 rounded-lg ${
                              attendanceStats.isTodayHoliday ? 'bg-rose-100 text-rose-700' :
                              attendanceStats.todayStatus === 'present' ? 'bg-emerald-100 text-emerald-700' :
                              attendanceStats.todayStatus === 'sick' ? 'bg-amber-100 text-amber-700' :
                              attendanceStats.todayStatus === 'permit' ? 'bg-blue-100 text-blue-700' :
                              attendanceStats.todayStatus === 'alpha' ? 'bg-red-100 text-red-700' :
                              attendanceStats.todayStatus === 'dispensation' ? 'bg-purple-100 text-purple-700' :
                              'bg-gray-200 text-gray-600'
                          }`}>
                              {attendanceStats.isTodayHoliday ? (attendanceStats.holidayLabel ? `Libur (${attendanceStats.holidayLabel})` : 'Libur') :
                               attendanceStats.todayStatus === 'present' ? 'Hadir' :
                               attendanceStats.todayStatus === 'sick' ? 'Sakit' :
                               attendanceStats.todayStatus === 'permit' ? 'Izin' :
                               attendanceStats.todayStatus === 'alpha' ? 'Alpha' :
                               attendanceStats.todayStatus === 'dispensation' ? 'Dispensasi' :
                               'Belum Tercatat'}
                          </span>
                      </div>
                  </div>
                  
                  {/* 3. Academic Summary (Nilai Sumatif) - UPDATED TO FULL WIDTH */}
                  {showSummative && (
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-6 animate-fade-in-up">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                          <h3 className="font-bold text-gray-800 flex items-center">
                              <GraduationCap className="mr-2 text-indigo-500" size={20}/> Hasil Belajar (Sumatif)
                          </h3>
                          <div className="relative w-full sm:w-auto">
                              <select 
                                value={selectedSubjectId} 
                                onChange={(e) => setSelectedSubjectId(e.target.value)}
                                className="w-full sm:w-48 appearance-none bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold py-2 pl-4 pr-10 rounded-xl outline-none focus:ring-2 focus:ring-indigo-200 cursor-pointer text-sm"
                              >
                                  {MOCK_SUBJECTS.map(s => (
                                      <option key={s.id} value={s.id}>{s.name}</option>
                                  ))}
                              </select>
                              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none"/>
                          </div>
                      </div>

                      {/* Grid Layout for compact row on mobile */}
                      <div className="grid grid-cols-6 gap-1 sm:gap-3">
                          {scoreItems.map(item => {
                              const score = selectedGradeData[item.key as keyof typeof selectedGradeData] as number;
                              const isSas = item.key === 'sas';
                              const hasScore = score > 0;
                              const isBelowKktp = hasScore && score < currentKktp;
                              
                              const defaultBg = isSas ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-100';
                              const successBg = 'bg-emerald-50 border-emerald-200';
                              const failBg = 'bg-red-50 border-red-200';

                              const successText = 'text-emerald-700';
                              const failText = 'text-red-700';

                              const successLabel = 'text-emerald-600';
                              const failLabel = 'text-red-500';

                              return (
                                  <div key={item.key} className={`p-1 sm:p-3 rounded-lg sm:rounded-xl text-center flex flex-col justify-center border transition-all ${
                                      !hasScore ? defaultBg : isBelowKktp ? failBg : successBg
                                  }`}>
                                      <span className={`text-[10px] font-bold uppercase mb-1 ${
                                          !hasScore ? 'text-gray-400' : isBelowKktp ? failLabel : successLabel
                                      }`}>
                                          <span className="sm:hidden">{item.short}</span>
                                          <span className="hidden sm:inline">{item.label}</span>
                                      </span>
                                      <span className={`text-sm sm:text-xl font-bold ${
                                          !hasScore ? 'text-gray-300' : isBelowKktp ? failText : successText
                                      }`}>
                                          {hasScore ? score : '-'}
                                      </span>
                                      {hasScore && (
                                          <span className={`hidden sm:block text-[9px] font-bold mt-1 ${isBelowKktp ? 'text-red-500' : 'text-emerald-600'}`}>
                                              {isBelowKktp ? 'Remedial' : 'Pengayaan'}
                                          </span>
                                      )}
                                  </div>
                              );
                          })}
                          
                          {/* Final Grade Card Integrated into Row */}
                          <div className={`p-1 sm:p-3 rounded-lg sm:rounded-xl text-center flex flex-col justify-center border transition-all ${
                            !hasAverage ? 'bg-gray-50 border-gray-100' :
                            isAverageBelowKktp ? 'bg-red-600 text-white border-red-600' : 'bg-emerald-600 text-white border-emerald-600'
                          }`}>
                              <span className={`text-[10px] font-bold uppercase mb-1 ${!hasAverage ? 'text-gray-400' : 'text-white/80'}`}>
                                  <span className="sm:hidden">NA</span>
                                  <span className="hidden sm:inline">Nilai Akhir</span>
                              </span>
                              <span className={`text-base sm:text-2xl font-black ${!hasAverage ? 'text-gray-300' : 'text-white'}`}>
                                  {hasAverage ? average : '-'}
                              </span>
                              {hasAverage && (
                                  <span className="hidden sm:block text-[9px] font-bold mt-1 text-white/90">
                                      {isAverageBelowKktp ? 'Perlu Perbaikan' : 'Tercapai'}
                                  </span>
                              )}
                          </div>
                      </div>
                  </div>
                  )}

                  {/* TKA Recap Section (Khusus Kelas 6) */}
                  {student.classId?.startsWith('6') && myTkaData && (
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-6 animate-fade-in-up">
                      <div className="flex justify-between items-center mb-6">
                          <h3 className="font-bold text-gray-800 flex items-center">
                              <Calculator className="mr-2 text-indigo-500" size={20}/> Rekap Hasil Nilai Tryout TKA (Tes Kemampuan Akademik)
                          </h3>
                          <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-bold border border-indigo-100 uppercase">
                              Akun Kelas 6
                          </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {myTkaData.map((tka, index) => {
                              const matPred = tka.mat > 90 ? 'Istimewa' : tka.mat >= 76 ? 'Baik' : tka.mat >= 60 ? 'Memadai' : tka.mat > 0 ? 'Kurang' : '-';
                              const indoPred = tka.indo > 90 ? 'Istimewa' : tka.indo >= 76 ? 'Baik' : tka.indo >= 60 ? 'Memadai' : tka.indo > 0 ? 'Kurang' : '-';
                              const ipaPred = tka.ipa > 90 ? 'Istimewa' : tka.ipa >= 76 ? 'Baik' : tka.ipa >= 60 ? 'Memadai' : tka.ipa > 0 ? 'Kurang' : '-';
                              const hasData = tka.mat > 0 || tka.indo > 0 || tka.ipa > 0;
                              
                              return (
                                  <div key={index} className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col justify-between hover:shadow-md transition-all">
                                      <div className="border-b pb-2 mb-3 flex justify-between items-center">
                                          <span className="font-extrabold text-slate-800 text-sm uppercase tracking-wide">{tka.title}</span>
                                          {hasData && (
                                              <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                                                  Rata-rata: {tka.average}
                                              </span>
                                          )}
                                      </div>
                                      
                                      <div className="space-y-3">
                                          <div className="flex justify-between items-center text-xs">
                                              <span className="text-slate-500 font-bold">Matematika (TKA)</span>
                                              <div className="flex items-center gap-2">
                                                  <span className={`font-bold ${tka.mat > 0 ? 'text-slate-800' : 'text-slate-300'}`}>
                                                      {tka.mat > 0 ? tka.mat : '-'}
                                                  </span>
                                                  {tka.mat > 0 && (
                                                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                                          matPred === 'Istimewa' ? 'bg-rose-100 text-rose-700' :
                                                          matPred === 'Baik' ? 'bg-amber-100 text-amber-700' :
                                                          matPred === 'Memadai' ? 'bg-blue-100 text-blue-700' :
                                                          'bg-gray-100 text-gray-600'
                                                      }`}>
                                                          {matPred}
                                                      </span>
                                                  )}
                                              </div>
                                          </div>
                                          
                                          <div className="flex justify-between items-center text-xs">
                                              <span className="text-slate-500 font-bold">Bahasa Indonesia (TKA)</span>
                                              <div className="flex items-center gap-2">
                                                  <span className={`font-bold ${tka.indo > 0 ? 'text-slate-800' : 'text-slate-300'}`}>
                                                      {tka.indo > 0 ? tka.indo : '-'}
                                                  </span>
                                                  {tka.indo > 0 && (
                                                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                                          indoPred === 'Istimewa' ? 'bg-rose-100 text-rose-700' :
                                                          indoPred === 'Baik' ? 'bg-amber-100 text-amber-700' :
                                                          indoPred === 'Memadai' ? 'bg-blue-100 text-blue-700' :
                                                          'bg-gray-100 text-gray-600'
                                                      }`}>
                                                          {indoPred}
                                                      </span>
                                                  )}
                                              </div>
                                          </div>

                                          <div className="flex justify-between items-center text-xs">
                                              <span className="text-slate-500 font-bold">IPA (TKA)</span>
                                              <div className="flex items-center gap-2">
                                                  <span className={`font-bold ${tka.ipa > 0 ? 'text-slate-800' : 'text-slate-300'}`}>
                                                      {tka.ipa > 0 ? tka.ipa : '-'}
                                                  </span>
                                                  {tka.ipa > 0 && (
                                                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                                          ipaPred === 'Istimewa' ? 'bg-rose-100 text-rose-700' :
                                                          ipaPred === 'Baik' ? 'bg-amber-100 text-amber-700' :
                                                          ipaPred === 'Memadai' ? 'bg-blue-100 text-blue-700' :
                                                          'bg-gray-100 text-gray-600'
                                                      }`}>
                                                          {ipaPred}
                                                      </span>
                                                  )}
                                              </div>
                                          </div>
                                      </div>
                                      {!hasData && (
                                          <div className="text-center text-[11px] text-slate-400 italic mt-3 border-t pt-2">
                                              Belum ada nilai yang diinput.
                                          </div>
                                      )}
                                  </div>
                              );
                          })}
                      </div>
                  </div>
                  )}

                  {/* Split view for Agenda and documentation (placed to the right of agenda) */}
                  <div className={`grid grid-cols-1 ${imagesForCarousel.length > 0 ? 'lg:grid-cols-2' : ''} gap-6 mb-6 animate-fade-in-up`}>
                      {/* 5. Agenda */}
                      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col h-full justify-between min-h-[350px]">
                          <div>
                              <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                                  <ListTodo className="mr-2 text-[#5AB2FF]" size={18}/> Agenda Kegiatan
                              </h3>
                              <div className="space-y-3 max-h-[290px] overflow-y-auto pr-1">
                                  {upcomingAgendas.length === 0 ? (
                                      <div className="text-center text-gray-400 text-sm py-8 italic">Tidak ada agenda mendatang.</div>
                                  ) : (
                                      upcomingAgendas.slice(0, 5).map(agenda => (
                                          <div key={agenda.id} className="flex items-start p-3 bg-gray-50 rounded-xl border border-gray-100 transition-all hover:bg-slate-50/80">
                                              <div className={`mt-1.5 w-2.5 h-2.5 rounded-full mr-3 shrink-0 ${agenda.type==='urgent'?'bg-red-500': agenda.type==='warning'?'bg-amber-500':'bg-blue-500'}`}></div>
                                              <div>
                                                  <p className="text-xs text-gray-500 mb-1 flex items-center font-medium">
                                                      <Calendar size={10} className="mr-1"/> {new Date(agenda.date).toLocaleDateString('id-ID', {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'})}
                                                  </p>
                                                  <h4 className="text-sm font-bold text-gray-800">{agenda.title}</h4>
                                              </div>
                                          </div>
                                      ))
                                  )}
                              </div>
                          </div>
                      </div>

                      {/* Carousel Dokumentasi */}
                      {imagesForCarousel.length > 0 && (
                          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col h-full justify-between min-h-[350px] group">
                            <div>
                              <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                                  <Camera className="mr-2 text-indigo-500" size={20}/> Dokumentasi Kegiatan Kelas
                              </h3>
                              <div className="relative w-full aspect-video bg-gray-100 rounded-xl shadow-inner border border-gray-200 overflow-hidden">
                                <div className="w-full h-full flex overflow-hidden bg-black">
                                  {imagesForCarousel.map((image, idx) => (
                                      <div 
                                          key={image.id}
                                          className="w-full h-full flex-shrink-0 transition-transform duration-700 ease-in-out relative overflow-hidden"
                                          style={{ transform: `translateX(-${carouselIndex * 100}%)` }}
                                      >
                                          {idx === carouselIndex ? (
                                            (() => {
                                              const isVideo = isVideoLink(image.linkFoto);
                                              if (isVideo) {
                                                const embedUrl = getMediaEmbedUrl(image.linkFoto);
                                                if (embedUrl) {
                                                  const ytThumb = getYoutubeThumbnail(image.linkFoto);
                                                  return (
                                                    <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden select-none">
                                                      {ytThumb && (
                                                        <img 
                                                          src={ytThumb} 
                                                          alt="" 
                                                          className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-105 pointer-events-none select-none" 
                                                        />
                                                      )}
                                                      <iframe 
                                                        src={embedUrl}
                                                        className="relative z-10 w-full h-full border-0"
                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                        allowFullScreen
                                                      />
                                                    </div>
                                                  );
                                                }
                                                return (
                                                  <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden">
                                                    <video 
                                                      src={image.linkFoto} 
                                                      className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-105 pointer-events-none select-none" 
                                                      muted 
                                                      loop 
                                                      autoPlay 
                                                      playsInline 
                                                    />
                                                    <video 
                                                      src={image.linkFoto}
                                                      controls
                                                      autoPlay
                                                      className="relative z-10 max-w-full max-h-full object-contain bg-transparent"
                                                      playsInline
                                                    />
                                                  </div>
                                                );
                                              }
                                              return (
                                                <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden select-none">
                                                  <img 
                                                    src={image.linkFoto} 
                                                    alt="" 
                                                    className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-105 pointer-events-none select-none" 
                                                  />
                                                  <img 
                                                    src={image.linkFoto} 
                                                    alt={image.namaKegiatan} 
                                                    className="relative z-10 max-w-full max-h-full object-contain pointer-events-auto" 
                                                  />
                                                </div>
                                              );
                                            })()
                                          ) : (
                                            <div className="w-full h-full bg-black flex items-center justify-center">
                                              {isVideoLink(image.linkFoto) ? (
                                                <p className="text-gray-500 font-semibold text-sm">{image.namaKegiatan} (Video)</p>
                                              ) : (
                                                <img src={image.linkFoto} alt={image.namaKegiatan} className="w-full h-full object-contain opacity-35" />
                                              )}
                                            </div>
                                          )}
                                      </div>
                                  ))}
                                </div>
                                
                                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/85 to-transparent pointer-events-none z-10"></div>
      
                                <div className="absolute bottom-3 left-3 text-white drop-shadow-lg max-w-[calc(100%-60px)] z-20 pointer-events-none">
                                    <p className="font-bold text-xs sm:text-sm truncate">{imagesForCarousel[carouselIndex]?.namaKegiatan}</p>
                                </div>
      
                                {imagesForCarousel.length > 1 && (
                                    <>
                                        <button onClick={(e) => { e.stopPropagation(); goToPreviousSlide(); }} className="absolute top-1/2 left-3 -translate-y-1/2 bg-white/60 p-1.5 rounded-full text-gray-800 hover:bg-white transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm z-20 cursor-pointer">
                                            <ChevronLeft size={20} />
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); goToNextSlide(); }} className="absolute top-1/2 right-3 -translate-y-1/2 bg-white/60 p-1.5 rounded-full text-gray-800 hover:bg-white transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm z-20 cursor-pointer">
                                            <ChevronRight size={20} />
                                        </button>
                                        <div className="absolute bottom-3 right-3 flex gap-1 z-20">
                                            {imagesForCarousel.map((_, i) => (
                                                <div 
                                                    key={i} 
                                                    onClick={(e) => { e.stopPropagation(); setCarouselIndex(i); }} 
                                                    className={`w-1.5 h-1.5 rounded-full cursor-pointer transition-all ${carouselIndex === i ? 'bg-white scale-125' : 'bg-white/40'}`}
                                                ></div>
                                            ))}
                                        </div>
                                    </>
                                )}
                              </div>
                            </div>
                          </div>
                      )}
                  </div>

                  {/* 4. REKAP RAPOR TABLE (CONDITIONAL) */}
                  {showRecapReport && myRecapData && (
                      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm animate-fade-in-up">
                          <div className="flex justify-between items-center mb-4">
                              <h3 className="font-bold text-gray-800 flex items-center">
                                  <Trophy className="mr-2 text-amber-500" size={20}/> Rekapitulasi Nilai Rapor
                              </h3>
                              <div className="flex items-center gap-2">
                                  <span className="text-xs bg-amber-50 text-amber-700 px-3 py-1 rounded-full font-bold border border-amber-100">
                                      Ranking: {myRecapData.rank}
                                  </span>
                                  <span className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-bold border border-emerald-100">
                                      Total: {myRecapData.total}
                                  </span>
                              </div>
                          </div>
                          
                          <div className="overflow-x-auto">
                              <table className="w-full text-sm text-left border-collapse rounded-lg overflow-hidden">
                                  <thead className="bg-slate-50 text-slate-600 font-bold text-xs uppercase">
                                      <tr>
                                          <th className="p-3">Mata Pelajaran</th>
                                          <th className="p-3 text-center">Sum 1</th>
                                          <th className="p-3 text-center">Sum 2</th>
                                          <th className="p-3 text-center">Sum 3</th>
                                          <th className="p-3 text-center">Sum 4</th>
                                          <th className="p-3 text-center bg-blue-50/50">SAS</th>
                                          <th className="p-3 text-center bg-emerald-50 text-emerald-700">Akhir</th>
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100">
                                      {myRecapData.subjects.map((subj, idx) => {
                                          const kktp = kktpMap[subj.id] || MOCK_SUBJECTS.find(s => s.id === subj.id)?.kkm || 75;
                                          const isBelowKktp = subj.final > 0 && subj.final < kktp;
                                          return (
                                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                <td className="p-3 font-medium text-gray-700">{subj.name}</td>
                                                <td className="p-3 text-center text-gray-500">{subj.sum1 || '-'}</td>
                                                <td className="p-3 text-center text-gray-500">{subj.sum2 || '-'}</td>
                                                <td className="p-3 text-center text-gray-500">{subj.sum3 || '-'}</td>
                                                <td className="p-3 text-center text-gray-500">{subj.sum4 || '-'}</td>
                                                <td className="p-3 text-center font-semibold bg-blue-50/30 text-blue-700">{subj.sas || '-'}</td>
                                                <td className={`p-3 text-center font-bold bg-emerald-50/50 text-emerald-700`}>
                                                    <div className="flex flex-col items-center">
                                                        <span>{subj.final || '-'}</span>
                                                        {subj.final > 0 && (
                                                            <span className={`text-[9px] font-bold mt-1 ${isBelowKktp ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                                {isBelowKktp ? 'Remedial' : 'Pengayaan'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                      })}
                                  </tbody>
                              </table>
                          </div>
                      </div>
                  )}



                  {/* 6. Peminjaman Buku Paket */}
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm animate-fade-in-up">
                      <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                          <BookOpen className="mr-2 text-indigo-500" size={20}/> Informasi Peminjaman Buku Paket
                      </h3>
                      <div className="overflow-x-auto">
                          <table className="w-full text-sm text-left border-collapse rounded-lg overflow-hidden">
                              <thead className="bg-indigo-50 text-indigo-800 font-bold text-xs uppercase">
                                  <tr>
                                      <th className="p-3 text-center w-12">No</th>
                                      <th className="p-3">Buku Paket</th>
                                      <th className="p-3 text-center">Jumlah</th>
                                      <th className="p-3 text-center">Status</th>
                                      <th className="p-3">Keterangan</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                  {bookLoans.length === 0 ? (
                                      <tr>
                                          <td colSpan={5} className="p-8 text-center text-gray-400 italic">
                                              Tidak ada data peminjaman buku.
                                          </td>
                                      </tr>
                                  ) : (
                                      bookLoans.map((loan, idx) => (
                                          <tr key={loan.id} className="hover:bg-indigo-50/30 transition-colors">
                                              <td className="p-3 text-center text-gray-500 font-mono">{idx + 1}</td>
                                              <td className="p-3">
                                                  <div className="flex flex-wrap gap-1">
                                                      {loan.books.map((book: string, bIdx: number) => (
                                                          <span 
                                                              key={bIdx} 
                                                              className="px-2 py-0.5 bg-white border border-indigo-100 text-indigo-700 rounded-full text-[10px] font-medium shadow-sm"
                                                          >
                                                              {book}
                                                          </span>
                                                      ))}
                                                  </div>
                                                  <div className="text-[10px] text-gray-400 mt-1">
                                                      Pinjam pada {new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(loan.date))}
                                                  </div>
                                              </td>
                                              <td className="p-3 text-center font-bold text-indigo-600">{loan.qty}</td>
                                              <td className="p-3 text-center">
                                                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
                                                      loan.status === 'Dipinjam' 
                                                          ? 'bg-amber-50 text-amber-700 border-amber-200' 
                                                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                  }`}>
                                                      {loan.status === 'Dipinjam' ? <Clock size={12} className="mr-1" /> : <CheckCircle size={12} className="mr-1" />}
                                                      {loan.status}
                                                  </span>
                                              </td>
                                              <td className="p-3 text-gray-600 italic text-xs">
                                                  {loan.notes || '-'}
                                              </td>
                                          </tr>
                                      ))
                                  )}
                              </tbody>
                          </table>
                      </div>
                  </div>

                  {/* 7. Ketersediaan Buku Paket (Visual Inventory) */}
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm animate-fade-in-up">
                      <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                          <Book className="mr-2 text-indigo-500" size={20}/> Ketersediaan Buku Paket
                      </h3>
                      
                      {loadingInventory ? (
                          <div className="flex justify-center items-center p-8">
                              <Loader2 className="animate-spin text-indigo-500" size={24} />
                              <span className="ml-2 text-sm text-gray-500">Memuat data buku...</span>
                          </div>
                      ) : inventory.length === 0 ? (
                          <div className="text-center p-8 text-gray-400 italic text-sm">
                              Belum ada data stok buku paket.
                          </div>
                      ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                              {inventory.map((book) => (
                                  <div key={book.id} className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all group">
                                      <div className="aspect-[3/4] bg-gray-200 relative overflow-hidden">
                                          {book.coverUrl ? (
                                              <img 
                                                  src={book.coverUrl} 
                                                  alt={book.name} 
                                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                              />
                                          ) : (
                                              <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                  <Book size={40} />
                                              </div>
                                          )}
                                          <div className="absolute top-2 right-2">
                                              <span className={`px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm ${
                                                  book.stock > 0 
                                                  ? 'bg-emerald-500 text-white' 
                                                  : 'bg-red-500 text-white'
                                              }`}>
                                                  {book.stock > 0 ? 'Tersedia' : 'Habis'}
                                              </span>
                                          </div>
                                      </div>
                                      <div className="p-3">
                                          <div className="text-xs font-bold text-gray-800 truncate" title={book.name}>
                                              {book.name}
                                          </div>
                                          <div className="flex justify-between items-center mt-1">
                                              <span className="text-[10px] text-gray-500 uppercase font-semibold">Tersisa</span>
                                              <span className={`text-xs font-bold ${book.stock < 5 ? 'text-red-500' : 'text-indigo-600'}`}>
                                                  {book.stock} Eks
                                              </span>
                                          </div>
                                          {book.digitalUrl && (
                                            <button onClick={() => window.open(book.digitalUrl!, '_blank')} className="mt-2 w-full flex items-center justify-center gap-1 text-[10px] bg-indigo-50 text-indigo-700 py-1 rounded hover:bg-indigo-100 transition-colors">
                                              <BookOpen size={12} />
                                              Baca
                                            </button>
                                          )}
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              </div>
          )}

          {/* --- ATTENDANCE & PERMISSION TAB --- */}
          {activeTab === 'attendance' && (
              <div className="space-y-6">
                  {/* Calendar View */}
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                      <div className="flex justify-between items-center mb-4">
                          <h3 className="font-bold text-gray-800 flex items-center">
                              <Calendar className="mr-2 text-[#5AB2FF]" size={18}/> Kalender Kehadiran
                          </h3>
                          <div className="flex items-center space-x-2">
                              <button onClick={prevMonth} className="p-1 rounded-full hover:bg-gray-100 text-gray-500 transition-colors">
                                  <ChevronLeft size={20} />
                              </button>
                              <span className="font-bold text-sm text-gray-700 w-32 text-center">
                                  {calendarMonth.toLocaleString('id-ID', { month: 'long', year: 'numeric' })}
                              </span>
                              <button onClick={nextMonth} className="p-1 rounded-full hover:bg-gray-100 text-gray-500 transition-colors">
                                  <ChevronRight size={20} />
                              </button>
                          </div>
                      </div>
                      
                      <div className="grid grid-cols-7 gap-1 mb-2">
                          {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(day => (
                              <div key={day} className="text-center text-xs font-bold text-gray-400 py-2">{day}</div>
                          ))}
                      </div>
                      <div className="grid grid-cols-7 gap-2">
                          {calendarDays.map((dayData, index) => {
                              if (!dayData) {
                                  return <div key={`empty-${index}`} className="h-12 rounded-lg bg-gray-50/50"></div>;
                              }
                              
                              let bgColor = 'bg-gray-50 hover:bg-gray-100';
                              let textColor = 'text-gray-700';
                              let borderColor = 'border-gray-100';
                              
                              if (dayData.holidayCode) {
                                  const isMPLS = dayData.holidayCode === 'MPLS';
                                  const isKTS = dayData.holidayCode === 'KTS';
                                  bgColor = isMPLS ? 'bg-teal-100 hover:bg-teal-200' : isKTS ? 'bg-purple-100 hover:bg-purple-200' : 'bg-red-50 hover:bg-red-100';
                                  textColor = isMPLS ? 'text-teal-800' : isKTS ? 'text-purple-800' : 'text-red-700';
                                  borderColor = isMPLS ? 'border-teal-200' : isKTS ? 'border-purple-200' : 'border-red-200';
                              }
                              
                              if (dayData.status === 'sick') {
                                  bgColor = 'bg-amber-100';
                                  textColor = 'text-amber-800';
                                  borderColor = 'border-amber-200';
                              } else if (dayData.status === 'permit') {
                                  bgColor = 'bg-blue-100';
                                  textColor = 'text-blue-800';
                                  borderColor = 'border-blue-200';
                              } else if (dayData.status === 'alpha') {
                                  bgColor = 'bg-red-100';
                                  textColor = 'text-red-800';
                                  borderColor = 'border-red-200';
                              } else if (dayData.status === 'present' || dayData.status === 'dispensation') {
                                  bgColor = 'bg-emerald-50';
                                  textColor = 'text-emerald-700';
                                  borderColor = 'border-emerald-100';
                              }

                              const isToday = dayData.dateStr === getLocalISODate();

                              return (
                                  <div 
                                      key={dayData.dateStr} 
                                      className={`relative h-14 rounded-xl border flex flex-col items-center justify-center transition-all group cursor-default ${bgColor} ${borderColor} ${isToday ? 'ring-2 ring-[#5AB2FF] ring-offset-1' : ''}`}
                                  >
                                      <span className={`text-sm font-bold ${textColor}`}>{dayData.day}</span>
                                      {dayData.status && dayData.status !== 'present' && dayData.status !== 'dispensation' && (
                                          <span className="text-[9px] font-bold uppercase mt-0.5 opacity-80">
                                              {dayData.status === 'sick' ? 'Sakit' : dayData.status === 'permit' ? 'Izin' : 'Alpha'}
                                          </span>
                                      )}
                                      {!dayData.status && dayData.holidayCode && (
                                          <span className={`text-[9px] font-bold uppercase mt-0.5 opacity-80 ${['MPLS', 'KTS'].includes(dayData.holidayCode) ? textColor : 'text-red-600'} truncate w-full text-center px-1`}>
                                              {['MPLS', 'KTS'].includes(dayData.holidayCode) ? dayData.holidayCode : 'Libur'}
                                          </span>
                                      )}
                                      
                                      {/* Tooltip for reason or holiday */}
                                      {(dayData.reason || dayData.holidayLabel) && (
                                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 pointer-events-none shadow-xl">
                                              <div className="font-bold mb-1 border-b border-gray-600 pb-1">Keterangan:</div>
                                              <p className="line-clamp-3">{dayData.reason || dayData.holidayLabel}</p>
                                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-800"></div>
                                          </div>
                                      )}
                                  </div>
                              );
                          })}
                      </div>
                      
                      <div className="mt-4 flex flex-wrap gap-3 justify-center text-xs">
                          <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-emerald-50 border border-emerald-100 mr-1.5"></div><span className="text-gray-600">Hadir</span></div>
                          <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-amber-100 border border-amber-200 mr-1.5"></div><span className="text-gray-600">Sakit</span></div>
                          <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-blue-100 border border-blue-200 mr-1.5"></div><span className="text-gray-600">Izin</span></div>
                          <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-teal-100 border border-teal-200 mr-1.5"></div><span className="text-gray-600">MPLS</span></div>
                          <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-purple-100 border border-purple-200 mr-1.5"></div><span className="text-gray-600">KTS</span></div>
                          <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-red-100 border border-red-200 mr-1.5"></div><span className="text-gray-600">Alpha / Libur</span></div>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Form Pengajuan */}
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                      <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                          <PlusCircle size={18} className="mr-2 text-[#5AB2FF]"/> Ajukan Izin / Sakit
                      </h3>
                      <form onSubmit={handleSubmitPermission} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 mb-1">Tanggal</label>
                                  <input 
                                    type="date" 
                                    className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#5AB2FF] outline-none"
                                    value={permissionForm.date}
                                    onChange={e => setPermissionForm({...permissionForm, date: e.target.value})}
                                    required
                                  />
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 mb-1">Jenis Izin</label>
                                  <select 
                                    className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#5AB2FF] outline-none bg-white"
                                    value={permissionForm.type}
                                    onChange={e => setPermissionForm({...permissionForm, type: e.target.value})}
                                  >
                                      <option value="sick">Sakit</option>
                                      <option value="permit">Izin</option>
                                      <option value="dispensation">Dispensasi</option>
                                  </select>
                              </div>
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1">Alasan / Keterangan</label>
                              <textarea 
                                rows={2}
                                className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#5AB2FF] outline-none resize-none"
                                placeholder="Jelaskan alasan ketidakhadiran..."
                                value={permissionForm.reason}
                                onChange={e => setPermissionForm({...permissionForm, reason: e.target.value})}
                                required
                              />
                          </div>
                          <div className="flex justify-end">
                              <button 
                                type="submit" 
                                disabled={isSubmittingPermission}
                                className="bg-[#5AB2FF] text-white px-6 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-[#A0DEFF] transition-all flex items-center disabled:opacity-70"
                              >
                                  {isSubmittingPermission ? <Loader2 size={16} className="animate-spin"/> : <Send size={16} className="mr-2"/>}
                                  Kirim Pengajuan
                              </button>
                          </div>
                      </form>
                  </div>

                  {/* Riwayat Pengajuan */}
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                      <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                          <History size={18} className="mr-2 text-gray-500"/> Riwayat Pengajuan
                      </h3>
                      <div className="space-y-3">
                          {myPermissions.length === 0 ? (
                              <p className="text-center text-gray-400 text-sm py-4 italic">Belum ada riwayat pengajuan.</p>
                          ) : (
                              myPermissions.map(req => (
                                  <div key={req.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                                      <div>
                                          <div className="flex items-center gap-2 mb-1">
                                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                                  req.type==='sick'?'bg-amber-100 text-amber-700':
                                                  req.type==='dispensation'?'bg-teal-100 text-teal-700':
                                                  'bg-blue-100 text-blue-700'
                                              }`}>
                                                  {req.type === 'sick' ? 'Sakit' : req.type === 'dispensation' ? 'Dispen' : 'Izin'}
                                              </span>
                                              <span className="text-xs text-gray-500 font-medium">
                                                  {new Date(req.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'long'})}
                                              </span>
                                          </div>
                                          <p className="text-sm text-gray-700 font-medium line-clamp-1">{req.reason}</p>
                                      </div>
                                      <div className="text-right flex flex-col items-end gap-1">
                                          <span className={`text-xs font-bold px-2 py-1 rounded-full border ${
                                              req.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                              req.status === 'Rejected' ? 'bg-red-50 text-red-600 border-red-200' :
                                              'bg-gray-100 text-gray-500 border-gray-200'
                                          }`}>
                                              {req.status === 'Approved' ? 'Diterima' : req.status === 'Rejected' ? 'Ditolak' : 'Menunggu'}
                                          </span>
                                          {req.status === 'Rejected' && req.rejectionReason && (
                                              <span className="text-[10px] text-red-500 italic max-w-[120px] text-right leading-tight">
                                                  Alasan: {req.rejectionReason}
                                              </span>
                                          )}
                                      </div>
                                  </div>
                              ))
                          )}
                      </div>
                  </div>
              </div>
          </div>
          )}

          {/* --- MATERI TAB --- */}
          {activeTab === 'materi' && (
              <div className="space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                      <div className="flex justify-between items-center mb-6">
                          <h3 className="font-bold text-gray-800 flex items-center text-lg">
                              <BookOpen size={20} className="mr-2 text-blue-500"/> Materi Pembelajaran
                          </h3>
                          {viewingMaterialLink && (
                              <button 
                                  onClick={() => setViewingMaterialLink(null)}
                                  className="flex items-center px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-200 transition-all"
                              >
                                  <ChevronLeft size={16} className="mr-1"/> Kembali ke Daftar
                              </button>
                          )}
                      </div>
                      
                      {viewingMaterialLink ? (
                          <div className="w-full h-[80vh] rounded-2xl overflow-hidden border border-gray-200 bg-gray-50">
                              <iframe 
                                  src={viewingMaterialLink} 
                                  className="w-full h-full border-none"
                                  title="Materi Pembelajaran"
                                  allowFullScreen
                              />
                          </div>
                      ) : (
                          <>
                               {/* Search & Subject Filter Bar */}
                               <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6 bg-slate-50/80 p-3 rounded-2xl border border-slate-200/80">
                                   <div className="relative flex-1">
                                       <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                                       <input
                                           type="text"
                                           placeholder="Cari materi, topik, atau kata kunci..."
                                           value={materialSearchQuery}
                                           onChange={(e) => setMaterialSearchQuery(e.target.value)}
                                           className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all shadow-sm"
                                       />
                                       {materialSearchQuery && (
                                           <button 
                                               type="button"
                                               onClick={() => setMaterialSearchQuery('')}
                                               className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100 transition-colors"
                                           >
                                               <X size={15} />
                                           </button>
                                       )}
                                   </div>

                                   <div className="relative min-w-[200px] sm:w-64">
                                       <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={17} />
                                       <select
                                           value={materialSelectedSubject}
                                           onChange={(e) => setMaterialSelectedSubject(e.target.value)}
                                           className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 appearance-none cursor-pointer transition-all shadow-sm"
                                       >
                                           <option value="ALL">Semua Mata Pelajaran</option>
                                           {MOCK_SUBJECTS.map((subj) => (
                                               <option key={subj.id} value={subj.id}>
                                                   {subj.name}
                                               </option>
                                           ))}
                                       </select>
                                       <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                                   </div>
                               </div>

                               {filteredMaterials.length === 0 ? (
                                   <div className="text-center py-12 px-4 bg-slate-50/60 rounded-2xl border border-dashed border-slate-300">
                                       <BookOpen size={48} className="mx-auto text-slate-300 mb-3" />
                                       <p className="text-slate-700 font-bold text-base mb-1">
                                           {materials.length === 0 ? 'Belum Ada Materi' : 'Materi Tidak Ditemukan'}
                                       </p>
                                       <p className="text-slate-500 text-xs max-w-md mx-auto mb-4">
                                           {materials.length === 0 
                                               ? 'Belum ada materi pembelajaran yang dibagikan oleh guru untuk kelas Anda.' 
                                               : 'Coba sesuaikan kata kunci pencarian atau ganti filter mata pelajaran.'}
                                       </p>
                                       {(materialSearchQuery || materialSelectedSubject !== 'ALL') && (
                                           <button
                                               type="button"
                                               onClick={() => {
                                                   setMaterialSearchQuery('');
                                                   setMaterialSelectedSubject('ALL');
                                               }}
                                               className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
                                           >
                                               <RotateCcw size={14} />
                                               <span>Reset Pencarian & Filter</span>
                                           </button>
                                       )}
                                   </div>
                               ) : (
                                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                       {filteredMaterials.map((material) => {
                                          const subject = MOCK_SUBJECTS.find(s => s.id === material.subjectId);
                                          const decoration = SUBJECT_DECORATIONS[material.subjectId?.toLowerCase()] || SUBJECT_DECORATIONS['default'];
                                          const IconComponent = decoration.icon;
                                          const formattedDate = new Intl.DateTimeFormat('id-ID', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric'
                                          }).format(new Date(material.createdAt));

                                          return (
                                              <div 
                                                  key={material.id} 
                                                  className={`flex flex-col justify-between bg-gradient-to-br ${decoration.gradient} rounded-2xl border-2 ${decoration.borderColor} p-6 shadow-sm ${decoration.shadow} hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1.5 overflow-hidden group relative`}
                                              >
                                                  {/* Ambient Large Floating Symbol in the Background */}
                                                  <div className="absolute -right-6 -bottom-6 text-8xl opacity-[0.06] select-none pointer-events-none transform rotate-12 transition-transform duration-500 group-hover:scale-125 group-hover:rotate-45">
                                                      {decoration.emoji}
                                                  </div>

                                                  <div>
                                                      {/* Top Section with Icon and Date */}
                                                      <div className="flex justify-between items-center mb-5 relative z-10">
                                                          <div className={`p-2.5 rounded-xl ${decoration.accentColor} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                                                              <IconComponent size={24} className="stroke-[2.5]" />
                                                          </div>
                                                          <div className="flex items-center space-x-1 text-[11px] font-bold text-gray-500/80 bg-white/60 px-2.5 py-1 rounded-full border border-gray-100 backdrop-blur-sm shadow-sm">
                                                              <Calendar size={12} className="text-gray-400" />
                                                              <span>{formattedDate}</span>
                                                          </div>
                                                      </div>

                                                      {/* Badge & Subject Information */}
                                                      <div className="mb-3 relative z-10">
                                                          <span className={`inline-flex items-center gap-1.5 text-[10px] md:text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full ${decoration.badgeBg}`}>
                                                              <span className="text-sm leading-none">{decoration.emoji}</span>
                                                              <span>{subject?.name || material.subjectId}</span>
                                                          </span>
                                                           {(material.taskLink || material.taskFile || material.taskTitle) && (
                                                               <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] md:text-xs font-black bg-amber-500 text-white shadow-sm uppercase tracking-wide">
                                                                   <ClipboardList size={12} />
                                                                   Ada Tugas
                                                               </span>
                                                           )}
                                                      </div>

                                                      {/* Poster Thumbnail inside Card */}
                                                      {material.infographic && (
                                                        <div 
                                                          onClick={() => setViewingPoster(material)}
                                                          className="mb-4 rounded-xl overflow-hidden border border-gray-150/80 aspect-video relative group/poster bg-slate-900 cursor-pointer shadow-md"
                                                        >
                                                          <img 
                                                            src={material.infographic} 
                                                            alt={`Poster ${material.title}`}
                                                            className="w-full h-full object-cover group-hover/poster:scale-105 transition-transform duration-300"
                                                            referrerPolicy="no-referrer"
                                                          />
                                                          <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/poster:opacity-100 flex items-center justify-center transition-all duration-300">
                                                            <div className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full text-[11px] font-black text-slate-800 flex items-center gap-1 shadow-md scale-90 group-hover/poster:scale-100 transition-all duration-300">
                                                              <ImageIcon size={12} className="text-indigo-600 animate-pulse" />
                                                              <span>Zoom Poster</span>
                                                            </div>
                                                          </div>
                                                        </div>
                                                      )}

                                                      {/* Title and Description */}
                                                      <h4 className={`font-black text-base md:text-lg ${decoration.textColor} mb-2 leading-tight tracking-tight group-hover:text-blue-600 transition-colors relative z-10`}>
                                                          {material.title}
                                                      </h4>
                                                      <p className="text-xs font-medium text-gray-600 mb-6 line-clamp-3 leading-relaxed relative z-10">
                                                          {material.description || 'Tidak ada deskripsi tambahan untuk materi ini.'}
                                                      </p>
                                                  </div>

                                                  {/* Interactive Action Button Panels */}
                                                  <div className="flex flex-col gap-2.5 mt-auto relative z-10">
                                                     {(material.taskLink || material.taskFile || material.taskTitle) && (
                                                       <button 
                                                           type="button"
                                                           onClick={() => setViewingTask(material)}
                                                           className="w-full flex items-center justify-center py-2.5 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs md:text-sm font-extrabold shadow-md shadow-amber-500/15 hover:shadow-amber-500/20 active:scale-98 transition-all transform hover:scale-[1.02] cursor-pointer"
                                                       >
                                                           <ClipboardList size={18} className="mr-2" /> Kerjakan / Lihat Tugas
                                                       </button>
                                                     )}
                                                    {material.infographic && (
                                                      <button 
                                                          type="button"
                                                          onClick={() => setViewingPoster(material)}
                                                          className="w-full flex items-center justify-center py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs md:text-sm font-extrabold shadow-md shadow-indigo-500/15 hover:shadow-indigo-500/20 active:scale-98 transition-all transform hover:scale-[1.02] cursor-pointer"
                                                      >
                                                          <ImageIcon size={18} className="mr-2" /> Lihat Poster / Infografis
                                                      </button>
                                                    )}
                                                    {material.videoLink && (
                                                      <button 
                                                          type="button"
                                                          onClick={() => handleOpenVideo(material.videoLink as string)}
                                                          className="w-full flex items-center justify-center py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs md:text-sm font-extrabold shadow-md shadow-red-500/15 hover:shadow-red-500/20 active:scale-98 transition-all transform hover:scale-[1.02] cursor-pointer"
                                                      >
                                                          <Youtube size={18} className="mr-2 animate-pulse" /> Nonton Video Pembelajaran
                                                      </button>
                                                    )}
                                                    <button 
                                                        type="button"
                                                        onClick={() => setViewingMaterialLink(material.link)}
                                                        className={`w-full flex items-center justify-center py-2.5 px-4 bg-white border border-blue-200 text-blue-600 hover:bg-blue-50/50 rounded-xl text-xs md:text-sm font-extrabold shadow-sm active:scale-98 transition-all transform hover:scale-[1.02] cursor-pointer`}
                                                    >
                                                        <BookOpen size={16} className="mr-2" /> Buka Dokumen Utama
                                                    </button>
                                                  </div>
                                              </div>
                                          );
                                        })}
                                  </div>
                              )}
                          </>
                      )}
                  </div>
              </div>
          )}

          {/* --- SUMATIF TAB --- */}
          {activeTab === 'sumatif' && (
              <SumatifView 
                  currentUser={{ 
                      id: student.id, 
                      fullName: student.name, 
                      role: 'siswa', 
                      classId: student.classId,
                      username: student.nis,
                      studentId: student.id
                  } as any}
                  activeClassId={student.classId}
                  students={[student]}
                  onShowNotification={(msg, type) => showAlert(msg, type === 'warning' ? 'alert' : type)}
              />
          )}

          {/* --- LIAISON BOOK TAB --- */}
          {activeTab === 'liaison' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                      <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                          <MessageSquare size={18} className="mr-2 text-[#5AB2FF]"/> Tulis Pesan ke Wali Kelas
                      </h3>
                      <form onSubmit={handleSubmitLiaison} className="space-y-4">
                          <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1">Kategori</label>
                              <select 
                                className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#5AB2FF] outline-none bg-white"
                                value={liaisonForm.category}
                                onChange={e => setLiaisonForm({...liaisonForm, category: e.target.value})}
                              >
                                  <option value="Informasi">Informasi</option>
                                  <option value="Keluhan">Keluhan / Masalah</option>
                                  <option value="Konsultasi">Konsultasi</option>
                                  <option value="Lainnya">Lainnya</option>
                              </select>
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1">Pesan</label>
                              <textarea 
                                rows={3}
                                className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#5AB2FF] outline-none resize-none"
                                placeholder="Tulis pesan Anda di sini..."
                                value={liaisonForm.message}
                                onChange={e => setLiaisonForm({...liaisonForm, message: e.target.value})}
                                required
                              />
                          </div>
                          <div className="flex justify-end">
                              <button 
                                type="submit" 
                                disabled={isSubmittingLiaison}
                                className="bg-[#5AB2FF] text-white px-6 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-[#A0DEFF] transition-all flex items-center disabled:opacity-70"
                              >
                                  {isSubmittingLiaison ? <Loader2 size={16} className="animate-spin"/> : <Send size={16} className="mr-2"/>}
                                  Kirim Pesan
                              </button>
                          </div>
                      </form>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                      <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                          <History size={18} className="mr-2 text-gray-500"/> Riwayat Pesan
                      </h3>
                      <div className="space-y-4">
                          {myLiaisonLogs.length === 0 ? (
                              <p className="text-center text-gray-400 text-sm py-4 italic">Belum ada pesan.</p>
                          ) : (
                              myLiaisonLogs.map(log => (
                                  <div key={log.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                      <div className="flex justify-between items-start mb-2">
                                          <div className="flex items-center gap-2">
                                              <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100 uppercase">
                                                  {log.category || 'Umum'}
                                              </span>
                                              <span className="text-xs text-gray-400">
                                                  {new Date(log.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}
                                              </span>
                                          </div>
                                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                              log.status === 'Selesai' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                              log.status === 'Ditolak' ? 'bg-red-50 text-red-700 border-red-200' :
                                              log.status === 'Diterima' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                              'bg-amber-50 text-amber-700 border-amber-200'
                                          }`}>
                                              {log.status || 'Terkirim'}
                                          </span>
                                      </div>
                                      <p className="text-sm text-gray-700 leading-relaxed mb-1">{log.message}</p>
                                      
                                      {/* Teacher Response */}
                                      {log.response && (
                                          <div className="mt-3 bg-emerald-50 p-3 rounded-lg border border-emerald-100 text-sm text-gray-800 relative">
                                              <div className="flex items-center gap-1 mb-1">
                                                  <MessageCircle size={12} className="text-emerald-600"/>
                                                  <span className="text-xs font-bold text-emerald-700">Respon Guru:</span>
                                              </div>
                                              {log.response}
                                          </div>
                                      )}

                                      <p className="text-xs text-gray-400 italic text-right mt-2">Pengirim: {log.sender}</p>
                                  </div>
                              ))
                          )}
                      </div>
                  </div>
              </div>
          )}

          {/* --- PROFILE TAB (Separate from Character) --- */}
          {activeTab === 'profile' && (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                  {/* Left Card: Data Pokok */}
                  <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-fit">
                      <h3 className="font-bold text-gray-800 text-lg flex items-center mb-4">
                          <User size={18} className="mr-2 text-indigo-500"/> Data Pokok
                      </h3>
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                          <div className="space-y-4 text-sm">
                              <div><strong className="block text-xs text-gray-500">Nama Lengkap</strong> <span className={`font-semibold text-gray-800 uppercase break-words block leading-snug ${
                                  (student.name?.length || 0) > 25 ? 'text-xs sm:text-sm' : 'text-sm'
                              }`}>{student.name.toUpperCase()}</span></div>
                              <div><strong className="block text-xs text-gray-500">NIS / NISN</strong> <span className="font-semibold text-gray-800">{student.nis} / {student.nisn || '-'}</span></div>
                              <div><strong className="block text-xs text-gray-500">Alamat</strong> <span className="font-semibold text-gray-800">{student.address}</span></div>
                              <div>
                                  <strong className="block text-xs text-gray-500 mb-0.5">No. WA Wali</strong>
                                  {student.parentPhone && student.parentPhone !== '-' ? (
                                      <a
                                          href={formatWaUrl(student.parentPhone)}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1.5 font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200/80 text-xs transition-all cursor-pointer hover:scale-102 shadow-xs"
                                          title="Klik untuk chat WhatsApp Orang Tua"
                                      >
                                          <MessageCircle size={14} className="text-emerald-600 fill-emerald-100" />
                                          <span>{student.parentPhone}</span>
                                          <ExternalLink size={11} className="text-emerald-500 ml-0.5" />
                                      </a>
                                  ) : (
                                      <span className="font-semibold text-gray-800">-</span>
                                  )}
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* Right Card: Editable Data */}
                  <div className="lg:col-span-3 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                      <div className="flex justify-between items-center mb-6">
                          <h3 className="font-bold text-gray-800 text-lg flex items-center">
                              <Edit size={18} className="mr-2 text-indigo-500"/> Edit Profil Siswa
                          </h3>
                          {!isEditingProfile ? (
                              <button onClick={() => setIsEditingProfile(true)} className="flex items-center gap-2 bg-white text-indigo-600 font-bold px-4 py-2 rounded-lg border border-indigo-200 hover:bg-indigo-50 shadow-sm text-xs">
                                  <Edit size={14}/> Ubah Data
                              </button>
                          ) : (
                              <div className="flex gap-2">
                                  <button onClick={() => { setIsEditingProfile(false); setProfileData(student); }} className="px-3 py-1.5 text-gray-600 font-medium rounded-lg hover:bg-gray-100 text-xs">Batal</button>
                                  <button onClick={handleSaveProfile} disabled={isSavingProfile} className="flex items-center gap-2 bg-indigo-600 text-white font-bold px-3 py-1.5 rounded-lg shadow-md hover:bg-indigo-700 disabled:opacity-50 text-xs">
                                      {isSavingProfile ? <Loader2 size={12} className="animate-spin"/> : <Save size={12}/>} Simpan
                                  </button>
                              </div>
                          )}
                      </div>

                      <div className="space-y-6 text-sm">
                          <div>
                              <h4 className="text-xs font-bold text-indigo-600 uppercase mb-2 border-b border-indigo-100 pb-1">Data Fisik & Kesehatan</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mt-2">
                                  <div>
                                      <label className="block text-xs font-bold text-gray-500 mb-1">Tinggi Badan (cm)</label>
                                      <input type="number" value={profileData.height || 0} onChange={e => handleProfileChange('height', Number(e.target.value))} disabled={!isEditingProfile} className="w-full border p-2 rounded-lg bg-white disabled:bg-gray-50 disabled:text-gray-500 outline-none focus:ring-2 focus:ring-indigo-500"/>
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-gray-500 mb-1">Berat Badan (kg)</label>
                                      <input type="number" value={profileData.weight || 0} onChange={e => handleProfileChange('weight', Number(e.target.value))} disabled={!isEditingProfile} className="w-full border p-2 rounded-lg bg-white disabled:bg-gray-50 disabled:text-gray-500 outline-none focus:ring-2 focus:ring-indigo-500"/>
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-gray-500 mb-1">Golongan Darah</label>
                                      <input type="text" value={profileData.bloodType || ''} onChange={e => handleProfileChange('bloodType', e.target.value)} disabled={!isEditingProfile} className="w-full border p-2 rounded-lg bg-white disabled:bg-gray-50 disabled:text-gray-500 outline-none focus:ring-2 focus:ring-indigo-500"/>
                                  </div>
                                  <div className="md:col-span-2">
                                      <label className="block text-xs font-bold text-gray-500 mb-1">Riwayat Penyakit / Catatan Kesehatan</label>
                                      <textarea rows={2} value={profileData.healthNotes || ''} onChange={e => handleProfileChange('healthNotes', e.target.value)} disabled={!isEditingProfile} className="w-full border p-2 rounded-lg bg-white disabled:bg-gray-50 disabled:text-gray-500 outline-none focus:ring-2 focus:ring-indigo-500 resize-none"/>
                                  </div>
                              </div>
                          </div>

                          <div>
                              <h4 className="text-xs font-bold text-indigo-600 uppercase mb-2 border-b border-indigo-100 pb-1">Minat & Impian</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mt-2">
                                  <div>
                                      <label className="block text-xs font-bold text-gray-500 mb-1">Hobi</label>
                                      <input type="text" value={profileData.hobbies || ''} onChange={e => handleProfileChange('hobbies', e.target.value)} disabled={!isEditingProfile} className="w-full border p-2 rounded-lg bg-white disabled:bg-gray-50 disabled:text-gray-500 outline-none focus:ring-2 focus:ring-indigo-500"/>
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-gray-500 mb-1">Cita-cita</label>
                                      <input type="text" value={profileData.ambition || ''} onChange={e => handleProfileChange('ambition', e.target.value)} disabled={!isEditingProfile} className="w-full border p-2 rounded-lg bg-white disabled:bg-gray-50 disabled:text-gray-500 outline-none focus:ring-2 focus:ring-indigo-500"/>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          )}

          {/* --- CHARACTER TAB (Separated with Toggle Buttons) --- */}
          {activeTab === 'character' && (
              <div className="space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                      <div className="flex justify-between items-center mb-6">
                          <h3 className="font-bold text-gray-800 flex items-center text-lg">
                              <HeartHandshake size={20} className="mr-2 text-pink-500"/> 7 Kebiasaan Anak Indonesia Hebat
                          </h3>
                          <button 
                            onClick={handleSaveKarakterLocal}
                            disabled={isSavingKarakter}
                            className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow hover:bg-emerald-600 transition-colors flex items-center disabled:opacity-70"
                          >
                              {isSavingKarakter ? <Loader2 size={16} className="animate-spin mr-1"/> : <Save size={16} className="mr-2"/>}
                              Simpan Penilaian
                          </button>
                      </div>
                      
                      {/* NEW: Attractive Toggle List Layout */}
                      <div className="grid grid-cols-1 gap-4">
                          {(Object.keys(KARAKTER_INDICATORS) as KarakterIndicatorKey[]).map((key) => {
                              const value = karakterForm[key];
                              return (
                                  <div key={key} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 transition-all hover:border-blue-200 hover:shadow-sm">
                                      <span className="font-bold text-gray-700 text-sm mb-3 sm:mb-0 flex items-center">
                                          <div className="w-2 h-2 rounded-full bg-blue-400 mr-3"></div>
                                          {KARAKTER_INDICATORS[key]}
                                      </span>
                                      
                                      <div className="flex bg-white rounded-lg p-1 border border-gray-200 shadow-sm w-full sm:w-auto">
                                          <button
                                              onClick={() => handleKarakterChange(key, 'Terbiasa')}
                                              className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-xs font-bold transition-all ${
                                                  value === 'Terbiasa'
                                                  ? 'bg-emerald-500 text-white shadow-sm ring-1 ring-emerald-600'
                                                  : 'text-gray-500 hover:bg-gray-50'
                                              }`}
                                          >
                                              <CheckCircle size={14} className={`mr-1.5 ${value === 'Terbiasa' ? 'text-white' : 'text-emerald-500'}`}/> 
                                              Terbiasa
                                          </button>
                                          <button
                                              onClick={() => handleKarakterChange(key, 'Belum Terbiasa')}
                                              className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-xs font-bold transition-all ml-1 ${
                                                  value === 'Belum Terbiasa'
                                                  ? 'bg-amber-500 text-white shadow-sm ring-1 ring-amber-600'
                                                  : 'text-gray-500 hover:bg-gray-50'
                                              }`}
                                          >
                                              <XCircle size={14} className={`mr-1.5 ${value === 'Belum Terbiasa' ? 'text-white' : 'text-amber-500'}`}/> 
                                              Belum
                                          </button>
                                      </div>
                                  </div>
                              );
                          })}
                      </div>
                      
                      <div className="mt-6">
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Catatan Tambahan (Opsional)</label>
                          <textarea
                              rows={2}
                              value={karakterForm.catatan || ''}
                              onChange={(e) => setKarakterForm({...karakterForm, catatan: e.target.value})}
                              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none bg-gray-50 focus:bg-white transition-colors"
                              placeholder="Tulis catatan refleksi..."
                          />
                      </div>

                      {karakterForm.catatan && (
                          <div className="mt-4 p-3 bg-yellow-50 rounded-xl border border-yellow-100 text-sm text-yellow-800 flex items-start">
                              <Sparkles size={16} className="mr-2 mt-0.5 text-yellow-600"/>
                              <div>
                                  <strong>Catatan Guru:</strong> {karakterForm.catatan}
                              </div>
                          </div>
                      )}
                  </div>
              </div>
          )}

          {/* --- SCHEDULE TAB --- */}
          {activeTab === 'schedule' && (
              <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
                  <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 pb-6 border-b border-gray-100">
                          <div className="flex items-center gap-4">
                              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl shadow-inner">
                                  <Calendar size={28} />
                              </div>
                              <div>
                                  <h3 className="font-bold text-gray-800 text-xl tracking-tight">Jadwal Pelajaran</h3>
                                  <p className="text-sm text-gray-500 font-medium tracking-tight">
                                      {scheduleDayName}, {scheduleDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                  </p>
                              </div>
                          </div>
                          
                          <div className="flex items-center gap-2 self-end sm:self-auto">
                              <button 
                                  onClick={handlePrevScheduleDay}
                                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1 border border-indigo-100/30 shadow-sm"
                                  title="Jadwal Kemarin"
                              >
                                  <ChevronLeft size={14} /> Kemarin
                              </button>
                              <button 
                                  onClick={handleTodayScheduleDay}
                                  className="px-3 py-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 text-xs font-black rounded-xl transition-all shadow-sm"
                              >
                                  Hari Ini
                              </button>
                              <button 
                                  onClick={handleNextScheduleDay}
                                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1 border border-indigo-100/30 shadow-sm"
                                  title="Jadwal Besok"
                              >
                                  Besok <ChevronRight size={14} />
                              </button>
                              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100/30">
                                  {selectedSchedule.length} Sesi
                              </span>
                          </div>
                      </div>

                      {isLoadingSchedule ? (
                          <div className="flex flex-col items-center justify-center p-24 bg-gray-50/30 rounded-3xl border border-dashed border-gray-200">
                              <Loader2 className="animate-spin text-indigo-300 mb-4" size={40} />
                              <p className="text-sm text-gray-400 font-bold italic tracking-wide">Menyiapkan buku-buku...</p>
                          </div>
                      ) : selectedSchedule.length === 0 ? (
                          <div className="flex flex-col items-center justify-center p-24 text-center bg-gray-50/30 rounded-3xl border border-dashed border-gray-200">
                              <div className="w-20 h-20 bg-white rounded-3xl shadow-md flex items-center justify-center text-indigo-200 mb-6 rotate-6 transform hover:rotate-12 transition-transform">
                                  <Coffee size={40} />
                              </div>
                              <p className="text-xl text-gray-700 font-black">Waktunya Santai!</p>
                              <p className="text-sm text-gray-500 mt-2 max-w-xs mx-auto leading-relaxed">
                                  Tidak ada jadwal pelajaran untuk {scheduleDayName === currentDayName ? 'hari ini' : 'hari ' + scheduleDayName}. Gunakan waktumu untuk belajar mandiri atau beristirahat!
                              </p>
                          </div>
                      ) : (
                          <div className="relative pl-6 sm:pl-8 border-l-2 border-dashed border-gray-100 space-y-6 ml-4">
                              {selectedSchedule.map((item, idx) => {
                                  const isBreak = item.subject.toLowerCase().includes('istirahat');
                                  const colorClass = getSubjectColor(item.subject);
                                  
                                  // Match with journal entry for teacher presence
                                  const journalEntry = journals.find(j => 
                                      j.timeSlot === item.time && 
                                      j.subject.toLowerCase() === item.subject.toLowerCase()
                                  );
                                  const isTeacherPresent = journalEntry?.isTeacherPresent;
                                  const teacherName = journalEntry?.teacherName;
                                  
                                  return (
                                      <div key={item.id || idx} className="relative group">
                                          {/* Timeline Point */}
                                          <div className={`absolute -left-[33px] sm:-left-[41px] top-6 w-4 h-4 rounded-full border-2 border-white shadow-sm z-10 transition-transform group-hover:scale-125 ${
                                              isBreak ? 'bg-slate-400' : 'bg-indigo-500'
                                          }`}></div>
                                          
                                          {/* Card Item */}
                                          <div className={`flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl shadow-sm border transition-all hover:shadow-md hover:translate-x-1 ${colorClass}`}>
                                              <div className="flex items-center gap-4 mb-3 sm:mb-0">
                                                  <div className={`p-3 rounded-xl shadow-sm bg-white/40 shrink-0`}>
                                                      {isBreak ? <Coffee size={24} className="text-slate-600" /> : <BookOpen size={24} className="text-indigo-600" />}
                                                  </div>
                                                  <div className="min-w-0">
                                                      <h4 className={`text-lg font-black leading-tight ${isBreak ? 'italic' : ''}`}>
                                                          {item.subject}
                                                      </h4>
                                                      <div className="flex items-center mt-1">
                                                           <Clock size={12} className="mr-1.5 opacity-60" />
                                                           <span className="text-xs font-bold opacity-80">{item.time}</span>
                                                      </div>
                                                      {isTeacherPresent && teacherName && (
                                                          <div className="flex items-center mt-2 bg-emerald-500/10 text-emerald-700 px-2 py-0.5 rounded-md w-fit">
                                                              <CheckCircle size={12} className="mr-1.5" />
                                                              <span className="text-[10px] font-black tracking-tight">Diajar oleh: {teacherName}</span>
                                                          </div>
                                                      )}
                                                  </div>
                                              </div>
                                              
                                              <div className="flex items-center gap-2">
                                                  {isBreak ? (
                                                       <span className="px-3 py-1 bg-black/5 rounded-lg text-[10px] font-black uppercase tracking-tighter">Waktu Istirahat</span>
                                                  ) : (
                                                       <span className="px-3 py-1 bg-black/5 rounded-lg text-[10px] font-black uppercase tracking-tighter">Jam Pembelajaran</span>
                                                  )}
                                              </div>
                                          </div>
                                      </div>
                                  );
                              })}
                          </div>
                      )}
                      
                      <div className="mt-8 p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-start gap-3">
                          <Bell size={18} className="text-blue-500 shrink-0 mt-0.5" />
                          <p className="text-[11px] text-blue-800 font-medium">
                              <strong>Informasi:</strong> Jadwal yang tampil adalah jadwal resmi yang telah disusun oleh wali kelas. Tetap disiplin dan semangat belajarnya!
                          </p>
                      </div>
                  </div>
              </div>
          )}
          {/* --- MANUAL BOOK TAB --- */}
          {activeTab === 'manual_book' && (
              <ManualBookView 
                  schoolProfile={schoolProfile}
                  onSaveProfile={async () => {}} // Siswa can't save
                  isAdminRole={false}
              />
          )}

          {/* --- MITIGASI BENCANA TAB --- */}
          {activeTab === 'mitigasi' && (
              <MitigasiBencanaView currentUser={{...student, role: 'siswa', username: student.name, fullName: student.name, position: 'Siswa'}} />
          )}

          {/* --- KELULUSAN TAB --- */}
          {activeTab === 'kelulusan' && schoolProfile?.isGraduationAnnounced && (
              <div className="space-y-6 animate-fade-in relative z-20">
                  {isCountdownActive ? (
                      <div className="bg-gradient-to-br from-white via-blue-50/40 to-indigo-50/20 p-6 sm:p-12 rounded-3xl shadow-xl text-center relative overflow-hidden mt-2 min-h-[450px] flex flex-col items-center justify-center border-2 border-blue-100">
                          {/* Animated background highlights */}
                          <div className="absolute top-10 right-10 w-96 h-96 bg-blue-500/[0.04] rounded-full blur-[80px] -mr-20 -mt-20 print:hidden"></div>
                          <div className="absolute bottom-10 left-10 w-96 h-96 bg-indigo-500/[0.04] rounded-full blur-[80px] -ml-20 -mb-20 print:hidden"></div>
                          
                          <div className="relative z-10 space-y-8 w-full max-w-2xl mx-auto flex flex-col items-center">
                              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center border border-blue-100 shadow-blue-100/50 shadow-lg animate-bounce mb-2 overflow-hidden">
                                   {schoolProfile?.schoolLogo ? (
                                       <img src={schoolProfile.schoolLogo} alt="Logo Sekolah" className="w-full h-full object-contain p-2" />
                                   ) : (
                                       <School size={36} className="text-blue-600" />
                                   )}
                              </div>
                              
                              <div className="space-y-3 text-center">
                                  <span className="text-[11px] font-black uppercase tracking-[0.25em] bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full border border-blue-200">
                                      INFORMASI
                                  </span>
                                  <h2 className="text-3xl sm:text-5xl font-black text-slate-850 tracking-tight leading-tight bg-gradient-to-r from-slate-900 via-blue-900 to-slate-800 bg-clip-text text-transparent">
                                      PENGUMUMAN KELULUSAN
                                  </h2>
                                  {schoolProfile?.year && (
                                      <p className="text-xs sm:text-sm font-bold text-blue-600 uppercase tracking-widest mt-1">
                                          Tahun Ajaran {schoolProfile.year}
                                      </p>
                                  )}
                                  <p className="text-slate-600 text-xs sm:text-sm max-w-md mx-auto leading-relaxed font-medium">
                                      Sabar ya, pengumuman kelulusan resmi akan rilis pada:
                                  </p>
                              </div>
                              
                              {/* Countdown Board Grid */}
                              <div className="grid grid-cols-4 gap-3 sm:gap-6 w-full max-w-lg mt-4">
                                  {/* Hari */}
                                  <div className="bg-white rounded-2xl p-3 sm:p-5 border border-blue-100 shadow-md flex flex-col items-center justify-center transition-all duration-300 hover:scale-105 hover:border-blue-300 shadow-blue-500/[0.03]">
                                      <span className="text-2.5xl sm:text-5xl font-black text-blue-600 font-mono tracking-tighter">
                                          {String(countdownRemaining.days).padStart(2, '0')}
                                      </span>
                                      <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                                          Hari
                                      </span>
                                  </div>
                                  
                                  {/* Jam */}
                                  <div className="bg-white rounded-2xl p-3 sm:p-5 border border-blue-100 shadow-md flex flex-col items-center justify-center transition-all duration-300 hover:scale-105 hover:border-blue-300 shadow-blue-500/[0.03]">
                                      <span className="text-2.5xl sm:text-5xl font-black text-slate-800 font-mono tracking-tighter">
                                          {String(countdownRemaining.hours).padStart(2, '0')}
                                      </span>
                                      <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                                          Jam
                                      </span>
                                  </div>
                                  
                                  {/* Menit */}
                                  <div className="bg-white rounded-2xl p-3 sm:p-5 border border-blue-100 shadow-md flex flex-col items-center justify-center transition-all duration-300 hover:scale-105 hover:border-blue-300 shadow-blue-500/[0.03]">
                                      <span className="text-2.5xl sm:text-5xl font-black text-slate-800 font-mono tracking-tighter">
                                          {String(countdownRemaining.minutes).padStart(2, '0')}
                                      </span>
                                      <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                                          Menit
                                      </span>
                                  </div>
                                  
                                  {/* Detik */}
                                  <div className="bg-white rounded-2xl p-3 sm:p-5 border border-blue-100 shadow-md flex flex-col items-center justify-center transition-all duration-300 hover:scale-105 hover:border-blue-300 shadow-blue-500/[0.03]">
                                      <span className="text-2.5xl sm:text-5xl font-black text-rose-500 font-mono tracking-tighter">
                                          {String(countdownRemaining.seconds).padStart(2, '0')}
                                      </span>
                                      <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                                          Detik
                                      </span>
                                  </div>
                              </div>

                              <div className="text-[11px] font-bold text-blue-800 uppercase tracking-wider bg-blue-50/80 px-4 py-2 rounded-xl mt-2 border border-blue-100 shadow-sm">
                                  Rilis: {schoolProfile.graduationCountdownTime ? new Date(schoolProfile.graduationCountdownTime).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' }) : ''} WIB
                              </div>
                          </div>
                      </div>
                  ) : (
                      <div className="bg-gradient-to-br from-indigo-900 via-[#005CBB] to-indigo-950 p-6 sm:p-12 rounded-3xl shadow-2xl text-center relative overflow-hidden print:bg-white print:text-black print:shadow-none print:rounded-none mt-2 min-h-[400px] flex items-center justify-center transition-all duration-300 border border-white/10">
                          {/* Background elements */}
                          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 print:hidden"></div>
                          <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-2xl -ml-20 -mb-20 print:hidden"></div>
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl print:hidden"></div>
                          
                          {isLoadingGraduation ? (
                              <div className="text-white flex flex-col items-center">
                                  <Loader2 size={48} className="animate-spin mb-4 text-[#5AB2FF]" />
                                  <p className="font-bold tracking-wide">Memuat data kelulusan murid...</p>
                              </div>
                          ) : !graduationData ? (
                              <div className="bg-white/15 p-8 rounded-3xl backdrop-blur-md border border-white/20 text-white max-w-md mx-auto relative z-10 shadow-lg hover:scale-105 transition-all duration-300">
                                  <GraduationCap size={64} className="mx-auto mb-4 text-amber-300 animate-pulse" />
                                  <h3 className="text-xl font-extrabold mb-2 text-amber-200">Data Belum Tersedia</h3>
                                  <p className="text-sm opacity-90 leading-relaxed">Maaf, data kelulusan untuk NIS <span className="font-bold text-amber-300">{student.nis}</span> belum diinput oleh pihak sekolah. Silakan hubungi wali kelas Anda.</p>
                              </div>
                          ) : (
                              <div className="relative z-10 space-y-6 w-full max-w-4xl">
                                  <div className="mx-auto w-24 h-24 bg-gradient-to-br from-amber-300 to-yellow-500 p-0.5 rounded-full shadow-lg flex items-center justify-center animate-bounce print:hidden">
                                      <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center">
                                          <GraduationCap size={40} className="text-amber-300" />
                                      </div>
                                  </div>
                                  
                                  <div className="hidden print:block mb-8 border-b-4 border-black pb-4 text-black text-center">
                                      <h1 className="text-2xl font-black">{schoolProfile?.name?.toUpperCase() || 'SEKOLAH KAMI'}</h1>
                                      <p className="text-sm">{schoolProfile?.address || 'Alamat Sekolah'}</p>
                                  </div>
                                  
                                  <div className="space-y-1">
                                      <span className="print:hidden text-[11px] font-black uppercase tracking-[0.25em] bg-amber-400 text-slate-950 px-3 py-1 rounded-full shadow-sm">
                                          PENGUMUMAN KELULUSAN
                                      </span>
                                      <h2 className="text-3xl sm:text-5xl font-black text-white drop-shadow-md print:text-black pt-3">
                                          PENGUMUMAN KELULUSAN
                                      </h2>
                                      {schoolProfile?.year && (
                                          <p className="text-xs sm:text-sm font-bold text-amber-200 print:text-black uppercase tracking-widest mt-1">
                                              Tahun Ajaran {schoolProfile.year}
                                          </p>
                                      )}
                                  </div>
                                  
                                  <div className="bg-white/10 print:bg-transparent p-6 sm:p-8 rounded-3xl backdrop-blur-md border border-white/20 print:border-none print:p-0 max-w-3xl mx-auto">
                                      <p className="text-blue-50 print:text-black text-sm sm:text-base mb-6 leading-relaxed max-w-2xl mx-auto">
                                          Berdasarkan hasil rapat pleno Dewan Guru <b>{schoolProfile.name || 'Sekolah'}</b> Tahun Ajaran {schoolProfile.year || graduationData.graduationYear || '2025/2026'}, tentang Kriteria Kelulusan Murid, maka murid dengan data di bawah ini:
                                      </p>
                                      
                                      {/* PRINT VERSION: clean column values to guarantee non-truncated PDF and formal paper style */}
                                      <div className="hidden print:block border-2 border-black rounded-xl p-6 text-left my-6 max-w-xl mx-auto text-black">
                                          <table className="w-full text-base">
                                              <tbody>
                                                  <tr className="border-b border-gray-400">
                                                      <td className="py-2.5 font-bold w-1/3">Nama Lengkap</td>
                                                      <td className="py-2.5 uppercase font-black text-lg">: {(graduationData.name || student.name).toUpperCase()}</td>
                                                  </tr>
                                                  <tr className="border-b border-gray-400">
                                                      <td className="py-2.5 font-bold w-1/3">NIS / NISN</td>
                                                      <td className="py-2.5 font-black text-lg">: {student.nis} / {graduationData.nisn || student.nisn || '-'}</td>
                                                  </tr>
                                                  <tr>
                                                      <td className="py-2.5 font-bold w-1/3">No. Ijazah</td>
                                                      <td className="py-2.5 font-black text-lg">: {graduationData.ijazahNumber || '-'}</td>
                                                  </tr>
                                              </tbody>
                                          </table>
                                      </div>

                                      {/* SCREEN VERSION: Glassmorphic bento cards with responsive flex columns and amber-borders hover effect */}
                                      <div className="print:hidden grid grid-cols-1 sm:grid-cols-3 gap-4 my-8 max-w-2xl mx-auto">
                                          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-5 border border-white/40 shadow-sm hover:shadow-xl hover:border-amber-400/50 hover:-translate-y-1 transition-all duration-300 text-left relative overflow-hidden group">
                                              <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50/50 rounded-bl-full -mr-3 -mt-3 group-hover:bg-amber-100 transition-all duration-300"></div>
                                              <p className="text-[10px] font-extrabold text-[#005CBB] uppercase tracking-wider mb-2 flex items-center gap-1">
                                                  Nama Lengkap
                                              </p>
                                              <p className={`text-gray-900 font-extrabold leading-snug break-words uppercase ${
                                                  ((graduationData.name || student.name)?.length || 0) > 25 
                                                      ? 'text-xs sm:text-sm md:text-base' 
                                                      : 'text-sm sm:text-base'
                                              }`}>
                                                  {(graduationData.name || student.name).toUpperCase()}
                                              </p>
                                          </div>
                                          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-5 border border-white/40 shadow-sm hover:shadow-xl hover:border-amber-400/50 hover:-translate-y-1 transition-all duration-300 text-left relative overflow-hidden group">
                                              <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50/50 rounded-bl-full -mr-3 -mt-3 group-hover:bg-amber-100 transition-all duration-300"></div>
                                              <p className="text-[10px] font-extrabold text-[#005CBB] uppercase tracking-wider mb-2 flex items-center gap-1">
                                                  NIS / NISN
                                              </p>
                                              <p className="text-gray-900 font-extrabold text-sm sm:text-base leading-snug break-all">
                                                  {student.nis} / {graduationData.nisn || student.nisn || '-'}
                                              </p>
                                          </div>
                                          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-5 border border-white/40 shadow-sm hover:shadow-xl hover:border-amber-400/50 hover:-translate-y-1 transition-all duration-300 text-left relative overflow-hidden group">
                                              <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50/50 rounded-bl-full -mr-3 -mt-3 group-hover:bg-amber-100 transition-all duration-300"></div>
                                              <p className="text-[10px] font-extrabold text-[#005CBB] uppercase tracking-wider mb-2 flex items-center gap-1">
                                                  No. Ijazah
                                              </p>
                                              <p className="text-gray-900 font-extrabold text-sm sm:text-base leading-snug break-words">
                                                  {graduationData.ijazahNumber || '-'}
                                              </p>
                                          </div>
                                      </div>
                                      
                                      <p className="text-blue-50 print:text-black text-base mt-8 mb-4">
                                          Dengan ini secara resmi dinyatakan:
                                      </p>
                                      
                                      <div className={`bg-gradient-to-r ${graduationData.status?.toLowerCase() === 'lulus' ? 'from-emerald-500 to-green-600 border-emerald-400/40 shadow-emerald-700/20' : 'from-red-500 to-rose-700 border-red-400/40 shadow-red-700/20'} print:from-white print:to-white text-white print:text-black rounded-3xl py-6 sm:py-8 px-4 shadow-2xl transform transition-transform hover:scale-[1.03] border-4 border-white/30 print:border-4 print:border-black max-w-md mx-auto relative overflow-hidden`}>
                                          <div className="absolute inset-0 bg-white/5 opacity-50 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white to-transparent"></div>
                                          <h1 className="text-5xl sm:text-6xl font-black tracking-widest drop-shadow-lg print:drop-shadow-none uppercase relative z-10 font-sans">
                                              {graduationData.status || 'LULUS'}
                                          </h1>
                                      </div>
                                  </div>
                                  
                                  <div className="max-w-2xl mx-auto mt-8 print:hidden">
                                      <p className="text-white/90 text-sm sm:text-base italic leading-relaxed font-medium">
                                          {graduationData.status?.toLowerCase() === 'lulus' 
                                              ? '🎉 "Selamat atas kelulusanmu! Ini adalah awal panggung baru dalam perjalanan pendidikanmu. Teruslah rajin belajar, berkarya, tebarkan kebaikan, dan raihlah cita-citamu setinggi langit. Semoga sukses selalu!"'
                                              : '💪 "Jangan berkecil hati. Kegagalan adalah awal dari keberhasilan yang tertunda. Tetap semangat dan jangan menyerah!"'}
                                      </p>
                                  </div>
                                  
                                  <div className="flex flex-wrap gap-4 justify-center mt-10 no-print">
                                      {graduationData.sklUrl ? (
                                          <a 
                                              href={graduationData.sklUrl}
                                              target="_blank"
                                              referrerPolicy="no-referrer"
                                              rel="noopener noreferrer"
                                              className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 hover:text-slate-950 px-8 py-3.5 rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl hover:shadow-yellow-300/30 transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.03] text-sm tracking-wide"
                                          >
                                              <Printer size={20} className="text-slate-950 animate-pulse" /> 
                                              <span>Cetak Surat Kelulusan (PDF)</span>
                                          </a>
                                      ) : (
                                          <button 
                                              onClick={() => window.print()}
                                              className="bg-white text-blue-700 hover:bg-blue-50 px-8 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.02]"
                                          >
                                              <Printer size={20} className="text-blue-500" />
                                              <span>Cetak Surat Kelulusan (PDF/Print)</span>
                                          </button>
                                      )}
 
                                      {graduationData.sklUrl ? (
                                          <a 
                                              href={graduationData.sklUrl}
                                              target="_blank"
                                              referrerPolicy="no-referrer"
                                              rel="noopener noreferrer"
                                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl hover:shadow-emerald-500/30 transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.02] text-sm"
                                          >
                                              <Download size={20} className="text-emerald-200" /> 
                                              <span>Download SKL / Ijazah</span>
                                          </a>
                                      ) : (
                                          <button 
                                              onClick={() => showAlert("SKL sedang di proses, silahkan menghubungi wali kelas.", "alert", "Informasi")}
                                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl hover:shadow-emerald-500/30 transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.02] text-sm"
                                          >
                                              <Download size={20} className="text-emerald-200" /> 
                                              <span>Download SKL / Ijazah</span>
                                          </button>
                                      )}
                                  </div>
                                  
                                  <div className="hidden print:flex justify-end mt-16 pt-8 pr-8">
                                      <div className="text-center text-black">
                                          <p className="mb-20">Kepala Sekolah,</p>
                                          {schoolProfile.headmasterSignature ? (
                                              <img src={schoolProfile.headmasterSignature} alt="Tanda Tangan" className="h-20 mx-auto -mt-16 mb-2 object-contain" />
                                          ) : (
                                              <div className="h-16"></div>
                                          )}
                                          <p className="font-bold underline">{schoolProfile.headmaster || '___________________'}</p>
                                          <p>NIP. {schoolProfile.headmasterNip || '-'}</p>
                                      </div>
                                  </div>
                              </div>
                          )}
                      </div>
                  )}
              </div>
          )}

          {/* --- VIDEO PLAYER MODAL --- */}
          {viewingVideoLink && createPortal(
              <div className="fixed inset-0 z-[99999] bg-black flex items-center justify-center">
                  <button 
                      onClick={handleCloseVideo}
                      className="absolute top-4 right-4 z-[999999] bg-black/50 text-white p-3 rounded-full hover:bg-black/80 transition-colors pointer-events-auto"
                      title="Tutup Video (x)"
                  >
                      <X size={24} />
                  </button>
                  <iframe 
                      src={viewingVideoLink} 
                      className="w-full h-full max-w-6xl mx-auto md:h-[80vh] border-none"
                      title="Video Pembelajaran"
                      allowFullScreen
                      allow="autoplay; encrypted-media; fullscreen"
                  />
              </div>,
              document.body
          )}

          {/* --- POSTER PREVIEW MODAL --- */}
          {viewingPoster && viewingPoster.infographic && createPortal(
              <div className="fixed inset-0 z-[99999] bg-slate-950/95 flex flex-col justify-between select-none animate-fade-in">
                  {/* Modal Header */}
                  <div className="p-4 md:p-5 flex justify-between items-center bg-slate-950/80 border-b border-slate-800/80">
                      <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                              <ImageIcon size={20} />
                          </div>
                          <div className="text-left">
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                                  Pratinjau Poster Materi
                              </span>
                              <h3 className="font-extrabold text-sm md:text-base text-slate-200 line-clamp-1 max-w-[200px] sm:max-w-[400px] md:max-w-[600px]">
                                  {viewingPoster.title}
                              </h3>
                          </div>
                      </div>
                      <div className="flex items-center gap-2">
                          <a 
                              href={viewingPoster.infographic}
                              download={`Poster_${viewingPoster.title.replace(/\s+/g, '_')}.jpg`}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-xs md:text-sm font-bold text-white rounded-xl transition-all active:scale-95 duration-200 shrink-0 cursor-pointer"
                          >
                              <Download size={14} />
                              <span className="hidden sm:inline">Unduh Poster</span>
                          </a>
                          <button 
                              onClick={() => setViewingPoster(null)}
                              className="p-2 text-slate-400 hover:text-slate-100 bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-800 transition-all active:scale-95 duration-200 cursor-pointer"
                              title="Tutup (Esc)"
                          >
                              <X size={16} />
                          </button>
                      </div>
                  </div>

                  {/* Modal Content / Preview Area */}
                  <div className="flex-1 bg-slate-950 flex flex-col items-center justify-center relative p-4 overflow-hidden">
                      <div 
                          className="w-full h-full flex items-center justify-center relative p-2 overflow-hidden select-none bg-slate-950/40"
                          onMouseDown={handleMouseDown}
                          onMouseMove={handleMouseMove}
                          onMouseUp={handleMouseUpOrLeave}
                          onMouseLeave={handleMouseUpOrLeave}
                      >
                          {/* Floating Zoom & Reset Control Bar */}
                          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-md border border-slate-800/80 rounded-full px-5 py-2.5 flex items-center gap-4 shadow-2xl z-20">
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
                                      src={viewingPoster.infographic} 
                                      alt={viewingPoster.title} 
                                      className="max-w-full max-h-[68vh] object-contain rounded-xl shadow-2xl border border-slate-800/80 bg-slate-900"
                                      referrerPolicy="no-referrer"
                                      draggable={false}
                                  />
                              </div>
                          </div>
                      </div>
                  </div>
              </div>,
              document.body
          )}

          {/* --- MOBILE BOTTOM NAVIGATION (User Request 5) --- */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-gray-100 flex justify-around items-center px-4 py-2 md:hidden shadow-[0_-8px_20px_rgba(0,0,0,0.08)]">
              {[
                  { id: 'dashboard', label: 'Beranda', icon: LayoutDashboard },
                  { id: 'attendance', label: 'Izin', icon: Calendar },
                  { id: 'liaison', label: 'Layanan', icon: Bell, badge: hasNewTeacherMessage },
                  { id: 'profile', label: 'Akun', icon: User }
              ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                      <button
                          key={item.id}
                          onClick={() => handleTabChange(item.id as PortalTab)}
                          className={`flex flex-col items-center justify-center py-1 transition-all relative ${
                              isActive ? 'text-[#5AB2FF]' : 'text-gray-400 hover:text-gray-600'
                          }`}
                      >
                          <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-blue-50' : ''}`}>
                              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                          </div>
                          <span className={`text-[10px] mt-0.5 font-bold ${isActive ? 'scale-105' : ''}`}>
                              {item.label}
                          </span>
                          {item.badge && (
                              <span className="absolute top-1 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full animate-pulse"></span>
                          )}
                          {isActive && (
                              <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-[#5AB2FF] rounded-full"></span>
                          )}
                      </button>
                  );
              })}
          </div>
          {viewingTask && createPortal(
              <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-md animate-fade-in transition-all duration-300">
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
                                      {viewingTask.title}
                                  </h3>
                              </div>
                          </div>
                          <button 
                              onClick={() => setViewingTask(null)} 
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
                                  {viewingTask.taskTitle || "Selesaikan tugas berikut sesuai instruksi dari guru."}
                              </h4>
                              {viewingTask.description && (
                                  <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap pt-1 border-t border-gray-100 mt-2">
                                      {viewingTask.description}
                                  </p>
                              )}
                          </div>

                          {/* Task Link Attachment */}
                          {viewingTask.taskLink && (
                              <div className="bg-white p-4 rounded-2xl border border-amber-200/80 shadow-sm space-y-3">
                                  <div className="flex items-center justify-between">
                                      <span className="text-xs font-extrabold text-gray-700 flex items-center gap-1.5">
                                          <Link2 size={14} className="text-amber-600" />
                                          Tautan / Google Form / Quiz Online
                                      </span>
                                      <span className="text-[10px] bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-md font-bold uppercase">
                                          Tugas Online
                                      </span>
                                  </div>
                                  <a
                                      href={viewingTask.taskLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                                  >
                                      <ExternalLink size={16} />
                                      <span>Kerjakan Tugas</span>
                                  </a>
                              </div>
                          )}

                          {/* Task File Attachment */}
                          {viewingTask.taskFile && (
                              <div className="bg-white p-4 rounded-2xl border border-amber-200/80 shadow-sm space-y-3">
                                  <div className="flex items-center justify-between">
                                      <span className="text-xs font-extrabold text-gray-700 flex items-center gap-1.5">
                                          <FileText size={14} className="text-amber-600" />
                                          Berkas Lampiran Tugas
                                      </span>
                                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold">
                                          {viewingTask.taskFile.startsWith('data:application/pdf') ? 'Dokumen PDF' : 'Foto Gambar'}
                                      </span>
                                  </div>

                                  {viewingTask.taskFile.startsWith('data:image/') ? (
                                      <div className="space-y-3">
                                          <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-900 max-h-80 flex items-center justify-center">
                                              <img 
                                                  src={viewingTask.taskFile} 
                                                  alt="Foto Tugas" 
                                                  className="max-h-80 object-contain w-full"
                                              />
                                          </div>
                                          <a 
                                              href={viewingTask.taskFile}
                                              download={'Tugas_' + viewingTask.title.replace(/\s+/g, '_') + '.jpg'}
                                              className="flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow transition-all cursor-pointer"
                                          >
                                              <Download size={14} />
                                              <span>Unduh Foto Tugas</span>
                                          </a>
                                      </div>
                                  ) : viewingTask.taskFile.startsWith('data:application/pdf') ? (
                                      <div className="space-y-3">
                                          <iframe 
                                              src={viewingTask.taskFile}
                                              title="Dokumen PDF Tugas"
                                              className="w-full h-80 rounded-xl border border-slate-200"
                                          />
                                          <a 
                                              href={viewingTask.taskFile}
                                              download={'Tugas_' + viewingTask.title.replace(/\s+/g, '_') + '.pdf'}
                                              className="flex items-center justify-center gap-2 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer"
                                          >
                                              <Download size={14} />
                                              <span>Unduh Dokumen PDF Tugas</span>
                                          </a>
                                      </div>
                                  ) : (
                                      <a 
                                          href={viewingTask.taskFile}
                                          download={'Tugas_' + viewingTask.title.replace(/\s+/g, '_')}
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
                              onClick={() => setViewingTask(null)}
                              className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer"
                          >
                              Tutup
                          </button>
                      </div>
                  </div>
              </div>,
              document.body
          )}

          {pdfUrl && (
            <ContentModal 
                isOpen={!!pdfUrl} 
                onClose={() => setPdfUrl(null)} 
                title="Baca Modul / Dokumen PDF"
            >
                <PDFViewer fileUrl={pdfUrl} />
            </ContentModal>
          )}
      </div>
    </div>
  );
};

export default StudentPortal;