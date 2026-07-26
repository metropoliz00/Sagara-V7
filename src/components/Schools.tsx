import { motion, AnimatePresence } from "motion/react";
import { MapPin, Users, BookOpen, ArrowRight, X, Target, Lightbulb, Star, Navigation } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import SchoolDetailModal, { AccreditationSeal } from "./SchoolDetailModal";

const getInitialSchools = (): any[] => {
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem('cached_schools');
      if (cached) return JSON.parse(cached);
    } catch (e) {}
  }
  return [];
};

export default function Schools() {
  const [schools, setSchools] = useState<any[]>(getInitialSchools);
  const [selectedSchool, setSelectedSchool] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(() => schools.length === 0);
  const [filter, setFilter] = useState<'Semua' | 'Sekolah Inti' | 'Sekolah Imbas'>('Semua');

  useEffect(() => {
    async function fetchSchools() {
      if (!supabase) return;
      try {
        const { data, error } = await supabase.from('schools').select('*').order('name', { ascending: true });
        if (error) throw error;
        if (data) {
          setSchools(data);
          try {
            localStorage.setItem('cached_schools', JSON.stringify(data));
          } catch (e) {}
        }
      } catch (err) {
        console.error("Error fetching schools:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSchools();
  }, []);

  useEffect(() => {
    const handleOpenSchoolDetail = (e: CustomEvent) => {
      if (e.detail) {
        setSelectedSchool(e.detail);
      }
    };
    const handleSetFilter = (e: CustomEvent) => {
      if (e.detail && (e.detail === 'Semua' || e.detail === 'Sekolah Inti' || e.detail === 'Sekolah Imbas')) {
        setFilter(e.detail);
      }
    };
    window.addEventListener('open-school-detail' as any, handleOpenSchoolDetail);
    window.addEventListener('set-school-filter' as any, handleSetFilter);
    return () => {
      window.removeEventListener('open-school-detail' as any, handleOpenSchoolDetail);
      window.removeEventListener('set-school-filter' as any, handleSetFilter);
    };
  }, []);

  const filteredSchools = schools.filter(s => {
    if (filter === 'Semua') return true;
    return s.jenis_sekolah === filter;
  });

  return (
    <section id="sekolah" className="py-24 bg-light-gray relative">
      <div className="container mx-auto px-6 max-w-9xl">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-dark-green font-bold tracking-widest text-sm uppercase mb-3">Jaringan Pendidikan</h2>
            <h3 className="text-3xl md:text-5xl font-heading font-extrabold mb-6">
              <span className="text-main-blue">Profil Sekolah</span> <br />
              <span className="text-main-orange">Gugus 03 Melati Kecamatan Jenu</span>
            </h3>
            <p className="text-gray-500 text-lg">Membangun harmoni dalam keberagaman melalui kolaborasi Sekolah Inti dan Sekolah Imbas untuk mencetak generasi unggul.</p>
          </motion.div>
        </div>

        {/* Filter Buttons */}
        {!isLoading && schools.length > 0 && (
          <div className="flex justify-center gap-3 mb-12">
            {(['Semua', 'Sekolah Inti', 'Sekolah Imbas'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
                  filter === f
                    ? 'bg-main-blue text-white shadow-lg shadow-main-blue/20'
                    : 'bg-white text-gray-500 hover:bg-gray-100'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        )}

        {isLoading ? (
           <div className="text-center text-gray-400 font-medium py-10">Memuat profil sekolah...</div>
        ) : filteredSchools.length === 0 ? (
           <div className="text-center text-gray-400 font-medium py-10">Data sekolah tidak ditemukan untuk kategori ini.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredSchools.map((school, i) => (
              <motion.div
                key={school.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "0px" }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                whileHover={{ y: -10 }}
                className="bg-white rounded-3xl overflow-hidden shadow-lg shadow-gray-200/50 border border-main-orange/20 group flex flex-col"
              >
                 <div className="relative h-64 overflow-hidden shrink-0 bg-gray-100">
                   <img 
                     src={school.image_url || school.logo_url || 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=2000&auto=format&fit=crop'} 
                     alt={school.name} 
                     className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                   />
                   <div className="absolute inset-0 bg-gradient-to-t from-dark-gray/90 via-dark-gray/20 to-transparent" />
                   
                   {/* School Logo (Top Right) */}
                   <div className="absolute top-4 right-4 w-12 h-12 bg-white/30 backdrop-blur-sm rounded-xl p-2 shadow-lg border border-white/50 z-10">
                     <img 
                       src={school.logo_url || 'https://www.image2url.com/r2/default/images/1778156189287-e4930eb4-3c36-4ace-8420-ca8908132e66.png'} 
                       alt="Logo" 
                       className="w-full h-full object-contain" 
                     />
                   </div>

                   {/* School Type Badge */}
                   <div className="absolute top-4 left-4 flex flex-col gap-2">
                     <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border ${
                       school.jenis_sekolah === 'Sekolah Inti' 
                       ? 'bg-main-blue/20 text-white border-white/30' 
                       : 'bg-leaf-green/20 text-white border-white/30'
                     }`}>
                       {school.jenis_sekolah || 'Sekolah Imbas'}
                     </span>
                     {school.akreditasi && (
                       <div className="relative group/akred">
                         <AccreditationSeal grade={school.akreditasi} />
                         <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1 bg-black/80 text-[10px] text-white font-bold rounded-lg opacity-0 group-hover/akred:opacity-100 transition-all scale-95 group-hover/akred:scale-100 whitespace-nowrap z-50 shadow-xl border border-white/10">
                           AKREDITASI {school.akreditasi.toUpperCase()}
                         </div>
                       </div>
                     )}
                   </div>

                   <div className="absolute bottom-4 left-4 right-4">
                     <h4 className="text-white font-heading font-bold text-2xl">{school.name}</h4>
                   </div>
                 </div>
                <div className="p-8 flex flex-col flex-1">
                  <div className="flex items-center gap-4 mb-6 text-sm text-gray-600">
                    {school.principal_image_url ? (
                      <img src={school.principal_image_url} alt={school.principal_name} className="w-12 h-12 rounded-full object-cover shrink-0 border-2 border-main-orange/20 shadow-sm" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-light-gray flex items-center justify-center text-main-blue shrink-0">
                        <Users className="w-6 h-6" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-dark-gray text-base">Kepala Sekolah</p>
                      <p className="text-gray-500 font-medium">{school.principal_name || '-'}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-light-gray rounded-xl p-3 text-center">
                      <BookOpen className="w-5 h-5 mx-auto text-leaf-green mb-1" />
                      <span className="text-xs font-semibold text-gray-500 block">Siswa</span>
                      <span className="font-bold text-dark-gray">{school.student_count || 0}</span>
                    </div>
                    <div className="bg-light-gray rounded-xl p-3 text-center">
                      <Users className="w-5 h-5 mx-auto text-accent-orange mb-1" />
                      <span className="text-xs font-semibold text-gray-500 block">Guru</span>
                      <span className="font-bold text-dark-gray">{school.teacher_count || 0}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                    <button 
                      onClick={() => setSelectedSchool(school)}
                      className="text-main-blue font-semibold text-sm flex items-center gap-1 group-hover:gap-2 transition-all hover:text-dark-blue"
                    >
                      Lihat Detail <ArrowRight className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setSelectedSchool(school)}
                      className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-leaf-green hover:bg-green-50 transition-colors"
                    >
                      <MapPin className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* School Detail Modal */}
      <SchoolDetailModal 
        school={selectedSchool} 
        onClose={() => setSelectedSchool(null)} 
      />
    </section>
  );
}
