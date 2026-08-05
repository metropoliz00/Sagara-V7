import React, { useState, useEffect, useMemo } from 'react';
import CustomModal from './CustomModal';
import html2pdf from 'html2pdf.js';
import { 
  FileText, CheckCircle, Clock, XCircle, Plus, Search, Filter,
  Calendar, User as UserIcon, Trash2, Edit, ExternalLink, RefreshCw, Eye, Activity, Printer, Download
} from 'lucide-react';
import { StaffLeaveRequest, User } from '../types';
import { apiService } from '../services/apiService';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface StaffLeaveViewProps {
  currentUser: User | null;
  onShowNotification: (message: string, type: 'success' | 'error' | 'warning') => void;
}

const IJIN_OPTIONS = {
  'Dispensasi': ['Dispensasi Dinas', 'Dispensasi Pribadi'],
  'Cuti': ['Cuti Tahunan', 'Cuti Besar', 'Cuti Sakit', 'Cuti Melahirkan', 'Cuti Alasan Penting', 'Lainnya'],
  'Izin': ['Dinas Luar', 'Pelatihan', 'Workshop', 'Kepentingan Keluarga', 'Lainnya']
};

const STATUS_OPTIONS = ['Semua Status', 'Menunggu', 'Disetujui', 'Ditolak'];
const JENIS_CUTI_OPTIONS = ['Cuti Tahunan', 'Cuti Besar', 'Cuti Sakit', 'Cuti Melahirkan', 'Cuti Alasan Penting', 'Lainnya'];

const PIE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#6366F1'];

