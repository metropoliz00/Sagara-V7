import React, { useState } from 'react';
import logoImg from '../src/assets/images/logo_7kaih.jpg';

const LOGO_7KAIH_URL = 'https://www.image2url.com/r2/default/images/1785853373665-f297ec07-8cba-4b4a-85dc-da600daf3169.png';

interface Logo7KaihProps {
  className?: string;
  imgClassName?: string;
  alt?: string;
}

export const Logo7Kaih: React.FC<Logo7KaihProps> = ({
  className = "w-12 h-12",
  imgClassName = "",
  alt = "Logo 7 Kebiasaan Anak Indonesia Hebat",
}) => {
  const [retryCount, setRetryCount] = useState(0);
  const [imgError, setImgError] = useState(false);

  // Use primary high-resolution CDN link first, then fallback to local assets if offline
  const currentSrc = retryCount === 0 
    ? LOGO_7KAIH_URL 
    : retryCount === 1 
      ? logoImg 
      : "/logo_7kaih.jpg";

  const handleError = () => {
    if (retryCount < 2) {
      setRetryCount(prev => prev + 1);
    } else {
      setImgError(true);
    }
  };

  if (imgError) {
    // Vector SVG Fallback that matches 7 KAIH branding perfectly
    return (
      <div className={`relative flex items-center justify-center bg-gradient-to-br from-amber-50 via-sky-50 to-teal-50 border border-amber-300/70 shadow-2xs rounded-xl overflow-hidden shrink-0 ${className}`}>
        <svg viewBox="0 0 100 100" className="w-full h-full p-1" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Yellow Sunburst Rays */}
          <path d="M50 18 A32 32 0 0 1 82 50 A32 32 0 0 1 50 82" stroke="#F59E0B" strokeWidth="3" strokeDasharray="3 1.5" />
          <path d="M45 23 A27 27 0 0 1 73 50 A27 27 0 0 1 45 77" stroke="#FBBF24" strokeWidth="2.5" />
          <path d="M40 28 A22 22 0 0 1 66 50 A22 22 0 0 1 40 72" stroke="#FCD34D" strokeWidth="2" />
          <circle cx="50" cy="18" r="5" fill="#F59E0B" />

          {/* Child Figure Reaching Up */}
          {/* Head (Blue) */}
          <circle cx="65" cy="33" r="7.5" fill="#0284C7" />
          {/* Body (Teal/Emerald) */}
          <path d="M52 40 L65 46 L76 50 L68 76 L62 76 L63 60 L57 60 L58 76 L52 76 Z" fill="#0D9488" />
          <path d="M52 40 L65 46 L72 35 Z" fill="#0D9488" />

          {/* Center Badge Text */}
          <text x="50" y="93" textAnchor="middle" fill="#0F172A" fontSize="7.5" fontWeight="900">7 KAIH</text>
        </svg>
      </div>
    );
  }

  return (
    <div className={`relative shrink-0 flex items-center justify-center overflow-hidden ${className}`}>
      <img
        src={currentSrc}
        alt={alt}
        referrerPolicy="no-referrer"
        onError={handleError}
        className={`w-full h-full object-contain ${imgClassName}`}
      />
    </div>
  );
};

export default Logo7Kaih;
