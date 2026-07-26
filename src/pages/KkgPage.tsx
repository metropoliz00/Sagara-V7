import { motion, AnimatePresence } from "motion/react";
import OrgChart from "../components/OrgChart";
import Gallery from "../components/Gallery";
import { Link } from 'react-router-dom';
import { 
  Users, Target, Lightbulb, FileText, Download, Upload, 
  Calendar, BarChart3, Bell, ChevronDown, CheckCircle2,
  Briefcase, BookOpen, Quote, Image as ImageIcon, Video, PlayCircle,
  Megaphone, Award
} from "lucide-react";
import { useState, useEffect } from "react";
import { useSiteContent, defaultContent } from "../contexts/SiteContext";
import { supabase } from '../lib/supabase';
import { getAutomatedProgramStatus } from "../utils/statusHelper";

const getDirectDownloadUrl = (url: string | null | undefined): string => {
  if (!url) return "";
  const trimmed = url.trim();
  const fileDMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch && fileDMatch[1]) {
    return `https://drive.google.com/uc?export=download&id=${fileDMatch[1]}&confirm=t`;
  }
  const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) {
    return `https://drive.google.com/uc?export=download&id=${idMatch[1]}&confirm=t`;
  }
  const dMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (dMatch && dMatch[1] && trimmed.includes("drive.google.com")) {
    return `https://drive.google.com/uc?export=download&id=${dMatch[1]}&confirm=t`;
  }
  return trimmed;
};

const getInitialOrgKkg = (): any[] => {
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem('cached_org_kkg');
      if (cached) return JSON.parse(cached);
    } catch (e) {}
  }
  return [];
};

