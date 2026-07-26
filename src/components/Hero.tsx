import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, Users } from "lucide-react";
import { useSiteContent } from "../contexts/SiteContext";
import VisitorCounter from "./VisitorCounter";

const backgroundImages = [
  "https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=2022&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=2064&auto=format&fit=crop"
];

export default function Hero() {
  const [currentImage, setCurrentImage] = useState(0);
  const { content } = useSiteContent();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % backgroundImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="beranda" className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
      {/* Top Right Visitor Badge on Beranda */}
      <div className="absolute top-20 right-4 sm:top-24 sm:right-8 lg:top-28 lg:right-12 z-20">
        <VisitorCounter variant="badge" />
      </div>

      {/* Floating Abstract Shapes based on Natural Tones Design */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-light-gray">
        <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] bg-gradient-to-br from-[#1F8FE5]/10 to-[#7AC943]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-150px] left-[-150px] w-[600px] h-[600px] bg-gradient-to-tr from-[#F47C20]/5 to-[#1F8FE5]/10 rounded-full blur-3xl"></div>
      </div>

      <div className="container relative z-10 mx-auto px-6 max-w-5xl mt-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center"
        >
          {/* Main Logo Container */}
          <div className="mb-8 relative group">
            <div className="absolute inset-0 bg-white/20 blur-xl rounded-full group-hover:bg-white/40 transition-all duration-500" />
            <motion.div 
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
              className="relative w-32 h-32 md:w-40 md:h-40 bg-white/60 backdrop-blur-md rounded-full border border-gray-200 p-2 flex items-center justify-center shadow-2xl"
            >
              <img src={content.hero.logo} alt="Logo Melati" className="w-full h-full object-contain drop-shadow-sm" />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            <h2 className="text-leaf-green font-bold tracking-widest text-sm md:text-base uppercase mb-3">Selamat Datang di Portal Resmi</h2>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-extrabold mb-6 leading-[1.1] drop-shadow-sm">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-main-blue to-dark-blue">{content.hero.title1}</span> <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-dark-blue to-dark-green">
                {content.hero.title2}
              </span>
            </h1>
          </motion.div>

          {/* Subtitle */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="text-lg md:text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed"
          >
            {content.hero.description}
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="flex flex-col sm:flex-row items-center gap-4 justify-center"
          >
            <a href="#profil" className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-soft-black text-white font-bold hover:shadow-xl transition-all flex items-center justify-center gap-2 group">
              Jelajahi Website
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <div className="flex gap-4 w-full sm:w-auto">
              <a href="#sekolah" className="flex-1 sm:flex-none px-6 py-4 rounded-2xl bg-white border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
                <BookOpen className="w-5 h-5" /> Sekolah
              </a>
              <a href="#kontak" className="flex-1 sm:flex-none px-6 py-4 rounded-2xl bg-white border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
                <Users className="w-5 h-5" /> Kontak
              </a>
            </div>
          </motion.div>

        </motion.div>
      </div>

      {/* Decorative Bottom Wave */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-10 transform translate-y-1">
        <svg className="relative block w-[150%] h-12 md:h-24 lg:h-32" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39 56.44c58-10.79 114.16-30.13 172-41.86 82.39-16.72 168.19-17.73 250.45-.39C823.78 31 906.67 72 985.66 92.83c70.05 18.48 146.53 26.09 214.34 3V120H0V95.8c69.87-17.65 145.43-26.65 221.39-26.44z" className="fill-light-gray"></path>
        </svg>
      </div>
    </section>
  );
}
