import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, LayoutList, Clock, MapPin, Activity, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import MainCalendar from './MainCalendar';
import { Link } from 'react-router-dom';
import { getAutomatedStatus } from '../utils/statusHelper';

// Copying CountdownTimer logic
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

const getInitialEvents = (): any[] => {
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem('cached_home_events');
      if (cached) return JSON.parse(cached);
    } catch (e) {}
  }
  return [];
};

export default function HomeAgenda() {
  const [events, setEvents] = useState<any[]>(getInitialEvents);
  const [loading, setLoading] = useState<boolean>(() => events.length === 0);
  const [viewType, setViewType] = useState<'timeline' | 'calendar'>('timeline');

  useEffect(() => {
    async function fetchEvents() {
        if (!supabase) return;
        try {
          const { data, error } = await supabase
            .from("events")
            .select("*")
            .order("date_start", { ascending: false })
            .limit(5);
          
          if (error) throw error;
          if (data) {
            setEvents(data);
            try {
              localStorage.setItem('cached_home_events', JSON.stringify(data));
            } catch (e) {}
          }
        } catch (err) {
          console.error("Error fetching events:", err);
        } finally {
          setLoading(false);
        }
    }
    fetchEvents();
  }, []);

  return (
    <section id="agenda" className="py-24 bg-white/30 backdrop-blur-sm relative overflow-hidden">
        <div className="container mx-auto px-6 max-w-7xl">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="max-w-2xl"
                >
                    <h2 className="text-dark-green font-bold tracking-widest text-sm uppercase mb-3 text-orange-500">Agenda & Kegiatan</h2>
                    <h3 className="text-3xl md:text-5xl font-heading font-extrabold text-soft-black mb-4">Jadwal Gugus 03 Melati</h3>
                </motion.div>
                
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
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
                    <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
                </div>
            ) : (
                <AnimatePresence mode="wait">
                    {viewType === 'timeline' ? (
                        <motion.div
                            key="timeline"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="bg-white/50 backdrop-blur-xl border border-white p-8 md:p-12 rounded-[3rem] shadow-xl shadow-blue-500/5"
                        >
                            <div className="relative pl-8 md:pl-12 space-y-10 before:content-[''] before:absolute before:left-[15px] md:left-[19px] before:top-2 before:bottom-2 before:w-[3px] before:bg-gradient-to-b before:from-orange-500 before:via-orange-500/50 before:to-transparent">
                                {events.map((a, i) => {
                                    const d = new Date(a.date_start);
                                    const now = new Date();
                                    const autoStatus = getAutomatedStatus(a);

                                    return (
                                        <div key={a.id} className="relative group">
                                            <div className={`absolute -left-[31px] md:-left-[35px] top-2 w-7 h-7 rounded-full border-4 border-white shadow-xl z-20 transition-all duration-300 group-hover:scale-125 ${
                                                autoStatus === 'selesai' ? 'bg-gray-400 shadow-gray-200' : autoStatus === 'berjalan' ? 'bg-orange-500 shadow-orange-500/30' : 'bg-orange-400 shadow-orange-500/30'
                                            }`} />
                                            
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div className="space-y-1">
                                                  <div className="flex items-center gap-3">
                                                        <span className={`text-[10px] font-black uppercase tracking-widest ${autoStatus === 'selesai' ? 'text-gray-400' : 'text-orange-600'}`}>
                                                            {d.toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta", weekday: 'long', day: "numeric", month: "long" })}
                                                        </span>
                                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border
                                                          ${autoStatus === 'selesai' ? 'bg-green-100 text-green-600 border-green-200' : 
                                                            autoStatus === 'berjalan' ? 'bg-blue-100 text-blue-600 animate-pulse border-blue-200' : 
                                                            'bg-orange-100 text-orange-600 border-orange-200'}
                                                        `}>
                                                          {autoStatus === 'selesai' ? 'Selesai' : autoStatus === 'berjalan' ? 'Berjalan' : 'Rencana'}
                                                        </span>
                                                        {autoStatus === 'rencana' && <CountdownTimer targetDate={a.date_start} simple />}
                                                    </div>
                                                    <h4 className={`text-xl font-bold font-heading ${autoStatus === 'selesai' ? 'text-gray-400' : 'text-soft-black hover:text-orange-600 transition-colors'}`}>
                                                        {a.title}
                                                    </h4>
                                                    <div className="flex items-center gap-4 text-xs font-bold text-gray-400">
                                                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {d.toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })} WIB</span>
                                                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {a.location}</span>
                                                    </div>
                                                </div>
                                                
                                                <Link to="/kkg/agenda" className="px-6 py-2 rounded-full border border-gray-100 hover:border-orange-500 hover:text-orange-600 transition-all text-xs font-bold uppercase tracking-widest bg-gray-50/50">
                                                    Detail
                                                </Link>
                                            </div>
                                        </div>
                                    );
                                })}
                                {events.length === 0 && (
                                    <p className="text-center text-gray-400 italic">Belum ada agenda mendatang.</p>
                                )}
                            </div>
                            <div className="mt-12 flex justify-center">
                                <Link to="/kkg/agenda" className="flex items-center gap-2 text-main-blue font-bold hover:gap-3 transition-all">
                                    Lihat Semua Agenda <ArrowRight className="w-5 h-5" />
                                </Link>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="calendar"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="bg-white p-8 md:p-12 rounded-[3.5rem] shadow-2xl shadow-blue-500/5 border border-white"
                        >
                            <MainCalendar events={events} />
                        </motion.div>
                    )}
                </AnimatePresence>
            )}
        </div>
    </section>
  );
}
