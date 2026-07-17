
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Student, GradeRecord, GradeData, Subject, SchoolProfileData, TeacherProfileData, GradeHistoryRecord, User } from '../types';
import { MOCK_SUBJECTS } from '../constants';
import { apiService } from '../services/apiService';
import * as XLSX from 'xlsx';
import html2pdf from 'html2pdf.js';
import { Save, FileSpreadsheet, Printer, Upload, Download, Calculator, CheckCircle, AlertCircle, Settings2, Lock, ChevronDown, Trophy, List, Grid, Eye, EyeOff, Loader2, Plus, Minus, History, Trash2 } from 'lucide-react';
import { useModal } from '../context/ModalContext';

interface GradesViewProps {
  students: Student[];
  initialGrades: GradeRecord[];
  onSave: (studentId: string, subjectId: string, data: GradeData, classId: string) => void;
  onShowNotification: (message: string, type: 'success' | 'error' | 'warning') => void;
  classId: string;
  isReadOnly?: boolean;
  allowedSubjects?: string[];
  schoolProfile?: SchoolProfileData;
  teacherProfile?: TeacherProfileData;
  currentUser?: User | null;
}

const GradesView: React.FC<GradesViewProps> = ({ 
  students, initialGrades, onSave, onShowNotification, classId, 
  isReadOnly = false, allowedSubjects = ['all'], schoolProfile, teacherProfile,
  currentUser
}) => {
  const [viewMode, setViewMode] = useState<'input' | 'recap' | 'history' | 'tka_recap'>('input');
  const [selectedSubject, setSelectedSubject] = useState<string>(MOCK_SUBJECTS[0].id);
  const [grades, setGrades] = useState<GradeRecord[]>(initialGrades);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [kktpMap, setKktpMap] = useState<Record<string, number>>({});
  const [isSavingKktp, setIsSavingKktp] = useState(false);
  const { showConfirm } = useModal();
  
  // History States
  const [gradeHistory, setGradeHistory] = useState<GradeHistoryRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isDeletingHistory, setIsDeletingHistory] = useState(false);
  const [selectedHistoryCohort, setSelectedHistoryCohort] = useState<string>('');
  const [historyViewSubMode, setHistoryViewSubMode] = useState<'recap' | 'summative'>('recap');
  const [selectedHistorySubject, setSelectedHistorySubject] = useState<string>(MOCK_SUBJECTS[0].id);
  const historyFileInputRef = useRef<HTMLInputElement>(null);
  
  // New State for Student Recap Visibility
  const [showRecapToStudents, setShowRecapToStudents] = useState(false);
  const [isTogglingRecap, setIsTogglingRecap] = useState(false);

  // New State for Summative Scores Visibility
  const [showSummativeToStudents, setShowSummativeToStudents] = useState(false);
  const [isTogglingSummative, setIsTogglingSummative] = useState(false);

  // Print Date and Place for Recap Report
  const [recapPrintDate, setRecapPrintDate] = useState<string>('');
  const [recapPrintPlace, setRecapPrintPlace] = useState<string>('Remen');
  const [isSavingPrintSettings, setIsSavingPrintSettings] = useState(false);

  const [customColumns, setCustomColumns] = useState<string[]>([]);
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [isRemovingColumn, setIsRemovingColumn] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setGrades(initialGrades); }, [initialGrades]);

  // --- TKA Logic and States ---
  const isGuru6 = useMemo(() => {
    if (!currentUser) return false;
    const isGuru = currentUser.role === 'guru';
    const classStr = String(classId || '').toUpperCase();
    const teachingClassStr = String(teacherProfile?.teachingClass || '').toUpperCase();
    const isClass6 = classStr.startsWith('6') || classStr.startsWith('VI');
    const isTeaching6 = teachingClassStr.startsWith('6') || teachingClassStr.startsWith('VI');
    return isGuru && (isClass6 || isTeaching6);
  }, [currentUser, classId, teacherProfile]);

  const canAccessTKA = useMemo(() => {
    if (!currentUser) return false;
    if (String(classId || '').trim() !== '6') return false;
    return currentUser.role === 'admin' || currentUser.role === 'superadmin' || isGuru6;
  }, [currentUser, isGuru6, classId]);

  const [tkaTitles, setTkaTitles] = useState<Record<string, string>>({});
  const [selectedTkaTitle, setSelectedTkaTitle] = useState<string>('TKA 1');
  const [tkaList, setTkaList] = useState<string[]>(['TKA 1', 'TKA 2', 'TKA 3']);
  const [showAddTkaModal, setShowAddTkaModal] = useState(false);
  const [newTkaTitleInput, setNewTkaTitleInput] = useState('');

  const handleConfirmAddTka = () => {
    if (newTkaTitleInput && newTkaTitleInput.trim()) {
      const cleaned = newTkaTitleInput.trim();
      if (!tkaList.includes(cleaned)) {
        const newList = [...tkaList, cleaned];
        setTkaList(newList);
        localStorage.setItem(`tka_list_${classId}`, JSON.stringify(newList));
      }
      setSelectedTkaTitle(cleaned);
      setShowAddTkaModal(false);
      setNewTkaTitleInput('');
      onShowNotification('Tryout TKA baru berhasil ditambahkan!', 'success');
    } else {
      onShowNotification('Nama tryout tidak boleh kosong!', 'error');
    }
  };

  useEffect(() => {
    const savedList = localStorage.getItem(`tka_list_${classId}`);
    if (savedList) {
      try {
        const parsed = JSON.parse(savedList);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTkaList(parsed);
          setSelectedTkaTitle(parsed[0]);
          return;
        }
      } catch (e) {}
    }
    setTkaList(['TKA 1', 'TKA 2', 'TKA 3']);
    setSelectedTkaTitle('TKA 1');
  }, [classId]);

  useEffect(() => {
    const saved = localStorage.getItem(`tka_titles_${classId}`);
    if (saved) {
      try {
        setTkaTitles(JSON.parse(saved));
      } catch (e) {}
    }
  }, [classId]);

  const updateTkaTitle = (studentId: string, title: string) => {
    const updated = { ...tkaTitles, [studentId]: title };
    setTkaTitles(updated);
    localStorage.setItem(`tka_titles_${classId}`, JSON.stringify(updated));
  };

  useEffect(() => {
    setGrades(prevGrades => {
      let changed = false;
      const updated = prevGrades.map(g => {
        const newSubjects = { ...g.subjects };
        let studentChanged = false;
        ['mat', 'indo'].forEach(subId => {
          if (newSubjects[subId]) {
            const currentTkaScores = newSubjects[subId].tka_scores || {};
            let activeScore = currentTkaScores[selectedTkaTitle];
            
            // Fallback to legacy .tka for the first title if undefined
            if (activeScore === undefined && selectedTkaTitle === tkaList[0]) {
              activeScore = newSubjects[subId].tka || 0;
            } else if (activeScore === undefined) {
              activeScore = 0;
            }

            if (newSubjects[subId].tka !== activeScore) {
              newSubjects[subId] = {
                ...newSubjects[subId],
                tka: activeScore
              };
              studentChanged = true;
            }
          }
        });
        if (studentChanged) {
          changed = true;
          return { ...g, subjects: newSubjects };
        }
        return g;
      });
      return changed ? updated : prevGrades;
    });
  }, [selectedTkaTitle, tkaList]);

  const getTKAScore = (studentId: string, subjectId: string) => {
    const record = grades.find(g => g.studentId === studentId);
    if (!record || !record.subjects[subjectId]) return 0;
    const subjectData = record.subjects[subjectId];
    
    // Check if there is tka_scores mapping for this title
    if (subjectData.tka_scores && subjectData.tka_scores[selectedTkaTitle] !== undefined) {
      return subjectData.tka_scores[selectedTkaTitle];
    }
    
    // Fallback: if we are on the first TKA title, check if there is an existing legacy 'tka' score
    const isFirstTka = tkaList[0] === selectedTkaTitle;
    if (isFirstTka && subjectData.tka !== undefined) {
      return subjectData.tka;
    }
    
    return 0;
  };

  const getPredicate = (score: number) => {
    if (score > 90) return 'Istimewa';
    if (score >= 76) return 'Baik';
    if (score >= 60) return 'Memadai';
    return 'Kurang';
  };

  const getPredicateBadgeClass = (pred: string) => {
    switch (pred) {
      case 'Istimewa':
        return 'inline-block px-3 py-1 text-xs font-extrabold rounded-full text-white bg-rose-600 text-center shadow-sm w-24 tracking-wider uppercase';
      case 'Baik':
        return 'inline-block px-3 py-1 text-xs font-extrabold rounded-full text-white bg-amber-500 text-center shadow-sm w-24 tracking-wider uppercase';
      case 'Memadai':
        return 'inline-block px-3 py-1 text-xs font-extrabold rounded-full text-white bg-sky-500 text-center shadow-sm w-24 tracking-wider uppercase';
      case 'Kurang':
        return 'inline-block px-3 py-1 text-xs font-extrabold rounded-full text-white bg-slate-500 text-center shadow-sm w-24 tracking-wider uppercase';
      default:
        return 'inline-block px-3 py-1 text-xs font-extrabold rounded-full text-gray-500 bg-gray-100 text-center w-24 tracking-wider uppercase';
    }
  };

  const updateLocalTKAGrade = (studentId: string, subjectId: string, value: number) => {
    const val = Math.min(100, Math.max(0, value));
    setGrades(prevGrades => {
        const newGrades = [...prevGrades];
        let record = newGrades.find(g => g.studentId === studentId);
        if (!record) {
          record = { studentId, classId, subjects: {} };
          newGrades.push(record);
        }
        if (!record.subjects[subjectId]) {
          record.subjects[subjectId] = { sum1: 0, sum2: 0, sum3: 0, sum4: 0, sas: 0 };
        }
        
        // Initialize tka_scores if it doesn't exist
        const currentTkaScores = { ...(record.subjects[subjectId].tka_scores || {}) };
        
        // If it's the first TKA and there is legacy 'tka', seed the tka_scores with it
        if (Object.keys(currentTkaScores).length === 0 && record.subjects[subjectId].tka !== undefined) {
          currentTkaScores[tkaList[0]] = record.subjects[subjectId].tka;
        }

        // Set the new value for selected TKA
        currentTkaScores[selectedTkaTitle] = val;
        
        record.subjects[subjectId] = { 
          ...record.subjects[subjectId], 
          tka_scores: currentTkaScores,
          tka: val
        };
        return newGrades;
    });
  };

  const handleSaveTKARow = async (studentId: string) => {
    const record = grades.find(g => g.studentId === studentId);
    if (!record) return;
    try {
      const matGrade = record.subjects['mat'] || { sum1: 0, sum2: 0, sum3: 0, sum4: 0, sas: 0 };
      const indoGrade = record.subjects['indo'] || { sum1: 0, sum2: 0, sum3: 0, sum4: 0, sas: 0 };
      await onSave(studentId, 'mat', matGrade, classId);
      await onSave(studentId, 'indo', indoGrade, classId);
    } catch (e) {
      console.error("Gagal menyimpan TKA:", e);
    }
  };

  const handleSaveAllTKA = async () => {
    setIsSavingAll(true);
    try {
      for (const student of students) {
        const record = grades.find(g => g.studentId === student.id);
        if (record) {
          const matGrade = record.subjects['mat'] || { sum1: 0, sum2: 0, sum3: 0, sum4: 0, sas: 0 };
          const indoGrade = record.subjects['indo'] || { sum1: 0, sum2: 0, sum3: 0, sum4: 0, sas: 0 };
          await onSave(student.id, 'mat', matGrade, classId);
          await onSave(student.id, 'indo', indoGrade, classId);
        }
      }
      onShowNotification('Seluruh data nilai TKA berhasil disimpan!', 'success');
    } catch (e) {
      onShowNotification('Gagal menyimpan beberapa data nilai TKA. Cek koneksi Anda.', 'error');
    } finally {
      setIsSavingAll(false);
    }
  };

  const handleExportTKA = () => {
    const headers = ["No", "NIS", "NISN", "Nama Siswa", "Tryout TKA", "Matematika", "Predikat Matematika", "Bahasa Indonesia", "Predikat Bahasa Indonesia"];
    const rows = students.map((student, idx) => {
      const studentRecord = grades.find(g => g.studentId === student.id);
      const matScore = studentRecord?.subjects['mat']?.tka || 0;
      const matPredicate = getPredicate(matScore);
      const indoScore = studentRecord?.subjects['indo']?.tka || 0;
      const indoPredicate = getPredicate(indoScore);
      const title = tkaTitles[student.id] || "Tes Kemampuan Akademik (TKA)";
      return [
        idx + 1,
        student.nis,
        student.nisn || '-',
        student.name.toUpperCase(),
        title,
        matScore,
        matPredicate,
        indoScore,
        indoPredicate
      ];
    });
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Rekap TKA");
    XLSX.writeFile(workbook, `rekap_nilai_tka_kelas_${classId}.xlsx`);
    onShowNotification("Rekap TKA berhasil diekspor!", 'success');
  };

  // Fetch custom columns for the current subject
  useEffect(() => {
    const loadCustomColumns = async () => {
      try {
        const columns = await apiService.getCustomGradeColumns(classId, selectedSubject);
        setCustomColumns(columns || []);
      } catch (error) {
        console.error("Error loading custom columns:", error);
      }
    };
    if (selectedSubject) {
      loadCustomColumns();
    }
  }, [classId, selectedSubject]);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await apiService.getClassConfig(classId);
        if (config) {
           const fetchedKktp = (config as any).KKTP || config.kktp;
           if (fetchedKktp) setKktpMap(fetchedKktp);
           if (config.settings?.showStudentRecap !== undefined) {
               setShowRecapToStudents(config.settings.showStudentRecap);
           }
           if (config.settings?.showSummativeToStudents !== undefined) {
               setShowSummativeToStudents(config.settings.showSummativeToStudents);
           }
           if (config.settings?.recapPrintDate !== undefined) {
               setRecapPrintDate(config.settings.recapPrintDate);
           }
           if (config.settings?.recapPrintPlace !== undefined) {
               setRecapPrintPlace(config.settings.recapPrintPlace);
           }
        }
        
        // Fill defaults if empty
        const fetchedKktp = config ? ((config as any).KKTP || config.kktp) : null;
        if (!fetchedKktp || Object.keys(fetchedKktp).length === 0) {
           const defaults: Record<string, number> = {};
           MOCK_SUBJECTS.forEach((s: Subject) => { defaults[s.id] = s.kkm; });
           setKktpMap(defaults);
        }
      } catch (e) {
        console.error("Gagal memuat konfigurasi", e);
      }
    };
    if (classId) loadConfig();
  }, [classId]);

  const toggleStudentRecapVisibility = async () => {
      if (isReadOnly) return;
      const newValue = !showRecapToStudents;
      setIsTogglingRecap(true);
      try {
          const config = await apiService.getClassConfig(classId);
          const newSettings = { ...(config.settings || {}), showStudentRecap: newValue };
          await apiService.saveClassConfig('settings', newSettings, classId);
          setShowRecapToStudents(newValue);
          onShowNotification(newValue ? "Rekap rapor sekarang muncul di portal siswa." : "Rekap rapor disembunyikan dari portal siswa.", 'success');
      } catch (e) {
          onShowNotification("Gagal mengubah pengaturan.", 'error');
      } finally {
          setIsTogglingRecap(false);
      }
  };

  const toggleSummativeVisibility = async () => {
      if (isReadOnly) return;
      const newValue = !showSummativeToStudents;
      setIsTogglingSummative(true);
      try {
          const config = await apiService.getClassConfig(classId);
          const newSettings = { ...(config.settings || {}), showSummativeToStudents: newValue };
          await apiService.saveClassConfig('settings', newSettings, classId);
          setShowSummativeToStudents(newValue);
          onShowNotification(newValue ? "Nilai sumatif sekarang muncul di portal siswa." : "Nilai sumatif disembunyikan dari portal siswa.", 'success');
      } catch (e) {
          onShowNotification("Gagal mengubah pengaturan.", 'error');
      } finally {
          setIsTogglingSummative(false);
      }
  };

  const getFormattedPrintDate = () => {
      if (!recapPrintDate) {
          return new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'});
      }
      try {
          const parsedDate = new Date(recapPrintDate);
          if (isNaN(parsedDate.getTime())) {
              return recapPrintDate;
          }
          return parsedDate.toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'});
      } catch (e) {
          return recapPrintDate;
      }
  };

  const handleSavePrintSettings = async (dateVal: string, placeVal: string) => {
      if (isReadOnly) return;
      setIsSavingPrintSettings(true);
      try {
          const config = await apiService.getClassConfig(classId);
          const newSettings = { 
              ...(config.settings || {}), 
              recapPrintDate: dateVal,
              recapPrintPlace: placeVal 
          };
          await apiService.saveClassConfig('settings', newSettings, classId);
          setRecapPrintDate(dateVal);
          setRecapPrintPlace(placeVal);
          onShowNotification("Pengaturan tanggal & kota cetak berhasil disimpan", 'success');
      } catch (e) {
          console.error(e);
          onShowNotification("Gagal menyimpan tanggal cetak", 'error');
      } finally {
          setIsSavingPrintSettings(false);
      }
  };

  const isSubjectEditable = useMemo(() => {
      if (isReadOnly) return false; 
      if (!allowedSubjects || allowedSubjects.includes('all')) return true; 
      return allowedSubjects.includes(selectedSubject);
  }, [isReadOnly, allowedSubjects, selectedSubject]);

  const activeSubject = useMemo(() => MOCK_SUBJECTS.find((s: Subject) => s.id === selectedSubject), [selectedSubject]);
  const currentKktp = kktpMap[selectedSubject] || activeSubject?.kkm || 75;

  const getInputColor = (score: number) => {
    if (!score || score === 0) return 'bg-transparent text-gray-800';
    if (score < currentKktp) return 'bg-rose-50 text-rose-700';
    return 'bg-emerald-50 text-emerald-700';
  };

  const recapData = useMemo(() => {
      const computed = students.map(student => {
          const studentRecord = grades.find(g => g.studentId === student.id);
          const scores: Record<string, number> = {};
          let totalScore = 0;
          let subjectsCount = 0;

          MOCK_SUBJECTS.forEach(subj => {
              const gData = studentRecord?.subjects[subj.id];
              let finalScore = 0;
              if (gData) {
                  const vals = [
                      Number(gData.sum1), 
                      Number(gData.sum2), 
                      Number(gData.sum3), 
                      Number(gData.sum4), 
                      Number(gData.sas)
                  ].filter(v => typeof v === 'number' && !isNaN(v) && v > 0);
                  if (vals.length > 0) {
                      finalScore = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
                  }
              }
              scores[subj.id] = finalScore;
              if (finalScore > 0) {
                  totalScore += finalScore;
                  subjectsCount++;
              }
          });

          return {
              ...student,
              scores,
              totalScore,
              subjectsCount
          };
      });

      computed.sort((a, b) => b.totalScore - a.totalScore);

      return computed.map((item, index) => ({
          ...item,
          rank: item.totalScore > 0 ? index + 1 : '-' 
      }));
  }, [students, grades]);

  const activeSubjectsForRecap = useMemo(() => {
      return MOCK_SUBJECTS.filter(subj => {
          return recapData.some(s => {
              const score = s.scores[subj.id];
              return typeof score === 'number' && !isNaN(score) && score > 0;
          });
      });
  }, [recapData]);

  const handleKktpChange = (newVal: number) => {
    if (!isSubjectEditable) return;
    setKktpMap(prev => ({...prev, [selectedSubject]: newVal}));
  };

  const saveKktp = async () => {
    if (!isSubjectEditable) return;
    setIsSavingKktp(true);
    try {
      await apiService.saveClassConfig('kktp', kktpMap, classId);
      onShowNotification(`KKTP untuk ${activeSubject?.name} berhasil diperbarui menjadi ${currentKktp}`, 'success');
    } catch (e) {
      onShowNotification("Gagal menyimpan KKTP", 'error');
    } finally {
      setIsSavingKktp(false);
    }
  };

  const getStudentGrade = (studentId: string): GradeData => {
    const record = grades.find(g => g.studentId === studentId);
    return record?.subjects[selectedSubject] || { sum1: 0, sum2: 0, sum3: 0, sum4: 0, sas: 0 };
  };

  const updateLocalGrade = (studentId: string, field: string, value: number) => {
    if (!isSubjectEditable) return;
    const val = Math.min(100, Math.max(0, value));
    setGrades(prevGrades => {
        const newGrades = [...prevGrades];
        let record = newGrades.find(g => g.studentId === studentId);
        if (!record) {
          record = { studentId, classId, subjects: {} };
          newGrades.push(record);
        }
        if (!record.subjects[selectedSubject]) {
          record.subjects[selectedSubject] = { sum1: 0, sum2: 0, sum3: 0, sum4: 0, sas: 0 };
        }
        record.subjects[selectedSubject] = { ...record.subjects[selectedSubject], [field]: val };
        return newGrades;
    });
  };
  
  const calculateFinalAverage = (g: GradeData) => {
    const scores = [];
    if (g.sum1) scores.push(g.sum1);
    if (g.sum2) scores.push(g.sum2);
    if (g.sum3) scores.push(g.sum3);
    if (g.sum4) scores.push(g.sum4);
    if (g.sas) scores.push(g.sas);
    
    Object.keys(g).forEach(k => {
      if (k.startsWith('sum') && k !== 'sum1' && k !== 'sum2' && k !== 'sum3' && k !== 'sum4') {
        if (g[k]) scores.push(Number(g[k]));
      }
    });

    const filledScores = scores.filter(s => s > 0);
    if (filledScores.length === 0) return 0;
    const sum = filledScores.reduce((acc, curr) => acc + curr, 0);
    return Math.round(sum / filledScores.length);
  };

  const handleAutoSaveRow = async (studentId: string) => {
    if (!isSubjectEditable) return;
    const gradeData = getStudentGrade(studentId);
    try {
      await onSave(studentId, selectedSubject, gradeData, classId);
    } catch (e) {
      console.error("Auto-save failed:", e);
    }
  };

  const handleAddCustomColumn = async () => {
    if (!isSubjectEditable) return;
    setIsAddingColumn(true);
    try {
      let nextNum = 5;
      while (customColumns.includes(`sum${nextNum}`)) {
        nextNum++;
      }
      const newCol = `sum${nextNum}`;
      const newColumns = [...customColumns, newCol];
      setCustomColumns(newColumns);
      await apiService.saveCustomGradeColumns(classId, selectedSubject, newColumns);
      onShowNotification(`Kolom SUM ${nextNum} berhasil ditambahkan!`, 'success');
    } catch (e) {
      console.error(e);
      onShowNotification('Gagal menambahkan kolom nilai', 'error');
    } finally {
      setIsAddingColumn(false);
    }
  };

  const handleRemoveCustomColumn = async () => {
    if (!isSubjectEditable || customColumns.length === 0) return;
    
    showConfirm('Apakah Anda yakin ingin menghapus kolom sumatif terakhir? Data nilai pada kolom tersebut tetap akan ada di database namun disembunyikan.', async () => {
        setIsRemovingColumn(true);
        try {
          const newColumns = [...customColumns];
          const removedCol = newColumns.pop();
          setCustomColumns(newColumns);
          await apiService.saveCustomGradeColumns(classId, selectedSubject, newColumns);
          onShowNotification(`Kolom ${removedCol?.toUpperCase()} berhasil dihapus!`, 'success');
        } catch (e) {
          console.error(e);
          onShowNotification('Gagal menghapus kolom nilai', 'error');
        } finally {
          setIsRemovingColumn(false);
        }
    });
  };

  const handleSaveRow = async (studentId: string) => {
    if (!isSubjectEditable) return;
    const gradeData = getStudentGrade(studentId);
    try {
      await onSave(studentId, selectedSubject, gradeData, classId);
      onShowNotification('Nilai individu berhasil disimpan!', 'success');
    } catch (e) {
      onShowNotification('Gagal menyimpan nilai. Cek koneksi Anda.', 'error');
    }
  };

  const handleSaveAll = async () => {
    if (!isSubjectEditable) return;
    showConfirm(`Simpan seluruh nilai untuk mata pelajaran ${activeSubject?.name}?`, async () => {
        setIsSavingAll(true);
        try {
            for (const student of students) {
                const gradeData = getStudentGrade(student.id);
                await onSave(student.id, selectedSubject, gradeData, classId);
            }
            onShowNotification('Seluruh data nilai kelas berhasil disinkronkan!', 'success');
        } catch (e) {
            onShowNotification('Gagal menyimpan beberapa data. Cek koneksi Anda.', 'error');
        } finally {
            setIsSavingAll(false);
        }
    });
  };

  const getSubjectInitials = (name: string) => {
      const ignore = ['pendidikan', 'dan', 'bahasa'];
      const parts = name.split(' ').filter(p => !ignore.includes(p.toLowerCase()));
      if (parts.length === 1) return parts[0].substring(0, 3).toUpperCase();
      return parts.map(p => p[0]).join('').toUpperCase();
  };

  const handlePrint = () => {
      const signatureBlock = `
        <div class="print-footer clearfix">
            <div class="signature-box signature-left">
                <p>Mengetahui,</p>
                <p>Kepala ${schoolProfile?.name || 'Sekolah'}</p>
                <div class="signature-space"></div>
                <p class="underline">${schoolProfile?.headmaster || '.........................'}</p>
                <p>NIP. ${schoolProfile?.headmasterNip || '.........................'}</p>
            </div>
            <div class="signature-box signature-right">
                <p>${recapPrintPlace || 'Remen'}, ${getFormattedPrintDate()}</p>
                <p>Guru Kelas ${classId}</p>
                <div class="signature-space"></div>
                <p class="underline">${teacherProfile?.name || '.........................'}</p>
                <p>NIP. ${teacherProfile?.nip || '.........................'}</p>
            </div>
        </div>
      `;

      let content = '';

      if (viewMode === 'input') {
          const subjectName = activeSubject?.name || selectedSubject;
          content = `
            <div class="print-header">
                <h2>REKAP NILAI SUMATIF</h2>
                <p>KELAS ${classId}</p>
                <p>TAHUN AJARAN ${schoolProfile?.year || new Date().getFullYear()}</p>
                <p>MATA PELAJARAN: ${subjectName.toUpperCase()}</p>
            </div>
            <table>
                <thead>
                    <tr>
                        <th style="width: 5%">No</th>
                        <th style="width: 25%">Nama Siswa</th>
                        <th style="width: 10%">NIS</th>
                        <th style="width: 10%">NISN</th>
                        <th style="width: 8%">SUM 1</th>
                        <th style="width: 8%">SUM 2</th>
                        <th style="width: 8%">SUM 3</th>
                        <th style="width: 8%">SUM 4</th>
                        <th style="width: 8%">SAS</th>
                        <th style="width: 10%">NILAI AKHIR</th>
                    </tr>
                </thead>
                <tbody>
                    ${students.map((s, idx) => {
                        const g = getStudentGrade(s.id);
                        const avg = calculateFinalAverage(g);
                        return `
                        <tr>
                            <td style="text-align: center">${idx + 1}</td>
                            <td>${s.name.toUpperCase()}</td>
                            <td>${s.nis}</td>
                            <td>${s.nisn || '-'}</td>
                            <td style="text-align: center">${g.sum1 || '-'}</td>
                            <td style="text-align: center">${g.sum2 || '-'}</td>
                            <td style="text-align: center">${g.sum3 || '-'}</td>
                            <td style="text-align: center">${g.sum4 || '-'}</td>
                            <td style="text-align: center">${g.sas || '-'}</td>
                            <td style="text-align: center; font-weight: bold;">${avg || '-'}</td>
                        </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
            ${signatureBlock}
          `;
       } else {
          content = `
            <div class="print-header">
                <h2>REKAP NILAI RAPOR</h2>
                <p>KELAS ${classId}</p>
                <p>TAHUN AJARAN ${schoolProfile?.year || new Date().getFullYear()}</p>
            </div>
            <table>
                <thead>
                    <tr>
                        <th style="width: 5%">No</th>
                        <th style="width: 20%">Nama Siswa</th>
                        <th style="width: 10%">NIS</th>
                        <th style="width: 10%">NISN</th>
                        ${activeSubjectsForRecap.map(s => `<th style="width: 5%">${getSubjectInitials(s.name)}</th>`).join('')}
                        <th style="width: 8%">Total</th>
                        <th style="width: 8%">Rata-Rata</th>
                        <th style="width: 8%">Rank</th>
                    </tr>
                </thead>
                <tbody>
                    ${recapData.map((s, idx) => {
                        const average = s.subjectsCount > 0 ? (s.totalScore / s.subjectsCount).toFixed(2).replace('.', ',') : '-';
                        return `
                            <tr>
                                <td style="text-align: center">${idx + 1}</td>
                                <td>${s.name.toUpperCase()}</td>
                                <td>${s.nis}</td>
                                <td>${s.nisn || '-'}</td>
                                ${activeSubjectsForRecap.map(subj => `<td style="text-align: center">${s.scores[subj.id] || '-'}</td>`).join('')}
                                <td style="text-align: center; font-weight: bold;">${s.totalScore}</td>
                                <td style="text-align: center; font-weight: bold;">${average}</td>
                                <td style="text-align: center">${s.rank}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
            ${signatureBlock}
          `;
      }

      const htmlContent = `
        <div style="font-family: 'Times New Roman', Times, serif; padding: 20px; font-size: 10pt; color: #000; background: #fff; width: 100%;">
          <style>
            table { width: 100%; border-collapse: collapse; margin-bottom: 10px; table-layout: fixed; page-break-inside: avoid; break-inside: avoid; }
            th, td { border: 1px solid black; padding: 4px; text-align: left; vertical-align: middle; word-wrap: break-word; }
            th { text-align: center; font-weight: bold; background-color: #f0f0f0 !important; -webkit-print-color-adjust: exact; }
            tr { page-break-inside: avoid; break-inside: avoid; }
            .print-header { text-align: center; margin-bottom: 20px; line-height: 1.2; font-weight: bold; page-break-inside: avoid; break-inside: avoid; }
            .print-header h2, .print-header p { margin: 0; padding: 0; text-transform: uppercase; }
            .print-footer { margin-top: 30px; width: 100%; font-size: 11pt; page-break-inside: avoid; break-inside: avoid; }
            .signature-box { width: 45%; text-align: center; page-break-inside: avoid; break-inside: avoid; }
            .signature-box p { margin: 0; line-height: 1.4; }
            .signature-left { float: left; }
            .signature-right { float: right; }
            .signature-space { height: 60px; }
            .underline { text-decoration: underline; font-weight: bold; }
            .clearfix::after { content: ""; clear: both; display: table; }
            @page { size: A4 landscape; margin: 1.5cm; }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              table, tr, td, th { page-break-inside: avoid !important; break-inside: avoid !important; }
            }
          </style>
          ${content}
          ${signatureBlock}
        </div>
      `;

      onShowNotification('Sedang menyiapkan dokumen PDF...', 'warning');
      
      const element = document.createElement('div');
      element.innerHTML = htmlContent;
      
      const opt = {
        margin: 10,
        filename: `Rekap_Nilai_${classId}_${new Date().getTime()}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { 
            scale: 2, 
            useCORS: true,
            logging: false,
            letterRendering: true,
            windowWidth: 1122
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' as const },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'], avoid: ['table', 'tr', '.print-header', '.print-footer', '.signature-box'] }
      };

      html2pdf().set(opt).from(element).save().then(() => {
          onShowNotification('PDF berhasil diunduh', 'success');
      }).catch((err: any) => {
          console.error('PDF generation error:', err);
          onShowNotification('Gagal mengunduh PDF, mencoba membuka jendela cetak browser...', 'error');
          
          const newWindow = window.open("", "", "width=1200,height=800");
          if (newWindow) {
              newWindow.document.write(`
                <html>
                  <head>
                    <title>Rekap Nilai - Kelas ${classId}</title>
                  </head>
                  <body>
                    ${htmlContent}
                  </body>
                </html>
              `);
              newWindow.document.close();
              setTimeout(() => {
                  newWindow.focus();
                  newWindow.print();
                  newWindow.close();
              }, 500);
          }
      });
  };

  const handleDownloadTemplate = () => { 
      const headers = ["NIS", "Nama Siswa", "Mata Pelajaran(ID)", "SUM 1", "SUM 2", "SUM 3", "SUM 4", "SAS"];
      
      const rows = students.map(student => [
        student.nis || '-',
        student.name.toUpperCase(),
        selectedSubject,
        "", "", "", "", ""
      ]);

      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Template Nilai");
      XLSX.writeFile(workbook, `template_nilai_${selectedSubject}.xlsx`);
  };
  
  const handleExport = () => { 
      if (viewMode === 'recap') {
          const headers = ["Rank", "NIS", "NISN", "Nama Siswa", ...activeSubjectsForRecap.map(s => s.name), "Total Nilai", "Rata-Rata"];
          const rows = recapData.map(s => {
              const avg = s.subjectsCount > 0 ? Number((s.totalScore / s.subjectsCount).toFixed(2)) : 0;
              return [
                  s.rank, 
                  s.nis, 
                  s.nisn || '-',
                  s.name.toUpperCase(), 
                  ...activeSubjectsForRecap.map(subj => s.scores[subj.id] || 0),
                  s.totalScore,
                  avg
              ];
          });
          const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
          const workbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(workbook, worksheet, "Rekap Rapor");
          XLSX.writeFile(workbook, `rekap_nilai_rapor_kelas_${classId}.xlsx`);
      } else {
          const subjectName = activeSubject?.name || selectedSubject;
          const headers = ["NIS", "Nama Siswa", "Mata Pelajaran", "SUM 1", "SUM 2", "SUM 3", "SUM 4", "SAS", "Nilai Akhir", "Status"];
          const rows = students.map(s => {
             const g = getStudentGrade(s.id);
             const avg = calculateFinalAverage(g);
             const status = avg >= currentKktp ? 'Tuntas' : 'Belum Tuntas';
             return [s.nis, s.name.toUpperCase(), subjectName, g.sum1, g.sum2, g.sum3, g.sum4, g.sas, avg, status];
          });
          const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
          const workbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(workbook, worksheet, `Nilai ${selectedSubject}`);
          XLSX.writeFile(workbook, `nilai_${selectedSubject}.xlsx`);
      }
  };
  
  const handleImportClick = () => fileInputRef.current?.click();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { 
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        const rows = data.slice(1) as any[]; 
        let updateCount = 0;

        if (viewMode === 'recap') {
            const headers = data[0] as string[];
            const subjectCols: {id: string, index: number}[] = [];
            MOCK_SUBJECTS.forEach(subj => {
                const idx = headers.findIndex(h => h && (h.toLowerCase() === subj.name.toLowerCase() || h.toLowerCase() === subj.id.toLowerCase()));
                if (idx !== -1) subjectCols.push({ id: subj.id, index: idx });
            });
            const nisIdx = headers.findIndex(h => h && h.toLowerCase().includes('nis') && !h.toLowerCase().includes('nisn'));
            rows.forEach((row) => {
                if (!row || row.length === 0) return;
                const nis = row[nisIdx] ? String(row[nisIdx]) : '';
                const student = students.find(s => s.nis === nis);
                if (student) {
                    subjectCols.forEach(sc => {
                        const score = Number(row[sc.index]);
                        if (!isNaN(score) && score > 0) {
                            const newData = { sum1: 0, sum2: 0, sum3: 0, sum4: 0, sas: score };
                            onSave(student.id, sc.id, newData, classId);
                        }
                    });
                    updateCount++;
                }
            });
            onShowNotification(`Berhasil memproses impor rekap untuk ${updateCount} siswa.`, 'success');
        } else {
            const updates: { studentId: string; newData: GradeData }[] = [];
            rows.forEach((row) => {
                if (!row || row.length === 0) return;
                const nis = row[0] ? String(row[0]) : '';
                const student = students.find(s => s.nis === nis);
                if (student) {
                    const record = grades.find(g => g.studentId === student.id);
                    const existingGrade = record?.subjects[selectedSubject] || { sum1: 0, sum2: 0, sum3: 0, sum4: 0, sas: 0 };
                    
                    const parseImportValue = (val: any, existingVal: number): number => {
                        if (val === undefined || val === null) return existingVal;
                        const str = String(val).trim();
                        if (str === "") return existingVal;
                        const num = Number(str);
                        return isNaN(num) ? existingVal : num;
                    };
                    
                    const newData = {
                        ...existingGrade,
                        sum1: parseImportValue(row[3], existingGrade.sum1 || 0),
                        sum2: parseImportValue(row[4], existingGrade.sum2 || 0),
                        sum3: parseImportValue(row[5], existingGrade.sum3 || 0),
                        sum4: parseImportValue(row[6], existingGrade.sum4 || 0),
                        sas: parseImportValue(row[7], existingGrade.sas || 0),
                    };
                    
                    updates.push({ studentId: student.id, newData });
                }
            });

            if (updates.length > 0) {
                setGrades(prevGrades => {
                    const newGrades = [...prevGrades];
                    updates.forEach(({ studentId, newData }) => {
                        let record = newGrades.find(g => g.studentId === studentId);
                        if (!record) {
                            record = { studentId, classId, subjects: {} };
                            newGrades.push(record);
                        }
                        record.subjects[selectedSubject] = newData;
                    });
                    return newGrades;
                });

                updates.forEach(({ studentId, newData }) => {
                    onSave(studentId, selectedSubject, newData, classId);
                });
                
                updateCount = updates.length;
            }
            onShowNotification(`Berhasil memproses impor untuk ${updateCount} siswa.`, 'success');
        }
        if(fileInputRef.current) fileInputRef.current.value = '';
      };
      reader.readAsBinaryString(file);
  };

  useEffect(() => {
    if (viewMode === 'history' && classId) {
      loadHistory();
    }
  }, [viewMode, classId]);

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const history = await apiService.getClassGradeHistory(classId);
      setGradeHistory(history || []);
      
      // Auto select latest cohort if not selected
      if (history && history.length > 0) {
          const cohorts = Array.from(new Set(history.map(h => `${h.academicYear}|${h.semester}`)));
          cohorts.sort((a, b) => b.localeCompare(a)); // Sort descending
          if (cohorts.length > 0) {
              setSelectedHistoryCohort(cohorts[0]);
          }
      }
    } catch (e) {
      console.error(e);
      onShowNotification('Gagal memuat riwayat nilai.', 'error');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const historyCohorts = useMemo(() => {
    const cohorts = Array.from(new Set(gradeHistory.map(h => `${h.academicYear}|${h.semester}`)));
    return cohorts.sort((a, b) => b.localeCompare(a));
  }, [gradeHistory]);

  const filteredHistoryData = useMemo(() => {
    if (!selectedHistoryCohort) return [];
    const [year, sem] = selectedHistoryCohort.split('|');
    const records = gradeHistory.filter(h => h.academicYear === year && h.semester === sem);
    
    // Sort by total score for ranking
    records.sort((a, b) => b.totalScore - a.totalScore);
    
    return records.map((r, idx) => ({
      ...r,
      rank: r.totalScore > 0 ? idx + 1 : '-'
    }));
  }, [gradeHistory, selectedHistoryCohort]);

  const activeSubjectsForHistory = useMemo(() => {
    return MOCK_SUBJECTS.filter(subj => {
      return filteredHistoryData.some(h => {
        const score = h.scores[subj.id];
        return typeof score === 'number' && !isNaN(score) && score > 0;
      });
    });
  }, [filteredHistoryData]);

  const handleDeleteCohort = async () => {
    if (isReadOnly || !selectedHistoryCohort) return;
    const [year, sem] = selectedHistoryCohort.split('|');
    
    showConfirm(`Hapus seluruh data riwayat untuk Tahun ${year} Semester ${sem}?`, async () => {
        setIsDeletingHistory(true);
        try {
            const recordsToDelete = gradeHistory.filter(h => h.academicYear === year && h.semester === sem);
            for (const record of recordsToDelete) {
                await apiService.deleteClassGradeHistory(classId, record.id);
            }
            setGradeHistory(prev => prev.filter(h => !(h.academicYear === year && h.semester === sem)));
            setSelectedHistoryCohort('');
            onShowNotification('Seluruh riwayat periode tersebut berhasil dihapus.', 'success');
        } catch (e) {
            onShowNotification('Gagal menghapus riwayat.', 'error');
        } finally {
            setIsDeletingHistory(false);
        }
    });
  };

  const handleArchiveSemester = async () => {
    if (isReadOnly) return;
    showConfirm(`Simpan rekap semester ini ke Riwayat Nilai? Data tahun ${schoolProfile?.year || '-'} Semester ${schoolProfile?.semester || '-'} akan diarsipkan.`, async () => {
        setIsArchiving(true);
        try {
            const year = schoolProfile?.year || new Date().getFullYear().toString();
            const semester = schoolProfile?.semester || '1';
            for (const s of recapData) {
                const studentRecord = grades.find(g => g.studentId === s.id);
                const historyEntry: GradeHistoryRecord = {
                    id: `${year}_${semester}_${s.id}`.replace(/\//g, '-'),
                    studentId: s.id,
                    classId: classId,
                    academicYear: year,
                    semester: semester,
                    totalScore: s.totalScore,
                    averageScore: s.subjectsCount > 0 ? Math.round(s.totalScore / s.subjectsCount) : 0,
                    rank: s.rank,
                    subjectsCount: s.subjectsCount,
                    scores: s.scores,
                    fullScores: studentRecord?.subjects || {},
                    createdAt: new Date().toISOString()
                };
                await apiService.saveClassGradeHistory(classId, historyEntry);
            }
            onShowNotification('Seluruh rekap semester ini berhasil diarsipkan ke riwayat.', 'success');
            if (viewMode === 'history') loadHistory();
        } catch (e) {
            console.error(e);
            onShowNotification('Gagal mengarsipkan nilai.', 'error');
        } finally {
            setIsArchiving(false);
        }
    });
  };

  const handleDeleteHistoryEntry = async (id: string) => {
    if (isReadOnly) return;
    showConfirm('Hapus rekaman riwayat ini?', async () => {
        setIsDeletingHistory(true);
        try {
            await apiService.deleteClassGradeHistory(classId, id);
            setGradeHistory(prev => prev.filter(h => h.id !== id));
            onShowNotification('Riwayat berhasil dihapus.', 'success');
        } catch (e) {
            onShowNotification('Gagal menghapus riwayat.', 'error');
        } finally {
            setIsDeletingHistory(false);
        }
    });
  };

  const handleDownloadHistoryTemplate = () => {
    const headers = ["TAHUN AJARAN", "SEMESTER(1/2)", "NIS", "NAMA SISWA", ...MOCK_SUBJECTS.map(s => s.name)];
    const currentYear = new Date().getFullYear();
    const ta = `${currentYear}/${currentYear + 1}`;
    
    const rows = students.map(student => [
        ta,
        "1",
        student.nis || "-",
        student.name.toUpperCase(),
        ...MOCK_SUBJECTS.map(() => "")
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template Riwayat");
    XLSX.writeFile(workbook, `Template_Riwayat_Nilai.xlsx`);
  };

  const handleFileChangeHistory = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        const rows = data.slice(1) as any[];
        const headers = data[0] as string[];
        const yearIdx = 0, semIdx = 1, nisIdx = 2;
        const subjectCols: {id: string, index: number}[] = [];
        MOCK_SUBJECTS.forEach(subj => {
            const idx = headers.findIndex(h => h && h.toLowerCase().includes(subj.name.toLowerCase()));
            if (idx !== -1) subjectCols.push({ id: subj.id, index: idx });
        });
        let count = 0;
        for (const row of rows) {
            if (!row || row.length < 3) continue;
            const year = String(row[yearIdx]), sem = String(row[semIdx]), nis = String(row[nisIdx]);
            const student = students.find(s => s.nis === nis);
            if (student) {
                const scores: Record<string, number> = {};
                let total = 0, subCount = 0;
                subjectCols.forEach(sc => {
                    const score = Number(row[sc.index]);
                    if (!isNaN(score) && score > 0) { scores[sc.id] = score; total += score; subCount++; }
                });
                const historyEntry: GradeHistoryRecord = {
                    id: `${year}_${sem}_${student.id}`.replace(/\//g, '-'),
                    studentId: student.id, classId: classId, academicYear: year, semester: sem,
                    totalScore: total, averageScore: subCount > 0 ? Math.round(total / subCount) : 0,
                    rank: '-', subjectsCount: subCount, scores, createdAt: new Date().toISOString()
                };
                await apiService.saveClassGradeHistory(classId, historyEntry);
                count++;
            }
        }
        onShowNotification(`Berhasil mengimpor ${count} rekaman riwayat.`, 'success');
        loadHistory();
        if (historyFileInputRef.current) historyFileInputRef.current.value = '';
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-6 animate-fade-in page-landscape">
       <div className="flex flex-col xl:flex-row justify-between gap-4 no-print">
          <div>
             <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                {viewMode === 'input' ? (isReadOnly ? 'Lihat Nilai Saya' : `Input Nilai ${activeSubject?.name}`) : (viewMode === 'recap' ? 'Rekap Nilai Rapor & Peringkat' : (viewMode === 'tka_recap' ? 'Rekap Hasil Nilai TKA' : 'Riwayat Nilai Siswa'))}
                {!isSubjectEditable && !isReadOnly && viewMode === 'input' && <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded border border-gray-200 flex items-center"><Lock size={12} className="mr-1"/> Read Only</span>}
             </h2>
             <p className="text-gray-500 text-sm">
                {viewMode === 'input' ? `Kelola nilai sumatif & formatif. Ambang batas (KKTP): ${currentKktp}.` : (viewMode === 'recap' ? 'Ringkasan nilai akhir semua mapel dan kalkulasi peringkat siswa.' : (viewMode === 'tka_recap' ? 'Rekapitulasi hasil Tes Kemampuan Akademik (TKA) Mata Pelajaran Matematika dan Bahasa Indonesia.' : 'Kumpulan data nilai siswa dari semester atau tahun ajaran sebelumnya.'))}
             </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
              {viewMode === 'input' && !isReadOnly && (
                  <div className="flex items-center gap-2">
                      <button onClick={handleAddCustomColumn} disabled={isAddingColumn} className="flex items-center px-3 py-1.5 rounded-lg text-xs font-bold transition-all border bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100">
                          {isAddingColumn ? <Loader2 size={14} className="animate-spin mr-1.5"/> : <Plus size={14} className="mr-1.5"/>}
                          <span>Tambah Kolom</span>
                      </button>
                      {customColumns.length > 0 && (
                          <button onClick={handleRemoveCustomColumn} disabled={isRemovingColumn} className="flex items-center px-3 py-1.5 rounded-lg text-xs font-bold transition-all border bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100">
                              {isRemovingColumn ? <Loader2 size={14} className="animate-spin mr-1.5"/> : <Minus size={14} className="mr-1.5"/>}
                              <span>Hapus Kolom</span>
                          </button>
                      )}
                  </div>
              )}

              {viewMode === 'input' && !isReadOnly && (
                  <button onClick={toggleSummativeVisibility} disabled={isTogglingSummative} className={`flex items-center px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${showSummativeToStudents ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}>
                      {isTogglingSummative ? <Loader2 size={14} className="animate-spin mr-1.5"/> : showSummativeToStudents ? <Eye size={14} className="mr-1.5"/> : <EyeOff size={14} className="mr-1.5"/>}
                      <span>Portal Siswa (Sumatif): {showSummativeToStudents ? 'ON' : 'OFF'}</span>
                  </button>
              )}
              
              {viewMode === 'recap' && !isReadOnly && (
                  <button onClick={toggleStudentRecapVisibility} disabled={isTogglingRecap} className={`flex items-center px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${showRecapToStudents ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}>
                      {isTogglingRecap ? <Loader2 size={14} className="animate-spin mr-1.5"/> : showRecapToStudents ? <Eye size={14} className="mr-1.5"/> : <EyeOff size={14} className="mr-1.5"/>}
                      <span>Portal Siswa: {showRecapToStudents ? 'ON' : 'OFF'}</span>
                  </button>
              )}

              <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
                  <button onClick={() => setViewMode('input')} className={`flex items-center px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'input' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>
                      <Grid size={14} className="mr-1.5"/> Per Mapel
                  </button>
                  <button onClick={() => setViewMode('recap')} className={`flex items-center px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'recap' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>
                      <List size={14} className="mr-1.5"/> Rekap Rapor
                  </button>
                  {canAccessTKA && (
                     <button onClick={() => setViewMode('tka_recap')} className={`flex items-center px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'tka_recap' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>
                         <Calculator size={14} className="mr-1.5"/> Rekap TKA
                     </button>
                  )}
                  <button onClick={() => setViewMode('history')} className={`flex items-center px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'history' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>
                      <History size={14} className="mr-1.5"/> Riwayat
                  </button>
              </div>

              {viewMode === 'input' && (
                  <>
                    <div className="flex items-center bg-white border border-indigo-100 p-1 rounded-xl shadow-sm">
                        <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600 mr-2"> <Settings2 size={16} /> </div>
                        <div className="flex flex-col mr-3">
                            <span className="text-[10px] font-bold text-gray-400 uppercase">KKTP</span>
                            {!isSubjectEditable ? <span className="font-bold text-indigo-700">{currentKktp}</span> : <input type="number" min="0" max="100" value={currentKktp} onChange={(e) => handleKktpChange(Number(e.target.value))} className="w-16 font-bold text-indigo-700 outline-none bg-transparent"/>}
                        </div>
                        {isSubjectEditable && <button onClick={saveKktp} disabled={isSavingKktp} className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50">{isSavingKktp ? '...' : 'Simpan'}</button>}
                    </div>
                    <div className="relative">
                        <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} className="appearance-none bg-white border border-gray-200 text-gray-700 py-2.5 pl-4 pr-10 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm cursor-pointer min-w-[200px]">
                            {MOCK_SUBJECTS.map((s: Subject) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"><ChevronDown size={16} /></div>
                    </div>
                    {isSubjectEditable && <button onClick={handleSaveAll} disabled={isSavingAll} className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 shadow-md font-bold disabled:opacity-50"><Save size={18}/> <span className="hidden sm:inline">{isSavingAll ? 'Proses...' : 'Simpan Semua'}</span></button>}
                  </>
              )}

              {viewMode === 'tka_recap' && (
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Filter Tryout TKA */}
                    <div className="flex items-center bg-white border border-gray-200 px-3 py-1.5 rounded-xl shadow-sm gap-2">
                        <span className="text-xs font-bold text-gray-500 uppercase">Tryout TKA:</span>
                        <div className="relative flex items-center">
                             <select 
                                value={selectedTkaTitle} 
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === '__add_new__') {
                                        setShowAddTkaModal(true);
                                        // Reset the select element visual choice so it doesn't stay selected
                                        e.target.value = selectedTkaTitle;
                                    } else {
                                        setSelectedTkaTitle(val);
                                    }
                                }} 
                                className="appearance-none bg-transparent text-gray-700 pr-6 font-bold text-xs outline-none cursor-pointer border-none py-0"
                            >
                                {tkaList.map(title => (
                                    <option key={title} value={title}>{title}</option>
                                ))}
                                <option value="__add_new__">+ Tambah Tryout Baru...</option>
                            </select>
                            <ChevronDown size={14} className="pointer-events-none text-gray-400 absolute right-0" />
                        </div>
                    </div>

                    <button onClick={handleSaveAllTKA} disabled={isSavingAll} className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 shadow-md font-bold disabled:opacity-50">
                        <Save size={18}/>
                        <span>{isSavingAll ? 'Proses...' : 'Simpan Semua TKA'}</span>
                    </button>
                    <button onClick={handleExportTKA} className="flex items-center space-x-2 bg-[#5AB2FF] text-white px-4 py-2 rounded-lg hover:bg-[#4A9FE6] shadow-md font-bold">
                        <Download size={18}/>
                        <span>Ekspor Excel TKA</span>
                    </button>
                  </div>
              )}

              {viewMode === 'history' && historyCohorts.length > 0 && (
                  <div className="flex flex-col">
                      <span className="text-[10px] font-black text-indigo-400 uppercase mb-1 ml-1">Pilih Periode Riwayat</span>
                      <div className="relative">
                          <select 
                              value={selectedHistoryCohort} 
                              onChange={(e) => setSelectedHistoryCohort(e.target.value)} 
                              className="appearance-none bg-white border border-indigo-200 text-indigo-700 py-2.5 pl-4 pr-10 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm cursor-pointer min-w-[250px]"
                          >
                              {historyCohorts.map(cohort => {
                                  const [year, sem] = cohort.split('|');
                                  return <option key={cohort} value={cohort}>{`TA ${year} - Semester ${sem}`}</option>;
                              })}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-indigo-500"><ChevronDown size={16} /></div>
                      </div>
                  </div>
              )}

              <div className="flex gap-1">
                {!isReadOnly && (
                    <>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".xlsx, .xls, .csv" />
                        <input type="file" ref={historyFileInputRef} onChange={handleFileChangeHistory} className="hidden" accept=".xlsx, .xls, .csv" />
                        {viewMode === 'history' && <button onClick={handleDownloadHistoryTemplate} className="p-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50" title="Download Template Riwayat"><FileSpreadsheet size={18}/></button>}
                        {viewMode === 'input' && isSubjectEditable && <button onClick={handleDownloadTemplate} className="p-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50" title="Download Template"><FileSpreadsheet size={18}/></button>}
                        <button onClick={viewMode === 'history' ? () => historyFileInputRef.current?.click() : handleImportClick} className="p-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50" title={viewMode === 'recap' ? "Import Massal Rekap" : (viewMode === 'history' ? "Import Riwayat" : "Import Excel")}><Upload size={18}/></button>
                        <button onClick={handleExport} className="p-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50" title="Export Excel"><Download size={18}/></button>
                    </>
                )}
                <button onClick={handlePrint} className="p-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50" title="Cetak"><Printer size={18}/></button>
              </div>
          </div>
       </div>

       {viewMode === 'recap' && !isReadOnly && (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#F0F9FF] border border-blue-100 p-4 rounded-2xl no-print mb-4 animate-fade-in w-full">
              <div className="flex flex-wrap items-center gap-4">
                  <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1">Kota / Tempat Cetak</span>
                      <input 
                          type="text" 
                          value={recapPrintPlace} 
                          onChange={(e) => setRecapPrintPlace(e.target.value)} 
                          placeholder="Contoh: Remen" 
                          className="px-3 py-1.5 text-xs bg-white border border-blue-200 rounded-lg font-bold outline-none focus:ring-2 focus:ring-[#5AB2FF] focus:border-transparent min-w-[120px]"
                      />
                  </div>
                  <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1">Tanggal Cetak Rapor</span>
                      <input 
                          type="date" 
                          value={recapPrintDate} 
                          onChange={(e) => setRecapPrintDate(e.target.value)} 
                          className="px-3 py-1.5 text-xs bg-white border border-blue-200 rounded-lg font-bold outline-none focus:ring-2 focus:ring-[#5AB2FF] focus:border-transparent cursor-pointer"
                      />
                  </div>
                  <div className="flex items-end">
                      <button 
                          onClick={() => handleSavePrintSettings(recapPrintDate, recapPrintPlace)}
                          disabled={isSavingPrintSettings}
                          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                      >
                          {isSavingPrintSettings ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                          <span>Simpan Pengaturan Cetak</span>
                      </button>
                  </div>
              </div>
              <button onClick={handleArchiveSemester} disabled={isArchiving} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 shadow-md transition-all font-bold">
                  {isArchiving ? <Loader2 size={18} className="animate-spin" /> : <History size={18} />}
                  <span>Simpan Rekap Semester ini ke Riwayat</span>
              </button>
          </div>
       )}

       {viewMode === 'input' ? (
           <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto print-container">
              <table className="w-full text-sm text-left border-collapse">
                 <thead className="bg-slate-50 text-slate-700 font-bold print:bg-white print:border-b print:text-black">
                    <tr className="border-b">
                       <th className="p-4 sticky left-0 bg-slate-50 print:bg-white w-12 text-center border-r z-20 hidden md:table-cell">No</th>
                       <th className="p-4 sticky left-0 md:left-12 bg-slate-50 print:bg-white min-w-[124px] md:min-w-[220px] max-w-[124px] md:max-w-none border-r z-20">Nama Siswa</th>
                       <th className="p-2 w-20 text-center border-r">SUM 1</th>
                       <th className="p-2 w-20 text-center border-r">SUM 2</th>
                       <th className="p-2 w-20 text-center border-r">SUM 3</th>
                       <th className="p-2 w-20 text-center border-r">SUM 4</th>
                       {customColumns.map(col => <th key={col} className="p-2 w-20 text-center border-r uppercase">{col.replace('sum', 'SUM ')}</th>)}
                       <th className="p-2 w-24 text-center border-r bg-blue-50/50 print:bg-white">SAS</th>
                       <th className="p-2 w-28 text-center bg-indigo-600 text-white print:bg-white print:text-black border-l">Nilai Akhir</th>
                       {isSubjectEditable && <th className="p-2 w-16 text-center no-print">Aksi</th>}
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100 print:divide-gray-300">
                    {students.map((s, idx) => {
                       const g = getStudentGrade(s.id);
                       const finalAvg = calculateFinalAverage(g);
                       return (
                          <tr key={s.id} className="hover:bg-indigo-50/30 transition-colors print:hover:bg-transparent border-b">
                             <td className="p-4 sticky left-0 bg-white text-center border-r z-10 w-12 font-medium print:text-black hidden md:table-cell">
                                 {idx + 1}
                              </td>
                              <td className="p-4 sticky left-0 md:left-12 bg-white font-medium print:text-black border-r z-10 max-w-[124px] md:max-w-none">
                                <div className="flex flex-col truncate">
                                     <span className="truncate text-xs md:text-sm" title={s.name.toUpperCase()}>{s.name.toUpperCase()}</span>
                                     <div className="flex gap-1 text-[9px] text-gray-400 no-print truncate"><span>NIS: {s.nis}</span>{s.nisn && <span className="hidden sm:inline">• NISN: {s.nisn}</span>}</div>
                                 </div>
                             </td>
                             {(['sum1','sum2','sum3','sum4', ...customColumns, 'sas'] as string[]).map(f => {
                                const score = Number(g[f]) || 0;
                                const colorClass = getInputColor(score);
                                return (
                                   <td key={String(f)} className={`p-1 border-r align-top ${f === 'sas' ? 'bg-blue-50/30 print:bg-white' : ''}`}>
                                       {!isSubjectEditable ? (
                                         <div>
                                            <div className={`w-full text-center py-2 font-bold rounded-lg ${colorClass}`}>{score > 0 ? score : '-'}</div>
                                            {score > 0 && <div className="text-center text-[9px] font-bold mt-1">{score < currentKktp ? <span className="text-rose-600">Remidi</span> : <span className="text-emerald-600">Pengayaan</span>}</div>}
                                         </div>
                                       ) : (
                                        <div>
                                            <input 
                                               type="number" 
                                               min="0" 
                                               max="100" 
                                               value={score === 0 ? '' : score} 
                                               placeholder="0"
                                               onChange={e => {
                                                  const val = e.target.value;
                                                  updateLocalGrade(s.id, f, val === '' ? 0 : Number(val));
                                                }}
                                               onBlur={() => handleAutoSaveRow(s.id)} 
                                               className={`w-full text-center py-2 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none rounded-lg print:border-none print:p-0 ${f === 'sas' ? 'font-bold' : ''} ${colorClass}`}
                                            />
                                            {score > 0 && <div className="text-center text-[9px] font-bold mt-1">{score < currentKktp ? <span className="text-rose-600">Remidi</span> : <span className="text-emerald-600">Pengayaan</span>}</div>}
                                        </div>
                                       )}
                                    </td>
                                );
                             })}
                             <td className={`p-2 text-center border-l font-black text-lg bg-indigo-50 text-indigo-700 print:bg-white print:text-black`}><span>{finalAvg > 0 ? finalAvg : '-'}</span></td>
                             {isSubjectEditable && <td className="p-2 text-center no-print"><button onClick={()=>handleSaveRow(s.id)} className="text-gray-400 hover:text-emerald-600 transition-colors" title="Simpan Baris"><Save size={18}/></button></td>}
                          </tr>
                       );
                    })}
                 </tbody>
              </table>
           </div>
       ) : viewMode === 'recap' ? (
           <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto print-container">
               <div className="hidden print-only text-center py-4 border-b"><h2 className="text-xl font-bold uppercase">REKAP NILAI RAPOR</h2><p className="text-sm">Kelas {classId}</p></div>
               <table className="w-full text-xs text-left border-collapse min-w-[1000px]">
                   <thead className="bg-indigo-50 text-indigo-900 font-bold uppercase print:bg-gray-100 print:text-black">
                       <tr className="border-b border-indigo-100">
                           <th className="p-3 w-10 text-center border-r border-indigo-100 sticky left-0 bg-indigo-50 z-20 hidden md:table-cell">No</th>
                           <th className="p-3 min-w-[124px] md:min-w-[200px] max-w-[124px] md:max-w-none border-r border-indigo-100 sticky left-0 md:left-10 bg-indigo-50 z-20">Nama Siswa</th>
                           {activeSubjectsForRecap.map(subj => <th key={subj.id} className="p-2 w-16 text-center border-r border-indigo-100" title={subj.name}>{getSubjectInitials(subj.name)}</th>)}
                           <th className="p-3 w-20 text-center border-r border-indigo-100 bg-emerald-50 text-emerald-800">Jumlah</th>
                            <th className="p-3 w-24 text-center border-r border-indigo-100 bg-sky-50 text-sky-800">Rata-Rata</th>
                           <th className="p-3 w-20 text-center bg-amber-50 text-amber-800">Peringkat</th>
                       </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100">
                       {recapData.map((s, idx) => {
                           const rank = Number(s.rank);
                           const isTop3 = rank > 0 && rank <= 3;
                           return (
                               <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                                   <td className="p-3 text-center text-gray-500 border-r sticky left-0 bg-white group-hover:bg-gray-50 z-10 hidden md:table-cell">{idx + 1}</td>
                                   <td className="p-3 font-medium text-gray-800 border-r sticky left-0 md:left-10 bg-white group-hover:bg-gray-50 z-10 max-w-[124px] md:max-w-[200px] truncate">
                                       <div className="flex flex-col truncate"><span className="uppercase truncate text-xs md:text-sm" title={s.name.toUpperCase()}>{s.name.toUpperCase()}</span><div className="flex gap-1 text-[9px] text-gray-500 truncate no-print"><span>NIS: {s.nis}</span>{s.nisn && <span className="hidden sm:inline">• NISN: {s.nisn}</span>}</div></div>
                                   </td>
                                   {activeSubjectsForRecap.map(subj => <td key={subj.id} className="p-2 text-center border-r font-medium text-gray-600">{s.scores[subj.id] || '-'}</td>)}
                                   <td className="p-3 text-center font-bold text-emerald-600 bg-emerald-50/30 border-r border-emerald-100">{s.totalScore > 0 ? s.totalScore : '-'}</td>
                                    <td className="p-3 text-center font-bold text-sky-600 bg-sky-50/30 border-r border-sky-100">
                                        {s.subjectsCount > 0 ? (s.totalScore / s.subjectsCount).toFixed(2).replace('.', ',') : '-'}
                                    </td>
                                   <td className={`p-3 text-center font-black ${isTop3 ? 'bg-amber-50 text-amber-600' : 'text-gray-500'}`}><div className="flex items-center justify-center gap-1">{rank === 1 && <Trophy size={14} className="text-yellow-500 fill-yellow-500"/>}{rank === 2 && <Trophy size={14} className="text-gray-400 fill-gray-400"/>}{rank === 3 && <Trophy size={14} className="text-amber-700 fill-amber-700"/>}{s.rank}</div></td>
                               </tr>
                           );
                       })}
                   </tbody>
               </table>
           </div>
       ) : viewMode === 'tka_recap' ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto print-container">
                <div className="hidden print-only text-center py-4 border-b"><h2 className="text-xl font-bold uppercase">REKAP HASIL NILAI TRYOUT TKA</h2><p className="text-sm">Kelas {classId}</p></div>
                <table className="w-full text-xs text-left border-collapse min-w-[1000px]">
                    <thead className="bg-indigo-50 text-indigo-900 font-bold uppercase print:bg-gray-100 print:text-black">
                        <tr className="border-b border-indigo-100">
                            <th className="p-3 w-12 text-center border-r border-indigo-100 sticky left-0 bg-indigo-50 z-20 hidden md:table-cell">No</th>
                            <th className="p-3 w-32 text-center border-r border-indigo-100 sticky left-0 md:left-12 bg-indigo-50 z-20">NIS</th>
                            <th className="p-3 w-32 text-center border-r border-indigo-100 bg-indigo-50">NISN</th>
                            <th className="p-3 min-w-[260px] md:min-w-[300px] text-center border-r border-indigo-100 bg-indigo-50">Nama Siswa</th>
                            <th className="p-3 min-w-[160px] text-center border-r border-indigo-100">Tryout TKA</th>
                            <th className="p-3 w-32 text-center border-r border-indigo-100 bg-amber-50 text-amber-800">Matematika</th>
                            <th className="p-3 w-24 text-center border-r border-indigo-100 bg-amber-50/50 text-amber-800">Predikat</th>
                            <th className="p-3 w-36 text-center border-r border-indigo-100 bg-sky-50 text-sky-800">Bahasa Indonesia</th>
                            <th className="p-3 w-24 text-center border-r border-indigo-100 bg-sky-50/50 text-sky-800">Predikat</th>
                            <th className="p-3 w-16 text-center no-print">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {students.map((student, idx) => {
                            const matScore = getTKAScore(student.id, 'mat');
                            const matPredicate = getPredicate(matScore);
                            const indoScore = getTKAScore(student.id, 'indo');
                            const indoPredicate = getPredicate(indoScore);
                            return (
                                <tr key={student.id} className="hover:bg-gray-50 transition-colors border-b">
                                    <td className="p-3 w-12 text-center text-gray-500 border-r sticky left-0 bg-white group-hover:bg-gray-50 z-10 hidden md:table-cell">{idx + 1}</td>
                                    <td className="p-3 w-32 text-center text-gray-700 font-mono border-r sticky left-0 md:left-12 bg-white group-hover:bg-gray-50 z-10">{student.nis}</td>
                                    <td className="p-3 w-32 text-center text-gray-700 font-mono border-r bg-white">{student.nisn || '-'}</td>
                                    <td className="p-3 min-w-[260px] md:min-w-[300px] font-bold text-gray-800 border-r uppercase bg-white whitespace-normal break-words" title={student.name}>{student.name}</td>
                                    <td className="p-3 min-w-[160px] border-r bg-white text-center">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                            {selectedTkaTitle}
                                        </span>
                                    </td>
                                    <td className="p-3 w-32 text-center border-r bg-amber-50/20">
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={matScore === 0 ? '' : matScore}
                                            placeholder="0"
                                            onChange={e => {
                                                const val = e.target.value === '' ? 0 : Number(e.target.value);
                                                updateLocalTKAGrade(student.id, 'mat', val);
                                            }}
                                            onBlur={() => handleSaveTKARow(student.id)}
                                            className="w-16 text-center py-1 border border-gray-200 rounded-lg font-bold text-gray-800 outline-none focus:ring-1 focus:ring-amber-400"
                                        />
                                    </td>
                                    <td className="p-3 w-24 text-center border-r bg-amber-50/10">
                                        <span className={getPredicateBadgeClass(matPredicate)}>
                                            {matPredicate}
                                        </span>
                                    </td>
                                    <td className="p-3 w-36 text-center border-r bg-sky-50/20">
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={indoScore === 0 ? '' : indoScore}
                                            placeholder="0"
                                            onChange={e => {
                                                const val = e.target.value === '' ? 0 : Number(e.target.value);
                                                updateLocalTKAGrade(student.id, 'indo', val);
                                            }}
                                            onBlur={() => handleSaveTKARow(student.id)}
                                            className="w-16 text-center py-1 border border-gray-200 rounded-lg font-bold text-gray-800 outline-none focus:ring-1 focus:ring-sky-400"
                                        />
                                    </td>
                                    <td className="p-3 w-24 text-center border-r bg-sky-50/10">
                                        <span className={getPredicateBadgeClass(indoPredicate)}>
                                            {indoPredicate}
                                        </span>
                                    </td>
                                    <td className="p-3 w-16 text-center no-print bg-white">
                                        <button 
                                            onClick={() => {
                                                handleSaveTKARow(student.id);
                                                onShowNotification(`Nilai TKA ${student.name.toUpperCase()} berhasil disimpan!`, 'success');
                                            }} 
                                            className="text-gray-400 hover:text-emerald-600 transition-colors" 
                                            title="Simpan Baris"
                                        >
                                            <Save size={18}/>
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        ) : (
           <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden no-print">
               <div className="p-4 bg-indigo-50 border-b border-indigo-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                   <div className="flex items-start gap-3 text-indigo-800 font-bold w-full sm:w-auto">
                       <History size={20} className="mt-0.5 shrink-0 text-indigo-600" />
                       <div className="flex flex-col gap-1">
                            <div className="text-sm md:text-base leading-tight">

                                <span>{selectedHistoryCohort ? `Riwayat Nilai: TA ${selectedHistoryCohort.split('|')[0]} - Semester ${selectedHistoryCohort.split('|')[1]}` : 'Riwayat Nilai Semester Sebelumnya'}</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-1 px-1">
                                <div className="bg-white p-0.5 rounded-lg border border-indigo-200 flex shadow-sm">
                                    <button 
                                        type="button"
                                        onClick={() => setHistoryViewSubMode('recap')} 
                                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${historyViewSubMode === 'recap' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        Rapor
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setHistoryViewSubMode('summative')} 
                                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${historyViewSubMode === 'summative' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        Sumatif
                                    </button>
                                </div>
                                {historyViewSubMode === 'summative' && (
                                    <select 
                                        value={selectedHistorySubject}
                                        onChange={(e) => setSelectedHistorySubject(e.target.value)}
                                        className="text-xs bg-white border border-indigo-200 rounded-lg px-2 py-1 outline-none text-indigo-700 font-bold"
                                    >
                                        {MOCK_SUBJECTS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                )}
                            </div>
                        </div>
                   </div>
                   <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-end border-t border-indigo-100/50 sm:border-none pt-3 sm:pt-0">
                       <div className="text-xs text-indigo-600 bg-white px-3 py-1 rounded-full border border-indigo-200">{filteredHistoryData.length} Siswa</div>
                       {!isReadOnly && selectedHistoryCohort && (
                           <button onClick={handleDeleteCohort} disabled={isDeletingHistory} className="text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold" title="Hapus Seluruh Periode">
                               {isDeletingHistory ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                               <span>Hapus Periode</span>
                           </button>
                       )}
                   </div>
               </div>
               {isLoadingHistory ? <div className="p-20 flex flex-col items-center justify-center text-gray-400"><Loader2 size={40} className="animate-spin mb-4 text-indigo-400"/><p>Memuat riwayat...</p></div> : gradeHistory.length === 0 ? <div className="p-20 flex flex-col items-center justify-center text-gray-400 text-center"><History size={48} className="text-gray-300 mb-4"/><h3 className="text-lg font-bold text-gray-700">Belum Ada Riwayat</h3><p className="text-sm mt-1">Gunakan tombol arsipkan di rekap rapor untuk menyimpan data.</p></div> : (
                   <div className="overflow-x-auto">
                       <table className="w-full text-xs text-left border-collapse min-w-[1000px]">
                           <thead className="bg-slate-50 text-slate-700 font-bold uppercase">
                               <tr className="border-b">
                                   <th className="p-3 w-10 text-center border-r sticky left-0 bg-slate-50 z-20 hidden md:table-cell">No</th>
                                    <th className="p-3 min-w-[124px] md:min-w-[200px] max-w-[124px] md:max-w-none border-r sticky left-0 md:left-10 bg-slate-50 z-20">Nama Siswa</th>
                                    {historyViewSubMode === 'recap' ? (
                                        <>
                                            {activeSubjectsForHistory.map(subj => <th key={subj.id} className="p-2 w-16 text-center border-r" title={subj.name}>{getSubjectInitials(subj.name)}</th>)}
                                            <th className="p-3 w-20 text-center border-r bg-emerald-50 text-emerald-800">Jumlah</th>
                                             <th className="p-3 w-24 text-center border-r bg-sky-50 text-sky-800">Rata-Rata</th>
                                            <th className="p-3 w-20 text-center bg-amber-50 text-amber-800">Rank</th>
                                        </>
                                    ) : (
                                        <>
                                            <th className="p-2 w-16 text-center border-r">SUM 1</th>
                                            <th className="p-2 w-16 text-center border-r">SUM 2</th>
                                            <th className="p-2 w-16 text-center border-r">SUM 3</th>
                                            <th className="p-2 w-16 text-center border-r">SUM 4</th>
                                            <th className="p-2 w-16 text-center border-r">SAS</th>
                                            <th className="p-3 w-20 text-center bg-indigo-50 text-indigo-800 font-bold">AVG</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredHistoryData.map((h, idx) => {
                                    const student = students.find(s => s.id === h.studentId);
                                    const rank = Number(h.rank);
                                    const isTop3 = rank > 0 && rank <= 3;
                                    
                                    // Summative data from fullScores
                                    const fullScores = (h.fullScores || {}) as Record<string, any>;
                                    const subjData = fullScores[selectedHistorySubject] || { sum1: 0, sum2: 0, sum3: 0, sum4: 0, sas: 0 };
                                    const values = [subjData.sum1, subjData.sum2, subjData.sum3, subjData.sum4, subjData.sas].filter(v => v > 0);
                                    const summativeAvg = values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;

                                    return (
                                        <tr key={h.id} className="hover:bg-indigo-50/20 transition-colors">
                                            <td className="p-3 text-center text-gray-500 border-r hidden md:table-cell">{idx + 1}</td>
                                            <td className="p-3 border-r font-medium uppercase sticky left-0 md:left-10 bg-white group-hover:bg-indigo-50/20 z-10 max-w-[124px] md:max-w-[200px] truncate">
                                                <div className="flex flex-col truncate">
                                                    <span className="truncate text-xs md:text-sm" title={student?.name.toUpperCase()}>{student?.name.toUpperCase() || 'Siswa Dihapus'}</span>
                                                    <span className="text-[9px] text-gray-400 font-mono truncate">{student?.nis}</span>
                                                </div>
                                            </td>
                                            
                                            {historyViewSubMode === 'recap' ? (
                                                <>
                                                    {activeSubjectsForHistory.map(subj => (
                                                        <td key={subj.id} className="p-2 text-center border-r font-medium text-gray-600">
                                                            {h.scores[subj.id] || '-'}
                                                        </td>
                                                    ))}
                                                    <td className="p-3 text-center border-r font-bold text-emerald-600 bg-emerald-50/30">
                                                        {h.totalScore}</td><td className="p-3 text-center border-r font-bold text-sky-600 bg-sky-50/30">{(() => { const count = activeSubjectsForHistory.filter(subj => { const sc = h.scores[subj.id]; return typeof sc === 'number' && !isNaN(sc) && sc > 0; }).length; return count > 0 ? (h.totalScore / count).toFixed(2).replace('.', ',') : '-'; })()}</td><td style={{ display: "none" }}>
                                                    </td>
                                                    <td className={`p-3 text-center font-black ${isTop3 ? 'bg-amber-50 text-amber-600' : 'text-gray-500'}`}>
                                                        <div className="flex items-center justify-center gap-1">
                                                            {rank === 1 && <Trophy size={14} className="text-yellow-500 fill-yellow-500"/>}
                                                            {rank === 2 && <Trophy size={14} className="text-gray-400 fill-gray-400"/>}
                                                            {rank === 3 && <Trophy size={14} className="text-amber-700 fill-amber-700"/>}
                                                            {h.rank}
                                                        </div>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className="p-2 text-center border-r font-medium text-gray-600">{subjData.sum1 || '-'}</td>
                                                    <td className="p-2 text-center border-r font-medium text-gray-600">{subjData.sum2 || '-'}</td>
                                                    <td className="p-2 text-center border-r font-medium text-gray-600">{subjData.sum3 || '-'}</td>
                                                    <td className="p-2 text-center border-r font-medium text-gray-600">{subjData.sum4 || '-'}</td>
                                                    <td className="p-2 text-center border-r font-bold text-indigo-600">{subjData.sas || '-'}</td>
                                                    <td className="p-3 text-center font-black bg-indigo-50/50 text-indigo-700">{summativeAvg || '-'}</td>
                                                </>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
        )}
    </div>
)}

       {viewMode === 'input' && (
           <div className="flex flex-wrap items-center gap-4 text-xs no-print text-gray-400 italic">
               <div className="flex items-center"> <Calculator size={12} className="mr-1" /> Nilai Akhir = Rata-rata dari kolom yang terisi. </div>
               <div className="flex items-center text-rose-500 font-bold"> <AlertCircle size={12} className="mr-1" /> Merah = Di bawah KKTP ({currentKktp}). </div>
               <div className="flex items-center text-emerald-500 font-bold"> <CheckCircle size={12} className="mr-1" /> Hijau = Tuntas. </div>
           </div>
       )}

       {showAddTkaModal && (
           <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in no-print">
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
                               onClick={() => {
                                   setShowAddTkaModal(false);
                                   setNewTkaTitleInput('');
                               }}
                               className="flex-1 py-2.5 px-4 bg-[#FFF9D0] text-gray-700 font-bold rounded-xl hover:bg-yellow-100 transition-colors"
                           >
                               Batal
                           </button>
                           <button 
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
export default GradesView;
