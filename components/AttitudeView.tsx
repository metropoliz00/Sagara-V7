import React, { useState, useEffect, useRef } from 'react';
import { Student, SikapAssessment, KarakterAssessment, DailyKAIHJournal, SIKAP_INDICATORS, KARAKTER_INDICATORS, SikapIndicatorKey, KarakterIndicatorKey } from '../types';
import { MOCK_SUBJECTS } from '../constants';
import { cacheService } from '../src/services/cacheService';
import * as XLSX from 'xlsx';
import { apiService } from '../services/apiService';
import { getLocalISODate, formatDateID } from '../utils/dateUtils';
import Logo7Kaih from './Logo7Kaih';
import { 
  Save, FileSpreadsheet, Printer, Smile, Heart, Loader2, Settings,
  Calendar, CheckCircle2, XCircle, AlertCircle, BarChart3, Filter, Award, Sparkles, RefreshCw, ChevronLeft, ChevronRight, MessageSquare, BookOpen, Layers
} from 'lucide-react';

interface AttitudeViewProps {
  students: Student[];
  initialSikap: SikapAssessment[];
  initialKarakter: KarakterAssessment[];
  onSaveSikap: (studentId: string, assessment: Omit<SikapAssessment, 'studentId' | 'classId'>) => void;
  onSaveKarakter: (studentId: string, assessment: Omit<KarakterAssessment, 'studentId' | 'classId'>) => void;
  onShowNotification: (message: string, type: 'success' | 'error' | 'warning') => void;
  classId: string;
  isReadOnly?: boolean;
}

