import { motion } from "motion/react";
import { Laptop, CalendarCheck, FolderUp, Activity, MonitorPlay, LayoutDashboard } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function DigitalServices({ onLoginClick, user }: { onLoginClick: () => void; user?: any }) {
  const navigate = useNavigate();
  
  const services = [
    { icon: Laptop, title: "Administrasi Online", desc: "Sistem paperless untuk surat menyurat dan dokumen resmi.", color: "text-main-blue", bg: "bg-blue-50", path: "/layanan/administrasi" },
    { icon: CalendarCheck, title: "Absensi Kegiatan", desc: "Rekapitulasi kehadiran guru dan siswa secara realtime.", color: "text-leaf-green", bg: "bg-green-50", path: "/layanan/absensi" },
    { icon: FolderUp, title: "Upload Berkas", desc: "Penyimpanan digital untuk RPP, Silabus, dan bahan ajar.", color: "text-accent-orange", bg: "bg-orange-50", path: "/layanan/upload" },
    { icon: Activity, title: "Monitoring Pembelajaran", desc: "Pantau progress dan evaluasi hasil belajar antar sekolah.", color: "text-red-500", bg: "bg-red-50", path: "/layanan/monitoring" },
    { icon: MonitorPlay, title: "E-Learning", desc: "Platform belajar interaktif terintegrasi untuk siswa.", color: "text-purple-500", bg: "bg-purple-50", path: "/layanan/elearning" },
    { icon: LayoutDashboard, title: "Dashboard Internal", desc: "Portal mandiri untuk manajemen aktivitas pendidik dan admin.", color: "text-teal-500", bg: "bg-teal-50", action: () => {
      if (user) {
        navigate('/dashboard');
      } else {
        onLoginClick();
      }
    }},
  ];

  return (
    <section id="services" className="py-24 bg-light-gray relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />
      
      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl"
          >
            <h2 className="text-dark-green font-bold tracking-widest text-sm uppercase mb-3">Teknologi Pendidikan</h2>
            <h3 className="text-3xl md:text-5xl font-heading font-extrabold text-soft-black mb-4">Layanan Digital Terpadu</h3>
            <p className="text-gray-500 text-lg">Mendukung percepatan digitalisasi pendidikan melalui platform interaktif dan sistem informasi yang saling terintegrasi.</p>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((srv, i) => {
            const Icon = srv.icon;
            return (
              <motion.div
                key={srv.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "0px" }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-3xl border border-gray-100 bg-white transition-all group cursor-pointer shadow-sm hover:shadow-xl hover:shadow-main-blue/5"
                onClick={() => {
                  if (srv.action) srv.action();
                  if (srv.path) navigate(srv.path);
                }}
              >
                <div className={`w-14 h-14 rounded-xl ${srv.bg} ${srv.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-7 h-7" />
                </div>
                <h4 className="text-xl font-bold font-heading text-soft-black mb-3 group-hover:text-main-blue transition-colors">{srv.title}</h4>
                <p className="text-gray-500 text-sm leading-relaxed">{srv.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
