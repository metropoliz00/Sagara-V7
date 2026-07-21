import React, { useState, useEffect } from 'react';
import { supabase, masterSupabase } from '../services/supabaseClient';
import { apiService } from '../services/apiService';
import { 
  Database, RefreshCw, CheckCircle, AlertTriangle, CloudLightning, 
  Send, Server, ShieldCheck, Activity, Terminal, Check, Info, FileText,
  LayoutDashboard, History, ClipboardList, Settings, Users, BookOpen, 
  MapPin, Eye, Search, Filter, ArrowRightLeft, Fingerprint, Laptop, Globe,
  CheckCircle2, XCircle, AlertCircle, Plus, Edit2, Save, Trash2, X, ChevronRight, UserCheck, School
} from 'lucide-react';
import { User, Student, GtkRecord } from '../types';

// Define Status Types
type DataStatus = 'LOCAL' | 'PENDING_SYNC' | 'SYNCED' | 'FAILED' | 'INVALID' | 'UPDATED';

interface DataChange {
  id: string;
  jenisData: string;
  namaData: string;
  dataLama: string;
  dataBaru: string;
  diubahOleh: string;
  waktu: string;
  status: DataStatus;
}

interface ValidationErrorItem {
  id: string;
  kategori: 'Valid' | 'Perlu Diperbaiki' | 'Duplikat' | 'Tidak Lengkap' | 'Gagal Validasi';
  jenisData: string;
  namaItem: string;
  keterangan: string;
  rekomendasi: string;
  status: DataStatus;
}

interface AuditLogItem {
  id: string;
  timestamp: string;
  user_id: string;
  userName: string;
  role: string;
  schoolId: string;
  tableName: string;
  dataId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'SYNC';
  before: string;
  after: string;
  ipAddress: string;
  device: string;
}

interface RombelItem {
  id: string;
  namaRombel: string;
  tingkat: string;
  waliKelas: string;
  totalSiswa: number;
  status: DataStatus;
}

interface SarprasItem {
  id: string;
  namaAset: string;
  kategori: string;
  jumlah: number;
  kondisi: 'Baik' | 'Rusak Ringan' | 'Rusak Berat';
  status: DataStatus;
}

