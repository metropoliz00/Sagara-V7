import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { GtkRecord, User } from '../types';
import { Save, Plus, Trash2, Edit2, Download, Search, X, Camera, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import { formatDateID, formatDateNumericID } from '../utils/dateUtils';
import { compressImage } from '../utils/imageHelper';

interface GtkDataViewProps {
  gtkData: GtkRecord[];
  users: User[];
  currentUser: User | null;
  onSaveGtk: (records: GtkRecord[]) => Promise<void>;
  onDeleteGtk?: (id: string) => Promise<void>;
  onShowNotification: (message: string, type: 'success' | 'error' | 'warning') => void;
}

const parseDate = (dateString: string) => {
  if (!dateString) return 0;
  const parts = dateString.split('-');
  if (parts.length === 3) {
    return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0])).getTime();
  }
  return 0;
};

const months = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const formatDate = (dateString: string) => {
  return formatDateID(dateString);
};

const getRankValue = (rank: string) => {
  if (!rank) return 0;
  // Convert standard rank format e.g. "IV/a", "III/b" to numeric value
  const r = rank.toLowerCase().trim();
  const rankMap: Record<string, number> = {
    'iv/e': 17, 'iv/d': 16, 'iv/c': 15, 'iv/b': 14, 'iv/a': 13,
    'iii/d': 12, 'iii/c': 11, 'iii/b': 10, 'iii/a': 9,
    'ii/d': 8, 'ii/c': 7, 'ii/b': 6, 'ii/a': 5,
    'i/d': 4, 'i/c': 3, 'i/b': 2, 'i/a': 1
  };
  return rankMap[r] || 0;
};

