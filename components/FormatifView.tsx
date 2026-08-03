import React, { useState, useEffect, useMemo } from 'react';
import { Student, User, Subject } from '../types';
import { MOCK_SUBJECTS } from '../constants';
import { apiService } from '../services/apiService';
import { cacheService } from '../src/services/cacheService';
import { 
  ClipboardList, BookOpen, Search, Printer, Download, Save, 
  CheckCircle, AlertCircle, Eye, EyeOff, Plus, Trash2, Award, 
  HelpCircle, Sparkles, Check
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface FormatifViewProps {
  currentUser: User | null;
  activeClassId: string;
  students: Student[];
  onShowNotification: (message: string, type: 'success' | 'error' | 'warning') => void;
}

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
  const [materiInput, setMateriInput] = useState<string>('');
  const [formatifRecords, setFormatifRecords] = useState<Record<string, {
    observasi: number;
    tanyaJawab: number;
    refleksi: number;
    kuis: number;
    catatan?: string;
  }>>({});
  const [savedTopics, setSavedTopics] = useState<{ id: string; subjectId: string; title: string; date: string }[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const isTeacher = currentUser?.role === 'guru' || currentUser?.role === 'admin';

  // Load saved topics & records for active class and selected subject
  useEffect(() => {
    const cachedTopics = cacheService.get<{ id: string; subjectId: string; title: string; date: string }[]>(`formatif_topics_${activeClassId}`) || [];
    setSavedTopics(cachedTopics);
    
    const subjectTopics = cachedTopics.filter(t => t.subjectId === selectedSubjectId);
    if (subjectTopics.length > 0 && !selectedTopicId) {
      setSelectedTopicId(subjectTopics[0].id);
      setMateriInput(subjectTopics[0].title);
    } else if (subjectTopics.length === 0) {
      setSelectedTopicId('');
      setMateriInput('');
    }
  }, [activeClassId, selectedSubjectId]);

  // Load student scores when topic changes
  useEffect(() => {
    if (selectedTopicId) {
      const allScores = cacheService.get<Record<string, any>>(`formatif_scores_${selectedTopicId}`) || {};
      setFormatifRecords(allScores);
    } else {
      setFormatifRecords({});
    }
  }, [selectedTopicId]);

  const handleScoreChange = (studentId: string, field: 'observasi' | 'tanyaJawab' | 'refleksi' | 'kuis', value: number) => {
    const val = Math.min(100, Math.max(0, value));
    setFormatifRecords(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { observasi: 0, tanyaJawab: 0, refleksi: 0, kuis: 0 }),
        [field]: val
      }
    }));
  };

  const handleSaveTopicAndScores = () => {
    if (!materiInput.trim()) {
      onShowNotification('Materi / Topik pembelajaran wajib diisi.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      let topicId = selectedTopicId;
      let currentTopics = [...savedTopics];

      if (!topicId) {
        topicId = `topic-${Date.now()}`;
        const newTopic = {
          id: topicId,
          subjectId: selectedSubjectId,
          title: materiInput.trim(),
          date: new Date().toISOString().split('T')[0]
        };
        currentTopics.push(newTopic);
        setSelectedTopicId(topicId);
      } else {
        currentTopics = currentTopics.map(t => t.id === topicId ? { ...t, title: materiInput.trim() } : t);
      }

      setSavedTopics(currentTopics);
      cacheService.set(`formatif_topics_${activeClassId}`, currentTopics);
      cacheService.set(`formatif_scores_${topicId}`, formatifRecords);

      onShowNotification('Penilaian formatif berhasil disimpan!', 'success');
    } catch (e) {
      onShowNotification('Gagal menyimpan penilaian formatif.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateNewTopic = () => {
    setSelectedTopicId('');
    setMateriInput('');
    setFormatifRecords({});
  };

  const handleDeleteTopic = (topicId: string) => {
    const updatedTopics = savedTopics.filter(t => t.id !== topicId);
    setSavedTopics(updatedTopics);
    cacheService.set(`formatif_topics_${activeClassId}`, updatedTopics);
    cacheService.remove(`formatif_scores_${topicId}`);
    
    if (selectedTopicId === topicId) {
      handleCreateNewTopic();
    }
    onShowNotification('Topik formatif berhasil dihapus.', 'success');
  };

  const filteredStudents = useMemo(() => {
    if (!searchQuery) return students;
    return students.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.nis.includes(searchQuery));
  }, [students, searchQuery]);

  const currentSubjectTopics = useMemo(() => {
    return savedTopics.filter(t => t.subjectId === selectedSubjectId);
  }, [savedTopics, selectedSubjectId]);

  const handleExportExcel = () => {
    const headers = [
      "No", "NIS", "Nama Siswa", "Materi / Topik", 
      "Observasi (Score)", "Observasi (Predikat)", 
      "Tanya Jawab Lisan (Score)", "Tanya Jawab Lisan (Predikat)", 
      "Refleksi Diri (Score)", "Refleksi Diri (Predikat)", 
      "Kuis Singkat (Score)", "Kuis Singkat (Predikat)", 
      "Predikat Akhir"
    ];

    const subjectName = MOCK_SUBJECTS.find(s => s.id === selectedSubjectId)?.name || selectedSubjectId;

    const rows = students.map((s, idx) => {
      const rec = formatifRecords[s.id] || { observasi: 0, tanyaJawab: 0, refleksi: 0, kuis: 0 };
      const obsPred = getPredicate(rec.observasi);
      const tjPred = getPredicate(rec.tanyaJawab);
      const refPred = getPredicate(rec.refleksi);
      const kuisPred = getPredicate(rec.kuis);
      
      const avg = Math.round((rec.observasi + rec.tanyaJawab + rec.refleksi + rec.kuis) / 4);
      const finalPred = getPredicate(avg);

      return [
        idx + 1,
        s.nis,
        s.name.toUpperCase(),
        materiInput || '-',
        rec.observasi, obsPred,
        rec.tanyaJawab, tjPred,
        rec.refleksi, refPred,
        rec.kuis, kuisPred,
        finalPred
      ];
    });

    const worksheet = XLSX.utils.aoa_to_sheet([[ `REKAP PENILAIAN FORMATIF - ${subjectName.toUpperCase()} (KELAS ${activeClassId})` ], [], headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Formatif");
    XLSX.writeFile(workbook, `Rekap_Formatif_${subjectName}_Kelas_${activeClassId}.xlsx`);
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
          <p className="text-slate-500 text-sm">Observasi, Tanya Jawab Lisan, Refleksi Diri, & Kuis Singkat per Mata Pelajaran</p>
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

      {/* Subject & Topic Selector Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Pilih Mata Pelajaran</label>
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
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Pilih / Muat Topik Tersimpan</label>
          <div className="flex gap-2">
            <select
              value={selectedTopicId}
              onChange={(e) => {
                const topId = e.target.value;
                setSelectedTopicId(topId);
                const found = savedTopics.find(t => t.id === topId);
                if (found) setMateriInput(found.title);
              }}
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#5AB2FF] font-semibold text-slate-700 bg-slate-50"
            >
              <option value="">-- Buat Topik Baru --</option>
              {currentSubjectTopics.map(t => (
                <option key={t.id} value={t.id}>{t.title} ({t.date})</option>
              ))}
            </select>
            {selectedTopicId && (
              <button
                onClick={() => handleDeleteTopic(selectedTopicId)}
                title="Hapus Topik Ini"
                className="p-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-all border border-rose-200"
              >
                <Trash2 size={18} />
              </button>
            )}
            <button
              onClick={handleCreateNewTopic}
              title="Topik Baru"
              className="p-3 bg-blue-50 text-[#5AB2FF] rounded-xl hover:bg-blue-100 transition-all border border-blue-200"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Materi / Tujuan Pembelajaran</label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Contoh: Bilangan Cacah sampai 1.000"
              value={materiInput}
              onChange={(e) => setMateriInput(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#5AB2FF] font-medium text-slate-800"
            />
          </div>
        </div>
      </div>

      {/* Info Banner on Formatif Assessment Types */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-sky-50 p-4 rounded-2xl border border-blue-100 shadow-xs">
          <div className="flex items-center space-x-2 text-blue-600 font-bold mb-1">
            <Sparkles size={16} />
            <span className="text-xs uppercase">1. Observasi</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">Guru mengamati keaktifan dan sikap siswa di kelas.</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-4 rounded-2xl border border-emerald-100 shadow-xs">
          <div className="flex items-center space-x-2 text-emerald-600 font-bold mb-1">
            <Sparkles size={16} />
            <span className="text-xs uppercase">2. Tanya Jawab Lisan</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">Mengajukan pertanyaan singkat di tengah pelajaran untuk cek pemahaman.</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-fuchsia-500/10 p-4 rounded-2xl border border-purple-100 shadow-xs">
          <div className="flex items-center space-x-2 text-purple-600 font-bold mb-1">
            <Sparkles size={16} />
            <span className="text-xs uppercase">3. Refleksi Diri</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">Siswa menilai hasil kerja mereka sendiri atau teman sekelompok.</p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-2xl border border-amber-100 shadow-xs">
          <div className="flex items-center space-x-2 text-amber-600 font-bold mb-1">
            <Sparkles size={16} />
            <span className="text-xs uppercase">4. Kuis Singkat</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">Tes kecil tanpa bobot nilai besar di akhir sesi pembelajaran.</p>
        </div>
      </div>

      {/* Search & Save Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="relative w-full sm:w-80">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama siswa..."
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
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Penilaian Formatif'}</span>
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
                <th className="py-4 px-4">Nama Siswa / NIS</th>
                <th className="py-4 px-4 text-center w-36">1. Observasi</th>
                <th className="py-4 px-4 text-center w-36">2. Tanya Jawab</th>
                <th className="py-4 px-4 text-center w-36">3. Refleksi Diri</th>
                <th className="py-4 px-4 text-center w-36">4. Kuis Singkat</th>
                <th className="py-4 px-4 text-center w-40">Predikat Akhir</th>
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
                  const rec = formatifRecords[student.id] || { observasi: 0, tanyaJawab: 0, refleksi: 0, kuis: 0 };
                  const avg = Math.round((rec.observasi + rec.tanyaJawab + rec.refleksi + rec.kuis) / 4);
                  const finalPred = getPredicate(avg);

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{student.name}</div>
                        <div className="text-xs text-slate-400 font-mono">NIS: {student.nis}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            disabled={!isTeacher}
                            value={rec.observasi || ''}
                            onChange={(e) => handleScoreChange(student.id, 'observasi', Number(e.target.value))}
                            className="w-20 px-2 py-1 text-center font-bold rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#5AB2FF] bg-slate-50"
                          />
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getPredicateBadgeClass(getPredicate(rec.observasi))}`}>
                            {getPredicate(rec.observasi)}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            disabled={!isTeacher}
                            value={rec.tanyaJawab || ''}
                            onChange={(e) => handleScoreChange(student.id, 'tanyaJawab', Number(e.target.value))}
                            className="w-20 px-2 py-1 text-center font-bold rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#5AB2FF] bg-slate-50"
                          />
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getPredicateBadgeClass(getPredicate(rec.tanyaJawab))}`}>
                            {getPredicate(rec.tanyaJawab)}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            disabled={!isTeacher}
                            value={rec.refleksi || ''}
                            onChange={(e) => handleScoreChange(student.id, 'refleksi', Number(e.target.value))}
                            className="w-20 px-2 py-1 text-center font-bold rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#5AB2FF] bg-slate-50"
                          />
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getPredicateBadgeClass(getPredicate(rec.refleksi))}`}>
                            {getPredicate(rec.refleksi)}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            disabled={!isTeacher}
                            value={rec.kuis || ''}
                            onChange={(e) => handleScoreChange(student.id, 'kuis', Number(e.target.value))}
                            className="w-20 px-2 py-1 text-center font-bold rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#5AB2FF] bg-slate-50"
                          />
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getPredicateBadgeClass(getPredicate(rec.kuis))}`}>
                            {getPredicate(rec.kuis)}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-mono font-bold text-slate-700">{avg > 0 ? avg : '-'}</span>
                          <span className={`text-xs font-black px-3 py-1 rounded-full ${getPredicateBadgeClass(finalPred)}`}>
                            {finalPred}
                          </span>
                        </div>
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
