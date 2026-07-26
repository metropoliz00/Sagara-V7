import { MessageCircle } from "lucide-react";
import { motion } from "motion/react";
import { useSiteContent } from "../contexts/SiteContext";

interface FloatingWAProps {
  position?: 'left' | 'right';
}

export default function FloatingWA({ position = 'right' }: FloatingWAProps) {
  const horizontalClass = position === 'left' ? 'left-6' : 'right-6';
  const { content } = useSiteContent();
  
  return (
    <motion.a
      href={`https://wa.me/${content.footer.waNumber || '6281234567890'}`}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 1, type: "spring", stiffness: 200 }}
      className={`fixed bottom-24 lg:bottom-8 ${horizontalClass} z-40 bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform group flex items-center justify-center`}
      aria-label="Chat via WhatsApp"
    >
      <div className="absolute inset-0 bg-[#25D366] rounded-full animate-ping opacity-20" />
      <MessageCircle className="w-8 h-8" />
      
      {/* Tooltip */}
      <span className={`absolute ${position === 'left' ? 'left-full ml-4' : 'right-full mr-4'} bg-white text-dark-gray text-sm px-3 py-1 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap font-medium border border-gray-100`}>
        Chat Admin
      </span>
    </motion.a>
  );
}