const StaffLeaveView: React.FC<StaffLeaveViewProps> = ({ currentUser, onShowNotification }) => {
  const [requests, setRequests] = useState<StaffLeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'data' | 'form'>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua Status');

  const [schoolProfile, setSchoolProfile] = useState<any>(null);
  const [headmasterUser, setHeadmasterUser] = useState<User | null>(null);
  const [gtkRecords, setGtkRecords] = useState<any[]>([]);
  const [printRequestedLeave, setPrintRequestedLeave] = useState<StaffLeaveRequest | null>(null);
  const [letterType, setLetterType] = useState('Surat Dispensasi');
  const [isLetterNumberModalOpen, setIsLetterNumberModalOpen] = useState(false);
  const [manualLetterNumber, setManualLetterNumber] = useState("");
  const [rejectModalData, setRejectModalData] = useState<{ isOpen: boolean; request: StaffLeaveRequest | null }>({ isOpen: false, request: null });
  const [rejectionReason, setRejectionReason] = useState("");
  const [editModalData, setEditModalData] = useState<{ isOpen: boolean; request: StaffLeaveRequest | null }>({ isOpen: false, request: null });
  const [editIjinGroup, setEditIjinGroup] = useState<keyof typeof IJIN_OPTIONS>('Dispensasi');
  const [editKategoriIjin, setEditKategoriIjin] = useState('');
  const [editJenisCutiLainnya, setEditJenisCutiLainnya] = useState('');
  const [editTanggalMulai, setEditTanggalMulai] = useState('');
  const [editTanggalSelesai, setEditTanggalSelesai] = useState('');
  const [editAlasan, setEditAlasan] = useState('');

  const handleOpenEditModal = (req: StaffLeaveRequest) => {
    let group: keyof typeof IJIN_OPTIONS = 'Dispensasi';
    let cat = req.kategoriIjin;
    let cutiLainnya = '';

    if (cat.startsWith('Cuti -')) {
      group = 'Cuti';
      const detail = cat.replace('Cuti - ', '').trim();
      if (IJIN_OPTIONS['Cuti'].includes(detail)) {
        cat = detail;
      } else {
        cat = 'Lainnya';
        cutiLainnya = detail;
      }
    } else {
      for (const g of Object.keys(IJIN_OPTIONS) as (keyof typeof IJIN_OPTIONS)[]) {
        if (IJIN_OPTIONS[g].includes(cat)) {
          group = g;
          break;
        }
      }
    }

    setEditIjinGroup(group);
    setEditKategoriIjin(cat);
    setEditJenisCutiLainnya(cutiLainnya);
    setEditTanggalMulai(req.tanggalMulai ? req.tanggalMulai.slice(0, 16) : '');
    setEditTanggalSelesai(req.tanggalSelesai ? req.tanggalSelesai.slice(0, 16) : '');
    setEditAlasan(req.alasan || '');
    setEditModalData({ isOpen: true, request: req });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalData.request) return;
    if (!editTanggalMulai || !editTanggalSelesai || !editAlasan) {
      onShowNotification('Harap lengkapi semua field.', 'warning');
      return;
    }

    let finalKategori = editKategoriIjin;
    if (editIjinGroup === 'Cuti') {
      const detail = editKategoriIjin === 'Lainnya' ? editJenisCutiLainnya : editKategoriIjin;
      if (!detail.trim()) {
        onShowNotification('Harap isi jenis cuti.', 'warning');
        return;
      }
      finalKategori = `Cuti - ${detail}`;
    }

    const updated: StaffLeaveRequest = {
      ...editModalData.request,
      kategoriIjin: finalKategori,
      tanggalMulai: editTanggalMulai,
      tanggalSelesai: editTanggalSelesai,
      alasan: editAlasan
    };

    try {
      await apiService.saveStaffLeaveRequest(updated);
      setRequests(requests.map(r => r.id === updated.id ? updated : r));
      onShowNotification('Pengajuan izin berhasil diperbarui.', 'success');
      setEditModalData({ isOpen: false, request: null });
    } catch (e) {
      console.error(e);
      onShowNotification('Gagal memperbarui pengajuan.', 'error');
    }
  };

  const handleExecutePrint = () => {
    setIsLetterNumberModalOpen(false);

    setTimeout(() => {
      const printElement = document.getElementById('printable-area');
      if (!printElement) {
        window.print();
        return;
      }

      let standaloneContainer = document.getElementById('sagara-standalone-print-container');
      if (!standaloneContainer) {
        standaloneContainer = document.createElement('div');
        standaloneContainer.id = 'sagara-standalone-print-container';
        document.body.appendChild(standaloneContainer);
      }

      standaloneContainer.innerHTML = printElement.outerHTML;
      document.body.classList.add('has-standalone-print');

      let styleTag = document.getElementById('sagara-dynamic-print-style');
      if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'sagara-dynamic-print-style';
        document.head.appendChild(styleTag);
      }
      styleTag.innerHTML = `@media print { @page { size: A4 portrait; margin: 10mm 12mm; } }`;

      const originalTitle = document.title;
      const isDispensasi = printRequestedLeave?.kategoriIjin.toLowerCase().includes('dispensasi');
      const docName = isDispensasi ? 'Surat_Dispensasi' : letterType.replace(/\s+/g, '_');
      document.title = `${docName}_${printRequestedLeave?.userName || 'Pegawai'}`;

      window.print();

      const cleanup = () => {
        document.title = originalTitle;
        document.body.classList.remove('has-standalone-print');
        if (standaloneContainer) {
          standaloneContainer.innerHTML = '';
        }
        window.removeEventListener('afterprint', cleanup);
      };

      window.addEventListener('afterprint', cleanup);
      setTimeout(cleanup, 2500);
    }, 150);
  };

  const getNipLabel = (statusPegawai?: string, userNip?: string, userId?: string, userName?: string) => {
    if (statusPegawai) {
      const s = statusPegawai.toUpperCase();
      if (s.includes('PPPK')) return 'NIPPPK';
      if (s.includes('PNS')) return 'NIP';
    }
    if (gtkRecords && gtkRecords.length > 0) {
      const match = gtkRecords.find(g => 
        (userId && g.userId === userId) ||
        (userNip && g.nip && g.nip.trim() === userNip.trim()) ||
        (userName && g.nama && g.nama.trim().toLowerCase() === userName.trim().toLowerCase())
      );
      if (match && match.statusPegawai) {
        const s = match.statusPegawai.toUpperCase();
        if (s.includes('PPPK')) return 'NIPPPK';
        if (s.includes('PNS')) return 'NIP';
      }
    }
    if (currentUser && (currentUser.id === userId || currentUser.nip === userNip)) {
      if (currentUser.statusPegawai) {
        const s = currentUser.statusPegawai.toUpperCase();
        if (s.includes('PPPK')) return 'NIPPPK';
        if (s.includes('PNS')) return 'NIP';
      }
    }
    return 'NIP';
  };

  const handleOpenPrintModal = (req: StaffLeaveRequest) => {
    setPrintRequestedLeave(req);
    const cat = req.kategoriIjin.toLowerCase();
    if (cat.includes('cuti')) {
      setLetterType('Permohonan Cuti');
    } else if (cat.includes('dispensasi')) {
      setLetterType('Surat Dispensasi');
    } else {
      setLetterType('Surat Izin');
    }
  };

  const renderHeader = () => (
    <div className="border-b-2 border-black pb-4 mb-6 flex items-center justify-between gap-4">
      <div className="w-20 h-20 bg-transparent flex-shrink-0 flex items-center justify-center">
         {schoolProfile?.regencyLogo ? <img src={schoolProfile.regencyLogo} alt="Logo Kab" className="w-full h-full object-contain" /> : <div className="text-[8px]">LOGO</div>}
      </div>
      <div className="text-center flex-1">
        <p className="font-bold uppercase">PEMERINTAH KABUPATEN TUBAN</p>
        <p className="font-bold uppercase">DINAS PENDIDIKAN</p>
        <p className="font-bold uppercase text-lg">{schoolProfile?.name || 'UPT SD NEGERI ...'}</p>
        <p className="font-bold uppercase">KECAMATAN {schoolProfile?.kecamatan?.toUpperCase() || '...'}</p>
        <p className="text-xs">Jln. {schoolProfile?.address || '...'}, Desa {schoolProfile?.desa || '...'}, Kecamatan {schoolProfile?.kecamatan || '...'}, Kabupaten {schoolProfile?.kabupaten || '...'}, Kode Pos {schoolProfile?.postalCode || '...'}</p>
        <p className="text-xs">Pos-el : {schoolProfile?.email || '...'}</p>
      </div>
      <div className="w-20 h-20 flex-shrink-0 opacity-0 pointer-events-none"></div>
    </div>
  );

  // Form state
  const [ijinGroup, setIjinGroup] = useState<keyof typeof IJIN_OPTIONS>('Dispensasi');
  const [kategoriIjin, setKategoriIjin] = useState<string>(IJIN_OPTIONS['Dispensasi'][0]);
  const [jenisCutiLainnya, setJenisCutiLainnya] = useState('');
  const [tanggalMulai, setTanggalMulai] = useState('');
  const [tanggalSelesai, setTanggalSelesai] = useState('');
  const [alasan, setAlasan] = useState('');
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title?: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  
  // Permissions - Admin, Superadmin, and Kepala Sekolah can approve/manage all leave requests
  const isPrincipalOrAdmin = 
    currentUser?.role === 'Kepala Sekolah' || 
    currentUser?.role === 'admin' || 
    currentUser?.role === 'superadmin' ||
    (currentUser?.position && currentUser.position.toLowerCase().includes('kepala sekolah')) ||
    (currentUser?.position && currentUser.position.toLowerCase().includes('admin'));

  const canApprove = isPrincipalOrAdmin;

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    setKategoriIjin(IJIN_OPTIONS[ijinGroup][0]);
    setJenisCutiLainnya('');
  }, [ijinGroup]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const [data, profiles, users, gtkData] = await Promise.all([
        apiService.getStaffLeaveRequests(),
        apiService.getProfiles(),
        currentUser ? apiService.getUsers(currentUser) : Promise.resolve([]),
        apiService.getGtkRecords()
      ]);
      setRequests(data);
      if (gtkData) setGtkRecords(gtkData);
      if (profiles && profiles.school) setSchoolProfile(profiles.school);
      
      if (users && users.length > 0) {
        const principal = users.find((u: User) => u.role === 'Kepala Sekolah' || u.position?.toLowerCase().includes('kepala sekolah'));
        if (principal) {
          setHeadmasterUser(principal);
        }
      }
    } catch (e) {
      console.error(e);
      onShowNotification('Gagal memuat data izin pegawai.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const myRequests = useMemo(() => {
    if (!currentUser) return [];
    if (isPrincipalOrAdmin) return requests; // Admin and Principal see all requests
    return requests.filter(r => r.userId === currentUser.id);
  }, [requests, currentUser, isPrincipalOrAdmin]);

  const filteredRequests = useMemo(() => {
    return myRequests.filter(req => {
      const matchSearch = req.userName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          req.alasan.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'Semua Status' || req.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [myRequests, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const total = myRequests.length;
    const disetujui = myRequests.filter(r => r.status === 'Disetujui').length;
    const menunggu = myRequests.filter(r => r.status === 'Menunggu').length;
    const ditolak = myRequests.filter(r => r.status === 'Ditolak').length;
    return { total, disetujui, menunggu, ditolak };
  }, [myRequests]);

  const pieData = useMemo(() => {
    const counts: Record<string, number> = {};
    myRequests.forEach(r => {
      // Improved categorization for pie chart
      const group = Object.keys(IJIN_OPTIONS).find(g => IJIN_OPTIONS[g as keyof typeof IJIN_OPTIONS].some(opt => r.kategoriIjin.includes(opt))) || 'Lainnya';
      counts[group] = (counts[group] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [myRequests]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!tanggalMulai || !tanggalSelesai || !alasan) {
      onShowNotification('Harap lengkapi semua field.', 'warning');
      return;
    }

    let finalKategori = kategoriIjin;
    if (ijinGroup === 'Cuti') {
        const detail = kategoriIjin === 'Lainnya' ? jenisCutiLainnya : kategoriIjin;
        if (!detail.trim()) {
            onShowNotification('Harap isi jenis cuti.', 'warning');
            return;
        }
        finalKategori = `Cuti - ${detail}`;
    }

    const userGtk = gtkRecords.find(g => g.userId === currentUser.id || (g.nip && currentUser.nip && g.nip.trim() === currentUser.nip.trim()));
    const userStatusPegawai = (currentUser as any)?.statusPegawai || userGtk?.statusPegawai || 'PNS';

    const newRequest: StaffLeaveRequest = {
      id: `leave-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.fullName,
      nip: currentUser.nip || '-', // Assuming user has nip
      statusPegawai: userStatusPegawai,
      jabatan: currentUser.position || (currentUser.role === 'guru' ? 'Guru' : 'Staff'),
      pangkat: currentUser.rank || '-',
      kategoriIjin: finalKategori,
      tanggalMulai,
      tanggalSelesai,
      alasan,
      status: 'Menunggu',
      createdAt: new Date().toISOString()
    };

    try {
      await apiService.saveStaffLeaveRequest(newRequest);
      setRequests([newRequest, ...requests]);
      onShowNotification('Pengajuan izin berhasil dikirim.', 'success');
      setActiveTab('data');
      
      // Reset form
      setTanggalMulai('');
      setTanggalSelesai('');
      setAlasan('');
      setIjinGroup('Dispensasi');
      setKategoriIjin(IJIN_OPTIONS['Dispensasi'][0]);
      setJenisCutiLainnya('');
    } catch (e) {
      console.error(e);
      onShowNotification('Gagal mengirim pengajuan.', 'error');
    }
  };


  const handleUpdateStatus = async (req: StaffLeaveRequest, newStatus: 'Disetujui' | 'Ditolak', reason?: string) => {
    if (!canApprove) return;
    try {
      const updated: StaffLeaveRequest = { ...req, status: newStatus };
      if (newStatus === 'Ditolak' && reason) {
          updated.rejectionReason = reason;
      }
      await apiService.saveStaffLeaveRequest(updated);
      setRequests(requests.map(r => r.id === req.id ? updated : r));
      onShowNotification(`Pengajuan berhasil ${newStatus.toLowerCase()}.`, 'success');
      
      if (newStatus === 'Ditolak') {
         setRejectModalData({ isOpen: false, request: null });
         setRejectionReason("");
      }
    } catch (e) {
      console.error(e);
      onShowNotification('Gagal memperbarui status pengajuan.', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Pengajuan Izin',
      message: 'Apakah Anda yakin ingin menghapus pengajuan izin ini?',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          await apiService.deleteStaffLeaveRequest(id);
          setRequests(requests.filter(r => r.id !== id));
          onShowNotification('Pengajuan berhasil dihapus.', 'success');
        } catch (e) {
          console.error(e);
          onShowNotification('Gagal menghapus pengajuan.', 'error');
        }
      }
    });
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Izin Pegawai</h1>
          <p className="text-gray-500 text-sm mt-1">Sistem Pengajuan dan Persetujuan Izin / Dispensasi Pegawai.</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${activeTab === 'dashboard' ? 'bg-white text-indigo-600 shadow' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${activeTab === 'data' ? 'bg-white text-indigo-600 shadow' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Data Izin
          </button>
          {currentUser?.role !== 'superadmin' && (
            <button
              onClick={() => setActiveTab('form')}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${activeTab === 'form' ? 'bg-white text-indigo-600 shadow' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Form Pengajuan
            </button>
          )}
        </div>
      </div>

      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase">Total Pengajuan</p>
                <h3 className="text-3xl font-black text-gray-800 mt-1">{stats.total}</h3>
              </div>
              <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
                <FileText size={24} />
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase">Disetujui</p>
                <h3 className="text-3xl font-black text-gray-800 mt-1">{stats.disetujui}</h3>
              </div>
              <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center">
                <CheckCircle size={24} />
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase">Menunggu</p>
                <h3 className="text-3xl font-black text-gray-800 mt-1">{stats.menunggu}</h3>
              </div>
              <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center">
                <Clock size={24} />
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase">Ditolak</p>
                <h3 className="text-3xl font-black text-gray-800 mt-1">{stats.ditolak}</h3>
              </div>
              <div className="w-12 h-12 bg-red-50 text-red-500 rounded-xl flex items-center justify-center">
                <XCircle size={24} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm">
              <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-gray-800 flex items-center">
                  <div className="w-1 h-5 bg-indigo-500 rounded-full mr-2"></div>
                  Daftar Pengajuan Terbaru
                </h3>
              </div>
              <div className="p-0 divide-y divide-gray-100">
                {myRequests.slice(0, 5).map(req => (
                  <div key={req.id} className="p-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-center hover:bg-gray-50/60 transition-colors">
                    <div className="md:col-span-4">
                      <h4 className="font-bold text-gray-800 text-sm">{req.userName}</h4>
                      <p className="text-xs text-gray-400 mt-0.5">{req.nip}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {req.pangkat && req.pangkat !== '-' && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-bold">{req.pangkat}</span>
                        )}
                        {req.jabatan && req.jabatan !== '-' && (
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold">{req.jabatan}</span>
                        )}
                      </div>
                    </div>
                    <div className="md:col-span-5">
                      <span className="inline-block px-2.5 py-0.5 bg-gray-100 text-gray-700 text-[10px] font-bold rounded-full mb-1">
                        {req.kategoriIjin.replace('Cuti - ', '')}
                      </span>
                      <div className="flex items-center text-xs text-gray-600 mb-1">
                        <Calendar size={12} className="mr-1.5 shrink-0 text-gray-400" />
                        <span>{new Date(req.tanggalMulai).toLocaleDateString('id-ID')} - {new Date(req.tanggalSelesai).toLocaleDateString('id-ID')}</span>
                      </div>
                      <p className="text-xs text-gray-500 italic whitespace-normal break-words" title={req.alasan}>"{req.alasan}"</p>
                    </div>
                    <div className="md:col-span-3 flex flex-col md:items-end justify-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide inline-block text-center ${
                        req.status === 'Disetujui' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                        req.status === 'Ditolak' ? 'bg-red-50 text-red-600 border border-red-200' :
                        'bg-amber-50 text-amber-600 border border-amber-200'
                      }`}>
                        {req.status}
                      </span>
                      {req.status === 'Ditolak' && req.rejectionReason && (
                        <p className="text-xs text-red-500 italic mt-1 text-right max-w-[200px]" title={req.rejectionReason}>
                           Ditolak: {req.rejectionReason}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        {req.status === 'Disetujui' && (
                          <>
                             <button onClick={() => handleOpenPrintModal(req)} className="text-blue-600 hover:text-blue-800 p-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors" title="Cetak Surat"><Printer size={16}/></button>
                             {req.kategoriIjin.startsWith('Cuti') && (
                               <a href="https://drive.google.com/drive/folders/1DDrblEQh1TWraiKi1tkNgCOmlyOxGWVS?usp=sharing" target="_blank" rel="noreferrer" className="text-indigo-600 hover:text-indigo-800 p-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors" title="Format Cuti"><FileText size={16}/></a>
                             )}
                          </>
                        )}
                        {canApprove && req.status === 'Menunggu' && (
                          <>
                             <button onClick={() => handleUpdateStatus(req, 'Disetujui')} className="text-emerald-600 hover:text-emerald-800 p-1.5 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors" title="Setujui"><CheckCircle size={16}/></button>
                             <button onClick={() => { setRejectModalData({ isOpen: true, request: req }); setRejectionReason(""); }} className="text-red-600 hover:text-red-800 p-1.5 bg-red-50 hover:bg-red-100 rounded-lg transition-colors" title="Tolak"><XCircle size={16}/></button>
                             <button onClick={() => handleOpenEditModal(req)} className="text-amber-600 hover:text-amber-800 p-1.5 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors" title="Edit"><Edit size={16}/></button>
                          </>
                        )}
                        {!canApprove && req.status === 'Menunggu' && (
                          <>
                            <button onClick={() => handleOpenEditModal(req)} className="text-amber-600 hover:text-amber-800 p-1.5 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors" title="Edit"><Edit size={16}/></button>
                            <button onClick={() => handleDelete(req.id)} className="text-red-600 hover:text-red-800 p-1.5 bg-red-50 hover:bg-red-100 rounded-lg transition-colors" title="Hapus"><Trash2 size={16}/></button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {myRequests.length === 0 && (
                  <div className="p-8 text-center text-gray-500 text-sm">Belum ada pengajuan izin.</div>
                )}
                {myRequests.length > 5 && (
                  <div className="p-4 text-center">
                    <button onClick={() => setActiveTab('data')} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">
                      Lihat Semua ({myRequests.length})
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h3 className="font-bold text-gray-800 flex items-center mb-6">
                  <div className="w-1 h-5 bg-fuchsia-500 rounded-full mr-2"></div>
                  Statistik Ijin
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
                <h3 className="font-bold flex items-center mb-2">
                  <Activity size={18} className="mr-2" /> Status Kinerja
                </h3>
                <p className="text-sm text-indigo-100 mb-6">Ringkasan aktivitas bulan ini</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/20 rounded-xl p-4">
                    <h4 className="text-3xl font-black">{stats.disetujui}</h4>
                    <p className="text-xs uppercase font-bold text-indigo-100 mt-1">Disetujui</p>
                  </div>
                  <div className="bg-white/20 rounded-xl p-4">
                    <h4 className="text-3xl font-black">{stats.total}</h4>
                    <p className="text-xs uppercase font-bold text-indigo-100 mt-1">Total</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'data' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50/50">
            <div className="flex gap-2 w-full md:w-auto">
               <div className="relative flex-1 md:w-64">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari data..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <button onClick={loadRequests} className="p-2 text-gray-500 hover:text-indigo-600 bg-white border border-gray-200 rounded-lg shadow-sm">
              <RefreshCw size={18} />
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="px-6 py-4">Tanggal Diajukan</th>
                  <th className="px-6 py-4">Nama Pegawai</th>
                  <th className="px-6 py-4">Jenis Ijin</th>
                  <th className="px-6 py-4">Alasan</th>
                  <th className="px-6 py-4">Masa Ijin</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRequests.map(req => (
                  <tr key={req.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {new Date(req.createdAt || '').toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-800">{req.userName}</div>
                      <div className="text-[10px] text-gray-400">{req.nip}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-700">
                      {req.kategoriIjin.replace('Cuti - ', '')}
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate text-gray-500" title={req.alasan}>
                      {req.alasan}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {new Date(req.tanggalMulai).toLocaleDateString('id-ID')} - {new Date(req.tanggalSelesai).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                        req.status === 'Disetujui' ? 'bg-emerald-50 text-emerald-600' :
                        req.status === 'Ditolak' ? 'bg-red-50 text-red-600' :
                        'bg-amber-50 text-amber-600'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                     <td className="px-6 py-4 text-center">
                       {canApprove && req.status === 'Menunggu' && (
                        <div className="flex items-center justify-center gap-2">
                           <button onClick={() => handleUpdateStatus(req, 'Disetujui')} className="text-emerald-500 hover:text-emerald-700 p-1 bg-emerald-50 rounded" title="Setujui"><CheckCircle size={16}/></button>
                           <button onClick={() => { setRejectModalData({ isOpen: true, request: req }); setRejectionReason(""); }} className="text-red-500 hover:text-red-700 p-1 bg-red-50 rounded" title="Tolak"><XCircle size={16}/></button>
                           <button onClick={() => handleOpenEditModal(req)} className="text-amber-500 hover:text-amber-700 p-1 bg-amber-50 rounded" title="Edit"><Edit size={16}/></button>
                        </div>
                      )}
                      {!canApprove && req.status === 'Menunggu' && (
                         <div className="flex items-center justify-center gap-2">
                           <button onClick={() => handleOpenEditModal(req)} className="text-amber-500 hover:text-amber-700 p-1 bg-amber-50 rounded" title="Edit"><Edit size={16}/></button>
                           <button onClick={() => handleDelete(req.id)} className="text-red-500 hover:text-red-700 p-1 bg-red-50 rounded" title="Hapus"><Trash2 size={16}/></button>
                         </div>
                      )}
                      {req.status === 'Disetujui' && (
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleOpenPrintModal(req)} className="text-blue-500 hover:text-blue-700 p-1 bg-blue-50 rounded" title="Cetak Surat"><Printer size={16}/></button>
                          {req.kategoriIjin.startsWith('Cuti') && (
                            <a href="https://drive.google.com/drive/folders/1DDrblEQh1TWraiKi1tkNgCOmlyOxGWVS?usp=sharing" target="_blank" rel="noreferrer" className="text-indigo-500 hover:text-indigo-700 p-1 bg-indigo-50 rounded" title="Format Cuti"><FileText size={16}/></a>
                          )}
                        </div>
                      )}
                      {req.status === 'Ditolak' && canApprove && (
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleDelete(req.id)} className="text-red-500 hover:text-red-700 p-1 bg-red-50 rounded" title="Hapus"><Trash2 size={16}/></button>
                        </div>
                      )}
                      {req.status !== 'Menunggu' && req.status !== 'Disetujui' && req.status !== 'Ditolak' && <span className="text-gray-300">-</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredRequests.length === 0 && (
              <div className="p-8 text-center text-gray-500">Tidak ada data ditemukan.</div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'form' && currentUser?.role !== 'superadmin' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 max-w-4xl mx-auto">
          <div className="mb-8 border-b border-gray-100 pb-4">
            <h2 className="text-xl font-bold text-gray-800">Form Pengajuan Izin / Dispensasi</h2>
            <p className="text-gray-500 text-sm mt-1">Lengkapi data di bawah ini dengan benar.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* User Info (Read Only) */}
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Nama Pegawai</label>
                <div className="font-bold text-gray-800">{currentUser?.fullName}</div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  {getNipLabel(currentUser?.statusPegawai, currentUser?.nip, currentUser?.id, currentUser?.fullName)}
                </label>
                <div className="font-medium text-gray-700">{currentUser?.nip || '-'}</div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Jabatan</label>
                <div className="font-medium text-gray-700">{currentUser?.position || (currentUser?.role === 'guru' ? 'Guru' : 'Staff')}</div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Pangkat / Golongan</label>
                <div className="font-medium text-gray-700">{currentUser?.rank || '-'}</div>
              </div>
            </div>

            {/* Kategori */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Jenis Pengajuan</label>
                <select
                  value={ijinGroup}
                  onChange={(e) => setIjinGroup(e.target.value as keyof typeof IJIN_OPTIONS)}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {Object.keys(IJIN_OPTIONS).map(group => (
                    <option key={group} value={group}>{group}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Detail {ijinGroup}</label>
                <select
                  value={kategoriIjin}
                  onChange={(e) => setKategoriIjin(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {IJIN_OPTIONS[ijinGroup].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {ijinGroup === 'Cuti' && kategoriIjin === 'Lainnya' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Sebutkan Jenis Cuti</label>
                  <input
                    type="text"
                    value={jenisCutiLainnya}
                    onChange={(e) => setJenisCutiLainnya(e.target.value)}
                    placeholder="Sebutkan jenis cuti..."
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              )}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <label className="flex items-center text-sm font-bold text-gray-700 mb-3">
                  <Calendar size={16} className="mr-2 text-indigo-500" /> Tanggal Mulai
                </label>
                <input
                  type="datetime-local"
                  required
                  value={tanggalMulai}
                  onChange={(e) => setTanggalMulai(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <label className="flex items-center text-sm font-bold text-gray-700 mb-3">
                  <Calendar size={16} className="mr-2 text-indigo-500" /> Tanggal Selesai
                </label>
                <input
                  type="datetime-local"
                  required
                  value={tanggalSelesai}
                  onChange={(e) => setTanggalSelesai(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Alasan */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Alasan Detail</label>
              <textarea
                required
                rows={4}
                value={alasan}
                onChange={(e) => setAlasan(e.target.value)}
                placeholder="Tuliskan alasan lengkap pengajuan izin/dispensasi..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              ></textarea>
            </div>

            <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center"
              >
                Kirim Pengajuan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalData.isOpen && rejectModalData.request && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[150] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Tolak Pengajuan Izin</h3>
            <p className="text-sm text-gray-600 mb-4">Silakan masukkan alasan penolakan untuk pengajuan dari {rejectModalData.request.userName}.</p>
            <textarea
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 mb-4 min-h-[100px]"
              placeholder="Alasan penolakan..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => { setRejectModalData({ isOpen: false, request: null }); setRejectionReason(""); }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-200"
              >
                Batal
              </button>
              <button 
                onClick={() => {
                  if (!rejectionReason.trim()) {
                      onShowNotification('Harap isi alasan penolakan.', 'warning');
                      return;
                  }
                  handleUpdateStatus(rejectModalData.request!, 'Ditolak', rejectionReason);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700"
              >
                Tolak Pengajuan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModalData.isOpen && editModalData.request && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[150] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-gray-800">Edit Pengajuan Izin</h3>
              <button 
                onClick={() => setEditModalData({ isOpen: false, request: null })}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Jenis Pengajuan</label>
                  <select
                    value={editIjinGroup}
                    onChange={(e) => {
                      const grp = e.target.value as keyof typeof IJIN_OPTIONS;
                      setEditIjinGroup(grp);
                      setEditKategoriIjin(IJIN_OPTIONS[grp][0]);
                    }}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {Object.keys(IJIN_OPTIONS).map(group => (
                      <option key={group} value={group}>{group}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Detail {editIjinGroup}</label>
                  <select
                    value={editKategoriIjin}
                    onChange={(e) => setEditKategoriIjin(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {IJIN_OPTIONS[editIjinGroup].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {editIjinGroup === 'Cuti' && editKategoriIjin === 'Lainnya' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Sebutkan Jenis Cuti</label>
                  <input
                    type="text"
                    value={editJenisCutiLainnya}
                    onChange={(e) => setEditJenisCutiLainnya(e.target.value)}
                    placeholder="Sebutkan jenis cuti..."
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Tanggal Mulai</label>
                  <input
                    type="datetime-local"
                    required
                    value={editTanggalMulai}
                    onChange={(e) => setEditTanggalMulai(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Tanggal Selesai</label>
                  <input
                    type="datetime-local"
                    required
                    value={editTanggalSelesai}
                    onChange={(e) => setEditTanggalSelesai(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Alasan Detail</label>
                <textarea
                  required
                  rows={3}
                  value={editAlasan}
                  onChange={(e) => setEditAlasan(e.target.value)}
                  placeholder="Tuliskan alasan..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditModalData({ isOpen: false, request: null })}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 shadow"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {printRequestedLeave && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 print:p-0 print:bg-white print:block">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto print:shadow-none print:w-full print:max-w-none print:max-h-none print:overflow-visible relative">
            
            {/* Modal Actions (Hidden in print) */}
            <div className="sticky top-0 bg-white border-b border-gray-100 p-4 z-10 rounded-t-xl print:hidden">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800">Pratinjau & Cetak Surat</h3>
                <button
                  onClick={() => setPrintRequestedLeave(null)}
                  className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-bold hover:bg-gray-50"
                >
                  Tutup
                </button>
              </div>
              
              {(() => {
                const isCuti = printRequestedLeave.kategoriIjin.toLowerCase().includes('cuti');
                const isDispensasi = printRequestedLeave.kategoriIjin.toLowerCase().includes('dispensasi');
                const availableLetterTypes = isDispensasi
                  ? ['Surat Dispensasi']
                  : isCuti
                  ? ['Permohonan Cuti', 'Izin Cuti', 'Pengantar']
                  : ['Surat Izin']; // Menampilkan Surat Izin saja jika kategori izin

                const activeType = isDispensasi ? 'Surat Dispensasi' : letterType;
                const hasLetterNumber = ['Surat Izin', 'Izin Cuti', 'Pengantar'].includes(activeType);

                return (
                  <>
                    {!isDispensasi && availableLetterTypes.length > 1 && (
                      <div className="flex gap-2 mb-4 overflow-x-auto">
                        {availableLetterTypes.map(type => (
                          <button
                            key={type}
                            onClick={() => setLetterType(type)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${activeType === type ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between mb-2">
                      {hasLetterNumber ? (
                        <div className="flex items-center gap-2 flex-1 max-w-md">
                          <span className="text-xs font-bold text-gray-700 whitespace-nowrap">Nomor Surat:</span>
                          <input
                            type="text"
                            value={manualLetterNumber}
                            onChange={(e) => setManualLetterNumber(e.target.value)}
                            placeholder="Contoh: 800.1.11.2/043/414.101.319/2026"
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800"
                          />
                        </div>
                      ) : (
                        <div className="flex-1"></div>
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={handleExecutePrint}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold flex items-center shadow-sm shadow-indigo-200 hover:bg-indigo-700 transition-colors"
                        >
                          <Printer size={16} className="mr-2" /> Cetak {activeType}
                        </button>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Printable Content */}
            {(() => {
              const nipLabel = getNipLabel(printRequestedLeave.statusPegawai, printRequestedLeave.nip, printRequestedLeave.userId, printRequestedLeave.userName);
              
              const getCleanCategory = (rawCat: string) => {
                if (!rawCat) return '';
                let str = rawCat.trim();
                const match = str.match(/\(([^)]+)\)/);
                if (match) {
                  str = match[1].trim();
                }
                str = str
                  .replace(/^cuti\s*-\s*/i, '')
                  .replace(/^dispensasi\s*-\s*/i, '')
                  .replace(/^ijin\s*-\s*/i, '')
                  .replace(/^izin\s*-\s*/i, '');
                return str;
              };

              const cleanCat = getCleanCategory(printRequestedLeave.kategoriIjin);

              const isCuti = printRequestedLeave.kategoriIjin.toLowerCase().includes('cuti');
              const isDispensasi = printRequestedLeave.kategoriIjin.toLowerCase().includes('dispensasi');
              const currentLetterType = isDispensasi ? 'Surat Dispensasi' : letterType;

              const getJamAwal = (dateStr: string) => {
                if (!dateStr) return '07.00';
                const d = new Date(dateStr);
                if (isNaN(d.getTime())) return '07.00';
                const h = d.getHours();
                const m = d.getMinutes();
                if (h === 0 && m === 0) return '07.00';
                return `${String(h).padStart(2, '0')}.${String(m).padStart(2, '0')}`;
              };

              const getJamAkhir = (dateStr: string) => {
                if (!dateStr) return 'Selesai';
                const d = new Date(dateStr);
                if (isNaN(d.getTime())) return 'Selesai';
                const h = d.getHours();
                const m = d.getMinutes();
                if (h === 0 && m === 0) return 'Selesai';
                return `${String(h).padStart(2, '0')}.${String(m).padStart(2, '0')}`;
              };

              const startD = new Date(printRequestedLeave.tanggalMulai);
              const endD = new Date(printRequestedLeave.tanggalSelesai);
              const isSameDay = !isNaN(startD.getTime()) && !isNaN(endD.getTime()) && startD.toDateString() === endD.toDateString();

              const tglDisplay = isSameDay
                ? startD.toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})
                : `${startD.toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})} s/d ${endD.toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}`;

              const jamAwal = getJamAwal(printRequestedLeave.tanggalMulai);
              const jamAkhir = getJamAkhir(printRequestedLeave.tanggalSelesai);

              return (
                <div id="printable-area" className="p-8 sm:p-12 text-black bg-white print:p-0 sagara-print-content printable-area">
                  {/* SURAT DISPENSASI */}
                  {currentLetterType === 'Surat Dispensasi' && (
                    <div className="text-sm font-sans">
                      <div className="text-center mb-8">
                        <h2 className="font-bold text-base sm:text-lg uppercase tracking-wide">PERSETUJUAN PEMBERIAN</h2>
                        <h2 className="font-bold text-base sm:text-lg uppercase tracking-wide">{cleanCat.toUpperCase()}</h2>
                      </div>

                      <div className="space-y-4 leading-relaxed">
                        <p>Yang bertanda tangan dibawah ini:</p>
                        
                        <table className="w-full ml-2 my-2 border-collapse">
                          <tbody>
                            <tr>
                              <td className="w-44 py-1 align-top">Nama</td>
                              <td className="w-4 py-1 align-top">:</td>
                              <td className="py-1 font-semibold">{schoolProfile?.headmaster || '.....................'}</td>
                            </tr>
                            <tr>
                              <td className="py-1 align-top">NIP</td>
                              <td className="py-1 align-top">:</td>
                              <td className="py-1">{schoolProfile?.headmasterNip || '.....................'}</td>
                            </tr>
                            <tr>
                              <td className="py-1 align-top">Pangkat/Gol.Ruang</td>
                              <td className="py-1 align-top">:</td>
                              <td className="py-1">{schoolProfile?.headmasterRank || headmasterUser?.rank || '-'}</td>
                            </tr>
                            <tr>
                              <td className="py-1 align-top">Jabatan</td>
                              <td className="py-1 align-top">:</td>
                              <td className="py-1">Kepala {schoolProfile?.name || 'Sekolah'}</td>
                            </tr>
                          </tbody>
                        </table>

                        <p className="mt-4">Dengan ini memberikan <strong>{cleanCat}</strong> kepada :</p>
                        
                        <table className="w-full ml-2 my-2 border-collapse">
                          <tbody>
                            <tr>
                              <td className="w-44 py-1 align-top">Nama</td>
                              <td className="w-4 py-1 align-top">:</td>
                              <td className="py-1 font-semibold">{printRequestedLeave.userName}</td>
                            </tr>
                            <tr>
                              <td className="py-1 align-top">{nipLabel}</td>
                              <td className="py-1 align-top">:</td>
                              <td className="py-1">{printRequestedLeave.nip}</td>
                            </tr>
                            <tr>
                              <td className="py-1 align-top">Pangkat/Gol.Ruang</td>
                              <td className="py-1 align-top">:</td>
                              <td className="py-1">{printRequestedLeave.pangkat}</td>
                            </tr>
                            <tr>
                              <td className="py-1 align-top">Jabatan</td>
                              <td className="py-1 align-top">:</td>
                              <td className="py-1">{printRequestedLeave.jabatan}</td>
                            </tr>
                          </tbody>
                        </table>

                        <div className="mt-6 space-y-2">
                          <p>
                            Pada tanggal : {tglDisplay}, jam {jamAwal} s/d {jamAkhir} WIB, karena :
                          </p>

                          <div className="flex items-start gap-2 mt-3 ml-2">
                            <span className="text-base leading-none">☑</span>
                            <span className="font-medium">{printRequestedLeave.alasan}</span>
                          </div>
                        </div>

                        <p className="mt-6">Demikian persetujuan ini dibuat dengan sebenarnya, untuk dipergunakan sebagaimana mestinya.</p>
                      </div>

                      <div className="flex justify-end mt-12">
                        <div className="text-center w-64">
                          <p>{schoolProfile?.desa || schoolProfile?.kabupaten || 'Tuban'}, {new Date(printRequestedLeave.tanggalMulai).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
                          <p className="font-medium mb-2">Atasan Langsung</p>
                          <div className="h-24 relative flex items-center justify-center my-2">
                            {schoolProfile?.headmasterSignature && (
                              <img src={schoolProfile.headmasterSignature} alt="Tanda Tangan" className="h-20 object-contain absolute" />
                            )}
                          </div>
                          <p className="font-bold underline">{schoolProfile?.headmaster || '.....................'}</p>
                          <p>NIP. {schoolProfile?.headmasterNip || '.....................'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PERMOHONAN DISPENSASI / PERMOHONAN IZIN */}
                  {(currentLetterType === 'Permohonan Dispensasi' || currentLetterType === 'Permohonan Izin') && (
                    <>
                      <div className="text-right mb-4">
                        <p>{schoolProfile?.desa || 'Tuban'}, {new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
                      </div>
                      
                      <div className="mb-6">
                        <p>Perihal : PERMOHONAN {cleanCat.toUpperCase()}</p>
                        <p>Yth. KEPALA DINAS PENDIDIKAN KABUPATEN TUBAN</p>
                        <p>di -</p>
                        <p className="ml-4">Tuban</p>
                      </div>

                      <div className="text-sm space-y-4 leading-relaxed">
                        <p>Yang bertanda tangan di bawah ini :</p>
                        <table className="w-full ml-4">
                          <tbody>
                            <tr><td className="w-40 py-1">Nama</td><td className="w-4">:</td><td className="font-bold">{printRequestedLeave.userName}</td></tr>
                            <tr><td className="py-1">{nipLabel}</td><td className="py-1">:</td><td className="py-1">{printRequestedLeave.nip}</td></tr>
                            <tr><td className="py-1">Pangkat / Gol. Ruang</td><td className="py-1">:</td><td className="py-1">{printRequestedLeave.pangkat}</td></tr>
                            <tr><td className="py-1">Jabatan</td><td className="py-1">:</td><td className="py-1">{printRequestedLeave.jabatan}</td></tr>
                            <tr><td className="py-1">Unit Kerja</td><td className="py-1">:</td><td className="py-1">{schoolProfile?.name || '.....................'}</td></tr>
                          </tbody>
                        </table>

                        <div className="space-y-3">
                          <div className="flex gap-2 items-start">
                            <span className="w-5 shrink-0">1.</span>
                            <span className="flex-1">Dengan ini mengajukan permohonan {cleanCat.toLowerCase()}, terhitung mulai tanggal {new Date(printRequestedLeave.tanggalMulai).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})} sampai dengan tanggal {new Date(printRequestedLeave.tanggalSelesai).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})} dikarenakan: {printRequestedLeave.alasan}.</span>
                          </div>
                          
                          <div className="flex gap-2 items-start">
                            <span className="w-5 shrink-0">2.</span>
                            <span className="flex-1">Selama melaksanakan {isDispensasi ? 'dispensasi' : 'izin'}, tugas dan tanggung jawab pekerjaan telah saya koordinasikan dengan atasan langsung / guru piket / rekan sejawat.</span>
                          </div>

                          <div className="flex gap-2 items-start">
                            <span className="w-5 shrink-0">3.</span>
                            <span className="flex-1">Setelah selesai, saya wajib melaporkan diri kepada atasan langsung dan bekerja kembali sebagaimana biasa.</span>
                          </div>
                        </div>

                        <p className="mt-4">Demikian surat permohonan ini saya buat untuk dapat dipergunakan dan diproses sebagaimana mestinya.</p>
                      </div>
                      
                      <div className="flex justify-between mt-12">
                        <div className="text-center w-1/2">
                          <p>Mengetahui,</p>
                          <p>Kepala {schoolProfile?.name || '...'}</p>
                          <div className="h-24 relative flex items-center justify-center">
                             {schoolProfile?.headmasterSignature && (
                                <img src={schoolProfile.headmasterSignature} alt="Tanda Tangan" className="h-20 object-contain absolute" />
                             )}
                          </div>
                          <p className="font-bold underline">{schoolProfile?.headmaster || '.....................'}</p>
                          <p>NIP. {schoolProfile?.headmasterNip || '.....................'}</p>
                        </div>
                        <div className="text-center w-1/2 flex flex-col items-center">
                          <p className="invisible">Mengetahui,</p>
                          <p>Hormat saya,</p>
                          <div className="h-24"></div>
                          <p className="font-bold underline">{printRequestedLeave.userName}</p>
                          <p>{nipLabel}. {printRequestedLeave.nip}</p>
                        </div>
                      </div>
                    </>
                  )}

                  {/* PERMOHONAN CUTI / PERMOHONAN */}
                  {(letterType === 'Permohonan Cuti' || letterType === 'Permohonan') && (
                    <>
                      <div className="text-right mb-4">
                        <p>{schoolProfile?.desa || 'Tuban'}, {new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
                      </div>
                      
                      <div className="mb-6">
                        <p>Perihal : PERMOHONAN {cleanCat.toUpperCase()}</p>
                        <p>Yth. KEPALA DINAS PENDIDIKAN KABUPATEN TUBAN</p>
                        <p>di -</p>
                        <p className="ml-4">Tuban</p>
                      </div>

                      <div className="text-sm space-y-4 leading-relaxed">
                        <p>Yang bertanda tangan di bawah ini :</p>
                        <table className="w-full ml-4">
                          <tbody>
                            <tr><td className="w-40 py-1">Nama</td><td className="w-4">:</td><td className="font-bold">{printRequestedLeave.userName}</td></tr>
                            <tr><td className="py-1">{nipLabel}</td><td className="py-1">:</td><td className="py-1">{printRequestedLeave.nip}</td></tr>
                            <tr><td className="py-1">Pangkat / Gol. Ruang</td><td className="py-1">:</td><td className="py-1">{printRequestedLeave.pangkat}</td></tr>
                            <tr><td className="py-1">Jabatan</td><td className="py-1">:</td><td className="py-1">{printRequestedLeave.jabatan}</td></tr>
                            <tr><td className="py-1">Unit Kerja</td><td className="py-1">:</td><td className="py-1">{schoolProfile?.name || '.....................'}</td></tr>
                          </tbody>
                        </table>

                        <div className="space-y-3">
                          <div className="flex gap-2 items-start">
                            <span className="w-5 shrink-0">1.</span>
                            <span className="flex-1">Dengan ini mengajukan permohonan {cleanCat}, terhitung mulai tanggal {new Date(printRequestedLeave.tanggalMulai).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})} sampai dengan tanggal {new Date(printRequestedLeave.tanggalSelesai).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}.</span>
                          </div>
                          
                          <div className="flex gap-2 items-start">
                            <span className="w-5 shrink-0">2.</span>
                            <span className="flex-1">Sebelum melaksanakan cuti saya telah menyerahkan pekerjaan kepada atasan langsung atau pejabat yang ditunjuk.</span>
                          </div>

                          <div className="flex gap-2 items-start">
                            <span className="w-5 shrink-0">3.</span>
                            <span className="flex-1">Setelah menjalankan cuti wajib melapor kepada atasan langsung dan bekerja kembali seperti biasa.</span>
                          </div>
                        </div>

                        <p className="mt-4">Demikian surat permintaan ini saya buat untuk mendapatkan penyelesaian lebih lanjut.</p>
                      </div>
                      
                      <div className="flex justify-between mt-12">
                        <div className="text-center w-1/2">
                          <p>Mengetahui,</p>
                          <p>Kepala {schoolProfile?.name || '...'}</p>
                          <div className="h-24 relative flex items-center justify-center">
                             {schoolProfile?.headmasterSignature && (
                                <img src={schoolProfile.headmasterSignature} alt="Tanda Tangan" className="h-20 object-contain absolute" />
                             )}
                          </div>
                          <p className="font-bold underline">{schoolProfile?.headmaster || '.....................'}</p>
                          <p>NIP. {schoolProfile?.headmasterNip || '.....................'}</p>
                        </div>
                        <div className="text-center w-1/2 flex flex-col items-center">
                          <p className="invisible">Mengetahui,</p>
                          <p>Hormat saya,</p>
                          <div className="h-24"></div>
                          <p className="font-bold underline">{printRequestedLeave.userName}</p>
                          <p>{nipLabel}. {printRequestedLeave.nip}</p>
                        </div>
                      </div>
                    </>
                  )}

                  {/* SURAT IZIN */}
                  {letterType === 'Surat Izin' && (
                    <div className="text-sm">
                      {renderHeader()}
                      <div className="text-center mb-6">
                        <h2 className="font-bold text-lg underline">SURAT IZIN</h2>
                        <p>NOMOR : {manualLetterNumber || '.....................'}</p>
                      </div>
                      <div className="space-y-4 leading-relaxed">
                        <p>Yang bertanda tangan di bawah ini, Kepala {schoolProfile?.name || 'Sekolah'}, memberikan izin kepada :</p>
                        <table className="w-full ml-4">
                          <tbody>
                            <tr><td className="w-40 py-1">Nama</td><td className="w-4">:</td><td className="font-bold">{printRequestedLeave.userName}</td></tr>
                            <tr><td className="py-1">{nipLabel}</td><td className="py-1">:</td><td className="py-1">{printRequestedLeave.nip}</td></tr>
                            <tr><td className="py-1">Pangkat / Gol. Ruang</td><td className="py-1">:</td><td className="py-1">{printRequestedLeave.pangkat}</td></tr>
                            <tr><td className="py-1">Jabatan</td><td className="py-1">:</td><td className="py-1">{printRequestedLeave.jabatan}</td></tr>
                            <tr><td className="py-1">Unit Kerja</td><td className="py-1">:</td><td className="py-1">{schoolProfile?.name || '.....................'}</td></tr>
                          </tbody>
                        </table>

                        <div className="space-y-2 mt-4">
                          <p>Untuk : <strong>{cleanCat}</strong> ({printRequestedLeave.alasan})</p>
                          <p>Terhitung mulai tanggal <strong>{new Date(printRequestedLeave.tanggalMulai).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</strong> sampai dengan tanggal <strong>{new Date(printRequestedLeave.tanggalSelesai).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</strong>.</p>
                        </div>

                        <p className="mt-4">Demikian Surat Izin ini dibuat untuk dapat dipergunakan sebagaimana mestinya.</p>
                      </div>

                      <div className="text-center w-1/2 ml-auto mt-12">
                        <p>{schoolProfile?.desa || 'Tuban'}, {new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
                        <p>Kepala {schoolProfile?.name || '...'}</p>
                        <div className="h-24 relative flex items-center justify-center">
                          {schoolProfile?.headmasterSignature && (
                            <img src={schoolProfile.headmasterSignature} alt="Tanda Tangan" className="h-20 object-contain absolute" />
                          )}
                        </div>
                        <p className="font-bold underline">{schoolProfile?.headmaster || '.....................'}</p>
                        <p>NIP. {schoolProfile?.headmasterNip || '.....................'}</p>
                      </div>
                    </div>
                  )}

                  {/* IZIN CUTI */}
                  {letterType === 'Izin Cuti' && (
                    <div className="text-sm">
                      {renderHeader()}
                      <div className="text-center mb-6">
                        <h2 className="font-bold text-lg underline">IZIN SEMENTARA PELAKSANAAN CUTI</h2>
                        <p>NOMOR : {manualLetterNumber || '.....................'}</p>
                      </div>
                      <div className="flex gap-2 items-start">
                        <span className="w-5 shrink-0">1.</span>
                        <div className="flex-1 space-y-3">
                          <p>Diberikan izin sementara untuk melaksanakan {cleanCat}, kepada Pegawai di bawah ini :</p>
                          <table className="w-full">
                            <tbody>
                              <tr><td className="w-40 py-1">Nama</td><td className="w-4">:</td><td className="font-bold">{printRequestedLeave.userName}</td></tr>
                              <tr><td className="py-1">{nipLabel}</td><td className="py-1">:</td><td className="py-1">{printRequestedLeave.nip}</td></tr>
                              <tr><td className="py-1">Pangkat / Gol. Ruang</td><td className="py-1">:</td><td className="py-1">{printRequestedLeave.pangkat}</td></tr>
                              <tr><td className="py-1">Jabatan</td><td className="py-1">:</td><td className="py-1">{printRequestedLeave.jabatan}</td></tr>
                              <tr><td className="py-1">Unit Kerja</td><td className="py-1">:</td><td className="py-1">{schoolProfile?.name || '.....................'}</td></tr>
                            </tbody>
                          </table>
                          <p>Selama {Math.max(1, Math.ceil((new Date(printRequestedLeave.tanggalSelesai).getTime() - new Date(printRequestedLeave.tanggalMulai).getTime()) / (1000 * 60 * 60 * 24)))} hari, terhitung mulai tanggal {new Date(printRequestedLeave.tanggalMulai).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})} sampai dengan tanggal {new Date(printRequestedLeave.tanggalSelesai).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}, dengan ketentuan sebagai berikut :</p>
                          <div className="space-y-1">
                            <div className="flex gap-2 items-start">
                              <span className="w-5 shrink-0">a.</span>
                              <span className="flex-1">Sebelum melaksanakan Cuti, wajib menyerahkan pekerjaan kepada atasan langsungnya atau pejabat lain yang ditunjuk.</span>
                            </div>
                            <div className="flex gap-2 items-start">
                              <span className="w-5 shrink-0">b.</span>
                              <span className="flex-1">Setelah selesai menjalankan Cuti, wajib melaporkan diri kepada atasan langsungnya dan bekerja kembali sebagaimana biasa.</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 items-start mt-4">
                        <span className="w-5 shrink-0">2.</span>
                        <span className="flex-1">Demikian izin sementara melaksanakan {cleanCat} ini dibuat untuk dapat digunakan seperlunya.</span>
                      </div>
                      
                      <div className="text-center w-1/2 ml-auto mt-12">
                        <p>Kepala {schoolProfile?.name || '...'}</p>
                        <div className="h-24 relative flex items-center justify-center">
                          {schoolProfile?.headmasterSignature && (
                            <img src={schoolProfile.headmasterSignature} alt="Tanda Tangan" className="h-20 object-contain absolute" />
                          )}
                        </div>
                        <p className="font-bold underline">{schoolProfile?.headmaster || '.....................'}</p>
                        <p>NIP. {schoolProfile?.headmasterNip || '.....................'}</p>
                      </div>
                    </div>
                  )}

                  {/* PENGANTAR */}
                  {letterType === 'Pengantar' && (
                    <div className="text-sm">
                      {renderHeader()}
                      <div className="text-center mb-6">
                        <h2 className="font-bold text-lg underline">SURAT PENGANTAR</h2>
                        <p>Nomor : {manualLetterNumber || '.....................'}</p>
                      </div>
                      <table className="w-full border-collapse border border-black mb-8">
                        <thead>
                          <tr>
                            <th className="border border-black p-2 text-center w-12">NO</th>
                            <th className="border border-black p-2 text-center whitespace-nowrap">ISI SURAT</th>
                            <th className="border border-black p-2 text-center whitespace-nowrap">JUMLAH</th>
                            <th className="border border-black p-2 text-center">KETERANGAN</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-black p-2 text-center align-top">1</td>
                            <td className="border border-black p-2 align-top whitespace-nowrap">
                              <div className="mb-1">Pengajuan {cleanCat} atas :</div>
                              <table className="border-none text-sm">
                                <tbody>
                                  <tr>
                                    <td className="pr-2 py-0.5 border-none">Nama</td>
                                    <td className="px-1 py-0.5 border-none">:</td>
                                    <td className="py-0.5 border-none font-medium">{printRequestedLeave.userName}</td>
                                  </tr>
                                  <tr>
                                    <td className="pr-2 py-0.5 border-none">{nipLabel}</td>
                                    <td className="px-1 py-0.5 border-none">:</td>
                                    <td className="py-0.5 border-none">{printRequestedLeave.nip}</td>
                                  </tr>
                                  <tr>
                                    <td className="pr-2 py-0.5 border-none">Jabatan</td>
                                    <td className="px-1 py-0.5 border-none">:</td>
                                    <td className="py-0.5 border-none">{printRequestedLeave.jabatan}</td>
                                  </tr>
                                  <tr>
                                    <td className="pr-2 py-0.5 border-none">Unit Kerja</td>
                                    <td className="px-1 py-0.5 border-none">:</td>
                                    <td className="py-0.5 border-none">{schoolProfile?.name || '.....................'}</td>
                                  </tr>
                                </tbody>
                              </table>
                            </td>
                            <td className="border border-black p-2 text-center align-top whitespace-nowrap">1 bendel</td>
                            <td className="border border-black p-2 align-top break-words">Demikian untuk menjadikan periksa dan atas penyelesaiannya disampaikan terima kasih.</td>
                          </tr>
                        </tbody>
                      </table>
                      <div className="flex justify-between mt-12">
                        <div className="w-1/2">
                          <p>Diterima pada tgl : ....................</p>
                        </div>
                        <div className="text-center w-1/2 flex flex-col items-center">
                          <p>Kepala {schoolProfile?.name || '...'}</p>
                          <div className="h-24 relative flex items-center justify-center">
                            {schoolProfile?.headmasterSignature && (
                              <img src={schoolProfile.headmasterSignature} alt="Tanda Tangan" className="h-20 object-contain absolute" />
                            )}
                          </div>
                          <p className="font-bold underline">{schoolProfile?.headmaster || '.....................'}</p>
                          <p>NIP. {schoolProfile?.headmasterNip || '.....................'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
            
            {/* Letter Number Modal */}
            {isLetterNumberModalOpen && (
              <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4 print:hidden">
                <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl border border-gray-100">
                  <h3 className="font-bold text-gray-800 mb-2">Input Nomor Surat</h3>
                  <p className="text-xs text-gray-500 mb-4">Nomor surat akan dicetak pada dokumen. Kosongkan jika belum ada nomor.</p>
                  <input
                    type="text"
                    value={manualLetterNumber}
                    onChange={(e) => setManualLetterNumber(e.target.value)}
                    placeholder="800.1.11.2/043/414.101.319/2026"
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4 text-gray-800"
                  />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setIsLetterNumberModalOpen(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-200">Batal</button>
                    <button
                      onClick={handleExecutePrint}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 flex items-center gap-2"
                    >
                      <Printer size={16} /> Cetak
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <CustomModal
        isOpen={confirmModal.isOpen}
        type="confirm"
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default StaffLeaveView;
