
import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { 
  Calendar, ClipboardList, Map, CheckCircle, BookOpen, Users,
  Printer, FileSpreadsheet, Upload, Download, Loader2, CalendarDays, RefreshCw,
  ChevronDown
} from 'lucide-react';
import { apiService } from '../services/apiService';
import { getLocalISODate } from '../utils/dateUtils';
import { Student, InventoryItem, Guest, ScheduleItem, PiketGroup, TeacherProfileData, SeatingLayouts, AcademicCalendarData, Holiday, OrganizationStructure, User, SchoolProfileData } from '../types';
import { DEFAULT_TIME_SLOTS, CALENDAR_CODES } from '../constants';

// Import Sub-Components
import ScheduleTab from './classroom/ScheduleTab';
import PiketTab from './classroom/PiketTab';
import SeatingTab from './classroom/SeatingTab';
import InventoryTab from './classroom/InventoryTab';
import GuestBookTab from './classroom/GuestBookTab';
import AcademicCalendarTab from './classroom/AcademicCalendarTab';
import OrganizationChartTab from './classroom/OrganizationChartTab'; // NEW IMPORT
import { PrintPreview } from './print/PrintPreview';

interface ClassroomAdminProps {
  students?: Student[];
  teacherProfile?: TeacherProfileData;
  onShowNotification: (message: string, type: 'success' | 'error' | 'warning') => void;
  holidays: Holiday[];
  onAddHoliday: (holidays: Omit<Holiday, 'id'>[]) => Promise<void>;
  classId: string;
  userRole?: string; // NEW PROP
  users?: User[]; // NEW: To find class teacher
  schoolProfile?: SchoolProfileData; // NEW PROP
}

