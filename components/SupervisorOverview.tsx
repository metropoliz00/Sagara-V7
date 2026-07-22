
import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, Legend
} from 'recharts';
import { 
  Users, Briefcase, TrendingDown, AlertTriangle, CheckCircle, 
  MessageSquare, FileText, Activity, GraduationCap, Bell, UserX, X, Tent, Package, UserCheck, Shield, Building, Wallet, Coins, TrendingUp, BarChart3,
  ClipboardList
} from 'lucide-react';
import { Student, User, GradeRecord, LiaisonLog, PermissionRequest, BehaviorLog, GradeData, Extracurricular, InventoryItem, SchoolAsset, BOSTransaction, GtkRecord, PerformanceAssessment, SchoolProfileData } from '../types';
import LearningMonitoringView from './LearningMonitoringView';
import PerformanceAssessmentView from './PerformanceAssessmentView';

interface SupervisorOverviewProps {
  students: Student[];
  users: User[];
  attendanceRecords: any[];
  grades: GradeRecord[];
  liaisonLogs: LiaisonLog[];
  permissionRequests: PermissionRequest[];
  counselingLogs: BehaviorLog[];
  extracurriculars: Extracurricular[];
  inventory: InventoryItem[]; 
  schoolAssets: SchoolAsset[];
  bosTransactions: BOSTransaction[]; // NEW PROP
  currentUser: User | null;
  activeClassId: string;
  onShowNotification: (message: string, type: 'success' | 'error' | 'warning') => void;
  gtkData?: GtkRecord[];
  performanceAssessments?: PerformanceAssessment[];
  onSavePerformanceAssessment?: (assessment: PerformanceAssessment) => Promise<void>;
  schoolProfile?: SchoolProfileData | null;
}

