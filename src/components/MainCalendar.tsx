import React, { useState, useEffect } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval,
  isSunday,
  parseISO
} from 'date-fns';
import { id } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Info, Calendar as CalendarIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Holiday {
  holiday_date: string;
  holiday_name: string;
  is_national_holiday: boolean;
}

interface Event {
  id: string;
  title: string;
  date_start: string;
  date_end?: string;
}

interface MainCalendarProps {
  events: Event[];
}

const OFFLINE_HOLIDAYS: Record<string, { name: string; date: string; is_national_holiday: boolean }[]> = {
  "2025": [
    { name: "Tahun Baru 2025 Masehi", date: "2025-01-01", is_national_holiday: true },
    { name: "Isra Mikraj Nabi Muhammad SAW", date: "2025-01-27", is_national_holiday: true },
    { name: "Tahun Baru Imlek 2576 Kongzili", date: "2025-01-29", is_national_holiday: true },
    { name: "Cuti Bersama Imlek 2576", date: "2025-01-28", is_national_holiday: false },
    { name: "Hari Raya Idul Fitri 1446 H", date: "2025-03-31", is_national_holiday: true },
    { name: "Hari Raya Idul Fitri 1446 H", date: "2025-04-01", is_national_holiday: true },
    { name: "Cuti Bersama Idul Fitri 1446 H", date: "2025-04-02", is_national_holiday: false },
    { name: "Cuti Bersama Idul Fitri 1446 H", date: "2025-04-03", is_national_holiday: false },
    { name: "Cuti Bersama Idul Fitri 1446 H", date: "2025-04-07", is_national_holiday: false },
    { name: "Wafat Yesus Kristus", date: "2025-04-18", is_national_holiday: true },
    { name: "Paskah", date: "2025-04-20", is_national_holiday: true },
    { name: "Hari Buruh Internasional", date: "2025-05-01", is_national_holiday: true },
    { name: "Hari Raya Waisak 2569 BE", date: "2025-05-12", is_national_holiday: true },
    { name: "Cuti Bersama Hari Raya Waisak", date: "2025-05-13", is_national_holiday: false },
    { name: "Kenaikan Yesus Kristus", date: "2025-05-29", is_national_holiday: true },
    { name: "Cuti Bersama Kenaikan", date: "2025-05-30", is_national_holiday: false },
    { name: "Hari Lahir Pancasila", date: "2025-06-01", is_national_holiday: true },
    { name: "Hari Raya Idul Adha 1446 H", date: "2025-06-06", is_national_holiday: true },
    { name: "Cuti Bersama Idul Adha", date: "2025-06-09", is_national_holiday: false },
    { name: "Tahun Baru Islam 1447 H", date: "2025-06-27", is_national_holiday: true },
    { name: "Hari Kemerdekaan RI ke-80", date: "2025-08-17", is_national_holiday: true },
    { name: "Maulid Nabi Muhammad SAW", date: "2025-09-05", is_national_holiday: true },
    { name: "Hari Raya Natal", date: "2025-12-25", is_national_holiday: true },
    { name: "Cuti Bersama Natal", date: "2025-12-24", is_national_holiday: false }
  ],
  "2026": [
    { name: "Tahun Baru 2026 Masehi", date: "2026-01-01", is_national_holiday: true },
    { name: "Isra Mikraj Nabi Muhammad SAW", date: "2026-01-15", is_national_holiday: true },
    { name: "Cuti Bersama Imlek 2577 Kongzili", date: "2026-02-16", is_national_holiday: false },
    { name: "Tahun Baru Imlek 2577 Kongzili", date: "2026-02-17", is_national_holiday: true },
    { name: "Hari Suci Nyepi (Saka 1948)", date: "2026-03-18", is_national_holiday: true },
    { name: "Cuti Bersama Idul Fitri / Nyepi", date: "2026-03-19", is_national_holiday: false },
    { name: "Hari Raya Idul Fitri 1447 H", date: "2026-03-20", is_national_holiday: true },
    { name: "Hari Raya Idul Fitri 1447 H", date: "2026-03-21", is_national_holiday: true },
    { name: "Cuti Bersama Idul Fitri 1447 H", date: "2026-03-23", is_national_holiday: false },
    { name: "Cuti Bersama Idul Fitri 1447 H", date: "2026-03-24", is_national_holiday: false },
    { name: "Wafat Yesus Kristus", date: "2026-04-03", is_national_holiday: true },
    { name: "Hari Paskah", date: "2026-04-05", is_national_holiday: true },
    { name: "Hari Buruh Internasional", date: "2026-05-01", is_national_holiday: true },
    { name: "Kenaikan Yesus Kristus", date: "2026-05-14", is_national_holiday: true },
    { name: "Cuti Bersama Kenaikan", date: "2026-05-15", is_national_holiday: false },
    { name: "Hari Raya Idul Adha 1447 H", date: "2026-05-27", is_national_holiday: true },
    { name: "Cuti Bersama Idul Adha", date: "2026-05-28", is_national_holiday: false },
    { name: "Hari Raya Waisak 2570 BE", date: "2026-05-31", is_national_holiday: true },
    { name: "Hari Lahir Pancasila", date: "2026-06-01", is_national_holiday: true },
    { name: "Tahun Baru Islam 1448 H", date: "2026-06-18", is_national_holiday: true },
    { name: "Hari Kemerdekaan RI ke-81", date: "2026-08-17", is_national_holiday: true },
    { name: "Maulid Nabi Muhammad SAW", date: "2026-08-25", is_national_holiday: true },
    { name: "Cuti Bersama Natal", date: "2026-12-24", is_national_holiday: false },
    { name: "Hari Raya Natal", date: "2026-12-25", is_national_holiday: true }
  ],
  "2027": [
    { name: "Tahun Baru 2027 Masehi", date: "2027-01-01", is_national_holiday: true },
    { name: "Isra Mikraj Nabi Muhammad SAW", date: "2027-01-05", is_national_holiday: true },
    { name: "Tahun Baru Imlek 2578 Kongzili", date: "2027-02-06", is_national_holiday: true },
    { name: "Hari Suci Nyepi (Saka 1949)", date: "2027-03-08", is_national_holiday: true },
    { name: "Hari Raya Idul Fitri 1448 H", date: "2027-03-09", is_national_holiday: true },
    { name: "Hari Raya Idul Fitri 1448 H", date: "2027-03-10", is_national_holiday: true },
    { name: "Wafat Yesus Kristus", date: "2027-03-26", is_national_holiday: true },
    { name: "Hari Paskah", date: "2027-03-28", is_national_holiday: true },
    { name: "Hari Buruh Internasional", date: "2027-05-01", is_national_holiday: true },
    { name: "Kenaikan Yesus Kristus", date: "2027-05-06", is_national_holiday: true },
    { name: "Hari Raya Idul Adha 1448 H", date: "2027-05-16", is_national_holiday: true },
    { name: "Hari Raya Waisak 2571 BE", date: "2027-05-20", is_national_holiday: true },
    { name: "Hari Lahir Pancasila", date: "2027-06-01", is_national_holiday: true },
    { name: "Tahun Baru Islam 1449 H", date: "2027-06-07", is_national_holiday: true },
    { name: "Hari Kemerdekaan RI ke-82", date: "2027-08-17", is_national_holiday: true },
    { name: "Maulid Nabi Muhammad SAW", date: "2027-08-15", is_national_holiday: true },
    { name: "Hari Raya Natal", date: "2027-12-25", is_national_holiday: true }
  ]
};

