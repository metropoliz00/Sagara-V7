import React from 'react';
import { motion } from 'motion/react';
import { CalendarCheck, ArrowLeft, CheckCircle2, Users, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AbsensiKegiatan() {
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
            <div className="w-20 h-20 rounded-3xl bg-green-50 flex items-center justify-center text-leaf-green shrink-0">
              <CalendarCheck className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-heading font-black text-soft-black mb-4">Absensi Kegiatan</h1>
              <p className="text-gray-500 text-lg leading-relaxed">
                Sistem pencatatan kehadiran digital untuk setiap agenda rutin, rapat koordinasi, dan workshop di lingkungan Gugus 03 Melati.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              { label: 'Total Kehadiran', value: '98%', icon: Users, color: 'text-main-blue' },
              { label: 'Agenda Selesai', value: '24', icon: CheckCircle2, color: 'text-leaf-green' },
              { label: 'Lokasi Aktif', value: '4', icon: MapPin, color: 'text-accent-orange' },
            ].map((stat, i) => (
              <div key={i} className="bg-gray-50 p-6 rounded-2xl border border-gray-100 text-center">
                <stat.icon className={`w-8 h-8 ${stat.color} mx-auto mb-3`} />
                <p className="text-xs font-bold text-gray-400 uppercase mb-1">{stat.label}</p>
                <p className="text-2xl font-black text-soft-black">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="space-y-6">
            <h3 className="text-xl font-bold text-soft-black">Cara Menggunakan Absensi Digital</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                { step: "1", title: "Scan QR Code", desc: "Scan kode QR yang tersedia di lokasi kegiatan menggunakan smartphone." },
                { step: "2", title: "Isi Identitas", desc: "Masukkan NIP/Nama dan asal sekolah pada form yang muncul." },
                { step: "3", title: "Submit Lokasi", desc: "Pastikan GPS aktif untuk verifikasi kehadiran di lokasi acara." },
                { step: "4", title: "Selesai", desc: "Data kehadiran akan terekam secara realtime di sistem gugus." }
              ].map((step, i) => (
                <div key={i} className="flex gap-4 p-6 bg-white border border-gray-100 rounded-3xl group hover:border-leaf-green transition-all">
                  <span className="w-10 h-10 rounded-full bg-leaf-green/10 text-leaf-green flex items-center justify-center font-black shrink-0">{step.step}</span>
                  <div>
                    <h4 className="font-bold text-soft-black mb-1 group-hover:text-leaf-green transition-colors">{step.title}</h4>
                    <p className="text-sm text-gray-500">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <button className="w-full mt-8 bg-leaf-green text-white py-4 rounded-2xl font-bold shadow-lg shadow-leaf-green/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
              <CalendarCheck className="w-5 h-5" /> Buka Panel Absensi
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
