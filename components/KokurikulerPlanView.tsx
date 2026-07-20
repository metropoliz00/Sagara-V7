import React, { useState, useEffect, useRef } from 'react';
import { User, KokurikulerPlan } from '../types';
import { apiService } from '../services/apiService';
import { Plus, BookOpen, Trash2, Edit, Sparkles, FileText, CheckCircle2, Printer, ArrowLeft, FileDown, Upload, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

interface KokurikulerPlanViewProps {
  currentUser: User | null;
  classId: string;
  schoolProfile?: any;
  teacherProfile?: any;
  users?: User[];
  onShowNotification?: (message: string, type: 'success' | 'error' | 'warning') => void;
}



const KOKURIKULER_REFERENCES: Record<string, { tema: string; dimensiUtama: string; pendukung: string }[]> = {
  'lintas': [
    { tema: 'Lingkunganku Sehat, Aku Kuat', dimensiUtama: 'Kesehatan, Kolaborasi', pendukung: 'IPAS, Matematika, Bahasa Indonesia, Seni Budaya' },
    { tema: 'Sekolah Bebas Sampah', dimensiUtama: 'Penalaran Kritis, Kreativitas', pendukung: 'IPAS, Matematika, Bahasa Indonesia, Informatika' },
    { tema: 'Kampungku Kaya Budaya', dimensiUtama: 'Kewargaan, Komunikasi', pendukung: 'IPS, Bahasa Indonesia, Seni Budaya, Bahasa Daerah' },
    { tema: 'Pasar Mini Pelajar', dimensiUtama: 'Kreativitas, Kemandirian', pendukung: 'Matematika, Bahasa Indonesia, IPAS, Informatika' },
    { tema: 'Hemat Energi untuk Masa Depan', dimensiUtama: 'Penalaran Kritis, Kewargaan', pendukung: 'IPAS, Matematika, Bahasa Indonesia' },
    { tema: 'Aku Cinta Indonesia', dimensiUtama: 'Kewargaan, Komunikasi', pendukung: 'PPKn, Bahasa Indonesia, Seni Budaya' },
    { tema: 'Jelajah Profesi Impianku', dimensiUtama: 'Kemandirian, Komunikasi', pendukung: 'Bahasa Indonesia, IPAS, Informatika' },
    { tema: 'Kebun Sekolah Produktif', dimensiUtama: 'Kolaborasi, Kesehatan', pendukung: 'IPAS, Matematika, Seni Budaya' },
    { tema: 'Festival Literasi Digital', dimensiUtama: 'Penalaran Kritis, Komunikasi', pendukung: 'Bahasa Indonesia, Informatika, Seni Budaya' },
    { tema: 'Wisata Edukasi Tubanku', dimensiUtama: 'Kewargaan, Kreativitas', pendukung: 'IPS, Bahasa Indonesia, Seni Budaya' }
  ],
  '7kaih': [
    { tema: 'Aku Disiplin Bangun Pagi', dimensiUtama: 'Kemandirian', pendukung: 'Bangun Pagi' },
    { tema: 'Generasi Gemar Beribadah', dimensiUtama: 'Keimanan dan Ketakwaan', pendukung: 'Beribadah' },
    { tema: 'Tubuh Sehat Prestasi Hebat', dimensiUtama: 'Kesehatan', pendukung: 'Berolahraga' },
    { tema: 'Sarapan Sehat Setiap Hari', dimensiUtama: 'Kesehatan', pendukung: 'Makan Sehat' },
    { tema: 'Aku Sahabat Buku', dimensiUtama: 'Komunikasi', pendukung: 'Gemar Belajar' },
    { tema: 'Peduli Tetangga dan Lingkungan', dimensiUtama: 'Kolaborasi', pendukung: 'Bermasyarakat' },
    { tema: 'Tidur Cepat Tubuh Kuat', dimensiUtama: 'Kesehatan', pendukung: 'Tidur Cepat' },
    { tema: 'Tantangan 21 Hari Anak Hebat', dimensiUtama: 'Kemandirian, Kesehatan', pendukung: 'Semua Kebiasaan' },
    { tema: 'Keluargaku Pendukung Kebiasaanku', dimensiUtama: 'Kolaborasi', pendukung: 'Semua Kebiasaan' },
    { tema: 'Aku Anak Indonesia Hebat', dimensiUtama: 'Keimanan, Kemandirian', pendukung: 'Semua Kebiasaan' }
  ],
  'nilai': [
    { tema: 'Religius dalam Tindakan', dimensiUtama: 'Keimanan dan Ketakwaan', pendukung: 'Religius' },
    { tema: 'Aku Peduli Sesama', dimensiUtama: 'Kolaborasi', pendukung: 'Humanis' },
    { tema: 'Sekolahku Rumah Kedua', dimensiUtama: 'Kewargaan', pendukung: 'Ramah Anak' },
    { tema: 'Pelajar Berintegritas', dimensiUtama: 'Kemandirian', pendukung: 'Karakter' },
    { tema: 'Gerakan Jumat Berbagi', dimensiUtama: 'Kolaborasi', pendukung: 'Kepedulian Sosial' },
    { tema: 'Sekolah Adiwiyata Beraksi', dimensiUtama: 'Kewargaan', pendukung: 'Adiwiyata' },
    { tema: 'Budaya Antre dan Disiplin', dimensiUtama: 'Kemandirian', pendukung: 'Disiplin' },
    { tema: 'Pelestari Budaya Lokal', dimensiUtama: 'Kewargaan', pendukung: 'Kearifan Lokal' },
    { tema: 'Sekolah Aman dan Nyaman', dimensiUtama: 'Kesehatan', pendukung: 'Sekolah Aman' },
    { tema: 'Gelar Karya dan Prestasi Murid', dimensiUtama: 'Kreativitas, Komunikasi', pendukung: 'Program Unggulan' }
  ]
};

export const KokurikulerPlanView: React.FC<KokurikulerPlanViewProps> = ({ currentUser, classId, schoolProfile, teacherProfile, users = [], onShowNotification }) => {
  const rawTeacherList = users.length > 0 
    ? users.filter(u => {
        if (u.role !== 'guru') return false;
        const pos = (u.position || '').toLowerCase();
        return pos.includes('mapel') || pos.includes('guru mata pelajaran') || ['pai', 'agama', 'pjok', 'olahraga', 'inggris', 'matematika', 'ipa', 'ips', 'seni', 'prakarya', 'tik', 'mulok', 'penjas', 'sbdp', 'arab', 'jawa'].some(k => pos.includes(k));
      })
    : (teacherProfile ? [teacherProfile] : []);
  
  const teacherList = rawTeacherList.length > 0 ? rawTeacherList : users.filter(u => u.role === 'guru');

  const getAutoIdentitas = () => {
    const satuanPendidikan = schoolProfile?.name || 'UPT SD Negeri Remen 2';
    
    const sourceStr = (classId || teacherProfile?.teachingClass || '').toString().toUpperCase();
    const match = sourceStr.match(/[1-6]/);
    const classNum = match ? match[0] : '4';
    const romanClasses: Record<string, string> = {
      '1': 'I', '2': 'II', '3': 'III', '4': 'IV', '5': 'V', '6': 'VI'
    };
    const romanVal = romanClasses[classNum] || 'IV';
    const phaseLabel = classNum === '1' || classNum === '2' ? 'A' : classNum === '3' || classNum === '4' ? 'B' : 'C';
    const jenjangKelas = `Kelas ${romanVal} / Fase ${phaseLabel}`;

    const alokasiMap: Record<string, string> = {
      '1': '108 JP',
      '2': '108 JP',
      '3': '126 JP',
      '4': '126 JP',
      '5': '126 JP',
      '6': '112 JP'
    };
    const alokasiWaktu = alokasiMap[classNum] || '126 JP';

    let activeSemester = schoolProfile?.semester || '1';
    let semester = activeSemester.toLowerCase().includes('genap') || activeSemester === '2' ? '2 (Genap)' : '1 (Ganjil)';

    const tahunAjaran = schoolProfile?.year || '2025/2026';

    return { satuanPendidikan, jenjangKelas, semester, tahunAjaran, alokasiWaktu };
  };

  const autoInfo = getAutoIdentitas();

  const [plans, setPlans] = useState<KokurikulerPlan[]>([
    {
      id: 'rpk-peduli-lingkungan',
      identitas: {
        satuanPendidikan: 'UPT SD Negeri Remen 2',
        jenjangKelas: 'Kelas IV / Fase B',
        semester: '1 (Ganjil)',
        tahunAjaran: '2025/2026',
        temaKokurikuler: 'Peduli lingkungan',
        bentukKokurikuler: 'Gerakan 7 Kebiasaan Anak Indonesia Hebat (7KAIH)',
        lintasDisiplinIlmu: 'IPA, Bahasa Indonesia',
        gerakan7KAIH: 'Kepedulian Lingkungan',
        berbasisNilai: 'Kritis & Kreatif',
        alokasiWaktu: '114 JP',
        lokasiKegiatan: 'Lingkungan satuan pendidikan',
        penanggungJawab: 'Tim Pengembang Kokurikuler'
      },
      analisisKebutuhan: {
        karakteristikMurid: 'Murid memiliki kepedulian terhadap lingkungan sekitar namun memerlukan pemahaman mendalam tentang ekosistem.',
        potensiLingkungan: 'Lingkungan sekitar satuan pendidikan yang kaya akan komponen biotik dan abiotik.',
        programUnggulan: 'Sekolah Peduli Lingkungan & Adiwiyata',
        kebutuhanProfil: 'Penalaran Kritis dan Komunikasi'
      },
      dimensiProfil: [
        { dimensi: 'Penalaran Kritis', fokus: 'Menganalisis interaksi antar komponen ekosistem' },
        { dimensi: 'Komunikasi', fokus: 'Mempresentasikan gagasan sebagai solusi pemecahan masalah' }
      ],
      tujuanPembelajaran: [
        'Menganalisis interaksi antar komponen ekosistem dan pengaruhnya terhadap keseimbangan ekosistem (mata pelajaran IPA)',
        'Mempresentasikan gagasan sebagai solusi pemecahan masalah secara kritis dan kreatif (mata pelajaran Bahasa Indonesia)'
      ],
      praktikPedagogis: 'Pembelajaran berbasis proyek.',
      lingkunganPembelajaran: 'Memberi kesempatan kepada murid untuk menganalisis kondisi lingkungan sekitar secara berkolaborasi bersama teman sekelas dan melakukan aksi nyata sebagai solusi dari permasalahan yang terjadi.',
      pemanfaatanDigital: 'Laptop, Infocus, video, dan canva/powerpoint',
      kemitraan: {
        satuanPendidikan: 'Kolaborasi guru IPA dan Bahasa Indonesia.',
        keluarga: 'Dukungan orang tua dalam pengamatan lingkungan.',
        masyarakat: 'Masyarakat sekitar sekolah.'
      },
      kegiatan: [
        'Guru menyampaikan tujuan pembelajaran dan rangkaian aktivitas yang akan dilakukan.',
        'Murid dibagi menjadi beberapa kelompok secara heterogen.',
        'Murid diminta memirsa video tentang komponen ekosistem dan kaitannya dengan kerusakan alam.',
        'Murid dan guru berdiskusi mengenai isi video dan mengaitkan dengan komponen ekosistem yang ada di lingkungan sekitar.',
        'Murid melakukan kunjungan ke lingkungan sekitar satuan pendidikan untuk melakukan pengamatan tentang komponen-komponen ekosistem yang ada.',
        'Murid berdiskusi dalam kelompok tentang kondisi ekosistem dan permasalahan yang terjadi. Tiap kelompok dapat memilih kondisi ekosistem yang berbeda.',
        'Murid mengumpulkan data tentang alternatif solusi permasalahan lingkungan.',
        'Murid merancang solusi terhadap permasalahan yang ditemukan.',
        'Murid membuat karya tentang solusi permasalahan dengan menggunakan berbagai media.',
        'Murid mempresentasikan karyanya dengan berbagai media secara berkelompok.',
        'Murid melakukan refleksi kegiatan yang telah dilakukan.',
        'Murid membuat kesepakatan terkait apa hal konkret yang akan dilakukan bersama untuk membantu keseimbangan ekosistem.'
      ],
      asesmen: {
        formatif: 'Teknik observasi dengan instrumen catatan anekdotal',
        sumatif: 'Penilaian kinerja dengan instrumen rubrik'
      },
      produk: ['Karya Solusi Permasalahan', 'Presentasi Kelompok'],
      createdAt: '2026-07-13'
    }
  ]);

  const getPhaseFromJenjang = (str: string) => {
    if (!str) return '';
    const upper = str.toUpperCase();
    if (upper.includes('FASE A') || upper.includes('KELAS I') || upper.includes('KELAS II') || upper.includes('KELAS 1') || upper.includes('KELAS 2')) return 'A';
    if (upper.includes('FASE B') || upper.includes('KELAS III') || upper.includes('KELAS IV') || upper.includes('KELAS 3') || upper.includes('KELAS 4')) return 'B';
    if (upper.includes('FASE C') || upper.includes('KELAS V') || upper.includes('KELAS VI') || upper.includes('KELAS 5') || upper.includes('KELAS 6')) return 'C';
    return '';
  };

  const currentPhase = getPhaseFromJenjang(autoInfo.jenjangKelas);
  const matchingPhasePlan = plans.find(p => getPhaseFromJenjang(p.identitas.jenjangKelas) === currentPhase);

  useEffect(() => {
    apiService.getKokurikulerPlans().then(data => {
      if (data && data.length > 0) {
        setPlans(data);
      }
    }).catch(err => {
      console.error("Failed to load kokurikuler plans:", err);
    });
  }, []);

  const [view, setView] = useState<'list' | 'editor' | 'detail'>('list');
  const [selectedPlan, setSelectedPlan] = useState<KokurikulerPlan | null>(null);

  const getAlokasiCalculation = (alokasiStr: string, tipe: 'mingguan' | 'harian' = 'mingguan') => {
    if (!alokasiStr) return '';
    const numMatch = alokasiStr.match(/\d+/);
    if (!numMatch) return '';
    const num = parseInt(numMatch[0], 10);
    const upper = alokasiStr.toUpperCase();

    const jp = upper.includes('JP') || (!upper.includes('MINGGU') && !upper.includes('PERTEMUAN') && !upper.includes('P')) ? num : (upper.includes('MINGGU') ? num * 7 : num * 2);
    if (tipe === 'harian') {
      const meetings = Math.round(jp / 2);
      return `(${meetings} Pertemuan)`;
    } else {
      const weeks = Math.round((jp / 7) * 10) / 10;
      return `(${weeks} Minggu)`;
    }
  };

  // Form state
  const [formData, setFormData] = useState<KokurikulerPlan>({
    id: '',
    identitas: {
      satuanPendidikan: autoInfo.satuanPendidikan,
      jenjangKelas: autoInfo.jenjangKelas,
      semester: autoInfo.semester,
      tahunAjaran: autoInfo.tahunAjaran,
      temaKokurikuler: 'Generasi Sehat dan Bugar',
      bentukKokurikuler: 'Gerakan 7 Kebiasaan Anak Indonesia Hebat (7KAIH)',
      lintasDisiplinIlmu: 'PJOK, IPA, Bahasa Indonesia',
      gerakan7KAIH: 'Bangun Pagi & Tidur Cepat',
      berbasisNilai: 'Kesehatan & Disiplin',
      alokasiWaktu: autoInfo.alokasiWaktu,
      tipeAlokasi: 'mingguan',
      lokasiKegiatan: 'di lingkungan satuan pendidikan dan rumah',
      penanggungJawab: teacherProfile?.fullName || currentUser?.fullName || 'Guru Kelas'
    },
    analisisKebutuhan: {
      karakteristikMurid: '',
      potensiLingkungan: '',
      programUnggulan: '',
      kebutuhanProfil: ''
    },
    dimensiProfil: [{ dimensi: 'Kesehatan', fokus: 'menumbuhkan kebiasaan bangun pagi dan tidur cepat' }],
    tujuanPembelajaran: ['menumbuhkan kebiasaan tidur cepat dan bangun pagi'],
    praktikPedagogis: 'Pembelajaran pada kegiatan kokurikuler ini menggunakan prinsip pembelajaran saintifik.',
    lingkunganPembelajaran: 'Penguatan karakter melalui kebiasaan bangun pagi dan tidur cepat dengan mengedepankan pendekatan yang memuliakan.',
    pemanfaatanDigital: 'Video pembelajaran tentang pengaruh kebiasaan tidur terhadap kesehatan.',
    kemitraan: {
      satuanPendidikan: 'kolaborasi antara Guru IPA dan Komite satuan pendidikan',
      keluarga: 'menggiatkan anak untuk pembiasaan bangun pagi dan tidur cepat.',
      masyarakat: 'tokoh masyarakat dan tokoh agama'
    },
    kegiatan: ['Pendidik mengajak murid mendiskusikan kebiasaan jam tidurnya dan membandingkan dengan teman'],
    asesmen: { formatif: 'Teknik observasi dengan instrumen catatan anekdotal', sumatif: 'Penilaian kinerja dengan instrumen rubrik' },
    produk: ['Jurnal Harian 7KAIH'],
    createdAt: new Date().toISOString().split('T')[0]
  });



  const handleAutoGenerateAsesmen = () => {
    const tema = formData.identitas.temaKokurikuler || 'Kegiatan Kokurikuler';
    const tujuanList = formData.tujuanPembelajaran.filter(t => t.trim()).length > 0 
      ? formData.tujuanPembelajaran.filter(t => t.trim()).join('; ') 
      : 'mengembangkan kompetensi dan karakter murid';
    const dimensiList = formData.dimensiProfil.map(d => `${d.dimensi} (${d.fokus || 'penguatan karakter'})`).join(', ') || 'Profil Pelajar Pancasila';

    const formatif = `Observasi partisipasi aktif, keterlibatan kolaboratif, dan catatan anekdotal berkala selama proses eksplorasi tema "${tema}" untuk mengukur pencapaian tujuan: ${tujuanList}, serta perkembangan dimensi ${dimensiList}.`;
    const sumatif = `Penilaian unjuk kerja (performance assessment) dan penilaian portofolio berbasis rubrik analitik untuk mengevaluasi pemahaman konsep, keterampilan proses, serta pengamalan nyata dimensi ${dimensiList} dalam menyelesaikan proyek bertema "${tema}".`;
    
    let suggestedProduk = [`Karya Kreatif & Laporan Proyek Bertema "${tema}"`];
    const temaLower = tema.toLowerCase();
    if (temaLower.includes('lingkungan') || temaLower.includes('sampah') || temaLower.includes('ekosistem')) {
      suggestedProduk = ['Karya Solusi Pengelolaan Sampah / Kebersihan Lingkungan', 'Poster Kampanye Peduli Lingkungan'];
    } else if (temaLower.includes('sehat') || temaLower.includes('kebiasaan') || temaLower.includes('bugar') || temaLower.includes('tidur')) {
      suggestedProduk = ['Jurnal Catatan Harian 7KAIH & Infografis Kesehatan', 'Dokumentasi Praktik Kebiasaan Baik'];
    } else if (temaLower.includes('kewirausahaan') || temaLower.includes('ekonomi')) {
      suggestedProduk = ['Produk Usaha Sederhana & Proposal Kreatif', 'Pameran & Presentasi Wirausaha Murid'];
    }

    setFormData({
      ...formData,
      asesmen: {
        formatif,
        sumatif
      },
      produk: suggestedProduk
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.identitas.temaKokurikuler) {
      if (onShowNotification) onShowNotification('Tema Kokurikuler wajib diisi.', 'warning');
      else alert('Tema Kokurikuler wajib diisi.');
      return;
    }
    try {
      const planToSave = formData.id ? formData : { ...formData, id: 'rpk-' + Date.now() };
      const saved = await apiService.saveKokurikulerPlan(planToSave);
      setPlans(prev => prev.some(p => p.id === saved.id) ? prev.map(p => p.id === saved.id ? saved : p) : [saved, ...prev]);
      if (onShowNotification) onShowNotification('Rencana Projek Kokurikuler (RPK) berhasil disimpan ke database!', 'success');
      setView('list');
    } catch (err) {
      console.error("Failed to save RPK:", err);
      if (onShowNotification) onShowNotification('Gagal menyimpan RPK ke database.', 'error');
      else alert('Gagal menyimpan RPK.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus RPK ini dari database?')) {
      try {
        await apiService.deleteKokurikulerPlan(id);
        setPlans(prev => prev.filter(p => p.id !== id));
        if (onShowNotification) onShowNotification('Rencana Projek Kokurikuler berhasil dihapus.', 'success');
      } catch (err) {
        console.error("Failed to delete RPK:", err);
        if (onShowNotification) onShowNotification('Gagal menghapus RPK dari database.', 'error');
        else alert('Gagal menghapus RPK.');
      }
    }
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.aoa_to_sheet([['No', 'Kegiatan'], ...formData.kegiatan.map((k, i) => [i + 1, k])]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Langkah Pembelajaran');
    XLSX.writeFile(workbook, `Dokumen_Langkah_Pembelajaran_RPK_Kelas_${classId}.xlsx`);
  };

  const downloadTemplate = () => {
    const worksheet = XLSX.utils.aoa_to_sheet([['No', 'Kegiatan'], [1, ''], [2, ''], [3, '']]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Langkah Pembelajaran');
    XLSX.writeFile(workbook, 'Template_Langkah_Pembelajaran_RPK.xlsx');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const json: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      const activities = json.slice(1).map(row => row[1] || '').filter(k => k !== '');
      setFormData(prev => ({ ...prev, kegiatan: activities }));
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Rencana Pembelajaran Kokurikuler (RPK)</h1>
          <p className="text-gray-600 mt-1">Panduan Kurikulum Merdeka / Panduan Kokurikuler Kemendikdasmen 2025</p>
        </div>
        {view === 'list' && (
          <div className="flex gap-2">
            <button 
              onClick={() => {
                const auto = getAutoIdentitas();
                const basePlan = matchingPhasePlan || {
                  id: '',
                  identitas: {
                    satuanPendidikan: auto.satuanPendidikan,
                    jenjangKelas: auto.jenjangKelas,
                    semester: auto.semester,
                    tahunAjaran: auto.tahunAjaran,
                    temaKokurikuler: '',
                    bentukKokurikuler: 'Lintas Disiplin Ilmu',
                    lintasDisiplinIlmu: '',
                    gerakan7KAIH: '',
                    berbasisNilai: 'RAMAH',
                    alokasiWaktu: auto.alokasiWaktu,
                    tipeAlokasi: 'mingguan',
                    lokasiKegiatan: 'di lingkungan satuan pendidikan dan rumah',
                    tempatPengesahan: schoolProfile?.address?.split(',')[0] || 'Remen',
                    tanggalPengesahan: new Date().toISOString().split('T')[0],
                    penanggungJawab: teacherProfile?.fullName || currentUser?.fullName || 'Guru Kelas'
                  },
                  analisisKebutuhan: { karakteristikMurid: '', potensiLingkungan: '', programUnggulan: '', kebutuhanProfil: '' },
                  dimensiProfil: [{ dimensi: 'Penalaran Kritis', fokus: '' }],
                  tujuanPembelajaran: [''],
                  praktikPedagogis: 'Pembelajaran Berbasis Proyek',
                  lingkunganPembelajaran: 'Lingkungan Sekolah',
                  pemanfaatanDigital: '',
                  kemitraan: { satuanPendidikan: 'Guru', keluarga: 'Orang Tua', masyarakat: 'Masyarakat' },
                  kegiatan: ['Langkah kegiatan 1'],
                  asesmen: { formatif: 'Observasi', sumatif: 'Rubrik Kinerja' },
                  produk: [''],
                  createdAt: new Date().toISOString().split('T')[0]
                };

                setFormData({
                  ...basePlan,
                  identitas: {
                    ...basePlan.identitas,
                    jenjangKelas: auto.jenjangKelas,
                    penanggungJawab: basePlan.identitas?.penanggungJawab || teacherProfile?.fullName || currentUser?.fullName || 'Guru Kelas'
                  }
                });
                setView('editor');
              }}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm font-medium"
            >
              <Plus size={20} />
              {matchingPhasePlan ? 'Edit / Sesuaikan RPK Fase Ini' : 'Buat RPK Baru'}
            </button>
          </div>
        )}
      </div>



      {view === 'list' && (
        <div className="space-y-6">
          {/* RPK List Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">Daftar Rencana Pembelajaran Kokurikuler (RPK) Tersimpan</h3>
              <span className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-medium">{plans.length} Dokumen</span>
            </div>

            {plans.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <BookOpen className="mx-auto mb-3 text-gray-400" size={56} />
                <p className="text-lg font-medium">Belum ada dokumen RPK.</p>
                <p className="text-sm text-gray-400 mt-1">Silakan buat baru atau gunakan template model di atas.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider border-b">
                      <th className="py-4 px-6">Tema Kokurikuler</th>
                      <th className="py-4 px-6">Bentuk Kokurikuler</th>
                      <th className="py-4 px-6">Jenjang / Kelas</th>
                      <th className="py-4 px-6">Koordinator Kokurikuler</th>
                      <th className="py-4 px-6">Tanggal Dibuat</th>
                      <th className="py-4 px-6 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {plans.map(plan => (
                      <tr key={plan.id} className="hover:bg-gray-50/80 transition">
                        <td className="py-4 px-6 font-semibold text-gray-900">
                          {plan.identitas.temaKokurikuler}
                        </td>
                        <td className="py-4 px-6 text-xs text-gray-700">
                          {plan.identitas.bentukKokurikuler}
                        </td>
                        <td className="py-4 px-6 font-medium text-gray-800">
                          {plan.identitas.jenjangKelas}
                        </td>
                        <td className="py-4 px-6 text-gray-700">{plan.identitas.penanggungJawab}</td>
                        <td className="py-4 px-6 text-gray-500">{plan.createdAt}</td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => { setSelectedPlan(plan); setView('detail'); }}
                              className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition"
                              title="Lihat Detail RPK"
                            >
                              <FileText size={18} />
                            </button>
                            <button 
                              onClick={() => { 
                                setFormData({
                                  ...plan,
                                  identitas: {
                                    ...plan.identitas,
                                    penanggungJawab: plan.identitas?.penanggungJawab || teacherProfile?.fullName || currentUser?.fullName || 'Guru Kelas'
                                  }
                                }); 
                                setView('editor'); 
                              }}
                              className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                              title="Edit RPK"
                            >
                              <Edit size={18} />
                            </button>
                            <button 
                              onClick={() => handleDelete(plan.id)}
                              className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                              title="Hapus RPK"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {view === 'editor' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6 pb-4 border-b">
            <h2 className="text-2xl font-bold text-gray-900">
              {formData.id ? 'Edit Rencana Pembelajaran Kokurikuler (RPK)' : 'Buat Rencana Pembelajaran Kokurikuler (RPK)'}
            </h2>
            <button 
              onClick={() => setView('list')}
              className="flex items-center gap-1 text-gray-600 hover:text-gray-900 font-medium"
            >
              <ArrowLeft size={18} /> Kembali
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-8">
            {/* Section 1: Identitas */}
            <section className="bg-gray-50 p-6 rounded-xl border border-gray-100">
              <h3 className="font-bold text-lg text-blue-900 mb-4 flex items-center gap-2">
                <span className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">1</span>
                Identitas Kegiatan Kokurikuler
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Satuan Pendidikan</label>
                  <input 
                    type="text" 
                    value={formData.identitas.satuanPendidikan}
                    onChange={e => setFormData({...formData, identitas: {...formData.identitas, satuanPendidikan: e.target.value}})}
                    className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Jenjang/Kelas</label>
                  <input 
                    type="text" 
                    value={formData.identitas.jenjangKelas}
                    onChange={e => setFormData({...formData, identitas: {...formData.identitas, jenjangKelas: e.target.value}})}
                    className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Semester</label>
                  <input 
                    type="text" 
                    value={formData.identitas.semester}
                    onChange={e => setFormData({...formData, identitas: {...formData.identitas, semester: e.target.value}})}
                    className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Tahun Ajaran</label>
                  <input 
                    type="text" 
                    value={formData.identitas.tahunAjaran || ''}
                    onChange={e => setFormData({...formData, identitas: {...formData.identitas, tahunAjaran: e.target.value}})}
                    className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Bentuk Kokurikuler</label>
                  <select
                    value={formData.identitas.bentukKokurikuler}
                    onChange={e => setFormData({...formData, identitas: {...formData.identitas, bentukKokurikuler: e.target.value}})}
                    className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="Pembelajaran Kolaboratif Lintas Disiplin Ilmu">Pembelajaran Kolaboratif Lintas Disiplin Ilmu</option>
                    <option value="Gerakan 7 Kebiasaan Anak Indonesia Hebat (7KAIH)">Gerakan 7 Kebiasaan Anak Indonesia Hebat (7KAIH)</option>
                    <option value="Kegiatan Berbasis Nilai-Nilai Satuan Pendidikan">Kegiatan Berbasis Nilai-Nilai Satuan Pendidikan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Tema Kokurikuler</label>
                  {(() => {
                    const catKey = formData.identitas.bentukKokurikuler.toLowerCase().includes('lintas') || formData.identitas.bentukKokurikuler.toLowerCase().includes('kolaboratif') 
                      ? 'lintas' 
                      : formData.identitas.bentukKokurikuler.toLowerCase().includes('7kaih') || formData.identitas.bentukKokurikuler.toLowerCase().includes('kebiasaan') 
                      ? '7kaih' 
                      : 'nilai';
                    const themes = KOKURIKULER_REFERENCES[catKey] || [];
                    const isMatched = themes.some(t => t.tema === formData.identitas.temaKokurikuler);
                    const selectVal = isMatched ? formData.identitas.temaKokurikuler : (formData.identitas.temaKokurikuler ? '__lainnya__' : '');

                    return (
                      <div className="space-y-2">
                        <select
                          value={selectVal}
                          onChange={e => {
                            const val = e.target.value;
                            if (val === '__lainnya__') {
                              setFormData({
                                ...formData,
                                identitas: { ...formData.identitas, temaKokurikuler: '' }
                              });
                            } else {
                              const found = themes.find(t => t.tema === val);
                              if (found) {
                                const updatedIdentitas = { ...formData.identitas, temaKokurikuler: found.tema };
                                if (catKey === 'lintas') updatedIdentitas.lintasDisiplinIlmu = found.pendukung;
                                if (catKey === '7kaih') updatedIdentitas.gerakan7KAIH = found.pendukung;
                                if (catKey === 'nilai') updatedIdentitas.berbasisNilai = found.pendukung;

                                const dims = found.dimensiUtama.split(',').map(d => d.trim()).map(d => ({ dimensi: d, fokus: found.tema }));

                                setFormData({
                                  ...formData,
                                  identitas: updatedIdentitas,
                                  dimensiProfil: dims.length > 0 ? dims : formData.dimensiProfil
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  identitas: { ...formData.identitas, temaKokurikuler: val }
                                });
                              }
                            }
                          }}
                          className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm"
                          required
                        >
                          <option value="">-- Pilih Tema Kokurikuler Sesuai Rekomendasi --</option>
                          {themes.map(t => (
                            <option key={t.tema} value={t.tema}>
                              {t.tema}
                            </option>
                          ))}
                          <option value="__lainnya__">✏️ Lainnya (Input Manual / Sesuai Satuan Pendidikan)...</option>
                        </select>

                        {(!isMatched || selectVal === '__lainnya__' || formData.identitas.temaKokurikuler === '') && (
                          <input
                            type="text"
                            placeholder="Masukkan tema kokurikuler secara manual..."
                            value={formData.identitas.temaKokurikuler}
                            onChange={e => setFormData({
                              ...formData,
                              identitas: { ...formData.identitas, temaKokurikuler: e.target.value }
                            })}
                            className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm"
                            required
                          />
                        )}
                      </div>
                    );
                  })()}
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-semibold text-gray-600 uppercase">Alokasi Waktu & Durasi</label>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-gray-500 font-medium">Tipe:</span>
                      <select
                        value={formData.identitas.tipeAlokasi || 'mingguan'}
                        onChange={e => {
                          const val = e.target.value as 'mingguan' | 'harian';
                          const defaultNum = val === 'harian' ? 12 : 4;
                          setFormData({
                            ...formData,
                            identitas: {
                              ...formData.identitas,
                              tipeAlokasi: val,
                              alokasiWaktu: val === 'harian' ? `${defaultNum} Pertemuan` : `${defaultNum} Minggu`
                            }
                          });
                        }}
                        className="text-xs p-1 bg-white border border-gray-300 rounded font-medium"
                      >
                        <option value="mingguan">Perminggu (Minggu)</option>
                        <option value="harian">Harian (Pertemuan)</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="mb-2">
                    <input 
                      type="text" 
                      value={formData.identitas.alokasiWaktu}
                      onChange={e => {
                        const val = e.target.value;
                        const lower = val.toLowerCase();
                        const detectedTipe = (lower.includes('hari') || lower.includes('pertemuan') || lower.includes('p')) && !lower.includes('jp') && !lower.includes('minggu')
                          ? 'harian'
                          : formData.identitas.tipeAlokasi || 'mingguan';

                        setFormData({
                          ...formData,
                          identitas: {
                            ...formData.identitas,
                            alokasiWaktu: val,
                            tipeAlokasi: detectedTipe
                          }
                        });
                      }}
                      className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm" 
                      placeholder="Contoh: 28 JP (1 Minggu)"
                    />
                  </div>

                  {formData.identitas.alokasiWaktu && (
                    <p className="text-xs text-blue-700 font-medium">
                      {getAlokasiCalculation(formData.identitas.alokasiWaktu, formData.identitas.tipeAlokasi || 'mingguan')} (1 JP = 35 menit)
                    </p>
                  )}
                </div>
                <div>
                  {(() => {
                    const isLintasDisiplin = formData.identitas.bentukKokurikuler === 'Pembelajaran Kolaboratif Lintas Disiplin Ilmu';
                    return (
                      <>
                        <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                          Lintas Disiplin Ilmu {!isLintasDisiplin && <span className="text-gray-400 font-normal">(Tidak Aktif)</span>}
                        </label>
                        <input 
                          type="text" 
                          value={isLintasDisiplin ? formData.identitas.lintasDisiplinIlmu : ''}
                          disabled={!isLintasDisiplin}
                          onChange={e => setFormData({...formData, identitas: {...formData.identitas, lintasDisiplinIlmu: e.target.value}})}
                          className={`w-full p-2.5 border rounded-lg text-sm ${!isLintasDisiplin ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200' : 'bg-white border-gray-300'}`} 
                          placeholder={isLintasDisiplin ? "Contoh: IPA, Bahasa Indonesia" : "Hanya aktif untuk Pembelajaran Kolaboratif Lintas Disiplin Ilmu"}
                        />
                      </>
                    );
                  })()}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Lokasi Kegiatan</label>
                  <input 
                    type="text" 
                    value={formData.identitas.lokasiKegiatan || ''}
                    onChange={e => setFormData({...formData, identitas: {...formData.identitas, lokasiKegiatan: e.target.value}})}
                    className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm" 
                    placeholder="di lingkungan satuan pendidikan dan rumah"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Tempat Pengesahan</label>
                  <input 
                    type="text" 
                    value={formData.identitas.tempatPengesahan || ''}
                    onChange={e => setFormData({...formData, identitas: {...formData.identitas, tempatPengesahan: e.target.value}})}
                    className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm" 
                    placeholder="Contoh: Remen"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Tanggal Pengesahan</label>
                  <input 
                    type="date" 
                    value={formData.identitas.tanggalPengesahan || ''}
                    onChange={e => setFormData({...formData, identitas: {...formData.identitas, tanggalPengesahan: e.target.value}})}
                    className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Koordinator Kokurikuler</label>
                  <select
                    value={formData.identitas.penanggungJawab}
                    onChange={e => setFormData({...formData, identitas: {...formData.identitas, penanggungJawab: e.target.value}})}
                    className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">-- Pilih Koordinator Kokurikuler --</option>
                    {teacherList.map(t => (
                      <option key={t.id || t.fullName} value={t.fullName}>
                        {t.fullName} {t.position ? `(${t.position})` : ''} {t.nip ? `- NIP. ${t.nip}` : ''}
                      </option>
                    ))}
                    {formData.identitas.penanggungJawab && !teacherList.some(t => t.fullName === formData.identitas.penanggungJawab) && (
                      <option value={formData.identitas.penanggungJawab}>{formData.identitas.penanggungJawab}</option>
                    )}
                  </select>
                </div>
              </div>
            </section>

            {/* Section 2: Pemanfaatan Digital & Kemitraan */}
            <section className="bg-gray-50 p-6 rounded-xl border border-gray-100">
              <h3 className="font-bold text-lg text-blue-900 mb-4 flex items-center gap-2">
                <span className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">2</span>
                Pemanfaatan Digital & Kemitraan Pembelajaran
              </h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Pemanfaatan Digital</label>
                  <textarea 
                    rows={2}
                    value={formData.pemanfaatanDigital || ''}
                    onChange={e => setFormData({...formData, pemanfaatanDigital: e.target.value})}
                    className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm"
                    placeholder="Deskripsikan pemanfaatan digital..."
                  ></textarea>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">Kemitraan Pembelajaran</label>
                  <div className="space-y-3 bg-white p-4 rounded-xl border border-gray-200">
                    <div>
                      <label className="block text-xs text-gray-600 font-medium mb-1">1. Satuan Pendidikan</label>
                      <input 
                        type="text"
                        value={typeof formData.kemitraan === 'object' && formData.kemitraan ? formData.kemitraan.satuanPendidikan : ''}
                        onChange={e => setFormData({
                          ...formData,
                          kemitraan: typeof formData.kemitraan === 'object' && formData.kemitraan ? {...formData.kemitraan, satuanPendidikan: e.target.value} : { satuanPendidikan: e.target.value, keluarga: '', masyarakat: '' }
                        })}
                        className="w-full p-2 bg-gray-50 border border-gray-200 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 font-medium mb-1">2. Keluarga</label>
                      <input 
                        type="text"
                        value={typeof formData.kemitraan === 'object' && formData.kemitraan ? formData.kemitraan.keluarga : ''}
                        onChange={e => setFormData({
                          ...formData,
                          kemitraan: typeof formData.kemitraan === 'object' && formData.kemitraan ? {...formData.kemitraan, keluarga: e.target.value} : { satuanPendidikan: '', keluarga: e.target.value, masyarakat: '' }
                        })}
                        className="w-full p-2 bg-gray-50 border border-gray-200 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 font-medium mb-1">3. Masyarakat</label>
                      <input 
                        type="text"
                        value={typeof formData.kemitraan === 'object' && formData.kemitraan ? formData.kemitraan.masyarakat : ''}
                        onChange={e => setFormData({
                          ...formData,
                          kemitraan: typeof formData.kemitraan === 'object' && formData.kemitraan ? {...formData.kemitraan, masyarakat: e.target.value} : { satuanPendidikan: '', keluarga: '', masyarakat: e.target.value }
                        })}
                        className="w-full p-2 bg-gray-50 border border-gray-200 rounded text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3: Dimensi Profil Lulusan */}
            <section className="bg-gray-50 p-6 rounded-xl border border-gray-100">
              <h3 className="font-bold text-lg text-blue-900 mb-2 flex items-center gap-2">
                <span className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">3</span>
                Dimensi Profil Lulusan yang Dikuatkan (Pilih 1–3 Dimensi Utama)
              </h3>
              <div className="space-y-3 mt-4">
                {formData.dimensiProfil.map((dim, idx) => (
                  <div key={idx} className="flex gap-3 items-center">
                    <select
                      value={dim.dimensi}
                      onChange={e => {
                        const newDims = [...formData.dimensiProfil];
                        newDims[idx].dimensi = e.target.value;
                        setFormData({...formData, dimensiProfil: newDims});
                      }}
                      className="p-2.5 bg-white border border-gray-300 rounded-lg text-sm w-1/3"
                    >
                      <option value="Keimanan dan Ketakwaan">Keimanan dan Ketakwaan</option>
                      <option value="Kewargaan">Kewargaan</option>
                      <option value="Penalaran Kritis">Penalaran Kritis</option>
                      <option value="Kreativitas">Kreativitas</option>
                      <option value="Kolaborasi">Kolaborasi</option>
                      <option value="Kemandirian">Kemandirian</option>
                      <option value="Kesehatan">Kesehatan</option>
                      <option value="Komunikasi">Komunikasi</option>
                    </select>
                    <input 
                      type="text"
                      placeholder="Fokus pengembangan dimensi..."
                      value={dim.fokus}
                      onChange={e => {
                        const newDims = [...formData.dimensiProfil];
                        newDims[idx].fokus = e.target.value;
                        setFormData({...formData, dimensiProfil: newDims});
                      }}
                      className="flex-1 p-2.5 bg-white border border-gray-300 rounded-lg text-sm"
                    />
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, dimensiProfil: formData.dimensiProfil.filter((_, i) => i !== idx)})}
                      className="text-red-500 hover:text-red-700 p-2"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, dimensiProfil: [...formData.dimensiProfil, { dimensi: 'Kolaborasi', fokus: '' }]})}
                  className="text-sm text-blue-600 font-semibold hover:underline mt-2 inline-flex items-center gap-1"
                >
                  <Plus size={16} /> Tambah Dimensi Profil
                </button>
              </div>
            </section>

            {/* Section 4: Tujuan & Kegiatan */}
            <section className="bg-gray-50 p-6 rounded-xl border border-gray-100">
              <h3 className="font-bold text-lg text-blue-900 mb-4 flex items-center gap-2">
                <span className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">4</span>
                Tujuan Pembelajaran & Alur Aktivitas
              </h3>
              
              <div className="mb-6">
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">Tujuan Pembelajaran</label>
                {formData.tujuanPembelajaran.map((tp, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <input 
                      type="text"
                      value={tp}
                      onChange={e => {
                        const newTps = [...formData.tujuanPembelajaran];
                        newTps[idx] = e.target.value;
                        setFormData({...formData, tujuanPembelajaran: newTps});
                      }}
                      className="flex-1 p-2.5 bg-white border border-gray-300 rounded-lg text-sm"
                      placeholder="Peserta didik mampu..."
                    />
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, tujuanPembelajaran: formData.tujuanPembelajaran.filter((_, i) => i !== idx)})}
                      className="text-red-500 p-2"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, tujuanPembelajaran: [...formData.tujuanPembelajaran, '']})}
                  className="text-sm text-blue-600 font-semibold hover:underline inline-flex items-center gap-1"
                >
                  <Plus size={16} /> Tambah Tujuan Pembelajaran
                </button>
              </div>

              <div>
                {(() => {
                  const isHarian = formData.identitas.tipeAlokasi === 'harian';
                  const unitLabel = isHarian ? 'Pertemuan Ke-' : 'Minggu Ke-';
                  const alokasiStr = formData.identitas.alokasiWaktu || '';
                  const numMatch = alokasiStr.match(/\d+/);
                  const num = numMatch ? parseInt(numMatch[0], 10) : 4;
                  const upper = alokasiStr.toUpperCase();
                  const jp = upper.includes('JP') || (!upper.includes('MINGGU') && !upper.includes('PERTEMUAN') && !upper.includes('P')) ? num : (upper.includes('MINGGU') ? num * 7 : num * 2);
                  const totalUnits = isHarian ? Math.max(1, Math.round(jp / 2)) : Math.max(1, Math.round(jp / 7));
                  const itemsPerGroup = 3;
                  const targetLen = totalUnits * itemsPerGroup;
                  let currentKegs = [...formData.kegiatan];
                  while (currentKegs.length < targetLen) {
                    currentKegs.push('');
                  }
                  if (currentKegs.length > targetLen) {
                    currentKegs = currentKegs.slice(0, targetLen);
                  }
                  const groups = [];
                  for (let i = 0; i < currentKegs.length; i += itemsPerGroup) {
                    groups.push({
                      groupStartIdx: i,
                      groupNumber: Math.floor(i / itemsPerGroup) + 1,
                      activities: currentKegs.slice(i, i + itemsPerGroup)
                    });
                  }

                  const themeColors = [
                    'bg-blue-100 text-blue-800 border-blue-200',
                    'bg-emerald-100 text-emerald-800 border-emerald-200',
                    'bg-amber-100 text-amber-800 border-amber-200',
                    'bg-purple-100 text-purple-800 border-purple-200',
                  ];

                  return (
                    <>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-xs font-semibold text-gray-600 uppercase">
                          Langkah-Langkah / Kegiatan Pembelajaran (Berdasarkan {isHarian ? 'Pertemuan' : 'Minggu'})
                        </label>
                        <div className="flex items-center gap-2">
                          <button onClick={downloadTemplate} className="text-gray-500 hover:text-blue-600 p-1" title="Unduh Template Excel"><FileDown size={18}/></button>
                          <label className="cursor-pointer text-gray-500 hover:text-blue-600 p-1" title="Upload Excel">
                            <Upload size={18}/>
                            <input type="file" onChange={handleFileUpload} className="hidden" accept=".xlsx,.xls"/>
                          </label>
                          <button onClick={exportToExcel} className="text-gray-500 hover:text-blue-600 p-1" title="Ekspor ke Excel"><Download size={18}/></button>
                          <span className="text-xs bg-sky-50 text-sky-800 px-2 py-0.5 rounded font-medium border border-sky-200 ml-2">
                            Mode: {isHarian ? 'Harian (Pertemuan Ke-)' : 'Perminggu (Minggu Ke-)'}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-4">
                        {groups.map((group, gIdx) => {
                          const colorClass = themeColors[gIdx % themeColors.length];
                          return (
                            <div key={gIdx} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm space-y-3">
                              <div className="flex justify-between items-center">
                                <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold border ${colorClass}`}>
                                  {unitLabel}{group.groupNumber}
                                </span>
                                {groups.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newKegs = formData.kegiatan.filter((_, idx) => idx < group.groupStartIdx || idx >= group.groupStartIdx + itemsPerGroup);
                                      setFormData({...formData, kegiatan: newKegs});
                                    }}
                                    className="text-red-500 hover:text-red-700 text-xs font-semibold flex items-center gap-1"
                                  >
                                    <Trash2 size={14} /> Hapus {isHarian ? 'Pertemuan' : 'Minggu'} Ini
                                  </button>
                                )}
                              </div>
                              <div className="space-y-2">
                                {group.activities.map((keg, aIdx) => {
                                  const globalIdx = group.groupStartIdx + aIdx;
                                  return (
                                    <div key={globalIdx} className="flex gap-2 items-center">
                                      <span className="text-xs font-bold text-gray-500 w-6 text-center">{aIdx + 1}.</span>
                                      <textarea 
                                        rows={2}
                                        value={keg}
                                        onChange={e => {
                                          const newKegs = [...formData.kegiatan];
                                          newKegs[globalIdx] = e.target.value;
                                          setFormData({...formData, kegiatan: newKegs});
                                        }}
                                        className="flex-1 p-2.5 bg-white border border-gray-300 rounded-lg text-sm"
                                        placeholder={`Aktivitas ${isHarian ? 'pertemuan' : 'minggu'} ke-${group.groupNumber}...`}
                                      />
                                      <button 
                                        type="button"
                                        onClick={() => {
                                          const newKegs = formData.kegiatan.filter((_, idx) => idx !== globalIdx);
                                          setFormData({...formData, kegiatan: newKegs});
                                        }}
                                        className="text-red-500 p-2"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const newKegs = [...formData.kegiatan];
                                  newKegs.splice(group.groupStartIdx + group.activities.length, 0, '');
                                  setFormData({...formData, kegiatan: newKegs});
                                }}
                                className="text-xs text-blue-600 font-semibold hover:underline inline-flex items-center gap-1 mt-1"
                              >
                                <Plus size={14} /> Tambah Aktivitas di {unitLabel}{group.groupNumber}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                      <button 
                        type="button"
                        onClick={() => {
                          setFormData({...formData, kegiatan: [...formData.kegiatan, '', '', '', '']});
                        }}
                        className="mt-4 text-sm bg-blue-50 text-blue-700 border border-blue-200 px-4 py-2 rounded-xl font-semibold hover:bg-blue-100 transition inline-flex items-center gap-2"
                      >
                        <Plus size={16} /> Tambah {isHarian ? 'Pertemuan' : 'Minggu'} Baru ({unitLabel}{Math.floor(formData.kegiatan.length / 4) + 1})
                      </button>
                    </>
                  );
                })()}
              </div>
            </section>

            {/* Section 5: Asesmen & Produk */}
            <section className="bg-gray-50 p-6 rounded-xl border border-gray-100">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <h3 className="font-bold text-lg text-blue-900 flex items-center gap-2">
                  <span className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">5</span>
                  Asesmen & Produk Akhir
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Asesmen Formatif</label>
                  <textarea 
                    rows={3}
                    value={formData.asesmen.formatif}
                    onChange={e => setFormData({...formData, asesmen: {...formData.asesmen, formatif: e.target.value}})}
                    className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm"
                    placeholder="Deskripsi penilaian formatif..."
                  ></textarea>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Asesmen Sumatif</label>
                  <textarea 
                    rows={3}
                    value={formData.asesmen.sumatif}
                    onChange={e => setFormData({...formData, asesmen: {...formData.asesmen, sumatif: e.target.value}})}
                    className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm"
                    placeholder="Deskripsi penilaian sumatif..."
                  ></textarea>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">Produk Akhir / Luaran Proyek</label>
                {(formData.produk || ['']).map((prod, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <input 
                      type="text"
                      value={prod}
                      onChange={e => {
                        const newProd = [...(formData.produk || [''])];
                        newProd[idx] = e.target.value;
                        setFormData({...formData, produk: newProd});
                      }}
                      className="flex-1 p-2 bg-white border border-gray-300 rounded-lg text-sm"
                      placeholder="Contoh: Karya Solusi Daur Ulang / Laporan Proyek"
                    />
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, produk: (formData.produk || ['']).filter((_, i) => i !== idx)})}
                      className="text-red-500 hover:text-red-700 p-2"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, produk: [...(formData.produk || []), '']})}
                  className="text-xs text-blue-600 font-semibold hover:underline mt-1 inline-flex items-center gap-1"
                >
                  <Plus size={14} /> Tambah Produk Akhir
                </button>
              </div>
            </section>

            <div className="flex justify-end gap-4 pt-4 border-t">
              <button 
                type="button" 
                onClick={() => setView('list')} 
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium"
              >
                Batal
              </button>
              <button 
                type="submit" 
                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold shadow-sm"
              >
                Simpan Dokumen RPK
              </button>
            </div>
          </form>
        </div>
      )}

      {view === 'detail' && selectedPlan && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-4xl mx-auto print:shadow-none">
          <div className="flex justify-between items-center mb-6 pb-4 border-b print:hidden">
            <button 
              onClick={() => setView('list')}
              className="flex items-center gap-1 text-gray-600 hover:text-gray-900 font-medium"
            >
              <ArrowLeft size={18} /> Kembali ke Daftar
            </button>
            <button 
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition"
            >
              <Printer size={18} /> Cetak / Ekspor PDF
            </button>
          </div>

          <div className="space-y-6 text-gray-900">
            <div className="text-center border-b pb-6 space-y-2">
              <h2 className="text-2xl font-bold uppercase tracking-wide text-blue-900">Rencana Pembelajaran Kokurikuler (RPK)</h2>
              <div className="flex flex-col items-center gap-1.5 mt-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-900 text-xs font-bold rounded-full uppercase tracking-wider border border-blue-200">
                  {selectedPlan.identitas.bentukKokurikuler || 'Gerakan 7 Kebiasaan Anak Indonesia Hebat (7KAIH)'}
                </span>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-900 text-xs font-bold rounded-full uppercase tracking-wider border border-emerald-200">
                  Tema: {selectedPlan.identitas.temaKokurikuler || '-'}
                </span>
              </div>
            </div>

            {/* Identitas Table */}
            <table className="w-full border-collapse border border-gray-300 text-sm">
              <tbody>
                <tr>
                  <td className="p-3 bg-gray-50 font-semibold border border-gray-300 w-1/3">Nama satuan pendidikan</td>
                  <td className="p-3 border border-gray-300">: {selectedPlan.identitas.satuanPendidikan}</td>
                </tr>
                <tr>
                  <td className="p-3 bg-gray-50 font-semibold border border-gray-300">Kelas/Fase</td>
                  <td className="p-3 border border-gray-300">: {selectedPlan.identitas.jenjangKelas}</td>
                </tr>
                <tr>
                  <td className="p-3 bg-gray-50 font-semibold border border-gray-300">Tahun Ajaran/Semester</td>
                  <td className="p-3 border border-gray-300">: {selectedPlan.identitas.tahunAjaran || schoolProfile?.year || '2025/2026'} / {selectedPlan.identitas.semester}</td>
                </tr>
                <tr>
                  <td className="p-3 bg-gray-50 font-semibold border border-gray-300">Tema</td>
                  <td className="p-3 border border-gray-300">: {selectedPlan.identitas.temaKokurikuler}</td>
                </tr>
                <tr>
                  <td className="p-3 bg-gray-50 font-semibold border border-gray-300">Alokasi Waktu</td>
                  <td className="p-3 border border-gray-300">
                    : {selectedPlan.identitas.alokasiWaktu} {getAlokasiCalculation(selectedPlan.identitas.alokasiWaktu, selectedPlan.identitas.tipeAlokasi)}
                  </td>
                </tr>
                <tr>
                  <td className="p-3 bg-gray-50 font-semibold border border-gray-300">Lokasi Kegiatan</td>
                  <td className="p-3 border border-gray-300">: {selectedPlan.identitas.lokasiKegiatan || 'di lingkungan satuan pendidikan dan rumah'}</td>
                </tr>
              </tbody>
            </table>

            {/* A. Dimensi Profil Lulusan */}
            <div>
              <h3 className="font-bold text-base text-blue-900 mb-1">A. Dimensi Profil Lulusan</h3>
              <ol className="list-decimal pl-6 space-y-2 text-gray-800">
                {selectedPlan.dimensiProfil && selectedPlan.dimensiProfil.length > 0 ? (
                  selectedPlan.dimensiProfil.map((d, idx) => (
                    <li key={idx} className="space-y-0.5">
                      <div className="font-semibold text-gray-900">{d.dimensi}</div>
                      {d.fokus && <div className="text-gray-700 text-sm">{d.fokus}</div>}
                    </li>
                  ))
                ) : (
                  <li>Kesehatan dan Penalaran Kritis</li>
                )}
              </ol>
            </div>

            {/* B. Tujuan Pembelajaran */}
            <div>
              <h3 className="font-bold text-base text-blue-900 mb-1">B. Tujuan Pembelajaran</h3>
              <p className="text-gray-800 mb-2 pl-4">Kegiatan kokurikuler ini bertujuan untuk menguatkan kompetensi:</p>
              <ol className="list-decimal pl-6 space-y-1">
                {selectedPlan.tujuanPembelajaran.map((tp, idx) => (
                  <li key={idx}>{tp}</li>
                ))}
              </ol>
            </div>

            {/* C. Praktik Pedagogis */}
            <div>
              <h3 className="font-bold text-base text-blue-900 mb-1">C. Praktik Pedagogis</h3>
              <p className="text-gray-800 pl-4">{selectedPlan.praktikPedagogis}</p>
            </div>

            {/* D. Lingkungan pembelajaran */}
            <div>
              <h3 className="font-bold text-base text-blue-900 mb-1">D. Lingkungan pembelajaran</h3>
              <p className="text-gray-800 pl-4">{selectedPlan.lingkunganPembelajaran}</p>
            </div>

            {/* E. Pemanfaatan Digital */}
            <div>
              <h3 className="font-bold text-base text-blue-900 mb-1">E. Pemanfaatan Digital</h3>
              <p className="text-gray-800 pl-4">{selectedPlan.pemanfaatanDigital || 'Video pembelajaran tentang pengaruh kebiasaan tidur terhadap kesehatan, pengumpulan data dari sumber digital tentang pentingnya tidur cukup dan bangun pagi oleh murid'}</p>
            </div>

            {/* F. Kemitraan Pembelajaran */}
            <div>
              <h3 className="font-bold text-base text-blue-900 mb-1">F. Kemitraan Pembelajaran</h3>
              <ol className="list-decimal pl-6 space-y-1">
                <li>Satuan Pendidikan: {typeof selectedPlan.kemitraan === 'object' ? selectedPlan.kemitraan.satuanPendidikan : selectedPlan.kemitraan}</li>
                <li>Keluarga: {typeof selectedPlan.kemitraan === 'object' ? selectedPlan.kemitraan.keluarga : 'menggiatkan anak untuk pembiasaan bangun pagi dan tidur cepat.'}</li>
                <li>Masyarakat: {typeof selectedPlan.kemitraan === 'object' ? selectedPlan.kemitraan.masyarakat : 'tokoh masyarakat dan tokoh agama, memberikan inspirasi pentingnya kebiasaan bangun pagi dan tidur cepat bagi anak-anak.'}</li>
              </ol>
            </div>

            {/* G. Kegiatan */}
            <div>
              {(() => {
                const isHarian = selectedPlan.identitas.tipeAlokasi === 'harian';
                const unitLabel = isHarian ? 'Pertemuan Ke-' : 'Minggu Ke-';
                const alokasiStr = selectedPlan.identitas.alokasiWaktu || '';
                const numMatch = alokasiStr.match(/\d+/);
                const num = numMatch ? parseInt(numMatch[0], 10) : 4;
                const upper = alokasiStr.toUpperCase();
                const jp = upper.includes('JP') || (!upper.includes('MINGGU') && !upper.includes('PERTEMUAN') && !upper.includes('P')) ? num : (upper.includes('MINGGU') ? num * 7 : num * 2);
                const totalUnits = isHarian ? Math.max(1, Math.round(jp / 2)) : Math.max(1, Math.round(jp / 7));
                const itemsPerGroup = 3;
                const currentKegs = [...selectedPlan.kegiatan];
                while (currentKegs.length < totalUnits * itemsPerGroup) {
                  currentKegs.push('Aktivitas pembelajaran...');
                }
                const groups = [];
                for (let i = 0; i < totalUnits * itemsPerGroup; i += itemsPerGroup) {
                  groups.push({
                    groupNumber: Math.floor(i / itemsPerGroup) + 1,
                    activities: currentKegs.slice(i, i + itemsPerGroup)
                  });
                }

                const themeColors = [
                  'bg-blue-100 text-blue-800 border-blue-200',
                  'bg-emerald-100 text-emerald-800 border-emerald-200',
                  'bg-amber-100 text-amber-800 border-amber-200',
                  'bg-purple-100 text-purple-800 border-purple-200',
                  'bg-rose-100 text-rose-800 border-rose-200',
                  'bg-indigo-100 text-indigo-800 border-indigo-200',
                ];

                return (
                  <>
                    <h3 className="font-bold text-base text-blue-900 mb-3">
                      G. Kegiatan (Alur Aktivitas {isHarian ? 'Harian / Pertemuan' : 'Mingguan'})
                    </h3>
                    <div className="space-y-4">
                      {groups.map((group, gIdx) => {
                        const colorClass = themeColors[gIdx % themeColors.length];
                        return (
                          <div key={gIdx} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                            <div className="mb-3">
                              <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold border ${colorClass} shadow-sm`}>
                                {unitLabel}{group.groupNumber}
                              </span>
                            </div>
                            <ol className="list-decimal pl-5 space-y-2 text-sm text-gray-800">
                              {group.activities.map((keg, aIdx) => (
                                <li key={aIdx} className="whitespace-pre-line leading-relaxed">
                                  {typeof keg === 'string' ? keg : String(keg)}
                                </li>
                              ))}
                            </ol>
                          </div>
                        );
                      })}
                    </div>
                  </>
                );
              })()}
            </div>

            {/* H. Asesmen */}
            <div>
              <h3 className="font-bold text-base text-blue-900 mb-2">H. Asesmen & Produk Akhir</h3>
              <div className="space-y-4">
                <div>
                  <p className="font-semibold text-gray-800 mb-1 text-xs uppercase text-blue-800">1. Asesmen Formatif:</p>
                  <p className="text-sm text-gray-700 bg-blue-50/50 p-3 rounded-lg border border-blue-100 mb-3">{selectedPlan.asesmen.formatif}</p>
                  
                  <table className="w-full border-collapse border border-gray-300 text-xs mt-3">
                    <thead>
                      <tr className="bg-sky-100 text-gray-800 text-center">
                        <th className="border border-gray-300 p-2 w-1/4" rowSpan={2}>Nama Murid</th>
                        <th className="border border-gray-300 p-2" colSpan={2}>Perkembangan {selectedPlan.identitas.temaKokurikuler}</th>
                        <th className="border border-gray-300 p-2 w-1/3" rowSpan={2}>Catatan Guru / Observasi</th>
                      </tr>
                      <tr className="bg-sky-100 text-gray-800 text-center">
                        <th className="border border-gray-300 p-2">Belum Terbiasa / Berkembang</th>
                        <th className="border border-gray-300 p-2">Sudah Terbiasa / Membudaya</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-300 p-4 h-12 text-gray-400 italic">Contoh: Nama Siswa 1</td>
                        <td className="border border-gray-300 p-4"></td>
                        <td className="border border-gray-300 p-4">✓</td>
                        <td className="border border-gray-300 p-4">Menunjukkan keaktifan dan antusias tinggi</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 p-4 h-12 text-gray-400 italic">Contoh: Nama Siswa 2</td>
                        <td className="border border-gray-300 p-4">✓</td>
                        <td className="border border-gray-300 p-4"></td>
                        <td className="border border-gray-300 p-4">Perlu pendampingan dan motivasi tambahan</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div>
                  <p className="font-semibold text-gray-800 mb-1 text-xs uppercase text-blue-800">2. Asesmen Sumatif & Rubrik Kinerja:</p>
                  <p className="text-sm text-gray-700 bg-blue-50/50 p-3 rounded-lg border border-blue-100 mb-3">{selectedPlan.asesmen.sumatif}</p>
                  
                  <table className="w-full border-collapse border border-gray-300 text-xs mt-3">
                    <thead>
                      <tr className="bg-sky-100 text-gray-800 text-center">
                        <th className="border border-gray-300 p-2">Dimensi Profil Lulusan</th>
                        <th className="border border-gray-300 p-2">Aspek yang Dinilai ({selectedPlan.identitas.temaKokurikuler})</th>
                        <th className="border border-gray-300 p-2">Sangat Baik</th>
                        <th className="border border-gray-300 p-2">Baik</th>
                        <th className="border border-gray-300 p-2">Cukup</th>
                        <th className="border border-gray-300 p-2">Kurang</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPlan.dimensiProfil && selectedPlan.dimensiProfil.length > 0 ? (
                        selectedPlan.dimensiProfil.map((dim, dIdx) => {
                          const fokusAspek = dim.fokus || selectedPlan.tujuanPembelajaran[0] || selectedPlan.identitas.temaKokurikuler;
                          return (
                            <tr key={dIdx}>
                              <td className="border border-gray-300 p-2 font-medium">{dim.dimensi}</td>
                              <td className="border border-gray-300 p-2">{fokusAspek}</td>
                              <td className="border border-gray-300 p-2">Sangat konsisten dan mahir dalam {fokusAspek.toLowerCase()}</td>
                              <td className="border border-gray-300 p-2">Konsisten dan baik dalam {fokusAspek.toLowerCase()}</td>
                              <td className="border border-gray-300 p-2">Cukup menunjukkan pemahaman dalam {fokusAspek.toLowerCase()}</td>
                              <td className="border border-gray-300 p-2">Perlu bimbingan intensif dalam {fokusAspek.toLowerCase()}</td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td className="border border-gray-300 p-2 font-medium">Penguatan Profil</td>
                          <td className="border border-gray-300 p-2">{selectedPlan.tujuanPembelajaran[0] || selectedPlan.identitas.temaKokurikuler}</td>
                          <td className="border border-gray-300 p-2">Sangat baik</td>
                          <td className="border border-gray-300 p-2">Baik</td>
                          <td className="border border-gray-300 p-2">Cukup</td>
                          <td className="border border-gray-300 p-2">Kurang</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {selectedPlan.produk && selectedPlan.produk.length > 0 && (
                  <div>
                    <p className="font-semibold text-gray-800 mb-1 text-xs uppercase text-blue-800">3. Produk Akhir / Luaran Proyek:</p>
                    <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1 bg-gray-50 p-3 rounded-lg border border-gray-200">
                      {selectedPlan.produk.map((prod, idx) => (
                        <li key={idx}>{prod}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Tanda Tangan / Signature Section */}
            <div className="mt-12 pt-6 border-t border-gray-200 grid grid-cols-2 text-sm text-gray-900 page-break-inside-avoid">
              <div className="text-center px-4">
                <p className="font-medium">Mengetahui,</p>
                <p className="font-medium">Kepala {schoolProfile?.name || selectedPlan.identitas.satuanPendidikan || 'Satuan Pendidikan'}</p>
                <div className="h-20 flex items-center justify-center my-2">
                  {schoolProfile?.headmasterSignature ? (
                    <img src={schoolProfile.headmasterSignature} alt="Tanda Tangan Kepala Sekolah" className="h-16 object-contain mx-auto" />
                  ) : (
                    <div className="h-16"></div>
                  )}
                </div>
                <p className="font-bold underline">{schoolProfile?.headmaster || '........................................'}</p>
                <p>NIP. {schoolProfile?.headmasterNip || '........................................'}</p>
              </div>
              <div className="text-center px-4">
                <p className="font-medium">
                  {selectedPlan.identitas.tempatPengesahan || schoolProfile?.address?.split(',')[0] || 'Remen'}, {
                    selectedPlan.identitas.tanggalPengesahan 
                      ? new Date(selectedPlan.identitas.tanggalPengesahan).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                      : new Date(selectedPlan.createdAt || Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                  }
                </p>
                <p className="font-medium">Koordinator Kokurikuler</p>
                <div className="h-20 flex items-center justify-center my-2">
                  {teacherProfile?.signature ? (
                    <img src={teacherProfile.signature} alt="Tanda Tangan Guru" className="h-16 object-contain mx-auto" />
                  ) : currentUser?.signature ? (
                    <img src={currentUser.signature} alt="Tanda Tangan Guru" className="h-16 object-contain mx-auto" />
                  ) : (
                    <div className="h-16"></div>
                  )}
                </div>
                <p className="font-bold underline">{selectedPlan.identitas.penanggungJawab || teacherProfile?.fullName || currentUser?.fullName || '........................................'}</p>
                <p>NIP. {teacherProfile?.nip || currentUser?.nip || '........................................'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
