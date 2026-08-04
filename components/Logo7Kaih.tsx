import React, { useState } from 'react';
import logoImg from '../src/assets/images/logo_7kaih.jpg';

interface Logo7KaihProps {
  className?: string;
  imgClassName?: string;
  alt?: string;
  showText?: boolean;
}

export const Logo7Kaih: React.FC<Logo7KaihProps> = ({
  className = "w-12 h-12",
  imgClassName = "w-full h-full object-contain rounded-xl",
  alt = "Logo 7 Kebiasaan Anak Indonesia Hebat",
}) => {
  const [imgError, setImgError] = useState(false);

  if (imgError) {
    // Vector SVG Fallback that matches 7 KAIH branding perfectly
    return (
      <div className={`relative flex items-center justify-center bg-white border border-amber-200 shadow-2xs rounded-xl overflow-hidden shrink-0 ${className}`}>
        <svg viewBox="0 0 100 100" className="w-full h-full p-1" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Yellow Shooting Star / Sunburst Rays */}
          <path d="M50 20 A30 30 0 0 1 80 50 A30 30 0 0 1 50 80" stroke="#F59E0B" strokeWidth="2.5" strokeDasharray="2 1" />
          <path d="M45 25 A25 25 0 0 1 72 50 A25 25 0 0 1 45 75" stroke="#FBBF24" strokeWidth="2" />
          <path d="M40 30 A20 20 0 0 1 65 50 A20 20 0 0 1 40 70" stroke="#FCD34D" strokeWidth="2" />
          <circle cx="50" cy="20" r="5" fill="#F59E0B" />

          {/* Child Figure Reaching Up */}
          {/* Head (Blue) */}
          <circle cx="65" cy="35" r="7" fill="#0284C7" />
          {/* Body (Teal/Emerald) */}
          <path d="M52 42 L65 48 L76 52 L68 76 L62 76 L63 60 L57 60 L58 76 L52 76 Z" fill="#0D9488" />
          <path d="M52 42 L65 48 L72 38 Z" fill="#0D9488" />

          {/* Center Badge Text */}
          <text x="50" y="93" textAnchor="middle" fill="#1E293B" fontSize="6.5" fontWeight="bold">7 KAIH</text>
        </svg>
      </div>
    );
  }

  return (
    <div className={`relative shrink-0 flex items-center justify-center ${className}`}>
      <img
        src={logoImg}
        alt={alt}
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
        className={imgClassName}
      />
    </div>
  );
};

export default Logo7Kaih;
