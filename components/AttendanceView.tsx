
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { Student, Holiday, TeacherProfileData, SchoolProfileData, User, ScheduleItem } from '../types';
import { MOCK_SUBJECTS } from '../constants';
import html2pdf from 'html2pdf.js';
import { apiService } from '../services/apiService';
import { 
  Calendar, Check, X, Save, FileText, Activity, Printer, 
  FileSpreadsheet, Upload, Download, PieChart, Users, 
  CalendarRange, Trash2, Plus, AlertCircle, CheckSquare,
  CalendarClock, ArrowRight, Loader2, CloudDownload,
  AlertTriangle, Filter, Edit, ChevronDown, XCircle, Pencil,
  ChevronLeft, ChevronRight, RefreshCw, Scan, Camera, CheckCircle, Medal,
  RotateCcw
} from 'lucide-react';
import CustomModal from './CustomModal';
import { getLocalISODate } from '../utils/dateUtils';
import { AttendancePrint } from './print/AttendancePrint';

interface AttendanceViewProps {
  students: Student[];
  allStudents?: Student[];
  isDemoMode: boolean;
  allAttendanceRecords: any[];
  holidays: Holiday[];
  onRefreshData: () => void;
  onAddHoliday: (holidays: Omit<Holiday, 'id'>[]) => Promise<void>;
  onUpdateHoliday: (holiday: Holiday) => void;
  onDeleteHoliday: (id: string) => void;
  onShowNotification: (message: string, type: 'success' | 'error' | 'warning') => void;
  teacherProfile?: TeacherProfileData;
  schoolProfile?: SchoolProfileData;
  classId: string;
  isReadOnly?: boolean;
  userRole?: string;
  currentUser?: User | null;
}

type AttendanceStatus = 'present' | 'sick' | 'permit' | 'alpha' | 'dispensation';
type ViewMode = 'rekap' | 'rekap_mapel' | 'daily' | 'range' | 'holiday' | 'semester' | 'semester_mapel';

const HOLIDAY_TYPE_LEGEND: { [key: string]: { label: string; color: string; style: { bg: string, text: string } } } = {
    nasional: { label: 'Libur Nasional', color: 'bg-red-500', style: { bg: 'bg-red-50', text: 'text-red-700' } },
    haribesar: { label: 'Libur Hari Besar', color: 'bg-purple-500', style: { bg: 'bg-purple-50', text: 'text-purple-700' } },
    cuti: { label: 'Cuti Bersama', color: 'bg-amber-500', style: { bg: 'bg-amber-50', text: 'text-amber-700' } },
    semester: { label: 'Libur Semester', color: 'bg-blue-500', style: { bg: 'bg-blue-50', text: 'text-blue-700' } },
};
const SUNDAY_STYLE = { bg: 'bg-rose-50', text: 'text-rose-700' };
const STATUS_TEXT: { [key in AttendanceStatus]: string } = {
  present: 'Hadir',
  sick: 'Sakit',
  permit: 'Izin',
  alpha: 'Alpha',
  dispensation: 'Dispensasi'
};


