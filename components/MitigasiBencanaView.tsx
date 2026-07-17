import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Send, History, CheckCircle, Info, Flame, Waves, Wind, Mountain, Zap, User as UserIcon, Clock, Loader2 } from 'lucide-react';
import { apiService } from '../services/apiService';
import { User, EmergencyAlert } from '../types';
import { useModal } from '../context/ModalContext';
import { supabase } from '../services/supabaseClient';

interface MitigasiBencanaViewProps {
  currentUser: User;
}

const MitigasiBencanaView: React.FC<MitigasiBencanaViewProps> = ({ currentUser }) => {
  const [alertType, setAlertType] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [latestAlert, setLatestAlert] = useState<EmergencyAlert | null>(null);
  const { showAlert, showConfirm } = useModal();

  const fetchLatest = async () => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('emergency_alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (data && !error) {
      setLatestAlert({
        id: data.id,
        type: data.type,
        description: data.description,
        isActive: data.is_active,
        triggeredBy: data.triggered_by,
        triggeredByName: data.triggered_by_name,
        createdAt: data.created_at
      });
    } else {
      setLatestAlert(null);
    }
  };

  useEffect(() => {
    fetchLatest();

    if (supabase) {
      const channel = supabase
        .channel('mitigasi_log_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'emergency_alerts' },
          () => {
            fetchLatest();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  const disasterTypes = [
    { label: 'Gempa Bumi', icon: Mountain, color: 'bg-orange-500' },
    { label: 'Kebakaran', icon: Flame, color: 'bg-red-600' },
    { label: 'Banjir', icon: Waves, color: 'bg-blue-600' },
    { label: 'Angin Kencang', icon: Wind, color: 'bg-cyan-500' },
    { label: 'Ancaman Keamanan', icon: Zap, color: 'bg-yellow-600' },
    { label: 'Lainnya', icon: AlertTriangle, color: 'bg-gray-600' },
  ];

  const handleTriggerAlert = async () => {
    if (!alertType) {
      showAlert("Pilih jenis bencana terlebih dahulu.", "error");
      return;
    }
    if (!description) {
      showAlert("Masukkan keterangan singkat kejadian.", "error");
      return;
    }

    showConfirm(
      `KIRIM TANDA BAHAYA: ${alertType}?\n\nAlert ini akan muncul di SEMUA akun pengguna secara real-time dengan bunyi alarm.`,
      async () => {
        setIsSubmitting(true);
        try {
          await apiService.triggerAlert({
            type: alertType,
            description: description,
            isActive: true,
            triggeredBy: currentUser.id,
            triggeredByName: currentUser.fullName
          });
          showAlert("Tanda bahaya berhasil dikirim!", "success");
          setAlertType('');
          setDescription('');
        } catch (err: any) {
          console.error(err);
          showAlert(`Gagal mengirim tanda bahaya: ${err.message || 'Terjadi kesalahan internal'}`, "error");
        } finally {
          setIsSubmitting(false);
        }
      },
      "Konfirmasi Mitigasi Bencana"
    );
  };

  const handleClearAlert = async () => {
    showConfirm(
      "Apakah Anda yakin ingin mengakhiri tanda bahaya saat ini?",
      async () => {
        try {
          await apiService.clearAlert();
          showAlert("Tanda bahaya telah diakhiri.", "success");
        } catch (err) {
          showAlert("Gagal mengakhiri tanda bahaya.", "error");
        }
      }
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <header className="mb-10 text-center">
        <div className="inline-flex p-4 bg-red-100 text-red-600 rounded-3xl mb-4">
          <AlertTriangle size={48} />
        </div>
        <h1 className="text-4xl font-black text-slate-800 tracking-tight uppercase">Mitigasi Bencana</h1>
        <p className="text-slate-500 mt-2 font-medium">Panel Kendali Darurat & Keselamatan Sekolah</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Trigger Section */}
        <div className="md:col-span-2 space-y-6">
          <section className="bg-white rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Send size={24} className="text-red-500" /> Kirim Tanda Bahaya
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              {disasterTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.label}
                    onClick={() => setAlertType(type.label)}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                      alertType === type.label 
                        ? `${type.color} text-white border-transparent scale-105 shadow-lg` 
                        : 'border-slate-100 text-slate-500 hover:border-red-200 hover:bg-red-50'
                    }`}
                  >
                    <Icon size={32} className="mb-2" />
                    <span className="text-xs font-bold text-center">{type.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-600 mb-2">Keterangan Kejadian</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Contoh: Terjadi gempa bumi, harap segera berkumpul di titik kumpul luar gedung."
                className="w-full bg-slate-50 border-none rounded-2xl p-4 min-h-[120px] focus:ring-2 focus:ring-red-500 transition-all font-medium"
              />
            </div>

            <div className="flex gap-4">
              <button
                disabled={isSubmitting}
                onClick={handleTriggerAlert}
                className="flex-1 bg-red-600 text-white font-black py-4 px-4 sm:px-6 rounded-2xl shadow-xl shadow-red-200 hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 text-base sm:text-lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={22} className="animate-spin" />
                    <span className="hidden sm:inline">MENGIRIM...</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle size={22} className="animate-pulse shrink-0" />
                    <span className="hidden sm:inline">Aktifkan alarm bahaya</span>
                  </>
                )}
              </button>
              
              <button
                onClick={handleClearAlert}
                className="bg-slate-100 text-slate-600 font-bold px-4 sm:px-6 py-4 rounded-2xl hover:bg-slate-200 transition-all text-base sm:text-lg flex items-center justify-center gap-2"
              >
                <CheckCircle size={20} className="shrink-0" />
                <span className="hidden sm:inline">AKHIRI ALERT</span>
              </button>
            </div>
          </section>

          <section className="bg-yellow-50 rounded-3xl p-6 border-2 border-yellow-100 flex gap-4 items-start">
            <div className="p-3 bg-yellow-400 text-white rounded-2xl shrink-0">
              <Info size={24} />
            </div>
            <div>
              <h3 className="font-bold text-yellow-800 text-lg">Prosedur Keamanan</h3>
              <p className="text-yellow-700 text-sm mt-1 font-medium leading-relaxed">
                Gunakan fitur ini hanya dalam keadaan darurat yang mengancam keselamatan warga sekolah. 
                Pastikan deskripsi yang diberikan jelas dan instruktif.
              </p>
            </div>
          </section>
        </div>

        {/* Info Section */}
        <div className="space-y-6">
          <section className="bg-white rounded-3xl p-6 shadow-lg shadow-slate-200/50 border border-slate-100">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <History size={20} className="text-blue-500" /> Riwayat Terkini
            </h2>
            <div className="space-y-4">
              {latestAlert ? (
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`p-1.5 rounded-lg text-white ${latestAlert.isActive ? 'bg-red-500 animate-pulse' : 'bg-slate-400'}`}>
                      <AlertTriangle size={14} />
                    </div>
                    <span className="font-bold text-slate-800 uppercase text-sm">{latestAlert.type}</span>
                  </div>
                  <p className="text-slate-600 text-xs font-medium mb-3 line-clamp-2">
                    {latestAlert.description}
                  </p>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-200 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    <div className="flex items-center gap-1 truncate">
                      <UserIcon size={9} />
                      {latestAlert.triggeredByName}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Clock size={9} />
                      {new Date(latestAlert.createdAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) + ' WIB'}
                    </div>
                  </div>
                  {latestAlert.isActive && (
                    <div className="mt-3 bg-red-100 text-red-600 text-[10px] font-black uppercase text-center py-1 rounded-full animate-pulse">
                      STATUS: AKTIF
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle size={32} className="text-slate-200" />
                  </div>
                  <p className="text-sm font-bold text-slate-400">Belum ada riwayat terbaru.</p>
                </div>
              )}
            </div>
          </section>

          <section className="bg-gradient-to-br from-red-600 to-red-800 rounded-3xl p-6 text-white overflow-hidden relative shadow-xl shadow-red-200">
             <AlertTriangle size={120} className="absolute -bottom-8 -right-8 opacity-20 rotate-12" />
             <h2 className="text-lg font-bold mb-2 relative z-10 uppercase tracking-wider">Status Sistem</h2>
             <div className="flex items-center gap-3 bg-white/20 backdrop-blur-md rounded-2xl p-4 relative z-10 border border-white/30">
                <div className="w-4 h-4 bg-green-400 rounded-full animate-pulse shadow-[0_0_10px_#4ade80]" />
                <span className="font-bold">Sistem Siaga Aktif</span>
             </div>
             <p className="mt-4 text-sm opacity-80 relative z-10 font-medium">
                Peringatan akan dikirimkan ke seluruh perangkat yang terhubung dalam waktu kurang dari 1 detik.
             </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default MitigasiBencanaView;
