import React from 'react';
import { motion } from 'motion/react';
import { Activity, ArrowLeft, BarChart3, PieChart, TrendingUp, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MonitoringPembelajaran() {
  return (
    <div className="pt-24 min-h-screen bg-light-gray pb-20">
      <div className="container mx-auto px-6 max-w-6xl">
        <Link to="/#services" className="inline-flex items-center gap-2 text-main-blue font-bold mb-8 hover:gap-3 transition-all">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Layanan
        </Link>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl shadow-blue-500/5 border border-main-orange/20"
        >
          <div className="flex flex-col md:flex-row gap-8 items-start mb-12">
            <div className="w-20 h-20 rounded-3xl bg-red-50 flex items-center justify-center text-red-500 shrink-0">
              <Activity className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-heading font-black text-soft-black mb-4">Monitoring Pembelajaran</h1>
              <p className="text-gray-500 text-lg leading-relaxed">
                Panel pemantauan kualitas pendidikan dan progress belajar antar sekolah anggota Gugus 03 Melati untuk memastikan standar mutu yang setara.
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 mb-12">
            <div className="lg:col-span-2 space-y-6">
               <div className="p-8 rounded-[2rem] bg-gradient-to-br from-soft-black to-gray-800 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-main-blue/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                  <div className="relative z-10">
                     <h3 className="text-2xl font-heading font-bold mb-6 flex items-center gap-3">
                        <BarChart3 className="w-6 h-6 text-leaf-green" /> Overview Kualitas Semester
                     </h3>
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[
                           { label: 'Rata-rata Nilai', value: '84.2' },
                           { label: 'Ketuntasan', value: '92%' },
                           { label: 'Partisipasi', value: '96.5%' },
                           { label: 'Sekolah Aktif', value: '4/4' },
                        ].map((stat, i) => (
                           <div key={i}>
                              <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-1">{stat.label}</p>
                              <p className="text-2xl font-black text-leaf-green">{stat.value}</p>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>

               <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-6 bg-white border border-gray-100 rounded-3xl shadow-sm">
                     <h4 className="font-bold text-soft-black mb-4 flex items-center gap-2">
                        <PieChart className="w-5 h-5 text-main-blue" /> Sebaran Kompetensi
                     </h4>
                     <div className="space-y-3">
                        {['Literasi', 'Numerasi', 'Sains', 'Agama'].map((sub, i) => (
                           <div key={sub} className="space-y-1">
                              <div className="flex justify-between text-xs font-bold">
                                 <span className="text-gray-500">{sub}</span>
                                 <span className="text-soft-black">{80 + (i * 4)}%</span>
                              </div>
                              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                 <div className="h-full bg-main-blue rounded-full" style={{ width: `${80 + (i * 4)}%` }} />
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>

                  <div className="p-6 bg-white border border-gray-100 rounded-3xl shadow-sm">
                     <h4 className="font-bold text-soft-black mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-leaf-green" /> Tren Akademik
                     </h4>
                     <div className="h-32 flex items-end gap-2 px-2">
                        {[40, 65, 55, 80, 70, 90].map((h, i) => (
                           <div key={i} className="flex-1 bg-leaf-green/20 rounded-t-lg relative group transition-all hover:bg-leaf-green">
                              <div className="absolute inset-x-0 bottom-0 bg-leaf-green rounded-t-lg transition-all" style={{ height: `${h}%` }} />
                              <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-leaf-green opacity-0 group-hover:opacity-100 transition-opacity">
                                 {h}%
                              </div>
                           </div>
                        ))}
                     </div>
                     <div className="flex justify-between mt-2 text-[10px] font-bold text-gray-400">
                        <span>JAN</span><span>FEB</span><span>MAR</span><span>APR</span><span>MEI</span><span>JUN</span>
                     </div>
                  </div>
               </div>
            </div>

            <div className="space-y-6">
               <div className="p-8 rounded-[2rem] bg-gray-50 border border-gray-200">
                  <h3 className="text-xl font-bold text-soft-black mb-4">Mulai Diagnostik</h3>
                  <p className="text-sm text-gray-500 mb-6">Pilih sekolah untuk melihat laporan detail hasil observasi dan evaluasi pembelajaran.</p>
                  <div className="space-y-3">
                     {[
                        "UPT SDN Mentoso",
                        "UPT SDN Remen 1",
                        "UPT SDN Remen 2",
                        "UPT SDN Tasikharjo"
                     ].map(school => (
                        <button key={school} className="w-full text-left p-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold text-soft-black hover:border-main-blue hover:text-main-blue transition-all flex items-center justify-between">
                           {school}
                           <ArrowLeft className="w-4 h-4 rotate-180" />
                        </button>
                     ))}
                  </div>
               </div>
               
               <div className="p-6 rounded-3xl bg-blue-50 text-main-blue border border-blue-100">
                  <div className="flex items-center gap-3 mb-2">
                     <Search className="w-5 h-5" />
                     <h4 className="font-bold">Cari Laporan Spesifik?</h4>
                  </div>
                  <p className="text-xs leading-relaxed opacity-80">Gunakan filter pencarian di Dasbor Internal untuk akses data yang lebih detail dan komprehensif.</p>
               </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
