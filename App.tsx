// ... (imports remain the same)
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';

const GlobalFooter: React.FC = () => {
  return (
    <footer className="mt-12 py-8 border-t border-[#CAF4FF] text-center no-print w-full">
      <div className="flex flex-col items-center space-y-4">
        <div className="flex items-center space-x-2">
          <img 
            src="https://www.image2url.com/r2/default/images/1776528081180-f5356afe-2059-4426-8309-4f5af1b9227e.png" 
            alt="Logo SAGARA" 
            className="h-6 w-6 object-contain"
          />
          <span className="text-sm font-bold text-slate-400 tracking-wider">SAGARA</span>
        </div>
        <div className="flex flex-col space-y-2">
            <p className="text-xs text-slate-400 font-medium">
              &copy; 2025-2026 SAGARA | Dev. MeyGa
            </p>
        </div>
      </div>
    </footer>
  );
};
import DashboardContainer from './components/DashboardContainer';
import StudentList from './components/StudentList';
import ClassroomAdmin from './components/ClassroomAdmin';
import TeacherProfile from './components/TeacherProfile';
import AttendanceView from './components/AttendanceView';
import GradesView from './components/GradesView';
import GtkDataView from './components/GtkDataView';
import CounselingView from './components/CounselingView';
import ActivitiesView from './components/ActivitiesView';
import IntroductionView from './components/IntroductionView';
import AttitudeView from './components/AttitudeView';
import Login from './components/Login';
import Notification from './components/Notification';
import AccountManagement from './components/AccountManagement';
import EmploymentLinksAdmin from './components/EmploymentLinksAdmin';
import LearningReportsView from './components/LearningReportsView'; 
import LearningJournalView from './components/LearningJournalView'; 
import { KokurikulerPlanView } from './components/KokurikulerPlanView';
import { LearningPlanView } from './components/LearningPlanView';
import LearningDocumentationView from './components/LearningDocumentationView';
import StudentMonitor from './components/StudentMonitor'; 
import LiaisonBookView from './components/LiaisonBookView'; 
import BackupRestore from './components/BackupRestore';
import SupportDocumentsView from './components/SupportDocumentsView';
import SupervisorOverview from './components/SupervisorOverview'; 
import SchoolAssetsAdmin from './components/SchoolAssetsAdmin'; 
import BOSManagement from './components/BOSManagement';
import ServiceInfo from './components/ServiceInfo';
import BookLoanView from './components/BookLoanView';
import GraduatesView from './components/GraduatesView';
import AgendaView from './components/AgendaView';
import MaterialsView from './components/MaterialsView';
import SumatifView from './components/SumatifView';
import PerformanceAssessmentView from './components/PerformanceAssessmentView';
import ManualBookView from './components/ManualBookView';
import EmergencyAlert from './components/EmergencyAlert';
import MitigasiBencanaView from './components/MitigasiBencanaView';
import CustomModal from './components/CustomModal'; 
import PaperPlaneIcon from './components/PaperPlaneIcon';
import OnlineUsersWidget from './components/OnlineUsersWidget';
import { DeveloperInfoView } from './components/DeveloperInfoView';
import { TextToSpeechAccessibility } from './components/TextToSpeechAccessibility';
import { MasterDatabaseManagement } from './components/MasterDatabaseManagement';
import { masterSupabase, setTemporarySupabase } from './services/supabaseClient';
import { ViewState, Student, AgendaItem, Material, Extracurricular, BehaviorLog, GradeRecord, TeacherProfileData, SchoolProfileData, User, Holiday, SikapAssessment, KarakterAssessment, EmploymentLink, LearningReport, LiaisonLog, PermissionRequest, LearningJournalEntry, SupportDocument, InventoryItem, SchoolAsset, BOSTransaction, LearningDocumentation, BookLoan, BookInventory, Sumatif, GtkRecord, PerformanceAssessment } from './types';
import { MOCK_SUBJECTS, MOCK_STUDENTS, MOCK_EXTRACURRICULARS } from './constants';
import { apiService } from './services/apiService';
import { cacheService } from './src/services/cacheService';
import { Menu, Loader2, RefreshCw, AlertCircle, CheckCircle, WifiOff, ChevronDown, UserCog, LogOut, Filter, Bell, X, XCircle, Send, Info, LayoutDashboard, CalendarCheck, ClipboardList, FileText, Database, Lock, Eye, EyeOff } from 'lucide-react';

