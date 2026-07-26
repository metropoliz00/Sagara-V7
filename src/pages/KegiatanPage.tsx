import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, MapPin, Clock, ArrowRight, Camera, FileText, LayoutList } from 'lucide-react';
import { supabase } from '../lib/supabase';
import MainCalendar from '../components/MainCalendar';

// Countdown Timer Component
const CountdownTimer = ({ targetDate, simple = false }: { targetDate: string, simple?: boolean }) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isPast: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(targetDate) - +new Date();
      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        isPast: false,
      };
    };

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    setTimeLeft(calculateTimeLeft());
    return () => clearInterval(timer);
  }, [targetDate]);

  if (timeLeft.isPast) return null;

  if (simple) {
    return (
      <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-100 ml-2 animate-pulse">
        {timeLeft.days}h {timeLeft.hours}j {timeLeft.minutes}m {timeLeft.seconds}d
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1 mt-1">
      <div className="flex flex-col items-center">
        <span className="text-[10px] font-black text-orange-600">{timeLeft.days}</span>
        <span className="text-[7px] font-bold text-gray-400 uppercase tracking-tighter leading-none">Hari</span>
      </div>
      <span className="text-orange-300 font-bold text-[8px] mb-2">:</span>
      <div className="flex flex-col items-center">
        <span className="text-[10px] font-black text-orange-600">{String(timeLeft.hours).padStart(2, '0')}</span>
        <span className="text-[7px] font-bold text-gray-400 uppercase tracking-tighter leading-none">Jam</span>
      </div>
      <span className="text-orange-300 font-bold text-[8px] mb-2">:</span>
      <div className="flex flex-col items-center">
        <span className="text-[10px] font-black text-orange-600">{String(timeLeft.minutes).padStart(2, '0')}</span>
        <span className="text-[7px] font-bold text-gray-400 uppercase tracking-tighter leading-none">Menit</span>
      </div>
      <span className="text-orange-300 font-bold text-[8px] mb-2">:</span>
      <div className="flex flex-col items-center">
        <span className="text-[10px] font-black text-orange-600">{String(timeLeft.seconds).padStart(2, '0')}</span>
        <span className="text-[7px] font-bold text-gray-400 uppercase tracking-tighter leading-none">Detik</span>
      </div>
    </div>
  );
};

