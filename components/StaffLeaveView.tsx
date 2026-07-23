import React, { useState, useEffect, useMemo } from 'react';
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
  const [printRequestedLeave, setPrintRequestedLeave] = useState<StaffLeaveRequest | null>(null);
  const [letterType, setLetterType] = useState('Permohonan');
  const [isLetterNumberModalOpen, setIsLetterNumberModalOpen] = useState(false);
  const [manualLetterNumber, setManualLetterNumber] = useState("800.1.11.2/043/414.101.319/2026");

  // Form state
  const [ijinGroup, setIjinGroup] = useState<keyof typeof IJIN_OPTIONS>('Dispensasi');
  const [kategoriIjin, setKategoriIjin] = useState<string>(IJIN_OPTIONS['Dispensasi'][0]);
  const [jenisCutiLainnya, setJenisCutiLainnya] = useState('');
  const [tanggalMulai, setTanggalMulai] = useState('');
  const [tanggalSelesai, setTanggalSelesai] = useState('');
  const [alasan, setAlasan] = useState('');
  
  // Permissions
  const isPrincipal = currentUser?.role === 'admin' || currentUser?.role === 'superadmin' || currentUser?.role === 'Kepala Sekolah'; // Assuming admin/supervisor acts as principal here for approval
  const canApprove = isPrincipal;

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
      const [data, profiles, users] = await Promise.all([
        apiService.getStaffLeaveRequests(),
        apiService.getProfiles(),
        currentUser ? apiService.getUsers(currentUser) : Promise.resolve([])
      ]);
      setRequests(data);
      if (profiles && profiles.school) setSchoolProfile(profiles.school);
      
      if (users && users.length > 0) {
        const principal = users.find(u => u.role === 'Kepala Sekolah');
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
    if (isPrincipal) return requests; // Principal sees all requests
    return requests.filter(r => r.userId === currentUser.id);
  }, [requests, currentUser, isPrincipal]);

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

    const newRequest: StaffLeaveRequest = {
      id: `leave-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.fullName,
      nip: currentUser.nip || '-', // Assuming user has nip
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


  const handleUpdateStatus = async (req: StaffLeaveRequest, newStatus: 'Disetujui' | 'Ditolak') => {
    if (!canApprove) return;
    try {
      const updated = { ...req, status: newStatus };
      await apiService.saveStaffLeaveRequest(updated);
      setRequests(requests.map(r => r.id === req.id ? updated : r));
      onShowNotification(`Pengajuan berhasil ${newStatus.toLowerCase()}.`, 'success');
    } catch (e) {
      console.error(e);
      onShowNotification('Gagal memperbarui status pengajuan.', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus pengajuan ini?')) return;
    try {
      await apiService.deleteStaffLeaveRequest(id);
      setRequests(requests.filter(r => r.id !== id));
      onShowNotification('Pengajuan berhasil dihapus.', 'success');
    } catch (e) {
      console.error(e);
      onShowNotification('Gagal menghapus pengajuan.', 'error');
    }
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
              <div className="p-0">
                {myRequests.slice(0, 5).map(req => (
                  <div key={req.id} className="p-5 border-b border-gray-50 flex flex-col sm:flex-row justify-between gap-4 hover:bg-gray-50/50">
                    <div>
                      <h4 className="font-bold text-gray-800">{req.userName}</h4>
                      <p className="text-xs text-gray-400 mt-0.5">{req.nip}</p>
                      <div className="flex gap-2 mt-2">
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-bold">{req.pangkat}</span>
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold">{req.jabatan}</span>
                      </div>
                    </div>
                    <div className="flex-1 sm:px-6">
                      <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-[10px] font-bold rounded-full mb-2">
                        {req.kategoriIjin.replace('Cuti - ', '')}
                      </span>
                      <div className="flex items-center text-xs text-gray-600 mb-1">
                        <Calendar size={12} className="mr-1.5" />
                        {new Date(req.tanggalMulai).toLocaleDateString('id-ID')} - {new Date(req.tanggalSelesai).toLocaleDateString('id-ID')}
                      </div>
                      <p className="text-xs text-gray-500 italic">"{req.alasan}"</p>
                    </div>
                    <div className="flex flex-col items-end justify-between">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                        req.status === 'Disetujui' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                        req.status === 'Ditolak' ? 'bg-red-50 text-red-600 border border-red-200' :
                        'bg-amber-50 text-amber-600 border border-amber-200'
                      }`}>
                        {req.status}
                      </span>
                      {req.status === 'Disetujui' && (
                        <div className="flex gap-2 mt-2">
                           <button onClick={() => setPrintRequestedLeave(req)} className="text-blue-500 hover:text-blue-700 p-1 bg-blue-50 rounded" title="Cetak PDF"><FileText size={16}/></button>
                           {req.kategoriIjin.startsWith('Cuti') && (
                             <a href="https://drive.google.com/file/d/1tHxCfcRvXv-YRc2H1j6kB9651668BchF/view?usp=sharing" target="_blank" rel="noreferrer" className="text-indigo-500 hover:text-indigo-700 p-1 bg-indigo-50 rounded" title="Download Format"><Download size={16}/></a>
                           )}
                        </div>
                      )}
                      {canApprove && req.status === 'Menunggu' && (
                        <div className="flex gap-2 mt-2">
                           <button onClick={() => handleUpdateStatus(req, 'Disetujui')} className="text-emerald-500 hover:text-emerald-700 p-1 bg-emerald-50 rounded"><CheckCircle size={16}/></button>
                           <button onClick={() => handleUpdateStatus(req, 'Ditolak')} className="text-red-500 hover:text-red-700 p-1 bg-red-50 rounded"><XCircle size={16}/></button>
                        </div>
                      )}
                      {!canApprove && req.status === 'Menunggu' && (
                        <button onClick={() => handleDelete(req.id)} className="text-red-500 hover:text-red-700 p-1 bg-red-50 rounded mt-2"><Trash2 size={16}/></button>
                      )}
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
                           <button onClick={() => handleUpdateStatus(req, 'Ditolak')} className="text-red-500 hover:text-red-700 p-1 bg-red-50 rounded" title="Tolak"><XCircle size={16}/></button>
                        </div>
                      )}
                      {!canApprove && req.status === 'Menunggu' && (
                         <button onClick={() => handleDelete(req.id)} className="text-red-500 hover:text-red-700 p-1 bg-red-50 rounded mx-auto block" title="Hapus"><Trash2 size={16}/></button>
                      )}
                      {req.status === 'Disetujui' && (
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => setPrintRequestedLeave(req)} className="text-blue-500 hover:text-blue-700 p-1 bg-blue-50 rounded" title="Cetak PDF"><FileText size={16}/></button>
                          {req.kategoriIjin.startsWith('Cuti') && (
                            <a href="https://drive.google.com/file/d/1tHxCfcRvXv-YRc2H1j6kB9651668BchF/view?usp=sharing" target="_blank" rel="noreferrer" className="text-indigo-500 hover:text-indigo-700 p-1 bg-indigo-50 rounded" title="Download Format"><Download size={16}/></a>
                          )}
                        </div>
                      )}
                      {req.status !== 'Menunggu' && req.status !== 'Disetujui' && <span className="text-gray-300">-</span>}
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
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">NIP</label>
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

      {printRequestedLeave && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 print:p-0 print:bg-white print:block">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto print:shadow-none print:w-full print:max-w-none print:max-h-none print:overflow-visible relative">
            
            {/* Modal Actions (Hidden in print) */}
            <div className="sticky top-0 bg-white border-b border-gray-100 p-4 z-10 rounded-t-xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800">Pratinjau & Download</h3>
                <button
                  onClick={() => setPrintRequestedLeave(null)}
                  className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-bold hover:bg-gray-50"
                >
                  Tutup
                </button>
              </div>
              
              <div className="flex gap-2 mb-4">
                {['Pengantar', 'Permohonan', 'Izin Cuti'].map(type => (
                  <button
                    key={type}
                    onClick={() => {
                        setLetterType(type);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold ${letterType === type ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setIsLetterNumberModalOpen(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold flex items-center shadow-sm shadow-indigo-200"
                >
                  <Download size={16} className="mr-2" /> Download {letterType}
                </button>
              </div>
            </div>

            {/* Printable Content */}
            <div id="printable-area" className="p-8 sm:p-12 text-black bg-white print:p-0">
              {letterType === 'Permohonan' && (
                <>
                  <div className="text-right mb-4">
                    <p>{schoolProfile?.desa || 'Jenu'}, {new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
                  </div>
                  
                  <div className="mb-6">
                    <p>Perihal : PERMOHONAN {printRequestedLeave.kategoriIjin.toUpperCase()}</p>
                    <p>Yth. KEPALA DINAS PENDIDIKAN KABUPATEN TUBAN</p>
                    <p>di -</p>
                    <p className="ml-4">Tuban</p>
                  </div>

                  <div className="text-sm space-y-4 leading-relaxed">
                    <p>Yang bertanda tangan di bawah ini :</p>
                    <table className="w-full ml-4">
                      <tbody>
                        <tr><td className="w-40 py-1">Nama</td><td className="w-4">:</td><td className="font-bold">{printRequestedLeave.userName}</td></tr>
                        <tr><td className="py-1">NIPPPK</td><td className="py-1">:</td><td className="py-1">{printRequestedLeave.nip}</td></tr>
                        <tr><td className="py-1">Pangkat / Gol. Ruang</td><td className="py-1">:</td><td className="py-1">{printRequestedLeave.pangkat}</td></tr>
                        <tr><td className="py-1">Jabatan</td><td className="py-1">:</td><td className="py-1">{printRequestedLeave.jabatan}</td></tr>
                        <tr><td className="py-1">Unit Kerja</td><td className="py-1">:</td><td className="py-1">{schoolProfile?.name || '_____________________'}</td></tr>
                      </tbody>
                    </table>

                    <p>1. Dengan ini mengajukan permohonan {printRequestedLeave.kategoriIjin.replace('Cuti - ', '')}, terhitung mulai tanggal {new Date(printRequestedLeave.tanggalMulai).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})} sampai dengan tanggal {new Date(printRequestedLeave.tanggalSelesai).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}.</p>
                    
                    <p>2. Sebelum melaksanakan {printRequestedLeave.kategoriIjin.toLowerCase().replace('cuti - ', '')} saya telah menyerahkan pekerjaan kepada atasan langsung atau pejabat yang ditunjuk.</p>
                    <p>3. Setelah menjalankan {printRequestedLeave.kategoriIjin.toLowerCase().replace('cuti - ', '')} wajib melapor kepada atasan langsung dan bekerja kembali seperti biasa.</p>
                    <p>Demikian surat permintaan ini saya buat untuk mendapatkan penyelesaian lebih lanjut.</p>
                  </div>
                  
                  <div className="flex justify-between mt-12">
                    <div className="text-center w-1/2">
                      <p>Mengetahui,</p>
                      <p>Kepala UPT SD Negeri Remen 2</p>
                      <p>Kecamatan Jenu Kabupaten Tuban</p>
                      <div className="h-24 relative flex items-center justify-center">
                         {schoolProfile?.headmasterSignature && (
                            <img src={schoolProfile.headmasterSignature} alt="Tanda Tangan" className="h-20 object-contain absolute" />
                         )}
                      </div>
                      <p className="font-bold underline">{schoolProfile?.headmaster || '_____________________'}</p>
                      <p>NIP. {schoolProfile?.headmasterNip || '_____________________'}</p>
                    </div>
                    <div className="text-center w-1/2 flex flex-col items-center">
                      <p>Hormat saya,</p>
                      <div className="h-24"></div>
                      <p className="font-bold underline">{printRequestedLeave.userName}</p>
                      <p>NIP. {printRequestedLeave.nip}</p>
                    </div>
                  </div>
                </>
              )}
              {letterType === 'Pengantar' && (
                <div className="text-sm">
                  <div className="text-center mb-6">
                    <h2 className="font-bold text-lg underline">SURAT PENGANTAR</h2>
                    <p>Nomor : {manualLetterNumber}</p>
                  </div>
                  <table className="w-full border-collapse border border-black mb-8">
                    <thead>
                      <tr><th className="border border-black p-2">NO</th><th className="border border-black p-2">ISI SURAT</th><th className="border border-black p-2">JUMLAH</th><th className="border border-black p-2">KETERANGAN</th></tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-black p-2 text-center">1</td>
                        <td className="border border-black p-2">
                          Pengajuan {printRequestedLeave.kategoriIjin} atas :<br/>
                          Nama : {printRequestedLeave.userName}<br/>
                          NIPPPK : {printRequestedLeave.nip}<br/>
                          Jabatan : {printRequestedLeave.jabatan}<br/>
                          Unit Kerja : {schoolProfile?.name || '_____________________'}
                        </td>
                        <td className="border border-black p-2 text-center">1 bendel</td>
                        <td className="border border-black p-2">Demikian untuk menjadikan periksa dan atas penyelesaiannya disampaikan terima kasih.</td>
                      </tr>
                    </tbody>
                  </table>
                  <div className="flex justify-between mt-12">
                     <div className="w-1/2">
                        <p>Diterima pada tgl : ....................</p>
                        <div className="border border-gray-400 w-32 h-32 flex items-center justify-center mt-2">Cap</div>
                     </div>
                     <div className="text-center w-1/2 flex flex-col items-center">
                      <p>Kepala UPT SD Negeri Remen 2</p>
                      <div className="h-24"></div>
                      <p className="font-bold underline">{schoolProfile?.headmaster || '_____________________'}</p>
                      <p>NIP. {schoolProfile?.headmasterNip || '_____________________'}</p>
                    </div>
                  </div>
                </div>
              )}
              {letterType === 'Izin Cuti' && (
                 <div className="text-sm">
                    <div className="text-center mb-6">
                        <h2 className="font-bold text-lg underline">IZIN SEMENTARA PELAKSANAAN CUTI</h2>
                        <p>NOMOR : {manualLetterNumber}</p>
                    </div>
                    <p>1. Diberikan izin sementara untuk melaksanakan {printRequestedLeave.kategoriIjin.replace('Cuti - ', '')}, kepada Pegawai Negeri Sipil, dibawah ini :</p>
                    <table className="w-full ml-4 mt-2">
                      <tbody>
                        <tr><td className="w-40 py-1">Nama</td><td className="w-4">:</td><td className="font-bold">{printRequestedLeave.userName}</td></tr>
                        <tr><td className="py-1">NIPPPK</td><td className="py-1">:</td><td className="py-1">{printRequestedLeave.nip}</td></tr>
                        <tr><td className="py-1">Pangkat / Gol. Ruang</td><td className="py-1">:</td><td className="py-1">{printRequestedLeave.pangkat}</td></tr>
                        <tr><td className="py-1">Jabatan</td><td className="py-1">:</td><td className="py-1">{printRequestedLeave.jabatan}</td></tr>
                        <tr><td className="py-1">Unit Kerja</td><td className="py-1">:</td><td className="py-1">{schoolProfile?.name || '_____________________'}</td></tr>
                      </tbody>
                    </table>
                    <p className="mt-4">Selama {Math.ceil((new Date(printRequestedLeave.tanggalSelesai).getTime() - new Date(printRequestedLeave.tanggalMulai).getTime()) / (1000 * 60 * 60 * 24))} hari, terhitung mulai tanggal {new Date(printRequestedLeave.tanggalMulai).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})} sampai dengan tanggal {new Date(printRequestedLeave.tanggalSelesai).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}.</p>
                    <p className="mt-4">2. Demikian izin sementara melaksanakan {printRequestedLeave.kategoriIjin.replace('Cuti - ', '')} ini dibuat untuk dapat digunakan seperlunya.</p>
                    
                    <div className="text-center w-1/2 ml-auto mt-12">
                      <p>Kepala UPT SD Negeri Remen 2</p>
                      <div className="h-24"></div>
                      <p className="font-bold underline">{schoolProfile?.headmaster || '_____________________'}</p>
                      <p>NIP. {schoolProfile?.headmasterNip || '_____________________'}</p>
                    </div>
                 </div>
              )}
            </div>
            
            {/* Letter Number Modal */}
            {isLetterNumberModalOpen && (
              <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4">
                <div className="bg-white rounded-xl p-6 w-full max-w-sm">
                  <h3 className="font-bold text-gray-800 mb-4">Input Nomor Surat</h3>
                  <input
                    type="text"
                    value={manualLetterNumber}
                    onChange={(e) => setManualLetterNumber(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
                  />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setIsLetterNumberModalOpen(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-bold">Batal</button>
                    <button
                      onClick={() => {
                          setIsLetterNumberModalOpen(false);
                          const element = document.getElementById('printable-area');
                          if (element) {
                            const opt = {
                              margin: 15,
                              filename: `${letterType}_${printRequestedLeave!.userName}.pdf`,
                              image: { type: 'jpeg' as const, quality: 0.98 },
                              html2canvas: { scale: 2 },
                              jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
                            };
                            html2pdf().set(opt).from(element).save();
                          }
                      }}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold"
                    >
                      Download
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <style>{`
            @media print {
              @page {
                size: A4;
                margin: 15mm;
              }
              body * {
                visibility: hidden;
              }
              .fixed.inset-0.z-\\[100\\] {
                position: absolute;
                left: 0;
                top: 0;
                margin: 0;
                padding: 0;
                width: 100%;
                min-height: 100vh;
                background: white;
              }
              .fixed.inset-0.z-\\[100\\] * {
                visibility: visible;
              }
              .print\\:hidden {
                display: none !important;
              }
            }
          `}</style>
        </div>
      )}

    </div>
  );
};

export default StaffLeaveView;
