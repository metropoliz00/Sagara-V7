import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  Plus, Edit2, Trash2, Play, Pause, Eye, EyeOff, CheckCircle, XCircle, 
  Clock, BookOpen, AlertCircle, Save, ChevronLeft, ChevronRight,
  HelpCircle, Check, X, ListFilter, User as UserIcon, LogIn, Monitor,
  Maximize2, Minimize2, Type, ArrowLeft, ArrowRight, Flag, RefreshCw,
  Image as ImageIcon, Copy, Download, Upload, LayoutGrid, ZoomIn, ZoomOut, List, BarChart2, FileText,
  ArrowUp, HeartHandshake, Medal, Calculator, Compass, Music, Trophy, Book, Globe, Printer
} from 'lucide-react';
import { Sumatif, Question, QuestionType, User, Student, Subject, SumatifResult } from '../types';
import { apiService } from '../services/apiService';
import { cacheService } from '../src/services/cacheService';
import { compressImage } from '../utils/imageHelper';
import { MOCK_SUBJECTS } from '../constants';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import html2pdf from 'html2pdf.js';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import PrintLayout from './PrintLayout';

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
    gradient: 'from-emerald-500/15 to-teal-500/5 hover:from-emerald-500/25 hover:to-teal-500/15',
    borderColor: 'border-emerald-100 hover:border-emerald-300',
    shadow: 'hover:shadow-emerald-100/50',
    textColor: 'text-emerald-950',
    subtitleColor: 'text-emerald-800/80',
    badgeBg: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    icon: HeartHandshake,
    accentColor: 'text-emerald-600 bg-white shadow-sm border border-emerald-100',
    emoji: '🕌'
  },
  'pancasila': {
    gradient: 'from-rose-500/15 to-amber-500/5 hover:from-rose-500/25 hover:to-amber-500/15',
    borderColor: 'border-rose-100 hover:border-rose-300',
    shadow: 'hover:shadow-rose-100/50',
    textColor: 'text-rose-955',
    subtitleColor: 'text-rose-800/80',
    badgeBg: 'bg-rose-100 text-rose-800 border border-rose-200',
    icon: Medal,
    accentColor: 'text-rose-600 bg-white shadow-sm border border-rose-100',
    emoji: '🦅'
  },
  'indo': {
    gradient: 'from-blue-500/15 to-sky-500/5 hover:from-blue-500/25 hover:to-sky-500/15',
    borderColor: 'border-blue-100 hover:border-blue-300',
    shadow: 'hover:shadow-blue-100/50',
    textColor: 'text-blue-950',
    subtitleColor: 'text-blue-800/80',
    badgeBg: 'bg-blue-100 text-blue-800 border border-blue-200',
    icon: BookOpen,
    accentColor: 'text-blue-600 bg-white shadow-sm border border-blue-100',
    emoji: '✍️'
  },
  'mat': {
    gradient: 'from-amber-500/15 to-yellow-500/5 hover:from-amber-500/25 hover:to-yellow-500/15',
    borderColor: 'border-amber-100 hover:border-amber-300',
    shadow: 'hover:shadow-amber-100/50',
    textColor: 'text-amber-950',
    subtitleColor: 'text-amber-800/80',
    badgeBg: 'bg-amber-100 text-amber-900 border border-amber-200',
    icon: Calculator,
    accentColor: 'text-amber-600 bg-white shadow-sm border border-amber-100',
    emoji: '🔢'
  },
  'ipas': {
    gradient: 'from-cyan-500/15 to-teal-500/5 hover:from-cyan-500/25 hover:to-teal-500/15',
    borderColor: 'border-cyan-100 hover:border-cyan-300',
    shadow: 'hover:shadow-cyan-100/50',
    textColor: 'text-cyan-950',
    subtitleColor: 'text-cyan-800/80',
    badgeBg: 'bg-cyan-100 text-cyan-800 border border-cyan-200',
    icon: Compass,
    accentColor: 'text-cyan-600 bg-white shadow-sm border border-cyan-100',
    emoji: '🧪'
  },
  'senibudaya': {
    gradient: 'from-purple-500/15 to-fuchsia-500/5 hover:from-purple-500/25 hover:to-fuchsia-500/15',
    borderColor: 'border-purple-100 hover:border-purple-300',
    shadow: 'hover:shadow-purple-100/50',
    textColor: 'text-purple-950',
    subtitleColor: 'text-purple-800/80',
    badgeBg: 'bg-purple-100 text-purple-800 border border-purple-200',
    icon: Music,
    accentColor: 'text-purple-600 bg-white shadow-sm border border-purple-100',
    emoji: '🎨'
  },
  'pjok': {
    gradient: 'from-orange-500/15 to-amber-500/5 hover:from-orange-500/25 hover:to-amber-500/15',
    borderColor: 'border-orange-100 hover:border-orange-300',
    shadow: 'hover:shadow-orange-100/50',
    textColor: 'text-orange-950',
    subtitleColor: 'text-orange-850/80',
    badgeBg: 'bg-orange-100 text-orange-800 border border-orange-200',
    icon: Trophy,
    accentColor: 'text-orange-600 bg-white shadow-sm border border-orange-100',
    emoji: '⚽'
  },
  'jawa': {
    gradient: 'from-pink-500/15 to-rose-500/5 hover:from-pink-500/25 hover:to-rose-500/15',
    borderColor: 'border-pink-100 hover:border-pink-300',
    shadow: 'hover:shadow-pink-100/50',
    textColor: 'text-pink-950',
    subtitleColor: 'text-pink-800/80',
    badgeBg: 'bg-pink-100 text-pink-800 border border-pink-200',
    icon: Book,
    accentColor: 'text-pink-600 bg-white shadow-sm border border-pink-100',
    emoji: '🎭'
  },
  'inggris': {
    gradient: 'from-indigo-500/15 to-violet-500/5 hover:from-indigo-500/25 hover:to-violet-500/15',
    borderColor: 'border-indigo-100 hover:border-indigo-300',
    shadow: 'hover:shadow-indigo-100/50',
    textColor: 'text-indigo-950',
    subtitleColor: 'text-indigo-700/80',
    badgeBg: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
    icon: Globe,
    accentColor: 'text-indigo-600 bg-white shadow-sm border border-indigo-100',
    emoji: '🇬🇧'
  },
  'default': {
    gradient: 'from-slate-500/15 to-slate-500/5 hover:from-slate-500/25 hover:to-slate-500/15',
    borderColor: 'border-slate-100 hover:border-slate-300',
    shadow: 'hover:shadow-slate-100/50',
    textColor: 'text-slate-800',
    subtitleColor: 'text-slate-600',
    badgeBg: 'bg-slate-100 text-slate-800 border border-slate-200',
    icon: BookOpen,
    accentColor: 'text-slate-600 bg-white shadow-sm border border-slate-100',
    emoji: '📚'
  }
};

const checkCorrect = (q: Question, studentAnswer: any) => {
  if (studentAnswer === undefined || studentAnswer === null) return false;
  
  if (q.type === 'pg') {
    const sAns = String(studentAnswer).trim();
    const cAns = String(q.correctAnswer || '').trim();
    
    if (!sAns || !cAns) return false;
    
    // If exact ID match
    if (sAns === cAns) return true;
    
    // Fallback for legacy data checking text
    const sOpt = q.options?.find(o => o.id === sAns);
    const cOpt = q.options?.find(o => o.id === cAns);
    
    // If BOTH are valid existing options from the current question but IDs didn't match, they chose the wrong option.
    // Do NOT fall back to text comparison because that could falsely pass or fail if options have identical texts or empty texts.
    if (sOpt && cOpt) return false;
    
    const sAnsText = sOpt?.text || sAns;
    const cAnsText = cOpt?.text || cAns;
    
    return String(sAnsText).trim().toLowerCase() === String(cAnsText).trim().toLowerCase();
  } else if (q.type === 'pgk') {
    const sOnes = Array.isArray(studentAnswer) ? studentAnswer.map(s => String(s).trim()) : [];
    const cOnes = Array.isArray(q.correctAnswer) ? q.correctAnswer.map(c => String(c).trim()) : [];
    
    if (cOnes.length === 0) return false;
    if (sOnes.length !== cOnes.length) return false;
    
    // Exact IDs match check
    const sSorted = [...sOnes].sort();
    const cSorted = [...cOnes].sort();
    if (sSorted.every((val, index) => val === cSorted[index])) return true;
    
    // Fallback for legacy data checking text
    const allSFound = sOnes.every(s => q.options?.some(o => o.id === s));
    const allCFound = cOnes.every(c => q.options?.some(o => o.id === c));
    
    if (allSFound && allCFound) return false; // Both are modern IDs but mismatched

    // Normalize both to text for legacy reliable comparison
    const sTexts = sOnes.map(s => {
      const val = q.options?.find(o => o.id === s)?.text || s;
      return String(val || '').trim().toLowerCase();
    }).sort();

    const cTexts = cOnes.map(c => {
      const val = q.options?.find(o => o.id === c)?.text || c;
      return String(val || '').trim().toLowerCase();
    }).sort();
    
    return sTexts.length === cTexts.length && 
           sTexts.every((val, index) => val === cTexts[index]);
  } else if (q.type === 'bs') {
    const subAnswers = studentAnswer as Record<string, string> || {};
    const subQs = q.subQuestions || [];
    return subQs.length > 0 && subQs.every(sq => {
      const s = String(subAnswers[sq.id] || '').trim().toLowerCase();
      const c = String(sq.correctAnswer || '').trim().toLowerCase();
      return s && c && s === c;
    });
  } else if (q.type === 'uraian') {
    // Essay questions are graded manually. 
    // This function is for auto-grading only.
    return false;
  }
  return false;
};

