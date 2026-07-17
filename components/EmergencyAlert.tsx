import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Volume2, VolumeX } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { apiService } from '../services/apiService';
import { EmergencyAlert as EmergencyAlertType, User } from '../types';

interface EmergencyAlertProps {
  currentUser: User;
}

const EmergencyAlert: React.FC<EmergencyAlertProps> = ({ currentUser }) => {
  const [activeAlert, setActiveAlert] = useState<EmergencyAlertType | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initial fetch
    const fetchActiveAlert = async () => {
      const alert = await apiService.getActiveAlert();
      setActiveAlert(alert);
    };

    fetchActiveAlert();

    // Polling fallback (every 10 seconds) just in case realtime is not enabled
    const interval = setInterval(fetchActiveAlert, 10000);

    // Subscribe to real-time changes
    if (supabase) {
      const channel = supabase
        .channel('emergency_alerts_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'emergency_alerts' },
          (payload: any) => {
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const newData = payload.new as any;
              if (newData.is_active) {
                setActiveAlert({
                  id: newData.id,
                  type: newData.type,
                  description: newData.description,
                  isActive: newData.is_active,
                  triggeredBy: newData.triggered_by,
                  triggeredByName: newData.triggered_by_name,
                  createdAt: newData.created_at
                });
              } else {
                setActiveAlert(null);
              }
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
        clearInterval(interval);
      };
    }
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeAlert && !isMuted) {
      if (!audioRef.current) {
        audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        audioRef.current.loop = true;
      }
      audioRef.current.play().catch(err => console.warn("Audio play blocked by browser", err));
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [activeAlert, isMuted]);

  const handleClear = async () => {
    try {
      await apiService.clearAlert();
    } catch (err) {
      console.error("Failed to clear alert:", err);
    }
  };

  const canClear = currentUser.role === 'admin' || currentUser.role === 'guru' || currentUser.position?.toLowerCase().includes('kepala sekolah');

  if (!activeAlert) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -100 }}
        className="fixed inset-0 z-[9999] pointer-events-none flex items-start justify-center p-4 md:p-10"
      >
        {/* Background Flashing Overlay */}
        <motion.div 
          animate={{ 
            backgroundColor: ['rgba(220, 38, 38, 0)', 'rgba(220, 38, 38, 0.4)', 'rgba(220, 38, 38, 0)'] 
          }}
          transition={{ 
            duration: 1, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute inset-0 z-[-1]"
        />

        {/* Alert Content Card */}
        <div className="bg-red-600 text-white shadow-[0_0_50px_rgba(220,38,38,0.5)] rounded-[2rem] p-6 md:p-10 max-w-3xl w-full pointer-events-auto border-8 border-white/20 animate-bounce-subtle relative overflow-hidden">
          {/* Animated Background Lines - More subtle */}
          <div className="absolute inset-0 opacity-5 pointer-events-none">
            <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_40px,white_40px,white_80px)]" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="bg-white text-red-600 p-5 rounded-3xl shadow-xl shrink-0">
              <AlertTriangle size={56} className="animate-pulse" />
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-4 leading-[0.9]">
                TANDA BAHAYA: <br/>
                <span className="text-yellow-300 drop-shadow-md">{activeAlert.type}</span>
              </h2>
              
              <div className="bg-black/10 backdrop-blur-md rounded-2xl p-5 mb-6 border border-white/10">
                <p className="text-lg md:text-2xl font-bold leading-normal">
                  {activeAlert.description}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-2 text-sm md:text-base">
                <div className="flex flex-col">
                  <span className="text-[10px] md:text-xs uppercase tracking-widest opacity-70 font-black">Dicuatkan oleh</span>
                  <span className="font-bold">{activeAlert.triggeredByName}</span>
                </div>
                <div className="h-8 w-px bg-white/20 hidden md:block" />
                <div className="flex flex-col">
                  <span className="text-[10px] md:text-xs uppercase tracking-widest opacity-70 font-black">Waktu Kejadian</span>
                  <span className="font-bold">{new Date(activeAlert.createdAt).toLocaleTimeString()}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 shrink-0 w-full md:w-64">
              <button 
                onClick={() => setIsMuted(!isMuted)}
                className="bg-white/10 hover:bg-white/20 p-4 rounded-2xl transition-all flex items-center justify-center gap-3 border border-white/20 font-bold"
              >
                {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                <span>{isMuted ? 'BUNYIKAN ALARM' : 'SENYAPKAN ALARM'}</span>
              </button>
              
              {canClear && (
                <button 
                  onClick={handleClear}
                  className="bg-white text-red-600 font-black px-6 py-4 rounded-2xl shadow-xl hover:bg-red-50 transition-transform active:scale-95 flex items-center justify-center gap-2 text-lg"
                >
                  <X size={24} /> AKHIRI ALERT
                </button>
              )}
            </div>
          </div>
        </div>

        <style>{`
          @keyframes bounce-subtle {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
          .animate-bounce-subtle {
            animation: bounce-subtle 2s infinite ease-in-out;
          }
        `}</style>
      </motion.div>
    </AnimatePresence>
  );
};

export default EmergencyAlert;