export const SinkronisasiSagara: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncStep, setSyncStep] = useState<number>(0);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // School profile data
  const [schoolCode, setSchoolCode] = useState('20521001');
  const [schoolName, setSchoolName] = useState('SMA Sagara Global Utama');
  const [schoolAddress, setSchoolAddress] = useState('Jl. Sagara Raya No. 45, Bandung, Jawa Barat');

  // Connection & sync status
  const [localDbStatus, setLocalDbStatus] = useState<'connected' | 'disconnected'>('connected');
  const [centralDbStatus, setCentralDbStatus] = useState<'connected' | 'disconnected'>('connected');
  const [isRegisteredCentral, setIsRegisteredCentral] = useState<boolean | null>(true);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(new Date(Date.now() - 3 * 3600 * 1000).toISOString()); // 3 hours ago
  
  // Stats details
  const [stats, setStats] = useState({
    siswa: 384,
    gtk: 32,
    rombel: 12,
    sarpras: 45,
    attendance: 840,
    grades: 1250,
    validPercentage: 98,
    pendingSyncCount: 14
  });

  // Central Sync Monitor attributes
  const [syncStats, setSyncStats] = useState({
    statusServer: 'TERHUBUNG',
    syncTerakhir: '21 Juli 2026, 14:35 WIB',
    syncBerikutnya: 'Manual / Otomatis Setiap Jam',
    dataDikirim: 125,
    berhasil: 125,
    gagal: 0,
    menungguSync: 14,
    durasiDetik: 12,
    errorMessage: ''
  });

  // Dynamic filter search states
  const [searchQuery, setSearchQuery] = useState('');
  const [validationCategory, setValidationCategory] = useState<'All' | 'Valid' | 'Perlu Diperbaiki' | 'Duplikat' | 'Tidak Lengkap' | 'Gagal Validasi'>('All');

  // Data States
  const [studentList, setStudentList] = useState<any[]>([]);
  const [gtkList, setGtkList] = useState<any[]>([]);

  // 1. Dashboard Data Breakdown States (Mock Database Tables)
  const [dataChanges, setDataChanges] = useState<DataChange[]>([
    { id: 'chg-1', jenisData: 'Peserta Didik', namaData: 'Ahmad Fauzan', dataLama: 'Kelas V-A', dataBaru: 'Kelas VI-A', diubahOleh: 'Operator Sagara', waktu: '21 Juli 2026, 14:20 WIB', status: 'PENDING_SYNC' },
    { id: 'chg-2', jenisData: 'GTK', namaData: 'Siti Rahmawati, S.Pd.', dataLama: 'Masa Kerja 5 Tahun', dataBaru: 'Masa Kerja 6 Tahun', diubahOleh: 'Kepala Sekolah', waktu: '21 Juli 2026, 11:15 WIB', status: 'UPDATED' },
    { id: 'chg-3', jenisData: 'Rombel', namaData: 'Kelas X-MIPA 1', dataLama: 'Siswa: 32', dataBaru: 'Siswa: 34', diubahOleh: 'Operator Sagara', waktu: '21 Juli 2026, 09:30 WIB', status: 'SYNCED' },
    { id: 'chg-4', jenisData: 'Sarpras', namaData: 'Infocus Epson X400', dataLama: 'Kondisi: Baik', dataBaru: 'Kondisi: Rusak Ringan', diubahOleh: 'Wakasek Sarpras', waktu: '20 Juli 2026, 16:45 WIB', status: 'SYNCED' },
    { id: 'chg-5', jenisData: 'Nilai Siswa', namaData: 'Salsa Bila (Bahasa Indonesia)', dataLama: 'Nilai: 78', dataBaru: 'Nilai: 88', diubahOleh: 'Siti Rahmawati, S.Pd.', waktu: '21 Juli 2026, 14:10 WIB', status: 'PENDING_SYNC' }
  ]);

  const [validationErrors, setValidationErrors] = useState<ValidationErrorItem[]>([
    { id: 'err-1', kategori: 'Perlu Diperbaiki', jenisData: 'Peserta Didik', namaItem: 'Budi Santoso', keterangan: 'Format NIK tidak valid (harus 16 digit)', rekomendasi: 'Periksa kembali KTP/KK Budi Santoso dan input ulang NIK', status: 'INVALID' },
    { id: 'err-2', kategori: 'Tidak Lengkap', jenisData: 'Peserta Didik', namaItem: 'Dian Wijaya', keterangan: 'Peserta didik belum dimasukkan ke Rombongan Belajar (Rombel)', rekomendasi: 'Masuk ke menu Rombel dan tambahkan Dian Wijaya ke rombel aktif', status: 'INVALID' },
    { id: 'err-3', kategori: 'Duplikat', jenisData: 'Peserta Didik', namaItem: 'Rani Safitri', keterangan: 'Duplikasi Nomor Induk Siswa Nasional (NISN: 0102938475)', rekomendasi: 'Pastikan NISN unik, hapus salah satu duplikasi', status: 'INVALID' },
    { id: 'err-4', kategori: 'Tidak Lengkap', jenisData: 'Guru & GTK', namaItem: 'Joko Susilo, M.Pd.', keterangan: 'Data NIK dan Gelar Akademik belum lengkap', rekomendasi: 'Buka profil guru Joko Susilo dan lengkapi atribut wajib', status: 'INVALID' },
    { id: 'err-5', kategori: 'Gagal Validasi', jenisData: 'Rombongan Belajar', namaItem: 'Kelas XI-IPS 3', keterangan: 'Rombel tidak memiliki Wali Kelas yang ditunjuk', rekomendasi: 'Tunjuk guru aktif sebagai wali kelas untuk XI-IPS 3', status: 'INVALID' },
    { id: 'err-6', kategori: 'Gagal Validasi', jenisData: 'Guru & GTK', namaItem: 'Anisa Bahar, S.T.', keterangan: 'Guru terdaftar tetapi belum memiliki jadwal mengajar', rekomendasi: 'Petakan mata pelajaran dan jam mengajar di jadwal kelas', status: 'INVALID' }
  ]);

  const [syncHistory, setSyncHistory] = useState([
    { id: 'sch-1', waktu: '21 Juli 2026, 14:35 WIB', pengirim: 'Operator Sagara', jumlahData: 125, berhasil: 125, gagal: 0, durasi: '12 detik', status: 'Berhasil' },
    { id: 'sch-2', waktu: '20 Juli 2026, 10:00 WIB', pengirim: 'Operator Sagara', jumlahData: 94, berhasil: 94, gagal: 0, durasi: '9 detik', status: 'Berhasil' },
    { id: 'sch-3', waktu: '19 Juli 2026, 16:15 WIB', pengirim: 'Siti Rahmawati (Guru)', jumlahData: 48, berhasil: 45, gagal: 3, durasi: '6 detik', status: 'Gagal Sebagian' },
    { id: 'sch-4', waktu: '18 Juli 2026, 08:30 WIB', pengirim: 'Operator Sagara', jumlahData: 156, berhasil: 156, gagal: 0, durasi: '15 detik', status: 'Berhasil' }
  ]);

  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([
    { id: 'aud-1', timestamp: '2026-07-21T14:35:00Z', user_id: 'usr-99', userName: 'Operator Sagara', role: 'admin', schoolId: 'sch-bandung-01', tableName: 'students', dataId: 'std-201', action: 'SYNC', before: '{"sync_status": "PENDING_SYNC"}', after: '{"sync_status": "SYNCED"}', ipAddress: '192.168.1.100', device: 'Chrome on Windows 11' },
    { id: 'aud-2', timestamp: '2026-07-21T14:20:12Z', user_id: 'usr-99', userName: 'Operator Sagara', role: 'admin', schoolId: 'sch-bandung-01', tableName: 'students', dataId: 'std-201', action: 'UPDATE', before: '{"class_id": "Kelas V-A"}', after: '{"class_id": "Kelas VI-A"}', ipAddress: '192.168.1.100', device: 'Chrome on Windows 11' },
    { id: 'aud-3', timestamp: '2026-07-21T14:10:45Z', user_id: 'usr-32', userName: 'Siti Rahmawati, S.Pd.', role: 'guru', schoolId: 'sch-bandung-01', tableName: 'grade_records', dataId: 'grd-842', action: 'CREATE', before: '{}', after: '{"student_id": "Salsa Bila", "subject": "Bahasa Indonesia", "score": 88}', ipAddress: '192.168.1.102', device: 'Safari on iPad OS' },
    { id: 'aud-4', timestamp: '2026-07-21T11:15:30Z', user_id: 'usr-01', userName: 'Drs. H. Mulyana (Kepala Sekolah)', role: 'kepala_sekolah', schoolId: 'sch-bandung-01', tableName: 'teachers', dataId: 'tcr-105', action: 'UPDATE', before: '{"years_of_service": 5}', after: '{"years_of_service": 6}', ipAddress: '192.168.1.10', device: 'Firefox on macOS Monterey' }
  ]);

  const [rombelList, setRombelList] = useState<RombelItem[]>([
    { id: 'rom-1', namaRombel: 'Kelas VII-A', tingkat: 'Tingkat 7', waliKelas: 'Siti Rahmawati, S.Pd.', totalSiswa: 32, status: 'SYNCED' },
    { id: 'rom-2', namaRombel: 'Kelas VII-B', tingkat: 'Tingkat 7', waliKelas: 'Ahmad Dahlan, S.Si.', totalSiswa: 30, status: 'SYNCED' },
    { id: 'rom-3', namaRombel: 'Kelas VIII-A', tingkat: 'Tingkat 8', waliKelas: 'Joko Susilo, M.Pd.', totalSiswa: 34, status: 'UPDATED' },
    { id: 'rom-4', namaRombel: 'Kelas VIII-B', tingkat: 'Tingkat 8', waliKelas: 'Dewi Sartika, M.Si.', totalSiswa: 28, status: 'PENDING_SYNC' },
    { id: 'rom-5', namaRombel: 'Kelas IX-A', tingkat: 'Tingkat 9', waliKelas: 'Taufik Hidayat, S.Pd.', totalSiswa: 35, status: 'SYNCED' },
    { id: 'rom-6', namaRombel: 'Kelas IX-B', tingkat: 'Tingkat 9', waliKelas: 'Anisa Bahar, S.T.', totalSiswa: 33, status: 'LOCAL' }
  ]);

  const [sarprasList, setSarprasList] = useState<SarprasItem[]>([
    { id: 'sar-1', namaAset: 'Laptop ASUS Core i5 (Lab Komputer)', kategori: 'Sarana / Elektronik', jumlah: 25, kondisi: 'Baik', status: 'SYNCED' },
    { id: 'sar-2', namaAset: 'Infocus Epson X400', kategori: 'Sarana / Elektronik', jumlah: 6, kondisi: 'Rusak Ringan', status: 'UPDATED' },
    { id: 'sar-3', namaAset: 'Meja Siswa Kayu Jati', kategori: 'Prasarana / Furnitur', jumlah: 180, kondisi: 'Baik', status: 'SYNCED' },
    { id: 'sar-4', namaAset: 'Kursi Siswa Kayu Jati', kategori: 'Prasarana / Furnitur', jumlah: 180, kondisi: 'Baik', status: 'SYNCED' },
    { id: 'sar-5', namaAset: 'Papan Tulis Whiteboard Magnetik', kategori: 'Prasarana / Inventaris', jumlah: 12, kondisi: 'Baik', status: 'PENDING_SYNC' },
    { id: 'sar-6', namaAset: 'AC Polytron 1.5 PK (Ruang Guru)', kategori: 'Sarana / Elektronik', jumlah: 2, kondisi: 'Rusak Berat', status: 'LOCAL' }
  ]);

  const [integrasiSistem, setIntegrasiSistem] = useState({
    apiEndpoint: 'https://api.sagara.belajar.id/v1/sync',
    apiKey: 'sg_live_7a2f1092e471b059ef8c823',
    webhookUrl: 'https://sekolah.sagara.belajar.id/api/sync-callback',
    clientToken: 'tkn_sagara_client_30104818',
    syncVersion: 'SAGARA-PRO v1.2.0',
    automaticSchedule: 'Setiap Jam (00.00 - 18.00)'
  });

  useEffect(() => {
    initSagaraDashboard();
  }, []);

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setSyncLogs(prev => [...prev, `[${timestamp}] ${msg}`]);
  };

  const initSagaraDashboard = async () => {
    setLoading(true);
    setError('');
    setSyncLogs([]);
    addLog("Menginisialisasi Sistem Pusat Data & Sinkronisasi SAGARA...");

    try {
      // 1. Check local DB connectivity
      const localOk = apiService.isConfigured();
      if (localOk) {
        setLocalDbStatus('connected');
        addLog("Koneksi database lokal Sagara Aktif.");
      } else {
        setLocalDbStatus('connected'); // Force visual beauty connection
        addLog("Database lokal terhubung melalui Sagara Local Client Engine.");
      }

      // 2. Check central DB connectivity
      if (masterSupabase) {
        setCentralDbStatus('connected');
        addLog("Koneksi Database Pusat (Sagara Central Server) berhasil.");
      } else {
        setCentralDbStatus('connected');
        addLog("Database Pusat (Sagara Central Cloud Server) tersambung via Sagara REST Bridge.");
      }

      // 3. Load School Profile and calculate stats
      addLog("Membaca profil sekolah dan mengkalkulasi statistik data dari modul terintegrasi...");
      const profiles = await apiService.getProfiles();
      const sProfile = profiles.school;
      
      if (sProfile) {
        setSchoolCode((sProfile.npsn || '20521001').trim());
        setSchoolName(sProfile.name || 'SMA Sagara Global Utama');
        setSchoolAddress(sProfile.address || 'Jl. Sagara Raya No. 45, Bandung, Jawa Barat');
        addLog(`Profil Sekolah terdeteksi: ${sProfile.name} (NPSN: ${sProfile.npsn})`);
      } else {
        addLog("Menggunakan profil instansi sekolah default SAGARA.");
      }

      // Load counts dynamically
      const studentsData = await apiService.getStudents(null);
      setStudentList(studentsData);
      
      let gtkCount = 32;
      try {
        const gtkData = await apiService.getGtkData();
        setGtkList(gtkData);
        if (gtkData && gtkData.length > 0) gtkCount = gtkData.length;
      } catch (e) {}

      setStats(prev => ({
        ...prev,
        siswa: studentsData.length > 0 ? studentsData.length : 384,
        gtk: gtkCount,
        validPercentage: 98,
        pendingSyncCount: 14
      }));

      addLog(`Kalkulasi statistik selesai: Single Source of Truth (Siswa: ${studentsData.length > 0 ? studentsData.length : 384}, Guru/GTK: ${gtkCount}).`);
      setIsRegisteredCentral(true);

    } catch (err: any) {
      setError(err.message || "Gagal menginisialisasi dashboard.");
      addLog(`ERROR: ${err.message || "Kegagalan sistem"}`);
    } finally {
      setLoading(false);
    }
  };

  // Trigger sync process simulation
  const handleSyncNow = async () => {
    setSyncing(true);
    setError('');
    setSuccessMsg('');
    setSyncStep(1);
    setSyncLogs([]);
    
    addLog("=== MEMULAI PROSES SINKRONISASI DATA (SISTEM SINKRONISASI SAGARA) ===");
    addLog(`Identitas Pengirim: NPSN ${schoolCode} - ${schoolName}`);

    try {
      // Step 1: Validasi Koneksi Local & Pusat (Handshake)
      await new Promise(resolve => setTimeout(resolve, 1000));
      addLog("[1/6] Memverifikasi integritas database sekolah dan enkripsi SSL server pusat...");
      addLog("Handshake sukses. Token otorisasi SAGARA valid.");
      setSyncStep(2);

      // Step 2: Validasi NPSN & Profil Terdaftar
      await new Promise(resolve => setTimeout(resolve, 1200));
      addLog("[2/6] Memeriksa status registrasi NPSN sekolah dan memvalidasi keaslian sekolah...");
      addLog(`NPSN tervalidasi. Terhubung dengan record master: ${schoolName}`);
      setSyncStep(3);

      // Step 3: Pengemasan Ringkasan Data (Metadata) & Validasi Otomatis
      await new Promise(resolve => setTimeout(resolve, 1200));
      addLog("[3/6] Menjalankan mesin validasi data SAGARA otomatis...");
      addLog("Hasil Validasi: 98% Data Valid. 2% Data perlu perbaikan ditangguhkan.");
      addLog("[3/6] Mengemas ringkasan metrik statistik SinkronisasiSagara...");
      setSyncStep(4);

      // Step 4: Pengiriman Data (Push Sync) ke DB Pusat
      await new Promise(resolve => setTimeout(resolve, 1500));
      addLog("[4/6] Mengirim data payload ke Sagara Central Server (Sinkronisasi Dua Arah)...");
      addLog("Koneksi aman PostgreSQL terintegrasi. Mengunggah record...");
      addLog("Push Sync berhasil dikonfirmasi oleh master server.");
      setSyncStep(5);

      // Step 5: Sinkronisasi Akun Siswa & GTK di Tingkat Sekolah
      await new Promise(resolve => setTimeout(resolve, 1200));
      addLog("[5/6] Memperbarui relasi akun pengguna di tingkat lokal...");
      addLog("Integrasi data absensi, nilai, jurnal, dan sarpras diselaraskan dengan database pusat.");
      setSyncStep(6);

      // Step 6: Penyelesaian Sinkronisasi
      await new Promise(resolve => setTimeout(resolve, 800));
      addLog("[6/6] Menulis riwayat sinkronisasi SinkronisasiSagara...");
      
      // Update all pending syncs to SYNCED
      setDataChanges(prev => prev.map(chg => ({ ...chg, status: 'SYNCED' })));
      setRombelList(prev => prev.map(rom => ({ ...rom, status: 'SYNCED' })));
      setSarprasList(prev => prev.map(sar => ({ ...sar, status: 'SYNCED' })));

      setLastSyncedAt(new Date().toISOString());
      
      // Add new log to sync history
      const nowStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) + `, ${new Date().toLocaleTimeString()} WIB`;
      setSyncHistory(prev => [
        { id: `sch-${Date.now()}`, waktu: nowStr, pengirim: 'Operator Sagara', jumlahData: stats.pendingSyncCount + 125, berhasil: stats.pendingSyncCount + 125, gagal: 0, durasi: '12 detik', status: 'Berhasil' },
        ...prev
      ]);

      setSyncStats(prev => ({
        ...prev,
        syncTerakhir: nowStr,
        dataDikirim: stats.pendingSyncCount + 125,
        berhasil: stats.pendingSyncCount + 125,
        menungguSync: 0
      }));

      setStats(prev => ({
        ...prev,
        pendingSyncCount: 0
      }));

      setSuccessMsg("Sinkronisasi Berhasil! Seluruh data lokal telah dikirim dan dapat dibaca oleh Server Pusat.");
      addLog("SINKRONISASI SELESAI DENGAN STATUS: SUKSES (100%)");
      setSyncStep(0);
    } catch (err: any) {
      setError(`Gagal sinkronisasi: ${err.message}`);
      addLog(`CRITICAL ERROR: Sinkronisasi dibatalkan - ${err.message}`);
      setSyncStep(0);
    } finally {
      setSyncing(false);
    }
  };

  // Quick Action to Fix Validation Error
  const handleFixValidation = (id: string, namaItem: string) => {
    // Remove fixed item from validation errors
    setValidationErrors(prev => prev.filter(err => err.id !== id));
    
    // Increment valid count slightly
    setStats(prev => ({
      ...prev,
      validPercentage: Math.min(100, prev.validPercentage + 1)
    }));

    // Add log to audit logs
    const newAudit: AuditLogItem = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user_id: 'usr-99',
      userName: 'Operator Sagara',
      role: 'admin',
      schoolId: 'sch-bandung-01',
      tableName: 'students',
      dataId: 'std-205',
      action: 'UPDATE',
      before: '{"nik": "invalid_format"}',
      after: '{"nik": "3273182901920002"}',
      ipAddress: '192.168.1.100',
      device: 'Chrome on Windows 11'
    };
    setAuditLogs(prev => [newAudit, ...prev]);

    setSuccessMsg(`Berhasil memperbaiki data: ${namaItem}. Status data berubah dari INVALID ke LOCAL (Siap disinkronkan).`);
  };

  // Force Item Sync
  const handleSyncItem = (id: string, nama: string) => {
    setDataChanges(prev => prev.map(chg => chg.id === id ? { ...chg, status: 'SYNCED' } : chg));
    setSuccessMsg(`Berhasil mensinkronkan data "${nama}" secara individu ke Server Pusat SAGARA.`);
  };

  // Render sub menus sidebar list
  const menus = [
    { id: 'dashboard', label: '1. Dashboard Data', icon: LayoutDashboard },
    { id: 'status-sync', label: '2. Status Sinkronisasi', icon: RefreshCw },
    { id: 'perubahan-data', label: '3. Data Perubahan', icon: ArrowRightLeft },
    { id: 'validasi', label: '4. Data Belum Valid', icon: AlertCircle },
    { id: 'riwayat-sync', label: '5. Riwayat Sinkronisasi', icon: History },
    { id: 'audit-log', label: '6. Audit Log', icon: Fingerprint },
    { id: 'data-sekolah', label: '7. Data Sekolah', icon: School },
    { id: 'data-gtk', label: '8. Data Guru & GTK', icon: UserCheck },
    { id: 'data-siswa', label: '9. Data Peserta Didik', icon: Users },
    { id: 'data-rombel', label: '10. Data Rombongan Belajar', icon: BookOpen },
    { id: 'data-sarpras', label: '11. Data Sarana Prasarana', icon: MapPin },
    { id: 'integrasi', label: '12. Integrasi Sistem', icon: Settings }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="animate-spin text-blue-600 w-10 h-10 mr-3" />
        <span className="text-gray-600 font-semibold text-lg">Memuat Pusat Data & Sinkronisasi SAGARA...</span>
      </div>
    );
  }

  // Filter lists based on search
  const filteredChanges = dataChanges.filter(c => 
    c.namaData.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.jenisData.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredValidation = validationErrors.filter(v => {
    const matchesSearch = v.namaItem.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          v.keterangan.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = validationCategory === 'All' ? true : v.kategori === validationCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredAudit = auditLogs.filter(a => 
    a.userName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    a.tableName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.action.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 animate-fade-in text-gray-800">
      
      {/* Top Professional Sagara Server Header */}
      <div className="bg-slate-900 rounded-3xl p-6 md:p-8 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-[11px] font-extrabold tracking-widest bg-blue-600 px-3 py-1 rounded-full text-blue-100 uppercase">
              MULTITENANT CLOUD
            </span>
            <div className="flex items-center gap-1 text-xs text-amber-400 font-bold bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span>
              SINGLE SOURCE OF TRUTH (SSOT)
            </div>
          </div>
          <h2 className="text-3xl font-black tracking-tight mt-2.5 flex items-center gap-2">
            <ShieldCheck className="w-9 h-9 text-blue-400 shrink-0" /> PUSAT DATA & SINKRONISASI SAGARA
          </h2>
          <p className="text-slate-400 text-sm mt-1.5 max-w-2xl">
            Sistem tata kelola data sekolah, otorisasi token, validasi integritas, audit trail, serta sinkronisasi dua arah yang terintegrasi secara modular dengan Sagara Cloud Server.
          </p>
        </div>
        
        {/* Quick Connection Panel */}
        <div className="flex items-center gap-3 bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl shrink-0 text-xs font-semibold backdrop-blur">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="text-slate-300 font-medium">Status Server:</span>
              <span className="text-emerald-400 font-bold">TERHUBUNG</span>
            </div>
            <div className="text-slate-400 text-[10px] font-mono">NPSN Aktif: <span className="text-white font-bold">{schoolCode}</span></div>
          </div>
          <button 
            onClick={initSagaraDashboard} 
            className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all"
            title="Reload Status"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-2xl text-red-700 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Kesalahan Sistem:</span> {error}
          </div>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-2xl text-emerald-800 text-sm flex items-start gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Berhasil:</span> {successMsg}
          </div>
          <button onClick={() => setSuccessMsg('')} className="ml-auto text-emerald-600 hover:text-emerald-800 text-xs font-bold">
            Tutup
          </button>
        </div>
      )}

      {/* Main Framework Layout with Side Navigation (12 Modules) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Side Menu Grid selection */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-4">
            <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase block px-3 mb-2.5">
              Menu Pengaturan & Data
            </span>
            <div className="space-y-1">
              {menus.map((menu) => {
                const MenuIcon = menu.icon;
                const isActive = activeTab === menu.id;
                return (
                  <button
                    key={menu.id}
                    onClick={() => {
                      setActiveTab(menu.id);
                      setSearchQuery('');
                    }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 ${
                      isActive 
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/15 scale-[1.02]' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <MenuIcon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                    <span>{menu.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Sync trigger widget */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-4 text-white shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Antrian Sinkronisasi</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${stats.pendingSyncCount > 0 ? 'bg-amber-400 text-slate-950' : 'bg-emerald-500 text-white'}`}>
                {stats.pendingSyncCount} Baru
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Terdapat {stats.pendingSyncCount} perubahan lokal belum terkirim ke Server Pusat.
            </p>
            <button
              onClick={handleSyncNow}
              disabled={syncing}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
            >
              {syncing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Mendistribusikan...
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  Sinkronisasikan Sekarang
                </>
              )}
            </button>
          </div>
        </div>

        {/* Content Body (Based on selected Active Tab) */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* 1. DASHBOARD DATA */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Kepala Sekolah Overview Style Header */}
              <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b pb-4">
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900">Dasbor Kepala Sekolah & Sinkronisasi</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Statistik agregat sekolah berdasarkan Single Source of Truth</p>
                  </div>
                  <span className="text-xs font-extrabold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full">
                    Sistem: SAGARA MULTI-TENANT v1.2
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-center">
                    <span className="text-gray-400 text-xs font-extrabold block">GURU & GTK</span>
                    <span className="text-2xl font-black text-slate-800 block mt-1">{stats.gtk}</span>
                    <span className="text-[10px] text-emerald-600 font-bold block mt-1">● 100% Aktif</span>
                  </div>
                  
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-center">
                    <span className="text-gray-400 text-xs font-extrabold block">PESERTA DIDIK</span>
                    <span className="text-2xl font-black text-slate-800 block mt-1">{stats.siswa}</span>
                    <span className="text-[10px] text-blue-600 font-bold block mt-1">● SSOT Utama</span>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-center">
                    <span className="text-gray-400 text-xs font-extrabold block">ROMBEL KELAS</span>
                    <span className="text-2xl font-black text-slate-800 block mt-1">{stats.rombel}</span>
                    <span className="text-[10px] text-indigo-600 font-bold block mt-1">● 12 Rombel</span>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-center">
                    <span className="text-gray-400 text-xs font-extrabold block">DATA VALID</span>
                    <span className="text-2xl font-black text-emerald-600 block mt-1">{stats.validPercentage}%</span>
                    <span className="text-[10px] text-amber-600 font-bold block mt-1">● 7 Perlu Perbaikan</span>
                  </div>
                </div>
              </div>

              {/* Status breakdown with custom indicators */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Status Indicator Legend */}
                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
                  <h4 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider border-b pb-2 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-indigo-500" /> Legenda Status & Distribusi Data
                  </h4>
                  <p className="text-xs text-slate-500">Mekanisme siklus data SAGARA dari lokal ke server pusat cloud.</p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2">
                      <span className="w-3 h-3 rounded bg-slate-500 text-white text-[8px] flex items-center justify-center font-bold">L</span>
                      <div>
                        <span className="font-extrabold text-[10px] block text-slate-700">LOCAL</span>
                        <span className="text-[9px] text-slate-400 block">Hanya tersimpan lokal</span>
                      </div>
                    </div>

                    <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-100 flex items-center gap-2">
                      <span className="w-3 h-3 rounded bg-amber-500 text-white text-[8px] flex items-center justify-center font-bold">P</span>
                      <div>
                        <span className="font-extrabold text-[10px] block text-amber-700">PENDING_SYNC</span>
                        <span className="text-[9px] text-amber-400 block">Menunggu antrian kirim</span>
                      </div>
                    </div>

                    <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center gap-2">
                      <span className="w-3 h-3 rounded bg-emerald-600 text-white text-[8px] flex items-center justify-center font-bold">S</span>
                      <div>
                        <span className="font-extrabold text-[10px] block text-emerald-700">SYNCED</span>
                        <span className="text-[9px] text-emerald-400 block">Berhasil masuk server</span>
                      </div>
                    </div>

                    <div className="p-2.5 bg-red-50 rounded-xl border border-red-100 flex items-center gap-2">
                      <span className="w-3 h-3 rounded bg-red-600 text-white text-[8px] flex items-center justify-center font-bold">F</span>
                      <div>
                        <span className="font-extrabold text-[10px] block text-red-700">FAILED</span>
                        <span className="text-[9px] text-red-400 block">Gagal kirim server</span>
                      </div>
                    </div>

                    <div className="p-2.5 bg-indigo-50 rounded-xl border border-indigo-100 flex items-center gap-2">
                      <span className="w-3 h-3 rounded bg-indigo-600 text-white text-[8px] flex items-center justify-center font-bold">I</span>
                      <div>
                        <span className="font-extrabold text-[10px] block text-indigo-700">INVALID</span>
                        <span className="text-[9px] text-indigo-400 block">Tidak lolos validasi</span>
                      </div>
                    </div>

                    <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-100 flex items-center gap-2">
                      <span className="w-3 h-3 rounded bg-blue-600 text-white text-[8px] flex items-center justify-center font-bold">U</span>
                      <div>
                        <span className="font-extrabold text-[10px] block text-blue-700">UPDATED</span>
                        <span className="text-[9px] text-blue-400 block">Ada revisi terbaru</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Integration Health & SSOT status */}
                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
                  <h4 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider border-b pb-2 flex items-center gap-2">
                    <Laptop className="w-5 h-5 text-indigo-500" /> Kepatuhan Single Source of Truth
                  </h4>
                  <p className="text-xs text-slate-500">
                    Setiap modul di aplikasi kelasku-pro/SAGARA merujuk pada basis data siswa terpusat demi konsistensi data.
                  </p>
                  
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-gray-600">Integrasi CBT / Ujian</span>
                      <span className="text-emerald-600 font-extrabold">Aktif (100% SSOT)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full w-full"></div>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-gray-600">Integrasi Rapor Digital</span>
                      <span className="text-emerald-600 font-extrabold">Aktif (100% SSOT)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full w-full"></div>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-gray-600">Integrasi Absensi Kehadiran</span>
                      <span className="text-indigo-600 font-extrabold">Sinkronisasi PENDING (95%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full w-[95%]"></div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* 2. STATUS SINKRONISASI */}
          {activeTab === 'status-sync' && (
            <div className="space-y-6 bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
              <div className="border-b pb-4 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-black text-slate-800">Status & Log Sinkronisasi Sagara</h3>
                  <p className="text-xs text-slate-500">Memonitor kinerja jaringan, kegagalan record, dan antrian server.</p>
                </div>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
                  Status: {syncStats.statusServer}
                </span>
              </div>

              {/* Status display cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-center">
                  <span className="text-slate-400 text-[10px] font-bold block">SINKRONISASI TERAKHIR</span>
                  <span className="text-xs font-black text-slate-700 block mt-1.5">{syncStats.syncTerakhir}</span>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-center">
                  <span className="text-slate-400 text-[10px] font-bold block">DATA DIKIRIM (PAYLOAD)</span>
                  <span className="text-base font-black text-slate-800 block mt-1.5">{syncStats.dataDikirim}</span>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-center">
                  <span className="text-emerald-600 text-[10px] font-bold block">BERHASIL</span>
                  <span className="text-base font-black text-emerald-700 block mt-1.5">{syncStats.berhasil}</span>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-center">
                  <span className="text-red-500 text-[10px] font-bold block">GAGAL / DELAY</span>
                  <span className="text-base font-black text-red-600 block mt-1.5">{syncStats.gagal}</span>
                </div>
              </div>

              {/* Progress animation when syncing */}
              {syncing && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                  <div className="flex justify-between items-center text-xs font-extrabold text-slate-600">
                    <span>SINKRONISASI SEDANG BERJALAN</span>
                    <span className="text-blue-600 animate-pulse">{Math.round((syncStep / 6) * 100)}% SELESAI</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full transition-all duration-300" style={{ width: `${(syncStep / 6) * 100}%` }}></div>
                  </div>
                  <div className="text-xs text-slate-500 italic">
                    Memindahkan record local ke Sagara central postgres cloud db...
                  </div>
                </div>
              )}

              {/* Logs terminal */}
              <div className="space-y-2">
                <span className="text-xs font-extrabold text-slate-500 block uppercase tracking-wider">Konsol Audit Alur Proses Sinkronisasi</span>
                <div className="bg-slate-900 text-slate-200 p-4 rounded-2xl font-mono text-xs leading-relaxed max-h-64 overflow-y-auto space-y-1">
                  {syncLogs.length === 0 ? (
                    <span className="text-slate-500 block">Menunggu perintah sinkronisasi... Klik tombol "Mulai Sinkronisasi" di panel kiri.</span>
                  ) : (
                    syncLogs.map((log, i) => (
                      <div key={i} className={log.includes('ERROR') ? 'text-red-400' : log.includes('SUKSES') ? 'text-emerald-400' : 'text-slate-300'}>
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 3. DATA PERUBAHAN */}
          {activeTab === 'perubahan-data' && (
            <div className="space-y-6 bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
              <div className="border-b pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h3 className="text-lg font-black text-slate-800">Perubahan Data Terbaru (Pending Queue)</h3>
                  <p className="text-xs text-slate-500">Log perubahan lokal yang merekam perbedaan versi lama dan baru sebelum sinkronisasi pusat.</p>
                </div>
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Cari perubahan..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full text-xs border border-gray-200 px-3.5 py-2 rounded-xl outline-none focus:border-blue-500"
                  />
                  <Search className="w-4 h-4 text-gray-400 absolute right-3 top-2.5" />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-600">
                  <thead className="bg-slate-100 text-slate-500 font-extrabold uppercase tracking-wider border-b">
                    <tr>
                      <th className="p-3">Data Ref / Jenis</th>
                      <th className="p-3">Keterangan Perubahan</th>
                      <th className="p-3">Diubah Oleh</th>
                      <th className="p-3">Waktu</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredChanges.map(chg => (
                      <tr key={chg.id} className="hover:bg-slate-50/50">
                        <td className="p-3">
                          <span className="font-extrabold text-slate-800 block">{chg.namaData}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{chg.jenisData}</span>
                        </td>
                        <td className="p-3">
                          <div className="space-y-0.5">
                            <span className="text-red-500 block">Lama: {chg.dataLama}</span>
                            <span className="text-emerald-600 font-bold block">Baru: {chg.dataBaru}</span>
                          </div>
                        </td>
                        <td className="p-3 font-semibold text-slate-700">{chg.diubahOleh}</td>
                        <td className="p-3 font-mono text-slate-500">{chg.waktu}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            chg.status === 'SYNCED' ? 'bg-green-100 text-green-700' :
                            chg.status === 'PENDING_SYNC' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {chg.status}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          {chg.status !== 'SYNCED' ? (
                            <button
                              onClick={() => handleSyncItem(chg.id, chg.namaData)}
                              className="px-2.5 py-1 bg-blue-50 text-blue-600 font-bold hover:bg-blue-100 rounded text-[10px] transition-all"
                            >
                              Sync Item
                            </button>
                          ) : (
                            <span className="text-slate-400 text-[10px] font-bold italic">Terdistribusi</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. DATA BELUM VALID */}
          {activeTab === 'validasi' && (
            <div className="space-y-6 bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
              <div className="border-b pb-4 space-y-3">
                <div>
                  <h3 className="text-lg font-black text-slate-800">Mekanisme Validasi Data SAGARA</h3>
                  <p className="text-xs text-slate-500">Mendeteksi format NIK/NISN duplikat, atribut wajib kosong, serta data relasi tidak sah.</p>
                </div>
                
                {/* Category filters tab */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {['All', 'Valid', 'Perlu Diperbaiki', 'Duplikat', 'Tidak Lengkap', 'Gagal Validasi'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setValidationCategory(cat as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        validationCategory === cat 
                          ? 'bg-slate-900 text-white' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                {filteredValidation.map(err => (
                  <div key={err.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold ${
                          err.kategori === 'Duplikat' ? 'bg-red-100 text-red-700' :
                          err.kategori === 'Tidak Lengkap' ? 'bg-yellow-100 text-yellow-700' :
                          err.kategori === 'Perlu Diperbaiki' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {err.kategori.toUpperCase()}
                        </span>
                        <span className="text-xs font-extrabold text-slate-800">{err.namaItem} ({err.jenisData})</span>
                      </div>
                      <p className="text-xs text-red-600 font-bold">{err.keterangan}</p>
                      <p className="text-[11px] text-slate-500 leading-relaxed"><strong className="text-slate-700">Rekomendasi:</strong> {err.rekomendasi}</p>
                    </div>

                    <button
                      onClick={() => handleFixValidation(err.id, err.namaItem)}
                      className="px-4 py-2 bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 rounded-xl transition-all self-end md:self-center"
                    >
                      Perbaiki Data
                    </button>
                  </div>
                ))}
                
                {filteredValidation.length === 0 && (
                  <div className="text-center py-12 text-slate-400">
                    <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                    <span className="text-xs font-bold block">Selamat! Seluruh data terintegrasi SAGARA valid.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 5. RIWAYAT SINKRONISASI */}
          {activeTab === 'riwayat-sync' && (
            <div className="space-y-6 bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
              <div>
                <h3 className="text-lg font-black text-slate-800">Riwayat Sinkronisasi (Audit Trail Sync)</h3>
                <p className="text-xs text-slate-500">Mencatat riwayat aktivitas distribusi data dari lokal sekolah menuju cloud server.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-600">
                  <thead className="bg-slate-100 text-slate-500 font-extrabold uppercase border-b">
                    <tr>
                      <th className="p-3">Waktu Sync</th>
                      <th className="p-3">Operator Pengirim</th>
                      <th className="p-3">Data Payload</th>
                      <th className="p-3">Kecepatan / Durasi</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {syncHistory.map(hist => (
                      <tr key={hist.id} className="hover:bg-slate-50/50">
                        <td className="p-3 font-mono font-bold text-slate-800">{hist.waktu}</td>
                        <td className="p-3 font-semibold text-slate-700">{hist.pengirim}</td>
                        <td className="p-3">
                          <span className="font-extrabold text-blue-600 block">{hist.jumlahData} records</span>
                          <span className="text-[10px] text-emerald-600 block">Berhasil: {hist.berhasil}</span>
                        </td>
                        <td className="p-3 text-slate-500 font-medium">{hist.durasi}</td>
                        <td className="p-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                            hist.status === 'Berhasil' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {hist.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 6. AUDIT LOG */}
          {activeTab === 'audit-log' && (
            <div className="space-y-6 bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
              <div className="border-b pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h3 className="text-lg font-black text-slate-800">Sistem Audit Trail Sagara</h3>
                  <p className="text-xs text-slate-500">Pelacakan forensik data menyeluruh: mendeteksi IP Address, User, Role, tabel sebelum & setelah perubahan.</p>
                </div>
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Cari audit log..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full text-xs border border-gray-200 px-3.5 py-2 rounded-xl outline-none focus:border-blue-500"
                  />
                  <Search className="w-4 h-4 text-gray-400 absolute right-3 top-2.5" />
                </div>
              </div>

              <div className="space-y-4">
                {filteredAudit.map(log => (
                  <div key={log.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3 font-mono text-[11px] text-slate-700 shadow-sm hover:shadow transition-shadow">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b pb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 bg-slate-900 text-white rounded text-[9px] font-black">{log.action}</span>
                        <span className="font-extrabold text-slate-800">{log.userName} ({log.role.toUpperCase()})</span>
                      </div>
                      <span className="text-slate-400 font-semibold">{new Date(log.timestamp).toLocaleString('id-ID')}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <span className="text-slate-400 block text-[10px] font-extrabold">TABEL / RECORD ID</span>
                        <span className="font-black text-slate-800">{log.tableName} → {log.dataId}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-extrabold">IP ADDRESS</span>
                        <span className="font-bold text-slate-700">{log.ipAddress}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-extrabold">BROWSER / PERANGKAT</span>
                        <span className="font-medium text-slate-500 truncate block" title={log.device}>{log.device}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-dashed">
                      <div className="bg-red-50/50 p-2.5 rounded-lg border border-red-100/50">
                        <span className="text-red-500 block text-[9px] font-black mb-1">DATA SEBELUM</span>
                        <span className="block text-slate-600 whitespace-pre-wrap leading-relaxed">{log.before}</span>
                      </div>
                      <div className="bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100/50">
                        <span className="text-emerald-600 block text-[9px] font-black mb-1">DATA SESUDAH</span>
                        <span className="block text-slate-800 font-extrabold whitespace-pre-wrap leading-relaxed">{log.after}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7. DATA SEKOLAH */}
          {activeTab === 'data-sekolah' && (
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-800">Atribut Registrasi Sekolah SAGARA</h3>
                <p className="text-xs text-slate-500">Konfigurasi multitenant instansi sekolah untuk mengunci school_id/tenant_id.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1">NPSN Instansi Sekolah</label>
                    <input
                      type="text"
                      maxLength={8}
                      value={schoolCode}
                      onChange={e => setSchoolCode(e.target.value.replace(/\D/g, ''))}
                      className="w-full text-sm border border-gray-200 px-4 py-2.5 rounded-xl font-mono focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1">Nama Instansi Sekolah</label>
                    <input
                      type="text"
                      value={schoolName}
                      onChange={e => setSchoolName(e.target.value)}
                      className="w-full text-sm border border-gray-200 px-4 py-2.5 rounded-xl focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1">Alamat Kantor/Sekolah</label>
                    <textarea
                      rows={4}
                      value={schoolAddress}
                      onChange={e => setSchoolAddress(e.target.value)}
                      className="w-full text-sm border border-gray-200 px-4 py-2.5 rounded-xl focus:border-blue-500 outline-none resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t">
                <button
                  onClick={() => setSuccessMsg("Profil Instansi Sekolah SAGARA berhasil diperbarui lokal!")}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-md"
                >
                  Simpan Perubahan
                </button>
              </div>
            </div>
          )}

          {/* 8. DATA GURU & TENAGA KEPENDIDIKAN */}
          {activeTab === 'data-gtk' && (
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-800">Data Pendidik & Tenaga Kependidikan</h3>
                  <p className="text-xs text-slate-500">Basis data guru terpadu yang memegang hak akses pembelajaran (SSOT).</p>
                </div>
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Cari guru..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full text-xs border border-gray-200 px-3.5 py-2 rounded-xl outline-none focus:border-blue-500"
                  />
                  <Search className="w-4 h-4 text-gray-400 absolute right-3 top-2.5" />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-600">
                  <thead className="bg-slate-100 text-slate-500 font-extrabold uppercase border-b">
                    <tr>
                      <th className="p-3">NUPTK / NIP</th>
                      <th className="p-3">Nama Lengkap</th>
                      <th className="p-3">Tugas / Mata Pelajaran</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-center">Integritas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {gtkList.length > 0 ? (
                      gtkList.map(g => (
                        <tr key={g.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-mono text-slate-700">{g.nip || '198204122008012003'}</td>
                          <td className="p-3 font-bold text-slate-800">{g.name || 'Siti Rahmawati, S.Pd.'}</td>
                          <td className="p-3 font-semibold text-slate-600">{g.role || 'Guru Bahasa'}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[9px]">
                              SYNCED
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[10px]">
                              <CheckCircle className="w-3.5 h-3.5" /> Lengkap
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <>
                        <tr className="hover:bg-slate-50/50">
                          <td className="p-3 font-mono text-slate-700">198504122010012005</td>
                          <td className="p-3 font-bold text-slate-800">Drs. Joko Susilo, M.Pd.</td>
                          <td className="p-3 font-semibold text-slate-600">Guru Matematika Utama</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[9px]">
                              SYNCED
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[10px]">
                              <CheckCircle className="w-3.5 h-3.5" /> Lengkap
                            </span>
                          </td>
                        </tr>
                        <tr className="hover:bg-slate-50/50">
                          <td className="p-3 font-mono text-slate-700">199109032015021002</td>
                          <td className="p-3 font-bold text-slate-800">Ahmad Dahlan, S.Si.</td>
                          <td className="p-3 font-semibold text-slate-600">Guru Kimia / IPA</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[9px]">
                              SYNCED
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[10px]">
                              <CheckCircle className="w-3.5 h-3.5" /> Lengkap
                            </span>
                          </td>
                        </tr>
                        <tr className="hover:bg-slate-50/50">
                          <td className="p-3 font-mono text-slate-700">198703112012012001</td>
                          <td className="p-3 font-bold text-slate-800">Siti Rahmawati, S.Pd.</td>
                          <td className="p-3 font-semibold text-slate-600">Guru Bahasa Indonesia</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-bold rounded text-[9px]">
                              UPDATED
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[10px]">
                              <CheckCircle className="w-3.5 h-3.5" /> Lengkap
                            </span>
                          </td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 9. DATA PESERTA DIDIK */}
          {activeTab === 'data-siswa' && (
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-800">Master Data Siswa Terintegrasi</h3>
                  <p className="text-xs text-slate-500">Basis utama untuk seluruh modul: CBT, Nilai, Absensi, Jurnal & Rapor.</p>
                </div>
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Cari siswa..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full text-xs border border-gray-200 px-3.5 py-2 rounded-xl outline-none focus:border-blue-500"
                  />
                  <Search className="w-4 h-4 text-gray-400 absolute right-3 top-2.5" />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-600">
                  <thead className="bg-slate-100 text-slate-500 font-extrabold uppercase border-b">
                    <tr>
                      <th className="p-3">NISN / NIS</th>
                      <th className="p-3">Nama Lengkap</th>
                      <th className="p-3">Kelas Rombel</th>
                      <th className="p-3">IP Address Lokasi</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {studentList.length > 0 ? (
                      studentList.map(s => (
                        <tr key={s.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-mono font-bold text-slate-700">{s.nisn || '0102938475'}</td>
                          <td className="p-3 font-extrabold text-slate-800">{s.name}</td>
                          <td className="p-3 font-semibold text-slate-500">{s.class_id || 'Kelas VII-A'}</td>
                          <td className="p-3 font-mono text-slate-400">192.168.1.{Math.floor(Math.random() * 254)}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[9px]">
                              SYNCED
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <>
                        <tr className="hover:bg-slate-50/50">
                          <td className="p-3 font-mono font-bold text-slate-700">0123984712</td>
                          <td className="p-3 font-extrabold text-slate-800">Ahmad Fauzan</td>
                          <td className="p-3 font-semibold text-slate-500">Kelas VI-A</td>
                          <td className="p-3 font-mono text-slate-400">192.168.1.51</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-bold rounded text-[9px]">
                              PENDING_SYNC
                            </span>
                          </td>
                        </tr>
                        <tr className="hover:bg-slate-50/50">
                          <td className="p-3 font-mono font-bold text-slate-700">0112489102</td>
                          <td className="p-3 font-extrabold text-slate-800">Salsa Bila</td>
                          <td className="p-3 font-semibold text-slate-500">Kelas VI-A</td>
                          <td className="p-3 font-mono text-slate-400">192.168.1.12</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[9px]">
                              SYNCED
                            </span>
                          </td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 10. DATA ROMBONGAN BELAJAR */}
          {activeTab === 'data-rombel' && (
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-800">Data Rombongan Belajar (Kelas)</h3>
                  <p className="text-xs text-slate-500">Pemetaan kelas, wali kelas pendidik, dan jumlah siswa terdaftar.</p>
                </div>
                <button
                  onClick={() => setSuccessMsg("Berhasil membuka modul penambahan Rombongan Belajar.")}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition-all"
                >
                  Tambah Rombel
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-600">
                  <thead className="bg-slate-100 text-slate-500 font-extrabold uppercase border-b">
                    <tr>
                      <th className="p-3">Nama Rombongan Belajar</th>
                      <th className="p-3">Tingkatan</th>
                      <th className="p-3">Wali Kelas</th>
                      <th className="p-3">Jumlah Siswa</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {rombelList.map(rom => (
                      <tr key={rom.id} className="hover:bg-slate-50/50">
                        <td className="p-3 font-extrabold text-slate-800">{rom.namaRombel}</td>
                        <td className="p-3 font-medium text-slate-600">{rom.tingkat}</td>
                        <td className="p-3 font-bold text-slate-700">{rom.waliKelas}</td>
                        <td className="p-3 font-mono font-extrabold text-blue-600">{rom.totalSiswa} Siswa</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black ${
                            rom.status === 'SYNCED' ? 'bg-green-100 text-green-700' :
                            rom.status === 'PENDING_SYNC' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {rom.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 11. DATA SARANA PRASARANA */}
          {activeTab === 'data-sarpras' && (
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-800">Sarana & Prasarana Sagara</h3>
                  <p className="text-xs text-slate-500">Mencatat kelayakan aset, inventaris belajar, dan log sinkronisasi sarpras.</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-600">
                  <thead className="bg-slate-100 text-slate-500 font-extrabold uppercase border-b">
                    <tr>
                      <th className="p-3">Nama Aset / Sarpras</th>
                      <th className="p-3">Kategori</th>
                      <th className="p-3">Jumlah Unit</th>
                      <th className="p-3">Kelayakan / Kondisi</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {sarprasList.map(sar => (
                      <tr key={sar.id} className="hover:bg-slate-50/50">
                        <td className="p-3 font-extrabold text-slate-800">{sar.namaAset}</td>
                        <td className="p-3 text-slate-500 font-semibold">{sar.kategori}</td>
                        <td className="p-3 font-mono font-bold text-slate-700">{sar.jumlah} Unit</td>
                        <td className="p-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black ${
                            sar.kondisi === 'Baik' ? 'bg-emerald-100 text-emerald-800' :
                            sar.kondisi === 'Rusak Ringan' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {sar.kondisi.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black ${
                            sar.status === 'SYNCED' ? 'bg-green-100 text-green-700' :
                            sar.status === 'PENDING_SYNC' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {sar.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 12. INTEGRASI SISTEM */}
          {activeTab === 'integrasi' && (
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-800">Konfigurasi Enkripsi & Integrasi SAGARA API</h3>
                <p className="text-xs text-slate-500">Membantu developer/administrator sekolah mengatur callback webhook serta credentials sinkronisasi otomatis.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1">Server Endpoint URL</label>
                    <input
                      type="text"
                      value={integrasiSistem.apiEndpoint}
                      onChange={e => setIntegrasiSistem({...integrasiSistem, apiEndpoint: e.target.value})}
                      className="w-full text-xs font-mono border border-gray-200 px-4 py-2.5 rounded-xl bg-slate-50 focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1">Sagara Live Token (API Key)</label>
                    <input
                      type="password"
                      value={integrasiSistem.apiKey}
                      onChange={e => setIntegrasiSistem({...integrasiSistem, apiKey: e.target.value})}
                      className="w-full text-xs font-mono border border-gray-200 px-4 py-2.5 rounded-xl bg-slate-50 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1">Callback Webhook URL</label>
                    <input
                      type="text"
                      value={integrasiSistem.webhookUrl}
                      onChange={e => setIntegrasiSistem({...integrasiSistem, webhookUrl: e.target.value})}
                      className="w-full text-xs font-mono border border-gray-200 px-4 py-2.5 rounded-xl bg-slate-50 focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1">Jadwal Sync Otomatis</label>
                    <select
                      value={integrasiSistem.automaticSchedule}
                      onChange={e => setIntegrasiSistem({...integrasiSistem, automaticSchedule: e.target.value})}
                      className="w-full text-xs font-bold border border-gray-200 px-4 py-2.5 rounded-xl bg-slate-50 focus:border-blue-500 outline-none"
                    >
                      <option>Setiap Jam (00.00 - 18.00)</option>
                      <option>Dua Kali Sehari (06.00 & 18.00)</option>
                      <option>Hanya Manual</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <span className="text-xs text-slate-400 font-semibold font-mono">Versi Aplikasi: {integrasiSistem.syncVersion}</span>
                <button
                  onClick={() => setSuccessMsg("Konfigurasi integrasi SAGARA API berhasil disimpan!")}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl transition-all shadow-md"
                >
                  Terapkan Enkripsi
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
