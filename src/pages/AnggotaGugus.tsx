import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Users, X, Printer } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AnggotaGugusPage() {
  const [gurus, setGurus] = useState<any[]>([]);
  const [groupedGurus, setGroupedGurus] = useState<Record<string, any[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGuru, setSelectedGuru] = useState<any>(null);
  const [schools, setSchools] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [gurusRes, schoolsRes] = await Promise.all([
          supabase.from('user_profiles').select('*').eq('role', 'guru'),
          supabase.from('schools').select('name, logo_url')
        ]);
        
        if (gurusRes.error) throw gurusRes.error;
        if (schoolsRes.error) throw schoolsRes.error;
        
        setSchools(schoolsRes.data || []);
        
        const sortedData = (gurusRes.data || []).sort((a, b) => {
          // ... (keep same sorting logic as before) ...
          const schoolA = (a.sekolah || "").toLowerCase();
          const schoolB = (b.sekolah || "").toLowerCase();
          if (schoolA < schoolB) return -1;
          if (schoolA > schoolB) return 1;
          
          const normalizeJab = (val: string) => {
            let j = val.toLowerCase().trim();
            if (j.includes("kelas 1")) j = j.replace("kelas 1", "kelas i");
            if (j.includes("kelas 2")) j = j.replace("kelas 2", "kelas ii");
            if (j.includes("kelas 3")) j = j.replace("kelas 3", "kelas iii");
            if (j.includes("kelas 4")) j = j.replace("kelas 4", "kelas iv");
            if (j.includes("kelas 5")) j = j.replace("kelas 5", "kelas v");
            if (j.includes("kelas 6")) j = j.replace("kelas 6", "kelas vi");
            return j;
          };

          const jabA = normalizeJab(a.jabatan || "");
          const jabB = normalizeJab(b.jabatan || "");
          const priority: Record<string, number> = {
            "kepala sekolah": 1,
            "guru kelas i": 2,
            "guru kelas ii": 3,
            "guru kelas iii": 4,
            "guru kelas iv": 5,
            "guru kelas v": 6,
            "guru kelas vi": 7,
            "guru pjok": 8,
            "guru paibp": 9,
            "guru pai": 9
          };

          const pA = priority[jabA] || 99;
          const pB = priority[jabB] || 99;
          if (pA !== pB) return pA - pB;
          return (a.nama || "").localeCompare(b.nama || "");
        });

        setGurus(sortedData);

        // Grouping
        const grouped: Record<string, any[]> = {};
        sortedData.forEach(guru => {
          const school = guru.sekolah || "Sekolah Lainnya";
          if (!grouped[school]) grouped[school] = [];
          grouped[school].push(guru);
        });
        setGroupedGurus(grouped);

      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-20 px-6">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-12 text-center">
            <h1 className="text-3xl font-heading font-extrabold text-soft-black">Anggota Gugus</h1>
            <p className="text-gray-600 mt-2">Daftar tenaga pendidik profesional anggota Gugus 03 Melati.</p>
        </div>

        {isLoading ? (
          <div className="text-center p-10 text-gray-400">Loading...</div>
        ) : Object.keys(groupedGurus).length === 0 ? (
          <div className="text-center p-10 text-gray-400">Belum ada data anggota</div>
        ) : (
          Object.entries(groupedGurus).map(([schoolName, members]) => {
            const schoolData = schools.find(s => s.name && s.name.trim().toLowerCase() === schoolName.trim().toLowerCase());
            const logoUrl = schoolData?.logo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(schoolName)}&background=0284c7&color=fff&size=128&rounded=true`;
            
            return (
              <div key={schoolName} className="mb-12 bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm relative overflow-hidden ring-1 ring-black/5">
                <div className="flex items-center justify-between mb-8 group cursor-pointer">
                  <h2 className="text-xl font-bold text-main-blue group-hover:text-leaf-green transition-colors">{schoolName}</h2>
                  <img src={logoUrl} alt={schoolName} className="w-12 h-12 rounded-full border-2 border-white shadow-md object-contain group-hover:scale-105 transition-transform" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {(members as any[]).map((g, i) => (
                    <motion.div
                      key={i}
                      whileHover={{ y: -5 }}
                      onClick={() => setSelectedGuru(g)}
                      className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100 hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer transition-all text-center flex flex-col items-center"
                    >
                      <div className="w-20 h-24 rounded-lg overflow-hidden mb-3 shadow-sm bg-gray-200">
                        <img 
                          src={g.foto || g.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(g.nama || 'G')}&background=random`} 
                          alt={g.nama} 
                          className="w-full h-full object-cover object-top" 
                        />
                      </div>
                      <h3 className="font-bold text-soft-black text-sm mb-1 line-clamp-1">{g.nama}</h3>
                      <p className="text-[10px] text-gray-400 font-mono mb-2">{g.nip || '-'}</p>
                      <div className="text-[10px] bg-main-blue/10 text-main-blue font-medium rounded-lg px-2 py-1 inline-block truncate w-full">{g.jabatan || '-'}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      <AnimatePresence>
        {selectedGuru && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 sm:p-6"
            onClick={() => setSelectedGuru(null)}
          >
            <style>{`
              @media print {
                @page {
                  size: A4 portrait;
                  margin: 5mm 15mm 5mm 15mm;
                }
                html, body {
                  margin: 0 !important;
                  padding: 0 !important;
                  height: 100vh !important;
                  overflow: hidden !important;
                  max-height: 100vh !important;
                  background: white !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                /* Hide everything in the page outer shell */
                body * {
                  visibility: hidden !important;
                }
                /* Show print target card */
                #print-card-gugus, #print-card-gugus * {
                  visibility: visible !important;
                }
                #print-card-gugus {
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  max-width: 100% !important;
                  box-shadow: none !important;
                  border: none !important;
                  padding: 1.5rem !important;
                  margin: 0 !important;
                  background: white !important;
                  color: black !important;
                }
                .no-print {
                  display: none !important;
                }
              }
            `}</style>
            
            <motion.div
              id="print-card-gugus"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2.5rem] p-6 sm:p-10 max-w-2xl w-full relative shadow-[0_20px_50px_rgba(31,143,229,0.25)] border-4 border-main-blue text-soft-black overflow-hidden"
              onClick={e => e.stopPropagation()}
              style={{ contentVisibility: 'auto' }}
            >
              {/* Glowing Background Spots - Only visible on screen */}
              <div aria-hidden="true" className="absolute top-0 right-0 -mr-12 -mt-12 w-80 h-80 bg-gradient-to-br from-main-blue to-emerald-300 opacity-20 blur-[80px] rounded-full pointer-events-none no-print"></div>
              <div aria-hidden="true" className="absolute bottom-0 left-0 -ml-12 -mb-12 w-64 h-64 bg-gradient-to-tr from-amber-300 to-main-blue opacity-15 blur-[60px] rounded-full pointer-events-none no-print"></div>

              {/* Header Action Row */}
              <div className="absolute top-6 right-6 flex items-center gap-2.5 no-print z-10">
                <button 
                  onClick={() => window.print()} 
                  title="Cetak Identitas"
                  className="text-main-blue hover:text-white hover:scale-105 active:scale-95 bg-blue-50 hover:bg-main-blue hover:border-main-blue border border-blue-200 p-2.5 rounded-xl transition-all flex items-center justify-center cursor-pointer shadow-md shadow-blue-100"
                >
                  <Printer size={18} />
                </button>
                <button 
                  onClick={() => setSelectedGuru(null)} 
                  title="Tutup"
                  className="text-gray-400 hover:text-main-blue hover:scale-105 active:scale-95 bg-gray-50 hover:bg-blue-50 border border-gray-100 hover:border-blue-200 p-2.5 rounded-xl transition-all flex items-center justify-center cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* KOP - Only visible in print */}
              <div id="print-kop-surat" className="hidden print:flex items-center justify-between border-b-4 border-double border-black pb-4 mb-6 mt-0">
                <img 
                  src="https://www.image2url.com/r2/default/images/1778851343355-1a6a088b-6728-48ec-b530-6f16d372b2ee.png" 
                  className="w-14 h-14 sm:w-20 sm:h-20 object-contain shrink-0" 
                  alt="Logo Kemendikdasmen" 
                />
                <div className="text-center flex-1 px-2 sm:px-4">
                  <h1 className="text-xs sm:text-base md:text-lg font-bold font-serif leading-tight">KELOMPOK KERJA GURU ( KKG )</h1>
                  <h2 className="text-sm sm:text-lg md:text-xl font-black font-serif leading-tight">GUGUS 03 “MELATI”</h2>
                  <p className="text-[9px] sm:text-[11px] md:text-xs font-bold font-serif text-gray-700">KECAMATAN JENU KABUPATEN TUBAN</p>
                </div>
                <img 
                  src="https://www.image2url.com/r2/default/images/1778156189287-e4930eb4-3c36-4ace-8420-ca8908132e66.png" 
                  className="w-14 h-14 sm:w-20 sm:h-20 object-contain shrink-0" 
                  alt="Logo KKG" 
                />
              </div>

              {/* Title Header */}
              <div className="text-center pb-3 mb-6 relative">
                <h2 className="text-base sm:text-lg font-extrabold text-main-blue print:text-black tracking-wider uppercase underline underline-offset-8 decoration-main-blue print:decoration-black decoration-2">
                  IDENTITAS ANGGOTA GUGUS
                </h2>
                <p className="text-[10px] sm:text-xs text-main-blue print:text-gray-500 uppercase tracking-widest mt-2 font-bold no-print">
                  GUGUS 03 "MELATI" <span className="text-amber-500 font-black">•</span> KECAMATAN JENU
                </p>
                <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-widest mt-2 font-bold hidden print:block">Kecamatan Jenu</p>
              </div>

              {/* Horizontal Layout (Photo Left, Column Right) */}
              <div className="flex flex-col sm:flex-row print:flex-row gap-6 sm:gap-10 items-center sm:items-start print:items-start pt-2">
                
                {/* Photo Left Side */}
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-32 h-44 sm:w-36 sm:h-48 rounded-2xl p-[3px] bg-gradient-to-tr from-main-blue via-emerald-400 to-amber-400 shadow-[0_10px_30px_rgba(31,143,229,0.25)] print:shadow-none print:p-0 print:border-2 print:border-black overflow-hidden bg-white">
                    <img 
                      src={selectedGuru.foto || selectedGuru.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedGuru.nama || 'G')}&background=1F8FE5&color=fff&size=200`} 
                      alt={selectedGuru.nama} 
                      className="w-full h-full object-cover object-top rounded-[13px] print:object-cover" 
                    />
                  </div>
                </div>

                {/* Data Column Right Side */}
                <div className="flex-1 w-full space-y-4 text-left font-sans text-xs sm:text-sm">
                  <div className="grid grid-cols-[120px_8px_1fr] items-baseline border-b border-gray-100 print:border-black pb-2">
                    <span className="font-bold text-main-blue print:text-gray-500 uppercase tracking-wider text-[10px] sm:text-xs">Nama Lengkap</span>
                    <span className="text-main-blue/60 print:text-black font-bold">:</span>
                    <span className="font-extrabold text-soft-black text-sm break-words pl-1">{selectedGuru.nama || '-'}</span>
                  </div>
                  
                  <div className="grid grid-cols-[120px_8px_1fr] items-baseline border-b border-gray-100 print:border-black pb-2">
                    <span className="font-bold text-main-blue print:text-gray-500 uppercase tracking-wider text-[10px] sm:text-xs">NIP</span>
                    <span className="text-main-blue/60 print:text-black font-bold">:</span>
                    <span className="font-mono text-gray-800 font-semibold break-all pl-1">{selectedGuru.nip || '-'}</span>
                  </div>

                  <div className="grid grid-cols-[120px_8px_1fr] items-baseline border-b border-gray-100 print:border-black pb-2">
                    <span className="font-bold text-main-blue print:text-gray-500 uppercase tracking-wider text-[10px] sm:text-xs">Pangkat/Gol</span>
                    <span className="text-main-blue/60 print:text-black font-bold">:</span>
                    <span className="text-gray-800 font-bold pl-1">{selectedGuru.pangkat || '-'}</span>
                  </div>

                  <div className="grid grid-cols-[120px_8px_1fr] items-baseline border-b border-gray-100 print:border-black pb-2">
                    <span className="font-bold text-main-blue print:text-gray-500 uppercase tracking-wider text-[10px] sm:text-xs">Jabatan</span>
                    <span className="text-main-blue/60 print:text-black font-bold">:</span>
                    <span className="text-main-blue font-bold pl-1">{selectedGuru.jabatan || '-'}</span>
                  </div>

                  <div className="grid grid-cols-[120px_8px_1fr] items-baseline border-b border-gray-100 print:border-black pb-2">
                    <span className="font-bold text-main-blue print:text-gray-500 uppercase tracking-wider text-[10px] sm:text-xs">Kepegawaian</span>
                    <span className="text-main-blue/60 print:text-black font-bold">:</span>
                    <span className="text-gray-700 font-medium pl-1">{selectedGuru.kepegawaian || '-'}</span>
                  </div>

                  <div className="grid grid-cols-[120px_8px_1fr] items-baseline">
                    <span className="font-bold text-main-blue print:text-gray-500 uppercase tracking-wider text-[10px] sm:text-xs">Sekolah</span>
                    <span className="text-main-blue/60 print:text-black font-bold">:</span>
                    <span className="text-soft-black font-extrabold pl-1">{selectedGuru.sekolah || '-'}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
