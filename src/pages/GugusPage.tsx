import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  History, 
  Target, 
  Users, 
  Briefcase, 
  ChevronRight,
  BookOpen,
  Award,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { useSiteContent } from '../contexts/SiteContext';
import OrgChart from '../components/OrgChart';
import { supabase } from '../lib/supabase';
import MapGugus from '../components/MapGugus';
import { getAutomatedProgramStatus } from '../utils/statusHelper';

const getInitialOrgGugus = (): any[] => {
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem('cached_org_gugus');
      if (cached) return JSON.parse(cached);
    } catch (e) {}
  }
  return [];
};

export default function GugusPage() {
  const { content } = useSiteContent();
  const [activeTab, setActiveTab] = useState<'sejarah' | 'visi' | 'struktur' | 'program'>('sejarah');
  const [struktur, setStruktur] = useState<any[]>(getInitialOrgGugus);
  
  useEffect(() => {
    window.scrollTo(0, 0);
    loadStruktur();
  }, []);

  const loadStruktur = async () => {
    if (!supabase) return;
    const { data } = await supabase.from('org_gugus').select('*').order('created_at', { ascending: true });
    if (data) {
      setStruktur(data);
      try {
        localStorage.setItem('cached_org_gugus', JSON.stringify(data));
      } catch (e) {}
    }
  };
  
  const data = content.gugus;

  const tabs = [
    { id: 'sejarah', label: 'Sejarah', icon: History },
    { id: 'visi', label: 'Visi & Misi', icon: Target },
    { id: 'struktur', label: 'Struktur Organisasi', icon: Users },
    { id: 'program', label: 'Program Kerja', icon: Briefcase },
  ];

  return (
    <div className="pt-24 min-h-screen bg-light-gray pb-20">
      {/* Hero Section Page */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-main-blue/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-leaf-green/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-100 shadow-sm mb-6"
            >
              <span className="w-2 h-2 rounded-full bg-main-blue animate-pulse" />
              <span className="text-xs font-bold text-main-blue uppercase tracking-widest">Profil Gugus</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl font-heading font-black text-soft-black mb-6"
            >
              Profil <span className="text-main-blue underline decoration-leaf-green/30">Gugus 03 Melati</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-gray-600 leading-relaxed"
            >
              Pusat koordinasi, sinergi, dan pemberdayaan sekolah dasar anggota untuk mencapai standar pendidikan nasional yang unggul di Kecamatan Jenu.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <div className="container mx-auto px-6 mb-12">
        <div className="flex flex-wrap justify-center gap-2 md:gap-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all ${
                  isActive 
                    ? 'bg-main-blue text-white shadow-xl shadow-main-blue/20 scale-105' 
                    : 'bg-white text-gray-500 hover:bg-gray-50 hover:text-soft-black border border-gray-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-main-blue'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="container mx-auto px-6 max-w-6xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 md:p-12 border border-main-orange/20 shadow-2xl shadow-blue-500/5 min-h-[500px]"
          >
            {activeTab === 'sejarah' && (
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 bg-blue-50 rounded-2xl">
                    <History className="w-8 h-8 text-main-blue" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-heading font-black text-soft-black">Sejarah Singkat</h2>
                    <p className="text-sm text-main-blue font-bold uppercase tracking-wider">Langkah dan Jejak Gugus</p>
                  </div>
                </div>
                
                <div className="prose prose-blue max-w-none text-gray-600 space-y-6 leading-relaxed text-lg">
                  <p>{data.sejarah}</p>
                </div>

                <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { label: 'Tahun Berdiri', value: data.tahunBerdiri || '2010', icon: Calendar },
                    { label: 'Sekolah Inti', value: data.sekolahInti || 'UPT SDN Mentoso', icon: Award },
                    { label: 'Wilayah Kerja', value: data.wilayahKerja || 'Kec. Jenu Utara', icon: Target },
                  ].map((item, idx) => (
                    <div key={idx} className="bg-gray-50 p-6 rounded-2xl border border-gray-100 text-center">
                      <item.icon className="w-8 h-8 text-main-blue/40 mx-auto mb-3" />
                      <p className="text-xs font-bold text-gray-400 uppercase mb-1">{item.label}</p>
                      <p className="text-lg font-bold text-soft-black">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'visi' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <div>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 bg-main-blue rounded-2xl flex items-center justify-center text-white">
                        <Target className="w-6 h-6" />
                      </div>
                      <h2 className="text-3xl font-heading font-black text-soft-black">Visi Gugus</h2>
                    </div>
                    <p className="text-xl text-gray-600 leading-relaxed font-light italic border-l-4 border-leaf-green pl-6 py-2">
                       "{data.visi}"
                    </p>
                  </div>

                  <div>
                     <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 bg-leaf-green rounded-2xl flex items-center justify-center text-white">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <h2 className="text-3xl font-heading font-black text-soft-black">Misi Kami</h2>
                    </div>
                    <ul className="space-y-4">
                      {data.misi.map((misi, idx) => (
                        <li key={idx} className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-main-blue/30 transition-colors">
                          <span className="w-8 h-8 rounded-lg bg-main-blue/10 text-main-blue flex items-center justify-center font-bold shrink-0">{idx + 1}</span>
                          <span className="text-gray-600">{misi}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="bg-white border-2 border-gray-100 rounded-[2rem] p-8 shadow-sm h-full">
                  <h3 className="text-2xl font-heading font-black text-soft-black mb-8 flex items-center gap-3">
                    <div className="w-10 h-10 bg-main-blue/10 rounded-xl flex items-center justify-center text-main-blue">
                      <Target className="w-6 h-6" />
                    </div>
                    Tujuan Strategis
                  </h3>
                  <div className="space-y-4">
                    {data.tujuan.map((tujuan, idx) => (
                      <div key={idx} className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200 group">
                        <div className="w-10 h-10 shrink-0 bg-gray-100 text-gray-500 font-bold rounded-full flex items-center justify-center group-hover:bg-main-blue group-hover:text-white transition-colors">
                          {idx + 1}
                        </div>
                        <p className="text-lg font-medium text-gray-700 leading-relaxed pt-1.5">{tujuan}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'struktur' && (
              <div className="space-y-12">
                <div className="text-center">
                   <h2 className="text-3xl font-heading font-black text-soft-black mb-2">Struktur Organisasi</h2>
                   {content.profil.periodeKepengurusan && (
                     <p className="text-main-blue font-bold mb-4 uppercase tracking-widest text-sm text-center">Periode {content.profil.periodeKepengurusan}</p>
                   )}
                   <p className="text-gray-500">Susunan pengurus Gugus 03 Melati Kecamatan Jenu</p>
                </div>
                
                <div className="bg-white/50 rounded-3xl p-6 border border-gray-100 overflow-x-auto min-h-[400px]">
                  <OrgChart members={struktur} />
                </div>
              </div>
            )}

            {activeTab === 'program' && (
              <div className="space-y-8">
                 <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 bg-orange-50 rounded-2xl">
                    <Briefcase className="w-8 h-8 text-accent-orange" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-heading font-black text-soft-black">Program Gugus</h2>
                    <p className="text-sm text-accent-orange font-bold uppercase tracking-wider">Inisiatif Strategis</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {data.programs.map((program, idx) => {
                    const autoStatus = getAutomatedProgramStatus(program);
                    return (
                      <div key={idx} className="group p-8 rounded-3xl bg-white border border-gray-100 hover:border-main-blue transition-all hover:shadow-xl shadow-soft-black/5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-main-blue/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-main-blue/10 transition-colors" />
                        <div className="relative z-10">
                          <div className="flex items-start justify-between mb-6">
                             <div className="p-3 bg-blue-50 text-main-blue rounded-xl group-hover:bg-main-blue group-hover:text-white transition-colors">
                                <BookOpen className="w-6 h-6" />
                             </div>
                             <div className="flex flex-col items-end gap-1">
                               <span className="text-[10px] font-bold px-3 py-1 bg-leaf-green/10 text-leaf-green rounded-full uppercase tracking-tighter">
                                 {program.date}
                               </span>
                               <span className={`text-[9px] font-bold px-3 py-0.5 rounded-full uppercase tracking-tighter border
                                 ${autoStatus === 'selesai' ? 'bg-green-50 text-green-700 border-green-100' : 
                                   autoStatus === 'berjalan' ? 'bg-blue-50 text-blue-700 border-blue-100 animate-pulse' : 
                                   'bg-orange-50 text-orange-700 border-orange-100'}
                               `}>
                                 {autoStatus}
                               </span>
                             </div>
                          </div>
                          <h3 className="text-xl font-heading font-bold text-soft-black mb-3 group-hover:text-main-blue transition-colors">{program.title}</h3>
                          <p className="text-sm text-gray-500 leading-relaxed mb-6">{program.desc}</p>
                          <div className="flex items-center text-main-blue text-sm font-bold opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all">
                            Selengkapnya <ChevronRight className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Peta Digital Wilayah Gugus - Global Map Section */}
      <div className="container mx-auto px-4 md:px-6 mt-16 max-w-7xl">
        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 md:p-12 border border-main-orange/20 shadow-2xl shadow-blue-500/5">
          <div className="mb-10 text-center">
            <h3 className="text-3xl font-heading font-black text-soft-black">Peta Digital Wilayah Gugus</h3>
            <p className="text-sm text-main-blue font-bold uppercase tracking-wider mt-2">Pemetaan Lokasi dan Radius Sekolah Anggota</p>
          </div>
          <MapGugus />
        </div>
      </div>
    </div>
  );
}
