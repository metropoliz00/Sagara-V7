import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Award, Play, X, Search, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function PraktikBaikPage() {
  const [practices, setPractices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Semua");

  const getYouTubeId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  useEffect(() => {
    async function loadPractices() {
      if (!supabase) return;
      try {
        const { data: practicesData, error: practicesError } = await supabase
          .from("best_practices")
          .select("*")
          .order("created_at", { ascending: false });
        
        if (practicesError) throw practicesError;
        
        if (!practicesData || practicesData.length === 0) {
          setPractices([]);
          return;
        }

        const userIds = [...new Set(practicesData.map(p => p.user_id).filter(Boolean))];
        const { data: profilesData, error: profilesError } = await supabase
          .from("user_profiles")
          .select("id, nama, username, foto")
          .in("id", userIds);

        if (profilesError) {
          setPractices(practicesData);
          return;
        }

        const joinedData = practicesData.map(practice => ({
          ...practice,
          user_profiles: profilesData.find(profile => profile.id === practice.user_id)
        }));

        setPractices(joinedData);
      } catch (err: any) {
        console.error("Error fetching sharing practices:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadPractices();
  }, []);

  const filteredPractices = practices.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchTerm.toLowerCase());
    const practiceCategory = p.category || "Inovasi";
    const matchesCategory = categoryFilter === "Semua" || practiceCategory === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = ["Semua", "Inovasi", "Inovasi Pembelajaran", "Manajemen Kelas", "Media Digital", "Lainnya"];

  return (
    <div className="pt-24 pb-20 min-h-screen bg-light-gray">
      {/* Header Section */}
      <section className="py-12 bg-white border-b border-gray-100">
        <div className="container mx-auto px-6 max-w-9xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-main-blue/10 rounded-full border border-main-blue/5 mb-4">
                <div className="w-1.5 h-1.5 rounded-full bg-main-blue animate-pulse" />
                <span className="text-[10px] font-black text-main-blue uppercase tracking-widest leading-none">Inspirasi Pendidik</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-heading font-black text-soft-black mb-4">Sharing Praktik Baik</h1>
              <p className="text-gray-500 text-lg leading-relaxed">
                Kumpulan inovasi, metode pembelajaran, dan pengalaman inspiratif dari para pendidik di lingkungan GUGUS 03 Melati.
              </p>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="stats-card bg-main-blue/5 p-6 rounded-3xl border border-main-blue/10 text-center min-w-[140px]">
                <div className="text-3xl font-black text-main-blue">{practices.length}</div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Inspirasi</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="py-8 sticky top-[68px] z-30 bg-light-gray/80 backdrop-blur-md border-b border-gray-200/50">
        <div className="container mx-auto px-6 max-w-9xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="text" 
                placeholder="Cari judul atau isi praktik baik..." 
                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white border border-gray-100 shadow-sm focus:border-main-blue outline-none transition-all text-sm font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2 lg:pb-0 hide-scrollbar">
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-200/50 rounded-xl text-gray-500 shrink-0">
                <Filter className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Kategori:</span>
              </div>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all ${
                    categoryFilter === cat 
                      ? "bg-main-blue text-white shadow-lg shadow-main-blue/20" 
                      : "bg-white text-gray-500 hover:bg-gray-50 border border-gray-100"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Content Grid */}
      <section className="py-12">
        <div className="container mx-auto px-6 max-w-9xl">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32">
              <div className="w-12 h-12 border-4 border-main-blue border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Memuat Inspirasi...</p>
            </div>
          ) : filteredPractices.length === 0 ? (
            <div className="bg-white rounded-[3rem] p-20 text-center border border-gray-100 shadow-sm">
              <Award className="w-20 h-20 text-gray-200 mx-auto mb-6" />
              <h3 className="text-2xl font-black text-soft-black mb-2">Belum Ada Praktik Baik</h3>
              <p className="text-gray-400 max-w-md mx-auto">Tidak ditemukan praktik baik untuk pencarian atau kategori ini. Coba kata kunci lain atau periksa kembali nanti.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {filteredPractices.map((p) => {
                const author = p.user_profiles;
                const authorName = author?.nama || author?.full_name || author?.username || "Guru Gugus 03";
                const imageUrl = p.thumbnail_url || p.image_url || "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&q=80";

                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="group bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-xl shadow-gray-200/50 flex flex-col h-full hover:shadow-2xl hover:shadow-main-blue/10 transition-all duration-500"
                  >
                    {/* Image Area */}
                    <div className="relative h-64 overflow-hidden">
                      <img 
                        src={imageUrl} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                        alt={p.title} 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      
                      {/* Play Button Overlay */}
                      {p.video_url && (
                        <button 
                          onClick={() => setActiveVideoUrl(p.video_url)}
                          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-main-blue/90 backdrop-blur-md text-white flex items-center justify-center shadow-2xl scale-0 group-hover:scale-100 transition-transform duration-500 hover:bg-main-blue"
                        >
                          <Play className="w-8 h-8 fill-white ml-1" />
                        </button>
                      )}

                      {/* Category Tag */}
                      <div className="absolute top-6 left-6">
                        <span className="px-4 py-1.5 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-main-blue shadow-lg border border-white/20">
                          {p.category || "Inovasi"}
                        </span>
                      </div>
                    </div>

                    {/* Content Area */}
                    <div className="p-8 flex flex-col flex-1">
                      <h3 className="text-2xl font-black text-soft-black mb-4 leading-tight line-clamp-2 group-hover:text-main-blue transition-colors">
                        {p.title}
                      </h3>
                      <p className="text-gray-500 text-sm leading-relaxed mb-8 line-clamp-3 italic">
                        "{p.description}"
                      </p>

                      <div className="mt-auto pt-6 border-t border-gray-50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden shrink-0">
                            {author?.foto ? (
                              <img src={author.foto} className="w-full h-full object-cover" alt={authorName} />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
                                <Award className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">DIBAGIKAN OLEH</span>
                            <span className="text-xs font-black text-soft-black break-words leading-tight">{authorName}</span>
                          </div>
                        </div>

                        {p.video_url && (
                          <button 
                            onClick={() => setActiveVideoUrl(p.video_url)}
                            className="p-2.5 rounded-xl bg-main-blue/5 text-main-blue hover:bg-main-blue hover:text-white transition-all shadow-sm"
                          >
                            <Play className="w-5 h-5 fill-current" />
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Video Modal Player */}
      <AnimatePresence>
        {activeVideoUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-md z-[200] flex items-center justify-center p-4 md:p-10"
            onClick={() => setActiveVideoUrl(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-5xl aspect-video bg-black rounded-[2rem] overflow-hidden shadow-[0_0_100px_rgba(31,143,229,0.3)] border border-white/10"
            >
              <button 
                onClick={() => setActiveVideoUrl(null)}
                className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md text-white flex items-center justify-center hover:bg-red-500 transition-all z-50 border border-white/20 shadow-2xl"
              >
                <X className="w-6 h-6" />
              </button>

              {getYouTubeId(activeVideoUrl) ? (
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${getYouTubeId(activeVideoUrl)}?autoplay=1`}
                  title="Video Praktik Baik"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-white p-10 text-center">
                  <Play className="w-20 h-20 text-main-blue mb-6 opacity-20" />
                  <h4 className="text-2xl font-black mb-2">Video Tidak Dapat Diputar</h4>
                  <p className="text-gray-400 max-w-md">Pastikan Anda memasukkan link YouTube yang valid.</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
