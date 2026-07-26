import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Stats from './components/Stats';
import Schools from './components/Schools';
import Prestasi from './components/Prestasi';
import HomeAgenda from './components/HomeAgenda';
import MediaInformasi from './components/MediaInformasi';
import DigitalServices from './components/DigitalServices';
import Gallery from './components/Gallery';
import Footer from './components/Footer';
import ScrollTop from './components/ScrollTop';
import FloatingWA from './components/FloatingWA';
import LoginModal from './components/LoginModal';
import AnnouncementPopup from './components/AnnouncementPopup';
import LoadingScreen from './components/LoadingScreen';
import Dashboard from './pages/Dashboard';
import KaryaPage from './pages/KaryaPage';
import { supabase } from './lib/supabase';
import { useSiteContent } from './contexts/SiteContext';

import KkgPage from './pages/KkgPage';
import KkgProgramPage from './pages/KkgProgramPage';
import KkgAgendaPage from './pages/KkgAgendaPage';
import GugusPage from './pages/GugusPage';
import KegiatanPage from './pages/KegiatanPage';
import AdministrasiOnline from './pages/AdministrasiOnline';
import AbsensiKegiatan from './pages/AbsensiKegiatan';
import UploadBerkas from './pages/UploadBerkas';
import MonitoringPembelajaran from './pages/MonitoringPembelajaran';
import ELearning from './pages/ELearning';
import AnggotaGugusPage from './pages/AnggotaGugus';
import KeuanganPage from './pages/KeuanganPage';
import PraktikBaikPage from './pages/PraktikBaikPage';
import RegistrasiTamu from './pages/RegistrasiTamu';
import { AlertProvider } from './contexts/AlertContext';
import { logActivity } from './lib/activity';

function HomePage({ onLoginClick, user }: { onLoginClick: () => void; user?: any }) {
  const { content } = useSiteContent();
  return (
    <>
      <Hero />
      <Stats />
      
      {/* Sambutan Ketua Gugus (Simple Section Insert) */}
      <section className="py-24 bg-light-gray" id="profil">
        <div className="container mx-auto px-6 max-w-9xl">
          <div className="bg-gradient-to-br from-white/80 to-blue-50/50 backdrop-blur-xl rounded-[3rem] p-8 md:p-16 border border-main-orange/20 flex flex-col md:flex-row items-center gap-12 relative overflow-hidden shadow-2xl shadow-blue-500/5">
            <div className="absolute top-0 right-0 w-64 h-64 bg-main-blue/5 rounded-full blur-3xl" />
            <div className="relative w-48 md:w-64 shrink-0 aspect-[3/4] rounded-2xl overflow-hidden border-4 border-white shadow-xl group">
              <img 
                src={content.profil.image} 
                alt={content.profil.name} 
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-90" 
              />
            </div>
            <div className="relative z-10 text-center md:text-left">
              <h2 className="text-dark-green font-bold tracking-widest text-sm uppercase mb-2">Sambutan Ketua Gugus</h2>
              <h3 className="text-3xl md:text-4xl font-heading font-extrabold text-soft-black mb-6 whitespace-pre-line">{content.profil.title}</h3>
              <p className="text-gray-600 text-lg md:text-xl font-light leading-relaxed mb-6 italic">
                {content.profil.quote}
              </p>
              <div>
                <h4 className="font-bold text-soft-black text-xl">{content.profil.name}</h4>
                <p className="text-main-blue text-sm font-semibold">{content.profil.role}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Schools />
      <Prestasi />
      <HomeAgenda />
      <DigitalServices onLoginClick={onLoginClick} user={user} />
      <MediaInformasi />
      <Gallery />
    </>
  );
}

