import React, { useState } from 'react';
import { apiService } from '../services/apiService';
import { User } from '../types';
import { getLocalISODate } from '../utils/dateUtils';

interface BackupRestoreViewProps {
  currentUser: User | null;
}

const BackupRestoreView: React.FC<BackupRestoreViewProps> = ({ currentUser }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleBackup = async () => {
    if (!currentUser?.classId) {
      setError('Tidak ada kelas yang dipilih.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const backupData = await apiService.backupData();
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-kelasku-${currentUser.classId}-${getLocalISODate()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setSuccess('Data berhasil di-backup.');
    } catch (err) {
      setError('Gagal melakukan backup data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        setLoading(true);
        setError(null);
        setSuccess(null);

        await apiService.restoreData(data);
        setSuccess('Data berhasil di-restore. Halaman akan dimuat ulang...');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch (err: any) {
        setError('Gagal me-restore data: ' + (err.message || 'Pastikan file backup valid.'));
        console.error('Restore error:', err);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const handleCentralRestore = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const profiles = await apiService.getProfiles();
      const npsn = profiles.school?.npsn;

      if (!npsn) {
        throw new Error('NPSN tidak ditemukan di profil sekolah. Pastikan profil sekolah sudah terisi.');
      }

      if (!window.confirm(`Apakah Anda yakin ingin me-restore data dari Database Pusat (Sagara Cloud) untuk NPSN ${npsn}? Ini akan menimpa seluruh data lokal Anda.`)) {
        return;
      }

      const centralData = await apiService.fetchCentralRestoreData(npsn);
      
      if (!centralData || Object.keys(centralData).length === 0) {
        throw new Error('Tidak ada data backup yang ditemukan di database pusat untuk NPSN ini.');
      }

      await apiService.restoreData(centralData);
      
      setSuccess('Data berhasil di-restore dari Database Pusat. Halaman akan dimuat ulang...');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setError('Gagal me-restore data dari Pusat: ' + (err.message || 'Periksa koneksi internet atau konfigurasi sinkronisasi Anda.'));
      console.error('Central Restore error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-slate-800 border-b pb-4">Backup & Restore Data</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Local Backup/Restore */}
        <div className="space-y-8">
          <div className="p-4 border border-blue-100 rounded-2xl bg-blue-50/30">
            <h3 className="text-lg font-bold text-blue-800 mb-2">Local Backup</h3>
            <p className="text-sm text-blue-600 mb-4">Simpan data ke file JSON di perangkat Anda.</p>
            <button
              onClick={handleBackup}
              disabled={loading}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95 disabled:bg-gray-400"
            >
              {loading ? 'Memproses...' : 'Download Backup (.json)'}
            </button>
          </div>

          <div className="p-4 border border-slate-200 rounded-2xl">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Local Restore</h3>
            <p className="text-sm text-slate-500 mb-4">Pulihkan data dari file JSON hasil backup sebelumnya.</p>
            <input
              type="file"
              accept=".json"
              onChange={handleRestore}
              disabled={loading}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
            />
          </div>
        </div>

        {/* Right Column: Central Cloud Restore */}
        <div className="p-6 bg-slate-900 rounded-[2rem] text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 blur-3xl rounded-full"></div>
          <div className="relative z-10 h-full flex flex-col">
            <div className="mb-4">
              <h3 className="text-xl font-black tracking-tight text-blue-400">Restore dari Pusat</h3>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">SAGARA Cloud Synchronization</p>
            </div>
            
            <p className="text-sm text-slate-300 mb-6 leading-relaxed flex-grow">
              Tarik seluruh snapshot data sekolah yang telah tersinkronisasi di <b>Database Pusat (Sagara Central)</b> kembali ke sistem ini berdasarkan NPSN sekolah Anda.
            </p>

            <button
              onClick={handleCentralRestore}
              disabled={loading}
              className="w-full px-4 py-4 bg-blue-600 hover:bg-emerald-600 text-white rounded-2xl font-black text-sm tracking-widest uppercase transition-all shadow-xl shadow-blue-900/40 active:scale-95 disabled:bg-slate-700"
            >
              {loading ? 'Menghubungkan...' : 'RESTORE DARI CLOUD'}
            </button>
            
            <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Protocol: AES-256 Sagara Bridge</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        {error && (
          <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-bold animate-shake">
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl text-sm font-bold animate-bounce-subtle">
            ✅ {success}
          </div>
        )}
      </div>
    </div>
  );
};

export default BackupRestoreView;