export default function KegiatanPage() {
  const [kegiatan, setKegiatan] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewType, setViewType] = useState<'timeline' | 'calendar'>('timeline');
  
  useEffect(() => {
    window.scrollTo(0, 0);
    
    async function fetchEvents() {
        if (!supabase) return;
        const { data } = await supabase.from('events').select('*').order('date_start', { ascending: false });
        setKegiatan(data || []);
        setIsLoading(false);
    }
    
    fetchEvents();
  }, []);
  
  return (
    <div className="pt-24 min-h-screen bg-light-gray pb-20">
      {/* Header */}
      <section className="py-16 bg-white border-b border-gray-100">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="max-w-2xl text-center md:text-left">
              <span className="text-main-blue font-bold tracking-widest text-xs uppercase mb-3 block">Agenda & Dokumentasi</span>
              <h1 className="text-4xl md:text-5xl font-heading font-black text-soft-black mb-4">Kegiatan <span className="text-leaf-green">Gugus 03</span></h1>
              <p className="text-gray-500 text-lg">Ikuti perkembangan aktivitas pendidikan, workshop, dan agenda kolaboratif kami di lingkungan Gugus 03 Melati.</p>
            </div>
            
            <div className="flex flex-col items-center md:items-end gap-6">
                <div className="flex items-center bg-gray-100 p-1 rounded-2xl">
                    <button 
                        onClick={() => setViewType('timeline')}
                        className={`flex items-center gap-2 px-6 py-2 rounded-xl font-bold transition-all text-xs uppercase tracking-widest ${viewType === 'timeline' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <LayoutList className="w-4 h-4" />
                        Timeline
                    </button>
                    <button 
                        onClick={() => setViewType('calendar')}
                        className={`flex items-center gap-2 px-6 py-2 rounded-xl font-bold transition-all text-xs uppercase tracking-widest ${viewType === 'calendar' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <Calendar className="w-4 h-4" />
                        Kalender
                    </button>
                </div>

                <div className="bg-main-blue/10 p-4 rounded-2xl flex items-center gap-4">
                    <div className="bg-main-blue text-white p-3 rounded-xl shadow-lg">
                        <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-soft-black leading-none mb-1">Agenda Terdekat</h4>
                        <p className="text-xs text-main-blue font-semibold">{kegiatan[0] ? new Date(kegiatan[0].date_start).toLocaleDateString('id-ID', { timeZone: "Asia/Jakarta",  day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</p>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </section>

      {/* Kegiatan List */}
      <div className="container mx-auto px-6 max-w-7xl py-12">
        {isLoading ? (
            <div className="text-center py-20 text-gray-500">Memuat kegiatan...</div>
        ) : (
            <AnimatePresence mode="wait">
                {viewType === 'timeline' ? (
                <motion.div
                    key="timeline"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="grid grid-cols-1 gap-12"
                >
                    {kegiatan.map((item, idx) => {
                        const d = new Date(item.date_start);
                        const now = new Date();
                        const isStarted = d < now;

                        return (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="bg-white rounded-[2.5rem] overflow-hidden shadow-2xl shadow-blue-500/5 border border-main-orange/20 flex flex-col lg:flex-row transition-all hover:shadow-orange-500/10"
                            >
                                <div className="w-full lg:w-1/3 aspect-[16/9] overflow-hidden relative group shrink-0 bg-slate-900 flex items-center justify-center">
                                    {/* Blurred backdrop image to fill any padding/gaps if container stretches */}
                                    <img 
                                        src={item.image_url || "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=2000&auto=format&fit=crop"} 
                                        alt="" 
                                        className="absolute inset-0 w-full h-full object-cover blur-lg scale-110 opacity-30 pointer-events-none" 
                                    />
                                    <img 
                                        src={item.image_url || "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=2000&auto=format&fit=crop"} 
                                        alt={item.title} 
                                        className="w-full h-full object-contain relative z-10 transition-transform duration-700 group-hover:scale-105" 
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-8 z-20">
                                        <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-bold text-main-blue flex items-center gap-2">
                                            <Camera className="w-4 h-4" /> Dokumentasi Terkait
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="lg:w-2/3 p-8 md:p-12 flex flex-col justify-center">
                                    <div className="flex flex-wrap items-center gap-4 md:gap-8 mb-6 text-sm">
                                        <div className="flex items-center gap-2 text-main-blue font-bold px-4 py-2 bg-main-blue/5 rounded-full">
                                            <Calendar className="w-4 h-4" /> {new Date(item.date_start).toLocaleDateString('id-ID', { timeZone: "Asia/Jakarta",  day: 'numeric', month: 'long', year: 'numeric' })}
                                        </div>
                                        {!isStarted && <CountdownTimer targetDate={item.date_start} simple />}
                                        <div className="flex items-center gap-2 text-gray-500 bg-gray-50 px-4 py-2 rounded-full font-medium">
                                            <Clock className="w-4 h-4" /> {new Date(item.date_start).toLocaleTimeString('id-ID', { timeZone: "Asia/Jakarta",  hour: '2-digit', minute: '2-digit' })} WIB
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-500 bg-gray-50 px-4 py-2 rounded-full font-medium">
                                            <MapPin className="w-4 h-4" /> {item.location}
                                        </div>
                                    </div>
                                    
                                    <div className="mb-4">
                                        <h2 className="text-2xl md:text-3xl font-heading font-black text-soft-black mb-1 hover:text-main-blue transition-colors">
                                            {item.title}
                                        </h2>
                                    </div>
                                    
                                    <p className="text-gray-500 text-lg leading-relaxed mb-8">
                                        {item.description}
                                    </p>
                                    
                                    <div className="flex flex-wrap items-center gap-4 pt-6 border-t border-gray-100 mt-auto">
                                        {item.detail_url && (
                                            <a href={item.detail_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-main-blue text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-main-blue/20 hover:bg-main-blue/90 transition-all active:scale-95">
                                                Detail Lengkap <ArrowRight className="w-4 h-4" />
                                            </a>
                                        )}
                                        {item.materi_url && (
                                            <a href={item.materi_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-soft-black hover:text-main-blue px-6 py-3 rounded-2xl font-bold border border-gray-100 transition-all active:scale-95">
                                                Unduh Materi <FileText className="w-4 h-4" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
                ) : (
                <motion.div
                    key="calendar"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="bg-white p-8 md:p-12 rounded-[3.5rem] shadow-2xl shadow-blue-500/5 border border-white"
                >
                    <MainCalendar events={kegiatan} />
                </motion.div>
                )}
            </AnimatePresence>
        )}
      </div>

      {/* Newsletter / Call to action */}
      <div className="container mx-auto px-6 max-w-7xl pt-12">
         <div className="bg-leaf-green rounded-[3rem] p-12 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
               <div className="max-w-xl text-center md:text-left">
                  <h3 className="text-3xl font-heading font-bold mb-4">Ingin Menambahkan Kegiatan?</h3>
                  <p className="text-white/80">Jika sekolah Anda memiliki agenda yang ingin dipublikasikan di lingkup Gugus 03, silakan login ke Dasbor Pengurus atau hubungi sekretariat gugus.</p>
               </div>
               <button className="bg-white text-leaf-green px-8 py-4 rounded-2xl font-black shadow-xl hover:scale-105 transition-all">
                  Hubungi Sekretariat
               </button>
            </div>
         </div>
      </div>
    </div>
  );
}
