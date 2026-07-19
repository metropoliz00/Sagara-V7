import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, RadialBarChart, RadialBar, Legend 
} from 'recharts';
import { Student, AgendaItem, Holiday, ViewState, GradeRecord, Subject, EmploymentLink, PermissionRequest, SchoolProfileData, LearningDocumentation, LearningReport, LearningJournalEntry, User } from '../types';
import { 
  Users, UserCheck, Calendar, FileText, TrendingUp, 
  Plus, Send, Bell, ChevronRight, CheckCircle, AlertCircle, AlertTriangle,
  GraduationCap, BookOpen, Clock, CalendarRange,
  Activity, XCircle, ExternalLink, Link as LinkIcon, Mail, Info, Camera, ChevronLeft,
  Sun, Moon, CloudSun, Sunset, MessageSquare, User as UserIcon, Loader2, School, CheckCircle2
} from 'lucide-react';
import { masterSupabase } from '../services/supabaseClient';

interface DashboardProps {
  students: Student[];
  agendas: AgendaItem[];
  holidays: Holiday[];
  allAttendanceRecords: any[];
  teacherName?: string;
  teachingClass?: string;
  grades: GradeRecord[];
  subjects: Subject[];
  adminCompleteness?: number;
  employmentLinks?: EmploymentLink[];
  pendingPermissions?: PermissionRequest[];
  onOpenPermissionModal?: () => void;
  schoolProfile?: SchoolProfileData; // Added schoolProfile prop
  learningDocumentation?: LearningDocumentation[];
  learningReports?: LearningReport[];
  hasNewMessages?: boolean;
  unreadMessageCount?: number;
  kktpMap?: Record<string, number>;
  learningJournals?: LearningJournalEntry[];
  currentUser: User | null;
}

const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316', '#14B8A6', '#6366F1', '#84CC16', '#D946EF'];

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

import { getLocalISODate } from '../utils/dateUtils';

