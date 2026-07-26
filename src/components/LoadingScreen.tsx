import { motion } from "motion/react";
import { useSiteContent } from "../contexts/SiteContext";

export default function LoadingScreen() {
  const { content } = useSiteContent();

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ 
        opacity: 0,
        transition: { duration: 0.8, ease: "easeInOut" }
      }}
      className="fixed inset-0 z-[9999] bg-white flex justify-center items-center overflow-hidden"
    >
      {/* Background Decorative Elements */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute w-full h-full"
      >
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-main-blue/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-leaf-green/5 rounded-full blur-3xl" />
      </motion.div>

      <div className="relative flex flex-col items-center">
        {/* Logo Container with Zoom Out Effect on Exit */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ 
            scale: 0, 
            opacity: 0,
            transition: { duration: 0.8, ease: [0.4, 0, 0.2, 1] } 
          }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-32 h-32 md:w-48 md:h-48 relative mb-8"
        >
          <div className="absolute inset-0 bg-white rounded-full shadow-2xl shadow-main-blue/10 flex items-center justify-center p-4 border-2 border-main-blue/10">
            <img 
              src={content.hero.logo} 
              alt="Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          
          {/* Animated Ring */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-4 border-2 border-dashed border-main-blue/20 rounded-full"
          />
        </motion.div>

        {/* Text Fade In */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20, scale: 0.8 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-center"
        >
          <h1 className="text-xl md:text-2xl font-heading font-black text-dark-green tracking-tight uppercase">
            GUGUS 03 MELATI
          </h1>
          <p className="text-xs md:text-sm font-bold text-main-blue tracking-[0.2em] uppercase opacity-70 mt-1">
            Kecamatan Jenu
          </p>
        </motion.div>
      </div>

    </motion.div>
  );
}
