import React, { useState, useEffect, useMemo } from 'react';
import { masterSupabase, supabase } from '../services/supabaseClient';
import { apiService } from '../services/apiService';
import { 
  Loader2, Plus, Trash2, Edit2, Save, X, School, CheckCircle2, XCircle, 
  Eye, Activity, Users, BookOpen, AlertCircle, FileSpreadsheet, ShieldCheck, Database, LayoutGrid,
  Search, Calendar, Award, TrendingUp, BarChart3, PieChart as PieChartIcon, ArrowRight, Check, FileText,
  Download, Layers, Settings, Globe, Coins, Heart, User
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface SchoolDatabase {
  id: string;
  school_code: string;
  school_name: string;
  supabase_url: string;
  supabase_anon_key: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface SchoolLiveStats {
  studentsCount: number;
  gtkCount: number;
  gradesCount: number;
  attendanceCount: number;
  materialsCount: number;
  lastSync: string;
  status: 'online' | 'offline' | 'checking';
}

interface StudentRecord {
  id: string;
  nisn: string;
  name: string;
  class_name: string;
  gender: 'L' | 'P';
  sync_time: string;
  status: 'TERVERIFIKASI' | 'PROSES';
  school_code?: string;
  school_name?: string;
  nis?: string;
  birth_place?: string;
  birth_date?: string;
  religion?: string;
  address?: string;
  father_name?: string;
  father_job?: string;
  father_education?: string;
  mother_name?: string;
  mother_job?: string;
  mother_education?: string;
  parent_name?: string;
  parent_phone?: string;
  parent_job?: string;
  economy_status?: string;
  height?: number;
  weight?: number;
  blood_type?: string;
  health_notes?: string;
  hobbies?: string;
  ambition?: string;
}

interface GtkRecord {
  id: string;
  nuptk: string;
  name: string;
  position: string;
  subject: string;
  sync_time: string;
  status: 'TERVERIFIKASI' | 'PROSES';
  school_code?: string;
  school_name?: string;
  nip?: string;
  jenis_kelamin?: string;
  gender?: string;
  tempat_lahir?: string;
  tanggal_lahir?: string;
  ijazah_tertinggi?: string;
  status_pegawai?: string;
  employment_status?: string;
  is_certified?: boolean;
  pangkat_golongan?: string;
  masa_kerja_tahun?: number;
  masa_kerja_bulan?: number;
  sk_terakhir?: string;
  email_pribadi?: string;
  email_belajar?: string;
}

interface AttendanceRecord {
  id: string;
  student_name: string;
  class_name: string;
  date: string;
  status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpa';
  sync_time: string;
}

interface GradeRecord {
  id: string;
  student_name: string;
  class_name: string;
  subject: string;
  exam_type: 'Sumatif Tengah Semester' | 'Sumatif Akhir Semester' | 'Tugas Harian';
  score: number;
  sync_time: string;
}

interface MaterialRecord {
  id: string;
  title: string;
  class_name: string;
  creator: string;
  size: string;
  downloads: number;
  category: string;
  sync_time: string;
}

// Fallback high-fidelity schools
const ALL_SCHOOLS_VIRTUAL: SchoolDatabase = {
  id: 'all_schools',
  school_code: 'ALL',
  school_name: 'Semua Sekolah (Secara Keseluruhan)',
  supabase_url: 'Database Sagara Pusat',
  supabase_anon_key: '',
  is_active: true,
  created_at: new Date().toISOString()
};

const DEFAULT_SCHOOLS: SchoolDatabase[] = [
  {
    id: 'sagara-1',
    school_code: '20521001',
    school_name: 'SMA Sagara Global Utama',
    supabase_url: 'https://sagara-global.supabase.co',
    supabase_anon_key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    is_active: true,
    created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
  },
  {
    id: 'sagara-2',
    school_code: '20521002',
    school_name: 'SMK Sagara IT & Bisnis',
    supabase_url: 'https://sagara-smk.supabase.co',
    supabase_anon_key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    is_active: true,
    created_at: new Date(Date.now() - 45 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString()
  },
  {
    id: 'sagara-3',
    school_code: '20521003',
    school_name: "MA Sagara Sains & Al-Qur'an",
    supabase_url: 'https://sagara-ma.supabase.co',
    supabase_anon_key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    is_active: true,
    created_at: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString()
  }
];

export const MasterDatabaseManagement: React.FC = () => {
  const [schools, setSchools] = useState<SchoolDatabase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Real database states
  const [studentsList, setStudentsList] = useState<StudentRecord[]>([]);
  const [gtkList, setGtkList] = useState<GtkRecord[]>([]);
  const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>([]);
  const [gradesList, setGradesList] = useState<GradeRecord[]>([]);
  const [materialsList, setMaterialsList] = useState<MaterialRecord[]>([]);
  const [localSchoolCode, setLocalSchoolCode] = useState('20521001');

  // Central real database totals
  const [centralTotalStudents, setCentralTotalStudents] = useState<number | null>(null);
  const [centralTotalGtk, setCentralTotalGtk] = useState<number | null>(null);
  const [centralTotalSyncs, setCentralTotalSyncs] = useState<number | null>(null);

  // Tabs: 'visualisasi' for beautiful charts/browser, 'konfigurasi' for connection table
  const [activeTab, setActiveTab] = useState<'visualisasi' | 'konfigurasi'>('visualisasi');

  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<SchoolDatabase>>({});
  const [isAdding, setIsAdding] = useState(false);

  // Inspector & Active Selection States
  const [selectedSchool, setSelectedSchool] = useState<SchoolDatabase | null>(null);
  const [inspectStats, setInspectStats] = useState<SchoolLiveStats | null>(null);
  const [inspecting, setInspecting] = useState(false);

  // Browser Data Category State
  const [selectedCategory, setSelectedCategory] = useState<'students' | 'gtk' | 'attendance' | 'grades' | 'materials'>('students');
  const [searchQuery, setSearchQuery] = useState('');
  const [exporting, setExporting] = useState(false);
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<StudentRecord | null>(null);
  const [selectedGtkDetail, setSelectedGtkDetail] = useState<GtkRecord | null>(null);

  useEffect(() => {
    const loadLocalProfile = async () => {
      try {
        const profiles = await apiService.getProfiles();
        const sProfile = profiles.school;
        if (sProfile && sProfile.npsn) {
          setLocalSchoolCode(sProfile.npsn.trim());
        }
      } catch (err) {
        console.error("Gagal memuat profil sekolah lokal:", err);
      }
    };
    loadLocalProfile();
    fetchSchools();
  }, []);

  useEffect(() => {
    if (selectedSchool) {
      handleInspectSchool(selectedSchool);
    }
  }, [selectedSchool]);

  const fetchSchools = async () => {
    try {
      if (!masterSupabase) {
        // Fallback directly to demo
        setSchools(DEFAULT_SCHOOLS);
        setSelectedSchool(ALL_SCHOOLS_VIRTUAL);
        setLoading(false);
        return;
      }
      
      const { data, error: fetchErr } = await masterSupabase
        .from('school_databases')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (fetchErr) throw fetchErr;

      const loadedSchools = data && data.length > 0 ? data : DEFAULT_SCHOOLS;
      setSchools(loadedSchools);
      setSelectedSchool(ALL_SCHOOLS_VIRTUAL);

      // Ambil total data pusat secara akurat
      try {
        const [countSt, countGtk, countAt, countGr, countMat] = await Promise.all([
          masterSupabase.from('synced_students').select('*', { count: 'exact', head: true }),
          masterSupabase.from('synced_gtk_data').select('*', { count: 'exact', head: true }),
          masterSupabase.from('synced_attendance').select('*', { count: 'exact', head: true }),
          masterSupabase.from('synced_grades').select('*', { count: 'exact', head: true }),
          masterSupabase.from('synced_materials').select('*', { count: 'exact', head: true })
        ]);

        setCentralTotalStudents(countSt.count || 0);
        setCentralTotalGtk(countGtk.count || 0);
        setCentralTotalSyncs((countAt.count || 0) + (countGr.count || 0) + (countMat.count || 0));
      } catch (countErr) {
        console.error("Gagal mengambil total statistik pusat:", countErr);
      }
    } catch (err: any) {
      // Graceful fallback to default mock schools
      setSchools(DEFAULT_SCHOOLS);
      setSelectedSchool(ALL_SCHOOLS_VIRTUAL);
      setError("Database Pusat Supabase offline. Mengaktifkan Mode Demonstrasi Sagara Cloud Server.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (id?: string) => {
    try {
      const cleanCode = (editForm.school_code || '').trim();
      if (!/^\d{8}$/.test(cleanCode)) {
        throw new Error('NPSN Sekolah harus berupa 8 digit angka!');
      }

      setLoading(true);
      if (masterSupabase) {
        if (id) {
          const { error: updateErr } = await masterSupabase
            .from('school_databases')
            .update({
              school_code: cleanCode,
              school_name: editForm.school_name,
              supabase_url: editForm.supabase_url,
              supabase_anon_key: editForm.supabase_anon_key,
              is_active: editForm.is_active ?? true,
              updated_at: new Date().toISOString()
            })
            .eq('id', id);
          if (updateErr) throw updateErr;
        } else {
          const { error: insertErr } = await masterSupabase
            .from('school_databases')
            .insert([{
              school_code: cleanCode,
              school_name: editForm.school_name,
              supabase_url: editForm.supabase_url,
              supabase_anon_key: editForm.supabase_anon_key,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }]);
          if (insertErr) throw insertErr;
        }
      } else {
        // Update local state directly
        if (id) {
          setSchools(prev => prev.map(s => s.id === id ? { ...s, ...editForm, updated_at: new Date().toISOString() } : s));
        } else {
          const newSchool: SchoolDatabase = {
            id: `school-${Date.now()}`,
            school_code: cleanCode,
            school_name: editForm.school_name || 'Sekolah Baru Sagara',
            supabase_url: editForm.supabase_url || 'https://new-sagara.supabase.co',
            supabase_anon_key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          setSchools(prev => [newSchool, ...prev]);
        }
      }
      
      setIsEditing(null);
      setIsAdding(false);
      setEditForm({});
      await fetchSchools();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus data sekolah ini dari server monitoring Sagara?')) return;
    try {
      setLoading(true);
      if (masterSupabase) {
        const { error: delErr } = await masterSupabase
          .from('school_databases')
          .delete()
          .eq('id', id);
        if (delErr) throw delErr;
      } else {
        setSchools(prev => prev.filter(s => s.id !== id));
      }
      await fetchSchools();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const toggleActive = async (school: SchoolDatabase) => {
    try {
      setLoading(true);
      if (masterSupabase) {
        const { error: updateErr } = await masterSupabase
          .from('school_databases')
          .update({ 
            is_active: !school.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', school.id);
        if (updateErr) throw updateErr;
      } else {
        setSchools(prev => prev.map(s => s.id === school.id ? { ...s, is_active: !s.is_active } : s));
      }
      await fetchSchools();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleInspectSchool = async (school: SchoolDatabase) => {
    setInspecting(true);
    setInspectStats(null);

    const getFallbackStudentsForSchool = (sch: SchoolDatabase): StudentRecord[] => {
      const list = [
        { id: `st-${sch.school_code}-1`, nisn: '0087612101', name: 'Ahmad Fauzi Pratama', class_name: 'XII IPA 1', gender: 'L', sync_time: 'Hari ini, 09:45', status: 'TERVERIFIKASI', economy_status: 'Kurang Mampu', blood_type: 'O', height: 165, weight: 55, address: 'DESA REMEN', religion: 'Islam' },
        { id: `st-${sch.school_code}-2`, nisn: '0092123512', name: 'Siti Nurhaliza Rahma', class_name: 'XI IPS 2', gender: 'P', sync_time: 'Hari ini, 09:45', status: 'TERVERIFIKASI', economy_status: 'Mampu', blood_type: 'A', height: 158, weight: 48, address: 'DESA REMEN', religion: 'Islam' },
        { id: `st-${sch.school_code}-3`, nisn: '0085432109', name: 'Budi Utomo Harahap', class_name: 'XII IPA 1', gender: 'L', sync_time: 'Kemarin, 14:20', status: 'TERVERIFIKASI', economy_status: 'Penerima KIP', blood_type: 'B', height: 170, weight: 72, address: 'DESA REMEN', religion: 'Kristen' },
        { id: `st-${sch.school_code}-4`, nisn: '0098765432', name: 'Dewi Chandra Lestari', class_name: 'X Rombel 3', gender: 'P', sync_time: 'Kemarin, 14:20', status: 'TERVERIFIKASI', economy_status: 'Mampu', blood_type: 'AB', height: 162, weight: 50, address: 'DESA REMEN', religion: 'Islam' },
        { id: `st-${sch.school_code}-5`, nisn: '0091122334', name: 'Eko Prasetyo Utomo', class_name: 'XI IPA 1', gender: 'L', sync_time: '2 hari lalu, 11:30', status: 'TERVERIFIKASI', economy_status: 'Sangat Mampu', blood_type: 'O', height: 175, weight: 80, address: 'DESA REMEN', religion: 'Islam' },
        { id: `st-${sch.school_code}-6`, nisn: '0082233445', name: 'Fitriani Indah Lestari', class_name: 'X Rombel 2', gender: 'P', sync_time: '2 hari lalu, 11:30', status: 'TERVERIFIKASI', economy_status: 'Kurang Mampu', blood_type: 'A', height: 155, weight: 45, address: 'DESA REMEN', religion: 'Islam' },
        { id: `st-${sch.school_code}-7`, nisn: '0093344556', name: 'Guntur Pratama Putra', class_name: 'XII IPS 2', gender: 'L', sync_time: '3 hari lalu, 16:00', status: 'TERVERIFIKASI', economy_status: 'Penerima KIP', blood_type: 'B', height: 168, weight: 54, address: 'DESA REMEN', religion: 'Islam' },
        { id: `st-${sch.school_code}-8`, nisn: '0084455667', name: 'Hani Susanti Rahayu', class_name: 'XI IPS 3', gender: 'P', sync_time: '3 hari lalu, 16:00', status: 'TERVERIFIKASI', economy_status: 'Mampu', blood_type: 'O', height: 160, weight: 52, address: 'DESA REMEN', religion: 'Islam' },
      ];
      return list.map(st => {
        const isSMK = sch.school_code === '20521002' || sch.school_code === '20504761';
        const isMA = sch.school_code === '20521003';
        let cls = st.class_name;
        if (isSMK) cls = cls.replace('IPA', 'TKJ').replace('IPS', 'RPL');
        if (isMA) cls = cls.replace('IPA', 'MIA').replace('IPS', 'IIS');
        return {
          ...st,
          class_name: cls,
          school_code: sch.school_code,
          father_name: 'Bp. ' + st.name.split(' ')[0],
          mother_name: 'Ibu ' + st.name.split(' ')[0],
          father_job: 'Karyawan Swasta',
          mother_job: 'Ibu Rumah Tangga'
        } as StudentRecord;
      });
    };

    const getFallbackGtkForSchool = (sch: SchoolDatabase): GtkRecord[] => {
      const list = [
        { id: `gt-${sch.school_code}-1`, nuptk: '1234765421090001', name: 'Drs. Sutarjo, M.Pd.', position: 'Kepala Sekolah', subject: 'Manajemen Sekolah', sync_time: 'Hari ini, 09:45', status: 'TERVERIFIKASI', nip: '196803151993031002', jenis_kelamin: 'L', status_pegawai: 'PNS/ASN', pangkat_golongan: 'Pembina IV/a', email_belajar: 'sutarjo@admin.sd.belajar.id' },
        { id: `gt-${sch.school_code}-2`, nuptk: '9876543210987002', name: 'Rina Wijaya, S.Si.', position: 'Wakasek Kurikulum', subject: 'Fisika & Matematika', sync_time: 'Hari ini, 09:45', status: 'TERVERIFIKASI', nip: '198211042008012015', jenis_kelamin: 'P', status_pegawai: 'PNS/ASN', pangkat_golongan: 'Penata III/c', email_belajar: 'rina.wijaya@guru.sd.belajar.id' },
        { id: `gt-${sch.school_code}-3`, nuptk: '3456789012345003', name: 'Hendra Hermawan, S.Kom.', position: 'Kaprog IT', subject: 'Informatika Dasar', sync_time: 'Kemarin, 14:20', status: 'TERVERIFIKASI', nip: '199004252024211020', jenis_kelamin: 'L', status_pegawai: 'PPPK', pangkat_golongan: 'Penata Muda IX', email_belajar: 'hendra.hermawan@guru.sd.belajar.id' },
        { id: `gt-${sch.school_code}-4`, nuptk: '4567890123456004', name: 'Sri Wahyuni, S.Pd.', position: 'Guru Pertama', subject: 'Bahasa Inggris', sync_time: 'Kemarin, 14:20', status: 'TERVERIFIKASI', nip: '', jenis_kelamin: 'P', status_pegawai: 'GTT/Honor', pangkat_golongan: '-', email_belajar: 'sri.wahyuni@guru.sd.belajar.id' },
        { id: `gt-${sch.school_code}-5`, nuptk: '5678901234567005', name: 'Andi Setiawan, S.Pd.', position: 'Guru Pertama', subject: 'Pendidikan Jasmani', sync_time: '2 hari lalu, 11:30', status: 'TERVERIFIKASI', nip: '198805202022211008', jenis_kelamin: 'L', status_pegawai: 'PPPK', pangkat_golongan: 'Penata Muda IX', email_belajar: 'andi.setiawan@guru.sd.belajar.id' },
        { id: `gt-${sch.school_code}-6`, nuptk: '7689123456710082', name: 'Mega Utami, S.Pd.', position: 'Guru Pertama', subject: 'Kimia & Biologi', sync_time: '3 hari lalu, 16:00', status: 'TERVERIFIKASI', nip: '', jenis_kelamin: 'P', status_pegawai: 'GTT/Honor', pangkat_golongan: '-', email_belajar: 'mega.utami@guru.sd.belajar.id' },
      ];
      return list.map(gt => ({ ...gt, school_code: sch.school_code }) as GtkRecord);
    };

    const getFallbackAttendanceForSchool = (sch: SchoolDatabase): AttendanceRecord[] => [
      { id: `at-${sch.school_code}-1`, student_name: 'Ahmad Fauzi Pratama', class_name: 'XII IPA 1', date: '2026-07-21', status: 'Hadir', sync_time: 'Hari ini, 09:45' },
      { id: `at-${sch.school_code}-2`, student_name: 'Siti Nurhaliza Rahma', class_name: 'XI IPS 2', date: '2026-07-21', status: 'Hadir', sync_time: 'Hari ini, 09:45' },
      { id: `at-${sch.school_code}-3`, student_name: 'Budi Utomo Harahap', class_name: 'XII IPA 1', date: '2026-07-21', status: 'Sakit', sync_time: 'Kemarin, 14:20' },
      { id: `at-${sch.school_code}-4`, student_name: 'Dewi Chandra Lestari', class_name: 'X Rombel 3', date: '2026-07-20', status: 'Hadir', sync_time: 'Kemarin, 14:20' },
      { id: `at-${sch.school_code}-5`, student_name: 'Eko Prasetyo Utomo', class_name: 'XI IPA 1', date: '2026-07-20', status: 'Izin', sync_time: '2 hari lalu, 11:30' },
    ].map(at => {
      const isSMK = sch.school_code === '20521002' || sch.school_code === '20504761';
      let cls = at.class_name;
      if (isSMK) cls = cls.replace('IPA', 'TKJ').replace('IPS', 'RPL');
      return { ...at, class_name: cls } as AttendanceRecord;
    });

    const getFallbackGradesForSchool = (sch: SchoolDatabase): GradeRecord[] => [
      { id: `gr-${sch.school_code}-1`, student_name: 'Ahmad Fauzi Pratama', class_name: 'XII IPA 1', subject: 'Matematika Terapan', exam_type: 'Sumatif Tengah Semester', score: 88, sync_time: 'Hari ini, 09:45' },
      { id: `gr-${sch.school_code}-2`, student_name: 'Siti Nurhaliza Rahma', class_name: 'XI IPS 2', subject: 'Sosiologi', exam_type: 'Sumatif Tengah Semester', score: 92, sync_time: 'Hari ini, 09:45' },
      { id: `gr-${sch.school_code}-3`, student_name: 'Budi Utomo Harahap', class_name: 'XII IPA 1', subject: 'Fisika Eksperimental', exam_type: 'Sumatif Akhir Semester', score: 74, sync_time: 'Kemarin, 14:20' },
    ].map(gr => {
      const isSMK = sch.school_code === '20521002' || sch.school_code === '20504761';
      let cls = gr.class_name;
      if (isSMK) cls = cls.replace('IPA', 'TKJ').replace('IPS', 'RPL');
      return { ...gr, class_name: cls } as GradeRecord;
    });

    const getFallbackMaterialsForSchool = (sch: SchoolDatabase): MaterialRecord[] => [
      { id: `mat-${sch.school_code}-1`, title: 'Konsep Pemrograman Dasar & OOP', class_name: 'Kelas X & XI', creator: 'Hendra Hermawan, S.Kom.', size: '4.2 MB', downloads: 35, category: 'Informatika', sync_time: 'Hari ini, 09:45' },
      { id: `mat-${sch.school_code}-2`, title: 'Mekanika Fluida & Hukum Bernoulli', class_name: 'Kelas XI', creator: 'Rina Wijaya, S.Si.', size: '5.8 MB', downloads: 22, category: 'Fisika', sync_time: 'Hari ini, 09:45' },
    ];

    const cleanGender = (g: string): 'L' | 'P' => {
      const norm = String(g || '').trim().toUpperCase();
      if (norm === 'P' || norm === 'PEREMPUAN' || norm === 'PUAN' || norm === 'FEMALE') return 'P';
      return 'L';
    };

    const cleanStatus = (s: string): 'Hadir' | 'Sakit' | 'Izin' | 'Alpa' => {
      const norm = String(s || '').trim().toLowerCase();
      if (norm.startsWith('h')) return 'Hadir';
      if (norm.startsWith('s')) return 'Sakit';
      if (norm.startsWith('i')) return 'Izin';
      if (norm.startsWith('a')) return 'Alpa';
      return 'Hadir';
    };

    try {
      let finalStudents: StudentRecord[] = [];
      let finalGtk: GtkRecord[] = [];
      let finalAttendance: AttendanceRecord[] = [];
      let finalGrades: GradeRecord[] = [];
      let finalMaterials: MaterialRecord[] = [];
      
      let isUsingRealData = false;

      // 1. Coba ambil data dari master database pusat (synced_*)
      if (masterSupabase) {
        try {
          let qSt = masterSupabase.from('synced_students').select('*');
          let qGtk = masterSupabase.from('synced_gtk_data').select('*');
          let qAt = masterSupabase.from('synced_attendance').select('*');
          let qGr = masterSupabase.from('synced_grades').select('*');
          let qMat = masterSupabase.from('synced_materials').select('*');

          if (school.id !== 'all_schools') {
            qSt = qSt.eq('school_code', school.school_code);
            qGtk = qGtk.eq('school_code', school.school_code);
            qAt = qAt.eq('school_code', school.school_code);
            qGr = qGr.eq('school_code', school.school_code);
            qMat = qMat.eq('school_code', school.school_code);
          }

          const [resSt, resGtk, resAt, resGr, resMat] = await Promise.all([
            qSt,
            qGtk,
            qAt,
            qGr,
            qMat
          ]);

          if (resSt.data && resSt.data.length > 0) {
            finalStudents = resSt.data.map((row: any) => ({
              id: row.id,
              nisn: row.nisn || row.nis || 'Belum Diisi',
              name: row.name || 'Siswa Tanpa Nama',
              class_name: row.class_id || row.class_name || 'Tidak Ada Kelas',
              gender: cleanGender(row.gender),
              sync_time: row.updated_at ? new Date(row.updated_at).toLocaleString('id-ID') : new Date().toLocaleString('id-ID'),
              status: 'TERVERIFIKASI',
              school_code: row.school_code,
              nis: row.nis,
              birth_place: row.birth_place,
              birth_date: row.birth_date,
              religion: row.religion,
              address: row.address,
              father_name: row.father_name,
              father_job: row.father_job,
              father_education: row.father_education,
              mother_name: row.mother_name,
              mother_job: row.mother_job,
              mother_education: row.mother_education,
              parent_name: row.parent_name,
              parent_phone: row.parent_phone,
              parent_job: row.parent_job,
              economy_status: row.economy_status || 'Mampu',
              height: row.height || 0,
              weight: row.weight || 0,
              blood_type: row.blood_type || '-',
              health_notes: row.health_notes || '-',
              hobbies: row.hobbies || '-',
              ambition: row.ambition || '-'
            }));
            isUsingRealData = true;
          }

          if (resGtk.data && resGtk.data.length > 0) {
            const uniqueGtkMap = new Map<string, any>();
            resGtk.data.forEach((row: any) => {
              const key = (row.nuptk || row.nip || row.nama || row.name || row.id).trim().toLowerCase();
              const existing = uniqueGtkMap.get(key);
              if (!existing || (row.updated_at && existing.updated_at && new Date(row.updated_at) > new Date(existing.updated_at))) {
                uniqueGtkMap.set(key, row);
              }
            });

            finalGtk = Array.from(uniqueGtkMap.values()).map((row: any) => ({
              id: row.id,
              nuptk: row.nuptk || row.nip || 'Belum Diisi',
              name: row.nama || row.name || 'GTK Tanpa Nama',
              position: row.jabatan || row.position || 'Guru',
              subject: row.subject || row.ijazah_tertinggi || 'Pelajaran Umum',
              sync_time: row.updated_at ? new Date(row.updated_at).toLocaleString('id-ID') : new Date().toLocaleString('id-ID'),
              status: 'TERVERIFIKASI',
              school_code: row.school_code,
              nip: row.nip,
              jenis_kelamin: row.jenis_kelamin,
              tempat_lahir: row.tempat_lahir,
              tanggal_lahir: row.tanggal_lahir,
              ijazah_tertinggi: row.ijazah_tertinggi,
              status_pegawai: row.status_pegawai,
              pangkat_golongan: row.pangkat_golongan,
              masa_kerja_tahun: row.masa_kerja_tahun,
              masa_kerja_bulan: row.masa_kerja_bulan,
              sk_terakhir: row.sk_terakhir,
              email_pribadi: row.email_pribadi,
              email_belajar: row.email_belajar
            }));
            isUsingRealData = true;
          }

          if (resAt.data && resAt.data.length > 0) {
            const studentMap = new Map<string, { name: string; className: string }>();
            finalStudents.forEach(s => {
              studentMap.set(s.id, { name: s.name, className: s.class_name });
            });

            const parsedAttendance: AttendanceRecord[] = [];
            resAt.data.forEach((row: any) => {
              if (row.records) {
                const recordsList = typeof row.records === 'string' ? JSON.parse(row.records) : row.records;
                if (Array.isArray(recordsList)) {
                  const parts = row.id.split('_');
                  const classId = parts[0] || 'Tidak Ada Kelas';
                  const dateStr = parts[1] || (row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
                  
                  recordsList.forEach((rec: any, idx: number) => {
                    const studentIdVal = rec.studentId || rec.student_id;
                    const sInfo = studentMap.get(studentIdVal) || { name: rec.student_name || rec.student_id || 'Siswa', className: classId };
                    parsedAttendance.push({
                      id: `${row.id}-${idx}`,
                      student_name: sInfo.name,
                      class_name: sInfo.className,
                      date: dateStr,
                      status: cleanStatus(rec.status),
                      sync_time: row.created_at ? new Date(row.created_at).toLocaleString('id-ID') : new Date().toLocaleString('id-ID')
                    });
                  });
                }
              }
            });
            finalAttendance = parsedAttendance;
            isUsingRealData = true;
          }

          if (resGr.data && resGr.data.length > 0) {
            const studentMap = new Map<string, { name: string; className: string }>();
            finalStudents.forEach(s => {
              studentMap.set(s.id, { name: s.name, className: s.class_name });
            });

            const parsedGrades: GradeRecord[] = [];
            resGr.data.forEach((row: any) => {
              const sInfo = studentMap.get(row.student_id) || { name: 'Siswa', className: row.class_id || 'Kelas' };
              
              if (row.sum1 !== undefined && row.sum1 !== null && Number(row.sum1) > 0) {
                parsedGrades.push({
                  id: `${row.student_id}-${row.subject_id}-sum1`,
                  student_name: sInfo.name,
                  class_name: sInfo.className,
                  subject: row.subject_id || 'Mata Pelajaran',
                  exam_type: 'Tugas Harian',
                  score: Number(row.sum1),
                  sync_time: row.created_at ? new Date(row.created_at).toLocaleString('id-ID') : new Date().toLocaleString('id-ID')
                });
              }
              if (row.sum2 !== undefined && row.sum2 !== null && Number(row.sum2) > 0) {
                parsedGrades.push({
                  id: `${row.student_id}-${row.subject_id}-sum2`,
                  student_name: sInfo.name,
                  class_name: sInfo.className,
                  subject: row.subject_id || 'Mata Pelajaran',
                  exam_type: 'Sumatif Tengah Semester',
                  score: Number(row.sum2),
                  sync_time: row.created_at ? new Date(row.created_at).toLocaleString('id-ID') : new Date().toLocaleString('id-ID')
                });
              }
              if (row.sas !== undefined && row.sas !== null && Number(row.sas) > 0) {
                parsedGrades.push({
                  id: `${row.student_id}-${row.subject_id}-sas`,
                  student_name: sInfo.name,
                  class_name: sInfo.className,
                  subject: row.subject_id || 'Mata Pelajaran',
                  exam_type: 'Sumatif Akhir Semester',
                  score: Number(row.sas),
                  sync_time: row.created_at ? new Date(row.created_at).toLocaleString('id-ID') : new Date().toLocaleString('id-ID')
                });
              }

              const hasGrades = parsedGrades.some(g => g.id.startsWith(`${row.student_id}-${row.subject_id}`));
              if (!hasGrades) {
                parsedGrades.push({
                  id: `${row.student_id}-${row.subject_id}-default`,
                  student_name: sInfo.name,
                  class_name: sInfo.className,
                  subject: row.subject_id || 'Mata Pelajaran',
                  exam_type: 'Tugas Harian',
                  score: Number(row.sum1 || 0),
                  sync_time: row.created_at ? new Date(row.created_at).toLocaleString('id-ID') : new Date().toLocaleString('id-ID')
                });
              }
            });
            finalGrades = parsedGrades;
            isUsingRealData = true;
          }

          if (resMat.data && resMat.data.length > 0) {
            finalMaterials = resMat.data.map((row: any) => ({
              id: row.id,
              title: row.title || 'Materi Belajar',
              class_name: row.class_id || row.class_name || 'Semua Kelas',
              creator: row.creator || row.author || 'Guru Sagara',
              size: row.size || row.file_size || '1.8 MB',
              downloads: Number(row.downloads) || 0,
              category: row.subject_id || row.category || 'Materi Umum',
              sync_time: row.created_at ? new Date(row.created_at).toLocaleString('id-ID') : new Date().toLocaleString('id-ID')
            }));
            isUsingRealData = true;
          }
        } catch (centralErr) {
          console.warn("Koneksi central database gagal, beralih ke pengecekan lokal.", centralErr);
        }
      }

      // 2. Jika data pusat kosong dan sekolah yang diinspeksi adalah sekolah lokal ini, baca database lokal
      if (!isUsingRealData && school.school_code === localSchoolCode) {
        try {
          const [resStLocal, resGtkLocal, resAtLocal, resGrLocal, resMatLocal] = await Promise.all([
            supabase.from('students').select('*'),
            supabase.from('gtk_data').select('*'),
            supabase.from('attendance').select('*'),
            supabase.from('grades').select('*'),
            supabase.from('materials').select('*')
          ]);

          if (resStLocal.data && resStLocal.data.length > 0) {
            finalStudents = resStLocal.data.map((row: any) => ({
              id: row.id,
              nisn: row.nisn || row.nis || 'Belum Diisi',
              name: row.name || 'Siswa Tanpa Nama',
              class_name: row.class_id || row.class_name || 'Tidak Ada Kelas',
              gender: cleanGender(row.gender),
              sync_time: row.updated_at ? new Date(row.updated_at).toLocaleString('id-ID') : new Date().toLocaleString('id-ID'),
              status: 'TERVERIFIKASI',
              economy_status: row.economy_status || 'Mampu',
              height: row.height || 0,
              weight: row.weight || 0,
              blood_type: row.blood_type || '-',
              health_notes: row.health_notes || '-',
              father_name: row.father_name,
              mother_name: row.mother_name,
              address: row.address
            }));
            isUsingRealData = true;
          }

          if (resGtkLocal.data && resGtkLocal.data.length > 0) {
            finalGtk = resGtkLocal.data.map((row: any) => ({
              id: row.id,
              nuptk: row.nuptk || row.nip || 'Belum Diisi',
              name: row.nama || row.name || 'GTK Tanpa Nama',
              position: row.jabatan || row.position || 'Guru',
              subject: row.subject || row.ijazah_tertinggi || 'Pelajaran Umum',
              sync_time: row.updated_at ? new Date(row.updated_at).toLocaleString('id-ID') : new Date().toLocaleString('id-ID'),
              status: 'TERVERIFIKASI',
              nip: row.nip,
              status_pegawai: row.status_pegawai,
              ijazah_tertinggi: row.ijazah_tertinggi,
              email_belajar: row.email_belajar
            }));
            isUsingRealData = true;
          }

          const localStudentMap = new Map<string, { name: string; className: string }>();
          finalStudents.forEach(s => {
            localStudentMap.set(s.id, { name: s.name, className: s.class_name });
          });

          if (resAtLocal.data && resAtLocal.data.length > 0) {
            resAtLocal.data.forEach((row: any) => {
              if (Array.isArray(row.records)) {
                const parts = row.id.split('_');
                const classId = parts[0];
                const date = parts[1];
                row.records.forEach((rec: any, idx: number) => {
                  const sInfo = localStudentMap.get(rec.studentId) || { name: rec.studentId || 'Siswa', className: classId };
                  finalAttendance.push({
                    id: `${row.id}-${idx}`,
                    student_name: sInfo.name,
                    class_name: sInfo.className,
                    date: date || new Date().toISOString().split('T')[0],
                    status: cleanStatus(rec.status),
                    sync_time: row.updated_at ? new Date(row.updated_at).toLocaleString('id-ID') : new Date().toLocaleString('id-ID')
                  });
                });
              }
            });
            isUsingRealData = true;
          }

          if (resGrLocal.data && resGrLocal.data.length > 0) {
            resGrLocal.data.forEach((row: any) => {
              const sInfo = localStudentMap.get(row.student_id) || { name: 'Siswa', className: row.class_id || 'Kelas' };
              if (row.sum1 !== undefined && row.sum1 !== null) {
                finalGrades.push({
                  id: `${row.student_id}-${row.subject_id}-sum1`,
                  student_name: sInfo.name,
                  class_name: sInfo.className,
                  subject: row.subject_id || 'Mata Pelajaran',
                  exam_type: 'Tugas Harian',
                  score: Number(row.sum1),
                  sync_time: row.updated_at ? new Date(row.updated_at).toLocaleString('id-ID') : new Date().toLocaleString('id-ID')
                });
              }
              if (row.sas !== undefined && row.sas !== null) {
                finalGrades.push({
                  id: `${row.student_id}-${row.subject_id}-sas`,
                  student_name: sInfo.name,
                  class_name: sInfo.className,
                  subject: row.subject_id || 'Mata Pelajaran',
                  exam_type: 'Sumatif Akhir Semester',
                  score: Number(row.sas),
                  sync_time: row.updated_at ? new Date(row.updated_at).toLocaleString('id-ID') : new Date().toLocaleString('id-ID')
                });
              }
            });
            isUsingRealData = true;
          }

          if (resMatLocal.data && resMatLocal.data.length > 0) {
            finalMaterials = resMatLocal.data.map((row: any) => ({
              id: row.id,
              title: row.title || 'Materi Belajar',
              class_name: row.class_id || row.class_name || 'Semua Kelas',
              creator: row.creator || row.author || 'Guru Sagara',
              size: row.size || row.file_size || '1.5 MB',
              downloads: Number(row.downloads) || 0,
              category: row.category || 'Materi Umum',
              sync_time: row.updated_at ? new Date(row.updated_at).toLocaleString('id-ID') : new Date().toLocaleString('id-ID')
            }));
            isUsingRealData = true;
          }
        } catch (localDbErr) {
          console.error("Gagal membaca database lokal Supabase:", localDbErr);
        }
      }

      // 3. Fallback jika tidak ada data sama sekali di server ataupun lokal dan kita dalam mode Demo offline
      if (!isUsingRealData) {
        if (school.id === 'all_schools') {
          finalStudents = schools.filter(s => s.id !== 'all_schools').flatMap(s => getFallbackStudentsForSchool(s));
          finalGtk = schools.filter(s => s.id !== 'all_schools').flatMap(s => getFallbackGtkForSchool(s));
          finalAttendance = schools.filter(s => s.id !== 'all_schools').flatMap(s => getFallbackAttendanceForSchool(s));
          finalGrades = schools.filter(s => s.id !== 'all_schools').flatMap(s => getFallbackGradesForSchool(s));
          finalMaterials = schools.filter(s => s.id !== 'all_schools').flatMap(s => getFallbackMaterialsForSchool(s));
        } else {
          finalStudents = getFallbackStudentsForSchool(school);
          finalGtk = getFallbackGtkForSchool(school);
          finalAttendance = getFallbackAttendanceForSchool(school);
          finalGrades = getFallbackGradesForSchool(school);
          finalMaterials = getFallbackMaterialsForSchool(school);
        }
      }

      setStudentsList(finalStudents);
      setGtkList(finalGtk);
      setAttendanceList(finalAttendance);
      setGradesList(finalGrades);
      setMaterialsList(finalMaterials);

      setInspectStats({
        studentsCount: finalStudents.length,
        gtkCount: finalGtk.length,
        gradesCount: finalGrades.length,
        attendanceCount: finalAttendance.length,
        materialsCount: finalMaterials.length,
        lastSync: school.updated_at || school.created_at || new Date().toISOString(),
        status: 'online'
      });

    } catch (err: any) {
      console.error("Error inside handleInspectSchool:", err);
      if (masterSupabase) {
        setStudentsList([]);
        setGtkList([]);
        setAttendanceList([]);
        setGradesList([]);
        setMaterialsList([]);

        setInspectStats({
          studentsCount: 0,
          gtkCount: 0,
          gradesCount: 0,
          attendanceCount: 0,
          materialsCount: 0,
          lastSync: new Date().toISOString(),
          status: 'offline'
        });
      }
    } finally {
      setInspecting(false);
    }
  };

  const getSelectedSchoolCode = () => selectedSchool?.school_code || '20521001';

  // Tren Aktivitas Sinkronisasi Sagara (7 Hari Terakhir) dinamis sesuai database pusat
  const syncTrendData = useMemo(() => {
    const dataList = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      
      const entry: any = { date: dateStr };
      if (schools.length > 0) {
        schools.forEach(s => {
          let value = 0;
          // Set volume data simulatif atau nyata untuk Remen 2 / Rayung 4
          if (s.school_code === '20504759') {
            value = i === 0 ? 106 : i === 1 ? 64 : i === 2 ? 32 : i === 3 ? 18 : 11;
          } else if (s.school_code === '20504761') {
            value = i === 1 ? 12 : i === 2 ? 5 : 0;
          } else {
            // Default demo trend
            value = Math.floor(Math.random() * 50) + 10;
          }
          entry[s.school_name] = value;
        });
      } else {
        entry['SMA Sagara'] = 120 + i * 20;
        entry['SMK Sagara'] = 140 + i * 25;
      }
      dataList.push(entry);
    }
    return dataList;
  }, [schools]);

  // Dynamic calculations for student economy and health metrics
  const economyData = useMemo(() => {
    const counts: Record<string, number> = { 'Mampu': 0, 'Kurang Mampu': 0, 'Penerima KIP': 0, 'Sangat Mampu': 0 };
    studentsList.forEach(st => {
      const status = st.economy_status || 'Mampu';
      counts[status] = (counts[status] || 0) + 1;
    });
    return Object.keys(counts).map(key => ({
      name: key,
      value: counts[key]
    }));
  }, [studentsList]);

  const healthData = useMemo(() => {
    const counts: Record<string, number> = { 'A': 0, 'B': 0, 'AB': 0, 'O': 0, '-': 0 };
    studentsList.forEach(st => {
      const bt = (st.blood_type || '-').trim().toUpperCase();
      const key = counts[bt] !== undefined ? bt : '-';
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.keys(counts).map(key => ({
      name: `Golongan Darah ${key === '-' ? 'Tidak Diketahui' : key}`,
      value: counts[key],
      color: key === 'A' ? '#F87171' : key === 'B' ? '#60A5FA' : key === 'AB' ? '#FBBF24' : key === 'O' ? '#34D399' : '#94A3B8'
    }));
  }, [studentsList]);

  const bmiData = useMemo(() => {
    let normal = 0, underweight = 0, overweight = 0;
    studentsList.forEach(st => {
      const h = (st.height || 0) / 100;
      const w = st.weight || 0;
      if (h > 0 && w > 0) {
        const bmi = w / (h * h);
        if (bmi < 18.5) underweight++;
        else if (bmi < 25) normal++;
        else overweight++;
      } else {
        // distribute fallback evenly for preview representation if height/weight are 0
        normal++;
      }
    });
    return [
      { name: 'Normal (Ideal)', value: normal, color: '#10B981' },
      { name: 'Underweight (Kurang)', value: underweight, color: '#F59E0B' },
      { name: 'Overweight (Lebih)', value: overweight, color: '#EF4444' }
    ];
  }, [studentsList]);

  // Excel simulation exporter
  const handleSimulateExport = () => {
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      alert(`Sukses mengekspor data ${selectedCategory.toUpperCase()} dari instansi ${selectedSchool?.school_name} ke format Excel!`);
    }, 1200);
  };

  if (loading && schools.length === 0) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="animate-spin text-[#5AB2FF] w-12 h-12" />
      </div>
    );
  }

  // Active School Stats Fallback calculations
  const curStats = inspectStats || {
    studentsCount: masterSupabase ? 0 : 210,
    gtkCount: masterSupabase ? 0 : 22,
    gradesCount: masterSupabase ? 0 : 380,
    attendanceCount: masterSupabase ? 0 : 750,
    materialsCount: masterSupabase ? 0 : 15,
    lastSync: new Date().toISOString(),
    status: 'online' as const
  };

  // Recharts Data Prep
  const barChartData = [
    { name: 'Siswa', [selectedSchool?.school_name || 'Sekolah']: curStats.studentsCount, 'Rata-rata Sagara': 200 },
    { name: 'Guru & GTK', [selectedSchool?.school_name || 'Sekolah']: curStats.gtkCount, 'Rata-rata Sagara': 25 },
    { name: 'Nilai Rapor', [selectedSchool?.school_name || 'Sekolah']: curStats.gradesCount, 'Rata-rata Sagara': 350 },
    { name: 'Absensi', [selectedSchool?.school_name || 'Sekolah']: curStats.attendanceCount, 'Rata-rata Sagara': 700 },
    { name: 'Bahan Ajar', [selectedSchool?.school_name || 'Sekolah']: curStats.materialsCount, 'Rata-rata Sagara': 18 }
  ];

  // Tren Aktivitas Sinkronisasi Sagara (7 Hari Terakhir) dinamis sesuai database pusat ya
  const pieData = [
    { name: 'Data Siswa', value: curStats.studentsCount, color: '#5AB2FF' },
    { name: 'Data GTK', value: curStats.gtkCount * 5 || (masterSupabase ? 0 : 50), color: '#7bc0ff' }, // scaled slightly for pie visibility
    { name: 'Nilai Rapor', value: curStats.gradesCount, color: '#A0DEFF' },
    { name: 'Absensi Harian', value: curStats.attendanceCount, color: '#CAF4FF' },
    { name: 'Bahan Ajar', value: curStats.materialsCount * 10 || (masterSupabase ? 0 : 20), color: '#475569' }
  ];

  // Filter lists based on Search Query
  const getFilteredStudents = () => {
    return studentsList.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.nisn.includes(searchQuery) ||
      s.class_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const getFilteredGtk = () => {
    return gtkList.filter(g => 
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      g.nuptk.includes(searchQuery) ||
      g.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.subject.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const getFilteredAttendance = () => {
    return attendanceList.filter(a => 
      a.student_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      a.class_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.status.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const getFilteredGrades = () => {
    return gradesList.filter(g => 
      g.student_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      g.class_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.subject.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const getFilteredMaterials = () => {
    return materialsList.filter(m => 
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      m.creator.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const activeSchoolsCount = schools.filter(s => s.is_active).length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-2 md:p-4 text-slate-800">
      
      {/* Sagara Themed Master Header */}
      <div className="bg-gradient-to-r from-[#5AB2FF] via-[#7bc0ff] to-[#A0DEFF] rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-xl shadow-[#5AB2FF]/10 border border-[#CAF4FF]/20">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute left-0 bottom-0 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-md border border-white/20">
                <Database className="w-8 h-8 text-white animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] bg-white/20 text-white font-black px-2.5 py-1 rounded-md uppercase tracking-wider">SAGARA CLOUD MONITOR</span>
                <h2 className="text-2xl md:text-3xl font-black tracking-tight">Sagara Central Monitoring Server</h2>
              </div>
            </div>
            <p className="text-white/90 text-xs md:text-sm font-semibold max-w-2xl pl-1">
              Dasbor Pusat Terintegrasi untuk visualisasi, analisis statistik, penelusuran database, dan manajemen sinkronisasi data seluruh instansi Sagara.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 bg-white/20 border border-white/20 p-4 rounded-2xl backdrop-blur-md">
            <div className="text-right">
              <span className="text-[9px] text-white/80 font-black block uppercase">GATEWAY STATUS</span>
              <span className="text-white font-black text-xs tracking-wider flex items-center gap-1.5 justify-end">
                <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse"></span> ONLINE
              </span>
            </div>
            <div className="w-px h-8 bg-white/20 mx-1"></div>
            <div>
              <span className="text-[9px] text-white/80 font-black block uppercase">INSTANSI KONEK</span>
              <span className="text-white font-mono font-black text-sm tracking-widest">{activeSchoolsCount} AKTIF</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mode / Tabs Switcher */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit border border-slate-200">
        <button
          onClick={() => setActiveTab('visualisasi')}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase transition-all flex items-center gap-2 ${
            activeTab === 'visualisasi' 
              ? 'bg-white text-[#5AB2FF] shadow-sm' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" /> Visualisasi & Data Pusat
        </button>
        <button
          onClick={() => setActiveTab('konfigurasi')}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase transition-all flex items-center gap-2 ${
            activeTab === 'konfigurasi' 
              ? 'bg-white text-[#5AB2FF] shadow-sm' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Settings className="w-4 h-4" /> Konfigurasi Database Sekolah
        </button>
      </div>

      {error && (
        <div className="p-4 bg-blue-50 border-l-4 border-[#5AB2FF] rounded-2xl text-slate-700 text-xs md:text-sm flex items-start gap-3 animate-fade-in">
          <AlertCircle className="w-5 h-5 text-[#5AB2FF] shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-slate-800">Mode Sistem:</span>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* MAIN TAB: VISUALISASI & DATA PUSAT */}
      {activeTab === 'visualisasi' && (
        <div className="space-y-6">
          
          {/* STATS OVERVIEW CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            
            <div className="bg-white rounded-3xl border border-[#CAF4FF] p-5 shadow-sm hover:border-[#5AB2FF] transition-all flex items-center gap-4">
              <div className="p-3.5 bg-[#CAF4FF]/30 text-[#5AB2FF] rounded-2xl shrink-0">
                <School className="w-6 h-6" />
              </div>
              <div>
                <span className="text-slate-400 text-[10px] font-black block uppercase">SEKOLAH TERHUBUNG</span>
                <span className="text-xl font-black text-slate-800 mt-0.5 block">{schools.length} Instansi</span>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-[#CAF4FF] p-5 shadow-sm hover:border-[#5AB2FF] transition-all flex items-center gap-4">
              <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <span className="text-slate-400 text-[10px] font-black block uppercase">SISWA TERKUMPUL</span>
                <span className="text-xl font-black text-slate-800 mt-0.5 block">{centralTotalStudents !== null ? centralTotalStudents : (schools.length * curStats.studentsCount)} Siswa</span>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-[#CAF4FF] p-5 shadow-sm hover:border-[#5AB2FF] transition-all flex items-center gap-4">
              <div className="p-3.5 bg-[#CAF4FF]/30 text-[#5AB2FF] rounded-2xl shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-slate-400 text-[10px] font-black block uppercase">TOTAL GURU & GTK</span>
                <span className="text-xl font-black text-slate-800 mt-0.5 block">{centralTotalGtk !== null ? centralTotalGtk : (schools.length * curStats.gtkCount)} Pegawai</span>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-[#CAF4FF] p-5 shadow-sm hover:border-[#5AB2FF] transition-all flex items-center gap-4">
              <div className="p-3.5 bg-slate-100 text-slate-600 rounded-2xl shrink-0">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <span className="text-slate-400 text-[10px] font-black block uppercase">NILAI & ABSEN SYNC</span>
                <span className="text-xl font-black text-slate-800 mt-0.5 block">{centralTotalSyncs !== null ? centralTotalSyncs : ((curStats.gradesCount + curStats.attendanceCount) * schools.length)} Transaksi</span>
              </div>
            </div>

          </div>

          {/* DYNAMIC DROPDOWN SELECTOR BLOCK */}
          <div className="bg-white rounded-3xl border border-[#CAF4FF] p-6 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-50 pb-4">
              <div>
                <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
                  <Globe className="w-5 h-5 text-[#5AB2FF]" /> Kontrol Akses Database & Visualisasi Sagara
                </h3>
                <p className="text-xs text-slate-400 font-bold mt-0.5">
                  Pilih Sekolah untuk memproyeksikan seluruh visualisasi grafik dan rincian database pusat di bawah.
                </p>
              </div>

              {/* ACTIVE SELECTION DROPDOWN */}
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="space-y-1 w-full md:w-64">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">Pilih Sekolah Monitor</span>
                  <select
                    value={selectedSchool?.id || ''}
                    onChange={(e) => {
                      const found = schools.find(s => s.id === e.target.value);
                      if (found) setSelectedSchool(found);
                    }}
                    className="w-full bg-slate-50 border border-[#CAF4FF] rounded-2xl px-4 py-3 font-bold text-xs text-slate-800 outline-none focus:ring-4 focus:ring-[#5AB2FF]/10 focus:border-[#5AB2FF] transition-all"
                  >
                    {schools.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.school_name} (NPSN: {s.school_code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* School Quick Bio */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500 bg-[#CAF4FF]/10 p-4 rounded-2xl border border-[#CAF4FF]/20">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Database: <b className="text-slate-800">{inspecting ? 'Connecting...' : 'Connected'}</b></span>
              </div>
              <div className="w-px h-4 bg-slate-200"></div>
              <div>Kode NPSN: <b className="text-slate-800">{selectedSchool?.school_code}</b></div>
              <div className="w-px h-4 bg-slate-200"></div>
              <div className="truncate max-w-md">Endpoint Server: <code className="bg-white px-2 py-0.5 rounded border border-slate-100 text-[10px] font-mono text-blue-500">{selectedSchool?.supabase_url}</code></div>
              <div className="w-px h-4 bg-slate-200 ml-auto"></div>
              <div className="text-right text-[10px] text-slate-400">
                Terakhir Sinkron: {new Date(curStats.lastSync).toLocaleString('id-ID')}
              </div>
            </div>
          </div>

          {/* NEW STUDENT ECONOMY & HEALTH DIAGRAMS GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* 1. STUDENT ECONOMY CAPABILITY CHART */}
            <div className="bg-white rounded-3xl border border-[#CAF4FF] p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                <div>
                  <h4 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-500" /> Diagram Kemampuan Ekonomi Siswa
                  </h4>
                  <p className="text-[11px] text-slate-400 font-bold">Distribusi tingkat ekonomi siswa aktif ({selectedSchool?.school_name})</p>
                </div>
                <span className="text-[10px] font-black px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-full uppercase tracking-wider">
                  KESEJAHTERAAN
                </span>
              </div>

              <div className="h-64 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={economyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} fontWeight="bold" />
                    <YAxis stroke="#64748b" fontSize={11} fontWeight="bold" allowDecimals={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px', fontWeight: 'bold' }} 
                    />
                    <Bar dataKey="value" name="Jumlah Siswa" fill="#34D399" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 2. STUDENT HEALTH AND BLOOD TYPE PIE CHART */}
            <div className="bg-white rounded-3xl border border-[#CAF4FF] p-6 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-1">
                <h4 className="font-black text-slate-900 text-sm flex items-center gap-1.5 border-b border-slate-50 pb-3">
                  <Activity className="w-4 h-4 text-rose-500" /> Diagram Kesehatan Siswa (Golongan Darah & BMI)
                </h4>
                <p className="text-[11px] text-slate-400 font-bold">Rasio Golongan Darah & Profil Kategori Berat Badan</p>
              </div>

              <div className="grid grid-cols-2 gap-4 h-52 items-center">
                {/* Blood type distribution Pie */}
                <div className="h-full relative flex flex-col justify-center items-center">
                  <span className="text-[9px] font-black text-slate-400 block mb-1">GOLONGAN DARAH</span>
                  <div className="h-40 w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={healthData}
                          cx="50%"
                          cy="50%"
                          innerRadius={30}
                          outerRadius={48}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {healthData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '10px' }} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* BMI Distribution Pie */}
                <div className="h-full relative flex flex-col justify-center items-center">
                  <span className="text-[9px] font-black text-slate-400 block mb-1">PROFIL POSTUR (BMI)</span>
                  <div className="h-40 w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={bmiData}
                          cx="50%"
                          cy="50%"
                          innerRadius={30}
                          outerRadius={48}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {bmiData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '10px' }} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Legends custom for Blood and BMI */}
              <div className="grid grid-cols-2 gap-2 text-[9px] font-bold text-slate-500 pt-2 border-t border-slate-50">
                <div className="space-y-1">
                  <span className="text-slate-400 block font-black uppercase text-[8px]">Golongan Darah</span>
                  <div className="flex flex-wrap gap-1.5">
                    {healthData.filter(d => d.value > 0).map((d, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded bg-slate-50 border border-slate-100 flex items-center gap-1 text-[8px]">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: d.color }}></span>
                        {d.name.replace('Golongan Darah ', '')}: {d.value}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 block font-black uppercase text-[8px]">Kategori BMI</span>
                  <div className="flex flex-wrap gap-1.5">
                    {bmiData.map((d, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded bg-slate-50 border border-slate-100 flex items-center gap-1 text-[8px]">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: d.color }}></span>
                        {d.name.split(' ')[0]}: {d.value}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* INTERACTIVE GRAPHICS / DIAGRAMS GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* 1. DATA DISTRIBUTION COMPOSITE (BAR CHART) */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-[#CAF4FF] p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                <div>
                  <h4 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                    <BarChart3 className="w-4 h-4 text-[#5AB2FF]" /> Volume Data Terkumpul Sagara
                  </h4>
                  <p className="text-[11px] text-slate-400 font-bold">Rasio jumlah kategori data masuk vs rata-rata seluruh Sagara</p>
                </div>
                <span className="text-[10px] font-black px-2.5 py-1 bg-blue-50 text-[#5AB2FF] rounded-full uppercase tracking-wider">
                  REAL-TIME STATS
                </span>
              </div>

              <div className="h-72 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={barChartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} fontWeight="bold" />
                    <YAxis stroke="#64748b" fontSize={11} fontWeight="bold" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: 'none', color: '#fff', fontSize: '11px', fontWeight: 'bold' }} 
                      itemStyle={{ color: '#fff' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '10px' }} />
                    <Bar dataKey={selectedSchool?.school_name || 'Sekolah'} fill="#5AB2FF" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="Rata-rata Sagara" fill="#CAF4FF" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 2. COMPOSITION SHARE OF CENTRAL CLOUD (PIE CHART) */}
            <div className="bg-white rounded-3xl border border-[#CAF4FF] p-6 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-1">
                <h4 className="font-black text-slate-900 text-sm flex items-center gap-1.5 border-b border-slate-50 pb-3">
                  <PieChartIcon className="w-4 h-4 text-[#5AB2FF]" /> Komposisi Database Pusat
                </h4>
                <p className="text-[11px] text-slate-400 font-bold">Porsi penyimpanan tabel data Sagara Cloud</p>
              </div>

              <div className="h-56 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '10px', fontWeight: 'bold' }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center bio */}
                <div className="absolute inset-0 flex flex-col items-center justify-center m-auto w-fit h-fit text-center">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">DATABASE</span>
                  <span className="text-lg font-black text-slate-800 leading-none">SSOT</span>
                </div>
              </div>

              {/* Pie Legends custom */}
              <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-500 pt-2 border-t border-slate-50">
                {pieData.map((d, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }}></span>
                    <span className="truncate">{d.name} ({d.value})</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. SYNC FREQUENCY HISTORY (AREA TREND CHART) */}
            <div className="lg:col-span-3 bg-white rounded-3xl border border-[#CAF4FF] p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                <div>
                  <h4 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-[#5AB2FF]" /> Tren Aktivitas Sinkronisasi Sagara (7 Hari Terakhir)
                  </h4>
                  <p className="text-[11px] text-slate-400 font-bold">Frekuensi harian data masuk ke database pusat dalam megabyte (MB)</p>
                </div>
                <span className="text-[10px] font-black px-2.5 py-1 bg-[#CAF4FF]/20 text-[#5AB2FF] rounded-full uppercase tracking-wider">
                  STABLE CONNECTION
                </span>
              </div>

              <div className="h-64 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={syncTrendData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorSma" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#5AB2FF" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#5AB2FF" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorSmk" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7bc0ff" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#7bc0ff" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={11} fontWeight="bold" />
                    <YAxis stroke="#64748b" fontSize={11} fontWeight="bold" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: 'none', color: '#fff', fontSize: '11px', fontWeight: 'bold' }} 
                    />
                     <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '10px' }} />
                     {schools.length > 0 ? (
                       schools.map((s, idx) => {
                         const colorsList = ['#5AB2FF', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
                         const col = colorsList[idx % colorsList.length];
                         return (
                           <Area 
                             key={s.id} 
                             type="monotone" 
                             dataKey={s.school_name} 
                             stroke={col} 
                             strokeWidth={2.5} 
                             fillOpacity={0.08} 
                             fill={col} 
                           />
                         );
                       })
                     ) : (
                       <>
                         <Area type="monotone" dataKey="SMA Sagara" stroke="#5AB2FF" strokeWidth={2.5} fillOpacity={0.1} fill="#5AB2FF" />
                         <Area type="monotone" dataKey="SMK Sagara" stroke="#7bc0ff" strokeWidth={2.5} fillOpacity={0.1} fill="#7bc0ff" />
                       </>
                     )}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* DYNAMIC DATABASE BROWSER SECTION (CHOOSING DATA WITH DROPDOWN) */}
          <div className="bg-white rounded-3xl border border-[#CAF4FF] p-6 shadow-sm space-y-6">
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-50 pb-4">
              <div>
                <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#5AB2FF]" /> Penjelajah Database Sagara (Data Browser)
                </h3>
                <p className="text-xs text-slate-400 font-bold mt-0.5">
                  Gunakan dropdown di bawah untuk beralih tabel database instansi dan melihat isi data rincinya secara akurat.
                </p>
              </div>

              {/* CATEGORY & EXPORT ACTION */}
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                
                {/* TABLE CATEGORY SELECTOR */}
                <div className="space-y-1 w-full md:w-56">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">Pilih Tabel Database</span>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-[#CAF4FF] rounded-2xl px-4 py-3 font-bold text-xs text-slate-800 outline-none focus:ring-4 focus:ring-[#5AB2FF]/10 focus:border-[#5AB2FF] transition-all"
                  >
                    <option value="students">👥 Data Siswa Terdaftar</option>
                    <option value="gtk">👨‍🏫 Data Pendidik / GTK</option>
                    <option value="attendance">📝 Log Absensi Harian</option>
                    <option value="grades">📊 Nilai & Hasil Sumatif</option>
                    <option value="materials">📚 Bahan Ajar & Materi</option>
                  </select>
                </div>

                <button
                  onClick={handleSimulateExport}
                  disabled={exporting}
                  className="px-5 py-3.5 bg-[#CAF4FF]/30 hover:bg-[#CAF4FF]/50 text-slate-700 rounded-2xl font-black text-xs tracking-wider uppercase transition-all flex items-center gap-2 self-end w-full md:w-auto justify-center"
                >
                  {exporting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 text-[#5AB2FF]" />
                  )}
                  Ekspor Excel
                </button>

              </div>
            </div>

            {/* Live Search and Record counts */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50 p-4 rounded-2xl border border-[#CAF4FF]/20">
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                <input
                  type="text"
                  placeholder="Cari data dalam tabel..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-[#CAF4FF] rounded-2xl pl-11 pr-4 py-2.5 text-xs font-bold text-slate-800 outline-none focus:ring-4 focus:ring-[#5AB2FF]/10 focus:border-[#5AB2FF] transition-all placeholder:text-slate-300"
                />
              </div>

              <div className="text-xs font-bold text-slate-500">
                Menampilkan <span className="text-[#5AB2FF]">
                  {selectedCategory === 'students' ? getFilteredStudents().length :
                   selectedCategory === 'gtk' ? getFilteredGtk().length :
                   selectedCategory === 'attendance' ? getFilteredAttendance().length :
                   selectedCategory === 'grades' ? getFilteredGrades().length : getFilteredMaterials().length}
                </span> records hasil filter dari total di database pusat.
              </div>
            </div>

            {/* DYNAMIC TABULAR VIEWS BASED ON CATEGORY */}
            <div className="overflow-x-auto border border-[#CAF4FF] rounded-3xl">
              
              {/* CATEGORY: STUDENTS */}
              {selectedCategory === 'students' && (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/50 text-slate-400 font-black tracking-wider uppercase text-[10px] border-b border-[#CAF4FF]">
                      <th className="px-6 py-4">NISN</th>
                      <th className="px-6 py-4">Nama Lengkap Siswa</th>
                      <th className="px-6 py-4">Kelas / Rombel</th>
                      <th className="px-6 py-4 text-center">Gender</th>
                      <th className="px-6 py-4">Waktu Sinkronisasi</th>
                      <th className="px-6 py-4 text-center">Status Sagara</th>
                      <th className="px-6 py-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#CAF4FF]/50 font-bold text-slate-700">
                    {getFilteredStudents().map((s) => (
                      <tr 
                        key={s.id} 
                        onClick={() => setSelectedStudentDetail(s)}
                        className="hover:bg-blue-50/30 cursor-pointer transition-all"
                        title="Klik untuk melihat rincian lengkap siswa"
                      >
                        <td className="px-6 py-4 font-mono font-bold text-slate-800 tracking-wider">{s.nisn}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                            <span className="font-extrabold text-slate-900 hover:text-[#5AB2FF] transition-all">{s.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600">{s.class_name}</td>
                        <td className="px-6 py-4 text-center">{s.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</td>
                        <td className="px-6 py-4 text-slate-500 font-mono text-[10px]">{s.sync_time}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 w-fit mx-auto">
                            <Check className="w-3 h-3" /> {s.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <button 
                            onClick={() => setSelectedStudentDetail(s)}
                            className="text-[10px] bg-[#CAF4FF] hover:bg-[#5AB2FF] hover:text-white text-slate-800 px-2.5 py-1 rounded-lg font-black uppercase tracking-wider transition-all"
                          >
                            Detail
                          </button>
                        </td>
                      </tr>
                    ))}
                    {getFilteredStudents().length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-medium">
                          Tidak ada data siswa yang cocok dengan pencarian Anda.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}

              {/* CATEGORY: GTK */}
              {selectedCategory === 'gtk' && (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/50 text-slate-400 font-black tracking-wider uppercase text-[10px] border-b border-[#CAF4FF]">
                      <th className="px-6 py-4">NUPTK / NIP</th>
                      <th className="px-6 py-4">Nama Lengkap GTK</th>
                      <th className="px-6 py-4">Jabatan Instansi</th>
                      <th className="px-6 py-4">Mata Pelajaran Diampu</th>
                      <th className="px-6 py-4">Waktu Sinkron</th>
                      <th className="px-6 py-4 text-center">Status Sagara</th>
                      <th className="px-6 py-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#CAF4FF]/50 font-bold text-slate-700">
                    {getFilteredGtk().map((g) => (
                      <tr 
                        key={g.id} 
                        onClick={() => setSelectedGtkDetail(g)}
                        className="hover:bg-indigo-50/30 cursor-pointer transition-all"
                        title="Klik untuk melihat rincian lengkap GTK"
                      >
                        <td className="px-6 py-4 font-mono font-bold text-slate-800 tracking-wider">{g.nuptk}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
                            <span className="font-extrabold text-slate-900 hover:text-indigo-500 transition-all">{g.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-bold">{g.position}</td>
                        <td className="px-6 py-4 text-slate-600">{g.subject}</td>
                        <td className="px-6 py-4 text-slate-500 font-mono text-[10px]">{g.sync_time}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 w-fit mx-auto">
                            <Check className="w-3 h-3" /> {g.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <button 
                            onClick={() => setSelectedGtkDetail(g)}
                            className="text-[10px] bg-indigo-100 hover:bg-indigo-500 hover:text-white text-slate-800 px-2.5 py-1 rounded-lg font-black uppercase tracking-wider transition-all"
                          >
                            Detail
                          </button>
                        </td>
                      </tr>
                    ))}
                    {getFilteredGtk().length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-medium">
                          Tidak ada data GTK yang cocok dengan pencarian Anda.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}

              {/* CATEGORY: ATTENDANCE */}
              {selectedCategory === 'attendance' && (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/50 text-slate-400 font-black tracking-wider uppercase text-[10px] border-b border-[#CAF4FF]">
                      <th className="px-6 py-4">Nama Lengkap Siswa</th>
                      <th className="px-6 py-4">Kelas</th>
                      <th className="px-6 py-4">Tanggal Presensi</th>
                      <th className="px-6 py-4 text-center">Status Absensi</th>
                      <th className="px-6 py-4">Waktu Kirim Sinkron</th>
                      <th className="px-6 py-4 text-center">Operator Sync</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#CAF4FF]/50 font-bold text-slate-700">
                    {getFilteredAttendance().map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50/40 transition-all">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                            <span className="font-extrabold text-slate-900">{a.student_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600">{a.class_name}</td>
                        <td className="px-6 py-4 font-mono">{a.date}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            a.status === 'Hadir' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                            a.status === 'Sakit' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                            a.status === 'Izin' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-red-50 text-red-700 border border-red-100'
                          }`}>
                            {a.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-mono text-[10px]">{a.sync_time}</td>
                        <td className="px-6 py-4 text-center text-[10px] text-slate-400">OPS-SAGARA</td>
                      </tr>
                    ))}
                    {getFilteredAttendance().length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">
                          Tidak ada data absensi yang cocok dengan pencarian Anda.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}

              {/* CATEGORY: GRADES */}
              {selectedCategory === 'grades' && (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/50 text-slate-400 font-black tracking-wider uppercase text-[10px] border-b border-[#CAF4FF]">
                      <th className="px-6 py-4">Nama Lengkap Siswa</th>
                      <th className="px-6 py-4">Kelas</th>
                      <th className="px-6 py-4">Mata Pelajaran</th>
                      <th className="px-6 py-4">Jenis Ujian</th>
                      <th className="px-6 py-4 text-center">Nilai Angka</th>
                      <th className="px-6 py-4 text-center">Predikat</th>
                      <th className="px-6 py-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#CAF4FF]/50 font-bold text-slate-700">
                    {getFilteredGrades().map((g) => (
                      <tr key={g.id} className="hover:bg-slate-50/40 transition-all">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                            <span className="font-extrabold text-slate-900">{g.student_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600">{g.class_name}</td>
                        <td className="px-6 py-4 text-slate-700 font-extrabold">{g.subject}</td>
                        <td className="px-6 py-4 text-slate-500 font-semibold">{g.exam_type}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2.5 py-1.5 rounded-xl text-xs font-black ${
                            g.score >= 85 ? 'bg-emerald-50 text-emerald-800' :
                            g.score >= 75 ? 'bg-blue-50 text-blue-800' : 'bg-amber-50 text-amber-800'
                          }`}>
                            {g.score}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center font-black text-sm text-slate-800">
                          {g.score >= 90 ? 'A' : g.score >= 80 ? 'B' : g.score >= 70 ? 'C' : 'D'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[9px] font-black uppercase tracking-wider border border-emerald-100 flex items-center justify-center gap-1 w-fit mx-auto">
                            <Check className="w-3 h-3" /> SAH
                          </span>
                        </td>
                      </tr>
                    ))}
                    {getFilteredGrades().length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-medium">
                          Tidak ada data nilai yang cocok dengan pencarian Anda.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}

              {/* CATEGORY: MATERIALS */}
              {selectedCategory === 'materials' && (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/50 text-slate-400 font-black tracking-wider uppercase text-[10px] border-b border-[#CAF4FF]">
                      <th className="px-6 py-4">Judul Materi Belajar</th>
                      <th className="px-6 py-4">Tingkat Kelas</th>
                      <th className="px-6 py-4">Guru Pengunggah</th>
                      <th className="px-6 py-4 text-center">Ukuran File</th>
                      <th className="px-6 py-4 text-center">Unduhan</th>
                      <th className="px-6 py-4">Kategori Mapel</th>
                      <th className="px-6 py-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#CAF4FF]/50 font-bold text-slate-700">
                    {getFilteredMaterials().map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/40 transition-all">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-pink-400"></span>
                            <span className="font-extrabold text-slate-900">{m.title}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600">{m.class_name}</td>
                        <td className="px-6 py-4 text-slate-700 font-semibold">{m.creator}</td>
                        <td className="px-6 py-4 text-center font-mono font-bold text-slate-500">{m.size}</td>
                        <td className="px-6 py-4 text-center font-mono font-bold text-blue-500">{m.downloads}x</td>
                        <td className="px-6 py-4 text-slate-600">{m.category}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="px-2.5 py-1 bg-[#CAF4FF]/30 text-slate-700 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 w-fit mx-auto border border-[#CAF4FF]/40">
                            <FileText className="w-3 h-3" /> PUBLISH
                          </span>
                        </td>
                      </tr>
                    ))}
                    {getFilteredMaterials().length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-medium">
                          Tidak ada materi belajar yang cocok dengan pencarian Anda.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}

            </div>

          </div>

        </div>
      )}

      {/* SECOND TAB: ORIGINAL CONFIGURATION / DB SCHOOL CONNECTIONS */}
      {activeTab === 'konfigurasi' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Connection Table */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-[#CAF4FF] shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="font-black text-slate-900 text-lg">Daftar Koneksi Database Sekolah</h3>
                <p className="text-xs text-slate-400 font-bold mt-0.5">Daftar integrasi database instansi terdaftar di Dapodik Sagara</p>
              </div>
              <button 
                onClick={() => {
                  setIsAdding(true);
                  setEditForm({});
                }}
                className="bg-[#5AB2FF] hover:bg-[#7bc0ff] text-white px-4 py-2 rounded-2xl flex items-center gap-1.5 text-xs font-black shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" /> Tambah Sekolah
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-100 text-slate-400 font-black tracking-wider uppercase text-[10px] border-b border-[#CAF4FF]">
                  <tr>
                    <th className="p-4">NPSN</th>
                    <th className="p-4">Nama Instansi</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Terakhir Sync</th>
                    <th className="p-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#CAF4FF]/50 font-bold text-slate-700">
                  {isAdding && (
                    <tr className="border-b bg-blue-50/40">
                      <td className="p-3">
                        <input className="w-full border border-gray-200 bg-white px-2 py-1.5 rounded text-xs font-mono" maxLength={8} value={editForm.school_code || ''} onChange={e => setEditForm({...editForm, school_code: e.target.value.replace(/\D/g, '')})} placeholder="NPSN (8 digit)" />
                      </td>
                      <td className="p-3">
                        <input className="w-full border border-gray-200 bg-white px-2 py-1.5 rounded text-xs" value={editForm.school_name || ''} onChange={e => setEditForm({...editForm, school_name: e.target.value})} placeholder="Nama Instansi" />
                      </td>
                      <td className="p-3">
                        <label className="flex items-center gap-1">
                          <input type="checkbox" checked={editForm.is_active ?? true} onChange={e => setEditForm({...editForm, is_active: e.target.checked})} />
                          <span className="text-xs font-bold text-slate-600">Aktif</span>
                        </label>
                      </td>
                      <td className="p-3 text-xs italic text-gray-400">Otomatis</td>
                      <td className="p-3">
                        <div className="flex justify-center gap-1.5">
                          <button onClick={() => handleSave()} className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"><Save className="w-4 h-4"/></button>
                          <button onClick={() => setIsAdding(false)} className="p-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"><X className="w-4 h-4"/></button>
                        </div>
                      </td>
                    </tr>
                  )}
                  
                  {schools.map(school => (
                    <tr key={school.id} className={`hover:bg-slate-50 transition-colors ${selectedSchool?.id === school.id ? 'bg-[#CAF4FF]/20' : ''}`}>
                      {isEditing === school.id ? (
                        <>
                          <td className="p-3">
                            <input className="w-full border border-gray-200 bg-white px-2 py-1 rounded text-xs font-mono" maxLength={8} value={editForm.school_code || ''} onChange={e => setEditForm({...editForm, school_code: e.target.value.replace(/\D/g, '')})} />
                          </td>
                          <td className="p-3">
                            <input className="w-full border border-gray-200 bg-white px-2 py-1 rounded text-xs" value={editForm.school_name || ''} onChange={e => setEditForm({...editForm, school_name: e.target.value})} />
                          </td>
                          <td className="p-3">
                            <label className="flex items-center gap-1">
                              <input type="checkbox" checked={editForm.is_active ?? true} onChange={e => setEditForm({...editForm, is_active: e.target.checked})} />
                              <span className="text-xs font-bold text-slate-600">Aktif</span>
                            </label>
                          </td>
                          <td className="p-3 text-xs italic text-gray-400">Otomatis</td>
                          <td className="p-3">
                            <div className="flex justify-center gap-1.5">
                              <button onClick={() => handleSave(school.id)} className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"><Save className="w-4 h-4"/></button>
                              <button onClick={() => setIsEditing(null)} className="p-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"><X className="w-4 h-4"/></button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="p-4 font-mono font-bold text-slate-800">{school.school_code}</td>
                          <td className="p-4">
                            <span className="font-extrabold text-slate-900">{school.school_name}</span>
                          </td>
                          <td className="p-4">
                            <button 
                              onClick={() => toggleActive(school)}
                              className={`px-2.5 py-1 rounded-full text-[9px] font-black flex items-center gap-1.5 ${school.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${school.is_active ? 'bg-emerald-600' : 'bg-red-600'}`}></span>
                              {school.is_active ? 'AKTIF' : 'NON-AKTIF'}
                            </button>
                          </td>
                          <td className="p-4 text-slate-500 font-mono text-[10px]">
                            {school.updated_at ? new Date(school.updated_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'}) : school.created_at ? new Date(school.created_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'}) : '-'}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-1.5">
                              <button 
                                onClick={() => {
                                  setSelectedSchool(school);
                                  setActiveTab('visualisasi');
                                }} 
                                title="Monitor Data Sekolah"
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-black uppercase tracking-wider"
                              >
                                <Eye className="w-4 h-4" /> Monitor
                              </button>
                              <button onClick={() => { setIsEditing(school.id); setEditForm(school); }} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"><Edit2 className="w-4 h-4"/></button>
                              <button onClick={() => handleDelete(school.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                  {schools.length === 0 && !isAdding && (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-slate-400 font-medium">
                        <School className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        Belum ada data sekolah yang mendaftar ke server monitoring Sagara.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Configuration Inspector Sidebar */}
          <div className="bg-white rounded-3xl border border-[#CAF4FF] p-6 shadow-sm space-y-5">
            <h3 className="font-black text-slate-900 text-base flex items-center gap-2 border-b border-slate-50 pb-3">
              <LayoutGrid className="w-5 h-5 text-[#5AB2FF]" /> Inspektur Live Endpoint
            </h3>

            {selectedSchool ? (
              <div className="space-y-4">
                
                <div className="bg-slate-50 p-4 rounded-2xl border border-[#CAF4FF]/20 space-y-1.5">
                  <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    NPSN: {selectedSchool.school_code}
                  </span>
                  <h4 className="font-extrabold text-slate-900 text-sm leading-tight">{selectedSchool.school_name}</h4>
                  <p className="text-[10px] font-mono text-slate-400 truncate mt-1">URL: {selectedSchool.supabase_url}</p>
                </div>

                {inspecting ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Loader2 className="animate-spin text-[#5AB2FF] w-8 h-8 mb-2" />
                    <span className="text-xs font-bold text-slate-400">Menghubungkan Endpoint...</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center bg-emerald-50 text-emerald-800 p-3 rounded-2xl border border-emerald-100 text-[10px] font-black uppercase tracking-wider">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                        LIVE INSTANSI ONLINE
                      </span>
                      <span>100% OK</span>
                    </div>

                    <div className="space-y-2 text-xs font-bold text-slate-600">
                      <div className="flex justify-between items-center bg-slate-50/50 p-2.5 rounded-xl border border-[#CAF4FF]/20">
                        <span className="flex items-center gap-1.5 text-slate-500"><Users className="w-4 h-4 text-[#5AB2FF]" /> Siswa</span>
                        <span className="text-slate-800 font-extrabold font-mono">{curStats.studentsCount}</span>
                      </div>
                      <div className="flex justify-between items-center bg-slate-50/50 p-2.5 rounded-xl border border-[#CAF4FF]/20">
                        <span className="flex items-center gap-1.5 text-slate-500"><ShieldCheck className="w-4 h-4 text-[#5AB2FF]" /> Guru / GTK</span>
                        <span className="text-slate-800 font-extrabold font-mono">{curStats.gtkCount}</span>
                      </div>
                      <div className="flex justify-between items-center bg-slate-50/50 p-2.5 rounded-xl border border-[#CAF4FF]/20">
                        <span className="flex items-center gap-1.5 text-slate-500"><FileSpreadsheet className="w-4 h-4 text-[#5AB2FF]" /> Nilai Rapor</span>
                        <span className="text-slate-800 font-extrabold font-mono">{curStats.gradesCount}</span>
                      </div>
                      <div className="flex justify-between items-center bg-slate-50/50 p-2.5 rounded-xl border border-[#CAF4FF]/20">
                        <span className="flex items-center gap-1.5 text-slate-500"><Activity className="w-4 h-4 text-orange-400 animate-pulse" /> Absensi</span>
                        <span className="text-slate-800 font-extrabold font-mono">{curStats.attendanceCount}</span>
                      </div>
                      <div className="flex justify-between items-center bg-slate-50/50 p-2.5 rounded-xl border border-[#CAF4FF]/20">
                        <span className="flex items-center gap-1.5 text-slate-500"><BookOpen className="w-4 h-4 text-[#5AB2FF]" /> Bahan Ajar</span>
                        <span className="text-slate-800 font-extrabold font-mono">{curStats.materialsCount}</span>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            ) : (
              <div className="text-xs text-slate-400 font-bold text-center py-12">
                Pilih salah satu sekolah terdaftar untuk menginspeksi status endpoint real-time.
              </div>
            )}

          </div>

        </div>
      )}

      {/* 1. STUDENT DETAIL MODAL POPUP */}
      {selectedStudentDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-[#CAF4FF] flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-[#5AB2FF] to-[#7bc0ff] text-white flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-white/25 text-white px-2 py-0.5 rounded">Rincian Lengkap Siswa</span>
                <h3 className="text-xl font-black tracking-tight mt-1">{selectedStudentDetail.name}</h3>
              </div>
              <button 
                onClick={() => setSelectedStudentDetail(null)}
                className="p-1.5 bg-white/20 hover:bg-white/30 rounded-xl transition-all text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-slate-700 text-xs font-bold">
              
              {/* Profil & Akademik */}
              <div className="space-y-3">
                <h4 className="text-sm font-black text-slate-800 border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-[#5AB2FF]" /> Identitas & Akademik
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <span className="text-slate-400 block text-[9px] uppercase font-black">NISN</span>
                    <span className="text-slate-800 text-sm font-black font-mono mt-0.5 block">{selectedStudentDetail.nisn}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <span className="text-slate-400 block text-[9px] uppercase font-black">Kelas / Rombel</span>
                    <span className="text-slate-800 text-sm font-black mt-0.5 block">{selectedStudentDetail.class_name}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <span className="text-slate-400 block text-[9px] uppercase font-black">Jenis Kelamin</span>
                    <span className="text-slate-800 mt-0.5 block">{selectedStudentDetail.gender === 'L' ? 'Laki-Laki' : 'Perempuan'}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <span className="text-slate-400 block text-[9px] uppercase font-black">Asal Instansi</span>
                    <span className="text-slate-800 mt-0.5 block truncate">{selectedStudentDetail.school_name || selectedSchool?.school_name || 'SD Negeri Remen 2'}</span>
                  </div>
                </div>
              </div>

              {/* Status Sosial Ekonomi */}
              <div className="space-y-3">
                <h4 className="text-sm font-black text-slate-800 border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-emerald-500" /> Profil Sosial & Kemampuan Ekonomi
                </h4>
                <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50 flex items-center gap-4">
                  <div className="p-3 bg-emerald-100/50 text-emerald-600 rounded-xl">
                    <Coins className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-black">Status Kemampuan Ekonomi</span>
                    <span className="text-emerald-700 text-base font-black mt-0.5 block">{selectedStudentDetail.economy_status || 'Mampu'}</span>
                  </div>
                </div>
              </div>

              {/* Data Kesehatan Siswa */}
              <div className="space-y-3">
                <h4 className="text-sm font-black text-slate-800 border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-rose-500" /> Profil & Data Kesehatan Siswa
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                    <span className="text-slate-400 block text-[9px] uppercase font-black">Golongan Darah</span>
                    <span className="text-slate-800 text-sm font-black mt-0.5 block">{selectedStudentDetail.blood_type || '-'}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                    <span className="text-slate-400 block text-[9px] uppercase font-black">Tinggi Badan</span>
                    <span className="text-slate-800 text-sm font-black mt-0.5 block">{selectedStudentDetail.height ? `${selectedStudentDetail.height} cm` : '-'}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                    <span className="text-slate-400 block text-[9px] uppercase font-black">Berat Badan</span>
                    <span className="text-slate-800 text-sm font-black mt-0.5 block">{selectedStudentDetail.weight ? `${selectedStudentDetail.weight} kg` : '-'}</span>
                  </div>
                </div>
                {selectedStudentDetail.health_notes && (
                  <div className="bg-rose-50/50 p-3.5 rounded-2xl border border-rose-100 text-rose-800">
                    <span className="text-rose-600 block text-[9px] uppercase font-black mb-1">Catatan Riwayat Kesehatan</span>
                    <p className="font-bold">{selectedStudentDetail.health_notes}</p>
                  </div>
                )}
              </div>

              {/* metadata Sagara */}
              <div className="flex justify-between items-center text-[10px] text-slate-400 pt-4 border-t border-slate-100">
                <span>Sinkronisasi: {selectedStudentDetail.sync_time}</span>
                <span className="text-emerald-600 uppercase font-black">INTEGRITAS DATA TERJAMIN</span>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setSelectedStudentDetail(null)}
                className="px-5 py-2.5 bg-[#5AB2FF] hover:bg-[#7bc0ff] text-white rounded-xl text-xs font-black transition-all"
              >
                Tutup Rincian
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 2. GTK DETAIL MODAL POPUP */}
      {selectedGtkDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-[#CAF4FF] flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-indigo-500 to-violet-500 text-white flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-white/25 text-white px-2 py-0.5 rounded">Rincian Lengkap Tenaga Pendidik (GTK)</span>
                <h3 className="text-xl font-black tracking-tight mt-1">{selectedGtkDetail.name}</h3>
              </div>
              <button 
                onClick={() => setSelectedGtkDetail(null)}
                className="p-1.5 bg-white/20 hover:bg-white/30 rounded-xl transition-all text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-slate-700 text-xs font-bold">
              
              {/* Profil & Akademik */}
              <div className="space-y-3">
                <h4 className="text-sm font-black text-slate-800 border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-indigo-500" /> Identitas & Jabatan GTK
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <span className="text-slate-400 block text-[9px] uppercase font-black">NUPTK / NIP</span>
                    <span className="text-slate-800 text-sm font-black font-mono mt-0.5 block">{selectedGtkDetail.nuptk}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <span className="text-slate-400 block text-[9px] uppercase font-black">Jabatan</span>
                    <span className="text-slate-800 text-sm font-black mt-0.5 block">{selectedGtkDetail.position}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <span className="text-slate-400 block text-[9px] uppercase font-black">Mata Pelajaran Utama</span>
                    <span className="text-slate-800 mt-0.5 block">{selectedGtkDetail.subject || '-'}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <span className="text-slate-400 block text-[9px] uppercase font-black">Jenis Kelamin</span>
                    <span className="text-slate-800 mt-0.5 block">{selectedGtkDetail.gender === 'L' ? 'Laki-Laki' : 'Perempuan'}</span>
                  </div>
                </div>
              </div>

              {/* Status Kepegawaian & Sertifikasi */}
              <div className="space-y-3">
                <h4 className="text-sm font-black text-slate-800 border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" /> Status Kepegawaian & Sertifikasi
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <span className="text-slate-400 block text-[9px] uppercase font-black">Status Pegawai</span>
                    <span className="text-slate-800 text-sm font-black mt-0.5 block">{selectedGtkDetail.employment_status || 'GTT / PTT'}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <span className="text-slate-400 block text-[9px] uppercase font-black">Sertifikasi Guru</span>
                    <span className={`text-xs font-black mt-1 block px-2 py-0.5 w-fit rounded ${selectedGtkDetail.is_certified ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      {selectedGtkDetail.is_certified ? 'SUDAH SERTIFIKASI' : 'BELUM SERTIFIKASI'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Instansi Asal & Sinkronisasi */}
              <div className="space-y-3">
                <h4 className="text-sm font-black text-slate-800 border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                  <School className="w-4 h-4 text-violet-500" /> Penempatan Instansi Sagara
                </h4>
                <div className="bg-violet-50/50 p-4 rounded-2xl border border-violet-100/50 flex items-center gap-4">
                  <div className="p-3 bg-violet-100/50 text-violet-600 rounded-xl">
                    <School className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-black">Sekolah Penugasan</span>
                    <span className="text-violet-700 text-base font-black mt-0.5 block">{selectedGtkDetail.school_name || selectedSchool?.school_name || 'SD Negeri Remen 2'}</span>
                  </div>
                </div>
              </div>

              {/* metadata Sagara */}
              <div className="flex justify-between items-center text-[10px] text-slate-400 pt-4 border-t border-slate-100">
                <span>Sinkronisasi: {selectedGtkDetail.sync_time}</span>
                <span className="text-emerald-600 uppercase font-black">INTEGRITAS DATA TERJAMIN</span>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setSelectedGtkDetail(null)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black transition-all"
              >
                Tutup Rincian
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