const ClassroomAdmin: React.FC<ClassroomAdminProps> = ({ 
  students = [], 
  teacherProfile, 
  onShowNotification, 
  holidays, 
  onAddHoliday, 
  classId,
  userRole, // Destructure new prop
  users,
  schoolProfile
}) => {
  const [activeTab, setActiveTab] = useState<'schedule' | 'piket' | 'seating' | 'inventory' | 'guestbook' | 'calendar' | 'organization'>('schedule');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  // --- Data States ---
  const [guests, setGuests] = useState<Guest[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [piketGroups, setPiketGroups] = useState<PiketGroup[]>([]);
  const [seatingLayouts, setSeatingLayouts] = useState<SeatingLayouts>({ classical: [], groups: [], ushape: [] });
  const [academicCalendar, setAcademicCalendar] = useState<AcademicCalendarData>({});
  const [timeSlots, setTimeSlots] = useState<string[]>(DEFAULT_TIME_SLOTS);
  const [organization, setOrganization] = useState<OrganizationStructure>({ roles: {}, sections: [] }); // NEW STATE
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);

  // --- Calendar Metrics Calculation for Print / Preview ---
  const calendarMetrics = useMemo(() => {
    let ganjilKbm = 0;
    let genapKbm = 0;
    let ktsCount = 0;
    let mplsCount = 0;

    const getStartYear = () => {
      if (schoolProfile?.year && schoolProfile.year.includes('/')) {
          return Number(schoolProfile.year.split('/')[0]);
      }
      return 2025; // Default fallback
    };
    const startYear = getStartYear();

    const ganjilMonths = ['07', '08', '09', '10', '11', '12'];
    const genapMonths = ['01', '02', '03', '04', '05', '06'];

    // Scan for startYear (Jul - Dec)
    ganjilMonths.forEach(m => {
      const key = `${startYear}-${m}`;
      const days = academicCalendar[key] || [];
      days.forEach((val: any) => {
        if (val) {
          const s = String(val).trim();
          if (/^\d+$/.test(s)) {
            ganjilKbm++;
          } else if (s === 'KTS') {
            ktsCount++;
          } else if (s === 'MPLS') {
            mplsCount++;
          }
        }
      });
    });

    // Scan for startYear + 1 (Jan - Jun)
    genapMonths.forEach(m => {
      const key = `${startYear + 1}-${m}`;
      const days = academicCalendar[key] || [];
      days.forEach((val: any) => {
        if (val) {
          const s = String(val).trim();
          if (/^\d+$/.test(s)) {
            genapKbm++;
          } else if (s === 'KTS') {
            ktsCount++;
          } else if (s === 'MPLS') {
            mplsCount++;
          }
        }
      });
    });

    return { ganjilKbm, genapKbm, ktsCount, mplsCount };
  }, [academicCalendar, schoolProfile]);

  // --- Initial Fetch ---
  useEffect(() => {
    if(classId) fetchClassroomData();
  }, [classId]);

  // --- Sync Seats with Student Count for ALL layouts ---
  const resizeLayouts = (layouts: SeatingLayouts, studentCount: number): SeatingLayouts => {
    const resizeArray = (arr: (string | null)[]) => {
      if (arr.length === studentCount) return arr;
      const newArr = Array(studentCount).fill(null);
      // Copy old values, preserving student placements
      for (let i = 0; i < Math.min(arr.length, studentCount); i++) {
        newArr[i] = arr[i];
      }
      return newArr;
    };
    return {
      classical: resizeArray(layouts.classical || []),
      groups: resizeArray(layouts.groups || []),
      ushape: resizeArray(layouts.ushape || []),
    };
  };

  useEffect(() => {
    if (students.length > 0) {
      const anyLayoutMismatched =
        seatingLayouts.classical.length !== students.length ||
        seatingLayouts.groups.length !== students.length ||
        seatingLayouts.ushape.length !== students.length;

      if (anyLayoutMismatched) {
        setSeatingLayouts(prevLayouts => resizeLayouts(prevLayouts, students.length));
      }
    }
  }, [students, seatingLayouts]);


  const fetchClassroomData = async () => {
    if (!classId) return;
    setIsLoading(true);
    try {
        const [invData, guestData, configData, calendarData, scheduleData] = await Promise.all([
            apiService.getInventory(classId),
            apiService.getGuests(classId),
            apiService.getClassConfig(classId),
            apiService.getAcademicCalendar('global'),
            apiService.getSchedule(classId)
        ]);
        setInventory(invData);
        setGuests(guestData.sort((a,b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time)));
        
        // Use schedule from dedicated table if available, otherwise fallback to config
        if (scheduleData && scheduleData.length > 0) {
            setSchedule(scheduleData);
        } else if (configData.schedule) {
            setSchedule(configData.schedule);
        }

        if (configData.piket) setPiketGroups(configData.piket);
        if (configData.seats) setSeatingLayouts(configData.seats);
        if (calendarData && Object.keys(calendarData).length > 0) {
            setAcademicCalendar(calendarData);
        } else if (configData.academicCalendar) {
            setAcademicCalendar(configData.academicCalendar);
        }
        if (configData.timeSlots && configData.timeSlots.length > 0) setTimeSlots(configData.timeSlots);
        if (configData.organization) setOrganization(configData.organization); // NEW: Set organization data

    } catch (e) {
        console.error("Failed to load classroom data", e);
        onShowNotification("Gagal memuat data administrasi kelas. Coba Refresh.", 'error');
    } finally {
        setIsLoading(false);
    }
  };

  // --- Save Handlers ---
  const handleSaveInventory = async (item: InventoryItem) => {
    const isNew = !inventory.some(i => i.id === item.id);
    const originalInventory = [...inventory];
    const payload = item;
    
    // Optimistic Update
    if(isNew) setInventory(prev => [...prev, payload]);
    else setInventory(prev => prev.map(i => i.id === item.id ? payload : i));
    
    try {
      await apiService.saveInventory(payload);
      onShowNotification(`Inventaris "${item.name}" berhasil disimpan.`, 'success');
      // Refetch to get consistent IDs from backend if needed, or stick with optimistic
    } catch {
      onShowNotification('Gagal menyimpan inventaris.', 'error');
      setInventory(originalInventory); // revert
    }
  };

  const handleDeleteInventory = async (id: string) => {
    setIsLoading(true);
    try {
        const result = await apiService.deleteInventory(id, classId);
        if (result.status === 'success') {
            setInventory(prev => prev.filter(i => i.id !== id));
            onShowNotification('Data inventaris berhasil dihapus', 'success');
        } else {
            throw new Error(result.message || 'Gagal menghapus dari server.');
        }
    } catch (e: any) {
       onShowNotification(e.message || 'Gagal menghapus barang dari database.', 'error');
    } finally {
        setIsLoading(false);
    }
  };

  const handleSaveGuest = async (guest: Guest) => {
    const isNew = !guests.some(g => g.id === guest.id);
    const originalGuests = [...guests];
    const payload = guest;

    if(isNew) setGuests(prev => [payload, ...prev].sort((a,b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time)));
    else setGuests(prev => prev.map(g => g.id === guest.id ? payload : g));

    try {
      await apiService.saveGuest(payload);
      onShowNotification('Data tamu berhasil disimpan.', 'success');
    } catch {
       onShowNotification('Gagal menyimpan data tamu.', 'error');
       setGuests(originalGuests);
    }
  };

  const handleDeleteGuest = async (id: string) => {
    setIsLoading(true);
    try {
        const result = await apiService.deleteGuest(id, classId);
        if (result.status === 'success') {
            setGuests(prev => prev.filter(g => g.id !== id));
            onShowNotification('Data tamu berhasil dihapus', 'success');
        } else {
            throw new Error(result.message || 'Gagal menghapus data tamu dari server.');
        }
    } catch (e: any) {
      onShowNotification(e.message || 'Gagal menghapus data tamu dari database.', 'error');
    } finally {
        setIsLoading(false);
    }
  };

  const handleSaveScheduleAndTimes = async (newSchedule: ScheduleItem[], newTimeSlots: string[]) => {
    setSchedule(newSchedule);
    setTimeSlots(newTimeSlots);
    try {
        await Promise.all([
            apiService.saveSchedule(classId, newSchedule),
            apiService.saveClassConfig('timeSlots', newTimeSlots, classId)
        ]);
        onShowNotification('Jadwal pelajaran berhasil disimpan!', 'success');
    } catch (e) {
        console.error("Error saving schedule:", e);
        onShowNotification('Gagal menyimpan jadwal.', 'error');
    }
  };

  const handleSavePiket = async (newPiket: PiketGroup[]) => {
    setPiketGroups(newPiket);
    await apiService.saveClassConfig('piket', newPiket, classId);
  };

  const handleSaveSeating = async () => {
    try {
      await apiService.saveClassConfig('seats', seatingLayouts, classId);
      onShowNotification("Semua denah tempat duduk berhasil disimpan!", 'success');
    } catch {
      onShowNotification("Gagal menyimpan denah.", 'error');
    }
  };

  const handleSaveAcademicCalendar = async (newData: AcademicCalendarData) => {
    setAcademicCalendar(newData);
    try {
      await apiService.saveAcademicCalendar(newData, 'global');
      onShowNotification("Kalender Pendidikan berhasil disimpan!", 'success');
    } catch {
      onShowNotification("Gagal menyimpan Kalender Pendidikan.", 'error');
    }
  };

  const handleSaveOrganization = async (newOrganization: OrganizationStructure) => {
    setOrganization(newOrganization);
    try {
      await apiService.saveClassConfig('organization', newOrganization, classId);
      onShowNotification("Struktur organisasi berhasil disimpan!", 'success');
    } catch {
      onShowNotification("Gagal menyimpan struktur organisasi.", 'error');
    }
  };

  // --- NEW FILE OPERATIONS ---
  const handleExport = () => {
    let data: any[], fileName: string, sheetName: string;

    switch(activeTab) {
        case 'inventory':
            if (inventory.length === 0) return onShowNotification('Tidak ada data inventaris untuk diekspor.', 'warning');
            data = inventory.map(({ id, classId, ...rest }) => rest);
            fileName = `inventaris_kelas_${classId}.xlsx`;
            sheetName = "Inventaris";
            break;
        case 'guestbook':
            if (guests.length === 0) return onShowNotification('Tidak ada data buku tamu untuk diekspor.', 'warning');
            data = guests.map(({ id, classId, ...rest }) => ({
                Tanggal: rest.date,
                Waktu: rest.time,
                "Nama Tamu": rest.name,
                Instansi: rest.agency,
                Keperluan: rest.purpose
            }));
            fileName = `buku_tamu_kelas_${classId}.xlsx`;
            sheetName = "Buku Tamu";
            break;
        default:
            // FIX: The `onShowNotification` function only accepts 'success', 'error', or 'warning' as the type. Changed 'info' to 'warning'.
            onShowNotification('Ekspor tidak tersedia untuk tab ini.', 'warning');
            return;
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, fileName);
  };

  const handleDownloadTemplate = () => {
      let headers: string[], example: any[], fileName: string;

      switch(activeTab) {
          case 'inventory':
              headers = ["Nama Barang", "Jumlah", "Kondisi (Baik/Rusak)"];
              example = ["Papan Tulis", 1, "Baik"];
              fileName = "template_inventaris.xlsx";
              break;
          case 'guestbook':
              headers = ["Tanggal (YYYY-MM-DD)", "Waktu (HH:mm)", "Nama Tamu", "Instansi/Asal", "Keperluan"];
              example = ["2024-07-20", "10:30", "Orang Tua Siswa", "Wali Murid", "Konsultasi nilai"];
              fileName = "template_buku_tamu.xlsx";
              break;
          default:
              onShowNotification('Template tidak tersedia untuk tab ini.', 'warning');
              return;
      }

      const ws = XLSX.utils.aoa_to_sheet([headers, example]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Template");
      XLSX.writeFile(wb, fileName);
  };

  const handleImportClick = () => {
      if (['inventory', 'guestbook'].includes(activeTab)) {
          fileInputRef.current?.click();
      } else {
          onShowNotification('Import tidak tersedia untuk tab ini.', 'warning');
      }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
        setIsLoading(true);
        try {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const data = XLSX.utils.sheet_to_json(ws) as any[];

            if (activeTab === 'inventory') {
                for (const row of data) {
                    const newItem: InventoryItem = { id: `inv-${Date.now()}-${Math.random()}`, classId: classId, name: row['Nama Barang'] || '', qty: Number(row['Jumlah'] || 1), condition: (row['Kondisi'] === 'Rusak') ? 'Rusak' : 'Baik' };
                    if (newItem.name) await handleSaveInventory(newItem);
                }
            } else if (activeTab === 'guestbook') {
                for (const row of data) {
                     const newGuest: Guest = { id: `gst-${Date.now()}-${Math.random()}`, classId: classId, date: row['Tanggal (YYYY-MM-DD)'] || getLocalISODate(), time: row['Waktu (HH:mm)'] || new Date().toLocaleTimeString('id-ID'), name: row['Nama Tamu'] || '', agency: row['Instansi/Asal'] || '', purpose: row['Keperluan'] || '' };
                     if (newGuest.name) await handleSaveGuest(newGuest);
                }
            }
            onShowNotification(`Import data selesai.`, 'success');
            await fetchClassroomData();
        } catch (err) {
            onShowNotification("Gagal memproses file. Pastikan format sesuai template.", 'error');
        } finally {
            setIsLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };
    reader.readAsBinaryString(file);
  };

  // --- Utility Functions ---
  const handlePrint = () => {
    setIsPrintPreviewOpen(true);
  };

  const tabsList = [
    { id: 'schedule', label: 'Jadwal', icon: Calendar },
    { id: 'piket', label: 'Piket', icon: ClipboardList },
    { id: 'seating', label: 'Denah', icon: Map },
    { id: 'organization', label: 'Struktur', icon: Users },
    { id: 'calendar', label: 'Kalender', icon: CalendarDays },
    { id: 'inventory', label: 'Inventaris', icon: CheckCircle },
    { id: 'guestbook', label: 'Buku Tamu', icon: BookOpen },
  ];

  const activeTabItem = tabsList.find(t => t.id === activeTab) || tabsList[0];
  const ActiveTabIcon = activeTabItem.icon;

  if (isPrintPreviewOpen) {
    const docTitle = activeTabItem.label === 'Struktur' ? 'STRUKTUR ORGANISASI' : 
                     activeTabItem.label === 'Jadwal' ? 'JADWAL PELAJARAN' : 
                     activeTabItem.label === 'Piket' ? 'JADWAL PIKET' : 
                     activeTabItem.label === 'Denah' ? 'DENAH TEMPAT DUDUK' : 
                     activeTabItem.label === 'Kalender' ? 'KALENDER AKADEMIK' : 
                     activeTabItem.label === 'Inventaris' ? 'DAFTAR INVENTARIS' : 
                     activeTabItem.label === 'Buku Tamu' ? 'BUKU TAMU' : 
                     activeTabItem.label.toUpperCase();

    return (
      <div className="fixed inset-0 z-[200] bg-gradient-to-br from-indigo-50/90 via-white to-purple-50/90 overflow-y-auto p-4 md:p-6 flex flex-col space-y-4 text-left">
        <style>{`
          .sagara-a4-sheet {
            padding: 10mm 12mm !important;
            color: #000000 !important;
          }
          .sagara-a4-sheet .no-print,
          .sagara-a4-sheet button:not(.print-button),
          .sagara-a4-sheet .no-print-preview {
            display: none !important;
          }
          .sagara-a4-sheet select {
            border: none !important;
            background: transparent !important;
            appearance: none !important;
            -webkit-appearance: none !important;
            pointer-events: none !important;
          }
          .sagara-a4-sheet .print-only,
          .sagara-a4-sheet .print-only-inline,
          .sagara-a4-sheet .print\\:inline {
            display: inline !important;
          }
          .sagara-a4-sheet .print\\:block {
            display: block !important;
          }
          .sagara-a4-sheet .print\\:hidden {
            display: none !important;
          }
          .sagara-a4-sheet .print-container {
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: transparent !important;
          }
          .sagara-a4-sheet table {
            border-color: #000000 !important;
          }
          .sagara-a4-sheet th, .sagara-a4-sheet td {
            border-color: #000000 !important;
          }
          .sagara-a4-sheet input[type="text"] {
            border: none !important;
            padding: 0 !important;
            width: auto !important;
            pointer-events: none !important;
          }
          @media print {
            @page {
              size: A4 ${activeTab === 'schedule' || activeTab === 'calendar' || activeTab === 'seating' ? 'landscape' : 'portrait'};
              margin: 4mm 6mm !important;
            }
            html, body {
              height: 100% !important;
              max-height: 100vh !important;
              overflow: hidden !important;
            }
            .sagara-a4-sheet,
            #sagara-cloned-print-content,
            .sagara-print-content {
              padding: 0 !important;
              margin: 0 !important;
              box-shadow: none !important;
              border: none !important;
              width: 100% !important;
              max-height: 100% !important;
              box-sizing: border-box !important;
              page-break-after: avoid !important;
              page-break-before: avoid !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              break-after: avoid !important;
              overflow: hidden !important;
            }
            /* Table & cell compacting */
            .sagara-a4-sheet table, .sagara-print-content table {
              font-size: 9px !important;
            }
            .sagara-a4-sheet th, .sagara-a4-sheet td,
            .sagara-print-content th, .sagara-print-content td {
              padding: 2px 3px !important;
            }
            .sagara-a4-sheet td.h-20, .sagara-print-content td.h-20 {
              height: auto !important;
              padding: 2px !important;
            }
          }
        `}</style>

        <div className="flex items-center justify-between no-print max-w-7xl mx-auto w-full pt-2">
          <div className="flex items-center space-x-3">
            <Printer className="text-indigo-600" size={24} />
            <div>
              <h3 className="text-lg font-bold text-slate-800 leading-none">
                Pratinjau Cetak: {activeTabItem.label}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Laporan Administrasi Kelas Terstandarisasi • Format Kertas A4
              </p>
            </div>
          </div>
          <button 
            onClick={() => setIsPrintPreviewOpen(false)} 
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-lg shadow-md hover:shadow-indigo-100 transition-all flex items-center gap-1.5 text-xs"
          >
            Tutup Pratinjau
          </button>
        </div>
        
        <div className="max-w-7xl mx-auto w-full flex-1">
          <PrintPreview 
            title={`${docTitle} KELAS ${classId}`} 
            orientation={activeTab === 'schedule' || activeTab === 'calendar' || activeTab === 'seating' ? 'landscape' : 'portrait'}
          >
            {/* Kop Surat (Indonesian Official Header) */}
            <div className="flex items-center justify-between border-b-4 border-double border-black pb-2 mb-3 print:pb-1 print:mb-2 text-center text-black font-sans">
              <div className="w-12 h-12 print:w-10 print:h-10 shrink-0 flex items-center justify-center">
                {schoolProfile?.regencyLogo ? (
                  <img src={schoolProfile.regencyLogo} alt="Logo Daerah" className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-10 h-10 rounded-full border border-black flex items-center justify-center font-bold text-[10px] uppercase">LOGO</div>
                )}
              </div>
              
              <div className="flex-1 text-center px-2 font-sans">
                <h3 className="text-xs print:text-[11px] font-semibold uppercase tracking-wider leading-tight">PEMERINTAH KABUPATEN {schoolProfile?.kabupaten?.toUpperCase() || "TUBAN"}</h3>
                <h4 className="text-[11px] print:text-[10px] font-bold uppercase tracking-wider leading-tight mt-0.5">DINAS PENDIDIKAN</h4>
                <h2 className="text-xs print:text-[11px] font-black uppercase tracking-widest leading-normal mt-0.5">{schoolProfile?.name?.toUpperCase() || "UPTD SATUAN PENDIDIKAN SDN REMEN"}</h2>
                {(schoolProfile?.address || schoolProfile?.postalCode) ? (
                  <p className="text-[9px] print:text-[8px] font-medium leading-tight mt-0.5 font-sans text-gray-700">
                    {schoolProfile?.address ? `Alamat: ${schoolProfile.address}` : ''}
                    {schoolProfile?.address && schoolProfile?.postalCode ? ' • ' : ''}
                    {schoolProfile?.postalCode ? `Kode Pos: ${schoolProfile.postalCode}` : ''}
                  </p>
                ) : null}
                {schoolProfile?.email ? (
                  <p className="text-[9px] print:text-[8px] font-sans text-gray-500">
                    Email: {schoolProfile.email}
                  </p>
                ) : null}
              </div>
              
              <div className="w-12 h-12 print:w-10 print:h-10 shrink-0 flex items-center justify-center font-sans">
                {schoolProfile?.schoolLogo ? (
                  <img src={schoolProfile.schoolLogo} alt="Logo Sekolah" className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-10 h-10 invisible"></div>
                )}
              </div>
            </div>

            {/* Document Title Block */}
            <div className="text-center mb-3 print:mb-2 text-black font-sans">
              <h2 className="text-sm print:text-xs font-bold uppercase tracking-wider underline leading-none">
                {docTitle} KELAS {classId}
              </h2>
              <p className="text-[11px] print:text-[10px] font-semibold tracking-wide mt-1 uppercase">
                TAHUN AJARAN {schoolProfile?.year || "2025/2026"} - SEMESTER {schoolProfile?.semester || "1"}
              </p>
            </div>

            {/* Main Content Area */}
            <div className="w-full text-black">
              {activeTab === 'schedule' && <ScheduleTab schedule={schedule} timeSlots={timeSlots} onSave={async () => {}} onShowNotification={() => {}} />}
              {activeTab === 'piket' && <PiketTab piketGroups={piketGroups} students={students} onSave={async () => {}} onShowNotification={() => {}} />}
              {activeTab === 'seating' && <SeatingTab seatingLayouts={seatingLayouts} setSeatingLayouts={setSeatingLayouts} students={students} onSave={async () => {}} teacherProfile={teacherProfile} users={users} classId={classId} />}
              {activeTab === 'organization' && (
                  <OrganizationChartTab 
                      students={students} 
                      teacherProfile={teacherProfile} 
                      users={users} 
                      classId={classId}
                      initialStructure={organization} 
                      onSave={async () => {}} 
                  />
              )}
              {activeTab === 'calendar' && (
                  <AcademicCalendarTab 
                      initialData={academicCalendar} 
                      onSave={async () => {}} 
                      onAddHoliday={async () => {}} 
                      onShowNotification={() => {}} 
                      classId={classId}
                      isReadOnly={true}
                      schoolYear={schoolProfile?.year}
                      schoolProfile={schoolProfile}
                      teacherProfile={teacherProfile}
                  />
              )}
              {activeTab === 'inventory' && <InventoryTab inventory={inventory} onSave={async () => {}} onDelete={() => {}} onShowNotification={() => {}} classId={classId} />}
              {activeTab === 'guestbook' && <GuestBookTab guests={guests} onSave={async () => {}} onDelete={() => {}} onShowNotification={() => {}} classId={classId} />}
            </div>

            {/* Official Signatures Section (For non-calendar tabs) */}
            {activeTab !== 'calendar' && (
              <div className="mt-4 print:mt-2 flex justify-between text-xs print:text-[10px] text-black font-sans page-break-inside-avoid">
                <div className="text-center w-[40%]">
                  <p className="leading-tight">Mengetahui,</p>
                  <p className="font-semibold leading-tight">Kepala {schoolProfile?.name || "Sekolah"}</p>
                  <div className="h-12 print:h-10"></div>
                  <p className="font-bold underline leading-none">{schoolProfile?.headmaster || "[Nama Kepala Sekolah]"}</p>
                  <p className="mt-1 leading-none text-[10px] print:text-[8px]">NIP. {schoolProfile?.headmasterNip || "[NIP Kepala Sekolah]"}</p>
                </div>
                <div className="text-center w-[40%]">
                  <p className="leading-tight">
                    {schoolProfile?.desa ? `${schoolProfile.desa}, ` : ""}{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                  <p className="font-semibold leading-tight">Guru Kelas {classId}</p>
                  <div className="h-12 print:h-10"></div>
                  <p className="font-bold underline leading-none">{teacherProfile?.name || "[Nama Guru]"}</p>
                  <p className="mt-1 leading-none text-[10px] print:text-[8px]">NIP. {teacherProfile?.nip || "[NIP Guru]"}</p>
                </div>
              </div>
            )}
          </PrintPreview>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in page-landscape">
      
      {/* Header & Tabs */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 no-print">
        <div>
           <h2 className="text-2xl font-bold text-gray-800 flex items-center">
               Administrasi Kelas Digital
               {isLoading && <Loader2 className="animate-spin ml-2 text-indigo-500" size={18} />}
           </h2>
           <p className="text-gray-500">Buku administrasi dengan sistem digital terintegrasi</p>
        </div>
        <div className="flex flex-col md:flex-row md:items-center gap-3 w-full xl:w-auto">
           {/* Desktop Tabs */}
           <div className="hidden md:flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm mr-2">
              {tabsList.map((tab) => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <tab.icon size={16} />
                  <span>{tab.label}</span>
                </button>
              ))}
           </div>

           {/* Mobile Dropdown */}
           <div className="md:hidden w-full relative z-[40]">
             <button 
               type="button"
               onClick={() => setIsDropdownOpen(!isDropdownOpen)}
               className="flex items-center justify-between w-full bg-white border border-[#CAF4FF] rounded-xl px-4 py-3 shadow-sm hover:bg-slate-50 transition-colors focus:outline-none"
             >
               <div className="flex items-center space-x-3">
                 <ActiveTabIcon className="text-indigo-600 shrink-0" size={20} />
                 <span className="text-base font-semibold text-gray-700">{activeTabItem.label}</span>
               </div>
               <ChevronDown className={`text-indigo-600 shrink-0 transition-transform duration-200 ${isDropdownOpen ? 'transform rotate-180' : ''}`} size={20} />
             </button>
             
             {isDropdownOpen && (
               <>
                 <div 
                   className="fixed inset-0 z-10" 
                   onClick={() => setIsDropdownOpen(false)}
                 />
                 <div className="absolute left-0 right-0 mt-2 bg-white border border-[#CAF4FF] rounded-xl shadow-xl z-20 overflow-hidden divide-y divide-gray-100 max-h-80 overflow-y-auto">
                   {tabsList.map((tab) => {
                     const TabIcon = tab.icon;
                     const isSelected = activeTab === tab.id;
                     return (
                       <button
                         key={tab.id}
                         type="button"
                         onClick={() => {
                           setActiveTab(tab.id as any);
                           setIsDropdownOpen(false);
                         }}
                         className={`flex items-center justify-between w-full px-4 py-4 text-left text-base font-semibold transition-colors ${
                           isSelected 
                           ? 'bg-indigo-50/70 text-indigo-700' 
                           : 'text-gray-700 hover:bg-gray-50'
                         }`}
                       >
                         <div className="flex items-center space-x-3.5">
                           <TabIcon className={isSelected ? 'text-indigo-600' : 'text-gray-500'} size={20} />
                           <span>{tab.label}</span>
                         </div>
                         
                         {/* Radio Button Indicator */}
                         <div className="shrink-0 ml-3">
                           {isSelected ? (
                             <div className="w-5.5 h-5.5 rounded-full border-2 border-indigo-600 flex items-center justify-center bg-indigo-50">
                               <div className="w-2.5 h-2.5 rounded-full bg-indigo-600"></div>
                             </div>
                           ) : (
                             <div className="w-5.5 h-5.5 rounded-full border-2 border-gray-300"></div>
                           )}
                         </div>
                       </button>
                     );
                   })}
                 </div>
               </>
             )}
           </div>
           
           {/* Action Buttons */}
           <div className="flex space-x-2 justify-end w-full md:w-auto">
             <button onClick={fetchClassroomData} title="Refresh Data" className="p-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 hover:text-indigo-600 shadow-sm">
                <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
             </button>
             <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".xlsx, .xls, .csv" />
             <button onClick={handleDownloadTemplate} title="Download Template" className="p-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 shadow-sm"><FileSpreadsheet size={18} /></button>
             <button onClick={handleImportClick} title="Import" className="p-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 shadow-sm"><Upload size={18} /></button>
             <button onClick={handleExport} title="Export Excel" className="p-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 shadow-sm"><Download size={18} /></button>
             <button onClick={handlePrint} title="Cetak" className="p-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 shadow-sm"><Printer size={18} /></button>
           </div>
        </div>
      </div>

      {/* --- CONTENT RENDERER --- */}
      <div id="print-area" className="w-full">
        {activeTab === 'schedule' && <ScheduleTab schedule={schedule} timeSlots={timeSlots} onSave={handleSaveScheduleAndTimes} onShowNotification={onShowNotification} />}
        {activeTab === 'piket' && <PiketTab piketGroups={piketGroups} students={students} onSave={handleSavePiket} onShowNotification={onShowNotification} />}
        {activeTab === 'seating' && <SeatingTab seatingLayouts={seatingLayouts} setSeatingLayouts={setSeatingLayouts} students={students} onSave={handleSaveSeating} teacherProfile={teacherProfile} users={users} classId={classId} />}
        {activeTab === 'organization' && (
            <OrganizationChartTab 
                students={students} 
                teacherProfile={teacherProfile} 
                users={users} 
                classId={classId}
                initialStructure={organization} 
                onSave={handleSaveOrganization} 
            />
        )}
        {activeTab === 'calendar' && (
            <AcademicCalendarTab 
                initialData={academicCalendar} 
                onSave={handleSaveAcademicCalendar} 
                onAddHoliday={onAddHoliday} 
                onShowNotification={onShowNotification} 
                classId={classId}
                isReadOnly={userRole !== 'admin'} // ONLY ADMIN CAN EDIT CALENDAR
                schoolYear={schoolProfile?.year}
                schoolProfile={schoolProfile}
                teacherProfile={teacherProfile}
            />
        )}
        {activeTab === 'inventory' && <InventoryTab inventory={inventory} onSave={handleSaveInventory} onDelete={handleDeleteInventory} onShowNotification={onShowNotification} classId={classId} />}
        {activeTab === 'guestbook' && <GuestBookTab guests={guests} onSave={handleSaveGuest} onDelete={handleDeleteGuest} onShowNotification={onShowNotification} classId={classId} />}
      </div>

    </div>
  );
};

export default ClassroomAdmin;
