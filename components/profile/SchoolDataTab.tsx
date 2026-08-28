
import React, { useState, useEffect } from 'react';
import { SchoolProfileData } from '../../types';
import { compressImage } from '../../utils/imageHelper';
import { Loader2, AlertCircle, Save, Lock, Upload, Trash2, Megaphone, AlertTriangle, Palette, Volume2, BrainCircuit, ExternalLink, CheckCircle2, Clock } from 'lucide-react';
import { useModal } from '../../context/ModalContext';

interface SchoolDataTabProps {
  school: SchoolProfileData;
  setSchool: React.Dispatch<React.SetStateAction<SchoolProfileData>>;
  onSave: () => Promise<void>;
  isSaving: boolean;
  isReadOnly?: boolean;
}

const SchoolDataTab: React.FC<SchoolDataTabProps> = ({ school, setSchool, onSave, isSaving, isReadOnly = false }) => {
  const [uploadingRegency, setUploadingRegency] = useState(false);
  const [uploadingSchool, setUploadingSchool] = useState(false);
  const [serverConfigured, setServerConfigured] = useState(false);
  const [isVerifyingAi, setIsVerifyingAi] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{ success: boolean; message: string; isRateLimit?: boolean } | null>(null);
  const { showAlert } = useModal();

  useEffect(() => {
    fetch('/api/ai/status')
      .then(res => res.json())
      .then(data => {
        if (data?.configured) {
          setServerConfigured(true);
        }
      })
      .catch(() => {});
  }, []);

  const handleVerifyAiConnection = async () => {
    const keyToTest = (school.geminiApiKey || '').trim();
    if (!keyToTest && !serverConfigured) {
      setVerifyResult({
        success: false,
        message: 'Masukkan Gemini API Key terlebih dahulu pada kolom di bawah atau di menu Secrets AI Studio.',
      });
      return;
    }

    setIsVerifyingAi(true);
    setVerifyResult(null);

    try {
      const res = await fetch('/api/ai/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: keyToTest || undefined }),
      });

      const data = await res.json();
      if (data.success) {
        setVerifyResult({
          success: true,
          message: data.message || 'Koneksi Berhasil! Model Gemini aktif dan siap digunakan.',
        });
      } else {
        const isRate = data.isRateLimit || /rate\s*exceeded|429|quota|batas\s*frekuensi|batas\s*kecepatan/i.test(data.error || '');
        setVerifyResult({
          success: false,
          isRateLimit: isRate,
          message: isRate 
            ? 'API Key terhubung ke Google AI, namun batas kecepatan request per menit (15 RPM) sedang penuh. Silakan tunggu 10–15 detik, lalu klik tombol "Coba Uji Ulang Sekarang".'
            : (data.error || 'Koneksi gagal. Periksa kembali API Key Anda.'),
        });
      }
    } catch {
      setVerifyResult({
        success: false,
        message: 'Gagal menghubungi server verifikasi AI. Pastikan server aktif.',
      });
    } finally {
      setIsVerifyingAi(false);
    }
  };

  const academicYears = Array.from({ length: 40 }, (_, i) => {
    const startYear = 2020 + i;
    return `${startYear}/${startYear + 1}`;
  });

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'regency' | 'school') => {
    if (isReadOnly) return;
    const file = event.target.files?.[0];
    const input = event.target; // Simpan referensi untuk reset

    if (file) {
      if (file.size > 500 * 1024) {
        showAlert("Ukuran file melebihi batas maksimum 500 KB.", "error");
        if (input) input.value = '';
        return;
      }
      // Set loading state
      if (type === 'regency') setUploadingRegency(true);
      else setUploadingSchool(true);

      try {
        // Resize ke 150px (Sangat cukup untuk logo kop surat & muat di spreadsheet)
        // Kualitas 0.7
        const resizedBase64 = await compressImage(file, 150, 0.7);
        
        if(type === 'regency') {
           setSchool({ ...school, regencyLogo: resizedBase64 });
        } else {
           setSchool({ ...school, schoolLogo: resizedBase64 });
        }
      } catch (error) {
        console.error("Gagal kompresi logo", error);
        showAlert("Gagal memproses gambar. Cobalah gambar yang lebih kecil atau format JPG.", "error");
      } finally {
        // Reset loading & input
        if (type === 'regency') setUploadingRegency(false);
        else setUploadingSchool(false);
        if (input) input.value = ''; 
      }
    }
  };

  const handleSignatureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) return;
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024) {
        showAlert("Ukuran file melebihi batas maksimum 500 KB.", "error");
        return;
      }
      try {
        const resizedBase64 = await compressImage(file, 300, 0.6);
        setSchool({ ...school, headmasterSignature: resizedBase64 });
      } catch (error) {
        console.error("Gagal upload TTD", error);
        showAlert("Gagal memproses tanda tangan.", "error");
      }
    }
  };

  const handleRemoveSignature = () => {
    if (isReadOnly) return;
    setSchool({ ...school, headmasterSignature: '' });
  };

  return (
    <div className="space-y-6 animate-fade-in">
        <h3 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-2 flex justify-between items-center">
            <span>Informasi Sekolah</span>
            {isReadOnly && (
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full flex items-center font-normal">
                    <Lock size={12} className="mr-1"/> Read Only
                </span>
            )}
        </h3>
        


        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Sekolah</label>
            <input disabled={isReadOnly} type="text" value={school.name} onChange={(e) => setSchool({...school, name: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-500" />
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">NPSN</label>
            <input disabled={isReadOnly} type="text" value={school.npsn} onChange={(e) => setSchool({...school, npsn: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-500" />
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tahun Ajaran</label>
            <select 
            disabled={isReadOnly}
            value={school.year} 
            onChange={(e) => setSchool({...school, year: e.target.value})} 
            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-500"
            >
                <option value="">Pilih Tahun</option>
                {academicYears.map(year => (
                <option key={year} value={year}>{year}</option>
                ))}
            </select>
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
            <select
                disabled={isReadOnly}
                value={school.semester}
                onChange={(e) => setSchool({...school, semester: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-500"
            >
                <option value="1">1 (Ganjil)</option>
                <option value="2">2 (Genap)</option>
            </select>
        </div>
        
        {/* Logo Uploads */}
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <label className="block text-sm font-bold text-gray-700 mb-2">Logo Kabupaten / Dinas</label>
            <div className="flex items-center space-x-3">
                <div className="w-16 h-16 bg-white border border-gray-200 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                    {uploadingRegency ? (
                        <Loader2 className="animate-spin text-indigo-500" size={20} />
                    ) : school.regencyLogo ? (
                        <img src={school.regencyLogo} alt="Logo Kab" className="w-full h-full object-contain p-1" />
                    ) : (
                        <span className="text-[10px] text-gray-400 text-center">Belum ada</span>
                    )}
                </div>
                <div className="flex-1">
                    {!isReadOnly && (
                        <>
                            <input 
                                type="file" 
                                accept="image/*" 
                                onChange={(e) => handleLogoUpload(e, 'regency')} 
                                className="block w-full text-xs text-gray-500 file:mr-2 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200 cursor-pointer" 
                            />
                            <p className="text-[10px] text-gray-400 mt-1">Format: JPG/PNG. Max lebar otomatis diubah ke 150px.</p>
                        </>
                    )}
                    {isReadOnly && <p className="text-xs text-gray-500 italic">Upload dinonaktifkan (Read Only)</p>}
                </div>
            </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <label className="block text-sm font-bold text-gray-700 mb-2">Logo Sekolah</label>
            <div className="flex items-center space-x-3">
                <div className="w-16 h-16 bg-white border border-gray-200 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                    {uploadingSchool ? (
                        <Loader2 className="animate-spin text-indigo-500" size={20} />
                    ) : school.schoolLogo ? (
                        <img src={school.schoolLogo} alt="Logo Sekolah" className="w-full h-full object-contain p-1" />
                    ) : (
                        <span className="text-[10px] text-gray-400 text-center">Belum ada</span>
                    )}
                </div>
                <div className="flex-1">
                    {!isReadOnly && (
                        <>
                            <input 
                                type="file" 
                                accept="image/*" 
                                onChange={(e) => handleLogoUpload(e, 'school')} 
                                className="block w-full text-xs text-gray-500 file:mr-2 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200 cursor-pointer" 
                            />
                            <p className="text-[10px] text-gray-400 mt-1">Format: JPG/PNG. Max lebar otomatis diubah ke 150px.</p>
                        </>
                    )}
                    {isReadOnly && <p className="text-xs text-gray-500 italic">Upload dinonaktifkan (Read Only)</p>}
                </div>
            </div>
        </div>

        <div className="md:col-span-2 border border-gray-100 p-4 rounded-xl bg-gray-50/50">
            <h4 className="text-sm font-bold text-gray-800 mb-3">Alamat Lengkap Sekolah</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Jalan / Detail Alamat</label>
                    <input type="text" disabled={isReadOnly} value={school.jalan || ''} onChange={(e) => setSchool({...school, jalan: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-500" placeholder="Jl. Pendidikan No. 1" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Desa / Kelurahan</label>
                    <input type="text" disabled={isReadOnly} value={school.desa || ''} onChange={(e) => setSchool({...school, desa: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-500" placeholder="Nama Desa/Kelurahan..." />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Kecamatan</label>
                    <input type="text" disabled={isReadOnly} value={school.kecamatan || ''} onChange={(e) => setSchool({...school, kecamatan: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-500" placeholder="Nama Kecamatan..." />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Kabupaten / Kota</label>
                    <input type="text" disabled={isReadOnly} value={school.kabupaten || ''} onChange={(e) => setSchool({...school, kabupaten: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-500" placeholder="Nama Kabupaten/Kota..." />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Kode Pos</label>
                    <input type="text" disabled={isReadOnly} value={school.postalCode || ''} onChange={(e) => setSchool({...school, postalCode: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-500" placeholder="Kode Pos..." />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Email Sekolah</label>
                    <input type="email" disabled={isReadOnly} value={school.email || ''} onChange={(e) => setSchool({...school, email: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-500" placeholder="email@sekolah.sch.id..." />
                </div>
            </div>
        </div>

        {/* --- BRANDING COLOR SETTINGS --- */}
        <div className="md:col-span-2 bg-blue-50/30 p-5 rounded-xl border border-blue-100">
            <h4 className="text-sm font-bold text-blue-800 uppercase mb-3 flex items-center">
                <Palette size={16} className="mr-2"/> Warna Tema Branding Sekolah
            </h4>
            <p className="text-xs text-gray-500 mb-4">
                Pilih warna branding utama sekolah Anda. Warna ini akan diaplikasikan secara dinamis di seluruh dashboard, sidebar, tombol, dan komponen navigasi aplikasi.
            </p>
            <div className="flex flex-wrap gap-2.5 mb-4">
                {[
                    { name: 'Sagara Blue (Default)', hex: '#5AB2FF' },
                    { name: 'Emerald Green', hex: '#10B981' },
                    { name: 'Royal Blue', hex: '#2563EB' },
                    { name: 'Amethyst Purple', hex: '#8B5CF6' },
                    { name: 'Crimson Red', hex: '#EF4444' },
                    { name: 'Amber Gold', hex: '#F59E0B' },
                ].map((color) => (
                    <button
                        key={color.hex}
                        type="button"
                        disabled={isReadOnly}
                        onClick={() => setSchool({ ...school, primaryColor: color.hex })}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                            (school.primaryColor || '#5AB2FF').toUpperCase() === color.hex.toUpperCase()
                                ? 'bg-white border-indigo-500 ring-2 ring-indigo-500/10 text-indigo-950 shadow-sm font-bold'
                                : 'bg-white/80 border-gray-200 hover:border-gray-300 text-gray-600'
                        } disabled:opacity-50`}
                    >
                        <span 
                            className="w-4.5 h-4.5 rounded-full border border-black/10 shrink-0" 
                            style={{ backgroundColor: color.hex }}
                        />
                        <span>{color.name}</span>
                    </button>
                ))}
            </div>

            <div className="flex items-center space-x-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Pilih Warna Kustom</label>
                    <div className="flex items-center space-x-2">
                        <input
                            type="color"
                            disabled={isReadOnly}
                            value={school.primaryColor || '#5AB2FF'}
                            onChange={(e) => setSchool({ ...school, primaryColor: e.target.value })}
                            className="w-10 h-10 rounded-xl border border-gray-200 cursor-pointer overflow-hidden p-0 disabled:opacity-50 bg-transparent"
                        />
                        <input
                            type="text"
                            disabled={isReadOnly}
                            maxLength={7}
                            value={school.primaryColor || '#5AB2FF'}
                            onChange={(e) => {
                                let val = e.target.value;
                                if (val && !val.startsWith('#')) val = '#' + val;
                                setSchool({ ...school, primaryColor: val });
                            }}
                            className="w-24 px-3 py-2 text-xs font-mono font-bold uppercase rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-50 disabled:text-gray-400"
                        />
                    </div>
                </div>
            </div>
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kepala Sekolah</label>
            <input disabled={isReadOnly} type="text" value={school.headmaster} onChange={(e) => setSchool({...school, headmaster: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-500" />
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">NIP Kepala Sekolah</label>
            <input disabled={isReadOnly} type="text" value={school.headmasterNip} onChange={(e) => setSchool({...school, headmasterNip: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-500" />
        </div>
        <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tanda Tangan Kepala Sekolah</label>
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center hover:bg-gray-100 transition-colors">
                {!school.headmasterSignature ? (
                    <label className={`cursor-pointer flex flex-col items-center group ${isReadOnly ? 'cursor-not-allowed' : ''}`}>
                        <div className="p-3 bg-white rounded-full shadow-sm mb-2 group-hover:scale-110 transition-transform">
                            <Upload size={24} className="text-indigo-500"/>
                        </div>
                        <span className="text-sm font-medium text-gray-600 group-hover:text-indigo-600 transition-colors">Upload Tanda Tangan</span>
                        <span className="text-xs text-gray-400 mt-1">Format PNG Transparan (Max 2MB)</span>
                        {!isReadOnly && <input type="file" accept="image/*" onChange={handleSignatureUpload} className="hidden" />}
                    </label>
                ) : (
                    <div className="relative group w-full max-w-xs flex justify-center">
                        <img src={school.headmasterSignature} alt="Signature" className="h-24 object-contain" />
                        {!isReadOnly && (
                            <button 
                                onClick={handleRemoveSignature} 
                                className="absolute -top-2 -right-2 bg-red-100 text-red-600 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-200 shadow-sm"
                                title="Hapus Tanda Tangan"
                            >
                                <Trash2 size={16}/>
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>

        {/* --- NEW: Running Text Settings --- */}
        <div className="md:col-span-2 bg-indigo-50/50 p-5 rounded-xl border border-indigo-100">
            <h4 className="text-sm font-bold text-indigo-800 uppercase mb-4 flex items-center">
                <Megaphone size={16} className="mr-2"/> Pengaturan Teks Berjalan (Dashboard)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Isi Teks</label>
                    <textarea 
                        disabled={isReadOnly}
                        rows={2} 
                        value={school.runningText || ''} 
                        onChange={(e) => setSchool({...school, runningText: e.target.value})} 
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none resize-none disabled:bg-gray-50"
                        placeholder="Contoh: Selamat Datang di Aplikasi SAGARA..."
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Kecepatan (Durasi: {school.runningTextSpeed || 20} detik)
                    </label>
                    <input 
                        disabled={isReadOnly}
                        type="range" 
                        min="10" 
                        max="60" 
                        step="5"
                        value={school.runningTextSpeed || 20} 
                        onChange={(e) => setSchool({...school, runningTextSpeed: Number(e.target.value)})} 
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                        <span>Cepat (10s)</span>
                        <span>Lambat (60s)</span>
                    </div>
                </div>
            </div>
        </div>

        {/* --- NEW: Graduation Announcement Settings --- */}
        <div className="md:col-span-2 bg-emerald-50/50 p-5 rounded-xl border border-emerald-100 mt-0">
            <h4 className="text-sm font-bold text-emerald-800 uppercase mb-4 flex items-center">
                <Megaphone size={16} className="mr-2"/> Pengumuman Kelulusan Kelas 6
            </h4>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                         <p className="text-sm text-gray-700 font-medium">Buka Akses Pengumuman Kelulusan</p>
                         <p className="text-xs text-gray-500 mt-1">Jika aktif, siswa kelas 6 dapat melihat menu Kelulusan di portal mereka.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          disabled={isReadOnly}
                          checked={!!school.isGraduationAnnounced}
                          onChange={(e) => setSchool({...school, isGraduationAnnounced: e.target.checked})}
                      />
                      <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
                    </label>
                </div>
                
                <div className="border-t border-emerald-100/70 pt-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Set Tanggal & Waktu Hitung Mundur Rilis (Opsional)</label>
                    <p className="text-xs text-gray-500 mb-2">Jika diset, siswa akan melihat halaman hitung mundur (countdown) sampai waktu tersebut tiba. Kosongkan jika ingin langsung rilis.</p>
                    <input 
                        disabled={isReadOnly}
                        type="datetime-local" 
                        value={school.graduationCountdownTime || ''} 
                        onChange={(e) => setSchool({...school, graduationCountdownTime: e.target.value})}
                        className="w-full max-w-xs px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-500 text-sm"
                    />
                </div>
            </div>
        </div>

        {/* --- NEW: Login Poster Settings --- */}
        <div className="md:col-span-2 bg-purple-50/50 p-5 rounded-xl border border-purple-100 mt-0">
            <h4 className="text-sm font-bold text-purple-800 uppercase mb-4 flex items-center">
                <Megaphone size={16} className="mr-2"/> Tampilan Poster Halaman Login
            </h4>
            <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Link Gambar Poster (Opsional)</label>
                 <input 
                    disabled={isReadOnly} 
                    type="url" 
                    value={school.loginPosterUrl || ''} 
                    onChange={(e) => setSchool({...school, loginPosterUrl: e.target.value})} 
                    placeholder="https://..." 
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-500" 
                 />
                 <p className="text-xs text-gray-500 mt-2">
                     Jika diisi, poster akan muncul sebagai pop-up saat user pertama kali membuka halaman login. Kosongkan untuk menonaktifkan fitur ini.
                 </p>
                 {school.loginPosterUrl && (
                     <div className="mt-4 border border-gray-200 rounded-lg p-2 max-w-sm bg-white shadow-sm">
                         <span className="text-xs text-gray-400 block mb-2 font-medium">Preview Poster:</span>
                         <img src={school.loginPosterUrl} alt="Preview Login Poster" className="w-full h-auto rounded object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                     </div>
                 )}
            </div>
        </div>

        {/* --- NEW: Student Disaster Mitigation Settings --- */}
        <div className="md:col-span-2 bg-amber-50/50 p-5 rounded-xl border border-amber-100 mt-0">
            <h4 className="text-sm font-bold text-amber-800 uppercase mb-4 flex items-center">
                <AlertTriangle size={16} className="mr-2"/> Akses Mitigasi Bencana Siswa
            </h4>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                         <p className="text-sm text-gray-700 font-medium">Buka Akses Pengiriman Tanda Bahaya untuk Siswa</p>
                         <p className="text-xs text-gray-500 mt-1">
                             Jika aktif, siswa dapat mengakses menu Mitigasi Bencana dan mengirimkan tanda bahaya jika terjadi keadaan darurat di sekolah.
                         </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          disabled={isReadOnly}
                          checked={!!school.studentMitigationAccess}
                          onChange={(e) => setSchool({...school, studentMitigationAccess: e.target.checked})}
                      />
                      <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500 peer-focus:ring-2 peer-focus:ring-amber-300 ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
                    </label>
                </div>
            </div>
        </div>

        {/* --- Gemini API Settings --- */}
        <div className="md:col-span-2 bg-slate-50/50 p-5 rounded-xl border border-slate-200 mt-0">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-slate-800 uppercase flex items-center">
                  <BrainCircuit size={16} className="mr-2 text-indigo-600"/> Konfigurasi AI (Gemini)
              </h4>
              {(() => {
                const hasLocalKey = !!(school.geminiApiKey && school.geminiApiKey.trim().length > 0);
                const isConnected = hasLocalKey || serverConfigured;
                return (
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                    isConnected 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                    {isConnected ? 'Terkoneksi (Aktif)' : 'Belum Dikonfigurasi'}
                  </span>
                );
              })()}
            </div>

            <div className="space-y-4">
                <div>
                     <div className="flex items-center justify-between mb-1">
                       <label className="block text-sm font-medium text-gray-700">
                         Gemini API Key
                       </label>
                       <a 
                         href="https://aistudio.google.com/apikey" 
                         target="_blank" 
                         rel="noopener noreferrer" 
                         className="text-xs text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1 hover:underline"
                       >
                         Dapatkan API Key di Google AI Studio <ExternalLink size={12} />
                       </a>
                     </div>
                     <div className="flex flex-col sm:flex-row gap-2">
                       <input 
                          disabled={isReadOnly} 
                          type="password" 
                          value={school.geminiApiKey || ''} 
                          onChange={(e) => {
                            setSchool({...school, geminiApiKey: e.target.value});
                            setVerifyResult(null);
                          }} 
                          placeholder={serverConfigured ? "Menggunakan API Key dari Secrets (atau tempel di sini untuk override)..." : "Tempel Gemini API Key di sini (AIzaSy... / AQ...)"} 
                          className="flex-1 px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-500 text-sm font-mono" 
                       />
                       <button
                         type="button"
                         onClick={handleVerifyAiConnection}
                         disabled={isVerifyingAi}
                         className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50 whitespace-nowrap shadow-xs"
                       >
                         {isVerifyingAi ? (
                           <>
                             <Loader2 size={14} className="animate-spin text-indigo-600" />
                             <span>Menguji...</span>
                           </>
                         ) : (
                           <>
                             <BrainCircuit size={14} className="text-indigo-600" />
                             <span>Uji Koneksi AI</span>
                           </>
                         )}
                       </button>
                     </div>
                </div>

                {verifyResult && (
                  <div className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                    verifyResult.success 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                      : verifyResult.isRateLimit
                        ? 'bg-amber-50 border-amber-300 text-amber-900'
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}>
                    {verifyResult.success ? (
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                    ) : verifyResult.isRateLimit ? (
                      <Clock size={16} className="text-amber-600 shrink-0 mt-0.5 animate-pulse" />
                    ) : (
                      <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <p className="font-semibold">
                        {verifyResult.success 
                          ? 'Koneksi AI Terverifikasi' 
                          : verifyResult.isRateLimit
                            ? 'API Key Terhubung (Namun Batas Kuota Per Menit Tercapai: 429 Rate Limit)'
                            : 'Gagal Menghubungkan ke Gemini AI'}
                      </p>
                      <p className="text-[11px] leading-relaxed opacity-90">
                        {verifyResult.message}
                      </p>
                      {!verifyResult.success && (
                        <div className="pt-1 text-[11px] flex flex-wrap items-center gap-3">
                          {verifyResult.isRateLimit || verifyResult.message.includes('503') || verifyResult.message.includes('429') || verifyResult.message.includes('trafik') || verifyResult.message.includes('kuota') ? (
                            <button
                              type="button"
                              onClick={handleVerifyAiConnection}
                              className={`inline-flex items-center gap-1 font-bold underline hover:opacity-80 cursor-pointer ${
                                verifyResult.isRateLimit ? 'text-amber-950' : 'text-rose-900'
                              }`}
                            >
                              🔄 Coba Uji Ulang Sekarang
                            </button>
                          ) : (
                            <a 
                              href="https://aistudio.google.com/apikey" 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="inline-flex items-center gap-1 text-rose-900 font-bold underline hover:text-rose-950"
                            >
                              👉 Buat API Key baru di Google AI Studio (Gratis)
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
            </div>
        </div>

        {/* --- NEW: Text to Speech (TTS) Settings --- */}
        <div className="md:col-span-2 bg-indigo-50/50 p-5 rounded-xl border border-indigo-100 mt-0">
            <h4 className="text-sm font-bold text-indigo-800 uppercase mb-4 flex items-center">
                <Volume2 size={16} className="mr-2"/> Aksesibilitas Suara (TTS)
            </h4>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                         <p className="text-sm text-gray-700 font-medium">Tampilkan Tombol Asisten Suara (TTS)</p>
                         <p className="text-xs text-gray-500 mt-1">
                             Aktifkan untuk memunculkan tombol aksesibilitas asisten suara (Text-to-Speech) di seluruh halaman aplikasi untuk membantu pembacaan teks secara otomatis.
                         </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          disabled={isReadOnly}
                          checked={school.ttsEnabled !== false}
                          onChange={(e) => setSchool({...school, ttsEnabled: e.target.checked})}
                      />
                      <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 peer-focus:ring-2 peer-focus:ring-indigo-300 ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
                    </label>
                </div>
            </div>
        </div>

        </div>
        <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
            {!isReadOnly ? (
                <button 
                    onClick={onSave}
                    disabled={isSaving}
                    className="flex items-center space-x-2 bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    <span>{isSaving ? 'Menyimpan...' : 'Simpan Data Sekolah'}</span>
                </button>
            ) : (
                <div className="flex items-center text-amber-600 bg-amber-50 px-4 py-2 rounded-lg text-sm border border-amber-200">
                    <Lock size={16} className="mr-2"/>
                    <span>Hanya Admin yang dapat mengubah data sekolah</span>
                </div>
            )}
        </div>
    </div>
  );
};

export default SchoolDataTab;