const App: React.FC = () => {
  useEffect(() => {
    // Auto refresh the browser every 30 minutes (30 * 60 * 1000 ms)
    const refreshInterval = setInterval(() => {
      window.location.reload();
    }, 30 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, []);

  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
};

const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // -- STATE PERSISTENCE INIT --
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
      try {
          const saved = localStorage.getItem('sagara_user');
          return saved ? JSON.parse(saved) : null;
      } catch (e) { return null; }
  });

  // currentView is now derived from location.pathname
  const currentView = useMemo<ViewState>(() => {
    const path = location.pathname.slice(1);
    if (!path || path === '') return 'dashboard';
    if (path === 'dashboard') return 'dashboard';
    
    // Support student-specific paths in currentView if needed for title
    if (path === 'dashboard-student' || path === 'ringkasan') return 'dashboard';
    
    return path as ViewState;
  }, [location.pathname]);

  // Effect to update document title based on current view
  useEffect(() => {
    const viewTitles: Record<string, string> = {
      'dashboard': 'Dashboard',
      'ringkasan': 'Ringkasan',
      'dashboard-student': 'Dashboard Siswa',
      'jadwal-pelajaran': 'Jadwal Pelajaran',
      'izin-absensi': 'Izin & Absensi',
      'materi-belajar': 'Materi Pelajar',
      'sumatif-siswa': 'Nilai Sumatif',
      'buku-penghubung-siswa': 'Buku Penghubung',
      'profil-siswa': 'Profil Siswa',
      'karakter-siswa': 'Karakter Siswa',
      'siswa': 'Data Siswa',
      'data-lulusan': 'Data Lulusan',
      'absensi': 'Absensi',
      'agenda': 'Agenda Kelas',
      'materi': 'Materi Pembelajaran',
      'nilai': 'Nilai & Rapor',
      'administrasi/kelas': 'Administrasi Kelas',
      'konseling': 'Konseling & Pelanggaran',
      'kegiatan': 'Ekstrakurikuler',
      'profil': 'Profil Guru',
      'pendahuluan': 'Pendahuluan',
      'sikap': 'Penilaian Sikap',
      'manajemen-akun': 'Manajemen Akun',
      'tautan-kepegawaian': 'Aplikasi Terintegrasi',
      'laporan-pembelajaran': 'Laporan Pembelajaran',
      'jurnal-pembelajaran': 'Jurnal Pembelajaran',
      'rencana-pembelajaran': 'Rencana Pembelajaran',
      'dokumentasi-pembelajaran': 'Dokumentasi Pembelajaran',
      'monitor-siswa': 'Monitor Siswa',
      'buku-penghubung': 'Buku Penghubung',
      'cadangan-pemulihan': 'Backup & Restore',
      'administrasi/bukti-dukung': 'Dokumen Pendukung',
      'supervisi': 'Supervisi',
      'administrasi/sarana-prasarana': 'Sarana Prasarana',
      'administrasi/dana-bos': 'Manajemen BOS',
      'administrasi/peminjaman-buku': 'Peminjaman Buku',
      'penilaian-kinerja': 'Penilaian Kinerja Guru',
      'sumatif': 'PENILAIAN SUMATIF',
      'sumatif/manage': 'Kelola Sumatif',
      'manual-book': 'Buku Panduan',
    };

    const title = viewTitles[currentView] || 'Sistem Akademik';
    document.title = `${title} | Sistem Akademik & Administrasi Terintegrasi`;
  }, [currentView]);

  useEffect(() => {
    const handleCloseSidebar = () => setIsSidebarOpen(false);
    window.addEventListener('closeSidebar', handleCloseSidebar);
    return () => window.removeEventListener('closeSidebar', handleCloseSidebar);
  }, []);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  
  // --- CHANGE PASSWORD STATE ---
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePasswordError('');

    if (!currentUser) {
      setChangePasswordError('Anda harus login terlebih dahulu.');
      return;
    }

    if (!oldPassword) {
      setChangePasswordError('Password lama wajib diisi.');
      return;
    }

    // Verify current password (plain text password in database and in currentUser object)
    if (oldPassword !== currentUser.password) {
      setChangePasswordError('Password lama salah.');
      return;
    }

    if (!newPassword) {
      setChangePasswordError('Password baru wajib diisi.');
      return;
    }

    if (newPassword.length < 4) {
      setChangePasswordError('Password baru minimal 4 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setChangePasswordError('Konfirmasi password baru tidak cocok.');
      return;
    }

    setChangePasswordLoading(true);
    try {
      await apiService.updatePassword(currentUser.id, newPassword, currentUser.username);
      
      // Update local storage and current user state
      const updatedUser = { ...currentUser, password: newPassword };
      setCurrentUser(updatedUser);
      localStorage.setItem('sagara_user', JSON.stringify(updatedUser));
      
      handleShowNotification('Password berhasil diperbarui!', 'success');
      
      // Reset form states
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsChangePasswordOpen(false);
    } catch (err: any) {
      setChangePasswordError(err.message || 'Gagal memperbarui password.');
    } finally {
      setChangePasswordLoading(false);
    }
  };

  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const lastFetchTimeRef = useRef<number>(Date.now());
  
  // -- ADMIN CLASS FILTER STATE --
  const [selectedClassId, setSelectedClassId] = useState<string>(() => {
      return localStorage.getItem('sagara_classId') || '';
  });

  // State Global
  const [users, setUsers] = useState<User[]>(() => cacheService.get<User[]>('users') || []);
  const [students, setStudents] = useState<Student[]>(() => cacheService.get<Student[]>('students') || []);
  const [agendas, setAgendas] = useState<AgendaItem[]>(() => cacheService.get<AgendaItem[]>('agendas') || []);
  const [materials, setMaterials] = useState<Material[]>(() => cacheService.get<Material[]>('materials') || []);
  const [extracurriculars, setExtracurriculars] = useState<Extracurricular[]>(() => cacheService.get<Extracurricular[]>('extracurriculars') || []);
  const [counselingLogs, setCounselingLogs] = useState<BehaviorLog[]>(() => cacheService.get<BehaviorLog[]>('counselingLogs') || []);
  const [grades, setGrades] = useState<GradeRecord[]>(() => cacheService.get<GradeRecord[]>('grades') || []);
  const [holidays, setHolidays] = useState<Holiday[]>(() => cacheService.get<Holiday[]>('holidays') || []);
  const [allAttendanceRecords, setAllAttendanceRecords] = useState<any[]>(() => cacheService.get<any[]>('allAttendanceRecords') || []);
  const [sikapAssessments, setSikapAssessments] = useState<SikapAssessment[]>(() => cacheService.get<SikapAssessment[]>('sikapAssessments') || []);
  const [karakterAssessments, setKarakterAssessments] = useState<KarakterAssessment[]>(() => cacheService.get<KarakterAssessment[]>('karakterAssessments') || []);
  const [employmentLinks, setEmploymentLinks] = useState<EmploymentLink[]>(() => cacheService.get<EmploymentLink[]>('employmentLinks') || []);
  const [learningReports, setLearningReports] = useState<LearningReport[]>(() => cacheService.get<LearningReport[]>('learningReports') || []);
  const [learningDocumentation, setLearningDocumentation] = useState<LearningDocumentation[]>(() => cacheService.get<LearningDocumentation[]>('learningDocumentation') || []);
  const [liaisonLogs, setLiaisonLogs] = useState<LiaisonLog[]>(() => cacheService.get<LiaisonLog[]>('liaisonLogs') || []);
  const [permissionRequests, setPermissionRequests] = useState<PermissionRequest[]>(() => cacheService.get<PermissionRequest[]>('permissionRequests') || []);
  const [supportDocuments, setSupportDocuments] = useState<SupportDocument[]>(() => cacheService.get<SupportDocument[]>('supportDocuments') || []);
  const [inventory, setInventory] = useState<InventoryItem[]>(() => cacheService.get<InventoryItem[]>('inventory') || []);
  const [schoolAssets, setSchoolAssets] = useState<SchoolAsset[]>(() => cacheService.get<SchoolAsset[]>('schoolAssets') || []);
  const [bosTransactions, setBosTransactions] = useState<BOSTransaction[]>(() => cacheService.get<BOSTransaction[]>('bosTransactions') || []);
  const [bookLoans, setBookLoans] = useState<BookLoan[]>(() => cacheService.get<BookLoan[]>('bookLoans') || []);
  const [performanceAssessments, setPerformanceAssessments] = useState<PerformanceAssessment[]>(() => cacheService.get<PerformanceAssessment[]>('performanceAssessments') || []);
  const [sumatifs, setSumatifs] = useState<Sumatif[]>(() => cacheService.get<Sumatif[]>('sumatifs') || []);
  const [kktpMap, setKktpMap] = useState<Record<string, number>>({});
  const [gtkData, setGtkData] = useState<GtkRecord[]>(() => cacheService.get<GtkRecord[]>('gtkData') || []);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error' | 'warning'} | null>(null);
  
  // ... (Rest of existing state code)
  
  // -- NEW STATE: Navigation Target for Journal --
  const [journalTargetDate, setJournalTargetDate] = useState<string | null>(null);

  // -- SUPERADMIN DATABASE SWITCHER STATES --
  const [schoolsList, setSchoolsList] = useState<any[]>([]);
  const [selectedSchoolDbId, setSelectedSchoolDbId] = useState<string>('');
  const [fetchingSchools, setFetchingSchools] = useState(false);

  useEffect(() => {
    const loadSchools = async () => {
      if (currentUser?.role === 'superadmin' && masterSupabase) {
        try {
          setFetchingSchools(true);
          const { data, error: err } = await masterSupabase
            .from('school_databases')
            .select('*')
            .order('school_name', { ascending: true });
          if (!err && data) {
            setSchoolsList(data);
          }
        } catch (e) {
          console.error("Gagal memuat daftar database sekolah:", e);
        } finally {
          setFetchingSchools(false);
        }
      }
    };
    loadSchools();
  }, [currentUser]);

  const handleSwitchSchoolDb = async (schoolId: string) => {
    setSelectedSchoolDbId(schoolId);
    
    if (!schoolId) {
      setTemporarySupabase();
      handleShowNotification("Koneksi dikembalikan ke database pusat/utama.", "success");
    } else {
      const school = schoolsList.find(s => s.id === schoolId);
      if (school) {
        setTemporarySupabase(school.supabase_url, school.supabase_anon_key);
        handleShowNotification(`Koneksi database beralih ke: ${school.school_name || 'Dinas Pendidikan'}. Silakan login kembali untuk mengakses data sekolah tersebut.`, "success");
      }
    }
    
    handleLogout();
  };

  // -- CUSTOM MODAL STATE --
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    type: 'alert' | 'confirm' | 'success' | 'error';
    title?: string;
    message: string;
    onConfirm: () => void;
    onCancel?: () => void;
  }>({
    isOpen: false,
    type: 'alert',
    message: '',
    onConfirm: () => {},
  });

  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [processingPermissionId, setProcessingPermissionId] = useState<string | null>(null);
  const [adminPercentage, setAdminPercentage] = useState<number>(0);
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfileData>(() => {
    try {
      const cached = localStorage.getItem('teacher_profile_cache');
      if (cached) return JSON.parse(cached);
    } catch (e) {
      console.error("Gagal load cache teacherProfile", e);
    }
    return {
      name: 'Guru', nip: '', nuptk: '', birthPlace: '', birthDate: '', education: '', position: '', rank: '', teachingClass: '', phone: '', email: '', address: ''
    };
  });
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfileData>(() => {
    try {
      const cached = localStorage.getItem('school_profile_cache');
      if (cached) return JSON.parse(cached);
    } catch (e) {
      console.error("Gagal load cache schoolProfile", e);
    }
    return {
      name: 'Sekolah', npsn: '', address: '', headmaster: '', headmasterNip: '', headmasterSignature: '', year: '2024/2025', semester: '1',
      developerInfo: { name: '', moto: '', photo: '', email: '' }
    };
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // -- DYNAMIC BRANDING EFFECT --
  useEffect(() => {
    const primary = schoolProfile?.primaryColor;
    let styleEl = document.getElementById('dynamic-school-branding');
    
    if (!primary) {
      if (styleEl) {
        styleEl.remove();
      }
      return;
    }
    
    try {
      const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      if (!hexRegex.test(primary)) {
        return;
      }
      
      const hexToRgb = (hexStr: string) => {
        let cleanHex = hexStr.replace(/^#/, '');
        if (cleanHex.length === 3) {
          cleanHex = cleanHex.split('').map(char => char + char).join('');
        }
        const num = parseInt(cleanHex, 16);
        return {
          r: (num >> 16) & 255,
          g: (num >> 8) & 255,
          b: num & 255
        };
      };

      const { r, g, b } = hexToRgb(primary);
      
      const oceanBlue = primary;
      const skyBlue = `rgba(${r}, ${g}, ${b}, 0.55)`;
      const babyBlue = `rgba(${r}, ${g}, ${b}, 0.15)`;
      const cream = `rgba(${r}, ${g}, ${b}, 0.05)`;
      
      const cssContent = `
        :root {
          --color-ocean-blue: ${oceanBlue} !important;
          --color-sky-blue: ${skyBlue} !important;
          --color-baby-blue: ${babyBlue} !important;
          --color-cream: ${cream} !important;
        }

        /* Override Tailwind Hardcoded Colors */
        .text-\\[\\#5AB2FF\\] {
          color: ${oceanBlue} !important;
        }
        .hover\\:text-\\[\\#5AB2FF\\]:hover {
          color: ${oceanBlue} !important;
        }
        .group-hover\\:text-\\[\\#5AB2FF\\]:hover {
          color: ${oceanBlue} !important;
        }
        .group:hover .group-hover\\:text-\\[\\#5AB2FF\\] {
          color: ${oceanBlue} !important;
        }

        .bg-\\[\\#5AB2FF\\] {
          background-color: ${oceanBlue} !important;
        }
        .hover\\:bg-\\[\\#5AB2FF\\]:hover {
          background-color: ${oceanBlue} !important;
        }
        .bg-\\[\\#CAF4FF\\] {
          background-color: ${babyBlue} !important;
        }
        .hover\\:bg-\\[\\#CAF4FF\\]:hover {
          background-color: ${babyBlue} !important;
        }
        .bg-\\[\\#A0DEFF\\] {
          background-color: ${skyBlue} !important;
        }
        
        .from-\\[\\#5AB2FF\\] {
          --tw-gradient-from: ${oceanBlue} !important;
          --tw-gradient-to: ${skyBlue} !important;
          --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important;
        }
        .to-\\[\\#A0DEFF\\] {
          --tw-gradient-to: ${skyBlue} !important;
        }
        .to-\\[\\#CAF4FF\\] {
          --tw-gradient-to: ${babyBlue} !important;
        }

        .border-\\[\\#CAF4FF\\] {
          border-color: ${babyBlue} !important;
        }
        .border-\\[\\#5AB2FF\\] {
          border-color: ${oceanBlue} !important;
        }
        .border-\\[\\#A0DEFF\\] {
          border-color: ${skyBlue} !important;
        }
        .focus\\:border-\\[\\#5AB2FF\\]:focus {
          border-color: ${oceanBlue} !important;
        }

        .shadow-\\[\\#5AB2FF\\]\\/30 {
          --tw-shadow-color: rgba(${r}, ${g}, ${b}, 0.3) !important;
          --tw-shadow: 0 10px 15px -3px var(--tw-shadow-color), 0 4px 6px -4px var(--tw-shadow-color) !important;
        }
        .focus\\:ring-\\[\\#5AB2FF\\]\\/10:focus {
          --tw-ring-color: rgba(${r}, ${g}, ${b}, 0.1) !important;
        }

        .text-transparent.bg-clip-text.bg-gradient-to-r {
          background-image: linear-gradient(to right, ${oceanBlue}, ${skyBlue}) !important;
        }
      `;
      
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'dynamic-school-branding';
        document.head.appendChild(styleEl);
      }
      styleEl.innerHTML = cssContent;
    } catch (e) {
      console.error('Failed to parse branding color', e);
    }
  }, [schoolProfile?.primaryColor]);

  // ... (Rest of Modal Helper Functions and Persistence Effects) ...
  const showAlert = (message: string, type: 'success' | 'error' | 'alert' = 'alert', title?: string) => {
    setModalConfig({
      isOpen: true,
      type,
      title,
      message,
      onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
    });
  };

  const showConfirm = (message: string, onConfirmAction: () => void, onCancelAction?: () => void, title: string = 'Konfirmasi') => {
    setModalConfig({
      isOpen: true,
      type: 'confirm',
      title,
      message,
      onConfirm: () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        onConfirmAction();
      },
      onCancel: onCancelAction ? () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        onCancelAction();
      } : undefined
    });
  };

  // ... (PERSISTENCE EFFECTS Code) ...
  useEffect(() => {
      if (currentUser) {
          localStorage.setItem('sagara_user', JSON.stringify(currentUser));
      } else {
          localStorage.removeItem('sagara_user');
      }
  }, [currentUser]);


  const canSelectClass = useMemo(() => {
    if (!currentUser) return false;
    const pos = (currentUser.position || '').toLowerCase();
    return currentUser.role === 'admin' || 
           currentUser.role === 'Kepala Sekolah' || 
           (currentUser.role === 'guru' && String(currentUser.classId).toUpperCase() === 'ALL') ||
           (currentUser.role === 'guru' && (pos.includes('pai') || pos.includes('agama') || pos.includes('pjok') || pos.includes('olahraga') || pos.includes('inggris')));
  }, [currentUser]);

  useEffect(() => {
      if (canSelectClass && selectedClassId) {
          localStorage.setItem('sagara_classId', selectedClassId);
      }
  }, [selectedClassId, canSelectClass]);

  useEffect(() => {
      if (currentUser?.role === 'Kepala Sekolah' && currentView === 'dashboard') {
          navigate('/supervisi');
      }
  }, [currentUser, currentView, navigate]);

  const clearAllStatesAndCache = () => {
      // 1. Reset all state in memory
      setUsers([]);
      setStudents([]);
      setAgendas([]);
      setMaterials([]);
      setExtracurriculars([]);
      setCounselingLogs([]);
      setGrades([]);
      setHolidays([]);
      setAllAttendanceRecords([]);
      setSikapAssessments([]);
      setKarakterAssessments([]);
      setEmploymentLinks([]);
      setLearningReports([]);
      setLearningDocumentation([]);
      setLiaisonLogs([]);
      setPermissionRequests([]);
      setSupportDocuments([]);
      setInventory([]);
      setSchoolAssets([]);
      setBosTransactions([]);
      setBookLoans([]);
      setSumatifs([]);
      setKktpMap({});
      setGtkData([]);
      setPerformanceAssessments([]);
      setTeacherProfile({
        name: 'Guru', nip: '', nuptk: '', birthPlace: '', birthDate: '', education: '', position: '', rank: '', teachingClass: '', phone: '', email: '', address: ''
      });
      setSchoolProfile({
        name: 'Sekolah', npsn: '', address: '', headmaster: '', headmasterNip: '', headmasterSignature: '', year: '2024/2025', semester: '1',
        developerInfo: { name: '', moto: '', photo: '', email: '' }
      });
      setSelectedClassId('');

      // 2. Clear localStorage
      localStorage.removeItem('sagara_user');
      localStorage.removeItem('sagara_classId');
      localStorage.removeItem('sagara_student_tab');
      
      const cacheKeys = [
        'users',
        'students',
        'agendas',
        'materials',
        'extracurriculars',
        'counselingLogs',
        'grades',
        'holidays',
        'allAttendanceRecords',
        'sikapAssessments',
        'karakterAssessments',
        'employmentLinks',
        'learningReports',
        'learningDocumentation',
        'liaisonLogs',
        'permissionRequests',
        'supportDocuments',
        'inventory',
        'schoolAssets',
        'bosTransactions',
        'bookLoans',
        'sumatifs',
        'gtkData',
        'performanceAssessments'
      ];
      
      cacheKeys.forEach(key => {
        localStorage.removeItem(key);
      });

      // Clear all sumatif and profile-related data on logout
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sumatif_') || key.startsWith('teacher_profile_') || key.startsWith('school_profile_')) {
          localStorage.removeItem(key);
        }
      });
  };

  const handleLoginSuccess = (user: User) => {
      clearAllStatesAndCache();
      setLoading(true);
      setCurrentUser(user);
  };

  const handleLogout = () => {
      clearAllStatesAndCache();
      setCurrentUser(null);
      setLoading(false);
      navigate('/login');
  };
  
  const handleShowNotification = (message: string, type: 'success' | 'error' | 'warning') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Auto-refresh effect (optimized: polling reduced to 15 minutes, only active tab)
  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(() => {
        if (document.visibilityState === 'visible') {
            fetchData(false, true);
        }
    }, 15 * 60 * 1000); // 15 minutes interval to heavily save Supabase Disk IO budget
    return () => clearInterval(interval);
  }, [currentUser]);

  // Window Focus Refresh effect (optimized: refetch only if data is older than 10 minutes when switching tab)
  useEffect(() => {
    if (!currentUser) return;
    const handleFocus = () => {
      const tenMinutes = 10 * 60 * 1000;
      if (Date.now() - lastFetchTimeRef.current >= tenMinutes) {
        fetchData(false, true);
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [currentUser]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  const availableClasses = useMemo(() => {
    const studentClasses = students.map(s => String(s.classId || '').trim().toUpperCase()).filter(Boolean);
    const userClasses = users.map(u => String(u.classId || '').trim().toUpperCase()).filter(Boolean);
    const combinedSet = new Set([...studentClasses, ...userClasses]);
    combinedSet.delete('ALL');
    combinedSet.delete('');
    combinedSet.delete('-');
    return Array.from(combinedSet).sort((a, b) => {
        const strA = String(a || '');
        const strB = String(b || '');
        const numA = parseInt(strA.replace(/\D/g, '')) || 0;
        const numB = parseInt(strB.replace(/\D/g, '')) || 0;
        if (numA !== numB) return numA - numB;
        return strA.localeCompare(strB);
    });
  }, [students, users]);
  
  const activeClassId = useMemo(() => {
    if (!currentUser) return '';
    return canSelectClass ? selectedClassId : String(currentUser.classId || '');
  }, [currentUser, selectedClassId, canSelectClass]);

  useEffect(() => {
    if (currentUser) {
        if (canSelectClass) {
            const currentStr = String(selectedClassId || '');
            const isValid = selectedClassId && availableClasses.some(c => String(c).toUpperCase() === currentStr.toUpperCase());
            if (!isValid && availableClasses.length > 0 && !selectedClassId) {
                setSelectedClassId(String(availableClasses[0]));
            }
        } else if (currentUser.role === 'siswa') {
            if (currentUser.classId) setSelectedClassId(String(currentUser.classId));
        } else {
            setSelectedClassId(String(currentUser.classId || ''));
        }
    }
  }, [currentUser, availableClasses, selectedClassId, canSelectClass]);

  useEffect(() => {
    const fetchAdminStats = async () => {
        if (!activeClassId || String(activeClassId).toLowerCase() === 'all' || isDemoMode) {
            setAdminPercentage(0);
            return;
        }
        try {
            const [inv, config, globalCalendar] = await Promise.all([
                apiService.getInventory(activeClassId),
                apiService.getClassConfig(activeClassId),
                apiService.getAcademicCalendar('global')
            ]);
            let score = 0;
            if (config.schedule && config.schedule.length > 0) score++;
            if (config.piket && config.piket.length > 0) score++;
            const hasSeats = config.seats && (
                (config.seats.classical && config.seats.classical.some(s => s !== null)) ||
                (config.seats.groups && config.seats.groups.some(s => s !== null)) ||
                (config.seats.ushape && config.seats.ushape.some(s => s !== null))
            );
            if (hasSeats) score++;
            const hasCalendar = (config.academicCalendar && Object.keys(config.academicCalendar).length > 0) || 
                               (globalCalendar && Object.keys(globalCalendar).length > 0);
            if (hasCalendar) score++;
            if (inv && inv.length > 0) score++;
            setAdminPercentage(Math.round((score / 5) * 100));
        } catch (e) {
            setAdminPercentage(0);
        }
    };
    fetchAdminStats();
  }, [activeClassId, isDemoMode]); 

  const { isGlobalReadOnly, allowedSubjects } = useMemo(() => {
    if (!currentUser) return { isGlobalReadOnly: true, allowedSubjects: [] };
    if (currentUser.role === 'admin') return { isGlobalReadOnly: false, allowedSubjects: ['all'] };
    if (currentUser.role === 'Kepala Sekolah') return { isGlobalReadOnly: true, allowedSubjects: ['all'] }; 
    if (currentUser.role === 'siswa') return { isGlobalReadOnly: true, allowedSubjects: [] };
    
    const pos = (currentUser.position || '').toLowerCase();
    
    if (pos.includes('pai') || pos.includes('agama')) return { isGlobalReadOnly: false, allowedSubjects: ['pai'] };
    if (pos.includes('pjok') || pos.includes('olahraga')) return { isGlobalReadOnly: false, allowedSubjects: ['pjok'] };
    if (pos.includes('inggris')) return { isGlobalReadOnly: false, allowedSubjects: ['inggris'] };
    
    // Check if Wali Kelas
    const isWaliKelas = currentUser.classId && currentUser.classId !== 'ALL' && currentUser.classId !== '';
    if (currentUser.role === 'guru' && !isWaliKelas) {
        return { isGlobalReadOnly: true, allowedSubjects: [] };
    }

    return { isGlobalReadOnly: false, allowedSubjects: ['all'] };
  }, [currentUser]);

  const isClassMatch = (id1?: string, id2?: string) => {
      const s1 = String(id1 || '').trim().toLowerCase();
      const s2 = String(id2 || '').trim().toLowerCase();
      return s1 === s2;
  };

  const isRecordMatchClass = (record: { classId?: string; studentId?: string; members?: string[] }, activeClassId: string) => {
      if (record.studentId) {
          const student = students.find(s => String(s.id).trim() === String(record.studentId).trim());
          if (student && student.classId) {
              return isClassMatch(student.classId, activeClassId);
          }
      }
      if (record.members && Array.isArray(record.members) && record.members.length > 0) {
          const hasMemberInClass = record.members.some(memberId => {
              const student = students.find(s => String(s.id).trim() === String(memberId).trim());
              return student && isClassMatch(student.classId, activeClassId);
          });
          if (hasMemberInClass) return true;
      }
      if (isClassMatch(record.classId, activeClassId)) return true;
      if (!record.classId || record.classId === 'undefined' || record.classId === 'null') {
          if (record.members && record.members.length > 0) {
              const hasMemberInClass = record.members.some(memberId => {
                  const student = students.find(s => String(s.id).trim() === String(memberId).trim());
                  return student && isClassMatch(student.classId, activeClassId);
              });
              if (hasMemberInClass) return true;
          }
          const student = students.find(s => String(s.id).trim() === String(record.studentId).trim());
          if (student && isClassMatch(student.classId, activeClassId)) return true;
          if (!record.studentId && (!record.members || record.members.length === 0)) return true;
      }
      return false;
  };

  const filteredStudents = useMemo(() => students.filter(s => isClassMatch(s.classId, activeClassId)), [students, activeClassId]);
  const filteredAgendas = useMemo(() => agendas.filter(a => isClassMatch(a.classId, activeClassId)), [agendas, activeClassId]);
  const filteredExtracurriculars = useMemo(() => {
      return extracurriculars.filter(e => isRecordMatchClass(e, activeClassId));
  }, [extracurriculars, activeClassId, students]);
  const filteredGrades = useMemo(() => grades.filter(g => isClassMatch(g.classId, activeClassId)), [grades, activeClassId]);
  
  const filteredAttendance = useMemo(() => {
      return allAttendanceRecords.filter(a => isRecordMatchClass(a, activeClassId));
  }, [allAttendanceRecords, activeClassId, students]);

  const filteredCounseling = useMemo(() => counselingLogs.filter(c => isRecordMatchClass(c, activeClassId)), [counselingLogs, activeClassId, students]);
  const filteredSikap = useMemo(() => sikapAssessments.filter(s => isRecordMatchClass(s, activeClassId)), [sikapAssessments, activeClassId, students]);
  const filteredKarakter = useMemo(() => karakterAssessments.filter(k => isRecordMatchClass(k, activeClassId)), [karakterAssessments, activeClassId, students]);
  const filteredHolidays = holidays;
  const filteredReports = useMemo(() => {
    return learningReports.filter(r => {
      const s1 = String(r.classId || '').trim().toLowerCase();
      const s2 = String(activeClassId || '').trim().toLowerCase();
      return s1 === s2 || s1 === '' || s1 === 'undefined' || s1 === 'null';
    });
  }, [learningReports, activeClassId]);
  const filteredLearningDocumentation = useMemo(() => learningDocumentation.filter(d => isClassMatch(d.classId, activeClassId)), [learningDocumentation, activeClassId]);
  const filteredSupportDocuments = useMemo(() => supportDocuments.filter(d => isClassMatch(d.classId, activeClassId)), [supportDocuments, activeClassId]);
  
  const filteredLiaison = useMemo(() => {
      return liaisonLogs.filter(l => isRecordMatchClass(l, activeClassId));
  }, [liaisonLogs, activeClassId, students]);

  const pendingPermissions = useMemo(() => {
      const raw = permissionRequests.filter(p => p.status === 'Pending');
      if (currentUser?.role === 'admin' || currentUser?.role === 'Kepala Sekolah') return raw; 
      return raw.filter(p => isClassMatch(p.classId, activeClassId));
  }, [permissionRequests, activeClassId, currentUser]);

  // NEW: Check for unread liaison messages for teachers
  const unreadLiaisonCount = useMemo(() => {
    if (currentUser?.role === 'siswa') return 0;
    return liaisonLogs.filter(log => 
      log.sender === 'Wali Murid' && 
      (log.status === 'Pending' || !log.status) &&
      (currentUser?.role === 'admin' || log.classId === currentUser?.classId)
    ).length;
  }, [liaisonLogs, currentUser]);

  // ... (Existing Handlers: Auto Report, Restore, Permission, Student, Agenda, etc.) ...
  
  // -- LEARNING DOCUMENTATION HANDLERS --
  const handleSaveLearningDocumentation = async (doc: Omit<LearningDocumentation, 'id'> | LearningDocumentation) => {
    const optimisticId = `ldoc-${Date.now()}`;
    const newDoc = { ...doc, id: (doc as LearningDocumentation).id || optimisticId } as LearningDocumentation;

    const oldDocs = learningDocumentation;
    const newDocs = oldDocs.find(d => String(d.id).trim() === String(newDoc.id).trim())
      ? oldDocs.map(d => d.id === newDoc.id ? newDoc : d)
      : [newDoc, ...oldDocs];

    setLearningDocumentation(newDocs);
    cacheService.set('learningDocumentation', newDocs);
    handleShowNotification('Dokumentasi berhasil disimpan.', 'success');

    if (isDemoMode) return;

    try {
      await apiService.saveLearningDocumentation(doc);
      await fetchData(); // Refresh to get server-side IDs
    } catch (error) {
      setLearningDocumentation(oldDocs);
      cacheService.set('learningDocumentation', oldDocs);
      handleShowNotification('Gagal menyimpan dokumentasi.', 'error');
    }
  };

  const handleDeleteLearningDocumentation = async (id: string) => {
    showConfirm('Hapus dokumentasi ini?', () => {
      const oldDocs = learningDocumentation;
      const newDocs = oldDocs.filter(d => d.id !== id);
      setLearningDocumentation(newDocs);
      cacheService.set('learningDocumentation', newDocs);
      handleShowNotification('Dokumentasi berhasil dihapus.', 'success');

      if (isDemoMode) return;

      apiService.deleteLearningDocumentation(id, activeClassId).catch(() => {
        setLearningDocumentation(oldDocs);
        cacheService.set('learningDocumentation', oldDocs);
        handleShowNotification('Gagal menghapus dokumentasi.', 'error');
      });
    });
  };
  
  // --- BOS HANDLERS ---
  const handleSaveBOS = async (transaction: BOSTransaction) => {
    const optimisticId = `bos-${Date.now()}`;
    const newTransaction = { ...transaction, id: transaction.id || optimisticId };

    const oldTransactions = bosTransactions;
    const newTransactions = oldTransactions.find(t => String(t.id).trim() === String(newTransaction.id).trim())
      ? oldTransactions.map(t => t.id === newTransaction.id ? newTransaction : t)
      : [...oldTransactions, newTransaction];

    setBosTransactions(newTransactions);
    cacheService.set('bosTransactions', newTransactions);
    handleShowNotification('Transaksi BOS berhasil disimpan.', 'success');

    if (isDemoMode) return;

    try {
      await apiService.saveBOS(transaction);
      await fetchData(); // Refresh for server-side ID
    } catch (error) {
      setBosTransactions(oldTransactions);
      cacheService.set('bosTransactions', oldTransactions);
      handleShowNotification('Gagal menyimpan transaksi BOS.', 'error');
    }
  };

  const handleDeleteBOS = async (id: string) => {
    showConfirm('Hapus transaksi BOS ini?', () => {
      const oldTransactions = bosTransactions;
      const newTransactions = oldTransactions.filter(t => t.id !== id);
      setBosTransactions(newTransactions);
      cacheService.set('bosTransactions', newTransactions);
      handleShowNotification('Transaksi BOS berhasil dihapus.', 'success');

      if (isDemoMode) return;

      apiService.deleteBOS(id).catch(() => {
        setBosTransactions(oldTransactions);
        cacheService.set('bosTransactions', oldTransactions);
        handleShowNotification('Gagal menghapus transaksi BOS.', 'error');
      });
    });
  };

  // ... (Other handlers unchanged)
  // Re-inserting required handlers for completeness
  const handleSaveJournalAndAutoReport = async (entries: Partial<LearningJournalEntry>[]) => {
      if (isDemoMode) { handleShowNotification('Jurnal & Laporan otomatis disimpan (Demo)', 'success'); return; }
      try {
          await apiService.saveLearningJournalBatch(entries);
          handleShowNotification('Jurnal pembelajaran berhasil disimpan.', 'success');
          if (entries.length > 0 && entries[0].date) {
              const reportDate = entries[0].date;
              const uniqueSubjects = [...new Set(entries.map(e => e.subject).filter(Boolean))].join(', ');
              const combinedTopics = entries.map(e => e.topic).filter(Boolean).join('; ');
              if (uniqueSubjects) {
                  const autoReport: LearningReport = {
                      id: `jurnal-${reportDate}-${activeClassId}`, classId: activeClassId, date: reportDate,
                      type: 'Jurnal Harian', subject: uniqueSubjects, topic: combinedTopics || 'Kegiatan Pembelajaran Harian',
                      documentLink: '', teacherName: (currentUser?.fullName && currentUser?.fullName !== 'undefined') ? currentUser.fullName : 'Guru Kelas'
                  };
                  await apiService.saveLearningReport(autoReport);
                  const newReports = await apiService.getLearningReports(activeClassId);
                  setLearningReports(newReports);
              }
          }
      } catch (e) { console.error("Auto report error:", e); handleShowNotification('Jurnal disimpan, namun gagal membuat laporan otomatis.', 'warning'); }
  };

  const handleNavigateToJournal = (date: string) => { setJournalTargetDate(date); navigate('/jurnal-pembelajaran'); };
  
  const handleRestoreData = async (data: any) => {
      try {
          const res = await apiService.restoreData(data);
          if (res.status === 'success') { 
              handleShowNotification("Data berhasil dipulihkan! Memuat ulang...", "success");
              setTimeout(() => {
                  window.location.reload();
              }, 1500);
          } else { 
              throw new Error(res.message); 
          }
      } catch (e: any) { 
          throw new Error(e.message || "Gagal restore data."); 
      }
  };

  const handleProcessPermission = async (id: string, action: 'approve' | 'reject') => {
      setProcessingPermissionId(id);
      try {
          const req = permissionRequests.find(p => String(p.id).trim() === String(id).trim());
          if (isDemoMode) {
              setPermissionRequests(prev => prev.map(p => p.id === id ? { ...p, status: action === 'approve' ? 'Approved' : 'Rejected' } : p));
              if (action === 'approve' && req) {
                  setAllAttendanceRecords(prev => {
                      const filtered = prev.filter(r => !(String(r.studentId) === String(req.studentId) && String(r.date) === String(req.date)));
                      return [...filtered, { studentId: req.studentId, classId: req.classId, date: req.date, status: req.type, notes: req.reason }];
                  });
              }
              handleShowNotification(`Ijin berhasil di${action === 'approve' ? 'terima' : 'tolak'} (Demo).`, 'success');
          } else {
              await apiService.processPermissionRequest(id, action);
              handleShowNotification(`Ijin berhasil di${action === 'approve' ? 'terima' : 'tolak'}.`, 'success');
              await fetchData();
          }
      } catch (e) { handleShowNotification('Gagal memproses ijin.', 'error'); } finally { setProcessingPermissionId(null); }
  };

  // Add/Update/Delete Student handlers
  const handleAddStudent = async (student: Omit<Student, 'id'>) => {
    const targetClassId = String(activeClassId || student.classId || '1A');
    const studentWithClass = { ...student, classId: targetClassId };
    const optimisticId = `student-${Date.now()}`;
    const newStudent = { ...studentWithClass, id: optimisticId };

    const oldStudents = students;
    const newStudents = [...oldStudents, newStudent].sort((a, b) => a.name.localeCompare(b.name));
    setStudents(newStudents);
    cacheService.set('students', newStudents);
    handleShowNotification('Siswa berhasil ditambahkan.', 'success');

    if (isDemoMode) return;

    try {
      const res = await apiService.createStudent(studentWithClass);
      if (res.id) {
        // Replace optimistic ID with server ID
        setStudents(prev => prev.map(s => s.id === optimisticId ? { ...newStudent, id: res.id } : s));
        cacheService.set('students', students.map(s => s.id === optimisticId ? { ...newStudent, id: res.id } : s));
        if (currentUser?.role === 'admin' && !availableClasses.includes(targetClassId.toUpperCase())) {
          setSelectedClassId(targetClassId.toUpperCase());
        }
      } else {
        throw new Error('No ID returned from server');
      }
    } catch (error) {
      setStudents(oldStudents);
      cacheService.set('students', oldStudents);
      handleShowNotification('Gagal menambahkan siswa.', 'error');
    }
  };
  const handleBatchAddStudents = async (newStudents: Omit<Student, 'id'>[]) => { 
    const batchWithClass = newStudents.map(s => ({ ...s, classId: s.classId || activeClassId || '1A' }));
    if (isDemoMode) { const demoStudents = batchWithClass.map((s, i) => ({ ...s, id: Date.now().toString() + i })); setStudents([...students, ...demoStudents].sort((a, b) => a.name.localeCompare(b.name))); return; }
    try { const res = await apiService.createStudentBatch(batchWithClass); if (res.status === 'success') { fetchData(); handleShowNotification(`Berhasil menambahkan ${newStudents.length} siswa!`, 'success'); } } catch (e) { handleShowNotification('Gagal upload batch siswa', 'error'); }
  };
  const handleUpdateStudent = async (updatedStudent: Student) => {
    const oldStudents = students;
    const newStudents = oldStudents.map(s => s.id === updatedStudent.id ? updatedStudent : s).sort((a, b) => a.name.localeCompare(b.name));
    setStudents(newStudents);
    cacheService.set('students', newStudents);
    // No notification for updates to keep UI quiet

    if (isDemoMode) return;

    try {
      await apiService.updateStudent(updatedStudent);
    } catch (error) {
      setStudents(oldStudents);
      cacheService.set('students', oldStudents);
      handleShowNotification('Gagal memperbarui data siswa.', 'error');
    }
  };
  const handleDeleteStudent = async (id: string) => {
    showConfirm('Apakah Anda yakin ingin menghapus data siswa ini?', () => {
      const oldStudents = students;
      const newStudents = oldStudents.filter(s => s.id !== id);
      setStudents(newStudents);
      cacheService.set('students', newStudents);
      handleShowNotification('Data siswa berhasil dihapus.', 'success');

      if (isDemoMode) return;

      apiService.deleteStudent(id).catch(() => {
        setStudents(oldStudents);
        cacheService.set('students', oldStudents);
        handleShowNotification('Gagal menghapus data siswa.', 'error');
      });
    });
  };

  // Agendas & Extras
  const handleAddAgenda = async (newItem: AgendaItem) => {
    const agendaWithClass = { ...newItem, classId: activeClassId };
    const optimisticId = `agenda-${Date.now()}`;
    const newAgenda = { ...agendaWithClass, id: optimisticId };

    const oldAgendas = agendas;
    const newAgendas = [newAgenda, ...oldAgendas];
    setAgendas(newAgendas);
    cacheService.set('agendas', newAgendas);

    if (isDemoMode) return;

    try {
      await apiService.createAgenda(agendaWithClass);
      // Instead of full fetchData, just fetch agendas to avoid overwriting other states
      const updatedAgendas = await apiService.getAgendas(currentUser);
      setAgendas(updatedAgendas.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      cacheService.set('agendas', updatedAgendas);
    } catch (error) {
      setAgendas(oldAgendas);
      cacheService.set('agendas', oldAgendas);
      handleShowNotification('Gagal menyimpan agenda.', 'error');
    }
  };
  const handleUpdateAgenda = async (updatedItem: AgendaItem) => {
    const oldAgendas = agendas;
    const newAgendas = oldAgendas.map(item => item.id === updatedItem.id ? updatedItem : item);
    setAgendas(newAgendas);
    cacheService.set('agendas', newAgendas);

    if (isDemoMode) return;

    try {
      await apiService.updateAgenda(updatedItem);
      handleShowNotification('Agenda berhasil diperbarui.', 'success');
    } catch (error) {
      setAgendas(oldAgendas);
      cacheService.set('agendas', oldAgendas);
      handleShowNotification('Gagal memperbarui agenda.', 'error');
    }
  };
  const handleToggleAgenda = async (id: string) => {
    const oldAgendas = agendas;
    const newAgendas = oldAgendas.map(item => item.id === id ? { ...item, completed: !item.completed } : item);
    setAgendas(newAgendas);
    cacheService.set('agendas', newAgendas);

    if (isDemoMode) return;

    const toggledItem = newAgendas.find(a => String(a.id).trim() === String(id).trim());
    if (toggledItem) {
      try {
        await apiService.updateAgenda(toggledItem);
      } catch (error) {
        setAgendas(oldAgendas);
        cacheService.set('agendas', oldAgendas);
        handleShowNotification('Gagal memperbarui status agenda.', 'error');
      }
    }
  };
  const handleDeleteAgenda = (id: string) => {
    showConfirm('Hapus agenda ini?', () => {
      const oldAgendas = agendas;
      const newAgendas = oldAgendas.filter(item => item.id !== id);
      setAgendas(newAgendas);
      cacheService.set('agendas', newAgendas);

      if (isDemoMode) return;

      apiService.deleteAgenda(id).catch(() => {
        setAgendas(oldAgendas);
        cacheService.set('agendas', oldAgendas);
        handleShowNotification('Gagal menghapus agenda.', 'error');
      });
    });
  };

  // Materials
  const handleAddMaterial = async (newMaterial: Omit<Material, 'id' | 'createdAt'> & { createdAt?: string }) => {
    if (isDemoMode) {
      const optimisticId = `material-${Date.now()}`;
      const materialWithId: Material = { 
        ...newMaterial, 
        id: optimisticId, 
        createdAt: newMaterial.createdAt || new Date().toISOString() 
      };
      const newMaterials = [materialWithId, ...materials];
      setMaterials(newMaterials);
      cacheService.set('materials', newMaterials);
      return;
    }

    try {
      await apiService.createMaterial(newMaterial);
      const updatedMaterials = await apiService.getMaterials(activeClassId);
      setMaterials(updatedMaterials);
      cacheService.set('materials', updatedMaterials);
    } catch (error) {
      handleShowNotification('Gagal menambahkan materi.', 'error');
    }
  };

  const handleUpdateMaterial = async (updatedMaterial: Material) => {
    console.log("Updating material:", updatedMaterial);
    if (isDemoMode) {
      const newMaterials = materials.map(m => m.id === updatedMaterial.id ? updatedMaterial : m);
      setMaterials(newMaterials);
      cacheService.set('materials', newMaterials);
      return;
    }

    try {
      await apiService.updateMaterial(updatedMaterial);
      const updatedMaterials = await apiService.getMaterials(activeClassId);
      console.log("Materials updated, fetched new list:", updatedMaterials);
      setMaterials(updatedMaterials);
      cacheService.set('materials', updatedMaterials);
    } catch (error) {
      console.error("Error updating material:", error);
      handleShowNotification('Gagal memperbarui materi.', 'error');
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    if (isDemoMode) {
      const newMaterials = materials.filter(m => m.id !== id);
      setMaterials(newMaterials);
      cacheService.set('materials', newMaterials);
      return;
    }

    try {
      await apiService.deleteMaterial(id);
      const updatedMaterials = await apiService.getMaterials(activeClassId);
      setMaterials(updatedMaterials);
      cacheService.set('materials', updatedMaterials);
    } catch (error) {
      handleShowNotification('Gagal menghapus materi.', 'error');
    }
  };
  const handleAddExtracurricular = async (item: Extracurricular) => {
    const itemWithClass = { ...item, classId: activeClassId };
    const optimisticId = `extra-${Date.now()}`;
    const newExtra = { ...itemWithClass, id: optimisticId };

    const oldExtras = extracurriculars;
    const newExtras = [...oldExtras, newExtra];
    setExtracurriculars(newExtras);
    cacheService.set('extracurriculars', newExtras);
    handleShowNotification('Ekskul berhasil ditambahkan', 'success');

    if (isDemoMode) return;

    try {
      await apiService.createExtracurricular(itemWithClass);
      const updatedExtras = await apiService.getExtracurriculars(currentUser);
      setExtracurriculars(updatedExtras);
      cacheService.set('extracurriculars', updatedExtras);
    } catch (error) {
      setExtracurriculars(oldExtras);
      cacheService.set('extracurriculars', oldExtras);
      handleShowNotification('Gagal menambahkan ekskul.', 'error');
    }
  };
  // FIX: Use `updatedItem` which is passed as an argument, instead of `editingActivity` which is not defined in this scope.
  const handleUpdateExtracurricular = async (updatedItem: Extracurricular) => {
    const itemWithClass = { ...updatedItem, classId: updatedItem.classId || activeClassId };
    const oldExtras = extracurriculars;
    const newExtras = oldExtras.map(ex => ex.id === itemWithClass.id ? itemWithClass : ex);
    setExtracurriculars(newExtras);
    cacheService.set('extracurriculars', newExtras);

    if (isDemoMode) return;

    try {
      await apiService.updateExtracurricular(itemWithClass);
    } catch (error) {
      setExtracurriculars(oldExtras);
      cacheService.set('extracurriculars', oldExtras);
      handleShowNotification('Gagal memperbarui ekskul.', 'error');
    }
  };
  
  // General & Logs
  const handleSaveGrade = async (studentId: string, subjectId: string, gradeData: any, classId: string) => {
    // Update local state in App.tsx
    setGrades(prevGrades => {
      const newGrades = [...prevGrades];
      let record = newGrades.find(g => String(g.studentId) === String(studentId));
      if (!record) {
        record = { studentId, classId, subjects: {} };
        newGrades.push(record);
      }
      record.subjects[subjectId] = gradeData;
      cacheService.set('grades', newGrades);
      return newGrades;
    });

    if (!isDemoMode) {
      try {
        await apiService.saveGrade(studentId, subjectId, gradeData, classId);
      } catch (error) {
        console.error("Gagal menyimpan nilai ke database:", error);
        handleShowNotification("Gagal menyimpan nilai ke database.", "error");
        throw error;
      }
    } else {
      handleShowNotification("Nilai disimpan (Mode Demo).", "success");
    }
  };
  const handleCreateLog = async (log: BehaviorLog) => { setCounselingLogs([log, ...counselingLogs]); if(log.point !== 0) { const student = students.find(s => String(s.id).trim() === String(log.studentId).trim()); if(student) { const newScore = Math.min(100, Math.max(0, student.behaviorScore + log.point)); handleUpdateStudent({ ...student, behaviorScore: newScore }); } } if(!isDemoMode) await apiService.createCounselingLog(log); handleShowNotification('Data konseling berhasil disimpan!', 'success'); };
  const handleUpdateProfile = async (type: 'teacher' | 'school', data: any) => { 
    if (type === 'teacher') { 
      setTeacherProfile(data); 
      localStorage.setItem('teacher_profile_cache', JSON.stringify(data));
      if (!currentUser) return; 
      const updatedUser: User = { ...currentUser, fullName: data.name, nip: data.nip, nuptk: data.nuptk, birthPlace: data.birthPlace, birthDate: data.birthDate, education: data.education, position: data.position, rank: data.rank, classId: data.teachingClass, email: data.email, phone: data.phone, address: data.address, photo: data.photo, signature: data.signature }; 
      setCurrentUser(updatedUser); 
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
      if (!isDemoMode) {
        try {
          await apiService.saveUser(updatedUser);
          
          // Synchronize with GTK Data
          const updatedGtkData = [...gtkData];
          let gtkChanged = false;
          
          const gtkIdx = updatedGtkData.findIndex(g => g.userId === updatedUser.id);
          if (gtkIdx >= 0) {
            const gtk = updatedGtkData[gtkIdx];
            if (updatedUser.fullName && gtk.nama !== updatedUser.fullName) { gtk.nama = updatedUser.fullName; gtkChanged = true; }
            if (updatedUser.photo && gtk.foto !== updatedUser.photo) { gtk.foto = updatedUser.photo; gtkChanged = true; }
            if (updatedUser.position && gtk.jabatan !== updatedUser.position) { gtk.jabatan = updatedUser.position; gtkChanged = true; }
            if (updatedUser.rank && gtk.pangkatGolongan !== updatedUser.rank) { gtk.pangkatGolongan = updatedUser.rank; gtkChanged = true; }
            if (updatedUser.nip && gtk.nip !== updatedUser.nip) { gtk.nip = updatedUser.nip; gtkChanged = true; }
            if (updatedUser.nuptk && gtk.nuptk !== updatedUser.nuptk) { gtk.nuptk = updatedUser.nuptk; gtkChanged = true; }
            if (updatedUser.email && gtk.emailPribadi !== updatedUser.email) { gtk.emailPribadi = updatedUser.email; gtkChanged = true; }
            if (updatedUser.birthPlace && gtk.tempatLahir !== updatedUser.birthPlace) { gtk.tempatLahir = updatedUser.birthPlace; gtkChanged = true; }
            if (updatedUser.birthDate && gtk.tanggalLahir !== updatedUser.birthDate) { gtk.tanggalLahir = updatedUser.birthDate; gtkChanged = true; }
            
            if (gtkChanged) {
              setGtkData(updatedGtkData);
              cacheService.set('gtkData', updatedGtkData);
              await apiService.saveGtkData(updatedGtkData);
            }
          }
        } catch (e: any) {
          console.error("Gagal sinkron ke database:", e);
          const msg = e.message || '';
          if (msg.includes('relation') && msg.includes('does not exist')) {
            throw new Error("Gagal menyimpan ke database cloud karena tabel 'users' belum dibuat di Supabase Anda. Silakan jalankan script SQL di menu SQL Editor Supabase terlebih dahulu. Data Anda berhasil disimpan secara lokal di browser ini.");
          } else if (msg.includes('row-level security') || msg.includes('violates row-level security policy')) {
            throw new Error("Gagal menyimpan ke database cloud karena masalah hak akses (RLS) di Supabase. Silakan jalankan script 'disable_rls_all_tables.sql' di SQL Editor Supabase Anda. Data Anda berhasil disimpan secara lokal di browser ini.");
          } else {
            throw new Error("Gagal menyimpan profil guru ke cloud database. Data Anda berhasil disimpan secara lokal di browser ini.");
          }
        }
      }
    } else { 
      const semesterChanged = schoolProfile && schoolProfile.semester !== data.semester;
      const yearChanged = schoolProfile && schoolProfile.year !== data.year;

      const performUpdate = async () => {
        setSchoolProfile(data); 
        localStorage.setItem('school_profile_cache', JSON.stringify(data));
        if (!isDemoMode) {
          try {
            await apiService.saveProfile('school', data);
          } catch (e: any) {
            console.error("Gagal menyimpan ke database:", e);
            const msg = e.message || '';
            if (msg.includes('relation') && msg.includes('does not exist')) {
              throw new Error("Gagal menyimpan ke database cloud karena tabel 'profiles' belum dibuat di Supabase Anda. Silakan jalankan script SQL di menu SQL Editor Supabase terlebih dahulu. Data Anda berhasil disimpan secara lokal di browser ini.");
            } else if (msg.includes('row-level security') || msg.includes('violates row-level security policy')) {
              throw new Error("Gagal menyimpan ke database cloud karena masalah hak akses (RLS) di Supabase. Silakan jalankan script 'disable_rls_all_tables.sql' di SQL Editor Supabase Anda. Data Anda berhasil disimpan secara lokal di browser ini.");
            } else {
              throw new Error("Gagal menyimpan profil sekolah ke cloud database. Data Anda berhasil disimpan secara lokal di browser ini.");
            }
          }
        }
      };

      if ((semesterChanged || yearChanged) && schoolProfile) {
        showConfirm(
          `Anda mengubah ${semesterChanged && yearChanged ? 'Tahun Ajaran & Semester' : semesterChanged ? 'Semester' : 'Tahun Ajaran'}. Apakah Anda ingin mengarsipkan nilai saat ini ke History Nilai sebelum melanjutkan? (Nilai di semester baru akan dikosongkan)`, 
          async () => {
            try {
              handleShowNotification('Sedang mengarsipkan nilai...', 'warning');
              const studentsInClass = students.filter(s => s.classId === activeClassId);
              
              for (const student of studentsInClass) {
                const currentGrades = await apiService.getGradesForStudent(student.id);
                if (currentGrades && currentGrades.subjects && Object.keys(currentGrades.subjects).length > 0) {
                  const historyEntry = {
                    id: `${schoolProfile.year}-S${schoolProfile.semester}-${activeClassId}`,
                    academicYear: schoolProfile.year,
                    semester: schoolProfile.semester,
                    classId: activeClassId,
                    timestamp: Date.now(),
                    subjects: currentGrades.subjects
                  };
                  await apiService.saveGradeHistory(student.id, historyEntry);
                  await apiService.deleteGradesForStudent(student.id);
                }
              }
              handleShowNotification('Nilai berhasil diarsipkan ke history.', 'success');
              await performUpdate();
            } catch (error) {
              console.error("Error archiving grades:", error);
              handleShowNotification('Gagal mengarsipkan nilai. Silakan coba lagi.', 'error');
            }
          },
          () => {
            // If user cancels archiving, just perform the update anyway? 
            // Or maybe they just want to change the info without archiving.
            performUpdate();
          }
        );
      } else {
        await performUpdate();
      }
    } 
  };
  
  // Holidays & Assessments
  const handleAddHoliday = async (holidaysToAdd: Omit<Holiday, 'id'>[]) => { 
    if (isDemoMode) { 
      const newHolidays = holidaysToAdd.map(h => ({ ...h, id: Date.now().toString() + Math.random() })); 
      setHolidays(prev => {
        // Remove existing holidays with the same date and classId
        const filteredPrev = prev.filter(h => 
          !newHolidays.some(newH => newH.date === h.date && newH.classId === h.classId)
        );
        
        return [...filteredPrev, ...newHolidays].sort((a,b) => a.date.localeCompare(b.date));
      }); 
      handleShowNotification("Hari libur berhasil ditambahkan (Demo).", "success"); 
      return; 
    } 
    try { 
      await apiService.saveHolidayBatch(holidaysToAdd); 
      handleShowNotification("Hari libur berhasil disimpan!", "success"); 
      await fetchData(); 
    } catch (e) { 
      handleShowNotification("Gagal menyimpan hari libur.", "error"); 
    } 
  };
  const handleUpdateHoliday = async (updatedHoliday: Holiday) => { if (isDemoMode) { setHolidays(prev => prev.map(h => h.id === updatedHoliday.id ? updatedHoliday : h).sort((a,b) => a.date.localeCompare(b.date))); handleShowNotification("Hari libur diperbarui (Demo).", "success"); return; } try { await apiService.updateHoliday(updatedHoliday); handleShowNotification("Hari libur berhasil diperbarui.", "success"); await fetchData(); } catch(e) { handleShowNotification("Gagal memperbarui hari libur.", "error"); } };
  const handleDeleteHoliday = async (id: string) => { showConfirm('Hapus hari libur ini?', async () => { if (isDemoMode) { setHolidays(prev => prev.filter(h => h.id !== id)); handleShowNotification("Hari libur dihapus (Demo).", "success"); return; } try { await apiService.deleteHoliday(id); handleShowNotification("Hari libur berhasil dihapus.", "success"); await fetchData(); } catch (e) { handleShowNotification("Gagal menghapus hari libur.", "error"); } }); };
  const handleSaveSikap = async (studentId: string, assessment: Omit<SikapAssessment, 'studentId' | 'classId'>) => { setSikapAssessments(prev => { const existing = prev.find(a => String(a.studentId).trim() === String(studentId).trim()); if (existing) return prev.map(a => String(a.studentId).trim() === String(studentId).trim() ? { ...existing, ...assessment } : a); return [...prev, { studentId, classId: activeClassId, ...assessment }]; }); if (!isDemoMode) await apiService.saveSikapAssessment(studentId, activeClassId, assessment); };
  const handleSaveKarakter = async (studentId: string, assessment: Omit<KarakterAssessment, 'studentId' | 'classId'>) => { setKarakterAssessments(prev => { const existing = prev.find(a => String(a.studentId).trim() === String(studentId).trim()); if (existing) return prev.map(a => String(a.studentId).trim() === String(studentId).trim() ? { ...existing, ...assessment } : a); return [...prev, { studentId, classId: activeClassId, ...assessment }]; }); if (!isDemoMode) await apiService.saveKarakterAssessment(studentId, activeClassId, assessment); };
  
  // Accounts
  const handleAddUserAccount = async (user: Omit<User, 'id'>) => {
    const optimisticId = `user-${Date.now()}`;
    const newUser = { ...user, id: optimisticId } as User;

    const oldUsers = users;
    const newUsers = [...oldUsers, newUser];
    setUsers(newUsers);
    cacheService.set('users', newUsers);
    handleShowNotification('Akun berhasil ditambahkan.', 'success');

    if (isDemoMode) return;

    try {
      const res = await apiService.saveUser(user as User);
      if (res.id) {
        setUsers(prev => prev.map(u => u.id === optimisticId ? { ...newUser, id: res.id } : u));
        cacheService.set('users', users.map(u => u.id === optimisticId ? { ...newUser, id: res.id } : u));
      } else {
        throw new Error('No ID returned');
      }
    } catch (error) {
      setUsers(oldUsers);
      cacheService.set('users', oldUsers);
      handleShowNotification('Gagal menambahkan akun.', 'error');
    }
  };
  const handleBatchAddUserAccount = async (users: Omit<User, 'id'>[]) => { if (isDemoMode) { const newUsers = users.map((u, i) => ({ ...u, id: `user-${Date.now()}-${i}` })); setUsers(prev => [...prev, ...newUsers as User[]]); handleShowNotification('Akun ditambahkan (Mode Demo).', 'success'); return; } await apiService.saveUserBatch(users); handleShowNotification(`Berhasil menambahkan ${users.length} akun!`, 'success'); await fetchData(); };
  const handleUpdateUserAccount = async (user: User) => {
    const oldUsers = users;
    const newUsers = oldUsers.map(u => u.id === user.id ? user : u);
    setUsers(newUsers);
    cacheService.set('users', newUsers);

    if (isDemoMode) return;

    try {
      await apiService.saveUser(user);
      
      // Synchronize with GTK Data
      const updatedGtkData = [...gtkData];
      let gtkChanged = false;
      
      const gtkIdx = updatedGtkData.findIndex(g => g.userId === user.id);
      if (gtkIdx >= 0) {
        const gtk = updatedGtkData[gtkIdx];
        if (user.fullName && gtk.nama !== user.fullName) { gtk.nama = user.fullName; gtkChanged = true; }
        if (user.photo && gtk.foto !== user.photo) { gtk.foto = user.photo; gtkChanged = true; }
        if (user.position && gtk.jabatan !== user.position) { gtk.jabatan = user.position; gtkChanged = true; }
        if (user.rank && gtk.pangkatGolongan !== user.rank) { gtk.pangkatGolongan = user.rank; gtkChanged = true; }
        if (user.nip && gtk.nip !== user.nip) { gtk.nip = user.nip; gtkChanged = true; }
        if (user.nuptk && gtk.nuptk !== user.nuptk) { gtk.nuptk = user.nuptk; gtkChanged = true; }
        if (user.email && gtk.emailPribadi !== user.email) { gtk.emailPribadi = user.email; gtkChanged = true; }
        if (user.birthPlace && gtk.tempatLahir !== user.birthPlace) { gtk.tempatLahir = user.birthPlace; gtkChanged = true; }
        if (user.birthDate && gtk.tanggalLahir !== user.birthDate) { gtk.tanggalLahir = user.birthDate; gtkChanged = true; }
        
        if (gtkChanged) {
          setGtkData(updatedGtkData);
          cacheService.set('gtkData', updatedGtkData);
          await apiService.saveGtkData(updatedGtkData);
        }
      }
    } catch (error) {
      setUsers(oldUsers);
      cacheService.set('users', oldUsers);
      handleShowNotification('Gagal memperbarui akun.', 'error');
    }
  };
  const handleDeleteUserAccount = async (id: string) => {
    showConfirm('Hapus akun ini?', () => {
      const oldUsers = users;
      const newUsers = oldUsers.filter(u => u.id !== id);
      setUsers(newUsers);
      cacheService.set('users', newUsers);
      handleShowNotification('Akun berhasil dihapus.', 'success');

      if (isDemoMode) return;

      apiService.deleteUser(id).catch(() => {
        setUsers(oldUsers);
        cacheService.set('users', oldUsers);
        handleShowNotification('Gagal menghapus akun.', 'error');
      });
    });
  };
  
  // Employment Links
  const handleSaveEmploymentLink = async (link: Omit<EmploymentLink, 'id'> | EmploymentLink) => {
    const optimisticId = `link-${Date.now()}`;
    const newLink = { ...link, id: (link as EmploymentLink).id || optimisticId } as EmploymentLink;

    const oldLinks = employmentLinks;
    const newLinks = oldLinks.find(l => String(l.id).trim() === String(newLink.id).trim())
      ? oldLinks.map(l => l.id === newLink.id ? newLink : l)
      : [...oldLinks, newLink];

    setEmploymentLinks(newLinks);
    cacheService.set('employmentLinks', newLinks);
    handleShowNotification('Link berhasil disimpan.', 'success');

    if (isDemoMode) return;

    try {
      await apiService.saveEmploymentLink(link);
      await fetchData(); // Refresh for server-side ID
    } catch (error) {
      setEmploymentLinks(oldLinks);
      cacheService.set('employmentLinks', oldLinks);
      handleShowNotification('Gagal menyimpan link.', 'error');
    }
  };
  const handleDeleteEmploymentLink = async (id: string) => {
    showConfirm('Hapus link ini?', () => {
      const oldLinks = employmentLinks;
      const newLinks = oldLinks.filter(l => l.id !== id);
      setEmploymentLinks(newLinks);
      cacheService.set('employmentLinks', newLinks);
      handleShowNotification('Link berhasil dihapus.', 'success');

      if (isDemoMode) return;

      apiService.deleteEmploymentLink(id).catch(() => {
        setEmploymentLinks(oldLinks);
        cacheService.set('employmentLinks', oldLinks);
        handleShowNotification('Gagal menghapus link.', 'error');
      });
    });
  };
  
  // Learning Reports
  const handleSaveReport = async (report: Omit<LearningReport, 'id'> | LearningReport) => {
    const optimisticId = `report-${Date.now()}`;
    const newReport = { 
        ...report, 
        id: (report as LearningReport).id || optimisticId,
        schoolId: schoolProfile.npsn
    } as LearningReport;

    const oldReports = learningReports;
    const newReports = oldReports.find(r => String(r.id).trim() === String(newReport.id).trim())
      ? oldReports.map(r => r.id === newReport.id ? newReport : r)
      : [...oldReports, newReport];

    setLearningReports(newReports);
    cacheService.set('learningReports', newReports);
    handleShowNotification('Laporan berhasil disimpan.', 'success');

    if (isDemoMode) return;

    try {
      await apiService.saveLearningReport(newReport);
      await fetchData(); // Refresh for server-side ID
    } catch (error) {
      setLearningReports(oldReports);
      cacheService.set('learningReports', oldReports);
      handleShowNotification('Gagal menyimpan laporan.', 'error');
    }
  };
  const handleDeleteReport = async (id: string) => {
    showConfirm('Hapus laporan ini?', () => {
      const oldReports = learningReports;
      const newReports = oldReports.filter(r => r.id !== id);
      setLearningReports(newReports);
      cacheService.set('learningReports', newReports);
      handleShowNotification('Laporan berhasil dihapus.', 'success');

      if (isDemoMode) return;

      apiService.deleteLearningReport(id, activeClassId).catch(() => {
        setLearningReports(oldReports);
        cacheService.set('learningReports', oldReports);
        handleShowNotification('Gagal menghapus laporan.', 'error');
      });
    });
  };
  
  // Liaison
  const handleSaveLiaison = async (log: Omit<LiaisonLog, 'id'>) => { if (isDemoMode) { const newLog = { ...log, id: Date.now().toString(), status: 'Pending' } as LiaisonLog; setLiaisonLogs(prev => [...prev, newLog]); handleShowNotification('Pesan terkirim (Demo).', 'success'); return; } await apiService.saveLiaisonLog(log); handleShowNotification('Pesan berhasil dikirim!', 'success'); const newLog = { ...log, id: 'temp-' + Date.now(), status: 'Pending' } as LiaisonLog; setLiaisonLogs(prev => [...prev, newLog]); const fetchedLogs = await apiService.getLiaisonLogs(currentUser); setLiaisonLogs(fetchedLogs); };
  const handleUpdateLiaisonStatus = async (ids: string[], status: 'Diterima' | 'Ditolak' | 'Selesai') => { if (isDemoMode) { setLiaisonLogs(prev => prev.map(l => ids.includes(l.id) ? { ...l, status: status } : l)); handleShowNotification(`Status diperbarui menjadi ${status} (Demo).`, 'success'); return; } await apiService.updateLiaisonStatus(ids, status); handleShowNotification(`Status laporan diperbarui: ${status}`, 'success'); const fetchedLogs = await apiService.getLiaisonLogs(currentUser); setLiaisonLogs(fetchedLogs); };

  // Permissions
  const handleSavePermissionRequest = async (date: string, records: any[]) => { 
      const typeStr = records[0]?.status; 
      const typeLabel = typeStr === 'sick' ? 'Sakit' : typeStr === 'dispensation' ? 'Dispensasi' : 'Ijin'; 
      
      if (isDemoMode) { 
          handleShowNotification(`Pengajuan ${typeLabel} tersimpan (Demo).`, 'success'); 
          return; 
      } 
      
      for (const rec of records) { 
          await apiService.savePermissionRequest({ 
              studentId: rec.studentId, 
              classId: rec.classId, 
              date: date, 
              type: rec.status, 
              reason: rec.notes 
          }); 
      } 
      
      // Automatically add to attendance
      const attendanceRecords = records.map(rec => ({
          studentId: rec.studentId,
          status: rec.status,
          notes: rec.notes
      }));
      await apiService.saveAttendance(date, attendanceRecords.map(r => ({...r, classId: records[0].classId})));

      handleShowNotification(`Pengajuan ${typeLabel} dikirim dan dicatat di absensi.`, 'success'); 
      const reqs = await apiService.getPermissionRequests(currentUser); 
      setPermissionRequests(reqs); 
      const att = await apiService.getAttendance(currentUser);
      setAllAttendanceRecords(att);
  };

  // Support Docs
  const handleSaveSupportDocument = async (doc: Omit<SupportDocument, 'id'> | SupportDocument) => {
    const optimisticId = `sdoc-${Date.now()}`;
    const newDoc = { ...doc, id: (doc as SupportDocument).id || optimisticId } as SupportDocument;

    const oldDocs = supportDocuments;
    const newDocs = oldDocs.find(d => String(d.id).trim() === String(newDoc.id).trim())
      ? oldDocs.map(d => d.id === newDoc.id ? newDoc : d)
      : [newDoc, ...oldDocs];

    setSupportDocuments(newDocs);
    cacheService.set('supportDocuments', newDocs);
    handleShowNotification('Dokumen berhasil disimpan.', 'success');

    if (isDemoMode) return;

    try {
      await apiService.saveSupportDocument(doc);
      await fetchData(); // Refresh for server-side ID
    } catch (error) {
      setSupportDocuments(oldDocs);
      cacheService.set('supportDocuments', oldDocs);
      handleShowNotification('Gagal menyimpan dokumen.', 'error');
    }
  };
  const handleDeleteSupportDocument = async (id: string) => {
    showConfirm('Hapus dokumen ini?', () => {
      const oldDocs = supportDocuments;
      const newDocs = oldDocs.filter(d => d.id !== id);
      setSupportDocuments(newDocs);
      cacheService.set('supportDocuments', newDocs);
      handleShowNotification('Dokumen berhasil dihapus.', 'success');

      if (isDemoMode) return;

      apiService.deleteSupportDocument(id, activeClassId).catch(() => {
        setSupportDocuments(oldDocs);
        cacheService.set('supportDocuments', oldDocs);
        handleShowNotification('Gagal menghapus dokumen.', 'error');
      });
    });
  };

  // School Assets
  const handleSaveSchoolAsset = async (asset: SchoolAsset) => {
    const optimisticId = `asset-${Date.now()}`;
    const newAsset = { ...asset, id: asset.id || optimisticId };

    const oldAssets = schoolAssets;
    const newAssets = oldAssets.find(a => String(a.id).trim() === String(newAsset.id).trim())
      ? oldAssets.map(a => a.id === newAsset.id ? newAsset : a)
      : [...oldAssets, newAsset];

    setSchoolAssets(newAssets);
    cacheService.set('schoolAssets', newAssets);
    handleShowNotification('Data aset berhasil disimpan.', 'success');

    if (isDemoMode) return;

    try {
      await apiService.saveSchoolAsset(asset);
      await fetchData(); // Refresh for server-side ID
    } catch (error) {
      setSchoolAssets(oldAssets);
      cacheService.set('schoolAssets', oldAssets);
      handleShowNotification('Gagal menyimpan data aset.', 'error');
    }
  };
  const handleDeleteSchoolAsset = async (id: string) => {
    showConfirm('Hapus data aset ini?', () => {
      const oldAssets = schoolAssets;
      const newAssets = oldAssets.filter(a => a.id !== id);
      setSchoolAssets(newAssets);
      cacheService.set('schoolAssets', newAssets);
      handleShowNotification('Data aset berhasil dihapus.', 'success');

      if (isDemoMode) return;

      apiService.deleteSchoolAsset(id).catch(() => {
        setSchoolAssets(oldAssets);
        cacheService.set('schoolAssets', oldAssets);
        handleShowNotification('Gagal menghapus data aset.', 'error');
      });
    });
  };

  const handleSavePerformanceAssessment = async (assessment: PerformanceAssessment) => {
    if (isDemoMode) {
      const exists = performanceAssessments.some(a => a.id === assessment.id);
      const newAssessments = exists
        ? performanceAssessments.map(a => a.id === assessment.id ? assessment : a)
        : [assessment, ...performanceAssessments];
      setPerformanceAssessments(newAssessments);
      cacheService.set('performanceAssessments', newAssessments);
      handleShowNotification('Penilaian disimpan (Demo).', 'success');
      return;
    }

    try {
      await apiService.savePerformanceAssessment(assessment);
      const updatedAssessments = await apiService.getPerformanceAssessments();
      setPerformanceAssessments(updatedAssessments);
      cacheService.set('performanceAssessments', updatedAssessments);
      handleShowNotification('Penilaian berhasil disimpan.', 'success');
    } catch (error) {
      handleShowNotification('Gagal menyimpan penilaian.', 'error');
    }
  };
  
  // Book Loans
  const handleSaveBookLoan = async (loan: BookLoan) => {
    const actionMsg = loan.status === 'Dipinjam' ? 'dipinjam' : 'dikembalikan';
    const optimisticId = `loan-${Date.now()}`;
    const newLoan = { ...loan, id: loan.id || optimisticId };

    const oldLoans = bookLoans;
    const newLoans = oldLoans.find(l => String(l.id).trim() === String(newLoan.id).trim())
      ? oldLoans.map(l => l.id === newLoan.id ? newLoan : l)
      : [newLoan, ...oldLoans];

    setBookLoans(newLoans);
    cacheService.set('bookLoans', newLoans);
    handleShowNotification(`Buku berhasil ${actionMsg}.`, 'success');

    if (isDemoMode) return;

    try {
      // Fetch latest inventory to ensure we don't overwrite concurrent edits
      const currentInventory = await apiService.getBookInventory(loan.classId);
      let inventoryChanged = false;

      // Logic for stock update
      const isNew = !oldLoans.find(l => l.id === loan.id);
      const oldLoan = oldLoans.find(l => l.id === loan.id);

      // Scenario 1: New Loan (Dipinjam)
      if (isNew && loan.status === 'Dipinjam') {
          loan.books.forEach(bookName => {
              const itemIndex = currentInventory.findIndex(i => i.name === bookName);
              if (itemIndex !== -1) {
                  // Decrease by 1 per book, as requested
                  currentInventory[itemIndex].stock = Math.max(0, currentInventory[itemIndex].stock - 1);
                  inventoryChanged = true;
              }
          });
      }
      // Scenario 2: Returning a Loan (Dipinjam -> Dikembalikan)
      else if (!isNew && oldLoan?.status === 'Dipinjam' && loan.status === 'Dikembalikan') {
          loan.books.forEach(bookName => {
              const itemIndex = currentInventory.findIndex(i => i.name === bookName);
              if (itemIndex !== -1) {
                  // Increase by 1 per book
                  currentInventory[itemIndex].stock = currentInventory[itemIndex].stock + 1;
                  inventoryChanged = true;
              }
          });
      }

      // Save inventory if changed
      if (inventoryChanged) {
          await apiService.saveBookInventory(currentInventory);
      }

      await apiService.saveBookLoan(loan);
      await fetchData(); // Refresh for server-side ID
    } catch (error) {
      setBookLoans(oldLoans);
      cacheService.set('bookLoans', oldLoans);
      handleShowNotification('Gagal menyimpan data peminjaman.', 'error');
    }
  };
  const handleDeleteBookLoan = async (id: string) => {
    showConfirm('Hapus data peminjaman ini?', () => {
      const oldLoans = bookLoans;
      const loanToDelete = oldLoans.find(l => l.id === id);
      const newLoans = oldLoans.filter(l => l.id !== id);
      
      setBookLoans(newLoans);
      cacheService.set('bookLoans', newLoans);
      handleShowNotification('Data peminjaman berhasil dihapus.', 'success');

      if (isDemoMode) return;

      const processDelete = async () => {
          try {
              if (loanToDelete && loanToDelete.status === 'Dipinjam') {
                  const currentInventory = await apiService.getBookInventory(loanToDelete.classId);
                  let inventoryChanged = false;
                  
                  loanToDelete.books.forEach(bookName => {
                      const itemIndex = currentInventory.findIndex(i => i.name === bookName);
                      if (itemIndex !== -1) {
                          // Increase by 1 per book
                          currentInventory[itemIndex].stock = currentInventory[itemIndex].stock + 1;
                          inventoryChanged = true;
                      }
                  });

                  if (inventoryChanged) {
                      await apiService.saveBookInventory(currentInventory);
                  }
              }
              
              await apiService.deleteBookLoan(id);
              await fetchData(); // Refresh data
          } catch (error) {
              setBookLoans(oldLoans);
              cacheService.set('bookLoans', oldLoans);
              handleShowNotification('Gagal menghapus data peminjaman.', 'error');
          }
      };

      processDelete();
    });
  };

  const fetchData = async (forceRefresh = false, silent = false) => {
    if (!currentUser) return;

    const isCacheEmpty = !cacheService.get('students');
    if ((isCacheEmpty || forceRefresh) && !silent) {
      setLoading(true);
    }
    setError(null);
    setIsDemoMode(false);

    // Pastikan loading tampil minimal 1 detik agar transisi halus
    const minDelay = !silent ? new Promise(resolve => setTimeout(resolve, 1000)) : Promise.resolve();

    if (!apiService.isConfigured()) {
      setStudents(MOCK_STUDENTS);
      setExtracurriculars(MOCK_EXTRACURRICULARS);
      setAgendas([]);
      setTeacherProfile({name: 'Budi Santoso (Demo)', nip:'123', email:'demo@guru.com', phone:'-', address:''});
      setIsDemoMode(true);
      await minDelay;
      if (!silent) setLoading(false);
      handleShowNotification("Mode Demo Aktif: Backend belum dikonfigurasi.", "warning");
      return;
    }

    try {
      const classIdToFetch = activeClassId;

      const promises: Promise<any>[] = [
        currentUser?.role === 'admin' || currentUser?.role === 'Kepala Sekolah' || currentUser?.role === 'guru' ? apiService.getUsers(currentUser) : Promise.resolve([]),
        apiService.getStudents(currentUser),
        apiService.getAgendas(currentUser),
        apiService.getMaterials(classIdToFetch),
        apiService.getGrades(currentUser),
        apiService.getCounselingLogs(currentUser),
        apiService.getExtracurriculars(currentUser),
        apiService.getProfiles(),
        apiService.getHolidays(currentUser),
        apiService.getAttendance(currentUser),
        apiService.getSikapAssessments(currentUser),
        apiService.getKarakterAssessments(currentUser),
        apiService.getEmploymentLinks(),
        apiService.getLearningReports(classIdToFetch),
        apiService.getLearningDocumentation(classIdToFetch),
        apiService.getLiaisonLogs(currentUser), 
        apiService.getPermissionRequests(currentUser),
        apiService.getSupportDocuments(currentUser),
        apiService.getBookLoans(currentUser),
        apiService.getSumatifs(classIdToFetch),
        apiService.getPerformanceAssessments(),
        apiService.getClassConfig(classIdToFetch),
        apiService.getGtkData(),
      ];

      // Add inventory fetch if admin/Kepala Sekolah
      if (currentUser?.role === 'admin' || currentUser?.role === 'Kepala Sekolah') {
          promises.push(apiService.getInventory('ALL'));
      } else {
          promises.push(Promise.resolve([]));
      }

      // Add School Assets Fetch
      if (currentUser?.role === 'admin' || currentUser?.role === 'Kepala Sekolah') {
          promises.push(apiService.getSchoolAssets());
      } else {
          promises.push(Promise.resolve([]));
      }

      // Add BOS Fetch
      if (currentUser?.role === 'admin' || currentUser?.role === 'Kepala Sekolah') {
          promises.push(apiService.getBOS());
      } else {
          promises.push(Promise.resolve([]));
      }

      // Add minDelay to ensure at least 1s loading
      promises.push(minDelay);

      const results = await Promise.all(promises.map(p => p.catch(e => {
          console.warn("Individual fetch error:", e);
          return null; // Return null to indicate failure
      })));
      
      const [
          fUsers, fStudents, fAgendas, fMaterials, fGrades, fCounseling, fExtracurriculars, 
          fProfiles, fHolidays, fAttendance, fSikap, fKarakter, fLinks, fReports, 
          fLearningDocs, fLiaison, fPermissions, fSupportDocs, fBookLoans, fSumatifs, fPerformanceAssessments, fClassConfig, fGtkData, fInventory, fSchoolAssets, fBOS,
          _delay // Placeholder for minDelay
      ] = results;
      
      if (fUsers !== null) setUsers(Array.isArray(fUsers) ? fUsers as User[] : []);
      if (fStudents !== null) setStudents(Array.isArray(fStudents) ? (fStudents as Student[]).sort((a,b) => a.name.localeCompare(b.name)) : []);
      if (fAgendas !== null) setAgendas(Array.isArray(fAgendas) ? (fAgendas as AgendaItem[]).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()) : []);
      console.log("Fetched materials:", fMaterials);
      if (fMaterials !== null) setMaterials(Array.isArray(fMaterials) ? fMaterials as Material[] : []);
      if (fGrades !== null) setGrades(Array.isArray(fGrades) ? fGrades as GradeRecord[] : []);
      if (fCounseling !== null) setCounselingLogs(Array.isArray(fCounseling) ? (fCounseling as BehaviorLog[]).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()) : []);
      if (fHolidays !== null) setHolidays(Array.isArray(fHolidays) ? (fHolidays as Holiday[]).sort((a,b) => a.date.localeCompare(b.date)) : []);
      if (fAttendance !== null) setAllAttendanceRecords(Array.isArray(fAttendance) ? fAttendance as any[] : []);
      if (fSikap !== null) setSikapAssessments(Array.isArray(fSikap) ? fSikap as SikapAssessment[] : []);
      if (fKarakter !== null) setKarakterAssessments(Array.isArray(fKarakter) ? fKarakter as KarakterAssessment[] : []);
      if (fLinks !== null) setEmploymentLinks(Array.isArray(fLinks) ? fLinks as EmploymentLink[] : []);
      if (fReports !== null) setLearningReports(Array.isArray(fReports) ? fReports as LearningReport[] : []);
      if (fLearningDocs !== null) setLearningDocumentation(Array.isArray(fLearningDocs) ? fLearningDocs as LearningDocumentation[] : []);
      if (fLiaison !== null) setLiaisonLogs(Array.isArray(fLiaison) ? fLiaison as LiaisonLog[] : []);
      if (fSupportDocs !== null) setSupportDocuments(Array.isArray(fSupportDocs) ? fSupportDocs as SupportDocument[] : []);
      if (fBookLoans !== null) setBookLoans(Array.isArray(fBookLoans) ? fBookLoans as BookLoan[] : []);
      if (fPerformanceAssessments !== null) {
        setPerformanceAssessments(Array.isArray(fPerformanceAssessments) ? fPerformanceAssessments as PerformanceAssessment[] : []);
        cacheService.set('performanceAssessments', fPerformanceAssessments);
      }
      if (fSumatifs !== null) {
        const sumatifsData = Array.isArray(fSumatifs) ? fSumatifs as Sumatif[] : [];
        setSumatifs(sumatifsData);
        cacheService.set('sumatifs', sumatifsData);
      }
      
      // Set global inventory state
      if (fInventory !== null && Array.isArray(fInventory)) {
          setInventory(fInventory as InventoryItem[]);
      }

      // Set global school assets state
      if (fSchoolAssets !== null && Array.isArray(fSchoolAssets)) {
          setSchoolAssets(fSchoolAssets as SchoolAsset[]);
      }

      // Set BOS state
      if (fBOS !== null && Array.isArray(fBOS)) {
          setBosTransactions(fBOS as BOSTransaction[]);
      }

      if (fGtkData !== null && Array.isArray(fGtkData)) {
          setGtkData(fGtkData as GtkRecord[]);
          cacheService.set('gtkData', fGtkData);
      }

      if (fClassConfig !== null) {
          const fetchedKktp = fClassConfig?.KKTP || fClassConfig?.kktp;
          if (fetchedKktp && Object.keys(fetchedKktp).length > 0) {
            setKktpMap(fetchedKktp);
            console.log("KKTP Map set from fetched config:", fetchedKktp);
          } else {
            const defaults: Record<string, number> = {};
            MOCK_SUBJECTS.forEach(s => { defaults[s.id] = s.kkm; });
            setKktpMap(defaults);
            console.log("KKTP Map set to defaults:", defaults);
          }
      }
      
      if (fPermissions !== null && fStudents !== null) {
          const hydratedPermissions = (fPermissions as PermissionRequest[]).map((p: any) => ({
              ...p,
              studentName: (fStudents as Student[]).find((s: Student) => String(s.id).trim() === String(p.studentId).trim())?.name || 'Siswa Tidak Dikenal'
          }));
          setPermissionRequests(hydratedPermissions);
          cacheService.set('permissionRequests', hydratedPermissions);
      }

      // Cache the new data (only if not null)
      if (fUsers !== null) cacheService.set('users', fUsers as User[]);
      if (fStudents !== null) cacheService.set('students', fStudents as Student[]);
      if (fAgendas !== null) cacheService.set('agendas', (fAgendas as AgendaItem[]).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      if (fGrades !== null) cacheService.set('grades', fGrades as GradeRecord[]);
      if (fCounseling !== null) cacheService.set('counselingLogs', (fCounseling as BehaviorLog[]).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      if (fHolidays !== null) cacheService.set('holidays', (fHolidays as Holiday[]).sort((a,b) => a.date.localeCompare(b.date)));
      if (fAttendance !== null) cacheService.set('allAttendanceRecords', fAttendance as any[]);
      if (fSikap !== null) cacheService.set('sikapAssessments', fSikap as SikapAssessment[]);
      if (fKarakter !== null) cacheService.set('karakterAssessments', fKarakter as KarakterAssessment[]);
      if (fLinks !== null) cacheService.set('employmentLinks', fLinks as EmploymentLink[]);
      if (fReports !== null) cacheService.set('learningReports', fReports as LearningReport[]);
      if (fLearningDocs !== null) cacheService.set('learningDocumentation', fLearningDocs as LearningDocumentation[]);
      if (fLiaison !== null) cacheService.set('liaisonLogs', fLiaison as LiaisonLog[]);
      if (fSupportDocs !== null) cacheService.set('supportDocuments', fSupportDocs as SupportDocument[]);
      if (fInventory !== null) cacheService.set('inventory', fInventory as InventoryItem[]);
      if (fSchoolAssets !== null) cacheService.set('schoolAssets', fSchoolAssets as SchoolAsset[]);
      if (fBOS !== null) cacheService.set('bosTransactions', fBOS as BOSTransaction[]);
      if (fBookLoans !== null) cacheService.set('bookLoans', fBookLoans as BookLoan[]);
      if (fMaterials !== null) cacheService.set('materials', fMaterials as Material[]);
      
      if (fExtracurriculars !== null) {
          setExtracurriculars(Array.isArray(fExtracurriculars) ? fExtracurriculars as Extracurricular[] : []);
          cacheService.set('extracurriculars', Array.isArray(fExtracurriculars) ? fExtracurriculars as Extracurricular[] : []);
      }
      
      const profilesTyped = (fProfiles || {}) as { teacher?: TeacherProfileData, school?: SchoolProfileData };

      if (profilesTyped.teacher) {
          setTeacherProfile(prev => {
              const res = {
                  ...prev,
                  ...profilesTyped.teacher
              };
              localStorage.setItem('teacher_profile_cache', JSON.stringify(res));
              return res;
          });
      }

      if (currentUser) {
          setTeacherProfile(prev => {
              const res = {
                  ...prev,
                  name: (currentUser.fullName && currentUser.fullName !== 'undefined') ? currentUser.fullName : (prev.name || 'Guru'),
                  nip: currentUser.nip || prev.nip,
                  nuptk: currentUser.nuptk || prev.nuptk,
                  position: currentUser.position,
                  teachingClass: currentUser.classId || prev.teachingClass,
                  birthPlace: currentUser.birthPlace || prev.birthPlace,
                  birthDate: currentUser.birthDate || prev.birthDate,
                  education: currentUser.education || prev.education,
                  rank: currentUser.rank || prev.rank,
                  email: currentUser.email || prev.email,
                  phone: currentUser.phone || prev.phone,
                  address: currentUser.address || prev.address,
                  photo: currentUser.photo || prev.photo,
                  signature: currentUser.signature || prev.signature
              };
              localStorage.setItem('teacher_profile_cache', JSON.stringify(res));
              return res;
          });
      }

      if(profilesTyped.school) {
          setSchoolProfile(prev => {
              const res = {
                  ...prev,
                  ...profilesTyped.school,
                  developerInfo: { 
                      name: profilesTyped.school?.developerInfo?.name || prev.developerInfo?.name || '',
                      moto: profilesTyped.school?.developerInfo?.moto || prev.developerInfo?.moto || '',
                      photo: profilesTyped.school?.developerInfo?.photo || prev.developerInfo?.photo || '',
                      whatsapp: profilesTyped.school?.developerInfo?.whatsapp || prev.developerInfo?.whatsapp || '',
                      facebook: profilesTyped.school?.developerInfo?.facebook || prev.developerInfo?.facebook || '',
                      instagram: profilesTyped.school?.developerInfo?.instagram || prev.developerInfo?.instagram || '',
                      tiktok: profilesTyped.school?.developerInfo?.tiktok || prev.developerInfo?.tiktok || '',
                      email: profilesTyped.school?.developerInfo?.email || prev.developerInfo?.email || ''
                  }
              };
              localStorage.setItem('school_profile_cache', JSON.stringify(res));
              return res;
          });
      }

      lastFetchTimeRef.current = Date.now();
    } catch (err: any) {
      console.warn("Gagal memuat data:", err);
      handleShowNotification("Gagal terhubung ke server. Mode Offline (Data Kosong).", 'warning');
      setError(null);
      setStudents([]);
      setExtracurriculars([]);
      setTeacherProfile({name: 'Guru (Offline)', nip:'', email:'', phone:'', address:''});
      setIsDemoMode(true);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
       fetchData();
    }
  }, [currentUser, activeClassId]);

  useEffect(() => {
    if (currentUser) {
       // Check for new messages in liaisonLogs
       const pendingLiaison = liaisonLogs.filter(log => 
         log.sender === 'Wali Murid' && 
         (log.status === 'Pending' || !log.status) &&
         (currentUser.role === 'admin' || log.classId === currentUser.classId)
       );

       if (pendingLiaison.length > 0) {
           setHasNewMessages(true);
           setUnreadMessageCount(pendingLiaison.length);
       } else {
           setHasNewMessages(false);
           setUnreadMessageCount(0);
       }
    }
  }, [currentUser, activeClassId, liaisonLogs]);

  if (!currentUser) {
      return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const isStudentRole = currentUser.role === 'siswa';
  const isAdminRole = currentUser.role === 'admin';
  const isSupervisor = currentUser.role === 'Kepala Sekolah';
  
  const canViewGraduates = isSupervisor || isAdminRole || (currentUser.role === 'guru' && (currentUser.position?.toLowerCase() || '').includes('kelas 6'));

  const myStudentData = isStudentRole 
    ? (students.find(s => String(s.id).trim() === String(currentUser.studentId).trim()) || null)
    : null;

  const getProfilePhoto = () => {
    if (isStudentRole) {
      const studentPhoto = currentUser?.photo || myStudentData?.photo;
      if (studentPhoto && studentPhoto.trim() !== '' && !studentPhoto.startsWith('ERROR')) {
        return studentPhoto;
      }
      const studentGender = myStudentData?.gender || 'L';
      const studentName = myStudentData?.name || currentUser?.fullName || 'User';
      return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(studentName)}${studentGender === 'L' ? 'male' : 'female'}`;
    } else {
      const teacherPhoto = currentUser?.photo || teacherProfile?.photo;
      if (teacherPhoto && teacherPhoto.trim() !== '' && !teacherPhoto.startsWith('ERROR')) {
        return teacherPhoto;
      }
    }
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(currentUser?.fullName || 'User')}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[80vh] text-gray-500 animate-fade-in overflow-hidden relative">
         <div className="relative w-24 h-24 flex items-center justify-center mb-6 animate-bounce">
            <div className="absolute inset-0 bg-[#A0DEFF]/30 rounded-full blur-2xl opacity-60 animate-pulse"></div>
            <img 
              src="https://www.image2url.com/r2/default/images/1776528081180-f5356afe-2059-4426-8309-4f5af1b9227e.png" 
              alt="Logo SAGARA" 
              className="w-full h-full object-contain drop-shadow-xl"
            />
         </div>
         <h2 className="text-xl font-bold text-slate-700 mb-2">Menyiapkan Data Kelas...</h2>
         <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-[#5AB2FF] rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-2 h-2 bg-[#5AB2FF] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-[#5AB2FF] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
         </div>
      </div>
    );
  }


  return (
    <div className="flex h-screen bg-white overflow-hidden font-sans text-slate-800">
      {currentUser && <EmergencyAlert currentUser={currentUser} />}
      {!isStudentRole && (
        <Sidebar 
          currentUser={currentUser}
          currentView={currentView} 
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onLogout={handleLogout}
        />
      )}

      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <div className="absolute inset-0 z-[-10] flex items-center justify-center pointer-events-none overflow-hidden">
            <img 
              src="https://www.image2url.com/r2/default/images/1776528081180-f5356afe-2059-4426-8309-4f5af1b9227e.png"
              alt="Watermark"
              className="w-[500px] h-[500px] object-contain opacity-5"
            />
        </div>

        <header className="bg-white/80 backdrop-blur-md border-b border-[#CAF4FF] h-16 flex items-center justify-between px-3 md:px-4 lg:px-8 z-20 shrink-0 sticky top-0 no-print">
          <div className="flex items-center gap-1.5 sm:gap-4 min-w-0 flex-1 mr-2">
            {!isStudentRole && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 -ml-2 rounded-lg lg:hidden hover:bg-[#CAF4FF] text-gray-600 transition-colors shrink-0"
              >
                <Menu size={24} />
              </button>
            )}
            <div className={`flex items-center gap-2 lg:hidden shrink-0 ${currentUser?.role === 'superadmin' ? 'hidden xs:flex' : ''}`}>
                <img 
                    src="https://www.image2url.com/r2/default/images/1776528081180-f5356afe-2059-4426-8309-4f5af1b9227e.png" 
                    alt="Logo SAGARA"
                    className="h-8 w-8 object-contain"
                />
            </div>

            {canSelectClass && (
                <div className="hidden lg:flex items-center bg-[#CAF4FF]/30 border border-[#A0DEFF]/50 rounded-lg px-3 py-1.5 shadow-sm">
                    <Filter size={14} className="text-[#5AB2FF] mr-2" />
                    <span className="text-xs font-bold text-gray-50 uppercase mr-2">Pilih Kelas:</span>
                    <select 
                        value={selectedClassId} 
                        onChange={(e) => setSelectedClassId(e.target.value)}
                        className="bg-transparent text-sm font-bold text-[#5AB2FF] outline-none cursor-pointer"
                    >
                        {availableClasses.map(cls => (
                            <option key={cls} value={cls}>Kelas {cls}</option>
                        ))}
                    </select>
                </div>
            )}

            {currentUser?.role === 'superadmin' && (
                <div className="flex items-center bg-indigo-50 border border-indigo-200 rounded-lg px-1.5 py-1 sm:px-3 sm:py-1.5 shadow-sm min-w-0 max-w-[150px] xs:max-w-[180px] sm:max-w-[240px] md:max-w-xs">
                    <Database size={14} className="text-indigo-600 mr-1 md:mr-2 shrink-0 animate-pulse" />
                    <span className="text-xs font-bold text-indigo-700 uppercase mr-1 md:mr-2 hidden md:inline shrink-0">Sekolah:</span>
                    <select 
                        value={selectedSchoolDbId} 
                        onChange={(e) => handleSwitchSchoolDb(e.target.value)}
                        className="bg-transparent text-[11px] md:text-sm font-bold text-indigo-800 outline-none cursor-pointer truncate max-w-full"
                    >
                        <option value="">Pusat (Default)</option>
                        {schoolsList.map(sch => (
                            <option key={sch.id} value={sch.id}>
                                {sch.school_name || 'Dinas Pendidikan'}
                            </option>
                        ))}
                    </select>
                </div>
            )}
          </div>

          <div className="flex items-center space-x-1.5 sm:space-x-4 shrink-0">
             {!isStudentRole && (
                 <div className="flex items-center space-x-1 sm:space-x-2">
                     {/* Liaison Notification Paper Plane */}
                     <button 
                        onClick={() => navigate('/buku-penghubung')}
                        className={`p-1.5 sm:p-2 rounded-full transition-all relative ${
                            unreadLiaisonCount > 0 
                            ? 'text-purple-500 bg-purple-50 animate-vibrate' 
                            : 'text-gray-500 hover:text-purple-500 hover:bg-purple-50'
                        }`}
                        title="Buku Penghubung"
                     >
                         <PaperPlaneIcon size={20} color={unreadLiaisonCount > 0 ? "#8B5CF6" : "currentColor"} />
                         {unreadLiaisonCount > 0 && (
                             <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">
                                 {unreadLiaisonCount}
                             </span>
                         )}
                     </button>

                     {/* Permission Notification Bell */}
                     <button 
                        onClick={() => setIsPermissionModalOpen(true)}
                        className="p-1.5 sm:p-2 text-gray-500 hover:text-[#5AB2FF] hover:bg-[#CAF4FF]/50 rounded-full transition-colors relative"
                        title="Izin & Sakit"
                     >
                         <Bell size={20} />
                         {pendingPermissions.length > 0 && (
                             <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                         )}
                     </button>

                     {/* Service Info Button */}
                     {currentUser && (
                         <ServiceInfo 
                             currentUser={currentUser} 
                             onShowNotification={handleShowNotification} 
                             trigger={
                                 <button 
                                     className="p-1.5 sm:p-2 text-gray-500 hover:text-[#5AB2FF] hover:bg-[#CAF4FF]/50 rounded-full transition-colors"
                                     title="Informasi Layanan"
                                 >
                                     <Info size={20} />
                                 </button>
                             }
                         />
                     )}
                 </div>
             )}

             {isDemoMode && (
               <div className="hidden lg:flex items-center text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full mr-2">
                 <WifiOff size={14} className="mr-1.5" /> Offline Mode
               </div>
             )}
             <button onClick={() => fetchData(true)} className="p-1.5 sm:p-2 text-gray-400 hover:text-[#5AB2FF] rounded-full hover:bg-[#CAF4FF]/50" title="Refresh Data">
               <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
             </button>

             <div className="relative" ref={profileDropdownRef}>
                <button 
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    className="flex items-center space-x-1 sm:space-x-2 bg-[#CAF4FF]/30 hover:bg-[#CAF4FF] p-1 sm:p-1.5 rounded-full transition-colors border border-[#A0DEFF]/30 shrink-0"
                >
                    <div className="w-8 h-8 rounded-full bg-white border-2 border-white overflow-hidden">
                        <img 
                          src={getProfilePhoto()} 
                          alt="Avatar" 
                          className="w-full h-full object-cover object-top" 
                        />
                    </div>
                    <div className="hidden md:flex flex-col items-start mr-2">
                        <span className="text-xs font-bold text-[#5AB2FF]">{currentUser?.fullName}</span>
                        <span className="text-[10px] text-gray-500 capitalize">{currentUser?.role}</span>
                    </div>
                    <ChevronDown size={16} className={`text-gray-400 transition-transform duration-300 hidden md:block ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isProfileDropdownOpen && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-[#CAF4FF] overflow-hidden animate-fade-in-up z-20">
                        <div className="p-2">
                            {!isStudentRole && (
                                <button 
                                    onClick={() => { navigate('/profil'); setIsProfileDropdownOpen(false); }}
                                    className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-[#CAF4FF]/50"
                                >
                                    <UserCog size={16} />
                                    <span>Profil {isAdminRole ? 'Sekolah' : 'Guru'}</span>
                                </button>
                            )}
                            <button 
                                onClick={() => { setIsChangePasswordOpen(true); setIsProfileDropdownOpen(false); }}
                                className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-[#CAF4FF]/50"
                            >
                                <Lock size={16} className="text-slate-500" />
                                <span>Ubah Password</span>
                            </button>
                            <button 
                                onClick={handleLogout}
                                className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50"
                            >
                                <LogOut size={16} />
                                <span>Keluar</span>
                            </button>
                        </div>
                    </div>
                )}
             </div>

          </div>
        </header>

        {canSelectClass && (
            <div className="lg:hidden bg-white border-b px-4 py-2 flex items-center justify-center shadow-sm relative z-20">
                <span className="text-xs font-bold text-gray-500 uppercase mr-2">Kelas Aktif:</span>
                <select 
                    value={selectedClassId} 
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="bg-[#CAF4FF]/50 border border-[#A0DEFF] rounded px-2 py-1 text-sm font-bold text-[#5AB2FF] outline-none"
                >
                    {availableClasses.map(cls => (
                        <option key={cls} value={cls}>Kelas {cls}</option>
                    ))}
                </select>
            </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 lg:p-8 pb-24 lg:pb-8 scroll-smooth print:p-0 relative">
           <div className="max-w-[1440px] mx-auto print:w-full">
             {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between no-print">
                   <span className="text-sm flex items-center"><AlertCircle size={16} className="mr-2" /> {error}</span>
                   <button onClick={() => setError(null)} className="text-red-500 font-bold">&times;</button>
                </div>
             )}
             
              <Routes>
                <Route path="/" element={<Navigate to={isStudentRole ? "/dashboard-student" : "/dashboard"} replace />} />
                
                <Route path="/dashboard" element={
                    isStudentRole ? <Navigate to="/dashboard-student" replace /> :
                    <DashboardContainer
                        currentUser={currentUser}
                        isStudentRole={isStudentRole}
                        isSupervisor={isSupervisor}
                        myStudentData={myStudentData}
                        allAttendanceRecords={allAttendanceRecords}
                        grades={grades}
                        liaisonLogs={liaisonLogs}
                        filteredCounseling={filteredCounseling}
                        counselingLogs={counselingLogs}
                        permissionRequests={permissionRequests}
                        karakterAssessments={karakterAssessments}
                        onSavePermission={handleSavePermissionRequest}
                        onSaveLiaison={handleSaveLiaison}
                        onSaveKarakter={handleSaveKarakter}
                        onUpdateStudent={handleUpdateStudent}
                        students={students}
                        users={users}
                        extracurriculars={extracurriculars}
                        inventory={inventory}
                        schoolAssets={schoolAssets}
                        bosTransactions={bosTransactions}
                        filteredStudents={filteredStudents}
                        filteredAgendas={filteredAgendas}
                        filteredAttendance={filteredAttendance}
                        holidays={filteredHolidays}
                        teacherProfile={teacherProfile}
                        activeClassId={activeClassId}
                        adminCompleteness={adminPercentage}
                        employmentLinks={employmentLinks}
                        pendingPermissions={pendingPermissions}
                        onOpenPermissionModal={() => setIsPermissionModalOpen(true)}
                        schoolProfile={schoolProfile}
                        learningDocumentation={filteredLearningDocumentation}
                        learningReports={filteredReports}
                        hasNewMessages={hasNewMessages}
                        unreadMessageCount={unreadMessageCount}
                        bookLoans={bookLoans}
                        subjects={MOCK_SUBJECTS}
                        kktpMap={kktpMap}
                        materials={materials}
                        gtkData={gtkData}
                        performanceAssessments={performanceAssessments}
                        onSavePerformanceAssessment={handleSavePerformanceAssessment}
                    />
                } />
                
                {/* Student specific routes */}
                {isStudentRole && (
                    <>
                        <Route path="/dashboard-student" element={
                            <DashboardContainer
                                currentUser={currentUser}
                                isStudentRole={true}
                                isSupervisor={false}
                                myStudentData={myStudentData}
                                allAttendanceRecords={allAttendanceRecords}
                                grades={grades}
                                liaisonLogs={liaisonLogs}
                                filteredCounseling={filteredCounseling}
                                permissionRequests={permissionRequests}
                                karakterAssessments={karakterAssessments}
                                onSavePermission={handleSavePermissionRequest}
                                onSaveLiaison={handleSaveLiaison}
                                onSaveKarakter={handleSaveKarakter}
                                onUpdateStudent={handleUpdateStudent}
                                students={students}
                                users={users}
                                extracurriculars={extracurriculars}
                                inventory={inventory}
                                schoolAssets={schoolAssets}
                                bosTransactions={bosTransactions}
                                filteredStudents={filteredStudents}
                                filteredAgendas={filteredAgendas}
                                filteredAttendance={filteredAttendance}
                                holidays={filteredHolidays}
                                teacherProfile={teacherProfile}
                                activeClassId={activeClassId}
                                adminCompleteness={adminPercentage}
                                employmentLinks={employmentLinks}
                                pendingPermissions={pendingPermissions}
                                onOpenPermissionModal={() => setIsPermissionModalOpen(true)}
                                schoolProfile={schoolProfile}
                                learningDocumentation={filteredLearningDocumentation}
                                learningReports={filteredReports}
                                hasNewMessages={hasNewMessages}
                                unreadMessageCount={unreadMessageCount}
                                bookLoans={bookLoans}
                                subjects={MOCK_SUBJECTS}
                                kktpMap={kktpMap}
                                materials={materials}
                            />
                        } />
                        <Route path="/ringkasan" element={<Navigate to="/dashboard-student" replace />} />
                        <Route path="/jadwal-pelajaran" element={
                            <DashboardContainer isStudentRole={true} isSupervisor={false} myStudentData={myStudentData} allAttendanceRecords={allAttendanceRecords} grades={grades} liaisonLogs={liaisonLogs} filteredCounseling={filteredCounseling} permissionRequests={permissionRequests} karakterAssessments={karakterAssessments} onSavePermission={handleSavePermissionRequest} onSaveLiaison={handleSaveLiaison} onSaveKarakter={handleSaveKarakter} onUpdateStudent={handleUpdateStudent} students={students} users={users} extracurriculars={extracurriculars} inventory={inventory} schoolAssets={schoolAssets} bosTransactions={bosTransactions} filteredStudents={filteredStudents} filteredAgendas={filteredAgendas} filteredAttendance={filteredAttendance} holidays={filteredHolidays} teacherProfile={teacherProfile} activeClassId={activeClassId} adminCompleteness={adminPercentage} employmentLinks={employmentLinks} pendingPermissions={pendingPermissions} onOpenPermissionModal={() => setIsPermissionModalOpen(true)} schoolProfile={schoolProfile} learningDocumentation={filteredLearningDocumentation} learningReports={filteredReports} hasNewMessages={hasNewMessages} unreadMessageCount={unreadMessageCount} bookLoans={bookLoans} subjects={MOCK_SUBJECTS} kktpMap={kktpMap} materials={materials} />
                        } />
                        <Route path="/izin-absensi" element={
                            <DashboardContainer isStudentRole={true} isSupervisor={false} myStudentData={myStudentData} allAttendanceRecords={allAttendanceRecords} grades={grades} liaisonLogs={liaisonLogs} filteredCounseling={filteredCounseling} permissionRequests={permissionRequests} karakterAssessments={karakterAssessments} onSavePermission={handleSavePermissionRequest} onSaveLiaison={handleSaveLiaison} onSaveKarakter={handleSaveKarakter} onUpdateStudent={handleUpdateStudent} students={students} users={users} extracurriculars={extracurriculars} inventory={inventory} schoolAssets={schoolAssets} bosTransactions={bosTransactions} filteredStudents={filteredStudents} filteredAgendas={filteredAgendas} filteredAttendance={filteredAttendance} holidays={filteredHolidays} teacherProfile={teacherProfile} activeClassId={activeClassId} adminCompleteness={adminPercentage} employmentLinks={employmentLinks} pendingPermissions={pendingPermissions} onOpenPermissionModal={() => setIsPermissionModalOpen(true)} schoolProfile={schoolProfile} learningDocumentation={filteredLearningDocumentation} learningReports={filteredReports} hasNewMessages={hasNewMessages} unreadMessageCount={unreadMessageCount} bookLoans={bookLoans} subjects={MOCK_SUBJECTS} kktpMap={kktpMap} materials={materials} />
                        } />
                        <Route path="/materi-belajar" element={
                            <DashboardContainer isStudentRole={true} isSupervisor={false} myStudentData={myStudentData} allAttendanceRecords={allAttendanceRecords} grades={grades} liaisonLogs={liaisonLogs} filteredCounseling={filteredCounseling} permissionRequests={permissionRequests} karakterAssessments={karakterAssessments} onSavePermission={handleSavePermissionRequest} onSaveLiaison={handleSaveLiaison} onSaveKarakter={handleSaveKarakter} onUpdateStudent={handleUpdateStudent} students={students} users={users} extracurriculars={extracurriculars} inventory={inventory} schoolAssets={schoolAssets} bosTransactions={bosTransactions} filteredStudents={filteredStudents} filteredAgendas={filteredAgendas} filteredAttendance={filteredAttendance} holidays={filteredHolidays} teacherProfile={teacherProfile} activeClassId={activeClassId} adminCompleteness={adminPercentage} employmentLinks={employmentLinks} pendingPermissions={pendingPermissions} onOpenPermissionModal={() => setIsPermissionModalOpen(true)} schoolProfile={schoolProfile} learningDocumentation={filteredLearningDocumentation} learningReports={filteredReports} hasNewMessages={hasNewMessages} unreadMessageCount={unreadMessageCount} bookLoans={bookLoans} subjects={MOCK_SUBJECTS} kktpMap={kktpMap} materials={materials} />
                        } />
                        <Route path="/sumatif-siswa" element={
                            <DashboardContainer isStudentRole={true} isSupervisor={false} myStudentData={myStudentData} allAttendanceRecords={allAttendanceRecords} grades={grades} liaisonLogs={liaisonLogs} filteredCounseling={filteredCounseling} permissionRequests={permissionRequests} karakterAssessments={karakterAssessments} onSavePermission={handleSavePermissionRequest} onSaveLiaison={handleSaveLiaison} onSaveKarakter={handleSaveKarakter} onUpdateStudent={handleUpdateStudent} students={students} users={users} extracurriculars={extracurriculars} inventory={inventory} schoolAssets={schoolAssets} bosTransactions={bosTransactions} filteredStudents={filteredStudents} filteredAgendas={filteredAgendas} filteredAttendance={filteredAttendance} holidays={filteredHolidays} teacherProfile={teacherProfile} activeClassId={activeClassId} adminCompleteness={adminPercentage} employmentLinks={employmentLinks} pendingPermissions={pendingPermissions} onOpenPermissionModal={() => setIsPermissionModalOpen(true)} schoolProfile={schoolProfile} learningDocumentation={filteredLearningDocumentation} learningReports={filteredReports} hasNewMessages={hasNewMessages} unreadMessageCount={unreadMessageCount} bookLoans={bookLoans} subjects={MOCK_SUBJECTS} kktpMap={kktpMap} materials={materials} />
                        } />
                        <Route path="/buku-penghubung-siswa" element={
                            <DashboardContainer isStudentRole={true} isSupervisor={false} myStudentData={myStudentData} allAttendanceRecords={allAttendanceRecords} grades={grades} liaisonLogs={liaisonLogs} filteredCounseling={filteredCounseling} permissionRequests={permissionRequests} karakterAssessments={karakterAssessments} onSavePermission={handleSavePermissionRequest} onSaveLiaison={handleSaveLiaison} onSaveKarakter={handleSaveKarakter} onUpdateStudent={handleUpdateStudent} students={students} users={users} extracurriculars={extracurriculars} inventory={inventory} schoolAssets={schoolAssets} bosTransactions={bosTransactions} filteredStudents={filteredStudents} filteredAgendas={filteredAgendas} filteredAttendance={filteredAttendance} holidays={filteredHolidays} teacherProfile={teacherProfile} activeClassId={activeClassId} adminCompleteness={adminPercentage} employmentLinks={employmentLinks} pendingPermissions={pendingPermissions} onOpenPermissionModal={() => setIsPermissionModalOpen(true)} schoolProfile={schoolProfile} learningDocumentation={filteredLearningDocumentation} learningReports={filteredReports} hasNewMessages={hasNewMessages} unreadMessageCount={unreadMessageCount} bookLoans={bookLoans} subjects={MOCK_SUBJECTS} kktpMap={kktpMap} materials={materials} />
                        } />
                        <Route path="/profil-siswa" element={
                            <DashboardContainer isStudentRole={true} isSupervisor={false} myStudentData={myStudentData} allAttendanceRecords={allAttendanceRecords} grades={grades} liaisonLogs={liaisonLogs} filteredCounseling={filteredCounseling} permissionRequests={permissionRequests} karakterAssessments={karakterAssessments} onSavePermission={handleSavePermissionRequest} onSaveLiaison={handleSaveLiaison} onSaveKarakter={handleSaveKarakter} onUpdateStudent={handleUpdateStudent} students={students} users={users} extracurriculars={extracurriculars} inventory={inventory} schoolAssets={schoolAssets} bosTransactions={bosTransactions} filteredStudents={filteredStudents} filteredAgendas={filteredAgendas} filteredAttendance={filteredAttendance} holidays={filteredHolidays} teacherProfile={teacherProfile} activeClassId={activeClassId} adminCompleteness={adminPercentage} employmentLinks={employmentLinks} pendingPermissions={pendingPermissions} onOpenPermissionModal={() => setIsPermissionModalOpen(true)} schoolProfile={schoolProfile} learningDocumentation={filteredLearningDocumentation} learningReports={filteredReports} hasNewMessages={hasNewMessages} unreadMessageCount={unreadMessageCount} bookLoans={bookLoans} subjects={MOCK_SUBJECTS} kktpMap={kktpMap} materials={materials} />
                        } />
                        <Route path="/karakter-siswa" element={
                            <DashboardContainer isStudentRole={true} isSupervisor={false} myStudentData={myStudentData} allAttendanceRecords={allAttendanceRecords} grades={grades} liaisonLogs={liaisonLogs} filteredCounseling={filteredCounseling} permissionRequests={permissionRequests} karakterAssessments={karakterAssessments} onSavePermission={handleSavePermissionRequest} onSaveLiaison={handleSaveLiaison} onSaveKarakter={handleSaveKarakter} onUpdateStudent={handleUpdateStudent} students={students} users={users} extracurriculars={extracurriculars} inventory={inventory} schoolAssets={schoolAssets} bosTransactions={bosTransactions} filteredStudents={filteredStudents} filteredAgendas={filteredAgendas} filteredAttendance={filteredAttendance} holidays={filteredHolidays} teacherProfile={teacherProfile} activeClassId={activeClassId} adminCompleteness={adminPercentage} employmentLinks={employmentLinks} pendingPermissions={pendingPermissions} onOpenPermissionModal={() => setIsPermissionModalOpen(true)} schoolProfile={schoolProfile} learningDocumentation={filteredLearningDocumentation} learningReports={filteredReports} hasNewMessages={hasNewMessages} unreadMessageCount={unreadMessageCount} bookLoans={bookLoans} subjects={MOCK_SUBJECTS} kktpMap={kktpMap} materials={materials} />
                        } />
                        <Route path="/buku-panduan-siswa" element={
                            <DashboardContainer isStudentRole={true} isSupervisor={false} myStudentData={myStudentData} allAttendanceRecords={allAttendanceRecords} grades={grades} liaisonLogs={liaisonLogs} filteredCounseling={filteredCounseling} permissionRequests={permissionRequests} karakterAssessments={karakterAssessments} onSavePermission={handleSavePermissionRequest} onSaveLiaison={handleSaveLiaison} onSaveKarakter={handleSaveKarakter} onUpdateStudent={handleUpdateStudent} students={students} users={users} extracurriculars={extracurriculars} inventory={inventory} schoolAssets={schoolAssets} bosTransactions={bosTransactions} filteredStudents={filteredStudents} filteredAgendas={filteredAgendas} filteredAttendance={filteredAttendance} holidays={filteredHolidays} teacherProfile={teacherProfile} activeClassId={activeClassId} adminCompleteness={adminPercentage} employmentLinks={employmentLinks} pendingPermissions={pendingPermissions} onOpenPermissionModal={() => setIsPermissionModalOpen(true)} schoolProfile={schoolProfile} learningDocumentation={filteredLearningDocumentation} learningReports={filteredReports} hasNewMessages={hasNewMessages} unreadMessageCount={unreadMessageCount} bookLoans={bookLoans} subjects={MOCK_SUBJECTS} kktpMap={kktpMap} materials={materials} />
                        } />
                        <Route path="/pengumuman-kelulusan" element={
                            <DashboardContainer isStudentRole={true} isSupervisor={false} myStudentData={myStudentData} allAttendanceRecords={allAttendanceRecords} grades={grades} liaisonLogs={liaisonLogs} filteredCounseling={filteredCounseling} permissionRequests={permissionRequests} karakterAssessments={karakterAssessments} onSavePermission={handleSavePermissionRequest} onSaveLiaison={handleSaveLiaison} onSaveKarakter={handleSaveKarakter} onUpdateStudent={handleUpdateStudent} students={students} users={users} extracurriculars={extracurriculars} inventory={inventory} schoolAssets={schoolAssets} bosTransactions={bosTransactions} filteredStudents={filteredStudents} filteredAgendas={filteredAgendas} filteredAttendance={filteredAttendance} holidays={filteredHolidays} teacherProfile={teacherProfile} activeClassId={activeClassId} adminCompleteness={adminPercentage} employmentLinks={employmentLinks} pendingPermissions={pendingPermissions} onOpenPermissionModal={() => setIsPermissionModalOpen(true)} schoolProfile={schoolProfile} learningDocumentation={filteredLearningDocumentation} learningReports={filteredReports} hasNewMessages={hasNewMessages} unreadMessageCount={unreadMessageCount} bookLoans={bookLoans} subjects={MOCK_SUBJECTS} kktpMap={kktpMap} materials={materials} />
                        } />
                    </>
                )}

                <Route path="/siswa" element={
                    isStudentRole ? <Navigate to="/dashboard-student" replace /> :
                    <StudentList 
                        students={filteredStudents} 
                        teacherProfile={teacherProfile} 
                        schoolProfile={schoolProfile}
                        classId={activeClassId}
                        allAttendanceRecords={allAttendanceRecords}
                        onAdd={handleAddStudent}
                        onBatchAdd={handleBatchAddStudents} 
                        onUpdate={handleUpdateStudent} 
                        onDelete={handleDeleteStudent} 
                        onRemoveFiltered={(id) => {
                          setStudents(prev => {
                            const newStudents = prev.filter(s => s.id !== id);
                            cacheService.set('students', newStudents);
                            return newStudents;
                          });
                        }}
                        onShowNotification={handleShowNotification}
                        isReadOnly={isGlobalReadOnly} 
                    />
                } />
                <Route path="/data-gtk" element={
                    isStudentRole ? <Navigate to="/dashboard-student" replace /> :
                    <GtkDataView
                        gtkData={gtkData}
                        users={users}
                        currentUser={currentUser}
                        onSaveGtk={async (records) => {
                            setGtkData(records);
                            cacheService.set('gtkData', records);
                            await apiService.saveGtkData(records);
                            
                            // Synchronize with User profiles
                            const updatedUsers = [...users];
                            let usersChanged = false;
                            
                            for (const gtk of records) {
                                if (gtk.userId) {
                                    const userIdx = updatedUsers.findIndex(u => u.id === gtk.userId);
                                    if (userIdx >= 0) {
                                        const user = updatedUsers[userIdx];
                                        let userUpdated = false;
                                        
                                        if (gtk.nama && user.fullName !== gtk.nama) { user.fullName = gtk.nama; userUpdated = true; }
                                        if (gtk.foto && user.photo !== gtk.foto) { user.photo = gtk.foto; userUpdated = true; }
                                        if (gtk.jabatan && user.position !== gtk.jabatan) { user.position = gtk.jabatan; userUpdated = true; }
                                        if (gtk.pangkatGolongan && user.rank !== gtk.pangkatGolongan) { user.rank = gtk.pangkatGolongan; userUpdated = true; }
                                        if (gtk.nip && user.nip !== gtk.nip) { user.nip = gtk.nip; userUpdated = true; }
                                        if (gtk.nuptk && user.nuptk !== gtk.nuptk) { user.nuptk = gtk.nuptk; userUpdated = true; }
                                        if (gtk.emailPribadi && user.email !== gtk.emailPribadi) { user.email = gtk.emailPribadi; userUpdated = true; }
                                        if (gtk.tempatLahir && user.birthPlace !== gtk.tempatLahir) { user.birthPlace = gtk.tempatLahir; userUpdated = true; }
                                        if (gtk.tanggalLahir && user.birthDate !== gtk.tanggalLahir) { user.birthDate = gtk.tanggalLahir; userUpdated = true; }
                                        
                                        if (userUpdated) {
                                            await apiService.saveUser(user);
                                            usersChanged = true;
                                        }
                                    }
                                }
                            }
                            
                            if (usersChanged) {
                                setUsers(updatedUsers);
                                cacheService.set('users', updatedUsers);
                                if (currentUser && updatedUsers.find(u => u.id === currentUser.id)) {
                                    setCurrentUser(updatedUsers.find(u => u.id === currentUser.id) || null);
                                }
                            }
                        }}
                        onDeleteGtk={async (id) => {
                            const newGtk = gtkData.filter(g => g.id !== id);
                            setGtkData(newGtk);
                            cacheService.set('gtkData', newGtk);
                            await apiService.deleteGtkData(id);
                        }}
                        onShowNotification={handleShowNotification}
                    />
                } />
                <Route path="/data-lulusan" element={
                    !canViewGraduates ? <Navigate to={isStudentRole ? "/dashboard-student" : "/"} replace /> :
                    <GraduatesView 
                        onShowNotification={handleShowNotification}
                        isReadOnly={isGlobalReadOnly}
                        onRestore={(student) => {
                          setStudents(prev => {
                            const newStudents = [...prev, student].sort((a, b) => a.name.localeCompare(b.name));
                            cacheService.set('students', newStudents);
                            return newStudents;
                          });
                        }}
                    />
                } />
                <Route path="/absensi" element={
                    isStudentRole ? <Navigate to="/izin-absensi" replace /> :
                    <AttendanceView 
                        students={filteredStudents}
                        allStudents={students}
                        allAttendanceRecords={filteredAttendance}
                        holidays={filteredHolidays}
                        onRefreshData={fetchData}
                        onAddHoliday={handleAddHoliday}
                        onUpdateHoliday={handleUpdateHoliday}
                        onDeleteHoliday={handleDeleteHoliday}
                        isDemoMode={isDemoMode}
                        onShowNotification={handleShowNotification}
                        teacherProfile={teacherProfile}
                        schoolProfile={schoolProfile}
                        classId={activeClassId}
                        isReadOnly={isGlobalReadOnly}
                        userRole={currentUser?.role}
                        currentUser={currentUser || undefined}
                    />
                } />
                <Route path="/agenda" element={
                    isStudentRole ? <Navigate to="/jadwal-pelajaran" replace /> :
                    <AgendaView 
                        agendas={filteredAgendas}
                        onAddAgenda={handleAddAgenda}
                        onUpdateAgenda={handleUpdateAgenda}
                        onToggleAgenda={handleToggleAgenda}
                        onDeleteAgenda={handleDeleteAgenda}
                        onShowNotification={handleShowNotification}
                        classId={activeClassId}
                    />
                } />
                <Route path="/materi" element={
                    isStudentRole ? <Navigate to="/materi-belajar" replace /> :
                    <MaterialsView 
                        materials={materials}
                        subjects={MOCK_SUBJECTS}
                        currentUser={currentUser}
                        classId={activeClassId}
                        onAddMaterial={handleAddMaterial}
                        onUpdateMaterial={handleUpdateMaterial}
                        onDeleteMaterial={handleDeleteMaterial}
                        onShowNotification={handleShowNotification}
                    />
                } />
                <Route path="/nilai" element={
                    isStudentRole ? <Navigate to="/nilai-sumatif" replace /> :
                    <GradesView 
                        students={filteredStudents} 
                        initialGrades={filteredGrades} 
                        onSave={handleSaveGrade} 
                        onShowNotification={handleShowNotification} 
                        classId={activeClassId}
                        isReadOnly={isGlobalReadOnly}
                        allowedSubjects={allowedSubjects}
                        schoolProfile={schoolProfile}
                        teacherProfile={teacherProfile}
                        currentUser={currentUser}
                    />
                } />
                <Route path="/sikap" element={
                    isStudentRole ? <Navigate to="/karakter-siswa" replace /> :
                    <AttitudeView 
                        students={filteredStudents}
                        initialSikap={filteredSikap}
                        initialKarakter={filteredKarakter}
                        onSaveSikap={handleSaveSikap}
                        onSaveKarakter={handleSaveKarakter}
                        onShowNotification={handleShowNotification}
                        classId={activeClassId}
                        isReadOnly={isGlobalReadOnly}
                    />
                } />
                <Route path="/jurnal-pembelajaran" element={
                    isStudentRole ? <Navigate to="/dashboard-student" replace /> :
                    <LearningJournalView 
                        classId={activeClassId}
                        isReadOnly={isGlobalReadOnly}
                        targetDate={journalTargetDate}
                        onSaveBatch={handleSaveJournalAndAutoReport}
                        schoolProfile={schoolProfile}
                        teacherProfile={teacherProfile}
                        currentUser={currentUser}
                        onShowNotification={handleShowNotification}
                    />
                } />
                <Route path="/rencana-pembelajaran/rpm" element={
                    isStudentRole ? <Navigate to="/dashboard-student" replace /> :
                    <LearningPlanView 
                        classId={activeClassId}
                        isReadOnly={isGlobalReadOnly}
                        schoolProfile={schoolProfile}
                        teacherProfile={teacherProfile}
                        currentUser={currentUser}
                        onShowNotification={handleShowNotification}
                        onSyncReport={handleSaveReport}
                    />
                } />
                <Route path="/rencana-pembelajaran/rpk" element={
                    isStudentRole ? <Navigate to="/dashboard-student" replace /> :
                    <KokurikulerPlanView 
                        currentUser={currentUser}
                        classId={activeClassId}
                        schoolProfile={schoolProfile}
                        teacherProfile={teacherProfile}
                        users={users}
                        onShowNotification={handleShowNotification}
                    />
                } />
                <Route path="/laporan-pembelajaran" element={
                    isStudentRole ? <Navigate to="/dashboard-student" replace /> :
                    <LearningReportsView 
                        reports={learningReports}
                        subjects={MOCK_SUBJECTS}
                        onSave={handleSaveReport}
                        onDelete={handleDeleteReport}
                        classId={activeClassId}
                        teachers={users.filter(u => u.role === 'guru')}
                        onNavigateToJournal={handleNavigateToJournal}
                        currentUser={currentUser}
                    />
                } />
                <Route path="/dokumentasi-pembelajaran" element={
                    isStudentRole ? <Navigate to="/dashboard-student" replace /> :
                    <LearningDocumentationView 
                        documentation={filteredLearningDocumentation}
                        onSave={handleSaveLearningDocumentation}
                        onDelete={handleDeleteLearningDocumentation}
                        onShowNotification={handleShowNotification}
                        classId={activeClassId}
                    />
                } />
                <Route path="/monitor-siswa" element={
                    (isStudentRole || (!isAdminRole && !isSupervisor && currentUser.role !== 'guru')) ? <Navigate to="/dashboard-student" replace /> :
                    <StudentMonitor 
                        students={filteredStudents}
                        allAttendance={allAttendanceRecords}
                        grades={filteredGrades}
                        agendas={filteredAgendas}
                        liaisonLogs={filteredLiaison}
                        onSaveLiaison={handleSaveLiaison}
                        onSavePermission={handleSavePermissionRequest}
                        onUpdateLiaisonStatus={handleUpdateLiaisonStatus}
                        classId={activeClassId}
                        onUpdateStudent={handleUpdateStudent}
                    />
                } />
                <Route path="/konseling" element={
                    isStudentRole ? <Navigate to="/karakter-siswa" replace /> :
                    <CounselingView 
                        students={filteredStudents} 
                        logs={filteredCounseling} 
                        onCreateLog={handleCreateLog} 
                        onShowNotification={handleShowNotification} 
                        classId={activeClassId}
                    />
                } />
                <Route path="/kegiatan" element={
                    isStudentRole ? <Navigate to="/Dashboard-Student" replace /> :
                    <ActivitiesView 
                        students={filteredStudents} 
                        agendas={filteredAgendas}
                        extracurriculars={filteredExtracurriculars}
                        onAddAgenda={handleAddAgenda}
                        onUpdateAgenda={handleUpdateAgenda}
                        onToggleAgenda={handleToggleAgenda}
                        onDeleteAgenda={handleDeleteAgenda}
                        onUpdateExtracurricular={handleUpdateExtracurricular}
                        onAddExtracurricular={handleAddExtracurricular}
                        onShowNotification={handleShowNotification}
                        classId={activeClassId}
                    />
                } />
                <Route path="/buku-penghubung" element={
                    isStudentRole ? <Navigate to="/buku-penghubung-siswa" replace /> :
                    <LiaisonBookView
                        logs={filteredLiaison}
                        students={students} 
                        onReply={handleSaveLiaison}
                        onUpdateStatus={handleUpdateLiaisonStatus}
                        classId={activeClassId}
                    />
                } />
                <Route path="/administrasi/kelas" element={
                    isStudentRole ? <Navigate to="/Dashboard-Student" replace /> :
                    <ClassroomAdmin 
                        students={filteredStudents} 
                        teacherProfile={teacherProfile} 
                        onShowNotification={handleShowNotification}
                        holidays={filteredHolidays}
                        onAddHoliday={handleAddHoliday}
                        classId={activeClassId}
                        userRole={currentUser.role}
                        users={users}
                        schoolProfile={schoolProfile}
                    />
                } />
                <Route path="/administrasi/peminjaman-buku" element={
                    isStudentRole ? <Navigate to="/Dashboard-Student" replace /> :
                    <BookLoanView 
                        students={filteredStudents}
                        bookLoans={bookLoans}
                        onSaveLoan={handleSaveBookLoan}
                        onDeleteLoan={handleDeleteBookLoan}
                        isDemoMode={isDemoMode}
                        classId={activeClassId}
                        onShowNotification={handleShowNotification}
                    />
                } />
                <Route path="/administrasi/sarana-prasarana" element={
                    (isStudentRole || (!isAdminRole && !isSupervisor)) ? <Navigate to="/Dashboard-Student" replace /> :
                    <SchoolAssetsAdmin 
                        assets={schoolAssets}
                        onSave={handleSaveSchoolAsset}
                        onDelete={handleDeleteSchoolAsset}
                    />
                } />
                <Route path="/administrasi/dana-bos" element={
                    (isStudentRole || (!isAdminRole && !isSupervisor)) ? <Navigate to="/Dashboard-Student" replace /> :
                    <BOSManagement
                        transactions={bosTransactions}
                        onSave={handleSaveBOS}
                        onDelete={handleDeleteBOS}
                        schoolProfile={schoolProfile}
                        isReadOnly={isSupervisor}
                    />
                } />
                <Route path="/administrasi/bukti-dukung" element={
                    isStudentRole ? <Navigate to="/Dashboard-Student" replace /> :
                    <SupportDocumentsView
                        documents={filteredSupportDocuments}
                        onSave={handleSaveSupportDocument}
                        onDelete={handleDeleteSupportDocument}
                        onShowNotification={handleShowNotification}
                        classId={activeClassId}
                        isReadOnly={isGlobalReadOnly}
                    />
                } />
                <Route path="/profil" element={
                    isStudentRole ? <Navigate to="/profil-siswa" replace /> :
                    <TeacherProfile 
                        initialTeacher={teacherProfile} 
                        initialSchool={schoolProfile} 
                        onSave={handleUpdateProfile}
                        onShowNotification={handleShowNotification}
                        userRole={currentUser?.role}
                    />
                } />
                <Route path="/manajemen-akun" element={
                    currentUser.role !== 'admin' ? <Navigate to="/" replace /> :
                    <AccountManagement
                        users={users}
                        students={students}
                        onAdd={handleAddUserAccount}
                        onBatchAdd={handleBatchAddUserAccount}
                        onUpdate={handleUpdateUserAccount}
                        onDelete={handleDeleteUserAccount}
                    />
                } />
                <Route path="/tautan-kepegawaian" element={
                    currentUser.role !== 'admin' ? <Navigate to="/" replace /> :
                    <EmploymentLinksAdmin 
                        links={employmentLinks}
                        onSave={handleSaveEmploymentLink}
                        onDelete={handleDeleteEmploymentLink}
                    />
                } />
                <Route path="/cadangan-pemulihan" element={
                    currentUser.role !== 'admin' ? <Navigate to="/" replace /> :
                    <BackupRestore 
                        data={{
                            users, students, agendas, extracurriculars, counselingLogs,
                            grades, holidays, allAttendanceRecords, sikapAssessments,
                            karakterAssessments, employmentLinks, learningReports,
                            liaisonLogs, permissionRequests, schoolProfile, schoolAssets,
                            bosTransactions, performanceAssessments
                        }} 
                        onRestore={handleRestoreData} 
                    />
                } />
                <Route path="/manajemen-database-pusat" element={
                    currentUser.role !== 'superadmin' ? <Navigate to="/" replace /> :
                    <MasterDatabaseManagement />
                } />
                <Route path="/edit-pengembang" element={
                    currentUser.role !== 'superadmin' ? <Navigate to="/" replace /> :
                    <DeveloperInfoView 
                        schoolProfile={schoolProfile}
                        onSave={handleUpdateProfile}
                        onShowNotification={handleShowNotification}
                        isAdminOrSuperadmin={currentUser.role === 'superadmin'}
                        userRole={currentUser.role}
                    />
                } />
                <Route path="/sumatif" element={
                    <SumatifView 
                        currentUser={currentUser} 
                        activeClassId={activeClassId} 
                        students={filteredStudents} 
                        onShowNotification={handleShowNotification} 
                        onRefresh={() => fetchData(true)}
                    />
                } />
                <Route path="/penilaian-kinerja" element={
                    <Navigate to="/supervisi" replace />
                } />
                <Route path="/mitigasi-bencana" element={
                    (isStudentRole ? !schoolProfile?.studentMitigationAccess : (!isAdminRole && currentUser.role !== 'guru')) ? <Navigate to="/" replace /> :
                    <MitigasiBencanaView currentUser={currentUser} />
                } />
                <Route path="/supervisi" element={
                    (!isSupervisor && !isAdminRole) ? <Navigate to="/" replace /> :
                    <SupervisorOverview
                        students={students}
                        users={users}
                        attendanceRecords={allAttendanceRecords}
                        grades={grades}
                        liaisonLogs={liaisonLogs}
                        permissionRequests={permissionRequests}
                        counselingLogs={counselingLogs}
                        extracurriculars={extracurriculars}
                        inventory={inventory} 
                        schoolAssets={schoolAssets}
                        bosTransactions={bosTransactions}
                        currentUser={currentUser}
                        activeClassId={activeClassId}
                        onShowNotification={handleShowNotification}
                        gtkData={gtkData}
                        performanceAssessments={performanceAssessments}
                        onSavePerformanceAssessment={handleSavePerformanceAssessment}
                        schoolProfile={schoolProfile}
                    />
                } />
                <Route path="/pendahuluan/*" element={
                    isStudentRole ? <Navigate to="/" replace /> :
                    <IntroductionView />
                } />
                <Route path="/manual-book" element={
                    isStudentRole ? <Navigate to="/buku-panduan-siswa" replace /> :
                    <ManualBookView
                        schoolProfile={schoolProfile}
                        onSaveProfile={async (data) => {
                            await handleUpdateProfile('school', { ...schoolProfile, ...data });
                        }}
                        isAdminRole={isAdminRole}
                    />
                } />
                <Route path="*" element={<Navigate to="/" replace />} />
             </Routes>
             <GlobalFooter />
           </div>
        </main>
      </div>

      {isPermissionModalOpen && !isStudentRole && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsPermissionModalOpen(false)}>
              <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                  <div className="p-5 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl">
                      <h3 className="font-bold text-lg text-gray-800">Permintaan Ijin / Sakit</h3>
                      <button onClick={() => setIsPermissionModalOpen(false)} className="p-1 hover:bg-gray-200 rounded-full"><X size={20}/></button>
                  </div>
                  <div className="overflow-y-auto p-0">
                      <table className="w-full text-sm text-left">
                          <thead className="bg-blue-50 text-blue-800 text-xs uppercase font-bold sticky top-0">
                              <tr>
                                  <th className="p-4">Siswa</th>
                                  <th className="p-4">Tanggal</th>
                                  <th className="p-4">Alasan</th>
                                  <th className="p-4 text-center">Aksi</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                              {pendingPermissions.length === 0 ? (
                                  <tr><td colSpan={4} className="p-6 text-center text-gray-400">Tidak ada permintaan baru.</td></tr>
                              ) : (
                                  pendingPermissions.map(req => (
                                      <tr key={req.id} className="hover:bg-gray-50">
                                          <td className="p-4">
                                              <span className="font-bold block">{req.studentName}</span>
                                              <span className="text-xs text-gray-500">Kelas {req.classId}</span>
                                          </td>
                                          <td className="p-4 whitespace-nowrap">{new Date(req.date).toLocaleDateString('id-ID')}</td>
                                          <td className="p-4 text-gray-600 italic">{req.reason}</td>
                                          <td className="p-4 flex justify-center gap-2">
                                              <button 
                                                  onClick={() => handleProcessPermission(req.id, 'approve')} 
                                                  disabled={processingPermissionId === req.id}
                                                  className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-colors"
                                                  title="Terima"
                                              >
                                                  {processingPermissionId === req.id ? <Loader2 size={16} className="animate-spin"/> : <CheckCircle size={16}/>}
                                              </button>
                                              <button 
                                                  onClick={() => handleProcessPermission(req.id, 'reject')}
                                                  disabled={processingPermissionId === req.id}
                                                  className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                                                  title="Tolak"
                                              >
                                                  <XCircle size={16}/>
                                              </button>
                                          </td>
                                      </tr>
                                  ))
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      )}

      <Notification notification={notification} onClear={() => setNotification(null)} />
      
      <CustomModal 
        isOpen={modalConfig.isOpen}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        onConfirm={modalConfig.onConfirm}
        onCancel={modalConfig.onCancel || (() => setModalConfig(prev => ({...prev, isOpen: false})))}
      />

      {/* --- FLOATING ACCESSIBILITY & ONLINE USERS WIDGET (ON ALL PAGES WHEN LOGGED IN) --- */}
      {currentUser && (
        <>
          <OnlineUsersWidget 
            currentUser={currentUser} 
            students={students} 
            ttsEnabled={schoolProfile?.ttsEnabled === true || schoolProfile?.ttsEnabled === undefined}
            pathname={location.pathname}
          />
          {/* --- TEXT TO SPEECH ACCESSIBILITY --- */}
          {(schoolProfile?.ttsEnabled === true || schoolProfile?.ttsEnabled === undefined) && (
            <TextToSpeechAccessibility pathname={location.pathname} />
          )}
        </>
      )}

      {/* --- CHANGE PASSWORD DIALOG --- */}
      {isChangePasswordOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-[#CAF4FF] overflow-hidden transform transition-all animate-scale-in">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#5AB2FF] to-[#A0DEFF] p-5 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Lock size={20} className="text-white" />
                <h3 className="text-base font-bold tracking-tight">Ubah Password Akun</h3>
              </div>
              <button 
                onClick={() => {
                  setIsChangePasswordOpen(false);
                  setOldPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setChangePasswordError('');
                }}
                className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                Pastikan password baru Anda kuat (minimal 4 karakter) dan mudah diingat agar keamanan akun Anda tetap terjaga.
              </p>

              {changePasswordError && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-semibold flex items-center space-x-2 animate-shake">
                  <AlertCircle size={16} className="shrink-0 text-red-500" />
                  <span>{changePasswordError}</span>
                </div>
              )}

              {/* Password Lama */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Password Saat Ini</label>
                <div className="relative">
                  <input 
                    type={showOldPassword ? "text" : "password"}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Masukkan password saat ini"
                    className="w-full px-4 py-2.5 pr-10 border border-slate-200 focus:border-[#5AB2FF] focus:ring-4 focus:ring-[#5AB2FF]/10 rounded-xl text-sm font-semibold outline-none transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showOldPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Password Baru */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Password Baru</label>
                <div className="relative">
                  <input 
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Masukkan password baru"
                    className="w-full px-4 py-2.5 pr-10 border border-slate-200 focus:border-[#5AB2FF] focus:ring-4 focus:ring-[#5AB2FF]/10 rounded-xl text-sm font-semibold outline-none transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Konfirmasi Password Baru */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Konfirmasi Password Baru</label>
                <div className="relative">
                  <input 
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi password baru"
                    className="w-full px-4 py-2.5 pr-10 border border-slate-200 focus:border-[#5AB2FF] focus:ring-4 focus:ring-[#5AB2FF]/10 rounded-xl text-sm font-semibold outline-none transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={changePasswordLoading}
                  onClick={() => {
                    setIsChangePasswordOpen(false);
                    setOldPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setChangePasswordError('');
                  }}
                  className="flex-1 py-2.5 text-center text-sm font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all outline-none"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={changePasswordLoading}
                  className="flex-1 py-2.5 bg-gradient-to-r from-[#5AB2FF] to-[#A0DEFF] hover:opacity-95 text-white rounded-xl text-sm font-bold shadow-lg shadow-[#5AB2FF]/20 flex items-center justify-center transition-all outline-none disabled:opacity-50"
                >
                  {changePasswordLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin mr-2" />
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan Password'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MOBILE BOTTOM NAVIGATION (Staff/Admin/Supervisor) - User Request 4/30 --- */}
      {!isStudentRole && (
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white/95 backdrop-blur-xl border-t border-[#CAF4FF] flex justify-around items-center px-1 py-1 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] h-16 pb-safe">
              {[
                  { id: 'dashboard', label: 'Beranda', icon: LayoutDashboard, path: '/dashboard' },
                  { id: 'absensi', label: 'Absensi', icon: CalendarCheck, path: '/absensi?scan=true' },
                  { id: 'profile-center', label: 'Profil', icon: null, isProfile: true }, 
                  { id: 'jurnal', label: 'Jurnal', icon: ClipboardList, path: '/jurnal-pembelajaran' },
                  { id: 'nilai', label: 'Nilai', icon: FileText, path: '/nilai' }
              ].map((item) => {
                  if (item.isProfile) {
                    return (
                      <div key="profile-center" className="relative flex flex-col items-center flex-1">
                        <button
                            onClick={() => navigate('/profil')}
                            className="w-14 h-14 rounded-full border-4 border-white bg-[#5AB2FF] shadow-lg flex items-center justify-center overflow-hidden transition-transform active:scale-95 absolute -top-11 z-20"
                        >
                            <img 
                              src={getProfilePhoto()} 
                              alt="Profile" 
                              className="w-full h-full object-cover object-top"
                            />
                        </button>
                      </div>
                    );
                  }
                  
                  const Icon = item.icon!;
                  const isActive = location.pathname === item.path;
                  
                  return (
                      <button
                          key={item.id}
                          onClick={() => item.path && navigate(item.path)}
                          className={`flex flex-col items-center justify-center py-1 transition-all relative flex-1 ${
                              isActive ? 'text-[#5AB2FF]' : 'text-slate-400'
                          }`}
                      >
                          <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-blue-50' : ''}`}>
                              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                          </div>
                          <span className={`text-[10px] mt-0.5 font-bold ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                              {item.label}
                          </span>
                      </button>
                  );
              })}
          </div>
      )}
    </div>
  );
};

export default App;