const AttitudeView: React.FC<AttitudeViewProps> = ({ 
  students, 
  initialSikap, 
  initialKarakter, 
  onSaveSikap, 
  onSaveKarakter, 
  onShowNotification, 
  classId, 
  isReadOnly = false 
}) => {
  const [activeTab, setActiveTab] = useState<'sikap' | 'karakter'>('karakter');
  const [subTabKaih, setSubTabKaih] = useState<'harian' | 'semester'>('harian');
  
  // DPL State
  const [sikapData, setSikapData] = useState<SikapAssessment[]>(initialSikap);
  const [selectedIndicators, setSelectedIndicators] = useState<SikapIndicatorKey[]>(Object.keys(SIKAP_INDICATORS) as SikapIndicatorKey[]);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  
  // DPL Per Mapel & TP State
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(MOCK_SUBJECTS[0]?.id || 'pai');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [materiInput, setMateriInput] = useState<string>('');
  const [tujuanInput, setTujuanInput] = useState<string>('');
  const [savedTopics, setSavedTopics] = useState<any[]>([]);
  
  // KAIH State
  const [selectedDate, setSelectedDate] = useState<string>(getLocalISODate());
  const [dailyJournals, setDailyJournals] = useState<DailyKAIHJournal[]>([]);
  const [semesterJournals, setSemesterJournals] = useState<DailyKAIHJournal[]>([]);
  const [filterStatus, setFilterStatus] = useState<'semua' | 'sudah' | 'belum'>('semua');
  const [isLoadingJournals, setIsLoadingJournals] = useState(false);
  const [isSavingAll, setIsSavingAll] = useState(false);
  
  // Semester Filter State
  const [semesterType, setSemesterType] = useState<'ganjil' | 'genap' | 'kustom'>('ganjil');
  const currentYear = new Date().getFullYear();
  const [startDate, setStartDate] = useState<string>(`${currentYear}-07-01`);
  const [endDate, setEndDate] = useState<string>(`${currentYear}-12-31`);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSikapData(initialSikap);
  }, [initialSikap]);

  // Load DPL indicators config
  useEffect(() => {
    const loadIndicators = async () => {
      try {
        const config = await apiService.getClassConfig(classId);
        if (config.dpl_indicators && Array.isArray(config.dpl_indicators) && config.dpl_indicators.length > 0) {
          setSelectedIndicators(config.dpl_indicators as SikapIndicatorKey[]);
        }
      } catch (error) {
        console.error("Failed to load DPL indicators:", error);
      }
    };
    if (classId) {
      loadIndicators();
    }
  }, [classId]);

  // Helper to validate whether a topic has actual materi / tujuan (excluding dummy 'Observasi DPL')
  const isValidTopic = (t: any) => {
    if (!t) return false;
    const m = (t.materi || '').trim();
    const tj = (t.tujuan || '').trim();
    const isDummyMateri = !m || m === 'Observasi DPL';
    const isDummyTujuan = !tj || tj === 'Observasi DPL';
    return !isDummyMateri || !isDummyTujuan;
  };

  // Load shared learning topics for DPL mapel selection
  useEffect(() => {
    if (!classId) return;
    const sharedKey = `shared_learning_topics_${classId}`;
    const cachedTopics = cacheService.get<any[]>(sharedKey) || [];
    
    // Filter out dummy/empty "Observasi DPL" entries to keep dropdown clean
    const cleanedTopics = cachedTopics.filter(isValidTopic);
    if (cleanedTopics.length !== cachedTopics.length) {
      cacheService.set(sharedKey, cleanedTopics);
    }
    setSavedTopics(cleanedTopics);

    const subjectTopics = cleanedTopics.filter(t => t.subjectId === selectedSubjectId);
    if (subjectTopics.length > 0) {
      if (!selectedTopicId || !subjectTopics.some(t => t.id === selectedTopicId)) {
        setSelectedTopicId(subjectTopics[0].id);
        const m = subjectTopics[0].materi;
        const tj = subjectTopics[0].tujuan;
        setMateriInput((m && m !== 'Observasi DPL') ? m : '');
        setTujuanInput((tj && tj !== 'Observasi DPL') ? tj : '');
      }
    } else {
      setSelectedTopicId('');
      setMateriInput('');
      setTujuanInput('');
    }
  }, [classId, selectedSubjectId]);

  // Handle selecting a topic
  const handleSelectTopic = (topicId: string) => {
    setSelectedTopicId(topicId);
    if (topicId) {
      const found = savedTopics.find(t => t.id === topicId);
      if (found) {
        const m = found.materi;
        const tj = found.tujuan;
        setMateriInput((m && m !== 'Observasi DPL') ? m : '');
        setTujuanInput((tj && tj !== 'Observasi DPL') ? tj : '');
      }
    } else {
      setMateriInput('');
      setTujuanInput('');
    }
  };

  // Helper to sync DPL scores to Formatif Observasi & shared_learning_topics
  const syncDplToFormatif = (updatedSikapList?: SikapAssessment[]) => {
    if (!classId || !selectedSubjectId) return null;
    const currentSikapData = updatedSikapList || sikapData;
    const sharedKey = `shared_learning_topics_${classId}`;
    const allTopics = cacheService.get<any[]>(sharedKey) || [];

    const materi = materiInput.trim();
    const tujuan = tujuanInput.trim();
    const hasTopicDetails = (materi && materi !== 'Observasi DPL') || (tujuan && tujuan !== 'Observasi DPL');

    let topicId = selectedTopicId;

    if (hasTopicDetails) {
      if (!topicId) {
        topicId = `dpl-topic-${selectedSubjectId}-${Date.now()}`;
        setSelectedTopicId(topicId);
      }

      const topicData = {
        id: topicId,
        subjectId: selectedSubjectId,
        materi: materi,
        tujuan: tujuan,
        date: getLocalISODate()
      };

      const existingIdx = allTopics.findIndex(t => t.id === topicId);
      if (existingIdx !== -1) {
        allTopics[existingIdx] = topicData;
      } else {
        allTopics.push(topicData);
      }
      const cleanedTopics = allTopics.filter(isValidTopic);
      cacheService.set(sharedKey, cleanedTopics);
      setSavedTopics(cleanedTopics);
    } else {
      // If materi & tujuan are empty, clean up any dummy entries
      const cleanedTopics = allTopics.filter(isValidTopic);
      cacheService.set(sharedKey, cleanedTopics);
      setSavedTopics(cleanedTopics);
      if (!topicId) {
        topicId = `dpl-general-${selectedSubjectId}`;
      }
    }

    // Save formatted scores for Formatif Observasi
    const scoreKey = `formatif_scores_${topicId}_Observasi`;
    const scoreRecords: Record<string, { score: number; catatan?: string }> = {};

    students.forEach(st => {
      const assessment = currentSikapData.find(s => s.studentId === st.id) || {
        studentId: st.id, classId, keimanan: 0, kewargaan: 0, penalaranKritis: 0, kreativitas: 0, kolaborasi: 0, kemandirian: 0, kesehatan: 0, komunikasi: 0
      };
      const avg = calculateSikapAverage(assessment);
      const scaledScore = avg > 0 ? Math.round(avg * 25) : 0;
      const pred = getSikapPredicate(avg);
      
      scoreRecords[st.id] = {
        score: scaledScore,
        catatan: `DPL Observasi (${selectedSubjectId.toUpperCase()}): ${pred.text}`
      };
    });

    cacheService.set(scoreKey, scoreRecords);
    return topicId;
  };

  // Load Daily KAIH Journals
  const loadDailyJournals = async () => {
    if (!classId) return;
    setIsLoadingJournals(true);
    try {
      const data = await apiService.getDailyKAIHJournals(classId, selectedDate);
      setDailyJournals(data);
    } catch (e) {
      console.error("Failed loading daily KAIH journals:", e);
    } finally {
      setIsLoadingJournals(false);
    }
  };

  // Load Semester KAIH Journals
  const loadSemesterJournals = async () => {
    if (!classId) return;
    setIsLoadingJournals(true);
    try {
      const data = await apiService.getDailyKAIHJournals(classId, undefined, startDate, endDate);
      setSemesterJournals(data);
    } catch (e) {
      console.error("Failed loading semester KAIH journals:", e);
    } finally {
      setIsLoadingJournals(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'karakter' && subTabKaih === 'harian') {
      loadDailyJournals();
    }
  }, [activeTab, subTabKaih, selectedDate, classId]);

  useEffect(() => {
    if (activeTab === 'karakter' && subTabKaih === 'semester') {
      loadSemesterJournals();
    }
  }, [activeTab, subTabKaih, startDate, endDate, classId]);

  // Update semester dates on type change
  const handleSemesterTypeChange = (type: 'ganjil' | 'genap' | 'kustom') => {
    setSemesterType(type);
    const yr = new Date().getFullYear();
    if (type === 'ganjil') {
      setStartDate(`${yr}-07-01`);
      setEndDate(`${yr}-12-31`);
    } else if (type === 'genap') {
      setStartDate(`${yr + 1}-01-01`);
      setEndDate(`${yr + 1}-06-30`);
    }
  };

  // --- DPL Helpers ---
  const getSikapPredicate = (score: number) => {
    if (score >= 3.51) return { text: 'Sangat Baik (SB)', color: 'bg-blue-100 text-blue-800' };
    if (score >= 2.51) return { text: 'Baik (B)', color: 'bg-green-100 text-green-800' };
    if (score >= 1.51) return { text: 'Cukup (C)', color: 'bg-yellow-100 text-yellow-800' };
    if (score >= 1.00) return { text: 'Kurang (K)', color: 'bg-red-100 text-red-800' };
    return { text: '-', color: 'bg-gray-100 text-gray-800' };
  };

  const getStudentSikap = (studentId: string): SikapAssessment => {
    return sikapData.find(s => s.studentId === studentId) || { studentId, classId, keimanan: 0, kewargaan: 0, penalaranKritis: 0, kreativitas: 0, kolaborasi: 0, kemandirian: 0, kesehatan: 0, komunikasi: 0 };
  };

  const updateSikap = (studentId: string, indicator: SikapIndicatorKey, value: number) => {
    setSikapData(prev => {
      let nextList: SikapAssessment[] = [];
      const existing = prev.find(s => s.studentId === studentId);
      if (existing) {
        nextList = prev.map(s => s.studentId === studentId ? { ...s, [indicator]: value } : s);
      } else {
        nextList = [...prev, { studentId, classId, keimanan: 0, kewargaan: 0, penalaranKritis: 0, kreativitas: 0, kolaborasi: 0, kemandirian: 0, kesehatan: 0, komunikasi: 0, [indicator]: value }];
      }
      syncDplToFormatif(nextList);
      return nextList;
    });
  };

  const calculateSikapAverage = (assessment: SikapAssessment) => {
    if (selectedIndicators.length === 0) return 0;
    const sum = selectedIndicators.reduce((acc, key) => acc + (assessment[key] || 0), 0);
    return parseFloat((sum / selectedIndicators.length).toFixed(2));
  };

  const toggleIndicator = async (key: SikapIndicatorKey) => {
    let newIndicators: SikapIndicatorKey[] = [];
    setSelectedIndicators(prev => {
      if (prev.includes(key)) {
        newIndicators = prev.filter(k => k !== key);
      } else {
        newIndicators = [...prev, key];
      }
      return newIndicators;
    });
    try {
      await apiService.saveClassConfig('dpl_indicators', newIndicators, classId);
      onShowNotification(`Indikator DPL disimpan.`, 'success');
    } catch (error) {
      onShowNotification(`Gagal menyimpan indikator DPL.`, 'error');
    }
  };

  // --- Daily KAIH Helpers ---
  const getDailyJournalForStudent = (studentId: string): DailyKAIHJournal => {
    return dailyJournals.find(j => j.studentId === studentId) || {
      studentId,
      classId,
      date: selectedDate,
      bangunPagi: '',
      beribadah: '',
      berolahraga: '',
      makanSehat: '',
      gemarBelajar: '',
      bermasyarakat: '',
      tidurAwal: '',
      catatan: '',
      catatanGuru: ''
    };
  };

  const handleUpdateDailyJournal = (studentId: string, habitKey: keyof DailyKAIHJournal, value: string) => {
    setDailyJournals(prev => {
      const existing = prev.find(j => j.studentId === studentId);
      if (existing) {
        return prev.map(j => j.studentId === studentId ? { ...j, [habitKey]: value } : j);
      }
      return [...prev, {
        studentId,
        classId,
        date: selectedDate,
        bangunPagi: '',
        beribadah: '',
        berolahraga: '',
        makanSehat: '',
        gemarBelajar: '',
        bermasyarakat: '',
        tidurAwal: '',
        catatan: '',
        catatanGuru: '',
        [habitKey]: value
      }];
    });
  };

  const handleSaveSingleDailyJournal = async (studentId: string) => {
    const journal = getDailyJournalForStudent(studentId);
    try {
      await apiService.saveDailyKAIHJournal(journal);
      onShowNotification(`Jurnal KAIH tersimpan untuk siswa ini.`, 'success');
    } catch (err) {
      onShowNotification(`Gagal menyimpan jurnal KAIH.`, 'error');
    }
  };

  const countDailyHabitScore = (journal: DailyKAIHJournal): number => {
    const habits: (keyof DailyKAIHJournal)[] = ['bangunPagi', 'beribadah', 'berolahraga', 'makanSehat', 'gemarBelajar', 'bermasyarakat', 'tidurAwal'];
    let count = 0;
    habits.forEach(h => {
      if (journal[h] === 'Terbiasa') count++;
    });
    return count;
  };

  const isJournalFilled = (journal: DailyKAIHJournal): boolean => {
    const habits: (keyof DailyKAIHJournal)[] = ['bangunPagi', 'beribadah', 'berolahraga', 'makanSehat', 'gemarBelajar', 'bermasyarakat', 'tidurAwal'];
    return habits.some(h => Boolean(journal[h]));
  };

  // --- Semester KAIH Metrics Helpers ---
  const getSemesterMetricsForStudent = (studentId: string) => {
    const studentEntries = semesterJournals.filter(j => j.studentId === studentId);
    const totalDaysFilled = studentEntries.length;
    
    const habitCounts = {
      bangunPagi: 0,
      beribadah: 0,
      berolahraga: 0,
      makanSehat: 0,
      gemarBelajar: 0,
      bermasyarakat: 0,
      tidurAwal: 0
    };

    studentEntries.forEach(entry => {
      if (entry.bangunPagi === 'Terbiasa') habitCounts.bangunPagi++;
      if (entry.beribadah === 'Terbiasa') habitCounts.beribadah++;
      if (entry.berolahraga === 'Terbiasa') habitCounts.berolahraga++;
      if (entry.makanSehat === 'Terbiasa') habitCounts.makanSehat++;
      if (entry.gemarBelajar === 'Terbiasa') habitCounts.gemarBelajar++;
      if (entry.bermasyarakat === 'Terbiasa') habitCounts.bermasyarakat++;
      if (entry.tidurAwal === 'Terbiasa') habitCounts.tidurAwal++;
    });

    const totalPossiblePoints = totalDaysFilled * 7;
    const totalAchievedPoints = Object.values(habitCounts).reduce((a, b) => a + b, 0);
    const percentage = totalPossiblePoints > 0 ? Math.round((totalAchievedPoints / totalPossiblePoints) * 100) : 0;

    let predikat = 'Perlu Bimbingan';
    let badgeColor = 'bg-red-100 text-red-700 border-red-200';
    if (percentage >= 85) {
      predikat = 'Sangat Baik (SB)';
      badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';
    } else if (percentage >= 70) {
      predikat = 'Baik (B)';
      badgeColor = 'bg-blue-100 text-blue-800 border-blue-200';
    } else if (percentage >= 50) {
      predikat = 'Cukup (C)';
      badgeColor = 'bg-amber-100 text-amber-800 border-amber-200';
    }

    return {
      totalDaysFilled,
      habitCounts,
      totalAchievedPoints,
      percentage,
      predikat,
      badgeColor
    };
  };

  // --- Save All Handler ---
  const handleSaveAll = async () => {
    setIsSavingAll(true);
    try {
      if (activeTab === 'sikap') {
        syncDplToFormatif();
        for (const assessment of sikapData) {
          const { studentId, classId, ...dataToSave } = assessment;
          await onSaveSikap(studentId, dataToSave);
        }
        onShowNotification('Semua data DPL berhasil disimpan & tersinkron ke Penilaian Formatif (Observasi) dan Rekap Formatif!', 'success');
      } else {
        if (subTabKaih === 'harian') {
          for (const student of students) {
            const journal = getDailyJournalForStudent(student.id);
            await apiService.saveDailyKAIHJournal(journal);
          }
        }
        onShowNotification('Semua data berhasil disimpan!', 'success');
      }
    } catch (e) {
      onShowNotification('Terjadi kesalahan saat menyimpan.', 'error');
    } finally {
      setIsSavingAll(false);
    }
  };

  // --- Export Excel ---
  const handleExportExcel = () => {
    try {
      let exportRows: any[] = [];
      let filename = `Rekap_7KAIH_${classId}_${selectedDate}.xlsx`;

      if (activeTab === 'karakter' && subTabKaih === 'harian') {
        exportRows = students.map((st, idx) => {
          const journal = getDailyJournalForStudent(st.id);
          const score = countDailyHabitScore(journal);
          return {
            'No': idx + 1,
            'NIS': st.nis || '-',
            'Nama Siswa': st.name.toUpperCase(),
            'Tanggal': selectedDate,
            'Bangun Pagi': journal.bangunPagi || 'Belum',
            'Beribadah': journal.beribadah || 'Belum',
            'Berolahraga': journal.berolahraga || 'Belum',
            'Makan Sehat': journal.makanSehat || 'Belum',
            'Gemar Belajar': journal.gemarBelajar || 'Belum',
            'Bermasyarakat': journal.bermasyarakat || 'Belum',
            'Tidur Awal': journal.tidurAwal || 'Belum',
            'Skor KAIH': `${score} / 7`,
            'Catatan Siswa': journal.catatan || '-',
            'Catatan Guru': journal.catatanGuru || '-'
          };
        });
      } else if (activeTab === 'karakter' && subTabKaih === 'semester') {
        filename = `Rekap_Semester_7KAIH_${classId}_${startDate}_sd_${endDate}.xlsx`;
        exportRows = students.map((st, idx) => {
          const m = getSemesterMetricsForStudent(st.id);
          return {
            'No': idx + 1,
            'NIS': st.nis || '-',
            'Nama Siswa': st.name.toUpperCase(),
            'Hari Terisi': m.totalDaysFilled,
            'Bangun Pagi (Hari)': m.habitCounts.bangunPagi,
            'Beribadah (Hari)': m.habitCounts.beribadah,
            'Berolahraga (Hari)': m.habitCounts.berolahraga,
            'Makan Sehat (Hari)': m.habitCounts.makanSehat,
            'Gemar Belajar (Hari)': m.habitCounts.gemarBelajar,
            'Bermasyarakat (Hari)': m.habitCounts.bermasyarakat,
            'Tidur Awal (Hari)': m.habitCounts.tidurAwal,
            'Capaian KAIH (%)': `${m.percentage}%`,
            'Predikat Karakter': m.predikat
          };
        });
      } else {
        filename = `Rekap_DPL_${classId}.xlsx`;
        exportRows = students.map((st, idx) => {
          const assessment = getStudentSikap(st.id);
          const avg = calculateSikapAverage(assessment);
          const p = getSikapPredicate(avg);
          return {
            'No': idx + 1,
            'NIS': st.nis || '-',
            'Nama Siswa': st.name.toUpperCase(),
            'Rata-Rata DPL': avg,
            'Predikat': p.text
          };
        });
      }

      const worksheet = XLSX.utils.json_to_sheet(exportRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Rekap 7KAIH");
      XLSX.writeFile(workbook, filename);
      onShowNotification("Rekap berhasil diunduh dalam format Excel!", "success");
    } catch (e) {
      console.error(e);
      onShowNotification("Gagal mengekspor file Excel.", "error");
    }
  };

  const handlePrint = () => window.print();

  // Filter students for daily view
  const filteredStudents = students.filter(st => {
    const journal = getDailyJournalForStudent(st.id);
    const filled = isJournalFilled(journal);
    if (filterStatus === 'sudah') return filled;
    if (filterStatus === 'belum') return !filled;
    return true;
  });

  // Calculate daily summary stats
  const totalStudents = students.length;
  const totalFilledToday = students.filter(s => isJournalFilled(getDailyJournalForStudent(s.id))).length;
  const avgDailyScore = totalFilledToday > 0 
    ? (students.reduce((acc, s) => acc + countDailyHabitScore(getDailyJournalForStudent(s.id)), 0) / (totalStudents || 1)).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6 animate-fade-in page-landscape">
      {/* --- Top Header & Main Navigation --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-white border border-gray-200 rounded-xl shadow-2xs shrink-0 flex items-center justify-center">
            <Logo7Kaih className="w-10 h-10" imgClassName="w-10 h-10 object-contain rounded-lg" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              Rekapitutasi & Jurnal 7 KAIH
            </h2>
            <p className="text-gray-500 text-sm">
              7 Kebiasaan Anak Indonesia Hebat & Dimensi Profil Lulusan (DPL).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Main Switcher: 7 KAIH vs DPL */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
            <button 
              onClick={() => setActiveTab('karakter')} 
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'karakter' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-white'
              }`}
            >
              <Heart size={16} />
              <span>7 KAIH</span>
            </button>
            <button 
              onClick={() => setActiveTab('sikap')} 
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'sikap' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-white'
              }`}
            >
              <Smile size={16} />
              <span>DPL</span>
            </button>
          </div>

          <div className="flex items-center gap-1">
            {!isReadOnly && (
              <button 
                onClick={handleSaveAll} 
                disabled={isSavingAll} 
                className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 shadow-md font-bold disabled:opacity-50 transition-all text-sm"
              >
                {isSavingAll ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} 
                <span>{isSavingAll ? 'Menyimpan...' : 'Simpan'}</span>
              </button>
            )}

            <button 
              onClick={handleExportExcel} 
              className="flex items-center space-x-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-semibold hover:bg-emerald-100 transition-colors text-sm"
              title="Ekspor Ke Excel"
            >
              <FileSpreadsheet size={16} />
              <span className="hidden sm:inline">Excel</span>
            </button>

            <button 
              onClick={handlePrint} 
              className="p-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors" 
              title="Cetak Halaman"
            >
              <Printer size={18}/>
            </button>
          </div>
        </div>
      </div>

      {/* --- CONTENT CONTAINER --- */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-visible print-container relative">
        {/* ==================== 7 KAIH SECTION ==================== */}
        {activeTab === 'karakter' && (
          <div>
            {/* Sub-Header Bar */}
            <div className="p-4 border-b bg-gradient-to-r from-indigo-50/80 via-purple-50/50 to-pink-50/80 no-print flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-1 bg-white rounded-xl shadow-2xs border border-indigo-100 shrink-0 flex items-center justify-center">
                  <Logo7Kaih className="w-9 h-9" imgClassName="w-9 h-9 object-contain rounded-lg" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">Rekapitulasi 7 Kebiasaan Anak Indonesia Hebat</h3>
                  <p className="text-xs text-gray-500">Pemantauan jurnal pembiasaan karakter peserta didik.</p>
                </div>
              </div>

              {/* Sub Tab Switcher: Daily vs Semester */}
              <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
                <button
                  onClick={() => setSubTabKaih('harian')}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    subTabKaih === 'harian'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Calendar size={14} />
                  <span>Rekap Harian</span>
                </button>

                <button
                  onClick={() => setSubTabKaih('semester')}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    subTabKaih === 'semester'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <BarChart3 size={14} />
                  <span>Rekap 1 Semester</span>
                </button>
              </div>
            </div>

            {/* ------------ VIEW 1: REKAP HARIAN ------------ */}
            {subTabKaih === 'harian' && (
              <div className="p-4 space-y-4">
                {/* Controls Bar: Date Picker + Quick Stats */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
                  <div className="flex items-center gap-3 flex-wrap">
                    <label className="text-xs font-bold text-gray-600 flex items-center gap-1">
                      <Calendar size={14} className="text-indigo-600" /> Pilih Tanggal:
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="border border-gray-300 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-800 bg-white focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                    />
                    
                    {/* Quick Date Shortcuts */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setSelectedDate(getLocalISODate())}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                          selectedDate === getLocalISODate()
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        Hari Ini
                      </button>
                      
                      <button
                        onClick={() => {
                          const yesterday = new Date();
                          yesterday.setDate(yesterday.getDate() - 1);
                          setSelectedDate(getLocalISODate(yesterday));
                        }}
                        className="px-2.5 py-1 bg-white border border-gray-200 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-100 transition-colors"
                      >
                        Kemarin
                      </button>

                      <button
                        onClick={loadDailyJournals}
                        disabled={isLoadingJournals}
                        className="p-1.5 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                        title="Segarkan Data"
                      >
                        <RefreshCw size={14} className={isLoadingJournals ? 'animate-spin text-indigo-600' : ''} />
                      </button>
                    </div>
                  </div>

                  {/* Quick Filter */}
                  <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                    <Filter size={14} className="text-gray-400" />
                    <select
                      value={filterStatus}
                      onChange={(e: any) => setFilterStatus(e.target.value)}
                      className="border border-gray-300 rounded-xl px-3 py-1.5 text-xs font-bold bg-white text-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                    >
                      <option value="semua">Semua Siswa ({totalStudents})</option>
                      <option value="sudah">Sudah Mengisi ({totalFilledToday})</option>
                      <option value="belum">Belum Mengisi ({totalStudents - totalFilledToday})</option>
                    </select>
                  </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 no-print">
                  <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-3 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Sudah Mengisi Hari Ini</p>
                      <p className="text-xl font-extrabold text-indigo-900 mt-0.5">
                        {totalFilledToday} <span className="text-xs font-normal text-indigo-600">/ {totalStudents} Siswa</span>
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                      {Math.round((totalFilledToday / (totalStudents || 1)) * 100)}%
                    </div>
                  </div>

                  <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-3 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Rata-Rata Terlaksana</p>
                      <p className="text-xl font-extrabold text-emerald-900 mt-0.5">
                        {avgDailyScore} <span className="text-xs font-normal text-emerald-600">/ 7 Kebiasaan</span>
                      </p>
                    </div>
                    <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-sm">
                      <CheckCircle2 size={20} />
                    </div>
                  </div>

                  <div className="bg-amber-50/70 border border-amber-100 rounded-2xl p-3 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Belum Mengisi Jurnal</p>
                      <p className="text-xl font-extrabold text-amber-900 mt-0.5">
                        {totalStudents - totalFilledToday} <span className="text-xs font-normal text-amber-600">Siswa</span>
                      </p>
                    </div>
                    <div className="p-2 bg-amber-500 text-white rounded-xl shadow-sm">
                      <AlertCircle size={20} />
                    </div>
                  </div>
                </div>

                {/* Print Title Header */}
                <div className="hidden print:flex items-center justify-center gap-3 mb-4 text-center">
                  <Logo7Kaih className="w-12 h-12" imgClassName="w-12 h-12 object-contain" />
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">REKAP HARIAN JURNAL 7 KEBIASAAN ANAK INDONESIA HEBAT (7 KAIH)</h2>
                    <p className="text-xs text-gray-600">Tanggal: {formatDateID(selectedDate)} | Kelas: {classId}</p>
                  </div>
                </div>

                {/* Matrix Table */}
                <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-sm">
                  <table className="w-full text-xs text-left border-collapse min-w-[1250px]">
                    <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                      <tr className="border-b border-gray-200">
                        <th className="p-3 border text-center w-10">No</th>
                        <th className="p-3 border min-w-[180px]">Nama Siswa</th>
                        <th className="p-2 border text-center w-28">1. Bangun Pagi</th>
                        <th className="p-2 border text-center w-28">2. Beribadah</th>
                        <th className="p-2 border text-center w-28">3. Berolahraga</th>
                        <th className="p-2 border text-center w-28">4. Makan Sehat</th>
                        <th className="p-2 border text-center w-28">5. Gemar Belajar</th>
                        <th className="p-2 border text-center w-28">6. Bermasyarakat</th>
                        <th className="p-2 border text-center w-28">7. Tidur Awal</th>
                        <th className="p-2 border text-center bg-indigo-50 text-indigo-900 w-20">Skor</th>
                        <th className="p-3 border min-w-[180px]">Catatan / Refleksi Siswa</th>
                        <th className="p-3 border min-w-[200px] bg-yellow-50 text-yellow-900">Umpan Balik Guru</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredStudents.length === 0 ? (
                        <tr>
                          <td colSpan={12} className="p-8 text-center text-gray-400 font-medium">
                            Tidak ada data siswa sesuai filter.
                          </td>
                        </tr>
                      ) : (
                        filteredStudents.map((st, idx) => {
                          const journal = getDailyJournalForStudent(st.id);
                          const score = countDailyHabitScore(journal);
                          const filled = isJournalFilled(journal);

                          return (
                            <tr key={st.id} className="hover:bg-gray-50/80 transition-colors">
                              <td className="p-2 border text-center font-bold text-gray-500">{idx + 1}</td>
                              <td className="p-2 border font-bold text-gray-800 uppercase text-[11px] sm:text-xs">
                                {st.name}
                              </td>

                              {/* Habit Columns */}
                              {(['bangunPagi', 'beribadah', 'berolahraga', 'makanSehat', 'gemarBelajar', 'bermasyarakat', 'tidurAwal'] as const).map((hKey) => {
                                const val = (journal[hKey] || '') as string;
                                const habitDetail = journal.details?.[hKey];
                                return (
                                  <td key={hKey} className="p-1 border text-center align-top">
                                    <select
                                      value={val}
                                      onChange={(e) => {
                                        if (!isReadOnly) {
                                          handleUpdateDailyJournal(st.id, hKey, e.target.value);
                                        }
                                      }}
                                      onBlur={() => !isReadOnly && handleSaveSingleDailyJournal(st.id)}
                                      disabled={isReadOnly}
                                      className={`w-full p-1.5 rounded-lg text-xs font-bold text-center outline-none transition-all ${
                                        val === 'Terbiasa'
                                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                          : val === 'Belum Terbiasa'
                                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                          : 'bg-gray-50 text-gray-400 border border-gray-200'
                                      }`}
                                    >
                                      <option value="">-</option>
                                      <option value="Terbiasa">Terbiasa</option>
                                      <option value="Belum Terbiasa">Belum</option>
                                    </select>
                                    {habitDetail && (
                                      <div className="mt-1 p-1 bg-sky-50 border border-sky-200 rounded text-[10px] text-sky-900 font-normal leading-tight text-left max-w-[120px] mx-auto break-words" title={habitDetail}>
                                        <span className="font-semibold block text-[9px] text-sky-700">Ket:</span>
                                        {habitDetail}
                                      </div>
                                    )}
                                  </td>
                                );
                              })}

                              {/* Score & Status */}
                              <td className="p-2 border text-center font-black bg-indigo-50 text-indigo-700 text-sm">
                                <div className="flex flex-col items-center justify-center gap-0.5">
                                  <span>{score} / 7</span>
                                  {!filled && (
                                    <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-[9px] font-bold no-print whitespace-nowrap">
                                      Belum isi
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Student Reflection */}
                              <td className="p-2 border text-gray-700 italic bg-slate-50/50">
                                {journal.catatan ? `"${journal.catatan}"` : <span className="text-gray-300">-</span>}
                              </td>

                              {/* Teacher Feedback */}
                              <td className="p-1.5 border bg-yellow-50/50">
                                <div className="flex items-center gap-1">
                                  <textarea
                                    rows={1}
                                    value={journal.catatanGuru || ''}
                                    onChange={(e) => handleUpdateDailyJournal(st.id, 'catatanGuru', e.target.value)}
                                    onBlur={() => !isReadOnly && handleSaveSingleDailyJournal(st.id)}
                                    disabled={isReadOnly}
                                    placeholder="Umpan balik / apresiasi guru..."
                                    className="w-full bg-transparent border-none outline-none resize-none text-xs text-gray-800 placeholder-gray-400 focus:bg-white focus:ring-1 focus:ring-yellow-400 rounded p-1"
                                  />
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ------------ VIEW 2: REKAP 1 SEMESTER ------------ */}
            {subTabKaih === 'semester' && (
              <div className="p-4 space-y-4">
                {/* Semester Range Selector */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs font-bold text-gray-700 flex items-center gap-1">
                      <BarChart3 size={16} className="text-indigo-600" /> Periode Semester:
                    </span>

                    <div className="flex bg-white p-1 rounded-xl border border-gray-300 shadow-sm">
                      <button
                        onClick={() => handleSemesterTypeChange('ganjil')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                          semesterType === 'ganjil' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        Semester 1 (Ganjil)
                      </button>
                      <button
                        onClick={() => handleSemesterTypeChange('genap')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                          semesterType === 'genap' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        Semester 2 (Genap)
                      </button>
                      <button
                        onClick={() => setSemesterType('kustom')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                          semesterType === 'kustom' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        Rentang Kustom
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="border border-gray-300 rounded-xl px-2.5 py-1 text-xs font-semibold text-gray-800 bg-white shadow-sm"
                      />
                      <span className="text-xs text-gray-400">s/d</span>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="border border-gray-300 rounded-xl px-2.5 py-1 text-xs font-semibold text-gray-800 bg-white shadow-sm"
                      />
                      <button
                        onClick={loadSemesterJournals}
                        disabled={isLoadingJournals}
                        className="p-1.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
                      >
                        <RefreshCw size={14} className={isLoadingJournals ? 'animate-spin' : ''} />
                      </button>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-gray-500">Total Log Jurnal Semester Ini:</span>
                    <p className="text-lg font-black text-indigo-700">{semesterJournals.length} Catatan</p>
                  </div>
                </div>

                {/* Semester Summary Matrix */}
                <div className="hidden print:block text-center mb-4">
                  <h2 className="text-lg font-bold text-gray-900">REKAPITULASI SEMESTER 7 KEBIASAAN ANAK INDONESIA HEBAT</h2>
                  <p className="text-xs text-gray-600">Periode: {formatDateID(startDate)} s/d {formatDateID(endDate)} | Kelas: {classId}</p>
                </div>

                <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-sm">
                  <table className="w-full text-xs text-left border-collapse min-w-[1100px]">
                    <thead className="bg-slate-100 text-slate-800 font-bold sticky top-0">
                      <tr className="border-b border-gray-200">
                        <th className="p-3 border text-center w-10">No</th>
                        <th className="p-3 border min-w-[180px]">Nama Siswa</th>
                        <th className="p-2 border text-center w-24 bg-indigo-50 text-indigo-900">Hari Mengisi</th>
                        <th className="p-2 border text-center">1. Bangun Pagi</th>
                        <th className="p-2 border text-center">2. Beribadah</th>
                        <th className="p-2 border text-center">3. Berolahraga</th>
                        <th className="p-2 border text-center">4. Makan Sehat</th>
                        <th className="p-2 border text-center">5. Gemar Belajar</th>
                        <th className="p-2 border text-center">6. Bermasyarakat</th>
                        <th className="p-2 border text-center">7. Tidur Awal</th>
                        <th className="p-3 border text-center bg-indigo-50 text-indigo-900 w-24">Skor (%)</th>
                        <th className="p-3 border text-center min-w-[140px]">Predikat Karakter</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {students.map((st, idx) => {
                        const m = getSemesterMetricsForStudent(st.id);
                        return (
                          <tr key={st.id} className="hover:bg-gray-50/80 transition-colors">
                            <td className="p-2.5 border text-center font-bold text-gray-500">{idx + 1}</td>
                            <td className="p-2.5 border font-bold text-gray-800 uppercase">{st.name}</td>
                            <td className="p-2.5 border text-center font-extrabold bg-indigo-50/50 text-indigo-900">
                              {m.totalDaysFilled} Hari
                            </td>

                            <td className="p-2 border text-center font-medium">
                              {m.habitCounts.bangunPagi} <span className="text-[10px] text-gray-400">hari</span>
                            </td>
                            <td className="p-2 border text-center font-medium">
                              {m.habitCounts.beribadah} <span className="text-[10px] text-gray-400">hari</span>
                            </td>
                            <td className="p-2 border text-center font-medium">
                              {m.habitCounts.berolahraga} <span className="text-[10px] text-gray-400">hari</span>
                            </td>
                            <td className="p-2 border text-center font-medium">
                              {m.habitCounts.makanSehat} <span className="text-[10px] text-gray-400">hari</span>
                            </td>
                            <td className="p-2 border text-center font-medium">
                              {m.habitCounts.gemarBelajar} <span className="text-[10px] text-gray-400">hari</span>
                            </td>
                            <td className="p-2 border text-center font-medium">
                              {m.habitCounts.bermasyarakat} <span className="text-[10px] text-gray-400">hari</span>
                            </td>
                            <td className="p-2 border text-center font-medium">
                              {m.habitCounts.tidurAwal} <span className="text-[10px] text-gray-400">hari</span>
                            </td>

                            <td className="p-2.5 border text-center font-black text-indigo-700 bg-indigo-50/50 text-sm">
                              {m.percentage}%
                            </td>

                            <td className="p-2 border text-center font-bold">
                              <span className={`px-2.5 py-1 rounded-full text-[11px] border font-bold ${m.badgeColor}`}>
                                {m.predikat}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== DPL SECTION ==================== */}
        {activeTab === 'sikap' && (
          <>
            {/* Top Bar for Mapel, TP, & Synchronization */}
            <div className="p-4 border-b bg-indigo-50/50 no-print space-y-4">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <Smile className="text-indigo-600" size={20} />
                    Dimensi Profil Lulusan (DPL) per Mata Pelajaran
                  </h3>
                  <p className="text-xs text-gray-500">
                    Nilai DPL yang diinput otomatis tersinkron ke Penilaian Formatif (jenis Observasi) & Rekap Formatif.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold flex items-center gap-1.5 border border-emerald-200 shadow-sm">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    Tersinkron ke Formatif (Observasi) & Rekap Formatif
                  </span>

                  <div className="relative">
                    <button 
                      onClick={() => setIsSelectorOpen(!isSelectorOpen)} 
                      className="flex items-center space-x-2 bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors shadow-sm text-sm font-medium"
                    >
                      <Settings size={14}/> <span>Pilih Indikator</span>
                    </button>
                    
                    {isSelectorOpen && (
                      <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-20 p-3 animate-fade-in-up">
                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Pilih Indikator Penilaian</h4>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {(Object.keys(SIKAP_INDICATORS) as SikapIndicatorKey[]).map((key) => (
                            <label key={key} className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                              <input 
                                type="checkbox" 
                                checked={selectedIndicators.includes(key)} 
                                onChange={() => toggleIndicator(key)}
                                className="rounded text-indigo-600 focus:ring-indigo-500"
                              />
                              <span>{SIKAP_INDICATORS[key]}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Mapel & TP Selection Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-3 rounded-xl border border-indigo-100 shadow-sm">
                <div>
                  <label className="block text-[11px] font-extrabold text-indigo-900 uppercase tracking-wider mb-1">
                    Mata Pelajaran:
                  </label>
                  <select 
                    value={selectedSubjectId} 
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    {MOCK_SUBJECTS.map((sub) => (
                      <option key={sub.id} value={sub.id}>{sub.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-indigo-900 uppercase tracking-wider mb-1">
                    Pilih TP / Topik Tersimpan:
                  </label>
                  <select 
                    value={selectedTopicId} 
                    onChange={(e) => handleSelectTopic(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="">+ Buat TP / Topik Baru (Opsional)...</option>
                    {savedTopics
                      .filter(t => t.subjectId === selectedSubjectId && isValidTopic(t))
                      .map((topic) => {
                        const m = topic.materi && topic.materi !== 'Observasi DPL' ? topic.materi : '';
                        const tj = topic.tujuan && topic.tujuan !== 'Observasi DPL' ? topic.tujuan : '';
                        const label = m && tj ? `${m} (${tj})` : (tj || m || topic.id);
                        return (
                          <option key={topic.id} value={topic.id}>
                            {label}
                          </option>
                        );
                      })}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-indigo-900 uppercase tracking-wider mb-1">
                    Materi Pembelajaran:
                  </label>
                  <input 
                    type="text"
                    value={materiInput}
                    onChange={(e) => setMateriInput(e.target.value)}
                    onBlur={() => syncDplToFormatif()}
                    placeholder="Masukkan materi pembelajaran..."
                    className="w-full bg-slate-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-indigo-900 uppercase tracking-wider mb-1">
                    Tujuan Pembelajaran (TP):
                  </label>
                  <input 
                    type="text"
                    value={tujuanInput}
                    onChange={(e) => setTujuanInput(e.target.value)}
                    onBlur={() => syncDplToFormatif()}
                    placeholder="Masukkan tujuan pembelajaran (TP)..."
                    className="w-full bg-slate-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto pb-4 p-4">
              <table className="w-full text-xs text-left border-collapse min-w-[1000px]">
                <thead className="bg-slate-50 text-slate-700 font-bold sticky top-0">
                  <tr className="border-b">
                    <th className="p-2 border sticky left-0 bg-slate-50 z-20 w-12 text-center">No</th>
                    <th className="p-2 border sticky left-12 bg-slate-50 z-20 w-48">Nama Siswa</th>
                    {selectedIndicators.map(key => (
                      <th key={key} className="p-2 border text-center">{SIKAP_INDICATORS[key]}</th>
                    ))}
                    <th className="p-2 border text-center bg-indigo-50 w-20">Rata-rata</th>
                    <th className="p-2 border text-center bg-indigo-50 w-24">Predikat</th>
                    <th className="p-2 border text-center bg-emerald-50 text-emerald-900 w-28">Formatif (Observasi)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {students.map((student, idx) => {
                    const assessment = getStudentSikap(student.id);
                    const avg = calculateSikapAverage(assessment);
                    const predicate = getSikapPredicate(avg);
                    const convertedScore = avg > 0 ? Math.round(avg * 25) : 0;
                    
                    return (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="p-2 border text-center font-medium sticky left-0 bg-white z-10 w-12">{idx + 1}</td>
                        <td className="p-2 border font-medium sticky left-12 bg-white z-10 group-hover:bg-gray-50 uppercase">{student.name.toUpperCase()}</td>
                        {selectedIndicators.map(key => {
                          const value = assessment[key] || 0;
                          return (
                            <td key={key} className="p-1 border text-center">
                              <div className="flex items-center justify-center gap-1">
                                {[1,2,3,4].map(score => (
                                  <button 
                                    key={score} 
                                    onClick={() => !isReadOnly && updateSikap(student.id, key, score)} 
                                    disabled={isReadOnly}
                                    className={`w-6 h-6 rounded-full text-xs font-bold transition-transform ${!isReadOnly ? 'hover:scale-110' : ''} ${value === score ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'} ${isReadOnly ? 'cursor-not-allowed' : ''}`}
                                  >
                                    {score}
                                  </button>
                                ))}
                              </div>
                            </td>
                          );
                        })}
                        <td className="p-2 border text-center font-bold bg-indigo-50 text-indigo-700">{avg > 0 ? avg : '-'}</td>
                        <td className="p-2 border text-center font-bold bg-indigo-50">
                          <span className={`px-2 py-0.5 rounded text-[10px] ${predicate.color}`}>{predicate.text}</span>
                        </td>
                        <td className="p-2 border text-center font-bold bg-emerald-50/70 text-emerald-800">
                          {convertedScore > 0 ? (
                            <div className="flex flex-col items-center">
                              <span className="text-sm font-black text-emerald-700">{convertedScore}</span>
                              <span className="text-[9px] font-semibold text-emerald-600">Tersinkron</span>
                            </div>
                          ) : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AttitudeView;
