import React, { useState, useEffect, useMemo, useRef } from 'react';
import { LearningJournalEntry, ScheduleItem, SchoolProfileData, TeacherProfileData, User, Holiday } from '../types';
import { apiService } from '../services/apiService';
import { useModal } from '../context/ModalContext';
import { getLocalISODate } from '../utils/dateUtils';
import html2pdf from 'html2pdf.js';
import * as XLSX from 'xlsx';
import { 
  Save, Calendar, Printer, Plus, Trash2, Loader2, 
  ChevronLeft, ChevronRight, NotebookPen, RefreshCw,
  LayoutList, CalendarRange, Coffee, CheckCircle, MessageSquare,
  Upload, Download, FileSpreadsheet
} from 'lucide-react';

interface LearningJournalViewProps {
  classId: string;
  isReadOnly?: boolean;
  targetDate?: string | null;
  onSaveBatch?: (entries: Partial<LearningJournalEntry>[]) => Promise<void>;
  schoolProfile?: SchoolProfileData;
  teacherProfile?: TeacherProfileData;
  currentUser?: User | null; // New prop
  onShowNotification?: (message: string, type: 'success' | 'error' | 'warning') => void;
}

const WEEKDAYS_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', "Jum'at", 'Sabtu'];
const MODEL_OPTIONS = ['Problem-Based Learning (PBL)', 'Project-Based Learning (PjBL)', 'Inquiry', 'Discovery Learning', 'Lainnya'];
const PENDEKATAN_OPTIONS = ['Pendekatan kontekstual', 'konstruktivisme', 'saintifik', 'gamifiaksi', 'lainnya'];
const METODE_OPTIONS = ['Tanya jawab', 'Ceramah', 'Diskusi kelompok', 'Demonstrasi', 'Simulasi/bermain peran', 'Presentasi', 'Lainnya'];
const EVALUASI_OPTIONS = {
  Formatif: [
    'Kuis singkat',
    'Diskusi Kelompok',
    'Lembar Refleksi',
    'Presentasi',
    'Observasi'
  ],
  Sumatif: [
    'Tes Lisan/Tulis',
    'Proyek/Tugas Besar',
    'Ujian Praktik/Kinerja',
    'Portofolio',
    'Uji Kompetensi'
  ]
};

const specialActivities = ['upacara', 'pembiasaan', 'literasi/numerasi', 'literasi', 'numerasi', 'istirahat', 'senam', 'sholat', 'pramuka'];
const isSpecialSubject = (subj?: string) => {
  const s = (subj || '').toLowerCase();
  return specialActivities.some(act => s.includes(act));
};


