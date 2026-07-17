import React, { useState } from 'react';
import { saveDatabaseConfig, resetDatabaseConfig, masterSupabase } from '../services/supabaseClient';
import { School, Database, AlertCircle, CheckCircle2, Loader2, ArrowRight, Trash2, PlusCircle, Globe, Key, Sparkles } from 'lucide-react';
import CustomModal from './CustomModal';

export const DatabaseSetup: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'aktivasi' | 'registrasi'>('aktivasi');
  const [kodeSekolah, setKodeSekolah] = useState('');
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  
  // Registration state variables
  const [regKodeSekolah, setRegKodeSekolah] = useState('');
  const [regNamaSekolah, setRegNamaSekolah] = useState('');
  const [regSupabaseUrl, setRegSupabaseUrl] = useState('');
  const [regSupabaseAnonKey, setRegSupabaseAnonKey] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  const hasCustomDb = !!localStorage.getItem('CUSTOM_SUPABASE_URL');

  const activeSchoolName = (() => {
    try {
      const cached = localStorage.getItem('school_profile_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.name && parsed.name.toLowerCase() !== 'sekolah') {
          return parsed.name;
        }
      }
    } catch (e) {}
    return '';
  })();

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setSuccessMessage('');

    const cleanCode = kodeSekolah.trim();
    if (!cleanCode) {
      setError('Mohon masukkan NPSN Sekolah terlebih dahulu!');
      return;
    }

    if (cleanCode === '88888888') {
      resetDatabaseConfig();
      return;
    }

    if (!/^\d{8}$/.test(cleanCode)) {
      setError('NPSN Sekolah harus berupa 8 digit angka!');
      return;
    }

    setIsLoading(true);
    try {
      if (!masterSupabase) {
        throw new Error('Database pusat belum dikonfigurasi. Hubungi administrator.');
      }
      
      const { data, error: fetchError } = await masterSupabase
        .from('school_databases')
        .select('*')
        .eq('school_code', cleanCode)
        .single();

      if (fetchError || !data) {
        throw new Error('NPSN Sekolah tidak terdaftar atau tidak valid. Silakan daftarkan NPSN baru terlebih dahulu.');
      }
      
      if (!data.is_active) {
        throw new Error('Sekolah ini dinonaktifkan oleh administrator.');
      }

      setSuccessMessage('Aktivasi Berhasil! Menghubungkan ke database sekolah Anda...');
      setSuccess(true);
      // Wait briefly for the success animation before reloading
      setTimeout(() => {
        saveDatabaseConfig(data.supabase_url, data.supabase_anon_key);
      }, 1500);

    } catch (err: any) {
      setError(err.message || 'Gagal mengaktifkan database. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setSuccessMessage('');

    const cleanRegCode = regKodeSekolah.trim();
    if (!cleanRegCode) {
      setError('NPSN Sekolah wajib diisi!');
      return;
    }

    if (!/^\d{8}$/.test(cleanRegCode)) {
      setError('NPSN Sekolah baru harus berupa 8 digit angka!');
      return;
    }

    const finalSchoolName = regNamaSekolah.trim() || 'Dinas Pendidikan';

    if (!regSupabaseUrl.trim()) {
      setError('Supabase URL wajib diisi!');
      return;
    }
    if (!regSupabaseAnonKey.trim()) {
      setError('Supabase Anon Key wajib diisi!');
      return;
    }

    // Simple URL validation
    if (!regSupabaseUrl.trim().startsWith('http://') && !regSupabaseUrl.trim().startsWith('https://')) {
      setError('Supabase URL harus diawali dengan http:// atau https://');
      return;
    }

    setIsLoading(true);
    try {
      if (!masterSupabase) {
        throw new Error('Database pusat belum dikonfigurasi. Hubungi administrator.');
      }

      // Check if school code already exists
      const { data: existing, error: checkError } = await masterSupabase
        .from('school_databases')
        .select('id')
        .eq('school_code', cleanRegCode);

      if (existing && existing.length > 0) {
        throw new Error('NPSN Sekolah ini sudah terdaftar! Silakan gunakan NPSN lain atau langsung lakukan aktivasi.');
      }

      // Insert school info into central database
      const { error: insertError } = await masterSupabase
        .from('school_databases')
        .insert([{
          school_code: cleanRegCode,
          school_name: finalSchoolName,
          supabase_url: regSupabaseUrl.trim(),
          supabase_anon_key: regSupabaseAnonKey.trim()
        }]);

      if (insertError) {
        throw insertError;
      }

      setSuccessMessage(`Registrasi Berhasil! NPSN: ${cleanRegCode}. Otomatis menghubungkan...`);
      setSuccess(true);
      
      // Auto activate
      setTimeout(() => {
        saveDatabaseConfig(regSupabaseUrl.trim(), regSupabaseAnonKey.trim());
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Gagal meregistrasikan sekolah. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-[#CAF4FF] p-8 md:p-10 max-w-md w-full relative overflow-hidden">
      {/* Top Accent Bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#5AB2FF] via-[#A0DEFF] to-[#CAF4FF]"></div>
      
      {/* Icon & Title */}
      <div className="flex flex-col items-center text-center mb-6">
        <div className="w-16 h-16 bg-[#CAF4FF]/50 rounded-2xl flex items-center justify-center text-[#5AB2FF] mb-4 shadow-inner">
          <School size={32} className="stroke-[1.75]" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Konfigurasi Data Sekolah</h2>
        <p className="text-xs text-slate-500 mt-1.5 max-w-xs">
          Aktifkan data sekolah Anda menggunakan NPSN yang sudah terdaftar, atau daftarkan baru ke sistem pusat.
        </p>
      </div>

      {/* Elegant Tab Switched */}
      <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
        <button
          type="button"
          onClick={() => {
            setActiveTab('aktivasi');
            setError('');
            setSuccess(false);
          }}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'aktivasi'
              ? 'bg-white text-[#5AB2FF] shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Database size={14} />
          <span>Aktivasi</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('registrasi');
            setError('');
            setSuccess(false);
          }}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'registrasi'
              ? 'bg-white text-[#5AB2FF] shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <PlusCircle size={14} />
          <span>Registrasi Baru</span>
        </button>
      </div>

      {/* Success Notification */}
      {success && (
        <div className="mb-6 bg-emerald-50 border border-emerald-100 text-emerald-800 px-4 py-3 rounded-2xl text-sm flex items-start animate-fade-in">
          <CheckCircle2 size={18} className="text-emerald-600 mr-2.5 mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-bold block">Berhasil!</span>
            <span className="text-xs text-emerald-700">{successMessage}</span>
          </div>
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="mb-6 bg-rose-50 border border-rose-100 text-rose-800 px-4 py-3 rounded-2xl text-sm flex items-start animate-shake">
          <AlertCircle size={18} className="text-rose-600 mr-2.5 mt-0.5 flex-shrink-0" />
          <span className="font-medium text-xs leading-relaxed">{error}</span>
        </div>
      )}

      {/* Tabs Content */}
      {activeTab === 'aktivasi' ? (
        /* Main Activation Form */
        <form onSubmit={handleActivate} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider ml-1">
              NPSN Sekolah
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#5AB2FF] transition-colors">
                <Database size={18} />
              </div>
              <input 
                type="text"
                maxLength={8}
                pattern="\d*"
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-[#5AB2FF] focus:ring-4 focus:ring-[#5AB2FF]/10 rounded-2xl text-sm font-bold tracking-widest text-slate-800 placeholder-slate-400 outline-none transition-all" 
                placeholder="Masukan NPSN..." 
                value={kodeSekolah} 
                onChange={(e) => setKodeSekolah(e.target.value.replace(/\D/g, ''))} 
                disabled={isLoading || success}
                autoComplete="off"
                autoFocus
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-[#5AB2FF] hover:bg-blue-500 active:scale-[0.98] text-white py-3.5 px-4 rounded-2xl font-bold text-sm tracking-wide shadow-md shadow-[#5AB2FF]/20 hover:shadow-lg hover:shadow-[#5AB2FF]/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none" 
            disabled={isLoading || success || !kodeSekolah.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Memproses Aktivasi...</span>
              </>
            ) : (
              <>
                <span>Aktifkan</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      ) : (
        /* Main Registration Form */
        <form onSubmit={handleRegister} className="space-y-4">
          {/* Kode Sekolah */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">
              Masukan NPSN
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#5AB2FF] transition-colors">
                <Database size={16} />
              </div>
              <input 
                type="text"
                maxLength={8}
                pattern="\d*"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-[#5AB2FF] focus:ring-4 focus:ring-[#5AB2FF]/10 rounded-xl text-xs font-bold tracking-wider text-slate-800 placeholder-slate-400 uppercase outline-none transition-all font-mono" 
                placeholder="Masukan NPSN..." 
                value={regKodeSekolah} 
                onChange={(e) => setRegKodeSekolah(e.target.value.replace(/\D/g, ''))} 
                disabled={isLoading || success}
                autoComplete="off"
                required
              />
            </div>
          </div>

          {/* Nama Sekolah */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">
              Nama Sekolah
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#5AB2FF] transition-colors">
                <School size={16} />
              </div>
              <input 
                type="text"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-[#5AB2FF] focus:ring-4 focus:ring-[#5AB2FF]/10 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none transition-all" 
                placeholder="Nama Sekolah" 
                value={regNamaSekolah} 
                onChange={(e) => setRegNamaSekolah(e.target.value)} 
                disabled={isLoading || success}
                autoComplete="off"
              />
            </div>
          </div>

          {/* Supabase URL */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">
              Supabase URL
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#5AB2FF] transition-colors">
                <Globe size={16} />
              </div>
              <input 
                type="text"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-[#5AB2FF] focus:ring-4 focus:ring-[#5AB2FF]/10 rounded-xl text-xs text-slate-800 placeholder-slate-400 outline-none transition-all font-mono" 
                placeholder="https://your-project.supabase.co" 
                value={regSupabaseUrl} 
                onChange={(e) => setRegSupabaseUrl(e.target.value)} 
                disabled={isLoading || success}
                autoComplete="off"
                required
              />
            </div>
          </div>

          {/* Supabase Anon Key */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">
              Supabase Anon Key
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#5AB2FF] transition-colors">
                <Key size={16} />
              </div>
              <input 
                type="text"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-[#5AB2FF] focus:ring-4 focus:ring-[#5AB2FF]/10 rounded-xl text-xs text-slate-800 placeholder-slate-400 outline-none transition-all font-mono" 
                placeholder="Kunci anonim Supabase (eyJ...)" 
                value={regSupabaseAnonKey} 
                onChange={(e) => setRegSupabaseAnonKey(e.target.value)} 
                disabled={isLoading || success}
                autoComplete="off"
                required
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-[#5AB2FF] hover:bg-blue-500 active:scale-[0.98] text-white py-3 px-4 rounded-xl font-bold text-xs tracking-wide shadow-md shadow-[#5AB2FF]/20 hover:shadow-lg hover:shadow-[#5AB2FF]/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none mt-2" 
            disabled={isLoading || success || !regKodeSekolah.trim() || !regNamaSekolah.trim() || !regSupabaseUrl.trim() || !regSupabaseAnonKey.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Mendaftarkan Sekolah...</span>
              </>
            ) : (
              <>
                <span>Daftarkan & Aktifkan</span>
                <Sparkles size={14} />
              </>
            )}
          </button>
        </form>
      )}

      {/* Reset connection block - only shown if custom DB has been active */}
      {hasCustomDb && (
        <div className="mt-6 pt-5 border-t border-[#CAF4FF] flex flex-col items-center">
          <p className="text-[11px] text-slate-400 mb-2.5 text-center">
            Aplikasi Anda saat ini terhubung ke data sekolah{activeSchoolName ? ` ${activeSchoolName}` : ''}.
          </p>
          <button 
            type="button"
            className="text-xs font-semibold text-rose-500 hover:text-rose-600 bg-rose-50 hover:bg-rose-100 px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 active:scale-95" 
            onClick={() => setShowDisconnectModal(true)}
          >
            <Trash2 size={14} />
            <span>Kembali ke Data Pusat</span>
          </button>
        </div>
      )}

      <CustomModal
        isOpen={showDisconnectModal}
        type="confirm"
        title="Kembali ke Data Pusat"
        message="Apakah Anda yakin ingin melepas koneksi database sekolah dan kembali ke data pusat?"
        onConfirm={() => {
          resetDatabaseConfig();
          setShowDisconnectModal(false);
        }}
        onCancel={() => setShowDisconnectModal(false)}
      />
    </div>
  );
};