export default function KkgPage() {
  const [activeProgramGroup, setActiveProgramGroup] = useState('tahunan');
  const [openProgramIdx, setOpenProgramIdx] = useState<number | null>(0);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [struktur, setStruktur] = useState<any[]>(getInitialOrgKkg);

  useEffect(() => {
    window.scrollTo(0, 0);
    loadStruktur();
  }, []);

  const loadStruktur = async () => {
    if (!supabase) return;
    const { data } = await supabase.from('org_kkg').select('*').order('created_at', { ascending: true });
    if (data) {
      setStruktur(data);
      try {
        localStorage.setItem('cached_org_kkg', JSON.stringify(data));
      } catch (e) {}
    }
  };

  const { content } = useSiteContent();
  const kkg = {
    ...defaultContent.kkg,
    ...content.kkg
  };

  const programCategories = kkg.programCategories || [
    { id: 'tahunan', label: 'Program Tahunan' },
    { id: 'workshop', label: 'Workshop & Pelatihan' },
    { id: 'supervisi', label: 'Supervisi Akademik' },
    { id: 'media', label: 'Pengembangan Media' },
  ];

  const activeGroup = programCategories.some(c => c.id === activeProgramGroup)
    ? activeProgramGroup
    : (programCategories[0]?.id || 'tahunan');

  const programsData = kkg.programs || { tahunan: [], workshop: [], supervisi: [], media: [] };
  const visi = kkg.visi || 'Visi belum diatur.';
  const misi = kkg.misi || [];
  const tujuan = kkg.tujuan || [];
  const sejarah = kkg.sejarah || 'Sejarah KKG belum diatur.';

  return (
    <div className="pt-24 pb-20 bg-light-gray min-h-screen">
      {/* Hero Section */}
      <section className="container mx-auto px-6 max-w-7xl mb-24 relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-main-blue/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-leaf-green/10 rounded-full blur-3xl -z-10" />
        
        {kkg.pengumuman?.isActive && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto mb-10 p-4 md:p-6 bg-yellow-50/80 backdrop-blur-sm border border-yellow-200/50 rounded-[2rem] shadow-xl shadow-yellow-500/5 flex flex-col md:flex-row items-center gap-4 md:gap-6 text-center md:text-left relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full blur-2xl -mr-16 -mt-16" />
            <div className="w-14 h-14 bg-yellow-100 text-yellow-600 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
              <Megaphone className="w-7 h-7" />
            </div>
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded-full bg-yellow-400 text-white text-[10px] font-black uppercase tracking-widest mb-2">
                Penting
              </div>
              <h3 className="font-bold font-heading text-yellow-900 text-lg mb-1 leading-tight">{kkg.pengumuman.title}</h3>
              <p className="text-yellow-800 text-sm leading-relaxed">{kkg.pengumuman.desc}</p>
            </div>
          </motion.div>
        )}

        <div className="text-center max-w-4xl mx-auto mt-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-main-blue/10 text-main-blue font-semibold text-sm mb-6"
          >
            <Users className="w-4 h-4" />
            <span>Kelompok Kerja Guru (KKG)</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-6xl font-heading font-bold text-soft-black mb-6 leading-tight"
          >
            Transformasi Pendidikan <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-main-blue to-leaf-green">Melalui Kolaborasi</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-gray-600 text-lg md:text-xl leading-relaxed mb-10"
          >
            Bersama Gugus 03 Melati Kecamatan Jenu, kita ciptakan ekosistem belajar yang inovatif, berbagi praktik baik, dan tumbuh bersama demi masa depan cerah anak bangsa.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap justify-center gap-4"
          >
            <Link to="/kkg/program" className="px-8 py-4 bg-gradient-to-r from-main-blue to-dark-blue text-white rounded-xl font-bold hover:shadow-lg hover:shadow-main-blue/30 transition-all flex items-center gap-2">
              <Download className="w-5 h-5" /> Program Kerja
            </Link>
            <Link to="/kkg/agenda" className="px-8 py-4 bg-white text-main-blue border-2 border-main-blue/20 hover:border-main-blue/50 rounded-xl font-bold transition-all flex items-center gap-2">
              <Calendar className="w-5 h-5" /> Agenda Kegiatan
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Sejarah Section */}
      <section className="container mx-auto px-6 max-w-7xl mb-24">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl shadow-gray-200/50 border border-gray-100 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-main-blue/5 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2" />
          {/* Top Row: Text on Left, Photo on Right (16:9 aspect ratio) */}
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center mb-10">
            {/* Left Content */}
            <div className="lg:col-span-6 space-y-5">
              <div className="inline-flex items-center gap-2 text-leaf-green font-bold text-sm uppercase tracking-widest px-3.5 py-1.5 bg-leaf-green/10 rounded-full">
                <BookOpen className="w-4 h-4" />
                <span>Profil & Sejarah</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-heading font-extrabold text-soft-black leading-tight">
                Membangun Fondasi Pendidikan Sejak Dini
              </h2>
              <div className="space-y-4 text-gray-600 leading-relaxed text-base">
                <p>{sejarah}</p>
              </div>
            </div>

            {/* Right Photo with Aspect Ratio 16:9 */}
            <div className="lg:col-span-6">
              <div className="relative group overflow-hidden rounded-3xl shadow-lg border border-gray-100">
                <img 
                  src={kkg.gambarProfil || "https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=2070&auto=format&fit=crop"} 
                  className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-500" 
                  alt="Profil KKG" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-60" />
              </div>
            </div>
          </div>

          {/* Bottom Row: Dynamic Cards from Database */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 pt-8 border-t border-gray-100">
            {/* Card 1: Tahun Berdedikasi */}
            <div className="bg-gradient-to-br from-leaf-green to-dark-green p-6 rounded-3xl text-white shadow-lg shadow-leaf-green/15 flex flex-col justify-between min-h-[130px] group hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center justify-between">
                <span className="text-3xl md:text-4xl font-black font-heading block">
                  {kkg.tahunDedikasi || "5+"}
                </span>
                <div className="p-2.5 bg-white/10 backdrop-blur-sm rounded-2xl">
                  <Award className="w-6 h-6 text-white" />
                </div>
              </div>
              <span className="text-xs font-bold opacity-90 uppercase tracking-wider mt-4">
                Tahun Berdedikasi
              </span>
            </div>

            {/* Render statistikKkg items from database */}
            {(kkg.statistikKkg || []).map((stat: any, idx: number) => {
              const isDark = idx === 0;
              return (
                <div 
                  key={idx}
                  className={`${isDark ? 'bg-gradient-to-br from-main-blue to-dark-blue text-white shadow-lg shadow-main-blue/15' : 'bg-white border-2 border-gray-100 text-soft-black shadow-lg shadow-gray-200/40 hover:border-main-blue/40'} p-6 rounded-3xl flex flex-col justify-between min-h-[130px] group hover:-translate-y-1 transition-all duration-300`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-3xl md:text-4xl font-black font-heading block ${isDark ? 'text-white' : 'text-main-blue'}`}>
                      {stat.value}{stat.suffix || ""}
                    </span>
                    <div className={`p-2.5 ${isDark ? 'bg-white/15 text-white' : 'bg-main-blue/10 text-main-blue'} backdrop-blur-sm rounded-2xl`}>
                      <Users className="w-6 h-6" />
                    </div>
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-wider mt-4 ${isDark ? 'opacity-90' : 'text-gray-700'}`}>
                    {stat.label}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* Visi Misi Tujuan */}
      <section className="container mx-auto px-6 max-w-7xl mb-24">
        <div className="grid lg:grid-cols-3 gap-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-main-blue to-dark-blue p-8 rounded-3xl text-white shadow-xl shadow-main-blue/20 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <Target className="w-12 h-12 mb-6 text-white/90" />
            <h3 className="text-2xl font-bold font-heading mb-4">Visi KKG</h3>
            <p className="text-white/90 leading-relaxed font-light italic">
              "{visi}"
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="bg-white p-8 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 lg:col-span-2"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-leaf-green/10 rounded-xl text-leaf-green">
                <Lightbulb className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold font-heading">Misi & Tujuan</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-bold text-soft-black mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-leaf-green/10 flex items-center justify-center text-leaf-green text-xs font-bold">1</span>
                  Misi Strategis
                </h4>
                <ul className="space-y-4">
                  {misi.map((item: string, i: number) => (
                    <li key={i} className="flex gap-3 text-gray-600">
                      <CheckCircle2 className="w-5 h-5 text-leaf-green shrink-0 mt-0.5" />
                      <span className="text-sm font-medium">{item}</span>
                    </li>
                  ))}
                  {misi.length === 0 && <li className="text-gray-400 text-sm italic">Misi belum ditentukan.</li>}
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-soft-black mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-main-blue/10 flex items-center justify-center text-main-blue text-xs font-bold">2</span>
                  Tujuan Utama
                </h4>
                <ul className="space-y-4">
                  {tujuan.map((item: string, i: number) => (
                    <li key={i} className="flex gap-3 text-gray-600">
                      <CheckCircle2 className="w-5 h-5 text-main-blue shrink-0 mt-0.5" />
                      <span className="text-sm font-medium">{item}</span>
                    </li>
                  ))}
                  {tujuan.length === 0 && <li className="text-gray-400 text-sm italic">Tujuan belum ditentukan.</li>}
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Struktur Organisasi */}
      <section className="container mx-auto px-6 max-w-7xl mb-24">
        <div className="text-center mb-16">
          <div className="inline-block px-4 py-1 bg-main-blue/5 text-main-blue rounded-full text-xs font-bold uppercase tracking-widest mb-4">Penggerak Gugus</div>
          <h2 className="text-4xl font-heading font-extrabold text-soft-black mb-2">Struktur Organisasi</h2>
          {content.profil.periodeKepengurusan && (
            <p className="text-main-blue font-bold mb-4 uppercase tracking-[0.2em] text-sm">Periode {content.profil.periodeKepengurusan}</p>
          )}
          <p className="text-gray-500 max-w-2xl mx-auto">Sinergi antara para profesional di lingkungan Gugus 03 Melati Kecamatan Jenu untuk mewujudkan visi bersama.</p>
        </div>
        <OrgChart members={struktur} />
      </section>

      {/* Program Kerja Accordion & Stats */}
      <section className="container mx-auto px-6 max-w-7xl mb-24">
        <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-white rounded-2xl shadow-md flex items-center justify-center text-main-blue border border-gray-100">
                <Briefcase className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-3xl font-heading font-bold text-soft-black">Program Kerja & Agenda</h2>
                <p className="text-gray-500 text-sm">Rangkaian kegiatan terstruktur untuk pengembangan berkelanjutan.</p>
              </div>
            </div>
            
            {/* Tabs */}
            <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-200 pb-4">
              {programCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveProgramGroup(cat.id);
                    setOpenProgramIdx(0);
                  }}
                  className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    activeGroup === cat.id 
                      ? 'bg-main-blue text-white shadow-lg shadow-main-blue/20' 
                      : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Accordion */}
            <div className="space-y-4">
              <AnimatePresence mode="wait">
                {(programsData[activeGroup] || []).map((prog: any, idx: number) => (
                  <motion.div 
                    key={`${activeGroup}-${idx}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`bg-white border rounded-2xl overflow-hidden transition-all ${openProgramIdx === idx ? 'border-main-blue/30 shadow-lg shadow-main-blue/5' : 'border-gray-100'}`}
                  >
                    <button 
                      onClick={() => setOpenProgramIdx(openProgramIdx === idx ? null : idx)}
                      className="w-full px-6 py-5 flex items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${openProgramIdx === idx ? 'bg-main-blue/10 text-main-blue' : 'bg-gray-50 text-gray-400'}`}>
                          <Briefcase className="w-5 h-5" />
                        </div>
                        <h4 className={`font-semibold ${openProgramIdx === idx ? 'text-main-blue' : 'text-soft-black'}`}>{prog.title}</h4>
                      </div>
                      <ChevronDown className={`w-5 h-5 transition-transform ${openProgramIdx === idx ? 'rotate-180 text-main-blue' : 'text-gray-400'}`} />
                    </button>
                    <AnimatePresence>
                      {openProgramIdx === idx && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-5 pt-2 text-gray-600 border-t border-gray-50 flex flex-col md:flex-row gap-6 md:items-start pl-20">
                            <p className="flex-1 text-sm leading-relaxed">{prog.desc}</p>
                            <div className="flex flex-col gap-2 min-w-[120px]">
                              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Jadwal / Status</span>
                              <div className="flex items-center gap-2 text-sm font-semibold text-soft-black">
                                <Calendar className="w-4 h-4 text-main-blue" /> {prog.date}
                              </div>
                              {(() => {
                                const autoStatus = getAutomatedProgramStatus(prog);
                                return (
                                  <div className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest self-start border
                                    ${autoStatus === 'selesai' ? 'bg-green-50 text-green-700 border-green-100' : 
                                      autoStatus === 'berjalan' ? 'bg-blue-50 text-blue-700 border-blue-100 animate-pulse' : 
                                      'bg-orange-50 text-orange-700 border-orange-100'}
                                  `}>
                                    {autoStatus === 'selesai' ? 'selesai' : autoStatus === 'berjalan' ? 'berjalan' : 'rencana'}
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Side Dashboard Metrics / Interactions */}
          <div className="space-y-6">
            {kkg.pengumuman?.isActive && (
              <div className="bg-gradient-to-br from-leaf-green to-dark-green rounded-3xl p-6 text-white shadow-xl shadow-leaf-green/20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold font-heading">{kkg.pengumuman.title}</h3>
                  <Bell className="w-5 h-5 opacity-80" />
                </div>
                <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-main-orange/20">
                  <span className="text-xs font-semibold text-green-200 block mb-1">Penting</span>
                  <p className="text-sm leading-snug">{kkg.pengumuman.desc}</p>
                </div>
              </div>
            )}

            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-bold justify-between flex items-center mb-6">
                Statistik KKG <BarChart3 className="w-5 h-5 text-main-blue" />
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500 font-medium">Realisasi Program</span>
                    <span className="font-bold text-main-blue">{kkg.realisasiProgram ?? 65}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-main-blue h-2 rounded-full" style={{ width: `${kkg.realisasiProgram ?? 65}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500 font-medium">Partisipasi Guru</span>
                    <span className="font-bold text-leaf-green">{kkg.partisipasiGuru ?? 88}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-leaf-green h-2 rounded-full" style={{ width: `${kkg.partisipasiGuru ?? 88}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dokumen KKG Section */}
      <section className="container mx-auto px-6 max-w-7xl mb-24">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-white rounded-2xl shadow-md flex items-center justify-center text-main-blue border border-gray-100">
            <FileText className="w-6 h-6" />
          </div>
          <h2 className="text-3xl font-heading font-bold text-soft-black">Dokumen KKG</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(kkg.dokumen || []).map((doc: any, i: number) => (
            <a key={i} href={getDirectDownloadUrl(doc.url)} download={doc.title} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all flex items-center gap-4 group">
              <div className="p-3 bg-blue-50 text-main-blue rounded-xl">
                 <FileText className="w-6 h-6" />
              </div>
              <span className="font-semibold text-soft-black group-hover:text-main-blue">{doc.title || "Dokumen"}</span>
            </a>
          ))}
          {(kkg.dokumen || []).length === 0 && <p className="text-gray-500 italic col-span-full">Belum ada dokumen yang diunggah.</p>}
        </div>
      </section>

      {/* Dokumentasi KKG Carousel */}
      <Gallery />
      
    </div>
  );
}