const LearningJournalView: React.FC<LearningJournalViewProps> = ({ 
  classId, isReadOnly, targetDate, onSaveBatch, schoolProfile, teacherProfile, currentUser, onShowNotification
}) => {
  // State
  const [currentDate, setCurrentDate] = useState(getLocalISODate());
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [entries, setEntries] = useState<LearningJournalEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'rekap'>('daily');
  
  // Custom states for Subject Teacher Recap (PAI & PJOK)
  const isEligibleForRekap = useMemo(() => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin' || currentUser.role === 'Kepala Sekolah') return true;
    const pos = (currentUser.position || '').toLowerCase();
    return pos.includes('pai') || pos.includes('agama') || pos.includes('pjok') || pos.includes('olahraga');
  }, [currentUser]);

  const [selectedSubject, setSelectedSubject] = useState<'PAI' | 'PJOK'>(() => {
    if (currentUser) {
      const pos = (currentUser.position || '').toLowerCase();
      if (pos.includes('pjok') || pos.includes('olahraga')) return 'PJOK';
      if (pos.includes('pai') || pos.includes('agama')) return 'PAI';
    }
    return 'PAI';
  });

  const [selectedRecapClass, setSelectedRecapClass] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [allJournals, setAllJournals] = useState<LearningJournalEntry[]>([]);
  const [allSchedules, setAllSchedules] = useState<any[]>([]);
  const [rekapLoading, setRekapLoading] = useState(false);

  const canSwitchSubject = useMemo(() => {
    if (!currentUser) return false;
    return currentUser.role === 'admin' || currentUser.role === 'Kepala Sekolah';
  }, [currentUser]);

  useEffect(() => {
    if (currentUser && !canSwitchSubject) {
      const pos = (currentUser.position || '').toLowerCase();
      if (pos.includes('pjok') || pos.includes('olahraga')) {
        setSelectedSubject('PJOK');
      } else if (pos.includes('pai') || pos.includes('agama')) {
        setSelectedSubject('PAI');
      }
    }
  }, [currentUser, canSwitchSubject]);

  const dbClasses = useMemo(() => {
    const clsSet = new Set<string>();
    allSchedules.forEach(s => {
      if (s.classId) clsSet.add(s.classId.toUpperCase());
    });
    allJournals.forEach(j => {
      if (j.classId) clsSet.add(j.classId.toUpperCase());
    });
    clsSet.delete('-');
    if (clsSet.size === 0) {
      return ['1A', '1B', '2A', '2B', '3A', '3B', '4A', '4B', '5A', '5B', '6A', '6B'];
    }
    return Array.from(clsSet).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.replace(/\D/g, '')) || 0;
      if (numA !== numB) return numA - numB;
      return a.localeCompare(b);
    });
  }, [allSchedules, allJournals]);

  const loadRekapData = async () => {
    setRekapLoading(true);
    try {
      const [journals, schedules] = await Promise.all([
        apiService.getLearningJournalAll(),
        apiService.getScheduleAll()
      ]);
      setAllJournals(journals);
      setAllSchedules(schedules);
    } catch (e) {
      console.error("Failed to load rekap data", e);
    } finally {
      setRekapLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'rekap' && isEligibleForRekap) {
      loadRekapData();
    }
  }, [viewMode, isEligibleForRekap]);

  const MONTHS_ID = useMemo(() => [
    'Semua Bulan',
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ], []);

  const filteredRekapEntries = useMemo(() => {
    return allJournals.filter(entry => {
      // 1. Subject filter
      const entrySubject = (entry.subject || '').toLowerCase();
      const isTargetSubject = selectedSubject === 'PAI' 
        ? (entrySubject.includes('pai') || entrySubject.includes('agama')) 
        : (entrySubject.includes('pjok') || entrySubject.includes('olahraga'));
      
      if (!isTargetSubject) return false;

      // 2. Class filter
      if (selectedRecapClass !== 'all' && entry.classId !== selectedRecapClass) {
        return false;
      }

      // 3. Month filter
      if (selectedMonth !== 'all') {
        const entryDate = new Date(entry.date);
        const entryMonthStr = String(entryDate.getMonth() + 1); // 1-12
        if (entryMonthStr !== selectedMonth) return false;
      }

      return true;
    }).sort((a, b) => {
      // Sort by Date, then Class, then Time Slot
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }
      if (a.classId !== b.classId) {
        return a.classId.localeCompare(b.classId);
      }
      return (a.timeSlot || '').localeCompare(b.timeSlot || '');
    });
  }, [allJournals, selectedSubject, selectedRecapClass, selectedMonth]);

  const entriesGroupedByWeek = useMemo(() => {
    const weeksMap: Record<string, { start: Date; end: Date; entries: LearningJournalEntry[] }> = {};
    
    filteredRekapEntries.forEach(entry => {
      if (!entry.date) return;
      const entryDate = new Date(entry.date);
      if (isNaN(entryDate.getTime())) return;
      
      const dayOfWeek = entryDate.getDay();
      const adjust = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(entryDate);
      monday.setDate(entryDate.getDate() + adjust);
      monday.setHours(0, 0, 0, 0);
      
      const saturday = new Date(monday);
      saturday.setDate(monday.getDate() + 5);
      saturday.setHours(23, 59, 59, 999);
      
      const weekKey = monday.toISOString().split('T')[0];
      
      if (!weeksMap[weekKey]) {
        weeksMap[weekKey] = {
          start: monday,
          end: saturday,
          entries: []
        };
      }
      weeksMap[weekKey].entries.push(entry);
    });
    
    return Object.keys(weeksMap).sort().map(key => {
      const group = weeksMap[key];
      const mDate = group.start;
      const firstDay = new Date(mDate.getFullYear(), mDate.getMonth(), 1);
      const firstDayOfWeek = firstDay.getDay() === 0 ? 7 : firstDay.getDay();
      const weekOfMonth = Math.ceil((mDate.getDate() + firstDayOfWeek - 1) / 7);
      
      return {
        weekKey: key,
        weekOfMonth,
        ...group
      };
    });
  }, [filteredRekapEntries]);

  const indicatedSchedules = useMemo(() => {
    return allSchedules.filter(sch => {
      const schSubject = (sch.subject || '').toLowerCase();
      const isTarget = selectedSubject === 'PAI'
        ? (schSubject.includes('pai') || schSubject.includes('agama'))
        : (schSubject.includes('pjok') || schSubject.includes('olahraga'));
      
      if (selectedRecapClass !== 'all' && sch.classId !== selectedRecapClass) {
        return false;
      }
      return isTarget;
    });
  }, [allSchedules, selectedSubject, selectedRecapClass]);

  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, rowIndex: number } | null>(null);
  const [copiedRow, setCopiedRow] = useState<Partial<LearningJournalEntry> | null>(null);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const { showAlert, showConfirm } = useModal();

  const holidayOnThisDate = useMemo(() => {
    return holidays.find(h => h.date === currentDate);
  }, [holidays, currentDate]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Tanggal (YYYY-MM-DD)': getLocalISODate(),
        'Slot Waktu': '07:30 - 08:40',
        'Mata Pelajaran': 'Matematika',
        'Topik/Bab': 'Pecahan',
        'Model Pembelajaran': 'Problem-Based Learning (PBL)',
        'Pendekatan': 'Pendekatan kontekstual',
        'Metode': 'Tanya jawab, Diskusi kelompok',
        'Kegiatan Pembelajaran': 'Pendahuluan, inti, penutup',
        'Evaluasi': 'Kuis singkat',
        'Refleksi Guru': 'Siswa sangat aktif.',
        'Tindak Lanjut': 'Pembelajaran lanjutan topik perkalian pecahan.'
      }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Jurnal");
    XLSX.writeFile(wb, "Template_Jurnal_Pembelajaran.xlsx");
    if (onShowNotification) {
      onShowNotification("Template Jurnal berhasil diunduh!", "success");
    } else {
      showAlert("Template Jurnal berhasil diunduh!", "success");
    }
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
          if (onShowNotification) onShowNotification("Berkas Excel kosong.", "error");
          return;
        }

        const importedRows: Partial<LearningJournalEntry>[] = rawData.map((row: any) => {
          const mRaw = row['Metode'] || '';
          const metode = mRaw ? String(mRaw).split(',').map((s: string) => s.trim()) : [];

          return {
            id: row['ID'] || `journal-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            classId,
            date: row['Tanggal (YYYY-MM-DD)'] || currentDate,
            day: getDayName(row['Tanggal (YYYY-MM-DD)'] || currentDate),
            timeSlot: row['Slot Waktu'] || '',
            subject: row['Mata Pelajaran'] || '',
            topic: row['Topik/Bab'] || '',
            activities: row['Kegiatan Pembelajaran'] || '',
            evaluation: row['Evaluasi'] || '',
            reflection: row['Refleksi Guru'] || '',
            followUp: row['Tindak Lanjut'] || '',
            model: row['Model Pembelajaran'] || '',
            pendekatan: row['Pendekatan'] || '',
            metode,
            isTeacherPresent: true,
            teacherName: currentUser?.fullName || ''
          };
         }).filter((r: any) => r.subject && r.subject.trim() !== '');

         if (importedRows.length === 0) {
           if (onShowNotification) onShowNotification("Tidak ada data jurnal yang valid untuk diimpor.", "error");
           return;
         }

         if (onSaveBatch) {
           await onSaveBatch(importedRows);
         } else {
           await apiService.saveLearningJournalBatch(importedRows);
         }

         await loadData();
         if (onShowNotification) {
           onShowNotification(`Berhasil mengimpor ${importedRows.length} jurnal pembelajaran!`, "success");
         } else {
           showAlert(`Berhasil mengimpor ${importedRows.length} jurnal pembelajaran!`, "success");
         }
       } catch (err) {
         console.error(err);
         if (onShowNotification) {
           onShowNotification("Gagal membaca berkas Excel.", "error");
         } else {
           showAlert("Gagal membaca berkas Excel.", "error");
         }
       }
     };
     reader.readAsBinaryString(file);
     e.target.value = '';
   };

   const handleExportExcel = () => {
     const dataToExport = viewMode === 'rekap' ? filteredRekapEntries : entries;
     if (dataToExport.length === 0) {
       if (onShowNotification) onShowNotification("Tidak ada data jurnal untuk diekspor.", "warning");
       return;
     }

     const exportData = dataToExport.map((item, idx) => ({
       'NO': idx + 1,
       'KELAS': item.classId || classId,
       'TANGGAL': item.date,
       'SLOT WAKTU': item.timeSlot || '-',
       'MATA PELAJARAN': item.subject,
       'TOPIK/BAB': isSpecialSubject(item.subject) ? '-' : (item.topic || '-'),
       'MODEL PEMBELAJARAN': isSpecialSubject(item.subject) ? '-' : (item.model || '-'),
       'PENDEKATAN': isSpecialSubject(item.subject) ? '-' : (item.pendekatan || '-'),
       'METODE': isSpecialSubject(item.subject) ? '-' : (item.metode ? item.metode.join(', ') : '-'),
       'KEGIATAN PEMBELAJARAN': isSpecialSubject(item.subject) ? '-' : (item.activities || '-'),
       'EVALUASI': isSpecialSubject(item.subject) ? '-' : (item.evaluation || '-'),
       'REFLEKSI GURU': isSpecialSubject(item.subject) ? '-' : (item.reflection || '-'),
       'TINDAK LANJUT': isSpecialSubject(item.subject) ? '-' : (item.followUp || '-'),
       'GURU HADIR': isSpecialSubject(item.subject) ? '-' : (item.isTeacherPresent ? 'Hadir' : 'Tidak Hadir'),
       'NAMA GURU': item.teacherName || '-'
     }));

     const ws = XLSX.utils.json_to_sheet(exportData);
     const wb = XLSX.utils.book_new();
     XLSX.utils.book_append_sheet(wb, ws, "Jurnal Pembelajaran");
     XLSX.writeFile(wb, `Jurnal_Pembelajaran_${classId}.xlsx`);
     if (onShowNotification) {
       onShowNotification("Data jurnal berhasil diekspor ke Excel!", "success");
     } else {
       showAlert("Data jurnal berhasil diekspor ke Excel!", "success");
     }
   };

  // Handle Target Date Navigation
  useEffect(() => {
      if (targetDate) {
          setCurrentDate(targetDate);
          setViewMode('daily'); // Force switch to daily view to see the specific date
      }
  }, [targetDate]);

  // Load Data
  const loadData = async () => {
    setLoading(true);
    try {
      const [journalData, scheduleData, configData, holidaysData] = await Promise.all([
        apiService.getLearningJournal(classId),
        apiService.getSchedule(classId),
        apiService.getClassConfig(classId),
        apiService.getHolidays(currentUser || null)
      ]);
      setEntries(journalData);
      setHolidays(holidaysData || []);
      
      // Use schedule from dedicated table if available, otherwise fallback to config
      if (scheduleData && scheduleData.length > 0) {
          setSchedule(scheduleData);
      } else if (configData.schedule) {
          setSchedule(configData.schedule);
      } else {
          setSchedule([]);
      }
    } catch (e) {
      console.error("Failed to load journal data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (classId) loadData();
  }, [classId]);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  // --- Helper Functions ---

  const getDayName = (dateStr: string) => {
    const d = new Date(dateStr);
    return WEEKDAYS_ID[d.getDay()];
  };

  const getEntriesForDate = (dateStr: string) => {
    return entries.filter(e => e.date === dateStr);
  };

  const getMonday = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(date.setDate(diff));
  }

  const getSaturday = (monday: Date) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + 5);
      return date;
  }

  // --- Weekly Logic ---
  
  const currentMonday = useMemo(() => getMonday(new Date(currentDate)), [currentDate]);
  const currentSaturday = useMemo(() => getSaturday(currentMonday), [currentMonday]);
  
  const weekDates = useMemo(() => {
      const days = [];
      for(let i=0; i<6; i++) { // Mon-Sat
          const d = new Date(currentMonday);
          d.setDate(currentMonday.getDate() + i);
          days.push(getLocalISODate(d));
      }
      return days;
  }, [currentMonday]);
  
  const generateActivitiesString = (pendekatan?: string, model?: string, metode?: string[]) => {
      const metodeStr = metode && metode.length > 0 ? metode.join(', ') : '-';
      return `Pendahuluan (apersepsi), kegiatan inti (${pendekatan || '-'}, ${model || '-'}, ${metodeStr}), dan penutup (evaluasi/kesimpulan).`;
  };

  // Logic to merge Schedule with Entries for a SPECIFIC date
  const getRowsForDate = (targetDate: string) => {
    const dayName = getDayName(targetDate);
    const existingEntries = getEntriesForDate(targetDate);
    
    // Subjects scheduled for that day (robust day matching for "Jum'at" / "Jumat")
    const scheduledToday = schedule.filter(s => {
      const d1 = s.day ? s.day.trim().toLowerCase().replace(/['`]/g, "") : "";
      const d2 = dayName ? dayName.trim().toLowerCase().replace(/['`]/g, "") : "";
      return d1 === d2;
    });
    
    const rows: Partial<LearningJournalEntry>[] = existingEntries.map(e => ({...e}));

    scheduledToday.forEach(sch => {
        const covered = existingEntries.some(e => e.subject === sch.subject && e.timeSlot === sch.time);
        if (!covered) {
            const isSpecial = isSpecialSubject(sch.subject);
            rows.push({
                id: `temp-${targetDate}-${sch.id}`, 
                classId,
                date: targetDate,
                day: dayName,
                timeSlot: sch.time,
                subject: sch.subject,
                topic: isSpecial ? '-' : '',
                activities: isSpecial ? '-' : generateActivitiesString(PENDEKATAN_OPTIONS[0], MODEL_OPTIONS[0], [METODE_OPTIONS[0]]),
                evaluation: isSpecial ? '-' : 'Kuis singkat',
                reflection: isSpecial ? '-' : '',
                followUp: isSpecial ? '-' : '',
                pendekatan: isSpecial ? '' : PENDEKATAN_OPTIONS[0],
                model: isSpecial ? '' : MODEL_OPTIONS[0],
                metode: isSpecial ? [] : [METODE_OPTIONS[0]],
            });
        }
    });

    return rows.sort((a, b) => (a.timeSlot || '').localeCompare(b.timeSlot || ''));
  };

  // --- Daily Logic (Draft State) ---
  const activeRows = useMemo(() => getRowsForDate(currentDate), [currentDate, entries, schedule, classId]);
  
  const [draftData, setDraftData] = useState<Partial<LearningJournalEntry>[]>([]);

  useEffect(() => {
      setDraftData(activeRows);
  }, [activeRows]);

  const isRowEditable = (row: Partial<LearningJournalEntry>): boolean => {
    if (isReadOnly) return false; // Global override
    if (!currentUser) return false;

    // Admin & Supervisor can edit anything
    if (currentUser.role === 'admin' || currentUser.role === 'Kepala Sekolah') {
        return true;
    }

    // Subject-specific teachers
    if (currentUser.role === 'guru') {
        const pos = (currentUser.position || '').toLowerCase();
        const rowSubject = (row.subject || '').toLowerCase();

        const isPaiTeacher = pos.includes('pai') || pos.includes('agama');
        const isPjokTeacher = pos.includes('pjok') || pos.includes('olahraga');
        const isSubjectTeacher = isPaiTeacher || isPjokTeacher;

        if (!isSubjectTeacher) return true; // Class teacher can edit all

        // For a subject teacher:
        // 1. Can edit if row has no subject (new row) or if subject matches specialty
        if (!row.subject) return true;
        if (isPaiTeacher && rowSubject.includes('pai')) return true;
        if (isPjokTeacher && rowSubject.includes('pjok')) return true;

        return false; // Subject teacher, but subject doesn't match
    }

    return true; // Default case
  };

  const updateDraft = (index: number, field: keyof LearningJournalEntry, value: any) => {
    const newData = [...draftData];
    if (!isRowEditable(newData[index])) return;

    let updatedRow = { ...newData[index], [field]: value };

    const pbmFields: (keyof LearningJournalEntry)[] = ['model', 'pendekatan', 'metode'];

    if (pbmFields.includes(field)) {
        updatedRow.activities = generateActivitiesString(updatedRow.pendekatan, updatedRow.model, updatedRow.metode);
    }

    // Auto-fill logic for the same subject
    if (updatedRow.subject) {
        for (let i = 0; i < newData.length; i++) {
            if (newData[i].subject === updatedRow.subject) {
                // Don't auto-fill presence, it's specific to the slot
                if (field !== 'isTeacherPresent' && field !== 'teacherName') {
                    newData[i] = { ...newData[i], [field]: value };
                    if (pbmFields.includes(field)) {
                        const thisRow = newData[i];
                        newData[i].activities = generateActivitiesString(thisRow.pendekatan, thisRow.model, thisRow.metode);
                    }
                }
            }
        }
    }
    
    // Always update the specific row
    newData[index] = updatedRow;

    setDraftData(newData);
  };

  const handleTogglePresence = async (index: number) => {
      const row = draftData[index];
      if (!isRowEditable(row)) return;

      const isPresent = !row.isTeacherPresent;
      const teacherName = isPresent ? (currentUser?.fullName || '') : '';
      
      const newDraftData = [...draftData];
      const updatedRow = { ...newDraftData[index], isTeacherPresent: isPresent, teacherName };
      newDraftData[index] = updatedRow;
      
      setDraftData(newDraftData);
      
      try {
          if (updatedRow.subject && updatedRow.subject.trim() !== '') {
              const validRows = newDraftData.filter(d => d.subject && d.subject.trim() !== '');
              
              if (onSaveBatch) {
                  await onSaveBatch(validRows);
              } else {
                  await apiService.saveLearningJournalBatch(validRows);
              }
              
              if (isPresent) {
                  showAlert('Tersimpan! Guru tercatat hadir di jurnal ini.', 'success', 'Hadir');
              } else {
                  showAlert('Kehadiran dibatalkan.', 'alert', 'Batal Hadir');
              }
              
              const newJournalData = await apiService.getLearningJournal(classId);
              setEntries(newJournalData);
          } else {
              if (isPresent) {
                  showAlert('Tersimpan di Draf. Guru tercatat hadir.', 'success', 'Hadir (Draf)');
              }
          }
      } catch (e) {
          console.error(e);
          showAlert('Gagal menyimpan perubahan kehadiran.', 'error', 'Error');
      }
  };

  const handleMetodeChange = (index: number, metode: string) => {
    const currentMetode = draftData[index]?.metode || [];
    const newMetode = currentMetode.includes(metode)
      ? currentMetode.filter(m => m !== metode)
      : [...currentMetode, metode];
    updateDraft(index, 'metode', newMetode);
  };

  const addManualRow = () => {
      if (isReadOnly) return;
      const dayName = getDayName(currentDate);
      const defaultPendekatan = PENDEKATAN_OPTIONS[0];
      const defaultModel = MODEL_OPTIONS[0];
      const defaultMetode = METODE_OPTIONS[0];

      setDraftData([
          ...draftData,
          {
              id: `manual-${Date.now()}`,
              classId,
              date: currentDate,
              day: dayName,
              subject: '',
              timeSlot: '',
              topic: '',
              activities: generateActivitiesString(defaultPendekatan, defaultModel, [defaultMetode]),
              evaluation: 'Kuis singkat',
              reflection: '',
              followUp: '',
              pendekatan: defaultPendekatan,
              model: defaultModel,
              metode: [defaultMetode],
          }
      ]);
  };

  const removeRow = async (index: number) => {
      const row = draftData[index];
      if (!isRowEditable(row)) return;

      if (row.id && !row.id.startsWith('temp-') && !row.id.startsWith('manual-')) {
          const rowId = row.id;
          showConfirm("Hapus jurnal tersimpan ini?", async () => {
              await apiService.deleteLearningJournal(rowId, classId);
              setEntries(prev => prev.filter(e => e.id !== rowId));
          });
      } else {
          const newData = [...draftData];
          newData.splice(index, 1);
          setDraftData(newData);
      }
  };

  const handleSave = async () => {
      if (isReadOnly) return;
      setSaving(true);
      try {
          const validRows = draftData.filter(d => d.subject && d.subject.trim() !== '');
          
          if (onSaveBatch) {
              await onSaveBatch(validRows);
          } else {
              await apiService.saveLearningJournalBatch(validRows);
              showAlert('Jurnal berhasil disimpan.', 'success');
          }
          
          const newJournalData = await apiService.getLearningJournal(classId);
          setEntries(newJournalData);
      } catch (e) {
          console.error(e);
          if (!onSaveBatch) showAlert('Gagal menyimpan jurnal.', 'error');
      } finally {
          setSaving(false);
      }
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
                <p>Remen, ${new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
                <p>Guru Kelas ${classId}</p>
                <div class="signature-space"></div>
                <p class="underline">${teacherProfile?.name || '.........................'}</p>
                <p>NIP. ${teacherProfile?.nip || '.........................'}</p>
            </div>
        </div>
    `;

    let content = '';

    if (viewMode === 'daily') {
        content = `
            <div class="print-header">
                <h2>JURNAL HARIAN PEMBELAJARAN</h2>
                <p>KELAS ${classId}</p>
                <p>HARI/TANGGAL: ${getDayName(currentDate).toUpperCase()}, ${new Date(currentDate).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'}).toUpperCase()}</p>
            </div>
            <table>
                <thead>
                    <tr>
                        <th style="width: 4%">No</th>
                        <th style="width: 12%">Jam</th>
                        <th style="width: 16%">Mata Pelajaran</th>
                        <th style="width: 18%">Materi / Topik</th>
                        <th style="width: 25%">Kegiatan Pembelajaran</th>
                        <th style="width: 15%">Refleksi</th>
                        <th style="width: 10%">Ket.</th>
                    </tr>
                </thead>
                <tbody>
                    ${draftData.map((row, idx) => `
                        <tr>
                            <td style="text-align: center">${idx + 1}</td>
                            <td>${row.timeSlot || ''}</td>
                            <td>${row.subject || ''}</td>
                            <td>${isSpecialSubject(row.subject) ? '-' : (row.topic || '-')}</td>
                            <td>${isSpecialSubject(row.subject) ? '-' : (row.activities || '-')}</td>
                            <td>${isSpecialSubject(row.subject) ? '-' : (row.reflection || '-')}</td>
                            <td>${isSpecialSubject(row.subject) ? '-' : (row.followUp ? 'TL: '+row.followUp : '-')}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            ${signatureBlock}
        `;
    } else if (viewMode === 'weekly') {
        const weekContent = weekDates.map(dateStr => {
            const rows = getRowsForDate(dateStr);
            if (rows.length === 0) return '';
            
            return `
                <div style="page-break-inside: avoid; margin-bottom: 20px;">
                    <div style="font-weight: bold; margin-bottom: 5px; border-bottom: 1px solid #000; padding-bottom: 2px;">
                        ${getDayName(dateStr)}, ${new Date(dateStr).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th style="width: 4%">No</th>
                                <th style="width: 8%">Jam</th>
                                <th style="width: 12%">Mapel</th>
                                <th style="width: 14%">Materi</th>
                                <th style="width: 24%">Kegiatan</th>
                                <th style="width: 12%">Evaluasi</th>
                                <th style="width: 12%">Refleksi</th>
                                <th style="width: 8%">Tindak Lanjut</th>
                                <th style="width: 6%">Kehadiran</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows.map((row, idx) => `
                                <tr>
                                    <td style="text-align: center">${idx + 1}</td>
                                    <td>${row.timeSlot || ''}</td>
                                    <td>${row.subject || ''}</td>
                                    <td>${isSpecialSubject(row.subject) ? '-' : (row.topic || '-')}</td>
                                    <td>${isSpecialSubject(row.subject) ? '-' : (row.activities || '-')}</td>
                                    <td>${isSpecialSubject(row.subject) ? '-' : (row.evaluation || '-')}</td>
                                    <td>${isSpecialSubject(row.subject) ? '-' : (row.reflection || '-')}</td>
                                    <td>${isSpecialSubject(row.subject) ? '-' : (row.followUp || '-')}</td>
                                    <td>${isSpecialSubject(row.subject) ? '-' : (row.isTeacherPresent ? 'Hadir' : 'Tidak Hadir')}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }).join('');

        content = `
            <div class="print-header">
                <h2>JURNAL PEMBELAJARAN MINGGUAN</h2>
                <p>KELAS ${classId}</p>
                <p>PERIODE: ${currentMonday.toLocaleDateString('id-ID', {day:'numeric', month:'long'})} - ${currentSaturday.toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'})}</p>
            </div>
            ${weekContent}
            ${signatureBlock}
        `;
    } else {
        const titleMapel = selectedSubject === 'PAI' ? 'PENDIDIKAN AGAMA ISLAM DAN BUDI PEKERTI (PAI)' : 'PENDIDIKAN JASMANI OLAHRAGA DAN KESEHATAN (PJOK)';
        const filterMonthText = selectedMonth !== 'all' ? `BULAN: ${MONTHS_ID[Number(selectedMonth)].toUpperCase()}` : 'SEMUA BULAN';
        const filterClassText = selectedRecapClass !== 'all' ? `KELAS: ${selectedRecapClass}` : 'SEMUA KELAS';
        
        let tablesContent = '';
        
        if (entriesGroupedByWeek.length === 0) {
            tablesContent = `
                <div style="text-align: center; font-style: italic; color: #888; padding: 25px; border: 1px solid #ccc; border-radius: 8px;">
                    Tidak ada data rekapitulasi jurnal mengajar.
                </div>
            `;
        } else {
            tablesContent = entriesGroupedByWeek.map((weekGroup, wIdx) => {
                const rangeLabel = `Tanggal: ${weekGroup.start.toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})} s/d ${weekGroup.end.toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}`;
                
                return `
                    <div style="margin-bottom: 25px; page-break-inside: avoid;">
                        <h3 style="font-size: 13px; font-weight: bold; margin-bottom: 6px; color: #1e1b4b; background-color: #f1f5f9; padding: 6px 10px; border-radius: 4px; border-left: 3px solid #4f46e5;">
                            Minggu ${weekGroup.weekOfMonth} (${rangeLabel})
                        </h3>
                        <table>
                            <thead>
                                <tr>
                                    <th style="width: 4%">No</th>
                                    <th style="width: 8%">Kelas</th>
                                    <th style="width: 14%">Hari/Tanggal</th>
                                    <th style="width: 10%">Jam</th>
                                    <th style="width: 16%">Materi / Topik</th>
                                    <th style="width: 20%">Kegiatan Pembelajaran</th>
                                    <th style="width: 8%">Evaluasi</th>
                                    <th style="width: 8%">Refleksi</th>
                                    <th style="width: 8%">Tindak Lanjut</th>
                                    <th style="width: 4%">Kehadiran</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${weekGroup.entries.map((row, idx) => `
                                    <tr>
                                        <td style="text-align: center">${idx + 1}</td>
                                        <td style="text-align: center; font-weight: bold;">${row.classId || '-'}</td>
                                        <td>${getDayName(row.date)}, ${new Date(row.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</td>
                                        <td>${row.timeSlot || ''}</td>
                                        <td>${isSpecialSubject(row.subject) ? '-' : (row.topic || '-')}</td>
                                        <td>${isSpecialSubject(row.subject) ? '-' : (row.activities || '-')}</td>
                                        <td>${isSpecialSubject(row.subject) ? '-' : (row.evaluation || '-')}</td>
                                        <td>${isSpecialSubject(row.subject) ? '-' : (row.reflection || '-')}</td>
                                        <td>${isSpecialSubject(row.subject) ? '-' : (row.followUp || '-')}</td>
                                        <td style="text-align: center">${isSpecialSubject(row.subject) ? '-' : (row.isTeacherPresent ? 'Hadir' : 'Tidak Hadir')}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            }).join('');
        }
        
        content = `
            <div class="print-header">
                <h2>REKAPITULASI JURNAL PEMBELAJARAN GURU MATA PELAJARAN</h2>
                <p>MATA PELAJARAN: ${titleMapel}</p>
                <p>${filterClassText} | PERIODE: ${filterMonthText} ${schoolProfile?.year || ''}</p>
            </div>
            
            ${tablesContent}
            
            <div class="print-footer clearfix" style="margin-top: 35px; page-break-inside: avoid;">
                <div class="signature-box signature-left">
                    <p>Mengetahui,</p>
                    <p>Kepala ${schoolProfile?.name || 'Sekolah'}</p>
                    <div class="signature-space"></div>
                    <p class="underline">${schoolProfile?.headmaster || '.........................'}</p>
                    <p>NIP. ${schoolProfile?.headmasterNip || '.........................'}</p>
                </div>
                <div class="signature-box signature-right">
                    <p>Remen, ${new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
                    <p>Guru Mata Pelajaran ${selectedSubject}</p>
                    <div class="signature-space"></div>
                    <p class="underline">${teacherProfile?.name && (currentUser?.position || '').toLowerCase().includes(selectedSubject.toLowerCase()) ? teacherProfile?.name : currentUser?.fullName || '.........................'}</p>
                    <p>NIP. ${teacherProfile?.nip && (currentUser?.position || '').toLowerCase().includes(selectedSubject.toLowerCase()) ? teacherProfile?.nip : currentUser?.nip || '.........................'}</p>
                </div>
            </div>
        `;
    }
  
    const htmlContent = `
      <div style="font-family: 'Times New Roman', Times, serif; padding: 10px; font-size: 9pt; width: 100%; box-sizing: border-box; color: #000; background: #fff;">
        <style>
          table { width: 100%; border-collapse: collapse; margin-bottom: 10px; table-layout: fixed; word-wrap: break-word; page-break-inside: avoid; break-inside: avoid; }
          th, td { border: 1px solid black; padding: 4px; text-align: left; vertical-align: top; font-size: 8pt; word-wrap: break-word; overflow-wrap: break-word; }
          th { text-align: center; font-weight: bold; background-color: #f0f0f0 !important; -webkit-print-color-adjust: exact; }
          tr { page-break-inside: avoid; break-inside: avoid; }
          .print-header { text-align: center; margin-bottom: 15px; line-height: 1.2; font-weight: bold; page-break-inside: avoid; break-inside: avoid; }
          .print-header h2, .print-header p { margin: 0; padding: 0; text-transform: uppercase; }
          .print-footer { margin-top: 20px; width: 100%; font-size: 9pt; page-break-inside: avoid; break-inside: avoid; }
          .signature-box { width: 45%; text-align: center; page-break-inside: avoid; break-inside: avoid; }
          .signature-box p { margin: 0; line-height: 1.4; }
          .signature-left { float: left; }
          .signature-right { float: right; }
          .signature-space { height: 50px; }
          .underline { text-decoration: underline; font-weight: bold; }
          .clearfix::after { content: ""; clear: both; display: table; }
          @page { size: A4 landscape; margin: 1cm; }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            table, tr, td, th { page-break-inside: avoid !important; break-inside: avoid !important; }
          }
        </style>
        ${content}
      </div>
    `;

    if (onShowNotification) onShowNotification('Sedang menyiapkan dokumen PDF...', 'warning');
    
    const element = document.createElement('div');
    element.innerHTML = htmlContent;
    
    const opt = {
      margin: 10,
      filename: `Jurnal_Pembelajaran_${classId}_${new Date().getTime()}.pdf`,
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
        if (onShowNotification) onShowNotification('PDF berhasil diunduh', 'success');
    }).catch((err: any) => {
        console.error('PDF generation error:', err);
        if (onShowNotification) onShowNotification('Gagal mengunduh PDF, mencoba membuka jendela cetak browser...', 'error');
        
        const newWindow = window.open("", "", "width=1200,height=800");
        if (newWindow) {
            newWindow.document.write(`
              <html>
                <head>
                  <title>Jurnal Pembelajaran - Kelas ${classId}</title>
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

  // Navigation Handlers
  const handlePrev = () => {
      const d = new Date(currentDate);
      if (viewMode === 'daily') d.setDate(d.getDate() - 1);
      else d.setDate(d.getDate() - 7);
      setCurrentDate(getLocalISODate(d));
  };

  const handleNext = () => {
      const d = new Date(currentDate);
      if (viewMode === 'daily') d.setDate(d.getDate() + 1);
      else d.setDate(d.getDate() + 7);
      setCurrentDate(getLocalISODate(d));
  };

  const handleContextMenu = (e: React.MouseEvent, rowIndex: number) => {
    e.preventDefault();
    setContextMenu({ x: e.pageX, y: e.pageY, rowIndex });
  };

  const handleCopy = (rowIndex: number) => {
    const { id, date, day, subject, timeSlot, ...rest } = draftData[rowIndex];
    setCopiedRow(rest);
    showAlert('Baris disalin!', 'success');
  };

  const handlePaste = (rowIndex: number) => {
    if (!copiedRow) return;
    const newData = [...draftData];
    const originalRow = newData[rowIndex];
    newData[rowIndex] = { ...originalRow, ...copiedRow };
    setDraftData(newData);
  };

  const handleCopyYesterday = () => {
    if (isReadOnly) return;

    const yesterday = new Date(currentDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalISODate(yesterday);

    const yesterdaySavedEntries = entries.filter(e => e.date === yesterdayStr);

    if (yesterdaySavedEntries.length === 0) {
      showAlert('Tidak ada data jurnal tersimpan dari hari kemarin untuk disalin.', 'error');
      return;
    }

    const todayScheduledRows = getRowsForDate(currentDate);

    const newDraft = todayScheduledRows.map(todayRow => {
      const correspondingYesterdayEntry = yesterdaySavedEntries.find(
        yesterdayEntry => yesterdayEntry.subject === todayRow.subject && yesterdayEntry.timeSlot === todayRow.timeSlot
      );

      if (correspondingYesterdayEntry) {
        const { id, date, day, ...dataToCopy } = correspondingYesterdayEntry;
        return {
          ...todayRow, // Keep today's date, day, id
          ...dataToCopy, // Copy topic, activities, etc.
        };
      }
      return todayRow; // Keep today's scheduled row as is if no match
    });

    setDraftData(newDraft);
    showAlert(`Berhasil menyalin data dari jurnal kemarin.`, 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {contextMenu && (
        <div style={{ top: contextMenu.y, left: contextMenu.x }} className="absolute z-50 bg-white border border-gray-200 rounded-md shadow-lg py-1 w-48">
          <button onClick={() => handleCopy(contextMenu.rowIndex)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Salin</button>
          <button onClick={() => handlePaste(contextMenu.rowIndex)} disabled={!copiedRow} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50">Tempel</button>
          <div className="border-t my-1"></div>
          <button onClick={() => removeRow(contextMenu.rowIndex)} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Hapus Baris Ini</button>
        </div>
      )}
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
            <div>
                <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                    <NotebookPen className="mr-2 text-indigo-600" /> Jurnal Pembelajaran
                </h2>
                <p className="text-gray-500 text-sm">Catatan harian aktivitas belajar mengajar di kelas.</p>
            </div>
            <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                <button 
                    onClick={() => setViewMode('daily')}
                    className={`flex items-center px-3 py-1.5 rounded-md text-sm font-bold transition-colors ${viewMode === 'daily' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                    <LayoutList size={16} className="mr-2"/> Harian
                </button>
                <button 
                    onClick={() => setViewMode('weekly')}
                    className={`flex items-center px-3 py-1.5 rounded-md text-sm font-bold transition-colors ${viewMode === 'weekly' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                    <CalendarRange size={16} className="mr-2"/> Mingguan
                </button>
                {isEligibleForRekap && (
                    <button 
                        onClick={() => setViewMode('rekap')}
                        className={`flex items-center px-3 py-1.5 rounded-md text-sm font-bold transition-colors ${viewMode === 'rekap' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <NotebookPen size={16} className="mr-2"/> Rekap Jurnal Mapel
                    </button>
                )}
            </div>
            <div className="flex items-center gap-2">
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".xlsx, .xls, .csv" />
                <button 
                    onClick={handleDownloadTemplate}
                    className="flex items-center space-x-2 bg-blue-50 text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition text-xs font-bold"
                    title="Unduh Template Excel"
                >
                    <Download size={14} />
                    <span>Unduh Template</span>
                </button>
                {!isReadOnly && (
                    <button 
                        onClick={handleImportClick}
                        className="flex items-center space-x-2 bg-amber-50 text-amber-600 border border-amber-200 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition text-xs font-bold"
                        title="Import Jurnal dari Excel"
                    >
                        <Upload size={14} />
                        <span>Import Excel</span>
                    </button>
                )}
                <button 
                    onClick={handleExportExcel}
                    className="flex items-center space-x-2 bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition text-xs font-bold"
                    title="Export Jurnal ke Excel"
                >
                    <FileSpreadsheet size={14} />
                    <span>Export Excel</span>
                </button>
                <button 
                    onClick={viewMode === 'rekap' ? loadRekapData : loadData} 
                    className="p-2 text-gray-500 hover:text-indigo-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                    title="Refresh Data"
                >
                    <RefreshCw size={18} className={(loading || rekapLoading) ? "animate-spin" : ""} />
                </button>
                <button onClick={handlePrint} className="flex items-center gap-2 bg-white text-gray-600 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50">
                    <Printer size={18}/> Cetak
                </button>
            </div>
        </div>

        {/* Controls */}
        {viewMode !== 'rekap' ? (
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 no-print">
                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg p-1">
                        <button onClick={handlePrev} className="p-1 hover:bg-white rounded shadow-sm transition-colors text-gray-600 hover:text-indigo-600"><ChevronLeft size={20}/></button>
                        
                        <div className="relative mx-2 group">
                            {/* Hidden Input for Date Selection Flexibility */}
                            <input 
                                type="date" 
                                value={currentDate} 
                                onChange={(e) => setCurrentDate(e.target.value)} 
                                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                                title="Klik untuk memilih tanggal"
                            />
                            <div className="mx-2 text-sm font-bold text-gray-700 min-w-[200px] text-center px-4 py-1.5 rounded group-hover:bg-indigo-50 group-hover:text-indigo-700 transition-colors flex items-center justify-center border border-transparent group-hover:border-indigo-100">
                                <Calendar size={14} className="mr-2 opacity-50 group-hover:opacity-100"/>
                                {viewMode === 'daily' ? (
                                    <>
                                        <span className="text-indigo-600 mr-2">{getDayName(currentDate)},</span>
                                        {new Date(currentDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </>
                                ) : (
                                    <>
                                        {currentMonday.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - {currentSaturday.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </>
                                )}
                            </div>
                        </div>
                        
                        <button onClick={handleNext} className="p-1 hover:bg-white rounded shadow-sm transition-colors text-gray-600 hover:text-indigo-600"><ChevronRight size={20}/></button>
                    </div>
                </div>

                {viewMode === 'daily' && (
                    <div className="flex gap-2"> 
                        {!isReadOnly && (
                            <button onClick={addManualRow} className="flex items-center gap-2 bg-white text-indigo-600 border border-indigo-200 px-4 py-2 rounded-lg hover:bg-indigo-50 font-bold text-sm transition-colors">
                                <Plus size={16}/> Tambah Baris
                            </button>
                        )}
                        {!isReadOnly && (
                            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 font-bold text-sm shadow-md disabled:opacity-50 transition-all hover:shadow-lg transform active:scale-95">
                                {saving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>}
                                Simpan Jurnal
                            </button>
                        )}
                    </div>
                )}
            </div>
        ) : (
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center gap-5 no-print w-full justify-between">
                <div className="flex flex-wrap items-center gap-5 w-full md:w-auto">
                    {/* Select Subject */}
                    <div className="flex flex-col gap-1.5 min-w-[140px]">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Mata Pelajaran</span>
                        {canSwitchSubject ? (
                            <div className="flex rounded-lg border border-gray-200 p-0.5 bg-gray-50">
                                <button 
                                    onClick={() => setSelectedSubject('PAI')}
                                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${selectedSubject === 'PAI' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:text-indigo-600'}`}
                                >
                                    PAI
                                </button>
                                <button 
                                    onClick={() => setSelectedSubject('PJOK')}
                                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${selectedSubject === 'PJOK' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:text-indigo-600'}`}
                                >
                                    PJOK
                                </button>
                            </div>
                        ) : (
                            <div className="bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-bold px-4 py-2 rounded-lg text-center uppercase shadow-sm">
                                {selectedSubject}
                            </div>
                        )}
                    </div>

                    {/* Select Class */}
                    <div className="flex flex-col gap-1.5 min-w-[150px]">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Kelas</span>
                        <select 
                            value={selectedRecapClass} 
                            onChange={(e) => setSelectedRecapClass(e.target.value)}
                            className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                        >
                            <option value="all">🌐 Semua Kelas</option>
                            {dbClasses.map(cls => {
                                const clsStr = String(cls).trim().toUpperCase();
                                let label = '🏫 Kelas ' + cls;
                                if (clsStr.startsWith('1')) label = '🎒 Kelas ' + cls;
                                else if (clsStr.startsWith('2')) label = '📚 Kelas ' + cls;
                                else if (clsStr.startsWith('3')) label = '📖 Kelas ' + cls;
                                else if (clsStr.startsWith('4')) label = '🎨 Kelas ' + cls;
                                else if (clsStr.startsWith('5')) label = '🌟 Kelas ' + cls;
                                else if (clsStr.startsWith('6')) label = '🎓 Kelas ' + cls;
                                return <option key={cls} value={cls}>{label}</option>;
                            })}
                        </select>
                    </div>

                    {/* Select Month */}
                    <div className="flex flex-col gap-1.5 min-w-[150px]">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Bulan</span>
                        <select 
                            value={selectedMonth} 
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="all">Semua Bulan</option>
                            {MONTHS_ID.slice(1).map((mName, idx) => (
                                <option key={idx + 1} value={String(idx + 1)}>{mName}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button 
                        onClick={loadRekapData} 
                        disabled={rekapLoading}
                        className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg font-bold text-sm transition-colors border border-indigo-100 disabled:opacity-50"
                    >
                        <RefreshCw size={15} className={rekapLoading ? "animate-spin" : ""} /> Refresh Rekap
                    </button>
                </div>
            </div>
        )}

        {/* --- DAILY VIEW --- */}
        {viewMode === 'daily' && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto print-container relative overflow-hidden">
                {holidayOnThisDate && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-20 select-none">
                        <div className="text-rose-600/10 text-5xl sm:text-7xl md:text-8xl font-black uppercase tracking-widest -rotate-12 whitespace-normal max-w-full text-center px-4 leading-normal select-none">
                            LIBUR: {holidayOnThisDate.description}
                        </div>
                    </div>
                )}
                <div className="hidden print-only p-4 text-center border-b">
                    <h2 className="text-xl font-bold uppercase">JURNAL PEMBELAJARAN KELAS</h2>
                    <p className="text-sm">Hari/Tanggal: {getDayName(currentDate)}, {new Date(currentDate).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
                </div>

                <table className="w-full text-sm text-left border-collapse min-w-[1200px]">
                    <thead>
                        <tr className="bg-gray-50 text-gray-700 font-bold uppercase text-xs print:bg-white print:border-b print:text-black">
                            <th className="p-3 border text-center w-10">No</th>
                            <th className="p-3 border w-32 min-w-[120px]">Jam</th>
                            <th className="p-3 border w-48">Mata Pelajaran</th>
                            <th className="p-3 border w-48">Materi / Topik</th>
                            <th className="p-3 border min-w-[300px]">Kegiatan Pembelajaran</th>
                            <th className="p-3 border w-40">Evaluasi</th>
                            <th className="p-3 border w-40">Refleksi</th>
                            <th className="p-3 border w-40">Tindak Lanjut</th>
                            {!isReadOnly && <th className="p-3 border w-10 text-center no-print"></th>}
                        </tr>
                    </thead>
                    <tbody className="align-top">
                        {draftData.length === 0 ? (
                            <tr><td colSpan={9} className="p-8 text-center text-gray-400 italic">Tidak ada jadwal atau jurnal untuk hari ini.</td></tr>
                        ) : (
                            draftData.map((row, idx) => {
                                const subjectLower = row.subject?.toLowerCase() || '';
                                const isSpecialActivity = isSpecialSubject(row.subject);
                                const isBreak = subjectLower.includes('istirahat');
                                const disabled = !isRowEditable(row) || isSpecialActivity;
                                return (
                                <tr onContextMenu={(e) => handleContextMenu(e, idx)} key={row.id || idx} className={`transition-colors print:break-inside-avoid ${isBreak ? 'bg-orange-50/60' : 'hover:bg-indigo-50/20'}`}>
                                    <td className="p-3 border text-center text-gray-500">{idx + 1}</td>
                                    <td className="p-3 border"><input value={row.timeSlot || ''} onChange={e => updateDraft(idx, 'timeSlot', e.target.value)} className="w-full bg-transparent outline-none text-gray-700 placeholder-gray-300 font-medium" placeholder="07.00 - ..." disabled={disabled}/></td>
                                    <td className="p-3 border font-semibold"><div className="flex items-center">{isBreak && <Coffee size={14} className="mr-2 text-orange-600 no-print"/>}<input value={row.subject || ''} onChange={e => updateDraft(idx, 'subject', e.target.value)} className={`w-full bg-transparent outline-none text-gray-800 placeholder-gray-300 font-bold ${isBreak ? 'text-orange-700' : ''}`} placeholder="Mapel..." disabled={disabled}/></div></td>
                                    <td className="p-3 border">{isSpecialActivity ? <span className="text-gray-400">-</span> : <textarea value={row.topic || ''} onChange={e => updateDraft(idx, 'topic', e.target.value)} className="w-full bg-transparent outline-none resize-none text-gray-700 placeholder-gray-300 h-full min-h-[40px]" placeholder="Tulis materi..." rows={2} disabled={disabled}/>}</td>
                                    <td className="p-3 border">{isSpecialActivity ? <span className="text-gray-400">-</span> : 
                                        <div className="space-y-2">
                                            <div><label className="text-[10px] font-bold text-gray-400">Pendekatan</label><select value={row.pendekatan || ''} onChange={e => updateDraft(idx, 'pendekatan', e.target.value)} disabled={disabled} className="w-full bg-transparent text-xs outline-none p-1 border-b"><option value="">-Pilih-</option>{PENDEKATAN_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select></div>
                                            <div><label className="text-[10px] font-bold text-gray-400">Model</label><select value={row.model || ''} onChange={e => updateDraft(idx, 'model', e.target.value)} disabled={disabled} className="w-full bg-transparent text-xs outline-none p-1 border-b"><option value="">-Pilih-</option>{MODEL_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select></div>
                                            <div>
                                                <label className="text-[10px] font-bold text-gray-400">Metode</label>
                                                <div className="flex flex-wrap gap-x-2 gap-y-1 mt-1">
                                                    {METODE_OPTIONS.map(opt => (
                                                        <label key={opt} className="flex items-center text-xs text-gray-600">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={(row.metode || []).includes(opt)}
                                                                onChange={() => handleMetodeChange(idx, opt)}
                                                                disabled={disabled}
                                                                className="mr-1 h-3 w-3 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                            />
                                                            {opt}
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                            <textarea value={row.activities || ''} readOnly className="mt-2 w-full bg-gray-50/50 p-1 text-[10px] text-gray-500 rounded border-none outline-none resize-none" rows={3}/>
                                        </div>
                                    }</td>
                                    <td className="p-3 border">{isSpecialActivity ? <span className="text-gray-400">-</span> : 
                                        <select value={row.evaluation || ''} onChange={e => updateDraft(idx, 'evaluation', e.target.value)} disabled={disabled} className="w-full bg-transparent outline-none text-gray-700 placeholder-gray-300 font-medium p-1 border-b">
                                            {Object.entries(EVALUASI_OPTIONS).map(([group, options]) => (
                                                <optgroup label={group} key={group}>
                                                    {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                </optgroup>
                                            ))}
                                        </select>
                                    }</td>
                                    <td className="p-3 border">{isSpecialActivity ? <span className="text-gray-400">-</span> : 
                                        <textarea value={row.reflection || ''} onChange={e => updateDraft(idx, 'reflection', e.target.value)} className="w-full bg-transparent outline-none resize-none text-gray-700 placeholder-gray-300 h-full min-h-[40px]" placeholder="Refleksi..." rows={5} disabled={disabled}/>
                                    }</td>
                                    <td className="p-3 border">{isSpecialActivity ? <span className="text-gray-400">-</span> : 
                                        <textarea value={row.followUp || ''} onChange={e => updateDraft(idx, 'followUp', e.target.value)} className="w-full bg-transparent outline-none resize-none text-gray-700 placeholder-gray-300 h-full min-h-[40px]" placeholder="Tindak Lanjut..." rows={5} disabled={disabled}/>
                                    }</td>
                                    <td className="p-3 border text-center no-print align-middle">
                                        <div className="flex flex-col items-center gap-2">
                                            {row.supervisionFeedback && (
                                                <div 
                                                    onClick={() => {
                                                        showAlert(
                                                            `Catatan dari ${row.supervisorName || 'Kepala Sekolah'}: \n\n"${row.supervisionFeedback}"`,
                                                            'alert',
                                                            'Umpan Balik Supervisi'
                                                        );
                                                        
                                                        if (!row.feedbackRead && row.id && !row.id.startsWith('temp-') && !row.id.startsWith('manual-')) {
                                                            apiService.markJournalFeedbackAsRead(row.id, classId);
                                                            setEntries(prev => prev.map(e => e.id === row.id ? { ...e, feedbackRead: true } : e));
                                                        }
                                                    }}
                                                    className={`p-1.5 rounded-lg border transition-all cursor-pointer relative hover:scale-110 active:scale-95 ${
                                                        !row.feedbackRead 
                                                        ? 'bg-amber-50 border-amber-300 text-amber-700 animate-pulse ring-2 ring-amber-200 ring-offset-1' 
                                                        : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                                    }`}
                                                    title="Klik untuk melihat umpan balik"
                                                >
                                                    <MessageSquare size={16} />
                                                    {!row.feedbackRead && (
                                                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 border border-white rounded-full"></span>
                                                    )}
                                                </div>
                                            )}
                                            <button 
                                                onClick={() => handleTogglePresence(idx)}
                                                disabled={disabled}
                                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all shadow-sm flex items-center gap-1 ${
                                                    row.isTeacherPresent 
                                                    ? 'bg-emerald-500 text-white hover:bg-emerald-600' 
                                                    : 'bg-white text-gray-400 border border-gray-200 hover:bg-gray-50'
                                                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                title={row.isTeacherPresent ? 'Batal Hadir' : 'Tandai Hadir'}
                                            >
                                                <CheckCircle size={14} />
                                                {row.isTeacherPresent ? 'Hadir' : 'Hadir?'}
                                            </button>
                                            <button onClick={() => removeRow(idx)} className={`transition-colors ${disabled ? 'text-gray-200 cursor-not-allowed' : 'text-gray-300 hover:text-red-500'}`} disabled={disabled}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )})
                        )}
                    </tbody>
                </table>
            </div>
        )}

        {/* --- WEEKLY VIEW --- */}
        {viewMode === 'weekly' && (
            <div className="space-y-8 print-container">
                <div className="hidden print-only text-center border-b pb-4 mb-4">
                    <h2 className="text-xl font-bold uppercase">JURNAL PEMBELAJARAN MINGGUAN</h2>
                    <p className="text-sm uppercase">PERIODE: {currentMonday.toLocaleDateString('id-ID', {day:'numeric', month:'long'})} - {currentSaturday.toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'})}</p>
                </div>

                {weekDates.map((dateStr) => {
                    const dayName = getDayName(dateStr);
                    const rows = getRowsForDate(dateStr);
                    const holidayOnDay = holidays.find(h => h.date === dateStr);
                    
                    if (rows.length === 0) return null;

                    return (
                        <div key={dateStr} className="break-inside-avoid">
                            <div className="bg-indigo-50 px-4 py-2 border border-indigo-100 rounded-t-xl font-bold text-indigo-800 text-sm flex justify-between items-center print:bg-gray-100 print:text-black print:border-gray-400">
                                <span>{dayName}, {new Date(dateStr).toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'})}</span>
                                {holidayOnDay && (
                                    <span className="text-[10px] sm:text-xs bg-rose-500 text-white px-2.5 py-0.5 rounded-full font-bold ml-2">
                                        Libur: {holidayOnDay.description}
                                    </span>
                                )}
                            </div>
                            <div className="bg-white border-x border-b border-gray-200 rounded-b-xl shadow-sm overflow-hidden mb-6 print:border-gray-400 print:shadow-none relative">
                                {holidayOnDay && (
                                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-20 select-none">
                                        <div className="text-rose-600/10 text-2xl sm:text-4xl font-black uppercase tracking-widest -rotate-12 whitespace-normal max-w-full text-center px-4 leading-normal select-none">
                                            LIBUR: {holidayOnDay.description}
                                        </div>
                                    </div>
                                )}
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-white border-b border-gray-100 text-gray-500 print:border-gray-400 print:text-black">
                                        <tr>
                                            <th className="p-2 w-24 min-w-[100px]">Jam</th>
                                            <th className="p-2 w-40">Mata Pelajaran</th>
                                            <th className="p-2 w-40">Materi</th>
                                            <th className="p-2">Kegiatan Pembelajaran</th>
                                            <th className="p-2 w-32">Evaluasi</th>
                                            <th className="p-2 w-32">Refleksi</th>
                                            <th className="p-2 w-32">Tindak Lanjut</th>
                                            <th className="p-2 w-24">Kehadiran</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 print:divide-gray-400">
                                        {rows.map((row, rIdx) => {
                                            const isBreak = row.subject?.toLowerCase().includes('istirahat');
                                            const isSpecial = isSpecialSubject(row.subject);
                                            return (
                                            <tr key={rIdx} className={isBreak ? 'bg-orange-50/60' : ''}>
                                                <td className="p-2 align-top text-gray-500">{row.timeSlot || '-'}</td>
                                                <td className={`p-2 align-top font-semibold ${isBreak ? 'text-orange-700' : ''}`}>
                                                    {isBreak && <Coffee size={12} className="inline mr-1 text-orange-600 no-print"/>}
                                                    {row.subject}
                                                </td>
                                                <td className="p-2 align-top">{isSpecial ? <span className="text-gray-400 font-medium">-</span> : (row.topic || '-')}</td>
                                                <td className="p-2 align-top">{isSpecial ? <span className="text-gray-400 font-medium">-</span> : (row.activities || '-')}</td>
                                                <td className="p-2 align-top text-gray-600">{isSpecial ? <span className="text-gray-400 font-medium">-</span> : (row.evaluation || '-')}</td>
                                                <td className="p-2 align-top text-gray-600">{isSpecial ? <span className="text-gray-400 font-medium">-</span> : (row.reflection || '-')}</td>
                                                <td className="p-2 align-top text-gray-600">{isSpecial ? <span className="text-gray-400 font-medium">-</span> : (row.followUp || '-')}</td>
                                                <td className="p-2 align-top text-gray-600">
                                                    {isBreak || isSpecial ? (
                                                        <span className="text-gray-400 font-medium">-</span>
                                                    ) : (
                                                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${row.isTeacherPresent ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                            {row.isTeacherPresent ? 'Hadir' : 'Tidak Hadir'}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        )})}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    );
                })}
                {weekDates.every(d => getRowsForDate(d).length === 0) && (
                    <div className="text-center py-12 text-gray-400 italic bg-gray-50 rounded-xl border-dashed border-2">
                        Tidak ada data jurnal atau jadwal untuk minggu ini.
                    </div>
                )}
            </div>
        )}

        {/* --- REKAP VIEW --- */}
        {viewMode === 'rekap' && (
            <div className="space-y-6">
                {/* Indicated Schedules Panel */}
                <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h4 className="text-sm font-bold text-indigo-900 flex items-center mb-1">
                            <Calendar size={16} className="mr-2 text-indigo-600"/>
                            Jadwal Mata Pelajaran {selectedSubject}
                        </h4>
                        <p className="text-xs text-indigo-700/80">Jadwal resmi mata pelajaran {selectedSubject} yang terindikasi pada setiap minggunya:</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {indicatedSchedules.length > 0 ? (
                            indicatedSchedules.map((sch, sIdx) => (
                                <span key={sIdx} className="bg-white border border-indigo-200 text-indigo-800 text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                                    Kelas {sch.classId}: {sch.day} ({sch.time})
                                </span>
                            ))
                        ) : (
                            <span className="text-xs font-semibold text-gray-500 italic bg-white border px-3 py-1 rounded-full">
                                Tidak ada jadwal terkonfigurasi.
                            </span>
                        )}
                    </div>
                </div>

                {rekapLoading ? (
                    <div className="flex flex-col items-center justify-center py-24 text-gray-500 gap-3">
                        <Loader2 size={36} className="animate-spin text-indigo-600" />
                        <p className="font-semibold text-sm">Sedang memproses dan mengelompokkan data jurnal...</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {entriesGroupedByWeek.map((weekGroup, wIdx) => {
                            const rangeLabel = `Tanggal: ${weekGroup.start.toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})} s/d ${weekGroup.end.toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}`;
                            return (
                                <div key={weekGroup.weekKey} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                    <div className="bg-[#5AB2FF] text-white px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-200">
                                        <h3 className="text-sm font-bold flex items-center gap-2">
                                            <span className="bg-white text-indigo-900 px-3 py-1 rounded-md text-xs font-extrabold shadow-sm">
                                                Minggu {weekGroup.weekOfMonth}
                                            </span>
                                            <span className="text-white drop-shadow-sm">{rangeLabel}</span>
                                        </h3>
                                        <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full shadow-inner border border-white/10">
                                            {weekGroup.entries.length} Sesi Terlaksana
                                        </span>
                                    </div>
                                    <div className="overflow-x-auto font-sans">
                                        <table className="w-full text-xs text-left border-collapse">
                                            <thead className="bg-[#f8fafc] text-gray-700 border-b border-gray-150 font-bold uppercase tracking-wider text-[10px]">
                                                <tr>
                                                    <th className="p-3 text-center w-12 text-gray-500">No</th>
                                                    <th className="p-3 text-center w-20 text-gray-500">Kelas</th>
                                                    <th className="p-3 w-36 text-gray-500">Hari/Tanggal</th>
                                                    <th className="p-3 w-32 text-gray-500">Waktu / Jam</th>
                                                    <th className="p-3 w-48 text-gray-500">Topik / Materi</th>
                                                    <th className="p-3 text-gray-500">Kegiatan Pembelajaran</th>
                                                    <th className="p-3 w-36 text-gray-500">Evaluasi</th>
                                                    <th className="p-3 w-36 text-gray-500">Refleksi</th>
                                                    <th className="p-3 w-36 text-gray-500">Tindak Lanjut</th>
                                                    <th className="p-3 w-28 text-gray-500 text-center">Kehadiran Guru</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {weekGroup.entries.map((row, idx) => (
                                                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                        <td className="p-3 text-center text-gray-400 font-mono">{idx + 1}</td>
                                                        <td className="p-3 text-center">
                                                            <span className="bg-indigo-50 text-indigo-800 px-2.5 py-1 rounded-md font-bold text-[11px] border border-indigo-100 uppercase">
                                                                Kelas {row.classId}
                                                            </span>
                                                        </td>
                                                        <td className="p-3 font-semibold text-gray-700">
                                                            {getDayName(row.date)}, {new Date(row.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}
                                                        </td>
                                                        <td className="p-3 text-gray-600 font-medium">{row.timeSlot || '-'}</td>
                                                        <td className="p-3 font-medium text-gray-800">{isSpecialSubject(row.subject) ? <span className="text-gray-400 font-medium">-</span> : (row.topic || '-')}</td>
                                                        <td className="p-3 text-gray-600 leading-relaxed max-w-xs truncate hover:whitespace-normal transition-all">{isSpecialSubject(row.subject) ? <span className="text-gray-400 font-medium">-</span> : (row.activities || '-')}</td>
                                                        <td className="p-3 text-gray-600 leading-relaxed">{isSpecialSubject(row.subject) ? <span className="text-gray-400 font-medium">-</span> : (row.evaluation || '-')}</td>
                                                        <td className="p-3 text-gray-600 leading-relaxed">{isSpecialSubject(row.subject) ? <span className="text-gray-400 font-medium">-</span> : (row.reflection || '-')}</td>
                                                        <td className="p-3 text-gray-600 leading-relaxed">{isSpecialSubject(row.subject) ? <span className="text-gray-400 font-medium">-</span> : (row.followUp || '-')}</td>
                                                        <td className="p-3 text-center">
                                                            {isSpecialSubject(row.subject) ? (
                                                                <span className="text-gray-400 font-medium">-</span>
                                                            ) : (
                                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold shadow-sm ${row.isTeacherPresent ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                                                                    {row.isTeacherPresent ? 'Hadir' : 'Absen'}
                                                                </span>
                                                            )}
                                                            {row.teacherName && (
                                                                <span className="block text-[9px] text-gray-500 font-medium mt-1 truncate max-w-[120px] mx-auto" title={row.teacherName}>
                                                                    ({row.teacherName})
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            );
                        })}
                        {entriesGroupedByWeek.length === 0 && (
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-16 text-center text-gray-400 italic">
                                Tidak ada data rekapitulasi jurnal mengajar {selectedSubject} yang sesuai dengan kriteria filter.
                            </div>
                        )}
                    </div>
                )}
            </div>
        )}
        
        {/* Footer info */}
        {viewMode === 'daily' && (
            <div className="mt-4 text-xs text-gray-400 italic no-print flex items-center gap-2">
                <span>* Mata pelajaran otomatis terisi sesuai jadwal hari ini ({getDayName(currentDate)}). Anda dapat menambah baris manual jika diperlukan.</span>
            </div>
        )}
    </div>
  );
};

export default LearningJournalView;