const renderFormattedText = (text: string | null | undefined) => {
  if (!text) return null;
  const formattedText = text
    .replace(/<img[^>]*>/g, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');
  return formattedText;
};

interface SumatifViewProps {
  currentUser: User | null;
  activeClassId: string;
  students: Student[];
  onShowNotification: (message: string, type: 'success' | 'error' | 'warning') => void;
  onRefresh?: () => void;
}

const SumatifView: React.FC<SumatifViewProps> = ({ 
  currentUser, 
  activeClassId, 
  students,
  onShowNotification,
  onRefresh
}) => {
  const [sumatifs, setSumatifs] = useState<Sumatif[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(() => localStorage.getItem('sumatif_isEditing') === 'true');
  const [isTaking, setIsTaking] = useState(() => localStorage.getItem('sumatif_isTaking') === 'true');
  const [isPembahasan, setIsPembahasan] = useState(false);
  const [isEnteringToken, setIsEnteringToken] = useState(() => localStorage.getItem('sumatif_isEnteringToken') === 'true');
  const [currentSumatif, setCurrentSumatif] = useState<Sumatif | null>(() => {
    const saved = localStorage.getItem('sumatif_current');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    localStorage.setItem('sumatif_isEditing', isEditing.toString());
    localStorage.setItem('sumatif_isTaking', isTaking.toString());
    localStorage.setItem('sumatif_isEnteringToken', isEnteringToken.toString());
    if (currentSumatif) {
      localStorage.setItem('sumatif_current', JSON.stringify(currentSumatif));
    } else {
      localStorage.removeItem('sumatif_current');
    }
  }, [isEditing, isTaking, isEnteringToken, currentSumatif]);
  const [viewingResults, setViewingResults] = useState<Sumatif | null>(null);
  const [results, setResults] = useState<SumatifResult[]>([]);
  const [modal, setModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'alert' | 'confirm';
    onConfirm: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'alert',
    onConfirm: () => {},
    onCancel: () => {},
    confirmText: 'OK',
    cancelText: 'Batal'
  });

  const isTeacher = currentUser?.role === 'guru' || currentUser?.role === 'admin';
  const isStudent = currentUser?.role === 'siswa';

  const isGuru6 = useMemo(() => {
    if (!currentUser) return false;
    const isGuru = currentUser.role === 'guru';
    const classStr = String(activeClassId || '').toUpperCase();
    const teachingClassStr = String(currentUser?.classId || '').toUpperCase();
    const isClass6 = classStr.startsWith('6') || classStr.startsWith('VI');
    const isTeaching6 = teachingClassStr.startsWith('6') || teachingClassStr.startsWith('VI');
    return isGuru && (isClass6 || isTeaching6);
  }, [currentUser, activeClassId]);

  const canAccessTKA = useMemo(() => {
    if (!currentUser) return false;
    if (String(activeClassId || '').trim() !== '6') return false;
    return currentUser.role === 'admin' || currentUser.role === 'superadmin' || isGuru6;
  }, [currentUser, isGuru6, activeClassId]);

  useEffect(() => {
    fetchSumatifs();
  }, [activeClassId]);

  const fetchSumatifs = async () => {
    setLoading(true);
    const isDemo = !apiService.isConfigured();
    try {
      if (isDemo) {
        const cached = cacheService.get<Sumatif[]>('sumatifs') || [];
        setSumatifs(cached.filter(s => s.classId === activeClassId));
      } else {
        const data = await apiService.getSumatifs(activeClassId);
        setSumatifs(data);
        
        // Update local cache with fetched items for this class
        const allCached = cacheService.get<Sumatif[]>('sumatifs') || [];
        const otherClassesCached = allCached.filter(s => s.classId !== activeClassId);
        cacheService.set('sumatifs', [...otherClassesCached, ...data]);
      }
    } catch (error) {
      console.error("Gagal mengambil data sumatif:", error);
      const cached = cacheService.get<Sumatif[]>('sumatifs') || [];
      setSumatifs(cached.filter(s => s.classId === activeClassId));
      onShowNotification('Gagal menyinkronkan data sumatif dengan server. Menampilkan data cache lokal.', 'warning');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSumatif = async (sumatif: Sumatif) => {
    const isDemo = !apiService.isConfigured();
    let sumatifToSave = { ...sumatif };

    // Register TKA title if type is TKA
    if (sumatifToSave.type === 'tka' && sumatifToSave.title) {
      const savedList = localStorage.getItem(`tka_list_${activeClassId}`);
      let tkaList = ['TKA 1'];
      if (savedList) {
        try {
          const parsed = JSON.parse(savedList);
          if (Array.isArray(parsed) && parsed.length > 0) tkaList = parsed;
        } catch (e) {}
      }
      if (!tkaList.includes(sumatifToSave.title)) {
        const newList = [...tkaList, sumatifToSave.title];
        localStorage.setItem(`tka_list_${activeClassId}`, JSON.stringify(newList));
      }
    }

    // Generate id if empty and in demo
    if (isDemo && (!sumatifToSave.id || sumatifToSave.id === '')) {
      sumatifToSave.id = `sumatif-local-${Date.now()}`;
    }

    try {
      if (isDemo) {
        const allSumatifs = cacheService.get<Sumatif[]>('sumatifs') || [];
        const index = allSumatifs.findIndex(s => s.id === sumatifToSave.id);
        let updated;
        if (index !== -1) {
          updated = [...allSumatifs];
          updated[index] = sumatifToSave;
        } else {
          updated = [...allSumatifs, sumatifToSave];
        }
        cacheService.set('sumatifs', updated);
        setSumatifs(updated.filter(s => s.classId === activeClassId));
        onShowNotification('Sumatif berhasil disimpan di penyimpanan lokal (Demo)', 'success');
        setIsEditing(false);
      } else {
        const saved = await apiService.saveSumatif(sumatif);
        onShowNotification('Sumatif berhasil disimpan ke database', 'success');
        
        // Update local state immediately
        setSumatifs(prev => {
          const index = prev.findIndex(s => s.id === saved.id || (sumatif.id && s.id === sumatif.id));
          if (index !== -1) {
            const next = [...prev];
            next[index] = saved;
            return next;
          } else {
            return [...prev, saved];
          }
        });
        
        setIsEditing(false);
        fetchSumatifs();
      }
    } catch (error: any) {
      console.error("Error saving sumatif:", error);
      const errMsg = error?.message || error?.details || JSON.stringify(error);
      let friendlyMsg = `Gagal menyimpan ke database: ${errMsg}`;
      
      if (errMsg.includes('relation "sumatifs" does not exist') || errMsg.includes('42P01')) {
        friendlyMsg = 'Tabel "sumatifs" belum dibuat di database Supabase Anda. Hubungi Admin atau jalankan script "sumatif_feature.sql" lewat Supabase SQL Editor.';
      } else if (errMsg.includes('column') && errMsg.includes('does not exist')) {
        friendlyMsg = 'Kolom tabel tidak sesuai. Jalankan script "sql_fix_sumatif.sql" di SQL Editor Supabase Anda.';
      }

      // Safe fallback to local cache so user's work is NOT lost
      try {
        const localId = sumatif.id || `sumatif-local-${Date.now()}`;
        const fallbackSumatif = { ...sumatif, id: localId };
        const allSumatifs = cacheService.get<Sumatif[]>('sumatifs') || [];
        const index = allSumatifs.findIndex(s => s.id === localId);
        let updated;
        if (index !== -1) {
          updated = [...allSumatifs];
          updated[index] = fallbackSumatif;
        } else {
          updated = [...allSumatifs, fallbackSumatif];
        }
        cacheService.set('sumatifs', updated);
        setSumatifs(updated.filter(s => s.classId === activeClassId));
        
        onShowNotification(`${friendlyMsg}. (Data TELAH disimpan sementara di Penyimpanan Lokal agar tidak hilang)`, 'error');
        setIsEditing(false);
      } catch (cacheErr) {
        onShowNotification(friendlyMsg, 'error');
      }
    }
  };

  const handleDeleteSumatif = async (id: string) => {
    const isDemo = !apiService.isConfigured();
    setModal({
      isOpen: true,
      title: 'Hapus Sumatif',
      message: 'Apakah Anda yakin ingin menghapus sumatif ini?',
      type: 'confirm',
      onConfirm: async () => {
        setModal(prev => ({ ...prev, isOpen: false }));
        try {
          if (isDemo) {
            const allSumatifs = cacheService.get<Sumatif[]>('sumatifs') || [];
            const updated = allSumatifs.filter(s => s.id !== id);
            cacheService.set('sumatifs', updated);
            setSumatifs(updated.filter(s => s.classId === activeClassId));
            onShowNotification('Sumatif berhasil dihapus dari penyimpanan lokal', 'success');
          } else {
            await apiService.deleteSumatif(id);
            onShowNotification('Sumatif berhasil dihapus', 'success');
            fetchSumatifs();
          }
        } catch (error) {
          onShowNotification('Gagal menghapus sumatif', 'error');
        }
      }
    });
  };

  const handleToggleActive = async (sumatif: Sumatif) => {
    const isDemo = !apiService.isConfigured();
    const updatedSumatif = { ...sumatif, isActive: !sumatif.isActive };
    try {
      if (isDemo) {
        const allSumatifs = cacheService.get<Sumatif[]>('sumatifs') || [];
        const index = allSumatifs.findIndex(s => s.id === sumatif.id);
        if (index !== -1) {
          allSumatifs[index] = updatedSumatif;
          cacheService.set('sumatifs', allSumatifs);
          setSumatifs(allSumatifs.filter(s => s.classId === activeClassId));
        }
        onShowNotification(`Sumatif ${!sumatif.isActive ? 'diaktifkan' : 'dinonaktifkan'}`, 'success');
      } else {
        await apiService.saveSumatif(updatedSumatif);
        onShowNotification(`Sumatif ${!sumatif.isActive ? 'diaktifkan' : 'dinonaktifkan'}`, 'success');
        fetchSumatifs();
      }
    } catch (error) {
      onShowNotification('Gagal mengubah status sumatif', 'error');
    }
  };

  const handleToggleVisibility = async (sumatif: Sumatif) => {
    const isDemo = !apiService.isConfigured();
    const updatedSumatif = { ...sumatif, isVisible: !sumatif.isVisible };
    try {
      if (isDemo) {
        const allSumatifs = cacheService.get<Sumatif[]>('sumatifs') || [];
        const index = allSumatifs.findIndex(s => s.id === sumatif.id);
        if (index !== -1) {
          allSumatifs[index] = updatedSumatif;
          cacheService.set('sumatifs', allSumatifs);
          setSumatifs(allSumatifs.filter(s => s.classId === activeClassId));
        }
        onShowNotification(`Sumatif ${!sumatif.isVisible ? 'ditampilkan' : 'disembunyikan'} di portal siswa`, 'success');
      } else {
        await apiService.saveSumatif(updatedSumatif);
        onShowNotification(`Sumatif ${!sumatif.isVisible ? 'ditampilkan' : 'disembunyikan'} di portal siswa`, 'success');
        fetchSumatifs();
      }
    } catch (error) {
      onShowNotification('Gagal mengubah visibilitas sumatif', 'error');
    }
  };

  const handleViewResults = async (sumatif: Sumatif) => {
    setLoading(true);
    try {
      const data = await apiService.getSumatifResults(sumatif.id);
      setResults(data);
      setViewingResults(sumatif);
    } catch (error) {
      onShowNotification('Gagal mengambil hasil sumatif', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncToGrades = async (sumatif: Sumatif, results: SumatifResult[]) => {
    try {
      onShowNotification('Sedang menyinkronkan nilai...', 'warning');
      const isDemo = !apiService.isConfigured();
      
      let localGradesList: any[] = [];
      if (isDemo) {
        localGradesList = cacheService.get('grades') || [];
      }

      for (const result of results) {
        const student = students.find(s => s.id === result.studentId);
        if (!student) continue;

        let subjectGrades: any = { sum1: 0, sum2: 0, sum3: 0, sum4: 0, sas: 0 };
        
        if (isDemo) {
          const record = localGradesList.find((g: any) => String(g.studentId) === String(student.id));
          if (record && record.subjects[sumatif.subjectId]) {
            subjectGrades = record.subjects[sumatif.subjectId];
          }
        } else {
          const existingGrades = await apiService.getGradesForStudent(student.id);
          if (existingGrades && existingGrades.subjects[sumatif.subjectId]) {
            subjectGrades = existingGrades.subjects[sumatif.subjectId];
          }
        }

        const updatedGrades = { ...subjectGrades };
        if (sumatif.type === 'tka') {
          // Initialize tka_scores if it doesn't exist
          const currentTkaScores = { ...(subjectGrades.tka_scores || {}) };
          
          // Seed the first TKA score from legacy if empty
          const savedList = localStorage.getItem(`tka_list_${activeClassId}`);
          let tkaList = ['TKA 1'];
          if (savedList) {
            try {
              const parsed = JSON.parse(savedList);
              if (Array.isArray(parsed) && parsed.length > 0) tkaList = parsed;
            } catch (e) {}
          }
          if (Object.keys(currentTkaScores).length === 0 && subjectGrades.tka !== undefined) {
            currentTkaScores[tkaList[0]] = subjectGrades.tka;
          }

          currentTkaScores[sumatif.title] = result.score;
          updatedGrades.tka_scores = currentTkaScores;
          updatedGrades.tka = result.score;
        } else {
          updatedGrades[sumatif.type] = result.score;
        }

        if (isDemo) {
          // Update in localGradesList
          let record = localGradesList.find((g: any) => String(g.studentId) === String(student.id));
          if (!record) {
            record = { studentId: student.id, classId: activeClassId, subjects: {} };
            localGradesList.push(record);
          }
          record.subjects[sumatif.subjectId] = updatedGrades;
        } else {
          await apiService.saveGrade(student.id, sumatif.subjectId, updatedGrades, activeClassId);
        }
      }

      if (isDemo) {
        cacheService.set('grades', localGradesList);
      }

      onShowNotification('Nilai berhasil disinkronkan ke buku nilai', 'success');
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Sync failed:', error);
      onShowNotification('Gagal sinkronisasi nilai', 'error');
    }
  };

  const handleResetResult = async (studentId: string, sumatif: Sumatif) => {
    setModal({
      isOpen: true,
      title: 'Reset Hasil Ujian',
      message: 'Apakah Anda yakin ingin mereset hasil ujian siswa ini? Data pengerjaan akan dihapus secara permanen dan siswa dapat mengerjakan ulang.',
      type: 'confirm',
      confirmText: 'Reset Sekarang',
      cancelText: 'Batal',
      onCancel: () => setModal(prev => ({ ...prev, isOpen: false })),
      onConfirm: async () => {
        setModal(prev => ({ ...prev, isOpen: false }));
        try {
          await apiService.resetSumatifResult(sumatif.id, studentId);
          onShowNotification('Hasil ujian berhasil direset', 'success');
          
          // Refresh results immediately
          const updatedResults = await apiService.getSumatifResults(sumatif.id);
          setResults(updatedResults);
        } catch (error) {
          onShowNotification('Gagal mereset hasil ujian', 'error');
        }
      }
    });
  };

  const checkStudentAttempt = async (sumatif: Sumatif) => {
    if (!isStudent && !currentUser?.studentId) return true;
    
    const studentId = currentUser?.studentId;
    if (!studentId) return true;

    try {
      const allResults = await apiService.getSumatifResults(sumatif.id);
      const studentResult = allResults.find(r => r.studentId === studentId);
      
      if (studentResult && studentResult.status_tes === 'selesai') {
        setModal({
          isOpen: true,
          title: 'Akses Dibatasi',
          message: `Anda sudah pernah mengerjakan sumatif "${sumatif.title}". Silakan hubungi guru untuk mereset hasil pengerjaan Anda jika ingin mengerjakan ulang.`,
          type: 'alert',
          onConfirm: () => setModal(prev => ({ ...prev, isOpen: false }))
        });
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error checking attempt:", error);
      return true; // Proceed if check fails? Or block? Better proceed for now but normally block.
    }
  };

  if (loading && !isTaking && !isEditing) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5AB2FF]"></div>
      </div>
    );
  }

  if (isEditing && currentSumatif) {
    return (
      <SumatifEditor 
        sumatif={currentSumatif} 
        onSave={handleSaveSumatif} 
        onCancel={() => setIsEditing(false)} 
        activeClassId={activeClassId}
        onShowNotification={onShowNotification}
        canAccessTKA={canAccessTKA}
      />
    );
  }

  if (isEnteringToken && currentSumatif && isStudent) {
    const student = students[0]; // In student portal, students array has only the current student
    return (
      <SumatifTokenEntry 
        sumatif={currentSumatif}
        student={student}
        onConfirm={() => {
          setIsEnteringToken(false);
          setIsTaking(true);
        }}
        onCancel={() => setIsEnteringToken(false)}
      />
    );
  }

  if (isPembahasan && currentSumatif && isTeacher) {
    return (
      <SumatifPembahasan 
        sumatif={currentSumatif} 
        onClose={() => {
          setIsPembahasan(false);
          setCurrentSumatif(null);
        }}
      />
    );
  }

  if (isTaking && currentSumatif && (currentUser?.studentId || isStudent)) {
    const studentId = currentUser?.studentId || (isStudent ? students[0]?.id : '');
    return (
      <SumatifTaking 
        sumatif={currentSumatif} 
        studentId={studentId}
        studentName={currentUser?.fullName || students[0]?.name || ''}
        onComplete={() => {
          setIsTaking(false);
          setCurrentSumatif(null);
          fetchSumatifs();
        }}
        onCancel={() => {
          setIsTaking(false);
          setCurrentSumatif(null);
        }}
        onShowNotification={onShowNotification}
      />
    );
  }

  if (viewingResults && results) {
    return (
      <div className="space-y-6">
        <SumatifResultsView 
          sumatif={viewingResults}
          results={results}
          students={students}
          onBack={() => setViewingResults(null)}
          onSync={() => handleSyncToGrades(viewingResults, results)}
          onReset={(studentId) => handleResetResult(studentId, viewingResults)}
          onSaveGrading={async (resultId, manualScores, finalScore) => {
            try {
              await apiService.updateSumatifResultGrading(resultId, manualScores, finalScore);
              onShowNotification('Penilaian berhasil disimpan', 'success');
              handleViewResults(viewingResults!);
            } catch (error) {
              onShowNotification('Gagal menyimpan penilaian', 'error');
            }
          }}
        />
        <Modal 
          isOpen={modal.isOpen}
          title={modal.title}
          message={modal.message}
          type={modal.type}
          onConfirm={modal.onConfirm}
          onCancel={() => setModal(prev => ({ ...prev, isOpen: false }))}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-32 md:pb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">PENILAIAN SUMATIF</h2>
          <p className="text-slate-500 text-sm">Kelola dan kerjakan penilaian sumatif secara digital</p>
        </div>
        {isTeacher && (
          <button
            onClick={() => {
              setCurrentSumatif({
                id: '',
                classId: activeClassId,
                subjectId: MOCK_SUBJECTS[0].id,
                title: '',
                type: 'sum1',
                questions: [],
                duration: 60,
                isActive: false,
                isVisible: false
              });
              setIsEditing(true);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-[#5AB2FF] text-white rounded-xl hover:bg-[#4A9FE6] transition-all shadow-md"
          >
            <Plus size={20} />
            <span>Tambah Sumatif</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(() => {
          const filteredSumatifs = isTeacher 
            ? sumatifs 
            : sumatifs.filter(s => s.isVisible);

          if (filteredSumatifs.length === 0) {
            return (
              <div className="col-span-full bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-200">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen size={40} className="text-slate-300" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700">Belum ada Sumatif</h3>
                <p className="text-slate-500 max-w-xs mx-auto mt-2">
                  {isTeacher ? 'Mulai buat sumatif baru untuk kelas ini.' : 'Belum ada tugas sumatif yang tersedia.'}
                </p>
              </div>
            );
          }

          return filteredSumatifs.map((s) => {
            const decoration = SUBJECT_DECORATIONS[s.subjectId?.toLowerCase()] || SUBJECT_DECORATIONS['default'];
            const IconComponent = decoration.icon;
            
            return (
              <div 
                key={s.id} 
                className={`flex flex-col justify-between bg-gradient-to-br ${decoration.gradient} rounded-3xl border-2 ${decoration.borderColor} p-6 shadow-sm ${decoration.shadow} hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1.5 overflow-hidden group relative`}
              >
                {/* Ambient Large Floating Symbol in the Background */}
                <div className="absolute -right-6 -bottom-6 text-8xl opacity-[0.06] select-none pointer-events-none transform rotate-12 transition-transform duration-500 group-hover:scale-125 group-hover:rotate-45">
                  {decoration.emoji}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-4 relative z-10">
                    <div className="flex items-center space-x-1.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                        s.isActive ? 'bg-green-100/90 text-green-700 border border-green-200/50 backdrop-blur-sm' : 'bg-slate-100 text-slate-500 border border-slate-200/50 backdrop-blur-sm'
                      }`}>
                        {s.isActive ? '🔴 Aktif' : '⚪ Draft'}
                      </span>
                      {isTeacher && (
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                          s.isVisible ? 'bg-blue-100/90 text-blue-700 border border-blue-200/50' : 'bg-amber-100 text-amber-600 border border-amber-200'
                        }`}>
                          {s.isVisible ? '👁️ Terlihat' : '🔒 Sembunyi'}
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-black uppercase bg-white/75 px-2.5 py-1 rounded-full border border-gray-100 text-slate-500/80 shadow-sm backdrop-blur-sm">
                      {s.type.toUpperCase()}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mb-3 relative z-10">
                    <div className={`p-2.5 rounded-2xl ${decoration.accentColor} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                      <IconComponent size={24} className="stroke-[2.5]" />
                    </div>
                    <div>
                      <span className={`inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${decoration.badgeBg}`}>
                        <span>{decoration.emoji}</span>
                        <span>{MOCK_SUBJECTS.find(sub => sub.id === s.subjectId)?.name || s.subjectId}</span>
                      </span>
                    </div>
                  </div>

                  <h3 className={`text-lg font-black ${decoration.textColor} mb-4 leading-tight tracking-tight relative z-10 group-hover:text-blue-600 transition-colors line-clamp-2 min-h-[3.5rem]`}>
                    {s.title}
                  </h3>

                  <div className="space-y-2.5 bg-white/40 p-4 rounded-2xl border border-white/60 backdrop-blur-sm mb-6 relative z-10 shadow-inner">
                    <div className="flex items-center text-sm font-semibold text-slate-600">
                      <Clock size={16} className={`mr-2.5 ${decoration.textColor}`} />
                      <span>{s.duration} Menit</span>
                    </div>
                    <div className="flex items-center text-sm font-semibold text-slate-600">
                      <HelpCircle size={16} className={`mr-2.5 ${decoration.textColor}`} />
                      <span>{s.questions.length} Soal Ujian</span>
                    </div>
                    {s.token && isTeacher && (
                      <div className="flex items-center justify-between bg-white/95 p-3 rounded-xl border border-slate-150 mt-3 shadow-sm">
                        <div className="flex items-center space-x-2.5">
                          <span className="font-extrabold text-slate-500 uppercase tracking-widest text-xs">Token:</span>
                          <span className="font-mono font-black text-rose-600 text-sm md:text-base bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">{s.token}</span>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(s.token || '');
                            onShowNotification('Token berhasil disalin', 'success');
                          }}
                          className="p-1.5 md:p-2 bg-white text-blue-600 hover:text-blue-750 rounded-lg shadow-sm hover:bg-blue-50 border border-slate-100 transition-colors"
                          title="Salin Token"
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-slate-200/30 mt-auto relative z-10 w-full">
                  {isTeacher ? (
                    <>
                      <button
                        onClick={() => handleToggleVisibility(s)}
                        title={s.isVisible ? 'Sembunyikan dari Siswa' : 'Tampilkan ke Siswa'}
                        className={`p-2.5 rounded-xl transition-colors cursor-pointer border ${
                          s.isVisible 
                            ? 'bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-150' 
                            : 'bg-slate-50 text-slate-400 hover:bg-slate-100 border-slate-200'
                        }`}
                      >
                        {s.isVisible ? <Eye size={18} /> : <EyeOff size={18} className="opacity-50" />}
                      </button>
                      <button
                        onClick={() => handleToggleActive(s)}
                        title={s.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                        className={`p-2.5 rounded-xl transition-colors cursor-pointer border ${
                          s.isActive 
                            ? 'bg-amber-50 text-amber-600 hover:bg-amber-100 border-amber-150' 
                            : 'bg-green-50 text-green-600 hover:bg-green-100 border-green-150'
                        }`}
                      >
                        {s.isActive ? <Pause size={18} /> : <Play size={18} />}
                      </button>
                      <button
                        onClick={() => {
                          setCurrentSumatif(s);
                          setIsEditing(true);
                        }}
                        className="p-2.5 bg-blue-50 text-blue-600 border border-blue-150 rounded-xl hover:bg-blue-100 transition-colors cursor-pointer"
                        title="Edit"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleViewResults(s)}
                        className="p-2.5 bg-purple-50 text-purple-600 border border-purple-150 rounded-xl hover:bg-purple-100 transition-colors cursor-pointer"
                        title="Lihat Hasil & Analisis"
                      >
                        <BarChart2 size={18} />
                      </button>
                      <button
                        onClick={() => {
                          setCurrentSumatif(s);
                          setIsPembahasan(true);
                          window.dispatchEvent(new CustomEvent('closeSidebar'));
                          window.dispatchEvent(new CustomEvent('minimizeSidebar'));
                        }}
                        className="p-2.5 bg-orange-50 text-orange-600 border border-orange-150 rounded-xl hover:bg-orange-100 transition-colors cursor-pointer"
                        title="Pembahasan Soal"
                      >
                        <List size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteSumatif(s.id)}
                        className="p-2.5 bg-red-50 text-red-600 border border-red-150 rounded-xl hover:bg-red-100 transition-colors cursor-pointer ml-auto"
                        title="Hapus"
                      >
                        <Trash2 size={18} />
                      </button>
                    </>
                  ) : (
                    <button
                      disabled={!s.isActive}
                      type="button"
                      onClick={async () => {
                        const canProceed = await checkStudentAttempt(s);
                        if (!canProceed) return;
                        
                        setCurrentSumatif(s);
                        if (s.token) {
                          setIsEnteringToken(true);
                        } else {
                          setIsTaking(true);
                        }
                      }}
                      className={`w-full py-3 px-5 rounded-2xl font-extrabold transition-all flex items-center justify-center space-x-2 transform hover:scale-[1.02] active:scale-98 cursor-pointer shadow-md border-2 ${
                        s.isActive 
                          ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-700 shadow-blue-500/10 hover:shadow-blue-500/20' 
                          : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed shadow-none'
                      }`}
                    >
                      <Play size={18} className={s.isActive ? "fill-white text-white" : ""} />
                      <span>{s.isActive ? 'Mulai Kerjakan Sekarang' : 'Belum Aktif'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        })()}
      </div>

      <Modal 
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onConfirm={modal.onConfirm}
        onCancel={() => setModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

// --- EDITOR COMPONENT ---
const SumatifEditor: React.FC<{ 
  sumatif: Sumatif, 
  onSave: (s: Sumatif) => void, 
  onCancel: () => void,
  activeClassId: string,
  onShowNotification: (message: string, type: 'success' | 'error' | 'warning') => void,
  canAccessTKA?: boolean
}> = ({ sumatif, onSave, onCancel, activeClassId, onShowNotification, canAccessTKA = false }) => {
  const DRAFT_KEY = `sumatif_draft_${sumatif.id || 'new'}`;
  const editorRef = React.useRef<HTMLDivElement>(null);

  const isClass6 = React.useMemo(() => {
    const classStr = String(activeClassId || '').toUpperCase();
    return classStr.startsWith('6') || classStr.startsWith('VI');
  }, [activeClassId]);

  const scrollToTop = () => {
    if (editorRef.current) {
      editorRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const [formData, setFormData] = useState<Sumatif>(() => {
    // Check for draft first
    try {
      const savedDraft = localStorage.getItem(DRAFT_KEY);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        // Ensure it's for the same sumatif (if editing existing)
        if (!sumatif.id || parsed.id === sumatif.id) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Failed to load draft", e);
    }

    const normalizedQuestions = [...(sumatif.questions || [])].map((q: any) => {
      const rawOptions = Array.isArray(q.options) ? q.options : [];
      const rawImages = Array.isArray(q.optionImages) ? q.optionImages : [];
      
      const normalizedOptions = rawOptions.map((o: any, idx: number) => {
        if (typeof o === 'string' || !o.id) {
          const text = typeof o === 'string' ? o : o.text;
          return { 
            id: o.id || Math.random().toString(36).substr(2, 9), 
            text: text || '',
            imageUrl: rawImages[idx] || o.imageUrl || ''
          };
        }
        if (rawImages[idx]) {
          return { ...o, imageUrl: rawImages[idx] };
        }
        return o;
      });

      return {
        ...q,
        options: normalizedOptions
      };
    });
    
    return { ...sumatif, questions: normalizedQuestions };
  });

  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_KEY);
    if (savedDraft) {
      onShowNotification('Draf otomatis dipulihkan', 'success');
    }
  }, []); // Only on mount

  const [activeTab, setActiveTab] = useState<'info' | 'questions'>('info');
  const [defaultPoints, setDefaultPoints] = useState(1);
  const [tkaList, setTkaList] = useState<string[]>(() => {
    const savedList = localStorage.getItem(`tka_list_${activeClassId}`);
    if (savedList) {
      try {
        const parsed = JSON.parse(savedList);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return ['TKA 1'];
  });

  const [showAddTkaModal, setShowAddTkaModal] = useState(false);
  const [newTkaTitleInput, setNewTkaTitleInput] = useState('');

  const handleConfirmAddTka = () => {
    if (newTkaTitleInput && newTkaTitleInput.trim()) {
      const cleaned = newTkaTitleInput.trim();
      if (!tkaList.includes(cleaned)) {
        const newList = [...tkaList, cleaned];
        setTkaList(newList);
        localStorage.setItem(`tka_list_${activeClassId}`, JSON.stringify(newList));
      }
      setFormData(prev => ({ ...prev, title: cleaned }));
      setShowAddTkaModal(false);
      setNewTkaTitleInput('');
      onShowNotification('Tryout TKA baru berhasil ditambahkan!', 'success');
    } else {
      onShowNotification('Nama tryout tidak boleh kosong!', 'error');
    }
  };

  // Autosave to localStorage
  useEffect(() => {
    const timeout = setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
    }, 1000); // 1 second debounce
    return () => clearTimeout(timeout);
  }, [formData]);

  const clearDraft = () => localStorage.removeItem(DRAFT_KEY);

  const handleSave = () => {
    clearDraft();
    onSave(formData);
  };

  const handleCancel = () => {
    if (JSON.stringify(formData) !== JSON.stringify(sumatif)) {
      setModal({
        isOpen: true,
        title: 'Batalkan Perubahan',
        message: 'Ada perubahan yang belum disimpan. Apakah Anda yakin ingin membatalkannya? Data di draf akan dihapus.',
        type: 'confirm',
        onConfirm: () => {
          clearDraft();
          onCancel();
        }
      });
    } else {
      clearDraft();
      onCancel();
    }
  };

  const handleDownloadTemplate = () => {
    const template = [
      {
        No: 1,
        Pertanyaan: 'Contoh Pertanyaan Pilihan Ganda',
        Tipe: 'PG',
        Bobot: 1,
        Opsi_A: 'Pilihan A',
        Opsi_B: 'Pilihan B',
        Opsi_C: 'Pilihan C',
        Opsi_D: 'Pilihan D',
        Jawaban_Benar: 'A',
        Gambar_URL: '',
        Keterangan_Gambar: ''
      },
      {
        No: 2,
        Pertanyaan: 'Contoh Pertanyaan Pilihan Ganda Kompleks',
        Tipe: 'PGK',
        Bobot: 1,
        Opsi_A: 'Pilihan A',
        Opsi_B: 'Pilihan B',
        Opsi_C: 'Pilihan C',
        Opsi_D: 'Pilihan D',
        Jawaban_Benar: 'A, B',
        Gambar_URL: '',
        Keterangan_Gambar: ''
      },
      {
        No: 3,
        Pertanyaan: 'Contoh Pertanyaan Benar Salah',
        Tipe: 'BS',
        Bobot: 1,
        Pernyataan_1: 'Pernyataan 1',
        Pernyataan_2: 'Pernyataan 2',
        Pernyataan_3: 'Pernyataan 3',
        Jawaban_Benar: 'B, S, B',
        Gambar_URL: '',
        Keterangan_Gambar: ''
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Soal');
    XLSX.writeFile(wb, 'Template_Soal_Sumatif.xlsx');
  };

  const handleUploadExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const bstr = event.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        const newQuestions: Question[] = data.map((row) => {
            const rawType = String(row.Tipe || 'PG').trim().toUpperCase();
            const type = (rawType === 'PGK' ? 'pgk' : rawType === 'BS' ? 'bs' : 'pg') as QuestionType;
            const q: Question = {
              id: Math.random().toString(36).substr(2, 9),
              text: row.Pertanyaan || '',
              type,
              points: parseInt(row.Bobot) || 1,
              imageUrl: row.Gambar_URL || '',
              imageCaption: row.Keterangan_Gambar || '',
              correctAnswer: '',
              options: [],
              subQuestions: []
            };
  
            if (type === 'pg' || type === 'pgk') {
              const rawOptions = [row.Opsi_A, row.Opsi_B, row.Opsi_C, row.Opsi_D].map(o => String(o || '').trim());
              q.options = rawOptions.map(opt => {
                 const isUrl = opt.startsWith('http://') || opt.startsWith('https://') || opt.startsWith('data:image/');
                 return {
                   id: Math.random().toString(36).substr(2, 9),
                   text: isUrl ? '' : opt,
                   imageUrl: isUrl ? opt : ''
                 };
              });
            
            const mapAnsToId = (ans: any) => {
              if (!ans) return '';
              const a = String(ans).trim().toUpperCase();
              if (a === 'A') return q.options![0]?.id;
              if (a === 'B') return q.options![1]?.id;
              if (a === 'C') return q.options![2]?.id;
              if (a === 'D') return q.options![3]?.id;
              
              // Fallback to text match
              const found = q.options!.find(o => o.text && o.text.toUpperCase() === a);
              return found ? found.id : '';
            };

            if (type === 'pg') {
              q.correctAnswer = mapAnsToId(row.Jawaban_Benar) || "";
            } else {
              q.correctAnswer = String(row.Jawaban_Benar || '').split(',').map(s => mapAnsToId(s)).filter(id => id);
            }
          } else if (type === 'bs') {
            const bsAnswers = String(row.Jawaban_Benar || '').split(',').map(s => s.trim().toUpperCase());
            const getBsAns = (idx: number) => {
              const val = bsAnswers[idx];
              if (val === 'B') return 'Benar';
              if (val === 'S') return 'Salah';
              return 'Benar'; // Default
            };

            q.subQuestions = [
              { id: 'sq1', text: row.Pernyataan_1 || '', correctAnswer: getBsAns(0) as any },
              { id: 'sq2', text: row.Pernyataan_2 || '', correctAnswer: getBsAns(1) as any },
              { id: 'sq3', text: row.Pernyataan_3 || '', correctAnswer: getBsAns(2) as any }
            ].filter(sq => sq.text.trim() !== ''); // Hanya ambil pernyataan yang ada isinya
          }

          return q;
        });

        setFormData({ ...formData, questions: [...formData.questions, ...newQuestions] });
        onShowNotification(`${newQuestions.length} soal berhasil diimpor`, 'success');
      } catch (error) {
        onShowNotification('Gagal mengimpor file Excel. Pastikan format benar.', 'error');
      }
    };
    reader.readAsBinaryString(file);
  };

  const [modal, setModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'alert' | 'confirm';
    onConfirm: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'alert',
    onConfirm: () => {},
    onCancel: () => {},
    confirmText: 'OK',
    cancelText: 'Batal'
  });

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Math.random().toString(36).substr(2, 9),
      text: '',
      type: 'pg',
      options: [
        { id: Math.random().toString(36).substr(2, 9), text: '' },
        { id: Math.random().toString(36).substr(2, 9), text: '' },
        { id: Math.random().toString(36).substr(2, 9), text: '' },
        { id: Math.random().toString(36).substr(2, 9), text: '' }
      ],
      correctAnswer: '',
      points: defaultPoints,
      subQuestions: [
        { id: 'sq1', text: '', correctAnswer: 'Benar' },
        { id: 'sq2', text: '', correctAnswer: 'Benar' },
        { id: 'sq3', text: '', correctAnswer: 'Benar' }
      ]
    };
    setFormData({ ...formData, questions: [...formData.questions, newQuestion] });
  };

  const applyBulkPoints = () => {
    if (formData.questions.length === 0) return;
    
    setModal({
      isOpen: true,
      title: 'Terapkan Bobot Massal',
      message: `Apakah Anda yakin ingin mengatur bobot semua soal (${formData.questions.length}) menjadi ${defaultPoints}?`,
      type: 'confirm',
      onConfirm: () => {
        const newQuestions = formData.questions.map(q => ({ ...q, points: defaultPoints }));
        setFormData({ ...formData, questions: newQuestions });
        onShowNotification(`Berhasil menerapkan bobot ${defaultPoints} ke semua soal`, 'success');
        setModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const updateQuestion = (index: number, updates: Partial<Question>) => {
    const newQuestions = [...formData.questions];
    newQuestions[index] = { ...newQuestions[index], ...updates };
    setFormData({ ...formData, questions: newQuestions });
  };

  const removeQuestion = (index: number) => {
    const newQuestions = formData.questions.filter((_, i) => i !== index);
    setFormData({ ...formData, questions: newQuestions });
  };

  return (
    <div ref={editorRef} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden relative">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center space-x-4">
          <button onClick={handleCancel} className="p-2 hover:bg-white rounded-xl transition-colors text-slate-400">
            <ChevronLeft size={24} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-800">{sumatif.id ? 'Edit Sumatif' : 'Buat Sumatif Baru'}</h2>
            <p className="text-sm text-slate-500">Lengkapi detail dan butir soal</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center space-x-2 px-6 py-2.5 bg-[#5AB2FF] text-white rounded-xl hover:bg-[#4A9FE6] transition-all shadow-md font-bold"
        >
          <Save size={20} />
          <span>Simpan Sumatif</span>
        </button>
      </div>

      <div className="flex border-b border-slate-100">
        <button
          onClick={() => setActiveTab('info')}
          className={`px-8 py-4 text-sm font-bold transition-all border-b-2 ${
            activeTab === 'info' ? 'border-[#5AB2FF] text-[#5AB2FF]' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Informasi Umum
        </button>
        <button
          onClick={() => setActiveTab('questions')}
          className={`px-8 py-4 text-sm font-bold transition-all border-b-2 ${
            activeTab === 'questions' ? 'border-[#5AB2FF] text-[#5AB2FF]' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Butir Soal ({formData.questions.length})
        </button>
        {activeTab === 'questions' && (
          <div className="ml-auto flex items-center space-x-2 px-6">
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center space-x-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all text-sm font-bold"
            >
              <Download size={18} />
              <span className="hidden md:inline">Template Excel</span>
            </button>
            <label className="flex items-center space-x-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all text-sm font-bold cursor-pointer">
              <Upload size={18} />
              <span className="hidden md:inline">Upload Excel</span>
              <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleUploadExcel} />
            </label>

            <div className="flex items-center space-x-2 border-l border-slate-200 pl-4 ml-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden lg:inline">Bobot Massal:</span>
              <div className="flex items-center bg-blue-50 rounded-xl border border-blue-100 px-2 py-1">
                <input
                  type="number"
                  value={defaultPoints}
                  onChange={e => setDefaultPoints(parseInt(e.target.value) || 0)}
                  className="w-10 bg-transparent text-center font-black text-[#5AB2FF] outline-none text-sm"
                  min="0"
                />
                <button
                  onClick={applyBulkPoints}
                  className="p-1 text-[#5AB2FF] hover:bg-blue-100 rounded-lg transition-all ml-1"
                  title="Terapkan bobot ke semua soal aktif & baru"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-8">
        {activeTab === 'info' ? (
          <div className="max-w-2xl space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Judul Sumatif</label>
                {formData.type === 'tka' ? (
                  <select
                    value={formData.title}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === '__add_new__') {
                        setShowAddTkaModal(true);
                        e.target.value = formData.title;
                      } else {
                        setFormData({ ...formData, title: val });
                      }
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#5AB2FF] focus:border-transparent outline-none transition-all font-bold"
                  >
                    {tkaList.map(title => (
                      <option key={title} value={title}>{title}</option>
                    ))}
                    <option value="__add_new__">+ Tambah Tryout Baru...</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Contoh: Sumatif Akhir Bab 1"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#5AB2FF] focus:border-transparent outline-none transition-all"
                  />
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Mata Pelajaran</label>
                <select
                  value={formData.subjectId}
                  onChange={e => setFormData({ ...formData, subjectId: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#5AB2FF] focus:border-transparent outline-none transition-all"
                >
                  {MOCK_SUBJECTS.filter(s => formData.type !== 'tka' || s.id === 'mat' || s.id === 'indo').map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Jenis Sumatif</label>
                <select
                  value={formData.type}
                  onChange={e => {
                    const newType = e.target.value as any;
                    let newSubjectId = formData.subjectId;
                    let newTitle = formData.title;
                    if (newType === 'tka') {
                      if (newSubjectId !== 'mat' && newSubjectId !== 'indo') {
                        newSubjectId = 'mat';
                      }
                      // Find default TKA title if current title isn't a TKA title
                      if (!tkaList.includes(newTitle)) {
                        newTitle = tkaList[0] || 'TKA 1';
                      }
                    } else {
                      newTitle = "";
                    }
                    setFormData({ ...formData, type: newType, subjectId: newSubjectId, title: newTitle });
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#5AB2FF] focus:border-transparent outline-none transition-all"
                >
                  <option value="sum1">Sumatif 1</option>
                  <option value="sum2">Sumatif 2</option>
                  <option value="sum3">Sumatif 3</option>
                  <option value="sum4">Sumatif 4</option>
                  <option value="sas">SAS (Sumatif Akhir Semester)</option>
                  {canAccessTKA && isClass6 && <option value="tka">TKA (Tes Kemampuan Akademik)</option>}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Durasi (Menit)</label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={e => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#5AB2FF] focus:border-transparent outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Token Ujian</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={formData.token || ''}
                    onChange={e => setFormData({ ...formData, token: e.target.value.toUpperCase() })}
                    placeholder="Contoh: ABCDEF"
                    className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#5AB2FF] focus:border-transparent outline-none transition-all"
                  />
                  {formData.token && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(formData.token || '');
                        setModal({
                          isOpen: true,
                          title: 'Berhasil',
                          message: 'Token berhasil disalin ke clipboard!',
                          type: 'alert',
                          onConfirm: () => setModal(prev => ({ ...prev, isOpen: false }))
                        });
                      }}
                      type="button"
                      className="px-4 py-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all"
                      title="Copy Token"
                    >
                      <Copy size={20} />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                      let result = '';
                      for (let i = 0; i < 6; i++) {
                        result += chars.charAt(Math.floor(Math.random() * chars.length));
                      }
                      setFormData({ ...formData, token: result });
                    }}
                    type="button"
                    className="px-4 py-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all"
                    title="Generate Token"
                  >
                    <RefreshCw size={20} />
                  </button>
                </div>
              </div>
              <div className="space-y-4 pt-4 col-span-full border-t border-slate-50">
                <div 
                  onClick={() => setFormData({ ...formData, isVisible: !formData.isVisible })}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer hover:bg-slate-100 transition-all group"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-xl ${formData.isVisible ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                      {formData.isVisible ? <Eye size={24} /> : <EyeOff size={24} />}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">Tampilkan di Portal Siswa</h4>
                      <p className="text-sm text-slate-500">Jika aktif, kartu ujian ini akan terlihat oleh siswa di kelas mereka.</p>
                    </div>
                  </div>
                  <div className={`w-14 h-8 rounded-full relative transition-all ${formData.isVisible ? 'bg-[#5AB2FF]' : 'bg-slate-300'}`}>
                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all ${formData.isVisible ? 'left-7' : 'left-1'}`}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {formData.questions.map((q, idx) => (
              <div key={q.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 relative group">
                <button
                  onClick={() => removeQuestion(idx)}
                  className="absolute top-4 right-4 p-2 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={18} />
                </button>

                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-[#5AB2FF] text-white rounded-full flex items-center justify-center font-bold text-sm">
                    {idx + 1}
                  </div>
                  <select
                    value={q.type}
                    onChange={e => updateQuestion(idx, { 
                      type: e.target.value as QuestionType,
                      correctAnswer: e.target.value === 'pgk' ? [] : '',
                      options: e.target.value === 'bs' 
                        ? [{ id: 'o1', text: 'Benar' }, { id: 'o2', text: 'Salah' }]
                        : [{ id: 'o1', text: '' }, { id: 'o2', text: '' }, { id: 'o3', text: '' }, { id: 'o4', text: '' }]
                    })}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-bold text-slate-600 outline-none"
                  >
                    <option value="pg">Pilihan Ganda</option>
                    <option value="pgk">Pilihan Ganda Kompleks</option>
                    <option value="bs">Benar / Salah</option>
                    <option value="uraian">Uraian</option>
                  </select>
                  <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                    <span className="text-xs font-bold text-slate-400 uppercase">Bobot:</span>
                    <input
                      type="number"
                      value={q.points}
                      onChange={e => updateQuestion(idx, { points: parseInt(e.target.value) || 0 })}
                      className="w-12 text-sm font-bold text-[#5AB2FF] outline-none"
                      min="0"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    {!q.imageUrl ? (
                      <div className="flex items-center space-x-2">
                        <div className="bg-white p-2 rounded-lg border border-slate-200">
                          <ImageIcon size={18} className="text-slate-400" />
                        </div>
                        <textarea
                          value={q.imageUrl || ''}
                          onChange={e => updateQuestion(idx, { imageUrl: e.target.value })}
                          placeholder="Link Gambar Soal (Opsional)"
                          className="flex-1 px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#5AB2FF] outline-none transition-all text-sm min-h-[40px] resize-y"
                        />
                        <label className="p-2 cursor-pointer bg-slate-100 rounded-lg hover:bg-slate-200">
                          <Upload size={18} className="text-slate-600" />
                          <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if(file) {
                                  const base64 = await compressImage(file, 1024, 0.85);
                                  updateQuestion(idx, { imageUrl: base64 });
                              }
                          }}/>
                        </label>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="w-full max-h-[220px] rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex flex-col items-center justify-center p-4 relative group">
                          <img 
                            src={q.imageUrl} 
                            alt="Question Preview" 
                            className="max-h-[140px] object-contain rounded-lg border border-slate-200 shadow-sm bg-white"
                            referrerPolicy="no-referrer"
                          />
                          <div className="mt-3 flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => updateQuestion(idx, { imageUrl: '', imageCaption: '' })}
                              className="flex items-center space-x-1.5 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
                            >
                              <Trash2 size={14} />
                              <span>Ganti / Hapus Gambar</span>
                            </button>
                          </div>
                        </div>
                        <textarea
                          value={q.imageCaption || ''}
                          onChange={e => updateQuestion(idx, { imageCaption: e.target.value })}
                          placeholder="Keterangan Gambar (Opsional)"
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#5AB2FF] outline-none transition-all text-xs min-h-[50px] resize-y"
                        />
                      </div>
                    )}
                  </div>
                    
                    <textarea
                      value={q.text}
                      onChange={e => updateQuestion(idx, { text: e.target.value })}
                      placeholder="Tuliskan pertanyaan di sini..."
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#5AB2FF] focus:border-transparent outline-none transition-all min-h-[120px] text-sm resize-y"
                    />

                  {(q.type === 'pg' || q.type === 'pgk') && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {(q.options || []).map((opt, optIdx) => {
                        const isCorrect = q.type === 'pg' 
                          ? q.correctAnswer === opt.id 
                          : (Array.isArray(q.correctAnswer) && q.correctAnswer.includes(opt.id));
                        
                        return (
                          <div key={optIdx} className={`space-y-3 p-4 rounded-2xl border transition-all ${
                            isCorrect ? 'bg-green-50 border-green-200 shadow-sm' : 'bg-white border-slate-100'
                          }`}>
                            <div className="flex flex-col space-y-2">
                              <div className="flex items-center space-x-2">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold border ${
                                  isCorrect ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-slate-200 text-slate-400'
                                }`}>
                                  {String.fromCharCode(65 + optIdx)}
                                </div>
                                
                                {opt.imageUrl ? (
                                  <div className="flex-1 flex items-center justify-between border border-dashed border-[#5AB2FF] bg-blue-50/50 px-3 py-1.5 rounded-xl">
                                    <div className="flex items-center space-x-2 shrink-0">
                                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-white border border-slate-200 flex items-center justify-center">
                                        <img 
                                          src={opt.imageUrl} 
                                          alt={`Option ${String.fromCharCode(65 + optIdx)}`} 
                                          className="w-full h-full object-contain"
                                          referrerPolicy="no-referrer"
                                        />
                                      </div>
                                      <span className="text-xs text-slate-500 italic font-medium">Gambar Opsi {String.fromCharCode(65 + optIdx)}</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newOpts = [...(q.options || [])];
                                        newOpts[optIdx] = { ...newOpts[optIdx], imageUrl: '', text: '' };
                                        updateQuestion(idx, { options: newOpts });
                                      }}
                                      className="px-2.5 py-1.5 text-xs font-bold bg-red-50 hover:bg-red-100 text-red-600 rounded-lg border border-red-200 transition-colors flex items-center gap-1 cursor-pointer"
                                    >
                                      <Trash2 size={12} />
                                      <span>Ganti</span>
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <input
                                      type="text"
                                      value={opt.text || ''}
                                      onChange={e => {
                                        const val = e.target.value;
                                        const isUrl = val.startsWith('http://') || val.startsWith('https://') || val.startsWith('data:image/');
                                        const newOpts = [...(q.options || [])];
                                        newOpts[optIdx] = { 
                                          ...newOpts[optIdx], 
                                          text: isUrl ? '' : val,
                                          imageUrl: isUrl ? val : ''
                                        };
                                        updateQuestion(idx, { options: newOpts });
                                      }}
                                      placeholder={`Teks Opsi atau Link Gambar URL opsi ${String.fromCharCode(65 + optIdx)}`}
                                      className="flex-1 px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#5AB2FF] outline-none transition-all text-sm"
                                    />
                                    <label className="p-2 cursor-pointer bg-slate-100 rounded-lg hover:bg-slate-200 shrink-0">
                                      <Upload size={18} className="text-slate-600" />
                                      <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                                          const file = e.target.files?.[0];
                                          if(file) {
                                              const base64 = await compressImage(file, 600, 0.8);
                                              const newOpts = [...(q.options || [])];
                                              newOpts[optIdx] = { ...newOpts[optIdx], text: '', imageUrl: base64 };
                                              updateQuestion(idx, { options: newOpts });
                                          }
                                      }}/>
                                    </label>
                                  </>
                                )}

                                <button
                                  type="button"
                                  onClick={() => {
                                    if (q.type === 'pg') {
                                      updateQuestion(idx, { correctAnswer: opt.id });
                                    } else {
                                      const current = Array.isArray(q.correctAnswer) ? q.correctAnswer : [];
                                      const next = current.includes(opt.id) 
                                        ? current.filter(c => c !== opt.id)
                                        : [...current, opt.id];
                                      updateQuestion(idx, { correctAnswer: next });
                                    }
                                  }}
                                  className={`p-2 shrink-0 rounded-lg transition-colors ${
                                    isCorrect ? 'text-green-600 bg-green-100' : 'text-slate-300 hover:text-green-500'
                                  }`}
                                  title="Set sebagai Jawaban Benar"
                                >
                                  <CheckCircle size={20} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {q.type === 'bs' && (
                    <div className="space-y-4">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">3 Pernyataan Benar/Salah</p>
                      {(q.subQuestions || []).map((sq, sqIdx) => (
                        <div key={sq.id} className="p-4 bg-white rounded-2xl border border-slate-100 space-y-3">
                          <div className="flex items-center space-x-3">
                            <span className="text-xs font-bold text-slate-400">{sqIdx + 1}.</span>
                            <input
                              type="text"
                              value={sq.text}
                              onChange={e => {
                                const newSQs = [...(q.subQuestions || [])];
                                newSQs[sqIdx] = { ...newSQs[sqIdx], text: e.target.value };
                                updateQuestion(idx, { subQuestions: newSQs });
                              }}
                              placeholder={`Pernyataan ${sqIdx + 1}`}
                              className="flex-1 px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#5AB2FF] outline-none transition-all text-sm"
                            />
                            <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-100">
                              {['Benar', 'Salah'].map(ans => (
                                <button
                                  key={ans}
                                  onClick={() => {
                                    const newSQs = [...(q.subQuestions || [])];
                                    newSQs[sqIdx] = { ...newSQs[sqIdx], correctAnswer: ans as any };
                                    updateQuestion(idx, { subQuestions: newSQs });
                                  }}
                                  className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
                                    sq.correctAnswer === ans 
                                      ? 'bg-white text-[#5AB2FF] shadow-sm' 
                                      : 'text-slate-400 hover:text-slate-600'
                                  }`}
                                >
                                  {ans}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 pl-6">
                            <ImageIcon size={14} className="text-slate-300" />
                            <div className="flex-1 space-y-2">
                              {!sq.imageUrl ? (
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="text"
                                    value={sq.imageUrl || ''}
                                    onChange={e => {
                                      const newSQs = [...(q.subQuestions || [])];
                                      newSQs[sqIdx] = { ...newSQs[sqIdx], imageUrl: e.target.value };
                                      updateQuestion(idx, { subQuestions: newSQs });
                                    }}
                                    placeholder="Link Gambar Pernyataan"
                                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-100 focus:ring-2 focus:ring-[#5AB2FF] outline-none transition-all text-[10px]"
                                  />
                                  <label className="p-1.5 cursor-pointer bg-slate-50 rounded-lg hover:bg-slate-100 shrink-0">
                                    <Upload size={14} className="text-slate-600" />
                                    <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if(file) {
                                            const base64 = await compressImage(file, 800, 0.8);
                                            const newSQs = [...(q.subQuestions || [])];
                                            newSQs[sqIdx] = { ...newSQs[sqIdx], imageUrl: base64 };
                                            updateQuestion(idx, { subQuestions: newSQs });
                                        }
                                    }}/>
                                  </label>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <div className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 flex flex-col items-center justify-center relative">
                                    <img 
                                      src={sq.imageUrl} 
                                      alt={`Preview SQ ${sqIdx}`} 
                                      className="max-h-[80px] object-contain rounded-md border border-slate-100 bg-white"
                                      referrerPolicy="no-referrer"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newSQs = [...(q.subQuestions || [])];
                                        newSQs[sqIdx] = { ...newSQs[sqIdx], imageUrl: '', imageCaption: '' };
                                        updateQuestion(idx, { subQuestions: newSQs });
                                      }}
                                      className="mt-2 flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded text-[9px] font-bold transition-all cursor-pointer"
                                    >
                                      <Trash2 size={10} />
                                      <span>Ganti / Hapus Gambar</span>
                                    </button>
                                  </div>
                                  <input
                                    type="text"
                                    value={sq.imageCaption || ''}
                                    onChange={e => {
                                      const newSQs = [...(q.subQuestions || [])];
                                      newSQs[sqIdx] = { ...newSQs[sqIdx], imageCaption: e.target.value };
                                      updateQuestion(idx, { subQuestions: newSQs });
                                    }}
                                    placeholder="Keterangan Gambar Pernyataan"
                                    className="w-full px-3 py-1.5 rounded-lg border border-slate-100 focus:ring-2 focus:ring-[#5AB2FF] outline-none transition-all text-[10px]"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {q.type === 'uraian' && (
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Kunci Jawaban / Kata Kunci (Untuk Referensi Guru)</p>
                      <textarea
                        value={q.correctAnswer || ''}
                        onChange={e => updateQuestion(idx, { correctAnswer: e.target.value })}
                        placeholder="Masukkan kunci jawaban atau kata kunci penilaian..."
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#5AB2FF] outline-none transition-all min-h-[80px] text-sm"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={addQuestion}
                className="flex-1 py-4 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 hover:text-[#5AB2FF] hover:border-[#5AB2FF] hover:bg-blue-50/30 transition-all flex items-center justify-center space-x-2 font-bold"
              >
                <Plus size={20} />
                <span>Tambah Butir Soal</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {activeTab === 'questions' && (
        <button
          type="button"
          onClick={scrollToTop}
          className="fixed bottom-[96px] md:bottom-[40px] right-6 z-[200] p-4 bg-[#5AB2FF] hover:bg-[#4A9FE6] text-white rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95 border border-white/20 flex items-center justify-center cursor-pointer group"
          title="Scroll ke Bagian Atas Lembar Soal"
        >
          <ArrowUp size={24} className="transition-transform group-hover:-translate-y-1" />
        </button>
      )}

      <Modal 
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onConfirm={modal.onConfirm}
        onCancel={() => setModal(prev => ({ ...prev, isOpen: false }))}
      />

      {showAddTkaModal && (
        <div className="fixed inset-0 z-[12000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in no-print">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden transform transition-all scale-100 border border-[#CAF4FF]">
            <div className="p-6 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-[#CAF4FF] text-[#5AB2FF] shadow-sm">
                <Plus size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Tambah Tryout TKA Baru</h3>
              <p className="text-gray-500 mb-4 text-center text-xs leading-relaxed">
                Masukkan nama atau judul untuk tryout TKA yang baru.
              </p>
              <input
                type="text"
                value={newTkaTitleInput}
                onChange={(e) => setNewTkaTitleInput(e.target.value)}
                placeholder="Contoh: Tryout TKA 4"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#5AB2FF] focus:border-transparent outline-none mb-6 font-semibold text-center text-sm text-gray-800"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleConfirmAddTka();
                  }
                }}
              />
              <div className="flex gap-3 w-full">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddTkaModal(false);
                    setNewTkaTitleInput('');
                  }}
                  className="flex-1 py-2.5 px-4 bg-[#FFF9D0] text-gray-700 font-bold rounded-xl hover:bg-yellow-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAddTka}
                  className="flex-1 py-2.5 px-4 bg-[#5AB2FF] hover:bg-[#A0DEFF] text-white font-bold rounded-xl shadow-md transition-all transform active:scale-95"
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- TOKEN ENTRY COMPONENT ---
const SumatifTokenEntry: React.FC<{
  sumatif: Sumatif,
  student: Student,
  onConfirm: () => void,
  onCancel: () => void
}> = ({ sumatif, student, onConfirm, onCancel }) => {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (token.toUpperCase() === sumatif.token?.toUpperCase()) {
      onConfirm();
    } else {
      setError('Token yang Anda masukkan salah.');
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-slate-100/90 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl flex flex-col md:flex-row my-auto max-h-[90vh] overflow-y-auto">
        {/* Left Side: Info */}
        <div className="bg-[#5AB2FF] p-8 md:w-1/3 text-white flex flex-col justify-between">
          <div>
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
              <Monitor size={32} />
            </div>
            <h2 className="text-2xl font-bold mb-2">Konfirmasi Data Peserta</h2>
            <p className="text-blue-50 text-sm">Silakan periksa data Anda sebelum memulai ujian.</p>
          </div>
          <div className="mt-8 space-y-4">
            <div className="flex items-center space-x-3">
              <UserIcon size={20} className="text-blue-200" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-blue-200 font-bold">Nama Peserta</p>
                <p className="font-bold uppercase">{student.name.toUpperCase()}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <LogIn size={20} className="text-blue-200" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-blue-200 font-bold">NIS / Username</p>
                <p className="font-bold">{student.nis}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Token Input */}
        <div className="p-8 md:w-2/3 bg-white">
          <div className="mb-8">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Detail Ujian</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Mata Pelajaran</p>
                <p className="font-bold text-slate-700">{MOCK_SUBJECTS.find(s => s.id === sumatif.subjectId)?.name}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Waktu</p>
                <p className="font-bold text-slate-700">{sumatif.duration} Menit</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Masukkan Token</label>
              <input
                type="text"
                value={token}
                onChange={e => {
                  setToken(e.target.value.toUpperCase());
                  setError('');
                }}
                placeholder="TOKEN"
                className={`w-full px-6 py-4 text-2xl font-mono font-bold tracking-[0.5em] text-center rounded-2xl border-2 transition-all outline-none ${
                  error ? 'border-red-200 bg-red-50 text-red-600' : 'border-slate-100 bg-slate-50 focus:border-[#5AB2FF] focus:bg-white'
                }`}
              />
              {error && <p className="text-red-500 text-xs mt-2 font-bold flex items-center"><AlertCircle size={14} className="mr-1" /> {error}</p>}
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={onCancel}
                className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
              >
                Batal
              </button>
              <button
                onClick={handleConfirm}
                className="flex-[2] py-4 bg-[#5AB2FF] text-white rounded-2xl font-bold hover:bg-[#4A9FE6] shadow-lg shadow-blue-200 transition-all flex items-center justify-center space-x-2"
              >
                <Play size={20} />
                <span>Mulai Ujian</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- TAKING COMPONENT ---
const SumatifTaking: React.FC<{
  sumatif: Sumatif,
  studentId: string,
  studentName: string,
  onComplete: () => void,
  onCancel: () => void,
  onShowNotification: (message: string, type: 'success' | 'error' | 'warning') => void
}> = ({ sumatif, studentId, studentName, onComplete, onCancel, onShowNotification }) => {
  const ATTEMPT_KEY = `sumatif_attempt_${sumatif.id}_${studentId}`;
  const [violations, setViolations] = useState(0);

  const [shuffledQuestions] = useState<Question[]>(() => {
    try {
      const saved = localStorage.getItem(`${ATTEMPT_KEY}_questions`);
      if (saved) return JSON.parse(saved);
    } catch (e) {}

    const questions = [...sumatif.questions].sort(() => Math.random() - 0.5).map(q => {
      const rawOptions = Array.isArray(q.options) ? q.options : [];
      const rawImages = Array.isArray((q as any).optionImages) ? (q as any).optionImages : [];

      const normalizedOptions = rawOptions.map((o: any, idx: number) => {
        if (typeof o === 'string' || !o.id) {
          const text = typeof o === 'string' ? o : o.text;
          return { 
            id: o.id || Math.random().toString(), 
            text: text,
            imageUrl: rawImages[idx] || o.imageUrl
          };
        }
        if (rawImages[idx]) {
          return { ...o, imageUrl: rawImages[idx] };
        }
        return o;
      });

      return {
        ...q,
        options: [...normalizedOptions].sort(() => Math.random() - 0.5)
      };
    });

    localStorage.setItem(`${ATTEMPT_KEY}_questions`, JSON.stringify(questions));
    return questions;
  });
  
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(() => {
    return Number(localStorage.getItem(`${ATTEMPT_KEY}_idx`) || 0);
  });
  
  const [answers, setAnswers] = useState<Record<string, any>>(() => {
    try {
      const saved = localStorage.getItem(`${ATTEMPT_KEY}_answers`);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const [timeLeft, setTimeLeft] = useState(() => {
    const saved = localStorage.getItem(`${ATTEMPT_KEY}_time`);
    return saved ? Number(saved) : (sumatif.duration || 0) * 60;
  });

  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(`${ATTEMPT_KEY}_flags`);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch (e) {
      return new Set();
    }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [zoomScale, setZoomScale] = useState(1);
  const [showNavigation, setShowNavigation] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 768);
  const [isFullscreen, setIsFullscreen] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
  const [headerMinimized, setHeaderMinimized] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
  const [scaleMode, setScaleMode] = useState<'kecil' | 'normal' | 'besar'>(() => {
    try {
      const saved = localStorage.getItem('sumatif_scale_mode');
      return (saved as 'kecil' | 'normal' | 'besar') || 'normal';
    } catch (e) {
      return 'normal';
    }
  });

  const handleSetScaleMode = (mode: 'kecil' | 'normal' | 'besar') => {
    setScaleMode(mode);
    try {
      localStorage.setItem('sumatif_scale_mode', mode);
    } catch (e) {}
  };

  useEffect(() => {
    localStorage.setItem(`${ATTEMPT_KEY}_idx`, currentQuestionIdx.toString());
  }, [currentQuestionIdx]);

  useEffect(() => {
    localStorage.setItem(`${ATTEMPT_KEY}_answers`, JSON.stringify(answers));
  }, [answers]);

  useEffect(() => {
    localStorage.setItem(`${ATTEMPT_KEY}_time`, timeLeft.toString());
  }, [timeLeft]);

  useEffect(() => {
    localStorage.setItem(`${ATTEMPT_KEY}_flags`, JSON.stringify(Array.from(flaggedQuestions)));
  }, [flaggedQuestions]);

  const clearAttempt = () => {
    localStorage.removeItem(`${ATTEMPT_KEY}_questions`);
    localStorage.removeItem(`${ATTEMPT_KEY}_answers`);
    localStorage.removeItem(`${ATTEMPT_KEY}_time`);
    localStorage.removeItem(`${ATTEMPT_KEY}_idx`);
    localStorage.removeItem(`${ATTEMPT_KEY}_flags`);
  };

  const [modal, setModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'alert' | 'confirm';
    onConfirm: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'alert',
    onConfirm: () => {},
    onCancel: () => {},
    confirmText: 'OK',
    cancelText: 'Batal'
  });

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    let totalPoints = 0;
    let earnedPoints = 0;
    let hasEssay = false;

    shuffledQuestions.forEach((q: Question) => {
      const qPoints = Number(q.points) || 0;
      totalPoints += qPoints;
      const studentAnswer = answers[q.id];
      
      if (q.type === 'pg' || q.type === 'pgk' || q.type === 'bs') {
        if (checkCorrect(q, studentAnswer)) {
          earnedPoints += qPoints;
        }
      } else if (q.type === 'uraian') {
        hasEssay = true;
      }
    });

    const finalScore = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

    try {
      const finalStudentId = studentId || `GUEST-${Date.now()}`;
      
      await apiService.submitSumatifResult({
        sumatifId: sumatif.id,
        studentId: finalStudentId,
        score: finalScore,
        answers,
        needsGrading: hasEssay,
        submittedAt: new Date().toISOString(),
        status_tes: 'selesai'
      });
      
      const successMessage = hasEssay 
        ? 'Jawaban Anda telah berhasil dikirim. Nilai pengerjaan soal uraian akan muncul setelah dikoreksi oleh guru.' 
        : `Jawaban Anda telah berhasil dikirim. Skor Anda: ${finalScore}`;

      setModal({
        isOpen: true,
        title: 'Ujian Selesai!',
        message: successMessage,
        type: 'alert',
        onConfirm: () => {
          setModal(prev => ({ ...prev, isOpen: false }));
          clearAttempt();
          onComplete(); 
        }
      });
    } catch (error: any) {
      console.error("Submission error details:", error);
      
      let customErrorMsg = 'Terjadi kesalahan saat mengirim jawaban. Silakan pastikan koneksi internet Anda stabil dan coba lagi.';
      
      if (error && error.message) {
        if (error.message.includes('column') || error.message.includes('relation')) {
          customErrorMsg = 'Kesalahan sistem (Database). Mohon hubungi admin untuk menjalankan script update database (sql_fix_sumatif.sql).';
        } else if (error.message.includes('unique constraint') || error.message.includes('already exists')) {
          customErrorMsg = 'Anda sudah mengirim jawaban untuk ujian ini sebelumnya.';
        }
      }

      setModal({
        isOpen: true,
        title: 'Gagal Mengirim',
        message: customErrorMsg,
        type: 'alert',
        onConfirm: () => {
          setModal(prev => ({ ...prev, isOpen: false }));
          setIsSubmitting(false);
        }
      });
    }
  }, [isSubmitting, setIsSubmitting, shuffledQuestions, answers, sumatif.id, studentId, onComplete, setModal, clearAttempt]);

    // Handle auto-submit when violations reach limit
    useEffect(() => {
      if (violations >= 3) {
        onShowNotification('Anda telah melakukan 3 pelanggaran. Ujian otomatis dikirim.', 'error');
        handleSubmit();
      }
    }, [violations, handleSubmit]);
    
    // Handle Fullscreen Violation
    useEffect(() => {
      const handleFullscreenChange = () => {
        if (!document.fullscreenElement) {
          setViolations(prev => {
            const next = prev + 1;
            if (next < 3) {
              setModal({
                isOpen: true,
                title: 'PERINGATAN!',
                message: `Anda telah keluar dari mode fullscreen. Pelanggaran ke-${next}. Jika mencapai 3x, ujian akan otomatis dikirim.`,
                type: 'alert',
                confirmText: 'Kembali ke Fullscreen',
                onConfirm: () => {
                  setModal(prev => ({ ...prev, isOpen: false }));
                  if (document.documentElement.requestFullscreen) {
                    document.documentElement.requestFullscreen().catch(() => {});
                  }
                }
              });
            } else {
              onShowNotification('Anda telah melakukan 3 pelanggaran. Ujian otomatis dikirim.', 'error');
            }
            return next;
          });
        }
      };
      document.addEventListener('fullscreenchange', handleFullscreenChange);
      return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, [onShowNotification]);

    useEffect(() => {
      apiService.startSumatifResult(sumatif.id, studentId);
      try {
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().then(() => {
            if (screen.orientation && (screen.orientation as any).lock) {
              (screen.orientation as any).lock('portrait').catch(() => {});
            }
          }).catch(() => {});
        }
      } catch (e) {}
      return () => {
        if (screen.orientation && (screen.orientation as any).unlock) {
          try { (screen.orientation as any).unlock(); } catch (e) {}
        }
      };
    }, [sumatif.id, studentId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Handle auto-submit when time is up
  useEffect(() => {
    if (timeLeft === 0 && !isSubmitting) {
      handleSubmit();
    }
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleAnswer = (questionId: string, answer: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const toggleFlag = (questionId: string) => {
    setFlaggedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  };

  const currentQuestion = shuffledQuestions[currentQuestionIdx];
  const isLastQuestion = currentQuestionIdx === shuffledQuestions.length - 1;

  // Adaptive Font Size Calculation
  const adaptiveFontSize = useMemo(() => {
    const textLen = currentQuestion.text.length;

    if (scaleMode === 'kecil') {
      if (textLen > 600) return 'text-[10px] md:text-xs';
      if (textLen > 300) return 'text-xs md:text-sm';
      if (textLen > 100) return 'text-xs md:text-sm';
      return 'text-sm md:text-base';
    } else if (scaleMode === 'besar') {
      if (textLen > 600) return 'text-base md:text-lg';
      if (textLen > 300) return 'text-lg md:text-xl';
      if (textLen > 100) return 'text-xl md:text-2xl';
      return 'text-2xl md:text-3xl';
    }
    
    // Normal scaleMode: now matches what was previously 'kecil' scale mode
    if (textLen > 600) return 'text-xs md:text-sm';
    if (textLen > 300) return 'text-sm md:text-base';
    if (textLen > 100) return 'text-sm md:text-base';
    return 'text-base md:text-lg';
  }, [currentQuestion.text, scaleMode]);

  // Reset zoom scale when question changes
  useEffect(() => {
    setZoomScale(1);
  }, [currentQuestionIdx]);

  return (
    <>
      <div className="fixed inset-0 z-[9999] bg-[#F0F4F8] flex flex-col font-sans h-[100dvh] w-screen overflow-hidden">
        {headerMinimized && (
          <button
            onClick={() => setHeaderMinimized(false)}
            className="absolute top-3 md:top-1 right-4 z-20 bg-[#5AB2FF] text-white px-3 py-1 rounded-b-xl shadow-md text-[10px] font-black uppercase tracking-wider md:hidden hover:bg-[#4A9FE6] transition-all"
          >
            ▼ Tampilkan Header
          </button>
        )}
        {/* CBT Header with slide-up capability */}
        <div className={`bg-[#5AB2FF] text-white px-2 md:px-6 py-1.5 md:py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-lg z-10 shrink-0 transition-transform duration-300 ${headerMinimized ? '-translate-y-full absolute w-full' : 'translate-y-0'}`}>
          <div className="flex items-center space-x-1.5 md:space-x-4 min-w-0 flex-1 w-full justify-between sm:justify-start">
            <div className="flex items-center space-x-1.5 md:space-x-4 min-w-0">
              <div className="bg-white p-1 md:p-1.5 rounded-lg hidden sm:block shrink-0">
                <Monitor size={18} className="text-[#5AB2FF] md:w-6 md:h-6" />
              </div>
              <div className="min-w-0">
                <h1 className="font-black text-xs md:text-lg leading-tight uppercase tracking-tight truncate">CBT - {sumatif.title}</h1>
                <p className="text-[7px] md:text-[10px] font-bold opacity-80 uppercase tracking-widest truncate">{MOCK_SUBJECTS.find(s => s.id === sumatif.subjectId)?.name}</p>
              </div>
            </div>

            <button
              onClick={() => setHeaderMinimized(true)}
              className="p-1 rounded bg-white/10 text-white hover:bg-white/25 text-[10px] font-bold uppercase tracking-wider md:hidden shrink-0"
              title="Sembunyikan Header"
            >
              ▲ Sembunyikan
            </button>
          </div>

          <div className="flex items-center justify-between sm:justify-end flex-wrap gap-1.5 sm:space-x-3 w-full sm:w-auto shrink-0">
            <div className="flex flex-col items-start sm:items-end shrink-0">
              <p className="hidden md:block text-[8px] md:text-[10px] font-black opacity-70 uppercase tracking-widest text-[#F0F4F8]">Sisa Waktu</p>
              <div className={`flex items-center px-1.5 md:px-3 py-1 md:py-1.5 rounded-lg md:rounded-xl backdrop-blur-sm border transition-all duration-300 ${
                timeLeft < 300 
                  ? 'bg-red-500/20 border-red-500/40 text-red-100' 
                  : 'bg-white/10 border-white/10 text-white'
              }`}>
                <Clock size={12} className="md:w-4 md:h-4 mr-1" />
                <span className="font-mono font-black text-xs md:text-lg">{formatTime(timeLeft)}</span>
              </div>
            </div>
            
            <div className="hidden sm:flex flex-col items-end border-l border-white/20 pl-2 md:pl-4 shrink-0">
              <p className="text-[8px] md:text-[10px] font-bold opacity-70 uppercase">Peserta</p>
              <p className="font-bold text-[10px] md:text-xs leading-none mt-0.5 max-w-[80px] truncate">{studentName}</p>
            </div>

            <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
              <button
                onClick={() => {
                  if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().then(() => {
                      if (screen.orientation && (screen.orientation as any).lock) {
                        (screen.orientation as any).lock('portrait').catch(() => {});
                      }
                    }).catch(err => console.error(err));
                    setIsFullscreen(true);
                  } else if (document.exitFullscreen) {
                    document.exitFullscreen();
                    if (screen.orientation && (screen.orientation as any).unlock) {
                      try { (screen.orientation as any).unlock(); } catch (e) {}
                    }
                    setIsFullscreen(false);
                  }
                }}
                className="p-1.5 md:p-2 rounded-lg md:rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all shrink-0"
                title="Layar Penuh"
              >
                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>

              {/* CBT Scale Selector */}
              <div className="flex items-center bg-white/10 rounded-lg md:rounded-xl p-0.5 border border-white/5 shrink-0 scale-90 xs:scale-100">
                <button
                  type="button"
                  onClick={() => handleSetScaleMode('kecil')}
                  className={`px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-md md:rounded-lg text-[8px] md:text-[10px] font-black transition-all ${scaleMode === 'kecil' ? 'bg-white text-[#5AB2FF] shadow-sm' : 'text-white hover:bg-white/10'}`}
                  title="Ukuran Font Kecil"
                >
                  Kecil
                </button>
                <button
                  type="button"
                  onClick={() => handleSetScaleMode('normal')}
                  className={`px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-md md:rounded-lg text-[8px] md:text-[10px] font-black transition-all ${scaleMode === 'normal' ? 'bg-white text-[#5AB2FF] shadow-sm' : 'text-white hover:bg-white/10'}`}
                  title="Ukuran Font Normal (Meningkat 30% Lebih Besar)"
                >
                  Normal
                </button>
                <button
                  type="button"
                  onClick={() => handleSetScaleMode('besar')}
                  className={`px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-md md:rounded-lg text-[8px] md:text-[10px] font-black transition-all ${scaleMode === 'besar' ? 'bg-white text-[#5AB2FF] shadow-sm' : 'text-white hover:bg-white/10'}`}
                  title="Ukuran Font Besar"
                >
                  Besar
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowNavigation(!showNavigation)}
                className={`flex items-center space-x-1 px-2 py-1 md:py-1.5 rounded-lg md:rounded-xl transition-all font-black text-[9px] md:text-[11px] uppercase tracking-wider shadow-md shrink-0 border transform hover:scale-105 active:scale-95 ${
                  showNavigation 
                    ? 'bg-white text-[#5AB2FF] border-white' 
                    : 'bg-[#FFD23F] text-slate-900 border-[#FFD23F] hover:bg-[#FFE066] animate-pulse duration-1000'
                }`}
                title={showNavigation ? 'Sembunyikan Navigasi' : 'Tampilkan Navigasi'}
              >
                <LayoutGrid size={12} className="shrink-0" />
                <span className="hidden xs:inline">{showNavigation ? 'Sembunyikan' : 'Navigasi'}</span>
                <span className="xs:hidden">{showNavigation ? 'Tutup' : 'Nav'}</span>
              </button>

              <button
                disabled={isSubmitting}
                onClick={() => {
                  setModal({
                    isOpen: true,
                    title: 'Akhiri Ujian',
                    message: 'Apakah Anda yakin ingin mengakhiri ujian?',
                    type: 'confirm',
                    onConfirm: () => {
                      setModal(prev => ({ ...prev, isOpen: false }));
                      handleSubmit();
                    }
                  });
                }}
                className={`bg-white text-[#5AB2FF] px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-lg sm:rounded-xl font-black text-[9px] sm:text-xs md:text-sm uppercase tracking-wider hover:bg-blue-50 transition-all shadow-md active:scale-95 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? '...' : 'Selesai'}
              </button>
            </div>
          </div>
        </div>

      {/* Main CBT Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left: Question Area */}
        <div className={`flex-1 flex flex-col transition-all duration-500 ${
          scaleMode === 'kecil' 
            ? `px-1.5 pb-1.5 ${headerMinimized ? 'pt-16' : 'pt-1.5'} sm:p-2 md:p-3 xl:p-4` 
            : `px-2 pb-2 ${headerMinimized ? 'pt-16' : 'pt-2'} sm:p-4 md:p-8`
        }`}>
          <div className={`w-full mx-auto transition-all duration-500 h-full flex flex-col ${
            scaleMode === 'kecil' ? 'space-y-2 md:space-y-3' : 'space-y-4 md:space-y-6'
          } max-w-[1440px]`}>
            {/* Question Card */}
            <div className={`bg-white rounded-2xl shadow-xl shadow-blue-900/5 border border-slate-200 overflow-hidden flex flex-col transition-all duration-500 flex-1 w-full min-h-0`}>
              {/* Question Header */}
              <div className={`bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0 ${
                scaleMode === 'kecil' ? 'px-3 md:px-6 py-2 md:py-3' : 'px-4 md:px-8 py-3 md:py-4'
              }`}>
                <div className="flex items-center space-x-2 md:space-x-3 min-w-0">
                  <span className="bg-[#5AB2FF] text-white w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center font-black text-sm md:text-lg shadow-md shrink-0">
                    {currentQuestionIdx + 1}
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[#5AB2FF] font-black text-[8px] md:text-[10px] uppercase tracking-[0.2em] leading-none mb-1 line-clamp-1">
                      {MOCK_SUBJECTS.find(s => s.id === sumatif.subjectId)?.name || 'Mata Pelajaran'}
                    </span>
                    <span className="text-slate-600 font-bold text-xs md:text-sm uppercase tracking-wider leading-none line-clamp-1">
                      {sumatif.title}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                  {/* Font Size Selector directly inside Question Card Header */}
                  <div className="flex items-center space-x-1 bg-slate-200/60 rounded-xl p-0.5 md:p-1 border border-slate-200 shrink-0 scale-90 sm:scale-100">
                    <button
                      type="button"
                      onClick={() => handleSetScaleMode('kecil')}
                      className={`p-1 md:p-1.5 rounded-md md:rounded-lg transition-all flex items-center justify-center ${
                        scaleMode === 'kecil' 
                          ? 'bg-white text-[#5AB2FF] shadow-sm' 
                          : 'text-slate-600 hover:bg-slate-300/50'
                      }`}
                      title="Ukuran Font Kecil"
                    >
                      <Type size={12} className="shrink-0" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetScaleMode('normal')}
                      className={`p-1 md:p-1.5 rounded-md md:rounded-lg transition-all flex items-center justify-center ${
                        scaleMode === 'normal' 
                          ? 'bg-white text-[#5AB2FF] shadow-sm' 
                          : 'text-slate-600 hover:bg-slate-300/50'
                      }`}
                      title="Ukuran Font Normal (Meningkat 30% Lebih Besar)"
                    >
                      <Type size={16} className="shrink-0" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetScaleMode('besar')}
                      className={`p-1 md:p-1.5 rounded-md md:rounded-lg transition-all flex items-center justify-center ${
                        scaleMode === 'besar' 
                          ? 'bg-white text-[#5AB2FF] shadow-sm' 
                          : 'text-slate-600 hover:bg-slate-300/50'
                      }`}
                      title="Ukuran Font Besar"
                    >
                      <Type size={20} className="shrink-0" />
                    </button>
                  </div>

                  <div className="flex flex-col items-end shrink-0">
                    <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Sisa Waktu</span>
                    <div className={`flex items-center font-mono font-black text-xs md:text-xl transition-all duration-300 ${timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-[#5AB2FF]'}`}>
                      <Clock size={14} className="md:w-5 md:h-5 mr-1 md:mr-2" />
                      {formatTime(timeLeft)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Question Content */}
              <div className={`flex-1 overflow-y-auto scrollbar-hide ${
                scaleMode === 'kecil' ? 'p-2 md:p-5 xl:p-6 landscape:p-3' : 'p-3 md:p-8 landscape:p-4'
              } ${
                (currentQuestion.imageUrl && currentQuestion.imageUrl.trim() !== '')
                  ? 'grid grid-cols-1 md:grid-cols-2 landscape:grid-cols-2 gap-3 md:gap-10 landscape:gap-6 items-start'
                  : 'flex flex-col max-w-3xl mx-auto w-full'
              }`}>
                {/* Left Side: Image & Description */}
                {currentQuestion.imageUrl && currentQuestion.imageUrl.trim() !== '' && (
                  <div className={scaleMode === 'kecil' ? 'space-y-3' : 'space-y-6'}>
                    {currentQuestion.imageUrl && (currentQuestion.imageUrl.startsWith('http') || currentQuestion.imageUrl.startsWith('data:image/') || currentQuestion.imageUrl.startsWith('/')) ? (
                      <div className={scaleMode === 'kecil' ? 'space-y-2' : 'space-y-4'}>
                        <div className={`rounded-2xl overflow-hidden border border-slate-100 shadow-sm flex justify-center bg-slate-50 relative group ${
                          scaleMode === 'kecil' ? 'max-h-[280px]' : 'max-h-[500px]'
                        }`}>
                          <div className="p-3 absolute top-0 right-0 z-10 opacity-0 group-hover:opacity-100 transition-all flex space-x-2">
                            <button
                              onClick={() => setZoomScale(prev => Math.min(prev + 0.2, 3))}
                              className="w-8 h-8 md:w-10 md:h-10 bg-white shadow-xl rounded-xl flex items-center justify-center text-slate-600 hover:text-[#5AB2FF] hover:scale-110"
                              title="Zoom In"
                            >
                              <ZoomIn size={18} />
                            </button>
                            <button
                              onClick={() => setZoomScale(prev => Math.max(prev - 0.2, 0.5))}
                              className="w-8 h-8 md:w-10 md:h-10 bg-white shadow-xl rounded-xl flex items-center justify-center text-slate-600 hover:text-[#5AB2FF] hover:scale-110"
                              title="Zoom Out"
                            >
                              <ZoomOut size={18} />
                            </button>
                            <button
                              onClick={() => setZoomScale(1)}
                              className="w-8 h-8 md:w-10 md:h-10 bg-white shadow-xl rounded-xl flex items-center justify-center text-slate-600 hover:text-[#5AB2FF] hover:scale-110 font-bold text-xs"
                              title="Reset"
                            >
                              R
                            </button>
                          </div>
                          <div className="flex-1 w-full flex items-center justify-center p-3 overflow-auto scrollbar-hide">
                            <img 
                              src={currentQuestion.imageUrl} 
                              alt="Question" 
                              style={{ 
                                transform: `scale(${zoomScale})`, 
                                transformOrigin: 'center center',
                                transition: 'transform 0.2s ease-out',
                                imageRendering: 'high-quality' as any,
                                ['WebkitImageRendering' as any]: '-webkit-optimize-contrast'
                              }}
                              className={`max-w-full object-contain cursor-grab active:cursor-grabbing ${
                                scaleMode === 'kecil' ? 'max-h-[240px]' : 'max-h-[460px]'
                              }`}
                              referrerPolicy="no-referrer"
                              onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                            />
                          </div>
                        </div>
                        {currentQuestion.imageCaption && (
                          <p className="text-center text-xs italic text-slate-400">{currentQuestion.imageCaption}</p>
                        )}
                      </div>
                    ) : currentQuestion.imageUrl ? (
                      <div className={`p-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-700 leading-relaxed whitespace-pre-wrap font-medium ${adaptiveFontSize}`}>
                        {renderFormattedText(currentQuestion.imageUrl)}
                      </div>
                    ) : null}
                  </div>
                )}
                
                {/* Right Side / Content Flow: Interactions / Options */}
                <div className="flex flex-col w-full">
                  <div className={`text-slate-800 font-medium leading-relaxed whitespace-pre-wrap break-words w-full min-w-0 ${adaptiveFontSize} ${
                    scaleMode === 'kecil' ? 'mb-4 md:mb-5' : 'mb-6 md:mb-8'
                  }`}>
                    {renderFormattedText(currentQuestion.text)}
                  </div>

                  <div className={scaleMode === 'kecil' ? 'space-y-2' : 'space-y-4'}>
                  {currentQuestion.type === 'pg' && (currentQuestion.options || []).filter((opt: any) => (opt.text && opt.text.trim() !== "") || (opt.imageUrl && opt.imageUrl.trim() !== "")).map((opt: any, idx: number) => {
                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleAnswer(currentQuestion.id, opt.id)}
                        className={`w-full rounded-xl border-2 text-left transition-all flex items-center group relative overflow-hidden ${
                          scaleMode === 'kecil' ? 'p-2.5 md:p-3 space-x-3' : 'p-4 space-x-4'
                        } ${
                          answers[currentQuestion.id] === opt.id
                            ? 'border-[#5AB2FF] bg-blue-50/50'
                            : 'border-slate-100 hover:border-[#5AB2FF]/30 bg-white'
                        }`}
                      >
                        <div className={`rounded-lg flex items-center justify-center font-black transition-all z-10 shrink-0 ${
                          scaleMode === 'kecil' ? 'w-8 h-8 text-sm' : 'w-10 h-10'
                        } ${
                          answers[currentQuestion.id] === opt.id
                            ? 'bg-[#5AB2FF] text-white shadow-lg'
                            : 'bg-slate-100 text-slate-400 group-hover:bg-blue-50 group-hover:text-[#5AB2FF]'
                        }`}>
                          {String.fromCharCode(65 + idx)}
                        </div>
                        <div className={`flex-1 flex items-center z-10 ${scaleMode === 'kecil' ? 'space-x-3' : 'space-x-4'}`}>
                          {opt.imageUrl && (opt.imageUrl.startsWith('http') || opt.imageUrl.startsWith('data:image/') || opt.imageUrl.startsWith('/')) ? (
                            <div className={`rounded-lg overflow-hidden border border-slate-100 shrink-0 bg-slate-50 ${
                              scaleMode === 'kecil' ? 'w-12 h-12 md:w-16 md:h-16' : 'w-20 h-20'
                            }`}>
                              <img 
                                src={opt.imageUrl} 
                                alt={`Option ${idx}`} 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              />
                            </div>
                          ) : opt.imageUrl ? (
                            <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-slate-700 leading-relaxed whitespace-pre-wrap font-medium text-xs">
                              {opt.imageUrl.replace(/<br\s*\/?>/gi, '\n').replace(/\\n/g, '\n')}
                            </div>
                          ) : null}
                          {opt.text && !opt.text.startsWith('http') && !opt.text.startsWith('data:image/') && (
                            <span className={`font-bold ${
                              answers[currentQuestion.id] === opt.id ? 'text-slate-800' : 'text-slate-600'
                            } ${
                              scaleMode === 'kecil' 
                                ? (fontSize === 'sm' ? 'text-[10px]' : fontSize === 'md' ? 'text-xs' : 'text-sm') 
                                : scaleMode === 'besar'
                                  ? (fontSize === 'sm' ? 'text-base' : fontSize === 'md' ? 'text-lg' : 'text-xl')
                                  : (fontSize === 'sm' ? 'text-xs' : fontSize === 'md' ? 'text-sm' : 'text-base')
                            }`}>
                              {opt.text}
                            </span>
                          )}
                        </div>
                        {answers[currentQuestion.id] === opt.id && (
                          <div className={`absolute top-1/2 -translate-y-1/2 text-[#5AB2FF] ${scaleMode === 'kecil' ? 'right-3' : 'right-4'}`}>
                            <CheckCircle size={scaleMode === 'kecil' ? 20 : 24} />
                          </div>
                        )}
                      </button>
                    );
                  })}

                  {currentQuestion.type === 'pgk' && (currentQuestion.options || []).filter((opt: any) => (opt.text && opt.text.trim() !== "") || (opt.imageUrl && opt.imageUrl.trim() !== "")).map((opt: any, idx: number) => {
                    const isSelected = (answers[currentQuestion.id] || []).includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        onClick={() => {
                          const current = answers[currentQuestion.id] || [];
                          const next = current.includes(opt.id)
                            ? current.filter((c: string) => c !== opt.id)
                            : [...current, opt.id];
                          handleAnswer(currentQuestion.id, next);
                        }}
                        className={`w-full rounded-xl border-2 text-left transition-all flex items-center group relative overflow-hidden ${
                          scaleMode === 'kecil' ? 'p-2.5 md:p-3 space-x-3' : 'p-4 space-x-4'
                        } ${
                          isSelected
                            ? 'border-[#5AB2FF] bg-blue-50/50'
                            : 'border-slate-100 hover:border-[#5AB2FF]/30 bg-white'
                        }`}
                      >
                        <div className={`rounded-lg flex items-center justify-center font-black transition-all z-10 shrink-0 ${
                          scaleMode === 'kecil' ? 'w-8 h-8 text-sm' : 'w-10 h-10'
                        } ${
                          isSelected
                            ? 'bg-[#5AB2FF] text-white shadow-lg'
                            : 'bg-slate-100 text-slate-400 group-hover:bg-blue-50 group-hover:text-[#5AB2FF]'
                        }`}>
                          <div className={`border-2 rounded flex items-center justify-center ${
                            scaleMode === 'kecil' ? 'w-4 h-4' : 'w-5 h-5'
                          } ${
                            isSelected ? 'border-white' : 'border-slate-300'
                          }`}>
                            {isSelected && <Check size={scaleMode === 'kecil' ? 12 : 14} />}
                          </div>
                        </div>
                        <div className={`flex-1 flex items-center z-10 ${scaleMode === 'kecil' ? 'space-x-3' : 'space-x-4'}`}>
                          {opt.imageUrl && (opt.imageUrl.startsWith('http') || opt.imageUrl.startsWith('data:image/') || opt.imageUrl.startsWith('/')) ? (
                            <div className={`rounded-lg overflow-hidden border border-slate-100 shrink-0 bg-slate-50 ${
                              scaleMode === 'kecil' ? 'w-12 h-12 md:w-16 md:h-16' : 'w-20 h-20'
                            }`}>
                              <img 
                                src={opt.imageUrl} 
                                alt={`Option ${idx}`} 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              />
                            </div>
                          ) : opt.imageUrl ? (
                            <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-slate-700 leading-relaxed whitespace-pre-wrap font-medium text-xs">
                              {opt.imageUrl.replace(/<br\s*\/?>/gi, '\n').replace(/\\n/g, '\n')}
                            </div>
                          ) : null}
                          {opt.text && !opt.text.startsWith('http') && !opt.text.startsWith('data:image/') && (
                            <span className={`font-bold ${
                              isSelected ? 'text-slate-800' : 'text-slate-600'
                            } ${
                              scaleMode === 'kecil' 
                                ? (fontSize === 'sm' ? 'text-[10px]' : fontSize === 'md' ? 'text-xs' : 'text-sm') 
                                : scaleMode === 'besar'
                                  ? (fontSize === 'sm' ? 'text-base' : fontSize === 'md' ? 'text-lg' : 'text-xl')
                                  : (fontSize === 'sm' ? 'text-xs' : fontSize === 'md' ? 'text-sm' : 'text-base')
                            }`}>
                              {opt.text}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}

                  {currentQuestion.type === 'bs' && (
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm overflow-x-auto w-full">
                      <table className="w-full text-left border-collapse min-w-[340px]">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200">
                            <th className={`font-black text-slate-400 uppercase tracking-widest leading-none ${
                              scaleMode === 'kecil' ? 'px-4 py-2.5 text-[9px]' : 'px-6 py-4 text-[10px]'
                            }`}>Pernyataan Jawaban</th>
                            <th className={`font-black text-slate-400 uppercase tracking-widest transition-all text-center ${
                              scaleMode === 'kecil' ? 'px-2 py-2.5 text-[9px] w-16' : 'px-4 py-4 text-[10px] w-20'
                            }`}>Benar</th>
                            <th className={`font-black text-slate-400 uppercase tracking-widest transition-all text-center ${
                              scaleMode === 'kecil' ? 'px-2 py-2.5 text-[9px] w-16' : 'px-4 py-4 text-[10px] w-20'
                            }`}>Salah</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(currentQuestion.subQuestions || []).map((sq: any, sqIdx: number) => {
                            const subAnswers = answers[currentQuestion.id] || {};
                            const currentAns = subAnswers[sq.id];
                            return (
                              <tr key={sq.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className={scaleMode === 'kecil' ? 'px-4 py-2.5' : 'px-6 py-4'}>
                                  <div className="space-y-2">
                                    {sq.imageUrl && (sq.imageUrl.startsWith('http') || sq.imageUrl.startsWith('data:image/') || sq.imageUrl.startsWith('/')) ? (
                                      <div className="rounded-lg overflow-hidden border border-slate-100 max-h-[80px] inline-block">
                                        <img 
                                          src={sq.imageUrl} 
                                          alt="Statement" 
                                          className="max-w-full h-auto object-contain"
                                          referrerPolicy="no-referrer"
                                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                        />
                                      </div>
                                    ) : sq.imageUrl ? (
                                      <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-slate-700 leading-relaxed whitespace-pre-wrap font-medium text-xs">
                                        {sq.imageUrl.replace(/<br\s*\/?>/gi, '\n').replace(/\\n/g, '\n')}
                                      </div>
                                    ) : null}
                                    <p className={`font-bold text-slate-700 leading-tight whitespace-pre-wrap ${
                                      scaleMode === 'kecil' 
                                        ? (fontSize === 'sm' ? 'text-[10px]' : fontSize === 'md' ? 'text-xs' : 'text-sm') 
                                        : scaleMode === 'besar'
                                          ? (fontSize === 'sm' ? 'text-base' : fontSize === 'md' ? 'text-lg' : 'text-xl')
                                          : (fontSize === 'sm' ? 'text-xs' : fontSize === 'md' ? 'text-sm' : 'text-base')
                                    }`}>
                                      {renderFormattedText(sq.text)}
                                    </p>
                                  </div>
                                </td>
                                <td className={`text-center border-l border-slate-100 ${scaleMode === 'kecil' ? 'px-2 py-2.5' : 'px-4 py-4'}`}>
                                  <button
                                    onClick={() => {
                                      const next = { ...subAnswers, [sq.id]: 'Benar' };
                                      handleAnswer(currentQuestion.id, next);
                                    }}
                                    className={`rounded-full border-2 transition-all flex items-center justify-center mx-auto ${
                                      scaleMode === 'kecil' ? 'w-8 h-8' : 'w-10 h-10'
                                    } ${
                                      currentAns === 'Benar'
                                        ? 'border-[#5AB2FF] bg-[#5AB2FF] text-white shadow-lg shadow-blue-100'
                                        : 'border-slate-200 text-slate-300 hover:border-[#5AB2FF]/50'
                                    }`}
                                  >
                                    <Check size={scaleMode === 'kecil' ? 14 : 18} />
                                  </button>
                                </td>
                                <td className={`text-center border-l border-slate-100 ${scaleMode === 'kecil' ? 'px-2 py-2.5' : 'px-4 py-4'}`}>
                                  <button
                                    onClick={() => {
                                      const next = { ...subAnswers, [sq.id]: 'Salah' };
                                      handleAnswer(currentQuestion.id, next);
                                    }}
                                    className={`rounded-full border-2 transition-all flex items-center justify-center mx-auto ${
                                      scaleMode === 'kecil' ? 'w-8 h-8' : 'w-10 h-10'
                                    } ${
                                      currentAns === 'Salah'
                                        ? 'border-red-500 bg-red-500 text-white shadow-lg shadow-red-100'
                                        : 'border-slate-200 text-slate-300 hover:border-red-500/50'
                                    }`}
                                  >
                                    <X size={scaleMode === 'kecil' ? 14 : 18} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {currentQuestion.type === 'uraian' && (
                    <div className={scaleMode === 'kecil' ? 'space-y-2' : 'space-y-4'}>
                      <label className="block text-xs md:text-sm font-bold text-slate-700 uppercase tracking-widest bg-slate-50 p-2 rounded-lg border-l-4 border-[#5AB2FF]">
                        Tulis Jawaban Anda:
                      </label>
                      <textarea
                        value={answers[currentQuestion.id] || ''}
                        onChange={e => handleAnswer(currentQuestion.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.stopPropagation();
                          }
                        }}
                        placeholder="Ketikkan jawaban uraian Anda di sini..."
                        className={`w-full px-4 rounded-xl border-2 border-slate-100 focus:border-[#5AB2FF] focus:bg-blue-50/20 outline-none transition-all shadow-sm text-slate-700 font-medium leading-relaxed ${
                          scaleMode === 'kecil' 
                            ? 'py-3 min-h-[160px] text-xs md:text-sm' 
                            : scaleMode === 'besar'
                              ? 'py-4 min-h-[300px] text-lg md:text-xl'
                              : 'py-4 min-h-[300px] text-base md:text-lg'
                        }`}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

              {/* CBT Footer Controls */}
              <div className={`flex items-center justify-between bg-white px-2.5 py-1.5 md:px-4 md:py-2.5 rounded-lg md:rounded-xl shadow-md border border-slate-200 transition-all duration-300 shrink-0`}>
                <button
                  disabled={currentQuestionIdx === 0}
                  onClick={() => setCurrentQuestionIdx(prev => prev - 1)}
                  className="flex items-center space-x-1 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-black bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all disabled:opacity-30 uppercase text-[9px] sm:text-xs tracking-wider"
                >
                  <ArrowLeft size={14} className="sm:w-4 sm:h-4" />
                  <span>Sebelumnya</span>
                </button>

                <button
                  onClick={() => toggleFlag(currentQuestion.id)}
                  className={`flex items-center space-x-1 px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-black transition-all uppercase text-[9px] sm:text-xs tracking-wider border-2 ${
                    flaggedQuestions.has(currentQuestion.id)
                      ? 'bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-200'
                      : 'bg-white border-amber-500 text-amber-500 hover:bg-amber-50'
                  }`}
                >
                  <Flag size={14} className="sm:w-4 sm:h-4" fill={flaggedQuestions.has(currentQuestion.id) ? 'currentColor' : 'none'} />
                  <span>Ragu</span>
                </button>

                <button
                  disabled={isSubmitting}
                  onClick={() => {
                    if (isLastQuestion) {
                      setModal({
                        isOpen: true,
                        title: 'Akhiri Ujian',
                        message: 'Apakah Anda yakin ingin mengakhiri ujian? Pastikan semua jawaban telah terisi.',
                        type: 'confirm',
                        onConfirm: () => {
                          setModal(prev => ({ ...prev, isOpen: false }));
                          handleSubmit();
                        }
                      });
                    } else {
                      setCurrentQuestionIdx(prev => prev + 1);
                    }
                  }}
                  className={`flex items-center space-x-1 px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-black text-white transition-all uppercase text-[9px] sm:text-xs tracking-wider shadow-md ${
                    isLastQuestion ? 'bg-green-500 hover:bg-green-600 shadow-green-200' : 'bg-[#5AB2FF] hover:bg-[#4A9FE6] shadow-blue-200'
                  } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span>{isSubmitting ? 'Memproses...' : (isLastQuestion ? 'Selesai' : 'Berikutnya')}</span>
                  {!isSubmitting && <ArrowRight size={14} className="sm:w-4 sm:h-4" />}
                </button>
              </div>
          </div>
        </div>

        {/* Right: Navigation Grid */}
        <div className={`bg-white border-l border-slate-200 flex flex-col shadow-2xl z-50 transition-all duration-500 overflow-hidden shrink-0 absolute md:relative right-0 h-full ${showNavigation ? 'w-64 md:w-80 opacity-100' : 'w-0 opacity-0 border-none pointer-events-none'}`}>
          <div className="w-64 md:w-80 flex flex-col h-full">
            <div className="p-6 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Navigasi Soal</h3>
                <button
                  type="button"
                  onClick={() => setShowNavigation(false)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-200/50 hover:text-slate-600 transition-all"
                  title="Sembunyikan Navigasi"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="grid grid-cols-5 gap-2">
              {shuffledQuestions.map((q: Question, idx: number) => (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIdx(idx)}
                  className={`w-full aspect-square rounded-lg flex items-center justify-center text-xs font-black transition-all relative ${
                    currentQuestionIdx === idx
                      ? 'bg-[#5AB2FF] text-white shadow-lg ring-4 ring-blue-100 scale-110 z-10'
                      : flaggedQuestions.has(q.id)
                        ? 'bg-amber-500 text-white'
                        : answers[q.id]
                          ? 'bg-green-500 text-white'
                          : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {idx + 1}
                  {flaggedQuestions.has(q.id) && !answers[q.id] && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 flex-1 overflow-y-auto space-y-6">
            <div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Keterangan</h4>
              <div className="space-y-2">
                <div className="flex items-center text-[10px] font-bold text-slate-500 uppercase">
                  <div className="w-4 h-4 bg-[#5AB2FF] rounded mr-3 shadow-sm"></div>
                  <span>Posisi Sekarang</span>
                </div>
                <div className="flex items-center text-[10px] font-bold text-slate-500 uppercase">
                  <div className="w-4 h-4 bg-green-500 rounded mr-3 shadow-sm"></div>
                  <span>Sudah Terjawab</span>
                </div>
                <div className="flex items-center text-[10px] font-bold text-slate-500 uppercase">
                  <div className="w-4 h-4 bg-amber-500 rounded mr-3 shadow-sm"></div>
                  <span>Ragu-Ragu</span>
                </div>
                <div className="flex items-center text-[10px] font-bold text-slate-500 uppercase">
                  <div className="w-4 h-4 bg-slate-100 rounded mr-3"></div>
                  <span>Belum Terjawab</span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100">
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <p className="text-[10px] font-black text-blue-400 uppercase mb-1">Progress</p>
                <div className="flex items-end justify-between mb-2">
                  <span className="text-2xl font-black text-[#5AB2FF]">
                    {Math.round((Object.keys(answers).length / sumatif.questions.length) * 100)}%
                  </span>
                  <span className="text-[10px] font-bold text-blue-400">
                    {Object.keys(answers).length}/{sumatif.questions.length} Soal
                  </span>
                </div>
                <div className="w-full h-2 bg-white rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#5AB2FF] transition-all duration-500"
                    style={{ width: `${(Object.keys(answers).length / sumatif.questions.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

      <Modal 
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onConfirm={modal.onConfirm}
        onCancel={() => setModal(prev => ({ ...prev, isOpen: false }))}
      />
    </>
  );
};

// --- PEMBAHASAN COMPONENT ---
const SumatifPembahasan: React.FC<{
  sumatif: Sumatif,
  onClose: () => void
}> = ({ sumatif, onClose }) => {
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [showNavigation, setShowNavigation] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 768);
  const [scaleMode, setScaleMode] = useState<'kecil' | 'normal' | 'besar'>(() => {
    try {
      const saved = localStorage.getItem('sumatif_scale_mode');
      return (saved as 'kecil' | 'normal' | 'besar') || 'normal';
    } catch (e) {
      return 'normal';
    }
  });

  const handleSetScaleMode = (mode: 'kecil' | 'normal' | 'besar') => {
    setScaleMode(mode);
    try {
      localStorage.setItem('sumatif_scale_mode', mode);
    } catch (e) {}
  };

  const questions = sumatif.questions || [];
  const currentQuestion = questions[currentQuestionIdx];

  const handleNext = () => {
    setZoomScale(1);
    setCurrentQuestionIdx(prev => Math.min(prev + 1, questions.length - 1));
  };
  const handlePrev = () => {
    setZoomScale(1);
    setCurrentQuestionIdx(prev => Math.max(prev - 1, 0));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        if (screen.orientation && (screen.orientation as any).lock) {
          (screen.orientation as any).lock('portrait').catch(() => {});
        }
      }).catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        if (screen.orientation && (screen.orientation as any).unlock) {
          try { (screen.orientation as any).unlock(); } catch (e) {}
        }
        setIsFullscreen(false);
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const adaptiveFontSize = React.useMemo(() => {
    if (!currentQuestion) return 'text-base';
    const textLen = (currentQuestion.text || '').length;

    if (scaleMode === 'kecil') {
      if (textLen > 600) return 'text-[10px] md:text-xs';
      if (textLen > 300) return 'text-xs md:text-sm';
      if (textLen > 100) return 'text-xs md:text-sm';
      return 'text-sm md:text-base';
    } else if (scaleMode === 'besar') {
      if (textLen > 600) return 'text-base md:text-lg';
      if (textLen > 300) return 'text-lg md:text-xl';
      if (textLen > 100) return 'text-xl md:text-2xl';
      return 'text-2xl md:text-3xl';
    }
    
    // Normal scaleMode: now matches what was previously 'kecil' scale mode
    if (textLen > 600) return 'text-xs md:text-sm';
    if (textLen > 300) return 'text-sm md:text-base';
    if (textLen > 100) return 'text-sm md:text-base';
    return 'text-base md:text-lg';
  }, [currentQuestion?.text, scaleMode]);

  if (!currentQuestion) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#F0F4F8] flex flex-col items-center justify-center font-sans">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 text-center max-w-md">
          <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Belum Ada Soal</h2>
          <p className="text-slate-500 mb-6">Sumatif ini belum memiliki soal. Silakan tambahkan soal terlebih dahulu melalui menu Edit.</p>
          <button 
            onClick={onClose}
            className="bg-[#5AB2FF] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-600 transition-colors"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-[#F0F4F8] flex flex-col font-sans h-[100dvh] w-screen overflow-hidden">
      {/* CBT Header */}
      <div className="bg-[#5AB2FF] text-white px-2 md:px-6 py-1.5 md:py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-lg z-10 shrink-0">
        <div className="flex items-center space-x-1.5 md:space-x-4 min-w-0 flex-1 w-full justify-between sm:justify-start">
          <div className="flex items-center space-x-1.5 md:space-x-4 min-w-0">
            <button
              onClick={onClose}
              className="flex items-center space-x-1 px-2.5 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg md:rounded-xl font-bold text-[10px] md:text-sm tracking-wide transition-all active:scale-95 cursor-pointer shrink-0"
              title="Kembali"
            >
              <ArrowLeft size={14} className="md:w-5 md:h-5 mr-0.5 md:mr-1" />
              <span>Kembali</span>
            </button>
            <div className="h-5 w-px bg-white/20 hidden xs:block"></div>
            <div className="bg-white p-1 md:p-1.5 rounded-lg hidden xs:block shrink-0">
              <Monitor size={18} className="text-[#5AB2FF] md:w-6 md:h-6" />
            </div>
            <div className="min-w-0">
              <h1 className="font-black text-xs md:text-lg leading-tight uppercase tracking-tight truncate">{sumatif.title}</h1>
              <p className="text-[7px] md:text-[10px] font-bold opacity-80 uppercase tracking-widest truncate">{MOCK_SUBJECTS.find(s => s.id === sumatif.subjectId)?.name || 'Mata Pelajaran'}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end flex-wrap gap-1.5 sm:space-x-3 w-full sm:w-auto shrink-0">
          <div className="flex items-center space-x-1 sm:space-x-2 shrink-0 ml-auto">
            {/* CBT Scale Selector */}
            <div className="flex items-center bg-white/10 rounded-lg md:rounded-xl p-0.5 border border-white/5 shrink-0 scale-90 xs:scale-100">
              <button
                type="button"
                onClick={() => handleSetScaleMode('kecil')}
                className={`px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-md md:rounded-lg text-[8px] md:text-[10px] font-black transition-all ${scaleMode === 'kecil' ? 'bg-white text-[#5AB2FF] shadow-sm' : 'text-white hover:bg-white/10'}`}
                title="Ukuran Font Kecil"
              >
                Kecil
              </button>
              <button
                type="button"
                onClick={() => handleSetScaleMode('normal')}
                className={`px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-md md:rounded-lg text-[8px] md:text-[10px] font-black transition-all ${scaleMode === 'normal' ? 'bg-white text-[#5AB2FF] shadow-sm' : 'text-white hover:bg-white/10'}`}
                title="Ukuran Font Normal (Meningkat 30% Lebih Besar)"
              >
                Normal
              </button>
              <button
                type="button"
                onClick={() => handleSetScaleMode('besar')}
                className={`px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-md md:rounded-lg text-[8px] md:text-[10px] font-black transition-all ${scaleMode === 'besar' ? 'bg-white text-[#5AB2FF] shadow-sm' : 'text-white hover:bg-white/10'}`}
                title="Ukuran Font Besar"
              >
                Besar
              </button>
            </div>

            <button
              onClick={toggleFullscreen}
              className="p-1 md:p-2 rounded-lg md:rounded-xl transition-all bg-white/10 text-white hover:bg-white/20 shrink-0"
              title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
            >
              {isFullscreen ? <Minimize2 size={12} className="md:w-5 md:h-5" /> : <Maximize2 size={12} className="md:w-5 md:h-5" />}
            </button>

            <button
              type="button"
              onClick={() => setShowNavigation(!showNavigation)}
              className={`flex items-center space-x-1 px-2 py-1 md:py-1.5 rounded-lg md:rounded-xl transition-all font-black text-[9px] md:text-[11px] uppercase tracking-wider shadow-md shrink-0 border transform hover:scale-105 active:scale-95 ${
                showNavigation 
                  ? 'bg-white text-[#5AB2FF] border-white' 
                  : 'bg-[#FFD23F] text-slate-900 border-[#FFD23F] hover:bg-[#FFE066] animate-pulse duration-1000'
              }`}
              title={showNavigation ? 'Sembunyikan Navigasi' : 'Tampilkan Navigasi'}
            >
              <LayoutGrid size={12} className="shrink-0" />
              <span className="hidden xs:inline">{showNavigation ? 'Sembunyikan' : 'Navigasi'}</span>
              <span className="xs:hidden">{showNavigation ? 'Tutup' : 'Nav'}</span>
            </button>

            <button
              onClick={onClose}
              className="bg-white text-[#5AB2FF] px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-lg sm:rounded-xl font-black text-[9px] sm:text-xs md:text-sm uppercase tracking-wider hover:bg-blue-50 transition-all shadow-md active:scale-95 shrink-0"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>

      {/* Main CBT Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left: Question Area */}
        <div className={`flex-1 flex flex-col transition-all duration-500 ${
          scaleMode === 'kecil' ? 'p-1.5 sm:p-2 md:p-3 xl:p-4' : 'p-2 sm:p-4 md:p-8'
        }`}>
          <div className={`w-full mx-auto transition-all duration-500 h-full flex flex-col ${
            scaleMode === 'kecil' ? 'space-y-2 md:space-y-3' : 'space-y-4 md:space-y-6'
          } max-w-[1440px]`}>
            {/* Question Card */}
            <div className={`bg-white rounded-2xl shadow-xl shadow-blue-900/5 border border-slate-200 overflow-hidden flex flex-col transition-all duration-500 flex-1 min-h-0`}>
              
              <div className={`border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0 ${
                scaleMode === 'kecil' ? 'bg-slate-50 px-3 md:px-6 py-2 md:py-3' : 'bg-slate-50 px-4 md:px-8 py-3 md:py-4'
              }`}>
                <div className="flex items-center space-x-2 md:space-x-3 min-w-0">
                  <span className="bg-[#5AB2FF] text-white w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center font-black text-base md:text-lg shadow-md shrink-0">
                    {currentQuestionIdx + 1}
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[#5AB2FF] font-black text-[10px] uppercase tracking-[0.2em] leading-none mb-1 line-clamp-1">
                      {MOCK_SUBJECTS.find(s => s.id === sumatif.subjectId)?.name || 'Mata Pelajaran'}
                    </span>
                    <span className="text-slate-600 font-bold text-xs md:text-sm uppercase tracking-wider leading-none line-clamp-1">
                      Soal {currentQuestionIdx + 1} dari {questions.length}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                  {/* Font Size Selector directly inside Question Card Header for Pembahasan */}
                  <div className="flex items-center space-x-1 bg-slate-200/60 rounded-xl p-0.5 md:p-1 border border-slate-200 shrink-0 scale-90 sm:scale-100">
                    <button
                      type="button"
                      onClick={() => handleSetScaleMode('kecil')}
                      className={`p-1 md:p-1.5 rounded-md md:rounded-lg transition-all flex items-center justify-center ${
                        scaleMode === 'kecil' 
                          ? 'bg-white text-[#5AB2FF] shadow-sm' 
                          : 'text-slate-600 hover:bg-slate-300/50'
                      }`}
                      title="Ukuran Font Kecil"
                    >
                      <Type size={12} className="shrink-0" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetScaleMode('normal')}
                      className={`p-1 md:p-1.5 rounded-md md:rounded-lg transition-all flex items-center justify-center ${
                        scaleMode === 'normal' 
                          ? 'bg-white text-[#5AB2FF] shadow-sm' 
                          : 'text-slate-600 hover:bg-slate-300/50'
                      }`}
                      title="Ukuran Font Normal (Meningkat 30% Lebih Besar)"
                    >
                      <Type size={16} className="shrink-0" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetScaleMode('besar')}
                      className={`p-1 md:p-1.5 rounded-md md:rounded-lg transition-all flex items-center justify-center ${
                        scaleMode === 'besar' 
                          ? 'bg-white text-[#5AB2FF] shadow-sm' 
                          : 'text-slate-600 hover:bg-slate-300/50'
                      }`}
                      title="Ukuran Font Besar"
                    >
                      <Type size={20} className="shrink-0" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    className="flex items-center space-x-1.5 md:space-x-2 px-2.5 md:px-4 py-1.5 md:py-2 bg-slate-200 hover:bg-slate-300 active:scale-95 text-slate-700 rounded-xl font-bold text-[10px] md:text-sm transition-all cursor-pointer shadow-sm border border-slate-200 shrink-0"
                    title="Kembali ke Halaman Utama"
                  >
                    <ArrowLeft size={14} className="md:w-4 md:h-4 shrink-0" />
                    <span>Kembali</span>
                  </button>
                </div>
              </div>

              {/* Question Content */}
              <div className={`flex-1 overflow-y-auto scrollbar-hide ${
                scaleMode === 'kecil' ? 'p-2 md:p-5 xl:p-6 landscape:p-3' : 'p-3 md:p-8 landscape:p-4'
              } ${
                (currentQuestion.imageUrl && currentQuestion.imageUrl.trim() !== '')
                  ? 'grid grid-cols-1 md:grid-cols-2 landscape:grid-cols-2 gap-3 md:gap-10 landscape:gap-6 items-start'
                  : 'flex flex-col max-w-3xl mx-auto w-full'
              }`}>
                {/* Left Side: Image & Description */}
                {currentQuestion.imageUrl && currentQuestion.imageUrl.trim() !== '' && (
                  <div className={scaleMode === 'kecil' ? 'space-y-3' : 'space-y-6'}>
                    {currentQuestion.imageUrl && (currentQuestion.imageUrl.startsWith('http') || currentQuestion.imageUrl.startsWith('data:image/') || currentQuestion.imageUrl.startsWith('/')) ? (
                      <div className={scaleMode === 'kecil' ? 'space-y-2' : 'space-y-4'}>
                        <div className={`rounded-2xl overflow-hidden border border-slate-100 shadow-sm flex justify-center bg-slate-50 relative group ${
                          scaleMode === 'kecil' ? 'max-h-[280px]' : 'max-h-[500px]'
                        }`}>
                          <div className="p-3 absolute top-0 right-0 z-10 opacity-0 group-hover:opacity-100 transition-all flex space-x-2">
                            <button onClick={() => setZoomScale(prev => Math.min(prev + 0.2, 3))} className="w-8 h-8 md:w-10 md:h-10 bg-white shadow-xl rounded-xl flex items-center justify-center text-slate-600 hover:text-[#5AB2FF] hover:scale-110"><ZoomIn size={18} /></button>
                            <button onClick={() => setZoomScale(prev => Math.max(prev - 0.2, 0.5))} className="w-8 h-8 md:w-10 md:h-10 bg-white shadow-xl rounded-xl flex items-center justify-center text-slate-600 hover:text-[#5AB2FF] hover:scale-110"><ZoomOut size={18} /></button>
                            <button onClick={() => setZoomScale(1)} className="w-8 h-8 md:w-10 md:h-10 bg-white shadow-xl rounded-xl flex items-center justify-center text-slate-600 hover:text-[#5AB2FF] hover:scale-110 font-bold text-xs">R</button>
                          </div>
                          <div className="flex-1 w-full flex items-center justify-center p-3 overflow-auto scrollbar-hide">
                            <img 
                              src={currentQuestion.imageUrl} 
                              alt="Question" 
                              style={{ 
                                transform: `scale(${zoomScale})`, 
                                transformOrigin: 'center center', 
                                transition: 'transform 0.2s ease-out',
                                imageRendering: 'high-quality' as any,
                                ['WebkitImageRendering' as any]: '-webkit-optimize-contrast'
                              }}
                              className={`max-w-full object-contain cursor-grab active:cursor-grabbing ${
                                scaleMode === 'kecil' ? 'max-h-[240px]' : 'max-h-[400px]'
                              }`}
                              referrerPolicy="no-referrer"
                              onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                            />
                          </div>
                        </div>
                        {currentQuestion.imageCaption && (
                          <p className="text-center text-xs italic text-slate-400">{currentQuestion.imageCaption}</p>
                        )}
                      </div>
                    ) : currentQuestion.imageUrl ? (
                      <div className={`p-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-700 leading-relaxed whitespace-pre-wrap font-medium ${adaptiveFontSize}`}>
                        {renderFormattedText(currentQuestion.imageUrl)}
                      </div>
                    ) : null}
                  </div>
                )}
                
                {/* Right Side / Content Flow */}
                <div className="flex flex-col w-full">
                  <div className={`text-slate-800 font-medium leading-relaxed whitespace-pre-wrap break-words w-full min-w-0 ${adaptiveFontSize} ${
                    scaleMode === 'kecil' ? 'mb-4 md:mb-5' : 'mb-6 md:mb-8'
                  }`}>
                    {renderFormattedText(currentQuestion.text)}
                  </div>

                  <div className={scaleMode === 'kecil' ? 'space-y-2 w-full' : 'space-y-4 w-full'}>
                  {(currentQuestion.type === 'pg' || currentQuestion.type === 'pgk') && (currentQuestion.options || []).filter((opt: any) => (opt.text && opt.text.trim() !== "") || (opt.imageUrl && opt.imageUrl.trim() !== "")).map((opt: any, idx: number) => {
                    const isCorrect = currentQuestion.correctAnswer && (Array.isArray(currentQuestion.correctAnswer) ? currentQuestion.correctAnswer.includes(opt.id) : currentQuestion.correctAnswer === opt.id);
                    return (
                      <div
                        key={opt.id}
                        className={`w-full rounded-xl border-2 text-left flex items-center relative overflow-hidden ${
                          scaleMode === 'kecil' ? 'p-2 md:p-2.5 space-x-3' : 'p-3 md:p-4 space-x-3 md:space-x-4'
                        } ${
                          isCorrect
                            ? 'border-green-500 bg-green-50 z-10'
                            : 'border-slate-100 bg-white'
                        }`}
                      >
                        <div className={`rounded-lg flex items-center justify-center font-black shrink-0 ${
                          scaleMode === 'kecil' ? 'w-8 h-8 text-sm' : 'w-8 h-8 md:w-10 md:h-10 text-base'
                        } ${
                          isCorrect
                            ? 'bg-green-500 text-white shadow-lg shadow-green-200'
                            : 'bg-slate-100 text-slate-400'
                        }`}>
                          {currentQuestion.type === 'pg' ? String.fromCharCode(65 + idx) : (isCorrect ? <Check size={scaleMode === 'kecil' ? 14 : 18} /> : '')}
                        </div>
                        <div className="flex-1 flex items-center space-x-3 md:space-x-4 pr-16 md:pr-24">
                          {opt.imageUrl && (opt.imageUrl.startsWith('http') || opt.imageUrl.startsWith('data:image/') || opt.imageUrl.startsWith('/')) ? (
                            <div className={`rounded-lg overflow-hidden border border-slate-100 shrink-0 bg-slate-50 ${
                              scaleMode === 'kecil' ? 'w-12 h-12 md:w-16 md:h-16' : 'w-16 h-16 md:w-20 md:h-20'
                            }`}>
                              <img src={opt.imageUrl} alt={`Option ${idx}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                            </div>
                          ) : opt.imageUrl ? (
                            <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-slate-700 leading-relaxed whitespace-pre-wrap font-medium text-xs">
                              {opt.imageUrl.replace(/<br\s*\/?>/gi, '\n').replace(/\\n/g, '\n')}
                            </div>
                          ) : null}
                          {opt.text && !opt.text.startsWith('http') && !opt.text.startsWith('data:image/') && (
                            <span className={`font-bold ${
                              scaleMode === 'kecil' 
                                ? 'text-[10px] md:text-xs' 
                                : scaleMode === 'besar'
                                  ? 'text-base md:text-lg'
                                  : 'text-xs md:text-sm'
                            } ${isCorrect ? 'text-green-800' : 'text-slate-600'}`}>
                              {opt.text}
                            </span>
                          )}
                        </div>
                        {isCorrect && (
                          <div className={`absolute top-1/2 -translate-y-1/2 text-green-500 flex flex-col items-center ${
                            scaleMode === 'kecil' ? 'right-2' : 'right-2 md:right-4'
                          }`}>
                            <CheckCircle size={scaleMode === 'kecil' ? 16 : 20} className="md:w-6 md:h-6" />
                            <span className="text-[7px] md:text-[10px] font-bold mt-0.5 uppercase text-center leading-none">Jawaban<br className="md:hidden"/> Benar</span>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {currentQuestion.type === 'bs' && (
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm overflow-x-auto w-full">
                      <table className="w-full text-left border-collapse min-w-[340px]">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200">
                            <th className={`font-black text-slate-400 uppercase tracking-widest leading-none ${
                              scaleMode === 'kecil' ? 'px-4 py-2.5 text-[9px]' : 'px-4 md:px-6 py-3 md:py-4 text-[10px]'
                            }`}>Pernyataan Jawaban</th>
                            <th className={`font-black text-slate-400 uppercase tracking-widest transition-all text-center ${
                              scaleMode === 'kecil' ? 'px-2 py-2.5 text-[9px] w-16' : 'px-2 md:px-4 py-3 md:py-4 text-[10px] w-16 md:w-20'
                            }`}>Benar</th>
                            <th className={`font-black text-slate-400 uppercase tracking-widest transition-all text-center ${
                              scaleMode === 'kecil' ? 'px-2 py-2.5 text-[9px] w-16' : 'px-2 md:px-4 py-3 md:py-4 text-[10px] w-16 md:w-20'
                            }`}>Salah</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(currentQuestion.subQuestions || []).map((sq: any) => {
                            const correctAns = sq.correctAnswer || (currentQuestion.correctAnswer && typeof currentQuestion.correctAnswer === 'object' && !Array.isArray(currentQuestion.correctAnswer) ? currentQuestion.correctAnswer[sq.id] : undefined);
                            return (
                              <tr key={sq.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className={scaleMode === 'kecil' ? 'px-4 py-2.5' : 'px-4 md:px-6 py-3 md:py-4'}>
                                  <div className="space-y-2">
                                    {sq.imageUrl && (sq.imageUrl.startsWith('http') || sq.imageUrl.startsWith('data:image/') || sq.imageUrl.startsWith('/')) ? (
                                      <div className="rounded-lg overflow-hidden border border-slate-100 max-h-[80px] inline-block">
                                        <img src={sq.imageUrl} alt="Statement" className="max-w-full h-auto object-contain" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                      </div>
                                    ) : sq.imageUrl ? (
                                      <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-slate-700 leading-relaxed whitespace-pre-wrap font-medium text-xs">
                                        {sq.imageUrl.replace(/<br\s*\/?>/gi, '\n').replace(/\\n/g, '\n')}
                                      </div>
                                    ) : null}
                                    <p className={`font-bold text-slate-700 leading-tight whitespace-pre-wrap ${
                                      scaleMode === 'kecil' 
                                        ? 'text-[10px] md:text-xs' 
                                        : scaleMode === 'besar'
                                          ? 'text-base md:text-lg'
                                          : 'text-xs md:text-sm'
                                    }`}>
                                      {renderFormattedText(sq.text)}
                                    </p>
                                  </div>
                                </td>
                                <td className={`text-center border-l border-slate-100 ${scaleMode === 'kecil' ? 'px-2 py-2.5' : 'px-2 md:px-4 py-3 md:py-4'}`}>
                                  <div className={`rounded-full border-2 transition-all flex items-center justify-center mx-auto ${
                                      scaleMode === 'kecil' ? 'w-8 h-8' : 'w-8 h-8 md:w-10 md:h-10'
                                    } ${
                                      correctAns === 'Benar'
                                        ? 'border-green-500 bg-green-500 text-white shadow-lg shadow-green-100'
                                        : 'border-slate-200 text-slate-300'
                                    }`}>
                                    <Check size={scaleMode === 'kecil' ? 14 : 16} />
                                  </div>
                                </td>
                                <td className={`text-center border-l border-slate-100 ${scaleMode === 'kecil' ? 'px-2 py-2.5' : 'px-2 md:px-4 py-3 md:py-4'}`}>
                                  <div className={`rounded-full border-2 transition-all flex items-center justify-center mx-auto ${
                                      scaleMode === 'kecil' ? 'w-8 h-8' : 'w-8 h-8 md:w-10 md:h-10'
                                    } ${
                                      correctAns === 'Salah'
                                        ? 'border-red-500 bg-red-500 text-white shadow-lg shadow-red-100'
                                        : 'border-slate-200 text-slate-300'
                                    }`}>
                                    <X size={scaleMode === 'kecil' ? 14 : 16} />
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {currentQuestion.type === 'uraian' && (
                    <div className="w-full">
                      <div className={`bg-green-50 border-2 border-green-500 rounded-2xl relative shadow-sm ${
                        scaleMode === 'kecil' ? 'p-3 md:p-4' : 'p-6'
                      }`}>
                        <div className="absolute -top-3 left-6 bg-green-500 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center shadow-md">
                          <CheckCircle size={10} className="mr-1" /> Kunci Jawaban / Referensi
                        </div>
                        <div className={`text-green-800 font-bold whitespace-pre-wrap leading-relaxed mt-2 italic ${
                          scaleMode === 'kecil' 
                            ? 'text-[10px] md:text-xs' 
                            : scaleMode === 'besar'
                              ? 'text-base md:text-lg'
                              : 'text-xs md:text-sm'
                        }`}>
                          {currentQuestion.correctAnswer || 'Tidak ada referensi jawaban'}
                        </div>
                      </div>
                    </div>
                  )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Controls */}
            <div className={`bg-white rounded-2xl shadow-xl shadow-blue-900/5 border border-slate-200 p-3 md:p-4 xl:p-6 flex items-center justify-between transition-all duration-500 shrink-0`}>
              <button
                disabled={currentQuestionIdx === 0}
                onClick={handlePrev}
                className="flex items-center space-x-1 md:space-x-2 px-3 md:px-4 xl:px-6 py-2 md:py-3 xl:py-4 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all disabled:opacity-50 disabled:hover:bg-slate-100 text-xs md:text-sm xl:text-base"
              >
                <ChevronLeft size={18} className="md:w-5 md:h-5" />
                <span>Sebelumnya</span>
              </button>

              <div className="font-bold text-slate-500 text-xs md:text-sm px-2 text-center">
                Soal <br className="sm:hidden" /> {currentQuestionIdx + 1} / {questions.length}
              </div>

              <button
                disabled={currentQuestionIdx === questions.length - 1}
                onClick={handleNext}
                className="flex items-center space-x-1 md:space-x-2 px-3 md:px-4 xl:px-6 py-2 md:py-3 xl:py-4 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all disabled:opacity-50 disabled:hover:bg-slate-100 text-xs md:text-sm xl:text-base"
              >
                <span>Selanjutnya</span>
                <ChevronRight size={18} className="md:w-5 md:h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Navigation Grid */}
        <div className={`bg-white border-l border-slate-200 flex flex-col shadow-2xl z-50 transition-all duration-500 overflow-hidden shrink-0 absolute md:relative right-0 h-full ${showNavigation ? 'w-64 md:w-80 opacity-100' : 'w-0 opacity-0 border-none pointer-events-none'}`}>
          <div className="w-64 md:w-80 flex flex-col h-full">
            <div className="p-4 md:p-6 border-b border-slate-100 bg-slate-50 flex-1 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Navigasi Soal</h3>
                <button
                  type="button"
                  onClick={() => setShowNavigation(false)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-200/50 hover:text-slate-600 transition-all"
                  title="Sembunyikan Navigasi"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="grid grid-cols-5 gap-1.5 md:gap-2">
                {questions.map((q: Question, idx: number) => (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestionIdx(idx)}
                    className={`w-full aspect-square rounded-lg md:rounded-xl font-bold text-xs md:text-sm transition-all flex items-center justify-center relative overflow-hidden group border-2 ${
                      currentQuestionIdx === idx
                        ? 'border-[#5AB2FF] bg-blue-50 text-[#5AB2FF]'
                        : 'border-slate-100 bg-white text-slate-600 hover:border-[#5AB2FF]/30'
                    }`}
                  >
                    <span className="relative z-10">{idx + 1}</span>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="p-4 md:p-6 border-t border-slate-100 bg-white flex flex-col space-y-2 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 bg-[#5AB2FF] hover:bg-[#4A9FE6] active:scale-95 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center space-x-2 shadow-lg shadow-blue-200 cursor-pointer"
              >
                <ArrowLeft size={16} />
                <span>Tutup Pembahasan</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- MANUAL GRADING COMPONENT ---
const SumatifManualGrading: React.FC<{
  sumatif: Sumatif,
  result: SumatifResult,
  student: Student,
  onSave: (manualScores: Record<string, number>, finalScore: number) => void,
  onClose: () => void
}> = ({ sumatif, result, student, onSave, onClose }) => {
  const [manualScores, setManualScores] = useState<Record<string, number>>(result.manualScores || {});
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  
  const essayQuestions = sumatif.questions.filter(q => q.type === 'uraian');
  const currentQuestion = essayQuestions[currentQuestionIdx];
  const isLastQuestion = currentQuestionIdx === essayQuestions.length - 1;

  const handleSave = () => {
    // Recalculate total score
    let totalPoints = 0;
    let earnedPoints = 0;

    sumatif.questions.forEach(q => {
      const qPoints = Number(q.points) || 0;
      totalPoints += qPoints;
      
      if (q.type === 'pg' || q.type === 'pgk' || q.type === 'bs') {
        if (checkCorrect(q, result.answers[q.id])) {
          earnedPoints += qPoints;
        }
      } else if (q.type === 'uraian') {
        earnedPoints += (manualScores[q.id] || 0);
      }
    });

    const finalScore = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    onSave(manualScores, finalScore);
  };

  if (!currentQuestion) return null;

  return (
    <div className="fixed inset-0 z-[10000] bg-slate-100/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-[#5AB2FF]">
              <Edit2 size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Koreksi Jawaban Uraian</h2>
              <p className="text-sm text-slate-500">{student.name} • {sumatif.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-10 scrollbar-hide flex flex-col">
          <div className="space-y-6 pb-10 flex-col flex-1">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <span className="w-8 h-8 bg-[#5AB2FF] text-white rounded-lg flex items-center justify-center font-bold text-sm">
                  Soal {currentQuestionIdx + 1} / {essayQuestions.length}
                </span>
                <h3 className="font-bold text-slate-700">Pertanyaan Uraian</h3>
              </div>
              <div className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-400 uppercase tracking-widest">
                Bobot: {currentQuestion.points} Poin
              </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 italic text-slate-600 leading-relaxed whitespace-pre-wrap">
              {currentQuestion.imageUrl && (currentQuestion.imageUrl.startsWith('http') || currentQuestion.imageUrl.startsWith('data:image/') || currentQuestion.imageUrl.startsWith('/')) ? (
                <img src={currentQuestion.imageUrl} alt="Question" className="max-w-full h-auto max-h-[300px] rounded-lg mb-4 border border-slate-200 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              ) : currentQuestion.imageUrl ? (
                <div className="p-4 bg-white border border-slate-200 rounded-xl text-slate-700 not-italic mb-4">
                  {currentQuestion.imageUrl.replace(/<br\s*\/?>/gi, '\n').replace(/\\n/g, '\n')}
                </div>
              ) : null}
              {currentQuestion.text}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center">
                  <UserIcon size={14} className="mr-2" /> Jawaban Siswa
                </h4>
                <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100 text-slate-700 min-h-[150px] whitespace-pre-wrap font-medium">
                  {result.answers[currentQuestion.id] || <span className="text-slate-400 italic">Siswa tidak menjawab</span>}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center">
                  <CheckCircle size={14} className="mr-2" /> Kunci Jawaban / Referensi
                </h4>
                <div className="p-6 bg-green-50/50 rounded-2xl border border-green-100 text-slate-700 min-h-[150px] whitespace-pre-wrap">
                  {currentQuestion.correctAnswer || <span className="text-slate-400 italic">Tidak ada kunci jawaban</span>}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 flex items-center justify-between border border-slate-100 shadow-inner">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-white rounded-xl shadow-sm">
                  <BarChart2 size={20} className="text-[#5AB2FF]" />
                </div>
                <div>
                  <span className="block text-xs font-black text-slate-400 uppercase tracking-widest">Input Penilaian</span>
                  <span className="text-[10px] text-slate-500">Berikan nilai antara 0 sampai {currentQuestion.points}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max={currentQuestion.points}
                    value={manualScores[currentQuestion.id] === undefined || manualScores[currentQuestion.id] === 0 ? '' : manualScores[currentQuestion.id]}
                    placeholder="0"
                    onChange={e => {
                      const inputStr = e.target.value;
                      const val = inputStr === '' ? 0 : Math.min(Math.max(0, parseInt(inputStr) || 0), currentQuestion.points);
                      setManualScores(prev => ({ ...prev, [currentQuestion.id]: val }));
                    }}
                    className="w-24 px-4 py-3 bg-white rounded-xl border-2 border-[#5AB2FF] focus:ring-4 focus:ring-blue-100 outline-none text-center font-black text-xl text-[#5AB2FF] transition-all"
                  />
                  <span className="absolute -top-2 -right-2 bg-[#5AB2FF] text-white text-[8px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                    /{currentQuestion.points}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between shrink-0">
            <button
              onClick={() => setCurrentQuestionIdx(Math.max(0, currentQuestionIdx - 1))}
              disabled={currentQuestionIdx === 0}
              className={`px-6 py-3 rounded-2xl font-bold transition-all flex items-center space-x-2 ${currentQuestionIdx === 0 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-500 hover:bg-slate-200'}`}
            >
              <ArrowRight size={20} className="rotate-180" />
              <span>Sebelumnya</span>
            </button>
            <div className="flex space-x-4">
              {isLastQuestion ? (
                <button
                  onClick={handleSave}
                  className="px-8 py-3 rounded-2xl font-black bg-[#5AB2FF] text-white hover:bg-[#4A9FE6] shadow-lg shadow-blue-100 transition-all active:scale-95 flex items-center space-x-2"
                >
                  <Save size={20} />
                  <span>Simpan Semua</span>
                </button>
              ) : (
                <button
                  onClick={() => setCurrentQuestionIdx(currentQuestionIdx + 1)}
                  className="px-8 py-3 rounded-2xl font-black bg-slate-800 text-white hover:bg-slate-700 shadow-lg transition-all active:scale-95 flex items-center space-x-2"
                >
                  <span>Selanjutnya</span>
                  <ArrowRight size={20} />
                </button>
              )}
            </div>
        </div>
      </div>
    </div>
  );
};

// --- STUDENT RESULT PRINT COMPONENT ---
const SumatifStudentResultPrint: React.FC<{
  sumatif: Sumatif,
  result: SumatifResult,
  student: Student,
  onClose: () => void
}> = ({ sumatif, result, student, onClose }) => {
  const subject = MOCK_SUBJECTS.find(s => s.id === sumatif.subjectId);

  const [isGenerating, setIsGenerating] = useState(false);

  const startTime = result.createdAt || result.startedAt || (result as any).created_at;
  const durationStr = result.submittedAt && startTime 
    ? `${Math.round((new Date(result.submittedAt).getTime() - new Date(startTime).getTime()) / 60000)} Menit`
    : '-';

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    document.body.classList.add('pdf-generating');
    
    // Give browser a short window to apply styles and recalculate 1:1 layouts
    await new Promise(resolve => setTimeout(resolve, 300));
    
    try {
      const pages = document.querySelectorAll('.pdf-page-container');
      if (!pages.length) {
        setIsGenerating(false);
        document.body.classList.remove('pdf-generating');
        return;
      }

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i] as HTMLElement;
        
        const canvas = await html2canvas(page, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: 794 // 210mm at 96dpi
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        
        if (i > 0) {
          pdf.addPage();
        }

        // Exact proportions to fit A4 page perfectly
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      }

      pdf.save(`Hasil_${sumatif.title}_${student.name}.pdf`.replace(/\s+/g, '_'));
    } catch (err) {
      console.error('Gagal mengunduh PDF:', err);
    } finally {
      document.body.classList.remove('pdf-generating');
      setIsGenerating(false);
    }
  };

  // Group questions into pages: Page 1 gets 2 questions, others get 3
  const firstPageQuestions = sumatif.questions.slice(0, 2);
  const remainingQuestions = sumatif.questions.slice(2);
  const questionPages = [firstPageQuestions];
  for (let i = 0; i < remainingQuestions.length; i += 3) {
    questionPages.push(remainingQuestions.slice(i, i + 3));
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      {isGenerating && (
        <div className="absolute inset-0 bg-white/90 backdrop-blur-md z-[110] flex flex-col items-center justify-center space-y-4 rounded-2xl">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
          <p className="text-slate-800 font-bold text-lg">Sedang Mengunduh PDF...</p>
          <p className="text-slate-500 text-sm">Dokumen sedang diproses...</p>
        </div>
      )}
      <style>{`
        .pdf-page-container {
          width: 210mm;
          height: 297mm;
          background: white;
          margin: 0 auto 20px auto;
          padding: 15mm;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
          position: relative;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          page-break-after: always;
          overflow: hidden;
          text-rendering: optimizeLegibility;
          -webkit-font-smoothing: antialiased;
          font-variant-ligatures: none;
        }
        .pdf-page-container * {
          letter-spacing: normal !important;
          word-spacing: normal !important;
        }
        body.pdf-generating .pdf-scale-wrapper {
          transform: none !important;
          scale: none !important;
        }
        @media print {
          .pdf-page-container {
            margin: 0;
            box-shadow: none;
            width: 100%;
            height: 100vh;
            padding: 15mm;
          }
        }
      `}</style>
      <div className="bg-white w-full max-w-5xl max-h-[95vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden relative">
        {/* Header (No Print) */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 no-print shrink-0">
          <div>
            <h3 className="font-bold text-slate-700">Lembar Jawaban Siswa</h3>
            <p className="text-xs text-slate-500">Preview cetak PDF (A4)</p>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={handleDownloadPDF}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold flex items-center space-x-2 hover:bg-indigo-700 transition-all shadow-md active:scale-95"
            >
              <FileText size={18} />
              <span>Unduh PDF</span>
            </button>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-500">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="overflow-y-auto flex-1 p-4 bg-slate-100 print:bg-white print:p-0">
          <PrintLayout>
            <div className="pdf-scale-wrapper flex flex-col items-center min-w-max sm:min-w-0 origin-top scale-[0.45] xs:scale-[0.55] sm:scale-[0.75] md:scale-[0.9] lg:scale-100 print:scale-100">
              <div id="print-area" className="w-[210mm] text-slate-800 text-sm flex flex-col items-center">
                {questionPages.map((questions, pageIdx) => (
                <div key={pageIdx} className="pdf-page-container">
                  {pageIdx === 0 && (
                    <>
                      <h1 className="text-2xl font-black text-center uppercase tracking-widest">Assement Sumatif</h1>
                      <h2 className="text-lg font-bold text-center mb-8 uppercase text-slate-600">{sumatif.title}</h2>
                      
                      <div className="grid grid-cols-[1.3fr_0.7fr_1fr] gap-4 mb-8">
                        <div className="space-y-2 text-sm">
                          <div className="flex"><span className="w-24 font-bold shrink-0">NAMA</span><span className="mr-2">:</span><span className="uppercase">{student?.name}</span></div>
                          <div className="flex"><span className="w-24 font-bold shrink-0">KELAS</span><span className="mr-2">:</span><span className="uppercase">{sumatif.classId}</span></div>
                          <div className="flex"><span className="w-24 font-bold shrink-0">MAPEL</span><span className="mr-2">:</span><span className="uppercase">{subject?.name || sumatif.subjectId}</span></div>
                          <div className="flex"><span className="w-24 font-bold shrink-0">DURASI</span><span className="mr-2">:</span><span>{durationStr}</span></div>
                        </div>
                        
                        <div className="flex flex-col items-center justify-center gap-2">
                          <span className="font-black text-xl text-slate-800">NILAI</span>
                          <span className="font-black text-4xl bg-indigo-100 text-indigo-800 px-8 py-3 rounded-xl border border-indigo-200 shadow-sm">{result.score}</span>
                        </div>

                        <div className="flex flex-col gap-4 items-end">
                          <div className="w-48 text-center">
                            <p className="font-bold text-xs mb-10">Tanda Tangan Guru</p>
                            <div className="border-b border-black"></div>
                          </div>
                          <div className="w-48 text-center">
                            <p className="font-bold text-xs mb-10">Tanda Tangan Orang Tua</p>
                            <div className="border-b border-black"></div>
                          </div>
                        </div>
                      </div>
                      <div className="border-t-2 border-black pt-4 mb-4">
                        <h2 className="font-bold text-lg">Hasil Pekerjaan Siswa</h2>
                      </div>
                    </>
                  )}

                  {pageIdx > 0 && (
                    <div className="flex justify-between items-center mb-6 border-b pb-2 text-slate-400 text-xs italic">
                      <span>{sumatif.title} - {student.name}</span>
                      <span>Halaman {pageIdx + 1}</span>
                    </div>
                  )}

                  <div className="space-y-6 flex-1">
                    {questions.map((q) => {
                      const absoluteIdx = sumatif.questions.findIndex(sq => sq.id === q.id);
                      const studentAnswer = result.answers[q.id];
                      let isCorrect = false;
                      let studentAnswerText = studentAnswer;
                      let correctAnswerText = '';

                      if (q.type === 'pg') {
                        isCorrect = studentAnswer === q.correctAnswer;
                        const studentOpt = q.options?.find(o => o.id === studentAnswer);
                        const correctOpt = q.options?.find(o => o.id === q.correctAnswer);
                        studentAnswerText = studentOpt?.text || studentAnswer || '-';
                        correctAnswerText = correctOpt?.text || q.correctAnswer || '-';
                      } else if (q.type === 'pgk') {
                        const studentAnswersArr = Array.isArray(studentAnswer) ? studentAnswer : [];
                        const correctAnswersArr = Array.isArray(q.correctAnswer) ? q.correctAnswer : [];
                        isCorrect = studentAnswersArr.length === correctAnswersArr.length && 
                                    studentAnswersArr.every(a => correctAnswersArr.includes(a));
                        
                        studentAnswerText = studentAnswersArr.map(id => q.options?.find(o => o.id === id)?.text).filter(Boolean).join(', ') || '-';
                        correctAnswerText = correctAnswersArr.map(id => q.options?.find(o => o.id === id)?.text).filter(Boolean).join(', ') || '-';
                      } else if (q.type === 'bs') {
                        const subAnswers = studentAnswer || {};
                        const subQuestions = q.subQuestions || [];
                        
                        let allCorrect = true;
                        const studentTextArr: string[] = [];
                        const correctTextArr: string[] = [];
                        
                        subQuestions.forEach((sq, i) => {
                          const ans = subAnswers[sq.id];
                          const correct = sq.correctAnswer;
                          if (ans !== correct) allCorrect = false;
                          studentTextArr.push(`${i + 1}. ${ans || '-'}`);
                          correctTextArr.push(`${i + 1}. ${correct}`);
                        });
                        
                        isCorrect = allCorrect;
                        studentAnswerText = studentTextArr.join('\n');
                        correctAnswerText = correctTextArr.join('\n');
                      } else if (q.type === 'uraian') {
                        isCorrect = (result.manualScores?.[q.id] || 0) > 0;
                        studentAnswerText = studentAnswer || '-';
                        correctAnswerText = q.correctAnswer ? String(q.correctAnswer) : '-';
                      }

                      return (
                        <div key={q.id} className="border-b border-slate-100 pb-4 break-inside-avoid avoid-break">
                          <div className="flex gap-4">
                            <div className="font-bold w-6">{absoluteIdx + 1}.</div>
                            <div className="flex-1 space-y-2">
                              {q.imageUrl && (q.imageUrl.startsWith('http') || q.imageUrl.startsWith('data:image/') || q.imageUrl.startsWith('/')) ? (
                                <img src={q.imageUrl} alt="Question" className="max-w-[30%] h-auto max-h-[150px] rounded-lg my-1 border border-slate-200 object-contain" />
                              ) : null}
                              <div dangerouslySetInnerHTML={{ __html: q.text.replace(/<img[^>]*>/g, '') }} className="prose prose-sm max-w-none whitespace-pre-wrap font-medium" />
                              
                              <div className="flex mt-2 items-start text-[11px]">
                                <div className="w-[42%] pr-2">
                                  <div className="font-bold text-slate-500 mb-0.5">Jawaban:</div>
                                  <div className={`p-1.5 rounded border whitespace-pre-wrap ${isCorrect ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                                    {studentAnswerText}
                                  </div>
                                </div>
                                <div className="w-[42%] px-2 border-l border-slate-200">
                                  <div className="font-bold text-slate-500 mb-0.5">Kunci:</div>
                                  <div className="p-1.5 bg-slate-50 rounded border border-slate-200 text-slate-700 whitespace-pre-wrap">
                                    {correctAnswerText}
                                  </div>
                                </div>
                                <div className="w-[16%] pl-2 border-l border-slate-200">
                                  <div className="font-bold text-slate-500 mb-0.5">Skor:</div>
                                  <div className={`p-1.5 rounded font-bold text-center border ${q.type === 'uraian' ? 'bg-blue-100 text-blue-700 border-blue-300' : isCorrect ? 'bg-green-100 text-green-700 border-green-300' : 'bg-red-100 text-red-700 border-red-300'}`}>
                                    {q.type === 'uraian' ? (result.manualScores?.[q.id] || 0) : (isCorrect ? q.points : 0)}/{q.points || 0}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="mt-4 pt-2 border-t border-slate-100 flex justify-between text-[10px] text-slate-400">
                    <span>Dicetak pada: {format(new Date(), 'dd MMMM yyyy HH:mm', { locale: id })}</span>
                    <span>Halaman {pageIdx + 1} dari {questionPages.length}</span>
                  </div>
                </div>
              ))}
              </div>
            </div>
          </PrintLayout>
        </div>
      </div>
    </div>,
    document.body
  );
};

// --- RESULTS VIEW COMPONENT ---
const SumatifResultsView: React.FC<{
  sumatif: Sumatif,
  results: SumatifResult[],
  students: Student[],
  onBack: () => void,
  onSync: () => void,
  onReset: (studentId: string) => void,
  onSaveGrading: (resultId: string, manualScores: Record<string, number>, finalScore: number) => void
}> = ({ sumatif, results, students, onBack, onSync, onReset, onSaveGrading }) => {
  const [viewMode, setViewMode] = useState<'list' | 'analysis'>('list');
  const [gradingResult, setGradingResult] = useState<SumatifResult | null>(null);
  const [viewingPrintResult, setViewingPrintResult] = useState<SumatifResult | null>(null);

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden relative">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="p-2 hover:bg-white rounded-xl transition-colors text-slate-400">
            <ChevronLeft size={24} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Hasil: {sumatif.title}</h2>
            <p className="text-sm text-slate-500">{results.length} Siswa telah mengerjakan</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex bg-slate-100 p-1 rounded-xl mr-4">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-white text-[#5AB2FF] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Daftar Nilai
            </button>
            <button
              onClick={() => setViewMode('analysis')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'analysis' ? 'bg-white text-[#5AB2FF] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Analisis Soal
            </button>
          </div>
          <button
            onClick={onSync}
            className="flex items-center space-x-2 px-6 py-2.5 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all shadow-md font-bold"
          >
            <Save size={20} />
            <span>Input ke Buku Nilai</span>
          </button>
        </div>
      </div>

      {gradingResult && (
        <SumatifManualGrading 
          sumatif={sumatif}
          result={gradingResult}
          student={students.find(s => s.id === gradingResult.studentId)!}
          onSave={(manualScores, finalScore) => {
            onSaveGrading(gradingResult.id, manualScores, finalScore);
            setGradingResult(null);
          }}
          onClose={() => setGradingResult(null)}
        />
      )}

      {viewingPrintResult && (
        <SumatifStudentResultPrint
          sumatif={sumatif}
          result={viewingPrintResult}
          student={students.find(s => s.id === viewingPrintResult.studentId)!}
          onClose={() => setViewingPrintResult(null)}
        />
      )}

      {viewMode === 'list' ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Siswa</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Skor</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Waktu Selesai</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Status Tes</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {results.map(r => {
                const student = students.find(s => s.id === r.studentId);
                return (
                  <tr key={r.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold">
                          {student?.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">{student?.name || 'Siswa Tidak Ditemukan'}</div>
                          <div className="text-xs text-slate-400">NIS: {student?.nis}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-lg font-bold ${
                        r.score >= 75 ? 'text-green-600' : r.score >= 60 ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        {r.score}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-slate-500">
                      {(r.status_tes === 'selesai' && r.submittedAt) ? format(new Date(r.submittedAt), 'dd MMM yyyy HH:mm', { locale: id }) : '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                        r.status_tes === 'selesai' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {r.status_tes || 'Mulai'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => setViewingPrintResult(r)}
                          className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-all flex items-center space-x-1"
                          title="Lihat Lembar Jawaban"
                        >
                          <Eye size={14} />
                          <span>Lembar Jawaban</span>
                        </button>
                        {sumatif.questions.some(q => q.type === 'uraian') && (
                          <button
                            onClick={() => setGradingResult(r)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
                              r.needsGrading 
                                ? 'bg-amber-100 text-amber-600 hover:bg-amber-200' 
                                : 'bg-green-50 text-green-600 hover:bg-green-100'
                            }`}
                            title="Koreksi Jawaban Uraian"
                          >
                            <Edit2 size={14} />
                            <span>{r.needsGrading ? 'Koreksi' : 'Koreksi Ulang'}</span>
                          </button>
                        )}
                        <button
                          onClick={() => onReset(r.studentId)}
                          className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-all flex items-center space-x-1"
                          title="Reset Hasil Ujian"
                        >
                          <RefreshCw size={14} />
                          <span>Reset</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {results.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">
                    Belum ada data pengerjaan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider sticky left-0 bg-slate-50 z-10">Siswa</th>
                {sumatif.questions.map((_, idx) => (
                  <th key={idx} className="px-3 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">
                    S{idx + 1}
                  </th>
                ))}
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Skor</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Rekomendasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {results.map(r => {
                const student = students.find(s => s.id === r.studentId);
                return (
                  <tr key={r.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-700 sticky left-0 bg-white z-10 border-r border-slate-50">
                      {student?.name || 'Unknown'}
                    </td>
                    {sumatif.questions.map(q => {
                      const isCorrect = checkCorrect(q, r.answers[q.id]);
                      return (
                        <td key={q.id} className="px-3 py-4 text-center">
                          <span className={`font-bold ${isCorrect ? 'text-green-500' : 'text-red-400'}`}>
                            {isCorrect ? '1' : '0'}
                          </span>
                        </td>
                      );
                    })}
                    <td className="px-6 py-4 text-center font-black text-[#5AB2FF]">
                      {r.score}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {(() => {
                        const subject = MOCK_SUBJECTS.find(sub => sub.id === sumatif.subjectId);
                        const kktp = subject?.kkm || 75;
                        const isPass = r.score >= kktp;
                        return (
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                            isPass ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                          }`}>
                            {isPass ? 'Pengayaan' : 'Remidi'}
                          </span>
                        );
                      })()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-50/80 font-bold">
              <tr>
                <td className="px-6 py-4 text-xs uppercase tracking-wider text-slate-500 sticky left-0 bg-slate-50 z-10">Prosentase Benar</td>
                {sumatif.questions.map(q => {
                  const correctCount = results.filter(r => checkCorrect(q, r.answers[q.id])).length;
                  const percentage = results.length > 0 ? Math.round((correctCount / results.length) * 100) : 0;
                  return (
                    <td key={q.id} className="px-3 py-4 text-center text-[#5AB2FF]">
                      {percentage}%
                    </td>
                  );
                })}
                <td className="px-6 py-4"></td>
                <td className="px-6 py-4"></td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-xs uppercase tracking-wider text-slate-500 sticky left-0 bg-slate-50 z-10">Tingkat Kesulitan</td>
                {sumatif.questions.map(q => {
                  const correctCount = results.filter(r => checkCorrect(q, r.answers[q.id])).length;
                  const percentage = results.length > 0 ? (correctCount / results.length) * 100 : 0;
                  
                  // Dynamic Difficulty based on percentage
                  // > 70% = Mudah, 30-70% = Sedang, < 30% = Sulit
                  const difficulty = percentage >= 70 ? 'mudah' : percentage >= 30 ? 'sedang' : 'sulit';
                  
                  return (
                    <td key={q.id} className="px-3 py-4 text-center">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${
                        difficulty === 'mudah' ? 'bg-green-100 text-green-600' :
                        difficulty === 'sulit' ? 'bg-red-100 text-red-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        {difficulty}
                      </span>
                    </td>
                  );
                })}
                <td className="px-6 py-4"></td>
                <td className="px-6 py-4"></td>
              </tr>
            </tfoot>
          </table>
          <div className="p-6 bg-slate-50/30 border-t border-slate-100">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-xs text-slate-500">1 = Benar</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                <span className="text-xs text-slate-500">0 = Salah</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- REUSABLE MODAL COMPONENT ---
const Modal: React.FC<{
  isOpen: boolean;
  title: string;
  message: string;
  type: 'alert' | 'confirm';
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}> = ({ isOpen, title, message, type, onConfirm, onCancel, confirmText = 'OK', cancelText = 'Batal' }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        >
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className={`p-2 rounded-lg ${type === 'confirm' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                <AlertCircle size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-800">{title}</h3>
            </div>
            <p className="text-slate-600 leading-relaxed">{message}</p>
          </div>
          <div className="bg-slate-50 p-4 flex justify-end space-x-3">
            {type === 'confirm' && (
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-2 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition-all"
              >
                {cancelText}
              </button>
            )}
            <button
              type="button"
              onClick={onConfirm}
              className="px-6 py-2 rounded-xl font-bold bg-[#5AB2FF] text-white hover:bg-[#4A9FE6] shadow-md transition-all"
            >
              {confirmText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SumatifView;
