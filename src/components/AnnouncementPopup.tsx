import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { X, Megaphone, ArrowRight } from "lucide-react";
import { useSiteContent } from "../contexts/SiteContext";

export default function AnnouncementPopup({ isReady = true }: { isReady?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const { content } = useSiteContent();
  const { announcement } = content;
  const location = useLocation();

  useEffect(() => {
    // Only show on main page
    if (location.pathname !== '/' && location.pathname !== '/halaman-utama') return;
      
    const hasBeenShown = sessionStorage.getItem('announcementShown');
    if (!hasBeenShown && isReady) {
      // Show popup slightly after splash screen disappears
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isReady, location.pathname]);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem('announcementShown', 'true');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-soft-black/60 backdrop-blur-md"
            onClick={handleClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative w-full max-w-lg bg-white rounded-[2rem] overflow-hidden shadow-2xl shadow-main-blue/20 flex flex-col md:flex-row"
          >
            {/* Close Button */}
            <button 
              onClick={handleClose}
              className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10 transition-colors"
            >
              <X className="w-4 h-4 text-soft-black" />
            </button>

            {/* Left Graphic */}
            <div className="bg-gradient-to-br from-main-blue to-leaf-green p-8 flex items-center justify-center md:w-1/3 relative overflow-hidden">
               <div className="absolute inset-0 bg-white/10 blur-2xl rounded-full" />
               <Megaphone className="w-16 h-16 text-white relative z-10 transform -rotate-12" />
            </div>

            {/* Content */}
            <div className="p-8 md:w-2/3 flex flex-col justify-center bg-white">
              <h4 className="text-xs font-bold uppercase tracking-wider text-main-blue mb-2">{announcement.title}</h4>
              <h3 className="font-heading text-xl font-bold text-soft-black mb-3 leading-tight">{announcement.subtitle}</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                {announcement.desc}
              </p>
              
              <button 
                onClick={handleClose}
                className="w-full py-3 bg-light-gray hover:bg-gray-200 text-soft-black font-bold rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
              >
                Tutup <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