interface SchoolDatabase {
  id: string;
  school_code: string;
  school_name: string;
  supabase_url: string;
  supabase_anon_key: string;
  is_active: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  students, agendas, holidays, allAttendanceRecords, 
  teacherName, teachingClass, grades, subjects, adminCompleteness = 0,
  employmentLinks = [], pendingPermissions = [], onOpenPermissionModal, schoolProfile,
  learningDocumentation = [],
  learningReports = [],
  hasNewMessages = false, unreadMessageCount = 0,
  kktpMap = {},
  learningJournals = [],
  currentUser
}) => {
  const navigate = useNavigate();
  const [schools, setSchools] = useState<SchoolDatabase[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [schoolsError, setSchoolsError] = useState('');

  useEffect(() => {
    if (currentUser?.role === 'superadmin') {
      const fetchSchools = async () => {
        try {
          setLoadingSchools(true);
          if (!masterSupabase) throw new Error("Database Pusat tidak terkonfigurasi.");
          const { data, error: fetchErr } = await masterSupabase
            .from('school_databases')
            .select('*');
          if (fetchErr) throw fetchErr;
          setSchools(data || []);
        } catch (err: any) {
          console.error("Error fetching schools for dashboard:", err);
          setSchoolsError(err.message);
        } finally {
          setLoadingSchools(false);
        }
      };
      fetchSchools();
    }
  }, [currentUser]);
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showRunningText, setShowRunningText] = useState(false); // State for delayed running text

  const canTriggerAlert = currentUser && ['admin', 'guru'].includes(currentUser.role);

  // Carousel State
  const [carouselIndex, setCarouselIndex] = useState(0);
  const carouselTimeoutRef = useRef<number | null>(null);
  const imagesForCarousel = useMemo(() => learningDocumentation.filter(doc => doc.linkFoto && doc.linkFoto.startsWith('http')), [learningDocumentation]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 1000);
    
    // Delay running text appearance by 300ms
    const textTimer = setTimeout(() => {
        setShowRunningText(true);
    }, 300);

    return () => {
        clearInterval(timer);
        clearTimeout(textTimer);
    };
  }, []);

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
        () => setCarouselIndex((prev) => (prev + 1) % imagesForCarousel.length), 5000
      );
    }
    return () => resetTimeout();
  }, [carouselIndex, imagesForCarousel.length, imagesForCarousel]);

  const goToPreviousSlide = () => setCarouselIndex((prev) => (prev - 1 + imagesForCarousel.length) % imagesForCarousel.length);
  const goToNextSlide = () => setCarouselIndex((prev) => (prev + 1) % imagesForCarousel.length);

  const formattedDate = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(currentDate).replace('Jumat', "Jum'at").replace('jumat', "jum'at");
  const tzOffset = -currentDate.getTimezoneOffset() / 60;
  const tzName = tzOffset === 7 ? 'WIB' : tzOffset === 8 ? 'WITA' : tzOffset === 9 ? 'WIT' : `GMT${tzOffset > 0 ? '+' : ''}${tzOffset}`;
  const baseTimeStr = new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(currentDate).replace(/\./g, ':');
  const formattedTime = `${baseTimeStr} ${tzName}`;
  const formatLongDate = (dateStr: string) => { if (!dateStr) return "-"; try { const date = new Date(dateStr + 'T00:00:00'); if (isNaN(date.getTime())) return dateStr; return new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(date).replace('Jumat', "Jum'at").replace('jumat', "jum'at"); } catch (e) { return dateStr; } };
  const getGreeting = () => { 
    const hour = currentDate.getHours(); 
    if (hour >= 5 && hour < 11) return "Pagi"; 
    if (hour >= 11 && hour < 15) return "Siang"; 
    if (hour >= 15 && hour < 19) return "Sore"; 
    return "Malam"; 
  };

  const getGreetingIcon = (greeting: string) => {
    switch (greeting) {
      case 'Pagi': return <CloudSun className="text-yellow-400 mr-3 inline-block animate-pulse-slow" size={32} />;
      case 'Siang': return <Sun className="text-orange-500 mr-3 inline-block animate-spin-slow" size={32} />;
      case 'Sore': return <Sunset className="text-orange-400 mr-3 inline-block" size={32} />;
      case 'Malam': return <Moon className="text-indigo-400 mr-3 inline-block" size={32} />;
      default: return <Sun className="text-yellow-500 mr-3 inline-block" size={32} />;
    }
  };

  const totalStudents = students.length;
  const maleStudents = students.filter(s => s.gender === 'L').length;
  const femaleStudents = students.filter(s => s.gender === 'P').length;

  const classAttendanceRecords = useMemo(() => {
      const studentIds = students.map(s => s.id);
      return (allAttendanceRecords as any[]).filter(record => studentIds.includes(record.studentId));
  }, [allAttendanceRecords, students]);

  const todayStats = useMemo(() => {
    const todayStr = getLocalISODate(new Date());
    const todayRecords = classAttendanceRecords.filter(r => r.date === todayStr);
    return {
        present: new Set(todayRecords.filter(r => r.status === 'present').map(r => r.studentId)).size,
        sick: new Set(todayRecords.filter(r => r.status === 'sick').map(r => r.studentId)).size,
        permit: new Set(todayRecords.filter(r => r.status === 'permit').map(r => r.studentId)).size,
        alpha: new Set(todayRecords.filter(r => r.status === 'alpha').map(r => r.studentId)).size,
    };
  }, [classAttendanceRecords]);

  const attendanceTrendData = useMemo(() => {
    const daysShort = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const today = new Date();
    const todayStr = getLocalISODate(today);
    const dayOfWeek = today.getDay(); 
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);
    const weekData = [];

    for (let i = 0; i < 6; i++) { // Monday to Saturday
      const targetDate = new Date(monday);
      targetDate.setDate(monday.getDate() + i);
      const dateStr = getLocalISODate(targetDate);
      const isHoliday = holidays.some(h => h.date === dateStr);
      
      let presentCount = 0;
      let sickCount = 0;
      let permitCount = 0;
      let alphaCount = 0;

      if (dateStr <= todayStr && !isHoliday) {
        const dayRecords = classAttendanceRecords.filter(r => r.date === dateStr);
        presentCount = new Set(dayRecords.filter(r => r.status === 'present').map(r => r.studentId)).size;
        sickCount = new Set(dayRecords.filter(r => r.status === 'sick').map(r => r.studentId)).size;
        permitCount = new Set(dayRecords.filter(r => r.status === 'permit').map(r => r.studentId)).size;
        
        const recordedCount = presentCount + sickCount + permitCount;
        alphaCount = students.length - recordedCount;
        if (alphaCount < 0) alphaCount = 0;
      }

      const total = presentCount + sickCount + permitCount + alphaCount;
      const divisor = total > 0 ? total : 1;

      const presentPercent = Math.round((presentCount / divisor) * 100);
      const sickPercent = Math.round((sickCount / divisor) * 100);
      const permitPercent = Math.round((permitCount / divisor) * 100);
      const alphaPercent = total > 0 ? 100 - (presentPercent + sickPercent + permitPercent) : 0;

      weekData.push({
        name: daysShort[targetDate.getDay()],
        H: presentCount,
        S: sickCount,
        I: permitCount,
        A: alphaCount,
        H_percent: presentPercent,
        S_percent: sickPercent,
        I_percent: permitPercent,
        A_percent: alphaPercent
      });
    }
    return weekData;
  }, [classAttendanceRecords, students, holidays]);

  const absentToday = useMemo(() => {
    const todayStr = getLocalISODate(new Date());
    return classAttendanceRecords.filter(record => record.date === todayStr && record.status !== 'present').map(record => {
            const student = students.find(s => s.id === record.studentId);
            return { ...record, name: student?.name || 'Siswa tidak ditemukan' };
        });
  }, [classAttendanceRecords, students]);

  const priorityAgenda = agendas.find(a => a.type === 'urgent' && !a.completed) || agendas.find(a => !a.completed);
  const incompleteAgendas = agendas.filter(a => !a.completed);
  const upcomingHolidays = holidays.map(h => ({...h, dateObj: new Date(h.date + 'T00:00:00')})).filter(h => h.dateObj >= new Date(new Date().setHours(0, 0, 0, 0))).sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime()).slice(0, 4);
  const getDaysRemaining = (dateObj: Date) => { const today = new Date(); today.setHours(0, 0, 0, 0); const diffTime = dateObj.getTime() - today.getTime(); const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); if (diffDays === 0) return 'Hari ini'; if (diffDays === 1) return 'Besok'; return `dalam ${diffDays} hari`; };
  
  // Theme Helpers for List Rows
  const getRowVariant = (index: number) => {
      const variants = ['bg-white border-gray-100', 'bg-[#FFF9D0]/30 border-amber-100', 'bg-[#CAF4FF]/20 border-blue-100'];
      return variants[index % variants.length];
  };

  const monthlyLineChartData = useMemo(() => {
    const now = new Date();
    const todayStr = getLocalISODate(now);
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const data = [];

    const monthlyRecords = classAttendanceRecords.filter(record => {
        const recordDate = new Date(record.date + 'T00:00:00');
        return recordDate.getFullYear() === year && recordDate.getMonth() === month;
    });

    for (let i = 1; i <= daysInMonth; i++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const targetDate = new Date(dateStr + 'T00:00:00');
        const isSunday = targetDate.getDay() === 0;
        const isHoliday = holidays.some(h => h.date === dateStr);
        
        let presentCount = 0;
        let sickCount = 0;
        let permitCount = 0;
        let alphaCount = 0;

        if (dateStr <= todayStr && !isSunday && !isHoliday) {
            const dayRecords = monthlyRecords.filter(r => r.date === dateStr);
            presentCount = new Set(dayRecords.filter(r => r.status === 'present').map(r => r.studentId)).size;
            sickCount = new Set(dayRecords.filter(r => r.status === 'sick').map(r => r.studentId)).size;
            permitCount = new Set(dayRecords.filter(r => r.status === 'permit').map(r => r.studentId)).size;
            
            const recordedCount = presentCount + sickCount + permitCount;
            alphaCount = students.length - recordedCount;
            if (alphaCount < 0) alphaCount = 0;
        }

        const total = presentCount + sickCount + permitCount + alphaCount;
        const divisor = total > 0 ? total : 1;

        const presentPercent = Math.round((presentCount / divisor) * 100);
        const sickPercent = Math.round((sickCount / divisor) * 100);
        const permitPercent = Math.round((permitCount / divisor) * 100);
        const alphaPercent = total > 0 ? 100 - (presentPercent + sickPercent + permitPercent) : 0;

        data.push({
            name: `${i}`,
            Hadir: presentPercent,
            Sakit: sickPercent,
            Izin: permitPercent,
            Alpha: alphaPercent,
            rawH: presentCount,
            rawS: sickCount,
            rawI: permitCount,
            rawA: alphaCount
        });
    }
    return data;
  }, [classAttendanceRecords, students, holidays]);

  const curriculumProgress = useMemo(() => {
    if (!subjects || !grades || students.length === 0) return [];
    return subjects.map((subject) => {
        const subjectId = subject.id;
        const kkm = kktpMap[subjectId] || subject.kkm; // Use kktpMap value if available
        let totalAverageScore = 0;
        let gradedStudentsCount = 0;
        students.forEach(student => {
            const studentGradeRecord = grades.find(g => g.studentId === student.id);
            const subjectGrade = studentGradeRecord?.subjects[subjectId];
            if (subjectGrade) {
                const scores = [subjectGrade.sum1, subjectGrade.sum2, subjectGrade.sum3, subjectGrade.sum4, subjectGrade.sas];
                const validScores = scores.filter(score => score > 0);
                if (validScores.length > 0) {
                    const studentAverage = validScores.reduce((acc, score) => acc + score, 0) / validScores.length;
                    totalAverageScore += studentAverage;
                    gradedStudentsCount++;
                }
            }
        });
        const classAverage = gradedStudentsCount > 0 ? Math.round(totalAverageScore / gradedStudentsCount) : 0;
        const progress = kkm > 0 ? Math.min(100, Math.round((classAverage / kkm) * 100)) : 0;
        const nameParts = subject.name.split(' ');
        const shortName = nameParts.length > 1 ? `${nameParts[0].charAt(0)}. ${nameParts.slice(1).join(' ')}` : subject.name;
        return { id: subject.id, name: subject.name, shortName, progress, classAverage, kkm };
    });
  }, [subjects, grades, students]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-bold text-gray-800 text-sm">{data.name}</p>
          <p className={`text-lg font-bold ${data.classAverage >= data.kkm ? 'text-emerald-600' : 'text-amber-600'}`}>{data.progress}% Tercapai</p>
          <div className="mt-2 text-xs text-gray-600 space-y-1">
            <p>Rata-rata Kelas: <span className="font-bold">{data.classAverage.toFixed(1)}</span></p>
            <p>Target KKTP: <span className="font-bold">{data.kkm}</span></p>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomAttendanceTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-bold text-gray-800 text-sm mb-2">{label}</p>
          <div className="mt-2 text-xs text-gray-600 grid grid-cols-2 gap-x-4 gap-y-1">
            <p>Hadir: <span className="font-bold">{data.H} ({data.H_percent}%)</span></p>
            <p>Sakit: <span className="font-bold">{data.S} ({data.S_percent}%)</span></p>
            <p>Izin: <span className="font-bold">{data.I} ({data.I_percent}%)</span></p>
            <p>Alpha: <span className="font-bold">{data.A} ({data.A_percent}%)</span></p>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomMonthlyTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-bold text-gray-800 text-sm mb-2">Tanggal {label}</p>
          <div className="mt-2 text-xs text-gray-600 grid grid-cols-2 gap-x-4 gap-y-1">
            <p>Hadir: <span className="font-bold">{data.rawH} ({data.Hadir}%)</span></p>
            <p>Sakit: <span className="font-bold">{data.rawS} ({data.Sakit}%)</span></p>
            <p>Izin: <span className="font-bold">{data.rawI} ({data.Izin}%)</span></p>
            <p>Alpha: <span className="font-bold">{data.rawA} ({data.Alpha}%)</span></p>
          </div>
        </div>
      );
    }
    return null;
  };

  const hasPendingPermissions = pendingPermissions.length > 0;
  // Updated Priority Card Color to be more distinct for alerts
  const priorityCardStyle = hasPendingPermissions 
    ? 'bg-gradient-to-br from-orange-400 to-rose-500 shadow-orange-200' 
    : 'bg-gradient-to-br from-[#CAF4FF] to-[#A0DEFF] shadow-sky-200';
  const priorityCardText = hasPendingPermissions ? 'text-white' : 'text-slate-800';

  const handlePriorityClick = () => {
      if (hasPendingPermissions && onOpenPermissionModal) {
          onOpenPermissionModal();
      } else {
          navigate('/kegiatan');
      }
  };

  const runningTextContent = schoolProfile?.runningText || "Selamat Datang di Aplikasi SAGARA ✦ Sistem Administrasi Guru & Akademik (SAGARA) ✦ Mewujudkan Pendidikan Berkualitas & Berkarakter";
  const runningTextSpeed = schoolProfile?.runningTextSpeed || 20;

  if (currentUser?.role === 'superadmin') {
    return (
      <div className="space-y-6 pb-20 animate-fade-in relative min-h-screen">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-4">
            <div className="text-center md:text-left w-full md:w-auto">
                <h1 className="text-xl md:text-2xl font-bold text-gray-800 flex flex-col md:flex-row items-center justify-center md:justify-start">
                    <div className="flex items-center text-lg md:text-2xl">
                        {getGreetingIcon(getGreeting())}
                        <span className="ml-2">Selamat {getGreeting()},</span>
                    </div>
                    <span className="text-[#5AB2FF] text-xl md:text-2xl mt-1 md:mt-0 md:ml-2">Superadmin 👋</span>
                </h1>
                <p className="text-gray-500 text-xs md:text-sm mt-3 text-center md:text-left leading-relaxed">
                    Selamat datang di Aplikasi SAGARA | Sistem Akademik & Administrasi Terintegrasi. Berikut adalah ringkasan sistem pusat hari ini.
                </p>
            </div>
            
            <div className="flex flex-row items-center justify-center gap-2 w-full md:w-auto mt-2 md:mt-0">
                <div className="flex items-center space-x-2 md:space-x-3 bg-white px-3 md:px-4 py-2 flex-grow md:flex-none justify-center rounded-xl shadow-sm border border-gray-200">
                    <Calendar size={18} className="text-[#5AB2FF] shrink-0 md:w-6 md:h-6" />
                    <div className="text-left leading-tight">
                        <p className="text-sm md:text-lg font-bold text-gray-800 tabular-nums tracking-wider">{formattedTime}</p>
                        <p className="text-[9px] md:text-xs font-medium text-gray-500 capitalize line-clamp-1">{formattedDate}</p>
                    </div>
                </div>
            </div>
        </div>

        {/* Panel Statistik Dashboard Superadmin */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div 
            onClick={() => navigate('/manajemen-database-pusat')} 
            className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-md flex items-center justify-between transition-transform hover:-translate-y-1 hover:shadow-lg cursor-pointer duration-300"
          >
            <div>
              <p className="text-blue-100 text-xs font-bold uppercase tracking-wider">Jumlah Sekolah Keseluruhan</p>
              {loadingSchools ? (
                <div className="h-10 flex items-center"><Loader2 className="w-6 h-6 animate-spin text-white/80" /></div>
              ) : (
                <h3 className="text-4xl font-black mt-2 tracking-tight">{schools.length}</h3>
              )}
              <p className="text-blue-200 text-xs mt-1">Sekolah terdaftar di sistem</p>
            </div>
            <div className="p-4 bg-white/10 rounded-2xl border border-white/10">
              <School className="w-8 h-8 text-white" />
            </div>
          </div>

          <div 
            onClick={() => navigate('/manajemen-database-pusat')} 
            className="relative overflow-hidden bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-md flex items-center justify-between transition-transform hover:-translate-y-1 hover:shadow-lg cursor-pointer duration-300"
          >
            <div>
              <p className="text-emerald-100 text-xs font-bold uppercase tracking-wider">Sekolah Aktif</p>
              {loadingSchools ? (
                <div className="h-10 flex items-center"><Loader2 className="w-6 h-6 animate-spin text-white/80" /></div>
              ) : (
                <h3 className="text-4xl font-black mt-2 tracking-tight">{schools.filter(s => s.is_active).length}</h3>
              )}
              <p className="text-emerald-200 text-xs mt-1">Sekolah dengan akses aktif</p>
            </div>
            <div className="p-4 bg-white/10 rounded-2xl border border-white/10">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
          </div>

          <div 
            onClick={() => navigate('/manajemen-database-pusat')} 
            className="relative overflow-hidden bg-gradient-to-r from-rose-500 to-pink-600 rounded-2xl p-6 text-white shadow-md flex items-center justify-between transition-transform hover:-translate-y-1 hover:shadow-lg cursor-pointer duration-300"
          >
            <div>
              <p className="text-rose-100 text-xs font-bold uppercase tracking-wider">Sekolah Tidak Aktif</p>
              {loadingSchools ? (
                <div className="h-10 flex items-center"><Loader2 className="w-6 h-6 animate-spin text-white/80" /></div>
              ) : (
                <h3 className="text-4xl font-black mt-2 tracking-tight">{schools.filter(s => !s.is_active).length}</h3>
              )}
              <p className="text-rose-200 text-xs mt-1">Akses database dinonaktifkan</p>
            </div>
            <div className="p-4 bg-white/10 rounded-2xl border border-white/10">
              <XCircle className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        {/* Panel Informasi Tambahan khusus Superadmin */}
        <div className="bg-white rounded-2xl p-6 border border-[#CAF4FF] shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-2">Selamat Datang di Panel Superadmin</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Sebagai Superadmin, Anda memiliki wewenang penuh atas konfigurasi basis data sekolah yang terdaftar. 
            Anda dapat memonitor status keaktifan masing-masing server sekolah, mengedit info pengembang, mengaktifkan/menonaktifkan akses, 
            serta menambahkan sekolah baru ke dalam sistem terintegrasi SAGARA.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button 
              onClick={() => navigate('/manajemen-database-pusat')}
              className="px-5 py-2.5 bg-[#5AB2FF] hover:bg-[#409EEF] text-white font-bold text-xs rounded-xl shadow-md shadow-blue-200 transition-all active:scale-95 flex items-center gap-2"
            >
              <School size={14} /> Kelola Database Sekolah
            </button>
            <button 
              onClick={() => navigate('/profil')}
              className="px-5 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 font-bold text-xs rounded-xl transition-all active:scale-95"
            >
              Lihat Profil
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 animate-fade-in relative min-h-screen">
      {/* Running Text Banner */}
      <div className="w-full bg-gradient-to-r from-[#5AB2FF] to-[#A0DEFF] text-white py-2.5 px-4 rounded-xl shadow-md overflow-hidden flex items-center mb-2">
         <div className="flex items-center justify-center bg-white/20 p-1.5 rounded-full mr-3 shrink-0">
            <Info size={16} className="text-white"/>
         </div>
         <div className="overflow-hidden w-full relative h-6">
            {showRunningText && (
                <div 
                    className="animate-marquee font-bold text-sm tracking-wide whitespace-nowrap absolute top-0 left-0 animate-fade-in"
                    style={{ animationDuration: `${runningTextSpeed}s` }}
                >
                    {runningTextContent}
                </div>
            )}
         </div>
      </div>

      <div className="relative z-10 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-4">
            <div className="text-center md:text-left w-full md:w-auto">
                <h1 className="text-xl md:text-2xl font-bold text-gray-800 flex flex-col md:flex-row items-center justify-center md:justify-start">
                    <div className="flex items-center text-lg md:text-2xl">
                        {getGreetingIcon(getGreeting())}
                        <span className="ml-2">Selamat {getGreeting()},</span>
                    </div>
                    <span className="text-[#5AB2FF] text-xl md:text-2xl mt-1 md:mt-0 md:ml-2">
                        {(teacherName && teacherName !== 'undefined') 
                            ? teacherName 
                            : 'Bapak/Ibu Guru'} 👋
                    </span>
                </h1>
                <p className="text-gray-500 text-xs md:text-sm mt-3 text-center md:text-left leading-relaxed">
                    Selamat datang di Aplikasi SAGARA | Sistem Akademik & Administrasi Terintegrasi. Berikut adalah ringkasan aktivitas {teachingClass ? `Kelas ${teachingClass}` : 'Sekolah'} hari ini.
                </p>
            </div>
            
            <div className="flex flex-row items-center justify-center gap-2 w-full md:w-auto mt-2 md:mt-0">
                {canTriggerAlert && (
                    <button 
                        onClick={() => navigate('/mitigasi-bencana')}
                        className="relative bg-red-50 p-2 md:p-3 rounded-xl shadow-sm border border-red-100 text-red-600 hover:bg-red-100 transition-all animate-pulse"
                        title="Mitigasi Bencana"
                    >
                        <AlertTriangle size={20} className="md:w-6 md:h-6" />
                    </button>
                )}
                <div className="flex items-center space-x-1.5 md:space-x-2 bg-[#5AB2FF] text-white px-3 md:px-4 py-2 bg-gradient-to-r from-[#5AB2FF] to-[#80CFFF] rounded-xl shadow-md border border-blue-400">
                    <BookOpen size={16} className="md:w-[18px] md:h-[18px]" />
                    <span className="text-xs md:text-sm font-bold whitespace-nowrap">{teachingClass ? `Kelas ${teachingClass}` : 'ALL'}</span>
                </div>
                <div className="flex items-center space-x-2 md:space-x-3 bg-white px-3 md:px-4 py-2 flex-grow md:flex-none justify-center rounded-xl shadow-sm border border-gray-200">
                    <Calendar size={18} className="text-[#5AB2FF] shrink-0 md:w-6 md:h-6" />
                    <div className="text-left leading-tight">
                        <p className="text-sm md:text-lg font-bold text-gray-800 tabular-nums tracking-wider">{formattedTime}</p>
                        <p className="text-[9px] md:text-xs font-medium text-gray-500 capitalize line-clamp-1">{formattedDate}</p>
                    </div>
                </div>
            </div>
        </div>

        {/* Links Grid - UPDATED COLORS */}
        {employmentLinks.length > 0 && (
          <div className="bg-white p-3 md:p-4 rounded-2xl shadow-sm border border-[#CAF4FF]">
              <div className="flex md:flex-wrap overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 gap-3 md:gap-4 justify-start md:justify-center items-stretch scrollbar-hide">
                {employmentLinks.map((link, index) => (
                  <a 
                    key={link.id} 
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center p-2 rounded-xl transition-all border-2 bg-white border-[#CAF4FF] hover:border-[#5AB2FF] shadow-sm md:hover:-translate-y-1 hover:shadow-lg group text-center aspect-square w-20 h-20 md:w-28 md:h-28 shrink-0"
                  >
                    <div className="w-full h-full flex flex-col items-center justify-center">
                      <div className="w-8 h-8 md:w-12 md:h-12 mb-0 md:mb-2 shrink-0 rounded-lg bg-white flex items-center justify-center overflow-hidden md:group-hover:scale-110 transition-transform">
                         {link.icon ? (
                           <img src={link.icon} alt={link.title} className="w-full h-full object-contain" />
                         ) : (
                           <LinkIcon className="text-gray-400 w-5 h-5 md:w-6 md:h-6" size={24} />
                         )}
                      </div>
                      <span className="hidden md:block text-[10px] md:text-xs font-bold text-gray-700 leading-tight w-full break-words">{link.title}</span>
                      {/* Mobile Label (optional but usually links need it if they aren't obvious) */}
                      <span className="md:hidden text-[8px] font-bold text-gray-600 truncate w-full mt-1">{link.title}</span>
                    </div>
                  </a>
                ))}
              </div>
          </div>
        )}

        {/* Summary Widgets - Themed */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Total Siswa (Ocean Blue Gradient) */}
            <div onClick={() => navigate('/siswa')} className="bg-gradient-to-br from-[#5AB2FF] to-[#A0DEFF] text-white p-5 rounded-2xl shadow-lg shadow-blue-200 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group">
                <div className="flex justify-between items-start">
                    <div>
                    <p className="text-sm font-medium text-blue-100 mb-1">Total Siswa</p>
                    <h3 className="text-3xl font-bold">{totalStudents}</h3>
                    </div>
                    <div className="p-2 bg-white/20 rounded-lg"><Users size={20} className="text-white" /></div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs font-bold">
                    <span className="px-2.5 py-1 bg-blue-600 rounded-md border border-blue-400 shadow-sm">L: {maleStudents}</span>
                    <span className="px-2.5 py-1 bg-pink-500 rounded-md border border-pink-400 shadow-sm">P: {femaleStudents}</span>
                </div>
            </div>

            {/* 2. Attendance (Sky Blue Gradient - Dark Text) */}
            <div onClick={() => navigate('/absensi')} className="bg-gradient-to-br from-[#A0DEFF] to-white text-slate-800 p-5 rounded-2xl shadow-lg shadow-sky-200 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                <div className="flex justify-between items-start">
                    <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">Kehadiran Hari Ini</p>
                    <div className="flex items-end gap-2">
                        <h3 className="text-3xl font-bold">
                        {totalStudents > 0 ? (100 - (Math.round((todayStats.sick / totalStudents) * 100) + Math.round((todayStats.permit / totalStudents) * 100) + Math.round((todayStats.alpha / totalStudents) * 100))) : 0}%
                        </h3>
                    </div>
                    </div>
                    <div className="p-2 bg-slate-800/10 rounded-lg"><UserCheck size={20} className="text-slate-700" /></div>
                </div>
                <div className="mt-4 flex space-x-1 text-[10px] font-bold text-white">
                    <div className="flex-1 bg-emerald-500 rounded-l-md py-1 text-center truncate shadow-sm">H: {totalStudents - (todayStats.sick + todayStats.permit + todayStats.alpha)}</div>
                    <div className="w-10 bg-amber-400 py-1 text-center shadow-sm">S: {todayStats.sick}</div>
                    <div className="w-10 bg-indigo-500 py-1 text-center shadow-sm">I: {todayStats.permit}</div>
                    <div className="w-8 bg-rose-500 rounded-r-md py-1 text-center shadow-sm">A: {todayStats.alpha}</div>
                </div>
            </div>

            {/* 3. Admin Completeness (Cream - Dark Text) */}
            <div onClick={() => navigate('/administrasi/kelas')} className="bg-[#FFF9D0] text-amber-900 p-5 rounded-2xl shadow-lg shadow-amber-100 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border border-amber-200">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm font-bold text-amber-700 mb-1">Administrasi</p>
                        <h3 className="text-3xl font-bold">{adminCompleteness}%</h3>
                    </div>
                    <div className="p-2 bg-white/60 rounded-lg"><FileText size={20} className="text-amber-600"/></div>
                </div>
                <div className="mt-4 w-full bg-white/50 rounded-full h-2 overflow-hidden">
                    <div className="bg-amber-500 h-2 transition-all duration-1000" style={{ width: `${adminCompleteness}%` }}></div>
                </div>
                <div className="mt-2 text-xs text-amber-800 font-medium flex justify-between">
                    <span>Kelengkapan</span>
                    {adminCompleteness === 100 && <span>Sempurna!</span>}
                </div>
            </div>

            {/* 4. Priority / Notification (Dynamic Gradient) */}
            <div 
                onClick={handlePriorityClick} 
                className={`${priorityCardStyle} ${priorityCardText} p-5 rounded-2xl shadow-lg cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl relative overflow-hidden`}
            >
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-3">
                        <p className={`text-sm font-medium ${hasPendingPermissions ? 'text-white/90' : 'text-slate-600'}`}>
                            {hasPendingPermissions ? 'Menunggu Konfirmasi' : 'Prioritas'}
                        </p>
                        <Bell size={18} className={`${hasPendingPermissions ? 'text-white animate-bounce' : 'text-slate-600 animate-pulse'}`} />
                    </div>
                    
                    {hasPendingPermissions ? (
                        <>
                            <h3 className="text-lg font-bold leading-tight mb-2">
                                {pendingPermissions.length} Permintaan Ijin
                            </h3>
                            <div className="flex items-center text-xs text-white mt-4 bg-white/30 w-fit px-3 py-1.5 rounded-lg border border-white/40 font-bold backdrop-blur-sm">
                                <Mail size={12} className="mr-1.5" />
                                Klik untuk memproses
                            </div>
                        </>
                    ) : priorityAgenda ? (
                        <>
                            <h3 className="text-lg font-bold leading-tight mb-2 line-clamp-2 text-slate-800">{priorityAgenda.title}</h3>
                            <div className="flex items-center text-xs text-slate-600 mt-4 bg-white/40 w-fit px-2 py-1 rounded-lg">
                                <Clock size={12} className="mr-1.5" />
                                Deadline: {formatLongDate(priorityAgenda.date)}
                            </div>
                        </>
                    ) : (
                        <>
                            <h3 className="text-lg font-bold mb-2 text-slate-800">Semua Aman!</h3>
                            <p className="text-xs text-slate-600">Tidak ada agenda mendesak.</p>
                        </>
                    )}
                </div>
            </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
            <div onClick={() => navigate('/absensi')} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-800">Tren Kehadiran Minggu Ini</h3>
                    <p className="text-sm text-gray-400">Monitoring partisipasi siswa (Senin - Sabtu)</p>
                </div>
                </div>
                <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={attendanceTrendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} domain={[0, 100]} unit="%" />
                    <Tooltip content={<CustomAttendanceTooltip />} cursor={{ fill: 'rgba(90, 178, 255, 0.1)' }} />
                    <Legend iconType="circle"/>
                    <Area type="monotone" dataKey="H_percent" name="Hadir" stroke="#10B981" fill="#10B981" fillOpacity={0.1} strokeWidth={2}/>
                    <Area type="monotone" dataKey="S_percent" name="Sakit" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.1} strokeWidth={2}/>
                    <Area type="monotone" dataKey="I_percent" name="Izin" stroke="#6366F1" fill="#6366F1" fillOpacity={0.1} strokeWidth={2}/>
                    <Area type="monotone" dataKey="A_percent" name="Alpha" stroke="#EF4444" fill="#EF4444" fillOpacity={0.1} strokeWidth={2}/>
                    </AreaChart>
                </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Rekap Absensi Bulan Ini</h3>
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={monthlyLineChartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6"/>
                            <XAxis dataKey="name" tick={{fill: '#9CA3AF', fontSize: 12}}/>
                            <YAxis tick={{fill: '#9CA3AF', fontSize: 12}} domain={[0, 100]} unit="%"/>
                            <Tooltip content={<CustomMonthlyTooltip />} cursor={{ fill: 'rgba(90, 178, 255, 0.1)' }}/>
                            <Legend iconType="circle"/>
                            <Area type="monotone" dataKey="Hadir" stroke="#10B981" fill="#10B981" fillOpacity={0.1} strokeWidth={2}/>
                            <Area type="monotone" dataKey="Sakit" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.1} strokeWidth={2}/>
                            <Area type="monotone" dataKey="Izin" stroke="#6366F1" fill="#6366F1" fillOpacity={0.1} strokeWidth={2}/>
                            <Area type="monotone" dataKey="Alpha" stroke="#EF4444" fill="#EF4444" fillOpacity={0.1} strokeWidth={2}/>
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                onClick={() => navigate('/laporan-pembelajaran')}
            >
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center"><FileText size={18} className="mr-2 text-indigo-500"/> Laporan Pembelajaran</h3>
                <div className="space-y-3">
                    {learningReports.slice(0, 5).map(report => {
                        const isLongType = report.type.length > 10;
                        const isVeryLongType = report.type.length > 14;
                        const typeSizeClass = isVeryLongType 
                            ? 'text-[8px] sm:text-[10px]' 
                            : isLongType 
                                ? 'text-[9px] sm:text-[10px]' 
                                : 'text-[10px]';

                        const teacherName = report.teacherName || 'Guru';
                        const isLongTeacher = teacherName.length > 20;
                        const isVeryLongTeacher = teacherName.length > 28;
                        const teacherSizeClass = isVeryLongTeacher
                            ? 'text-[9px] sm:text-xs'
                            : isLongTeacher
                                ? 'text-[10px] sm:text-xs'
                                : 'text-xs';

                        return (
                            <div key={report.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 gap-2">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-gray-800 break-words">{report.subject}</p>
                                    <p className={`text-gray-500 mt-0.5 leading-normal whitespace-nowrap truncate ${teacherSizeClass}`} title={teacherName}>{teacherName}</p>
                                </div>
                                <span className={`font-bold px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-full shrink-0 whitespace-nowrap transition-all duration-300 ${typeSizeClass}`}>
                                    {report.type}
                                </span>
                            </div>
                        );
                    })}
                    {learningReports.length === 0 && <p className="text-sm text-gray-400 italic text-center py-4">Belum ada laporan.</p>}
                </div>
            </div>
            </div>

            {/* Side Lists with Alternating Colors */}
            <div className="space-y-6">
            <div 
                onClick={() => navigate('/absensi')}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            >
                <h3 className="text-lg font-bold text-gray-800 mb-4">Absensi Hari Ini</h3>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {absentToday.length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-center py-8">
                            <UserCheck size={32} className="text-emerald-500 mb-2" />
                            <p className="font-semibold text-emerald-700">Semua siswa hadir!</p>
                        </div>
                    ) : (
                        absentToday.map((record: any, idx) => {
                            // Definisi konfigurasi status dengan tipe data yang jelas
                            const statusConfig: { [key: string]: { icon: any, color: string, label: string } } = {
                                sick: { icon: Activity, color: 'text-amber-600 bg-amber-100', label: 'Sakit' },
                                permit: { icon: FileText, color: 'text-blue-600 bg-blue-100', label: 'Izin' },
                                alpha: { icon: XCircle, color: 'text-rose-600 bg-rose-100', label: 'Alpha' }
                            };
                            
                            const defaultConfig = { icon: AlertCircle, color: 'text-gray-600 bg-gray-100', label: '?' };
                            const config = statusConfig[record.status as string] || defaultConfig;
                            const Icon = config.icon;

                            return (
                                <div key={record.studentId} className={`flex items-start space-x-3 p-3 rounded-xl border border-transparent ${getRowVariant(idx)}`}>
                                    <div className={`p-2 rounded-full ${config.color}`}>
                                        <Icon size={16} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center">
                                            <h4 className="text-sm font-semibold text-gray-800">{record.name}</h4>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${config.color}`}>
                                                {config.label}
                                            </span>
                                        </div>
                                        {record.notes && (
                                            <p className="text-xs text-gray-500 mt-1 italic">"{record.notes}"</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* NEW: Supervision Results Section */}
            <div 
                onClick={() => navigate('/jurnal-pembelajaran')}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            >
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center">
                        <Activity size={18} className="mr-2 text-rose-500" /> Hasil Supervisi
                    </h3>
                    {learningJournals.some(j => j.supervisionFeedback && !j.feedbackRead) && (
                        <div className="flex items-center gap-1.5 bg-rose-50 px-2 py-1 rounded-full border border-rose-100 animate-pulse">
                            <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
                            <span className="text-[10px] font-black text-rose-600 uppercase">BARU</span>
                        </div>
                    )}
                </div>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                    {learningJournals.filter(j => j.supervisionFeedback).length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-center py-6">
                            <MessageSquare size={32} className="text-gray-200 mb-2" />
                            <p className="text-xs text-gray-400 italic font-medium">Belum ada umpan balik supervisi.</p>
                        </div>
                    ) : (
                        learningJournals
                            .filter(j => j.supervisionFeedback)
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .slice(0, 5)
                            .map((journal, idx) => (
                                <div key={journal.id} className={`p-3 rounded-xl border relative transition-all ${!journal.feedbackRead ? 'bg-rose-50 border-rose-100 ring-1 ring-rose-200 ring-offset-1' : 'bg-gray-50 border-gray-100'}`}>
                                    <div className="flex justify-between items-start mb-1">
                                        <p className="text-[10px] font-black text-gray-400 tracking-tighter">
                                            {formatLongDate(journal.date)}
                                        </p>
                                        {!journal.feedbackRead && (
                                            <span className="w-2 h-2 bg-rose-500 rounded-full animate-ping"></span>
                                        )}
                                    </div>
                                    <h4 className="text-xs font-bold text-gray-700 mb-1">
                                        {journal.subject} — {journal.topic}
                                        <span className="ml-2 px-1.5 py-0.5 bg-gray-200 text-[#555] rounded text-[8px] font-black uppercase">
                                            KELAS {journal.classId}
                                        </span>
                                    </h4>
                                    <div className="flex items-center gap-1 mb-2 text-[10px] font-bold text-gray-500">
                                        <UserIcon size={10} className="text-gray-400" />
                                        {journal.teacherName || 'Guru Pengajar'}
                                    </div>
                                    <div className="flex items-start gap-2 bg-white/60 p-2 rounded-lg border border-white/80">
                                        <MessageSquare size={12} className="text-rose-400 shrink-0 mt-0.5" />
                                        <p className="text-xs text-gray-600 italic">"{journal.supervisionFeedback}"</p>
                                    </div>
                                    <div className="mt-2 text-[9px] font-bold text-rose-500 flex items-center justify-between">
                                        <span>Supervisor: {journal.supervisorName || 'Kepala Sekolah'}</span>
                                        {!journal.feedbackRead && <span className="text-rose-600 animate-pulse">KLIK UNTUK BACA</span>}
                                    </div>
                                </div>
                            ))
                    )}
                </div>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Kalender Libur</h3>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {upcomingHolidays.map((holiday, idx) => {
                        const daysRemainingText = getDaysRemaining(holiday.dateObj);
                        const isLongRemaining = daysRemainingText.length > 5;
                        const badgeSizeClass = isLongRemaining ? 'text-[9px] sm:text-xs' : 'text-xs';

                        return (
                            <div key={holiday.id} className={`flex items-start space-x-3 p-3 rounded-xl ${getRowVariant(idx)}`}>
                                <div className="p-2 rounded-full bg-[#5AB2FF] text-white shrink-0 mt-0.5"><CalendarRange size={16} /></div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-semibold text-gray-800 line-clamp-2">{holiday.description}</h4>
                                    <div className="flex items-center justify-between mt-1 gap-2 min-w-0">
                                        <p className="text-xs text-gray-500 font-medium truncate min-w-0 flex-1" title={formatLongDate(holiday.date)}>{formatLongDate(holiday.date)}</p>
                                        <p className={`text-[#5AB2FF] font-bold bg-white px-2 py-0.5 rounded-full border border-[#5AB2FF] shrink-0 whitespace-nowrap ${badgeSizeClass}`}>
                                            {daysRemainingText}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Reminder</h3>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {incompleteAgendas.map((rem, idx) => (
                    <div key={rem.id} className={`flex items-start space-x-3 p-3 rounded-xl ${getRowVariant(idx)}`}>
                        <div className={`mt-1 p-1.5 rounded-full ${rem.type === 'urgent' ? 'bg-red-100 text-red-600' : rem.type === 'warning' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                            {rem.type === 'urgent' ? <AlertCircle size={14} /> : <CheckCircle size={14} />}
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-gray-500 font-medium mb-0.5">{formatLongDate(rem.date)}</p>
                            <h4 className="text-sm font-semibold text-gray-800 line-clamp-2">{rem.title}</h4>
                        </div>
                    </div>
                    ))}
                </div>
            </div>
            </div>
        </div>

        {/* Bottom Section: Target Kurikulum & Dokumentasi Pembelajaran */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <div className={imagesForCarousel.length > 0 ? "" : "lg:col-span-2"}>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 h-full" onClick={() => navigate('/nilai')}>
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">Target Kurikulum</h3>
                            <p className="text-sm text-gray-400">Pencapaian rata-rata kelas terhadap target KKTP</p>
                        </div>
                    </div>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={curriculumProgress} margin={{ top: 5, right: 20, left: -10, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis 
                                    dataKey="shortName" 
                                    tick={{ fill: '#6B7280', fontSize: 12 }} 
                                    interval={0}
                                    angle={-35}
                                    textAnchor="end"
                                    height={50}
                                />
                                <YAxis domain={[0, 100]} unit="%" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9fafb' }} />
                                <Bar dataKey="progress" radius={[4, 4, 0, 0]}>
                                    {curriculumProgress.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {imagesForCarousel.length > 0 && (
                <div 
                    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 h-full flex flex-col"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center"><Camera size={18} className="mr-2 text-indigo-500"/> Dokumentasi Pembelajaran</h3>
                        <button 
                            type="button"
                            onClick={() => navigate('/dokumentasi-pembelajaran')}
                            className="text-xs font-bold text-[#5AB2FF] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                            <span>Lihat Semua</span>
                            <ChevronRight size={14} />
                        </button>
                    </div>
                    <div className="relative w-full h-64 bg-gray-100 rounded-xl shadow-inner border border-gray-200 overflow-hidden group flex-1">
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
                                          <img src={image.linkFoto} alt={image.namaKegiatan} className="w-full h-full object-contain opacity-40" />
                                        )}
                                      </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>

                        <div className="absolute bottom-4 left-4 text-white drop-shadow-lg max-w-[calc(100%-60px)] pointer-events-none select-none">
                            <p className="font-bold text-md truncate">{imagesForCarousel[carouselIndex]?.namaKegiatan}</p>
                        </div>

                        {imagesForCarousel.length > 1 && (
                            <>
                                <button onClick={(e) => { e.stopPropagation(); goToPreviousSlide(); }} className="absolute top-1/2 left-3 -translate-y-1/2 bg-white/60 p-1.5 rounded-full text-gray-800 hover:bg-white transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm">
                                    <ChevronLeft size={20} />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); goToNextSlide(); }} className="absolute top-1/2 right-3 -translate-y-1/2 bg-white/60 p-1.5 rounded-full text-gray-800 hover:bg-white transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm">
                                    <ChevronRight size={20} />
                                </button>
                                <div className="absolute bottom-3 right-3 flex gap-1.5 z-20">
                                    {imagesForCarousel.map((_, i) => (
                                        <div 
                                            key={i} 
                                            onClick={(e) => { e.stopPropagation(); setCarouselIndex(i); }} 
                                            className={`w-2 h-2 rounded-full cursor-pointer transition-all ${carouselIndex === i ? 'bg-white scale-125' : 'bg-white/50'}`}
                                        ></div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>

        <div className="fixed bottom-[96px] md:bottom-[40px] right-6 z-40 flex flex-col items-end space-y-4">
            {isFabOpen && (
            <div className="flex flex-col space-y-3 animate-fade-in-up">
                <button onClick={() => navigate('/nilai')} className="flex items-center space-x-2 bg-white text-gray-700 px-4 py-2 rounded-full shadow-lg border border-gray-100 hover:scale-105 transition-transform">
                <span className="text-sm font-medium">Input Nilai</span><div className="bg-purple-100 p-1 rounded-full"><GraduationCap size={16} className="text-purple-600"/></div>
                </button>
                <button onClick={() => navigate('/absensi')} className="flex items-center space-x-2 bg-white text-gray-700 px-4 py-2 rounded-full shadow-lg border border-gray-100 hover:scale-105 transition-transform">
                <span className="text-sm font-medium">Catat Absen</span><div className="bg-emerald-100 p-1 rounded-full"><UserCheck size={16} className="text-emerald-600"/></div>
                </button>
                <button onClick={() => navigate('/siswa')} className="flex items-center space-x-2 bg-white text-gray-700 px-4 py-2 rounded-full shadow-lg border border-gray-100 hover:scale-105 transition-transform">
                <span className="text-sm font-medium">Tambah Siswa</span><div className="bg-blue-100 p-1 rounded-full"><Users size={16} className="text-blue-600"/></div>
                </button>
            </div>
            )}
            <button onClick={() => setIsFabOpen(!isFabOpen)} className={`w-14 h-14 rounded-full shadow-xl text-white transition-all transform hover:scale-110 flex items-center justify-center ${isFabOpen ? 'bg-red-500 rotate-45' : 'bg-gradient-to-r from-[#5AB2FF] to-[#A0DEFF]'}`}><Plus size={24} /></button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
