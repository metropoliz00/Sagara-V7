import React from "react";
import { MapPin, Phone, Mail, Facebook, Instagram, Youtube } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSiteContent } from "../contexts/SiteContext";

function TiktokIcon(props: any) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5v3a3 3 0 0 1-3-3v8a4 4 0 0 1-8 0 4 4 0 0 1 4-4Z"></path>
    </svg>
  );
}

export default function Footer() {
  const { content } = useSiteContent();
  const social = (content.footer as any).social || {};
  const navigate = useNavigate();
  const location = useLocation();

  const handleAnchorClick = (e: React.MouseEvent<HTMLButtonElement>, href: string, label: string) => {
    e.preventDefault();
    const id = href.split('#')[1];
    
    const performScrollAndFilter = () => {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
      if (label === 'Sekolah Imbas') {
        const filterEvent = new CustomEvent('set-school-filter', { detail: 'Sekolah Imbas' });
        window.dispatchEvent(filterEvent);
      } else if (label === 'Sekolah') {
        const filterEvent = new CustomEvent('set-school-filter', { detail: 'Semua' });
        window.dispatchEvent(filterEvent);
      }
    };

    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        performScrollAndFilter();
      }, 150);
    } else {
      performScrollAndFilter();
    }
  };

  const menuAkses = [
    { label: 'Beranda', href: '/' },
    { label: 'Profil Gugus', href: '/profil-gugus' },
    { label: 'KKG', href: '/kkg' },
    { label: 'Kegiatan', href: '/kegiatan' },
    { label: 'Sekolah Imbas', href: '/#sekolah' },
    { label: 'Media & Informasi', href: '/#media' },
  ];

  const layananDigital = [
    { label: 'Administrasi Online', href: '/layanan/administrasi' },
    { label: 'E-Learning', href: '/layanan/elearning' },
    { label: 'Absensi Kegiatan', href: '/layanan/absensi' },
    { label: 'Download Berkas', href: '/layanan/upload' },
    { label: 'Monitoring', href: '/layanan/monitoring' },
  ];

  return (
    <footer className="bg-white border-t border-gray-100 text-soft-black pt-20 pb-10 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-dark-green via-main-blue to-main-orange" />
      <div className="container mx-auto px-6 max-w-9xl relative z-10">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* Brand Col */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center p-1">
                <img src={content.hero.logo} alt="Logo Melati" className="w-full h-full object-contain" />
              </div>
              <div className="font-heading font-bold leading-tight">
                <span className="block text-lg">GUGUS 03 MELATI</span>
                <span className="block text-sm text-dark-green uppercase">KECAMATAN JENU</span>
              </div>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              {content.footer.description}
            </p>
            <div className="flex gap-4">
              {social.facebook && (
                <a href={social.facebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-light-gray flex items-center justify-center hover:bg-main-blue text-gray-500 hover:text-white transition-colors">
                  <Facebook className="w-5 h-5" />
                </a>
              )}
              {social.instagram && (
                <a href={social.instagram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-light-gray flex items-center justify-center hover:bg-main-blue text-gray-500 hover:text-white transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
              )}
              {social.tiktok && (
                <a href={social.tiktok} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-light-gray flex items-center justify-center hover:bg-main-blue text-gray-500 hover:text-white transition-colors">
                  <TiktokIcon className="w-5 h-5" />
                </a>
              )}
              {social.youtube && (
                <a href={social.youtube} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-light-gray flex items-center justify-center hover:bg-main-blue text-gray-500 hover:text-white transition-colors">
                  <Youtube className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>

          {/* Links 1 */}
          <div>
            <h4 className="font-heading font-bold text-lg mb-6 text-soft-black border-b border-gray-200 pb-2 inline-block">Menu Akses</h4>
            <ul className="space-y-3">
              {menuAkses.map(link => (
                <li key={link.label}>
                  {link.href.startsWith('/#') ? (
                    <button
                      type="button"
                      onClick={(e) => handleAnchorClick(e, link.href, link.label)}
                      className="text-gray-500 hover:text-main-blue transition-colors text-sm flex items-center gap-2 cursor-pointer text-left w-full focus:outline-none"
                    >
                       <span className="w-1.5 h-1.5 rounded-full bg-main-blue opacity-50 text-left" />
                       {link.label}
                    </button>
                  ) : (
                    <Link to={link.href} className="text-gray-500 hover:text-main-blue transition-colors text-sm flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-main-blue opacity-50" />
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Links 2 */}
          <div>
            <h4 className="font-heading font-bold text-lg mb-6 text-soft-black border-b border-gray-200 pb-2 inline-block">Layanan Digital</h4>
            <ul className="space-y-3">
              {layananDigital.map(link => (
                <li key={link.label}>
                  <Link to={link.href} className="text-gray-500 hover:text-main-blue transition-colors text-sm flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-dark-green opacity-50" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div id="kontak">
            <h4 className="font-heading font-bold text-lg mb-6 text-soft-black border-b border-gray-200 pb-2 inline-block">Hubungi Kami</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-4 text-gray-500 text-sm">
                <MapPin className="w-5 h-5 text-main-orange shrink-0 mt-0.5" />
                <p>{content.footer.address}</p>
              </li>
              <li className="flex items-center gap-4 text-gray-500 text-sm">
                <Phone className="w-5 h-5 text-main-blue shrink-0" />
                <p>{content.footer.phone}</p>
              </li>
              <li className="flex items-center gap-4 text-gray-500 text-sm">
                <Mail className="w-5 h-5 text-dark-green shrink-0" />
                <p>{content.footer.email}</p>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm text-center md:text-left">
            © {new Date().getFullYear()} Gugus 03 Melati Kecamatan Jenu. All rights reserved | 
            <a 
              href={`https://wa.me/${content.footer.waNumber || '6281234567890'}`}
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-soft-black hover:text-main-blue transition-colors font-semibold"
            >
              Dev. MeyGa
            </a>
          </p>
          <div className="flex gap-4 text-sm text-gray-500">
            <a href="#" className="hover:text-main-blue transition-colors">Privacy Policy</a>
            <span>•</span>
            <a href="#" className="hover:text-main-blue transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