export default function App() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isInitialAuthLoading, setIsInitialAuthLoading] = useState(true);
  const [isAppReady, setIsAppReady] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Quick smooth transition for splash screen effect
    const timer = setTimeout(() => {
      setIsAppReady(true);
    }, 300);

    let authSubscription: any = null;

    if (supabase) {
      const fetchUserProfile = async (userId: string) => {
        try {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single();
          
          setUser(profile);
        } catch (error) {
          console.error('Error fetching profile:', error);
        } finally {
          setIsInitialAuthLoading(false);
        }
      };

      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          fetchUserProfile(session.user.id);
        } else {
          // Check for guest session
          const guestSession = localStorage.getItem("guest_session");
          if (guestSession) {
            try {
              setUser(JSON.parse(guestSession));
            } catch (e) {
              localStorage.removeItem("guest_session");
            }
          }
          setIsInitialAuthLoading(false);
        }
      }).catch((error) => {
        console.error('Error getting session:', error);
        setIsInitialAuthLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          fetchUserProfile(session.user.id);
        } else {
          // Check if it's a guest session before clearing
          const guestSession = localStorage.getItem("guest_session");
          if (!guestSession) {
            setUser(null);
          }
          setIsInitialAuthLoading(false);
        }
      });
      authSubscription = subscription;
    } else {
      setIsInitialAuthLoading(false);
    }

    return () => {
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
      clearTimeout(timer);
    };
  }, []);

  const handleLogout = async () => {
    if (user) {
      await logActivity(user, 'logout', `${user.nama || user.username} keluar dari aplikasi`);
    }
    if (supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem("guest_session");
    setUser(null);
  };

  const handleLoginSuccess = (userData: any) => {
    logActivity(userData, 'login', `${userData.nama || userData.username} berhasil masuk ke aplikasi`);
    setUser(userData);
    setIsLoginOpen(false);
    navigate('/dashboard');
  };

  const isDashboard = location.pathname.startsWith('/dashboard');

  useEffect(() => {
    const titles: { [key: string]: string } = {
      '/': 'Beranda',
      '/halaman-utama': 'Beranda',
      '/kkg': 'KKG',
      '/kkg/program': 'Program KKG',
      '/kkg/agenda': 'Agenda KKG',
      '/anggota-gugus': 'Anggota Gugus',
      '/profil-gugus': 'Profil Gugus',
      '/praktik-baik': 'Sharing Praktik Baik',
      '/kegiatan': 'Kegiatan',
      '/keuangan': 'Laporan Keuangan',
      '/layanan/administrasi': 'Administrasi Online',
      '/layanan/absensi': 'Absensi Kegiatan',
      '/layanan/upload': 'Upload Berkas',
      '/layanan/monitoring': 'Monitoring Pembelajaran',
      '/layanan/elearning': 'E-Learning',
      '/registrasi-tamu': 'Registrasi Tamu',
      '/dashboard': 'Dashboard Admin',
    };

    if (location.pathname.startsWith('/dashboard')) {
      return; // Dashboard.tsx will handle its own title
    }

    const title = titles[location.pathname] || 'Website Gugus 03';
    document.title = `${title} | Gugus 03 Melati`;
  }, [location]);

  return (
    <AlertProvider>
      <AnimatePresence mode="wait">
        {(!isAppReady || isInitialAuthLoading) && (
          <LoadingScreen key="loader" />
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-light-gray font-sans text-soft-black selection:bg-main-blue selection:text-white">
        {!isDashboard && <Navbar onLoginClick={() => setIsLoginOpen(true)} user={user} />}

        
        <main>
          <Routes>
            <Route path="/" element={<HomePage onLoginClick={() => setIsLoginOpen(true)} user={user} />} />
            <Route path="/halaman-utama" element={<HomePage onLoginClick={() => setIsLoginOpen(true)} user={user} />} />
            <Route path="/kkg" element={<KkgPage />} />
            <Route path="/hasil-karya" element={<KaryaPage />} />
            <Route path="/kkg/program" element={<KkgProgramPage />} />
            <Route path="/kkg/agenda" element={<KkgAgendaPage />} />
            <Route path="/anggota-gugus" element={<AnggotaGugusPage />} />
            <Route path="/profil-gugus" element={<GugusPage />} />
            <Route path="/praktik-baik" element={<PraktikBaikPage />} />
            <Route path="/kegiatan" element={<KegiatanPage />} />
            <Route path="/keuangan" element={<KeuanganPage />} />
            <Route path="/layanan/administrasi" element={<AdministrasiOnline />} />
            <Route path="/layanan/absensi" element={<AbsensiKegiatan />} />
            <Route path="/layanan/upload" element={<UploadBerkas />} />
            <Route path="/layanan/monitoring" element={<MonitoringPembelajaran />} />
            <Route path="/layanan/elearning" element={<ELearning />} />
            <Route path="/registrasi-tamu" element={<RegistrasiTamu onLoginSuccess={handleLoginSuccess} />} />
            <Route 
              path="/dashboard/*" 
              element={isInitialAuthLoading ? <></> : (user ? <Dashboard user={user} onLogout={handleLogout} /> : <Navigate to="/" replace />)} 
            />
          </Routes>
        </main>

        {!isDashboard && <Footer />}
        {!isDashboard && <FloatingWA position="left" />}
        {!isDashboard && <ScrollTop />}
        
        <LoginModal 
          isOpen={isLoginOpen} 
          onClose={() => setIsLoginOpen(false)} 
          onLoginSuccess={handleLoginSuccess}
        />
        <AnnouncementPopup isReady={isAppReady && !isInitialAuthLoading} />
      </div>
    </AlertProvider>
  );
}
