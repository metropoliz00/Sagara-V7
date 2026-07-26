import React from 'react';
import { motion } from 'motion/react';
import { FolderUp, ArrowLeft, Cloud, ShieldCheck, FileType, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function UploadBerkas() {
  return (
    <div className="pt-24 min-h-screen bg-light-gray pb-20">
      <div className="container mx-auto px-6 max-w-5xl">
        <Link to="/#services" className="inline-flex items-center gap-2 text-main-blue font-bold mb-8 hover:gap-3 transition-all">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Layanan
        </Link>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl shadow-blue-500/5 border border-main-orange/20"
        >
          <div className="flex flex-col md:flex-row gap-8 items-start mb-12">
            <div className="w-20 h-20 rounded-3xl bg-orange-50 flex items-center justify-center text-accent-orange shrink-0">
              <FolderUp className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-heading font-black text-soft-black mb-4">Pusat Upload Berkas</h1>
              <p className="text-gray-500 text-lg leading-relaxed">
                Repositori digital untuk mengunggah dan menyimpan dokumen administrasi guru, perangkat ajar, serta instrumen pelaporan sekolah.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="p-8 rounded-[2rem] border border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center text-center group cursor-pointer hover:bg-white hover:border-accent-orange transition-all">
               <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center text-accent-orange mb-4 group-hover:scale-110 transition-transform">
                  <Cloud className="w-8 h-8" />
               </div>
               <h3 className="text-xl font-bold text-soft-black mb-2">Pilih File untuk Upload</h3>
               <p className="text-sm text-gray-500 mb-6">Drag & drop file Anda di sini, atau klik untuk memilih file</p>
               <input type="file" className="hidden" id="file-upload" />
               <label htmlFor="file-upload" className="px-8 py-3 bg-accent-orange text-white rounded-xl font-bold cursor-pointer shadow-lg shadow-orange-500/20">
                 Unggah Sekarang
               </label>
               <p className="mt-4 text-[10px] text-gray-400 uppercase tracking-widest font-bold">Max size: 50MB per file</p>
            </div>

            <div className="space-y-6">
               <div className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-main-blue">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-soft-black text-sm">Keamanan Terjamin</h4>
                    <p className="text-xs text-gray-500">Data Dienkripsi & Hanya Dapat Diakses Pihak Berwenang</p>
                  </div>
               </div>
               <div className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                  <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-leaf-green">
                    <FileType className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-soft-black text-sm">Support Berbagai Format</h4>
                    <p className="text-xs text-gray-500">PDF, DOCX, XLSX, JPG, PNG, MP4</p>
                  </div>
               </div>
               <div className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                  <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-accent-orange">
                    <Search className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-soft-black text-sm">Pencarian Mudah</h4>
                    <p className="text-xs text-gray-500">Indeksasi Berkas Berdasarkan Kategori & Tanggal</p>
                  </div>
               </div>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-100">
             <h3 className="text-xl font-bold text-soft-black mb-6">Kategori Dokumen</h3>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['Perangkat Ajar', 'Dokumentasi', 'Laporan Keuangan', 'Data Siswa'].map(cat => (
                  <button key={cat} className="p-4 rounded-xl border border-gray-100 bg-gray-50 text-xs font-bold text-gray-600 hover:bg-main-blue hover:text-white hover:border-main-blue transition-all">
                    {cat}
                  </button>
                ))}
             </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
