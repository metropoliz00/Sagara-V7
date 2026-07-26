import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Calendar, User, FileText, Bell, X } from "lucide-react";
import React, { useState } from "react";
import { supabase } from "../lib/supabase";

const getInitialNews = (): any[] => {
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem('cached_posts');
      if (cached) return JSON.parse(cached);
    } catch (e) {}
  }
  return [];
};

export default function MediaInformasi() {
  const [news, setNews] = useState<any[]>(getInitialNews);
  const [isLoading, setIsLoading] = useState<boolean>(() => news.length === 0);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  // Helper to strip HTML tags for preview highlight
  const stripHtml = (html: string) => {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  React.useEffect(() => {
    async function fetchPosts() {
      if (!supabase) return;
      try {
        const { data, error } = await supabase.from('posts').select(`*, author:author_id(nama)`).order('published_at', { ascending: false }).limit(6);
        if (error) throw error;
        if (data) {
          setNews(data);
          try {
            localStorage.setItem('cached_posts', JSON.stringify(data));
          } catch (e) {}
        }
      } catch (err) {
        console.error("Gagal memuat berita:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPosts();
  }, []);

  return (
    <section id="media" className="py-24 bg-transparent relative">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl"
          >
            <h2 className="text-dark-green font-bold tracking-widest text-sm uppercase mb-3">Pusat Informasi</h2>
            <h3 className="text-3xl md:text-5xl font-heading font-extrabold text-soft-black mb-4">Berita & Pengumuman</h3>
          </motion.div>
          <motion.a 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            href="#" 
            className="flex items-center gap-2 text-main-blue font-bold hover:gap-3 transition-all"
          >
            Lihat Semua <ArrowRight className="w-5 h-5" />
          </motion.a>
        </div>

        {isLoading ? (
          <div className="text-center text-gray-500 py-10 font-medium">Memuat informasi terbaru...</div>
        ) : news.length === 0 ? (
          <div className="text-center text-gray-500 py-10 font-medium">Belum ada berita atau pengumuman.</div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
            {news.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "0px" }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/80 border border-main-orange/20 backdrop-blur-md rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all group flex flex-col hover:border-main-orange/40 cursor-pointer"
                onClick={() => setSelectedItem(item)}
              >
                {item.featured_image_url ? (
                  <div className="relative h-56 overflow-hidden shrink-0">
                    <img src={item.featured_image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold text-main-blue shadow-sm capitalize">
                      {item.category}
                    </div>
                  </div>
                ) : (
                  <div className="relative h-56 overflow-hidden shrink-0 bg-gradient-to-br from-main-blue/10 to-leaf-green/10 flex items-center justify-center">
                     {item.category === 'pengumuman' ? <Bell className="w-16 h-16 text-main-blue/20" /> : <FileText className="w-16 h-16 text-main-blue/20" />}
                     <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold text-main-blue shadow-sm capitalize">
                      {item.category}
                    </div>
                  </div>
                )}
                <div className="p-8 flex flex-col flex-1">
                  <div className="flex items-center gap-4 text-xs font-medium text-gray-500 mb-4">
                    <div className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {new Date(item.published_at || item.created_at).toLocaleDateString('id-ID', { timeZone: "Asia/Jakarta" })}</div>
                    <div className="flex items-center gap-1"><User className="w-4 h-4" /> {item.author?.nama || 'Admin'}</div>
                  </div>
                  <h4 className="font-heading font-bold text-xl text-soft-black mb-4 group-hover:text-main-blue transition-colors line-clamp-2">
                    {item.title}
                  </h4>
                  {item.content && (
                     <p className="text-gray-500 text-sm mb-6 line-clamp-3 leading-relaxed flex-1">
                        {stripHtml(item.content)}
                     </p>
                  )}
                  <button className="font-semibold text-leaf-green flex items-center gap-1 group-hover:gap-2 transition-all text-sm mt-auto">
                    Baca Selanjutnya <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Content */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedItem(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <button 
                onClick={() => setSelectedItem(null)}
                className="absolute top-4 right-4 z-10 bg-white/20 hover:bg-white/40 backdrop-blur-md p-2 rounded-full text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="overflow-y-auto">
                <div className="relative">
                  {selectedItem.featured_image_url ? (
                    <div className="w-full h-[400px] md:h-[500px] relative">
                      <img src={selectedItem.featured_image_url} alt={selectedItem.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
                        <div className="flex items-center gap-4 text-xs font-bold mb-4">
                          <div className="bg-main-blue text-white px-3 py-1 rounded-full capitalize shadow-lg">{selectedItem.category}</div>
                          <div className="flex items-center gap-1 text-white/90"><Calendar className="w-4 h-4" /> {new Date(selectedItem.published_at || selectedItem.created_at).toLocaleDateString('id-ID', { timeZone: "Asia/Jakarta" })}</div>
                          <div className="flex items-center gap-1 text-white/90"><User className="w-4 h-4" /> {selectedItem.author?.nama || 'Admin'}</div>
                        </div>
                        <h3 className="text-3xl md:text-5xl font-heading font-black leading-tight text-white drop-shadow-2xl max-w-4xl">
                          {selectedItem.title}
                        </h3>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 md:p-12 bg-gray-50 border-b border-gray-100">
                      <div className="flex items-center gap-4 text-xs font-bold text-main-blue/60 mb-4 uppercase tracking-widest">
                        <div className="px-3 py-1 bg-main-blue/10 text-main-blue rounded-full capitalize">{selectedItem.category}</div>
                        <div className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {new Date(selectedItem.published_at || selectedItem.created_at).toLocaleDateString('id-ID', { timeZone: "Asia/Jakarta" })}</div>
                        <div className="flex items-center gap-1"><User className="w-4 h-4" /> {selectedItem.author?.nama || 'Admin'}</div>
                      </div>
                      <h3 className="text-3xl md:text-5xl font-heading font-black text-main-blue leading-tight">
                        {selectedItem.title}
                      </h3>
                    </div>
                  )}
                </div>

                <div className="p-8 md:p-16 max-w-4xl mx-auto overflow-x-hidden">
                  <style dangerouslySetInnerHTML={{ __html: `
                    .news-content {
                      font-family: "Inter", sans-serif;
                      color: #334155;
                      font-size: 1.05rem;
                    }
                    .news-content p {
                      margin-bottom: 1.25rem;
                      line-height: 1.8;
                      word-break: normal;
                      overflow-wrap: break-word;
                      hyphens: none;
                      text-align: left;
                    }
                    .ql-align-center { text-align: center !important; }
                    .ql-align-right { text-align: right !important; }
                    .ql-align-justify { text-align: justify !important; }
                    .news-content h1, .news-content h2, .news-content h3 {
                      color: #1e40af;
                      font-weight: 800;
                      margin-top: 2.5rem;
                      margin-bottom: 1.25rem;
                      line-height: 1.3;
                      text-indent: 0;
                      text-align: left;
                    }
                    .news-content img {
                      max-width: 100%;
                      height: auto;
                      border-radius: 1.25rem;
                      margin: 2rem auto;
                      display: block;
                      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                    }
                    .news-content ul, .news-content ol {
                      margin-bottom: 1.25rem;
                      padding-left: 2rem;
                      text-indent: 0;
                    }
                    .news-content li {
                      margin-bottom: 0.5rem;
                      line-height: 1.7;
                    }
                    .news-content blockquote {
                      border-left: 4px solid #3b82f6;
                      padding: 1.5rem;
                      font-style: italic;
                      color: #475569;
                      margin: 2rem 0;
                      background-color: #f8fafc;
                      border-radius: 0 1rem 1rem 0;
                      text-indent: 0;
                    }
                  `}} />
                  <div 
                    className="prose prose-blue max-w-none news-content"
                    dangerouslySetInnerHTML={{ __html: selectedItem.content }}
                  />
                  {selectedItem.url && (
                    <div className="mt-12 pt-8 border-t border-gray-100 flex flex-col items-center">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 italic">Sumber Informasi</p>
                      <a 
                        href={selectedItem.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="group flex items-center gap-2 bg-main-blue text-white px-8 py-3 rounded-full font-bold hover:bg-main-blue/90 hover:-translate-y-0.5 transition-all shadow-md active:scale-95"
                      >
                        Buka Sumber Asli <ArrowRight className="w-4 h-4" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  )
}
