import React, { useState, useEffect, useMemo } from 'react';
import { 
  Mail, Inbox, Send, Plus, Search, Filter, FileText, Calendar, 
  Building, Edit, Trash2, Eye, ExternalLink, Printer, Download,
  CheckCircle, Clock, FileCheck, X, AlertCircle, Bookmark, RefreshCw, Tag
} from 'lucide-react';
import { MailRecord, SchoolProfileData } from '../types';
import { apiService } from '../services/apiService';
import * as XLSX from 'xlsx';

interface MailManagementViewProps {
  schoolProfile?: SchoolProfileData;
  onShowNotification: (message: string, type: 'success' | 'error' | 'warning') => void;
  classId?: string;
  currentUser?: any;
}

const CATEGORY_OPTIONS = [
  'Kedinasan',
  'Undangan',
  'Edaran',
  'Surat Tugas',
  'Surat Keputusan (SK)',
  'Surat Keterangan',
  'Permohonan',
  'Pemberitahuan',
  'Lainnya'
];

const INITIAL_MOCK_MAILS: MailRecord[] = [
  {
    id: 'mail-1',
    type: 'masuk',
    letterNumber: '005/DISDIK/IV/2026',
    agendaNumber: '001/SM/2026',
    senderOrRecipient: 'Dinas Pendidikan Kota',
    subject: 'Undangan Rapat Koordinasi Kepala Sekolah & Lampiran Kurikulum',
    letterDate: '2026-04-10',
    receivedOrSentDate: '2026-04-12',
    category: 'Undangan',
    description: 'Pelaksanaan rapat koordinasi evaluasi program sekolah dan pembagian pedoman kurikulum baru.',
    status: 'Selesai',
    fileUrl: 'https://drive.google.com'
  },
  {
    id: 'mail-2',
    type: 'keluar',
    letterNumber: '421.2/088/SD/2026',
    agendaNumber: '001/SK/2026',
    senderOrRecipient: 'Kepala Puskesmas Pembantu',
    subject: 'Permohonan Pemeriksaan Kesehatan & Vaksinasi Siswa',
    letterDate: '2026-04-15',
    receivedOrSentDate: '2026-04-15',
    category: 'Permohonan',
    description: 'Permohonan bantuan tenaga medis untuk kegiatan penjaringan kesehatan berkala murid.',
    status: 'Selesai',
    fileUrl: ''
  },
  {
    id: 'mail-3',
    type: 'masuk',
    letterNumber: '800/120/KORWIL/2026',
    agendaNumber: '002/SM/2026',
    senderOrRecipient: 'Korwil Bidang Pendidikan',
    subject: 'Surat Edaran Pelaksanaan Asesmen Nasional',
    letterDate: '2026-04-18',
    receivedOrSentDate: '2026-04-19',
    category: 'Edaran',
    description: 'Jadwal persiapan dan simulasi Gladi Bersih Asesmen Nasional tingkat Sekolah Dasar.',
    status: 'Proses',
    fileUrl: ''
  }
];

