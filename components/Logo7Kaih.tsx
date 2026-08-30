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
    // Vector SVG Fallback that matches 7 KAIH branding perfectly and scales with the theme color
    return (
      <div 
        className={`relative flex items-center justify-center border shadow-xs rounded-xl overflow-hidden shrink-0 transition-all duration-300 ${className}`}
        style={{
          background: 'linear-gradient(135deg, #ffffff 0%, var(--color-cream, rgba(90, 178, 255, 0.05)) 100%)',
          borderColor: 'var(--color-ocean-blue, rgba(90, 178, 255, 0.3))'
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full p-1" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Theme-based Sunburst Rays */}
          <path d="M50 18 A32 32 0 0 1 82 50 A32 32 0 0 1 50 82" stroke="var(--color-ocean-blue, #5AB2FF)" strokeWidth="3" strokeDasharray="3 1.5" />
          <path d="M45 23 A27 27 0 0 1 73 50 A27 27 0 0 1 45 77" stroke="var(--color-ocean-blue, #5AB2FF)" strokeWidth="2.5" opacity="0.7" />
          <path d="M40 28 A22 22 0 0 1 66 50 A22 22 0 0 1 40 72" stroke="var(--color-ocean-blue, #5AB2FF)" strokeWidth="2" opacity="0.4" />
          <circle cx="50" cy="18" r="5" fill="var(--color-ocean-blue, #5AB2FF)" />

          {/* Child Figure Reaching Up in theme color */}
          {/* Head (Dynamic Theme Blue) */}
          <circle cx="65" cy="33" r="7.5" fill="var(--color-ocean-blue, #5AB2FF)" />
          {/* Body (Dynamic Theme Deep/Teal) */}
          <path d="M52 40 L65 46 L76 50 L68 76 L62 76 L63 60 L57 60 L58 76 L52 76 Z" fill="var(--color-ocean-blue, #5AB2FF)" opacity="0.9" />
          <path d="M52 40 L65 46 L72 35 Z" fill="var(--color-ocean-blue, #5AB2FF)" opacity="0.9" />

          {/* Center Badge Text */}
          <text x="50" y="93" textAnchor="middle" fill="var(--color-ocean-blue, #0F172A)" fontSize="7.5" fontWeight="900" opacity="0.95">7 KAIH</text>
        </svg>
      </div>
    );
  }

  return (
    <div 
      className={`relative shrink-0 flex items-center justify-center overflow-hidden transition-all duration-300 ${className}`}
      style={{
        filter: 'drop-shadow(0 2px 6px var(--color-sky-blue, rgba(90, 178, 255, 0.2)))',
      }}
    >
      <img
        src={currentSrc}
        alt={alt}
        referrerPolicy="no-referrer"
        onError={handleError}
        className={`w-full h-full object-contain transition-all duration-300 ${imgClassName}`}
      />
      {/* Subtle brand color tint overlay using color blend-mode to colorize the logo image */}
      <div 
        className="absolute inset-0 pointer-events-none mix-blend-color opacity-25 transition-all duration-300"
        style={{ backgroundColor: 'var(--color-ocean-blue, #5AB2FF)' }}
      />
    </div>
  );
};

export default Logo7Kaih;
