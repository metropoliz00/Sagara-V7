import React, { useState, useMemo } from 'react';
import { 
  ClipboardList, 
  User, 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  ChevronRight, 
  Save, 
  ArrowLeft,
  Search,
  Star,
  FileText,
  TrendingUp,
  Award,
  Eye,
  X,
  Edit2,
  EyeOff
} from 'lucide-react';
import { User as UserType, PerformanceAssessment, GtkRecord, SchoolProfileData } from '../types';

interface PerformanceAssessmentViewProps {
  currentUser: UserType | null;
  users: UserType[];
  gtkData: GtkRecord[];
  assessments: PerformanceAssessment[];
  onSaveAssessment: (assessment: PerformanceAssessment) => Promise<void>;
  schoolProfile?: SchoolProfileData;
}

const PERFORMANCE_INDICATORS = [
  { id: 1, aspect: 'A. Perencanaan Pembelajaran', indicator: 'Analisis Kurikulum', description: 'Menyusun tujuan pembelajaran sesuai CP/TP/ATP atau kurikulum yang berlaku.' },
  { id: 2, aspect: 'A. Perencanaan Pembelajaran', indicator: 'Perangkat Pembelajaran', description: 'Menyusun modul ajar/RPP secara lengkap dan sistematis.' },
  { id: 3, aspect: 'A. Perencanaan Pembelajaran', indicator: 'Materi Pembelajaran', description: 'Menentukan materi yang relevan dengan tujuan pembelajaran.' },
  { id: 4, aspect: 'A. Perencanaan Pembelajaran', indicator: 'Strategi Pembelajaran', description: 'Memilih model, metode, dan pendekatan yang sesuai karakteristik peserta didik.' },
  { id: 5, aspect: 'A. Perencanaan Pembelajaran', indicator: 'Media Pembelajaran', description: 'Menyiapkan media dan sumber belajar yang mendukung pembelajaran.' },
  { id: 6, aspect: 'A. Perencanaan Pembelajaran', indicator: 'Penilaian', description: 'Merancang asesmen diagnostik, formatif, dan sumatif sesuai tujuan pembelajaran.' },
  
  { id: 7, aspect: 'B. Pelaksanaan Pembelajaran', indicator: 'Kegiatan Pendahuluan', description: 'Membuka pembelajaran dengan apersepsi dan motivasi belajar.' },
  { id: 8, aspect: 'B. Pelaksanaan Pembelajaran', indicator: 'Penguasaan Materi', description: 'Menguasai materi dan menjelaskan dengan benar serta runtut.' },
  { id: 9, aspect: 'B. Pelaksanaan Pembelajaran', indicator: 'Keterkaitan Materi', description: 'Menghubungkan materi dengan kehidupan nyata dan pengetahuan sebelumnya.' },
  { id: 10, aspect: 'B. Pelaksanaan Pembelajaran', indicator: 'Strategi Mengajar', description: 'Menggunakan metode yang bervariasi dan berpusat pada peserta didik.' },
  { id: 11, aspect: 'B. Pelaksanaan Pembelajaran', indicator: 'Pengelolaan Kelas', description: 'Menciptakan suasana belajar yang kondusif, aman, dan menyenangkan.' },
  { id: 12, aspect: 'B. Pelaksanaan Pembelajaran', indicator: 'Aktivitas Peserta Didik', description: 'Mendorong keaktifan, kolaborasi, komunikasi, kreativitas, dan berpikir kritis siswa.' },
  { id: 13, aspect: 'B. Pelaksanaan Pembelajaran', indicator: 'Pemanfaatan Media', description: 'Menggunakan media pembelajaran secara efektif.' },
  { id: 14, aspect: 'B. Pelaksanaan Pembelajaran', indicator: 'Pemanfaatan Teknologi', description: 'Mengintegrasikan TIK dalam pembelajaran bila diperlukan.' },
  { id: 15, aspect: 'B. Pelaksanaan Pembelajaran', indicator: 'Komunikasi', description: 'Menggunakan bahasa yang santun, jelas, dan mudah dipahami.' },
  
  { id: 16, aspect: 'C. Penilaian Pembelajaran', indicator: 'Asesmen Proses', description: 'Melaksanakan asesmen selama proses pembelajaran berlangsung.' },
  { id: 17, aspect: 'C. Penilaian Pembelajaran', indicator: 'Asesmen Hasil', description: 'Melaksanakan penilaian sesuai indikator pencapaian tujuan pembelajaran.' },
  { id: 18, aspect: 'C. Penilaian Pembelajaran', indicator: 'Umpan Balik', description: 'Memberikan umpan balik yang membangun kepada peserta didik.' },
  { id: 19, aspect: 'C. Penilaian Pembelajaran', indicator: 'Tindak Lanjut', description: 'Melaksanakan remedial dan pengayaan berdasarkan hasil asesmen.' },
  
  { id: 20, aspect: 'D. Penutup Pembelajaran', indicator: 'Refleksi', description: 'Memfasilitasi peserta didik melakukan refleksi pembelajaran.' },
  { id: 21, aspect: 'D. Penutup Pembelajaran', indicator: 'Rangkuman', description: 'Membimbing siswa menyimpulkan materi pembelajaran.' },
  { id: 22, aspect: 'D. Penutup Pembelajaran', indicator: 'Penugasan', description: 'Memberikan tindak lanjut berupa tugas atau kegiatan lanjutan yang bermakna.' },
  
  { id: 23, aspect: 'E. Kompetensi Profesional', indicator: 'Pengembangan Diri', description: 'Mengikuti pelatihan, workshop, KKG/MGMP, atau kegiatan pengembangan profesi.' },
  { id: 24, aspect: 'E. Kompetensi Profesional', indicator: 'Inovasi Pembelajaran', description: 'Mengembangkan media, metode, atau inovasi pembelajaran.' },
  { id: 25, aspect: 'E. Kompetensi Profesional', indicator: 'Refleksi Profesional', description: 'Melakukan evaluasi dan perbaikan pembelajaran secara berkelanjutan.' },
  
  { id: 26, aspect: 'F. Kompetensi Sosial dan Kepribadian', indicator: 'Keteladanan', description: 'Menunjukkan sikap disiplin, jujur, bertanggung jawab, dan menjadi teladan.' },
  { id: 27, aspect: 'F. Kompetensi Sosial dan Kepribadian', indicator: 'Komunikasi', description: 'Berkomunikasi baik dengan peserta didik, rekan kerja, orang tua, dan masyarakat.' },
  { id: 28, aspect: 'F. Kompetensi Sosial dan Kepribadian', indicator: 'Etika Profesi', description: 'Mematuhi kode etik guru dan peraturan sekolah.' },
  { id: 29, aspect: 'F. Kompetensi Sosial dan Kepribadian', indicator: 'Kerja Sama', description: 'Berpartisipasi aktif dalam kegiatan sekolah dan tim guru.' },
  { id: 30, aspect: 'F. Kompetensi Sosial dan Kepribadian', indicator: 'Komitmen', description: 'Menunjukkan komitmen terhadap peningkatan mutu pendidikan.' },
];

