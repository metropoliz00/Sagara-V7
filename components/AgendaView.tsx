
import React, { useState, useMemo, useRef } from 'react';
import { AgendaItem } from '../types';
import { 
  Calendar, ListTodo, Plus, CheckCircle, Trash2, 
  Printer, Search, Edit2, Filter, X, AlertCircle, Clock, Upload, Download, FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';
import CustomModal from './CustomModal';
import { getLocalISODate } from '../utils/dateUtils';

interface AgendaViewProps {
  agendas: AgendaItem[];
  onAddAgenda: (item: AgendaItem) => void;
  onUpdateAgenda: (item: AgendaItem) => void;
  onToggleAgenda: (id: string) => void;
  onDeleteAgenda: (id: string) => void;
  onShowNotification: (message: string, type: 'success' | 'error' | 'warning') => void;
  classId: string;
  hideHeader?: boolean;
}

const AgendaView: React.FC<AgendaViewProps> = ({ 
  agendas, onAddAgenda, onUpdateAgenda, onToggleAgenda, onDeleteAgenda, 
  onShowNotification, classId, hideHeader = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [editingAgenda, setEditingAgenda] = useState<AgendaItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const [newAgenda, setNewAgenda] = useState<{title: string; date: string; endDate: string; time: string; type: 'urgent'|'warning'|'info'}>({
    title: '', date: getLocalISODate(), endDate: '', time: '', type: 'info'
  });

  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, action: () => void, message: string}>({
      isOpen: false, action: () => {}, message: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'JUDUL AGENDA': 'Rapat Wali Murid Kelas',
        'TANGGAL (YYYY-MM-DD)': getLocalISODate(),
        'WAKTU (HH:MM)': '08:00',
        'PRIORITAS (info/warning/urgent)': 'info'
      },
      {
        'JUDUL AGENDA': 'Ujian Tengah Semester',
        'TANGGAL (YYYY-MM-DD)': getLocalISODate(),
        'WAKTU (HH:MM)': '07:30',
        'PRIORITAS (info/warning/urgent)': 'urgent'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Agenda");
    XLSX.writeFile(wb, "Template_Agenda_Kelas.xlsx");
    onShowNotification("Template Excel berhasil diunduh!", "success");
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const bstr = event.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json<any>(ws);

        if (rawData.length === 0) {
          onShowNotification("Berkas Excel kosong atau format salah.", "error");
          return;
        }

        let importedCount = 0;
        rawData.forEach((row: any) => {
          const title = row['JUDUL AGENDA'];
          const date = row['TANGGAL (YYYY-MM-DD)'];
          const time = row['WAKTU (HH:MM)'] ? String(row['WAKTU (HH:MM)']) : undefined;
          let type = String(row['PRIORITAS (info/warning/urgent)'] || 'info').toLowerCase().trim();
          if (type !== 'info' && type !== 'warning' && type !== 'urgent') {
            type = 'info';
          }

          if (title && date) {
            onAddAgenda({
              id: `imported-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
              classId,
              title: String(title),
              date: String(date),
              time,
              type: type as 'info' | 'warning' | 'urgent',
              completed: false
            });
            importedCount++;
          }
        });

        if (importedCount > 0) {
          onShowNotification(`Berhasil mengimpor ${importedCount} agenda!`, "success");
        } else {
          onShowNotification("Format kolom tidak sesuai atau tidak ada data valid.", "error");
        }
      } catch (err) {
        console.error(err);
        onShowNotification("Gagal membaca berkas Excel.", "error");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const handleExportExcel = () => {
    if (filteredAgendas.length === 0) {
      onShowNotification("Tidak ada data agenda untuk diekspor.", "warning");
      return;
    }

    const exportData = filteredAgendas.map((item, idx) => ({
      'NO': idx + 1,
      'JUDUL AGENDA': item.title,
      'TANGGAL': item.date,
      'WAKTU': item.time || '-',
      'PRIORITAS': item.type,
      'STATUS': item.completed ? 'Selesai' : 'Belum Selesai'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Agenda Kelas");
    XLSX.writeFile(wb, `Agenda_Kelas_${classId}.xlsx`);
    onShowNotification("Data agenda berhasil diekspor ke Excel!", "success");
  };

  const filteredAgendas = useMemo(() => {
    return agendas.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDateRange = (!startDate || item.date >= startDate) && (!endDate || item.date <= endDate);
      return matchesSearch && matchesDateRange;
    }).sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA; // Newest first
    });
  }, [agendas, searchTerm, startDate, endDate]);

  const formatLongDate = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
      const date = new Date(dateStr + 'T00:00:00');
      if (isNaN(date.getTime())) return dateStr;
      return new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(date).replace('Jumat', "Jum'at").replace('jumat', "jum'at");
    } catch (e) {
      return dateStr;
    }
  };

  const handleSubmitAgenda = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAgenda) {
      onUpdateAgenda(editingAgenda);
      setEditingAgenda(null);
    } else {
      if (newAgenda.title && newAgenda.date) {
        onAddAgenda({
          id: Date.now().toString(),
          classId, 
          title: newAgenda.title, 
          date: newAgenda.date, 
          endDate: newAgenda.endDate || undefined,
          time: newAgenda.time || undefined,
          type: newAgenda.type, 
          completed: false
        });
        setNewAgenda({ title: '', date: getLocalISODate(), endDate: '', time: '', type: 'info' });
        setIsAddModalOpen(false);
      }
    }
  };

  const handleDeleteClick = (id: string) => {
    setConfirmModal({
      isOpen: true,
      message: "Hapus agenda ini?",
      action: () => {
        onDeleteAgenda(id);
        setConfirmModal(prev => ({...prev, isOpen: false}));
      }
    });
  };

  const handlePrint = () => window.print();

  return (
    <div className="space-y-6 animate-fade-in relative page-portrait">
      <CustomModal 
        isOpen={confirmModal.isOpen}
        type="confirm"
        message={confirmModal.message}
        onConfirm={confirmModal.action}
        onCancel={() => setConfirmModal(prev => ({...prev, isOpen: false}))}
      />

      {!hideHeader && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Agenda</h2>
            <p className="text-gray-500">Jadwal dan agenda kegiatan kelas.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".xlsx, .xls, .csv" />
            <button 
              onClick={handleDownloadTemplate}
              className="flex items-center space-x-2 bg-blue-50 text-blue-600 border border-blue-200 px-4 py-2 rounded-lg hover:bg-blue-100 transition text-sm font-semibold"
              title="Unduh Template Excel"
            >
              <Download size={18} />
              <span>Unduh Template</span>
            </button>
            <button 
              onClick={handleImportClick}
              className="flex items-center space-x-2 bg-amber-50 text-amber-600 border border-amber-200 px-4 py-2 rounded-lg hover:bg-amber-100 transition text-sm font-semibold"
              title="Import Agenda dari Excel"
            >
              <Upload size={18} />
              <span>Import Excel</span>
            </button>
            <button 
              onClick={handleExportExcel}
              className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition text-sm font-semibold"
              title="Export Agenda ke Excel"
            >
              <FileSpreadsheet size={18} />
              <span>Export Excel</span>
            </button>
            <button 
              onClick={() => setIsAddModalOpen(true)} 
              className="p-2 bg-[#5AB2FF] text-white rounded-lg hover:bg-[#A0DEFF] shadow-md flex items-center gap-2 font-bold text-sm"
            >
              <Plus size={18} /> <span>Tambah Agenda</span>
            </button>
            <button onClick={handlePrint} className="p-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50" title="Cetak Agenda">
              <Printer size={18}/>
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-[#CAF4FF] shadow-sm no-print flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cari Agenda</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Cari judul agenda..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#5AB2FF] outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Dari Tanggal</label>
          <input 
            type="date" 
            value={startDate} 
            onChange={e => setStartDate(e.target.value)}
            className="border p-2 rounded-xl text-sm focus:ring-2 focus:ring-[#5AB2FF] outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Sampai Tanggal</label>
          <input 
            type="date" 
            value={endDate} 
            onChange={e => setEndDate(e.target.value)}
            className="border p-2 rounded-xl text-sm focus:ring-2 focus:ring-[#5AB2FF] outline-none"
          />
        </div>
        {(startDate || endDate || searchTerm) && (
          <button 
            onClick={() => {setStartDate(''); setEndDate(''); setSearchTerm('');}}
            className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
            title="Reset Filter"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Agenda List */}
      <div className="space-y-3 print:w-full">
        <div className="hidden print-only text-center mb-6">
          <h2 className="text-xl font-bold uppercase">AGENDA KELAS</h2>
        </div>
        
        {filteredAgendas.length > 0 ? (
          filteredAgendas.map((item, index) => (
            <div 
              key={item.id} 
              className={`flex items-center p-4 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md print:border-black print:mb-2 ${
                item.completed ? 'bg-gray-50' : index % 2 === 0 ? 'bg-white' : 'bg-[#CAF4FF]/10'
              }`}
            >
              <button 
                onClick={() => onToggleAgenda(item.id)} 
                className={`mr-4 transition-colors ${item.completed ? 'text-emerald-500' : 'text-gray-300 hover:text-emerald-300'} print:text-black`}
              >
                <CheckCircle size={28} />
              </button>
              
              <div className="flex-1">
                <div className="flex items-center text-xs text-gray-500 mb-1 gap-3 font-medium">
                  <span className="flex items-center gap-1">
                    <Calendar size={12}/> 
                    {formatLongDate(item.date)}
                    {item.endDate && item.endDate !== item.date && (
                      <>
                        <span className="mx-1">-</span>
                        {formatLongDate(item.endDate)}
                      </>
                    )}
                  </span>
                  {item.time && <span className="flex items-center gap-1"><Clock size={12}/> {item.time}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <h4 className={`font-bold text-gray-800 print:text-black ${item.completed ? 'line-through text-gray-400' : ''}`}>
                    {item.title}
                  </h4>
                  {item.type === 'urgent' && <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded-full uppercase">Urgent</span>}
                  {item.type === 'warning' && <span className="px-2 py-0.5 bg-amber-100 text-amber-600 text-[10px] font-bold rounded-full uppercase">Warning</span>}
                </div>
              </div>

              <div className="flex items-center gap-2 no-print">
                <button 
                  onClick={() => setEditingAgenda(item)} 
                  className="p-2 text-gray-400 hover:text-[#5AB2FF] hover:bg-[#CAF4FF]/20 rounded-lg transition-all"
                  title="Edit Agenda"
                >
                  <Edit2 size={18}/>
                </button>
                <button 
                  onClick={() => handleDeleteClick(item.id)} 
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  title="Hapus Agenda"
                >
                  <Trash2 size={18}/>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white p-12 rounded-2xl border border-dashed border-gray-300 text-center">
            <ListTodo size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Tidak ada agenda ditemukan.</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(isAddModalOpen || editingAgenda) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm no-print">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-in">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-[#CAF4FF]/30">
              <h3 className="font-bold text-lg">{editingAgenda ? 'Edit Agenda' : 'Tambah Agenda Baru'}</h3>
              <button onClick={() => {setIsAddModalOpen(false); setEditingAgenda(null);}} className="p-1 hover:bg-gray-200 rounded-full">
                <X size={20}/>
              </button>
            </div>
            <form onSubmit={handleSubmitAgenda} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Judul Agenda</label>
                <input 
                  required 
                  className="w-full border p-2 rounded-xl text-sm focus:ring-2 focus:ring-[#5AB2FF] outline-none" 
                  placeholder="Contoh: Rapat Wali Murid" 
                  value={editingAgenda ? editingAgenda.title : newAgenda.title} 
                  onChange={e => editingAgenda ? setEditingAgenda({...editingAgenda, title: e.target.value}) : setNewAgenda({...newAgenda, title: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tanggal Mulai</label>
                  <input 
                    required
                    type="date" 
                    className="w-full border p-2 rounded-xl text-sm focus:ring-2 focus:ring-[#5AB2FF] outline-none" 
                    value={editingAgenda ? editingAgenda.date : newAgenda.date} 
                    onChange={e => editingAgenda ? setEditingAgenda({...editingAgenda, date: e.target.value}) : setNewAgenda({...newAgenda, date: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Waktu (Opsional)</label>
                  <input 
                    type="time" 
                    className="w-full border p-2 rounded-xl text-sm focus:ring-2 focus:ring-[#5AB2FF] outline-none" 
                    value={editingAgenda ? (editingAgenda.time || '') : newAgenda.time} 
                    onChange={e => editingAgenda ? setEditingAgenda({...editingAgenda, time: e.target.value}) : setNewAgenda({...newAgenda, time: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Prioritas</label>
                  <select
                    className="w-full border p-2 rounded-xl text-sm focus:ring-2 focus:ring-[#5AB2FF] outline-none"
                    value={editingAgenda ? editingAgenda.type : newAgenda.type}
                    onChange={e => editingAgenda ? setEditingAgenda({...editingAgenda, type: e.target.value as any}) : setNewAgenda({...newAgenda, type: e.target.value as any})}
                  >
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => {setIsAddModalOpen(false); setEditingAgenda(null);}} 
                  className="flex-1 py-2.5 rounded-xl border text-sm font-bold hover:bg-gray-50"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2.5 rounded-xl bg-[#5AB2FF] text-white font-bold text-sm hover:bg-[#A0DEFF] shadow-lg shadow-[#5AB2FF]/30"
                >
                  {editingAgenda ? 'Simpan Perubahan' : 'Simpan Agenda'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgendaView;