const MailManagementView: React.FC<MailManagementViewProps> = ({
  schoolProfile,
  onShowNotification,
  classId = 'ALL',
  currentUser
}) => {
  const [records, setRecords] = useState<MailRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'semua' | 'masuk' | 'keluar'>('semua');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('semua');

  // Pop-up Modal Input State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingMail, setEditingMail] = useState<MailRecord | null>(null);

  // Form State
  const [type, setType] = useState<'masuk' | 'keluar'>('masuk');
  const [letterNumber, setLetterNumber] = useState<string>('');
  const [agendaNumber, setAgendaNumber] = useState<string>('');
  const [senderOrRecipient, setSenderOrRecipient] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [letterDate, setLetterDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [receivedOrSentDate, setReceivedOrSentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<string>('Kedinasan');
  const [description, setDescription] = useState<string>('');
  const [fileUrl, setFileUrl] = useState<string>('');
  const [status, setStatus] = useState<'Tersimpan' | 'Proses' | 'Selesai' | 'Arsip'>('Selesai');

  // Detail Modal State
  const [detailModal, setDetailModal] = useState<MailRecord | null>(null);

  // Delete Confirmation Modal State
  const [deleteModal, setDeleteModal] = useState<MailRecord | null>(null);

  // Load records
  const loadMailRecords = async () => {
    setLoading(true);
    try {
      const data = await apiService.getMailRecords(classId);
      if (data && data.length > 0) {
        setRecords(data);
      } else {
        // Initialize with default mock if empty
        setRecords(INITIAL_MOCK_MAILS);
        for (const m of INITIAL_MOCK_MAILS) {
          await apiService.saveMailRecord(m);
        }
      }
    } catch (e) {
      console.error("Error loading mail records:", e);
      setRecords(INITIAL_MOCK_MAILS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMailRecords();
  }, [classId]);

  // Filtered Records
  const filteredRecords = useMemo(() => {
    return records.filter(item => {
      // Tab filter
      if (activeTab === 'masuk' && item.type !== 'masuk') return false;
      if (activeTab === 'keluar' && item.type !== 'keluar') return false;

      // Category filter
      if (selectedCategory !== 'semua' && item.category !== selectedCategory) return false;

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const numMatch = item.letterNumber?.toLowerCase().includes(query);
        const agendaMatch = item.agendaNumber?.toLowerCase().includes(query);
        const senderMatch = item.senderOrRecipient?.toLowerCase().includes(query);
        const subjectMatch = item.subject?.toLowerCase().includes(query);
        const descMatch = item.description?.toLowerCase().includes(query);
        return numMatch || agendaMatch || senderMatch || subjectMatch || descMatch;
      }

      return true;
    });
  }, [records, activeTab, selectedCategory, searchTerm]);

  // Statistics
  const stats = useMemo(() => {
    const total = records.length;
    const masukCount = records.filter(r => r.type === 'masuk').length;
    const keluarCount = records.filter(r => r.type === 'keluar').length;
    
    const currentMonthStr = new Date().toISOString().substring(0, 7);
    const thisMonthCount = records.filter(r => (r.receivedOrSentDate || r.letterDate || '').startsWith(currentMonthStr)).length;

    return { total, masukCount, keluarCount, thisMonthCount };
  }, [records]);

  // Open Add Modal
  const handleOpenAddModal = (defaultType: 'masuk' | 'keluar' = 'masuk') => {
    setEditingMail(null);
    setType(defaultType);
    setLetterNumber('');
    setAgendaNumber(`${String(records.length + 1).padStart(3, '0')}/${defaultType === 'masuk' ? 'SM' : 'SK'}/${new Date().getFullYear()}`);
    setSenderOrRecipient('');
    setSubject('');
    const today = new Date().toISOString().split('T')[0];
    setLetterDate(today);
    setReceivedOrSentDate(today);
    setCategory('Kedinasan');
    setDescription('');
    setFileUrl('');
    setStatus('Selesai');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (mail: MailRecord) => {
    setEditingMail(mail);
    setType(mail.type);
    setLetterNumber(mail.letterNumber || '');
    setAgendaNumber(mail.agendaNumber || '');
    setSenderOrRecipient(mail.senderOrRecipient || '');
    setSubject(mail.subject || '');
    setLetterDate(mail.letterDate || new Date().toISOString().split('T')[0]);
    setReceivedOrSentDate(mail.receivedOrSentDate || new Date().toISOString().split('T')[0]);
    setCategory(mail.category || 'Kedinasan');
    setDescription(mail.description || '');
    setFileUrl(mail.fileUrl || '');
    setStatus(mail.status || 'Selesai');
    setIsModalOpen(true);
  };

  // Submit Form (Save / Update)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!letterNumber.trim()) {
      onShowNotification('Nomor Surat wajib diisi.', 'warning');
      return;
    }
    if (!senderOrRecipient.trim()) {
      onShowNotification(type === 'masuk' ? 'Pengirim / Instansi wajib diisi.' : 'Tujuan / Penerima wajib diisi.', 'warning');
      return;
    }
    if (!subject.trim()) {
      onShowNotification('Perihal surat wajib diisi.', 'warning');
      return;
    }

    const newMailRecord: MailRecord = {
      id: editingMail ? editingMail.id : `mail-${Date.now()}`,
      type,
      letterNumber: letterNumber.trim(),
      agendaNumber: agendaNumber.trim(),
      senderOrRecipient: senderOrRecipient.trim(),
      subject: subject.trim(),
      letterDate,
      receivedOrSentDate,
      category,
      description: description.trim(),
      fileUrl: fileUrl.trim(),
      status,
      classId,
      createdAt: editingMail ? editingMail.createdAt : new Date().toISOString()
    };

    try {
      await apiService.saveMailRecord(newMailRecord);
      
      setRecords(prev => {
        const idx = prev.findIndex(m => m.id === newMailRecord.id);
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = newMailRecord;
          return updated;
        }
        return [newMailRecord, ...prev];
      });

      onShowNotification(`Surat ${type === 'masuk' ? 'Masuk' : 'Keluar'} berhasil disimpan!`, 'success');
      setIsModalOpen(false);
    } catch (err) {
      console.error("Error saving mail record:", err);
      onShowNotification('Gagal menyimpan surat. Silakan coba lagi.', 'error');
    }
  };

  // Delete Mail
  const handleDeleteConfirm = async () => {
    if (!deleteModal) return;
    try {
      await apiService.deleteMailRecord(deleteModal.id);
      setRecords(prev => prev.filter(r => r.id !== deleteModal.id));
      onShowNotification('Surat berhasil dihapus.', 'success');
      setDeleteModal(null);
    } catch (err) {
      console.error("Error deleting mail:", err);
      onShowNotification('Gagal menghapus surat.', 'error');
    }
  };

  // Export Excel
  const handleExportExcel = () => {
    if (filteredRecords.length === 0) {
      onShowNotification('Tidak ada data surat untuk diexport.', 'warning');
      return;
    }

    const dataToExport = filteredRecords.map((item, index) => ({
      'No': index + 1,
      'Jenis Surat': item.type === 'masuk' ? 'Surat Masuk' : 'Surat Keluar',
      'Nomor Surat': item.letterNumber,
      'Nomor Agenda': item.agendaNumber || '-',
      [item.type === 'masuk' ? 'Pengirim / Instansi' : 'Tujuan / Penerima']: item.senderOrRecipient,
      'Perihal': item.subject,
      'Kategori': item.category,
      'Tanggal Surat': item.letterDate,
      [item.type === 'masuk' ? 'Tanggal Diterima' : 'Tanggal Dikirim']: item.receivedOrSentDate,
      'Status': item.status || 'Tersimpan',
      'Ringkasan': item.description || '-',
      'Tautan File': item.fileUrl || '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Surat Menyurat");
    XLSX.writeFile(workbook, `Agenda_Surat_Menyurat_${new Date().toISOString().split('T')[0]}.xlsx`);
    onShowNotification('Data surat berhasil di-export ke Excel!', 'success');
  };

  // Print Summary
  const handlePrintAgenda = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* HEADER BAR */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <Mail size={280} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold text-blue-100 mb-3 border border-white/20 shadow-xs">
              <Mail size={14} className="text-blue-200" />
              <span>Administrasi & Tata Usaha</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              Surat Menyurat & Agenda
            </h1>
            <p className="text-blue-100 mt-1.5 text-sm sm:text-base max-w-2xl font-medium">
              Sistem pencatatan agenda digital Surat Masuk, Surat Keluar, dan pengarsipan berkas dinas sekolah.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 no-print">
            <button
              onClick={() => handleOpenAddModal('masuk')}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-2xl font-bold text-sm shadow-lg shadow-emerald-900/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center space-x-2 border border-emerald-400/30"
            >
              <Inbox size={18} />
              <span>+ Surat Masuk</span>
            </button>
            <button
              onClick={() => handleOpenAddModal('keluar')}
              className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-2xl font-bold text-sm shadow-lg shadow-amber-900/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center space-x-2 border border-amber-400/30"
            >
              <Send size={18} />
              <span>+ Surat Keluar</span>
            </button>
          </div>
        </div>
      </div>

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Surat */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <Mail size={24} />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Agenda Surat</span>
            <span className="text-2xl font-black text-slate-800">{stats.total}</span>
            <span className="text-[11px] font-semibold text-slate-500 block mt-0.5">Surat teragenda</span>
          </div>
        </div>

        {/* Surat Masuk */}
        <div 
          onClick={() => setActiveTab('masuk')}
          className={`cursor-pointer bg-white p-5 rounded-2xl border ${activeTab === 'masuk' ? 'ring-2 ring-emerald-500 border-emerald-300' : 'border-slate-200/80'} shadow-xs hover:shadow-md transition-all flex items-center space-x-4`}
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <Inbox size={24} />
          </div>
          <div>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">Surat Masuk</span>
            <span className="text-2xl font-black text-slate-800">{stats.masukCount}</span>
            <span className="text-[11px] font-semibold text-slate-500 block mt-0.5">Diterima instansi</span>
          </div>
        </div>

        {/* Surat Keluar */}
        <div 
          onClick={() => setActiveTab('keluar')}
          className={`cursor-pointer bg-white p-5 rounded-2xl border ${activeTab === 'keluar' ? 'ring-2 ring-amber-500 border-amber-300' : 'border-slate-200/80'} shadow-xs hover:shadow-md transition-all flex items-center space-x-4`}
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
            <Send size={24} />
          </div>
          <div>
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block">Surat Keluar</span>
            <span className="text-2xl font-black text-slate-800">{stats.keluarCount}</span>
            <span className="text-[11px] font-semibold text-slate-500 block mt-0.5">Diterbitkan sekolah</span>
          </div>
        </div>

        {/* Bulan Ini */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
            <Calendar size={24} />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Surat Bulan Ini</span>
            <span className="text-2xl font-black text-slate-800">{stats.thisMonthCount}</span>
            <span className="text-[11px] font-semibold text-slate-500 block mt-0.5">Aktivitas bulan ini</span>
          </div>
        </div>

      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 no-print">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          
          {/* TAB Toggles */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl max-w-md">
            <button
              onClick={() => setActiveTab('semua')}
              className={`flex-1 py-2 px-3 text-xs sm:text-sm font-bold rounded-lg transition-all ${
                activeTab === 'semua'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Semua ({stats.total})
            </button>
            <button
              onClick={() => setActiveTab('masuk')}
              className={`flex-1 py-2 px-3 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                activeTab === 'masuk'
                  ? 'bg-white text-emerald-600 shadow-xs'
                  : 'text-slate-500 hover:text-emerald-600'
              }`}
            >
              <Inbox size={15} />
              <span>Surat Masuk ({stats.masukCount})</span>
            </button>
            <button
              onClick={() => setActiveTab('keluar')}
              className={`flex-1 py-2 px-3 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                activeTab === 'keluar'
                  ? 'bg-white text-amber-600 shadow-xs'
                  : 'text-slate-500 hover:text-amber-600'
              }`}
            >
              <Send size={15} />
              <span>Surat Keluar ({stats.keluarCount})</span>
            </button>
          </div>

          {/* Action Tools */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5"
              title="Export ke file Excel"
            >
              <Download size={15} />
              <span>Export Excel</span>
            </button>

            <button
              onClick={handlePrintAgenda}
              className="bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5"
              title="Cetak Agenda Surat"
            >
              <Printer size={15} />
              <span>Cetak Agenda</span>
            </button>

            <button
              onClick={loadMailRecords}
              className="p-2 text-slate-500 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 rounded-xl transition-all"
              title="Refresh Data"
            >
              <RefreshCw size={16} />
            </button>
          </div>

        </div>

        {/* SECONDARY CONTROLS: SEARCH & CATEGORY */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          
          {/* Search Box */}
          <div className="md:col-span-2 relative">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nomor surat, agenda, pengirim, tujuan, atau perihal..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="relative">
            <Filter size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer appearance-none"
            >
              <option value="semua">Semua Kategori Surat</option>
              {CATEGORY_OPTIONS.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* PRINT HEADER FOR PAPER VIEW */}
      <div className="hidden print:block mb-6 text-center border-b pb-4">
        <h2 className="text-xl font-bold uppercase">{schoolProfile?.name || 'AGENDA SURAT MENYURAT SEKOLAH'}</h2>
        <p className="text-sm font-medium text-gray-600">{schoolProfile?.address || 'Buku Agenda Digital Surat Masuk dan Surat Keluar'}</p>
        <p className="text-xs font-semibold mt-1">Dicetak pada: {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* MAIN RECORDS TABLE & LIST */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        
        {loading ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <RefreshCw size={32} className="mx-auto animate-spin text-blue-500" />
            <p className="text-sm font-medium">Memuat data agenda surat...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <Mail size={48} className="mx-auto text-slate-300" />
            <h3 className="text-base font-bold text-slate-700">Belum Ada Agenda Surat</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchTerm || selectedCategory !== 'semua'
                ? 'Tidak ditemukan surat yang sesuai dengan kata kunci pencarian atau filter.'
                : 'Silakan klik tombol "+ Surat Masuk" atau "+ Surat Keluar" untuk mencatat agenda surat baru.'}
            </p>
            {(searchTerm || selectedCategory !== 'semua') && (
              <button
                onClick={() => { setSearchTerm(''); setSelectedCategory('semua'); setActiveTab('semua'); }}
                className="inline-flex items-center space-x-1.5 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl hover:bg-blue-100 transition-all"
              >
                <span>Reset Filter</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-extrabold tracking-wider">
                  <th className="py-3.5 px-4 w-12 text-center">No</th>
                  <th className="py-3.5 px-4">Jenis & Status</th>
                  <th className="py-3.5 px-4">Nomor & Agenda</th>
                  <th className="py-3.5 px-4">Pengirim / Tujuan</th>
                  <th className="py-3.5 px-4">Perihal & Ringkasan</th>
                  <th className="py-3.5 px-4">Tanggal</th>
                  <th className="py-3.5 px-4 text-center no-print">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredRecords.map((item, index) => {
                  const isMasuk = item.type === 'masuk';
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                      
                      {/* NO */}
                      <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                        {index + 1}
                      </td>

                      {/* JENIS & STATUS */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isMasuk 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}>
                            {isMasuk ? <Inbox size={11} className="mr-1" /> : <Send size={11} className="mr-1" />}
                            <span>{isMasuk ? 'Masuk' : 'Keluar'}</span>
                          </span>

                          <div className="flex items-center space-x-1 text-[10px] text-slate-500 font-semibold">
                            <Tag size={10} className="text-slate-400" />
                            <span>{item.category || 'Biasa'}</span>
                          </div>
                        </div>
                      </td>

                      {/* NOMOR SURAT & AGENDA */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <span className="font-extrabold text-slate-800 block">{item.letterNumber}</span>
                          <span className="text-[11px] font-medium text-slate-500 block">
                            Agenda: <span className="font-bold text-slate-700">{item.agendaNumber || '-'}</span>
                          </span>
                        </div>
                      </td>

                      {/* PENGIRIM / TUJUAN */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-start space-x-2">
                          <Building size={14} className={`mt-0.5 shrink-0 ${isMasuk ? 'text-emerald-500' : 'text-amber-500'}`} />
                          <div>
                            <span className="font-bold text-slate-800 block">{item.senderOrRecipient}</span>
                            <span className="text-[10px] font-medium text-slate-400">
                              {isMasuk ? 'Pengirim' : 'Penerima / Tujuan'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* PERIHAL & RINGKASAN */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="space-y-1">
                          <span className="font-bold text-slate-800 block line-clamp-1">{item.subject}</span>
                          {item.description && (
                            <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                              {item.description}
                            </p>
                          )}
                          {item.fileUrl && (
                            <a
                              href={item.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1 text-[10px] font-bold text-blue-600 hover:underline pt-0.5"
                            >
                              <ExternalLink size={10} />
                              <span>Buka File Lampiran</span>
                            </a>
                          )}
                        </div>
                      </td>

                      {/* TANGGAL */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="space-y-0.5 text-[11px]">
                          <div className="text-slate-700 font-medium">
                            Surat: <span className="font-bold">{item.letterDate}</span>
                          </div>
                          <div className="text-slate-400 font-medium">
                            {isMasuk ? 'Diterima' : 'Dikirim'}: <span className="font-semibold text-slate-600">{item.receivedOrSentDate}</span>
                          </div>
                        </div>
                      </td>

                      {/* AKSI */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap no-print">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => setDetailModal(item)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="Lihat Detail Surat"
                          >
                            <Eye size={16} />
                          </button>

                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                            title="Edit Surat"
                          >
                            <Edit size={16} />
                          </button>

                          <button
                            onClick={() => setDeleteModal(item)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Hapus Surat"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* POP-UP MODAL INPUT (CREATE / EDIT) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in no-print">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className={`p-6 text-white flex items-center justify-between ${
              type === 'masuk' ? 'bg-gradient-to-r from-emerald-600 to-teal-600' : 'bg-gradient-to-r from-amber-600 to-orange-600'
            }`}>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                  {type === 'masuk' ? <Inbox size={22} /> : <Send size={22} />}
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight">
                    {editingMail ? 'Edit Data Surat' : `Input ${type === 'masuk' ? 'Surat Masuk' : 'Surat Keluar'}`}
                  </h3>
                  <p className="text-xs font-medium text-white/80">
                    {type === 'masuk' ? 'Pencatatan agenda surat masuk dari instansi luar' : 'Pencatatan agenda surat keluar terbitan sekolah'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmitForm} className="p-6 overflow-y-auto space-y-4 custom-scrollbar">
              
              {/* Type Switcher */}
              <div className="flex p-1 bg-slate-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setType('masuk')}
                  className={`flex-1 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center space-x-2 ${
                    type === 'masuk'
                      ? 'bg-white text-emerald-700 shadow-md'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Inbox size={16} />
                  <span>Surat Masuk</span>
                </button>
                <button
                  type="button"
                  onClick={() => setType('keluar')}
                  className={`flex-1 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center space-x-2 ${
                    type === 'keluar'
                      ? 'bg-white text-amber-700 shadow-md'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Send size={16} />
                  <span>Surat Keluar</span>
                </button>
              </div>

              {/* Form Row 1: Nomor Surat & Agenda */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor Surat <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="misal: 005/DISDIK/IV/2026"
                    value={letterNumber}
                    onChange={(e) => setLetterNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor Agenda / Indeks
                  </label>
                  <input
                    type="text"
                    placeholder="misal: 001/SM/2026"
                    value={agendaNumber}
                    onChange={(e) => setAgendaNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Form Row 2: Pengirim / Tujuan & Kategori */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {type === 'masuk' ? 'Pengirim / Instansi Asal' : 'Tujuan / Instansi Penerima'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={type === 'masuk' ? 'misal: Dinas Pendidikan Kota' : 'misal: Orang Tua / Wali Murid'}
                    value={senderOrRecipient}
                    onChange={(e) => setSenderOrRecipient(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kategori / Klasifikasi Surat
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                  >
                    {CATEGORY_OPTIONS.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Form Row 3: Perihal */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Perihal / Judul Surat <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="misal: Undangan Rapat Koordinasi Kurikulum"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Form Row 4: Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tanggal Surat
                  </label>
                  <input
                    type="date"
                    required
                    value={letterDate}
                    onChange={(e) => setLetterDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {type === 'masuk' ? 'Tanggal Diterima' : 'Tanggal Dikirim'}
                  </label>
                  <input
                    type="date"
                    required
                    value={receivedOrSentDate}
                    onChange={(e) => setReceivedOrSentDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Form Row 5: Ringkasan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ringkasan / Isi Ringkas Surat
                </label>
                <textarea
                  rows={3}
                  placeholder="Catatan atau uraian singkat perihal isi surat..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Form Row 6: Tautan File & Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tautan File Scan / Document (Google Drive / URL)
                  </label>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/..."
                    value={fileUrl}
                    onChange={(e) => setFileUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Status / Sifat Surat
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Tersimpan">Tersimpan</option>
                    <option value="Proses">Proses</option>
                    <option value="Selesai">Selesai</option>
                    <option value="Arsip">Arsip</option>
                  </select>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className={`px-6 py-2.5 rounded-xl text-xs font-extrabold text-white shadow-lg transition-all ${
                    type === 'masuk'
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/20'
                      : 'bg-amber-600 hover:bg-amber-700 shadow-amber-900/20'
                  }`}
                >
                  Simpan Surat
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {detailModal && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in no-print">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden">
            
            <div className={`p-6 text-white ${
              detailModal.type === 'masuk' ? 'bg-emerald-600' : 'bg-amber-600'
            } flex items-center justify-between`}>
              <div className="flex items-center space-x-3">
                <Mail size={24} />
                <div>
                  <h3 className="text-base font-black">
                    Detail {detailModal.type === 'masuk' ? 'Surat Masuk' : 'Surat Keluar'}
                  </h3>
                  <p className="text-xs text-white/80">Agenda No: {detailModal.agendaNumber || '-'}</p>
                </div>
              </div>
              <button
                onClick={() => setDetailModal(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-2">
                <div>
                  <span className="text-slate-400 font-bold uppercase block text-[10px]">Nomor Surat</span>
                  <span className="text-sm font-black text-slate-800">{detailModal.letterNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase block text-[10px]">Perihal / Judul</span>
                  <span className="text-xs font-bold text-slate-800">{detailModal.subject}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 font-bold uppercase block text-[10px]">
                    {detailModal.type === 'masuk' ? 'Pengirim' : 'Tujuan'}
                  </span>
                  <span className="font-bold text-slate-700">{detailModal.senderOrRecipient}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase block text-[10px]">Kategori</span>
                  <span className="font-bold text-slate-700">{detailModal.category}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase block text-[10px]">Tanggal Surat</span>
                  <span className="font-bold text-slate-700">{detailModal.letterDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase block text-[10px]">
                    {detailModal.type === 'masuk' ? 'Tanggal Diterima' : 'Tanggal Dikirim'}
                  </span>
                  <span className="font-bold text-slate-700">{detailModal.receivedOrSentDate}</span>
                </div>
              </div>

              {detailModal.description && (
                <div>
                  <span className="text-slate-400 font-bold uppercase block text-[10px] mb-1">Isi Ringkas / Catatan</span>
                  <p className="p-3 bg-slate-50 rounded-xl text-slate-600 border border-slate-100 leading-relaxed">
                    {detailModal.description}
                  </p>
                </div>
              )}

              {detailModal.fileUrl && (
                <div className="pt-2">
                  <a
                    href={detailModal.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 bg-blue-50 text-blue-700 rounded-xl font-bold flex items-center justify-center space-x-2 border border-blue-200 hover:bg-blue-100 transition-all"
                  >
                    <ExternalLink size={16} />
                    <span>Buka Tautan Lampiran File Scan</span>
                  </a>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setDetailModal(null)}
                className="px-5 py-2 bg-slate-200 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-300 transition-all"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {deleteModal && (
        <div className="fixed inset-0 z-[170] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in no-print">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center">
              <AlertCircle size={32} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800">Hapus Agenda Surat?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Apakah Anda yakin ingin menghapus agenda surat dengan nomor <span className="font-bold text-slate-700">"{deleteModal.letterNumber}"</span>? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="flex items-center justify-center space-x-3 pt-2">
              <button
                onClick={() => setDeleteModal(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-red-900/20 transition-all"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MailManagementView;
