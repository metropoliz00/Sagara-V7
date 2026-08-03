
import React, { useState, useEffect } from 'react';
import { Clock, Save, X, Coffee, GripVertical, Flag, BookOpen, BrainCircuit, Users, Plus, Trash2, Video, Paperclip, FileText, Check, Search, AlertCircle, Sparkles } from 'lucide-react';
import { WEEKDAYS, MOCK_SUBJECTS } from '../../constants';
import { ScheduleItem, Material } from '../../types';

interface ScheduleTabProps {
  schedule: ScheduleItem[];
  timeSlots: string[];
  materials?: Material[];
  onSave: (schedule: ScheduleItem[], timeSlots: string[]) => Promise<void>;
  onShowNotification: (message: string, type: 'success' | 'error') => void;
}

const SUBJECT_COLORS: { [key: string]: string } = {
  'default': 'bg-gray-200 text-gray-800',
  'PAI': 'bg-green-200 text-green-800',
  'Pendidikan Pancasila': 'bg-emerald-200 text-emerald-800',
  'Bahasa Indonesia': 'bg-blue-200 text-blue-800',
  'Matematika': 'bg-yellow-200 text-yellow-800',
  'IPAS': 'bg-slate-300 text-slate-800',
  'Seni dan Budaya': 'bg-purple-200 text-purple-800',
  'PJOK': 'bg-cyan-200 text-cyan-800',
  'Bahasa Jawa': 'bg-orange-200 text-orange-800',
  'Bahasa Inggris': 'bg-rose-200 text-rose-800',
  'KKA': 'bg-lime-200 text-lime-800',
  'Upacara': 'bg-red-200 text-red-800',
  'Pembiasaan': 'bg-sky-200 text-sky-800',
  'Ko-Kurikuler': 'bg-teal-200 text-teal-800',
  'Literasi/Numerasi': 'bg-fuchsia-200 text-fuchsia-800',
};

const getSubjectColor = (subjectName: string) => {
    return SUBJECT_COLORS[subjectName] || SUBJECT_COLORS['default'];
};

const SUBJECT_PALETTE_ITEMS = MOCK_SUBJECTS.map(s => ({ subject: s.name, isBreak: false }));

const ACTIVITY_PALETTE_ITEMS = [
    { subject: 'Upacara', icon: Flag, color: 'bg-red-200 text-red-800' },
    { subject: 'Pembiasaan', icon: BookOpen, color: 'bg-sky-200 text-sky-800' },
    { subject: 'Ko-Kurikuler', icon: Users, color: 'bg-teal-200 text-teal-800' },
    { subject: 'Literasi/Numerasi', icon: BrainCircuit, color: 'bg-fuchsia-200 text-fuchsia-800' },
    { subject: 'Istirahat', icon: Coffee, color: 'bg-slate-600 text-white' }
];

