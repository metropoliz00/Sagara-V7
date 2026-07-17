import React, { useState, useEffect, useMemo, useRef } from 'react';
import { LearningDocumentation } from '../types';
import { Camera, Plus, Trash2, Edit, X, Save, Loader2, ExternalLink, ChevronLeft, ChevronRight, Image as ImageIcon, Eye, EyeOff, Film } from 'lucide-react';

const getYoutubeId = (url: string): string | null => {
  if (!url) return null;
  const lowerUrl = url.toLowerCase();
  
  // YouTube Shorts
  if (lowerUrl.includes('/shorts/')) {
    const parts = url.split('/shorts/');
    if (parts.length > 1) {
      const idPart = parts[1].split(/[?&#]/)[0];
      if (idPart && idPart.length === 11) {
        return idPart;
      }
    }
  }
  
  // YouTube watch?v= or &v= or youtu.be
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2] && match[2].length === 11) {
    return match[2];
  }
  
  // Fallback regex for direct string searches/wildcard
  const longRegExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const matchLong = url.match(longRegExp);
  if (matchLong && matchLong[1] && matchLong[1].length === 11) {
    return matchLong[1];
  }

  return null;
};

const getGoogleDriveId = (url: string): string | null => {
  if (!url) return null;
  const lowerUrl = url.toLowerCase();
  
  // Make sure it contains docs.google or drive.google
  if (!lowerUrl.includes('drive.google.com') && !lowerUrl.includes('docs.google.com')) {
    return null;
  }
  
  // Pattern: /file/d/ID
  const fileDMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]{15,})/);
  if (fileDMatch && fileDMatch[1]) {
    return fileDMatch[1];
  }
  
  // Pattern: ?id=ID or &id=ID
  const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]{15,})/);
  if (idMatch && idMatch[1]) {
    return idMatch[1];
  }
  
  // Fallback pattern if ID length differs
  const fallbackFileDMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fallbackFileDMatch && fallbackFileDMatch[1]) {
    return fallbackFileDMatch[1];
  }

  const fallbackIdMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (fallbackIdMatch && fallbackIdMatch[1]) {
    return fallbackIdMatch[1];
  }
  
  return null;
};

const getVimeoId = (url: string): string | null => {
  if (!url) return null;
  if (!url.toLowerCase().includes('vimeo')) return null;
  const match = url.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|showcase\/(?:\d+)\/video\/|)?(\d+)/i);
  if (match && match[1]) {
    return match[1];
  }
  const simpleMatch = url.match(/vimeo\.com\/([0-9]+)/);
  if (simpleMatch && simpleMatch[1]) {
    return simpleMatch[1];
  }
  return null;
};

const isVideoLink = (url: string): boolean => {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  
  // Direct video file extensions
  if (
    lowerUrl.endsWith('.mp4') || 
    lowerUrl.includes('.mp4?') ||
    lowerUrl.endsWith('.webm') || 
    lowerUrl.includes('.webm?') ||
    lowerUrl.endsWith('.ogg') || 
    lowerUrl.includes('.ogg?') ||
    lowerUrl.endsWith('.mov') || 
    lowerUrl.includes('.mov?') ||
    lowerUrl.endsWith('.mkv') ||
    lowerUrl.includes('.mkv?')
  ) {
    return true;
  }
  
  // Standard video hosts
  if (
    lowerUrl.includes('youtube.com') || 
    lowerUrl.includes('shorts') ||
    lowerUrl.includes('youtu.be') ||
    lowerUrl.includes('drive.google.com') ||
    lowerUrl.includes('docs.google.com') ||
    lowerUrl.includes('vimeo.com')
  ) {
    return true;
  }
  
  return false;
};

const getMediaEmbedUrl = (url: string): string | null => {
  if (!url) return null;
  
  // YouTube
  const ytId = getYoutubeId(url);
  if (ytId) {
    return `https://www.youtube.com/embed/${ytId}`;
  }
  
  // Google Drive
  const driveId = getGoogleDriveId(url);
  if (driveId) {
    return `https://drive.google.com/file/d/${driveId}/preview`;
  }
  
  // Vimeo
  const vimeoId = getVimeoId(url);
  if (vimeoId) {
    return `https://player.vimeo.com/video/${vimeoId}`;
  }

  return null;
};

const getYoutubeThumbnail = (url: string): string | null => {
  if (!url) return null;
  const ytId = getYoutubeId(url);
  if (ytId) {
    return `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`;
  }
  return null;
};

interface LearningDocumentationViewProps {
  documentation: LearningDocumentation[];
  onSave: (doc: Omit<LearningDocumentation, 'id'> | LearningDocumentation) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onShowNotification: (message: string, type: 'success' | 'error' | 'warning') => void;
  classId: string;
}

