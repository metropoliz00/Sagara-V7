import React from 'react';
import { motion } from 'motion/react';
import { MonitorPlay, ArrowLeft, PlayCircle, BookOpen, GraduationCap, Award } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ELearning() {
  return (
    <div className="pt-24 min-h-screen bg-light-gray pb-20">
      <div className="container mx-auto px-6 max-w-6xl">
        <Link to="/#services" className="inline-flex items-center gap-2 text-main-blue font-bold mb-8 hover:gap-3 transition-all">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Layanan
        </Link>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl shadow-blue-500/5 border border-main-orange/20 overflow-hidden relative"
        >
          {/* Decorative background logo */}
          <MonitorPlay className="absolute -bottom-20 -right-20 w-80 h-80 text-purple-500/5" />
          
          <div className="flex flex-col md:flex-row gap-8 items-start mb-12 relative z-10">
            <div className="w-20 h-20 rounded-3xl bg-purple-50 flex items-center justify-center text-purple-500 shrink-0">
              <MonitorPlay className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-heading font-black text-soft-black mb-4">E-Learning Gugus 03</h1>
              <p className="text-gray-500 text-lg leading-relaxed">
                Platform pembelajaran interaktif terpadu. Akses ribuan materi video, kuis penganalisis, dan ruang kolaborasi virtual dalam satu ekosistem.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16 relative z-10">
             {[
                { title: 'Video Pembelajaran', count: '120+', icon: PlayCircle, color: 'text-red-500' },
                { title: 'Modul Digital', count: '450+', icon: BookOpen, color: 'text-main-blue' },
                { title: 'Kelas Virtual', count: '12', icon: GraduationCap, color: 'text-purple-500' },
             ].map((feature, i) => (
                <div key={i} className="p-8 rounded-[2rem] bg-gray-50 border border-gray-100 group hover:bg-white hover:shadow-xl transition-all">
                   <feature.icon className={`w-10 h-10 ${feature.color} mb-6 group-hover:scale-110 transition-transform`} />
                   <h3 className="text-4xl font-black text-soft-black mb-2">{feature.count}</h3>
                   <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">{feature.title}</p>
                </div>
             ))}
          </div>

          <div className="space-y-12 relative z-10">
             <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <h3 className="text-2xl font-bold text-soft-black">Kurikulum Terintegrasi</h3>
                <div className="flex gap-2">
                   <button className="px-4 py-2 rounded-lg bg-purple-500 text-white text-xs font-bold font-sans">Semua Kelas</button>
                   <button className="px-4 py-2 rounded-lg bg-gray-100 text-gray-500 text-xs font-bold font-sans">Kelas 1-3</button>
                   <button className="px-4 py-2 rounded-lg bg-gray-100 text-gray-500 text-xs font-bold font-sans">Kelas 4-6</button>
                </div>
             </div>

             <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                   { title: 'Matematika Kreatif', level: 'Kelas 4', tutor: 'Budi Santoso' },
                   { title: 'Literasi Digital', level: 'Kelas 6', tutor: 'Santi Wijaya' },
                   { title: 'Sains Eksperimen', level: 'Kelas 5', tutor: 'Ahmad Faisal' },
                   { title: 'Pancasila & Etika', level: 'Kelas 3', tutor: 'Dewi Lestari' }
                ].map((course, i) => (
                   <div key={i} className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      <div className="h-32 bg-gray-200 relative">
                         <img src={`https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=2000&auto=format&fit=crop&sig=${i}`} alt="" className="w-full h-full object-cover" />
                         <div className="absolute top-2 right-2 px-2 py-1 bg-white/90 backdrop-blur rounded-lg text-[10px] font-bold text-purple-600">Terbaru</div>
                      </div>
                      <div className="p-4">
                         <div className="flex items-center gap-2 text-xs font-bold text-purple-500 mb-2">
                            <MonitorPlay className="w-3 h-3" /> {course.level}
                         </div>
                         <h4 className="font-bold text-soft-black mb-1 line-clamp-1">{course.title}</h4>
                         <p className="text-xs text-gray-400 mb-4">{course.tutor}</p>
                         <button className="w-full py-2 bg-purple-50 text-purple-600 font-bold rounded-xl text-xs hover:bg-purple-500 hover:text-white transition-colors">
                            Masuk Kelas
                         </button>
                      </div>
                   </div>
                ))}
             </div>

             <div className="bg-purple-600 rounded-[2.5rem] p-12 text-white flex flex-col md:flex-row items-center justify-between gap-12">
                <div className="max-w-xl text-center md:text-left">
                   <h3 className="text-3xl font-heading font-black mb-4">Mulai Perjalanan Belajarmu</h3>
                   <p className="text-white/80">Dapatkan akses penuh ke sertifikasi dan materi eksklusif dengan mendaftar melalui akun sekolah yang telah diverifikasi.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                   <button className="px-8 py-4 bg-white text-purple-600 rounded-2xl font-black shadow-xl hover:scale-105 transition-all">
                      Daftar Akun Siswa
                   </button>
                   <button className="px-8 py-4 bg-soft-black/20 text-white rounded-2xl font-bold backdrop-blur border border-white/20 hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                      <Award className="w-5 h-5" /> Lihat Sertifikat
                   </button>
                </div>
             </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