const GtkDataView: React.FC<GtkDataViewProps> = ({ gtkData, users, currentUser, onSaveGtk, onDeleteGtk, onShowNotification }) => {
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'Kepala Sekolah';

  const canEdit = (record: GtkRecord) => {
    return isAdmin || (currentUser && record.userId === currentUser.id);
  };
  const [data, setData] = useState<GtkRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<GtkRecord | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'NAMA': 'Ahmad Fauzi, S.Pd.',
        'NIP': '198501012010011002',
        'NUPTK': '1234567890123456',
        'JENIS KELAMIN': 'Laki-laki',
        'TEMPAT LAHIR': 'Jakarta',
        'TANGGAL LAHIR': '1985-01-01',
        'IJAZAH TERTINGGI': 'S1 Pendidikan',
        'JABATAN': 'Guru Kelas',
        'STATUS': 'PNS',
        'TMT PENGANGKATAN': '2010-01-01',
        'MULAI BEKERJA DISINI': '2012-07-01',
        'PANGKAT/GOL': 'Penata, III/c',
        'MASA KERJA (THN)': 15,
        'MASA KERJA (BLN)': 6,
        'TANGGAL DAN NO SK TERAKHIR': '01/01/2010 No: 123/SK/2010',
        'EMAIL PRIBADI': 'ahmad.fauzi@gmail.com',
        'EMAIL BELAJAR': 'ahmad.fauzi@guru.sd.belajar.id'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template GTK");
    XLSX.writeFile(wb, "Template_Data_GTK.xlsx");
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
    reader.onload = async (event) => {
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

        const importedRecords: GtkRecord[] = rawData.map((row: any) => {
          const jkRaw = String(row['JENIS KELAMIN'] || '').trim().toLowerCase();
          const jk = (jkRaw.includes('p') || jkRaw.includes('wanita') || jkRaw.includes('perempuan') ? 'P' : 'L') as "" | "L" | "P";
          return {
            id: row['ID'] || `gtk-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            nama: row['NAMA'] || row['NAMA LENGKAP'] || '',
            nip: row['NIP'] ? String(row['NIP']) : '',
            nuptk: row['NUPTK'] ? String(row['NUPTK']) : '',
            jenisKelamin: jk,
            tempatLahir: row['TEMPAT LAHIR'] || '',
            tanggalLahir: row['TANGGAL LAHIR'] || '',
            ijazahTertinggi: row['IJAZAH TERTINGGI'] || '',
            jabatan: row['JABATAN'] || '',
            statusPegawai: row['STATUS'] || row['STATUS PEGAWAI'] || 'HONORER',
            tmtPengangkatan: row['TMT PENGANGKATAN'] || '',
            mulaiBekerjaDiSini: row['MULAI BEKERJA DISINI'] || '',
            pangkatGolongan: row['PANGKAT/GOL'] || row['PANGKAT'] || '',
            masaKerjaTahun: Number(row['MASA KERJA (THN)']) || 0,
            masaKerjaBulan: Number(row['MASA KERJA (BLN)']) || 0,
            skTerakhir: row['TANGGAL DAN NO SK TERAKHIR'] || row['SK TERAKHIR'] || '',
            emailPribadi: row['EMAIL PRIBADI'] || '',
            emailBelajar: row['EMAIL BELAJAR'] || '',
            foto: row['FOTO'] || ''
          };
        }).filter((r: any) => r.nama.trim() !== '');

        if (importedRecords.length === 0) {
          onShowNotification("Tidak ada baris data GTK yang valid.", "error");
          return;
        }

        const currentMap = new Map(data.map(item => [item.nip || item.nama, item]));
        importedRecords.forEach(rec => {
          const key = rec.nip || rec.nama;
          currentMap.set(key, { ...currentMap.get(key), ...rec });
        });

        const mergedList = Array.from(currentMap.values());
        await onSaveGtk(mergedList);
        setData(mergedList);
        onShowNotification(`Berhasil mengimpor ${importedRecords.length} data GTK!`, "success");
      } catch (err) {
        console.error(err);
        onShowNotification("Gagal membaca berkas Excel.", "error");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Helper to identify system admin / Admin Sagara accounts (not GTK)
    const isSystemAdminUser = (u: any) => {
      const name = (u.fullName || u.name || '').toLowerCase();
      const pos = (u.position || '').toLowerCase();
      const username = (u.username || '').toLowerCase();
      return (
        name.includes('admin sagara') ||
        name.includes('admin sistem') ||
        username === 'admin' ||
        username.includes('admin') ||
        pos.includes('admin') ||
        pos.includes('operator sistem') ||
        (u.role === 'admin' && (name.includes('admin') || pos.includes('admin') || !pos))
      );
    };

    // Find staff in users table (excluding system admins)
    const staffUsers = users.filter(u => !isSystemAdminUser(u) && (u.role === 'admin' || u.role === 'guru' || u.role === 'Kepala Sekolah'));
    
    let hasChanges = false;
    const mergedData = [...gtkData];

    staffUsers.forEach(u => {
      // Find by userId first, or by NIP/Name
      const existingIdx = mergedData.findIndex(g => g.userId === u.id || (u.nip && g.nip === u.nip) || g.nama === u.fullName);
      
      if (existingIdx >= 0) {
        // Update some fields if empty in GTK but present in user profile
        const g = mergedData[existingIdx];
        let changed = false;
        if (!g.userId) { g.userId = u.id; changed = true; }
        if (!g.nama && u.fullName) { g.nama = u.fullName; changed = true; }
        if (!g.nip && u.nip) { g.nip = u.nip; changed = true; }
        if (!g.nuptk && u.nuptk) { g.nuptk = u.nuptk; changed = true; }
        if (!g.jabatan && u.position) { g.jabatan = u.position; changed = true; }
        if (!g.pangkatGolongan && u.rank) { g.pangkatGolongan = u.rank; changed = true; }
        if (!g.emailPribadi && u.email) { g.emailPribadi = u.email; changed = true; }
        
        // Fix: Only sync photo if GTK record doesn't have one, or prioritize GTK photo
        if (!g.foto && u.photo) { 
          g.foto = u.photo; 
          changed = true; 
        }
        
        if (changed) hasChanges = true;
      } else {
        // Create new record for user
        const newRecord: GtkRecord = {
          id: `gtk-${Date.now()}-${Math.random().toString(36).substring(2,9)}`,
          userId: u.id,
          nama: u.fullName || '',
          nip: u.nip || '',
          nuptk: u.nuptk || '',
          jenisKelamin: '',
          tempatLahir: '',
          tanggalLahir: '',
          ijazahTertinggi: u.education || '',
          jabatan: u.position || '',
          statusPegawai: '',
          tmtPengangkatan: '',
          mulaiBekerjaDiSini: '',
          pangkatGolongan: u.rank || '',
          masaKerjaTahun: 0,
          masaKerjaBulan: 0,
          skTerakhir: '',
          emailPribadi: u.email || '',
          emailBelajar: '',
          foto: u.photo || ''
        };
        mergedData.push(newRecord);
        hasChanges = true;
      }
    });

    if (hasChanges) {
      onSaveGtk(mergedData).catch(e => console.error("Auto sync GTK error:", e));
    }
    
    setData(mergedData);
  }, [gtkData, users]);

  useEffect(() => {
    if (location.state?.autoEditUserGtk && currentUser && data.length > 0) {
      const userRecord = data.find(g => g.userId === currentUser.id);
      if (userRecord) {
        setEditingRecord(userRecord);
        setIsModalOpen(true);
      }
      
      const newState = { ...location.state };
      delete newState.autoEditUserGtk;
      navigate(location.pathname, { replace: true, state: newState });
    }
  }, [location.state, currentUser, data, navigate, location.pathname]);

  // Sort logic
  const sortedData = useMemo(() => {
    const isSysAdmin = (name?: string, pos?: string) => {
      const n = (name || '').toLowerCase();
      const p = (pos || '').toLowerCase();
      return n.includes('admin sagara') || n.includes('admin sistem') || p.includes('admin sistem') || p === 'admin' || p.includes('operator sistem');
    };

    let result = [...data].filter(r => r.jabatan && r.jabatan.trim() !== '' && !isSysAdmin(r.nama, r.jabatan));
    if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        result = result.filter(r => r.nama.toLowerCase().includes(lowerSearch) || r.nip.includes(lowerSearch));
    }

    return result.sort((a, b) => {
      // Prioritization map
      const getRolePriority = (jabatan: string) => {
        const j = jabatan.toLowerCase();
        if (j.includes('kepala sekolah')) return 3;
        if (j.includes('guru')) return 2;
        return 1;
      };

      const statusPriority: Record<string, number> = {
        'pns': 4,
        'pppk': 3,
        'pppk pw': 2,
        'honorer': 1
      };

      // 1. Role priority
      const aRole = getRolePriority(a.jabatan);
      const bRole = getRolePriority(b.jabatan);
      if (aRole !== bRole) return bRole - aRole;

      const getPriority = (status: string) => {
        const s = status.toLowerCase().trim();
        if (statusPriority.hasOwnProperty(s)) {
          return statusPriority[s];
        }
        return 0; // Unknowns at the very bottom
      };

      // 2. Status Pegawai sorting
      const aPriority = getPriority(a.statusPegawai);
      const bPriority = getPriority(b.statusPegawai);
      if (aPriority !== bPriority) return bPriority - aPriority;

      // 3. Rank sorting (descending)
      const aRank = getRankValue(a.pangkatGolongan);
      const bRank = getRankValue(b.pangkatGolongan);
      if (aRank !== bRank) return bRank - aRank;

      // 4. Birth date (older first)
      const aDate = parseDate(a.tanggalLahir);
      const bDate = parseDate(b.tanggalLahir);
      return aDate - bDate;
    });
  }, [data, searchTerm]);

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    setIsSaving(true);
    
    try {
      let newData = [...data];
      if (data.find(d => d.id === editingRecord.id)) {
        newData = newData.map(d => d.id === editingRecord.id ? editingRecord : d);
      } else {
        newData.push(editingRecord);
      }
      
      await onSaveGtk(newData);
      setData(newData);
      setIsModalOpen(false);
      onShowNotification("Data GTK berhasil disimpan", "success");
    } catch (e) {
      console.error(e);
      onShowNotification("Gagal menyimpan data GTK", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus data GTK ini?")) {
      try {
        if (onDeleteGtk) {
          await onDeleteGtk(id);
        } else {
          const newData = data.filter(d => d.id !== id);
          await onSaveGtk(newData);
        }
        setData(data.filter(d => d.id !== id));
        onShowNotification("Data GTK berhasil dihapus", "success");
      } catch (e) {
        onShowNotification("Gagal menghapus data GTK", "error");
      }
    }
  };

  const handleExport = () => {
    const exportData = sortedData.map((d, index) => ({
      'NO': index + 1,
      'NAMA': d.nama,
      'NIP': d.nip,
      'NUPTK': d.nuptk,
      'JENIS KELAMIN': d.jenisKelamin === 'L' ? 'Laki-laki' : d.jenisKelamin === 'P' ? 'Perempuan' : '',
      'TEMPAT LAHIR': d.tempatLahir,
      'TANGGAL LAHIR': d.tanggalLahir,
      'IJAZAH TERTINGGI': d.ijazahTertinggi,
      'JABATAN': d.jabatan,
      'STATUS': d.statusPegawai,
      'TMT PENGANGKATAN': d.tmtPengangkatan,
      'MULAI BEKERJA DISINI': d.mulaiBekerjaDiSini,
      'PANGKAT/GOL': d.pangkatGolongan,
      'MASA KERJA (THN)': d.masaKerjaTahun,
      'MASA KERJA (BLN)': d.masaKerjaBulan,
      'TANGGAL DAN NO SK TERAKHIR': d.skTerakhir,
      'EMAIL PRIBADI': d.emailPribadi,
      'EMAIL BELAJAR': d.emailBelajar
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data GTK");
    XLSX.writeFile(wb, "Data_GTK.xlsx");
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Data Guru & Tenaga Kependidikan (GTK)</h2>
          <p className="text-gray-500">Kelola dan sinkronisasi data master GTK.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".xlsx, .xls, .csv" />
          <button 
            onClick={handleDownloadTemplate}
            className="flex items-center space-x-2 bg-blue-50 text-blue-600 px-4 py-2 border border-blue-200 rounded-lg hover:bg-blue-100 transition text-sm font-semibold"
            title="Unduh Template Excel"
          >
            <Download size={18} />
            <span>Unduh Template</span>
          </button>
          {isAdmin && (
            <button 
              onClick={handleImportClick}
              className="flex items-center space-x-2 bg-amber-50 text-amber-600 px-4 py-2 border border-amber-200 rounded-lg hover:bg-amber-100 transition text-sm font-semibold"
              title="Import Data dari Excel"
            >
              <Upload size={18} />
              <span>Import Excel</span>
            </button>
          )}
          <button 
            onClick={handleExport}
            className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition text-sm font-semibold"
          >
            <Download size={18} />
            <span>Export Excel</span>
          </button>
          {isAdmin && (
            <button 
              onClick={() => {
                setEditingRecord({
                  id: `gtk-${Date.now()}`,
                  nama: '', 
                  nip: '', 
                  nuptk: '', 
                  jenisKelamin: '', 
                  tempatLahir: '', 
                  tanggalLahir: '',
                  ijazahTertinggi: '', 
                  jabatan: '', 
                  statusPegawai: '', 
                  tmtPengangkatan: '',
                  mulaiBekerjaDiSini: '', 
                  pangkatGolongan: '', 
                  masaKerjaTahun: 0, 
                  masaKerjaBulan: 0,
                  skTerakhir: '', 
                  emailPribadi: '', 
                  emailBelajar: '', 
                  foto: ''
                });
                setIsModalOpen(true);
              }}
              className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
            >
              <Plus size={18} />
              <span>Tambah Pendidik</span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center mb-4">
        <Search className="text-gray-400 mr-2" size={20} />
        <input 
          type="text" 
          placeholder="Cari nama atau NIP..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 outline-none text-sm"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 border-b whitespace-nowrap">
              <tr>
                <th className="p-3 text-center">NO</th>
                <th className="p-3 text-center">FOTO</th>
                <th className="p-3">NAMA</th>
                <th className="p-3">NIP</th>
                <th className="p-3">NUPTK</th>
                <th className="p-3 text-center">JENIS KELAMIN</th>
                <th className="p-3">TEMPAT, TANGGAL LAHIR</th>
                <th className="p-3">IJAZAH TER TINGGI</th>
                <th className="p-3">JABATAN</th>
                <th className="p-3">STATUS</th>
                <th className="p-3">TMT PENGANGKATAN</th>
                <th className="p-3">MULAI BEKERJA DISINI</th>
                <th className="p-3">PANGKAT/GOL</th>
                <th className="p-3 text-center">MASA KERJA</th>
                <th className="p-3">SK TERAKHIR</th>
                <th className="p-3">EMAIL PRIBADI</th>
                <th className="p-3">EMAIL BELAJAR</th>
                <th className="p-3 text-center sticky right-0 bg-gray-50">AKSI</th>
              </tr>
            </thead>
            <tbody>
              {sortedData.length === 0 ? (
                <tr>
                  <td colSpan={18} className="p-8 text-center text-gray-500">Belum ada data GTK.</td>
                </tr>
              ) : (
                sortedData.map((row, index) => (
                  <tr key={row.id} className="border-b hover:bg-gray-50 whitespace-nowrap">
                    <td className="p-3 text-center">{index + 1}</td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center">
                        {row.foto ? (
                          <img src={row.foto} alt="Foto" className="w-10 h-10 rounded-full object-cover border border-gray-200 shadow-sm" />
                        ) : (
                          <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-400">
                            <Camera size={16} />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-3 font-semibold text-gray-800">
                        {row.nama}
                    </td>
                    <td className="p-3">{row.nip}</td>
                    <td className="p-3">{row.nuptk}</td>
                    <td className="p-3 text-center">{row.jenisKelamin}</td>
                    <td className="p-3">{row.tempatLahir ? `${row.tempatLahir}, ${formatDate(row.tanggalLahir)}` : formatDate(row.tanggalLahir)}</td>
                    <td className="p-3">{row.ijazahTertinggi}</td>
                    <td className="p-3">{row.jabatan}</td>
                    <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.statusPegawai.toLowerCase() === 'pns' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                            {row.statusPegawai || '-'}
                        </span>
                    </td>
                    <td className="p-3">{formatDateNumericID(row.tmtPengangkatan)}</td>
                    <td className="p-3">{formatDateNumericID(row.mulaiBekerjaDiSini)}</td>
                    <td className="p-3">{row.pangkatGolongan}</td>
                    <td className="p-3 text-center">
                      {String(row.masaKerjaTahun).padStart(2, '0')} Th {String(row.masaKerjaBulan).padStart(2, '0')} Bln
                    </td>
                    <td className="p-3">{row.skTerakhir}</td>
                    <td className="p-3 text-blue-600">{row.emailPribadi}</td>
                    <td className="p-3 text-emerald-600">{row.emailBelajar}</td>
                    <td className="p-3 text-center sticky right-0 bg-white group-hover:bg-gray-50">
                      <div className="flex justify-center gap-2">
                        {canEdit(row) && (
                          <button onClick={() => { setEditingRecord(row); setIsModalOpen(true); }} className="text-blue-600 p-1 hover:bg-blue-50 rounded" title="Edit">
                            <Edit2 size={16} />
                          </button>
                        )}
                        {isAdmin && (
                          <button onClick={() => handleDelete(row.id)} className="text-red-600 p-1 hover:bg-red-50 rounded" title="Hapus">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && editingRecord && (
        <div className="fixed inset-0 bg-black/50 z-[110] flex items-center justify-center p-2 sm:p-4 pb-20 sm:pb-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[85vh] sm:max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-bold text-lg text-gray-800">Formulir Data GTK</h3>
              <button disabled={isSaving} onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700 p-1">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <form id="gtkForm" onSubmit={handleSaveModal} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Photo Upload Section */}
                <div className="md:col-span-2 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-indigo-50/30 to-blue-50/30 rounded-2xl border-2 border-dashed border-indigo-100 mb-4 transition-all hover:border-indigo-200">
                   <div className="relative group">
                      {editingRecord.foto ? (
                        <div className="relative">
                          <img 
                            src={editingRecord.foto} 
                            alt="Preview" 
                            className="w-28 h-36 object-cover rounded-xl shadow-lg border-4 border-white"
                          />
                          <button 
                            type="button"
                            onClick={() => setEditingRecord({...editingRecord, foto: ''})}
                            className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="w-28 h-36 bg-white rounded-xl flex flex-col items-center justify-center text-indigo-300 border-2 border-indigo-50 border-dashed shadow-sm">
                          <Camera size={32} />
                          <span className="text-[10px] mt-2 font-bold uppercase tracking-wider text-indigo-400">Pas Foto</span>
                        </div>
                      )}
                      <label className="absolute inset-0 flex items-center justify-center bg-indigo-600/60 text-white opacity-0 group-hover:opacity-100 transition-all rounded-xl cursor-pointer backdrop-blur-[2px]">
                        <div className="flex flex-col items-center scale-90 group-hover:scale-100 transition-transform">
                          <Upload size={24} />
                          <span className="text-[10px] mt-1 font-semibold">Upload</span>
                        </div>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 1024 * 1024) {
                                onShowNotification("Ukuran file maksimal 1MB", "error");
                                return;
                              }
                              try {
                                // Compress to 150px for thumbnail use in GTK data
                                const base64 = await compressImage(file, 150, 0.5);
                                setEditingRecord({...editingRecord, foto: base64});
                                onShowNotification("Foto berhasil dimuat", "success");
                              } catch (err: any) {
                                onShowNotification(err.message || "Gagal upload foto", "error");
                              }
                            }
                          }}
                        />
                      </label>
                   </div>
                   <div className="text-center mt-3">
                     <p className="text-xs font-semibold text-indigo-600">Foto Profil GTK</p>
                     <p className="text-[10px] text-gray-400 italic">Format JPG/PNG, Maks 1MB. Ukuran thumbnail otomatis.</p>
                   </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600">Nama Lengkap</label>
                  <input type="text" required value={editingRecord.nama} onChange={e => setEditingRecord({...editingRecord, nama: e.target.value})} className="w-full text-sm border rounded-lg p-2 bg-gray-50" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600">NIP</label>
                  <input type="text" value={editingRecord.nip} onChange={e => setEditingRecord({...editingRecord, nip: e.target.value})} className="w-full text-sm border rounded-lg p-2 bg-gray-50" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600">NUPTK</label>
                  <input type="text" value={editingRecord.nuptk} onChange={e => setEditingRecord({...editingRecord, nuptk: e.target.value})} className="w-full text-sm border rounded-lg p-2 bg-gray-50" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600">Jenis Kelamin</label>
                  <select value={editingRecord.jenisKelamin} onChange={e => setEditingRecord({...editingRecord, jenisKelamin: e.target.value as any})} className="w-full text-sm border rounded-lg p-2 bg-gray-50">
                    <option value="">Pilih</option>
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600">Tempat Lahir</label>
                  <input type="text" value={editingRecord.tempatLahir} onChange={e => setEditingRecord({...editingRecord, tempatLahir: e.target.value})} className="w-full text-sm border rounded-lg p-2 bg-gray-50" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600">Tanggal Lahir</label>
                  <input type="date" value={editingRecord.tanggalLahir} onChange={e => setEditingRecord({...editingRecord, tanggalLahir: e.target.value})} className="w-full text-sm border rounded-lg p-2 bg-gray-50" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600">Ijazah Tertinggi</label>
                  <input type="text" value={editingRecord.ijazahTertinggi} onChange={e => setEditingRecord({...editingRecord, ijazahTertinggi: e.target.value})} className="w-full text-sm border rounded-lg p-2 bg-gray-50" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600">Jabatan</label>
                  <input type="text" value={editingRecord.jabatan} onChange={e => setEditingRecord({...editingRecord, jabatan: e.target.value})} className="w-full text-sm border rounded-lg p-2 bg-gray-50" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600">Status Pegawai</label>
                  <select value={editingRecord.statusPegawai} onChange={e => setEditingRecord({...editingRecord, statusPegawai: e.target.value})} className="w-full text-sm border rounded-lg p-2 bg-gray-50">
                    <option value="">Pilih Status</option>
                    <option value="PNS">PNS</option>
                    <option value="PPPK">PPPK</option>
                    <option value="PPPK PW">PPPK PW</option>
                    <option value="Honorer">Honorer</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600">Pangkat/Gologan</label>
                  <input type="text" value={editingRecord.pangkatGolongan} onChange={e => setEditingRecord({...editingRecord, pangkatGolongan: e.target.value})} placeholder="Contoh: III/b" className="w-full text-sm border rounded-lg p-2 bg-gray-50" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600">TMT Pengangkatan</label>
                  <input type="date" value={editingRecord.tmtPengangkatan} onChange={e => setEditingRecord({...editingRecord, tmtPengangkatan: e.target.value})} className="w-full text-sm border rounded-lg p-2 bg-gray-50" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600">Mulai Bekerja di Sekolah Ini</label>
                  <input type="date" value={editingRecord.mulaiBekerjaDiSini} onChange={e => setEditingRecord({...editingRecord, mulaiBekerjaDiSini: e.target.value})} className="w-full text-sm border rounded-lg p-2 bg-gray-50" />
                </div>
                <div className="flex gap-2">
                  <div className="space-y-1 flex-1">
                    <label className="text-xs font-semibold text-gray-600">Masa Kerja (Tahun)</label>
                    <input type="number" value={editingRecord.masaKerjaTahun} onChange={e => setEditingRecord({...editingRecord, masaKerjaTahun: Number(e.target.value)})} className="w-full text-sm border rounded-lg p-2 bg-gray-50" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <label className="text-xs font-semibold text-gray-600">Masa Kerja (Bulan)</label>
                    <input type="number" value={editingRecord.masaKerjaBulan} onChange={e => setEditingRecord({...editingRecord, masaKerjaBulan: Number(e.target.value)})} className="w-full text-sm border rounded-lg p-2 bg-gray-50" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600">Tanggal dan No SK Terakhir</label>
                  <input type="text" value={editingRecord.skTerakhir} onChange={e => setEditingRecord({...editingRecord, skTerakhir: e.target.value})} className="w-full text-sm border rounded-lg p-2 bg-gray-50" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600">Email Pribadi</label>
                  <input type="email" value={editingRecord.emailPribadi} onChange={e => setEditingRecord({...editingRecord, emailPribadi: e.target.value})} className="w-full text-sm border rounded-lg p-2 bg-gray-50" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600">Email Belajar.id</label>
                  <input type="email" value={editingRecord.emailBelajar} onChange={e => setEditingRecord({...editingRecord, emailBelajar: e.target.value})} className="w-full text-sm border rounded-lg p-2 bg-gray-50" />
                </div>
              </form>
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
              <button disabled={isSaving} onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100">Batal</button>
              <button disabled={isSaving} type="submit" form="gtkForm" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center">
                {isSaving ? <span className="mr-2">Menyimpan...</span> : 'Simpan Data'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default GtkDataView;
