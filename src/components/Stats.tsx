import { motion, useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { School, Users, GraduationCap, Trophy } from "lucide-react";
import { useSiteContent } from "../contexts/SiteContext";
import { supabase } from "../lib/supabase";

function Counter({ end, suffix = "", duration = 2 }: { end: number, suffix?: string, duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "0px" });

  useEffect(() => {
    if (isInView) {
      let start = 0;
      const increment = end / (duration * 60); // Assuming 60fps
      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setCount(end);
          clearInterval(timer);
        } else {
          setCount(Math.ceil(start));
        }
      }, 1000 / 60);
      return () => clearInterval(timer);
    }
  }, [isInView, end, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
}

const getInitialDynamicStats = (): any[] => {
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem('cached_dynamic_stats');
      if (cached) return JSON.parse(cached);
    } catch (e) {}
  }
  return [];
};

export default function Stats() {
  const { content } = useSiteContent();
  const [dynamicStats, setDynamicStats] = useState<any[]>(getInitialDynamicStats);
  const [isLoading, setIsLoading] = useState<boolean>(() => dynamicStats.length === 0);

  useEffect(() => {
    async function fetchDynamicStats() {
      if (!supabase) return;
      try {
        const [
          { data: schoolsData },
          { count: teacherCount }
        ] = await Promise.all([
          supabase.from('schools').select('student_count, teacher_count, jenis_sekolah').throwOnError(),
          supabase.from('user_profiles').select('*', { count: 'exact', head: true }).eq('role', 'guru').throwOnError()
        ]);

        if (!schoolsData) return;

        const totalStudents = schoolsData.reduce((acc: number, curr: any) => acc + (Number(curr.student_count) || 0), 0);
        const schoolIntiCount = schoolsData.filter((s: any) => s.jenis_sekolah === 'Sekolah Inti').length;
        const schoolImbasCount = schoolsData.filter((s: any) => s.jenis_sekolah !== 'Sekolah Inti').length;
        
        const totalTeachers = schoolsData.reduce((acc: number, curr: any) => acc + (Number(curr.teacher_count) || 0), 0);

        const newStats = [
          { label: 'Sekolah Inti', value: schoolIntiCount, suffix: "", color: 'text-main-blue' },
          { label: 'Sekolah Imbas', value: schoolImbasCount, suffix: "", color: 'text-dark-green' },
          { label: 'Total Guru', value: totalTeachers, suffix: "+", color: 'text-leaf-green' },
          { label: 'Total Murid', value: totalStudents, suffix: "+", color: 'text-accent-orange' },
        ];

        setDynamicStats(newStats);
        try {
          localStorage.setItem('cached_dynamic_stats', JSON.stringify(newStats));
        } catch (e) {}
      } catch (err) {
        console.error("Error fetching dynamic stats:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDynamicStats();
  }, []);

  // Use dynamicStats if available, otherwise fallback to content.stats
  const stats = dynamicStats.length > 0 ? dynamicStats : content.stats;

  return (
    <section className="py-12 bg-light-gray relative z-20">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px" }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              whileHover={{ y: -5 }}
              className="bg-white/80 border border-main-orange/20 p-6 rounded-3xl flex flex-col justify-center shadow-sm relative overflow-hidden group hover:border-main-orange/40 transition-colors"
            >
              <div className={`text-4xl font-black ${stat.color || 'text-soft-black'} mb-1 font-heading`}>
                <Counter end={stat.value} suffix={stat.suffix || ''} />
              </div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                {stat.label}
              </div>
            </motion.div>
          ))}
          
          <motion.div
             initial={{ opacity: 0, y: 30 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true, margin: "0px" }}
             transition={{ delay: 0.3, duration: 0.6 }}
             whileHover={{ y: -5 }}
             className="bg-soft-black text-white p-6 rounded-3xl flex items-center justify-between shadow-xl"
          >
             <div className="flex flex-col">
                <span className="text-2xl font-black tracking-tight font-heading">Pusat Layanan</span>
                <span className="text-[10px] opacity-60 uppercase tracking-widest mt-1">Online 24/7 Support</span>
             </div>
             <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center shrink-0">
                <Trophy className="w-6 h-6 text-white" />
             </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
