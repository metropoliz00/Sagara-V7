import React from 'react';
import { motion } from 'motion/react';
import { Laptop, ArrowLeft, FileText, CheckCircle2, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdministrasiOnline() {
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
            <div className="w-20 h-20 rounded-3xl bg-blue-50 flex items-center justify-center text-main-blue shrink-0">
              <Laptop className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-heading font-black text-soft-black mb-4">Administrasi Online</h1>
              <p className="text-gray-500 text-lg leading-relaxed">
                Transformasi digital untuk manajemen administrasi yang lebih cepat, transparan, dan efisien di lingkungan Gugus 03 Melati.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-soft-black flex items-center gap-3">
                <FileText className="w-6 h-6 text-main-blue" /> Fitur Unggulan
              </h3>
              <ul className="space-y-4">
                {[
                  "Pengajuan Surat Keterangan Online",
                  "Digitalisasi Dokumen Resmi",
                  "Pengarsipan Terpusat",
                  "Tracking Status Pengajuan"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <CheckCircle2 className="w-5 h-5 text-leaf-green" />
                    <span className="text-gray-600 font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-main-blue/5 rounded-[2rem] p-8 border border-main-blue/10">
              <h3 className="text-xl font-bold text-soft-black mb-6 flex items-center gap-3">
                <Clock className="w-6 h-6 text-main-blue" /> Jam Operasional Layanan
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-main-blue/10">
                  <span className="text-gray-600">Senin - Kamis</span>
                  <span className="font-bold text-soft-black">08:00 - 15:00 WIB</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-main-blue/10">
                  <span className="text-gray-600">Jumat</span>
                  <span className="font-bold text-soft-black">08:00 - 11:30 WIB</span>
                </div>
                <div className="flex justify-between items-center italic text-sm text-main-blue">
                  <span>*Sabtu & Minggu Libur</span>
                </div>
              </div>
              
              <button className="w-full mt-8 bg-main-blue text-white py-4 rounded-2xl font-bold shadow-lg shadow-main-blue/20 hover:scale-[1.02] transition-all">
                Mulai Pengajuan
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