const LearningDocumentationView: React.FC<LearningDocumentationViewProps> = ({ documentation, onSave, onDelete, onShowNotification, classId }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Partial<LearningDocumentation> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTableVisible, setIsTableVisible] = useState(false);
  const [playingDirectVideo, setPlayingDirectVideo] = useState<string | null>(null);
  const [uploadMethod, setUploadMethod] = useState<'link' | 'upload'>('link');
  const timeoutRef = useRef<number | null>(null);

  const images = useMemo(() => documentation.filter(doc => doc.linkFoto && (doc.linkFoto.startsWith('http') || doc.linkFoto.startsWith('data:'))), [documentation]);

  // Carousel Logic
  useEffect(() => {
    const resetTimeout = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
    resetTimeout();
    
    // Pause auto-sliding if current active item is a video
    const currentItemIsVideo = images.length > 0 && isVideoLink(images[currentIndex]?.linkFoto);
    if (images.length > 1 && !currentItemIsVideo) {
      timeoutRef.current = window.setTimeout(
        () => setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length),
        6000 // Change slide every 6 seconds
      );
    }
    return () => resetTimeout();
  }, [currentIndex, images.length, images]);

  const goToPrevious = () => {
    setPlayingDirectVideo(null);
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };
  const goToNext = () => {
    setPlayingDirectVideo(null);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  // Modal and Save Logic
  const openModal = (doc: LearningDocumentation | null = null) => {
    const initialDoc = doc ? { ...doc } : { namaKegiatan: '', linkFoto: '', classId };
    setEditingDoc(initialDoc);
    setUploadMethod(initialDoc.linkFoto && initialDoc.linkFoto.startsWith('data:') ? 'upload' : 'link');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingDoc(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onShowNotification('Hanya file gambar yang didukung.', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      setEditingDoc(prev => prev ? { ...prev, linkFoto: base64String } : null);
      onShowNotification('Foto berhasil diunggah dan diubah ke Base64.', 'success');
    };
    reader.onerror = () => {
      onShowNotification('Gagal membaca file gambar.', 'error');
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!editingDoc || !editingDoc.namaKegiatan || !editingDoc.linkFoto) {
      onShowNotification('Nama Kegiatan dan Link/Media wajib diisi.', 'warning');
      return;
    }
    setIsSaving(true);
    try {
      await onSave(editingDoc as LearningDocumentation);
      onShowNotification('Dokumentasi berhasil disimpan.', 'success');
      closeModal();
    } catch (e) {
      onShowNotification('Gagal menyimpan data.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const renderThumbnail = (doc: LearningDocumentation) => {
    const isVideo = isVideoLink(doc.linkFoto);
    if (isVideo) {
      const ytThumb = getYoutubeThumbnail(doc.linkFoto);
      if (ytThumb) {
        return (
          <div className="relative w-24 h-16 rounded-md border border-gray-200 overflow-hidden bg-black/90">
            <img src={ytThumb} alt={doc.namaKegiatan} className="w-full h-full object-cover opacity-80" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white text-[8px] bg-red-600 px-1 py-0.5 rounded font-black uppercase tracking-wider">VIDEO</span>
            </div>
          </div>
        );
      }
      
      const embedUrl = getMediaEmbedUrl(doc.linkFoto);
      if (embedUrl) {
        return (
          <div className="relative w-24 h-16 rounded-md border border-gray-200 overflow-hidden bg-slate-900 flex flex-col items-center justify-center">
            <Film size={18} className="text-gray-300" />
            <span className="text-white text-[8px] bg-amber-500 px-1.5 py-0.5 rounded font-black uppercase tracking-wider mt-1">EMBED VIDEO</span>
          </div>
        );
      }

      return (
        <div className="relative w-24 h-16 rounded-md border border-gray-200 overflow-hidden bg-slate-950">
          <video src={doc.linkFoto} className="w-full h-full object-cover" muted preload="metadata" />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <span className="text-white text-[8px] bg-indigo-600 px-1 py-0.5 rounded font-black uppercase tracking-wider">VIDEO</span>
          </div>
        </div>
      );
    } else {
      return (
        <img 
          src={doc.linkFoto} 
          alt={doc.namaKegiatan} 
          className="w-24 h-16 object-cover rounded-md border border-gray-200 group-hover:scale-105 transition-transform"
        />
      );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <Camera className="mr-3 text-indigo-600" />
            Dokumentasi Pembelajaran
          </h2>
          <p className="text-gray-500">Galeri foto dan video kegiatan belajar mengajar di kelas.</p>
        </div>
        <div className="flex items-center gap-2">
            <button 
                onClick={() => setIsTableVisible(!isTableVisible)}
                className="flex items-center gap-2 bg-white text-gray-600 border border-gray-200 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-50"
                title={isTableVisible ? 'Sembunyikan Tabel' : 'Tampilkan Tabel'}
            >
                {isTableVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                <span className="hidden sm:inline">{isTableVisible ? 'Sembunyikan Tabel' : 'Tampilkan Tabel'}</span>
            </button>
            <button 
              onClick={() => openModal()} 
              className="flex items-center gap-2 bg-indigo-600 text-white font-bold px-4 py-2 rounded-lg shadow-md hover:bg-indigo-700"
            >
              <Plus size={18} /> Tambah
            </button>
        </div>
      </div>

      {/* Carousel */}
      <div className={`relative w-full mx-auto bg-black rounded-2xl shadow-lg border border-gray-200 overflow-hidden group transition-all duration-500 ease-in-out ${isTableVisible ? 'max-w-2xl h-96' : 'max-w-4xl h-[28rem]'}`}>
        {images.length > 0 ? (
          <>
            <div className="w-full h-full flex overflow-hidden">
                {images.map((image, index) => (
                    <div 
                        key={image.id}
                        className="w-full h-full flex-shrink-0 transition-transform duration-700 ease-in-out relative overflow-hidden"
                        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                    >
                        {index === currentIndex ? (
                          (() => {
                            const isVideo = isVideoLink(image.linkFoto);
                            if (isVideo) {
                              const embedUrl = getMediaEmbedUrl(image.linkFoto);
                              if (embedUrl) {
                                const ytThumb = getYoutubeThumbnail(image.linkFoto);
                                return (
                                  <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden select-none">
                                    {ytThumb && (
                                      <img 
                                        src={ytThumb} 
                                        alt="" 
                                        className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-105 pointer-events-none select-none" 
                                      />
                                    )}
                                    <iframe 
                                      src={embedUrl}
                                      className="relative z-10 w-full h-full border-0"
                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                      allowFullScreen
                                    />
                                  </div>
                                );
                              }
                              return (
                                <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden">
                                  <video 
                                    src={image.linkFoto} 
                                    className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-105 pointer-events-none select-none" 
                                    muted 
                                    loop 
                                    autoPlay 
                                    playsInline 
                                  />
                                  <video 
                                    src={image.linkFoto}
                                    controls
                                    autoPlay
                                    className="relative z-10 max-w-full max-h-full object-contain bg-transparent"
                                    playsInline
                                  />
                                </div>
                              );
                            }
                            return (
                              <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden select-none">
                                <img 
                                  src={image.linkFoto} 
                                  alt="" 
                                  className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-105 pointer-events-none select-none" 
                                />
                                <img 
                                  src={image.linkFoto} 
                                  alt={image.namaKegiatan} 
                                  className="relative z-10 max-w-full max-h-full object-contain pointer-events-auto" 
                                />
                              </div>
                            );
                          })()
                        ) : (
                          <div className="w-full h-full bg-black flex items-center justify-center">
                            {isVideoLink(image.linkFoto) ? (
                              <div className="text-gray-400 flex flex-col items-center">
                                <Film size={48} className="mb-2 text-gray-500" />
                                <p className="font-semibold text-sm">{image.namaKegiatan}</p>
                              </div>
                            ) : (
                              <img src={image.linkFoto} alt={image.namaKegiatan} className="w-full h-full object-contain opacity-40" />
                            )}
                          </div>
                        )}
                    </div>
                ))}
            </div>
            
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-10 pointer-events-none select-none">
                <p className="font-bold text-base text-white drop-shadow-md text-center">{images[currentIndex].namaKegiatan}</p>
            </div>

            {images.length > 1 && (
                <>
                    <button onClick={goToPrevious} className="absolute top-1/2 left-4 -translate-y-1/2 bg-white/50 p-2 rounded-full text-gray-800 hover:bg-white transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm z-30">
                        <ChevronLeft size={24} />
                    </button>
                    <button onClick={goToNext} className="absolute top-1/2 right-4 -translate-y-1/2 bg-white/50 p-2 rounded-full text-gray-800 hover:bg-white transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm z-30">
                        <ChevronRight size={24} />
                    </button>
                    <div className="absolute bottom-4 right-4 flex gap-2 z-30">
                        {images.map((_, i) => (
                            <div key={i} onClick={() => { setPlayingDirectVideo(null); setCurrentIndex(i); }} className={`w-2 h-2 rounded-full cursor-pointer transition-all ${currentIndex === i ? 'bg-white scale-125' : 'bg-white/50'}`}></div>
                        ))}
                    </div>
                </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-slate-900">
              <ImageIcon size={48} className="mb-2 text-slate-600"/>
              <p>Belum ada foto atau video dokumentasi.</p>
          </div>
        )}
      </div>

      {/* Table */}
      {isTableVisible && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 font-medium">
              <tr>
                <th className="p-4 w-12 text-center">No</th>
                <th className="p-4">Nama Kegiatan</th>
                <th className="p-4">Foto / Video</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {documentation.map((doc, index) => (
                <tr key={doc.id} className="hover:bg-indigo-50/30">
                  <td className="p-4 text-center text-gray-500">{index + 1}</td>
                  <td className="p-4 font-semibold text-gray-800">
                    <div>
                      {doc.namaKegiatan}
                      {isVideoLink(doc.linkFoto) && (
                        <span className="ml-2 inline-flex items-center gap-1 bg-red-50 text-red-700 text-[10px] px-2 py-0.5 rounded font-semibold border border-red-200">
                          <Film size={10} /> Video
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-2">
                    <div className="group block cursor-pointer" onClick={() => {
                      const imageIndex = images.findIndex(item => item.id === doc.id);
                      if (imageIndex !== -1) {
                        setCurrentIndex(imageIndex);
                        setPlayingDirectVideo(doc.id);
                        // Scroll up to the carousel
                        window.scrollTo({ top: 100, behavior: 'smooth' });
                      }
                    }}>
                      {renderThumbnail(doc)}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={() => openModal(doc)} className="p-2 text-gray-500 hover:text-indigo-600" title="Edit"><Edit size={16} /></button>
                    <button onClick={() => onDelete(doc.id)} className="p-2 text-gray-500 hover:text-red-600" title="Hapus"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && editingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-5 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-800">{editingDoc.id ? 'Edit Dokumentasi' : 'Tambah Dokumentasi'}</h3>
              <button className="p-1 hover:bg-gray-200 rounded-md transition-colors" onClick={closeModal}><X size={20}/></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-1">Nama Kegiatan</label>
                <input 
                  type="text" 
                  value={editingDoc.namaKegiatan || ''} 
                  onChange={e => setEditingDoc({...editingDoc, namaKegiatan: e.target.value})}
                  className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="Contoh: Belajar Kelompok Matematika"
                />
              </div>
              <div className="flex border-b border-gray-100 mb-4">
                <button
                  type="button"
                  onClick={() => setUploadMethod('link')}
                  className={`flex-1 py-2.5 text-center text-sm font-semibold border-b-2 transition-all ${
                    uploadMethod === 'link'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Gunakan Link URL
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMethod('upload')}
                  className={`flex-1 py-2.5 text-center text-sm font-semibold border-b-2 transition-all ${
                    uploadMethod === 'upload'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Upload Foto
                </button>
              </div>

              {uploadMethod === 'link' ? (
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-1">Link Foto / Video</label>
                  <input 
                    type="url" 
                    value={editingDoc.linkFoto && !editingDoc.linkFoto.startsWith('data:') ? editingDoc.linkFoto : ''} 
                    onChange={e => setEditingDoc({...editingDoc, linkFoto: e.target.value})}
                    className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="https://... (Link Google Drive, YouTube, Vimeo, mp4, dll)"
                  />
                  <span className="text-xs text-gray-400 mt-1 block">Dukung link foto biasa (.jpg, .png), langsung video (.mp4), link YouTube, atau video Google Drive.</span>
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-gray-600 mb-1">Pilih File Foto</label>
                  {editingDoc.linkFoto && editingDoc.linkFoto.startsWith('data:') ? (
                    <div className="relative rounded-xl border border-indigo-100 bg-indigo-50/20 p-4 flex flex-col items-center justify-center">
                      <img 
                        src={editingDoc.linkFoto} 
                        alt="Preview" 
                        className="max-h-48 rounded-lg object-contain border border-gray-200 shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setEditingDoc({ ...editingDoc, linkFoto: '' })}
                        className="mt-3 flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-bold transition-colors"
                      >
                        <Trash2 size={14} /> Hapus Foto
                      </button>
                    </div>
                  ) : (
                    <div className="relative border-2 border-dashed border-gray-300 rounded-xl hover:border-indigo-500 transition-colors bg-gray-50/50 p-6 flex flex-col items-center justify-center group cursor-pointer">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Camera className="text-gray-400 group-hover:text-indigo-500 mb-2 transition-colors" size={32} />
                      <p className="text-sm font-semibold text-gray-700 group-hover:text-indigo-600 transition-colors">Klik untuk Pilih Foto atau Seret ke Sini</p>
                      <p className="text-xs text-gray-400 mt-1">Hanya file gambar (.jpg, .png, .jpeg, .webp)</p>
                    </div>
                  )}
                  <span className="text-xs text-gray-400 block">Sistem akan secara otomatis mengubah foto Anda menjadi string Base64 berkualitas asli untuk disimpan.</span>
                </div>
              )}
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
              <button onClick={closeModal} className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 text-gray-700 font-medium transition-colors">Batal</button>
              <button 
                onClick={handleSave} 
                disabled={isSaving}
                className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LearningDocumentationView;