const AttendanceView: React.FC<AttendanceViewProps> = ({ 
  students, allStudents, isDemoMode, allAttendanceRecords, holidays, 
  onRefreshData, onAddHoliday, onUpdateHoliday, onDeleteHoliday, onShowNotification,
  teacherProfile, schoolProfile, classId, isReadOnly = false, userRole, currentUser
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>(isReadOnly ? 'rekap' : 'daily');
  const location = useLocation();
  const canManageHolidays = userRole === 'admin' && !isReadOnly;

  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [classSchedule, setClassSchedule] = useState<ScheduleItem[]>([]);
  
  const [selectedDate, setSelectedDate] = useState(getLocalISODate(new Date())); 
  const [dailyAttendance, setDailyAttendance] = useState<Record<string, {status: AttendanceStatus, notes: string}>>({});
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [rangeStart, setRangeStart] = useState(getLocalISODate(new Date()));
  const [rangeEnd, setRangeEnd] = useState(getLocalISODate(new Date()));
  const [rangeAttendance, setRangeAttendance] = useState<Record<string, {status: AttendanceStatus, notes: string}>>({});
  const [skipHolidays, setSkipHolidays] = useState(true);
  const [savingBatch, setSavingBatch] = useState(false);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [semesterYear, setSemesterYear] = useState(new Date().getFullYear());
  const [selectedSemester, setSelectedSemester] = useState<'ganjil' | 'genap'>(() => {
    const currentMonth = new Date().getMonth() + 1;
    return currentMonth >= 7 ? 'ganjil' : 'genap';
  });
  
  const [rekapEditData, setRekapEditData] = useState<{studentId: string, date: string, status: string, notes: string, name: string} | null>(null);
  const [isSavingRekapCell, setIsSavingRekapCell] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // FAB & Scanner State
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<"user" | "environment">("environment");
  const [lastScannedStudent, setLastScannedStudent] = useState<{name: string, time: string} | null>(null);
  const scannerRef = useRef<any>(null);

  // Replaced Modal state with Inline Form state
  const [isSavingHoliday, setIsSavingHoliday] = useState(false);
  const [isHolidayRange, setIsHolidayRange] = useState(false);
  const [holidayEndDate, setHolidayEndDate] = useState(getLocalISODate(new Date()));
  const [holidayForm, setHolidayForm] = useState<Partial<Holiday>>({
      date: getLocalISODate(new Date()),
      description: '',
      type: 'nasional',
      id: '' 
  });
  
  // Custom Modal for Delete Confirmation
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, action: () => void, message: string}>({
      isOpen: false, action: () => {}, message: ''
  });

  // Logic to auto-open scanner if scan=true in URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('scan') === 'true') {
      setIsScannerOpen(true);
      // Optional: Clear the parameter so it doesn't reopen if the user navigates back
      // window.history.replaceState({}, '', location.pathname);
    }
  }, [location.search]);

  // Pagination State
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  const rekapStudents = useMemo(() => {
      // If printing (detected via check or just logic), we might want all students.
      // However, for screen we paginate. 
      // The print logic in CSS hides everything else, but we need to ensure the TABLE inside #print-area renders ALL students if needed.
      // For now, we keep pagination for screen. Users should ideally select "Show All" or 100 before printing for full list.
      const startIndex = (currentPage - 1) * rowsPerPage;
      return students.slice(startIndex, startIndex + rowsPerPage);
  }, [students, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(students.length / rowsPerPage);

  useEffect(() => {
      setCurrentPage(1);
  }, [rowsPerPage, viewMode]);

  const attendanceMap = useMemo(() => {
      const newMap: Record<string, { status: string; notes: string }> = {};
      if (allAttendanceRecords && Array.isArray(allAttendanceRecords)) {
          allAttendanceRecords.forEach((record: any) => {
              if (record.studentId && record.date) {
                  const sId = String(record.studentId).trim();
                  
                  let dateStr = String(record.date).trim();
                  if (dateStr.includes('T')) {
                      dateStr = dateStr.split('T')[0];
                  }
                  
                  const parts = dateStr.split('-');
                  if (parts.length === 3) {
                      const y = parts[0];
                      const m = parts[1].padStart(2, '0');
                      const d = parts[2].padStart(2, '0');
                      dateStr = `${y}-${m}-${d}`;
                  }

                  const key = `${sId}_${dateStr}`;
                  newMap[key] = { status: String(record.status).toLowerCase(), notes: record.notes || '' };
              }
          });
      }
      return newMap;
  }, [allAttendanceRecords]);

  useEffect(() => {
    const records = (allAttendanceRecords as any[]).filter((r: any) => {
        let dateStr = String(r.date || '').trim();
        if (dateStr.includes('T')) {
            dateStr = dateStr.split('T')[0];
        }
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            const y = parts[0];
            const m = parts[1].padStart(2, '0');
            const d = parts[2].padStart(2, '0');
            dateStr = `${y}-${m}-${d}`;
        }
        return dateStr === selectedDate;
    });
    
    const mappedState: Record<string, {status: AttendanceStatus, notes: string}> = {};
    for (const record of records) {
        const r = record as any;
        if (r.studentId) {
            mappedState[r.studentId] = { 
                status: String(r.status).toLowerCase() as AttendanceStatus, 
                notes: r.notes || '' 
            };
        }
    }
    setDailyAttendance(mappedState);
  }, [selectedDate, allAttendanceRecords]);

  const getRealClassId = (sId: string): string => {
      if (classId && classId.toLowerCase() !== 'all') return classId;
      const targetStudent = (allStudents || students).find(s => s.id === sId);
      return targetStudent ? targetStudent.classId : classId;
  };

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    if (isReadOnly) return;
    setDailyAttendance(prev => ({ ...prev, [studentId]: { status, notes: prev[studentId]?.notes || '' } }));
  };

  const handleNotesChange = (studentId: string, notes: string) => {
    if (isReadOnly) return;
    setDailyAttendance(prev => ({ ...prev, [studentId]: { status: prev[studentId]?.status || 'present', notes } }));
  };

  const handleMarkAllPresent = () => {
      if (isReadOnly) return;
      const newAttendance: Record<string, {status: AttendanceStatus, notes: string}> = { ...dailyAttendance };
      students.forEach(s => {
          if (!newAttendance[s.id] || !newAttendance[s.id].status) {
              newAttendance[s.id] = { status: 'present', notes: '' };
          }
      });
      setDailyAttendance(newAttendance);
  };

  const handleResetAttendance = () => {
      if (isReadOnly) return;
      setDailyAttendance({});
      onShowNotification("Tanda kehadiran dikosongkan.", 'warning');
  };

  const handleSaveDaily = async () => {
    if (isReadOnly) return;
    setSaving(true);
    const records = Object.entries(dailyAttendance).map(([id, data]: [string, any]) => ({
      studentId: id,
      classId: getRealClassId(id), 
      status: data.status, 
      notes: data.notes
    }));
    try {
      if(!isDemoMode) {
        // Find unique classes in current selection to ensure even empty ones are cleared
        const relevantClasses = Array.from(new Set(students.map(s => s.classId || classId)));
        await apiService.saveAttendance(selectedDate, records, relevantClasses);
      }
      onRefreshData();
      onShowNotification('Absensi Harian berhasil disimpan!', 'success');
    } catch(e) {
      onShowNotification('Gagal menyimpan absensi.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRangeStatusChange = (studentId: string, status: AttendanceStatus) => {
    if (isReadOnly) return;
    setRangeAttendance(prev => ({ ...prev, [studentId]: { status, notes: prev[studentId]?.notes || '' } }));
  };

  const handleRangeMarkAll = (status: AttendanceStatus) => {
      if (isReadOnly) return;
      const newAttendance = students.reduce((acc, s) => {
          acc[s.id] = { status: status, notes: '' };
          return acc;
      }, {} as Record<string, {status: AttendanceStatus, notes: string}>);
      setRangeAttendance(newAttendance);
  };

  const getDaysArray = (start: string, end: string) => {
      for(var arr=[],dt=new Date(start); dt<=new Date(end); dt.setDate(dt.getDate()+1)){
          arr.push(getLocalISODate(new Date(dt)));
      }
      return arr;
  };

  const isHolidayOrSunday = (dateString: string) => {
      const date = new Date(dateString + 'T00:00:00');
      const isSunday = date.getDay() === 0;
      const holiday = holidays.find(h => h.date === dateString);
      return isSunday || !!holiday;
  };

  const handleDownloadTemplate = () => {
    const headers = ["NIS", "Nama", "Tanggal (YYYY-MM-DD)", "Status (Hadir/Sakit/Izin/Alpha/Dispensasi)", "Catatan"];
    const example = [
      students[0]?.nis || "12345",
      students[0]?.name || "Nama Siswa",
      getLocalISODate(new Date()),
      "Hadir",
      "Keterangan opsional"
    ];
    
    const worksheet = XLSX.utils.aoa_to_sheet([headers, example]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template Absensi");
    XLSX.writeFile(workbook, "template_absensi_siswa.xlsx");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      setIsUploading(true);
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[];

        // Skip header row
        const rows = data.slice(1);
        const batchMap: Record<string, any[]> = {};

        rows.forEach(row => {
          if (!row[0] || !row[2]) return; // Skip if NIS or Date is missing

          const nis = String(row[0]).trim();
          const student = (allStudents || students).find(s => String(s.nis).trim() === nis);
          
          if (student) {
            let dateStr = String(row[2]).trim();
            // Handle Excel date serial number if necessary
            if (!isNaN(Number(dateStr)) && dateStr.length > 5) {
                const excelDate = new Date((Number(dateStr) - (25567 + 1)) * 86400 * 1000);
                dateStr = getLocalISODate(excelDate);
            }

            const statusInput = String(row[3] || 'Hadir').toLowerCase();
            let status: AttendanceStatus = 'present';
            if (statusInput.includes('sakit')) status = 'sick';
            else if (statusInput.includes('izin')) status = 'permit';
            else if (statusInput.includes('alpha') || statusInput.includes('alfa')) status = 'alpha';
            else if (statusInput.includes('dispensasi') || statusInput.includes('dispen')) status = 'dispensation';

            const notes = String(row[4] || '').trim();

            if (!batchMap[dateStr]) batchMap[dateStr] = [];
            batchMap[dateStr].push({
              studentId: student.id,
              classId: student.classId,
              status,
              notes
            });
          }
        });

        const batchPayload = Object.entries(batchMap).map(([date, records]) => ({ date, records }));
        
        if (batchPayload.length > 0) {
          if (!isDemoMode) await apiService.saveAttendanceBatch(batchPayload);
          onRefreshData();
          onShowNotification(`Berhasil mengunggah absensi untuk ${batchPayload.length} tanggal.`, 'success');
        } else {
          onShowNotification("Tidak ada data valid yang ditemukan.", 'warning');
        }
      } catch (err) {
        console.error(err);
        onShowNotification("Gagal memproses file. Pastikan format benar.", 'error');
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleSaveBatch = async () => {
    if (isReadOnly) return;
    if (Object.keys(rangeAttendance).length === 0 || !rangeStart || !rangeEnd) {
      onShowNotification("Silakan isi status absensi dan rentang tanggal.", 'warning');
      return;
    }
    setSavingBatch(true);
    try {
      let dateList = getDaysArray(rangeStart, rangeEnd);
      if (skipHolidays) dateList = dateList.filter(d => !isHolidayOrSunday(d));
      const recordsToSave = Object.entries(rangeAttendance).map(([studentId, data]: [string, any]) => ({
        studentId, 
        classId: getRealClassId(studentId), 
        status: data.status, 
        notes: data.notes
      }));
      const batchPayload = dateList.map(date => ({ date, records: recordsToSave }));
      if (!isDemoMode) await apiService.saveAttendanceBatch(batchPayload);
      onRefreshData();
      onShowNotification(`Berhasil menyimpan absensi untuk ${dateList.length} hari.`, 'success');
      setRangeAttendance({});
    } catch (e) {
      onShowNotification("Gagal menyimpan data rentang waktu.", 'error');
    } finally {
      setSavingBatch(false);
    }
  };

  const isSubjectTeacher = useMemo(() => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin' || currentUser.role === 'Kepala Sekolah') return true;
    if (currentUser.role === 'guru') {
      const pos = (currentUser.position || '').toLowerCase();
      const isWaliKelas = currentUser.classId && currentUser.classId !== 'ALL' && currentUser.classId !== '';
      const isMapelByPosition = ['pai', 'agama', 'pjok', 'olahraga', 'inggris', 'mapel', 'penjas', 'seni', 'sbdp', 'arab', 'jawa'].some(k => pos.includes(k));
      return !isWaliKelas || isMapelByPosition;
    }
    return false;
  }, [currentUser]);

  const INDO_WEEKDAYS = useMemo(() => ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', "Jum'at", 'Sabtu'], []);

  const isSubjectMatching = useCallback((schedSubjStr: string, targetSubjId: string) => {
    if (!schedSubjStr || !targetSubjId) return false;
    const sStr = schedSubjStr.toLowerCase().trim();
    const tId = targetSubjId.toLowerCase().trim();

    if (sStr === tId) return true;

    if (tId === 'pai' && (sStr.includes('pai') || sStr.includes('agama') || sStr.includes('al-quran') || sStr.includes('fiqih') || sStr.includes('pbp') || sStr.includes('islam'))) return true;
    if (tId === 'pancasila' && (sStr.includes('pancasila') || sStr.includes('ppkn') || sStr.includes('pkn') || sStr.includes('kewarganegaraan'))) return true;
    if (tId === 'indo' && (sStr.includes('indo') || sStr.includes('indonesia') || sStr.includes('bin'))) return true;
    if (tId === 'mat' && (sStr.includes('mat') || sStr.includes('mtk') || sStr.includes('matematika') || sStr.includes('berhitung'))) return true;
    if (tId === 'ipas' && (sStr.includes('ipas') || sStr.includes('ipa') || sStr.includes('ips') || sStr.includes('sains'))) return true;
    if (tId === 'senibudaya' && (sStr.includes('seni') || sStr.includes('budaya') || sStr.includes('sbdp') || sStr.includes('sbd') || sStr.includes('keterampilan') || sStr.includes('musik') || sStr.includes('tari') || sStr.includes('rupa'))) return true;
    if (tId === 'pjok' && (sStr.includes('pjok') || sStr.includes('olahraga') || sStr.includes('penjas') || sStr.includes('jasmani') || sStr.includes('senam') || sStr.includes('orkes'))) return true;
    if (tId === 'jawa' && (sStr.includes('jawa') || sStr.includes('krama') || sStr.includes('daerah'))) return true;
    if (tId === 'inggris' && (sStr.includes('inggris') || sStr.includes('english') || sStr.includes('bing'))) return true;
    if (tId === 'kka' && sStr.includes('kka')) return true;

    const subj = MOCK_SUBJECTS.find(s => s.id === targetSubjId);
    if (subj) {
      const targetName = subj.name.toLowerCase().trim();
      if (sStr === targetName || sStr.includes(targetName) || targetName.includes(sStr)) return true;
    }

    return false;
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchSchedule = async () => {
      if (!classId || classId.toLowerCase() === 'all') {
        setClassSchedule([]);
        return;
      }
      try {
        // Try getting from dedicated schedule table
        const sched = await apiService.getSchedule(classId);
        if (isMounted && sched && sched.length > 0) {
          setClassSchedule(sched);
          return;
        }

        // Fallback to class config
        const config = await apiService.getClassConfig(classId);
        if (isMounted && config && config.schedule) {
          setClassSchedule(config.schedule);
        }
      } catch (err) {
        console.error("Gagal mengambil jadwal:", err);
      }
    };
    fetchSchedule();
    return () => {
      isMounted = false;
    };
  }, [classId]);

  const [reportedWeekdays, setReportedWeekdays] = useState<string[]>([]);

  useEffect(() => {
    let isMounted = true;
    const fetchReportedWeekdays = async () => {
      if (!classId || !selectedSubject || classId.toLowerCase() === 'all') {
        setReportedWeekdays([]);
        return;
      }
      try {
        const reports = await apiService.getLearningReports(classId);
        if (isMounted && reports) {
          const daysFound = new Set<string>();
          reports.forEach(r => {
            if (isSubjectMatching(r.subject, selectedSubject) && r.date) {
              const date = new Date(r.date + 'T00:00:00');
              const dNum = date.getDay();
              if (dNum >= 0 && dNum < INDO_WEEKDAYS.length) {
                daysFound.add(INDO_WEEKDAYS[dNum]);
              }
            }
          });
          setReportedWeekdays(Array.from(daysFound));
        }
      } catch (err) {
        console.error("Gagal mengambil laporan pembelajaran:", err);
      }
    };
    fetchReportedWeekdays();
    return () => {
      isMounted = false;
    };
  }, [classId, selectedSubject, isSubjectMatching, INDO_WEEKDAYS]);

  useEffect(() => {
    if (currentUser && currentUser.role === 'guru') {
      const pos = (currentUser.position || '').toLowerCase();
      if (pos.includes('pai') || pos.includes('agama')) {
        setSelectedSubject('pai');
      } else if (pos.includes('pjok') || pos.includes('olahraga') || pos.includes('penjas')) {
        setSelectedSubject('pjok');
      } else if (pos.includes('inggris')) {
        setSelectedSubject('inggris');
      } else {
        setSelectedSubject('pai');
      }
    } else {
      setSelectedSubject('pai');
    }
  }, [currentUser]);

  const scheduledDays = useMemo(() => {
    if (!selectedSubject) return [];
    
    // Get schedule items matching the current subject
    const matchingItems = classSchedule.filter(item => 
      isSubjectMatching(item.subject, selectedSubject)
    );
    const scheduleDaysSet = new Set(matchingItems.map(item => (item.day || '').trim()).filter(Boolean));
    
    // Auto-sync: also include any weekdays where class has actually been reported/held for this subject
    reportedWeekdays.forEach(day => {
      if (day) {
        scheduleDaysSet.add(day.trim());
      }
    });
    
    return Array.from(scheduleDaysSet);
  }, [classSchedule, selectedSubject, isSubjectMatching, reportedWeekdays]);

  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  
  const getDateKeyForDay = useCallback((day: number | string) => 
      typeof day === 'string' ? day : `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
  [selectedYear, selectedMonth]);

  const mapelDaysArray = useMemo(() => {
    if (!selectedSubject || scheduledDays.length === 0) return [];
    const schedDaysNormalized = scheduledDays.map(d => d.toLowerCase().trim().replace(/['`]/g, ""));
    return daysArray.filter(d => {
      const dateStr = getDateKeyForDay(d);
      const date = new Date(dateStr + 'T00:00:00');
      const dayName = INDO_WEEKDAYS[date.getDay()];
      return dayName ? schedDaysNormalized.includes(dayName.toLowerCase().trim().replace(/['`]/g, "")) : false;
    });
  }, [daysArray, getDateKeyForDay, scheduledDays, INDO_WEEKDAYS]);

  const semesterMonths = useMemo(() => {
    if (selectedSemester === 'ganjil') {
      return [
        { num: 7, name: 'Juli' },
        { num: 8, name: 'Agustus' },
        { num: 9, name: 'September' },
        { num: 10, name: 'Oktober' },
        { num: 11, name: 'November' },
        { num: 12, name: 'Desember' }
      ];
    } else {
      return [
        { num: 1, name: 'Januari' },
        { num: 2, name: 'Februari' },
        { num: 3, name: 'Maret' },
        { num: 4, name: 'April' },
        { num: 5, name: 'Mei' },
        { num: 6, name: 'Juni' }
      ];
    }
  }, [selectedSemester]);

  const semesterMapelDates = useMemo(() => {
    if (viewMode !== 'semester_mapel' || !selectedSubject || scheduledDays.length === 0) return [];
    const dates: string[] = [];
    semesterMonths.forEach(mObj => {
        const m = mObj.num;
        const daysInMonth = new Date(semesterYear, m, 0).getDate();
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${semesterYear}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const date = new Date(dateStr + 'T00:00:00');
            const dayName = INDO_WEEKDAYS[date.getDay()];
            const schedDaysNormalized = scheduledDays.map(sd => sd.toLowerCase().trim().replace(/['`]/g, ""));
            if (dayName && schedDaysNormalized.includes(dayName.toLowerCase().trim().replace(/['`]/g, ""))) {
                dates.push(dateStr);
            }
        }
    });
    return dates;
  }, [viewMode, selectedSubject, scheduledDays, semesterMonths, semesterYear, INDO_WEEKDAYS]);

  const displayedDaysArray = useMemo(() => {
    if (viewMode === 'rekap_mapel') return mapelDaysArray;
    if (viewMode === 'semester_mapel') return semesterMapelDates;
    return daysArray;
  }, [viewMode, mapelDaysArray, semesterMapelDates, daysArray]);

  const getHolidayForDay = useCallback((day: number | string) => {
      const dateString = typeof day === 'string' ? day : getDateKeyForDay(day);
      const date = new Date(dateString + 'T00:00:00');
      const isSunday = date.getDay() === 0;
      const holiday = holidays.find(h => h.date === dateString);
      if (isSunday && !holiday) return { isRed: true, holidayDesc: 'Minggu' };
      if (holiday) return { isRed: true, holidayDesc: holiday.description, type: holiday.type };
      return { isRed: false };
  }, [getDateKeyForDay, holidays]);

  const getAttendanceForDay = (studentId: string, day: number | string) => {
      const dateStr = typeof day === 'string' ? day : getDateKeyForDay(day);
      const key = `${String(studentId).trim()}_${dateStr}`;
      return attendanceMap[key];
  };

  // --- REKAP STATS CALCULATION ---
  const effectiveDaysCount = useMemo(() => {
      let count = 0;
      displayedDaysArray.forEach(d => {
          const { isRed } = getHolidayForDay(d);
          if (!isRed) count++;
      });
      return count;
  }, [displayedDaysArray, getHolidayForDay]);

  const rekapStats = useMemo(() => {
      let sakit = 0, izin = 0, alpha = 0;
      const studentCount = students.length;
      
      students.forEach(s => {
          displayedDaysArray.forEach(d => {
              const { isRed } = getHolidayForDay(d);
              if (!isRed) {
                  const dateStr = getDateKeyForDay(d);
                  const key = `${String(s.id).trim()}_${dateStr}`;
                  const record = attendanceMap[key];
                  if (record) {
                      const status = String(record.status).toLowerCase();
                      if (status === 'sick') sakit++;
                      else if (status === 'permit') izin++;
                      else if (status === 'alpha') alpha++;
                  }
              }
          });
      });

      const totalEffectiveStudentDays = studentCount * effectiveDaysCount;
      const getPct = (val: number) => totalEffectiveStudentDays === 0 ? 0 : (val / totalEffectiveStudentDays) * 100;

      return {
          sakit: getPct(sakit),
          izin: getPct(izin),
          alpha: getPct(alpha)
      };
  }, [students, displayedDaysArray, effectiveDaysCount, attendanceMap, getHolidayForDay, getDateKeyForDay]);

  // NEW: Filter holidays for the selected month for print display
  const currentMonthHolidays = useMemo(() => {
      return holidays.filter(h => {
          if (!h.date) return false;
          const [yStr, mStr] = h.date.split('-');
          return Number(yStr) === selectedYear && Number(mStr) === selectedMonth;
      }).sort((a, b) => a.date.localeCompare(b.date));
  }, [holidays, selectedMonth, selectedYear]);

  const semesterRecapData = useMemo(() => {
    const data: Record<string, Record<number, { S: number; I: number; A: number }>> = {};

    // Initialize
    students.forEach(s => {
      data[s.id] = {};
      semesterMonths.forEach(m => {
        data[s.id][m.num] = { S: 0, I: 0, A: 0 };
      });
    });

    if (allAttendanceRecords && Array.isArray(allAttendanceRecords)) {
      allAttendanceRecords.forEach((record: any) => {
        const sId = String(record.studentId).trim();
        if (!data[sId]) return;

        let dateStr = String(record.date).trim();
        if (dateStr.includes('T')) {
          dateStr = dateStr.split('T')[0];
        }
        const parts = dateStr.split('-');
        if (parts.length === 3) {
          const y = Number(parts[0]);
          const m = Number(parts[1]);
          
          if (y === semesterYear) {
            if (data[sId][m]) {
              const status = String(record.status).toLowerCase();
              if (status === 'sick') {
                data[sId][m].S++;
              } else if (status === 'permit') {
                data[sId][m].I++;
              } else if (status === 'alpha') {
                data[sId][m].A++;
              }
            }
          }
        }
      });
    }

    return data;
  }, [students, semesterMonths, semesterYear, allAttendanceRecords]);


  const handleRecapCellClick = (student: Student, date: string, currentStatus?: string, currentNotes?: string) => {
      if (isReadOnly) return;
      setRekapEditData({
          studentId: student.id,
          name: student.name,
          date: date,
          status: currentStatus || '',
          notes: currentNotes || ''
      });
  };

  const handleSaveRecapEdit = async (newStatus: string | null) => {
      if (!rekapEditData || isReadOnly) return;
      setIsSavingRekapCell(true);
      try {
          const targetDate = rekapEditData.date;
          const existingRecordsForDate = allAttendanceRecords.filter(r => r.date === targetDate);
          const recordsMap: Record<string, any> = {};
          existingRecordsForDate.forEach(r => {
              recordsMap[r.studentId] = { status: r.status, notes: r.notes || '' };
          });
          if (newStatus) {
              recordsMap[rekapEditData.studentId] = { status: newStatus, notes: rekapEditData.notes };
          } else {
              delete recordsMap[rekapEditData.studentId];
          }
          const payloadRecords = Object.entries(recordsMap).map(([sid, val]: [string, any]) => ({
              studentId: sid, 
              classId: getRealClassId(sid), 
              status: val.status, 
              notes: val.notes
          }));
          
          // Ensure the class of the edited student is forced to update even if empty
          const targetClassId = getRealClassId(rekapEditData.studentId);
          if (!isDemoMode) await apiService.saveAttendance(targetDate, payloadRecords, [targetClassId]);
          
          onRefreshData();
          onShowNotification('Data absensi diperbarui.', 'success');
          setRekapEditData(null);
      } catch (e) {
          onShowNotification('Gagal update data.', 'error');
      } finally {
          setIsSavingRekapCell(false);
      }
  };

  const resetHolidayForm = () => {
      setHolidayForm({
          date: getLocalISODate(new Date()),
          description: '',
          type: 'nasional',
          id: ''
      });
      setIsHolidayRange(false);
      setHolidayEndDate(getLocalISODate(new Date()));
  };

  const handleEditHolidayClick = (holiday: Holiday) => {
      setHolidayForm({ ...holiday });
      setIsHolidayRange(false); // Disable range when editing
  };
  
  const handleSaveHolidayInline = async () => {
    if (!canManageHolidays) return;
    if (!holidayForm.date || !holidayForm.description) {
      onShowNotification("Mohon lengkapi tanggal dan keterangan.", 'warning');
      return;
    }

    // Validate range if enabled
    if (!holidayForm.id && isHolidayRange && holidayEndDate < holidayForm.date!) {
         onShowNotification("Tanggal akhir tidak boleh sebelum tanggal awal.", 'warning');
         return;
    }

    setIsSavingHoliday(true);
    try {
      if (!holidayForm.id) {
        if (isHolidayRange) {
            const dateList = getDaysArray(holidayForm.date!, holidayEndDate);
            const batchHolidays = dateList.map(d => ({
                classId: "__SCHOOL_WIDE__",
                date: d,
                description: holidayForm.description!,
                type: holidayForm.type as Holiday['type']
            }));
            await onAddHoliday(batchHolidays);
        } else {
            await onAddHoliday([{ classId: "__SCHOOL_WIDE__", date: holidayForm.date!, description: holidayForm.description!, type: holidayForm.type as Holiday['type'] }]);
        }
      } else {
        await onUpdateHoliday({ ...holidayForm, classId: "__SCHOOL_WIDE__" } as Holiday);
      }
      resetHolidayForm();
    } catch (e) { console.error(e); } finally { setIsSavingHoliday(false); }
  };

  const handleDeleteHolidayClick = (id: string) => {
     if (!canManageHolidays) return;
     setConfirmModal({
         isOpen: true,
         message: "Hapus hari libur ini?",
         action: () => {
             onDeleteHoliday(id);
             setConfirmModal(prev => ({...prev, isOpen: false}));
         }
     });
  };

  const getHolidayColorStyle = (type?: string) => { return (type && HOLIDAY_TYPE_LEGEND[type]?.style) || SUNDAY_STYLE; };
  const getHolidayPillColor = (type: string) => { return HOLIDAY_TYPE_LEGEND[type]?.color || 'bg-gray-500'; };
  
  // Date helpers for footer
  const getLastDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 0).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };
  
  const tanggalAkhirBulan = getLastDayOfMonth(selectedYear, selectedMonth);
  const monthName = new Date(selectedYear, selectedMonth - 1).toLocaleString('id-ID', { month: 'long' });

  // UPDATED PRINT FUNCTION
  const handlePrint = () => {
    const printContent = document.getElementById('print-area');
    if (!printContent) return;

    const htmlContent = `
      <div style="font-family: 'Inter', sans-serif; background-color: white; padding: 20px; color: #000; width: 100%;">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
          
          @media print {
            @page {
              size: A4 landscape;
              margin: 1cm;
            }
            body {
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            .print-header { display: block !important; }
            .print-footer { display: block !important; }
            .hidden { display: block !important; }
            .no-print { display: none !important; }
            
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 8px;
              page-break-inside: avoid;
              break-inside: avoid;
            }
            
            th, td {
              border: 1px solid #000;
              padding: 2px;
              text-align: center;
            }

            tr { page-break-inside: avoid; break-inside: avoid; }

            .nama-siswa-col {
              text-align: left !important;
              padding-left: 4px !important;
            }
            
            thead th {
              background-color: #f3f4f6 !important;
              color: #000 !important;
            }
          }

          .print-header { text-align: center; margin-bottom: 20px; page-break-inside: avoid; break-inside: avoid; }
          .print-footer { margin-top: 30px; padding: 0 40px; font-size: 12px; page-break-inside: avoid; break-inside: avoid; }
          
          table { width: 100%; border-collapse: collapse; font-size: 10px; page-break-inside: avoid; break-inside: avoid; }
          th, td { border: 1px solid #000; padding: 2px; text-align: center; }
          tr { page-break-inside: avoid; break-inside: avoid; }
          .nama-siswa-col { text-align: left !important; padding-left: 4px !important; }
          .hidden { display: block; }
          .no-print { display: none; }
        </style>
        ${printContent.innerHTML}
      </div>
    `;

    onShowNotification('Sedang menyiapkan dokumen PDF...', 'warning');
    
    const element = document.createElement('div');
    element.innerHTML = htmlContent;
    
    const opt = {
      margin: 10,
      filename: `Rekap_Absensi_${classId}_${new Date().getTime()}.pdf`,
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
        
        window.print();
    });
  };

  const handleExportSemesterExcel = () => {
    const headersLine1 = ['No', 'Nama Siswa'];
    const headersLine2 = ['', ''];
    
    semesterMonths.forEach(m => {
      headersLine1.push(m.name, '', '');
      headersLine2.push('S', 'I', 'A');
    });
    headersLine1.push('Total Satu Semester', '', '');
    headersLine2.push('S', 'I', 'A');

    const rows: any[] = [headersLine1, headersLine2];

    students.forEach((s, idx) => {
      const row = [idx + 1, s.name.toUpperCase()];
      
      let totalS = 0;
      let totalI = 0;
      let totalA = 0;

      semesterMonths.forEach(m => {
        const studentRecapMap = semesterRecapData[s.id] || {};
        const monthData = studentRecapMap[m.num] || { S: 0, I: 0, A: 0 };
        row.push(monthData.S, monthData.I, monthData.A);
        totalS += monthData.S;
        totalI += monthData.I;
        totalA += monthData.A;
      });

      row.push(totalS, totalI, totalA);
      rows.push(row);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Rekap Semester");
    
    worksheet['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } }, 
      { s: { r: 0, c: 1 }, e: { r: 1, c: 1 } }, 
    ];

    let colIndex = 2;
    semesterMonths.forEach(() => {
      worksheet['!merges']?.push({ s: { r: 0, c: colIndex }, e: { r: 0, c: colIndex + 2 } });
      colIndex += 3;
    });

    worksheet['!merges']?.push({ s: { r: 0, c: colIndex }, e: { r: 0, c: colIndex + 2 } });

    XLSX.writeFile(workbook, `rekap_semester_${selectedSemester}_${semesterYear}.xlsx`);
    onShowNotification("Rekap semester berhasil diexport ke Excel", "success");
  };

  // --- BARCODE SCANNER LOGIC ---
  const handleScanSuccess = async (decodedText: string, decodedResult: any) => {
      if (scannerRef.current?.isPaused) return;
      if (scannerRef.current) {
          scannerRef.current.isPaused = true;
      }

      const cleanCode = String(decodedText).trim();
      const searchScope = (allStudents && allStudents.length > 0) ? allStudents : students;
      const student = searchScope.find(s => String(s.id).trim() === cleanCode || String(s.nis).trim() === cleanCode);
      
      if (student) {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          oscillator.type = "sine";
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
          oscillator.start();
          setTimeout(() => oscillator.stop(), 200);

          const now = new Date();
          const scanTime = now.toLocaleTimeString('id-ID', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\./g, ':');
          setLastScannedStudent({ name: student.name, time: scanTime });
          
          try {
              const today = getLocalISODate(new Date());
              const targetClassId = student.classId || getRealClassId(student.id);
              const payload = { studentId: student.id, classId: targetClassId, status: 'present', notes: `Via Scan ${scanTime}` };

              if (!isDemoMode) {
                  await (apiService as any).saveSingleScanAttendance(today, payload);
                  onRefreshData(); 
                  onShowNotification(`Absensi ${student.name} (${targetClassId}) berhasil dicatat.`, 'success');
              } else {
                  onShowNotification(`(Demo) ${student.name} Hadir`, 'success');
              }
          } catch (e) {
              onShowNotification("Gagal menyimpan presensi scan.", 'error');
          }
      } else {
          onShowNotification(`Siswa tidak ditemukan. Kode: ${cleanCode}`, 'warning');
      }

      setTimeout(() => {
          if (scannerRef.current) scannerRef.current.isPaused = false;
      }, 2000);
  };

  const handleScanSuccessRef = useRef(handleScanSuccess);
  useEffect(() => { handleScanSuccessRef.current = handleScanSuccess; }, [handleScanSuccess]);

  useEffect(() => {
      let isMounted = true;
      if (isScannerOpen) {
          const timer = setTimeout(() => {
              if (!isMounted) return;
              if (scannerRef.current?.scanner) {
                  scannerRef.current.scanner.stop().catch(() => {}).then(() => {
                      if (scannerRef.current?.scanner) scannerRef.current.scanner.clear().catch(() => {});
                      scannerRef.current = null;
                  });
              }
              const html5QrCode = new (window as any).Html5Qrcode("reader");
              // Use wider aspect ratio or larger box for full frame feel
              const config = { fps: 10, qrbox: { width: 300, height: 300 } };
              
              html5QrCode.start(
                  { facingMode: cameraFacingMode }, 
                  config,
                  (decodedText: string, decodedResult: any) => {
                      if (handleScanSuccessRef.current) handleScanSuccessRef.current(decodedText, decodedResult);
                  },
                  (errorMessage: any) => {}
              ).then(() => {
                  if (isMounted) scannerRef.current = { scanner: html5QrCode, isPaused: false };
                  else html5QrCode.stop().then(() => html5QrCode.clear()).catch((err: any) => console.log("Stop failed", err));
              }).catch((err: any) => {
                  if (isMounted) {
                      if (typeof err === 'string' && err.includes("already under transition")) return;
                      onShowNotification("Gagal membuka kamera. Pastikan izin diberikan.", "error");
                      setIsScannerOpen(false);
                  }
              });
          }, 300);

          return () => {
              isMounted = false;
              clearTimeout(timer);
              if (scannerRef.current?.scanner) {
                  const scannerToStop = scannerRef.current.scanner;
                  scannerRef.current = null;
                  scannerToStop.stop().then(() => scannerToStop.clear()).catch((err: any) => console.log("Failed to stop scanner", err));
              }
          };
      }
  }, [isScannerOpen, cameraFacingMode]);

  return (
    <div className="space-y-6 animate-fade-in page-landscape relative">
       
       <CustomModal 
        isOpen={confirmModal.isOpen}
        type="confirm"
        message={confirmModal.message}
        onConfirm={confirmModal.action}
        onCancel={() => setConfirmModal(prev => ({...prev, isOpen: false}))}
      />

       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
          <div className="w-full md:w-auto">
              <h2 className="text-2xl font-bold text-gray-800">Manajemen Absensi</h2>
              <p className="text-gray-500 text-sm mt-1">
                  {isReadOnly ? 'Pantau kehadiran Anda.' : 'Kelola kehadiran harian, input rentang, rekap bulanan, dan hari libur.'}
              </p>
          </div>

          {/* Mobile view dropdown */}
          <div className="relative w-full md:hidden flex flex-col gap-1.5">
             <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pilih Menu Absensi</label>
             <div className="relative">
                <select 
                  value={viewMode} 
                  onChange={(e) => setViewMode(e.target.value as ViewMode)} 
                  className="w-full bg-white border border-gray-200 text-gray-700 px-4 py-3 pr-10 rounded-xl font-semibold shadow-sm outline-none focus:ring-2 focus:ring-[#5AB2FF] appearance-none cursor-pointer"
                >
                   {!isReadOnly && <option value="daily">📅 Input Harian</option>}
                   {!isReadOnly && <option value="range">⏰ Input Rentang</option>}
                   <option value="rekap">📊 Rekap Bulanan</option>
                   {isSubjectTeacher && (
                      <>
                        <option value="rekap_mapel">📖 Rekap Mapel</option>
                        <option value="semester_mapel">🎓 Rekap Semester Mapel</option>
                      </>
                   )}
                   <option value="semester">🏫 Rekap Semester</option>
                   {!isReadOnly && <option value="holiday">🏖️ Setelan Libur</option>}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                    <ChevronDown size={20} />
                </div>
             </div>
          </div>

          {/* Desktop view tabs */}
          <div className="hidden md:flex bg-white p-1 rounded-xl border border-[#CAF4FF] shadow-sm overflow-x-auto">
             {!isReadOnly && <button onClick={() => setViewMode('daily')} className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${viewMode === 'daily' ? 'bg-[#5AB2FF] text-white shadow-md' : 'text-gray-600 hover:bg-[#FFF9D0]'}`}><Calendar size={16} className="mr-2" /> Input Harian</button>}
             {!isReadOnly && <button onClick={() => setViewMode('range')} className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${viewMode === 'range' ? 'bg-[#5AB2FF] text-white shadow-md' : 'text-gray-600 hover:bg-[#FFF9D0]'}`}><CalendarClock size={16} className="mr-2" /> Input Rentang</button>}
             <button onClick={() => setViewMode('rekap')} className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${viewMode === 'rekap' ? 'bg-[#5AB2FF] text-white shadow-md' : 'text-gray-600 hover:bg-[#FFF9D0]'}`}><FileSpreadsheet size={16} className="mr-2" /> Rekap Bulanan</button>
             {isSubjectTeacher && (
                <>
                  <button onClick={() => setViewMode('rekap_mapel')} className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${viewMode === 'rekap_mapel' ? 'bg-[#5AB2FF] text-white shadow-md' : 'text-gray-600 hover:bg-[#FFF9D0]'}`}><CalendarClock size={16} className="mr-2" /> Rekap Mapel</button>
                  <button onClick={() => setViewMode('semester_mapel')} className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${viewMode === 'semester_mapel' ? 'bg-[#5AB2FF] text-white shadow-md' : 'text-gray-600 hover:bg-[#FFF9D0]'}`}><CalendarClock size={16} className="mr-2" /> Rekap Semester Mapel</button>
                </>
             )}
             <button onClick={() => setViewMode('semester')} className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${viewMode === 'semester' ? 'bg-[#5AB2FF] text-white shadow-md' : 'text-gray-600 hover:bg-[#FFF9D0]'}`}><CalendarClock size={16} className="mr-2" /> Rekap Semester</button>
             {!isReadOnly && <button onClick={() => setViewMode('holiday')} className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${viewMode === 'holiday' ? 'bg-[#5AB2FF] text-white shadow-md' : 'text-gray-600 hover:bg-[#FFF9D0]'}`}><CalendarRange size={16} className="mr-2" /> Setelan Libur</button>}
          </div>
       </div>

       {(viewMode === 'rekap' || viewMode === 'rekap_mapel' || viewMode === 'semester_mapel') && (
           <>
             {(viewMode === 'rekap_mapel' || viewMode === 'semester_mapel') && scheduledDays.length === 0 && (
                 <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex items-start gap-3 mb-4 no-print shadow-sm">
                     <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                     <div>
                         <h4 className="font-bold">Jadwal Pelajaran Belum Diatur</h4>
                         <p className="text-sm mt-0.5">
                             Mata pelajaran <strong>{MOCK_SUBJECTS.find(s => s.id === selectedSubject)?.name || ''}</strong> belum memiliki jadwal pelajaran di <strong>Kelas {classId}</strong>.
                             Silakan hubungi admin atau atur jadwal melalui menu <strong>Administrasi Kelas &gt; Jadwal Pelajaran</strong> agar tanggal rekap dapat dimuat otomatis.
                         </p>
                     </div>
                 </div>
             )}

             <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm no-print">
                 <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                     <div className="flex items-center gap-4 flex-wrap">
                        <select value={selectedMonth} onChange={e=>setSelectedMonth(Number(e.target.value))} className="bg-[#FFF9D0]/50 border border-amber-100 rounded-lg p-2 font-semibold text-gray-700">
                            {['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'].map((m,i) => (<option key={i} value={i+1}>{m}</option>))}
                        </select>
                        <select value={selectedYear} onChange={e=>setSelectedYear(Number(e.target.value))} className="bg-[#FFF9D0]/50 border border-amber-100 rounded-lg p-2 font-semibold text-gray-700">
                            {Array.from({ length: 40 }, (_, i) => 2020 + i).map(y => (<option key={y} value={y}>{y}</option>))}
                        </select>

                        {(viewMode === 'rekap_mapel' || viewMode === 'semester_mapel') && (
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-gray-500 uppercase no-print">Mata Pelajaran:</span>
                                <select 
                                    value={selectedSubject} 
                                    onChange={e => setSelectedSubject(e.target.value)} 
                                    className="bg-[#FFF9D0]/50 border border-amber-100 rounded-lg p-2 font-semibold text-gray-700 outline-none select-subject"
                                >
                                    {MOCK_SUBJECTS.map(s => {
                                        const allowed = !currentUser || currentUser.role === 'admin' || currentUser.role === 'Kepala Sekolah' || 
                                                        ['pai', 'agama', 'pjok', 'olahraga', 'inggris', 'mapel', 'penjas', 'seni', 'sbdp', 'arab', 'jawa'].every(k => !(currentUser.position || '').toLowerCase().includes(k)) ||
                                                        (currentUser.position || '').toLowerCase().includes(s.id) ||
                                                        (s.id === 'pai' && ((currentUser.position || '').toLowerCase().includes('pai') || (currentUser.position || '').toLowerCase().includes('agama'))) ||
                                                        (s.id === 'pjok' && ((currentUser.position || '').toLowerCase().includes('pjok') || (currentUser.position || '').toLowerCase().includes('olahraga') || (currentUser.position || '').toLowerCase().includes('penjas'))) ||
                                                        (s.id === 'inggris' && (currentUser.position || '').toLowerCase().includes('inggris'));
                                        if (!allowed) return null;
                                        return <option key={s.id} value={s.id}>{s.name}</option>;
                                    })}
                                </select>
                            </div>
                        )}
                     </div>
                     <div className="flex items-center gap-2">
                        {!isReadOnly && (
                            <>
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".xlsx, .xls, .csv" />
                                <button 
                                    onClick={() => fileInputRef.current?.click()} 
                                    disabled={isUploading}
                                    className="flex items-center space-x-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-50 disabled:opacity-50"
                                >
                                    {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                                    <span>{isUploading ? 'Mengunggah...' : 'Upload CSV'}</span>
                                </button>
                                <button 
                                    onClick={handleDownloadTemplate} 
                                    className="flex items-center space-x-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-50"
                                >
                                    <Download size={16} />
                                    <span>Template</span>
                                </button>
                            </>
                        )}
                        <AttendancePrint 
                          students={students} 
                          allStudents={allStudents} 
                          allAttendanceRecords={allAttendanceRecords} 
                          holidays={holidays} 
                          schoolProfile={schoolProfile} 
                          teacherProfile={teacherProfile} 
                          currentClassId={classId} 
                        />
                     </div>
                 </div>
             </div>
             
             {/* Print Area Wrapper */}
             <div id="print-area">
                
                {/* Print Header */}
                <div className="print-header hidden print:block mb-8 text-center font-serif text-black">
                    <h2 className="text-2xl font-bold uppercase mb-1">
                        {viewMode === 'rekap_mapel' || viewMode === 'semester_mapel' 
                            ? `REKAP ABSENSI MATA PELAJARAN: ${MOCK_SUBJECTS.find(s=>s.id === selectedSubject)?.name || ''}` 
                            : 'REKAP ABSENSI BULANAN'
                        }
                    </h2>
                    <p className="text-lg">Kelas {classId}</p>
                    <p className="text-lg">
                        {viewMode === 'semester_mapel' 
                            ? `Semester ${selectedSemester === 'ganjil' ? 'Ganjil' : 'Genap'} Tahun Ajaran ${selectedSemester === 'ganjil' ? `${semesterYear}/${semesterYear + 1}` : `${semesterYear - 1}/${semesterYear}`}` 
                            : `Bulan ${monthName} Tahun Ajaran ${selectedMonth <= 6 ? `${selectedYear - 1}/${selectedYear}` : `${selectedYear}/${selectedYear + 1}`}`
                        }
                    </p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border overflow-visible print-container">
                    <div className="overflow-x-auto max-h-[600px] overflow-y-auto print:max-h-none print:overflow-visible">
                        <table className="w-full text-xs text-left border-collapse">
                            <thead className="bg-[#CAF4FF] font-bold uppercase text-[10px] sticky top-0 z-30">
                                <tr>
                                    <th className="p-2 border sticky left-0 top-0 bg-[#CAF4FF] z-40 w-10 text-center">No</th>
                                    <th className="p-2 border sticky left-10 top-0 bg-[#CAF4FF] z-40 w-48 nama-siswa-col">Nama Siswa</th>
                                    {displayedDaysArray.map(d => {
                                        const {isRed, type} = getHolidayForDay(d);
                                        const {bg, text} = getHolidayColorStyle(type);
                                        const bgClass = isRed ? bg : 'bg-[#CAF4FF]';
                                        const textClass = isRed ? text : 'text-gray-700';
                                        const label = typeof d === 'string' ? d.split('-')[2] + '/' + d.split('-')[1] : d;
                                        return <th key={d} className={`p-1 border text-center w-8 sticky top-0 z-20 ${bgClass} ${textClass}`}>{label}</th>;
                                    })}
                                    <th className="p-1 border text-center w-8 bg-emerald-100 text-emerald-800 sticky top-0 z-20">H</th>
                                    <th className="p-1 border text-center w-8 bg-amber-100 text-amber-800 sticky top-0 z-20">S</th>
                                    <th className="p-1 border text-center w-8 bg-blue-100 text-blue-800 sticky top-0 z-20">I</th>
                                    <th className="p-1 border text-center w-8 bg-rose-200 text-rose-800 sticky top-0 z-20">A</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rekapStudents.map((s, idx) => {
                                    let h=0, sk=0, i=0, a=0;
                                    for (const d of displayedDaysArray) {
                                        const {isRed} = getHolidayForDay(d);
                                        const record = getAttendanceForDay(s.id, d);
                                        const status = record?.status;
                                        if(!isRed) {
                                            if(status === 'present' || status === 'dispensation') h++;
                                        }
                                        if(status === 'sick') sk++;
                                        if(status === 'permit') i++;
                                        if(status === 'alpha') a++;
                                    }

                                    return (
                                        <tr key={s.id} className="hover:bg-gray-50 group">
                                            <td className="p-2 border text-center text-gray-500 font-mono sticky left-0 bg-white z-10 w-10 group-hover:bg-gray-50">{idx + 1}</td>
                                            <td className="p-2 border font-medium sticky left-10 bg-white z-10 whitespace-nowrap group-hover:bg-gray-50 uppercase w-48 truncate nama-siswa-col" title={s.name.toUpperCase()}>{s.name.toUpperCase()}</td>
                                            {displayedDaysArray.map(d => {
                                                const dateStr = getDateKeyForDay(d);
                                                const {isRed, holidayDesc, type} = getHolidayForDay(d);
                                                const attendanceRecord = getAttendanceForDay(s.id, d);
                                                const status = attendanceRecord?.status;
                                                const notes = attendanceRecord?.notes;
                                                const hasNote = notes && notes.trim() !== '';
                                                const {bg} = getHolidayColorStyle(type);

                                                // Determine holiday code
                                                let holidayCode = '-';
                                                if (isRed) {
                                                    if (holidayDesc === 'Minggu') holidayCode = 'LU';
                                                    else if (type === 'cuti') holidayCode = 'CB';
                                                    else if (type === 'semester') holidayCode = 'LS';
                                                    else holidayCode = 'LHB';
                                                }

                                                return (
                                                    <td 
                                                        key={d} 
                                                        className={`p-1 border text-center relative group transition-colors ${isRed && !status ? bg : !isReadOnly ? 'cursor-pointer hover:bg-blue-50' : ''}`} 
                                                        title={status ? `${STATUS_TEXT[status as AttendanceStatus]}${hasNote ? `: ${notes}` : ''}` : (holidayDesc || '')}
                                                        onClick={() => {
                                                            if ((isRed && !status) || isReadOnly) return;
                                                            // Logic: If empty cell, click to fill. If filled, must use edit menu (icon)
                                                            if (!status) {
                                                                handleRecapCellClick(s, dateStr, status, notes);
                                                            }
                                                        }}
                                                    >
                                                        {status ? (
                                                            <div className="relative flex items-center justify-center h-full">
                                                                <span className={`font-bold ${
                                                                    status === 'present' ? 'text-emerald-600' :
                                                                    status === 'sick' ? 'text-amber-600' :
                                                                    status === 'permit' ? 'text-blue-600' :
                                                                    status === 'alpha' ? 'text-rose-600' : 
                                                                    'text-teal-600'
                                                                }`}>
                                                                    {status === 'present' ? 'H' : 
                                                                     status === 'sick' ? 'S' : 
                                                                     status === 'permit' ? 'I' : 
                                                                     status === 'alpha' ? 'A' : 
                                                                     status === 'dispensation' ? 'D' : '?'}
                                                                    {hasNote && <sup className="text-rose-500 font-bold">*</sup>}
                                                                </span>
                                                                
                                                                {/* Menu Edit (Pencil Icon) that appears only when hovered and status exists */}
                                                                {!isReadOnly && (
                                                                    <button 
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleRecapCellClick(s, dateStr, status, notes);
                                                                        }}
                                                                        className="absolute -right-1.5 -top-1.5 p-0.5 bg-[#5AB2FF] text-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:scale-110 z-10"
                                                                        title="Edit Data"
                                                                    >
                                                                        <Pencil size={8} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ) : isRed ? (
                                                            <span className="text-[9px] font-bold text-gray-500/80">{holidayCode}</span>
                                                        ) : (
                                                            <span className="opacity-0 group-hover:opacity-100 text-[#5AB2FF] font-bold">+</span>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                            <td className="p-1 border text-center font-bold bg-emerald-50">{h}</td>
                                            <td className="p-1 border text-center font-bold bg-amber-50">{sk}</td>
                                            <td className="p-1 border text-center font-bold bg-blue-50">{i}</td>
                                            <td className="p-1 border text-center font-bold bg-rose-50">{a}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Recap Summary Section - SCREEN ONLY (keep no-print) */}
                    <div className="mt-8 flex flex-col sm:flex-row justify-end gap-4 break-inside-avoid px-4 pb-6 border-t pt-4 no-print">
                        {/* Hari Efektif Table */}
                        <div className="border border-gray-300 rounded-lg overflow-hidden text-sm w-full sm:w-auto">
                            <div className="bg-gray-100 p-2 font-bold text-center border-b border-gray-300">Hari Efektif</div>
                            <div className="p-4 text-center font-bold text-xl bg-white text-gray-800">
                                {effectiveDaysCount} <span className="text-xs font-normal text-gray-500">Hari</span>
                            </div>
                        </div>

                        {/* Absensi Table */}
                        <div className="border border-gray-300 rounded-lg overflow-hidden text-sm w-full sm:w-64">
                            <div className="bg-gray-100 p-2 font-bold text-left border-b border-gray-300 px-4">Absensi</div>
                            <div className="bg-white">
                                <div className="flex justify-between px-4 py-2 border-b border-gray-100">
                                    <span className="text-gray-600">Izin</span>
                                    <span className="font-bold text-blue-600">{rekapStats.izin.toFixed(1).replace('.', ',')}%</span>
                                </div>
                                <div className="flex justify-between px-4 py-2 border-b border-gray-100">
                                    <span className="text-gray-600">Sakit</span>
                                    <span className="font-bold text-amber-600">{rekapStats.sakit.toFixed(1).replace('.', ',')}%</span>
                                </div>
                                <div className="flex justify-between px-4 py-2">
                                    <span className="text-gray-600">Alpha</span>
                                    <span className="font-bold text-rose-600">{rekapStats.alpha.toFixed(1).replace('.', ',')}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* PRINT FOOTER */}
                <div className="print-footer hidden print:block mt-10 text-black font-serif text-sm px-10">

                  <div className="flex justify-between items-start">

                    {/* ===== KIRI : HARI EFEKTIF & ABSENSI ===== */}
                    <div className="w-[30%]">
                      <p className="mb-2 font-bold">Hari Efektif : {effectiveDaysCount} Hari</p>

                      <p className="font-bold text-xs mb-1">Absensi</p>
                      <table className="w-full border-collapse border border-black text-xs">
                        <tbody>
                          <tr>
                            <td className="border border-black px-2 py-1 font-bold bg-blue-100 print:bg-blue-100">Izin</td>
                            <td className="border border-black text-center px-2">{rekapStats.izin.toFixed(1).replace('.', ',')}%</td>
                          </tr>
                          <tr>
                            <td className="border border-black px-2 py-1 font-bold bg-amber-100 print:bg-amber-100">Sakit</td>
                            <td className="border border-black text-center px-2">{rekapStats.sakit.toFixed(1).replace('.', ',')}%</td>
                          </tr>
                          <tr>
                            <td className="border border-black px-2 py-1 font-bold bg-rose-100 print:bg-rose-100">Alpha</td>
                            <td className="border border-black text-center px-2">{rekapStats.alpha.toFixed(1).replace('.', ',')}%</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>


                    {/* ===== TENGAH : KEPALA SEKOLAH ===== */}
                    <div className="w-[35%] text-center">
                      <p>Mengetahui</p>
                      <p>Kepala {schoolProfile?.name || 'Sekolah'}</p>

                      <div className="h-20 flex items-end justify-center">
                         {schoolProfile?.headmasterSignature && <img src={schoolProfile.headmasterSignature} alt="TTD" className="h-full object-contain"/>}
                      </div>

                      <p className="font-bold underline">{schoolProfile?.headmaster || '.........................'}</p>
                      <p>NIP. {schoolProfile?.headmasterNip || '.........................'}</p>
                    </div>


                    <div className="w-[30%] text-center">
                      <p>Remen, {viewMode === 'semester_mapel' 
                        ? new Date(semesterYear, selectedSemester === 'ganjil' ? 11 : 5, 30).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})
                        : tanggalAkhirBulan}
                      </p>
                      <p>{viewMode === 'rekap_mapel' || viewMode === 'semester_mapel' ? `Guru Mapel ${MOCK_SUBJECTS.find(s=>s.id === selectedSubject)?.name || ''}` : `Wali Kelas ${classId}`}</p>

                      <div className="h-20 flex items-end justify-center">
                         {teacherProfile?.signature && <img src={teacherProfile.signature} alt="TTD" className="h-full object-contain"/>}
                      </div>

                      <p className="font-bold underline">{teacherProfile?.name || '.........................'}</p>
                      <p>NIP. {teacherProfile?.nip || '.........................'}</p>
                    </div>

                  </div>
                </div>
             </div>

             <div className="flex flex-col md:flex-row justify-between items-center mt-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200 no-print">
                <div className="font-medium">
                    Menampilkan <span className="font-bold text-[#5AB2FF]">{(currentPage - 1) * rowsPerPage + 1}</span> - <span className="font-bold text-[#5AB2FF]">{Math.min(currentPage * rowsPerPage, students.length)}</span> dari <span className="font-bold">{students.length}</span> siswa
                </div>
                
                <div className="flex items-center gap-4 mt-2 md:mt-0">
                    <div className="flex items-center gap-2">
                        <span>Tampilkan:</span>
                        <select 
                            value={rowsPerPage} 
                            onChange={(e) => setRowsPerPage(Number(e.target.value))}
                            className="border rounded p-1 font-bold text-gray-700 outline-none focus:ring-1 focus:ring-[#5AB2FF]"
                        >
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                            <option value={200}>200</option>
                        </select>
                    </div>
                    
                    <div className="flex items-center gap-1">
                        <button 
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-1.5 border rounded-md hover:bg-white bg-white shadow-sm disabled:opacity-50 disabled:shadow-none transition-all"
                        >
                            <ChevronLeft size={16}/>
                        </button>
                        <span className="mx-2 font-medium">Hal {currentPage} / {totalPages}</span>
                        <button 
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-1.5 border rounded-md hover:bg-white bg-white shadow-sm disabled:opacity-50 disabled:shadow-none transition-all"
                        >
                            <ChevronRight size={16}/>
                        </button>
                    </div>
                </div>
            </div>
           </>
       )}

       {viewMode === 'semester' && (
            <>
              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm no-print">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                         <select value={selectedSemester} onChange={e=>setSelectedSemester(e.target.value as 'ganjil' | 'genap')} className="bg-[#FFF9D0]/50 border border-amber-100 rounded-lg p-2 font-semibold text-gray-700">
                             <option value="ganjil">Semester Ganjil (Juli - Des)</option>
                             <option value="genap">Semester Genap (Jan - Jun)</option>
                         </select>
                         <select value={semesterYear} onChange={e=>setSemesterYear(Number(e.target.value))} className="bg-[#FFF9D0]/50 border border-amber-100 rounded-lg p-2 font-semibold text-gray-700">
                             {Array.from({ length: 40 }, (_, i) => 2020 + i).map(y => (<option key={y} value={y}>{y}</option>))}
                         </select>
                      </div>
                      <div className="flex items-center gap-2">
                         <button 
                             onClick={handleExportSemesterExcel} 
                             className="flex items-center space-x-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-50 font-semibold"
                         >
                             <Download size={16} />
                             <span>Export Excel</span>
                         </button>
                         <AttendancePrint 
                          students={students} 
                          allStudents={allStudents} 
                          allAttendanceRecords={allAttendanceRecords} 
                          holidays={holidays} 
                          schoolProfile={schoolProfile} 
                          teacherProfile={teacherProfile} 
                          currentClassId={classId} 
                         />
                      </div>
                  </div>
              </div>
              
              {/* Print Area Wrapper for Semester */}
              <div id="print-area">
                 
                 {/* Print Header */}
                 <div className="print-header hidden print:block mb-8 text-center font-serif text-black">
                     <h2 className="text-2xl font-bold uppercase mb-1">REKAP ABSENSI SATU SEMESTER</h2>
                     <p className="text-lg">Kelas {classId}</p>
                     <p className="text-lg">Semester {selectedSemester === 'ganjil' ? 'Ganjil (Juli - Des)' : 'Genap (Jan - Jun)'} Tahun Ajaran {selectedSemester === 'ganjil' ? `${semesterYear}/${semesterYear + 1}` : `${semesterYear - 1}/${semesterYear}`}</p>
                 </div>

                 <div className="bg-white rounded-xl shadow-sm border overflow-visible print-container">
                     <div className="overflow-x-auto max-h-[600px] overflow-y-auto print:max-h-none print:overflow-visible">
                         <table className="w-full text-xs text-left border-collapse">
                             <thead className="bg-[#CAF4FF] font-bold uppercase text-[10px] sticky top-0 z-30">
                                 <tr>
                                     <th rowSpan={2} className="p-2 border text-center sticky left-0 top-0 bg-[#CAF4FF] z-40 w-10 text-center">No</th>
                                     <th rowSpan={2} className="p-2 border sticky left-10 top-0 bg-[#CAF4FF] z-40 w-48 nama-siswa-col">Nama Siswa</th>
                                     {semesterMonths.map(m => (
                                         <th key={m.num} colSpan={3} className="p-2 border text-center font-bold bg-[#CAF4FF] sticky top-0 z-20">{m.name}</th>
                                     ))}
                                     <th colSpan={3} className="p-2 border text-center font-bold bg-[#FFF9D0] sticky top-0 z-20">Total Semester</th>
                                 </tr>
                                 <tr>
                                     {semesterMonths.map(m => (
                                         <React.Fragment key={m.num}>
                                             <th className="p-1 border text-center text-amber-800 bg-amber-50 text-[10px] w-8 sticky top-[28px] z-20 border-b-2">S</th>
                                             <th className="p-1 border text-center text-blue-800 bg-blue-50 text-[10px] w-8 sticky top-[28px] z-20 border-b-2">I</th>
                                             <th className="p-1 border text-center text-rose-800 bg-rose-50 text-[10px] w-8 sticky top-[28px] z-20 border-b-2">A</th>
                                         </React.Fragment>
                                     ))}
                                     <th className="p-1 border text-center text-amber-900 bg-amber-100 text-[10px] w-10 font-bold sticky top-[28px] z-20 border-b-2">S</th>
                                     <th className="p-1 border text-center text-blue-900 bg-blue-100 text-[10px] w-10 font-bold sticky top-[28px] z-20 border-b-2">I</th>
                                     <th className="p-1 border text-center text-rose-900 bg-rose-100 text-[10px] w-10 font-bold sticky top-[28px] z-20 border-b-2">A</th>
                                 </tr>
                             </thead>
                             <tbody>
                                 {rekapStudents.map((s, idx) => {
                                     let totalS = 0;
                                     let totalI = 0;
                                     let totalA = 0;

                                     return (
                                         <tr key={s.id} className="hover:bg-gray-50 group">
                                             <td className="p-2 border text-center text-gray-500 font-mono sticky left-0 bg-white z-10 w-10 group-hover:bg-gray-50">{(currentPage - 1) * rowsPerPage + idx + 1}</td>
                                             <td className="p-2 border font-medium sticky left-10 bg-white z-10 whitespace-nowrap group-hover:bg-gray-50 uppercase w-48 truncate nama-siswa-col" title={s.name.toUpperCase()}>{s.name.toUpperCase()}</td>
                                             {semesterMonths.map(m => {
                                                 const studentRecapMap = semesterRecapData[s.id] || {};
                                                 const monthData = studentRecapMap[m.num] || { S: 0, I: 0, A: 0 };
                                                 totalS += monthData.S;
                                                 totalI += monthData.I;
                                                 totalA += monthData.A;

                                                 return (
                                                     <React.Fragment key={m.num}>
                                                         <td className="p-1 border text-center font-mono text-amber-800 bg-amber-50/10 w-8">{monthData.S || '-'}</td>
                                                         <td className="p-1 border text-center font-mono text-blue-800 bg-blue-50/10 w-8">{monthData.I || '-'}</td>
                                                         <td className="p-1 border text-center font-mono text-rose-800 bg-rose-50/10 w-8">{monthData.A || '-'}</td>
                                                     </React.Fragment>
                                                 );
                                             })}
                                             <td className="p-1 border text-center font-bold font-mono text-amber-900 bg-[#FFF9D0]/40 w-10">{totalS || '-'}</td>
                                             <td className="p-1 border text-center font-bold font-mono text-blue-900 bg-[#FFF9D0]/40 w-10">{totalI || '-'}</td>
                                             <td className="p-1 border text-center font-bold font-mono text-rose-900 bg-[#FFF9D0]/40 w-10">{totalA || '-'}</td>
                                         </tr>
                                     );
                                 })}
                             </tbody>
                         </table>
                     </div>
                 </div>

                 {/* PRINT FOOTER */}
                 <div className="print-footer hidden print:block mt-10 text-black font-serif text-sm px-10">

                   <div className="flex justify-between items-start">
                     <div className="w-[30%]"></div>
                     {/* ===== TENGAH : KEPALA SEKOLAH ===== */}
                     <div className="w-[35%] text-center">
                       <p>Mengetahui</p>
                       <p>Kepala {schoolProfile?.name || 'Sekolah'}</p>

                       <div className="h-20 flex items-end justify-center">
                          {schoolProfile?.headmasterSignature && <img src={schoolProfile.headmasterSignature} alt="TTD" className="h-full object-contain"/>}
                       </div>

                       <p className="font-bold underline">{schoolProfile?.headmaster || '.........................'}</p>
                       <p>NIP. {schoolProfile?.headmasterNip || '.........................'}</p>
                     </div>

                     {/* ===== KANAN : WALI KELAS ===== */}
                     <div className="w-[30%] text-center">
                       <p>Remen, {new Date(semesterYear, selectedSemester === 'ganjil' ? 11 : 5, 30).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
                       <p>Wali Kelas {classId}</p>

                       <div className="h-20 flex items-end justify-center">
                          {teacherProfile?.signature && <img src={teacherProfile.signature} alt="TTD" className="h-full object-contain"/>}
                       </div>

                       <p className="font-bold underline">{teacherProfile?.name || '.........................'}</p>
                       <p>NIP. {teacherProfile?.nip || '.........................'}</p>
                     </div>

                   </div>
                 </div>
              </div>

              <div className="flex flex-col md:flex-row justify-between items-center mt-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200 no-print">
                 <div className="font-medium">
                     Menampilkan <span className="font-bold text-[#5AB2FF]">{(currentPage - 1) * rowsPerPage + 1}</span> - <span className="font-bold text-[#5AB2FF]">{Math.min(currentPage * rowsPerPage, students.length)}</span> dari <span className="font-bold">{students.length}</span> siswa
                 </div>
                 
                 <div className="flex items-center gap-4 mt-2 md:mt-0">
                     <div className="flex items-center gap-2">
                         <span>Tampilkan:</span>
                         <select 
                             value={rowsPerPage} 
                             onChange={(e) => setRowsPerPage(Number(e.target.value))}
                             className="border rounded p-1 font-bold text-gray-700 outline-none focus:ring-1 focus:ring-[#5AB2FF]"
                         >
                             <option value={20}>20</option>
                             <option value={50}>50</option>
                             <option value={100}>100</option>
                             <option value={200}>200</option>
                         </select>
                     </div>
                     
                     <div className="flex items-center gap-1">
                         <button 
                             onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                             disabled={currentPage === 1}
                             className="p-1.5 border rounded-md hover:bg-white bg-white shadow-sm disabled:opacity-50 disabled:shadow-none transition-all"
                         >
                             <ChevronLeft size={16}/>
                         </button>
                         <span className="mx-2 font-medium">Hal {currentPage} / {totalPages}</span>
                         <button 
                             onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                             disabled={currentPage === totalPages}
                             className="p-1.5 border rounded-md hover:bg-white bg-white shadow-sm disabled:opacity-50 disabled:shadow-none transition-all"
                         >
                             <ChevronRight size={16}/>
                         </button>
                     </div>
                 </div>
              </div>
            </>
        )}

       {viewMode === 'daily' && !isReadOnly && (
          <div className="space-y-4">
             <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#CAF4FF] shadow-sm">
                 <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full lg:w-auto">
                     <div className="flex items-center gap-2 w-full sm:w-auto">
                         <label className="font-bold text-gray-700 text-sm whitespace-nowrap">Tanggal:</label>
                         <input 
                             type="date" 
                             value={selectedDate} 
                             onChange={e=>setSelectedDate(e.target.value)} 
                             className="border border-gray-300 p-2.5 rounded-lg text-sm text-gray-700 font-medium focus:ring-2 focus:ring-[#5AB2FF] outline-none bg-gray-50 focus:bg-white transition-all w-full sm:w-auto"
                         />
                     </div>
                     <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
                         <button 
                             onClick={handleMarkAllPresent} 
                             className="flex items-center justify-center bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-2.5 rounded-lg font-bold text-xs hover:bg-emerald-100 transition-colors"
                         >
                             <CheckSquare size={16} className="mr-1.5 shrink-0"/> 
                             <span>Isi Hadir</span>
                         </button>
                         <button 
                             onClick={handleResetAttendance} 
                             className="flex items-center justify-center bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2.5 rounded-lg font-bold text-xs hover:bg-rose-100 transition-colors"
                         >
                             <RotateCcw size={16} className="mr-1.5 shrink-0"/> 
                             <span>Reset</span>
                         </button>
                     </div>
                 </div>
                 
                 <button 
                     onClick={handleSaveDaily} 
                     disabled={saving} 
                     className="bg-gradient-to-r from-[#5AB2FF] to-[#A0DEFF] text-white px-6 py-2.5 rounded-lg font-bold text-sm disabled:opacity-50 shadow-md hover:brightness-105 active:scale-95 transition-all flex items-center justify-center w-full lg:w-auto shrink-0"
                 >
                     {saving ? (
                         <>
                             <Loader2 size={16} className="animate-spin mr-2"/>
                             <span>Menyimpan...</span>
                         </>
                     ) : (
                         <>
                             <Save size={16} className="mr-2"/>
                             <span>Simpan Presensi</span>
                         </>
                     )}
                 </button>
             </div>
             <div className="bg-white rounded-xl border overflow-x-auto">
                <table className="w-full text-sm min-w-[650px]">
                     <thead><tr className="bg-[#FFF9D0]"><th className="p-4">No</th><th className="p-4">Nama Siswa</th><th className="p-4 text-center">H</th><th className="p-4 text-center">D</th><th className="p-4 text-center">S</th><th className="p-4 text-center">I</th><th className="p-4 text-center">A</th><th className="p-4">Catatan</th></tr></thead>
                    <tbody>
                        {students.map((s, index) => (
                            <tr key={s.id} className="border-t">
                                <td className="p-4 text-center">{index + 1}</td>
                                <td className="p-4 font-medium uppercase">{s.name.toUpperCase()}</td>
                                {['present','dispensation','sick','permit','alpha'].map(type => (
                                    <td key={type} className="p-2 text-center">
                                        <button onClick={()=>handleStatusChange(s.id, type as AttendanceStatus)} className={`p-2 rounded-lg ${dailyAttendance[s.id]?.status === type ? 'bg-[#5AB2FF] text-white' : 'bg-gray-100'}`} title={type === 'dispensation' ? 'Dispensasi' : type}>
                                            {type==='present'?<Check/>:type==='dispensation'?<Medal/>:type==='sick'?<Activity/>:type==='permit'?<FileText/>:<X/>}
                                        </button>
                                    </td>
                                ))}
                                <td className="p-4"><input value={dailyAttendance[s.id]?.notes || ''} onChange={e=>handleNotesChange(s.id, e.target.value)} className="w-full border-b outline-none" placeholder="Ket..."/></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
          </div>
       )}

       {viewMode === 'range' && !isReadOnly && (
          <div className="space-y-6">
             <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                    <CalendarRange className="mr-2 text-[#5AB2FF]" size={20} /> Tentukan Rentang Waktu
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-600">Dari Tanggal</label>
                        <div className="relative">
                            <input 
                                type="date" 
                                value={rangeStart} 
                                onChange={e=>setRangeStart(e.target.value)} 
                                className="w-full border border-gray-300 p-3 pl-4 rounded-xl focus:ring-2 focus:ring-[#5AB2FF] outline-none transition-all shadow-sm bg-gray-50 focus:bg-white text-gray-700 font-medium"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-600">Sampai Tanggal</label>
                        <div className="relative">
                            <input 
                                type="date" 
                                value={rangeEnd} 
                                onChange={e=>setRangeEnd(e.target.value)} 
                                className="w-full border border-gray-300 p-3 pl-4 rounded-xl focus:ring-2 focus:ring-[#5AB2FF] outline-none transition-all shadow-sm bg-gray-50 focus:bg-white text-gray-700 font-medium"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center bg-[#FFF9D0]/50 p-4 rounded-xl border border-amber-100 gap-4">
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                        <div className="relative">
                            <input type="checkbox" checked={skipHolidays} onChange={e=>setSkipHolidays(e.target.checked)} className="sr-only peer"/>
                            <div className="w-10 h-6 bg-gray-300 rounded-full peer-checked:bg-[#5AB2FF] transition-colors"></div>
                            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4"></div>
                        </div>
                        <span className="text-sm font-medium text-gray-700">Lewati Hari Libur & Minggu</span>
                    </label>
                    <button onClick={handleSaveBatch} disabled={savingBatch} className="flex items-center bg-gradient-to-r from-[#5AB2FF] to-[#A0DEFF] text-white px-6 py-2.5 rounded-xl font-bold shadow-lg transition-transform active:scale-95 w-full md:w-auto justify-center">
                        {savingBatch ? <Loader2 className="animate-spin mr-2" size={18}/> : <Save className="mr-2" size={18}/>}
                        Simpan Rentang
                    </button>
                </div>
             </div>

             <div className="flex flex-wrap items-center gap-2 p-3 bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
                  <span className="text-xs font-bold uppercase text-gray-500 mr-2 shrink-0">Set Massal:</span>
                  <button onClick={() => handleRangeMarkAll('present')} className="px-4 py-1.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg hover:bg-emerald-200 transition-colors">Hadir Semua</button>
                  <button onClick={() => handleRangeMarkAll('dispensation')} className="px-4 py-1.5 bg-teal-100 text-teal-700 text-xs font-bold rounded-lg hover:bg-teal-200 transition-colors">Dispensasi Semua</button>
                  <button onClick={() => handleRangeMarkAll('sick')} className="px-4 py-1.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-lg hover:bg-amber-200 transition-colors">Sakit Semua</button>
                  <button onClick={() => handleRangeMarkAll('permit')} className="px-4 py-1.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-lg hover:bg-blue-200 transition-colors">Izin Semua</button>
                  <button onClick={() => handleRangeMarkAll('alpha')} className="px-4 py-1.5 bg-rose-100 text-rose-700 text-xs font-bold rounded-lg hover:bg-rose-200 transition-colors">Alpha Semua</button>
             </div>

             <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                 <table className="w-full text-sm">
                     <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-bold">
                         <tr>
                             <th className="p-4 text-left">Nama Siswa</th>
                             <th className="p-4 text-left">Status untuk Rentang Ini</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                         {students.map(s => (
                             <tr key={s.id} className="hover:bg-[#CAF4FF]/30 transition-colors">
                                 <td className="p-4 font-medium text-gray-800 uppercase">{s.name.toUpperCase()}</td>
                                 <td className="p-4">
                                     <div className="relative">
                                         <select 
                                            value={rangeAttendance[s.id]?.status || ''} 
                                            onChange={e => handleRangeStatusChange(s.id, e.target.value as AttendanceStatus)} 
                                            className={`w-full p-2.5 rounded-lg border appearance-none outline-none font-medium cursor-pointer transition-colors ${
                                                !rangeAttendance[s.id]?.status ? 'border-gray-300 text-gray-500' :
                                                rangeAttendance[s.id]?.status === 'present' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' :
                                                rangeAttendance[s.id]?.status === 'dispensation' ? 'border-teal-200 bg-teal-50 text-teal-700' :
                                                rangeAttendance[s.id]?.status === 'sick' ? 'border-amber-200 bg-amber-50 text-amber-700' :
                                                rangeAttendance[s.id]?.status === 'permit' ? 'border-blue-200 bg-blue-50 text-blue-700' :
                                                'border-rose-200 bg-rose-50 text-rose-700'
                                            }`}
                                         >
                                             <option value="">-- Pilih Status --</option>
                                             <option value="present">Hadir</option>
                                             <option value="dispensation">Dispensasi</option>
                                             <option value="sick">Sakit</option>
                                             <option value="permit">Izin</option>
                                             <option value="alpha">Alpha</option>
                                         </select>
                                         <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500">
                                             <ChevronDown size={16} />
                                         </div>
                                     </div>
                                 </td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
             </div>
          </div>
       )}

       {viewMode === 'holiday' && !isReadOnly && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-6">
                  {canManageHolidays && (
                      <div className="bg-white p-6 rounded-xl border border-gray-200 h-fit shadow-sm sticky top-6">
                          <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                              {holidayForm.id ? <Edit size={18} className="mr-2 text-[#5AB2FF]"/> : <Plus size={18} className="mr-2 text-[#5AB2FF]"/>}
                              {holidayForm.id ? 'Edit Data Libur' : 'Tambah Hari Libur'}
                          </h3>
                          
                          <div className="space-y-4">
                              {!holidayForm.id && (
                                  <label className="flex items-center gap-2 cursor-pointer mb-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
                                    <div className="relative">
                                        <input type="checkbox" checked={isHolidayRange} onChange={e=>setIsHolidayRange(e.target.checked)} className="sr-only peer"/>
                                        <div className="w-9 h-5 bg-gray-300 rounded-full peer-checked:bg-[#5AB2FF] transition-colors"></div>
                                        <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4"></div>
                                    </div>
                                    <span className="text-xs font-bold text-gray-600">Input Rentang Tanggal</span>
                                  </label>
                              )}

                              <div>
                                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{isHolidayRange ? 'Dari Tanggal' : 'Tanggal'}</label>
                                  <input 
                                    type="date" 
                                    value={holidayForm.date} 
                                    onChange={(e) => setHolidayForm({...holidayForm, date: e.target.value})}
                                    className="w-full border border-gray-300 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                  />
                              </div>

                              {isHolidayRange && (
                                  <div className="animate-fade-in-up">
                                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Sampai Tanggal</label>
                                      <input 
                                        type="date" 
                                        value={holidayEndDate} 
                                        onChange={(e) => setHolidayEndDate(e.target.value)}
                                        className="w-full border border-gray-300 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                      />
                                  </div>
                              )}
                              
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Keterangan</label>
                                  <input 
                                    type="text" 
                                    value={holidayForm.description} 
                                    onChange={(e) => setHolidayForm({...holidayForm, description: e.target.value})}
                                    placeholder="Contoh: HUT RI ke-79"
                                    className="w-full border border-gray-300 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                  />
                              </div>

                              <div>
                                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tipe Libur</label>
                                  <select 
                                    value={holidayForm.type} 
                                    onChange={(e) => setHolidayForm({...holidayForm, type: e.target.value as Holiday['type']})}
                                    className="w-full border border-gray-300 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                  >
                                      {Object.entries(HOLIDAY_TYPE_LEGEND).map(([key, val]) => (
                                          <option key={key} value={key}>{val.label}</option>
                                      ))}
                                  </select>
                              </div>

                              <div className="flex gap-2 pt-2">
                                  {holidayForm.id && (
                                      <button 
                                        onClick={resetHolidayForm}
                                        className="flex-1 py-2.5 border border-gray-300 text-gray-600 rounded-lg text-sm font-bold hover:bg-gray-50"
                                      >
                                          Batal
                                      </button>
                                  )}
                                  <button 
                                    onClick={handleSaveHolidayInline}
                                    disabled={isSavingHoliday}
                                    className={`flex-1 flex items-center justify-center py-2.5 bg-gradient-to-r from-[#5AB2FF] to-[#A0DEFF] text-white rounded-lg text-sm font-bold shadow-md disabled:opacity-50 ${!holidayForm.id ? 'w-full' : ''}`}
                                  >
                                      {isSavingHoliday ? <Loader2 className="animate-spin mr-2" size={16}/> : <Save className="mr-2" size={16}/>}
                                      Simpan
                                  </button>
                              </div>
                          </div>
                      </div>
                  )}

                  {!canManageHolidays && (
                       <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 text-blue-800 text-sm shadow-sm flex items-start">
                           <AlertTriangle size={20} className="mr-2 shrink-0 mt-0.5" />
                           <p>Pengaturan hari libur sekolah hanya dapat dilakukan oleh Administrator. Data ini berlaku untuk semua kelas.</p>
                       </div>
                  )}

                   <div className="bg-white p-6 rounded-xl border border-gray-200 h-fit shadow-sm">
                        <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase">Keterangan Warna</h3>
                        <div className="space-y-3">
                            {Object.values(HOLIDAY_TYPE_LEGEND).map(({ label, color }) => (
                                <div key={label} className="flex items-center gap-3">
                                    <span className={`w-4 h-4 rounded-md ${color} shadow-sm`}></span>
                                    <span className="text-sm text-gray-600">{label}</span>
                                </div>
                            ))}
                        </div>
                   </div>
              </div>

              <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                      <h3 className="font-bold text-gray-800">Daftar Hari Libur</h3>
                      <span className="text-xs bg-[#CAF4FF] text-[#5AB2FF] px-2 py-1 rounded-full font-bold">{holidays.length} Data</span>
                  </div>
                  <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                      {holidays.length === 0 ? (
                          <div className="p-8 text-center text-gray-400 italic">Belum ada data libur.</div>
                      ) : (
                          holidays.map(h => (
                            <div key={h.id} className="p-4 flex justify-between items-center group hover:bg-[#CAF4FF]/30 transition-colors">
                                <div>
                                    <p className="font-bold text-gray-800">{h.description}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-sm text-gray-500 flex items-center">
                                            <Calendar size={14} className="mr-1"/>
                                            {new Date(h.date + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                        </span>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full text-white font-bold ${getHolidayPillColor(h.type)}`}>{h.type}</span>
                                    </div>
                                </div>
                                {canManageHolidays && (
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEditHolidayClick(h)} className="p-2 text-gray-400 hover:text-[#5AB2FF] rounded-full hover:bg-white"><Edit size={16}/></button>
                                        <button onClick={() => handleDeleteHolidayClick(h.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-white"><Trash2 size={16}/></button>
                                    </div>
                                )}
                            </div>
                          ))
                      )}
                  </div>
              </div>
          </div>
       )}

       {rekapEditData && !isReadOnly && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm no-print">
               <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">
                   <div className="p-5 border-b bg-[#CAF4FF]/30 flex justify-between items-center">
                       <div>
                           <h3 className="font-bold text-lg text-gray-800">Edit Absensi</h3>
                           <p className="text-xs text-gray-500">{rekapEditData.name} • {new Date(rekapEditData.date).toLocaleDateString('id-ID', {day:'numeric', month:'long'})}</p>
                       </div>
                       <button onClick={()=>setRekapEditData(null)} className="p-1 hover:bg-gray-200 rounded-full transition-colors"><X size={20}/></button>
                   </div>
                   <div className="p-6 space-y-4">
                       <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Status Kehadiran</label>
                           <div className="grid grid-cols-2 gap-2">
                               {['present','sick','permit','alpha','dispensation'].map(s => (
                                   <button 
                                     key={s} 
                                     onClick={() => setRekapEditData({...rekapEditData, status: s})}
                                     className={`py-2 px-3 rounded-lg text-sm font-bold border transition-all ${
                                         rekapEditData.status === s 
                                         ? 'bg-[#5AB2FF] text-white border-[#5AB2FF] shadow-md transform scale-105' 
                                         : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                     }`}
                                   >
                                       {STATUS_TEXT[s as AttendanceStatus]}
                                   </button>
                               ))}
                           </div>
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Catatan (Opsional)</label>
                           <textarea 
                             rows={3} 
                             className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#5AB2FF] outline-none resize-none"
                             placeholder="Keterangan tambahan..."
                             value={rekapEditData.notes}
                             onChange={e => setRekapEditData({...rekapEditData, notes: e.target.value})}
                           />
                       </div>
                   </div>
                   <div className="p-5 border-t bg-gray-50 flex justify-between items-center">
                       <button 
                         onClick={() => handleSaveRecapEdit('')} 
                         disabled={isSavingRekapCell}                         className="text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                         title="Kosongkan Data Absen"
                       >
                           <Trash2 size={18} />
                       </button>
                       <div className="flex gap-2">
                           <button onClick={()=>setRekapEditData(null)} className="px-4 py-2 rounded-lg border bg-white text-gray-600 hover:bg-gray-100 text-sm font-medium">Batal</button>
                           <button 
                             onClick={() => handleSaveRecapEdit(rekapEditData.status)} 
                             disabled={isSavingRekapCell}
                             className="px-6 py-2 bg-[#5AB2FF] text-white font-bold rounded-lg hover:bg-[#A0DEFF] shadow-md flex items-center gap-2 disabled:opacity-50"
                           >
                               {isSavingRekapCell && <Loader2 size={16} className="animate-spin"/>}
                               Simpan
                           </button>
                       </div>
                   </div>
               </div>
           </div>
       )}

       {/* --- NEW FULL FRAME SCANNER UI --- */}
       {!isReadOnly && (
        <>
            <div className="fixed bottom-[96px] md:bottom-[40px] right-6 z-40 flex flex-col items-end space-y-3 no-print">
                {isFabOpen && (
                    <div className="flex flex-col space-y-3 animate-fade-in-up">
                        <button 
                            onClick={() => { setIsScannerOpen(true); setIsFabOpen(false); }} 
                            className="flex items-center space-x-2 bg-white text-gray-700 px-4 py-2 rounded-full shadow-lg border border-gray-100 hover:scale-105 transition-transform"
                        >
                            <span className="text-sm font-bold">Scan QR Code</span>
                            <div className="bg-indigo-100 p-2 rounded-full text-indigo-600"><Scan size={20}/></div>
                        </button>
                    </div>
                )}
                <button 
                    onClick={() => setIsFabOpen(!isFabOpen)} 
                    className={`p-4 rounded-full shadow-xl text-white transition-all transform hover:scale-110 ${isFabOpen ? 'bg-red-500 rotate-45' : 'bg-gradient-to-r from-[#5AB2FF] to-[#A0DEFF]'}`}
                >
                    <Plus size={28} />
                </button>
            </div>

            {isScannerOpen && (
                <div className="fixed inset-0 z-[200] bg-black flex flex-col animate-fade-in">
                    {/* Header / Controls */}
                    <div className="p-4 flex justify-between items-center z-20 absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent">
                        <button 
                            onClick={() => setCameraFacingMode(prev => prev === 'user' ? 'environment' : 'user')}
                            className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-all border border-white/10"
                        >
                            <Camera size={24} />
                        </button>
                        <h3 className="font-bold text-white tracking-wider flex items-center gap-2 drop-shadow-md">
                            <Scan size={20} /> SCAN QR
                        </h3>
                        <button 
                            onClick={() => setIsScannerOpen(false)} 
                            className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-all border border-white/10"
                        >
                            <X size={24}/>
                        </button>
                    </div>
                    
                    {/* Main Scanner Area - Full Screen/Square */}
                    <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden">
                        <div id="reader" className="w-full h-full object-cover"></div>
                        
                        {/* Visual Feedback Line (Full Width) */}
                        <div className="absolute inset-0 pointer-events-none flex flex-col justify-center">
                             <div className="w-full h-0.5 bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-scan"></div>
                        </div>
                        
                        {/* Result Feedback Overlay */}
                        {lastScannedStudent && (
                            <div className="absolute bottom-20 left-4 right-4 mx-auto max-w-sm bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-2xl animate-fade-in-up z-20 flex items-center border border-emerald-100">
                                <div className="bg-emerald-100 p-3 rounded-full mr-4 text-emerald-600">
                                    <CheckCircle size={32} />
                                </div>
                                <div>
                                    <p className="text-xs text-emerald-600 font-bold uppercase tracking-wide">Berhasil Scan</p>
                                    <p className="font-bold text-gray-900 text-lg">{lastScannedStudent.name}</p>
                                    <p className="text-sm text-gray-500">{lastScannedStudent.time}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Hint Text */}
                    <div className="p-6 bg-black text-center z-20 pb-8">
                        <p className="text-white/70 text-sm">Arahkan kamera ke QR Code Siswa</p>
                    </div>
                </div>
            )}
        </>
       )}
    </div>
  );
};

export default AttendanceView;
