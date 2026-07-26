import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { PlusCircle, X, Award, Play, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ImageUpload from './ImageUpload';
import { useAlert } from '../contexts/AlertContext';

export function SharingPractices({ user }: { user: any }) {
  const [practices, setPractices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempPractice, setTempPractice] = useState<any | null>(null);
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);
  const { alert, confirm } = useAlert();

  const startEditing = (p: any) => {
    setTempPractice({ ...p });
    setEditingId(p.id);
  };

  const handleCloseModal = async () => {
    const original = practices.find(p => p.id === editingId);
    if (original && tempPractice) {
      const hasChanges = 
        original.title !== tempPractice.title ||
        original.category !== tempPractice.category ||
        original.video_url !== tempPractice.video_url ||
        original.description !== tempPractice.description ||
        (original.thumbnail_url || original.image_url || "") !== (tempPractice.thumbnail_url || tempPractice.image_url || "");

      if (hasChanges) {
        const confirmClose = await confirm(
          "Ada perubahan yang belum disimpan. Yakin ingin menutup tanpa menyimpan?",
          "Konfirmasi"
        );
        if (!confirmClose) return;
      }
    }
    setEditingId(null);
    setTempPractice(null);
  };

  const handleSave = async () => {
    if (!tempPractice || !supabase || isSaving) return;
    setIsSaving(true);
    try {
      const dbUpdates = {
        title: tempPractice.title,
        category: tempPractice.category,
        video_url: tempPractice.video_url,
        description: tempPractice.description,
        thumbnail_url: tempPractice.thumbnail_url || tempPractice.image_url,
      };

      const { error } = await supabase
        .from("best_practices")
        .update(dbUpdates)
        .eq("id", tempPractice.id);

      if (error) throw error;

      setPractices(
        practices.map((p) => (p.id === tempPractice.id ? { ...p, ...tempPractice } : p))
      );
      setEditingId(null);
      setTempPractice(null);
      await alert("Praktik baik berhasil disimpan dan dipublikasikan!", "Sukses", "success");
    } catch (err: any) {
      console.error("Error saving practice:", err);
      await alert(`Gagal menyimpan: ${err.message}`, "Kesalahan", "error");
    } finally {
      setIsSaving(false);
    }
  };

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
        // Step 1: Fetch best practices
        const { data: practicesData, error: practicesError } = await supabase
          .from("best_practices")
          .select("*")
          .order("created_at", { ascending: false });
        
        if (practicesError) throw practicesError;
        
        if (!practicesData || practicesData.length === 0) {
          setPractices([]);
          return;
        }

        // Step 2: Fetch profiles for the authors
        const userIds = [...new Set(practicesData.map(p => p.user_id).filter(Boolean))];
        const { data: profilesData, error: profilesError } = await supabase
          .from("user_profiles")
          .select("id, nama, username, foto")
          .in("id", userIds);

        if (profilesError) {
          console.warn("Could not fetch profiles, showing practices without author details", profilesError);
          setPractices(practicesData);
          return;
        }

        // Step 3: Map profiles to practices locally
        const joinedData = practicesData.map(practice => ({
          ...practice,
          user_profiles: profilesData.find(profile => profile.id === practice.user_id)
        }));

        setPractices(joinedData);
      } catch (err: any) {
        console.error("Error fetching sharing practices:", err);
        // Fallback: search without join if the above fails (though we already split it to be safe)
      } finally {
        setIsLoading(false);
      }
    }
    loadPractices();
  }, []);

  const handleAdd = async () => {
    if (!supabase || isAdding) return;
    
    if (!user || !user.id) {
       await alert("Sesi anda berakhir atau data user tidak lengkap. Harap login kembali.", "Error", "error");
       return;
    }

    setIsAdding(true);
    try {
      const newPractice = {
        user_id: user.id,
        title: "Praktik Baik Baru",
        description: "Bagikan pengalaman mengajar Anda di sini...",
        thumbnail_url: "https://images.unsplash.com/photo-1544928147-79a2dbc1f389?w=800&q=80",
      };
      
      const { data, error } = await supabase
        .from("best_practices")
        .insert([newPractice])
        .select("*");
      
      if (error) throw error;

      if (data && data.length > 0) {
        // Fetch the user profile for the newly inserted record
        const { data: profileData } = await supabase
          .from("user_profiles")
          .select("id, nama, username, foto")
          .eq("id", user.id)
          .single();

        const fullNewRecord = {
          ...data[0],
          user_profiles: profileData
        };

        setPractices([fullNewRecord, ...practices]);
        setTempPractice({ ...fullNewRecord });
        setEditingId(data[0].id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        await alert("Draft praktik baik berhasil dibuat. Silakan lengkapi detailnya.", "Sukses", "success");
      }
    } catch (err: any) {
      console.error("Error adding practice:", err);
      await alert(`Gagal menambah praktik baik: ${err.message}`, "Kesalahan", "error");
    } finally {
      setIsAdding(false);
    }
  };

  const handleUpdate = async (id: string, updates: any) => {
    try {
      // Map UI field names to DB field names if necessary
      const dbUpdates = { ...updates };
      if (dbUpdates.image_url) {
        dbUpdates.thumbnail_url = dbUpdates.image_url;
        delete dbUpdates.image_url;
      }
      if (dbUpdates.author_name) {
        delete dbUpdates.author_name; // This is from join, not updatable directly here
      }

      const { error } = await supabase
        .from("best_practices")
        .update(dbUpdates)
        .eq("id", id);
      
      if (error) throw error;
      
      setPractices(
        practices.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      );
    } catch (err: any) {
      console.error("Error updating practice:", err);
      await alert(`Gagal memperbarui: ${err.message}`, "Kesalahan", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!await confirm("Apakah Anda yakin ingin menghapus praktik baik ini?", "Konfirmasi Hapus")) return;
    try {
      const { error } = await supabase
        .from("best_practices")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      
      setPractices(practices.filter((p) => p.id !== id));
      await alert("Praktik baik berhasil dihapus.", "Sukses", "success");
    } catch (err: any) {
      console.error("Error deleting practice:", err);
      await alert(`Gagal menghapus: ${err.message}`, "Kesalahan", "error");
    }
  };

  return (
    <div className="space-y-10">
      {/*Sharing Clean Header */}
      <div className="bg-white p-8 rounded-[2rem] border-l-8 border-main-blue shadow-sm mb-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
        <div className="flex items-center gap-8">
          <div className="w-16 h-16 bg-main-blue/10 rounded-2xl flex items-center justify-center text-main-blue border border-main-blue/10 shrink-0">
            <Award className="w-8 h-8" />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-main-blue/10 rounded-full border border-main-blue/5 mb-2">
              <div className="w-1 h-1 rounded-full bg-main-blue animate-pulse" />
              <span className="text-[10px] font-bold text-main-blue uppercase tracking-widest font-heading">Inspirasi Kolektif</span>
            </div>
            <h2 className="text-2xl font-bold font-heading text-soft-black">
              Sharing Praktik Baik
            </h2>
            <p className="text-sm text-gray-500">
              Wadah kolaborasi untuk berbagi inovasi pengajaran guna memajukan pendidikan di lingkungan Gugus 03.
            </p>
          </div>
        </div>
        
        <button
          onClick={handleAdd}
          disabled={isAdding}
          className="bg-main-blue text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-md hover:bg-main-blue/90 active:scale-95 transition-all flex items-center gap-3"
        >
          {isAdding ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <PlusCircle className="w-4 h-4" />
          )}
          {isAdding ? "Menyiapkan..." : "Bagikan Karya"}
        </button>
      </div>

      {/* Modal for Editing/Adding */}
      <AnimatePresence>
        {editingId && tempPractice && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
              >
                <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <div>
                    <h3 className="text-xl font-black text-soft-black">Form Praktik Baik</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Lengkapi Detail Inspirasi Anda</p>
                  </div>
                  <button onClick={handleCloseModal} className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-gray-400 hover:text-soft-black transition-colors cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                 <div className="p-8 overflow-y-auto space-y-6 modern-scrollbar">
                    <div className="space-y-6">
                      <div className="group">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1 group-focus-within:text-main-blue transition-colors">Judul Praktik</label>
                        <input
                          className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 text-sm font-bold focus:border-main-blue focus:bg-white outline-none transition-all"
                          value={tempPractice.title || ""}
                          onChange={(e) => setTempPractice({ ...tempPractice, title: e.target.value })}
                          placeholder="Contoh: Metode Belajar Seru di Luar Kelas"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="group">
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1 group-focus-within:text-main-blue transition-colors">Kategori</label>
                          <select
                            className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 text-sm font-bold focus:border-main-blue focus:bg-white outline-none transition-all appearance-none"
                            value={tempPractice.category || "Inovasi"}
                            onChange={(e) => setTempPractice({ ...tempPractice, category: e.target.value })}
                          >
                            <option value="Inovasi">Inovasi</option>
                            <option value="Inovasi Pembelajaran">Inovasi Pembelajaran</option>
                            <option value="Manajemen Kelas">Manajemen Kelas</option>
                            <option value="Media Digital">Media Digital</option>
                            <option value="Lainnya">Lainnya</option>
                          </select>
                        </div>
                        <div className="group">
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1 group-focus-within:text-main-blue transition-colors">Link Video YouTube</label>
                          <input
                            className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 text-sm font-bold focus:border-main-blue focus:bg-white outline-none transition-all"
                            value={tempPractice.video_url || ""}
                            onChange={(e) => setTempPractice({ ...tempPractice, video_url: e.target.value })}
                            placeholder="https://youtube.com/watch?v=..."
                          />
                        </div>
                      </div>
                      <div className="group">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Nama Penulis</label>
                        <div className="w-full bg-gray-100/50 border-2 border-transparent rounded-2xl p-4 text-sm font-bold text-gray-400 cursor-not-allowed">
                          {tempPractice.user_profiles?.nama || tempPractice.user_profiles?.full_name || tempPractice.user_profiles?.username || "Profil Anda"}
                        </div>
                        <p className="text-[9px] text-gray-400 mt-2 ml-1 italic">*Nama penulis diambil otomatis dari profil akun Anda.</p>
                      </div>
                      <div className="group">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1 group-focus-within:text-main-blue transition-colors">Deskripsi Inspirasi</label>
                        <textarea
                          className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 text-sm font-medium h-40 focus:border-main-blue focus:bg-white outline-none transition-all leading-relaxed"
                          value={tempPractice.description || ""}
                          onChange={(e) => setTempPractice({ ...tempPractice, description: e.target.value })}
                          placeholder="Ceritakan tantangan, langkah-langkah, dan keberhasilan praktik baik yang Anda lakukan..."
                        />
                      </div>
                      <div className="pt-2">
                        <ImageUpload
                          label="Upload Foto Sampul"
                          value={tempPractice.image_url || tempPractice.thumbnail_url || ""}
                          onChange={(url) => setTempPractice({ ...tempPractice, image_url: url, thumbnail_url: url })}
                        />
                      </div>
                    </div>
                </div>

                <div className="p-8 bg-gray-50/50 border-t border-gray-100">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full bg-gradient-to-r from-main-blue to-indigo-600 text-white py-4 rounded-2xl text-sm font-black shadow-xl shadow-main-blue/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      "Simpan & Publikasikan Sekarang"
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {isLoading ? (
        <div className="text-center py-20">
          <div className="animate-spin w-10 h-10 border-4 border-main-blue border-t-transparent rounded-full mx-auto mb-4 shadow-lg shadow-main-blue/10"></div>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Menyiapkan Inspirasi...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 pb-20">
          {practices.map((p) => {
            const author = p.user_profiles;
            const authorName = author?.nama || author?.full_name || author?.username || "Guru Gugus 03";
            const imageUrl = p.thumbnail_url || p.image_url || "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&q=80";

            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-xl shadow-gray-200/50 flex flex-col h-full hover:shadow-2xl hover:shadow-main-blue/10 transition-all duration-500 relative"
              >
                {/* Image Area - scale 16:9 (aspect-video) */}
                <div className="relative aspect-video w-full overflow-hidden bg-gray-100">
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
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-main-blue/90 backdrop-blur-md text-white flex items-center justify-center shadow-2xl scale-0 group-hover:scale-100 transition-transform duration-500 hover:bg-main-blue cursor-pointer z-10"
                    >
                      <Play className="w-8 h-8 fill-white ml-1" />
                    </button>
                  )}

                  {/* Category Tag */}
                  <div className="absolute top-6 left-6 z-10">
                    <span className="px-4 py-1.5 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-main-blue shadow-lg border border-white/20">
                      {p.category || "Inovasi"}
                    </span>
                  </div>

                  {/* Admin/Owner Controls displayed over image */}
                  {(p.user_id === user.id || user.role === "admin") && (
                    <div className="absolute top-6 right-6 flex gap-3 z-20">
                      <button
                        onClick={() => startEditing(p)}
                        className="w-10 h-10 rounded-2xl bg-white/80 backdrop-blur-md flex items-center justify-center text-gray-700 hover:bg-main-blue hover:text-white transition-all border border-white/20 shadow-lg group/btn cursor-pointer"
                        title="Edit Praktik Baik"
                      >
                        <PlusCircle className="w-5 h-5 group-hover/btn:rotate-90 transition-transform" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="w-10 h-10 rounded-2xl bg-red-500/80 backdrop-blur-md flex items-center justify-center text-white hover:bg-red-600 transition-all border border-white/20 shadow-lg cursor-pointer"
                        title="Hapus"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Content Area - underneath the image */}
                <div className="p-8 flex flex-col flex-1">
                  <h3 className="text-2xl font-black text-soft-black mb-4 leading-tight line-clamp-2 group-hover:text-main-blue transition-colors">
                    {p.title}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-8 line-clamp-3 italic flex-1">
                    "{p.description}"
                  </p>

                  <div className="mt-auto pt-6 border-t border-gray-50 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden shrink-0">
                        {author?.foto ? (
                          <img src={author.foto} className="w-full h-full object-cover" alt={authorName} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
                            <Award className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">DIBAGIKAN OLEH</span>
                        <span className="text-xs sm:text-sm font-black text-soft-black break-words leading-tight whitespace-normal">{authorName}</span>
                      </div>
                    </div>

                    {p.video_url && (
                      <button 
                        onClick={() => setActiveVideoUrl(p.video_url)}
                        className="p-2.5 rounded-xl bg-main-blue/5 text-main-blue hover:bg-main-blue hover:text-white transition-all shadow-sm shrink-0 cursor-pointer"
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
                  <p className="text-gray-400 max-w-md">Pastikan Anda memasukkan link YouTube yang valid. Link saat ini: <br/><span className="text-main-blue text-xs break-all">{activeVideoUrl}</span></p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