const getCategory = (percentage: number) => {
  if (percentage >= 86) return { label: 'Sangat Baik', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
  if (percentage >= 76) return { label: 'Baik', color: 'bg-blue-100 text-blue-700 border-blue-200' };
  if (percentage >= 56) return { label: 'Cukup', color: 'bg-amber-100 text-amber-700 border-amber-200' };
  return { label: 'Kurang', color: 'bg-red-100 text-red-700 border-red-200' };
};

const PerformanceAssessmentView: React.FC<PerformanceAssessmentViewProps> = ({
  currentUser,
  users,
  gtkData,
  assessments,
  onSaveAssessment,
  schoolProfile
}) => {
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scores, setScores] = useState<Record<number, number>>({});
  const [reflection, setReflection] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [academicYear, setAcademicYear] = useState('');
  const [semester, setSemester] = useState('');
  const [selectedAssessment, setSelectedAssessment] = useState<PerformanceAssessment | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'daftar-guru' | 'rekap-penilaian'>('daftar-guru');
  const [editingAssessmentId, setEditingAssessmentId] = useState<string | null>(null);

  const isPrincipalOrAdmin = currentUser?.role === 'Kepala Sekolah' || currentUser?.role === 'admin';

  // Sinkronkan dengan data GTK dan filter hanya yang role guru
  const teachers = useMemo(() => {
    return gtkData
      .filter(g => {
        const isGuruJabatan = g.jabatan?.toLowerCase().includes('guru');
        const linkedUser = users.find(u => u.id === g.userId || (u.nip && u.nip === g.nip && g.nip !== ''));
        const isGuruRole = linkedUser?.role === 'guru';
        return isGuruJabatan || isGuruRole;
      })
      .sort((a, b) => {
        const statusOrder: Record<string, number> = { 'PNS': 1, 'PPPK': 2, 'Honorer': 3 };
        const statusA = statusOrder[a.statusPegawai] || 4;
        const statusB = statusOrder[b.statusPegawai] || 4;
        
        if (statusA !== statusB) {
          return statusA - statusB;
        }
        
        // If same status, sort by birth date (oldest first, so ascending order of birth date)
        const dateA = new Date(a.tanggalLahir).getTime();
        const dateB = new Date(b.tanggalLahir).getTime();
        return dateA - dateB;
      });
  }, [gtkData, users]);

  const filteredTeachers = teachers.filter(t => 
    t.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.nip && t.nip.includes(searchQuery))
  );

  const getLatestAssessment = (teacherId: string) => {
    const teacherGtk = gtkData.find(g => g.id === teacherId);
    const teacherUser = users.find(u => 
      u.id === teacherGtk?.userId || 
      (u.nip && u.nip === teacherGtk?.nip && teacherGtk?.nip !== '') ||
      (u.fullName && teacherGtk?.nama && u.fullName.toLowerCase() === teacherGtk.nama.toLowerCase())
    );
    const teacherAssessments = assessments.filter(a => 
      a.teacherId === teacherId || 
      (teacherUser && a.teacherId === teacherUser.id)
    );
    if (teacherAssessments.length === 0) return null;
    return teacherAssessments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  };

  const handleStartAssessment = (teacherId: string) => {
    setSelectedTeacherId(teacherId);
    setEditingAssessmentId(null);
    const latest = getLatestAssessment(teacherId);
    if (latest) {
      setScores(latest.scores);
      setReflection(latest.reflection);
    } else {
      setScores({});
      setReflection('');
    }
    // Set strictly to active school profile settings
    setAcademicYear(schoolProfile?.year || '2024/2025');
    setSemester(schoolProfile?.semester || '1');
    setIsFormOpen(true);
    window.scrollTo(0, 0);
  };

  const handleEditAssessment = (assessment: PerformanceAssessment) => {
    const teacherGtk = gtkData.find(g => {
      const teacherUser = users.find(u => u.id === g.userId || (u.nip && u.nip === g.nip && g.nip !== ''));
      return g.id === assessment.teacherId || (teacherUser && teacherUser.id === assessment.teacherId);
    });

    setSelectedTeacherId(teacherGtk?.id || assessment.teacherId);
    setScores(assessment.scores);
    setReflection(assessment.reflection || '');
    setAcademicYear(assessment.academicYear || schoolProfile?.year || '2024/2025');
    setSemester(assessment.semester || schoolProfile?.semester || '1');
    setEditingAssessmentId(assessment.id);
    setIsFormOpen(true);
    window.scrollTo(0, 0);
  };

  const handleToggleVisibility = async (assessment: PerformanceAssessment) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const updated: PerformanceAssessment = {
        ...assessment,
        isVisible: assessment.isVisible === false ? true : false
      };
      await onSaveAssessment(updated);
    } catch (error) {
      console.error("Error toggling visibility:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleScoreChange = (indicatorId: number, score: number) => {
    setScores(prev => ({ ...prev, [indicatorId]: score }));
  };

  const handleSubmit = async () => {
    if (!selectedTeacherId || !currentUser) return;
    
    // Check if all indicators are scored
    const scoredCount = Object.keys(scores).length;
    if (scoredCount < PERFORMANCE_INDICATORS.length) {
      alert(`Mohon isi semua indikator (${scoredCount}/${PERFORMANCE_INDICATORS.length})`);
      return;
    }

    setIsSaving(true);
    try {
      const totalScore = Object.values(scores).reduce((acc, curr) => acc + curr, 0);
      const maxScore = PERFORMANCE_INDICATORS.length * 4;
      const percentage = Math.round((totalScore / maxScore) * 100);
      const category = getCategory(percentage).label;

      const teacher = teachers.find(t => t.id === selectedTeacherId);
      const teacherUser = users.find(u => 
        u.id === teacher?.userId || 
        (u.nip && u.nip === teacher?.nip && teacher?.nip !== '') ||
        (u.fullName && teacher?.nama && u.fullName.toLowerCase() === teacher.nama.toLowerCase())
      );
      const teacherUserId = teacherUser?.id || teacher?.userId;

      const isUuid = (str: string) => {
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
      };

      if (!teacherUserId || !isUuid(teacherUserId)) {
        alert("Guru ini belum memiliki akun pengguna yang terhubung atau ID Akun tidak valid. Hubungi Admin untuk membuat/menghubungkan akun pengguna untuk guru ini terlebih dahulu agar penilaian dapat disimpan.");
        setIsSaving(false);
        return;
      }

      const assessment: PerformanceAssessment = {
        id: editingAssessmentId || `pa-${selectedTeacherId}-${Date.now()}`,
        teacherId: teacherUserId,
        teacherName: teacher?.nama,
        supervisorId: currentUser.id,
        supervisorName: currentUser.fullName,
        date: new Date().toISOString(),
        scores,
        reflection,
        totalScore,
        percentage,
        category,
        academicYear,
        semester,
        isVisible: editingAssessmentId 
          ? (assessments.find(a => a.id === editingAssessmentId)?.isVisible !== false) 
          : true
      };

      await onSaveAssessment(assessment);
      setIsFormOpen(false);
      setSelectedTeacherId(null);
    } catch (error) {
      console.error("Error saving assessment:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const renderDetailModal = () => {
    if (!isDetailModalOpen || !selectedAssessment) return null;
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto" id="pkg-detail-modal">
        {/* Backdrop overlay */}
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-fade-in"
          onClick={() => {
            setIsDetailModalOpen(false);
            setSelectedAssessment(null);
          }}
        ></div>

        {/* Modal Container */}
        <div className="flex min-h-full items-center justify-center p-4 sm:p-6 text-center">
          <div className="relative transform overflow-hidden rounded-3xl bg-white text-left shadow-2xl transition-all w-full max-w-4xl my-8 border border-gray-100 flex flex-col max-h-[90vh] animate-fade-in">
            
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-indigo-600 to-indigo-800 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-6 shrink-0 relative pr-14 md:pr-24">
              {/* Main Info */}
              <div className="space-y-3 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-500 border border-indigo-400 text-indigo-50">
                    PKG Rincian
                  </span>
                  <span className="text-xs font-bold text-indigo-200">
                    TA {selectedAssessment.academicYear || '2024/2025'} - Semester {selectedAssessment.semester === '1' ? '1 (Ganjil)' : selectedAssessment.semester === '2' ? '2 (Genap)' : selectedAssessment.semester}
                  </span>
                </div>
                
                <h3 className="text-lg md:text-xl font-extrabold flex items-center gap-2 leading-snug">
                  <Award size={20} className="text-amber-300 shrink-0" /> 
                  <span className="break-words">Detail Penilaian Kinerja Guru</span>
                </h3>
                
                <div className="text-indigo-100 text-xs opacity-90 space-y-1">
                  <p className="leading-relaxed break-words">
                    Guru: <span className="font-bold text-white">{selectedAssessment.teacherName}</span>
                  </p>
                  <p className="leading-relaxed break-words">
                    Dinilai oleh: <span className="font-bold text-white">{selectedAssessment.supervisorName}</span>
                    <br />
                    pada {new Date(selectedAssessment.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Score Block */}
              <div className="flex items-center gap-4 shrink-0 border-t border-indigo-500/30 pt-4 md:pt-0 md:border-0">
                <div className="text-left md:text-right">
                  <div className="text-3xl md:text-4xl font-black leading-none">{selectedAssessment.percentage}%</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-200 mt-1">
                    Kategori: {selectedAssessment.category}
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedAssessment(null);
                }}
                className="absolute top-4 right-4 md:top-6 md:right-6 p-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors outline-none focus:ring-2 focus:ring-white/20 cursor-pointer"
                id="close-pkg-detail-modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-8 flex-1">
              {/* Scores by Aspect */}
              <div className="space-y-6">
                <h4 className="font-bold text-gray-800 flex items-center border-b border-gray-100 pb-3">
                  <TrendingUp size={18} className="mr-2 text-indigo-600" /> Rincian Nilai Per Indikator
                </h4>
                
                <div className="space-y-8">
                  {['A', 'B', 'C', 'D', 'E', 'F'].map(aspectKey => {
                    const aspectIndicators = PERFORMANCE_INDICATORS.filter(i => i.aspect.startsWith(aspectKey));
                    
                    return (
                      <div key={aspectKey} className="space-y-4">
                        <h5 className="text-sm font-black text-indigo-600 uppercase tracking-widest flex items-center">
                          <span className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center mr-3 text-xs font-bold">{aspectKey}</span>
                          {aspectIndicators[0].aspect.replace(/^[A-F]\.\s*/, '')}
                        </h5>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {aspectIndicators.map(indicator => {
                            const score = selectedAssessment.scores[indicator.id] || 0;
                            return (
                              <div key={indicator.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex justify-between items-center hover:bg-gray-100/40 transition-colors">
                                <div className="flex-1 mr-4">
                                  <div className="text-sm font-bold text-gray-800 mb-1 leading-snug">{indicator.id}. {indicator.indicator}</div>
                                  <div className="text-xs text-gray-500 leading-relaxed">{indicator.description}</div>
                                </div>
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-xl shrink-0 ${
                                  score === 4 ? 'bg-emerald-500 text-white shadow-md shadow-emerald-100' :
                                  score === 3 ? 'bg-indigo-500 text-white shadow-md shadow-indigo-100' :
                                  score === 2 ? 'bg-amber-500 text-white shadow-md shadow-amber-100' :
                                  'bg-red-500 text-white shadow-md shadow-red-100'
                                }`}>
                                  {score}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reflection Notes */}
              <div className="p-6 rounded-3xl bg-amber-50/70 border border-amber-100">
                <h4 className="font-bold text-amber-800 flex items-center mb-3">
                  <Star size={18} className="mr-2" /> Catatan Refleksi & Masukan Kepala Sekolah
                </h4>
                <p className="text-gray-700 italic leading-relaxed text-sm whitespace-pre-line">
                  {selectedAssessment.reflection || "Tidak ada catatan refleksi tambahan dari penilai."}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 px-6 bg-gray-50 border-t border-gray-100 flex justify-end shrink-0 rounded-b-3xl">
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedAssessment(null);
                }}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-colors cursor-pointer"
              >
                Tutup Rincian
              </button>
            </div>

          </div>
        </div>
      </div>
    );
  };

  if (!currentUser) return null;

  // View for Teacher (GTK matches by NIP or userId if linked)
  if (!isPrincipalOrAdmin) {
    const rawMyAssessments = assessments
      .filter(a => (a.teacherId === currentUser.id || (gtkData.find(g => g.userId === currentUser.id)?.id === a.teacherId)) && a.isVisible !== false)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Filter to keep only the latest assessment per unique academicYear + semester combination
    const seenPeriods = new Set<string>();
    const myAssessments = rawMyAssessments.filter(a => {
      const year = a.academicYear || '2024/2025';
      const sem = a.semester || '1';
      const periodKey = `${year}-${sem}`;
      if (seenPeriods.has(periodKey)) {
        return false;
      }
      seenPeriods.add(periodKey);
      return true;
    });

    return (
      <div className="space-y-6 animate-fade-in pb-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <ClipboardList className="mr-3 text-indigo-600" /> Hasil Penilaian Kinerja
            </h2>
            <p className="text-gray-500 text-sm">Review hasil penilaian terakhir Kepala Sekolah per semester</p>
          </div>
        </div>

        {myAssessments.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border-2 border-dashed border-gray-200 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="text-gray-300" size={40} />
            </div>
            <h3 className="text-lg font-bold text-gray-700">Belum Ada Penilaian</h3>
            <p className="text-gray-500 max-w-xs mx-auto mt-2">
              Kepala Sekolah belum melakukan penilaian kinerja untuk Anda.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myAssessments.map(a => {
              return (
                <div
                  key={a.id}
                  className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center text-xs font-bold text-gray-400 uppercase tracking-wider">
                        <Calendar size={14} className="mr-1.5 text-indigo-500" />
                        {new Date(a.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${getCategory(a.percentage).color}`}>
                        {a.category}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-4xl font-black text-gray-800">{a.percentage}%</span>
                      <span className="text-xs font-bold text-gray-400">Skor PKG</span>
                    </div>

                    <div className="p-4 bg-indigo-50/40 rounded-2xl border border-indigo-100/50 mb-4">
                      <div className="text-xs font-bold text-indigo-600 mb-0.5">Tahun Ajaran & Semester</div>
                      <div className="text-sm font-black text-indigo-900">
                        TA {a.academicYear || '2024/2025'} - Semester {a.semester === '1' ? '1 (Ganjil)' : a.semester === '2' ? '2 (Genap)' : a.semester}
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 mb-6 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                      Penilai: <span className="font-semibold text-gray-700">{a.supervisorName}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedAssessment(a);
                      setIsDetailModalOpen(true);
                    }}
                    className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-2xl transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                  >
                    <Eye size={16} /> Lihat Detail Penilaian
                  </button>
                </div>
              );
            })}
          </div>
        )}
        {renderDetailModal()}
      </div>
    );
  }

  // View for Principal
  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {isFormOpen ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setIsFormOpen(false)}
              className="flex items-center text-sm font-bold text-gray-500 hover:text-indigo-600 transition-colors"
            >
              <ArrowLeft size={18} className="mr-2" /> Kembali ke Daftar
            </button>
            <div className="text-right">
              <h2 className="text-2xl font-bold text-gray-800">{editingAssessmentId ? "Edit Penilaian Kinerja Guru" : "Instrumen PKG"}</h2>
              <p className="text-sm text-gray-500">{editingAssessmentId ? "Mengedit penilaian untuk:" : "Menilai:"} <span className="font-bold text-indigo-600">{teachers.find(t => t.id === selectedTeacherId)?.nama || selectedTeacherId}</span></p>
            </div>
          </div>

          {/* Periode Penilaian Section */}
          <div className="bg-indigo-50/50 rounded-3xl border border-indigo-100/60 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-md shadow-indigo-100">
                <Calendar size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">Periode Penilaian Aktif</h3>
                <p className="text-sm text-gray-500">Otomatis disesuaikan dengan Tahun Ajaran dan Semester pada pengaturan profil sekolah.</p>
              </div>
            </div>
            <div className="bg-white px-6 py-3 rounded-2xl border border-indigo-100 flex items-center gap-2 shadow-sm shrink-0">
              <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Periode:</span>
              <span className="text-base font-black text-indigo-700">
                TA {schoolProfile?.year || '2024/2025'} - Semester {schoolProfile?.semester === '1' ? '1 (Ganjil)' : schoolProfile?.semester === '2' ? '2 (Genap)' : schoolProfile?.semester || '1'}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
            <div className="sticky top-0 z-10 bg-white border-b border-gray-100 p-4 px-6 flex justify-between items-center">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">4: Sangat Baik</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">3: Baik</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">2: Cukup</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">1: Kurang</span>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right mr-4">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Progress</div>
                  <div className="text-sm font-black text-indigo-600">{Object.keys(scores).length} / {PERFORMANCE_INDICATORS.length}</div>
                </div>
              </div>
            </div>

            <div className="p-0">
              {['A', 'B', 'C', 'D', 'E', 'F'].map(aspectKey => {
                const aspectIndicators = PERFORMANCE_INDICATORS.filter(i => i.aspect.startsWith(aspectKey));
                return (
                  <div key={aspectKey} className="border-b border-gray-50 last:border-0">
                    <div className="bg-gray-50/50 p-6 px-8 font-black text-sm text-indigo-600 uppercase tracking-[0.2em]">
                      {aspectIndicators[0].aspect}
                    </div>
                    <div className="divide-y divide-gray-50">
                      {aspectIndicators.map(indicator => (
                        <div key={indicator.id} className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-gray-50/30 transition-colors">
                          <div className="flex-1 max-w-3xl">
                            <h5 className="font-bold text-gray-800 text-lg mb-2">{indicator.id}. {indicator.indicator}</h5>
                            <p className="text-base text-gray-500 leading-relaxed">{indicator.description}</p>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            {[1, 2, 3, 4].map(val => (
                              <button
                                key={val}
                                onClick={() => handleScoreChange(indicator.id, val)}
                                className={`w-14 h-14 rounded-2xl font-black text-xl transition-all ${
                                  scores[indicator.id] === val
                                  ? val === 4 ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' :
                                    val === 3 ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-200' :
                                    val === 2 ? 'bg-amber-500 text-white shadow-lg shadow-amber-200' :
                                    'bg-red-500 text-white shadow-lg shadow-red-200'
                                  : 'bg-white border border-gray-100 text-gray-300 hover:border-gray-300'
                                }`}
                              >
                                {val}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-10 bg-indigo-50/30 border-t border-indigo-100">
               <h4 className="font-bold text-gray-800 mb-6 flex items-center text-lg">
                 <FileText size={22} className="mr-3 text-indigo-600" /> Refleksi & Catatan Supervisor
               </h4>
               <textarea
                 value={reflection}
                 onChange={(e) => setReflection(e.target.value)}
                 placeholder="Tuliskan catatan refleksi, kekuatan, atau area pengembangan guru..."
                 className="w-full h-48 p-6 rounded-3xl border border-indigo-100 focus:ring-8 focus:ring-indigo-100 focus:border-indigo-400 transition-all outline-none text-base resize-none"
               />
            </div>

            {/* Simpan Button at Bottom */}
            <div className="p-8 bg-white border-t border-gray-100 flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={isSaving || Object.keys(scores).length < PERFORMANCE_INDICATORS.length}
                className={`flex items-center px-10 py-4 rounded-2xl font-bold text-lg shadow-2xl transition-all ${
                  isSaving || Object.keys(scores).length < PERFORMANCE_INDICATORS.length
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200 transform hover:-translate-y-1'
                }`}
              >
                {isSaving ? 'Menyimpan...' : (
                  <>
                    <Save size={24} className="mr-3" /> Simpan Penilaian
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <ClipboardList className="mr-3 text-indigo-600" /> Penilaian Kinerja Guru (PKG)
              </h2>
              <p className="text-gray-500 text-sm">Instrumen supervisi akademik dan penilaian kompetensi guru (Data GTK)</p>
            </div>

            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama guru..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-100 focus:ring-4 focus:ring-indigo-100 transition-all outline-none text-sm shadow-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200">
               <div className="flex items-center justify-between mb-4">
                 <div className="p-3 bg-white/20 rounded-2xl"><User size={24}/></div>
                 <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Overview</span>
               </div>
               <h3 className="text-4xl font-black mb-1">{teachers.length}</h3>
               <p className="text-sm font-medium opacity-80">Total Guru (GTK)</p>
            </div>
            
            <div className="bg-emerald-500 rounded-3xl p-6 text-white shadow-xl shadow-emerald-200">
               <div className="flex items-center justify-between mb-4">
                 <div className="p-3 bg-white/20 rounded-2xl"><CheckCircle size={24}/></div>
                 <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Status</span>
               </div>
               <h3 className="text-4xl font-black mb-1">
                 {teachers.filter(t => {
                   const teacherUser = users.find(u => u.id === t.userId || (u.nip && u.nip === t.nip && t.nip !== ''));
                   const currentYear = schoolProfile?.year || '2024/2025';
                   const currentSem = schoolProfile?.semester || '1';
                   return assessments.some(a => 
                     (a.teacherId === t.id || (teacherUser && a.teacherId === teacherUser.id)) &&
                     (a.academicYear === currentYear && a.semester === currentSem)
                   );
                 }).length}
               </h3>
               <p className="text-sm font-medium opacity-80">Sudah Dinilai (Smt Ini)</p>
            </div>

            <div className="bg-amber-500 rounded-3xl p-6 text-white shadow-xl shadow-amber-200">
               <div className="flex items-center justify-between mb-4">
                 <div className="p-3 bg-white/20 rounded-2xl"><AlertCircle size={24}/></div>
                 <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Status</span>
               </div>
               <h3 className="text-4xl font-black mb-1">
                 {teachers.filter(t => {
                   const teacherUser = users.find(u => u.id === t.userId || (u.nip && u.nip === t.nip && t.nip !== ''));
                   const currentYear = schoolProfile?.year || '2024/2025';
                   const currentSem = schoolProfile?.semester || '1';
                   return !assessments.some(a => 
                     (a.teacherId === t.id || (teacherUser && a.teacherId === teacherUser.id)) &&
                     (a.academicYear === currentYear && a.semester === currentSem)
                   );
                 }).length}
               </h3>
               <p className="text-sm font-medium opacity-80">Belum Dinilai (Smt Ini)</p>
            </div>
          </div>

          {/* Sub Tab Navigation */}
          <div className="flex border-b border-gray-100 gap-6 mt-4">
            <button
              onClick={() => setActiveSubTab('daftar-guru')}
              className={`pb-3 text-base font-bold transition-all relative cursor-pointer ${
                activeSubTab === 'daftar-guru'
                ? 'text-indigo-600'
                : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Daftar Guru & Penilaian
              {activeSubTab === 'daftar-guru' && (
                <span className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full"></span>
              )}
            </button>
            <button
              onClick={() => setActiveSubTab('rekap-penilaian')}
              className={`pb-3 text-base font-bold transition-all relative cursor-pointer ${
                activeSubTab === 'rekap-penilaian'
                ? 'text-indigo-600'
                : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Rekap Hasil Penilaian PKG
              {activeSubTab === 'rekap-penilaian' && (
                <span className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full"></span>
              )}
            </button>
          </div>

          {activeSubTab === 'daftar-guru' ? (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] tracking-widest">
                    <tr>
                      <th className="p-6">Nama Guru</th>
                      <th className="p-6">Status Pegawai</th>
                      <th className="p-6">NIP / NUPTK</th>
                      <th className="p-6">Tgl Penilaian Terakhir</th>
                      <th className="p-6 text-center">Hasil</th>
                      <th className="p-6 text-center">Status</th>
                      <th className="p-6 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredTeachers.map(teacher => {
                      const latest = getLatestAssessment(teacher.id);
                      
                      const teacherUser = users.find(u => 
                        u.id === teacher.userId || 
                        (u.nip && u.nip === teacher.nip && teacher.nip !== '') ||
                        (u.fullName && teacher.nama && u.fullName.toLowerCase() === teacher.nama.toLowerCase())
                      );
                      
                      const currentYear = schoolProfile?.year || '2024/2025';
                      const currentSem = schoolProfile?.semester || '1';
                      
                      const isAssessedThisPeriod = assessments.some(a => 
                        (a.teacherId === teacher.id || (teacherUser && a.teacherId === teacherUser.id)) &&
                        (a.academicYear === currentYear && a.semester === currentSem)
                      );
                      
                      return (
                        <tr key={teacher.id} className="group hover:bg-gray-50/50 transition-colors">
                          <td className="p-6">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg overflow-hidden border-2 border-white shadow-sm">
                                {teacher.foto ? (
                                  <img src={teacher.foto} alt={teacher.nama} className="w-full h-full object-cover" />
                                ) : (
                                  teacher.nama.charAt(0)
                                )}
                              </div>
                              <div>
                                <div className="font-bold text-gray-800">{teacher.nama}</div>
                                <div className="text-xs text-gray-400">{teacher.jabatan}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-6">
                            <span className="px-2 py-1 rounded-lg bg-gray-100 text-gray-600 text-[10px] font-bold border border-gray-200">
                              {teacher.statusPegawai || '-'}
                            </span>
                          </td>
                          <td className="p-6">
                            <div className="text-xs font-mono text-gray-500">{teacher.nip || '-'}</div>
                            <div className="text-[10px] text-gray-400">{teacher.nuptk || '-'}</div>
                          </td>
                          <td className="p-6">
                            <div className="text-xs font-bold text-gray-600">
                              {latest ? new Date(latest.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                            </div>
                            {latest && (
                              <div className="text-[10px] text-indigo-500 font-bold mt-0.5">
                                TA {latest.academicYear || '2024/2025'} - S{latest.semester || '1'}
                              </div>
                            )}
                          </td>
                           <td className="p-6 text-center">
                            {latest ? (
                              <button
                                onClick={() => {
                                  setSelectedAssessment(latest);
                                  setIsDetailModalOpen(true);
                                }}
                                className="inline-flex flex-col items-center hover:scale-105 transition-transform cursor-pointer"
                                title="Klik untuk melihat rincian detail"
                              >
                                <span className="text-lg font-black text-gray-800">{latest.percentage}%</span>
                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black border uppercase tracking-tighter ${getCategory(latest.percentage).color}`}>
                                  {latest.category}
                                </span>
                              </button>
                            ) : '-'}
                          </td>
                          <td className="p-6 text-center">
                            {isAssessedThisPeriod ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200" title="Sudah dinilai untuk semester ini">
                                <CheckCircle size={14} className="mr-1.5" /> Sudah Dinilai
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200" title="Belum dinilai untuk semester ini">
                                <AlertCircle size={14} className="mr-1.5" /> Belum Dinilai
                              </span>
                            )}
                          </td>
                          <td className="p-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {latest && (
                                <button
                                  onClick={() => {
                                    setSelectedAssessment(latest);
                                    setIsDetailModalOpen(true);
                                  }}
                                  className="p-2.5 rounded-xl bg-gray-100 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all cursor-pointer"
                                  title="Lihat Detail Penilaian"
                                >
                                  <Eye size={20} />
                                </button>
                              )}
                              <button
                                onClick={() => handleStartAssessment(teacher.id)}
                                className={`p-2.5 rounded-xl transition-all ${
                                  isAssessedThisPeriod 
                                  ? 'bg-gray-100 text-gray-400 hover:bg-indigo-600 hover:text-white' 
                                  : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white'
                                }`}
                                title={isAssessedThisPeriod ? 'Nilai Ulang (Smt Ini)' : 'Mulai Penilaian'}
                              >
                                <ChevronRight size={20} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {filteredTeachers.length === 0 && (
                <div className="p-12 text-center">
                  <p className="text-gray-400 italic">Tidak ada data guru (GTK) yang ditemukan.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] tracking-widest">
                    <tr>
                      <th className="p-6">Nama Guru</th>
                      <th className="p-6 text-center">Tahun Ajaran / Smt</th>
                      <th className="p-6">Tgl Penilaian</th>
                      <th className="p-6 text-center">Skor Akhir</th>
                      <th className="p-6 text-center">Persentase</th>
                      <th className="p-6 text-center">Status Tampil</th>
                      <th className="p-6 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {assessments
                      .filter(a => {
                        const nameMatch = a.teacherName?.toLowerCase().includes(searchQuery.toLowerCase());
                        const supervisorMatch = a.supervisorName?.toLowerCase().includes(searchQuery.toLowerCase());
                        return nameMatch || supervisorMatch;
                      })
                      .map(assessment => {
                        const isVisible = assessment.isVisible !== false;
                        return (
                          <tr key={assessment.id} className="group hover:bg-gray-50/50 transition-colors">
                            <td className="p-6">
                              <div className="font-bold text-gray-800">{assessment.teacherName}</div>
                              <div className="text-xs text-gray-400">Penilai: {assessment.supervisorName}</div>
                            </td>
                            <td className="p-6 text-center font-semibold text-gray-700">
                              TA {assessment.academicYear || '2024/2025'} - S{assessment.semester || '1'}
                            </td>
                            <td className="p-6">
                              <div className="text-xs text-gray-600">
                                {new Date(assessment.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </div>
                            </td>
                            <td className="p-6 text-center font-mono font-bold text-gray-700">
                              {assessment.totalScore} / {PERFORMANCE_INDICATORS.length * 4}
                            </td>
                            <td className="p-6 text-center">
                              <span className="text-lg font-black text-gray-800 mr-1">{assessment.percentage}%</span>
                              <span className={`px-2 py-0.5 rounded-full text-[8px] font-black border uppercase tracking-tighter ${getCategory(assessment.percentage).color}`}>
                                {assessment.category}
                              </span>
                            </td>
                            <td className="p-6 text-center">
                              <button
                                onClick={() => handleToggleVisibility(assessment)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                                  isVisible
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'
                                }`}
                                title={isVisible ? 'Klik untuk sembunyikan dari Guru' : 'Klik untuk tampilkan ke Guru'}
                              >
                                {isVisible ? (
                                  <>
                                    <Eye size={14} /> Visible
                                  </>
                                ) : (
                                  <>
                                    <EyeOff size={14} /> Tersembunyi
                                  </>
                                )}
                              </button>
                            </td>
                            <td className="p-6 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedAssessment(assessment);
                                    setIsDetailModalOpen(true);
                                  }}
                                  className="p-2.5 rounded-xl bg-gray-100 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all cursor-pointer"
                                  title="Lihat Rincian PKG"
                                >
                                  <Eye size={18} />
                                </button>
                                <button
                                  onClick={() => handleEditAssessment(assessment)}
                                  className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all cursor-pointer"
                                  title="Edit Penilaian"
                                >
                                  <Edit2 size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    {assessments.filter(a => {
                      const nameMatch = a.teacherName?.toLowerCase().includes(searchQuery.toLowerCase());
                      const supervisorMatch = a.supervisorName?.toLowerCase().includes(searchQuery.toLowerCase());
                      return nameMatch || supervisorMatch;
                    }).length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-12 text-center text-gray-400 font-semibold">
                          Tidak ada data penilaian yang cocok dengan pencarian atau belum ada penilaian yang dibuat.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {renderDetailModal()}
    </div>
  );
};

export default PerformanceAssessmentView;