export default function MainCalendar({ events }: MainCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [hoveredDay, setHoveredDay] = useState<Date | null>(null);

  useEffect(() => {
    const year = currentMonth.getFullYear();
    const offlineList = OFFLINE_HOLIDAYS[year] || [];
    const formattedOffline = offlineList.map(h => ({
      holiday_date: h.date,
      holiday_name: h.name,
      is_national_holiday: h.is_national_holiday
    }));
    
    // Set offline list immediately so it loads with zero delay
    setHolidays(formattedOffline);

    const fetchHolidays = async () => {
      try {
        const response = await fetch(`https://libur.deno.dev/api?year=${year}`);
        if (response.ok) {
          const data = await response.json();
          const formatted = data.map((h: any) => ({
            holiday_date: h.date,
            holiday_name: h.name,
            is_national_holiday: h.is_national_holiday !== undefined ? h.is_national_holiday : (h.type === "national-holiday")
          }));
          if (formatted.length > 0) {
            setHolidays(formatted);
          }
        }
      } catch (error) {
        console.error('Error fetching holidays, relying on offline database:', error);
      }
    };
    fetchHolidays();
  }, [currentMonth.getFullYear()]);

  const renderHeader = () => (
    <div className="flex items-center justify-between mb-6">
      <div className="flex flex-col">
        <h3 className="text-xl font-black text-soft-black flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-main-blue" />
          {format(currentMonth, 'MMMM yyyy', { locale: id })}
        </h3>
        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Kalender Kegiatan & Hari Libur</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => setCurrentMonth(new Date())}
          className="px-3 py-1 text-[10px] font-bold bg-gray-50 border border-gray-100 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors uppercase tracking-wider"
        >
          Bulan Ini
        </button>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  const renderDays = () => {
    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    return (
      <div className="grid grid-cols-7 mb-2">
        {days.map((day, i) => (
          <div key={i} className={`text-center py-2 text-[10px] font-black uppercase tracking-widest ${i === 0 ? 'text-red-500' : 'text-gray-400'}`}>
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const interval = eachDayOfInterval({ start: startDate, end: endDate });
    
    return (
      <div className="grid grid-cols-7 gap-1 md:gap-2">
        {interval.map((day, i) => {
          const holiday = holidays.find(h => isSameDay(parseISO(h.holiday_date), day));
          const isHoliday = holiday?.is_national_holiday || isSunday(day);
          const isJointLeave = holiday && !holiday.is_national_holiday;
          const dayEvents = events.filter(e => isSameDay(new Date(e.date_start), day));
          const hasEvent = dayEvents.length > 0;
          const isSelected = isSameDay(day, new Date());
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isSundayDay = isSunday(day);

          return (
            <div
              key={i}
              className={`relative aspect-square md:aspect-auto md:min-h-[80px] p-2 rounded-2xl border transition-all duration-300 flex flex-col items-center justify-center md:items-start md:justify-start cursor-default group
                ${!isCurrentMonth ? 'bg-gray-50/30 border-transparent opacity-30 shadow-none' : 
                  isSelected ? 'bg-main-blue/5 border-main-blue/20 shadow-inner' : 
                  holiday?.is_national_holiday ? 'bg-red-50/20 border-red-100 hover:border-red-200' :
                  isJointLeave ? 'bg-amber-50/30 border-amber-100 hover:border-amber-200' :
                  isSundayDay ? 'bg-red-50/5 border-gray-50 hover:border-gray-200 shadow-sm' :
                  'bg-white border-gray-50 hover:border-gray-200 shadow-sm'}
                ${hasEvent ? 'ring-2 ring-main-blue/10' : ''}
              `}
              onMouseEnter={() => setHoveredDay(day)}
              onMouseLeave={() => setHoveredDay(null)}
            >
              <span className={`text-xs md:text-sm font-black transition-colors ${
                !isCurrentMonth ? 'text-gray-300' :
                isHoliday ? 'text-red-500' : 
                isJointLeave ? 'text-amber-600' :
                'text-soft-black'
              }`}>
                {format(day, 'd')}
              </span>

              {/* Joint Leave Marker (Red Dot) */}
              {isJointLeave && isCurrentMonth && (
                <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" title={holiday?.holiday_name} />
              )}

              {/* Agenda Marker (Blue BG) */}
              {hasEvent && isCurrentMonth && (
                <div className="mt-auto md:mt-2 w-full">
                  <div className="hidden md:block space-y-1">
                    {dayEvents.slice(0, 2).map((ev, idx) => (
                      <div key={idx} className="text-[8px] font-bold bg-main-blue text-white px-1.5 py-0.5 rounded-md truncate leading-tight shadow-sm shadow-main-blue/20">
                        {ev.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-[7px] font-black text-main-blue text-center">+{dayEvents.length - 2} lagi</div>
                    )}
                  </div>
                  <div className="md:hidden w-1.5 h-1.5 bg-main-blue rounded-full mx-auto shadow-sm shadow-main-blue/30" />
                </div>
              )}

              {/* Tooltip on Hover */}
              <AnimatePresence>
                {hoveredDay && isSameDay(hoveredDay, day) && (isHoliday || isJointLeave || hasEvent) && isCurrentMonth && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-48 bg-soft-black/90 backdrop-blur-md text-white p-3 rounded-2xl shadow-2xl z-[60] pointer-events-none"
                  >
                    <div className="space-y-2">
                       <p className="text-[10px] font-bold text-white/50 border-b border-white/10 pb-1 uppercase tracking-widest">
                         {format(day, 'eeee, d MMMM', { locale: id })}
                       </p>
                       {holiday && (
                         <div className="flex items-start gap-2">
                           <div className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1 ${isJointLeave ? 'bg-amber-400' : 'bg-red-500'}`} />
                           <p className={`text-[11px] font-bold leading-tight ${isJointLeave ? 'text-amber-300' : 'text-red-300'}`}>
                             {holiday.holiday_name}
                           </p>
                         </div>
                       )}
                       {isSunday(day) && !holiday && (
                         <div className="flex items-start gap-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 mt-1" />
                           <p className="text-[11px] font-bold leading-tight text-red-300">
                             Hari Minggu
                           </p>
                         </div>
                       )}
                       {dayEvents.map((ev, idx) => (
                         <div key={idx} className="flex items-start gap-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-main-blue shrink-0 mt-1 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                           <p className="text-[11px] font-bold leading-tight text-blue-200">
                             {ev.title}
                           </p>
                         </div>
                       ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="p-1">
      {renderHeader()}
      <div className="bg-gray-50/50 p-4 rounded-[2rem] border border-gray-100">
        {renderDays()}
        {renderCells()}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-6 px-2">
         <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Libur Nasional</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Cuti Bersama</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-main-blue shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Agenda KKG</span>
         </div>
      </div>
    </div>
  );
}