const SupervisorOverview: React.FC<SupervisorOverviewProps> = ({
  students, users, attendanceRecords, grades, liaisonLogs, permissionRequests, counselingLogs, extracurriculars, inventory, schoolAssets, bosTransactions, currentUser, onShowNotification, activeClassId,
  gtkData = [], performanceAssessments = [], onSavePerformanceAssessment, schoolProfile
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'monitoring' | 'kinerja'>('overview');
  const [activeModal, setActiveModal] = useState<'permissions' | 'discipline' | 'incomplete' | null>(null);
  const [showAllAssets, setShowAllAssets] = useState(false);
  const [showAllInventory, setShowAllInventory] = useState(false);
  const [selectedAttendanceDate, setSelectedAttendanceDate] = useState<string>('all');

  // 0. Gender Breakdown
  const genderCounts = useMemo(() => {
    const l = students.filter(s => s.gender === 'L').length;
    const p = students.filter(s => s.gender === 'P').length;
    return { l, p };
  }, [students]);

  // 1. GTK Stats (Guru & Tenaga Kependidikan)
  const gtkStats = useMemo(() => {
    const lower = (str: string | undefined) => (str || '').toLowerCase();

    // Helper to check if record/user is system admin or Admin Sagara (not GTK/Tendik)
    const isSystemAdmin = (pos?: string, name?: string, username?: string, role?: string) => {
      const p = lower(pos);
      const n = lower(name);
      const u = lower(username);
      const r = lower(role);
      
      return (
        n.includes('admin sagara') ||
        n.includes('admin sistem') ||
        u === 'admin' ||
        u.includes('admin') ||
        p.includes('admin') ||
        p.includes('operator sistem') ||
        r === 'superadmin' ||
        (r === 'admin' && (n.includes('admin') || p.includes('admin') || !p))
      );
    };

    if (gtkData && gtkData.length > 0) {
      let headmaster = 0;
      let teachers = 0;
      let staff = 0;

      gtkData.forEach(g => {
        const pos = lower(g.jabatan);
        const name = lower(g.nama);
        if (isSystemAdmin(pos, name, '', '')) {
          return; // Exclude system admin / Admin Sagara from GTK count
        }
        if (pos.includes('kepala sekolah')) {
          headmaster++;
        } else if (pos.includes('guru') || pos.includes('pendidik')) {
          teachers++;
        } else {
          staff++;
        }
      });

      const totalGTK = headmaster + teachers + staff;
      return { headmaster, teachers, staff, totalGTK };
    }

    // Fallback to users if gtkData is empty
    const headmaster = users.filter(u => {
      if (isSystemAdmin(u.position, u.fullName, u.username, u.role)) return false;
      const pos = lower(u.position);
      return pos.includes('kepala sekolah') || lower(u.role).includes('kepala sekolah');
    }).length;

    const teachers = users.filter(u => {
      if (isSystemAdmin(u.position, u.fullName, u.username, u.role)) return false;
      const pos = lower(u.position);
      return pos.includes('guru') || u.role === 'guru';
    }).length;

    const staff = users.filter(u => {
      if (isSystemAdmin(u.position, u.fullName, u.username, u.role)) return false;
      const pos = lower(u.position);
      return pos.includes('staff') || pos.includes('tata usaha') || pos.includes('operator') || pos.includes('penjaga') || pos.includes('administrasi') || pos.includes('tendik');
    }).length;

    const totalGTK = headmaster + teachers + staff;

    return { headmaster, teachers, staff, totalGTK };
  }, [users, gtkData]);

  // 2. Student Distribution per Class (Split L/P)
  const classDistribution = useMemo(() => {
    const data: Record<string, { L: number; P: number }> = {};
    
    students.forEach(s => {
      const cls = s.classId || 'Unassigned';
      if (!data[cls]) data[cls] = { L: 0, P: 0 };
      
      if (s.gender === 'L') data[cls].L++;
      else data[cls].P++;
    });

    return Object.entries(data)
      .sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }))
      .map(([name, counts]) => ({ 
          name: `Kelas ${name}`, 
          L: counts.L, 
          P: counts.P,
          total: counts.L + counts.P
      }));
  }, [students]);

  // Economy Status Data
  const economyData = useMemo(() => {
    const counts: Record<string, number> = { 'Mampu': 0, 'Kurang Mampu': 0 };
    students.forEach(s => {
      const status = s.economyStatus || 'Mampu';
      counts[status] = (counts[status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [students]);

  // Grade 1 to 6 Data
  const grade1To6Data = useMemo(() => {
    const grades: Record<string, { L: number; P: number; total: number }> = {
      'Kelas 1': { L: 0, P: 0, total: 0 },
      'Kelas 2': { L: 0, P: 0, total: 0 },
      'Kelas 3': { L: 0, P: 0, total: 0 },
      'Kelas 4': { L: 0, P: 0, total: 0 },
      'Kelas 5': { L: 0, P: 0, total: 0 },
      'Kelas 6': { L: 0, P: 0, total: 0 },
    };
    students.forEach(s => {
      const cls = (s.classId || '').trim();
      const match = cls.match(/^([1-6])/);
      if (match) {
        const gKey = `Kelas ${match[1]}`;
        if (grades[gKey]) {
          if (s.gender === 'L') grades[gKey].L++;
          else grades[gKey].P++;
          grades[gKey].total++;
        }
      }
    });
    return Object.entries(grades).map(([name, data]) => ({
      name,
      L: data.L,
      P: data.P,
      total: data.total
    }));
  }, [students]);

  // 3. Attendance Stats
  const attendanceStats = useMemo(() => {
    if (!attendanceRecords || attendanceRecords.length === 0) {
        return { todayPercentage: 0, donutData: [], trendData: [] };
    }

    const totalRecords = attendanceRecords.length;
    const presentCount = attendanceRecords.filter(r => r.status === 'present' || r.status === 'dispensation').length;
    const overallPercentage = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;

    const donutData = [
      { name: 'Hadir', value: presentCount },
      { name: 'Tidak Hadir', value: totalRecords - presentCount },
    ];

    const dateMap: Record<string, { present: number; total: number }> = {};
    attendanceRecords.forEach(r => {
        const dateKey = r.date.includes('T') ? r.date.split('T')[0] : r.date;
        if (!dateMap[dateKey]) dateMap[dateKey] = { present: 0, total: 0 };
        dateMap[dateKey].total += 1;
        if (r.status === 'present' || r.status === 'dispensation') dateMap[dateKey].present += 1;
    });

    const sortedDates = Object.keys(dateMap).sort();
    const recentDates = sortedDates.slice(-7);

    const trendData = recentDates.map(date => {
        const stats = dateMap[date];
        const pct = Math.round((stats.present / stats.total) * 100);
        const d = new Date(date);
        const label = `${d.getDate()}/${d.getMonth() + 1}`;
        return { name: label, hadir: pct, fullDate: date };
    });

    return { todayPercentage: overallPercentage, donutData, trendData };
  }, [attendanceRecords]);

  // 3.1 Extract 7 recent dates from attendance records
  const recent7Dates = useMemo(() => {
    if (!attendanceRecords || attendanceRecords.length === 0) return [];
    const dateSet = new Set<string>();
    attendanceRecords.forEach(r => {
      if (r.date) {
        const dateKey = r.date.includes('T') ? r.date.split('T')[0] : r.date;
        dateSet.add(dateKey);
      }
    });
    return Array.from(dateSet).sort().slice(-7);
  }, [attendanceRecords]);

  // 3.2 Attendance breakdown per class (Hadir, Izin, Sakit, Alpha)
  const classAttendanceStats = useMemo(() => {
    const studentClassMap = new Map<string, string>();
    students.forEach(s => {
      if (s.id) {
        studentClassMap.set(s.id, s.classId || 'Lainnya');
      }
    });

    const classSet = new Set<string>();
    students.forEach(s => {
      if (s.classId) classSet.add(s.classId);
    });

    const countsPerClass: Record<string, { hadir: number; sakit: number; izin: number; alpha: number }> = {};
    
    classSet.forEach(c => {
      countsPerClass[c] = { hadir: 0, sakit: 0, izin: 0, alpha: 0 };
    });

    const filteredRecords = (attendanceRecords || []).filter(r => {
      if (!r.date) return false;
      const dateKey = r.date.includes('T') ? r.date.split('T')[0] : r.date;
      if (recent7Dates.length > 0 && !recent7Dates.includes(dateKey)) return false;
      if (selectedAttendanceDate !== 'all' && dateKey !== selectedAttendanceDate) return false;
      return true;
    });

    if (filteredRecords.length > 0) {
      filteredRecords.forEach(r => {
        const cls = r.classId || studentClassMap.get(r.studentId) || 'Lainnya';
        if (!countsPerClass[cls]) {
          countsPerClass[cls] = { hadir: 0, sakit: 0, izin: 0, alpha: 0 };
        }
        const st = (r.status || '').toLowerCase();
        if (st === 'present' || st === 'hadir' || st === 'dispensation' || st === 'dispen') {
          countsPerClass[cls].hadir += 1;
        } else if (st === 'sick' || st === 'sakit') {
          countsPerClass[cls].sakit += 1;
        } else if (st === 'permit' || st === 'izin') {
          countsPerClass[cls].izin += 1;
        } else if (st === 'alpha' || st === 'alfa') {
          countsPerClass[cls].alpha += 1;
        }
      });
    } else {
      students.forEach(s => {
        const cls = s.classId || 'Lainnya';
        if (!countsPerClass[cls]) {
          countsPerClass[cls] = { hadir: 0, sakit: 0, izin: 0, alpha: 0 };
        }
        if (s.attendance) {
          countsPerClass[cls].hadir += (s.attendance.present || 0);
          countsPerClass[cls].sakit += (s.attendance.sick || 0);
          countsPerClass[cls].izin += (s.attendance.permit || 0);
          countsPerClass[cls].alpha += (s.attendance.alpha || 0);
        }
      });
    }

    return Object.entries(countsPerClass)
      .sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }))
      .map(([className, data]) => {
        const total = data.hadir + data.sakit + data.izin + data.alpha;
        const percentage = total > 0 ? Math.round((data.hadir / total) * 100) : 0;
        return {
          className,
          ...data,
          total,
          percentage
        };
      });
  }, [attendanceRecords, students, recent7Dates, selectedAttendanceDate]);

  // 4. Low Attendance Students (<75%)
  const atRiskStudents = useMemo(() => {
    return students.filter(s => {
        const totalRec = s.attendance.present + s.attendance.sick + s.attendance.permit + s.attendance.alpha;
        if (totalRec === 0) return false;
        const pct = (s.attendance.present / totalRec) * 100;
        return pct < 75;
    }).slice(0, 5); 
  }, [students]);

  // 5. Inventory Data (Sorted by Condition)
  const inventoryList = useMemo(() => {
      return [...inventory].sort((a, b) => {
          if (a.condition === 'Rusak' && b.condition !== 'Rusak') return -1;
          if (a.condition !== 'Rusak' && b.condition === 'Rusak') return 1;
          return a.classId.localeCompare(b.classId, undefined, { numeric: true });
      });
  }, [inventory]);

  // 6. BOS Financial Overview (NEW)
  const bosOverview = useMemo(() => {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth(); // 0-indexed
      const currentMonthName = now.toLocaleString('id-ID', { month: 'long' });
      
      // SiLPA Tahun Lalu (Separate nominal info)
      const silpa = bosTransactions
          .filter(t => t.category === 'SiLPA Tahun Lalu' && new Date(t.date).getFullYear() === currentYear)
          .reduce((acc, t) => acc + t.amount, 0);

      // BOS Reguler (Sum of incoming transfers this year)
      const bosReguler = bosTransactions
          .filter(t => t.category === 'BOS Reguler' && new Date(t.date).getFullYear() === currentYear)
          .reduce((acc, t) => acc + t.amount, 0);

      // Current Balance: Current Year Income - Current Year Expense (Excluding SiLPA)
      // Filter strictly for current fiscal year to avoid mixing previous year's flow
      const transactionsUpToMonth = bosTransactions.filter(t => {
          const d = new Date(t.date);
          const y = d.getFullYear();
          const m = d.getMonth();
          
          return y === currentYear && m <= currentMonth;
      });

      const totalIncome = transactionsUpToMonth
          .filter(t => t.type === 'income' && t.category !== 'SiLPA Tahun Lalu') // Explicitly exclude SiLPA
          .reduce((acc, t) => acc + t.amount, 0);

      const totalExpense = transactionsUpToMonth
          .filter(t => t.type === 'expense')
          .reduce((acc, t) => acc + t.amount, 0);

      const balance = totalIncome - totalExpense;

      return {
          silpa,
          bosReguler,
          balance,
          period: `${currentMonthName} ${currentYear}`
      };
  }, [bosTransactions]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  };

  // 7. Notifications
  const isNisnIncomplete = (nisn?: string) => !nisn || nisn.trim() === '' || nisn === '-';
  const isPhoneIncomplete = (phone?: string) => !phone || phone.trim() === '' || phone === '-' || phone === '0';

  const notifications = useMemo(() => {
      const pendingPermits = permissionRequests.filter(p => p.status === 'Pending');
      const negativeLogs = counselingLogs.filter(l => l.type === 'negative');
      const incompleteData = students.filter(s => isNisnIncomplete(s.nisn) || isPhoneIncomplete(s.parentPhone));
      const pendingLiaison = liaisonLogs.filter(l => l.status === 'Pending').length;

      return [
          { id: 'permissions', label: 'Izin Menunggu Persetujuan', count: pendingPermits.length, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100', data: pendingPermits },
          { id: 'discipline', label: 'Kasus Disiplin Bulan Ini', count: negativeLogs.length, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100', data: negativeLogs },
          { id: 'liaison', label: 'Pesan Wali Murid (Baru)', count: pendingLiaison, icon: MessageSquare, color: 'text-emerald-600', bg: 'bg-emerald-100', data: [] },
          { id: 'incomplete', label: 'Data Siswa Belum Lengkap', count: incompleteData.length, icon: UserX, color: 'text-amber-600', bg: 'bg-amber-100', data: incompleteData },
      ];
  }, [permissionRequests, counselingLogs, liaisonLogs, students]);

  const getStudentInfo = (id: string) => students.find(s => s.id === id);

  return (
    <div className="space-y-6 animate-fade-in pb-10 relative">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
                <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                    <Activity className="mr-3 text-indigo-600"/> Supervisi & Monitoring
                </h2>
                <p className="text-gray-500 text-sm">Dashboard pendampingan oleh Kepala Sekolah</p>
            </div>
            
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl border border-gray-200 mt-4 md:mt-0">
                <button 
                  onClick={() => setActiveTab('overview')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                    activeTab === 'overview' 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Activity size={16} /> Supervisi
                </button>
                <button 
                  onClick={() => setActiveTab('monitoring')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                    activeTab === 'monitoring' 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <BarChart3 size={16} /> Monitoring
                </button>
                <button 
                  onClick={() => setActiveTab('kinerja')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                    activeTab === 'kinerja' 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <ClipboardList size={16} /> Penilaian Kinerja
                </button>
            </div>
        </div>

        {activeTab === 'monitoring' && (
          <LearningMonitoringView 
            currentUser={currentUser}
            onShowNotification={onShowNotification}
            activeClassId={activeClassId}
          />
        )}

        {activeTab === 'kinerja' && (
          <PerformanceAssessmentView
            currentUser={currentUser}
            users={users}
            gtkData={gtkData}
            assessments={performanceAssessments}
            onSaveAssessment={onSavePerformanceAssessment || (async () => {})}
            schoolProfile={schoolProfile || undefined}
          />
        )}

        {activeTab === 'overview' && (
          <>
            {/* --- BOS FINANCIAL OVERVIEW (NEW SECTION) --- */}
        <h3 className="text-lg font-bold text-gray-800 flex items-center">
            <Wallet className="mr-2 text-indigo-600" size={20} /> Pengelolaan BOS
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase mb-1">SiLPA Tahun Lalu</p>
                        <p className="text-xs text-gray-400">Sisa anggaran thn. {new Date().getFullYear() - 1}</p>
                    </div>
                    <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Coins size={20}/></div>
                </div>
                <h3 className="text-2xl font-black text-gray-800">{formatCurrency(bosOverview.silpa)}</h3>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase mb-1">Penerimaan BOS Reguler</p>
                        <p className="text-xs text-gray-400">Tahun Anggaran {new Date().getFullYear()}</p>
                    </div>
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><TrendingUp size={20}/></div>
                </div>
                <h3 className="text-2xl font-black text-gray-800">{formatCurrency(bosOverview.bosReguler)}</h3>
            </div>

            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-5 rounded-2xl shadow-lg flex flex-col justify-between">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <p className="text-xs font-bold uppercase mb-1 opacity-90">Sisa Saldo (Tahun Berjalan)</p>
                        <p className="text-xs opacity-75">{bosOverview.period}</p>
                    </div>
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm"><Wallet size={20}/></div>
                </div>
                <h3 className="text-2xl font-black">{formatCurrency(bosOverview.balance)}</h3>
            </div>
        </div>

        {/* STUDENT STATS CARDS */}
        <h3 className="text-lg font-bold text-gray-800 mt-6 flex items-center">
            <GraduationCap className="mr-2 text-indigo-600" size={20} /> Statistik Kesiswaan
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-indigo-500 to-blue-600 text-white p-5 rounded-2xl shadow-lg flex items-center justify-between">
                <div>
                    <p className="text-xs font-bold uppercase mb-1 opacity-80">Total Siswa Seluruhnya</p>
                    <h3 className="text-3xl font-black">{students.length}</h3>
                </div>
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm"><GraduationCap size={28}/></div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                <div>
                    <p className="text-xs text-gray-500 font-bold uppercase mb-1">Jumlah Siswa Laki-laki</p>
                    <h3 className="text-3xl font-black text-blue-600">{genderCounts.l}</h3>
                </div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Users size={24}/></div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                <div>
                    <p className="text-xs text-gray-500 font-bold uppercase mb-1">Jumlah Siswa Perempuan</p>
                    <h3 className="text-3xl font-black text-pink-600">{genderCounts.p}</h3>
                </div>
                <div className="p-3 bg-pink-50 text-pink-600 rounded-xl"><Users size={24}/></div>
            </div>
        </div>

        {/* TOP CARDS: GTK FOCUS */}
        <h3 className="text-lg font-bold text-gray-800 mt-6 flex items-center">
            <Users className="mr-2 text-indigo-600" size={20} /> Pengelolaan GTK
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-5 rounded-2xl shadow-lg flex items-center justify-between">
                <div>
                    <p className="text-xs font-bold uppercase mb-1 opacity-80">Total GTK</p>
                    <h3 className="text-3xl font-black">{gtkStats.totalGTK}</h3>
                </div>
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm"><Users size={28}/></div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                <div>
                    <p className="text-xs text-gray-500 font-bold uppercase mb-1">Kepala Sekolah</p>
                    <h3 className="text-3xl font-black text-gray-800">{gtkStats.headmaster}</h3>
                </div>
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Shield size={24}/></div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                <div>
                    <p className="text-xs text-gray-500 font-bold uppercase mb-1">Guru</p>
                    <h3 className="text-3xl font-black text-gray-800">{gtkStats.teachers}</h3>
                </div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Briefcase size={24}/></div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                <div>
                    <p className="text-xs text-gray-500 font-bold uppercase mb-1">Tendik</p>
                    <h3 className="text-3xl font-black text-gray-800">{gtkStats.staff}</h3>
                </div>
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><UserCheck size={24}/></div>
            </div>
        </div>

        {/* SECOND ROW: ATTENDANCE TREND & DETAIL PER CLASS */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                <div>
                    <h3 className="font-bold text-gray-800 flex items-center text-base">
                        <Activity size={20} className="mr-2 text-emerald-500"/> Tren & Detail Kehadiran Siswa (7 Hari Terakhir)
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">Grafik tren rerata kehadiran serta rincian Hadir, Izin, Sakit, dan Alpha per kelas.</p>
                </div>
                {recent7Dates.length > 0 && (
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-500 shrink-0">Filter Tanggal:</span>
                        <select 
                            value={selectedAttendanceDate} 
                            onChange={(e) => setSelectedAttendanceDate(e.target.value)}
                            className="text-xs font-bold text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                        >
                            <option value="all">Akumulasi 7 Hari Terakhir</option>
                            {recent7Dates.map(d => {
                                const dateObj = new Date(d);
                                const formatted = isNaN(dateObj.getTime()) ? d : `${dateObj.getDate()}/${dateObj.getMonth() + 1}/${dateObj.getFullYear()}`;
                                return (
                                    <option key={d} value={d}>Tgl {formatted}</option>
                                );
                            })}
                        </select>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Attendance Trend Chart */}
                <div className="lg:col-span-2 bg-slate-50/50 p-4 rounded-xl border border-gray-100">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-3">Grafik Rerata Kehadiran</p>
                    <div className="h-44">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={attendanceStats.trendData} margin={{top:5, right:5, left:-20, bottom:0}}>
                                <defs>
                                    <linearGradient id="colorHadir" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                                <XAxis dataKey="name" tick={{fontSize: 10}}/>
                                <YAxis domain={[0, 100]} tick={{fontSize: 10}}/>
                                <Tooltip contentStyle={{borderRadius: '8px', fontSize: '12px'}}/>
                                <Area type="monotone" dataKey="hadir" stroke="#10b981" fillOpacity={1} fill="url(#colorHadir)" strokeWidth={3}/>
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="lg:col-span-1 bg-emerald-50/40 p-5 rounded-xl border border-emerald-100/80 flex flex-col justify-center">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Kehadiran Total</p>
                        <CheckCircle size={20} className="text-emerald-500"/>
                    </div>
                    <h3 className={`text-3xl font-black ${attendanceStats.todayPercentage >= 90 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {attendanceStats.todayPercentage}%
                    </h3>
                    <p className="text-xs text-gray-500 mt-2">Rata-rata kehadiran seluruh siswa.</p>
                </div>

                <div className="lg:col-span-1 bg-rose-50/40 p-5 rounded-xl border border-rose-100/80 flex flex-col justify-center">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold text-rose-700 uppercase tracking-wider">Siswa Berisiko</p>
                        <AlertTriangle size={20} className="text-rose-500"/>
                    </div>
                    <h3 className="text-3xl font-black text-rose-600">
                        {atRiskStudents.length}
                    </h3>
                    <p className="text-xs text-gray-500 mt-2">Kehadiran di bawah 75%.</p>
                </div>
            </div>

            {/* DETAIL PER KELAS TABLE */}
            <div className="pt-2">
                <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600 flex items-center gap-1.5">
                        <Users size={14} className="text-emerald-600"/> 
                        Rincian Kehadiran Per Kelas ({selectedAttendanceDate === 'all' ? 'Total 7 Hari Terakhir' : `Tgl ${selectedAttendanceDate}`})
                    </h4>
                    <span className="text-xs text-gray-400 font-medium">{classAttendanceStats.length} Kelas Terdaftar</span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-gray-200/80 shadow-2xs">
                    <table className="w-full text-xs text-left">
                        <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-gray-200">
                            <tr>
                                <th className="py-2.5 px-3.5">Kelas</th>
                                <th className="py-2.5 px-3 text-center">Hadir (H)</th>
                                <th className="py-2.5 px-3 text-center">Izin (I)</th>
                                <th className="py-2.5 px-3 text-center">Sakit (S)</th>
                                <th className="py-2.5 px-3 text-center">Alpha (A)</th>
                                <th className="py-2.5 px-3 text-center">Total Input</th>
                                <th className="py-2.5 px-3.5 text-right">% Kehadiran</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {classAttendanceStats.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-4 text-center text-gray-400 italic">
                                        Belum ada data kehadiran kelas.
                                    </td>
                                </tr>
                            ) : (
                                classAttendanceStats.map((item) => (
                                    <tr key={item.className} className="hover:bg-slate-50 transition-colors">
                                        <td className="py-2.5 px-3.5 font-bold text-gray-800">
                                            Kelas {item.className}
                                        </td>
                                        <td className="py-2.5 px-3 text-center">
                                            <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                                                {item.hadir}
                                            </span>
                                        </td>
                                        <td className="py-2.5 px-3 text-center">
                                            <span className={`inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-md font-bold border ${item.izin > 0 ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-gray-50 text-gray-400 border-gray-200/50'}`}>
                                                {item.izin}
                                            </span>
                                        </td>
                                        <td className="py-2.5 px-3 text-center">
                                            <span className={`inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-md font-bold border ${item.sakit > 0 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-gray-50 text-gray-400 border-gray-200/50'}`}>
                                                {item.sakit}
                                            </span>
                                        </td>
                                        <td className="py-2.5 px-3 text-center">
                                            <span className={`inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-md font-bold border ${item.alpha > 0 ? 'bg-rose-50 text-rose-700 border-rose-200 font-black' : 'bg-gray-50 text-gray-400 border-gray-200/50'}`}>
                                                {item.alpha}
                                            </span>
                                        </td>
                                        <td className="py-2.5 px-3 text-center font-semibold text-gray-600">
                                            {item.total}
                                        </td>
                                        <td className="py-2.5 px-3.5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <div className="w-16 bg-gray-100 rounded-full h-1.5 overflow-hidden hidden sm:block">
                                                    <div 
                                                        className={`h-full rounded-full ${item.percentage >= 90 ? 'bg-emerald-500' : item.percentage >= 75 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                                        style={{ width: `${Math.min(100, item.percentage)}%` }}
                                                    />
                                                </div>
                                                <span className={`font-bold ${item.percentage >= 90 ? 'text-emerald-600' : item.percentage >= 75 ? 'text-amber-600' : 'text-rose-600'}`}>
                                                    {item.percentage}%
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        {/* THIRD ROW: CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center"><Users size={18} className="mr-2 text-indigo-500"/> Komposisi Siswa (L/P)</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={classDistribution} margin={{top:5, right:5, left:-20, bottom:0}}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                            <XAxis dataKey="name" tick={{fontSize: 10}} interval={0}/>
                            <YAxis tick={{fontSize: 10}}/>
                            <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}/>
                            <Legend wrapperStyle={{fontSize: '12px', paddingTop: '10px'}}/>
                            <Bar dataKey="L" stackId="a" fill="#5AB2FF" name="Laki-laki" />
                            <Bar dataKey="P" stackId="a" fill="#F472B6" name="Perempuan" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center"><Bell size={18} className="mr-2 text-amber-500"/> Notifikasi Penting</h3>
                <div className="space-y-3">
                    {notifications.map((notif) => {
                        const Icon = notif.icon;
                        const isInteractive = notif.id !== 'liaison';
                        return (
                            <div 
                                key={notif.id} 
                                onClick={() => isInteractive && notif.count > 0 ? setActiveModal(notif.id as any) : null}
                                className={`flex items-center justify-between p-3 rounded-xl border border-gray-100 transition-colors ${
                                    isInteractive && notif.count > 0 ? 'cursor-pointer hover:bg-gray-50 hover:border-gray-300' : ''
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${notif.bg} ${notif.color}`}>
                                        <Icon size={18}/>
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">{notif.label}</span>
                                </div>
                                <span className={`font-bold ${notif.count > 0 ? 'text-gray-800' : 'text-gray-400'}`}>{notif.count}</span>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>

        {/* ECONOMIC CONDITION & GRADE 1-6 CHARTS */}
        <div className="grid grid-cols-1 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center"><Wallet size={18} className="mr-2 text-emerald-500"/> Grafik Kondisi Ekonomi Murid</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={economyData} margin={{top:5, right:5, left:-20, bottom:0}}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                            <XAxis dataKey="name" tick={{fontSize: 10}}/>
                            <YAxis allowDecimals={false} tick={{fontSize: 10}}/>
                            <Tooltip contentStyle={{borderRadius: '8px'}}/>
                            <Bar dataKey="value" fill="#10b981" name="Jumlah Siswa" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center"><GraduationCap size={18} className="mr-2 text-indigo-500"/> Grafik Data dari Kelas 1 sampai dengan 6</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={grade1To6Data} margin={{top:5, right:5, left:-20, bottom:0}}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                            <XAxis dataKey="name" tick={{fontSize: 10}}/>
                            <YAxis allowDecimals={false} tick={{fontSize: 10}}/>
                            <Tooltip contentStyle={{borderRadius: '8px'}}/>
                            <Legend wrapperStyle={{fontSize: '12px', paddingTop: '10px'}}/>
                            <Bar dataKey="L" stackId="a" fill="#5AB2FF" name="Laki-laki" />
                            <Bar dataKey="P" stackId="a" fill="#F472B6" name="Perempuan" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>

        {/* FOURTH ROW: SCHOOL ASSETS & CLASS INVENTORY */}
        <div className="grid grid-cols-1 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                    <Building size={18} className="mr-2 text-indigo-600"/> Data Sarana & Prasarana Sekolah
                </h3>
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-indigo-50 text-indigo-800 font-bold uppercase text-xs">
                            <tr>
                                <th className="p-3 w-10 text-center">No</th>
                                <th className="p-3">Nama Barang</th>
                                <th className="p-3">Lokasi</th>
                                <th className="p-3 text-center">Jumlah</th>
                                <th className="p-3 text-center">Keadaan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {schoolAssets.length === 0 ? (
                                <tr><td colSpan={5} className="p-4 text-center text-gray-400 italic">Belum ada data sarana prasarana.</td></tr>
                            ) : (
                                (showAllAssets ? schoolAssets : schoolAssets.slice(0, 10)).map((item, idx) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="p-3 text-center text-gray-500">{idx + 1}</td>
                                        <td className="p-3 font-semibold text-gray-700">{item.name}</td>
                                        <td className="p-3 text-gray-600">{item.location || '-'}</td>
                                        <td className="p-3 text-center font-mono">{item.qty}</td>
                                        <td className="p-3 text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold border ${
                                                item.condition === 'Baik' 
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                                : item.condition === 'Rusak Ringan'
                                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                : 'bg-red-50 text-red-700 border-red-200'
                                            }`}>
                                                {item.condition}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {schoolAssets.length > 10 && (
                    <div className="mt-4 text-center">
                        <button 
                            onClick={() => setShowAllAssets(!showAllAssets)}
                            className="text-indigo-600 font-bold text-sm hover:underline"
                        >
                            {showAllAssets ? 'Sembunyikan' : `Lihat Semua (${schoolAssets.length})`}
                        </button>
                    </div>
                )}
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                    <Package size={18} className="mr-2 text-indigo-600"/> Data Inventaris Per Kelas
                </h3>
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-700 font-bold uppercase text-xs">
                            <tr>
                                <th className="p-3 w-10 text-center">No</th>
                                <th className="p-3">Kelas / Ruang</th>
                                <th className="p-3">Nama Barang</th>
                                <th className="p-3 text-center">Jumlah</th>
                                <th className="p-3 text-center">Keadaan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {inventoryList.length === 0 ? (
                                <tr><td colSpan={5} className="p-4 text-center text-gray-400 italic">Belum ada data inventaris kelas.</td></tr>
                            ) : (
                                (showAllInventory ? inventoryList : inventoryList.slice(0, 10)).map((item, idx) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="p-3 text-center text-gray-500">{idx + 1}</td>
                                        <td className="p-3 font-semibold text-gray-700">
                                            {item.classId === 'ALL' ? 'Umum / Sekolah' : `Kelas ${item.classId}`}
                                        </td>
                                        <td className="p-3 font-medium text-gray-800">{item.name}</td>
                                        <td className="p-3 text-center font-mono">{item.qty}</td>
                                        <td className="p-3 text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold border ${
                                                item.condition === 'Baik' 
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                                : 'bg-red-50 text-red-700 border-red-200'
                                            }`}>
                                                {item.condition}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {inventoryList.length > 10 && (
                    <div className="mt-4 text-center">
                        <button 
                            onClick={() => setShowAllInventory(!showAllInventory)}
                            className="text-indigo-600 font-bold text-sm hover:underline"
                        >
                            {showAllInventory ? 'Sembunyikan' : `Lihat Semua (${inventoryList.length})`}
                        </button>
                    </div>
                )}
            </div>
        </div>

        {/* MODAL POPUP FOR NOTIFICATIONS */}
        {activeModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setActiveModal(null)}>
                <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
                    <div className="p-5 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl">
                        <h3 className="font-bold text-lg text-gray-800">
                            {activeModal === 'permissions' && 'Detail Izin Menunggu Persetujuan'}
                            {activeModal === 'discipline' && 'Detail Kasus Disiplin'}
                            {activeModal === 'incomplete' && 'Daftar Siswa Data Belum Lengkap'}
                        </h3>
                        <button onClick={() => setActiveModal(null)} className="p-1 hover:bg-gray-200 rounded-full transition-colors"><X size={20}/></button>
                    </div>
                    
                    <div className="overflow-y-auto p-0">
                        {activeModal === 'permissions' && (
                            <table className="w-full text-sm text-left">
                                <thead className="bg-blue-50 text-blue-800 text-xs uppercase font-bold sticky top-0">
                                    <tr>
                                        <th className="p-4">Nama Siswa</th>
                                        <th className="p-4">Kelas</th>
                                        <th className="p-4">Tanggal</th>
                                        <th className="p-4">Alasan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {permissionRequests.filter(p => p.status === 'Pending').map(req => {
                                        const s = getStudentInfo(req.studentId);
                                        return (
                                            <tr key={req.id}>
                                                <td className="p-4 font-semibold">{s?.name || 'Unknown'}</td>
                                                <td className="p-4">{s?.classId || '-'}</td>
                                                <td className="p-4">{req.date}</td>
                                                <td className="p-4 italic text-gray-600">{req.reason}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        )}

                        {activeModal === 'discipline' && (
                            <table className="w-full text-sm text-left">
                                <thead className="bg-red-50 text-red-800 text-xs uppercase font-bold sticky top-0">
                                    <tr>
                                        <th className="p-4">Nama Siswa</th>
                                        <th className="p-4">Kelas</th>
                                        <th className="p-4">NIS / NISN</th>
                                        <th className="p-4">Kasus</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {counselingLogs.filter(l => l.type === 'negative').map(log => {
                                        const s = getStudentInfo(log.studentId);
                                        return (
                                            <tr key={log.id}>
                                                <td className="p-4 font-semibold uppercase">{(s?.name || log.studentName)?.toUpperCase()}</td>
                                                <td className="p-4">{s?.classId || '-'}</td>
                                                <td className="p-4 text-gray-500 font-mono text-xs">
                                                    {s?.nis || '-'} / {s?.nisn || '-'}
                                                </td>
                                                <td className="p-4">{log.description}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        )}

                        {activeModal === 'incomplete' && (
                            <table className="w-full text-sm text-left">
                                <thead className="bg-amber-50 text-amber-800 text-xs uppercase font-bold sticky top-0">
                                    <tr>
                                        <th className="p-4">Nama Siswa</th>
                                        <th className="p-4">Kelas</th>
                                        <th className="p-4">NIS</th>
                                        <th className="p-4">Data Kurang</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {students.filter(s => isNisnIncomplete(s.nisn) || isPhoneIncomplete(s.parentPhone)).map(s => (
                                        <tr key={s.id}>
                                            <td className="p-4 font-semibold uppercase">{s.name.toUpperCase()}</td>
                                            <td className="p-4">{s.classId}</td>
                                            <td className="p-4 font-mono">{s.nis}</td>
                                            <td className="p-4 text-red-500 text-xs font-bold">
                                                {isNisnIncomplete(s.nisn) && <span className="block">• NISN Kosong / Tidak Valid</span>}
                                                {isPhoneIncomplete(s.parentPhone) && <span className="block">• No HP Ortu Kosong / Tidak Valid</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                    
                    <div className="p-4 border-t bg-gray-50 rounded-b-2xl flex justify-end">
                        <button onClick={() => setActiveModal(null)} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-100">Tutup</button>
                    </div>
                </div>
            </div>
        )}
          </>
        )}
    </div>
  );
};

export default SupervisorOverview;