const ScheduleTab: React.FC<ScheduleTabProps> = ({ schedule, timeSlots, materials = [], onSave, onShowNotification }) => {
  const [localSchedule, setLocalSchedule] = useState<ScheduleItem[]>(schedule);
  const [localTimeSlots, setLocalTimeSlots] = useState<string[]>(timeSlots);
  const [isSaving, setIsSaving] = useState(false);
  const [draggedItem, setDraggedItem] = useState<any>(null);
  const [dragOverCell, setDragOverCell] = useState<{ day: string, time: string } | null>(null);

  // States for modal: virtual links & attached materials
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [meetUrlInput, setMeetUrlInput] = useState('');
  const [zoomUrlInput, setZoomUrlInput] = useState('');
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([]);
  const [attachedNotesInput, setAttachedNotesInput] = useState('');
  const [materialSearchQuery, setMaterialSearchQuery] = useState('');

  const openEditLinks = (item: ScheduleItem) => {
    setEditingItem(item);
    setMeetUrlInput(item.meetUrl || '');
    setZoomUrlInput(item.zoomUrl || '');
    setSelectedMaterialIds(item.attachedMaterialIds || []);
    setAttachedNotesInput(item.attachedNotes || '');
    setMaterialSearchQuery('');
  };

  const handleToggleMaterial = (matId: string) => {
    setSelectedMaterialIds(prev => 
      prev.includes(matId) ? prev.filter(id => id !== matId) : [...prev, matId]
    );
  };

  const handleSaveLinks = () => {
    if (!editingItem) return;

    const updatedSchedule = localSchedule.map(item => {
      if (item.id === editingItem.id) {
        return {
          ...item,
          meetUrl: meetUrlInput.trim() || undefined,
          zoomUrl: zoomUrlInput.trim() || undefined,
          attachedMaterialIds: selectedMaterialIds.length > 0 ? selectedMaterialIds : undefined,
          attachedNotes: attachedNotesInput.trim() || undefined
        };
      }
      return item;
    });

    setLocalSchedule(updatedSchedule);
    setEditingItem(null);
    onShowNotification(`Sematkan materi & link berhasil disimpan untuk ${editingItem.subject}`, 'success');
  };

  useEffect(() => {
    setLocalSchedule(schedule);
  }, [schedule]);

  useEffect(() => {
    setLocalTimeSlots(timeSlots);
  }, [timeSlots]);

  const handleTimeChange = (index: number, newValue: string) => {
    const oldTime = localTimeSlots[index];
    
    // Update time slots array
    const newTimeSlots = [...localTimeSlots];
    newTimeSlots[index] = newValue;
    setLocalTimeSlots(newTimeSlots);

    // Update corresponding schedule items
    const newSchedule = localSchedule.map(item => {
        if (item.time === oldTime) {
            return { ...item, time: newValue };
        }
        return item;
    });
    setLocalSchedule(newSchedule);
  };

  const handleDragStart = (e: React.DragEvent, item: any, source?: {day: string, time: string}) => {
    const payload = { ...item, source };
    e.dataTransfer.setData('application/json', JSON.stringify(payload));
    setDraggedItem(payload);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, day: string, time: string) => {
    e.preventDefault();
    if (!dragOverCell || dragOverCell.day !== day || dragOverCell.time !== time) {
      setDragOverCell({ day, time });
    }
  };

  const handleDrop = (e: React.DragEvent, day: string, time: string) => {
    e.preventDefault();
    const droppedItem = JSON.parse(e.dataTransfer.getData('application/json'));
    setDragOverCell(null);
    setDraggedItem(null);

    let newSchedule = [...localSchedule];

    // Find if target cell is already occupied
    const targetCellIndex = newSchedule.findIndex(item => {
      const d1 = item.day ? item.day.trim().toLowerCase().replace(/['`]/g, "") : "";
      const d2 = day ? day.trim().toLowerCase().replace(/['`]/g, "") : "";
      return d1 === d2 && item.time === time;
    });
    const itemInTargetCell = targetCellIndex !== -1 ? newSchedule[targetCellIndex] : null;

    // Case 1: Moving an item from another cell (source is defined)
    if (droppedItem.source) {
      const sourceCellIndex = newSchedule.findIndex(item => {
        const d1 = item.day ? item.day.trim().toLowerCase().replace(/['`]/g, "") : "";
        const d2 = droppedItem.source.day ? droppedItem.source.day.trim().toLowerCase().replace(/['`]/g, "") : "";
        return d1 === d2 && item.time === droppedItem.source.time;
      });
      
      if (sourceCellIndex !== -1) {
        // Swap items if target is occupied
        if (itemInTargetCell) {
          const itemInSourceCell = newSchedule[sourceCellIndex];
          newSchedule[sourceCellIndex] = { ...itemInTargetCell, day: droppedItem.source.day, time: droppedItem.source.time };
          newSchedule[targetCellIndex] = { ...itemInSourceCell, day, time };
        } else { // Move to empty cell
          newSchedule[sourceCellIndex] = { ...newSchedule[sourceCellIndex], day, time };
        }
      }
    } 
    // Case 2: Dropping a new item from palette
    else {
      const newItem: ScheduleItem = {
        id: `sch-${Date.now()}`,
        day, time,
        subject: droppedItem.subject
      };
      
      // If target cell has an item, remove it before placing the new one
      if (itemInTargetCell) {
        newSchedule = newSchedule.filter(item => item.id !== itemInTargetCell.id);
      }
      newSchedule.push(newItem);
    }

    setLocalSchedule(newSchedule);
  };

  const removeItem = (id: string) => {
      setLocalSchedule(localSchedule.filter(item => item.id !== id));
  };
  
  const handleGlobalSave = async () => {
    setIsSaving(true);
    try {
      await onSave(localSchedule, localTimeSlots);
    } catch(e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddRow = () => {
    setLocalTimeSlots([...localTimeSlots, '00:00 - 00:00']);
  };

  const handleRemoveRow = (indexToRemove: number) => {
    const timeToRemove = localTimeSlots[indexToRemove];
    
    // Remove the time slot
    const newTimeSlots = localTimeSlots.filter((_, index) => index !== indexToRemove);
    setLocalTimeSlots(newTimeSlots);

    // Remove any schedule items associated with this time slot
    const newSchedule = localSchedule.filter(item => item.time !== timeToRemove);
    setLocalSchedule(newSchedule);
  };

  const findItemForCell = (day: string, time: string) => {
    return localSchedule.find(item => {
      const d1 = item.day ? item.day.trim().toLowerCase().replace(/['`]/g, "") : "";
      const d2 = day ? day.trim().toLowerCase().replace(/['`]/g, "") : "";
      return d1 === d2 && item.time === time;
    });
  };
  
  return (
    <>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Palette */}
        <div className="lg:w-64 shrink-0 space-y-4 no-print">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-3">Mata Pelajaran</h3>
                <div className="space-y-2">
                    {SUBJECT_PALETTE_ITEMS.map((item, idx) => (
                        <div 
                            key={`pal-${idx}`}
                            draggable
                            onDragStart={(e) => handleDragStart(e, item)}
                            className={`p-2 rounded-lg text-xs font-bold cursor-grab active:cursor-grabbing flex items-center gap-2 transition-all hover:scale-105 hover:shadow-md ${getSubjectColor(item.subject)}`}
                        >
                            <GripVertical size={14} className="opacity-50"/>
                            {item.subject}
                        </div>
                    ))}
                </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-3">Aktivitas</h3>
                 <div className="space-y-2">
                    {ACTIVITY_PALETTE_ITEMS.map((item, idx) => {
                        const Icon = item.icon;
                        return (
                            <div 
                                key={`act-${idx}`}
                                draggable
                                onDragStart={(e) => handleDragStart(e, { subject: item.subject, isBreak: item.subject === 'Istirahat' })}
                                className={`p-2 rounded-lg text-xs font-bold cursor-grab active:cursor-grabbing flex items-center gap-2 transition-all hover:scale-105 hover:shadow-md ${item.color}`}
                            >
                                <GripVertical size={14} className="opacity-50"/>
                                {Icon && <Icon size={14}/>}
                                {item.subject}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>

        {/* Right: Schedule Grid */}
        <div className="flex-1 print-container">
            <div className="flex justify-between items-center mb-4 no-print">
                <p className="text-sm text-gray-500">Seret & lepas mata pelajaran ke dalam jadwal.</p>
                <div className="flex gap-2">
                    <button onClick={handleAddRow} className="flex items-center gap-2 bg-emerald-600 text-white font-bold px-4 py-2 rounded-lg shadow-md hover:bg-emerald-700">
                        <Plus size={16} /> Tambah Baris
                    </button>
                    <button onClick={handleGlobalSave} disabled={isSaving} className="flex items-center gap-2 bg-indigo-600 text-white font-bold px-4 py-2 rounded-lg shadow-md hover:bg-indigo-700 disabled:opacity-50">
                        <Save size={16} /> {isSaving ? 'Menyimpan...' : 'Simpan Semua Jadwal'}
                    </button>
                </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
                <table className="w-full border-collapse text-xs min-w-[1000px]">
                    <thead>
                        <tr className="bg-indigo-50 print:bg-indigo-50">
                            <th className="p-2 border font-bold text-indigo-900 w-32 print:text-indigo-900 text-center">Waktu</th>
                            {WEEKDAYS.map(day => (
                                <th key={day} className="p-2 border font-bold text-indigo-900 print:text-indigo-900 text-center">{day}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {localTimeSlots.map((time, index) => (
                            <tr key={index}>
                                <td className="p-1 border text-center font-semibold text-gray-600 bg-gray-50 print:bg-white relative group">
                                    <div className="flex items-center justify-center gap-1">
                                        <input 
                                            type="text" 
                                            value={time}
                                            onChange={(e) => handleTimeChange(index, e.target.value)}
                                            className="w-full text-center font-semibold text-gray-600 bg-gray-50 outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500 rounded p-1 print:bg-transparent print:p-0 print:border-none no-print"
                                            aria-label={`Edit time slot ${index + 1}`}
                                        />
                                        <button 
                                            onClick={() => handleRemoveRow(index)}
                                            className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity no-print"
                                            title="Hapus Baris"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                    <span className="hidden print:inline">{time}</span>
                                </td>
                                {WEEKDAYS.map(day => {
                                    const item = findItemForCell(day, time);
                                    const isDragOver = dragOverCell?.day === day && dragOverCell?.time === time;
                                    const isBreak = item?.subject.toLowerCase().includes('istirahat');

                                    return (
                                        <td 
                                            key={`${day}-${time}`} 
                                            onDragOver={(e) => handleDragOver(e, day, time)}
                                            onDrop={(e) => handleDrop(e, day, time)}
                                            onDragLeave={() => setDragOverCell(null)}
                                            className={`p-1 print:p-0.5 border align-top h-20 print:h-auto transition-colors ${isDragOver ? 'bg-indigo-100 border-2 border-dashed border-indigo-400' : ''}`}
                                        >
                                            {item && (
                                                <div 
                                                  draggable
                                                  onDragStart={(e) => handleDragStart(e, {subject: item.subject, isBreak}, {day, time})}
                                                  className={`relative group p-2 print:p-1 rounded-lg h-full flex flex-col justify-center text-center font-bold text-xs print:text-[10px] cursor-grab active:cursor-grabbing shadow-sm
                                                    ${isBreak ? 'bg-slate-600 text-white' : getSubjectColor(item.subject)}`}
                                                >
                                                  {isBreak && <Coffee size={14} className="mx-auto mb-1"/>}
                                                  {item.subject}
                                                  <button 
                                                    onClick={() => removeItem(item.id)}
                                                    className="absolute top-1 right-1 w-4 h-4 bg-black/20 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity no-print"
                                                  >
                                                    <X size={10}/>
                                                  </button>
                                                  {!isBreak && (
                                                    <button 
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        openEditLinks(item);
                                                      }}
                                                      className="absolute bottom-1 right-1 w-5 h-5 bg-black/20 hover:bg-black/40 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity no-print"
                                                      title="Sematkan Materi / Link Virtual"
                                                    >
                                                      <Paperclip size={10}/>
                                                    </button>
                                                  )}
                                                  {!isBreak && ((item.meetUrl || item.zoomUrl) || (item.attachedMaterialIds && item.attachedMaterialIds.length > 0)) && (
                                                    <div className="absolute bottom-1 left-1 flex items-center gap-1 no-print">
                                                      {item.meetUrl && (
                                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" title="Google Meet Tersedia" />
                                                      )}
                                                      {item.zoomUrl && (
                                                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500" title="Zoom Tersedia" />
                                                      )}
                                                      {item.attachedMaterialIds && item.attachedMaterialIds.length > 0 && (
                                                        <span className="px-1 py-0.5 rounded bg-amber-500 text-white font-black text-[8px] flex items-center gap-0.5" title={`${item.attachedMaterialIds.length} Materi Disematkan`}>
                                                          <Paperclip size={8}/>{item.attachedMaterialIds.length}
                                                        </span>
                                                      )}
                                                    </div>
                                                  )}
                                                </div>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>

      {/* Meet, Zoom Links & Embedded Materials Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 max-w-lg w-full max-h-[90vh] overflow-y-auto animate-scale-up">
            <div className="flex justify-between items-center mb-5 pb-3 border-b">
              <div>
                <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                  <Paperclip className="text-indigo-600" size={20}/>
                  Sematkan Materi & Tautan Jadwal
                </h3>
                <p className="text-xs text-indigo-600 font-semibold mt-0.5">
                  {editingItem.day} • Jam {editingItem.time} — {editingItem.subject}
                </p>
              </div>
              <button 
                onClick={() => setEditingItem(null)} 
                className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 bg-gray-50 rounded-xl"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Section 1: Embed Materials */}
              <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen size={15} className="text-indigo-600"/>
                    Sematkan Materi Pelajaran / Tugas
                  </label>
                  <span className="text-[11px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                    {selectedMaterialIds.length} Terpilih
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-3">
                  Pilih materi/tugas yang berhubungan dengan jadwal mata pelajaran ini. Siswa akan mendapatkan notifikasi badge khusus pada portal student.
                </p>

                {materials.length === 0 ? (
                  <div className="p-3 bg-white rounded-xl border border-dashed border-indigo-200 text-center">
                    <p className="text-xs text-slate-500">Belum ada data materi pelajaran yang dibuat.</p>
                    <p className="text-[11px] text-indigo-600 font-semibold mt-1">
                      Anda dapat membuat materi di tab "Materi Belajar" terlebih dahulu.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
                      <input 
                        type="text"
                        placeholder="Cari materi berdasarkan judul/deskripsi..."
                        value={materialSearchQuery}
                        onChange={(e) => setMaterialSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-white border border-indigo-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>

                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                      {materials
                        .filter(m => {
                          if (!materialSearchQuery) return true;
                          const q = materialSearchQuery.toLowerCase();
                          return m.title.toLowerCase().includes(q) || (m.description && m.description.toLowerCase().includes(q));
                        })
                        .map(mat => {
                          const isSelected = selectedMaterialIds.includes(mat.id);
                          return (
                            <div 
                              key={mat.id}
                              onClick={() => handleToggleMaterial(mat.id)}
                              className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                                isSelected 
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                                  : 'bg-white hover:bg-indigo-50/50 text-gray-700 border-gray-200'
                              }`}
                            >
                              <div className="flex-1 pr-2">
                                <div className="flex items-center gap-1.5">
                                  <p className="text-xs font-bold leading-tight line-clamp-1">{mat.title}</p>
                                </div>
                                {mat.description && (
                                  <p className={`text-[10px] line-clamp-1 mt-0.5 ${isSelected ? 'text-indigo-100' : 'text-gray-500'}`}>
                                    {mat.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-1 mt-1">
                                  {mat.videoLink && (
                                    <span className={`text-[9px] px-1.5 py-0.2 rounded ${isSelected ? 'bg-indigo-500 text-white' : 'bg-red-100 text-red-700'}`}>
                                      Video
                                    </span>
                                  )}
                                  {mat.taskLink || mat.taskFile ? (
                                    <span className={`text-[9px] px-1.5 py-0.2 rounded ${isSelected ? 'bg-indigo-500 text-white' : 'bg-emerald-100 text-emerald-700'}`}>
                                      Ada Tugas
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                              <div className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all shrink-0 ${
                                isSelected ? 'bg-white text-indigo-600 border-white' : 'bg-gray-50 text-transparent border-gray-300'
                              }`}>
                                <Check size={12} strokeWidth={3} />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>

              {/* Section 2: Virtual Meeting Links */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Link Kelas Virtual (Opsional)
                </label>
                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-green-500">
                      <Video size={16} />
                    </div>
                    <input
                      type="url"
                      placeholder="Google Meet (https://meet.google.com/...)"
                      value={meetUrlInput}
                      onChange={(e) => setMeetUrlInput(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 font-medium text-gray-700"
                    />
                  </div>
                </div>

                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-sky-500">
                      <Video size={16} />
                    </div>
                    <input
                      type="url"
                      placeholder="Zoom Meeting (https://us02web.zoom.us/j/...)"
                      value={zoomUrlInput}
                      onChange={(e) => setZoomUrlInput(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-medium text-gray-700"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Extra Notes for Students */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <FileText size={14} className="text-amber-500"/>
                  Catatan Instruksi Guru (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Baca bab 3 dan siapkan buku catatan sebelum pembelajaran dimulai..."
                  value={attachedNotesInput}
                  onChange={(e) => setAttachedNotesInput(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium text-gray-700 resize-none"
                />
              </div>

              <div className="bg-amber-50/80 rounded-2xl p-3 border border-amber-100 flex items-start gap-2.5">
                <Sparkles className="text-amber-600 shrink-0 mt-0.5" size={16} />
                <p className="text-[11px] text-amber-900 leading-relaxed font-semibold">
                  Materi dan instruksi ini akan otomatis disematkan pada jadwal pelajaran portal student. Siswa akan mendapatkan badge notifikasi langsung saat membuka jadwal!
                </p>
              </div>
            </div>

            <div className="flex gap-2.5 mt-6 pt-4 border-t">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 font-bold rounded-xl text-xs hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveLinks}
                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-xs hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-colors flex items-center justify-center gap-1.5"
              >
                <Check size={16} />
                Simpan Sematan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ScheduleTab;