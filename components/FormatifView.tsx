import React, { useState, useEffect, useMemo } from 'react';
import { Student, User, Subject } from '../types';
import { MOCK_SUBJECTS } from '../constants';
import { cacheService } from '../src/services/cacheService';
import { 
  ClipboardList, BookOpen, Search, Printer, Download, Save, 
  Plus, Trash2, Award, Sparkles, Check
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface FormatifViewProps {
  currentUser: User | null;
  activeClassId: string;
  students: Student[];
  onShowNotification: (message: string, type: 'success' | 'error' | 'warning') => void;
}

const ASSESSMENT_TYPES = [
  {
    id: 'Observasi',
    label: 'Observasi',
    description: 'Guru mengamati keaktifan dan sikap siswa di kelas.'
  },
  {
    id: 'Tanya Jawab Lisan',
    label: 'Tanya Jawab Lisan',
    description: 'Mengajukan pertanyaan singkat di tengah pelajaran untuk cek pemahaman.'
  },
  {
    id: 'Refleksi Diri',
    label: 'Refleksi Diri',
    description: 'Siswa menilai hasil kerja mereka sendiri atau teman sekelompok.'
  },
  {
    id: 'Kuis Singkat',
    label: 'Kuis Singkat',
    description: 'Tes kecil tanpa bobot nilai besar di akhir sesi.'
  }
];

const getPredicate = (score: number) => {
  if (score >= 90) return 'Sangat Baik';
  if (score >= 75) return 'Baik';
  if (score >= 60) return 'Cukup';
  if (score > 0) return 'Perlu Bimbingan';
  return '-';
};

const getPredicateBadgeClass = (pred: string) => {
  switch (pred) {
    case 'Sangat Baik':
      return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
    case 'Baik':
      return 'bg-blue-100 text-blue-800 border border-blue-200';
    case 'Cukup':
      return 'bg-amber-100 text-amber-800 border border-amber-200';
    case 'Perlu Bimbingan':
      return 'bg-rose-100 text-rose-800 border border-rose-200';
    default:
      return 'bg-slate-100 text-slate-500 border border-slate-200';
  }
};

const FormatifView: React.FC<FormatifViewProps> = ({
  currentUser,
  activeClassId,
  students,
  onShowNotification
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(MOCK_SUBJECTS[0].id);
  const [assessmentType, setAssessmentType] = useState<string>('Observasi');
  const [materiInput, setMateriInput] = useState<string>('');
  const [tujuanInput, setTujuanInput] = useState<string>('');
  const [formatifRecords, setFormatifRecords] = useState<Record<string, { score: number; catatan?: string }>>({});
  const [savedTopics, setSavedTopics] = useState<{ id: string; subjectId: string; materi: string; tujuan: string; date: string }[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const isTeacher = currentUser?.role === 'guru' || currentUser?.role === 'admin';

  // Load saved Materi topics for active class and selected subject (synchronized with shared learning topics / sumatif)
  useEffect(() => {
    const sharedKey = `shared_learning_topics_${activeClassId}`;
    let cachedTopics = cacheService.get<{ id: string; subjectId: string; materi: string; tujuan: string; date: string }[]>(sharedKey);
    
    if (!cachedTopics) {
      const legacyFormatif = cacheService.get<any[]>(`formatif_topics_${activeClassId}`) || [];
      const sumatifs = cacheService.get<any[]>('sumatifs') || [];
      const sumatifTopics = sumatifs
        .filter(s => s.classId === activeClassId)
        .map(s => ({
          id: s.id || `sumatif-topic-${s.subjectId}`,
          subjectId: s.subjectId,
          materi: s.title || 'Materi Pembelajaran',
          tujuan: s.tujuan || '',
          date: s.date || new Date().toISOString().split('T')[0]
        }));
      cachedTopics = [...legacyFormatif, ...sumatifTopics];
      cacheService.set(sharedKey, cachedTopics);
    }

    setSavedTopics(cachedTopics);
    
    const subjectTopics = cachedTopics.filter(t => t.subjectId === selectedSubjectId);
    if (subjectTopics.length > 0) {
      const exists = subjectTopics.some(t => t.id === selectedTopicId);
      if (!exists || !selectedTopicId) {
        setSelectedTopicId(subjectTopics[0].id);
        setMateriInput(subjectTopics[0].materi || '');
        setTujuanInput(subjectTopics[0].tujuan || '');
      }
    } else {
      setSelectedTopicId('');
      setMateriInput('');
      setTujuanInput('TP 1: ');
    }
  }, [activeClassId, selectedSubjectId]);

  // Load student scores when topic OR assessmentType changes (independent per assessment type)
  useEffect(() => {
    if (selectedTopicId) {
      const scoreKey = `formatif_scores_${selectedTopicId}_${assessmentType}`;
      const allScores = cacheService.get<Record<string, { score: number; catatan?: string }>>(scoreKey) || {};
      setFormatifRecords(allScores);
    } else {
      setFormatifRecords({});
    }
  }, [selectedTopicId, assessmentType]);

  const handleScoreChange = (studentId: string, value: number) => {
    const val = Math.min(100, Math.max(0, value));
    setFormatifRecords(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { score: 0 }),
        score: val
      }
    }));
  };

  const handleNoteChange = (studentId: string, note: string) => {
    setFormatifRecords(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { score: 0 }),
        catatan: note
      }
    }));
  };

  const handleSaveTopicAndScores = () => {
    if (!materiInput.trim()) {
      onShowNotification('Materi pembelajaran wajib diisi.', 'error');
      return;
    }
    // Tujuan pembelajaran is optional (can be left blank)

    setIsSaving(true);
    try {
      let topicId = selectedTopicId;
      let currentTopics = [...savedTopics];

      if (!topicId) {
        topicId = `topic-${Date.now()}`;
        const newTopic = {
          id: topicId,
          subjectId: selectedSubjectId,
          materi: materiInput.trim(),
          tujuan: tujuanInput.trim(), // can be empty string
          date: new Date().toISOString().split('T')[0]
        };
        currentTopics.push(newTopic);
        setSelectedTopicId(topicId);
      } else {
        currentTopics = currentTopics.map(t => t.id === topicId ? { 
          ...t, 
          materi: materiInput.trim(), 
          tujuan: tujuanInput.trim() 
        } : t);
      }

      setSavedTopics(currentTopics);
      const sharedKey = `shared_learning_topics_${activeClassId}`;
      cacheService.set(sharedKey, currentTopics);
      
      const scoreKey = `formatif_scores_${topicId}_${assessmentType}`;
      cacheService.set(scoreKey, formatifRecords);

      // AUTOMATIC SYNCHRONIZATION WITH SUMATIF (Doing Formatif first populates/syncs in Sumatif!)
      // Only MATERI is synchronized with Sumatif.
      const allSumatifs = cacheService.get<any[]>('sumatifs') || [];
      const sumIndex = allSumatifs.findIndex(s => s.id === topicId || (s.subjectId === selectedSubjectId && s.classId === activeClassId && s.title === materiInput.trim()));
      
      if (sumIndex !== -1) {
        allSumatifs[sumIndex].title = materiInput.trim();
      } else {
        const newSumatif = {
          id: topicId,
          classId: activeClassId,
          subjectId: selectedSubjectId,
          title: materiInput.trim(),
          type: 'sum1',
          questions: [],
          duration: 60,
          isActive: true,
          isVisible: true,
          createdAt: new Date().toISOString()
        };
        allSumatifs.push(newSumatif);
      }
      cacheService.set('sumatifs', allSumatifs);

      onShowNotification(`Penilaian ${assessmentType} berhasil disimpan & Materi tersinkron ke Sumatif!`, 'success');
    } catch (e) {
      onShowNotification('Gagal menyimpan penilaian formatif.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateNewTopic = () => {
    setSelectedTopicId('');
    setMateriInput('');
    const currentSubjectTopics = savedTopics.filter(t => t.subjectId === selectedSubjectId);
    setTujuanInput(`TP ${currentSubjectTopics.length + 1}: `);
    setFormatifRecords({});
  };

  const handleDeleteTopic = (topicId: string) => {
    const updatedTopics = savedTopics.filter(t => t.id !== topicId);
    setSavedTopics(updatedTopics);
    const sharedKey = `shared_learning_topics_${activeClassId}`;
    cacheService.set(sharedKey, updatedTopics);
    
    // Clear scores for all assessment types of this topic
    ASSESSMENT_TYPES.forEach(at => {
      cacheService.remove(`formatif_scores_${topicId}_${at.id}`);
    });
    
    if (selectedTopicId === topicId) {
      handleCreateNewTopic();
    }
    onShowNotification('Materi berhasil dihapus.', 'success');
  };

  const filteredStudents = useMemo(() => {
    if (!searchQuery) return students;
    return students.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.nis.includes(searchQuery) || 
      (s.nisn && s.nisn.includes(searchQuery))
    );
  }, [students, searchQuery]);

  const currentSubjectTopics = useMemo(() => {
    return savedTopics.filter(t => {
      if (t.subjectId !== selectedSubjectId) return false;
      const m = (t.materi || '').trim();
      const tj = (t.tujuan || '').trim();
      const isDummyMateri = !m || m === 'Observasi DPL';
      const isDummyTujuan = !tj || tj === 'Observasi DPL';
      return !isDummyMateri || !isDummyTujuan;
    });
  }, [savedTopics, selectedSubjectId]);

  const selectedAssessmentObj = ASSESSMENT_TYPES.find(a => a.id === assessmentType) || ASSESSMENT_TYPES[0];

  const handleExportExcel = () => {
    const headers = [
      "No", "Nama Siswa", "NISN", "NIS", "Materi", "Tujuan Pembelajaran", "Jenis Formatif", 
      "Nilai Angka", "Predikat", "Catatan / Keterangan"
    ];

    const subjectName = MOCK_SUBJECTS.find(s => s.id === selectedSubjectId)?.name || selectedSubjectId;

    const rows = students.map((s, idx) => {
      const rec = formatifRecords[s.id] || { score: 0, catatan: '' };
      const pred = getPredicate(rec.score);

      return [
        idx + 1,
        s.name.toUpperCase(),
        s.nisn || '-',
        s.nis || '-',
        materiInput || '-',
        tujuanInput || '-',
        assessmentType,
        rec.score,
        pred,
        rec.catatan || '-'
      ];
    });

    const worksheet = XLSX.utils.aoa_to_sheet([[ `REKAP PENILAIAN FORMATIF - ${subjectName.toUpperCase()} (KELAS ${activeClassId})` ], [], headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Formatif");
    XLSX.writeFile(workbook, `Rekap_Formatif_${subjectName}_${assessmentType}_Kelas_${activeClassId}.xlsx`);
    onShowNotification('Data formatif berhasil diekspor ke Excel!', 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <div className="flex items-center space-x-2 text-[#5AB2FF] mb-1">
            <ClipboardList size={22} />
            <span className="text-xs font-black uppercase tracking-wider">Asesmen Kurikulum Merdeka</span>
          </div>
          <h2 className="text-2xl font-black text-slate-800">PENILAIAN FORMATIF</h2>
          <p className="text-slate-500 text-sm">Materi tersinkron otomatis ke Sumatif; Jenis dan Nilai Formatif independen</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-sm font-semibold text-xs"
          >
            <Download size={16} />
            <span>Ekspor Excel</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition-all shadow-sm font-semibold text-xs"
          >
            <Printer size={16} />
            <span>Cetak / PDF</span>
          </button>
        </div>
      </div>

      {/* Subject, Assessment Type, & Topic Selector Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">1. Pilih Mata Pelajaran</label>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#5AB2FF] font-semibold text-slate-700 bg-slate-50"
          >
            {MOCK_SUBJECTS.map(subj => (
              <option key={subj.id} value={subj.id}>{subj.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">2. Pilih Jenis Formatif (Independen)</label>
          <select
            value={assessmentType}
            onChange={(e) => setAssessmentType(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#5AB2FF] font-semibold text-slate-700 bg-slate-50"
          >
            {ASSESSMENT_TYPES.map(type => (
              <option key={type.id} value={type.id}>{type.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">3. Pilih / Buat Materi (Sinkron ke Sumatif)</label>
          <div className="flex gap-2">
            <select
              value={selectedTopicId}
              onChange={(e) => {
                const topId = e.target.value;
                setSelectedTopicId(topId);
                if (!topId) {
                  setMateriInput('');
                  setTujuanInput(`TP ${currentSubjectTopics.length + 1}: `);
                } else {
                  const found = savedTopics.find(t => t.id === topId);
                  if (found) {
                    setMateriInput(found.materi || '');
                    setTujuanInput(found.tujuan || '');
                  }
                }
              }}
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#5AB2FF] font-semibold text-slate-700 bg-slate-50"
            >
              <option value="">-- Buat Materi Baru --</option>
              {currentSubjectTopics.map(t => (
                <option key={t.id} value={t.id}>{t.materi}</option>
              ))}
            </select>
            {selectedTopicId && (
              <button
                onClick={() => handleDeleteTopic(selectedTopicId)}
                title="Hapus Materi Ini"
                className="p-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-all border border-rose-200"
              >
                <Trash2 size={18} />
              </button>
            )}
            <button
              onClick={handleCreateNewTopic}
              title="Materi Baru"
              className="p-3 bg-blue-50 text-[#5AB2FF] rounded-xl hover:bg-blue-100 transition-all border border-blue-200"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Materi & Tujuan Pembelajaran Inputs */}
      <div className="bg-gradient-to-r from-blue-50 to-sky-50 p-6 rounded-3xl border border-blue-100 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-blue-800 uppercase tracking-wider mb-1">Materi *</label>
          <input
            type="text"
            placeholder="Contoh: Bilangan Cacah Sampai 1000"
            value={materiInput}
            onChange={(e) => setMateriInput(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-blue-200 bg-white focus:ring-2 focus:ring-[#5AB2FF] font-medium text-slate-800 shadow-xs"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-blue-800 uppercase tracking-wider mb-1">Tujuan Pembelajaran</label>
          <input
            type="text"
            placeholder="Contoh: Peserta didik dapat membaca dan menulis bilangan cacah (Opsional)"
            value={tujuanInput}
            onChange={(e) => setTujuanInput(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-blue-200 bg-white focus:ring-2 focus:ring-[#5AB2FF] font-medium text-slate-800 shadow-xs"
          />
        </div>
      </div>

      {/* Assessment Info Banner */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <Sparkles size={20} />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-sm">Jenis Formatif Aktif: {selectedAssessmentObj.label}</h4>
            <p className="text-xs text-slate-500">{selectedAssessmentObj.description}</p>
          </div>
        </div>
      </div>

      {/* Search & Save Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="relative w-full sm:w-80">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari siswa / NISN / NIS..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#5AB2FF] text-sm"
          />
        </div>
        {isTeacher && (
          <button
            onClick={handleSaveTopicAndScores}
            disabled={isSaving}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-2.5 bg-[#5AB2FF] text-white rounded-xl hover:bg-[#4A9FE6] transition-all shadow-md font-bold text-sm"
          >
            <Save size={18} />
            <span>{isSaving ? 'Menyimpan...' : `Simpan Penilaian ${assessmentType}`}</span>
          </button>
        )}
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-600 text-xs font-black uppercase tracking-wider">
                <th className="py-4 px-4 text-center w-12">No</th>
                <th className="py-4 px-4">Nama Siswa</th>
                <th className="py-4 px-4 w-36">NISN</th>
                <th className="py-4 px-4 w-32">NIS</th>
                <th className="py-4 px-4 text-center w-40">Nilai ({assessmentType})</th>
                <th className="py-4 px-4 text-center w-48">Predikat</th>
                <th className="py-4 px-4">Catatan / Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    Tidak ada siswa ditemukan.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, idx) => {
                  const rec = formatifRecords[student.id] || { score: 0, catatan: '' };
                  const pred = getPredicate(rec.score);

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{student.name}</td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-600">{student.nisn || '-'}</td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-600">{student.nis || '-'}</td>
                      <td className="py-3 px-4 text-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          disabled={!isTeacher}
                          value={rec.score || ''}
                          onChange={(e) => handleScoreChange(student.id, Number(e.target.value))}
                          className="w-24 px-3 py-1.5 text-center font-bold text-base rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#5AB2FF] bg-slate-50"
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${getPredicateBadgeClass(pred)}`}>
                          {pred}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          disabled={!isTeacher}
                          placeholder="Catatan perkembangan..."
                          value={rec.catatan || ''}
                          onChange={(e) => handleNoteChange(student.id, e.target.value)}
                          className="w-full px-3 py-1.5 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#5AB2FF] bg-slate-50 text-slate-700"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Predicate Guide Card */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-slate-800 text-sm mb-1">Panduan Predikat Asesmen Formatif:</h4>
          <p className="text-xs text-slate-500">Nilai formatif dikelompokkan ke dalam 4 predikat Kurikulum Merdeka:</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold border border-emerald-200">Sangat Baik (90 - 100)</span>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold border border-blue-200">Baik (75 - 89)</span>
          <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold border border-amber-200">Cukup (60 - 74)</span>
          <span className="px-3 py-1 bg-rose-100 text-rose-800 rounded-full text-xs font-bold border border-rose-200">Perlu Bimbingan (&lt; 60)</span>
        </div>
      </div>
    </div>
  );
};

export default FormatifView;
