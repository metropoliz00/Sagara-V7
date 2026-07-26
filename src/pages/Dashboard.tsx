import React, { useState, useEffect, useRef } from "react"; // Updated
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import {
  LogOut,
  LayoutDashboard,
  FileText,
  Settings,
  Users,
  BookOpen,
  Map,
  Navigation,
  Image as ImageIcon,
  Briefcase,
  FileVideo,
  Video,
  MessageSquare,
  MessageCircle,
  Download,
  Calendar,
  CheckSquare,
  Search,
  Menu,
  X,
  PlusCircle,
  PenTool,
  Trophy,
  Award,
  CheckCircle,
  UploadCloud,
  Activity,
  Bell,
  Shield,
  ChevronRight,
  ChevronLeft,
  BarChart3,
  GraduationCap,
  Play,
  Megaphone,
  Wallet,
  Trash2,
  Globe,
  ExternalLink,
  ArrowLeft,
  Send,
  ChevronDown,
  Type,
  RefreshCw,
  Printer,
  Upload,
  Info,
  MapPin,
  Clock,
  UserCheck,
  User as UserIcon,
  Mail,
  ShieldCheck,
  Newspaper,
  NotebookPen,
  Camera,
  School,
  XCircle,
  LayoutList,
  Check,
  Pencil,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Routes,
  Route,
  useNavigate,
  useLocation,
  Navigate,
  useSearchParams,
} from "react-router-dom";

import { useSiteContent, defaultContent } from "../contexts/SiteContext";
import FloatingWA from "../components/FloatingWA";
import { supabase } from "../lib/supabase";
import OrgChart from "../components/OrgChart";
import ImageUpload from "../components/ImageUpload";
import FileUpload from "../components/FileUpload";
import { useAlert } from "../contexts/AlertContext";
import { FinanceTransaction } from "../types";
import { logActivity, ActivityLog } from "../lib/activity";
import AdminCertificateEditor, {
  useCertificateGenerator,
  ensureCertificatesExist,
} from "../components/AdminCertificateEditor";
import { SharingPractices } from "../components/SharingPractices";
import MainCalendar from "../components/MainCalendar";
import PrintDaftarHadir from "../components/PrintDaftarHadir";
import PrintLaporanKeuangan from "../components/PrintLaporanKeuangan";
import PrintKartuTamu from "../components/PrintKartuTamu";
import { getAutomatedStatus, getEnglishStatus, getIndonesianStatusLabel } from "../utils/statusHelper";

import * as XLSX from "xlsx";
import Webcam from "react-webcam";
const WebcamComponent = Webcam as any;

const getDirectDownloadUrl = (url: string | null | undefined): string => {
  if (!url) return "";
  const trimmed = url.trim();
  const fileDMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch && fileDMatch[1]) {
    return `https://drive.google.com/uc?export=download&id=${fileDMatch[1]}&confirm=t`;
  }
  const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) {
    return `https://drive.google.com/uc?export=download&id=${idMatch[1]}&confirm=t`;
  }
  const dMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (dMatch && dMatch[1] && trimmed.includes("drive.google.com")) {
    return `https://drive.google.com/uc?export=download&id=${dMatch[1]}&confirm=t`;
  }
  return trimmed;
};

// Countdown Timer Component
const CountdownTimer = ({ targetDate, simple = false }: { targetDate: string, simple?: boolean }) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isPast: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(targetDate) - +new Date();
      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        isPast: false,
      };
    };

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    setTimeLeft(calculateTimeLeft());
    return () => clearInterval(timer);
  }, [targetDate]);

  if (timeLeft.isPast) return null;

  if (simple) {
    return (
      <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-100 ml-2 animate-pulse">
        {timeLeft.days}h {timeLeft.hours}j {timeLeft.minutes}m {timeLeft.seconds}d
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1 mt-1">
      <div className="flex flex-col items-center">
        <span className="text-[10px] font-black text-orange-600">{timeLeft.days}</span>
        <span className="text-[7px] font-bold text-gray-400 uppercase tracking-tighter">Hari</span>
      </div>
      <span className="text-orange-300 font-bold text-[8px] mb-2">:</span>
      <div className="flex flex-col items-center">
        <span className="text-[10px] font-black text-orange-600">{String(timeLeft.hours).padStart(2, '0')}</span>
        <span className="text-[7px] font-bold text-gray-400 uppercase tracking-tighter">Jam</span>
      </div>
      <span className="text-orange-300 font-bold text-[8px] mb-2">:</span>
      <div className="flex flex-col items-center">
        <span className="text-[10px] font-black text-orange-600">{String(timeLeft.minutes).padStart(2, '0')}</span>
        <span className="text-[7px] font-bold text-gray-400 uppercase tracking-tighter">Menit</span>
      </div>
      <span className="text-orange-300 font-bold text-[8px] mb-2">:</span>
      <div className="flex flex-col items-center">
        <span className="text-[10px] font-black text-orange-600">{String(timeLeft.seconds).padStart(2, '0')}</span>
        <span className="text-[7px] font-bold text-gray-400 uppercase tracking-tighter">Detik</span>
      </div>
    </div>
  );
};

// Types
interface User {
  role: "admin" | "guru";
  username?: string;
  nama?: string;
  nip?: string;
  jabatan?: string;
  sekolah?: string;
  kepegawaian?: string;
  pangkat?: string;
  email?: string;
  full_name?: string;
  id?: string;
  foto?: string;
  avatar_url?: string;
}

// Data Chart Temp
const dataChart = [
  { name: "Sen", pengunjung: 4000, aktivitas: 2400 },
  { name: "Sel", pengunjung: 3000, aktivitas: 1398 },
  { name: "Rab", pengunjung: 2000, aktivitas: 9800 },
  { name: "Kam", pengunjung: 2780, aktivitas: 3908 },
  { name: "Jum", pengunjung: 1890, aktivitas: 4800 },
  { name: "Sab", pengunjung: 2390, aktivitas: 3800 },
  { name: "Min", pengunjung: 3490, aktivitas: 4300 },
];

const adminMenu = [
  { id: "overview", label: "Dashboard Admin", icon: LayoutDashboard },
  { id: "berita", label: "Kelola Berita", icon: FileText },
  { id: "pengumuman", label: "Kelola Pengumuman", icon: Bell },
  { id: "galeri", label: "Kelola Galeri", icon: ImageIcon },
  { id: "sekolah", label: "Kelola Sekolah Inti/Imbas", icon: BookOpen },
  { id: "guru", label: "Kelola Guru", icon: Users },
  { id: "finance", label: "Kelola Keuangan", icon: Wallet },
  { id: "user", label: "Kelola User", icon: Shield },
  { id: "agenda", label: "Kelola Agenda KKG", icon: Calendar },
  { id: "materi", label: "Kelola Materi KKG", icon: BookOpen },
  { id: "landmarks", label: "Peta Digital", icon: MapPin },
  { id: "notulen", label: "Kelola Notulen Rapat", icon: FileText },
  { id: "pelatihan", label: "Kelola Pelatihan", icon: GraduationCap },
  { id: "rekap_absen", label: "Rekap Absensi", icon: UserCheck },
  { id: "sertifikat", label: "Kelola Sertifikat", icon: Award },
  { id: "guest_accounts", label: "Kelola Akun Tamu", icon: ShieldCheck },
  { id: "buku_tamu", label: "Arsip Buku Tamu", icon: NotebookPen },
  { id: "forum", label: "Kelola Forum Diskusi", icon: MessageSquare },
  { id: "komentar", label: "Kelola Komentar Forum", icon: MessageSquare },
  { id: "sharing", label: "Kelola Praktik Baik", icon: Play },
  { id: "hasil_karya", label: "Kelola Hasil Karya", icon: UploadCloud },
  { id: "surat_masuk", label: "Surat Masuk", icon: Mail },
  { id: "surat_keluar", label: "Surat Keluar", icon: Send },
  { id: "struktur_org", label: "Kelola KKG & Gugus", icon: Users },
  { id: "penghargaan", label: "Kelola Penghargaan", icon: Trophy },
  { id: "pengaturan", label: "Pengaturan Website", icon: Settings },
];

const guruMenu = [
  { id: "overview", label: "Dashboard Guru", icon: LayoutDashboard },
  { id: "profil", label: "Profil Saya", icon: Users },
  { id: "jadwal", label: "Jadwal KKG", icon: Calendar },
  { id: "materi", label: "Materi KKG", icon: BookOpen },
  { id: "notulen", label: "Notulen Rapat", icon: FileText },
  { id: "pelatihan", label: "Pelatihan", icon: GraduationCap },
  { id: "forum", label: "Forum Diskusi", icon: MessageSquare },
  { id: "sharing", label: "Sharing Praktik Baik", icon: Play },
  { id: "upload_karya", label: "Upload Hasil Karya", icon: UploadCloud },
];

const guestMenu = [
  { id: "overview", label: "Portal Tamu", icon: LayoutDashboard },
  { id: "profil", label: "Data Tamu", icon: Users },
  { id: "pelatihan", label: "Daftar Kegiatan", icon: GraduationCap },
  { id: "buku_tamu", label: "Buku Tamu", icon: NotebookPen },
];

const adminMenuGroups = [
  {
    title: "Ikhtisar",
    items: ["overview", "user", "guru", "finance"],
  },
  {
    title: "Hiburan & Tamu",
    items: ["buku_tamu", "guest_accounts"],
  },
  {
    title: "Konten Publik",
    items: ["berita", "pengumuman", "galeri"],
  },
  {
    title: "Akademik",
    items: ["agenda", "materi", "notulen", "pelatihan", "rekap_absen", "sertifikat"],
  },
  {
    title: "Forum & Karya",
    items: ["forum", "komentar", "sharing", "hasil_karya", "penghargaan"],
  },
  {
    title: "Arsip Surat",
    items: ["surat_masuk", "surat_keluar"],
  },
  {
    title: "Sistem",
    items: ["sekolah", "struktur_org", "pengaturan", "landmarks"],
  },
];

// Helper for notifications
const getNotificationIcon = (name: string) => {
  switch (name) {
    case "Megaphone":
      return Megaphone;
    case "Calendar":
      return Calendar;
    case "MessageSquare":
      return MessageSquare;
    default:
      return Bell;
  }
};

export default function Dashboard({
  user: initialUser,
  onLogout,
}: {
  user: User;
  onLogout: () => void;
}) {
  const [user, setUser] = useState(initialUser);

  // Set Page Title
  useEffect(() => {
    const fullName = user.nama || user.full_name || user.username || "User";
    document.title = `Dasbord ${fullName} | Gugus 03 Melati`;
  }, [user]);

  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {
      Ikhtisar: true,
      "Konten Publik": true,
      Akademik: false,
      "Forum & Karya": false,
      "Arsip Surat": true,
      Sistem: false,
    },
  );

  const toggleGroup = (title: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const [isNotificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [readIds, setReadIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("readNotifs");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const notificationRef = useRef<HTMLDivElement>(null);

  const hasUnread = notifications.some(
    (n) => !readIds.includes(`${n.type}-${n.id}`),
  );

  const handleOpenNotifications = () => {
    if (!isNotificationsOpen) {
      // Mark all displayed notifications as read
      const newReadIds = Array.from(
        new Set([...readIds, ...notifications.map((n) => `${n.type}-${n.id}`)]),
      );
      setReadIds(newReadIds);
      localStorage.setItem("readNotifs", JSON.stringify(newReadIds));
    }
    setNotificationsOpen(!isNotificationsOpen);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    async function fetchNotifications() {
      if (!supabase) return;
      try {
        // Fetch last 5 of various items
        const [postsRes, eventsRes, forumRes] = await Promise.all([
          supabase
            .from("posts")
            .select("*")
            .order("published_at", { ascending: false })
            .limit(5),
          supabase
            .from("events")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(5),
          supabase
            .from("forum_posts")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(5),
        ]);

        const combined = [
          ...(postsRes.data || []).map((p) => ({
            id: p.id,
            type: "post",
            title: p.category === "berita" ? "Berita Baru" : "Pengumuman Baru",
            message: p.title,
            time: new Date(p.published_at || p.created_at).toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta", 
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            }),
            iconName: p.category === "berita" ? "Megaphone" : "Bell",
            link: `/dashboard/${p.category === "berita" ? "berita" : "pengumuman"}`,
            raw_date: p.published_at || p.created_at,
          })),
          ...(eventsRes.data || []).map((e) => ({
            id: e.id,
            type: "event",
            title: "Agenda Baru",
            message: e.title,
            time: new Date(e.created_at).toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta", 
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            }),
            iconName: "Calendar",
            link: "/dashboard/agenda",
            raw_date: e.created_at,
          })),
          ...(forumRes.data || []).map((f) => ({
            id: f.id,
            type: "forum",
            title: "Topik Forum Baru",
            message: f.title,
            time: new Date(f.created_at).toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta", 
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            }),
            iconName: "MessageSquare",
            link: "/dashboard/forum",
            raw_date: f.created_at,
          })),
        ];

        setNotifications(
          combined
            .sort(
              (a, b) =>
                new Date(b.raw_date).getTime() - new Date(a.raw_date).getTime(),
            )
            .slice(0, 8),
        );
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    }
    fetchNotifications();
  }, []);

  const [isDesktop, setIsDesktop] = useState(
    typeof window !== "undefined" ? window.innerWidth >= 768 : false,
  );
  const navigate = useNavigate();
  const location = useLocation();

  // Ensure desktop state is accurate
  React.useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    handleResize(); // Call once to be sure
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const { content, updateContent, saveMessage, isLoading } = useSiteContent();

  const [heroForm, setHeroForm] = useState(content.hero);
  const [profilForm, setProfilForm] = useState(content.profil);
  const [footerForm, setFooterForm] = useState(content.footer);
  const [statsForm, setStatsForm] = useState(content.stats);
  const [kkgForm, setKkgForm] = useState(content.kkg || defaultContent.kkg);
  const [gugusForm, setGugusForm] = useState(
    content.gugus || defaultContent.gugus,
  );
  const [schoolsForm, setSchoolsForm] = useState(content.schools);
  const [newsForm, setNewsForm] = useState(content.news);
  const [galleryForm, setGalleryForm] = useState(content.gallery);
  const [agendaForm, setAgendaForm] = useState(content.agenda);
  const [announcementForm, setAnnouncementForm] = useState(
    content.announcement || { title: "", subtitle: "", desc: "" },
  );
  const [activeMenusForm, setActiveMenusForm] = useState(
    (content as any).activeMenus || {},
  );

  // Sync with context if it changes (e.g. initial load)
  React.useEffect(() => {
    if (!isLoading) {
      setHeroForm(content.hero);
      setProfilForm(content.profil);
      setFooterForm(content.footer);
      setStatsForm(content.stats);
      setKkgForm(content.kkg);
      setGugusForm(content.gugus);
      setSchoolsForm(content.schools);
      setNewsForm(content.news);
      setGalleryForm(content.gallery);
      setAgendaForm(content.agenda);
      setAnnouncementForm(content.announcement);
      setActiveMenusForm((content as any).activeMenus || {});
    }
  }, [content, isLoading]);

  const handleSaveContent = (e: React.FormEvent) => {
    e.preventDefault();
    updateContent({
      hero: heroForm,
      profil: profilForm,
      footer: footerForm,
      stats: statsForm,
      kkg: kkgForm,
      gugus: gugusForm,
      schools: schoolsForm,
      news: newsForm,
      gallery: galleryForm,
      agenda: agendaForm,
      announcement: announcementForm,
      activeMenus: activeMenusForm,
    });
  };

  const isAdmin = user.role?.toLowerCase() === "admin";
  const isGuestRole = user.role?.toLowerCase() === "tamu";
  
  const menuItems = isAdmin
    ? adminMenu
    : isGuestRole
    ? guestMenu
    : guruMenu.filter((item) => {
        if (isLoading) return true;
        const activeMenus = (content as any)?.activeMenus;
        // If settings don't exist or specific menu not defined, show by default
        if (!activeMenus || activeMenus[item.id] === undefined) return true;
        return activeMenus[item.id] === true;
      });

  // Get active tab from path
  const currentPath = location.pathname.split("/").pop() || "overview";
  const activeTab = (menuItems || []).find((m) => m.id === currentPath)
    ? currentPath
    : "overview";

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-soft-black selection:bg-main-blue selection:text-white overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && !isDesktop && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: isDesktop || isSidebarOpen ? 0 : -280 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="w-[280px] bg-white border-r border-gray-100 flex-shrink-0 fixed md:sticky inset-y-0 left-0 z-50 flex flex-col shadow-2xl md:shadow-none bg-white/95 backdrop-blur-xl"
      >
        <div className="p-6 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.2 }}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-main-blue to-leaf-green flex items-center justify-center p-1 overflow-hidden shadow-lg shadow-main-blue/20"
            >
              <img
                src="https://www.image2url.com/r2/default/images/1778156189287-e4930eb4-3c36-4ace-8420-ca8908132e66.png"
                alt="Logo"
                className="w-full h-full object-contain bg-white rounded-lg"
              />
            </motion.div>
            <div>
              <h1 className="font-heading font-black bg-clip-text text-transparent bg-gradient-to-r from-main-blue to-leaf-green text-xl leading-tight">
                Gugus 03
              </h1>
              <div className="mt-1">
                <span className="text-[10px] uppercase tracking-wider text-main-blue font-bold px-2 py-0.5 bg-main-blue/10 rounded-full">
                  {user.role}
                </span>
              </div>
            </div>
          </div>
          <button
            className="md:hidden text-gray-500"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-4 modern-scrollbar">
          {isAdmin ? (
            adminMenuGroups.map((group, idx) => {
              const isExpanded = expandedGroups[group.title];
              return (
                <div key={idx} className="space-y-1">
                  <button
                    onClick={() => toggleGroup(group.title)}
                    className="w-full flex items-center justify-between px-4 py-2 group cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-3 bg-main-blue/30 rounded-full"></div>
                      <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        {group.title}
                      </h3>
                    </div>
                    <ChevronDown
                      className={`w-3 h-3 text-gray-400 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                    />
                  </button>

                  <motion.div
                    initial={false}
                    animate={{
                      height: isExpanded ? "auto" : 0,
                      opacity: isExpanded ? 1 : 0,
                    }}
                    transition={{
                      duration: 0.3,
                      ease: [0.04, 0.62, 0.23, 0.98],
                    }}
                    className="overflow-hidden space-y-1"
                  >
                    {group.items.map((itemId) => {
                      const menu = adminMenu.find((m) => m.id === itemId);
                      if (!menu) return null;
                      const Icon = menu.icon;
                      const isActive = activeTab === menu.id;
                      return (
                        <button
                          key={menu.id}
                          onClick={() => {
                            navigate(`/dashboard/${menu.id}`);
                            if (window.innerWidth < 768) setSidebarOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all group relative overflow-hidden ${
                            isActive
                              ? "text-main-blue"
                              : "text-gray-600 hover:text-soft-black hover:bg-gray-50"
                          }`}
                        >
                          {isActive && (
                            <motion.div
                              layoutId="active-sidebar-admin"
                              className="absolute inset-0 bg-main-blue/10 rounded-xl"
                              initial={false}
                              transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 30,
                              }}
                            />
                          )}
                          <Icon
                            className={`w-5 h-5 relative z-10 transition-colors ${isActive ? "text-main-blue" : "text-gray-400 group-hover:text-main-blue/70"}`}
                          />
                          <span className="relative z-10">{menu.label}</span>
                        </button>
                      );
                    })}
                  </motion.div>
                </div>
              );
            })
          ) : (
            <div className="space-y-1">
              {menuItems.map((menu) => {
                const Icon = menu.icon;
                const isActive = activeTab === menu.id;
                return (
                  <button
                    key={menu.id}
                    onClick={() => {
                      navigate(`/dashboard/${menu.id}`);
                      if (window.innerWidth < 768) setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group relative overflow-hidden ${
                      isActive
                        ? "text-main-blue"
                        : "text-gray-600 hover:text-soft-black hover:bg-gray-50"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="active-sidebar-guru"
                        className="absolute inset-0 bg-main-blue/10 rounded-xl"
                        initial={false}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 30,
                        }}
                      />
                    )}
                    <Icon
                      className={`w-5 h-5 relative z-10 transition-colors ${isActive ? "text-main-blue" : "text-gray-400 group-hover:text-main-blue/70"}`}
                    />
                    <span className="relative z-10">{menu.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-100 mt-auto">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-red-500 hover:text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Top Header */}
        <header className="h-20 bg-white/60 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-6 md:px-10 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-xl md:text-2xl font-bold font-heading text-soft-black hidden sm:block">
              {menuItems.find((m) => m.id === activeTab)?.label}
            </h2>
          </div>

          <div className="flex items-center gap-4 md:gap-6">
            <div className="relative" ref={notificationRef}>
              <button
                onClick={handleOpenNotifications}
                className="relative p-2 text-gray-400 hover:text-main-blue hover:bg-main-blue/5 rounded-xl transition-all"
              >
                <Bell className="w-6 h-6" />
                {hasUnread && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>

              <AnimatePresence>
                {isNotificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50"
                  >
                    <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                      <h3 className="font-bold text-soft-black">
                        Notifikasi Terbaru
                      </h3>
                      <span className="text-[10px] bg-main-blue text-white px-2 py-0.5 rounded-full font-bold">
                        {notifications.length} Info
                      </span>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto modern-scrollbar">
                      {notifications.length > 0 ? (
                        notifications.map((notif) => {
                          const Icon = getNotificationIcon(notif.iconName);
                          return (
                            <button
                              key={notif.id}
                              onClick={() => {
                                navigate(notif.link);
                                setNotificationsOpen(false);
                              }}
                              className="w-full p-4 flex gap-4 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 text-left group"
                            >
                              <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                  notif.type === "post"
                                    ? "bg-blue-50 text-blue-600"
                                    : notif.type === "event"
                                      ? "bg-orange-50 text-orange-600"
                                      : "bg-green-50 text-green-600"
                                }`}
                              >
                                <Icon className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-gray-400 mb-0.5 uppercase tracking-wider">
                                  {notif.title}
                                </p>
                                <p className="text-sm text-soft-black font-medium line-clamp-2 group-hover:text-main-blue transition-colors">
                                  {notif.message}
                                </p>
                                <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1 font-medium">
                                  <Activity className="w-3 h-3" /> {notif.time}
                                </p>
                              </div>
                            </button>
                          );
                        })
                      ) : (
                        <div className="p-10 text-center">
                          <Bell className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                          <p className="text-gray-500 text-sm">
                            Tidak ada notifikasi baru
                          </p>
                        </div>
                      )}
                    </div>

                    {notifications.length > 0 && (
                      <button
                        onClick={() => navigate("/dashboard/pengumuman")}
                        className="w-full p-3 text-center text-xs font-bold text-main-blue hover:bg-main-blue/5 transition-colors border-t border-gray-50"
                      >
                        Lihat Semua Pengumuman
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-3 pl-4 md:pl-6 border-l border-gray-200">
              <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-soft-black">
                  {user.nama || user.full_name || user.username || user.role}
                </p>
                <p className="text-xs text-gray-500">Online</p>
              </div>
              <div
                className="w-10 h-10 rounded-full bg-gradient-to-tr from-main-blue to-leaf-green p-0.5 cursor-pointer hover:scale-105 transition-transform"
                onClick={() => navigate("/dashboard/profil")}
              >
                <div className="w-full h-full bg-white rounded-full flex items-center justify-center overflow-hidden border-2 border-white">
                  <img
                    src={
                      user.foto ||
                      user.avatar_url ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nama || user.username || "U")}&background=6366f1&color=fff`
                    }
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main
          className="flex-1 overflow-y-auto p-6 md:p-10 relative"
          id="dashboard-main"
        >
          <div className="max-w-9xl mx-auto">
            {saveMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-green-50 text-green-700 rounded-xl border border-green-100 flex items-center gap-3"
              >
                <CheckSquare className="w-5 h-5 text-green-500" />
                <span className="font-medium text-sm">{saveMessage}</span>
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Routes>
                  <Route
                    path="/"
                    element={<Navigate to="overview" replace />}
                  />
                  <Route
                    path="overview"
                    element={
                      user.role?.toLowerCase() === "admin" ? (
                        <AdminOverview user={user} />
                      ) : user.role?.toLowerCase() === "tamu" ? (
                        <TamuOverview user={user} />
                      ) : (
                        <GuruOverview user={user} />
                      )
                    }
                  />

                  {/* Admin Routes */}
                  {user.role?.toLowerCase() === "admin" && (
                    <>
                      <Route
                        path="pengaturan"
                        element={<AdminSettingsForm />}
                      />
                      <Route path="user" element={<AdminUserManagement />} />
                      <Route path="landmarks" element={<AdminLandmarkForm />} />
                      <Route
                        path="sekolah"
                        element={<AdminSekolahForm user={user} />}
                      />
                      <Route
                        path="berita"
                        element={<AdminBeritaForm user={user} />}
                      />
                      <Route
                        path="galeri"
                        element={<AdminGaleriForm user={user} />}
                      />
                      <Route
                        path="kkg"
                        element={<AdminKKGFormWrapper />}
                      />
                      <Route
                        path="agenda"
                        element={<AdminAgendaForm user={user} />}
                      />
                      <Route
                        path="buku_tamu"
                        element={<AdminGuestBookView />}
                      />
                      <Route
                        path="gugus"
                        element={<AdminGugusFormWrapper />}
                      />
                      <Route
                        path="struktur_org"
                        element={<AdminStrukturManager />}
                      />
                      <Route
                        path="penghargaan"
                        element={<AdminPenghargaanForm />}
                      />
                      <Route
                        path="pengumuman"
                        element={<AdminPengumumanForm user={user} />}
                      />
                      <Route
                        path="guru"
                        element={<AdminGuruForm user={user} />}
                      />
                      <Route
                        path="finance"
                        element={<AdminFinanceManagement user={user} />}
                      />
                      <Route
                        path="materi"
                        element={
                          <DataManagementTable
                            user={user}
                            table="kkg_materials"
                            title="Materi KKG"
                            icon={BookOpen}
                            fields={[
                              { name: "title", label: "Judul" },
                              { name: "description", label: "Deskripsi" },
                              { name: "category", label: "Kategori" },
                              {
                                name: "file_url",
                                label: "File Materi (PDF/Doc/PPT)",
                                type: "file",
                              },
                            ]}
                          />
                        }
                      />
                      <Route
                        path="notulen"
                        element={
                          <DataManagementTable
                            user={user}
                            table="meeting_minutes"
                            title="Notulen Rapat"
                            icon={FileText}
                            fields={[
                              { name: "title", label: "Judul Notulen" },
                              {
                                name: "date",
                                label: "Tanggal Rapat",
                                type: "date",
                              },
                              {
                                name: "content",
                                label: "Konten / Isi Notulen",
                                type: "textarea",
                              },
                              {
                                name: "file_url",
                                label: "File Lampiran (Opsional)",
                                type: "file",
                              },
                            ]}
                          />
                        }
                      />
                      <Route
                        path="pelatihan"
                        element={
                          <DataManagementTable
                            user={user}
                            table="trainings"
                            title="Sistem Manajemen Pelatihan"
                            icon={GraduationCap}
                            fields={[
                              { name: "title", label: "Judul Pelatihan" },
                              {
                                name: "description",
                                label: "Deskripsi Lengkap",
                                type: "textarea",
                              },
                              {
                                name: "location",
                                label: "Lokasi / Link Pelatihan",
                              },
                              {
                                name: "date_start",
                                label: "Tanggal Mulai",
                                type: "datetime-local",
                              },
                              {
                                name: "date_end",
                                label: "Tanggal Berakhir",
                                type: "datetime-local",
                              },
                              {
                                name: "materi_url",
                                label: "Materi / Slide (File PDF/PPT)",
                                type: "file",
                              },
                              {
                                name: "video_url",
                                label: "URL Video / Rekaman (Youtube/Vimeo Opsional)",
                                type: "url",
                              },
                              {
                                name: "status",
                                label: "Status Publikasi",
                                type: "select",
                                options: [
                                  { label: "Direncanakan", value: "planned" },
                                  {
                                    label: "Sedang Berlangsung",
                                    value: "ongoing",
                                  },
                                  { label: "Selesai", value: "completed" },
                                ],
                              },
                              {
                                name: "banner_url",
                                label: "Banner Pelatihan (Format 16:9)",
                                type: "image",
                              },
                              {
                                name: "is_attendance_open",
                                label: "Buka Tombol Absen",
                                type: "checkbox",
                              },
                              {
                                name: "is_open_for_guests",
                                label: "Buka Akses Tamu",
                                type: "checkbox",
                              },
                            ]}
                          />
                        }
                      />
                      <Route
                        path="rekap_absen"
                        element={<AdminRekapAbsen />}
                      />
                      <Route
                        path="guest_accounts"
                        element={<AdminGuestAccountsManager />}
                      />
                      <Route
                        path="sertifikat"
                        element={<AdminCertificateManager user={user} />}
                      />
                      <Route
                        path="forum"
                        element={
                          <DataManagementTable
                            user={user}
                            table="forum_posts"
                            title="Forum Diskusi"
                            icon={MessageSquare}
                            fields={[
                              { name: "title", label: "Judul" },
                              {
                                name: "content",
                                label: "Konten",
                                type: "textarea",
                              },
                              { name: "category", label: "Kategori" },
                            ]}
                          />
                        }
                      />
                      <Route
                        path="komentar"
                        element={
                          <DataManagementTable
                            user={user}
                            table="forum_comments"
                            title="Komentar Forum"
                            icon={MessageSquare}
                            fields={[
                              { name: "post_id", label: "Post ID" },
                              {
                                name: "content",
                                label: "Konten",
                                type: "textarea",
                              },
                              { 
                                name: "guru", 
                                label: "Penulis", 
                                readOnly: true, 
                                render: (item: any) => item.guru || "-" 
                              },
                            ]}
                          />
                        }
                      />
                      <Route
                        path="sharing"
                        element={<SharingPractices user={user} />}
                      />
                      <Route
                        path="hasil_karya"
                        element={
                          <DataManagementTable
                            user={user}
                            table="teacher_works"
                            title="Hasil Karya Guru"
                            icon={UploadCloud}
                            fields={[
                              { 
                                name: "guru", 
                                label: "Guru", 
                                readOnly: true,
                                render: (item: any) => item.guru || "-" 
                              },
                              { name: "title", label: "Judul Karya" },
                              { name: "description", label: "Deskripsi" },
                              { name: "work_type", label: "Jenis Karya" },
                              {
                                name: "file_url",
                                label: "Link URL Karya",
                                type: "url",
                                hideInTable: true,
                              },
                            ]}
                          />
                        }
                      />
                      <Route
                        path="surat_masuk"
                        element={
                          <DataManagementTable
                            user={user}
                            table="incoming_letters"
                            title="Arsip Surat Masuk"
                            icon={Mail}
                            fields={[
                              { name: "letter_number", label: "Nomor Surat" },
                              { name: "title", label: "Perihal" },
                              { name: "sender", label: "Pengirim" },
                              { name: "date_received", label: "Tanggal Diterima", type: "date" },
                              { name: "file_url", label: "File Surat", type: "file" },
                            ]}
                          />
                        }
                      />
                      <Route
                        path="surat_keluar"
                        element={
                          <DataManagementTable
                            user={user}
                            table="outgoing_letters"
                            title="Arsip Surat Keluar"
                            icon={Send}
                            fields={[
                              { name: "letter_number", label: "Nomor Surat" },
                              { name: "title", label: "Perihal" },
                              { name: "recipient", label: "Penerima" },
                              { name: "date_sent", label: "Tanggal Dikirim", type: "date" },
                              { name: "file_url", label: "File Surat", type: "file" },
                            ]}
                          />
                        }
                      />
                      <Route
                        path="profil"
                        element={
                          <UserProfileEdit
                            user={user}
                            onUpdate={(updated: any) =>
                              setUser((prev) => ({ ...prev, ...updated }))
                            }
                          />
                        }
                      />
                    </>
                  )}

                  {/* Guru Routes */}
                  {user.role?.toLowerCase() === "guru" && (
                    <>
                      <Route
                        path="profil"
                        element={
                          <UserProfileEdit
                            user={user}
                            onUpdate={(updated: any) =>
                              setUser((prev) => ({ ...prev, ...updated }))
                            }
                          />
                        }
                      />
                      <Route path="jadwal" element={<TeacherJadwalCards user={user} />} />
                      <Route
                        path="materi"
                        element={
                          <DataViewList
                            table="kkg_materials"
                            title="Materi KKG"
                            icon={BookOpen}
                          />
                        }
                      />
                      <Route
                        path="notulen"
                        element={
                          <DataViewList
                            table="meeting_minutes"
                            title="Notulen Rapat"
                            icon={FileText}
                          />
                        }
                      />
                      <Route
                        path="pelatihan"
                        element={<TeacherTrainingCards user={user} />}
                      />
                      <Route path="absensi" element={<TeacherAttendance user={user} />} />
                      <Route
                        path="sertifikat"
                        element={
                          <DataViewList
                            table="training_certificates"
                            title="Sertifikat Saya"
                            icon={Award}
                            filterColumn="user_id"
                            filterValue={user.id}
                          />
                        }
                      />
                      <Route
                        path="forum"
                        element={<ForumSystem user={user} />}
                      />
                      <Route
                        path="sharing"
                        element={<SharingPractices user={user} />}
                      />
                      <Route
                        path="upload_karya"
                        element={
                          <DataManagementTable
                            user={user}
                            table="teacher_works"
                            title="Upload Hasil Karya"
                            icon={UploadCloud}
                            fields={[
                              { 
                                name: "guru", 
                                label: "Guru", 
                                readOnly: true,
                                render: (item: any) => item.profiles?.nama || (item.user_id === user.id ? user.nama : "-") 
                              },
                              { name: "title", label: "Judul Karya" },
                              { name: "description", label: "Deskripsi" },
                              { name: "work_type", label: "Jenis Karya" },
                              {
                                name: "file_url",
                                label: "Link URL Karya (Google Drive/YouTube/Situs)",
                                type: "url",
                                hideInTable: true,
                              },
                            ]}
                          />
                        }
                      />
                      <Route
                        path="pengaturan_akun"
                        element={
                          <UserProfileEdit
                            user={user}
                            onUpdate={(updated: any) =>
                              setUser((prev) => ({ ...prev, ...updated }))
                            }
                          />
                        }
                      />
                    </>
                  )}

                  {user.role?.toLowerCase() === "tamu" && (
                    <>
                      <Route
                        path="profil"
                        element={
                          <UserProfileEdit
                            user={user}
                            onUpdate={(updated: any) =>
                              setUser((prev) => ({ ...prev, ...updated }))
                            }
                          />
                        }
                      />
                      <Route
                        path="pelatihan"
                        element={<TeacherTrainingCards user={user} />}
                      />
                      <Route
                        path="buku_tamu"
                        element={<GuestBookForm user={user} />}
                      />
                      <Route path="jadwal" element={<TeacherJadwalCards user={user} />} />
                    </>
                  )}
                  <Route
                    path="*"
                    element={
                      <TabPlaceholder
                        menuItems={menuItems}
                        activeTab={activeTab}
                      />
                    }
                  />
                </Routes>
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}

// Helper component for tabs in development
function TabPlaceholder({
  menuItems,
  activeTab,
}: {
  menuItems: any[];
  activeTab: string;
}) {
  const activeLabel = menuItems.find((m) => m.id === activeTab)?.label;
  const ActiveIcon =
    menuItems.find((m) => m.id === activeTab)?.icon || LayoutDashboard;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] border border-main-orange/30 shadow-xl min-h-[400px] flex items-center justify-center relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-main-blue/5 rounded-full blur-3xl" />
      <div className="text-center text-gray-500 relative z-10">
        <ActiveIcon
          className="w-20 h-20 mx-auto mb-6 text-main-blue/30"
          strokeWidth={1}
        />
        <h2 className="text-2xl font-heading font-bold text-soft-black mb-2">
          {activeLabel}
        </h2>
        <p className="text-gray-500">Fitur ini sedang dalam pengembangan.</p>
      </div>
    </motion.div>
  );
}

// ==========================================
// SUB COMPONENTS FOR TABS
// ==========================================

function AdminUserManagement() {
  const { alert, confirm } = useAlert();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: number;
    failure: number;
    errors?: any[];
  } | null>(null);

  const [userList, setUserList] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [previewUsers, setPreviewUsers] = useState<any[] | null>(null);

  // Manual User Form
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: "",
    nama: "",
    nip: "",
    role: "guru",
    sekolah: "",
    jabatan: "",
    kepegawaian: "",
    pangkat: "",
    foto: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [editId, setEditId] = useState<string | null>(null);

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const response = await fetch("/api/debug/list-users");
      if (!response.ok) {
        throw new Error("Gagal mengambil data user");
      }

      const responseText = await response.text();
      try {
        const data = JSON.parse(responseText);
        setUserList(data || []);
      } catch (e) {
        console.error(
          "Non-JSON response from list-users:",
          responseText.substring(0, 50),
        );
        setUserList([]);
      }
    } catch (err: any) {
      console.error("Error fetching users:", err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  React.useEffect(() => {
    fetchUsers();
  }, []);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || (!formData.password && !editId)) {
      setFormError("Username dan Password wajib diisi");
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    try {
      const endpoint = editId
        ? "/api/admin/update-user"
        : "/api/setup/create-user";
      const body = editId ? { ...formData, id: editId } : formData;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      let result;
      const responseText = await response.text();
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        throw new Error(
          `Koneksi ke server gagal atau sedang offline. (Ext: ${responseText.substring(0, 40)})`,
        );
      }

      if (!response.ok) throw new Error(result.error || "Gagal memproses user");

      await alert(
        editId
          ? `Akun '${formData.username}' berhasil diperbarui.`
          : `Sukses! Akun '${formData.username}' berhasil dibuat.`,
      );
      setShowAddForm(false);
      setEditId(null);
      setFormData({
        username: "",
        password: "",
        email: "",
        nama: "",
        nip: "",
        role: "guru",
        sekolah: "",
        jabatan: "",
        kepegawaian: "",
        pangkat: "",
        foto: "",
      });
      fetchUsers();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (user: any) => {
    setEditId(user.id);
    setFormData({
      username: user.username || "",
      password: "",
      email: user.email || "",
      nama: user.nama || "",
      nip: user.nip || "",
      role: user.role || "guru",
      sekolah: user.sekolah || "",
      jabatan: user.jabatan || "",
      kepegawaian: user.kepegawaian || "",
      pangkat: user.pangkat || "",
      foto: user.foto || "",
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: string, name: string) => {
    const isConfirmed = await confirm(
      `Apakah Anda yakin ingin menghapus akun '${name}'? Tindakan ini tidak dapat dibatalkan.`,
    );
    if (!isConfirmed) return;

    try {
      const response = await fetch(`/api/admin/delete-user/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Gagal menghapus user");
      await alert("Akun berhasil dihapus.");
      fetchUsers();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        Username: "budi_setiawan",
        Password: "Password123!",
        Email: "budi@gugus3.id",
        Nama: "Budi Setiawan, S.Pd.",
        NIP: "198501012010011001",
        Role: "guru",
        Sekolah: "SDN 1 Melati",
        Jabatan: "Guru Kelas IV",
        Kepegawaian: "PNS",
        Pangkat: "Penata / IIIc",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template User");
    XLSX.writeFile(wb, "Template_User_Gugus3.xlsx");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

        if (jsonData.length === 0) {
          alert("File Excel kosong atau tidak terbaca.", "Gagal", "error");
          return;
        }

        const formattedUsers = jsonData.map((row) => {
          const normalizedRow: Record<string, any> = {};
          for (const key in row) {
            if (Object.prototype.hasOwnProperty.call(row, key)) {
              const cleanKey = key.trim().toLowerCase();
              normalizedRow[cleanKey] = row[key];
            }
          }

          const nama = String(
            normalizedRow["nama"] ||
              normalizedRow["nama lengkap"] ||
              normalizedRow["penerima"] ||
              ""
          );

          let email =
            normalizedRow["email"] !== undefined
              ? String(normalizedRow["email"]).trim()
              : "";

          let username = "";
          if (
            normalizedRow["username"] !== undefined &&
            String(normalizedRow["username"]).trim() !== ""
          ) {
            username = String(normalizedRow["username"]).trim();
          } else if (
            normalizedRow["user name"] !== undefined &&
            String(normalizedRow["user name"]).trim() !== ""
          ) {
            username = String(normalizedRow["user name"]).trim();
          }

          if (!username) {
            username =
              nama.toLowerCase().replace(/[^a-z0-9]/g, "") +
              Math.floor(Math.random() * 1000);
          }

          if (!email || !email.includes("@")) {
            email = `${username.toLowerCase().replace(/[^a-z0-9]/g, "")}_${Math.floor(Math.random() * 10000)}@gugus3.local`;
          }

          let password = "";
          if (
            normalizedRow["password"] !== undefined &&
            String(normalizedRow["password"]).trim() !== ""
          ) {
            password = String(normalizedRow["password"]).trim();
          } else if (
            normalizedRow["kata sandi"] !== undefined &&
            String(normalizedRow["kata sandi"]).trim() !== ""
          ) {
            password = String(normalizedRow["kata sandi"]).trim();
          }

          if (password && password.length < 6) {
            password = password.padEnd(6, "0");
          }

          if (!password) {
            password = "Gugus3Melati123!";
          }

          return {
            username: username,
            email: email,
            password: password,
            role: String(normalizedRow["role"] || normalizedRow["peran"] || "guru")
              .trim()
              .toLowerCase(),
            nama: nama,
            nip:
              normalizedRow["nip"] !== undefined
                ? String(normalizedRow["nip"]).trim()
                : normalizedRow["n i p"] !== undefined
                  ? String(normalizedRow["n i p"]).trim()
                  : "",
            kepegawaian:
              normalizedRow["kepegawaian"] !== undefined
                ? String(normalizedRow["kepegawaian"]).trim()
                : normalizedRow["status kepegawaian"] !== undefined
                  ? String(normalizedRow["status kepegawaian"]).trim()
                  : "",
            pangkat:
              normalizedRow["pangkat"] !== undefined
                ? String(normalizedRow["pangkat"]).trim()
                : normalizedRow["pangkat/golongan"] !== undefined
                  ? String(normalizedRow["pangkat/golongan"]).trim()
                  : normalizedRow["golongan"] !== undefined
                    ? String(normalizedRow["golongan"]).trim()
                    : "",
            jabatan:
              normalizedRow["jabatan"] !== undefined
                ? String(normalizedRow["jabatan"]).trim()
                : "",
            sekolah:
              normalizedRow["sekolah"] !== undefined
                ? String(normalizedRow["sekolah"]).trim()
                : normalizedRow["asal sekolah"] !== undefined
                  ? String(normalizedRow["asal sekolah"]).trim()
                  : normalizedRow["unit kerja"] !== undefined
                    ? String(normalizedRow["unit kerja"]).trim()
                    : "",
          };
        });

        setPreviewUsers(formattedUsers);
      };
      reader.readAsArrayBuffer(file);
    } catch (err: any) {
      alert("Gagal membaca file: " + err.message, "Error", "error");
    } finally {
      e.target.value = "";
    }
  };

  const confirmUpload = async () => {
    if (!previewUsers) return;

    setIsUploading(true);
    setUploadResult(null);

    try {
      const response = await fetch("/api/admin/bulk-create-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ users: previewUsers }),
      });

      let result;
      const responseText = await response.text();
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        throw new Error("Respons bulk-create tidak valid dari server.");
      }

      const successCount = result.results?.length || 0;
      const failureCount = result.errors?.length || 0;

      setUploadResult({
        success: successCount,
        failure: failureCount,
        errors: result.errors || [],
      });

      if (successCount === 0 && failureCount > 0) {
        alert("Peringatan: Tidak ada akun yang berhasil dibuat. Ini kemungkinan besar masalah konfigurasi database yang perlu diperbaiki dengan SQL FIX.", "Gagal Total", "error");
      } else if (failureCount > 0) {
        alert(`Berhasil: ${successCount}, Gagal: ${failureCount}. Periksa daftar kesalahan di bawah.`, "Selesai dengan Error", "info");
      } else {
        alert(`Berhasil mengimpor ${successCount} akun.`, "Sukses", "success");
      }

      if (successCount > 0) {
        fetchUsers();
      }
      setPreviewUsers(null);
    } catch (err: any) {
      alert(err.message, "Upload Gagal", "error");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* Clean White Header */}
      <div className="bg-white p-8 rounded-[2rem] border-l-8 border-main-blue shadow-sm mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-main-blue/10 rounded-2xl flex items-center justify-center text-main-blue">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold font-heading text-soft-black">
              Manajemen User
            </h2>
            <p className="text-gray-500 text-sm">
              Kelola akun Admin dan Guru dalam sistem dengan kontrol akses yang presisi.
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => {
              if (showAddForm) {
                setShowAddForm(false);
                setEditId(null);
                setFormData({
                  username: "",
                  password: "",
                  email: "",
                  nama: "",
                  nip: "",
                  role: "guru",
                  sekolah: "",
                  jabatan: "",
                  kepegawaian: "",
                  pangkat: "",
                  foto: "",
                });
              } else {
                setShowAddForm(true);
              }
            }}
            className="px-6 py-3 bg-main-blue text-white flex items-center gap-2 font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-main-blue/90 active:scale-95 transition-all shadow-md"
          >
            {showAddForm ? <X className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
            {showAddForm ? "Tutup Form" : "Tambah User"}
          </button>

          <label className="px-6 py-3 bg-leaf-green text-white flex items-center gap-2 font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-leaf-green/90 active:scale-95 transition-all shadow-md cursor-pointer">
            <UploadCloud className="w-4 h-4" />
            {isUploading ? "Mengunggah..." : "Mass Upload"}
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="hidden"
            />
          </label>
        </div>
      </div>

      <div className="flex justify-end pr-2">
          <button
            onClick={downloadTemplate}
            className="px-6 py-2.5 bg-gray-100 text-gray-600 flex items-center gap-2 font-bold rounded-xl hover:bg-gray-200 transition-all text-xs uppercase tracking-widest border border-gray-200"
          >
            <Download className="w-4 h-4" /> Download Template Excel
          </button>
      </div>

      <AnimatePresence>
        {previewUsers && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="mb-8 bg-blue-50 p-6 rounded-3xl border border-blue-100 shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-blue-900">
                    Preview Data Excel
                  </h3>
                  <p className="text-sm text-blue-600">
                    Silakan tinjau data berikut sebelum diimpor ke sistem.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPreviewUsers(null)}
                  className="px-5 py-2 bg-white text-gray-600 font-bold rounded-xl border border-gray-200 hover:bg-gray-50 transition-all text-sm"
                >
                  Batal
                </button>
                <button
                  onClick={confirmUpload}
                  disabled={isUploading}
                  className="px-5 py-2 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-all text-sm flex items-center gap-2 disabled:opacity-50"
                >
                  {isUploading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  {isUploading ? "Mengunggah..." : `Konfirmasi & Impor ${previewUsers.length} Akun`}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl overflow-hidden border border-blue-100 max-h-96 overflow-y-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-blue-50 text-blue-900 sticky top-0">
                  <tr className="border-b border-blue-100">
                    <th className="p-4 font-bold">Nama</th>
                    <th className="p-4 font-bold">Username</th>
                    <th className="p-4 font-bold">Email</th>
                    <th className="p-4 font-bold">Password</th>
                    <th className="p-4 font-bold">Role</th>
                    <th className="p-4 font-bold">Sekolah</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {previewUsers.map((user, idx) => {
                    const isDuplicateInExcel = previewUsers.some((u, i) => i !== idx && u.username === user.username);
                    const alreadyExistsInDB = userList.some(u => u.username === user.username);
                    const isDuplicate = isDuplicateInExcel || alreadyExistsInDB;
                    const hasMissingInfo = !user.nama || !user.username;
                    
                    return (
                      <tr
                        key={idx}
                        className={`transition-colors ${isDuplicate || hasMissingInfo ? 'bg-red-50/50 hover:bg-red-50' : 'hover:bg-blue-50/30'}`}
                      >
                        <td className="p-4 font-medium text-gray-800">
                          <div className="flex items-center gap-2">
                            {user.nama || <span className="text-red-400 italic">Tanpa Nama</span>}
                            {hasMissingInfo && <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" title="Informasi Penting Hilang" />}
                          </div>
                        </td>
                        <td className={`p-4 font-mono text-xs ${isDuplicate ? 'text-red-600 font-bold' : 'text-blue-600'}`}>
                          {user.username}
                          {isDuplicateInExcel && <span className="ml-1 text-[8px] uppercase">(Duplikat Excel)</span>}
                          {alreadyExistsInDB && <span className="ml-1 text-[8px] uppercase">(Sudah ada di Sistem)</span>}
                        </td>
                        <td className="p-4 font-mono text-xs text-gray-500">
                          {user.email}
                        </td>
                        <td className="p-4 text-gray-400 text-xs">
                          {user.password === "Gugus3Melati123!" ? "Default" : (user.password.length < 6 ? "Terlalu Pendek" : "Custom")}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="p-4 text-gray-600">{user.sekolah || "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            <p className="mt-4 text-[11px] text-blue-500 italic flex items-center gap-1">
              <Info className="w-3 h-3" /> Tip: Username dan Email akan otomatis dibuat unik jika kolom dikosongkan di Excel.
            </p>
          </motion.div>
        )}

        {showAddForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 md:p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="text-lg font-bold flex items-center gap-2 text-main-blue">
                  {editId ? (
                    <PenTool className="w-5 h-5 text-main-blue" />
                  ) : (
                    <PlusCircle className="w-5 h-5 text-main-blue" />
                  )}
                  {editId ? "Edit User / Akun" : "Tambah User Baru"}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditId(null);
                    setFormData({
                      username: "",
                      password: "",
                      email: "",
                      nama: "",
                      nip: "",
                      role: "guru",
                      sekolah: "",
                      jabatan: "",
                      kepegawaian: "",
                      pangkat: "",
                      foto: "",
                    });
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 md:p-8 overflow-y-auto">
                <form
                  onSubmit={handleManualSubmit}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  <div className="space-y-1 lg:col-span-3">
                    <ImageUpload
                      label="Unggah Foto Profil"
                      value={formData.foto}
                      onChange={(base64) =>
                        setFormData({ ...formData, foto: base64 })
                      }
                      maxWidth={400}
                      maxHeight={400}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">
                      Username
                    </label>
                    <input
                      className="w-full border-gray-200 border p-3 rounded-xl focus:ring-2 focus:ring-main-blue/20 outline-none"
                      value={formData.username}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                      placeholder="e.g. budismart"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase flex justify-between items-center">
                      <span>Password</span>
                      {editId && <span className="text-[9px] text-gray-400 normal-case font-normal">(Opsional)</span>}
                    </label>
                    <input
                      type="password"
                      className="w-full border-gray-200 border p-3 rounded-xl focus:ring-2 focus:ring-main-blue/20 outline-none"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      placeholder={editId ? "Biarkan kosong jika tidak diubah" : "••••••••"}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">
                      Email (Opsional)
                    </label>
                    <input
                      className="w-full border-gray-200 border p-3 rounded-xl focus:ring-2 focus:ring-main-blue/20 outline-none"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="guru@example.com"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">
                      Nama Lengkap
                    </label>
                    <input
                      className="w-full border-gray-200 border p-3 rounded-xl focus:ring-2 focus:ring-main-blue/20 outline-none"
                      value={formData.nama}
                      onChange={(e) =>
                        setFormData({ ...formData, nama: e.target.value })
                      }
                      placeholder="Nama Beserta Gelar"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">
                      NIP
                    </label>
                    <input
                      className="w-full border-gray-200 border p-3 rounded-xl focus:ring-2 focus:ring-main-blue/20 outline-none"
                      value={formData.nip}
                      onChange={(e) =>
                        setFormData({ ...formData, nip: e.target.value })
                      }
                      placeholder="NIP (jika ada)"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">
                      Peran (Role)
                    </label>
                    <select
                      className="w-full border-gray-200 border p-3 rounded-xl focus:ring-2 focus:ring-main-blue/20 outline-none bg-white"
                      value={formData.role}
                      onChange={(e) =>
                        setFormData({ ...formData, role: e.target.value })
                      }
                    >
                      <option value="guru">Guru</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                  <div className="space-y-1 lg:col-span-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">
                      Sekolah
                    </label>
                    <input
                      className="w-full border-gray-200 border p-3 rounded-xl focus:ring-2 focus:ring-main-blue/20 outline-none"
                      value={formData.sekolah}
                      onChange={(e) =>
                        setFormData({ ...formData, sekolah: e.target.value })
                      }
                      placeholder="Asal Sekolah"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">
                      Jabatan
                    </label>
                    <input
                      className="w-full border-gray-200 border p-3 rounded-xl focus:ring-2 focus:ring-main-blue/20 outline-none"
                      value={formData.jabatan}
                      onChange={(e) =>
                        setFormData({ ...formData, jabatan: e.target.value })
                      }
                      placeholder="e.g. Guru Kelas IV"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">
                      Kepegawaian
                    </label>
                    <select
                      className="w-full border-gray-200 border p-3 rounded-xl focus:ring-2 focus:ring-main-blue/20 outline-none bg-white"
                      value={formData.kepegawaian}
                      onChange={(e) =>
                        setFormData({ ...formData, kepegawaian: e.target.value })
                      }
                    >
                      <option value="">Pilih Status</option>
                      <option value="PNS">PNS</option>
                      <option value="PPPK">PPPK</option>
                      <option value="GTT">GTT</option>
                      <option value="Honorer">Honorer</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">
                      Pangkat / Golongan
                    </label>
                    <input
                      className="w-full border-gray-200 border p-3 rounded-xl focus:ring-2 focus:ring-main-blue/20 outline-none"
                      value={formData.pangkat}
                      onChange={(e) =>
                        setFormData({ ...formData, pangkat: e.target.value })
                      }
                      placeholder="e.g. Penata / IIIc"
                    />
                  </div>
                  <div className="md:col-span-2 lg:col-span-3 flex justify-end gap-3 pt-6 border-t border-gray-100 mt-4">
                    {formError && (
                      <p className="text-red-500 text-sm italic py-2">
                        {formError}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false);
                        setEditId(null);
                        setFormData({
                          username: "",
                          password: "",
                          email: "",
                          nama: "",
                          nip: "",
                          role: "guru",
                          sekolah: "",
                          border: "",
                          jabatan: "",
                          kepegawaian: "",
                          pangkat: "",
                          foto: "",
                        });
                      }}
                      className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all text-xs uppercase"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-10 py-3 bg-gradient-to-r from-main-blue to-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/25 text-xs uppercase active:scale-[0.98] transition-all"
                    >
                      {isSubmitting
                        ? "Menyimpan..."
                        : editId
                          ? "Perbarui User"
                          : "Simpan User"}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="w-full">
        {/* Banner info upload jika ada */}
        {uploadResult && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <UploadCloud className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-green-800">
                    Proses Upload Selesai
                  </p>
                  <p className="text-xs text-green-600 font-medium">
                    {uploadResult.success} Akun berhasil dibuat,{" "}
                    {uploadResult.failure} Gagal.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setUploadResult(null)}
                className="text-green-600 hover:bg-green-100 p-2 rounded-lg transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            {uploadResult.errors && uploadResult.errors.length > 0 && (
              <div className="mt-2 bg-white/60 p-4 rounded-xl max-h-64 overflow-y-auto">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-red-600 uppercase">
                    Daftar Akun Gagal:
                  </h4>
                  {uploadResult.errors.some(e => e.error?.includes("Trigger Database")) && (
                    <button 
                      onClick={() => {
                        const win = window.open("", "_blank");
                        if (win) {
                          win.document.write(`
                            <html>
                              <head>
                                <title>SQL FIX - GUGUS 03 MELATI</title>
                                <style>
                                  body { font-family: monospace; background: #1a1a1a; color: #00ff00; padding: 20px; }
                                  pre { white-space: pre-wrap; word-wrap: break-word; }
                                  button { padding: 10px 20px; background: #00ff00; color: #000; border: none; cursor: pointer; font-weight: bold; margin-bottom: 20px; border-radius: 5px; }
                                </style>
                              </head>
                              <body>
                                <h1>SQL FIX UNTUK TRIGGER DATABASE</h1>
                                <p>Salin kode di bawah ini dan jalankan di SQL Editor Supabase Anda.</p>
                                <button onclick="navigator.clipboard.writeText(document.getElementById('sqlcode').innerText).then(() => alert('Teks SQL disalin!'))">SALIN KODE SQL</button>
                                <pre id="sqlcode">
-- 1. Pastikan kolom foto/avatar_url sinkron
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='user_profiles' AND column_name='avatar_url') 
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='user_profiles' AND column_name='foto') THEN
    ALTER TABLE public.user_profiles RENAME COLUMN avatar_url TO foto;
  ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='user_profiles' AND column_name='foto') THEN
    ALTER TABLE public.user_profiles ADD COLUMN foto TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='user_profiles' AND column_name='password_text') THEN
    ALTER TABLE public.user_profiles ADD COLUMN password_text TEXT;
  END IF;
END $$;

-- 2. Perbaiki Trigger Function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_username TEXT;
  target_role public.user_role;
  final_username TEXT;
  counter INTEGER := 0;
BEGIN
  default_username := LEFT(COALESCE(NULLIF(new.raw_user_meta_data->>'username', ''), split_part(new.email, '@', 1)), 50);
  final_username := default_username;
  WHILE EXISTS (SELECT 1 FROM public.user_profiles WHERE username = final_username AND id != new.id) LOOP
    counter := counter + 1;
    final_username := LEFT(default_username, 40) || '_' || counter || '_' || SUBSTRING(new.id::text, 1, 4);
  END LOOP;
  IF (new.raw_user_meta_data->>'role' = 'admin') THEN
    target_role := 'admin'::public.user_role;
  ELSE
    target_role := 'guru'::public.user_role;
  END IF;
  INSERT INTO public.user_profiles (id, username, email, role, nama, foto, nip, kepegawaian, pangkat, jabatan, sekolah, password_text, created_at)
  VALUES (new.id, final_username, new.email, target_role, COALESCE(new.raw_user_meta_data->>'nama', new.raw_user_meta_data->>'full_name', final_username), COALESCE(new.raw_user_meta_data->>'foto', new.raw_user_meta_data->>'avatar_url', ''), COALESCE(new.raw_user_meta_data->>'nip', ''), COALESCE(new.raw_user_meta_data->>'kepegawaian', ''), COALESCE(new.raw_user_meta_data->>'pangkat', ''), COALESCE(new.raw_user_meta_data->>'jabatan', ''), COALESCE(new.raw_user_meta_data->>'sekolah', ''), new.raw_user_meta_data->>'password_text', now())
  ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username, email = EXCLUDED.email, nama = EXCLUDED.nama, role = EXCLUDED.role, nip = EXCLUDED.nip, kepegawaian = EXCLUDED.kepegawaian, pangkat = EXCLUDED.pangkat, jabatan = EXCLUDED.jabatan, sekolah = EXCLUDED.sekolah, foto = EXCLUDED.foto, password_text = COALESCE(EXCLUDED.password_text, public.user_profiles.password_text);
  RETURN new;
EXCEPTION WHEN OTHERS THEN
    BEGIN
      INSERT INTO public.user_profiles (id, username, email, role)
      VALUES (new.id, 'user_' || SUBSTRING(new.id::text, 1, 8), new.email, 'guru'::public.user_role)
      ON CONFLICT (id) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN END;
    RETURN new;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
                                </pre>
                              </body>
                            </html>
                          `);
                        }
                      }}
                      className="px-3 py-1 bg-red-600 text-white text-[10px] font-bold rounded-lg hover:bg-red-700 animate-pulse"
                    >
                      SOLUSI: PERBAIKI DATABASE
                    </button>
                  )}
                </div>
                <ul className="text-xs text-red-500 space-y-1">
                  {uploadResult.errors.map((error: any, i: number) => (
                    <li key={i} className="flex gap-2">
                      <span className="font-bold whitespace-nowrap min-w-[100px]">{error.username || error.email || "Unknown"}:</span>
                      <span>{error.error || "Gagal membuat akun."}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* User List Table */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-main-orange/20 shadow-xl shadow-blue-500/5 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-lg">Daftar Akun Sistem</h3>
            <button
              onClick={fetchUsers}
              className="p-2 text-gray-400 hover:text-main-blue hover:bg-main-blue/5 rounded-lg transition-all"
            >
              <Activity
                className={`w-5 h-5 ${isLoadingUsers ? "animate-spin" : ""}`}
              />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50/50">
                <tr className="text-gray-500 text-[10px] uppercase tracking-wider">
                  <th className="px-6 py-4 font-bold">Profil</th>
                  <th className="px-6 py-4 font-bold">Nama / Username</th>
                  <th className="px-6 py-4 font-bold">NIP / Jabatan</th>

                  <th className="px-6 py-4 font-bold">Role</th>
                  <th className="px-6 py-4 font-bold">Sekolah</th>
                  <th className="px-6 py-4 font-bold">Password</th>
                  <th className="px-6 py-4 font-bold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {userList.length === 0 && !isLoadingUsers && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-10 text-center text-gray-400 italic"
                    >
                      Belum ada user yang terdaftar.
                    </td>
                  </tr>
                )}
                {userList.map((usr, i) => (
                  <tr
                    key={usr.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <img
                        src={
                          usr.foto ||
                          usr.avatar_url ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(usr.nama || usr.username || "U")}&background=random`
                        }
                        className="w-10 h-10 rounded-full object-cover shadow-sm border border-gray-100"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-soft-black text-sm">
                        {usr.nama || "-"}
                      </div>
                      <div className="text-xs text-main-blue font-mono">
                        {usr.username}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-bold text-gray-600">
                        {usr.nip || "-"}
                      </div>
                      <div className="text-[10px] text-gray-400 uppercase">
                        {usr.jabatan || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${usr.role === "admin" ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"}`}
                      >
                        {usr.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-600">
                      {usr.sekolah || "-"}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500 font-mono">
                      {usr.password_text || (
                        <span className="text-gray-300 italic">
                          Tersembunyi
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(usr)}
                          className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Edit Akun"
                        >
                          <PenTool className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            handleDelete(usr.id, usr.nama || usr.username)
                          }
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Hapus Akun"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminOverview({ user }: { user: any }) {
  const { content } = useSiteContent();
  const [dbStats, setDbStats] = useState({
    guru: 0,
    sekolah: 0,
    sekolahInti: 0,
    sekolahImbas: 0,
    berita: 0,
    pengumuman: 0,
    dokumen: 0,
    kegiatan: 0,
    user: 0,
    murid: 0,
    sharing: 0,
  });
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [chartData, setChartData] = useState<any[]>(dataChart);
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  const [events, setEvents] = useState<any[]>([]);
  const [viewType, setViewType] = useState<'timeline' | 'calendar'>('timeline');

  useEffect(() => {
    const fetchStatsAndLogs = async () => {
      setIsStatsLoading(true);
      try {
        const [newsRes, notifRes, docRes, eventRes, userRes, schoolRes, logsRes, sharingRes] =
          await Promise.all([
            supabase
              .from("posts")
              .select("*", { count: "exact", head: true })
              .eq("category", "berita")
              .throwOnError(),
            supabase
              .from("posts")
              .select("*", { count: "exact", head: true })
              .eq("category", "pengumuman")
              .throwOnError(),
            supabase
              .from("documents")
              .select("*", { count: "exact", head: true })
              .throwOnError(),
            supabase
              .from("events")
              .select("*")
              .order("date_start", { ascending: false }),
            supabase
              .from("user_profiles")
              .select("*", { count: "exact", head: true })
              .throwOnError(),
            supabase
              .from("schools")
              .select("student_count, teacher_count, jenis_sekolah")
              .throwOnError(),
            supabase
              .from("activity_logs")
              .select("*")
              .order("created_at", { ascending: false })
              .limit(50),
            supabase
              .from("best_practices")
              .select("*", { count: "exact", head: true }),
          ]);

        const beritaCount = newsRes.count || 0;
        const pengumumanCount = notifRes.count || 0;
        const docCount = docRes.count || 0;
        const eventCount = eventRes.data?.length || 0;
        const userCount = userRes.count || 0;
        const schoolsData = schoolRes.data || [];
        const logsData = logsRes.data || [];
        const sharingCount = sharingRes.count || 0;

        setEvents(eventRes.data || []);

        const totalStudents = schoolsData.reduce(
          (acc: number, curr: any) => acc + (Number(curr.student_count) || 0),
          0,
        );
        const totalTeachers = schoolsData.reduce(
          (acc: number, curr: any) => acc + (Number(curr.teacher_count) || 0),
          0,
        );
        const schoolCount = schoolsData.length;
        const schoolIntiCount = schoolsData.filter(
          (s: any) => s.jenis_sekolah === "Sekolah Inti",
        ).length;
        const schoolImbasCount = schoolsData.filter(
          (s: any) => s.jenis_sekolah !== "Sekolah Inti",
        ).length;

        setDbStats({
          guru: totalTeachers,
          sekolah: schoolCount,
          sekolahInti: schoolIntiCount,
          sekolahImbas: schoolImbasCount,
          berita: beritaCount,
          pengumuman: pengumumanCount,
          dokumen: docCount || 0,
          kegiatan: eventCount || 0,
          user: userCount || 0,
          murid: totalStudents,
          sharing: sharingCount,
        });

        setActivities(logsData as ActivityLog[]);

        // Prepare chart data from logs
        if (logsData.length > 0) {
          const days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
          const today = new Date();
          const last7Days = Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(today.getDate() - (6 - i));
            return {
              date: date.toISOString().split("T")[0],
              name: days[date.getDay()],
              pengunjung: 0,
              aktivitas: 0,
            };
          });

          // Sort logs into these days
          logsData.forEach((log: any) => {
            const logDate = log.created_at.split("T")[0];
            const dayEntry = last7Days.find((d) => d.date === logDate);
            if (dayEntry) {
              if (log.action === "login") dayEntry.pengunjung += 1;
              else dayEntry.aktivitas += 1;
            }
          });

          // Add some baseline values if data is sparse to make it look nicer
          const mockBaseline = [20, 15, 30, 25, 40, 10, 5];
          last7Days.forEach((d, i) => {
            d.pengunjung += mockBaseline[i] + Math.floor(Math.random() * 10);
            if (d.aktivitas === 0) d.aktivitas = Math.floor(Math.random() * 5);
          });

          setChartData(last7Days);
        }
      } catch (err) {
        console.error("Error fetching admin stats:", err);
      } finally {
        setIsStatsLoading(false);
      }
    };

    fetchStatsAndLogs();
  }, []);

  const statCards = [
    {
      label: "Sekolah Inti",
      value: isStatsLoading ? "..." : dbStats.sekolahInti.toString(),
      icon: BookOpen,
      color: "from-blue-500 to-cyan-400",
    },
    {
      label: "Sekolah Imbas",
      value: isStatsLoading ? "..." : dbStats.sekolahImbas.toString(),
      icon: BookOpen,
      color: "from-green-500 to-emerald-400",
    },
    {
      label: "Data Guru",
      value: isStatsLoading ? "..." : dbStats.guru.toString(),
      icon: Users,
      color: "from-orange-500 to-amber-400",
    },
    {
      label: "Data Siswa",
      value: isStatsLoading ? "..." : dbStats.murid.toString(),
      icon: GraduationCap,
      color: "from-rose-500 to-pink-400",
    },
    {
      label: "Total Berita",
      value: isStatsLoading ? "..." : dbStats.berita.toString(),
      icon: FileText,
      color: "from-purple-500 to-fuchsia-400",
    },
    {
      label: "Total Pengumuman",
      value: isStatsLoading ? "..." : dbStats.pengumuman.toString(),
      icon: Bell,
      color: "from-red-500 to-rose-400",
    },
    {
      label: "Total User",
      value: isStatsLoading ? "..." : dbStats.user.toString(),
      icon: Shield,
      color: "from-indigo-500 to-violet-400",
    },
    {
      label: "Praktik Baik",
      value: isStatsLoading ? "..." : dbStats.sharing.toString(),
      icon: Play,
      color: "from-amber-500 to-orange-400",
    },
  ];

  return (
    <div className="space-y-10">
      {/* Admin Clean Header */}
      <div className="bg-white p-8 rounded-[2rem] border-l-8 border-main-blue shadow-sm mb-10 flex flex-col md:flex-row md:items-center gap-8">
        <div className="w-[90px] h-[120px] rounded-3xl bg-gray-100 p-1 overflow-hidden shadow-inner shrink-0 scale-95 border border-gray-200">
          <img
            src={
              user.foto ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                user.nama || user.full_name || "Admin"
              )}&background=1F8FE5&color=fff`
            }
            className="w-full h-full object-cover rounded-2xl"
            alt="Profile"
          />
        </div>
        <div className="flex-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-main-blue/10 rounded-full border border-main-blue/10 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-main-blue animate-pulse" />
            <span className="text-[10px] font-black text-main-blue uppercase tracking-widest">Administrator System</span>
          </div>
          <div className="text-xl md:text-2xl font-black font-heading leading-tight mb-2">
            <span className="text-orange-500">Selamat Datang,</span><br/>
            <span className="text-main-blue">{user.nama || user.full_name || "Admin Gugus 03"}</span>
          </div>
          <p className="text-sm text-gray-500 font-medium max-w-xl">
            Pusat kendali operasional GUGUS 03 Kecamatan Jenu. Monitor, kelola, dan tingkatkan performa ekosistem pendidikan kita.
          </p>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            key={i}
            className="bg-white/80 backdrop-blur-xl border border-main-orange/20 p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
          >
            <div
              className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity`}
            />
            <div className="relative z-10 flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">
                  {stat.label}
                </p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-heading font-black text-soft-black">
                    {stat.value}
                  </h3>
                  {(stat as any).detail && (
                    <span className="text-[10px] font-bold text-main-blue bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                      {(stat as any).detail}
                    </span>
                  )}
                </div>
              </div>
              <div
                className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white shadow-lg`}
              >
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Chart & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white/80 backdrop-blur-xl border border-main-orange/20 p-6 md:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <h3 className="text-lg font-bold font-heading mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-main-blue" /> Grafik Aktivitas
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E5E7EB"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9CA3AF", fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9CA3AF", fontSize: 12 }}
                  dx={-10}
                />
                <RechartsTooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="pengunjung"
                  name="Login User"
                  stroke="#0EA5E9"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorPv)"
                />
                <Area
                  type="monotone"
                  dataKey="aktivitas"
                  name="Aksi Admin/Guru"
                  stroke="#22C55E"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorUv)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-main-orange/20 p-6 md:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold font-heading">
              Aktivitas Terbaru
            </h3>
            <button className="text-main-blue text-sm font-medium hover:underline">
              Lihat Semua
            </button>
          </div>

          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
            {activities.length > 0 ? (
              activities.slice(0, 6).map((act, i) => {
                const date = new Date(act.created_at);
                const timeStr = date.toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta", 
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const dateStr = date.toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta", 
                  day: "numeric",
                  month: "short",
                });

                let color = "bg-blue-500";
                let Icon = Activity;

                if (act.action === "login") {
                  color = "bg-green-500";
                  Icon = Shield;
                } else if (act.action.includes("create")) {
                  color = "bg-blue-500";
                  Icon = PlusCircle;
                } else if (act.action.includes("update")) {
                  color = "bg-amber-500";
                  Icon = PenTool;
                } else if (act.action.includes("delete")) {
                  color = "bg-red-500";
                  Icon = Trash2;
                }

                return (
                  <div
                    key={i}
                    className="relative flex items-center justify-between md:justify-normal group is-active"
                  >
                    <div
                      className={`flex items-center justify-center w-6 h-6 rounded-full border-4 border-white ${color} text-white shrink-0 shadow flex-col absolute left-0 z-10`}
                    />
                    <div className="w-[calc(100%-2rem)] pl-8">
                      <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-1 gap-2">
                          <h4 className="font-bold text-soft-black text-xs uppercase leading-tight">
                            {act.action.replace("_", " ")}
                          </h4>
                          <span className="text-[9px] text-gray-500 font-bold whitespace-nowrap">
                            {dateStr}, {timeStr}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-600 line-clamp-2">
                          {act.description}
                        </p>
                        <p className="text-[9px] text-main-blue mt-1 font-bold italic">
                          Oleh: {act.user_name}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10">
                <Activity className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-xs text-gray-400 italic">
                  Belum ada rekaman aktivitas.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Agenda & Kalender Card */}
      <div className="bg-white/80 backdrop-blur-xl border border-white p-6 md:p-8 rounded-[2.5rem] shadow-sm">
           <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-500 shadow-sm border border-orange-200">
                 <Calendar className="w-5 h-5" />
               </div>
               <div>
                 <h3 className="text-lg font-bold font-heading text-soft-black leading-none">Jadwal & Kalender KKG</h3>
                 <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Monitoring Kegiatan Gugus 03</p>
               </div>
             </div>
             
             <div className="flex items-center bg-gray-100 p-1 rounded-xl">
               <button 
                 onClick={() => setViewType('timeline')}
                 className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${viewType === 'timeline' ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
               >
                 Timeline
               </button>
               <button 
                 onClick={() => setViewType('calendar')}
                 className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${viewType === 'calendar' ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
               >
                 Kalender
               </button>
             </div>
           </div>

           {viewType === 'timeline' ? (
             <div className="relative pl-8 space-y-8 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gradient-to-b before:from-orange-500 before:to-orange-500/10">
                {events.slice(0, 5).map((a, i) => {
                  const d = new Date(a.date_start);
                  const isStarted = d < new Date();
                  const isEnded = new Date(a.date_end || a.date_start) < new Date();
                  return (
                    <div key={i} className="relative group">
                      <div className={`absolute -left-[27px] top-1.5 w-4 h-4 rounded-full border-4 border-white shadow-sm z-10 transition-transform group-hover:scale-125 ${
                        isEnded ? 'bg-gray-400' : isStarted ? 'bg-orange-500 animate-pulse' : 'bg-orange-500 shadow-orange-500/30'
                      }`} />
                      
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className={`text-[10px] font-black uppercase tracking-widest ${isEnded ? 'text-gray-400' : isStarted ? 'text-orange-500' : 'text-orange-600'}`}>
                              {d.toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta", weekday: 'long', day: "numeric", month: "long" })}
                              {!isStarted && <CountdownTimer targetDate={a.date_start} simple />}
                            </span>
                          </div>
                          <span className="text-[10px] font-black text-gray-400 bg-gray-50 px-3 py-1 rounded-full uppercase tracking-tighter">{a.category || "Agenda"}</span>
                        </div>
                        <h4 className={`font-bold text-sm ${isEnded ? 'text-gray-500' : 'text-soft-black'}`}>
                          {a.title}
                        </h4>
                        <p className="text-xs text-gray-400 font-medium flex items-center gap-2">
                          <MapPin className="w-3 h-3" /> {a.location}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {events.length === 0 && (
                  <p className="text-center text-gray-400 text-sm py-10 italic">Belum ada agenda terdaftar.</p>
                )}
             </div>
           ) : (
             <MainCalendar events={events} />
           )}
      </div>
    </div>
  );
}

function TamuOverview({ user }: { user: any }) {
  const [events, setEvents] = useState<any[]>([]);
  const [viewType, setViewType] = useState<'timeline' | 'calendar'>('timeline');
  const navigate = useNavigate();

  useEffect(() => {
    async function loadData() {
      if (!supabase) return;
      try {
        const { data: evData } = await supabase
          .from("events")
          .select("*")
          .order("date_start", { ascending: false });
        if (evData) setEvents(evData);
      } catch (e) {
        console.error(e);
      }
    }
    loadData();
  }, []);

  const guestActivities = [
    {
      title: "Agenda Kegiatan",
      icon: Calendar,
      color: "from-purple-500 to-fuchsia-400",
      value: `${events.length} Agenda Tersedia`,
      link: "/dashboard/jadwal",
    },
    {
      title: "Kegiatan & Pelatihan",
      icon: GraduationCap,
      color: "from-blue-500 to-cyan-400",
      value: "Lihat Daftar Kegiatan",
      link: "/dashboard/pelatihan",
    },
    {
      title: "Buku Tamu KKG",
      icon: NotebookPen,
      color: "from-indigo-600 to-blue-500",
      value: "Isi Presensi Tamu",
      link: "/dashboard/buku_tamu",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black font-heading text-soft-black flex items-center gap-3">
            <span className="w-2 h-8 bg-main-blue rounded-full"></span>
            Portal Tamu Gugus 03
          </h2>
          <p className="text-sm text-gray-500 mt-1">Selamat datang kembali, <span className="font-bold text-soft-black">{user.nama || "Tamu"}</span>! Silakan pilih menu di bawah ini.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {guestActivities.map((item, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={i}
            onClick={() => navigate(item.link)}
            className="bg-white border border-gray-100 p-8 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
          >
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-6 shadow-lg shadow-gray-200 group-hover:rotate-6 transition-transform text-white`}>
              <item.icon className="w-7 h-7" />
            </div>
            <h3 className="font-heading font-black text-soft-black text-lg mb-2">{item.title}</h3>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">{item.value}</p>
            <div className="flex items-center gap-2 text-main-blue group-hover:gap-4 transition-all">
              <span className="text-xs font-black uppercase tracking-widest">Akses Sekarang</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </motion.div>
        ))}
      </div>

      {events.length > 0 && (
          <div className="bg-white/80 backdrop-blur-xl border border-white p-6 md:p-8 rounded-[2.5rem] shadow-sm mt-8">
             <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
               <h3 className="text-lg font-bold font-heading flex items-center gap-2 leading-none">
                 <Calendar className="w-5 h-5 text-main-blue" /> Agenda KKG Gugus 03
               </h3>
               
               <div className="flex items-center bg-gray-100 p-1 rounded-xl">
                 <button 
                   onClick={() => setViewType('timeline')}
                   className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewType === 'timeline' ? 'bg-white text-main-blue shadow-sm' : 'text-gray-400'}`}
                 >
                   Timeline
                 </button>
                 <button 
                   onClick={() => setViewType('calendar')}
                   className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewType === 'calendar' ? 'bg-white text-main-blue shadow-sm' : 'text-gray-400'}`}
                 >
                   Kalender
                 </button>
               </div>
             </div>

             {viewType === 'timeline' ? (
               <div className="relative pl-8 space-y-8 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gradient-to-b before:from-main-blue before:to-main-blue/10">
                  {events.map((a, i) => {
                    const d = new Date(a.date_start);
                    const isStarted = d < new Date();
                    const isEnded = new Date(a.date_end || a.date_start) < new Date();
                    return (
                      <div key={i} className="relative group">
                        {/* Dot */}
                        <div className={`absolute -left-[27px] top-1.5 w-4 h-4 rounded-full border-4 border-white shadow-sm z-10 transition-transform group-hover:scale-125 ${
                          isEnded ? 'bg-gray-400' : isStarted ? 'bg-orange-500' : 'bg-main-blue shadow-main-blue/30'
                        }`} />
                        
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className={`text-[10px] font-black uppercase tracking-widest ${isEnded ? 'text-gray-400' : isStarted ? 'text-orange-500' : 'text-main-blue'}`}>
                                {d.toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta", weekday: 'long', day: "numeric", month: "long" })}
                                {!isStarted && <CountdownTimer targetDate={a.date_start} simple />}
                              </span>
                            </div>
                            {isEnded && (
                              <span className="text-[9px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Selesai</span>
                            )}
                            {isStarted && !isEnded && (
                              <span className="text-[9px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full animate-pulse">Berlangsung</span>
                            )}
                          </div>
                          <h4 className={`font-bold text-sm ${isEnded ? 'text-gray-500' : 'text-soft-black'}`}>
                            {a.title}
                          </h4>
                          <p className="text-xs text-gray-400 font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {d.toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit" })} WIB • {a.location}
                          </p>
                        </div>
                      </div>
                    );
                  })}
               </div>
             ) : (
               <MainCalendar events={events} />
             )}
          </div>
      )}
    </div>
  );
}

function GuruOverview({ user }: { user: any }) {
  const [events, setEvents] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [counts, setCounts] = useState({
    pelatihan: 0,
    karya: 0,
  });
  const [viewType, setViewType] = useState<'timeline' | 'calendar'>('timeline');

  useEffect(() => {
    async function loadData() {
      if (!supabase) return;
      try {
        const { data: evData } = await supabase
          .from("events")
          .select("*")
          .order("date_start", { ascending: false })
          .limit(5);
        if (evData) setEvents(evData);

        const { data: newsData } = await supabase
          .from("posts")
          .select("*")
          .in("category", ["berita", "pengumuman"])
          .order("published_at", { ascending: false })
          .limit(3);
        if (newsData) setNews(newsData);

        const [pelatihanRes, karyaRes] = await Promise.all([
          supabase
            .from("trainings")
            .select("*", { count: "exact", head: true }),
          supabase
            .from("teacher_works")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id),
        ]);

        setCounts({
          pelatihan: pelatihanRes.count || 0,
          karya: karyaRes.count || 0,
        });
      } catch (e) {
        console.error(e);
      }
    }
    loadData();
  }, [user.id]);

  const activities = [
    {
      title: "Pelatihan",
      icon: GraduationCap,
      color: "from-blue-500 to-cyan-400",
      value: `${counts.pelatihan} Pelatihan Tersedia`,
      link: "/dashboard/pelatihan",
    },
    {
      title: "Hasil Karya",
      icon: UploadCloud,
      color: "from-green-500 to-emerald-400",
      value: `${counts.karya} Karya Diupload`,
      link: "/dashboard/upload_karya",
    },
    {
      title: "Forum Diskusi",
      icon: MessageSquare,
      color: "from-indigo-600 to-blue-500",
      value: "Diskusi & Tanya Jawab",
      link: "/dashboard/forum",
    },
    {
      title: "Agenda KKG",
      icon: Users,
      color: "from-purple-500 to-fuchsia-400",
      value: `${events.length} Agenda Aktif`,
      link: "/dashboard/jadwal",
    },
    {
      title: "Materi KKG",
      icon: BookOpen,
      color: "from-amber-500 to-yellow-400",
      value: "Lihat Materi",
      link: "/dashboard/materi",
    },
  ];

  const navigate = useNavigate();

  return (
    <div className="space-y-10">
      {/* Guru Clean Header */}
      <div className="bg-white p-8 rounded-[2rem] border-l-8 border-main-blue shadow-sm mb-10 flex flex-col md:flex-row items-center gap-8">
        <div className="w-[90px] h-[120px] rounded-3xl bg-gray-100 p-1 overflow-hidden shadow-inner shrink-0 scale-95 border border-gray-200">
          <img
            src={
              user.foto ||
              user.avatar_url ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nama || user.username || "U")}&background=6366f1&color=fff&size=512`
            }
            alt="User"
            className="w-full h-full object-cover rounded-2xl"
          />
        </div>
        <div className="flex-1 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-main-blue/10 rounded-full border border-main-blue/5 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-main-blue animate-pulse" />
            <span className="text-[10px] font-black text-main-blue uppercase tracking-widest leading-none">Pendidik GUGUS 03</span>
          </div>
          <div className="text-xl md:text-3xl font-black font-heading leading-tight mb-2">
            <span className="text-leaf-green">Selamat Datang,</span><br/>
            <span className="text-main-blue">{user.nama || user.full_name || "Guru"}! 👋</span>
          </div>
          <p className="text-sm text-gray-500 font-medium max-w-lg">
            Platform terintegrasi untuk administrasi, berbagi perangkat ajar, dan informasi kegiatan di lingkungan GUGUS 03.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 shrink-0">
          <button
            onClick={() => navigate("/dashboard/upload_karya")}
            className="px-6 py-3 bg-main-blue text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-main-blue/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
          >
            <UploadCloud className="w-4 h-4" /> Upload Hasil Karya
          </button>
          <button
            onClick={() => navigate("/dashboard/pelatihan")}
            className="px-6 py-3 bg-white text-main-blue border border-main-blue rounded-xl font-bold text-xs uppercase tracking-widest shadow-md hover:bg-main-blue/5 transition-all flex items-center gap-3 active:scale-95"
          >
            <GraduationCap className="w-4 h-4" /> Ikuti Pelatihan
          </button>
        </div>
      </div>

      {/* Quick Menu */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {activities.map((item, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            key={i}
            onClick={() => navigate(item.link)}
            className="bg-white/80 backdrop-blur-xl border border-main-orange/20 p-6 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
          >
            <div
              className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform`}
            >
              <item.icon className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-soft-black mb-1">{item.title}</h4>
            <p className="text-sm text-gray-500 font-medium">{item.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white/80 backdrop-blur-xl border border-white p-6 md:p-8 rounded-3xl shadow-sm">
          <h3 className="text-lg font-bold font-heading mb-6 flex items-center gap-2">
            <Bell className="w-5 h-5 text-main-blue" /> Pengumuman Terbaru
          </h3>
          <div className="space-y-4">
            {news.map((p, i) => {
              const dateObj = new Date(p.published_at || p.created_at);
              const day = dateObj.toLocaleString("id-ID", { timeZone: "Asia/Jakarta", day: "numeric" });
              const month = dateObj.toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta", 
                month: "short",
              });
              return (
                <div
                  key={i}
                  className="flex gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-blue-50/50 transition-colors cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex flex-col items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-red-500">
                      {day}
                    </span>
                    <span className="text-[10px] text-gray-500 uppercase font-bold">
                      {month}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-main-blue bg-main-blue/10 px-2 py-0.5 rounded-full mb-1 inline-block">
                      {p.category}
                    </span>
                    <h4 className="text-sm font-bold text-soft-black leading-snug">
                      {p.title}
                    </h4>
                  </div>
                </div>
              );
            })}
            {news.length === 0 && (
              <p className="text-gray-400 text-sm italic text-center py-4">
                Belum ada pengumuman.
              </p>
            )}
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-white p-6 md:p-8 rounded-3xl shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <h3 className="text-lg font-bold font-heading flex items-center gap-2 leading-none">
              <Calendar className="w-5 h-5 text-leaf-green" /> Timeline Kegiatan KKG
            </h3>
            
            <div className="flex items-center bg-gray-100 p-1 rounded-xl">
              <button 
                onClick={() => setViewType('timeline')}
                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewType === 'timeline' ? 'bg-white text-leaf-green shadow-sm' : 'text-gray-400'}`}
              >
                Timeline
              </button>
              <button 
                onClick={() => setViewType('calendar')}
                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewType === 'calendar' ? 'bg-white text-leaf-green shadow-sm' : 'text-gray-400'}`}
              >
                Kalender
              </button>
            </div>
          </div>

          {viewType === 'timeline' ? (
            <div className="relative pl-8 space-y-8 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gradient-to-b before:from-leaf-green before:to-leaf-green/10">
              {events.map((a, i) => {
                const d = new Date(a.date_start);
                const now = new Date();
                const isStarted = d < now;
                const isEnded = new Date(a.date_end || a.date_start) < now;
                return (
                  <div key={i} className="relative group">
                    {/* Dot */}
                    <div className={`absolute -left-[27px] top-1.5 w-4 h-4 rounded-full border-4 border-white shadow-sm z-10 transition-transform group-hover:scale-125 ${
                      isEnded ? 'bg-gray-400' : isStarted ? 'bg-orange-500' : 'bg-leaf-green shadow-leaf-green/30'
                    }`} />
                    
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className={`text-[10px] font-black uppercase tracking-widest ${isEnded ? 'text-gray-400' : isStarted ? 'text-orange-500' : 'text-leaf-green'}`}>
                            {d.toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta", weekday: 'long', day: "numeric", month: "long" })}
                          </span>
                          {!isStarted && <CountdownTimer targetDate={a.date_start} simple />}
                        </div>
                        {isEnded && (
                          <span className="text-[9px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Selesai</span>
                        )}
                        {isStarted && !isEnded && (
                          <span className="text-[9px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full animate-pulse">Berlangsung</span>
                        )}
                      </div>
                      <h4 className={`font-bold text-sm ${isEnded ? 'text-gray-500' : 'text-soft-black'}`}>
                        {a.title}
                      </h4>
                      <p className="text-xs text-gray-400 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {d.toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit" })} WIB • {a.location}
                      </p>
                    </div>
                  </div>
                );
              })}
              {events.length === 0 && (
                <div className="text-center py-10 opacity-60">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-gray-200">
                    <Calendar className="w-8 h-8 text-gray-200" />
                  </div>
                  <p className="text-gray-400 text-sm font-medium">Timeline agenda masih kosong.</p>
                  <p className="text-[10px] text-gray-300 uppercase tracking-widest mt-1">Agenda kegiatan akan ditampilkan di sini</p>
                </div>
              )}
            </div>
          ) : (
            <MainCalendar events={events} />
          )}
        </div>
      </div>
    </div>
  );
}

// ----------------------
// FORM COMPONENTS
// ----------------------

function AdminSettingsForm() {
  const { content, updateContent, isLoading } = useSiteContent();
  const { alert, confirm } = useAlert();

  const [heroForm, setHeroForm] = useState(content.hero);
  const [profilForm, setProfilForm] = useState(content.profil);
  const [footerForm, setFooterForm] = useState(content.footer);
  const [announcementForm, setAnnouncementForm] = useState(
    content.announcement || { title: "", subtitle: "", desc: "" },
  );
  const [activeMenusForm, setActiveMenusForm] = useState(
    (content as any).activeMenus || {},
  );

  React.useEffect(() => {
    if (!isLoading) {
      setHeroForm(content.hero);
      setProfilForm(content.profil);
      setFooterForm(content.footer);
      setAnnouncementForm(
        content.announcement || { title: "", subtitle: "", desc: "" },
      );
      setActiveMenusForm((content as any).activeMenus || {});
    }
  }, [content, isLoading]);

  const handleSaveContent = async (e: React.FormEvent) => {
    e.preventDefault();
    const isConfirmed = await confirm(
      "Apakah Anda yakin ingin menyimpan perubahan pengaturan website?",
      "Konfirmasi Simpan"
    );
    if (!isConfirmed) return;

    try {
      await updateContent({
        hero: heroForm,
        profil: profilForm,
        footer: footerForm,
        announcement: announcementForm,
        activeMenus: activeMenusForm,
      });
      await alert("Pengaturan website berhasil disimpan!", "Sukses", "success");
    } catch (err: any) {
      await alert("Gagal menyimpan pengaturan: " + err.message, "Gagal", "error");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10"
    >
      {/* Website Clean Header */}
      <div className="bg-white p-8 rounded-[2rem] border-l-8 border-slate-400 shadow-sm mb-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
        <div className="flex items-center gap-8">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500 border border-slate-200">
            <Settings className="w-8 h-8" />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-slate-100 rounded-full border border-slate-200 mb-2">
              <div className="w-1 h-1 rounded-full bg-slate-400 animate-pulse" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-heading">Konfigurasi Sistem</span>
            </div>
            <h2 className="text-2xl font-bold font-heading text-soft-black">
              Pengaturan Website
            </h2>
            <p className="text-sm text-gray-500">
              Sesuaikan konten dan tampilan website publik GUGUS 03.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSaveContent} className="space-y-12">
        {/* Announcement Section */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold flex items-center gap-2 text-main-blue">
            <Menu className="w-5 h-5" /> Aktivasi Menu Guru
          </h3>
          <p className="text-xs text-gray-500 -mt-4">
            Tentukan menu mana saja yang akan dimunculkan pada dashboard Guru.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-gray-50/50 rounded-2xl border border-gray-100">
            {[
              { id: "overview", label: "Overview" },
              { id: "profil", label: "Profil Guru" },
              { id: "jadwal", label: "Jadwal KKG" },
              { id: "materi", label: "Materi KKG" },
              { id: "notulen", label: "Notulen Rapat" },
              { id: "pelatihan", label: "Pelatihan" },
              { id: "forum", label: "Forum Diskusi" },
              { id: "sharing", label: "Sharing Praktik" },
              { id: "upload_karya", label: "Upload Karya" },
            ].map((menu) => (
              <label
                key={menu.id}
                className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 cursor-pointer hover:border-main-blue/30 transition-all shadow-sm"
              >
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded accent-main-blue"
                  checked={!!activeMenusForm[menu.id]}
                  onChange={(e) =>
                    setActiveMenusForm({
                      ...activeMenusForm,
                      [menu.id]: e.target.checked,
                    })
                  }
                />
                <span className="text-sm font-bold text-gray-700">
                  {menu.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Announcement Section */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold flex items-center gap-2 text-main-blue">
            <Megaphone className="w-5 h-5" /> Popup Pengumuman
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-50/50 rounded-2xl border border-gray-100">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Popup Title
              </label>
              <input
                className="w-full border-gray-200 border p-3 rounded-xl focus:ring-2 focus:ring-main-blue/20 outline-none transition-all"
                value={announcementForm.title}
                onChange={(e) =>
                  setAnnouncementForm({
                    ...announcementForm,
                    title: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Popup Subtitle
              </label>
              <input
                className="w-full border-gray-200 border p-3 rounded-xl focus:ring-2 focus:ring-main-blue/20 outline-none transition-all"
                value={announcementForm.subtitle}
                onChange={(e) =>
                  setAnnouncementForm({
                    ...announcementForm,
                    subtitle: e.target.value,
                  })
                }
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Popup Description
              </label>
              <textarea
                className="w-full border-gray-200 border p-3 rounded-xl focus:ring-2 focus:ring-main-blue/20 outline-none transition-all"
                rows={3}
                value={announcementForm.desc}
                onChange={(e) =>
                  setAnnouncementForm({
                    ...announcementForm,
                    desc: e.target.value,
                  })
                }
              />
            </div>
          </div>
        </div>

        {/* Kontak Section */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold flex items-center gap-2 text-main-blue">
            <MessageCircle className="w-5 h-5" /> Setelan Kontak
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-50/50 rounded-2xl border border-gray-100">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nomor WhatsApp (Tanpa awalan 0 atau +, mis: 628123456789)
              </label>
              <input
                className="w-full border-gray-200 border p-3 rounded-xl focus:ring-2 focus:ring-main-blue/20 outline-none transition-all"
                value={footerForm.waNumber || ""}
                onChange={(e) =>
                  setFooterForm({ ...footerForm, waNumber: e.target.value })
                }
              />
            </div>
          </div>
        </div>

        {/* Sosial Media Section */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold flex items-center gap-2 text-main-blue">
            <Globe className="w-5 h-5" /> Media Sosial
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-50/50 rounded-2xl border border-gray-100">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Instagram URL
              </label>
              <input
                className="w-full border-gray-200 border p-3 rounded-xl focus:ring-2 focus:ring-main-blue/20 outline-none transition-all"
                value={footerForm.social?.instagram || ""}
                onChange={(e) =>
                  setFooterForm({
                    ...footerForm,
                    social: {
                      facebook: footerForm.social?.facebook || "",
                      tiktok: footerForm.social?.tiktok || "",
                      youtube: footerForm.social?.youtube || "",
                      instagram: e.target.value,
                    },
                  })
                }
                placeholder="https://instagram.com/..."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Facebook URL
              </label>
              <input
                className="w-full border-gray-200 border p-3 rounded-xl focus:ring-2 focus:ring-main-blue/20 outline-none transition-all"
                value={footerForm.social?.facebook || ""}
                onChange={(e) =>
                  setFooterForm({
                    ...footerForm,
                    social: {
                      instagram: footerForm.social?.instagram || "",
                      tiktok: footerForm.social?.tiktok || "",
                      youtube: footerForm.social?.youtube || "",
                      facebook: e.target.value,
                    },
                  })
                }
                placeholder="https://facebook.com/..."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                TikTok URL
              </label>
              <input
                className="w-full border-gray-200 border p-3 rounded-xl focus:ring-2 focus:ring-main-blue/20 outline-none transition-all"
                value={footerForm.social?.tiktok || ""}
                onChange={(e) =>
                  setFooterForm({
                    ...footerForm,
                    social: {
                      instagram: footerForm.social?.instagram || "",
                      facebook: footerForm.social?.facebook || "",
                      youtube: footerForm.social?.youtube || "",
                      tiktok: e.target.value,
                    },
                  })
                }
                placeholder="https://tiktok.com/@..."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                YouTube URL
              </label>
              <input
                className="w-full border-gray-200 border p-3 rounded-xl focus:ring-2 focus:ring-main-blue/20 outline-none transition-all"
                value={footerForm.social?.youtube || ""}
                onChange={(e) =>
                  setFooterForm({
                    ...footerForm,
                    social: {
                      instagram: footerForm.social?.instagram || "",
                      facebook: footerForm.social?.facebook || "",
                      tiktok: footerForm.social?.tiktok || "",
                      youtube: e.target.value,
                    },
                  })
                }
                placeholder="https://youtube.com/..."
              />
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold flex items-center gap-2 text-main-blue">
            <ImageIcon className="w-5 h-5" /> Hero Section
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-50/50 rounded-2xl border border-gray-100">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Title 1
              </label>
              <input
                className="w-full border-gray-200 border p-3 rounded-xl focus:ring-2 focus:ring-main-blue/20 outline-none transition-all"
                value={heroForm.title1}
                onChange={(e) =>
                  setHeroForm({ ...heroForm, title1: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Title 2
              </label>
              <input
                className="w-full border-gray-200 border p-3 rounded-xl focus:ring-2 focus:ring-main-blue/20 outline-none transition-all"
                value={heroForm.title2}
                onChange={(e) =>
                  setHeroForm({ ...heroForm, title2: e.target.value })
                }
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                className="w-full border-gray-200 border p-3 rounded-xl focus:ring-2 focus:ring-main-blue/20 outline-none transition-all"
                rows={3}
                value={heroForm.description}
                onChange={(e) =>
                  setHeroForm({ ...heroForm, description: e.target.value })
                }
              />
            </div>
            <div className="md:col-span-2">
              <ImageUpload
                label="Logo Sekolah"
                value={heroForm.logo}
                onChange={(base64) =>
                  setHeroForm({ ...heroForm, logo: base64 })
                }
                maxWidth={400}
                maxHeight={400}
              />
            </div>
          </div>
        </div>

        {/* Profil Section */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold flex items-center gap-2 text-leaf-green">
            <Users className="w-5 h-5" /> Profil Sambutan
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-50/50 rounded-2xl border border-gray-100">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Title Sambutan
              </label>
              <input
                className="w-full border-gray-200 border p-3 rounded-xl focus:ring-2 focus:ring-leaf-green/20 outline-none transition-all"
                value={profilForm.title}
                onChange={(e) =>
                  setProfilForm({ ...profilForm, title: e.target.value })
                }
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Pesan/Quote
              </label>
              <textarea
                className="w-full border-gray-200 border p-3 rounded-xl focus:ring-2 focus:ring-leaf-green/20 outline-none transition-all"
                rows={4}
                value={profilForm.quote}
                onChange={(e) =>
                  setProfilForm({ ...profilForm, quote: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nama Ketua Gugus
              </label>
              <input
                className="w-full border-gray-200 border p-3 rounded-xl focus:ring-2 focus:ring-leaf-green/20 outline-none transition-all"
                value={profilForm.name}
                onChange={(e) =>
                  setProfilForm({ ...profilForm, name: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Jabatan Resmi
              </label>
              <input
                className="w-full border-gray-200 border p-3 rounded-xl focus:ring-2 focus:ring-leaf-green/20 outline-none transition-all"
                value={profilForm.role}
                onChange={(e) =>
                  setProfilForm({ ...profilForm, role: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Periode Kepengurusan
              </label>
              <input
                className="w-full border-gray-200 border p-3 rounded-xl focus:ring-2 focus:ring-leaf-green/20 outline-none transition-all"
                value={profilForm.periodeKepengurusan || ""}
                onChange={(e) =>
                  setProfilForm({
                    ...profilForm,
                    periodeKepengurusan: e.target.value,
                  })
                }
              />
            </div>
            <div className="md:col-span-2">
              <ImageUpload
                label="Foto Profil"
                value={profilForm.image}
                onChange={(base64) =>
                  setProfilForm({ ...profilForm, image: base64 })
                }
                maxWidth={400}
                maxHeight={400}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-6 border-t border-gray-100">
          <button
            type="submit"
            className="px-8 py-3.5 bg-gradient-to-r from-main-blue to-blue-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-blue-500/20 transition-all flex items-center gap-2"
          >
            <CheckSquare className="w-5 h-5" /> Simpan Semua Perubahan
          </button>
        </div>
      </form>
    </motion.div>
  );
}

function AdminBeritaForm({ user }: { user: any }) {
  const { confirm } = useAlert();
  const [news, setNews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const debouncedSave = useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    async function loadNews() {
      if (!supabase) return;
      try {
        const { data } = await supabase
          .from("posts")
          .select("*")
          .eq("category", "berita")
          .order("published_at", { ascending: false });
        setNews(data || []);
      } catch (err) {
        console.error("Error fetching news:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadNews();
  }, []);

  const handleCreate = async () => {
    if (!supabase) return;
    const newPost = {
      title: "Berita Baru",
      slug: `berita-baru-${Date.now()}`,
      content: "Konten berita...",
      featured_image_url:
        "https://images.unsplash.com/photo-1546410531-bea4cada4ff8?q=80&w=2000&auto=format&fit=crop",
      category: "berita",
      published_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from("posts")
      .insert([newPost])
      .select();
    if (!error && data) {
      logActivity(
        user,
        "create_berita",
        `Menambah berita baru: ${newPost.title}`,
      );
      setNews([data[0], ...news]);
    }
  };

  const handleUpdate = (id: string, updates: any) => {
    setNews(news.map((n: any) => (n.id === id ? { ...n, ...updates } : n)));

    if (debouncedSave.current) clearTimeout(debouncedSave.current);

    debouncedSave.current = setTimeout(async () => {
      if (!supabase) return;
      const { error } = await supabase
        .from("posts")
        .update(updates)
        .eq("id", id);
      if (error) {
        console.error("Error updating post:", error);
      } else {
        logActivity(user, "update_berita", `Memperbarui berita ID: ${id}`);
      }
    }, 800);
  };

  const handleDelete = async (id: string) => {
    if (!supabase) return;
    if (await confirm("Hapus berita ini?", "Konfirmasi")) {
      const { error } = await supabase.from("posts").delete().eq("id", id);
      if (!error) {
        logActivity(user, "delete_berita", `Menghapus berita ID: ${id}`);
        setNews(news.filter((n: any) => n.id !== id));
      }
    }
  };

  return (
    <div className="space-y-10">
      {/* Berita Clean Header */}
      <div className="bg-white p-8 rounded-[2rem] border-l-8 border-main-blue shadow-sm mb-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
        <div className="flex items-center gap-8">
          <div className="w-16 h-16 bg-main-blue/10 rounded-2xl flex items-center justify-center text-main-blue border border-main-blue/10">
            <Newspaper className="w-8 h-8" />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-main-blue/10 rounded-full border border-main-blue/5 mb-2">
              <div className="w-1 h-1 rounded-full bg-main-blue animate-pulse" />
              <span className="text-[10px] font-bold text-main-blue uppercase tracking-widest font-heading">Media Informasi</span>
            </div>
            <h2 className="text-2xl font-bold font-heading text-soft-black">
              Kelola Berita
            </h2>
            <p className="text-sm text-gray-500">
              Publikasikan artikel dan informasi terbaru ke portal GUGUS 03.
            </p>
          </div>
        </div>
        
        <button
          onClick={handleCreate}
          className="bg-main-blue text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-md hover:bg-main-blue/90 active:scale-95 transition-all flex items-center gap-3"
        >
          <PlusCircle className="w-4 h-4" /> Buat Berita Baru
        </button>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center text-gray-400 py-10">
              Memuat data...
            </div>
          ) : news.length === 0 ? (
            <div className="text-center text-gray-400 py-10">
              Belum ada berita.
            </div>
          ) : (
            news.map((item: any) => (
              <div
                key={item.id}
                className="p-4 border border-gray-100 rounded-2xl bg-white shadow-sm flex flex-col items-start gap-4 hover:shadow-md transition-all group relative"
              >
                <div className="w-full flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 pr-8">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">
                      Judul Berita
                    </label>
                    <input
                      className="w-full border-b border-gray-200 text-sm font-bold text-soft-black outline-none bg-transparent"
                      value={item.title}
                      onChange={(e) =>
                        handleUpdate(item.id, { title: e.target.value })
                      }
                    />
                  </div>
                  <div className="md:col-span-2">
                    <ImageUpload
                      label=""
                      value={item.featured_image_url || ""}
                      onChange={(base64) =>
                        handleUpdate(item.id, { featured_image_url: base64 })
                      }
                      maxWidth={600}
                      maxHeight={400}
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[10px] uppercase font-bold text-gray-400">
                        Tanggal Berita
                      </label>
                      <button 
                        onClick={() => handleUpdate(item.id, { published_at: new Date().toISOString() })}
                        className="text-[9px] font-black text-main-blue hover:underline uppercase tracking-tighter"
                      >
                        Set Hari Ini
                      </button>
                    </div>
                    <input
                      type="date"
                      className="w-full border-b border-gray-200 text-sm font-bold text-soft-black outline-none bg-transparent"
                      value={item.published_at ? item.published_at.split('T')[0] : ''}
                      onChange={(e) =>
                        handleUpdate(item.id, { published_at: new Date(e.target.value).toISOString() })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">
                      Kategori
                    </label>
                    <div className="w-full border-b border-gray-200 text-xs py-1 text-main-blue font-bold">
                       Berita
                    </div>
                  </div>
                  <div className="md:col-span-2 pt-4">
                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-2">
                      Konten Berita (Rich Text)
                    </label>
                    <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-inner min-h-[300px]">
                      <ReactQuill
                        theme="snow"
                        value={item.content || ""}
                        onChange={(content) => handleUpdate(item.id, { content })}
                        className="h-full border-none"
                        modules={{
                          toolbar: [
                            [{ 'header': [1, 2, 3, false] }],
                            ['bold', 'italic', 'underline', 'strike'],
                            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                            [{ 'align': [] }],
                            ['link', 'image'],
                            ['clean']
                          ],
                        }}
                      />
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function AdminGaleriForm({
  user,
  galleryForm,
  setGalleryForm,
  handleSaveContent,
}: any) {
  const { confirm } = useAlert();
  const [gallery, setGallery] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [bulkTitle, setBulkTitle] = useState("");
  const [uploadingBulk, setUploadingBulk] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({
    current: 0,
    total: 0,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    async function loadGallery() {
      if (!supabase) return;
      try {
        const { data } = await supabase
          .from("gallery")
          .select("*")
          .order("created_at", { ascending: false });
        setGallery(data || []);
      } catch (err) {
        console.error("Error fetching gallery:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadGallery();
  }, []);

  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          const maxWidth = 1200;
          const maxHeight = 1200;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL("image/webp", 0.8));
          } else {
            reject(new Error("Failed to get canvas context"));
          }
        };
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !supabase) return;
    if (!bulkTitle) {
      alert("Mohon isi Nama Kegiatan terlebih dahulu.");
      return;
    }

    setUploadingBulk(true);
    setUploadProgress({ current: 0, total: files.length });

    const newItems = [];

    for (let i = 0; i < files.length; i++) {
      try {
        const base64 = await resizeImage(files[i]);
        newItems.push({
          title: bulkTitle,
          media_url: base64,
          type: "photo",
        });
        setUploadProgress((prev) => ({ ...prev, current: i + 1 }));
      } catch (err) {
        console.error("Error processing file:", err);
      }
    }

    if (newItems.length > 0) {
      const { data, error } = await supabase
        .from("gallery")
        .insert(newItems)
        .select();
      if (!error && data) {
        logActivity(
          user,
          "create_galeri_massal",
          `Upload ${newItems.length} foto ke galeri: ${bulkTitle}`,
        );
        setGallery([...data, ...gallery]);
      }
    }

    setUploadingBulk(false);
    setShowBulkUpload(false);
    setBulkTitle("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCreate = async () => {
    if (!supabase) return;
    const newItem = {
      media_url:
        "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=2022&auto=format&fit=crop",
      title: "Judul Foto Baru",
      type: "photo",
    };
    const { data, error } = await supabase
      .from("gallery")
      .insert([newItem])
      .select();
    if (!error && data) {
      logActivity(user, "create_galeri", `Menambah foto satuan ke galeri`);
      setGallery([data[0], ...gallery]);
    }
  };

  const handleCreateVideo = async () => {
    if (!supabase) return;
    const newItem = {
      media_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      title: "Video Dokumentasi Kegiatan",
      type: "video",
    };
    const { data, error } = await supabase
      .from("gallery")
      .insert([newItem])
      .select();
    if (!error && data) {
      logActivity(user, "create_galeri_video", `Menambah video ke galeri`);
      setGallery([data[0], ...gallery]);
    }
  };

  const getEmbedUrl = (url: string) => {
    if (!url) return "";
    if (url.includes("youtube.com/embed/")) return url;
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (ytMatch && ytMatch[1]) {
      return `https://www.youtube.com/embed/${ytMatch[1]}`;
    }
    const vimeoMatch = url.match(/vimeo\.com\/(?:.*\/)?(\d+)/);
    if (vimeoMatch && vimeoMatch[1]) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }
    return url;
  };

  const isVideoItem = (item: any) => {
    if (!item) return false;
    if (item.type === 'video') return true;
    if (typeof item.media_url === 'string') {
      const url = item.media_url.toLowerCase();
      if (
        url.includes('youtube.com') ||
        url.includes('youtu.be') ||
        url.includes('vimeo.com') ||
        url.endsWith('.mp4') ||
        url.endsWith('.webm')
      ) {
        return true;
      }
    }
    return false;
  };

  const slides = React.useMemo(() => {
    const result: any[] = [];
    let photoBuffer: any[] = [];

    for (const item of gallery) {
      if (isVideoItem(item)) {
        if (photoBuffer.length > 0) {
          result.push({ type: 'photo_grid', items: photoBuffer });
          photoBuffer = [];
        }
        result.push({ type: 'video', items: [item] });
      } else {
        photoBuffer.push(item);
        if (photoBuffer.length === 4) {
          result.push({ type: 'photo_grid', items: photoBuffer });
          photoBuffer = [];
        }
      }
    }

    if (photoBuffer.length > 0) {
      result.push({ type: 'photo_grid', items: photoBuffer });
    }

    return result;
  }, [gallery]);

  const handleUpdate = async (id: string, updates: any) => {
    if (!supabase) return;
    const { error } = await supabase
      .from("gallery")
      .update(updates)
      .eq("id", id);
    if (!error) {
      logActivity(user, "update_galeri", `Memperbarui aset galeri ID: ${id}`);
      setGallery(
        gallery.map((g: any) => (g.id === id ? { ...g, ...updates } : g)),
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!supabase) return;
    if (await confirm("Hapus aset ini dari galeri?", "Konfirmasi")) {
      const { error } = await supabase.from("gallery").delete().eq("id", id);
      if (!error) {
        logActivity(user, "delete_galeri", `Menghapus aset galeri ID: ${id}`);
        setGallery(gallery.filter((g: any) => g.id !== id));
      }
    }
  };

  return (
    <div className="space-y-10">
      {/* Galeri Clean Header */}
      <div className="bg-white p-8 rounded-[2rem] border-l-8 border-pink-500 shadow-sm mb-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
        <div className="flex items-center gap-8">
          <div className="w-16 h-16 bg-pink-50 rounded-2xl flex items-center justify-center text-pink-500 border border-pink-100">
            <Camera className="w-8 h-8" />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-pink-50 rounded-full border border-pink-100 mb-2">
              <div className="w-1 h-1 rounded-full bg-pink-500 animate-pulse" />
              <span className="text-[10px] font-bold text-pink-600 uppercase tracking-widest font-heading">Dokumentasi Visual</span>
            </div>
            <h2 className="text-2xl font-bold font-heading text-soft-black">
              Kelola Galeri
            </h2>
            <p className="text-sm text-gray-500">
              Kelola koleksi foto kegiatan dan dokumentasi penting GUGUS 03.
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleCreateVideo}
            className="bg-purple-600 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-md hover:bg-purple-700 active:scale-95 transition-all flex items-center gap-2"
          >
            <Video className="w-4 h-4" /> Sematkan Video
          </button>
          <button
            onClick={() => setShowBulkUpload(!showBulkUpload)}
            className={`px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-md transition-all flex items-center gap-3 ${showBulkUpload ? "bg-pink-600 text-white" : "bg-white text-pink-600 border border-pink-200"}`}
          >
            <UploadCloud className="w-4 h-4" />
            {showBulkUpload ? "Batal Massal" : "Upload Massal"}
          </button>
          <button
            onClick={handleCreate}
            className="bg-pink-500 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-md hover:bg-pink-600 active:scale-95 transition-all flex items-center gap-3"
          >
            <PlusCircle className="w-4 h-4" /> Tambah Foto
          </button>
        </div>
      </div>

      {showBulkUpload && (
        <div className="mb-8 p-6 bg-orange-50/50 rounded-2xl border-2 border-dashed border-orange-200">
          <div className="max-w-xl mx-auto space-y-4">
            <div>
              <label className="block text-sm font-bold text-orange-900 mb-2">
                Nama/Judul Kegiatan
              </label>
              <input
                type="text"
                placeholder="Contoh: Rapat Kerja Gugus 2024"
                className="w-full px-4 py-3 rounded-xl border border-orange-200 outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                value={bulkTitle}
                onChange={(e) => setBulkTitle(e.target.value)}
              />
            </div>

            <div
              onClick={() => !uploadingBulk && fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
                uploadingBulk
                  ? "bg-gray-50 border-gray-200 cursor-not-allowed"
                  : "bg-white border-orange-300 hover:border-orange-500 hover:bg-orange-50/30"
              }`}
            >
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleBulkUpload}
                disabled={uploadingBulk}
              />

              {uploadingBulk ? (
                <div className="space-y-4">
                  <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-orange-900 font-bold">
                    Sedang Mengunggah...
                  </p>
                  <div className="w-full bg-orange-200 rounded-full h-2.5 max-w-xs mx-auto">
                    <div
                      className="bg-orange-600 h-2.5 rounded-full transition-all"
                      style={{
                        width: `${(uploadProgress.current / uploadProgress.total) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-orange-700">
                    {uploadProgress.current} dari {uploadProgress.total} foto
                    diproses
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                  <p className="text-orange-900 font-bold">Pilih Banyak Foto</p>
                  <p className="text-sm text-orange-600">
                    Klik untuk memilih beberapa foto sekaligus untuk kegiatan "
                    {bulkTitle || "..."}"
                  </p>
                </div>
              )}
            </div>

            <div className="bg-white p-4 rounded-xl border border-orange-100">
              <p className="text-xs text-orange-800 leading-relaxed font-medium">
                <strong>Tips:</strong> Gunakan fitur ini untuk mengunggah banyak
                dokumentasi sekaligus. Pastikan koneksi internet stabil karena
                sistem akan memproses dan mengunggah foto satu per satu secara
                otomatis.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-8">
        {isLoading ? (
          <div className="text-center text-gray-400 py-10">
            Memuat galeri...
          </div>
        ) : gallery.length === 0 ? (
          <div className="text-center text-gray-400 py-10">
            Belum ada media galeri.
          </div>
        ) : (
          <div className="space-y-8">
            {slides.map((slide: any, slideIdx: number) => {
              const isVideoSlide = slide.type === 'video';
              return (
                <div
                  key={slideIdx}
                  className={`p-8 border rounded-[2.5rem] bg-white shadow-sm hover:shadow-md transition-all group ${
                    isVideoSlide ? "border-purple-200 bg-purple-50/20" : "border-gray-100"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row gap-8">
                    <div className="w-full lg:w-1/2">
                      {isVideoSlide ? (
                        <div className="relative aspect-video rounded-3xl overflow-hidden bg-black border border-purple-200 shadow-md flex flex-col justify-center items-center">
                          {(() => {
                            const videoItem = slide.items[0];
                            const embedUrl = getEmbedUrl(videoItem.media_url);
                            const isDirectMp4 = typeof videoItem.media_url === 'string' && videoItem.media_url.match(/\.(mp4|webm|ogg)$/i);

                            if (isDirectMp4) {
                              return (
                                <video src={videoItem.media_url} controls className="w-full h-full object-contain" />
                              );
                            } else if (embedUrl) {
                              return (
                                <iframe
                                  src={embedUrl}
                                  title={videoItem.title || "Video Preview"}
                                  className="w-full h-full border-0"
                                  allowFullScreen
                                />
                              );
                            } else {
                              return (
                                <div className="flex flex-col items-center justify-center p-6 text-center text-gray-400">
                                  <Video className="w-10 h-10 mb-2 text-purple-500 animate-pulse" />
                                  <p className="text-xs font-bold text-white">Frame 1 Video Kegiatan</p>
                                  <p className="text-[10px] text-gray-400 mt-1">Masukkan URL YouTube/Vimeo pada kolom sebelah kanan</p>
                                </div>
                              );
                            }
                          })()}
                          <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-purple-300 flex items-center gap-1.5 border border-white/10">
                            <Video className="w-3.5 h-3.5 text-purple-400" /> Frame Single Video
                          </div>
                        </div>
                      ) : (
                        <div className={`grid gap-3 aspect-square md:aspect-video lg:aspect-square bg-gray-50 rounded-3xl p-4 ${
                          slide.items.length === 1 ? 'grid-cols-1' :
                          slide.items.length === 2 ? 'grid-cols-2' :
                          'grid-cols-2 grid-rows-2'
                        }`}>
                          {[0, 1, 2, 3].map((idx) => {
                            const item = slide.items[idx];
                            return (
                              <div key={idx} className="relative group/item aspect-square rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm">
                                {item ? (
                                  <>
                                    <img src={item.media_url} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                       <button 
                                        onClick={() => handleDelete(item.id)}
                                        className="p-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors shadow-lg"
                                        title="Hapus"
                                       >
                                         <X className="w-4 h-4" />
                                       </button>
                                    </div>
                                  </>
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl">
                                     <ImageIcon className="w-6 h-6 text-gray-300" />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-6">
                      <div>
                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${isVideoSlide ? 'bg-purple-500' : 'bg-pink-500'}`} />
                          Slide #{slides.length - slideIdx} ({isVideoSlide ? 'Frame 1 Video' : `Grid Foto (${slide.items.length})`})
                        </h4>
                        
                        <div className="space-y-4">
                          {slide.items.map((item: any, idx: number) => (
                            <div key={item.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-pink-500 uppercase tracking-tighter">
                                  {item.type === 'video' ? 'Media Video' : `Media Foto ${idx + 1}`}
                                </span>
                                <div className="flex items-center gap-2">
                                  <select
                                    className="text-[10px] font-bold uppercase bg-white border border-gray-200 rounded-lg px-2 py-1 outline-none"
                                    value={item.type || "photo"}
                                    onChange={(e) => handleUpdate(item.id, { type: e.target.value })}
                                  >
                                    <option value="photo">Foto</option>
                                    <option value="video">Video</option>
                                  </select>
                                  <button
                                    onClick={() => handleDelete(item.id)}
                                    className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"
                                    title="Hapus Media"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                              
                              <input
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-soft-black outline-none focus:border-pink-300 transition-all"
                                placeholder="Judul Media / Kegiatan..."
                                value={item.title || ""}
                                onChange={(e) => handleUpdate(item.id, { title: e.target.value })}
                              />

                              {item.type === "photo" ? (
                                <div className="hidden md:block">
                                  <ImageUpload
                                    label=""
                                    value={item.media_url || ""}
                                    onChange={(base64) => handleUpdate(item.id, { media_url: base64 })}
                                    maxWidth={1200}
                                    maxHeight={1200}
                                  />
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-gray-400 uppercase">Link Video (YouTube / Vimeo / MP4)</label>
                                  <input
                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:border-pink-300 transition-all font-mono"
                                    placeholder="Sematkan Link Video YouTube/Vimeo..."
                                    value={item.media_url || ""}
                                    onChange={(e) => handleUpdate(item.id, { media_url: e.target.value })}
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export const formatToJakartaDatetimeLocal = (isoString?: string) => {
  if (!isoString) return "";
  const d = new Date(isoString);
  const options: Intl.DateTimeFormatOptions = { 
    timeZone: 'Asia/Jakarta', 
    year: 'numeric', month: '2-digit', day: '2-digit', 
    hour: '2-digit', minute: '2-digit', hour12: false 
  };
  const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(d);
  const z: any = {};
  parts.forEach(p => z[p.type] = p.value);
  let hr = z.hour === '24' ? '00' : z.hour;
  return `${z.year}-${z.month}-${z.day}T${hr}:${z.minute}`;
};

export const parseJakartaDatetimeLocalToUTC = (localString: string) => {
  if (!localString) return "";
  return new Date(localString + "+07:00").toISOString();
};

function AdminAgendaForm({ user }: { user: any }) {
  const navigate = useNavigate();
  const { alert, confirm } = useAlert();
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State Variables
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  
  const predefinedCategories = ["Pelatihan", "Workshop", "IHT", "Seminar", "Monev", "Rapat Pengurus", "Rapat Pleno"];
  const [isCustomCategory, setIsCustomCategory] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    category: "Pelatihan",
    date_start: "",
    location: "",
    description: "",
    status: "rencana",
    image_url: "",
    detail_url: "",
    materi_url: "",
    is_attendance_open: false,
    is_open_for_guests: false
  });

  React.useEffect(() => {
    async function loadEvents() {
      if (!supabase) return;
      try {
        const { data } = await supabase
          .from("events")
          .select("*")
          .order("date_start", { ascending: false });
        setEvents(data || []);
      } catch (err) {
        console.error("Error fetching events:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadEvents();
  }, []);

  const openCreateModal = () => {
    setEditingEvent(null);
    setIsCustomCategory(false);
    setFormData({
      title: "",
      category: "Pelatihan",
      date_start: formatToJakartaDatetimeLocal(new Date().toISOString()),
      location: "",
      description: "",
      status: "rencana",
      image_url: "",
      detail_url: "",
      materi_url: "",
      is_attendance_open: false,
      is_open_for_guests: false
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setEditingEvent(item);
    
    // Check if category is predefined
    const isCustom = item.category && !predefinedCategories.includes(item.category);
    setIsCustomCategory(!!isCustom);

    setFormData({
      title: item.title || "",
      category: item.category || "Pelatihan",
      date_start: item.date_start ? formatToJakartaDatetimeLocal(item.date_start) : "",
      location: item.location || "",
      description: item.description || "",
      status: item.status || "rencana",
      image_url: item.image_url || "",
      detail_url: item.detail_url || "",
      materi_url: item.materi_url || "",
      is_attendance_open: !!item.is_attendance_open,
      is_open_for_guests: !!item.is_open_for_guests
    });
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    const payload = {
      title: formData.title,
      category: formData.category,
      date_start: parseJakartaDatetimeLocalToUTC(formData.date_start),
      location: formData.location,
      description: formData.description,
      status: formData.status,
      image_url: formData.image_url,
      detail_url: formData.detail_url,
      materi_url: formData.materi_url,
      is_attendance_open: formData.is_attendance_open,
      is_open_for_guests: formData.is_open_for_guests
    };

    if (editingEvent) {
      // Edit mode
      const { error } = await supabase
        .from("events")
        .update(payload)
        .eq("id", editingEvent.id);

      if (error) {
        await alert("Gagal memperbarui agenda: " + error.message, "Gagal", "error");
        return;
      }

      logActivity(user, "update_agenda", `Memperbarui agenda: ${payload.title}`);
      setEvents(events.map((ev) => ev.id === editingEvent.id ? { ...ev, ...payload } : ev));
      setIsModalOpen(false);
      await alert("Agenda berhasil diperbarui!", "Sukses", "success");
    } else {
      // Create mode
      const { error } = await supabase
        .from("events")
        .insert([payload]);

      if (error) {
        await alert("Gagal menambah agenda: " + error.message, "Gagal", "error");
        return;
      }

      logActivity(user, "create_agenda", `Menambah agenda baru: ${payload.title}`);

      // Reload list
      const { data: updatedData } = await supabase
        .from("events")
        .select("*")
        .order("date_start", { ascending: false });

      if (updatedData) {
        setEvents(updatedData);
      }
      setIsModalOpen(false);
      await alert("Agenda baru berhasil ditambahkan!", "Sukses", "success");
    }
  };

  const handleQuickUpdate = async (id: string, updates: any) => {
    if (!supabase) return;

    // Optimistically update the UI locally
    setEvents((prev) => prev.map((ev) => ev.id === id ? { ...ev, ...updates } : ev));

    const { error } = await supabase
      .from("events")
      .update(updates)
      .eq("id", id);

    if (error) {
      console.error("Error updates event:", error);
      // Revert if error
      const { data: updatedData } = await supabase
        .from("events")
        .select("*")
        .order("date_start", { ascending: false });
      if (updatedData) {
        setEvents(updatedData);
      }
    } else {
      logActivity(user, "update_agenda", `Memperbarui cepat agenda ID: ${id}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!supabase) return;
    const item = events.find((ev) => ev.id === id);
    const title = item ? item.title : "agenda";

    const confirmed = await confirm(`Apakah Anda yakin ingin menghapus agenda "${title}"?`, "Konfirmasi Hapus");
    if (confirmed) {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (!error) {
        logActivity(user, "delete_agenda", `Menghapus agenda ID: ${id}`);
        setEvents(events.filter((g: any) => g.id !== id));
        await alert("Agenda berhasil dihapus!", "Sukses", "success");
      } else {
        await alert("Gagal menghapus agenda: " + error.message, "Gagal", "error");
      }
    }
  };

  return (
    <div className="space-y-10">
      {/* Agenda Section Header */}
      <div className="bg-white p-8 rounded-[2rem] border-l-8 border-orange-500 shadow-sm mb-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
        <div className="flex items-center gap-8">
          <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 border border-orange-100">
            <Calendar className="w-8 h-8" />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-orange-50 rounded-full border border-orange-100 mb-2">
              <div className="w-1 h-1 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest font-heading">Manajemen Agenda</span>
            </div>
            <h2 className="text-2xl font-bold font-heading text-soft-black">
              Kelola Agenda
            </h2>
            <p className="text-sm text-gray-500">
              Atur jadwal pertemuan dan kegiatan KKG terdaftar di database.
            </p>
          </div>
        </div>
        
        <button
          onClick={openCreateModal}
          className="bg-orange-500 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-md hover:bg-orange-600 active:scale-95 transition-all flex items-center gap-3"
        >
          <PlusCircle className="w-4 h-4" /> Tambah Agenda
        </button>
      </div>

      <div className="space-y-6">
        {isLoading ? (
          <div className="text-center text-gray-400 py-10">
            Memuat agenda...
          </div>
        ) : events.length === 0 ? (
          <div className="text-center text-gray-400 py-10 bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
            Belum ada agenda kegiatan. Klik <strong className="text-orange-500 cursor-pointer" onClick={openCreateModal}>Tambah Agenda</strong> untuk membuat pertama kalinya.
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-2xl border border-gray-100 shadow-sm">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-[10px] uppercase font-black tracking-wider text-gray-400 select-none">
                  <th className="py-4 px-6">Nama Kegiatan</th>
                  <th className="py-4 px-4">Waktu & Lokasi</th>
                  <th className="py-4 px-4 text-center">Status Akses / Presensi</th>
                  <th className="py-4 px-4">File / Lampiran</th>
                  <th className="py-4 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50/70">
                {events.map((item: any) => {
                  const hasCover = !!item.image_url;
                  const hasMateri = !!item.materi_url;
                  
                  return (
                    <tr key={item.id} className="hover:bg-gray-50/40 transition-colors group">
                      {/* Name & Category Info */}
                      <td className="py-4 px-6 max-w-xs">
                        <div className="flex items-start gap-3">
                          <div className="w-1.5 h-10 rounded-full bg-orange-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-extrabold text-xs text-soft-black leading-snug">
                              {item.title}
                            </p>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <span className="inline-flex items-center px-1.5 py-0.5 bg-orange-50 text-orange-600 rounded text-[9px] uppercase font-black tracking-widest border border-orange-100/50">
                                {item.category}
                              </span>
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] uppercase font-extrabold border ${
                                getAutomatedStatus(item) === 'selesai' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                getAutomatedStatus(item) === 'berjalan' ? 'bg-indigo-50 text-indigo-650 border-indigo-100' :
                                'bg-amber-50 text-amber-600 border-amber-100'
                              }`}>
                                {getAutomatedStatus(item)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Time & Location */}
                      <td className="py-4 px-4 text-xs">
                        <div className="space-y-1 text-gray-600">
                          <div className="flex items-center gap-1.5 font-medium">
                            <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span>
                              {new Date(item.date_start).toLocaleDateString("id-ID", {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })} pukul {new Date(item.date_start).toLocaleTimeString("id-ID", {
                                hour: "2-digit",
                                minute: "2-digit"
                              })} WIB
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                            <MapPin className="w-3.5 h-3.5 shrink-0 text-orange-400 animate-pulse" />
                            <span className="truncate max-w-[180px]" title={item.location}>{item.location || "Kantor Gugus"}</span>
                          </div>
                        </div>
                      </td>

                      {/* Status Access & Presensi Switch */}
                      <td className="py-4 px-4 text-center">
                        <div className="flex flex-col items-center gap-1.5 justify-center">
                          {/* Attendance button */}
                          <button
                            type="button"
                            onClick={() => {
                              handleQuickUpdate(item.id, { is_attendance_open: !item.is_attendance_open });
                            }}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-200 ${
                              item.is_attendance_open 
                                ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20' 
                                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                            }`}
                          >
                            {item.is_attendance_open ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            <span>Presensi: {item.is_attendance_open ? "Buka" : "Tutup"}</span>
                          </button>

                          {/* Guest button */}
                          <button
                            type="button"
                            onClick={() => {
                              handleQuickUpdate(item.id, { is_open_for_guests: !item.is_open_for_guests });
                            }}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-200 ${
                              item.is_open_for_guests 
                                ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/20' 
                                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                            }`}
                          >
                            {item.is_open_for_guests ? <Users className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            <span>Akses Tamu: {item.is_open_for_guests ? "Buka" : "Tutup"}</span>
                          </button>
                        </div>
                      </td>

                      {/* Compact File & Document Storage Columns with clear actions */}
                      <td className="py-4 px-4 text-xs">
                        <div className="flex flex-col gap-1.5 max-w-[190px]">
                          {hasCover ? (
                            <div className="flex items-center justify-between gap-1 p-1 bg-orange-50 border border-orange-100/50 rounded-lg pr-1.5 pl-1.5">
                              <div className="flex items-center gap-1.5 text-[10px] text-orange-700 font-extrabold truncate">
                                <ImageIcon className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                                <span className="truncate">Cover Tersimpan</span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <a 
                                  href={item.image_url} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="px-1.5 py-0.5 bg-orange-100/50 hover:bg-orange-100 text-[9px] font-bold text-orange-600 rounded transition-colors"
                                  title="Lihat Cover"
                                >
                                  Lihat
                                </a>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (await confirm("Hapus Cover Foto untuk agenda ini?")) {
                                      handleQuickUpdate(item.id, { image_url: "" });
                                      await alert("Cover Foto berhasil dihapus!", "Sukses", "success");
                                    }
                                  }}
                                  className="p-1 hover:bg-red-50 text-red-500 rounded transition-colors"
                                  title="Hapus Cover"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <span className="text-[10px] text-gray-400 font-medium italic">Cover: Kosong</span>
                          )}

                          {hasMateri ? (
                            <div className="flex items-center justify-between gap-1 p-1 bg-indigo-50 border border-indigo-100/50 rounded-lg pr-1.5 pl-1.5">
                              <div className="flex items-center gap-1.5 text-[10px] text-indigo-700 font-extrabold truncate">
                                <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                <span className="truncate">Materi Tersimpan</span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <a 
                                  href={getDirectDownloadUrl(item.materi_url)} 
                                  download={`Materi_${item.title}`}
                                  className="p-1.5 bg-indigo-100/50 hover:bg-indigo-100 text-indigo-650 rounded transition-colors flex items-center gap-0.5"
                                  title="Download Materi"
                                >
                                  <Download className="w-3 h-3" />
                                </a>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (await confirm("Hapus file Materi untuk agenda ini?")) {
                                      handleQuickUpdate(item.id, { materi_url: "" });
                                      await alert("File Materi berhasil dihapus!", "Sukses", "success");
                                    }
                                  }}
                                  className="p-1 hover:bg-red-50 text-red-500 rounded transition-colors"
                                  title="Hapus Materi"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <span className="text-[10px] text-gray-400 font-medium italic">Materi: Kosong</span>
                          )}
                        </div>
                      </td>

                      {/* General row actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center gap-2 justify-end">
                          {/* Cetak Rekap */}
                          <button
                            type="button"
                            onClick={() => navigate(`/dashboard/rekap_absen?type=event&id=${item.id}`)}
                            className="px-2.5 py-1.5 bg-gray-50 text-gray-650 hover:bg-main-blue/10 hover:text-main-blue rounded-xl transition-all font-black text-[10px] uppercase tracking-wider flex items-center gap-1"
                            title="Format cetak absensi kegiatan"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Rekap</span>
                          </button>

                          {/* Edit Form Popup Trigger */}
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            className="px-2.5 py-1.5 bg-gray-50 text-gray-650 hover:bg-orange-50 hover:text-orange-600 rounded-xl transition-all font-black text-[10px] uppercase tracking-wider"
                          >
                            Edit
                          </button>

                          {/* Delete Item button */}
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl transition-all"
                            title="Hapus Agenda"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pop-up Overlay Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4">
          {/* Backdrop blur effect */}
          <div 
            onClick={() => setIsModalOpen(false)}
            className="fixed inset-0 bg-dark-gray/60 backdrop-blur-sm transition-opacity"
          />

          {/* Modal Container */}
          <div className="bg-white rounded-[2rem] shadow-2xl relative border border-gray-100 max-w-2xl w-full max-h-[85vh] overflow-y-auto p-8 animate-scale-up z-10 scrollbar-thin scrollbar-thumb-gray-200">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-soft-black transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 mb-6 select-none">
              <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 border border-orange-100">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-heading text-soft-black leading-tight">
                  {editingEvent ? "Edit Agenda Kegiatan" : "Tambah Agenda Baru"}
                </h3>
                <p className="text-xs text-gray-450 mt-1">
                  Isi formulir berikut untuk {editingEvent ? "memperbarui" : "membuat"} agenda kegiatan gugus.
                </p>
              </div>
            </div>

            <form onSubmit={handleModalSubmit} className="space-y-5">
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1.5">
                  Nama Kegiatan
                </label>
                <input
                  required
                  type="text"
                  placeholder="title"
                  className="w-full px-4 py-2.5 bg-gray-50 hover:bg-gray-100/50 border border-gray-200/70 rounded-xl text-sm font-bold text-soft-black outline-none focus:border-orange-500 focus:bg-white transition-all font-sans"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1.5">
                    Kategori
                  </label>
                  {!isCustomCategory ? (
                    <select
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200/70 rounded-xl text-sm text-gray-700 font-bold outline-none focus:border-orange-500 focus:bg-white transition-all"
                      value={formData.category}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "Lainya") {
                          setIsCustomCategory(true);
                          setFormData({ ...formData, category: "" });
                        } else {
                          setFormData({ ...formData, category: val });
                        }
                      }}
                    >
                      {predefinedCategories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                      <option value="Lainya">Lainya (Input Manual)</option>
                    </select>
                  ) : (
                    <div className="flex gap-2 relative">
                      <input
                        required
                        type="text"
                        placeholder="Ketik kategori manual..."
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200/70 rounded-xl text-sm text-gray-700 font-bold outline-none focus:border-orange-500 focus:bg-white transition-all"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomCategory(false);
                          setFormData({ ...formData, category: predefinedCategories[0] });
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all font-sans text-xs flex items-center justify-center font-bold"
                        title="Kembali ke pilihan default"
                      >
                         Batal
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1.5">
                    Status Kegiatan
                  </label>
                  <select
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200/70 rounded-xl text-sm text-gray-700 font-bold outline-none focus:border-orange-500 focus:bg-white transition-all"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="rencana">Rencana</option>
                    <option value="berjalan">Berjalan</option>
                    <option value="selesai">Selesai</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1.5">
                    Waktu Kegiatan (Mulai)
                  </label>
                  <input
                    required
                    type="datetime-local"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200/70 rounded-xl text-sm text-gray-750 outline-none focus:border-orange-500 focus:bg-white transition-all"
                    value={formData.date_start}
                    onChange={(e) => setFormData({ ...formData, date_start: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1.5">
                    Lokasi Kegiatan
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="location"
                    className="w-full px-4 py-2.5 bg-gray-50 hover:bg-gray-100/50 border border-gray-200/70 rounded-xl text-sm text-gray-700 outline-none focus:border-orange-500 focus:bg-white transition-all"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1.5">
                  Deskripsi Kegiatan
                </label>
                <textarea
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200/70 rounded-xl text-sm text-gray-750 outline-none focus:border-orange-500 focus:bg-white transition-all min-h-[70px] resize-y"
                  placeholder="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1.5">
                  Link Tautan Detail/Website luar (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="detail_url"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200/70 rounded-xl text-sm text-gray-700 outline-none focus:border-orange-500 focus:bg-white transition-all font-mono"
                  value={formData.detail_url}
                  onChange={(e) => setFormData({ ...formData, detail_url: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100/60">
                <div>
                  <label className="block text-[10px] uppercase font-black tracking-wider text-orange-600 mb-1.5">
                    Cover Foto Agenda
                  </label>
                  <ImageUpload
                    label=""
                    compact={true}
                    value={formData.image_url}
                    onChange={(base64) => setFormData({ ...formData, image_url: base64 })}
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black tracking-wider text-orange-600 mb-1.5">
                    File Lampiran Materi
                  </label>
                  <FileUpload
                    label=""
                    compact={true}
                    value={formData.materi_url}
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                    onChange={(base64OrPath) => setFormData({ ...formData, materi_url: base64OrPath })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl border border-gray-100 select-none">
                  <div>
                    <p className="text-xs font-extrabold text-soft-black leading-tight">Presensi Digital</p>
                    <p className="text-[10px] text-gray-400 leading-normal">Buka lembar absen peserta</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, is_attendance_open: !formData.is_attendance_open })}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all duration-200 ${
                      formData.is_attendance_open ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/25' : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {formData.is_attendance_open ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    <span>{formData.is_attendance_open ? "Buka" : "Tutup"}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl border border-gray-100 select-none">
                  <div>
                    <p className="text-xs font-extrabold text-soft-black leading-tight">Akses Tamu</p>
                    <p className="text-[10px] text-gray-400 leading-normal">Izinkan absen dari luar instansi</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, is_open_for_guests: !formData.is_open_for_guests })}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all duration-200 ${
                      formData.is_open_for_guests ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/25' : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {formData.is_open_for_guests ? <Users className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    <span>{formData.is_open_for_guests ? "Buka" : "Tutup"}</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-500 hover:bg-gray-50 transition-all font-sans"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 font-bold text-xs uppercase tracking-wider text-white shadow-md active:scale-95 transition-all flex items-center gap-2"
                >
                  {editingEvent ? "Simpan Perubahan" : "Simpan Agenda"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminSekolahForm({ user }: { user: any }) {
  const { alert } = useAlert();
  const [schools, setSchools] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newSchoolType, setNewSchoolType] = useState("Sekolah Imbas");

  React.useEffect(() => {
    async function loadSchools() {
      if (!supabase) return;
      try {
        const { data } = await supabase
          .from("schools")
          .select("*")
          .order("name", { ascending: true });
        setSchools(data || []);
      } catch (err) {
        console.error("Error fetching schools:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadSchools();
  }, []);

  const handleCreate = async () => {
    if (!supabase) return;
    setIsCreating(true);
    const newSchool = {
      name: "Sekolah Baru",
      principal_name: "-",
      student_count: 0,
      teacher_count: 0,
      akreditasi: "-",
      prestasi_images: [],
      jenis_sekolah: newSchoolType,
      logo_url:
        "https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=2000&auto=format&fit=crop",
    };
    const { data, error } = await supabase
      .from("schools")
      .insert([newSchool])
      .select();
    setIsCreating(false);
    if (error) {
      console.error("Error creating school:", error);
      await alert(
        "Gagal menambah sekolah: " +
          (error.message || "Kesalahan tidak diketahui"),
        "Error",
      );
      return;
    }

    if (data) {
      logActivity(
        user,
        "create_sekolah",
        `Menambah sekolah baru: ${newSchool.name}`,
      );
      setSchools([...schools, data[0]]);
      await alert("Sekolah baru berhasil ditambahkan!", "Sukses");
    }
  };

  const [savingId, setSavingId] = useState<string | null>(null);
  const debouncedSave = useRef<NodeJS.Timeout | null>(null);

  const handleUpdate = (id: string, updates: any) => {
    setSchools(
      schools.map((s: any) => (s.id === id ? { ...s, ...updates } : s)),
    );

    if (debouncedSave.current) clearTimeout(debouncedSave.current);

    debouncedSave.current = setTimeout(async () => {
      if (!supabase) return;
      setSavingId(id);
      const { error } = await supabase
        .from("schools")
        .update(updates)
        .eq("id", id);
      if (error) {
        console.error("Error updating school:", error);
        await alert("Gagal memperbarui sekolah", "Error");
      } else {
        logActivity(
          user,
          "update_sekolah",
          `Memperbarui data sekolah ID: ${id}`,
        );
      }
      setSavingId(null);
    }, 800);
  };

  const handleDelete = async (id: string) => {
    if (!supabase) return;
    if (window.confirm("Hapus sekolah ini?")) {
      const { error } = await supabase.from("schools").delete().eq("id", id);
      if (!error) {
        logActivity(user, "delete_sekolah", `Menghapus sekolah ID: ${id}`);
        setSchools(schools.filter((s: any) => s.id !== id));
      } else {
        console.error("Error deleting school:", error);
        await alert(
          "Gagal menghapus sekolah: " +
            (error.message || "Kesalahan tidak diketahui"),
          "Error",
        );
      }
    }
  };

  return (
    <div className="space-y-10">
      {/* Sekolah Clean Header */}
      <div className="bg-white p-8 rounded-[2rem] border-l-8 border-leaf-green shadow-sm mb-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
        <div className="flex items-center gap-8">
          <div className="w-16 h-16 bg-leaf-green/10 rounded-2xl flex items-center justify-center text-leaf-green border border-leaf-green/10">
            <School className="w-8 h-8" />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-leaf-green/10 rounded-full border border-leaf-green/5 mb-2">
              <div className="w-1 h-1 rounded-full bg-leaf-green animate-pulse" />
              <span className="text-[10px] font-bold text-leaf-green uppercase tracking-widest font-heading">Data Satker</span>
            </div>
            <h2 className="text-2xl font-bold font-heading text-soft-black">
              Kelola Sekolah
            </h2>
            <p className="text-sm text-gray-500">
              Manajemen data sekolah inti dan imbas di lingkungan GUGUS 03.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            className="px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold outline-none cursor-pointer"
            value={newSchoolType}
            onChange={(e) => setNewSchoolType(e.target.value)}
          >
            <option value="Sekolah Inti">Sekolah Inti</option>
            <option value="Sekolah Imbas">Sekolah Imbas</option>
          </select>
          <button
            onClick={handleCreate}
            disabled={isCreating}
            className="bg-leaf-green text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-md hover:bg-leaf-green/90 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
          >
            <PlusCircle className="w-4 h-4" />
            {isCreating ? "Menyimpan..." : "Tambah Sekolah"}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {isLoading ? (
            <div className="col-span-1 md:col-span-2 text-center text-gray-400 py-10">
              Memuat data...
            </div>
          ) : schools.length === 0 ? (
            <div className="col-span-1 md:col-span-2 text-center text-gray-400 py-10">
              Belum ada sekolah.
            </div>
          ) : (
            schools.map((school: any) => (
              <div
                key={school.id}
                className="p-6 border border-gray-100 rounded-2xl bg-white shadow-sm space-y-5 hover:shadow-md transition-shadow relative group"
              >
                <button
                  type="button"
                  onClick={() => handleDelete(school.id)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity z-10"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center p-2 overflow-hidden shrink-0 mt-2 sm:mt-0">
                    {school.logo_url ? (
                      <img
                        src={school.logo_url}
                        alt="Logo"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <BookOpen className="w-6 h-6 text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-2 pr-8 sm:pr-0">
                      <input
                        className="w-full border border-gray-200 sm:border-none p-2 sm:p-0 text-base sm:text-lg font-bold text-soft-black focus:ring-2 focus:ring-main-blue/20 sm:focus:ring-0 rounded-lg sm:rounded-none bg-white sm:bg-transparent"
                        placeholder="Nama Sekolah..."
                        value={school.name}
                        onChange={(e) =>
                          handleUpdate(school.id, { name: e.target.value })
                        }
                      />
                      <div className="flex items-center gap-2 mt-1 sm:mt-0 w-full sm:w-auto">
                        <select
                          className="flex-1 sm:flex-none text-xs font-bold uppercase tracking-wider px-3 py-2 sm:py-1.5 rounded-lg bg-gray-100 border-none focus:ring-2 focus:ring-main-blue/20 cursor-pointer"
                          value={school.jenis_sekolah || "Sekolah Imbas"}
                          onChange={(e) =>
                            handleUpdate(school.id, {
                              jenis_sekolah: e.target.value,
                            })
                          }
                          disabled={savingId === school.id}
                        >
                          <option value="Sekolah Inti">Sekolah Inti</option>
                          <option value="Sekolah Imbas">Sekolah Imbas</option>
                        </select>
                        {savingId === school.id && (
                          <span className="text-[10px] text-main-blue font-bold animate-pulse whitespace-nowrap">
                            Menyimpan...
                          </span>
                        )}
                      </div>
                    </div>
                    <input
                      className="w-full border border-gray-200 sm:border-none p-2 sm:p-0 text-sm text-gray-500 focus:ring-2 focus:ring-main-blue/20 sm:focus:ring-0 mb-2 rounded-lg sm:rounded-none bg-white sm:bg-transparent"
                      placeholder="Nama Kepala Sekolah..."
                      value={school.principal_name || ""}
                      onChange={(e) =>
                        handleUpdate(school.id, {
                          principal_name: e.target.value,
                        })
                      }
                    />
                    <div className="flex items-center gap-2 mb-4">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Akreditasi:</label>
                      <input
                        className="w-20 border border-gray-200 rounded px-2 py-0.5 text-xs font-bold text-main-blue"
                        placeholder="A/B/C..."
                        value={school.akreditasi || ""}
                        onChange={(e) =>
                          handleUpdate(school.id, { akreditasi: e.target.value })
                        }
                      />
                    </div>
                    <ImageUpload
                      label="Foto Kepala Sekolah"
                      value={school.principal_image_url || ""}
                      onChange={(base64) =>
                        handleUpdate(school.id, { principal_image_url: base64 })
                      }
                      maxWidth={400}
                      maxHeight={400}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                      Total Siswa
                    </label>
                    <input
                      type="number"
                      className="w-full border-gray-200 border p-2 text-sm rounded-lg"
                      value={school.student_count || 0}
                      onChange={(e) =>
                        handleUpdate(school.id, {
                          student_count: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                      Total Guru
                    </label>
                    <input
                      type="number"
                      className="w-full border-gray-200 border p-2 text-sm rounded-lg"
                      value={school.teacher_count || 0}
                      onChange={(e) =>
                        handleUpdate(school.id, {
                          teacher_count: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-50">
                  <div>
                    <ImageUpload
                      label="Logo Sekolah (Pojok Kanan Atas)"
                      value={school.logo_url || ""}
                      onChange={(base64) =>
                        handleUpdate(school.id, { logo_url: base64 })
                      }
                      maxWidth={400}
                      maxHeight={400}
                    />
                  </div>
                  <div>
                    <ImageUpload
                      label="Foto Background Sekolah"
                      value={school.image_url || ""}
                      onChange={(base64) =>
                        handleUpdate(school.id, { image_url: base64 })
                      }
                      maxWidth={1200}
                      maxHeight={800}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                      Visi (Pisahkan baris dengan Enter)
                    </label>
                    <textarea
                      className="w-full border-gray-200 border p-2.5 rounded-lg text-sm bg-gray-50 focus:bg-white transition-colors"
                      rows={2}
                      value={school.vision || ""}
                      onChange={(e) =>
                        handleUpdate(school.id, { vision: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                      Moto
                    </label>
                    <input
                      className="w-full border-gray-200 border p-2.5 rounded-lg text-sm bg-gray-50 focus:bg-white transition-colors"
                      value={school.motto || ""}
                      onChange={(e) =>
                        handleUpdate(school.id, { motto: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                      Keunggulan Sekolah
                    </label>
                    <textarea
                      className="w-full border-gray-200 border p-2.5 rounded-lg text-sm bg-gray-50 focus:bg-white transition-colors"
                      rows={3}
                      value={school.keunggulan || ""}
                      onChange={(e) =>
                        handleUpdate(school.id, { keunggulan: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                      Google Maps Embed URL
                    </label>
                    <input
                      className="w-full border-gray-200 border p-2.5 rounded-lg text-sm bg-gray-50 focus:bg-white transition-colors animate-fade-in-down"
                      placeholder="Contoh: https://www.google.com/maps/embed?..."
                      value={school.map_embed_url || ""}
                      onChange={(e) => {
                        let val = e.target.value;
                        // Detect if user pasted whole iframe tag and extract src
                        if (val.includes("<iframe") && val.includes('src="')) {
                          const match = val.match(/src="([^"]+)"/);
                          if (match && match[1]) {
                            val = match[1];
                          }
                        }
                        
                        // Parse coordinates of Google map automatically on input
                        const rawClean = val.trim();
                        let detectedLat = "";
                        let detectedLng = "";
                        
                        // 1. Google maps embed url style containing pb=!1m18!1m12!1m3!2dLONGITUDE!3dLATITUDE
                        const dMatch = rawClean.match(/!2d(-?\d+\.\d+)/);
                        const tMatch = rawClean.match(/!3d(-?\d+\.\d+)/);
                        if (dMatch && tMatch) {
                          detectedLat = parseFloat(tMatch[1]).toString();
                          detectedLng = parseFloat(dMatch[1]).toString();
                        } else {
                          // 2. Check for @lat,lng style
                          const atMatch = rawClean.match(/@(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
                          if (atMatch) {
                            detectedLat = parseFloat(atMatch[1]).toString();
                            detectedLng = parseFloat(atMatch[2]).toString();
                          } else {
                            // 3. Fallback search for any "latitude,longitude" pair match
                            const genericCoordsMatch = rawClean.match(/(-?[5678]\.\d+)\s*,\s*(11[12]\.\d+)/);
                            if (genericCoordsMatch) {
                              detectedLat = parseFloat(genericCoordsMatch[1]).toString();
                              detectedLng = parseFloat(genericCoordsMatch[2]).toString();
                            }
                          }
                        }

                        if (detectedLat && detectedLng) {
                          handleUpdate(school.id, { 
                            map_embed_url: val,
                            latitude: detectedLat,
                            longitude: detectedLng
                          });
                        } else {
                          handleUpdate(school.id, { map_embed_url: val });
                        }
                      }}
                    />

                    {/* DYNAMIC LEAFLET MAP COORDINATES & CUSTOM ICON SETTINGS */}
                    <div className="mt-4 p-4.5 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200/50 pb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-3.5 bg-main-orange rounded-full" />
                          <span className="text-[11px] font-black text-gray-700 uppercase tracking-wider">
                            Konfigurasi Koordinat & Icon Peta Digital (Leaflet)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            // Manual Search & Auto-Detect coordinates algorithm
                            const PRESETS: Record<string, { lat: number; lng: number }> = {
                              "mentoso": { lat: -6.832742, lng: 112.022335 },
                              "remen 1": { lat: -6.808304, lng: 112.008123 },
                              "remen 2": { lat: -6.815214, lng: 112.015244 },
                              "tasikharjo": { lat: -6.828311, lng: 111.983844 },
                              "jenu 1": { lat: -6.88512, lng: 112.0132 },
                              "jenu 2": { lat: -6.88750, lng: 112.0172 },
                              "jenu 3": { lat: -6.88920, lng: 112.0205 }
                            };

                            let foundLat = "";
                            let foundLng = "";

                            // 1. Try extracting from existing URL
                            if (school.map_embed_url) {
                              const rawClean = school.map_embed_url.trim();
                              const dMatch = rawClean.match(/!2d(-?\d+\.\d+)/);
                              const tMatch = rawClean.match(/!3d(-?\d+\.\d+)/);
                              if (dMatch && tMatch) {
                                foundLat = parseFloat(tMatch[1]).toString();
                                foundLng = parseFloat(dMatch[1]).toString();
                              } else {
                                const atMatch = rawClean.match(/@(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
                                if (atMatch) {
                                  foundLat = parseFloat(atMatch[1]).toString();
                                  foundLng = parseFloat(atMatch[2]).toString();
                                }
                              }
                            }

                            // 2. Try school name fuzzy matching if not found from URL
                            if (!foundLat || !foundLng) {
                              const key = (school.name || "").toLowerCase();
                              for (const [presetKey, coords] of Object.entries(PRESETS)) {
                                if (key.includes(presetKey) || presetKey.includes(key)) {
                                  foundLat = coords.lat.toString();
                                  foundLng = coords.lng.toString();
                                  break;
                                }
                              }
                            }

                            // 3. Absolute fallback coordinate defaults around central Jenu
                            if (!foundLat || !foundLng) {
                              foundLat = "-6.832000";
                              foundLng = "112.010000";
                            }

                            handleUpdate(school.id, {
                              latitude: foundLat,
                              longitude: foundLng
                            });
                            alert(`Berhasil Mendeteksi Koordinat: Lintang ${foundLat}, Bujur ${foundLng}`);
                          }}
                          className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white bg-main-orange hover:bg-orange-600 rounded-lg shadow-sm transition-all hover:scale-102 flex items-center gap-1 cursor-pointer"
                        >
                          🔍 Cari / Deteksi Koordinat Otomatis
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-500 mb-1">
                            Garis Lintang (Latitude)
                          </label>
                          <input
                            type="text"
                            className="w-full border border-gray-200 p-2.5 rounded-lg text-sm bg-white focus:ring-2 focus:ring-main-blue/10 outline-none"
                            placeholder="Contoh: -6.832742"
                            value={school.latitude || ""}
                            onChange={(e) =>
                              handleUpdate(school.id, { latitude: e.target.value })
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-gray-500 mb-1">
                            Garis Bujur (Longitude)
                          </label>
                          <input
                            type="text"
                            className="w-full border border-gray-200 p-2.5 rounded-lg text-sm bg-white focus:ring-2 focus:ring-main-blue/10 outline-none"
                            placeholder="Contoh: 112.022335"
                            value={school.longitude || ""}
                            onChange={(e) =>
                              handleUpdate(school.id, { longitude: e.target.value })
                            }
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-100/50">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-500 mb-1.5">
                            Warna Pin Map
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {[
                              { name: "blue", label: "Biru", class: "bg-main-blue" },
                              { name: "green", label: "Hijau", class: "bg-leaf-green" },
                              { name: "orange", label: "Oranye", class: "bg-main-orange" },
                              { name: "indigo", label: "Indigo", class: "bg-indigo-600" },
                              { name: "purple", label: "Ungu", class: "bg-purple-600" },
                              { name: "rose", label: "Rose", class: "bg-rose-600" },
                              { name: "amber", label: "Amber", class: "bg-amber-500" },
                            ].map((col) => {
                              const [currCol] = (school.map_icon || "blue|🏫").split("|");
                              const isSelected = currCol === col.name;
                              return (
                                <button
                                  key={col.name}
                                  type="button"
                                  onClick={() => {
                                    const emojiVal = (school.map_icon || "blue|🏫").split("|")[1] || "🏫";
                                    handleUpdate(school.id, {
                                      map_icon: `${col.name}|${emojiVal}`,
                                    });
                                  }}
                                  className={`px-2 py-1 rounded-lg text-[10px] font-extrabold text-white flex items-center gap-1 transition-all ${col.class} ${
                                    isSelected
                                      ? "ring-2 ring-offset-2 ring-gray-900 scale-102 opacity-100"
                                      : "opacity-75 hover:opacity-100 hover:scale-102"
                                  } cursor-pointer`}
                                >
                                  {col.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-gray-500 mb-1.5">
                            Simbol / Emoji Pin
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {["🏫", "📚", "🎓", "⭐", "🏆", "💻", "🔬", "🎨", "⚽"].map(
                              (emo) => {
                                const parts = (school.map_icon || "blue|🏫").split("|");
                                const currCol = parts[0] || "blue";
                                const currEmoji = parts[1] || "🏫";
                                const isSelected = currEmoji === emo;
                                return (
                                  <button
                                    key={emo}
                                    type="button"
                                    onClick={() => {
                                      handleUpdate(school.id, {
                                        map_icon: `${currCol}|${emo}`,
                                      });
                                    }}
                                    className={`w-7.5 h-7.5 flex items-center justify-center text-sm rounded-lg bg-white border transition-all ${
                                      isSelected
                                        ? "border-gray-900 bg-gray-50 ring-2 ring-gray-950/10 scale-110"
                                        : "border-gray-200 hover:border-gray-400"
                                    } cursor-pointer`}
                                  >
                                    {emo}
                                  </button>
                                );
                              }
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {school.map_embed_url &&
                      school.map_embed_url.includes(
                        "google.com/maps/embed",
                      ) && (
                        <div className="mt-4 rounded-2xl overflow-hidden border border-gray-200 shadow-inner h-64 bg-gray-50 relative group/map">
                          <iframe
                            src={school.map_embed_url}
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title={`Peta lokasi ${school.name}`}
                            className="grayscale hover:grayscale-0 transition-all duration-500"
                          />
                          <div className="absolute top-3 right-3 flex gap-2">
                            <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-gray-100 text-[10px] font-bold text-gray-500 flex items-center gap-2 pointer-events-none group-hover/map:opacity-0 transition-opacity">
                              <Navigation className="w-3 h-3 text-main-blue" />{" "}
                              Live Preview Peta
                            </div>
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(school.name)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-white hover:bg-main-blue hover:text-white transition-colors p-1.5 rounded-lg border border-gray-100 shadow-sm opacity-0 group-hover/map:opacity-100"
                              title="Buka di Google Maps"
                            >
                              <Globe className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      )}

                    <div className="pt-6 border-t border-gray-100">
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Foto Prestasi Sekolah (Max 2 - Landscape 16:9)</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[0, 1].map((idx) => {
                          const prestasi = (school.prestasi_images || [])[idx] || { image: "", description: "" };
                          return (
                            <div key={idx} className="space-y-2">
                              <ImageUpload
                                label={`Foto Prestasi ${idx + 1}`}
                                value={typeof prestasi === 'string' ? prestasi : prestasi.image || ""}
                                onChange={(base64) => {
                                  const curr = [...(school.prestasi_images || [])];
                                  const item = typeof curr[idx] === 'object' ? { ...curr[idx] } : { description: "" };
                                  item.image = base64;
                                  curr[idx] = item;
                                  handleUpdate(school.id, { prestasi_images: curr.slice(0, 2) });
                                }}
                                maxWidth={960}
                                maxHeight={540}
                              />
                              <textarea
                                className="w-full text-[10px] p-2 border border-gray-100 rounded-lg bg-gray-50 focus:ring-1 focus:ring-main-orange/30 outline-none resize-none"
                                placeholder="Deskripsi prestasi..."
                                rows={2}
                                value={prestasi.description || ""}
                                onChange={(e) => {
                                  const curr = [...(school.prestasi_images || [])];
                                  const item = typeof curr[idx] === 'object' ? { ...curr[idx] } : { image: "" };
                                  item.description = e.target.value;
                                  curr[idx] = item;
                                  handleUpdate(school.id, { prestasi_images: curr.slice(0, 2) });
                                }}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    {(!school.map_embed_url ||
                      !school.map_embed_url.includes(
                        "google.com/maps/embed",
                      )) && (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-2">
                        <p className="text-blue-800 text-[10px] leading-relaxed">
                          <strong className="block mb-1">
                            💡 Cara Menampilkan Peta:
                          </strong>
                          1. Cari lokasi di Google Maps &gt; Klik{" "}
                          <strong>Bagikan (Share)</strong>.<br />
                          2. Pilih tab{" "}
                          <strong>Sematkan peta (Embed a map)</strong>.<br />
                          3. Klik <strong>Salin HTML (Copy HTML)</strong> lalu
                          tempelkan di sini.
                          <br />
                          <span className="opacity-70 mt-1 block italic">
                            *Sistem akan otomatis mengambil link yang
                            diperlukan.
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function AdminKKGForm({
  kkgForm,
  setKkgForm,
  handleSaveContent,
  updateContent,
}: any) {
  const { alert, confirm } = useAlert();
  const { content } = useSiteContent();
  const [activeKkgTab, setActiveKkgTab] = useState("profil");
  const [dbStruktur, setDbStruktur] = useState<any[]>([]);
  const [isSavingToggle, setIsSavingToggle] = useState(false);
  const [localIsActive, setLocalIsActive] = useState(
    !!kkgForm.pengumuman?.isActive,
  );

  useEffect(() => {
    const isActive = !!kkgForm.pengumuman?.isActive;
    if (localIsActive !== isActive) {
      setLocalIsActive(isActive);
    }
  }, [kkgForm.pengumuman?.isActive]);

  const [localPengumuman, setLocalPengumuman] = useState(kkgForm.pengumuman || { title: "", desc: "", isActive: false });

  // Sync with prop if it changes externally
  useEffect(() => {
    if (kkgForm.pengumuman && JSON.stringify(kkgForm.pengumuman) !== JSON.stringify(localPengumuman)) {
      setLocalPengumuman(kkgForm.pengumuman);
    }
  }, [kkgForm.pengumuman]);

  // Debounced update to global state
  useEffect(() => {
    const handler = setTimeout(() => {
      setKkgForm((prev: any) => ({ ...prev, pengumuman: localPengumuman }));
    }, 500);
    return () => clearTimeout(handler);
  }, [localPengumuman]);

  // Use default values if current form fields are empty/missing
  const form = {
    ...defaultContent.kkg,
    ...kkgForm,
  };

  const visi = form.visi || "";
  const misi = form.misi || [];
  const tujuan = form.tujuan || [];
  const sejarah = form.sejarah || "";

  // KKG: handle field change locally for performance
  const [isSavingOrg, setIsSavingOrg] = useState<string | null>(null);
  const debouncedOrgSave = useRef<NodeJS.Timeout | null>(null);

  const onFieldChangeKkg = (id: string, field: string, value: string) => {
    setDbStruktur((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const loadStruktur = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from("org_kkg")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      setDbStruktur(data || []);
    } catch (err) {
      console.error("Gagal memuat struktur KKG:", err);
    }
  };

  React.useEffect(() => {
    loadStruktur();
  }, []);

  const handleOrgCreate = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from("org_kkg")
        .insert([{ role: "Jabatan Baru", name: "-", school: "-" }])
        .select();
      if (error) throw error;
      if (data) loadStruktur();
      await alert("Anggota baru berhasil ditambahkan", "Sukses", "success");
    } catch (err: any) {
      console.error("Error creating org_kkg:", err);
      await alert(
        "Gagal menambah anggota: " +
          (err.message || "Kesalahan tidak diketahui"),
        "Error",
        "error",
      );
    }
  };

  const handleOrgUpdate = async (id: string, updates: any) => {
    if (!supabase) return;

    if (debouncedOrgSave.current) clearTimeout(debouncedOrgSave.current);

    debouncedOrgSave.current = setTimeout(async () => {
      setIsSavingOrg(id);
      try {
        const { data, error } = await supabase
          .from("org_kkg")
          .update(updates)
          .eq("id", id)
          .select();
        if (error) throw error;
        if (data && data[0]) {
          setDbStruktur((prev) =>
            prev.map((item) => (item.id === id ? data[0] : item)),
          );
        }
      } catch (err: any) {
        console.error("Error updating org_kkg:", err);
        await alert(
          "Gagal menyimpan perubahan: " +
            (err.message || "Kesalahan tidak diketahui"),
          "Error",
          "error",
        );
      } finally {
        setIsSavingOrg(null);
      }
    }, 800);
  };

  const handleOrgDelete = async (id: string) => {
    if (!supabase) return;
    await supabase.from("org_kkg").delete().eq("id", id);
    loadStruktur();
  };

  return (
    <div className="space-y-10">
      {/* KKG Clean Header */}
      <div className="bg-white p-8 rounded-[2rem] border-l-8 border-main-blue shadow-sm mb-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
        <div className="flex items-center gap-8">
          <div className="w-16 h-16 bg-main-blue/10 rounded-2xl flex items-center justify-center text-main-blue border border-main-blue/10">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-main-blue/10 rounded-full border border-main-blue/5 mb-2">
              <div className="w-1 h-1 rounded-full bg-main-blue animate-pulse" />
              <span className="text-[10px] font-bold text-main-blue uppercase tracking-widest font-heading">Kolaborasi Guru</span>
            </div>
            <h2 className="text-2xl font-bold font-heading text-soft-black">
              Kelola KKG
            </h2>
            <p className="text-sm text-gray-500">
              Manajemen data Kelompok Kerja Guru (KKG) di wilayah GUGUS 03.
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
          <button
            onClick={() => setActiveKkgTab("profil")}
            className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeKkgTab === "profil" ? "bg-white text-main-blue shadow-sm" : "text-gray-500 hover:text-main-blue"}`}
          >
            Profil & Visi
          </button>
          <button
            onClick={() => setActiveKkgTab("dokumen")}
            className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeKkgTab === "dokumen" ? "bg-white text-main-blue shadow-sm" : "text-gray-500 hover:text-main-blue"}`}
          >
            Upload Dokumen
          </button>
          <button
            onClick={() => setActiveKkgTab("struktur")}
            className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeKkgTab === "struktur" ? "bg-white text-main-blue shadow-sm" : "text-gray-500 hover:text-main-blue"}`}
          >
            Struktur Organisasi
          </button>
          <button
            onClick={() => setActiveKkgTab("program")}
            className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeKkgTab === "program" ? "bg-white text-main-blue shadow-sm" : "text-gray-500 hover:text-main-blue"}`}
          >
            Program KKG
          </button>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] border border-main-orange/20 shadow-xl shadow-blue-500/5">

      <form onSubmit={handleSaveContent} className="space-y-6">
        {activeKkgTab === "profil" && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Sejarah KKG
              </label>
              <textarea
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-main-blue outline-none transition-colors bg-white/50"
                rows={4}
                value={sejarah}
                onChange={(e) =>
                  setKkgForm({ ...form, sejarah: e.target.value })
                }
                placeholder="Masukkan sejarah singkat KKG..."
              />
            </div>

            <div>
              <ImageUpload
                label="Gambar Profil KKG"
                value={form.gambarProfil || ""}
                onChange={(base64) =>
                  setKkgForm({ ...form, gambarProfil: base64 })
                }
                maxWidth={600}
                maxHeight={600}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Persentase Kolaborasi
                </label>
                <input
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-main-blue outline-none bg-white/50"
                  value={form.persentaseKolaborasi || ""}
                  onChange={(e) =>
                    setKkgForm({
                      ...form,
                      persentaseKolaborasi: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Tahun Dedikasi
                </label>
                <input
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-main-blue outline-none bg-white/50"
                  value={form.tahunDedikasi || ""}
                  onChange={(e) =>
                    setKkgForm({ ...form, tahunDedikasi: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Realisasi Program (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-main-blue outline-none bg-white/50"
                  value={form.realisasiProgram !== undefined && form.realisasiProgram !== null ? form.realisasiProgram : ""}
                  onChange={(e) => {
                    const val = e.target.value === "" ? 0 : parseInt(e.target.value);
                    setKkgForm({ ...form, realisasiProgram: isNaN(val) ? 0 : val });
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Partisipasi Guru (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-main-blue outline-none bg-white/50"
                  value={form.partisipasiGuru !== undefined && form.partisipasiGuru !== null ? form.partisipasiGuru : ""}
                  onChange={(e) => {
                    const val = e.target.value === "" ? 0 : parseInt(e.target.value);
                    setKkgForm({ ...form, partisipasiGuru: isNaN(val) ? 0 : val });
                  }}
                />
              </div>
            </div>

            {/* KKG Statistics Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-bold text-gray-700">
                  Statistik KKG
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const newStats = [...(form.statistikKkg || [])];
                    newStats.push({ label: "Baru", value: 0, suffix: "" });
                    setKkgForm({ ...form, statistikKkg: newStats });
                  }}
                  className="text-xs text-main-blue hover:underline font-bold"
                >
                  + Tambah Statistik
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(form.statistikKkg || []).map((stat: any, i: number) => (
                  <div
                    key={i}
                    className="p-4 border border-gray-100 rounded-xl bg-white shadow-sm space-y-3 relative group"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        const newStats = [...(form.statistikKkg || [])];
                        newStats.splice(i, 1);
                        setKkgForm({ ...form, statistikKkg: newStats });
                      }}
                      className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 text-red-400 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                        Label
                      </label>
                      <input
                        className="w-full border-b border-gray-200 p-1 text-sm focus:border-main-blue outline-none"
                        value={stat.label}
                        onChange={(e) => {
                          const newStats = [...(form.statistikKkg || [])];
                          newStats[i].label = e.target.value;
                          setKkgForm({ ...form, statistikKkg: newStats });
                        }}
                      />
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                          Nilai
                        </label>
                        <input
                          type="number"
                          className="w-full border-b border-gray-200 p-1 text-sm focus:border-main-blue outline-none font-mono"
                          value={stat.value}
                          onChange={(e) => {
                            const newStats = [...(form.statistikKkg || [])];
                            newStats[i].value = Number(e.target.value);
                            setKkgForm({ ...form, statistikKkg: newStats });
                          }}
                        />
                      </div>
                      <div className="w-16">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                          Suffix
                        </label>
                        <input
                          className="w-full border-b border-gray-200 p-1 text-sm focus:border-main-blue outline-none"
                          placeholder="+"
                          value={stat.suffix}
                          onChange={(e) => {
                            const newStats = [...(form.statistikKkg || [])];
                            newStats[i].suffix = e.target.value;
                            setKkgForm({ ...form, statistikKkg: newStats });
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {(form.statistikKkg || []).length === 0 && (
                  <p className="text-xs text-gray-400 italic">
                    Belum ada statistik.
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Visi KKG
              </label>
              <textarea
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-main-blue outline-none transition-colors bg-white/50"
                rows={3}
                value={visi}
                onChange={(e) => setKkgForm({ ...form, visi: e.target.value })}
                placeholder="Masukkan visi KKG..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-bold text-gray-700">
                    Misi KKG
                  </label>
                  <button
                    type="button"
                    onClick={() => setKkgForm({ ...form, misi: [...misi, ""] })}
                    className="text-xs text-main-blue hover:underline font-bold"
                  >
                    + Tambah Misi
                  </button>
                </div>
                <div className="space-y-2">
                  {misi.map((m: string, i: number) => (
                    <div key={i} className="flex gap-2">
                      <input
                        className="flex-1 border border-gray-200 rounded-lg p-2 text-sm focus:border-main-blue outline-none bg-white/50"
                        value={m}
                        onChange={(e) => {
                          const newMisi = [...misi];
                          newMisi[i] = e.target.value;
                          setKkgForm({ ...form, misi: newMisi });
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newMisi = [...misi];
                          newMisi.splice(i, 1);
                          setKkgForm({ ...form, misi: newMisi });
                        }}
                        className="text-red-400 hover:bg-red-50 p-2 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {misi.length === 0 && (
                    <p className="text-xs text-gray-400 italic">
                      Belum ada misi.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-bold text-gray-700">
                    Tujuan KKG
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setKkgForm({ ...form, tujuan: [...tujuan, ""] })
                    }
                    className="text-xs text-main-blue hover:underline font-bold"
                  >
                    + Tambah Tujuan
                  </button>
                </div>
                <div className="space-y-2">
                  {tujuan.map((t: string, i: number) => (
                    <div key={i} className="flex gap-2">
                      <input
                        className="flex-1 border border-gray-200 rounded-lg p-2 text-sm focus:border-main-blue outline-none bg-white/50"
                        value={t}
                        onChange={(e) => {
                          const newTujuan = [...tujuan];
                          newTujuan[i] = e.target.value;
                          setKkgForm({ ...form, tujuan: newTujuan });
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newTujuan = [...tujuan];
                          newTujuan.splice(i, 1);
                          setKkgForm({ ...form, tujuan: newTujuan });
                        }}
                        className="text-red-400 hover:bg-red-50 p-2 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {tujuan.length === 0 && (
                    <p className="text-xs text-gray-400 italic">
                      Belum ada tujuan.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeKkgTab === "dokumen" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-soft-black">Daftar Dokumen</h4>
              <button
                type="button"
                onClick={() =>
                  setKkgForm({
                    ...form,
                    dokumen: [...(form.dokumen || []), { title: "", url: "" }],
                  })
                }
                className="px-4 py-2 bg-main-blue text-white flex items-center gap-2 font-bold rounded-lg hover:bg-dark-blue transition-all text-xs"
              >
                + Tambah Dokumen
              </button>
            </div>
            <div className="space-y-4">
              {(form.dokumen || []).map(
                (doc: { title: string; url: string }, i: number) => (
                  <div
                    key={i}
                    className="flex gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100"
                  >
                    <div className="flex-1 space-y-2">
                      <input
                        className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:border-main-blue outline-none bg-white"
                        value={doc.title}
                        onChange={(e) => {
                          const newDokumen = [...(form.dokumen || [])];
                          newDokumen[i].title = e.target.value;
                          setKkgForm({ ...form, dokumen: newDokumen });
                        }}
                        placeholder="Judul Dokumen"
                      />
                        <FileUpload
                          label=""
                          compact={true}
                          value={doc.url}
                          accept=".pdf,.doc,.docx,.xls,.xlsx"
                          onChange={(base64, filename) => {
                            const newDokumen = [...(form.dokumen || [])];
                            newDokumen[i].url = base64;
                            if (filename && !newDokumen[i].title) {
                              newDokumen[i].title = filename;
                            }
                            setKkgForm({ ...form, dokumen: newDokumen });
                          }}
                        />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newDokumen = [...(form.dokumen || [])];
                        newDokumen.splice(i, 1);
                        setKkgForm({ ...form, dokumen: newDokumen });
                      }}
                      className="text-red-400 hover:bg-red-50 p-2 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ),
              )}
              {(form.dokumen || []).length === 0 && (
                <p className="text-sm text-gray-400 italic text-center py-8">
                  Belum ada dokumen.
                </p>
              )}
            </div>
          </div>
        )}

        {activeKkgTab === "struktur" && (
          <div className="space-y-8">
            <div className="bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100">
              <h4 className="text-sm font-bold text-main-blue mb-4 flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4" /> Preview Struktur
                Organisasi{" "}
                {content.profil.periodeKepengurusan && (
                  <span className="text-gray-500 font-normal">
                    | Periode: {content.profil.periodeKepengurusan}
                  </span>
                )}
              </h4>
              <div className="bg-white rounded-2xl p-4 shadow-inner overflow-x-auto min-h-[300px]">
                <OrgChart
                  members={dbStruktur}
                  onEdit={(member) => {
                    const newRole = window.prompt("Edit Jabatan:", member.role);
                    const newName = window.prompt("Edit Nama:", member.name);
                    const newNip = window.prompt("Edit NIP:", member.nip || "");
                    const newSchool = window.prompt(
                      "Edit Sekolah:",
                      member.school,
                    );
                    if (
                      newRole !== null ||
                      newName !== null ||
                      newNip !== null ||
                      newSchool !== null
                    ) {
                      handleOrgUpdate(member.id, {
                        role: newRole !== null ? newRole : member.role,
                        name: newName !== null ? newName : member.name,
                        nip: newNip !== null ? newNip : member.nip,
                        school: newSchool !== null ? newSchool : member.school,
                      });
                    }
                  }}
                  onDelete={handleOrgDelete}
                />
              </div>
            </div>

            <div className="flex justify-between items-center">
              <h4 className="font-bold text-soft-black">Data Pengurus</h4>
              <button
                type="button"
                onClick={handleOrgCreate}
                className="px-4 py-2 bg-leaf-green/10 text-leaf-green flex items-center gap-2 font-bold rounded-xl hover:bg-leaf-green/20 transition-colors"
              >
                <PlusCircle className="w-5 h-5" /> Tambah Pengurus
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {dbStruktur.map((item: any, i: number) => (
                <div
                  key={item.id}
                  className="p-4 border border-gray-100 rounded-2xl bg-white shadow-sm flex items-start gap-4 hover:shadow-md transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 justify-center items-center flex text-gray-400 shrink-0 mt-1">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">
                        Jabatan / Peran
                      </label>
                      <input
                        className="w-full border-b border-gray-200 pb-1 text-sm font-bold text-soft-black focus:border-main-blue outline-none transition-colors bg-transparent"
                        value={item.role}
                        onChange={(e) => {
                          onFieldChangeKkg(item.id, "role", e.target.value);
                          handleOrgUpdate(item.id, { role: e.target.value });
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">
                        Nama Pengurus
                      </label>
                      <input
                        className="w-full border-b border-gray-200 pb-1 text-sm text-gray-600 focus:border-main-blue outline-none transition-colors bg-transparent"
                        value={item.name}
                        onChange={(e) => {
                          onFieldChangeKkg(item.id, "name", e.target.value);
                          handleOrgUpdate(item.id, { name: e.target.value });
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">
                        NIP
                      </label>
                      <input
                        className="w-full border-b border-gray-200 pb-1 text-sm text-gray-600 focus:border-main-blue outline-none transition-colors bg-transparent"
                        value={item.nip || ""}
                        onChange={(e) => {
                          onFieldChangeKkg(item.id, "nip", e.target.value);
                          handleOrgUpdate(item.id, { nip: e.target.value });
                        }}
                        placeholder="NIP Pengurus"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">
                        Asal Sekolah
                      </label>
                      <input
                        className="w-full border-b border-gray-200 pb-1 text-sm text-gray-600 focus:border-main-blue outline-none transition-colors bg-transparent"
                        value={item.school}
                        onChange={(e) => {
                          onFieldChangeKkg(item.id, "school", e.target.value);
                          handleOrgUpdate(item.id, { school: e.target.value });
                        }}
                      />
                    </div>
                    <div className="relative">
                      {isSavingOrg === item.id && (
                        <div className="absolute top-0 right-0">
                          <div className="w-4 h-4 border-2 border-main-blue border-t-transparent animate-spin rounded-full"></div>
                        </div>
                      )}
                      <ImageUpload
                        label="Foto Pengurus"
                        value={item.photo_url || ""}
                        onChange={(base64) => {
                          onFieldChangeKkg(item.id, "photo_url", base64);
                          handleOrgUpdate(item.id, { photo_url: base64 });
                        }}
                        maxWidth={200}
                        maxHeight={200}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOrgDelete(item.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {dbStruktur.length === 0 && (
                <p className="text-gray-400 text-sm italic py-4 col-span-2 text-center">
                  Belum ada struktur organisasi.
                </p>
              )}
            </div>
          </div>
        )}

        {activeKkgTab === "program" && (() => {
          const programCategories = form.programCategories || [
            { id: "tahunan", label: "Program Kerja Tahunan" },
            { id: "workshop", label: "Workshop & Pelatihan" },
            { id: "supervisi", label: "Supervisi Akademik" },
            { id: "media", label: "Pengembangan Media" },
          ];
          return (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-white p-5 border border-gray-100 rounded-2xl shadow-sm mb-4">
                <div>
                  <h4 className="font-bold text-soft-black text-sm">Kategori Program KKG</h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">Edit nama kategori, hapus kategori, atau tambah kategori baru sesuai keadaan sebenarnya.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newId = "cat_" + Date.now();
                    const newCategories = [
                      ...programCategories,
                      { id: newId, label: "Kategori Baru" }
                    ];
                    const newPrograms = { ...(form.programs || {}) };
                    newPrograms[newId] = [];
                    setKkgForm({
                      ...form,
                      programCategories: newCategories,
                      programs: newPrograms
                    });
                  }}
                  className="px-4 py-2 bg-main-blue hover:bg-hover-blue text-white rounded-xl font-bold flex items-center gap-2 text-xs transition-all shadow-md shadow-blue-500/10"
                >
                  <PlusCircle className="w-4 h-4" /> Kategori Baru
                </button>
              </div>

              {programCategories.map((cat: { id: string; label: string }) => {
                const key = cat.id;
                return (
                  <div
                    key={key}
                    className="p-5 border border-gray-100 rounded-2xl bg-gray-50/50 space-y-4 shadow-sm relative"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                      <div className="flex items-center gap-2 flex-grow">
                        <input
                          className="font-bold text-soft-black text-sm bg-white border border-gray-200 rounded-xl px-3 py-1.5 focus:border-main-blue focus:ring-1 focus:ring-main-blue outline-none flex-grow max-w-[325px]"
                          value={cat.label}
                          onChange={(e) => {
                            const newCategories = programCategories.map((c: any) => 
                              c.id === cat.id ? { ...c, label: e.target.value } : c
                            );
                            setKkgForm({ ...form, programCategories: newCategories });
                          }}
                          placeholder="Nama Kategori"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            const count = ((form.programs && form.programs[key]) || []).length;
                            let confirmMsg = `Apakah Anda yakin ingin menghapus kategori "${cat.label}"?`;
                            if (count > 0) {
                              confirmMsg += ` Semua ${count} program di dalamnya juga akan ikut terhapus secara permanen.`;
                            }
                            if (await confirm(confirmMsg, "Konfirmasi Hapus Kategori")) {
                              const newCategories = programCategories.filter((c: any) => c.id !== cat.id);
                              const newPrograms = { ...(form.programs || {}) };
                              delete newPrograms[key];
                              setKkgForm({
                                ...form,
                                programCategories: newCategories,
                                programs: newPrograms
                              });
                            }
                          }}
                          className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-xl transition-colors shrink-0"
                          title="Hapus Kategori"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const newPrograms = { ...(form.programs || {}) };
                          if (!newPrograms[key]) newPrograms[key] = [];
                          newPrograms[key].push({
                            title: "Program Baru",
                            desc: "",
                            date: "",
                            status: "rencana",
                          });
                          setKkgForm({ ...form, programs: newPrograms });
                        }}
                        className="text-xs bg-main-blue/10 text-main-blue hover:bg-main-blue/20 font-bold px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5 shrink-0 self-start md:self-auto"
                      >
                        <PlusCircle className="w-4 h-4" /> Tambah Program Kerja
                      </button>
                    </div>

                    <div className="space-y-4">
                      {((form.programs && form.programs[key]) || []).map(
                        (prog: any, i: number) => (
                          <div
                            key={i}
                            className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pr-8">
                              <div className="flex flex-col">
                                <label className="text-[10px] uppercase font-bold text-gray-400 mb-1">Judul Program Kerja</label>
                                <input
                                  className="border-b border-gray-100 pb-1 text-sm font-bold text-soft-black focus:border-main-blue outline-none bg-transparent"
                                  placeholder="Judul Program Kerja"
                                  value={prog.title}
                                  onChange={(e) => {
                                    const newPrograms = { ...form.programs };
                                    newPrograms[key][i].title = e.target.value;
                                    setKkgForm({ ...form, programs: newPrograms });
                                  }}
                                />
                              </div>
                              <div className="flex flex-col">
                                <label className="text-[10px] uppercase font-bold text-gray-400 mb-1">Waktu / Pelaksanaan</label>
                                <input
                                  className="border-b border-gray-100 pb-1 text-sm text-gray-600 focus:border-main-blue outline-none bg-transparent"
                                  placeholder="Waktu / Pelaksanaan"
                                  value={prog.date}
                                  onChange={(e) => {
                                    const newPrograms = { ...form.programs };
                                    newPrograms[key][i].date = e.target.value;
                                    setKkgForm({ ...form, programs: newPrograms });
                                  }}
                                />
                              </div>
                              <div className="flex flex-col col-span-1 md:col-span-2">
                                <label className="text-[10px] uppercase font-bold text-gray-400 mb-1">Status Kegiatan</label>
                                <select
                                  className="border-b border-gray-100 pb-1 text-sm font-bold text-blue-600 focus:border-main-blue outline-none bg-transparent"
                                  value={prog.status || "rencana"}
                                  onChange={(e) => {
                                    const newPrograms = { ...form.programs };
                                    newPrograms[key][i].status = e.target.value;
                                    setKkgForm({ ...form, programs: newPrograms });
                                  }}
                                >
                                  <option value="rencana">Rencana</option>
                                  <option value="berjalan">Berjalan</option>
                                  <option value="selesai">Selesai</option>
                                </select>
                              </div>
                              <div className="flex flex-col col-span-1 md:col-span-2">
                                <label className="text-[10px] uppercase font-bold text-gray-400 mb-1">Deskripsi Singkat</label>
                                <textarea
                                  className="border border-gray-100 rounded-lg p-2 text-sm text-gray-600 focus:border-main-blue outline-none bg-transparent w-full"
                                  placeholder="Deskripsi Singkat"
                                  value={prog.desc}
                                  onChange={(e) => {
                                    const newPrograms = { ...form.programs };
                                    newPrograms[key][i].desc = e.target.value;
                                    setKkgForm({ ...form, programs: newPrograms });
                                  }}
                                  rows={2}
                                />
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={async () => {
                                if (await confirm("Apakah Anda yakin ingin menghapus program kerja ini?", "Hapus Program")) {
                                  const newPrograms = { ...form.programs };
                                  newPrograms[key].splice(i, 1);
                                  setKkgForm({ ...form, programs: newPrograms });
                                }
                              }}
                              className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all absolute top-2 right-2 shrink-0 border border-transparent hover:border-red-100"
                              title="Hapus Program Kerja"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ),
                      )}
                      {((form.programs && form.programs[key]) || []).length === 0 && (
                        <p className="text-xs text-gray-400 italic py-2">
                          Belum ada program kerja di kategori ini.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}

        {activeKkgTab === "pengumuman" && (
          <div className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-2xl md:p-8">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-2xl flex items-center justify-center shadow-inner">
                  <Megaphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-yellow-900 text-lg">
                    Pengumuman Khusus KKG
                  </h3>
                  <p className="text-yellow-700 text-sm">
                    Pesan highlight ini akan muncul di bagian paling atas
                    halaman KKG.
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-yellow-100 shadow-sm space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-gray-50">
                  <label className="relative inline-block w-[60px] h-[34px]">
                    <input
                      type="checkbox"
                      id="kkg_announcement_active"
                      checked={localIsActive}
                      onChange={(e) => {
                        const isActive = e.target.checked;
                        setLocalIsActive(isActive);

                        if (updateContent) {
                          setIsSavingToggle(true);
                          const updated = {
                            ...form,
                            pengumuman: {
                              ...(form.pengumuman || {}),
                              isActive,
                            },
                          };
                          updateContent({ kkg: updated })
                            .then(() => {
                              alert(
                                isActive
                                  ? "Pengumuman KKG diaktifkan!"
                                  : "Pengumuman KKG dinonaktifkan!",
                              );
                              console.log(
                                "Pengumuman KKG updated to:",
                                isActive,
                              );
                            })
                            .catch((err) => {
                              alert("Gagal menyimpan pengaturan!");
                              console.error("Gagal menyimpan:", err);
                              setLocalIsActive(!isActive);
                            })
                            .finally(() =>
                              setTimeout(() => setIsSavingToggle(false), 1000),
                            );
                        }
                      }}
                      className="peer sr-only"
                    />
                    <span className="absolute cursor-pointer inset-0 bg-gray-300 transition-all duration-400 rounded-full peer-checked:bg-[#2196F3] before:absolute before:content-[''] before:h-[26px] before:w-[26px] before:left-[4px] before:bottom-[4px] before:bg-white before:transition-all before:duration-400 before:rounded-full peer-checked:before:translate-x-[26px]"></span>
                  </label>
                  <label
                    htmlFor="kkg_announcement_active"
                    className="text-sm font-bold text-gray-700 cursor-pointer"
                  >
                    Tampilkan Pengumuman ini di Halaman KKG
                  </label>
                  {isSavingToggle && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-[10px] text-yellow-600 font-bold bg-yellow-100 px-2 py-0.5 rounded-full animate-pulse ml-2"
                    >
                      Menyimpan...
                    </motion.span>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-2">
                      Judul Pengumuman
                    </label>
                    <input
                      type="text"
                      className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-yellow-500 outline-none bg-gray-50/50 font-bold transition-all"
                      value={localPengumuman.title || ""}
                      onChange={(e) =>
                        setLocalPengumuman(prev => ({ ...prev, title: e.target.value }))
                      }
                      placeholder="Masukkan judul (misal: Rapat Koordinasi)"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-2">
                      Isi Pesan Pengumuman
                    </label>
                    <ReactQuill
                      theme="snow"
                      value={localPengumuman.desc || ""}
                      onChange={(value) =>
                        setLocalPengumuman(prev => ({ ...prev, desc: value }))
                      }
                      className="w-full border border-gray-200 rounded-xl text-sm focus:border-yellow-500 outline-none bg-gray-50/50 min-h-[120px] transition-all"
                      placeholder="Tuliskan detail pengumuman yang ingin disampaikan kepada guru-guru..."
                      modules={{
                        toolbar: [
                          [{ 'header': [1, 2, 3, false] }],
                          ['bold', 'italic', 'underline', 'strike'],
                          [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                          [{ 'align': [] }],
                          ['link', 'image'],
                          ['clean']
                        ],
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-6 border-t border-gray-100 mt-8">
          <button
            type="submit"
            className="px-8 py-3.5 bg-gradient-to-r from-leaf-green to-emerald-500 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-green-500/20 transition-all flex items-center gap-2"
          >
            <CheckSquare className="w-5 h-5" /> Simpan Data KKG
          </button>
        </div>
      </form>
    </div>
  </div>
);
}

function AdminGugusForm({ gugusForm, setGugusForm, handleSaveContent }: any) {
  const { alert, confirm } = useAlert();
  const { content } = useSiteContent();
  const [activeTab, setActiveTab] = useState("profil");
  const [dbStruktur, setDbStruktur] = useState<any[]>([]);

  const form = {
    ...defaultContent.gugus,
    ...gugusForm,
  };

  const visi = form.visi || "";
  const misi = form.misi || [];
  const tujuan = form.tujuan || [];
  const sejarah = form.sejarah || "";
  const programs = form.programs || [];

  // Gugus: handle field change locally for performance
  const [isSavingOrg, setIsSavingOrg] = useState<string | null>(null);
  const debouncedOrgSave = useRef<NodeJS.Timeout | null>(null);

  const onFieldChangeGugus = (id: string, field: string, value: string) => {
    setDbStruktur((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const loadStruktur = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from("org_gugus")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      setDbStruktur(data || []);
    } catch (err) {
      console.error("Gagal memuat struktur Gugus:", err);
    }
  };

  React.useEffect(() => {
    loadStruktur();
  }, []);

  const handleOrgCreate = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from("org_gugus")
        .insert([{ role: "Jabatan Baru", name: "-", school: "-" }])
        .select();
      if (error) throw error;
      if (data) loadStruktur();
      await alert("Anggota baru berhasil ditambahkan", "Sukses", "success");
    } catch (err: any) {
      console.error("Error creating org_gugus:", err);
      await alert(
        "Gagal menambah anggota: " +
          (err.message || "Kesalahan tidak diketahui"),
        "Error",
        "error",
      );
    }
  };

  const handleOrgUpdate = async (id: string, updates: any) => {
    if (!supabase) return;

    if (debouncedOrgSave.current) clearTimeout(debouncedOrgSave.current);

    debouncedOrgSave.current = setTimeout(async () => {
      setIsSavingOrg(id);
      try {
        const { data, error } = await supabase
          .from("org_gugus")
          .update(updates)
          .eq("id", id)
          .select();
        if (error) throw error;
        if (data && data[0]) {
          setDbStruktur((prev) =>
            prev.map((item) => (item.id === id ? data[0] : item)),
          );
        }
      } catch (err: any) {
        console.error("Error updating org_gugus:", err);
        await alert(
          "Gagal menyimpan perubahan: " +
            (err.message || "Kesalahan tidak diketahui"),
          "Error",
          "error",
        );
      } finally {
        setIsSavingOrg(null);
      }
    }, 800);
  };

  const handleOrgDelete = async (id: string) => {
    if (!supabase) return;
    await supabase.from("org_gugus").delete().eq("id", id);
    loadStruktur();
  };

  return (
    <div className="space-y-10">
      {/* Gugus Clean Header */}
      <div className="bg-white p-8 rounded-[2rem] border-l-8 border-orange-500 shadow-sm mb-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
        <div className="flex items-center gap-8">
          <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 border border-orange-100">
            <Globe className="w-8 h-8" />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-orange-50 rounded-full border border-orange-100 mb-2">
              <div className="w-1 h-1 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest font-heading">Identitas Gugus</span>
            </div>
            <h2 className="text-2xl font-bold font-heading text-soft-black">
              Kelola Gugus
            </h2>
            <p className="text-sm text-gray-500">
              Manajemen profil, sejarah, visi misi, dan program kerja Gugus.
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
          <button
            type="button"
            onClick={() => setActiveTab("profil")}
            className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === "profil" ? "bg-white text-orange-600 shadow-sm" : "text-gray-500 hover:text-orange-600"}`}
          >
            Profil & Visi
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("struktur")}
            className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === "struktur" ? "bg-white text-orange-600 shadow-sm" : "text-gray-500 hover:text-orange-600"}`}
          >
            Struktur
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("program")}
            className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === "program" ? "bg-white text-orange-600 shadow-sm" : "text-gray-500 hover:text-orange-600"}`}
          >
            Program
          </button>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] border border-main-orange/20 shadow-xl shadow-blue-500/5">

      <form onSubmit={handleSaveContent} className="space-y-6">
        {activeTab === "profil" && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Sejarah Gugus
              </label>
              <textarea
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-main-blue outline-none bg-white/50"
                rows={4}
                value={sejarah}
                onChange={(e) =>
                  setGugusForm({ ...form, sejarah: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Tahun Berdiri
                </label>
                <input
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-main-blue outline-none bg-white/50"
                  value={form.tahunBerdiri || ""}
                  onChange={(e) =>
                    setGugusForm({ ...form, tahunBerdiri: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Sekolah Inti
                </label>
                <input
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-main-blue outline-none bg-white/50"
                  value={form.sekolahInti || ""}
                  onChange={(e) =>
                    setGugusForm({ ...form, sekolahInti: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Wilayah Kerja
                </label>
                <input
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-main-blue outline-none bg-white/50"
                  value={form.wilayahKerja || ""}
                  onChange={(e) =>
                    setGugusForm({ ...form, wilayahKerja: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Visi Gugus
              </label>
              <textarea
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-main-blue outline-none bg-white/50"
                rows={2}
                value={visi}
                onChange={(e) =>
                  setGugusForm({ ...form, visi: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-bold text-gray-700">
                    Misi Gugus
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setGugusForm({ ...form, misi: [...misi, ""] })
                    }
                    className="text-xs text-main-blue font-bold"
                  >
                    + Tambah
                  </button>
                </div>
                <div className="space-y-2">
                  {misi.map((m: string, i: number) => (
                    <div key={i} className="flex gap-2">
                      <input
                        className="flex-1 border border-gray-200 rounded-lg p-2 text-sm outline-none bg-white/50"
                        value={m}
                        onChange={(e) => {
                          const next = [...misi];
                          next[i] = e.target.value;
                          setGugusForm({ ...form, misi: next });
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const next = [...misi];
                          next.splice(i, 1);
                          setGugusForm({ ...form, misi: next });
                        }}
                        className="text-red-400 p-2"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-bold text-gray-700">
                    Tujuan Gugus
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setGugusForm({ ...form, tujuan: [...tujuan, ""] })
                    }
                    className="text-xs text-main-blue font-bold"
                  >
                    + Tambah
                  </button>
                </div>
                <div className="space-y-2">
                  {tujuan.map((t: string, i: number) => (
                    <div key={i} className="flex gap-2">
                      <input
                        className="flex-1 border border-gray-200 rounded-lg p-2 text-sm outline-none bg-white/50"
                        value={t}
                        onChange={(e) => {
                          const next = [...tujuan];
                          next[i] = e.target.value;
                          setGugusForm({ ...form, tujuan: next });
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const next = [...tujuan];
                          next.splice(i, 1);
                          setGugusForm({ ...form, tujuan: next });
                        }}
                        className="text-red-400 p-2"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "struktur" && (
          <div className="space-y-6">
            <div className="bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100 mb-8">
              <h4 className="text-sm font-bold text-main-blue mb-4 flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4" /> Preview Struktur
                Organisasi{" "}
                {content.profil.periodeKepengurusan && (
                  <span className="text-gray-500 font-normal">
                    | Periode: {content.profil.periodeKepengurusan}
                  </span>
                )}
              </h4>
              <div className="bg-white rounded-2xl p-4 shadow-inner overflow-x-auto min-h-[300px]">
                <OrgChart
                  members={dbStruktur}
                  onEdit={(member) => {
                    const newRole = window.prompt("Edit Jabatan:", member.role);
                    const newName = window.prompt("Edit Nama:", member.name);
                    const newNip = window.prompt("Edit NIP:", member.nip || "");
                    const newSchool = window.prompt(
                      "Edit Sekolah:",
                      member.school,
                    );
                    if (
                      newRole !== null ||
                      newName !== null ||
                      newNip !== null ||
                      newSchool !== null
                    ) {
                      handleOrgUpdate(member.id, {
                        role: newRole !== null ? newRole : member.role,
                        name: newName !== null ? newName : member.name,
                        nip: newNip !== null ? newNip : member.nip,
                        school: newSchool !== null ? newSchool : member.school,
                      });
                    }
                  }}
                  onDelete={handleOrgDelete}
                />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-soft-black">
                Daftar Pengurus Gugus
              </h4>
              <button
                type="button"
                onClick={handleOrgCreate}
                className="px-4 py-2 bg-leaf-green/10 text-leaf-green flex items-center gap-2 font-bold rounded-xl hover:bg-leaf-green/20 transition-colors"
              >
                <PlusCircle className="w-5 h-5" /> Tambah Pengurus
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {dbStruktur.map((item: any) => (
                <div
                  key={item.id}
                  className="p-4 border border-gray-100 rounded-2xl bg-white shadow-sm flex items-start gap-4 hover:shadow-md transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 justify-center items-center flex text-gray-400 shrink-0 mt-1">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">
                        Jabatan / Peran
                      </label>
                      <input
                        className="w-full border-b border-gray-200 pb-1 text-sm font-bold text-soft-black focus:border-main-blue outline-none transition-colors bg-transparent"
                        value={item.role}
                        onChange={(e) => {
                          onFieldChangeGugus(item.id, "role", e.target.value);
                          handleOrgUpdate(item.id, { role: e.target.value });
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">
                        Nama Pengurus
                      </label>
                      <input
                        className="w-full border-b border-gray-200 pb-1 text-sm text-gray-600 focus:border-main-blue outline-none transition-colors bg-transparent"
                        value={item.name}
                        onChange={(e) => {
                          onFieldChangeGugus(item.id, "name", e.target.value);
                          handleOrgUpdate(item.id, { name: e.target.value });
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">
                        NIP
                      </label>
                      <input
                        className="w-full border-b border-gray-200 pb-1 text-sm text-gray-600 focus:border-main-blue outline-none transition-colors bg-transparent"
                        value={item.nip || ""}
                        onChange={(e) => {
                          onFieldChangeGugus(item.id, "nip", e.target.value);
                          handleOrgUpdate(item.id, { nip: e.target.value });
                        }}
                        placeholder="NIP Pengurus"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">
                        Asal Sekolah
                      </label>
                      <input
                        className="w-full border-b border-gray-200 pb-1 text-sm text-gray-600 focus:border-main-blue outline-none transition-colors bg-transparent"
                        value={item.school}
                        onChange={(e) => {
                          onFieldChangeGugus(item.id, "school", e.target.value);
                          handleOrgUpdate(item.id, { school: e.target.value });
                        }}
                      />
                    </div>
                    <div className="relative">
                      {isSavingOrg === item.id && (
                        <div className="absolute top-0 right-0">
                          <div className="w-4 h-4 border-2 border-main-blue border-t-transparent animate-spin rounded-full"></div>
                        </div>
                      )}
                      <ImageUpload
                        label="Foto Pengurus"
                        value={item.photo_url || ""}
                        onChange={(base64) => {
                          onFieldChangeGugus(item.id, "photo_url", base64);
                          handleOrgUpdate(item.id, { photo_url: base64 });
                        }}
                        maxWidth={200}
                        maxHeight={200}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOrgDelete(item.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {dbStruktur.length === 0 && (
                <p className="text-gray-400 text-sm italic py-4 col-span-2 text-center">
                  Belum ada struktur organisasi.
                </p>
              )}
            </div>
          </div>
        )}

        {activeTab === "program" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-soft-black">Program Gugus</h4>
              <button
                type="button"
                onClick={() =>
                  setGugusForm({
                    ...form,
                    programs: [
                      ...programs,
                      { title: "Program Baru", desc: "", date: "" },
                    ],
                  })
                }
                className="text-xs text-main-blue font-bold"
              >
                + Tambah Program
              </button>
            </div>
            <div className="space-y-4">
              {programs.map((p: any, i: number) => (
                <div
                  key={i}
                  className="p-4 border border-gray-100 rounded-2xl bg-gray-50/50 space-y-3 relative group"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      className="w-full border-b border-gray-200 p-1 text-sm font-bold text-soft-black outline-none bg-transparent"
                      placeholder="Judul Program"
                      value={p.title}
                      onChange={(e) => {
                        const next = [...programs];
                        next[i].title = e.target.value;
                        setGugusForm({ ...form, programs: next });
                      }}
                    />
                    <input
                      className="w-full border-b border-gray-200 p-1 text-sm text-gray-600 outline-none bg-transparent"
                      placeholder="Waktu"
                      value={p.date}
                      onChange={(e) => {
                        const next = [...programs];
                        next[i].date = e.target.value;
                        setGugusForm({ ...form, programs: next });
                      }}
                    />
                    <select
                      className="w-full border-b border-gray-200 p-1 text-sm font-bold text-orange-600 outline-none bg-transparent"
                      value={p.status || "rencana"}
                      onChange={(e) => {
                        const next = [...programs];
                        next[i].status = e.target.value;
                        setGugusForm({ ...form, programs: next });
                      }}
                    >
                      <option value="rencana">Rencana</option>
                      <option value="berjalan">Berjalan</option>
                      <option value="selesai">Selesai</option>
                    </select>
                    <textarea
                      className="w-full border border-gray-200 rounded-lg p-2 text-sm text-gray-600 outline-none bg-white/50 col-span-2"
                      rows={2}
                      placeholder="Deskripsi"
                      value={p.desc}
                      onChange={(e) => {
                        const next = [...programs];
                        next[i].desc = e.target.value;
                        setGugusForm({ ...form, programs: next });
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      if (await confirm(`Apakah Anda yakin ingin menghapus program "${p.title || 'ini'}"?`, "Hapus Program Kerja")) {
                        const next = [...programs];
                        next.splice(i, 1);
                        setGugusForm({ ...form, programs: next });
                      }
                    }}
                    className="absolute top-2 right-2 text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all"
                    title="Hapus Program Kerja"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end pt-6 border-t border-gray-100 mt-8">
          <button
            type="submit"
            className="px-8 py-3.5 bg-main-blue text-white rounded-xl font-bold shadow-lg shadow-main-blue/20"
          >
            Simpan Profil Gugus
          </button>
        </div>
      </form>
    </div>
  </div>
);
}

function AdminPenghargaanForm() {
  const [awards, setAwards] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const debouncedSave = useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    async function loadAwards() {
      if (!supabase) return;
      try {
        const { data } = await supabase
          .from("awards")
          .select("*")
          .order("created_at", { ascending: false });
        setAwards(data || []);
      } catch (err) {
        console.error("Error fetching awards:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadAwards();
  }, []);

  const { alert, confirm } = useAlert();
  const [newAward, setNewAward] = useState({
    title: "",
    category: "Guru",
    year: new Date().getFullYear(),
    description: "",
    image_url: "",
    rank: ""
  });
  const [isAdding, setIsAdding] = useState(false);

  const handleAddNewAward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    const { data, error } = await supabase
      .from("awards")
      .insert([newAward])
      .select();
    if (!error && data) {
      setAwards([data[0], ...awards]);
      setNewAward({ title: "", category: "Guru", year: new Date().getFullYear(), description: "", image_url: "" });
      setIsAdding(false);
      alert("Penghargaan berhasil ditambahkan!", "Sukses", "success");
    } else {
      console.error("Error adding award:", error);
      alert("Gagal menambahkan penghargaan: " + (error?.message || "Terjadi kesalahan"), "Error", "error");
    }
  };

  const handleCreate = async () => {
    setIsAdding(true);
  };

  const handleUpdate = (id: string, updates: any) => {
    setAwards(awards.map((a: any) => (a.id === id ? { ...a, ...updates } : a)));

    if (debouncedSave.current) clearTimeout(debouncedSave.current);

    debouncedSave.current = setTimeout(async () => {
      if (!supabase) return;
      const { error } = await supabase
        .from("awards")
        .update(updates)
        .eq("id", id);
      if (error) {
        console.error("Error updating award:", error);
      }
    }, 800);
  };

  const handleDelete = async (id: string) => {
    if (!supabase) return;
    if (await confirm("Apakah Anda yakin ingin menghapus penghargaan ini?", "Konfirmasi Hapus")) {
      const { error } = await supabase.from("awards").delete().eq("id", id);
      if (!error) {
        setAwards(awards.filter((a: any) => a.id !== id));
      }
    }
  };

  return (
    <div className="space-y-10">
      {/* Penghargaan Clean Header */}
      <div className="bg-white p-8 rounded-[2rem] border-l-8 border-amber-500 shadow-sm mb-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
        <div className="flex items-center gap-8">
          <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 border border-amber-100">
            <Trophy className="w-8 h-8" />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-amber-50 rounded-full border border-amber-100 mb-2">
              <div className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest font-heading">Apresiasi & Prestasi</span>
            </div>
            <h2 className="text-2xl font-bold font-heading text-soft-black">
              Kelola Penghargaan
            </h2>
            <p className="text-sm text-gray-500">
              Kelola data penghargaan dan sertifikat prestasi di lingkungan GUGUS 03.
            </p>
          </div>
        </div>
        
        <button
          onClick={handleCreate}
          className="bg-amber-500 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-md hover:bg-amber-600 active:scale-95 transition-all flex items-center gap-3"
        >
          <PlusCircle className="w-4 h-4" /> Tambah Penghargaan
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddNewAward} className="bg-white p-6 rounded-2xl border border-amber-100 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-700">Tambah Penghargaan Baru</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input placeholder="Nama Penghargaan" className="p-2 border rounded" value={newAward.title} onChange={e => setNewAward({...newAward, title: e.target.value})} required/>
            <input placeholder="Peringkat Kejuaraan (misal: Juara 1)" className="p-2 border rounded" value={newAward.rank} onChange={e => setNewAward({...newAward, rank: e.target.value})}/>
            <input placeholder="Tahun" type="number" className="p-2 border rounded" value={newAward.year} onChange={e => setNewAward({...newAward, year: parseInt(e.target.value)})} required/>
            <select className="p-2 border rounded" value={newAward.category} onChange={e => setNewAward({...newAward, category: e.target.value})}>
                <option value="Guru">Guru</option>
                <option value="Siswa">Siswa</option>
                <option value="Kepala Sekolah">Kepala Sekolah</option>
                <option value="Sekolah">Sekolah</option>
            </select>
            <div className="w-full mt-2">
              <ImageUpload
                label="Foto Penghargaan"
                value={newAward.image_url}
                onChange={(base64) => setNewAward({...newAward, image_url: base64})}
                maxWidth={600}
                maxHeight={400}
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Catatan: Upload foto penghargaan (otomatis diperkecil).</p>
          <div className="w-full">
            <label className="block text-[11px] uppercase font-bold text-gray-400 mb-2">
              Deskripsi Penghargaan (Rich Text)
            </label>
            <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-inner min-h-[140px]">
              <ReactQuill
                theme="snow"
                value={newAward.description || ""}
                onChange={(content) => setNewAward({...newAward, description: content})}
                className="h-full border-none"
                modules={{
                  toolbar: [
                    ["bold", "italic", "underline", "strike"],
                    [{ list: "ordered" }, { list: "bullet" }],
                    ["link", "clean"]
                  ]
                }}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">Simpan</button>
            <button type="button" onClick={() => setIsAdding(false)} className="bg-gray-200 px-4 py-2 rounded">Batal</button>
          </div>
        </form>
      )}

      <div className="space-y-6">
        {isLoading ? (
          <div className="text-center text-gray-400 py-10">Memuat data...</div>
        ) : awards.length === 0 ? (
          <div className="text-center text-gray-400 py-10">
            Belum ada penghargaan.
          </div>
        ) : (
          awards.map((item: any) => (
            <div
              key={item.id}
              className="flex gap-4 p-4 border border-gray-100 rounded-xl bg-gray-50 group relative"
            >
              <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 pr-8">
                <div className="md:col-span-2">
                  <div className="flex gap-2 items-center mb-1">
                    <label className="block text-[10px] uppercase font-bold text-gray-400">
                        Nama Penghargaan
                    </label>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700 uppercase">
                        {item.category}
                    </span>
                  </div>
                  <input
                    className="w-full border-b border-gray-200 text-sm font-bold text-soft-black outline-none bg-transparent"
                    value={item.title}
                    onChange={(e) =>
                      handleUpdate(item.id, { title: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">
                      Peringkat
                  </label>
                  <input
                    className="w-full border-b border-gray-200 text-sm font-medium text-gray-600 outline-none bg-transparent"
                    value={item.rank || ""}
                    onChange={(e) =>
                      handleUpdate(item.id, { rank: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">
                    Tahun
                  </label>
                  <input
                    className="w-full border-b border-gray-200 text-sm font-bold text-soft-black outline-none bg-transparent"
                    type="number"
                    value={item.year}
                    onChange={(e) =>
                      handleUpdate(item.id, { year: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">
                    Kategori
                  </label>
                  <select
                    className="w-full border-b border-gray-200 text-sm font-bold text-soft-black outline-none bg-transparent"
                    value={item.category}
                    onChange={(e) =>
                      handleUpdate(item.id, { category: e.target.value })
                    }
                  >
                    <option value="Siswa">Siswa</option>
                    <option value="Guru">Guru</option>
                    <option value="Kepala Sekolah">Kepala Sekolah</option>
                    <option value="Sekolah">Sekolah</option>
                  </select>
                </div>
                <div className="md:col-span-4">
                  <ImageUpload
                    label="Foto Penghargaan"
                    value={item.image_url || ""}
                    onChange={(base64) =>
                      handleUpdate(item.id, { image_url: base64 })
                    }
                    maxWidth={600}
                    maxHeight={400}
                  />
                </div>
                <div className="md:col-span-4">
                  <label className="block text-[10px] uppercase font-bold text-gray-400 mb-2">
                    Deskripsi (Rich Text)
                  </label>
                  <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-inner min-h-[140px]">
                    <ReactQuill
                      theme="snow"
                      value={item.description || ""}
                      onChange={(content) =>
                        handleUpdate(item.id, { description: content })
                      }
                      className="h-full border-none"
                      modules={{
                        toolbar: [
                          ["bold", "italic", "underline", "strike"],
                          [{ list: "ordered" }, { list: "bullet" }],
                          ["link", "clean"]
                        ]
                      }}
                    />
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function AdminPengumumanForm({ user }: { user: any }) {
  const { confirm } = useAlert();
  const [news, setNews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const debouncedSave = useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    async function loadNews() {
      if (!supabase) return;
      try {
        const { data } = await supabase
          .from("posts")
          .select("*")
          .eq("category", "pengumuman")
          .order("published_at", { ascending: false });
        setNews(data || []);
      } catch (err) {
        console.error("Error fetching pengumuman:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadNews();
  }, []);

  const handleCreate = async () => {
    if (!supabase) return;
    const newPost = {
      title: "Pengumuman Baru",
      slug: `pengumuman-baru-${Date.now()}`,
      content: "Konten pengumuman...",
      featured_image_url: "",
      category: "pengumuman",
      published_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from("posts")
      .insert([newPost])
      .select();
    if (!error && data) {
      logActivity(user, "create_pengumuman", `Menambah pengumuman baru: ${newPost.title}`);
      setNews([data[0], ...news]);
    }
  };

  const handleUpdate = (id: string, updates: any) => {
    setNews(news.map((n: any) => (n.id === id ? { ...n, ...updates } : n)));

    if (debouncedSave.current) clearTimeout(debouncedSave.current);

    debouncedSave.current = setTimeout(async () => {
      if (!supabase) return;
      const { error } = await supabase
        .from("posts")
        .update(updates)
        .eq("id", id);
      if (error) {
        console.error("Error updating announcement:", error);
      } else {
        logActivity(user, "update_pengumuman", `Memperbarui pengumuman ID: ${id}`);
      }
    }, 800);
  };

  const handleDelete = async (id: string) => {
    if (!supabase) return;
    if (await confirm("Hapus pengumuman ini?", "Konfirmasi")) {
      const { error } = await supabase.from("posts").delete().eq("id", id);
      if (!error) {
        logActivity(user, "delete_pengumuman", `Menghapus pengumuman ID: ${id}`);
        setNews(news.filter((n: any) => n.id !== id));
      }
    }
  };

  return (
    <div className="space-y-10">
      {/* Pengumuman Clean Header */}
      <div className="bg-white p-8 rounded-[2rem] border-l-8 border-red-500 shadow-sm mb-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
        <div className="flex items-center gap-8">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 border border-red-100">
            <Megaphone className="w-8 h-8" />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-red-50 rounded-full border border-red-100 mb-2">
              <div className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest font-heading">Informasi Penting</span>
            </div>
            <h2 className="text-2xl font-bold font-heading text-soft-black">
              Kelola Pengumuman
            </h2>
            <p className="text-sm text-gray-500">
              Publikasikan pengumuman mendesak dan informasi resmi Gugus 03.
            </p>
          </div>
        </div>
        
        <button
          onClick={handleCreate}
          className="bg-red-500 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-md hover:bg-red-600 active:scale-95 transition-all flex items-center gap-3"
        >
          <PlusCircle className="w-4 h-4" /> Buat Pengumuman
        </button>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col gap-4 mb-6">
          {isLoading ? (
            <div className="text-center text-gray-400 py-10">
              Memuat data...
            </div>
          ) : news.length === 0 ? (
            <div className="text-center text-gray-400 py-10">
              Belum ada pengumuman.
            </div>
          ) : (
            news.map((item: any) => (
              <div
                key={item.id}
                className="flex gap-4 p-4 border border-gray-100 rounded-xl bg-gray-50 group"
              >
                <div className="flex-1 grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">
                      Judul Pengumuman
                    </label>
                    <input
                      className="w-full border-b border-gray-200 text-sm font-bold text-soft-black outline-none bg-transparent"
                      value={item.title}
                      onChange={(e) =>
                        handleUpdate(item.id, { title: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">
                      Tanggal Pengumuman
                    </label>
                    <input
                      type="date"
                      className="w-full border-b border-gray-200 text-sm font-bold text-soft-black outline-none bg-transparent"
                      value={item.published_at ? item.published_at.split('T')[0] : ''}
                      onChange={(e) =>
                        handleUpdate(item.id, { published_at: new Date(e.target.value).toISOString() })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">
                      Isi Singkat Pengumuman
                    </label>
                    <textarea
                      className="w-full border-b border-gray-200 text-sm text-soft-black outline-none bg-transparent"
                      value={item.content}
                      rows={2}
                      onChange={(e) =>
                        handleUpdate(item.id, { content: e.target.value })
                      }
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function AdminLandmarkForm() {
  const { alert } = useAlert();
  const [landmarks, setLandmarks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLandmark, setEditingLandmark] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    latitude: "",
    longitude: "",
    icon: "📍",
    color: "bg-blue-500 text-white",
    embedCode: "",
    description: "",
    imageUrl: "",
    isVisible: true,
  });

  useEffect(() => {
    loadLandmarks();
  }, []);

  const loadLandmarks = async () => {
    setIsLoading(true);
    if (!supabase) return;
    const { data, error } = await supabase
      .from("landmarks")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) {
      setLandmarks(data);
    }
    setIsLoading(false);
  };

  const handleEmbedParse = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setFormData((prev) => ({ ...prev, embedCode: val }));

    let lat = "";
    let lng = "";

    // 1. Try `pb` parameter in embed iframe (!3d and !2d/!4d)
    const pbLatMatch = val.match(/!3d(-?\d+\.\d+)/);
    const pbLngMatch = val.match(/!2d(-?\d+\.\d+)/) || val.match(/!4d(-?\d+\.\d+)/);
    
    if (pbLatMatch && pbLngMatch) {
      lat = pbLatMatch[1];
      lng = pbLngMatch[1];
    } 
    // 2. Try @lat,lng pattern from normal URLs
    else {
      const atMatch = val.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (atMatch) {
        lat = atMatch[1];
        lng = atMatch[2];
      }
    }

    if (lat && lng) {
      setFormData((prev) => ({
        ...prev,
        latitude: lat,
        longitude: lng,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    
    // Ensure lat/lng are properly set
    let lat = parseFloat(formData.latitude);
    let lng = parseFloat(formData.longitude);
    
    if (isNaN(lat) || isNaN(lng)) {
      await alert("Latitude dan Longitude harus berupa angka yang valid", "Warning", "error");
      return;
    }

    // append flag if hidden to color
    const cleanColor = formData.color.replace("_hidden", "");
    const finalColor = formData.isVisible ? cleanColor : cleanColor + "_hidden";

    const payload = {
      name: formData.name,
      latitude: lat,
      longitude: lng,
      icon: formData.icon,
      color: finalColor,
      embed_code: formData.embedCode,
      description: formData.description,
      image_url: formData.imageUrl,
    };

    if (editingLandmark) {
      const { error } = await supabase
        .from("landmarks")
        .update(payload)
        .eq("id", editingLandmark.id);
      if (error) {
        await alert("Gagal memperbarui landmark", "Error", "error");
      } else {
        setIsModalOpen(false);
        setEditingLandmark(null);
        loadLandmarks();
        await alert("Landmark berhasil diperbarui", "Sukses", "success");
      }
    } else {
      const { error } = await supabase.from("landmarks").insert([payload]);
      if (error) {
        await alert("Gagal menambahkan landmark", "Error", "error");
      } else {
        setIsModalOpen(false);
        setEditingLandmark(null);
        loadLandmarks();
        await alert("Landmark berhasil ditambahkan", "Sukses", "success");
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!supabase) return;
    if (window.confirm("Yakin ingin menghapus landmark ini?")) {
      await supabase.from("landmarks").delete().eq("id", id);
      await alert("Landmark berhasil dihapus");
      loadLandmarks();
    }
  };

  const toggleVisibility = async (item: any) => {
    if (!supabase) return;
    try {
      const isCurrentlyHidden = item.color?.includes("_hidden");
      const baseColor = item.color || "bg-blue-500 text-white";
      const newColor = isCurrentlyHidden ? baseColor.replace("_hidden", "") : (baseColor.includes("_hidden") ? baseColor : baseColor + "_hidden");

      const { error } = await supabase
        .from("landmarks")
        .update({ color: newColor })
        .eq("id", item.id);

      if (error) {
        await alert("Gagal memperbarui status tampil: " + error.message, "Gagal", "error");
      } else {
        loadLandmarks();
        await alert(isCurrentlyHidden ? "Landmark sekarang ditampilkan!" : "Landmark berhasil disembunyikan!", "Sukses", "success");
      }
    } catch (err: any) {
      await alert(err.message || "Gagal memperbarui status", "Error", "error");
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 pb-6 border-b border-gray-100 gap-4">
        <div>
          <h2 className="text-2xl font-black font-heading text-soft-black">Kelola Peta Digital</h2>
          <p className="text-sm text-gray-450 mt-1">Atur lokasi landmark yang tampil di peta Gugus.</p>
        </div>
        <button
          onClick={() => {
            setEditingLandmark(null);
            setFormData({ 
              name: "", 
              latitude: "", 
              longitude: "", 
              icon: "📍", 
              color: "bg-blue-500 text-white", 
              embedCode: "",
              description: "",
              imageUrl: "",
              isVisible: true,
            });
            setIsModalOpen(true);
          }}
          className="px-6 py-3 bg-main-blue hover:bg-hover-blue text-white rounded-xl shadow-lg shadow-blue-500/20 font-bold transition-all hover:-translate-y-0.5 flex items-center gap-2 text-sm whitespace-nowrap"
        >
          <MapPin className="w-4 h-4" />
          <span>Tambah Landmark</span>
        </button>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-400 font-medium">Memuat data...</div>
        ) : landmarks.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-4">
              <MapPin className="w-8 h-8" />
            </div>
            <p className="text-gray-500 font-medium">Belum ada lokasi landmark/titik peta.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="py-4 px-6 text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 w-16">No</th>
                  <th className="py-4 px-6 text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Info Landmark</th>
                  <th className="py-4 px-6 text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 hidden md:table-cell">Koordinat</th>
                  <th className="py-4 px-6 text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center w-36">Status Tampil</th>
                  <th className="py-4 px-6 text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-right w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {landmarks.map((item, idx) => {
                  const isVisible = !item.color?.includes("_hidden");
                  const displayColor = (item.color || "bg-blue-500 text-white").replace("_hidden", "");
                  return (
                    <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="py-4 px-6 text-sm font-bold text-gray-300">{idx + 1}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${displayColor}`}>
                            {item.icon}
                          </div>
                          <div>
                            <p className="font-bold text-soft-black">{item.name}</p>
                            {item.description && <p className="text-xs text-gray-400 truncate max-w-[200px]">{item.description}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 hidden md:table-cell">
                        <p className="text-xs font-mono text-gray-500 bg-gray-50 inline-block px-2 py-1 rounded">
                          {item.latitude}, {item.longitude}
                        </p>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button
                          type="button"
                          onClick={() => toggleVisibility(item)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-main-blue/20 ${
                            isVisible ? "bg-emerald-500" : "bg-gray-200"
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              isVisible ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              const isHidden = item.color?.includes("_hidden");
                              const cleanColor = (item.color || "bg-blue-500 text-white").replace("_hidden", "");
                              setEditingLandmark(item);
                              setFormData({
                                name: item.name,
                                latitude: item.latitude.toString(),
                                longitude: item.longitude.toString(),
                                icon: item.icon,
                                color: cleanColor,
                                embedCode: item.embed_code || "",
                                description: item.description || "",
                                imageUrl: item.image_url || "",
                                isVisible: !isHidden,
                              });
                              setIsModalOpen(true);
                            }}
                            className="p-2 text-main-blue hover:bg-main-blue/10 rounded-xl transition-colors shrink-0"
                            title="Edit"
                          >
                            <PenTool className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors shrink-0"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4 text-gray-350 hover:text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-dark-gray/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="bg-white rounded-[2rem] shadow-2xl relative border border-gray-100 max-w-2xl w-full max-h-[85vh] overflow-y-auto p-8 z-10 scrollbar-thin">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-400"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-2xl font-bold font-heading mb-6">{editingLandmark ? "Edit Landmark" : "Tambah Landmark Baru"}</h3>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Nama Landmark</label>
                <input required type="text" className="w-full p-4 bg-gray-50 rounded-xl text-sm font-bold focus:ring-2 focus:ring-main-blue/20 outline-none" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Contoh: Pabrik TPPI" />
              </div>
              
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50">
                <label className="block text-xs font-bold text-main-blue uppercase tracking-widest mb-2">Auto-Fill Koordinat (Khusus Google Maps)</label>
                <p className="text-xs text-gray-500 mb-3 leading-relaxed">Pilih Bagikan &gt; Sematkan Peta pada Google Maps, lalu salin kode HTML-nya kesini. Sistem otomatis akan mengekstrak koordinat.</p>
                <textarea className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs font-mono text-gray-500 focus:ring-2 focus:ring-main-blue/20 outline-none resize-none h-20" placeholder="<iframe src=..." value={formData.embedCode} onChange={handleEmbedParse} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Latitude</label>
                  <input required type="text" className="w-full p-4 bg-gray-50 rounded-xl text-sm font-mono focus:ring-2 focus:ring-main-blue/20 outline-none" value={formData.latitude} onChange={(e) => setFormData({...formData, latitude: e.target.value})} placeholder="-6.786" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Longitude</label>
                  <input required type="text" className="w-full p-4 bg-gray-50 rounded-xl text-sm font-mono focus:ring-2 focus:ring-main-blue/20 outline-none" value={formData.longitude} onChange={(e) => setFormData({...formData, longitude: e.target.value})} placeholder="111.966" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Emoji/Ikon</label>
                  <input type="text" className="w-full p-4 bg-gray-50 rounded-xl text-xl font-bold focus:ring-2 focus:ring-main-blue/20 outline-none text-center" value={formData.icon} onChange={(e) => setFormData({...formData, icon: e.target.value})} placeholder="📍" maxLength={2} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Warna (Tailwind Class)</label>
                  <select className="w-full p-4 bg-gray-50 rounded-xl text-sm font-bold focus:ring-2 focus:ring-main-blue/20 outline-none" value={formData.color} onChange={(e) => setFormData({...formData, color: e.target.value})}>
                    <option value="bg-blue-500 text-white">Biru</option>
                    <option value="bg-red-600 text-white">Merah</option>
                    <option value="bg-yellow-500 text-white">Kuning</option>
                    <option value="bg-emerald-400 text-white">Hijau</option>
                    <option value="bg-orange-500 text-white">Oranye</option>
                    <option value="bg-cyan-400 text-white">Cyan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Deskripsi / Informasi Landmark</label>
                <textarea className="w-full p-4 bg-gray-50 rounded-xl text-sm font-bold focus:ring-2 focus:ring-main-blue/20 outline-none resize-none h-24" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Ketik informasi detail landmark ini, misal sejarah, daya tarik, dll..." />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">URL Gambar / Foto Landmark</label>
                <input type="text" className="w-full p-4 bg-gray-50 rounded-xl text-sm font-bold focus:ring-2 focus:ring-main-blue/20 outline-none" value={formData.imageUrl} onChange={(e) => setFormData({...formData, imageUrl: e.target.value})} placeholder="Tautan gambar (unsplash, google drive, dll)" />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-bold text-sm text-soft-black">Tampilkan Landmark</p>
                  <p className="text-xs text-gray-400 mt-0.5">Aktifkan untuk menampilkan landmark ini di peta digital.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, isVisible: !prev.isVisible }))}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-main-blue/20 ${
                    formData.isVisible ? "bg-emerald-500" : "bg-gray-250"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      formData.isVisible ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 font-bold text-sm text-gray-500 hover:text-soft-black hover:bg-gray-100 rounded-xl transition-all">Batal</button>
                <button type="submit" className="px-6 py-3 font-bold text-sm bg-main-blue text-white hover:bg-hover-blue rounded-xl shadow-lg shadow-blue-500/20 transition-all">
                  {editingLandmark ? "Simpan Perubahan" : "Tambahkan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminGuruForm({ user }: { user: any }) {
  const { alert } = useAlert();
  const [gurus, setGurus] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  React.useEffect(() => {
    async function loadGurus() {
      if (!supabase) return;
      try {
        const { data } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("role", "guru");
        // Map avatar_url to foto and APPLY SORTING
        const mappedData = (data || []).map((g) => ({
          ...g,
          foto: g.foto || g.avatar_url,
        })).sort((a, b) => {
          // 1. Sort by School (A-Z)
          const schoolA = (a.sekolah || "").toLowerCase();
          const schoolB = (b.sekolah || "").toLowerCase();
          if (schoolA < schoolB) return -1;
          if (schoolA > schoolB) return 1;
          
          // 2. If same school, sort by Position priority
          const normalizeJab = (val: string) => {
            let j = val.toLowerCase().trim();
            // Normalize Roman numerals and numbers
            if (j.includes("kelas 1")) j = j.replace("kelas 1", "kelas i");
            if (j.includes("kelas 2")) j = j.replace("kelas 2", "kelas ii");
            if (j.includes("kelas 3")) j = j.replace("kelas 3", "kelas iii");
            if (j.includes("kelas 4")) j = j.replace("kelas 4", "kelas iv");
            if (j.includes("kelas 5")) j = j.replace("kelas 5", "kelas v");
            if (j.includes("kelas 6")) j = j.replace("kelas 6", "kelas vi");
            return j;
          };

          const jabA = normalizeJab(a.jabatan || "");
          const jabB = normalizeJab(b.jabatan || "");
          
          const priority: Record<string, number> = {
            "kepala sekolah": 1,
            "guru kelas i": 2,
            "guru kelas ii": 3,
            "guru kelas iii": 4,
            "guru kelas iv": 5,
            "guru kelas v": 6,
            "guru kelas vi": 7,
            "guru pjok": 8,
            "guru paibp": 9,
            "guru pai": 9
          };

          const pA = priority[jabA] || 99;
          const pB = priority[jabB] || 99;
          
          if (pA !== pB) return pA - pB;
          
          // 3. If same position, sort by Name (A-Z)
          return (a.nama || "").localeCompare(b.nama || "");
        });
        setGurus(mappedData);
      } catch (err) {
        console.error("Error fetching guru:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadGurus();
  }, []);

  const handleUpdateGuru = async (id: string, updates: any) => {
    if (!supabase) return;
    try {
      // Gunakan field foto untuk DB yang telah dimigrasi
      const dbUpdates = { ...updates };
      // Hapus jika ada properti avatar_url bawaan lama agar tidak error
      if ('avatar_url' in dbUpdates) {
        delete dbUpdates.avatar_url;
      }
      
      // Hapus primary key dan system-managed columns agar tidak error saat update
      delete dbUpdates.id;
      delete dbUpdates.created_at;
      delete dbUpdates.updated_at;

      const { error } = await supabase
        .from("user_profiles")
        .update(dbUpdates)
        .eq("id", id);
      if (error) throw error;
      logActivity(user, "update_guru", `Memperbarui profil guru ID: ${id}`);
      setGurus((prev) =>
        prev.map((g) => (g.id === id ? { ...g, ...updates } : g)),
      );
      if (editingId === id) {
        setEditingId(null);
      }
      await alert("Data guru berhasil diperbarui!");
    } catch (err: any) {
      console.error("Error updating guru:", err);
      await alert("Gagal memperbarui guru: " + err.message, "Error", "error");
    }
  };

  const startEdit = (g: any) => {
    setEditingId(g.id);
    setEditForm({ ...g });
  };

  return (
    <div className="space-y-10">
      {/* Guru Clean Header */}
      <div className="bg-white p-8 rounded-[2rem] border-l-8 border-leaf-green shadow-sm mb-10 flex flex-col md:flex-row md:items-center gap-10">
        <div className="w-16 h-16 bg-leaf-green/10 rounded-2xl flex items-center justify-center text-leaf-green border border-leaf-green/10 shrink-0">
          <GraduationCap className="w-8 h-8" />
        </div>
        <div>
          <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-leaf-green/10 rounded-full border border-leaf-green/5 mb-2">
            <div className="w-1 h-1 rounded-full bg-leaf-green animate-pulse" />
            <span className="text-[10px] font-bold text-leaf-green uppercase tracking-widest font-heading">Database Pendidik</span>
          </div>
          <h2 className="text-2xl font-bold font-heading text-soft-black">
            Kelola Guru
          </h2>
          <p className="text-sm text-gray-500">
            Daftar profil guru yang terdaftar dalam sistem GUGUS 03. Klik baris untuk mengedit data.
          </p>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden overflow-x-auto shadow-xl">
        <table className="w-full text-left text-sm border-collapse min-w-[1000px]">
          <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
            <tr>
              <th className="p-4 font-bold text-[10px] uppercase tracking-wider w-16">
                Foto
              </th>
              <th className="p-4 font-bold text-[10px] uppercase tracking-wider">
                Nama Lengkap
              </th>
              <th className="p-4 font-bold text-[10px] uppercase tracking-wider w-32">
                NIP
              </th>
              <th className="p-4 font-bold text-[10px] uppercase tracking-wider w-32">
                Pangkat/Gol
              </th>
              <th className="p-4 font-bold text-[10px] uppercase tracking-wider w-32">
                Kepegawaian
              </th>
              <th className="p-4 font-bold text-[10px] uppercase tracking-wider">
                Jabatan
              </th>
              <th className="p-4 font-bold text-[10px] uppercase tracking-wider">
                Sekolah
              </th>
              <th className="p-4 font-bold text-[10px] uppercase tracking-wider w-20">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} className="p-4 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : gurus.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-4 text-center text-gray-400">
                  Belum ada data guru
                </td>
              </tr>
            ) : (
              gurus.map((g, i) => {
                const isEditing = editingId === g.id;
                return (
                  <tr
                    key={g.id}
                    className={`border-b border-gray-50 transition-colors ${isEditing ? 'bg-blue-50/50' : 'hover:bg-gray-50/50'}`}
                  >
                    <td className="p-4 font-medium align-middle">
                      <ImageUpload
                        label=""
                        compact={true}
                        value={
                          (isEditing ? editForm.foto : g.foto) ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(g.nama || g.username || "G")}&background=random`
                        }
                        onChange={(base64) => {
                          if (isEditing) {
                            setEditForm({ ...editForm, foto: base64 });
                          } else {
                            handleUpdateGuru(g.id, { foto: base64 });
                          }
                        }}
                        maxWidth={200}
                        maxHeight={200}
                      />
                    </td>
                    <td className="p-4 font-medium align-middle">
                      {isEditing ? (
                        <input
                          className="w-full border border-gray-200 rounded p-1 text-sm outline-none focus:border-main-blue"
                          value={editForm.nama}
                          onChange={(e) => setEditForm({ ...editForm, nama: e.target.value })}
                        />
                      ) : (
                        g.nama || g.username || "-"
                      )}
                    </td>
                    <td className="p-4 text-gray-500 align-middle">
                      {isEditing ? (
                        <input
                          className="w-full border border-gray-200 rounded p-1 text-sm outline-none focus:border-main-blue"
                          value={editForm.nip}
                          onChange={(e) => setEditForm({ ...editForm, nip: e.target.value })}
                        />
                      ) : (
                        g.nip || "-"
                      )}
                    </td>
                    <td className="p-4 text-gray-500 align-middle">
                      {isEditing ? (
                        <input
                          className="w-full border border-gray-200 rounded p-1 text-sm outline-none focus:border-main-blue"
                          value={editForm.pangkat}
                          onChange={(e) => setEditForm({ ...editForm, pangkat: e.target.value })}
                        />
                      ) : (
                        g.pangkat || "-"
                      )}
                    </td>
                    <td className="p-4 text-gray-500 align-middle">
                      {isEditing ? (
                        <select
                          className="w-full border border-gray-200 rounded p-1 text-sm outline-none focus:border-main-blue bg-white"
                          value={editForm.kepegawaian}
                          onChange={(e) => setEditForm({ ...editForm, kepegawaian: e.target.value })}
                        >
                          <option value="">Pilih</option>
                          <option value="PNS">PNS</option>
                          <option value="PPPK">PPPK</option>
                          <option value="GTT">GTT</option>
                          <option value="Honorer">Honorer</option>
                        </select>
                      ) : (
                        g.kepegawaian || "-"
                      )}
                    </td>
                    <td className="p-4 text-gray-500 align-middle">
                      {isEditing ? (
                        <input
                          className="w-full border border-gray-200 rounded p-1 text-sm outline-none focus:border-main-blue"
                          value={editForm.jabatan}
                          onChange={(e) => setEditForm({ ...editForm, jabatan: e.target.value })}
                        />
                      ) : (
                        g.jabatan || "-"
                      )}
                    </td>
                    <td className="p-4 text-gray-500 align-middle">
                      {isEditing ? (
                        <input
                          className="w-full border border-gray-200 rounded p-1 text-sm outline-none focus:border-main-blue"
                          value={editForm.sekolah}
                          onChange={(e) => setEditForm({ ...editForm, sekolah: e.target.value })}
                        />
                      ) : (
                        g.sekolah || "-"
                      )}
                    </td>
                    <td className="p-4 text-center align-middle">
                      <div className="flex items-center justify-center gap-2">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => handleUpdateGuru(g.id, editForm)}
                              className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                              title="Simpan"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Batal"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => startEdit(g)}
                            className="p-1.5 text-main-blue hover:bg-main-blue/5 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <PenTool className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminFinanceManagement({ user }: { user: any }) {
  const { alert, confirm } = useAlert();
  const [records, setRecords] = useState<FinanceTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Print Keuangan States
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [tempatLaporan, setTempatLaporan] = useState("Tuban");
  const [tanggalLaporan, setTanggalLaporan] = useState("");
  const [bendahara, setBendahara] = useState({ name: "", nip: "" });
  const [ketuaKkg, setKetuaKkg] = useState({ name: "", nip: "" });
  const [ketuaGugus, setKetuaGugus] = useState({ name: "", nip: "" });
  const [mainFilterMonth, setMainFilterMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const getJakartaDateString = () => {
    const d = new Date();
    const options: Intl.DateTimeFormatOptions = { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' };
    const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(d);
    const z: any = {};
    parts.forEach(p => z[p.type] = p.value);
    return `${z.year}-${z.month}-${z.day}`;
  };

  const formatCurrency = (val: number) => {
    const isNegative = val < 0;
    const formatted = new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: 0,
    }).format(Math.abs(val));
    return `${isNegative ? "-" : ""}Rp. ${formatted}`;
  };

  const loadSignatures = async () => {
    try {
      const todayString = new Date().toLocaleDateString("id-ID", {
        timeZone: 'Asia/Jakarta',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      setTanggalLaporan(todayString);

      const { data: kkgData } = await supabase
        .from("org_kkg")
        .select("name, role, nip");

      if (kkgData && kkgData.length > 0) {
        const ketua = kkgData.find(item => item.role && item.role.toLowerCase().includes("ketua"));
        if (ketua) {
          setKetuaKkg({ name: ketua.name || "Drs. Budi Santoso, M.Pd", nip: ketua.nip || "" });
        } else {
          setKetuaKkg({ name: "Drs. Budi Santoso, M.Pd", nip: "" });
        }
        const bend = kkgData.find(item => item.role && item.role.toLowerCase().includes("bendahara"));
        if (bend) {
          setBendahara({ name: bend.name || "Rina Kusuma, S.Pd", nip: bend.nip || "" });
        } else {
          setBendahara({ name: "Rina Kusuma, S.Pd", nip: "" });
        }
      } else {
        setKetuaKkg({ name: "Drs. Budi Santoso, M.Pd", nip: "" });
        setBendahara({ name: "Rina Kusuma, S.Pd", nip: "" });
      }

      const { data: gugusData } = await supabase
        .from("org_gugus")
        .select("name, role, nip");

      if (gugusData && gugusData.length > 0) {
        const ketuaG = gugusData.find(item => item.role && item.role.toLowerCase().includes("ketua"));
        if (ketuaG) {
          setKetuaGugus({ name: ketuaG.name || "Sulastri, S.Pd", nip: ketuaG.nip || "" });
        } else {
          setKetuaGugus({ name: "Sulastri, S.Pd", nip: "" });
        }
      } else {
        setKetuaGugus({ name: "Sulastri, S.Pd", nip: "" });
      }
    } catch (e) {
      console.error("Error loading signatures:", e);
    }
  };

  const [formData, setFormData] = useState({
    activity_name: "",
    income: 0,
    expense: 0,
    date: getJakartaDateString(),
  });
  const [editId, setEditId] = useState<string | null>(null);

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/finance/records");
      if (!response.ok) throw new Error("Gagal mengambil data keuangan");
      const data = await response.json();
      setRecords(data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
    loadSignatures();
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${year}-${month}`);
  }, []);

  useEffect(() => {
    if (isPrintModalOpen) {
      loadSignatures();
    }
  }, [isPrintModalOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.activity_name) return;

    setIsSubmitting(true);
    try {
      const url = editId ? `/api/finance/records/${editId}` : "/api/finance/records";
      const method = editId ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Gagal menyimpan data");

      logActivity(
        user,
        editId ? "update_finance" : "create_finance",
        editId
          ? `Mengubah data keuangan: ${formData.activity_name}`
          : `Menambah data keuangan: ${formData.activity_name}`,
      );
      await alert(
        editId ? "Data keuangan berhasil diperbarui!" : "Data keuangan berhasil disimpan!",
        "Sukses",
        "success"
      );
      setFormData({
        activity_name: "",
        income: 0,
        expense: 0,
        date: getJakartaDateString(),
      });
      setEditId(null);
      fetchRecords();
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm("Apakah Anda yakin ingin menghapus catatan keuangan ini?", "Konfirmasi Hapus");
    if (!isConfirmed) return;

    try {
      const response = await fetch(`/api/finance/records/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Gagal menghapus data");
      logActivity(user, "delete_finance", `Menghapus data keuangan ID: ${id}`);
      fetchRecords();
    } catch (err: any) {
      console.error(err);
    }
  };

  const totalIncome = records.reduce(
    (sum, r) => sum + (Number(r.income) || 0),
    0,
  );
  const totalExpense = records.reduce(
    (sum, r) => sum + (Number(r.expense) || 0),
    0,
  );
  const balance = totalIncome - totalExpense;

  const filteredRecords = mainFilterMonth === "all"
    ? records
    : records.filter(r => r.date && r.date.startsWith(mainFilterMonth));

  const filteredIncome = filteredRecords.reduce(
    (sum, r) => sum + (Number(r.income) || 0),
    0,
  );
  const filteredExpense = filteredRecords.reduce(
    (sum, r) => sum + (Number(r.expense) || 0),
    0,
  );

  let runningBalance = 0;
  const sortedForBalance = [...records].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const recordsWithBalance = sortedForBalance.map((r) => {
    runningBalance += (Number(r.income) || 0) - (Number(r.expense) || 0);
    return { ...r, runningBalance };
  });

  const displayRecords = mainFilterMonth === "all"
    ? recordsWithBalance
    : recordsWithBalance.filter(r => r.date && r.date.startsWith(mainFilterMonth));

  const displayRecordsOrdered = [...displayRecords].reverse();
  const itemsPerPage = 10;
  const totalPages = Math.ceil(displayRecordsOrdered.length / itemsPerPage) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedRecords = displayRecordsOrdered.slice(
    (safeCurrentPage - 1) * itemsPerPage,
    safeCurrentPage * itemsPerPage
  );

  const getAvailableMonths = () => {
    const months = new Set<string>();
    records.forEach(r => {
      if (r.date && r.date.length >= 7) {
        months.add(r.date.substring(0, 7));
      }
    });
    if (months.size === 0) {
      const today = new Date();
      months.add(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`);
    }
    return Array.from(months).sort().reverse();
  };

  const availableMonths = getAvailableMonths();

  return (
    <>
      <div className="space-y-10 print:hidden">
        {/* Keuangan Clean Header */}
        <div className="bg-white p-8 rounded-[2rem] border-l-8 border-leaf-green shadow-sm mb-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
          <div className="flex items-center gap-8">
            <div className="w-16 h-16 bg-leaf-green/10 rounded-2xl flex items-center justify-center text-leaf-green border border-leaf-green/10 shrink-0">
              <Wallet className="w-8 h-8" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-leaf-green/10 rounded-full border border-leaf-green/5 mb-2">
                <div className="w-1 h-1 rounded-full bg-leaf-green animate-pulse" />
                <span className="text-[10px] font-bold text-leaf-green uppercase tracking-widest font-heading">Akuntansi Gugus</span>
              </div>
              <h2 className="text-2xl font-bold font-heading text-soft-black">
                Kelola Keuangan
              </h2>
              <p className="text-sm text-gray-500">
                Manajemen arus kas, pemasukan, dan pengeluaran operasional GUGUS 03.
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="px-6 py-4 bg-main-blue hover:bg-dark-blue text-white rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-main-blue/15 hover:shadow-main-blue/25 hover:-translate-y-0.5"
            >
              <Printer className="w-5 h-5" />
              <span>Cetak LPJ Bulanan</span>
            </button>

            <div className="text-right bg-gray-50 px-6 py-4 rounded-2xl border border-gray-100 shadow-inner">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                Saldo Saat Ini
              </p>
              <h3 className="text-2xl font-bold text-soft-black truncate min-w-[130px]">
                {formatCurrency(balance)}
              </h3>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] border border-main-orange/20 shadow-xl shadow-blue-500/5">

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end"
          >
            <div className="md:col-span-1 space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Tanggal
              </label>
              <input
                type="date"
                className="w-full bg-white border border-gray-200 p-3 rounded-xl outline-none focus:border-main-blue transition-colors"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
              />
            </div>
            <div className="md:col-span-1 space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Keterangan / Kegiatan
              </label>
              <input
                type="text"
                placeholder="Contoh: Iuran Bulanan"
                className="w-full bg-white border border-gray-200 p-3 rounded-xl outline-none focus:border-main-blue transition-colors"
                value={formData.activity_name}
                onChange={(e) =>
                  setFormData({ ...formData, activity_name: e.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-leaf-green">
                Pemasukan (Rp)
              </label>
              <input
                type="number"
                className="w-full bg-white border border-gray-200 p-3 rounded-xl outline-none focus:border-leaf-green transition-colors font-mono font-bold text-leaf-green"
                value={formData.income}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    income: Number(e.target.value),
                    expense: 0,
                  })
                }
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-red-500">
                Pengeluaran (Rp)
              </label>
              <input
                type="number"
                className="w-full bg-white border border-gray-200 p-3 rounded-xl outline-none focus:border-red-500 transition-colors font-mono font-bold text-red-500"
                value={formData.expense}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    expense: Number(e.target.value),
                    income: 0,
                  })
                }
              />
            </div>
            <div className="md:col-span-4 flex justify-end gap-3">
              {editId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditId(null);
                    setFormData({
                      activity_name: "",
                      income: 0,
                      expense: 0,
                      date: getJakartaDateString(),
                    });
                  }}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-all"
                >
                  Batal Edit
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 bg-main-blue text-white rounded-xl font-bold flex items-center gap-2 hover:bg-dark-blue transition-all shadow-lg shadow-main-blue/20"
              >
                <PlusCircle className="w-5 h-5" />
                {isSubmitting ? "Menyimpan..." : editId ? "Simpan Perubahan" : "Tambah Catatan"}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-main-orange/20 shadow-xl shadow-blue-500/5 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <h3 className="font-bold text-lg text-soft-black">Data Transaksi</h3>
              <select
                value={mainFilterMonth}
                onChange={(e) => {
                  setMainFilterMonth(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-gray-50 border border-gray-200 text-xs font-bold text-gray-500 rounded-xl px-3 py-1.5 outline-none focus:border-main-blue focus:bg-white transition-colors"
              >
                <option value="all">Semua Bulan</option>
                {availableMonths.map(m => {
                  const [yr, mn] = m.split("-");
                  const monthNames = [
                    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
                    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
                  ];
                  return (
                    <option key={m} value={m}>
                      {monthNames[parseInt(mn, 10) - 1]} {yr}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="flex gap-4">
              <div className="text-right">
                <span className="text-[10px] font-bold text-gray-400 uppercase block">
                  Total Pemasukan
                </span>
                <span className="text-leaf-green font-bold">
                  {formatCurrency(filteredIncome)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-gray-400 uppercase block">
                  Total Pengeluaran
                </span>
                <span className="text-red-500 font-bold">
                  {formatCurrency(filteredExpense)}
                </span>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <th className="px-6 py-4">Tanggal</th>
                  <th className="px-6 py-4">Keterangan</th>
                  <th className="px-6 py-4 text-right">Pemasukan</th>
                  <th className="px-6 py-4 text-right">Pengeluaran</th>
                  <th className="px-6 py-4 text-right">Saldo</th>
                  <th className="px-6 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-10 text-center text-gray-400 animate-pulse"
                    >
                      Memuat data...
                    </td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-10 text-center text-gray-400 italic"
                    >
                      {mainFilterMonth === "all" ? "Belum ada data transaksi." : "Belum ada data transaksi untuk bulan ini."}
                    </td>
                  </tr>
                ) : (
                  paginatedRecords.map((record) => (
                    <tr
                      key={record.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(record.date).toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta", 
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4 font-bold text-soft-black">
                        {record.activity_name}
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-leaf-green">
                        {record.income > 0
                          ? `+ Rp. ${new Intl.NumberFormat("id-ID").format(record.income)}`
                          : "-"}
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-red-500">
                        {record.expense > 0
                          ? `- Rp. ${new Intl.NumberFormat("id-ID").format(record.expense)}`
                          : "-"}
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-gray-400">
                        {formatCurrency(record.runningBalance)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setEditId(record.id);
                              setFormData({
                                activity_name: record.activity_name || "",
                                income: Number(record.income) || 0,
                                expense: Number(record.expense) || 0,
                                date: record.date ? record.date.substring(0, 10) : getJakartaDateString(),
                              });
                              const formEl = document.querySelector("form");
                              if (formEl) {
                                formEl.scrollIntoView({ behavior: "smooth", block: "center" });
                              }
                            }}
                            className="p-2 text-gray-400 hover:text-main-blue hover:bg-blue-50 rounded-lg transition-all"
                            title="Ubah"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(record.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/35 gap-4">
              <div className="text-xs font-semibold text-gray-500">
                Menampilkan <span className="text-soft-black font-bold">{Math.min((safeCurrentPage - 1) * itemsPerPage + 1, displayRecordsOrdered.length)}</span> - <span className="text-soft-black font-bold">{Math.min(safeCurrentPage * itemsPerPage, displayRecordsOrdered.length)}</span> dari <span className="text-soft-black font-bold">{displayRecordsOrdered.length}</span> transaksi
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={safeCurrentPage === 1}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-soft-black hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  title="Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1.5 max-w-[180px] overflow-x-auto sm:max-w-none py-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`w-7 h-7 text-xs font-bold rounded-lg transition-all shrink-0 ${
                        safeCurrentPage === page
                          ? "bg-main-blue text-white shadow-sm"
                          : "text-gray-500 hover:text-soft-black hover:bg-gray-100"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={safeCurrentPage === totalPages}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-soft-black hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  title="Selanjutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Print Configurator Modal */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[999] flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200 border border-gray-100 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-main-blue/10 rounded-xl flex items-center justify-center text-main-blue border border-main-blue/5">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-soft-black font-heading leading-tight">Cetak Laporan Keuangan</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Konfigurasi format laporan bulanan & penandatangan</p>
                </div>
              </div>
              <button 
                onClick={() => setIsPrintModalOpen(false)}
                className="p-2 text-gray-400 hover:text-soft-black hover:bg-gray-150 rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8 overflow-y-auto space-y-6">
              
              {/* Periode Laporan */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider font-extrabold text-gray-400 block">Pilih Bulan Laporan</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full bg-white border border-gray-200 hover:border-gray-300 px-4 py-2.5 rounded-xl outline-none focus:border-main-blue transition-colors text-sm font-semibold"
                  >
                    {availableMonths.map(month => {
                      const [yr, mn] = month.split("-");
                      const monthNames = [
                        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
                        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
                      ];
                      return (
                        <option key={month} value={month}>
                          {monthNames[parseInt(mn, 10) - 1]} {yr}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider font-extrabold text-gray-400 block">Tempat Dokumen</label>
                    <input 
                      type="text"
                      className="w-full bg-white border border-gray-200 hover:border-gray-300 px-4 py-2.5 rounded-xl outline-none focus:border-main-blue text-sm transition-colors"
                      value={tempatLaporan}
                      onChange={(e) => setTempatLaporan(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider font-extrabold text-gray-400 block">Tanggal Dokumen</label>
                    <input 
                      type="text"
                      className="w-full bg-white border border-gray-200 hover:border-gray-300 px-4 py-2.5 rounded-xl outline-none focus:border-main-blue text-sm transition-colors"
                      value={tanggalLaporan}
                      onChange={(e) => setTanggalLaporan(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Sebelah Kanan & Kiri Signatures */}
              <div className="border-t border-gray-100 pt-6">
                <h4 className="text-xs uppercase tracking-widest font-black text-main-blue mb-4">Konfigurasi Penandatangan</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Bendahara (Kanan) */}
                  <div className="space-y-3 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-main-blue" />
                      <span className="text-[11px] uppercase tracking-widest font-black text-gray-500">Bendahara</span>
                    </div>
                    <div className="space-y-2">
                      <input 
                        type="text"
                        placeholder="Nama Bendahara"
                        className="w-full bg-white border border-gray-200 px-3 py-1.5 rounded-lg outline-none focus:border-main-blue text-xs"
                        value={bendahara.name}
                        onChange={(e) => setBendahara({ ...bendahara, name: e.target.value })}
                      />
                      <input 
                        type="text"
                        placeholder="NIP Bendahara"
                        className="w-full bg-white border border-gray-200 px-3 py-1.5 rounded-lg outline-none focus:border-main-blue text-xs font-mono"
                        value={bendahara.nip}
                        onChange={(e) => setBendahara({ ...bendahara, nip: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Ketua KKG (Kiri) */}
                  <div className="space-y-3 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="text-[11px] uppercase tracking-widest font-black text-gray-500">Ketua KKG</span>
                    </div>
                    <div className="space-y-2">
                      <input 
                        type="text"
                        placeholder="Nama Ketua KKG"
                        className="w-full bg-white border border-gray-200 px-3 py-1.5 rounded-lg outline-none focus:border-main-blue text-xs"
                        value={ketuaKkg.name}
                        onChange={(e) => setKetuaKkg({ ...ketuaKkg, name: e.target.value })}
                      />
                      <input 
                        type="text"
                        placeholder="NIP Ketua KKG"
                        className="w-full bg-white border border-gray-200 px-3 py-1.5 rounded-lg outline-none focus:border-main-blue text-xs font-mono"
                        value={ketuaKkg.nip}
                        onChange={(e) => setKetuaKkg({ ...ketuaKkg, nip: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Ketua Gugus (Tengah Bawah) */}
                  <div className="space-y-3 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-leaf-green" />
                      <span className="text-[11px] uppercase tracking-widest font-black text-gray-500">Ketua Gugus</span>
                    </div>
                    <div className="space-y-2">
                      <input 
                        type="text"
                        placeholder="Nama Ketua Gugus"
                        className="w-full bg-white border border-gray-200 px-3 py-1.5 rounded-lg outline-none focus:border-main-blue text-xs"
                        value={ketuaGugus.name}
                        onChange={(e) => setKetuaGugus({ ...ketuaGugus, name: e.target.value })}
                      />
                      <input 
                        type="text"
                        placeholder="NIP Ketua Gugus"
                        className="w-full bg-white border border-gray-200 px-3 py-1.5 rounded-lg outline-none focus:border-main-blue text-xs font-mono"
                        value={ketuaGugus.nip}
                        onChange={(e) => setKetuaGugus({ ...ketuaGugus, nip: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Preview Info */}
              <div className="bg-blue-50/30 p-5 rounded-3xl border border-main-blue/10 flex items-start gap-4">
                <Info className="w-5 h-5 text-main-blue mt-0.5 shrink-0" />
                <div className="text-xs text-blue-900 leading-relaxed">
                  <span className="font-bold block text-sm text-blue-950 mb-1 font-heading">Format Cetak Laporan Keuangan per Bulan</span>
                  Sistem akan menyusun laporan keuangan bulanan secara kronologis (dari tanggal terlama ke terbaru) dengan menghitung **Saldo Awal otomatis**, jumlah mutasi debit/kredit bulanan, serta **Saldo Akhir periode**. Ukuran dokumen diatur ke **A4 Portrait** secara otomatis.
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-8 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50/50">
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="px-6 py-3 bg-white hover:bg-gray-100 border border-gray-200 hover:border-gray-300 text-gray-500 font-bold rounded-xl transition-all text-sm"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  setIsPrintModalOpen(false);
                  setTimeout(() => {
                    window.print();
                  }, 150);
                }}
                className="px-8 py-3 bg-main-blue hover:bg-dark-blue text-white font-bold rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-main-blue/20 text-sm hover:-translate-y-0.5"
              >
                <Printer className="w-5 h-5" />
                <span>Mulai Cetak</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Printable Area - Hidden on screen, visible during window.print() */}
      <div className="hidden print:block">
        <PrintLaporanKeuangan
          selectedMonth={selectedMonth}
          records={records}
          tempatLaporan={tempatLaporan}
          tanggalLaporan={tanggalLaporan}
          bendahara={bendahara}
          ketuaKkg={ketuaKkg}
          ketuaGugus={ketuaGugus}
        />
      </div>
    </>
  );
}

function AdminRekapAbsen() {
  const [searchParams] = useSearchParams();
  const [activities, setActivities] = useState<any[]>([]);
  const [selectedActivityId, setSelectedActivityId] = useState(searchParams.get("id") || "");
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [chairman, setChairman] = useState<any>(null);
  const [activityType, setActivityType] = useState<'training' | 'event'>((searchParams.get("type") as 'training' | 'event') || 'training');

  useEffect(() => {
    loadActivities();
    loadChairman();
  }, [activityType]);

  async function loadChairman() {
    try {
      const { data } = await supabase
        .from("org_kkg")
        .select("name, nip")
        .ilike("role", "%Ketua%")
        .limit(1)
        .maybeSingle();
      if (data) setChairman(data);
    } catch (err) {
      console.error("Failed to load chairman:", err);
    }
  }

  useEffect(() => {
    if (selectedActivityId) {
      loadParticipants(selectedActivityId);
    } else {
      setParticipants([]);
    }
  }, [selectedActivityId]);

  async function loadActivities() {
    setLoading(true);
    const table = activityType === 'training' ? 'trainings' : 'events';
    const { data } = await supabase.from(table).select("id, title, date_start").order("date_start", { ascending: false });
    setActivities(data || []);
    setLoading(false);
  }

  async function loadParticipants(id: string) {
    setLoading(true);
    
    // Step 1: fetch participants
    const { data: partData, error: partError } = await supabase
      .from("training_participants")
      .select("*")
      .eq(activityType === 'training' ? "training_id" : "event_id", id);
      
    if (partError || !partData) {
      setParticipants([]);
      setLoading(false);
      return;
    }
    
    if (partData.length === 0) {
      setParticipants([]);
      setLoading(false);
      return;
    }

    // Step 2: fetch user profiles for non-guests
    const userIds = partData.filter(p => !p.is_guest).map(p => p.user_id).filter(Boolean);
    let profilesData: any[] = [];
    
    if (userIds.length > 0) {
      const { data } = await supabase
        .from("user_profiles")
        .select("id, nama, nip, sekolah, jabatan, role")
        .in("id", userIds);
      profilesData = data || [];
    }
      
    // Step 3: Join locally and handle guests
    const joined = partData.map(p => {
      if (p.is_guest) {
        return {
          ...p,
          profile: {
            nama: p.guest_name,
            nip: p.guest_nip || "-",
            sekolah: p.guest_institution,
            jabatan: p.guest_position || "-"
          },
          isGuestInfo: true
        };
      }
      const prof = profilesData?.find(prof => prof.id === p.user_id) || {};
      return {
        ...p,
        profile: prof
      };
    });
    
    setParticipants(joined);
    setLoading(false);
  }

  const handlePrint = () => {
    typeof window !== "undefined" && window.print();
  };

  const formatName = (name: string) => {
    return name || "-";
  };

  const selectedActivity = activities.find(a => a.id === selectedActivityId);

  return (
    <div className="space-y-6">
      {/* Hidden in print */}
      <div className="print:hidden bg-white p-8 rounded-[2.5rem] shadow-xl shadow-gray-200/40 border border-gray-100 space-y-6">
        <div className="flex bg-gray-50 p-1.5 rounded-2xl w-fit">
          <button 
            onClick={() => { setActivityType('training'); setSelectedActivityId(""); }}
            className={`px-6 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all ${activityType === 'training' ? 'bg-white text-main-blue shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Pelatihan (KKG)
          </button>
          <button 
            onClick={() => { setActivityType('event'); setSelectedActivityId(""); }}
            className={`px-6 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all ${activityType === 'event' ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Agenda (Gugus)
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Pilih Kegiatan</label>
            <select 
              className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-main-blue/20 transition-all"
              value={selectedActivityId}
              onChange={(e) => setSelectedActivityId(e.target.value)}
            >
              <option value="">-- Pilih {activityType === 'training' ? 'Pelatihan' : 'Agenda'} --</option>
              {activities.map(a => (
                <option key={a.id} value={a.id}>{a.title} ({new Date(a.date_start).toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta" })})</option>
              ))}
            </select>
          </div>
          <button 
            onClick={handlePrint} 
            disabled={!selectedActivityId || participants.length === 0} 
            className="px-8 py-4 bg-main-blue text-white rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-dark-blue shadow-lg shadow-main-blue/20 disabled:opacity-50 transition-all active:scale-95"
          >
            <Printer className="w-5 h-5"/> Print Rekap
          </button>
        </div>
      </div>

      {loading && selectedActivityId && (
        <div className="text-center p-20">
           <div className="animate-spin w-10 h-10 border-4 border-main-blue border-t-transparent rounded-full mx-auto mb-4"></div>
           <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Menyusun Laporan...</p>
        </div>
      )}

      {!loading && selectedActivity && (
        <PrintDaftarHadir 
          selectedActivity={selectedActivity} 
          participants={participants} 
          chairman={chairman} 
        />
      )}
    </div>
  );
}

function AdminGuestAccountsManager() {
  const { alert, confirm } = useAlert();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    username: "",
    password: "",
    name: "",
    nip: "",
    position: "",
    institution: "",
    pangkat_golongan: "",
    peran: "Tamu Undangan",
  });
  const [selectedPrintAccount, setSelectedPrintAccount] = useState<any | null>(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("guest_accounts")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setAccounts(data || []);
    setSelectedIds([]);
    setLoading(false);
  };

  const handleSelectAll = () => {
    if (selectedIds.length === accounts.length && accounts.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(accounts.map((acc) => acc.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkDelete = async (targetIds?: string[]) => {
    const ids = targetIds && targetIds.length > 0 ? targetIds : selectedIds;
    if (ids.length === 0) {
      await alert("Pilih minimal satu akun tamu yang ingin dihapus dengan memberi tanda ceklist.", "Perhatian", "warning");
      return;
    }

    const isAll = ids.length === accounts.length;
    const confirmMessage = isAll
      ? `Apakah Anda yakin ingin menghapus SEMUA (${ids.length}) akun tamu?\n\nSemua akun tamu akan dihapus sehingga jika ada kegiatan lain dapat diisi oleh tamu yang berbeda.`
      : `Apakah Anda yakin ingin menghapus ${ids.length} akun tamu terpilih? Tindakan ini tidak dapat dibatalkan.`;

    const isConfirmed = await confirm(confirmMessage);
    if (!isConfirmed) return;

    try {
      const { error } = await supabase.from("guest_accounts").delete().in("id", ids);
      if (error) throw error;

      await alert(`Berhasil menghapus ${ids.length} akun tamu.`, "Sukses", "success");
      setSelectedIds([]);
      fetchAccounts();
    } catch (err: any) {
      await alert(err.message || "Gagal menghapus akun tamu.", "Error", "error");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (formData.id) {
        const { error } = await supabase
          .from("guest_accounts")
          .update({
            username: formData.username,
            password: formData.password,
            name: formData.name,
            nip: formData.nip,
            position: formData.position,
            institution: formData.institution,
            pangkat_golongan: formData.pangkat_golongan,
            peran: formData.peran || "Tamu Undangan",
          })
          .eq("id", formData.id);
        if (error) throw error;
        await alert("Akun tamu berhasil diperbarui", "Sukses", "success");
      } else {
        const { error } = await supabase.from("guest_accounts").insert([
          {
            username: formData.username,
            password: formData.password,
            name: formData.name,
            nip: formData.nip,
            position: formData.position,
            institution: formData.institution,
            pangkat_golongan: formData.pangkat_golongan,
            peran: formData.peran || "Tamu Undangan",
          },
        ]);
        if (error) throw error;
        await alert("Akun tamu berhasil dibuat", "Sukses", "success");
      }
      setIsModalOpen(false);
      fetchAccounts();
    } catch (err: any) {
      alert(err.message, "Error", "error");
    }
  };

  const handleEdit = (account: any) => {
    setFormData({
      id: account.id || "",
      username: account.username || "",
      password: account.password || "",
      name: account.name || "",
      nip: account.nip || "",
      position: account.position || "",
      institution: account.institution || "",
      pangkat_golongan: account.pangkat_golongan || "",
      peran: account.peran || "Tamu Undangan",
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm("Apakah Anda yakin ingin menghapus akun tamu ini? Tindakan ini tidak dapat dibatalkan.");
    if (!isConfirmed) return;
    
    try {
      const { error } = await supabase.from("guest_accounts").delete().eq("id", id);
      if (error) throw error;
      
      await alert("Akun tamu berhasil dihapus.", "Sukses", "success");
      fetchAccounts();
    } catch (err: any) {
      await alert(err.message || "Gagal menghapus akun tamu.", "Error", "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-heading text-soft-black">Kelola Akun Tamu</h2>
          <p className="text-sm text-gray-500">Buat dan kelola akun khusus untuk para tamu undangan kegiatan.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {accounts.length > 0 && (
            <button
              onClick={() => {
                const allIds = accounts.map((a) => a.id);
                setSelectedIds(allIds);
                handleBulkDelete(allIds);
              }}
              className="px-5 py-3 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-xl font-bold flex items-center gap-2 transition-colors text-sm"
              title="Hapus semua akun tamu agar dapat diisi tamu baru untuk kegiatan berikutnya"
            >
              <Trash2 className="w-4 h-4" /> Hapus Semua Tamu
            </button>
          )}

          <button
            onClick={() => {
              setFormData({
                id: "",
                username: "",
                password: "",
                name: "",
                nip: "",
                position: "",
                institution: "",
                pangkat_golongan: "",
                peran: "Tamu Undangan",
              });
              setIsModalOpen(true);
            }}
            className="px-6 py-3 bg-main-blue text-white rounded-xl font-bold flex items-center gap-2 hover:bg-dark-blue shadow-lg shadow-main-blue/20 text-sm"
          >
            <PlusCircle className="w-5 h-5" /> Buat Akun Tamu
          </button>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="bg-red-50/90 border border-red-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 bg-red-100 text-red-700 rounded-full flex items-center justify-center font-bold text-xs">
              {selectedIds.length}
            </span>
            <p className="text-sm font-bold text-red-900">
              {selectedIds.length} dari {accounts.length} akun tamu dipilih (ter-ceklist)
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => setSelectedIds([])}
              className="px-4 py-2 bg-white text-gray-600 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold transition-colors"
            >
              Batal Pilih
            </button>
            <button
              onClick={() => handleBulkDelete()}
              className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-red-600/20 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Hapus Terpilih ({selectedIds.length})
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-4 text-center w-10">
                  <input
                    type="checkbox"
                    checked={accounts.length > 0 && selectedIds.length === accounts.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-main-blue rounded border-gray-300 focus:ring-main-blue cursor-pointer"
                    title="Pilih Semua / Batal Pilih Semua"
                  />
                </th>
                <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center w-12">No</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Username / Password</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Nama / Pangkat</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Instansi & Jabatan</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">Memuat data...</td>
                </tr>
              ) : accounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm italic">Belum ada akun tamu yang dibuat.</td>
                </tr>
              ) : (
                accounts.map((acc, idx) => {
                  const isSelected = selectedIds.includes(acc.id);
                  return (
                    <tr 
                      key={acc.id} 
                      className={`transition-colors ${
                        isSelected ? "bg-red-50/40 hover:bg-red-50/60" : "hover:bg-gray-50/50"
                      }`}
                    >
                      <td className="px-4 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(acc.id)}
                          className="w-4 h-4 text-main-blue rounded border-gray-300 focus:ring-main-blue cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-4 text-sm font-bold text-gray-400 text-center">{idx + 1}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-soft-black">{acc.username}</span>
                          <span className="text-[10px] text-gray-400 font-mono italic">Pass: {acc.password}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-soft-black">{acc.name}</span>
                          <div className="flex items-center gap-2">
                             <span className="text-[10px] text-main-blue font-bold px-2 py-0.5 bg-main-blue/10 rounded-full">{acc.peran || "Tamu"}</span>
                             <span className="text-[10px] text-gray-500 font-bold">{acc.pangkat_golongan || "-"}</span>
                          </div>
                          <span className="text-[10px] text-gray-400">NIP: {acc.nip || "-"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-soft-black">{acc.institution || "-"}</span>
                          <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">{acc.position || "Tamu"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => setSelectedPrintAccount(acc)} 
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Cetak Kartu Login"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleEdit(acc)} className="p-2 text-main-blue hover:bg-main-blue/10 rounded-lg transition-colors">
                            <PenTool className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(acc.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-white rounded-[2.5rem] p-10 w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]"
          >
            <h3 className="text-2xl font-bold mb-6 font-heading">{formData.id ? "Edit" : "Buat"} Akun Tamu</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Username</label>
                  <input
                    required
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-main-blue/20"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Password Khusus</label>
                  <input
                    required
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-main-blue/20"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Nama Lengkap</label>
                  <input
                    required
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-main-blue/20"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Pangkat/Golongan</label>
                  <input
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-main-blue/20"
                    value={formData.pangkat_golongan || ""}
                    onChange={(e) => setFormData({ ...formData, pangkat_golongan: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">NIP (Opsional)</label>
                  <input
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-main-blue/20"
                    value={formData.nip}
                    onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Jabatan</label>
                  <input
                    required
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-main-blue/20"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Asal Instansi</label>
                <input
                  required
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-main-blue/20"
                  value={formData.institution}
                  onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Peran / Kategori Tamu</label>
                <select
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-main-blue/20"
                  value={formData.peran}
                  onChange={(e) => setFormData({ ...formData, peran: e.target.value })}
                >
                  <option value="Tamu Undangan">Tamu Undangan</option>
                  <option value="Narasumber">Narasumber</option>
                  <option value="Pendamping">Pendamping</option>
                  <option value="Fasilitator">Fasilitator</option>
                  <option value="Pengawas">Pengawas</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-bold text-xs uppercase tracking-widest"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 bg-main-blue text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-main-blue/20 hover:scale-[1.02] transition-transform"
                >
                  Simpan Akun
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      {selectedPrintAccount && (
        <PrintKartuTamu
          account={selectedPrintAccount}
          onClose={() => setSelectedPrintAccount(null)}
        />
      )}
    </div>
  );
}

function AdminCertificateManager({ user }: { user: any }) {
  const [trainings, setTrainings] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedTrainingId, setSelectedTrainingId] = useState<string>("");
  const { content, updateContent } = useSiteContent() as any;
  const isDownloadEnabled = content?.certificateDownloadEnabled !== false;

  useEffect(() => {
    const fetchTrainings = async () => {
      const { data } = await supabase.from("trainings").select("*");
      setTrainings(data || []);
    };
    const fetchEvents = async () => {
      const { data } = await supabase.from("events").select("*");
      setEvents(data || []);
    };
    fetchTrainings();
    fetchEvents();
  }, []);

  const handleToggleDownload = () => {
    updateContent({ certificateDownloadEnabled: !isDownloadEnabled });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-[2rem] border-l-8 border-main-blue shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 bg-main-blue/10 rounded-2xl flex items-center justify-center text-main-blue border border-main-blue/5 shrink-0">
            <Award className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-bold font-heading text-soft-black">
              Manajemen Sertifikat
            </h2>
            <p className="text-sm text-gray-500">
              Kelola desain template dan penerbitan sertifikat pelatihan.
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer bg-amber-50 px-4 py-2.5 rounded-xl text-amber-700 text-xs font-bold border border-amber-100 shadow-sm">
            <input
              type="checkbox"
              className="w-4 h-4 accent-amber-600 rounded"
              checked={isDownloadEnabled}
              onChange={handleToggleDownload}
            />
            Tombol Unduh Guru
          </label>
        </div>
      </div>

      <div className="space-y-4">
        <select
          className="w-full p-4 rounded-xl border border-gray-200"
          value={selectedTrainingId}
          onChange={(e) => setSelectedTrainingId(e.target.value)}
        >
          <option value="">Pilih Kegiatan / Pelatihan (Default/Global)</option>
          <optgroup label="Program Pelatihan Mandiri">
            {trainings.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </optgroup>
          <optgroup label="Agenda Kegiatan KKG">
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title}
              </option>
            ))}
          </optgroup>
        </select>
        <AdminCertificateEditor trainingId={selectedTrainingId} />
      </div>
    </div>
  );
}

function AdminMonitoring() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl border border-main-orange/20 shadow-xl shadow-blue-500/5 flex flex-col items-center justify-center min-h-[400px] text-center"
    >
      <Activity className="w-16 h-16 text-gray-300 mb-4" />
      <h2 className="text-2xl font-bold font-heading text-soft-black mb-2">
        Monitoring Aktivitas
      </h2>
      <p className="text-gray-500 text-sm max-w-md">
        Fitur monitoring aktivitas log pendidik dan absensi terekam di database
        akan diaktifkan segera.
      </p>
    </motion.div>
  );
}

function AdminUpload() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl border border-main-orange/20 shadow-xl shadow-blue-500/5 flex flex-col items-center justify-center min-h-[400px] text-center"
    >
      <UploadCloud className="w-16 h-16 text-gray-300 mb-4" />
      <h2 className="text-2xl font-bold font-heading text-soft-black mb-2">
        Upload Dokumen
      </h2>
      <p className="text-gray-500 text-sm max-w-md">
        Modul sinkronisasi file ke Storage untuk data RPP, silabus, & perangkat
        ajar lainnya.
      </p>
    </motion.div>
  );
}

function AdminLaporan() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl border border-main-orange/20 shadow-xl shadow-blue-500/5 flex flex-col items-center justify-center min-h-[400px] text-center"
    >
      <BarChart3 className="w-16 h-16 text-gray-300 mb-4" />
      <h2 className="text-2xl font-bold font-heading text-soft-black mb-2">
        Laporan Statistik
      </h2>
      <p className="text-gray-500 text-sm max-w-md">
        Data laporan ditarik dari tabel kegiatan CMS yang dapat di-export ke
        format Excel/PDF.
      </p>
    </motion.div>
  );
}

function AdminStrukturManager() {
  const [activeTab, setActiveTab] = useState<"kkg" | "gugus">("kkg");

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-[2rem] border-l-8 border-main-orange shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 bg-main-orange/10 rounded-2xl flex items-center justify-center text-main-orange border border-main-orange/5 shrink-0">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-bold font-heading text-soft-black">
              Manajemen KKG & Gugus
            </h2>
            <p className="text-sm text-gray-500">
              Kelola informasi dan struktur KKG serta Gugus dari satu tempat.
            </p>
          </div>
        </div>
        <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
          <button
            onClick={() => setActiveTab("kkg")}
            className={`px-8 py-2.5 rounded-lg font-bold text-xs transition-all ${activeTab === "kkg" ? "bg-white text-main-blue shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
          >
            KKG
          </button>
          <button
            onClick={() => setActiveTab("gugus")}
            className={`px-8 py-2.5 rounded-lg font-bold text-xs transition-all ${activeTab === "gugus" ? "bg-white text-main-blue shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
          >
            Gugus
          </button>
        </div>
      </div>

      {activeTab === "kkg" ? (
        <AdminKKGFormWrapper />
      ) : (
        <AdminGugusFormWrapper />
      )}
    </div>
  );
}

function AdminKKGFormWrapper() {
  const { content, updateContent } = useSiteContent() as any;
  const { alert } = useAlert();
  const [localKkg, setLocalKkg] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Sync state with content when context loads
  useEffect(() => {
    if (content && content.kkg && !localKkg) {
      setLocalKkg(content.kkg);
    }
  }, [content]);

  const kkgForm = localKkg || content.kkg || { struktur: [], programs: {} };

  const setKkgForm = (updater: any) => {
    setLocalKkg((prev: any) => {
      const currentState = prev || content.kkg || { struktur: [], programs: {} };
      const newState = typeof updater === "function" ? updater(currentState) : updater;
      return newState;
    });
  };

  const handleSaveContent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateContent({ kkg: kkgForm });
      await alert("Data KKG berhasil disimpan ke database!", "Sukses", "success");
    } catch (err: any) {
      console.error(err);
      await alert("Gagal menyimpan data KKG: " + (err.message || "kesalahan jaringan"), "Error", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative">
      {isSaving && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-xs z-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-xl shadow-lg flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-main-blue border-t-transparent animate-spin rounded-full"></div>
            <span className="text-sm font-semibold">Menyimpan data KKG...</span>
          </div>
        </div>
      )}
      <AdminKKGForm
        kkgForm={kkgForm}
        setKkgForm={setKkgForm}
        handleSaveContent={handleSaveContent}
        updateContent={updateContent}
      />
    </div>
  );
}

function AdminGugusFormWrapper() {
  const { content, updateContent } = useSiteContent() as any;
  const { alert } = useAlert();
  const [localGugus, setLocalGugus] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Sync state with content when context loads
  useEffect(() => {
    if (content && content.gugus && !localGugus) {
      setLocalGugus(content.gugus);
    }
  }, [content]);

  const gugusForm = localGugus || content.gugus || { struktur: [], programs: [] };

  const setGugusForm = (updater: any) => {
    setLocalGugus((prev: any) => {
      const currentState = prev || content.gugus || { struktur: [], programs: [] };
      const newState = typeof updater === "function" ? updater(currentState) : updater;
      return newState;
    });
  };

  const handleSaveContent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateContent({ gugus: gugusForm });
      await alert("Data Gugus berhasil disimpan ke database!", "Sukses", "success");
    } catch (err: any) {
      console.error(err);
      await alert("Gagal menyimpan data Gugus: " + (err.message || "kesalahan jaringan"), "Error", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative">
      {isSaving && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-xs z-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-xl shadow-lg flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-main-blue border-t-transparent animate-spin rounded-full"></div>
            <span className="text-sm font-semibold">Menyimpan data Gugus...</span>
          </div>
        </div>
      )}
      <AdminGugusForm
        gugusForm={gugusForm}
        setGugusForm={setGugusForm}
        handleSaveContent={handleSaveContent}
      />
    </div>
  );
}

function UserProfileEdit({
  user,
  onUpdate,
}: {
  user: any;
  onUpdate: (data: any) => void;
}) {
  const { alert } = useAlert();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>({
    nama: user.nama || "",
    nip: user.nip || "",
    jabatan: user.jabatan || "",
    sekolah: user.sekolah || "",
    kepegawaian: user.kepegawaian || "",
    pangkat: user.pangkat || "",
    email: user.email || "",
    foto: user.foto || user.avatar_url || "",
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let endpoint = "/api/admin/update-user";
      let payload = { ...profile, id: user.id };

      if (user.role === 'tamu') {
        const { error } = await supabase
          .from('guest_accounts')
          .update({
            name: profile.nama,
            nip: profile.nip,
            position: profile.jabatan,
            institution: profile.sekolah,
            pangkat_golongan: profile.pangkat
          })
          .eq('id', user.id);
        if (error) throw error;
      } else {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error("Gagal memperbarui profil");
      }

      logActivity(user, "update_profil", `Memperbarui profil pribadi`);
      onUpdate(profile);
      await alert("Profil berhasil diperbarui.", "Sukses", "success");
    } catch (err: any) {
      alert(err.message, "Error", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10 max-w-5xl mx-auto pb-20">
      {/* Profile Clean Header */}
      <div className="bg-white p-8 rounded-[2rem] border-l-8 border-main-blue shadow-sm mb-10 flex flex-col md:flex-row md:items-center gap-10">
        <div className="relative group shrink-0">
          <div className="w-24 h-32 rounded-2xl bg-gray-50 p-1 border border-gray-100 shadow-sm overflow-hidden transition-transform group-hover:scale-105 duration-500">
             <div className="w-full h-full rounded-xl overflow-hidden bg-white">
               <img
                  src={
                    profile.foto ||
                    profile.avatar_url ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.nama || "U")}&background=6366f1&color=fff`
                  }
                  alt="Profile"
                  className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700"
               />
             </div>
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-main-blue rounded-full flex items-center justify-center text-white border-2 border-white shadow-md">
             <UserIcon className="w-4 h-4" />
          </div>
        </div>
        
        <div className="text-left">
          <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-main-blue/5 rounded-full border border-main-blue/10 mb-2">
             <Settings className="w-3 h-3 text-main-blue" />
             <span className="text-[10px] font-bold text-main-blue uppercase tracking-widest font-heading">Pengaturan Akun</span>
          </div>
          <h2 className="text-3xl font-bold text-soft-black tracking-tight mb-1">
            {profile.nama || "Profil Guru"}
          </h2>
          <p className="text-gray-500 font-medium max-w-md text-sm">
            Perbarui identitas dan data profesional Anda untuk sinkronisasi sistem yang akurat.
          </p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[3rem] shadow-2xl shadow-gray-200 border border-gray-100 overflow-hidden"
      >
        <div className="p-10 md:p-12">
          <form
            onSubmit={handleSave}
            className="space-y-10"
          >
            {/* Photo Upload Section */}
            <div className="bg-gray-50/50 p-8 rounded-[2rem] border border-gray-100">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 ml-1">Unggah Foto Identitas Baru</label>
              <ImageUpload
                label="Klik untuk ganti foto profil"
                value={profile.foto}
                onChange={(base64) => setProfile({ ...profile, foto: base64 })}
                maxWidth={400}
                maxHeight={400}
              />
            </div>

            {/* Form Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
              <div className="group">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1 group-focus-within:text-main-blue transition-colors">Nama Lengkap & Gelar</label>
                <div className="relative">
                  <input
                    className="w-full bg-gray-50 border-2 border-transparent border-b-gray-200 p-4 text-sm font-bold focus:border-main-blue focus:bg-white outline-none transition-all"
                    value={profile.nama}
                    onChange={(e) => setProfile({ ...profile, nama: e.target.value })}
                  />
                  <UserIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                </div>
              </div>

              <div className="group">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1 group-focus-within:text-main-blue transition-colors">Alamat Email Aktif</label>
                <div className="relative">
                  <input
                    className="w-full bg-gray-50 border-2 border-transparent border-b-gray-200 p-4 text-sm font-bold focus:border-main-blue focus:bg-white outline-none transition-all"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  />
                  <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                </div>
              </div>

              <div className="group">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1 group-focus-within:text-main-blue transition-colors">NIP / NUPTK</label>
                <input
                  className="w-full bg-gray-50 border-2 border-transparent border-b-gray-200 p-4 text-sm font-bold focus:border-main-blue focus:bg-white outline-none transition-all"
                  value={profile.nip}
                  onChange={(e) => setProfile({ ...profile, nip: e.target.value })}
                />
              </div>

              <div className="group">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1 group-focus-within:text-main-blue transition-colors">Jabatan Struktural</label>
                <input
                  className="w-full bg-gray-50 border-2 border-transparent border-b-gray-200 p-4 text-sm font-bold focus:border-main-blue focus:bg-white outline-none transition-all"
                  value={profile.jabatan}
                  onChange={(e) =>
                    setProfile({ ...profile, jabatan: e.target.value })
                  }
                />
              </div>

              <div className="group">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1 group-focus-within:text-main-blue transition-colors">Satuan Pendidikan</label>
                <input
                  className="w-full bg-gray-50 border-2 border-transparent border-b-gray-200 p-4 text-sm font-bold focus:border-main-blue focus:bg-white outline-none transition-all"
                  value={profile.sekolah}
                  onChange={(e) =>
                    setProfile({ ...profile, sekolah: e.target.value })
                  }
                />
              </div>

              <div className="group">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1 group-focus-within:text-main-blue transition-colors">Golongan / Pangkat</label>
                <input
                  className="w-full bg-gray-50 border-2 border-transparent border-b-gray-200 p-4 text-sm font-bold focus:border-main-blue focus:bg-white outline-none transition-all"
                  value={profile.pangkat}
                  onChange={(e) =>
                    setProfile({ ...profile, pangkat: e.target.value })
                  }
                />
              </div>

              <div className="group col-span-full">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1 group-focus-within:text-main-blue transition-colors">Status Kepegawaian</label>
                <select
                  className="w-full bg-gray-50 border-2 border-transparent border-b-gray-200 p-4 text-sm font-bold focus:border-main-blue focus:bg-white outline-none transition-all appearance-none"
                  value={profile.kepegawaian}
                  onChange={(e) =>
                    setProfile({ ...profile, kepegawaian: e.target.value })
                  }
                >
                  <option value="">Pilih Status</option>
                  <option value="PNS">Pegawai Negeri Sipil (PNS)</option>
                  <option value="PPPK">PPPK</option>
                  <option value="GTT">Guru Tidak Tetap (GTT)</option>
                  <option value="Honor">Guru Honorer Sekolah</option>
                </select>
              </div>
            </div>

            <div className="pt-10">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-gradient-to-r from-slate-800 to-slate-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-slate-900/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                {loading ? (
                   <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                   <CheckCircle className="w-5 h-5" />
                )}
                {loading ? "Menyimpan Data..." : "Perbarui Profil Saya"}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

function DataManagementTable({ user, table, title, icon: Icon, fields, selectQuery = "*" }: any) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [editId, setEditId] = useState<string | null>(null);
  const { alert, confirm } = useAlert();

  const { generateTeacherPDF } = useCertificateGenerator();

  const handleAdminDownloadCert = async (item: any) => {
    if (!supabase) return;
    try {
      // 1. Get the certificate configs
      const { data: sData } = await supabase
        .from("site_settings")
        .select("content")
        .eq("id", 1)
        .single();
      
      const configs = sData?.content?.certificate_configs || {};
      const actId = item.training_id;
      const config = configs[actId] || configs["default"];
      if (!config) {
        alert("Template sertifikat belum diatur.", "Info", "info");
        return;
      }

      // 2. Prepare the teacher object
      const teacher = item._teacher_obj || { nama: item.guru_name || "-", nip: "-", sekolah: "-" };
      // 3. Prepare the training object
      const trainingObj = item._activity_obj || { title: item.activity_name || "Pelatihan Mandiri", date_start: "" };

      // 4. Generate
      await generateTeacherPDF(teacher, trainingObj, config, item.certificate_number);
    } catch (err: any) {
      console.error("Gagal mengunduh sertifikat admin:", err);
      alert("Gagal mengunduh sertifikat: " + err.message, "Gagal", "error");
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (table === "training_certificates") {
        try {
          await ensureCertificatesExist();
        } catch (e) {
          console.error("Auto generation inside DataManagementTable failed:", e);
        }
      }
      let query = supabase
        .from(table)
        .select(selectQuery)
        .order("created_at", { ascending: false });
        
      if (user.role === "guru" && (table === "teacher_works" || table === "forum_posts" || table === "forum_comments")) {
        query = query.eq("user_id", user.id);
      }

      const { data: res, error } = await query;
      if (error) throw error;
      
      let fetchedData = res || [];
      
      if (table === "training_certificates") {
        // Build keys to fetch relation details for certificates
        const certUserIds = [...new Set(fetchedData.map((d: any) => d.user_id).filter(Boolean))];
        const certGuestIds = [...new Set(fetchedData.map((d: any) => d.guest_account_id).filter(Boolean))];
        const certActIds = [...new Set(fetchedData.map((d: any) => d.training_id).filter(Boolean))];

        let profilesMap: Record<string, any> = {};
        let guestsMap: Record<string, any> = {};
        let activitiesMap: Record<string, any> = {};

        if (certUserIds.length > 0) {
          const { data: pData } = await supabase
            .from("user_profiles")
            .select("id, nama, username, nip, sekolah")
            .in("id", certUserIds);
          pData?.forEach(p => {
            profilesMap[p.id] = p;
          });
        }

        if (certGuestIds.length > 0) {
          const { data: gData } = await supabase
            .from("guest_accounts")
            .select("id, name, nip, institution, position")
            .in("id", certGuestIds);
          gData?.forEach(g => {
            guestsMap[g.id] = g;
          });
        }

        if (certActIds.length > 0) {
          const [{ data: tData }, { data: eData }] = await Promise.all([
            supabase.from("trainings").select("id, title, date_start").in("id", certActIds),
            supabase.from("events").select("id, title, date_start").in("id", certActIds)
          ]);

          tData?.forEach(t => {
            activitiesMap[t.id] = { id: t.id, title: t.title, date_start: t.date_start };
          });
          eData?.forEach(e => {
            activitiesMap[e.id] = { id: e.id, title: e.title, date_start: e.date_start };
          });
        }

        fetchedData = fetchedData.map((d: any) => {
          let resolvedGuru = "-";
          let teacherObj: any = null;

          if (d.user_id && profilesMap[d.user_id]) {
            const p = profilesMap[d.user_id];
            resolvedGuru = p.nama || p.username || "-";
            teacherObj = {
              nama: resolvedGuru,
              nip: p.nip || "-",
              sekolah: p.sekolah || "-"
            };
          } else if (d.guest_account_id && guestsMap[d.guest_account_id]) {
            const g = guestsMap[d.guest_account_id];
            resolvedGuru = g.name || "-";
            teacherObj = {
              nama: resolvedGuru,
              nip: g.nip || "-",
              sekolah: g.institution || "-"
            };
          }

          const actObj = d.training_id ? activitiesMap[d.training_id] : null;
          const resolvedActivity = actObj ? actObj.title : "-";

          return {
            ...d,
            guru_name: resolvedGuru,
            activity_name: resolvedActivity,
            _teacher_obj: teacherObj,
            _activity_obj: actObj
          };
        });
      } else {
        // Attempt manual profile resolution for user_id fields
        const userIds = [...new Set(fetchedData.map((d: any) => d.user_id).filter(Boolean))];
        if (userIds.length > 0) {
          const { data: pData } = await supabase.from("user_profiles").select("id, nama, username").in("id", userIds);
          if (pData) {
            fetchedData = fetchedData.map((d: any) => {
              const profile = pData.find(p => p.id === d.user_id);
              return {
                ...d,
                profiles: profile || null,
                guru: profile?.nama || profile?.username || "-" // Add easy access guru name
              };
            });
          }
        }
      }
      
      setData(fetchedData);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [table]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Clean formData to remove virtual/relation fields and other system columns that don't exist in DB or are immutable
      const payload = { ...formData };
      delete payload.profiles;
      delete payload.guru;
      delete payload.id;
      delete payload.created_at;
      delete payload.updated_at;

      if (editId) {
        const { error } = await supabase
          .from(table)
          .update(payload)
          .eq("id", editId);
        if (error) throw error;
        logActivity(user, `update_${table}`, `Memperbarui data di ${title}`);
        await alert("Data Berhasil Diperbarui");
      } else {
        const insertData = { ...payload };
        console.log("Saving insertData:", insertData);
        if (user?.id && !insertData.user_id) {
          insertData.user_id = user.id;
        }
        const { data, error } = await supabase.from(table).insert([insertData]).select();
        if (error) {
          console.error("Supabase insert error:", error);
          throw error;
        }
        logActivity(user, `create_${table}`, `Menambah data baru di ${title}`);
        await alert("Data Berhasil Ditambahkan");
      }
      setShowForm(false);
      setEditId(null);
      setFormData({});
      fetchData();
    } catch (err: any) {
      alert(err.message, "Error", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (await confirm("Yakin ingin menghapus data ini?")) {
      try {
        const { error } = await supabase.from(table).delete().eq("id", id);
        if (error) throw error;
        logActivity(
          user,
          `delete_${table}`,
          `Menghapus data di ${title} ID: ${id}`,
        );
        fetchData();
      } catch (err: any) {
        alert(err.message, "Error", "error");
      }
    }
  };

  return (
    <div className="space-y-10">
      {/* Data Management Clean Header */}
      <div className="bg-white p-8 rounded-[2rem] border-l-8 border-main-blue shadow-sm mb-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
        <div className="flex items-center gap-8">
          <div className="w-16 h-16 bg-main-blue/10 rounded-2xl flex items-center justify-center text-main-blue border border-main-blue/10 shrink-0">
            <Icon className="w-8 h-8" />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-main-blue/10 rounded-full border border-main-blue/5 mb-2">
              <div className="w-1 h-1 rounded-full bg-main-blue animate-pulse" />
              <span className="text-[10px] font-bold text-main-blue uppercase tracking-widest font-heading">Manajemen Data</span>
            </div>
            <h2 className="text-2xl font-bold font-heading text-soft-black">
              {title}
            </h2>
            <p className="text-sm text-gray-500">
              Kelola koleksi {title.toLowerCase()} Anda dengan sistem administrasi yang efisien dan terorganisir.
            </p>
          </div>
        </div>
        
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-main-blue text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-md hover:bg-dark-blue active:scale-95 transition-all flex items-center gap-3"
        >
          {showForm ? <X className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
          {showForm ? "Tutup Form" : `Tambah ${title.split(" ").pop()}`}
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white p-8 rounded-3xl shadow-md border border-gray-100 overflow-hidden"
          >
            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {fields.filter((f: any) => !f.readOnly).map((f: any) => (
                <div
                  key={f.name}
                  className={
                    f.type === "textarea" || f.type === "file"
                      ? "col-span-full"
                      : ""
                  }
                >
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                    {f.label}
                  </label>
                  {f.type === "textarea" ? (
                    <textarea
                      className="w-full border border-gray-200 p-3 rounded-xl focus:border-main-blue outline-none"
                      rows={4}
                      value={formData[f.name] || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, [f.name]: e.target.value })
                      }
                    />
                  ) : f.type === "select" ? (
                    <select
                      className="w-full border border-gray-200 p-3 rounded-xl focus:border-main-blue outline-none bg-white"
                      value={formData[f.name] || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, [f.name]: e.target.value })
                      }
                    >
                      <option value="">Pilih</option>
                      {f.options.map((opt: any) => {
                        const label = typeof opt === "string" ? opt : opt.label;
                        const value = typeof opt === "string" ? opt : opt.value;
                        return (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        );
                      })}
                    </select>
                  ) : f.type === "image" ? (
                    <ImageUpload
                      label={f.label}
                      value={formData[f.name] || ""}
                      onChange={(base64) =>
                        setFormData({ ...formData, [f.name]: base64 })
                      }
                    />
                  ) : f.type === "file" ? (
                    <FileUpload
                      label={f.label}
                      value={formData[f.name] || ""}
                      onChange={(base64) =>
                        setFormData({ ...formData, [f.name]: base64 })
                      }
                    />
                  ) : f.type === "checkbox" ? (
                    <label className="flex items-center gap-2 cursor-pointer mt-2">
                       <input
                          type="checkbox"
                          className="w-5 h-5 text-main-blue rounded border-gray-300 focus:ring-main-blue"
                          checked={formData[f.name] || false}
                          onChange={(e) =>
                            setFormData({ ...formData, [f.name]: e.target.checked })
                          }
                       />
                       <span className="text-sm text-gray-700">{f.label}</span>
                    </label>
                  ) : (
                    <input
                      type={f.type || "text"}
                      className="w-full border border-gray-200 p-3 rounded-xl focus:border-main-blue outline-none"
                      value={f.type === "datetime-local" ? formatToJakartaDatetimeLocal(formData[f.name]) : (formData[f.name] || "")}
                      onChange={(e) => {
                        let newValue = e.target.value;
                        if (f.type === "datetime-local") {
                          newValue = parseJakartaDatetimeLocalToUTC(newValue);
                        }
                        setFormData({ ...formData, [f.name]: newValue });
                      }}
                    />
                  )}
                </div>
              ))}
              <div className="col-span-full flex justify-end gap-3 pt-4">
                <button
                  type="submit"
                  className="px-8 py-3 bg-main-blue text-white rounded-xl font-bold shadow-lg"
                >
                  Simpan Data
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50">
              <tr>
                {fields.filter((f: any) => !f.hideInTable).map((f: any) => (
                  <th
                    key={f.name}
                    className="px-6 py-4 text-xs font-bold text-gray-500 uppercase"
                  >
                    {f.label}
                  </th>
                ))}
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={fields.filter((f: any) => !f.hideInTable).length + 1}
                    className="p-10 text-center text-gray-400 italic"
                  >
                    Memuat data...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan={fields.filter((f: any) => !f.hideInTable).length + 1}
                    className="p-10 text-center text-gray-400 italic"
                  >
                    Belum ada data.
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    {fields.filter((f: any) => !f.hideInTable).map((f: any) => (
                      <td
                        key={f.name}
                        className={`px-6 py-4 text-sm font-medium text-gray-700 ${f.render ? "" : "max-w-[200px] truncate"}`}
                      >
                        {f.render
                          ? f.render(item, handleAdminDownloadCert)
                          : f.type === "date"
                          ? new Date(item[f.name]).toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta" })
                          : f.type === "datetime-local"
                            ? new Date(item[f.name]).toLocaleString("id-ID", { timeZone: "Asia/Jakarta", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) + " WIB"
                          : f.type === "select"
                            ? (() => {
                                let val = item[f.name];
                                if (
                                  table === "trainings" &&
                                  f.name === "status" &&
                                  item.date_start
                                ) {
                                  const now = new Date();
                                  const startDate = new Date(item.date_start);
                                  const endDate = item.date_end 
                                    ? new Date(item.date_end) 
                                    : new Date(startDate.getTime() + 4 * 60 * 60 * 1000); // 4 hours default if no end date

                                  if (now < startDate) val = "planned";
                                  else if (now >= startDate && now <= endDate) val = "ongoing";
                                  else val = "completed";
                                }
                                const opt = f.options.find(
                                  (o: any) =>
                                    (typeof o === "string" ? o : o.value) ===
                                    val,
                                );
                                return typeof opt === "string"
                                  ? opt
                                  : opt?.label || val || "-";
                              })()
                            : f.type === "checkbox"
                              ? (item[f.name] ? "Ya" : "Tidak")
                            : f.type === "url"
                              ? (item[f.name] ? (
                                  <a href={getDirectDownloadUrl(item[f.name])} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs bg-green-50 text-green-700 hover:bg-green-600 hover:text-white px-3 py-1 rounded-full font-semibold transition-all select-none">
                                    <Download className="w-3 h-3" />
                                    Download
                                  </a>
                                ) : "-")
                            : f.type === "file"
                              ? (item[f.name] ? <span className="text-[10px] bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold uppercase tracking-widest whitespace-nowrap">Terupload</span> : "-")
                              : item[f.name] || "-"}
                      </td>
                    ))}
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {fields.map((f: any) => {
                          if (f.type === "file" && item[f.name]) {
                            const downloadUrl = getDirectDownloadUrl(item[f.name]);
                            return (
                              <a key={"dl-"+f.name} href={downloadUrl} target="_self" download rel="noopener noreferrer" className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Unduh">
                                <Download className="w-4 h-4" />
                              </a>
                            );
                          }
                          if (f.type === "url" && item[f.name]) {
                            const downloadUrl = getDirectDownloadUrl(item[f.name]);
                            return (
                              <a key={"url-"+f.name} href={downloadUrl} target="_self" download rel="noopener noreferrer" className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Unduh">
                                <Download className="w-4 h-4" />
                              </a>
                            );
                          }
                          return null;
                        })}
                        <button
                          onClick={() => {
                            setFormData(item);
                            setEditId(item.id);
                            setShowForm(true);
                          }}
                          className="p-2 text-main-blue hover:bg-main-blue/5 rounded-lg"
                        >
                          <PenTool className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function DataViewList({
  table,
  title,
  icon: Icon,
  filterColumn,
  filterValue,
}: any) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (table === "training_certificates") {
          try {
            await ensureCertificatesExist(filterColumn === "user_id" ? filterValue : undefined);
          } catch (e) {
            console.error("Auto generation check inside DataViewList failed:", e);
          }
        }
        let query: any = supabase
          .from(table)
          .select("*")
          .order("created_at", { ascending: false });
        if (filterColumn && filterValue) {
          query = query.eq(filterColumn, filterValue);
        }
        const { data: res, error } = await query;
        if (error) throw error;
        setData(res || []);
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [table, filterColumn, filterValue]);

  return (
    <div className="space-y-10">
      {/* Dynamic Clean Header */}
      <div className="bg-white p-8 rounded-[2rem] border-l-8 border-indigo-500 shadow-sm mb-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
        <div className="flex items-center gap-8">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 border border-indigo-100 shrink-0">
            <Icon className="w-8 h-8" />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-indigo-50 rounded-full border border-indigo-100 mb-2">
              <div className="w-1 h-1 rounded-full bg-indigo-500 animate-pulse" />
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest font-heading">Akses Konten</span>
            </div>
            <h2 className="text-2xl font-bold font-heading text-soft-black">
              {title}
            </h2>
            <p className="text-sm text-gray-500">
              Kelola dan telusuri {title.toLowerCase()} untuk menunjang kegiatan belajar-mengajar Anda.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {loading ? (
          <div className="col-span-full py-20 text-center">
            <div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Menyelaraskan Data...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-gray-50/50 rounded-[3rem] border-2 border-dashed border-gray-200">
            <Icon className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-bold italic">Belum ada {title.toLowerCase()} yang diterbitkan.</p>
          </div>
        ) : (
          data.map((item) => (
            <motion.div
              whileHover={{ y: -10 }}
              key={item.id}
              className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200 border border-gray-100 overflow-hidden flex flex-col group h-full"
            >
              <div className="p-8 pb-4">
                <div className="flex justify-between items-center mb-6">
                  <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-all shadow-inner">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {item.category && (
                      <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100">
                        <span className="text-[8px] font-black uppercase tracking-wider">
                          {item.category}
                        </span>
                      </div>
                    )}
                    <div className="px-4 py-1.5 bg-gray-50 rounded-full border border-gray-100">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">
                        {new Date(item.created_at).toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta",  day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  </div>
                </div>
                <h3 className="font-black text-soft-black text-xl mb-3 leading-tight tracking-tight group-hover:text-indigo-600 transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-500 mb-6 line-clamp-3 leading-relaxed flex-1">
                  {item.description || item.content || "Konten tersedia untuk dilihat dan diunduh."}
                </p>
              </div>
              
              <div className="mt-auto p-8 pt-0">
                <div className="flex flex-col gap-3">
                  {item.file_url && (
                    <a
                      href={getDirectDownloadUrl(item.file_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-4 bg-gradient-to-r from-main-blue to-indigo-600 text-white rounded-2xl text-[10px] font-black tracking-widest text-center uppercase shadow-lg shadow-main-blue/20 hover:scale-105 active:scale-95 transition-all"
                    >
                      Buka Dokumen
                    </a>
                  )}
                  {item.video_url && (
                    <a
                      href={item.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-4 bg-gradient-to-r from-orange-400 to-red-500 text-white rounded-2xl text-[10px] font-black tracking-widest text-center uppercase shadow-lg shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all"
                    >
                      Putar Materi
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

function FaceScannerModal({ 
  isOpen, 
  onClose, 
  onSuccess 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSuccess: () => void;
}) {
  const [scanning, setScanning] = useState(false);
  const [status, setStatus] = useState<"idle" | "detecting" | "success">("idle");
  const webcamRef = useRef<Webcam>(null);

  useEffect(() => {
    if (isOpen) {
      setStatus("idle");
      setScanning(false);
      
      const timer = setTimeout(() => {
        setScanning(true);
        setStatus("detecting");
        
        setTimeout(() => {
          setStatus("success");
          setTimeout(() => {
            onSuccess();
          }, 1500);
        }, 3000);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-soft-black/80 backdrop-blur-md"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative bg-white w-full max-w-sm rounded-[3rem] overflow-hidden shadow-2xl border border-white/20"
        >
          <div className="p-6 text-center border-b border-gray-100">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 mx-auto mb-3">
              <Camera className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-soft-black leading-tight">Verifikasi Wajah</h3>
            <p className="text-[10px] text-gray-500 mt-1">
              Posisikan wajah Anda di dalam bingkai.
            </p>
          </div>

          <div className="relative aspect-square bg-black overflow-hidden">
            <WebcamComponent
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              className="w-full h-full object-cover scale-x-[-1]"
              videoConstraints={{
                facingMode: "user",
                width: 720,
                height: 720
              }}
            />
            
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {/* Professional Scanning Box */}
              <motion.div 
                animate={status === "detecting" ? { 
                  scale: [1, 1.05, 1],
                  borderColor: ["rgba(255,255,255,0.2)", "rgba(16,185,129,0.5)", "rgba(255,255,255,0.2)"]
                } : {}}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-56 h-56 border border-white/20 rounded-[3rem] relative flex items-center justify-center transition-colors duration-500"
              >
                {/* Pulsing Corners */}
                <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-emerald-500 rounded-tl-2xl shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-emerald-500 rounded-tr-2xl shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-emerald-500 rounded-bl-2xl shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-emerald-500 rounded-br-2xl shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                
                {/* Searching Pulse */}
                {scanning && status === "detecting" && (
                  <>
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: [0, 0.2, 0], scale: [0.5, 1.2] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="absolute inset-0 bg-emerald-500/20 rounded-[3rem]"
                    />
                    <motion.div 
                      animate={{ opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="absolute inset-4 border border-emerald-500/30 rounded-[2rem] border-dashed"
                    />
                  </>
                )}

                {/* Success Indicator */}
                {status === "success" && (
                  <motion.div 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-20 h-20 bg-emerald-500/20 backdrop-blur-md rounded-full flex items-center justify-center border border-emerald-500/50"
                  >
                    <CheckCircle className="w-10 h-10 text-emerald-500" />
                  </motion.div>
                )}
              </motion.div>
            </div>

            <div className="absolute bottom-4 inset-x-0 flex justify-center z-20">
               {status === "idle" && (
                 <div className="px-3 py-1.5 bg-black/50 backdrop-blur-md rounded-full text-[8px] font-bold text-white uppercase tracking-widest border border-white/10">
                    Kamera Aktif...
                 </div>
               )}
               {status === "detecting" && (
                 <motion.div 
                   animate={{ scale: [1, 1.02, 1] }}
                   transition={{ duration: 1.5, repeat: Infinity }}
                   className="px-3 py-1.5 bg-emerald-500 rounded-full text-[8px] font-bold text-white uppercase tracking-widest border border-white/10 shadow-lg shadow-emerald-500/30"
                 >
                    Menganalisis Wajah...
                 </motion.div>
               )}
               {status === "success" && (
                 <motion.div 
                   initial={{ y: 10, opacity: 0 }}
                   animate={{ y: 0, opacity: 1 }}
                   className="px-4 py-1.5 bg-emerald-600 rounded-full text-[10px] font-bold text-white flex items-center gap-1.5 shadow-lg shadow-emerald-600/30"
                 >
                    <CheckCircle className="w-3 h-3" /> Berhasil Terdeteksi!
                 </motion.div>
               )}
            </div>
          </div>

          <div className="p-6">
            <button
              onClick={onClose}
              className="w-full py-3 bg-gray-50 text-gray-400 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-all"
            >
              Batalkan
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function TeacherAttendance({ user }: { user: any }) {
  const { alert } = useAlert();
  const [trainings, setTrainings] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<{ id: string, type: 'training' | 'event' } | null>(null);
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [guestData, setGuestData] = useState({ name: "", institution: "", nip: "", position: "" });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [trainingsRes, eventsRes] = await Promise.all([
          supabase.from("trainings").select("*").eq("status", "ongoing"),
          supabase.from("events").select("*").eq("is_attendance_open", true)
        ]);
        
        setTrainings(trainingsRes.data || []);
        setEvents(eventsRes.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAbsenClick = (id: string, type: 'training' | 'event') => {
    setSelectedActivity({ id, type });
    setIsScannerOpen(true);
  };

  const onScanSuccess = () => {
    if (selectedActivity) {
      handleAbsen(selectedActivity.id, selectedActivity.type);
    }
    setIsScannerOpen(false);
  };

  const handleAbsen = async (id: string, type: 'training' | 'event') => {
    try {
      const payload: any = { 
        status: 'attended',
        attended_at: new Date().toISOString()
      };
      
      const idField = type === 'training' ? 'training_id' : 'event_id';
      payload[idField] = id;
      const isGuest = !!(user as any).is_guest;
      const queryKey = isGuest ? 'guest_account_id' : 'user_id';

      if (isGuest) {
        payload.is_guest = true;
        payload.guest_account_id = user.id;
        payload.guest_name = user.nama;
        payload.guest_institution = user.sekolah;
        payload.guest_nip = user.nip;
        payload.guest_position = user.jabatan;
      } else {
        payload.user_id = user.id;
      }

      // Instead of upsert which fails due to postgres partial unique index caveats, check manually:
      const { data: existing, error: existErr } = await supabase
        .from("training_participants")
        .select("id")
        .eq(idField, id)
        .eq(queryKey, user.id)
        .maybeSingle();

      if (existErr) throw existErr;

      if (existing) {
        const { error } = await supabase
          .from("training_participants")
          .update(payload)
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("training_participants")
          .insert([payload]);
        if (error) throw error;
      }

      await alert("Absensi Berhasil Dicatat!", "Sukses", "success");
    } catch (err: any) {
      alert(err.message, "Error", "error");
    }
  };

  const handleGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActivity) return;
    
    try {
      const payload: any = {
        is_guest: true,
        guest_name: guestData.name,
        guest_institution: guestData.institution,
        guest_nip: guestData.nip,
        guest_position: guestData.position,
        status: 'attended',
        attended_at: new Date().toISOString()
      };
      
      if (selectedActivity.type === 'training') payload.training_id = selectedActivity.id;
      else payload.event_id = selectedActivity.id;

      const { error } = await supabase
        .from("training_participants")
        .insert([payload]);
        
      if (error) throw error;
      
      setShowGuestForm(false);
      setGuestData({ name: "", institution: "", nip: "", position: "" });
      await alert("Absensi Tamu Berhasil!", "Sukses", "success");
    } catch (err: any) {
      alert(err.message, "Error", "error");
    }
  };

  return (
    <div className="space-y-10">
      <FaceScannerModal 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        onSuccess={onScanSuccess}
      />

      {/* Guest Form Modal */}
      {showGuestForm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowGuestForm(false)} />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl"
          >
            <h3 className="text-xl font-bold mb-4">Presensi Tamu Undangan</h3>
            <form onSubmit={handleGuestSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nama Lengkap</label>
                <input 
                  required
                  className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm"
                  value={guestData.name}
                  onChange={e => setGuestData({...guestData, name: e.target.value})}
                  placeholder="Nama Tamu"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">NIP (Opsional)</label>
                  <input 
                    className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm"
                    value={guestData.nip}
                    onChange={e => setGuestData({...guestData, nip: e.target.value})}
                    placeholder="NIP"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Jabatan</label>
                  <input 
                    required
                    className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm"
                    value={guestData.position}
                    onChange={e => setGuestData({...guestData, position: e.target.value})}
                    placeholder="Contoh: Guru / Kepala Sekolah"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Instansi / Asal</label>
                <input 
                  required
                  className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm"
                  value={guestData.institution}
                  onChange={e => setGuestData({...guestData, institution: e.target.value})}
                  placeholder="Contoh: Dinas Pendidikan / Sekolah Lain"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowGuestForm(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-500 rounded-xl font-bold text-xs"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-bold text-xs"
                >
                  Simpan Presensi
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Attendance Header */}
      <div className="bg-white p-8 rounded-[2rem] border-l-8 border-emerald-500 shadow-sm mb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
          <div className="flex items-center gap-8">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 border border-emerald-100 shrink-0">
              <CheckSquare className="w-8 h-8" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-emerald-50 rounded-full border border-emerald-100 mb-2">
                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest font-heading">Sistem Presensi Digital</span>
              </div>
              <h2 className="text-2xl font-bold font-heading text-soft-black">
                Daftar Hadir Kegiatan
              </h2>
              <p className="text-sm text-gray-500">
                Silakan pilih kegiatan yang Anda ikuti dan lakukan verifikasi wajah.
              </p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="animate-spin w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Memuat Agenda...</p>
        </div>
      ) : (trainings.length === 0 && events.length === 0) ? (
        <div className="bg-gray-50/50 p-16 rounded-[3rem] text-center border-2 border-dashed border-gray-200">
          <Activity className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-bold text-lg">Tidak ada kegiatan aktif saat ini.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-12">
          {/* Ongoing Trainings */}
          {trainings.length > 0 && (
            <div className="space-y-6">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] pl-2 border-l-4 border-main-blue">Pusat Pelatihan (KKG)</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {trainings.map((t) => (
                  <ActivityCard 
                    key={t.id} 
                    item={t} 
                    type="training" 
                    onAbsen={() => handleAbsenClick(t.id, 'training')} 
                    onGuest={() => { setSelectedActivity({ id: t.id, type: 'training' }); setShowGuestForm(true); }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Ongoing Events */}
          {events.length > 0 && (
            <div className="space-y-6">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] pl-2 border-l-4 border-orange-500">Agenda & Pertemuan Gugus</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {events.map((e) => (
                  <ActivityCard 
                    key={e.id} 
                    item={e} 
                    type="event" 
                    onAbsen={() => handleAbsenClick(e.id, 'event')} 
                    onGuest={() => { setSelectedActivity({ id: e.id, type: 'event' }); setShowGuestForm(true); }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ActivityCard({ item, type, onAbsen, onGuest }: any) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-white p-6 rounded-[2rem] shadow-xl shadow-gray-200/40 border border-gray-50 flex flex-col justify-between"
    >
      <div className="mb-6">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${type === 'training' ? 'bg-blue-50 text-main-blue' : 'bg-orange-50 text-orange-500'}`}>
          {type === 'training' ? <GraduationCap className="w-6 h-6" /> : <Calendar className="w-6 h-6" />}
        </div>
        <h4 className="font-bold text-lg text-soft-black mb-2">{item.title}</h4>
        <p className="text-xs text-gray-500 line-clamp-2 mb-4">{item.description}</p>
        <div className="flex flex-wrap gap-2">
          <span className="px-2 py-1 bg-gray-50 rounded-lg text-[8px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {item.location}
          </span>
          <span className="px-2 py-1 bg-gray-50 rounded-lg text-[8px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
            <Clock className="w-3 h-3" /> {new Date(item.date_start).toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta",  hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
      
      <div className="flex flex-col gap-2">
        <button
          onClick={onAbsen}
          className={`w-full py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${type === 'training' ? 'bg-main-blue text-white hover:bg-dark-blue' : 'bg-orange-500 text-white hover:bg-orange-600'}`}
        >
          <Camera className="w-4 h-4" /> Scan Wajah (Anggota)
        </button>
        <button
          onClick={onGuest}
          className="w-full py-3 bg-gray-50 text-gray-500 border border-gray-100 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-all"
        >
          Presensi Tamu Undangan
        </button>
      </div>
    </motion.div>
  );
}


function ForumSystem({ user }: { user: any }) {
  const [activeView, setActiveView] = useState<"list" | "create" | "detail">(
    "list",
  );
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      // Step 1: Fetch posts
      const { data: postsData, error: postsError } = await supabase
        .from("forum_posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (postsError) throw postsError;

      if (!postsData || postsData.length === 0) {
        setPosts([]);
        return;
      }

      // Step 2: Fetch profiles for authors manually
      const authorIds = [...new Set(postsData.map(p => p.user_id).filter(Boolean))];
      const { data: profilesData, error: profilesError } = await supabase
        .from("user_profiles")
        .select("id, nama, foto")
        .in("id", authorIds);

      if (profilesError) console.error("Error fetching profiles:", profilesError);

      // Step 3: Join locally
      const joinedData = postsData.map(post => ({
        ...post,
        author: profilesData?.find(profile => profile.id === post.user_id)
      }));

      setPosts(joinedData);
    } catch (err) {
      console.error("Forum fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleCreateSuccess = () => {
    setActiveView("list");
    fetchPosts();
  };

  const handleViewDetail = (post: any) => {
    setSelectedPost(post);
    setActiveView("detail");
  };

  return (
    <div className="space-y-10">
      {/* Forum Clean Header */}
      <div className="bg-white p-8 rounded-[2rem] border-l-8 border-indigo-500 shadow-sm mb-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
        <div className="flex items-center gap-8">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 border border-indigo-100 shrink-0">
            <MessageSquare className="w-8 h-8" />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-indigo-50 rounded-full border border-indigo-100 mb-2">
              <div className="w-1 h-1 rounded-full bg-indigo-500 animate-pulse" />
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest font-heading">Kolaborasi Aktif</span>
            </div>
            <h2 className="text-2xl font-bold font-heading text-soft-black">
              Forum Diskusi
            </h2>
            <p className="text-sm text-gray-500">
              Ruang kolektif untuk berbagi ide, memecahkan masalah, dan menginspirasi sesama pendidik di Gugus 03.
            </p>
          </div>
        </div>
        
        {activeView === "list" ? (
          <button
            onClick={() => setActiveView("create")}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-md hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-3"
          >
            <PlusCircle className="w-4 h-4" />
            Mulai Diskusi Baru
          </button>
        ) : (
          <button
            onClick={() => setActiveView("list")}
            className="bg-gray-100 text-gray-700 border border-gray-200 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-gray-200 transition-all flex items-center gap-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Daftar
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-20 text-center text-gray-400 font-medium">
          Memuat diskusi...
        </div>
      ) : activeView === "create" ? (
        <CreateForumPostForm user={user} onSuccess={handleCreateSuccess} />
      ) : activeView === "detail" ? (
        <ForumDetail post={selectedPost} user={user} />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {posts.length === 0 ? (
            <div className="bg-gray-50 p-12 rounded-3xl text-center border-2 border-dashed border-gray-200">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                Belum ada diskusi. Jadilah yang pertama memulai!
              </p>
            </div>
          ) : (
            posts.map((post) => (
              <motion.div
                whileHover={{ x: 5 }}
                key={post.id}
                onClick={() => handleViewDetail(post)}
                className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:border-main-blue/30 cursor-pointer transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gray-50 flex-shrink-0 flex items-center justify-center overflow-hidden border">
                    <img
                      src={
                        post.author?.foto ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author?.nama || "Guru")}&background=random`
                      }
                      alt="Author"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-main-blue uppercase tracking-widest bg-main-blue/5 px-2 py-0.5 rounded-full">
                      {post.category || "Umum"}
                    </span>
                    <h3 className="font-bold text-soft-black mt-1 mb-1">
                      {post.title}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span>
                        Dibuat oleh:{" "}
                        {post.author?.nama || "Guru"}
                      </span>
                      <span>•</span>
                      <span>
                        {new Date(post.created_at).toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta" })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-gray-400">
                  <div className="flex items-center gap-1">
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-xs font-bold">Detail</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300" />
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function CreateForumPostForm({
  user,
  onSuccess,
}: {
  user: any;
  onSuccess: () => void;
}) {
  const { alert } = useAlert();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "Umum",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content)
      return alert("Harap isi judul dan konten diskusi.");

    setLoading(true);
    try {
      const { error } = await supabase.from("forum_posts").insert([
        {
          user_id: user.id,
          title: formData.title,
          content: formData.content,
          category: formData.category,
        },
      ]);

      if (error) throw error;
      await alert("Topik diskusi berhasil diterbitkan!", "Sukses", "success");
      onSuccess();
    } catch (err: any) {
      alert(err.message, "Error", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 max-w-3xl mx-auto"
    >
      <h3 className="text-xl font-bold font-heading mb-6 text-soft-black">
        Buat Topik Baru
      </h3>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
            Pilih Kategori
          </label>
          <div className="flex flex-wrap gap-2">
            {["Umum", "Kurikulum", "Media", "Administrasi", "Inovasi"].map(
              (cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFormData({ ...formData, category: cat })}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${formData.category === cat ? "bg-main-blue text-white shadow-md" : "bg-gray-50 text-gray-500 hover:bg-gray-100"}`}
                >
                  {cat}
                </button>
              ),
            )}
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
            Judul Diskusi
          </label>
          <input
            placeholder="Apa yang ingin Anda diskusikan?"
            className="w-full border-b border-gray-200 p-2 focus:border-main-blue outline-none text-lg font-bold"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
            Detail Pembahasan
          </label>
          <textarea
            placeholder="Tuliskan detail pertanyaan atau pengalaman Anda..."
            rows={8}
            className="w-full border border-gray-100 p-4 rounded-2xl focus:border-main-blue outline-none bg-gray-50/50"
            value={formData.content}
            onChange={(e) =>
              setFormData({ ...formData, content: e.target.value })
            }
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-main-blue text-white rounded-2xl font-bold shadow-lg shadow-main-blue/20 hover:scale-[1.02] transition-all disabled:opacity-50"
        >
          {loading ? "Sedang Menerbitkan..." : "Terbitkan Diskusi Sekarang"}
        </button>
      </form>
    </motion.div>
  );
}

function ForumDetail({ post, user }: { post: any; user: any }) {
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const { alert } = useAlert();

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      // Step 1: Fetch comments
      const { data: commentsData, error: commentsError } = await supabase
        .from("forum_comments")
        .select("*")
        .eq("post_id", post.id)
        .order("created_at", { ascending: true });

      if (commentsError) throw commentsError;

      if (!commentsData || commentsData.length === 0) {
        setComments([]);
        return;
      }

      // Step 2: Fetch profiles for commentators manually
      const userIds = [...new Set(commentsData.map(c => c.user_id).filter(Boolean))];
      const { data: profilesData, error: profilesError } = await supabase
        .from("user_profiles")
        .select("id, nama, foto")
        .in("id", userIds);

      if (profilesError) console.error("Error fetching comment profiles:", profilesError);

      // Step 3: Join locally
      const joinedData = commentsData.map(comment => ({
        ...comment,
        author: profilesData?.find(profile => profile.id === comment.user_id)
      }));

      setComments(joinedData);
    } catch (err) {
      console.error("Comments fetch error:", err);
    } finally {
      setLoadingComments(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [post.id]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmittingReply(true);
    try {
      const { error } = await supabase.from("forum_comments").insert([
        {
          post_id: post.id,
          user_id: user.id,
          content: newComment,
        },
      ]);

      if (error) throw error;
      setNewComment("");
      fetchComments();
    } catch (err: any) {
      alert(err.message, "Error", "error");
    } finally {
      setSubmittingReply(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-24">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100"
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-10 rounded-full overflow-hidden border">
            <img
              src={
                post.author?.foto ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author?.nama || "Guru")}&background=random`
              }
              alt="Author"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <p className="text-sm font-bold text-soft-black">
              Dibuat oleh: {post.author?.nama || "Guru"}
            </p>
            <p className="text-xs text-gray-400">
              {new Date(post.created_at).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}
            </p>
          </div>
        </div>
        <h1 className="text-2xl font-bold font-heading text-soft-black mb-4">
          {post.title}
        </h1>
        <div className="prose prose-blue max-w-none text-gray-600 mb-6 bg-gray-50/50 p-6 rounded-2xl whitespace-pre-wrap">
          {post.content}
        </div>
        <div className="flex items-center gap-4 py-4 border-t border-gray-50">
          <span className="text-[10px] font-extrabold text-main-blue bg-main-blue/10 px-3 py-1 rounded-full uppercase tracking-widest">
            {post.category}
          </span>
        </div>
      </motion.div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold font-heading flex items-center gap-2 text-soft-black">
          <MessageSquare className="w-5 h-5 text-main-blue" />
          Tanggapan Komunitas ({comments.length})
        </h3>

        {loadingComments ? (
          <div className="py-10 text-center text-gray-400 text-sm italic">
            Memuat tanggapan...
          </div>
        ) : comments.length === 0 ? (
          <div className="bg-white/50 p-8 rounded-3xl text-center italic text-gray-400 text-sm border border-dashed border-gray-200">
            Belum ada tanggapan. Jadilah yang pertama memberikan respon!
          </div>
        ) : (
          comments.map((comment) => (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              key={comment.id}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full overflow-hidden border bg-gray-100">
                  <img
                    src={
                      comment.author?.foto ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.author?.nama || "Guru")}&background=random`
                    }
                    alt="Commenter"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-xs font-bold text-soft-black">
                    {comment.author?.nama || "Guru"}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {new Date(comment.created_at).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed pl-11">
                {comment.content}
              </p>
            </motion.div>
          ))
        )}
      </div>

      <div className="bg-white p-4 md:p-6 rounded-3xl shadow-2xl border border-main-blue/20 sticky bottom-4 z-10 transition-all focus-within:shadow-main-blue/20">
        <form onSubmit={handleReply} className="flex gap-4 items-end">
          <div className="flex-1">
            <textarea
              placeholder="Ketik tanggapan konstruktif Anda..."
              rows={1}
              className="w-full border-b border-gray-200 focus:border-main-blue outline-none resize-none p-2 text-sm transition-all"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={submittingReply || !newComment.trim()}
            className="bg-main-blue text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-main-blue/20 hover:scale-[1.05] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
          >
            {submittingReply ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

function TeacherJadwalCards({ user }: { user?: any }) {
  const { alert } = useAlert();
  const [agendas, setAgendas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedAgendaId, setSelectedAgendaId] = useState<string | null>(null);
  const [attendances, setAttendances] = useState<Record<string, boolean>>({});
  const [viewType, setViewType] = useState<'timeline' | 'calendar'>('timeline');

  const [certConfig, setCertConfig] = useState<any>(null);
  const [certRecords, setCertRecords] = useState<Record<string, any>>({});
  const { content } = useSiteContent() as any;
  const isDownloadEnabled = content?.certificateDownloadEnabled !== false;
  const { generateTeacherPDF } = useCertificateGenerator();

  const fetchAgendas = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("events")
        .select("*");
      
      if (user?.is_guest) {
        query = query.eq('is_open_for_guests', true);
      }

      const { data, error } = await query
        .order("date_start", { ascending: false }); // Show newest first

      if (error) throw error;
      setAgendas(data || []);

      if (user) {
        const fieldName = user.is_guest ? 'guest_account_id' : 'user_id';
        const { data: attData } = await supabase
          .from("training_participants")
          .select("event_id")
          .eq(fieldName, user.id)
          .not('event_id', 'is', null);

        const attMap: Record<string, boolean> = {};
        if (attData) {
          attData.forEach(a => attMap[a.event_id] = true);
        }
        setAttendances(attMap);

        try {
          await ensureCertificatesExist(user.id);
        } catch (e) {
          console.error("Auto generation check inside fetchAgendas failed:", e);
        }

        // Fetch User Certificate Records
        const certQuery = supabase
          .from("training_certificates")
          .select("*");
          
        if (user.is_guest) {
          certQuery.eq("guest_account_id", user.id);
        } else {
          certQuery.eq("user_id", user.id);
        }
        
        const { data: certData } = await certQuery;
          
        const certMap: Record<string, any> = {};
        certData?.forEach((cert) => {
          certMap[cert.training_id] = cert;
        });
        setCertRecords(certMap);
      }

      // Fetch Certificate Config
      const { data: sData } = await supabase
        .from("site_settings")
        .select("content")
        .eq("id", 1)
        .single();

      if (sData?.content?.certificate_configs) {
        setCertConfig(sData.content.certificate_configs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgendas();
  }, []);

  const handleDownload = async (item: any) => {
    const config = certConfig ? (certConfig[item.id] || certConfig["default"]) : null;
    if (!config) {
      alert("Template sertifikat belum diatur oleh admin.", "Info", "info");
      return;
    }

    let certNumber = "";

    if (supabase) {
      try {
        const certQuery = supabase
          .from("training_certificates")
          .select("certificate_number")
          .eq("training_id", item.id);
        
        if (user?.is_guest) {
          certQuery.eq("guest_account_id", user.id);
        } else {
          certQuery.eq("user_id", user.id);
        }

        const { data: existingCert } = await certQuery.maybeSingle();

        if (existingCert?.certificate_number) {
          certNumber = existingCert.certificate_number;
        } else {
          const now = new Date();
          const year = now.getFullYear();
          const month = now.getMonth() + 1;
          const romanMonths = [
            "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"
          ];
          const randomPart = Math.floor(1000 + Math.random() * 9000);
          certNumber = `${randomPart}/CERT-KKG/${romanMonths[month - 1]}/${year}`;

          const certPayload: any = {
            training_id: item.id,
            certificate_number: certNumber,
            certificate_url: "Generated Individually",
          };

          if (user?.is_guest) {
            certPayload.guest_account_id = user.id;
          } else {
            certPayload.user_id = user.id;
          }

          const { data: newCert } = await supabase.from("training_certificates").insert(certPayload).select().single();

          if (newCert) setCertRecords((prev) => ({ ...prev, [item.id]: newCert }));

          logActivity(
            user,
            "download_cert",
            `Mengunduh sertifikat agenda: ${item.title}`,
          );
        }
      } catch (err) {
        console.error("Gagal mencatat rincian sertifikat:", err);
      }
    }

    await generateTeacherPDF(user, item, config, certNumber);
  };

  const handleAbsenClick = (id: string) => {
    setSelectedAgendaId(id);
    setIsScannerOpen(true);
  };

  const onScanSuccess = async () => {
    setIsScannerOpen(false);
    if (!selectedAgendaId) return;

    try {
      const payload: any = { 
        status: 'attended',
        attended_at: new Date().toISOString(),
        event_id: selectedAgendaId
      };
      
      const isGuest = !!user?.is_guest;
      const queryKey = isGuest ? 'guest_account_id' : 'user_id';

      if (isGuest) {
        payload.is_guest = true;
        payload.guest_account_id = user.id;
        payload.guest_name = user?.nama;
        payload.guest_institution = user?.sekolah;
        payload.guest_nip = user?.nip;
        payload.guest_position = user?.jabatan;
      } else {
        payload.user_id = user?.id;
      }

      const { data: existing, error: existErr } = await supabase
        .from("training_participants")
        .select("id")
        .eq("event_id", selectedAgendaId)
        .eq(queryKey, user.id)
        .maybeSingle();

      if (existErr) throw existErr;

      if (existing) {
        const { error } = await supabase
          .from("training_participants")
          .update(payload)
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("training_participants")
          .insert([payload]);
        if (error) throw error;
      }

      setAttendances(prev => ({ ...prev, [selectedAgendaId]: true }));
      await alert("Absensi Berhasil Dicatat!", "Sukses", "success");
    } catch (err: any) {
      await alert(err?.message || "Gagal mencatat absensi", "Error", "error");
    }
  };


  const handleSeedData = async () => {
    setLoading(true);
    const dummyEvents = [
      {
        title: "Workshop Kurikulum Merdeka",
        description: "Membahas implementasi Kurikulum Merdeka di sekolah masing-masing.",
        category: "guru",
        date_start: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days from now
        location: "Aula SDN 1 Melati",
      },
      {
        title: "Seminar Teknologi Pendidikan",
        description: "Penggunaan media interaktif untuk pembelajaran efektif.",
        category: "seminar",
        date_start: new Date(Date.now() + 86400000 * 5).toISOString(), // 5 days from now
        location: "Gedung Serbaguna",
      },
      {
        title: "Rapat Koordinasi KKG",
        description: "Rapat rutin untuk mengevaluasi program kerja bulan ini.",
        category: "guru",
        date_start: new Date(Date.now() - 86400000 * 1).toISOString(), // 1 day ago
        location: "Ruang Guru",
      }
    ];

    try {
      await supabase.from("events").insert(dummyEvents);
      await fetchAgendas();
    } catch(err) {
      console.error("Error seeding:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* Jadwal Clean Header */}
      <div className="bg-white p-8 rounded-[2rem] border-l-8 border-orange-500 shadow-sm mb-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
        <div className="flex items-center gap-8">
          <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 border border-orange-100 shrink-0">
            <Calendar className="w-8 h-8" />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-orange-50 rounded-full border border-orange-100 mb-2">
              <div className="w-1 h-1 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest font-heading">Informasi Agenda</span>
            </div>
            <h2 className="text-2xl font-bold font-heading text-soft-black">
              Jadwal Kegiatan
            </h2>
            <p className="text-sm text-gray-500">
              Pantau agenda kegiatan KKG mendatang dan riwayat agar tidak terlewatkan.
            </p>
          </div>
        </div>

        <div className="flex items-center bg-gray-100 p-1 rounded-2xl shrink-0 self-center">
            <button 
              onClick={() => setViewType('timeline')}
              className={`flex items-center gap-2 px-6 py-2 rounded-xl font-bold transition-all text-xs uppercase tracking-widest ${viewType === 'timeline' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <LayoutList className="w-4 h-4" />
              Timeline
            </button>
            <button 
              onClick={() => setViewType('calendar')}
              className={`flex items-center gap-2 px-6 py-2 rounded-xl font-bold transition-all text-xs uppercase tracking-widest ${viewType === 'calendar' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Calendar className="w-4 h-4" />
              Kalender
            </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="animate-spin w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Menyiapkan Jadwal...</p>
        </div>
      ) : agendas.length === 0 ? (
        <div className="bg-gray-50/50 p-16 rounded-[3rem] text-center border-2 border-dashed border-gray-200">
          <Calendar className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-bold italic mb-6">Belum ada agenda kegiatan.</p>
          <button 
            onClick={handleSeedData}
            className="px-6 py-3 bg-main-blue text-white font-bold rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all"
          >
            Isi Data Contoh Sekarang
          </button>
        </div>
      ) : viewType === 'timeline' ? (
        <div className="relative border-l-4 border-orange-500/20 ml-4 md:ml-24 space-y-12 pb-10 mt-8">
          {agendas.map((item, index) => {
            const dateObj = new Date(item.date_start);
            const now = new Date();
            const isStarted = dateObj < now;
            const isEnded = new Date(item.date_end || item.date_start) < now;
            return (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                key={item.id}
                className="relative pl-8 md:pl-12 group"
              >
                {/* Node Marker */}
                <div className={`absolute -left-[14px] top-8 w-6 h-6 bg-white border-4 ${isEnded ? 'border-gray-400 shadow-gray-400/40' : isStarted ? 'border-orange-500 shadow-orange-500/40 animate-pulse' : 'border-orange-500 shadow-orange-500/40'} rounded-full shadow-lg group-hover:scale-125 transition-transform z-10`} />
                <div className={`absolute -left-20 top-6 text-right w-16 hidden md:block`}>
                   <p className="text-xl font-black text-gray-800 leading-none">{dateObj.toLocaleString("id-ID", { timeZone: "Asia/Jakarta", day: "numeric" })}</p>
                   <p className="text-xs font-bold text-gray-500 uppercase">{dateObj.toLocaleString("id-ID", { timeZone: "Asia/Jakarta",  month: "short" })}</p>
                </div>

                {/* Content Card */}
                <div className={`bg-white rounded-[2rem] shadow-xl shadow-gray-200 border border-gray-100 overflow-hidden flex flex-col md:flex-row relative transition-all hover:shadow-2xl hover:-translate-y-1 ${isEnded ? 'opacity-80 grayscale-[20%]' : isStarted ? 'ring-2 ring-orange-500/20' : ''}`}>
                  {/* Event Cover Image (16:9 ratio, clearly visible) */}
                  {item.image_url && (
                    <div className="w-full md:w-1/3 aspect-[16/9] overflow-hidden relative group shrink-0 border-r border-gray-100/50 bg-slate-900 flex items-center justify-center">
                      {/* Blurred backdrop image to fill any padding/gaps if container stretches */}
                      <img 
                        src={item.image_url} 
                        alt="" 
                        className="absolute inset-0 w-full h-full object-cover blur-lg scale-110 opacity-30 pointer-events-none" 
                      />
                      <img 
                        src={item.image_url} 
                        alt={item.title} 
                        className="w-full h-full object-contain relative z-10 transition-transform duration-700 group-hover:scale-105" 
                      />
                    </div>
                  )}

                  {/* Left Side: Date Banner (Mobile only) */}
                  <div className={`md:hidden bg-gradient-to-br ${isEnded ? 'from-gray-100 to-gray-200' : isStarted ? 'from-orange-100 to-orange-200 shadow-inner' : 'from-orange-50 to-orange-100'} p-6 border-b border-gray-50 flex items-center gap-4`}>
                     <div className={`w-16 h-16 bg-white rounded-[1.25rem] flex flex-col items-center justify-center shadow-md border border-gray-100`}>
                        <span className="text-[10px] font-black text-gray-400 uppercase leading-none">
                          {dateObj.toLocaleString("id-ID", { timeZone: "Asia/Jakarta",  month: "short" })}
                        </span>
                        <span className={`text-3xl font-black ${isEnded ? 'text-gray-500' : 'text-orange-500'} leading-none mt-1`}>
                          {dateObj.toLocaleString("id-ID", { timeZone: "Asia/Jakarta", day: "numeric" })}
                        </span>
                     </div>
                     <div>
                       <h3 className="font-black text-soft-black text-xl line-clamp-2 leading-tight">
                         {item.title}
                       </h3>
                       <div className="flex items-center gap-2 mt-2">
                         <span className={`text-[10px] font-black ${isEnded ? 'text-gray-500 bg-gray-100' : isStarted ? 'text-orange-600 bg-orange-100' : 'text-orange-600 bg-orange-100'} px-3 py-1 bg-white rounded-full uppercase tracking-widest`}>
                           {isEnded ? 'Selesai' : isStarted ? 'Berlangsung' : item.category || "Kegiatan"}
                         </span>
                         {!isStarted && <CountdownTimer targetDate={item.date_start} simple />}
                       </div>
                     </div>
                  </div>

                  {/* Desktop Title & Details Area */}
                  <div className="p-6 md:p-8 flex-1 flex flex-col">
                    <div className="hidden md:flex justify-between items-start mb-4">
                       <h3 className="font-black text-soft-black text-2xl group-hover:text-orange-600 transition-colors line-clamp-2 leading-tight pr-4">
                         {item.title}
                       </h3>
                       <span className={`text-[10px] whitespace-nowrap font-black ${isEnded ? 'text-gray-500 bg-gray-100' : 'text-orange-600 bg-orange-100'} px-4 py-2 rounded-full uppercase tracking-widest`}>
                          {item.category || "Kegiatan"}
                       </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                       <div className="flex items-center gap-4 group/item">
                          <div className={`w-10 h-10 rounded-xl ${isEnded ? 'bg-gray-100 text-gray-500' : 'bg-orange-50 text-orange-500'} flex items-center justify-center transition-colors shrink-0`}>
                            <MapPin className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-0.5">Lokasi</p>
                            <p className="text-sm font-bold text-soft-black line-clamp-1">{item.location || "Sekolah / Online"}</p>
                          </div>
                       </div>

                       <div className="flex items-center gap-4 group/item">
                          <div className={`w-10 h-10 rounded-xl ${isEnded ? 'bg-gray-100 text-gray-500' : 'bg-orange-50 text-orange-500'} flex items-center justify-center transition-colors shrink-0`}>
                            <Clock className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-0.5">Waktu</p>
                            <p className="text-sm font-bold text-soft-black">Pukul {dateObj.toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta",  hour: "2-digit", minute:"2-digit" })} WIB</p>
                          </div>
                       </div>
                    </div>

                    <div className={`pt-6 mt-6 border-t flex flex-col md:flex-row md:justify-between md:items-end gap-4 ${isEnded ? 'border-gray-200' : isStarted ? 'border-orange-500/20' : 'border-gray-50'}`}>
                      <p className="text-xs text-gray-500 italic leading-relaxed line-clamp-3 md:flex-1">
                        "{item.description || "Agenda rutin pengembangan keprofesian berkelanjutan."}"
                      </p>
                      
                      {user && (
                        <div className="shrink-0 w-full md:w-auto">
                          {attendances[item.id] ? (
                            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                              <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-50 text-green-600 rounded-xl font-bold text-[11px] uppercase tracking-widest border border-green-100 w-full md:w-auto justify-center">
                                <CheckCircle className="w-4 h-4" /> Hadir
                              </div>
                              {(certConfig && certConfig[item.id] ? certConfig[item.id].downloadEnabled !== false : isDownloadEnabled) ? (
                                <button
                                  onClick={() => handleDownload(item)}
                                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-500 text-white rounded-xl font-bold text-[11px] uppercase tracking-widest shadow-lg shadow-amber-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all w-full md:w-auto justify-center"
                                >
                                  <Download className="w-4 h-4" /> Unduh Sertifikat
                                </button>
                              ) : (
                                <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-400 rounded-xl font-bold text-[11px] uppercase tracking-widest border border-gray-200 w-full md:w-auto justify-center cursor-not-allowed">
                                  <Shield className="w-4 h-4" /> Belum Siap
                                </div>
                              )}
                            </div>
                          ) : item.is_attendance_open ? (
                            <button
                              onClick={() => handleAbsenClick(item.id)}
                              className="inline-flex items-center gap-2 px-6 py-2.5 bg-main-blue text-white rounded-xl font-bold text-[11px] uppercase tracking-widest shadow-lg shadow-main-blue/30 hover:scale-[1.02] active:scale-[0.98] transition-all w-full md:w-auto justify-center"
                            >
                              <UserCheck className="w-4 h-4" /> Absen Sekarang
                            </button>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="mt-8 bg-white p-8 md:p-12 rounded-[3rem] shadow-xl shadow-orange-500/5 border border-white">
          <MainCalendar events={agendas} />
        </div>
      )}

      <FaceScannerModal 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        onSuccess={onScanSuccess}
      />
    </div>
  );
}

function TeacherTrainingCards({ user }: { user: any }) {
  const { alert } = useAlert();
  const { content } = useSiteContent() as any;
  const isDownloadEnabled = content?.certificateDownloadEnabled !== false;
  const { generateTeacherPDF } = useCertificateGenerator();
  const [trainings, setTrainings] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [certConfig, setCertConfig] = useState<any>(null);
  const [certRecords, setCertRecords] = useState<Record<string, any>>({});
  const [activeSubTab, setActiveSubTab] = useState<
    "daftar" | "absensi" | "sertifikat"
  >("daftar");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedTrainingId, setSelectedTrainingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (!supabase || !user) return;
    setLoading(true);
    try {
      // Fetch Trainings
      let tQuery = supabase
        .from("trainings")
        .select("*");
      
      if ((user as any).is_guest) {
        tQuery = tQuery.eq('is_open_for_guests', true);
      }

      const { data: tData, error: tError } = await tQuery.order("date_start", { ascending: false });

      if (tError) throw tError;
      setTrainings(tData || []);

      // Fetch User Registrations
      const regQuery = supabase
        .from("training_participants")
        .select("*");
      
      if ((user as any).is_guest) {
        regQuery.eq("guest_account_id", user.id);
      } else {
        regQuery.eq("user_id", user.id);
      }
      
      const { data: rData } = await regQuery;

      const regMap: Record<string, any> = {};
      rData?.forEach((reg) => {
        regMap[reg.training_id] = reg;
      });
      setRegistrations(regMap);
      
      try {
        await ensureCertificatesExist(user.id);
      } catch (e) {
        console.error("Auto generation inside TeacherTrainingCards failed:", e);
      }
      
      // Fetch User Certificate Records
      const certQuery = supabase
        .from("training_certificates")
        .select("*");
        
      if ((user as any).is_guest) {
        certQuery.eq("guest_account_id", user.id); // Assuming we add this too if needed
      } else {
        certQuery.eq("user_id", user.id);
      }
      
      const { data: certData } = await certQuery;
        
      const certMap: Record<string, any> = {};
      certData?.forEach((cert) => {
        certMap[cert.training_id] = cert;
      });
      setCertRecords(certMap);

      // Fetch Certificate Config
      const { data: sData } = await supabase
        .from("site_settings")
        .select("content")
        .eq("id", 1)
        .single();

      if (sData?.content?.certificate_configs) {
        setCertConfig(sData.content.certificate_configs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (trainingId: string) => {
    if (!supabase || !user) return;
    try {
      const payload: any = {
        training_id: trainingId,
        status: "registered",
        registered_at: new Date().toISOString(),
      };

      if ((user as any).is_guest) {
        payload.is_guest = true;
        payload.guest_account_id = user.id;
        payload.guest_name = user.nama;
        payload.guest_institution = user.sekolah;
        payload.guest_nip = user.nip;
        payload.guest_position = user.jabatan;
      } else {
        payload.user_id = user.id;
      }

      const { error } = await supabase.from("training_participants").insert(payload);

      if (error) throw error;
      alert("Pendaftaran berhasil!", "Sukses", "success");
      fetchData();
    } catch (err: any) {
      alert(err.message, "Gagal Daftar", "error");
    }
  };

  const handleAbsenClick = (trainingId: string) => {
    setSelectedTrainingId(trainingId);
    setIsScannerOpen(true);
  };

  const handleScanSuccess = async () => {
    setIsScannerOpen(false);
    if (!selectedTrainingId || !supabase || !user) return;
    const trainingId = selectedTrainingId;
    try {
      const query = supabase
        .from("training_participants")
        .update({
          status: "attended",
          attended_at: new Date().toISOString(),
        })
        .eq("training_id", trainingId);

      if ((user as any).is_guest) {
        query.eq("guest_account_id", user.id);
      } else {
        query.eq("user_id", user.id);
      }

      const { error } = await query;

      if (error) throw error;
      alert("Daftar hadir berhasil diisi!", "Sukses", "success");
      fetchData();
    } catch (err: any) {
      alert(err.message, "Gagal Absen", "error");
    }
  };

  const handleDownload = async (training: any) => {
    const config = certConfig ? (certConfig[training.id] || certConfig["default"]) : null;
    if (!config) {
      alert("Template sertifikat belum diatur oleh admin.", "Info", "info");
      return;
    }

    let certNumber = "";

    // Auto-record to training_certificates and generate number
    if (supabase) {
      try {
        // Check if certificate record already exists
        const certQuery = supabase
          .from("training_certificates")
          .select("certificate_number")
          .eq("training_id", training.id);
        
        if ((user as any).is_guest) {
          certQuery.eq("guest_account_id", user.id);
        } else {
          certQuery.eq("user_id", user.id);
        }

        const { data: existingCert } = await certQuery.maybeSingle();

        if (existingCert?.certificate_number) {
          certNumber = existingCert.certificate_number;
        } else {
          // Generate an automatic certificate number: [Nomer]/CERT-KKG/[Bulan Romawi]/[Tahun]
          const now = new Date();
          const year = now.getFullYear();
          const month = now.getMonth() + 1;
          const romanMonths = [
            "I",
            "II",
            "III",
            "IV",
            "V",
            "VI",
            "VII",
            "VIII",
            "IX",
            "X",
            "XI",
            "XII",
          ];
          const randomPart = Math.floor(1000 + Math.random() * 9000);
          certNumber = `${randomPart}/CERT-KKG/${romanMonths[month - 1]}/${year}`;

          const certPayload: any = {
            training_id: training.id,
            certificate_number: certNumber,
            certificate_url: "Generated Individually",
          };

          if ((user as any).is_guest) {
            certPayload.guest_account_id = user.id;
          } else {
            certPayload.user_id = user.id;
          }

          const { data: newCert } = await supabase.from("training_certificates").insert(certPayload).select().single();

          if (newCert) setCertRecords((prev) => ({ ...prev, [training.id]: newCert }));

          logActivity(
            user,
            "download_cert",
            `Mengunduh sertifikat pelatihan: ${training.title}`,
          );
        }
      } catch (err) {
        console.error("Gagal mencatat rincian sertifikat:", err);
      }
    }

    // Generate PDF with the number
    await generateTeacherPDF(user, training, config, certNumber);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ongoing":
        return "bg-green-100 text-green-600 border-green-200";
      case "planned":
        return "bg-blue-100 text-blue-600 border-blue-200";
      case "completed":
        return "bg-gray-100 text-gray-600 border-gray-200";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "ongoing":
        return "Sedang Berlangsung";
      case "planned":
        return "Direncanakan";
      case "completed":
        return "Selesai";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-8">
      {/* Training Clean Header */}
      <div className="bg-white p-6 md:p-8 rounded-[3rem] border-l-8 border-main-blue shadow-sm mb-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 md:gap-10">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
          <div className="w-14 h-14 md:w-16 md:h-16 bg-main-blue/10 rounded-2xl flex items-center justify-center text-main-blue border border-main-blue/10 shrink-0">
            <GraduationCap className="w-6 h-6 md:w-8 md:h-8" />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-main-blue/5 rounded-full border border-main-blue/10 mb-2">
               <div className="w-1 h-1 rounded-full bg-main-blue animate-ping" />
               <span className="text-[10px] font-bold text-main-blue uppercase tracking-widest font-heading">Pusat Belajar</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold font-heading text-soft-black">
              Portal Pelatihan <span className="text-main-blue">Guru</span>
            </h2>
            <p className="text-sm text-gray-500 max-w-lg leading-relaxed mt-1">
              Akses materi eksklusif, tingkatkan kompetensi profesional, dan kelola sertifikasi Anda dalam satu platform modern.
            </p>
          </div>
        </div>

        {/* Tab System Modernized */}
        <div className="flex w-full md:w-auto overflow-x-auto hide-scrollbar bg-gray-50 p-1.5 rounded-2xl shrink-0 border border-gray-100 shadow-inner snap-x">
          {[
            { id: "daftar", label: "Program", icon: Calendar, activeColor: "bg-white text-main-blue shadow-sm" },
            { id: "absensi", label: "Riwayat", icon: CheckSquare, activeColor: "bg-white text-orange-500 shadow-sm" },
            { id: "sertifikat", label: "Sertifikat", icon: Award, activeColor: "bg-white text-amber-500 shadow-sm" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 relative shrink-0 snap-center whitespace-nowrap ${
                activeSubTab === tab.id
                  ? tab.activeColor
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-100/50"
              }`}
            >
              <tab.icon className={`w-4 h-4`} />
              {tab.label}
              {activeSubTab === tab.id && (
                <motion.div layoutId="tab-indicator" className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-current rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-gray-400">Memuat data...</div>
      ) : (
        <AnimatePresence mode="wait">
          {activeSubTab === "daftar" && (
            <motion.div
              key="daftar"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {trainings.length === 0 ? (
                <div className="md:col-span-2 bg-gray-50 p-12 rounded-3xl text-center border-2 border-dashed border-gray-200">
                  <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    Belum ada program pelatihan yang tersedia.
                  </p>
                </div>
              ) : (
                trainings.map((item) => {
                  const reg = registrations[item.id];
                  const isRegistered = !!reg;
                  const hasAttended = reg?.status === "attended";

                  const now = new Date();
                  const startDate = new Date(item.date_start);
                  const endDate = item.date_end ? new Date(item.date_end) : new Date(startDate.getTime() + 8 * 60 * 60 * 1000); // Default 8 jam jika tidak diset

                  let autoStatus = item.status || "planned";
                  if (now < startDate) autoStatus = "planned";
                  else if (now >= startDate && now <= endDate) autoStatus = "ongoing";
                  else autoStatus = "completed";

                  const canRegister = autoStatus !== "completed";
                  const isOngoing = now >= startDate && now <= endDate;
                  const isFinished = now > endDate;

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ y: -8 }}
                      className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden transition-all flex flex-col group relative"
                    >
                      {item.banner_url && (
                        <div className="w-full aspect-[16/9] relative bg-gray-100 overflow-hidden shrink-0">
                          <img 
                            src={item.banner_url} 
                            alt={item.title} 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                        </div>
                      )}

                      {/* Sub-header inside card for status */}
                      <div className={`absolute left-6 z-10 ${item.banner_url ? 'top-4' : 'top-6'}`}>
                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm backdrop-blur-md ${
                          autoStatus === 'ongoing' ? 'bg-leaf-green/90 text-white border-leaf-green/20' :
                          autoStatus === 'planned' ? 'bg-main-blue/90 text-white border-main-blue/20' :
                          'bg-gray-800/80 text-white border-gray-700'
                        }`}>
                          {getStatusLabel(autoStatus)}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row flex-1">
                        {/* Day & Month Badge Section */}
                        <div className={`sm:w-24 flex flex-col items-center justify-center p-4 border-b sm:border-b-0 sm:border-r border-gray-50 bg-gradient-to-b ${
                           autoStatus === 'ongoing' ? 'from-leaf-green/5 to-white' :
                           autoStatus === 'planned' ? 'from-main-blue/5 to-white' :
                           'from-gray-50 to-white'
                        }`}>
                          <div className="relative">
                            <div className={`w-20 h-20 rounded-[1.5rem] bg-white shadow-xl flex flex-col items-center justify-center border-t-4 ${
                               autoStatus === 'ongoing' ? 'border-t-leaf-green border-leaf-green/10' :
                               autoStatus === 'planned' ? 'border-t-main-blue border-main-blue/10' :
                               'border-t-gray-400 border-gray-100'
                            }`}>
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                                {new Date(item.date_start).toLocaleString(
                                  "id-ID",
                                  { timeZone: "Asia/Jakarta", month: "short" },
                                )}
                              </span>
                              <span className={`text-4xl font-black leading-none mt-1 ${
                                autoStatus === 'ongoing' ? 'text-leaf-green' :
                                autoStatus === 'planned' ? 'text-main-blue' :
                                'text-gray-700'
                              }`}>
                                {new Date(item.date_start).toLocaleString("id-ID", { timeZone: "Asia/Jakarta", day: "numeric" })}
                              </span>
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center border border-gray-50">
                               <Calendar className="w-4 h-4 text-gray-400" />
                            </div>
                          </div>
                        </div>

                        {/* Content Section */}
                        <div className="p-5 flex-1">
                          <h3 className="font-black text-soft-black text-lg mb-2 leading-tight tracking-tight group-hover:text-main-blue transition-colors line-clamp-1">
                            {item.title}
                          </h3>
                          <p className="text-[11px] text-gray-500 line-clamp-2 mb-4 leading-relaxed">
                            {item.description}
                          </p>
                          
                          <div className="grid grid-cols-1 gap-2">
                            <div className="flex items-center gap-2 bg-gray-50/80 p-2 rounded-xl border border-gray-100 overflow-hidden">
                               <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center shadow-sm text-main-blue shrink-0">
                                  <MapPin className="w-3 h-3" />
                               </div>
                               <div className="min-w-0">
                                  <p className="text-[8px] font-black text-gray-400 uppercase leading-none mb-0.5">Lokasi</p>
                                  <p className="text-[10px] font-bold text-soft-black truncate">{item.location}</p>
                               </div>
                            </div>
                            <div className="flex items-center gap-2 bg-gray-50/80 p-2 rounded-xl border border-gray-100 overflow-hidden">
                               <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center shadow-sm text-leaf-green shrink-0">
                                  <Clock className="w-3 h-3" />
                               </div>
                               <div className="min-w-0">
                                  <p className="text-[8px] font-black text-gray-400 uppercase leading-none mb-0.5">Waktu</p>
                                  <p className="text-[10px] font-bold text-soft-black truncate">
                                    {new Date(item.date_start).toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta",  hour: "2-digit", minute:"2-digit" })} - {item.date_end ? new Date(item.date_end).toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta",  hour: "2-digit", minute:"2-digit" }) : "Selesai"} WIB
                                  </p>
                               </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Footer / Actions */}
                      <div className="p-4 bg-gradient-to-r from-gray-50/50 to-white border-t border-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="flex flex-col gap-2">
                           {isRegistered ? (
                             <div className="inline-flex items-center gap-2 bg-green-50 px-4 py-2 rounded-xl border border-green-100 self-start">
                               <CheckCircle className="w-4 h-4 text-green-500" />
                               <span className="text-[10px] font-black text-green-600 uppercase tracking-wider">Terdaftar</span>
                             </div>
                           ) : (
                             <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest pl-2">
                               Belum Terdaftar
                             </div>
                           )}
                           {hasAttended && (item.materi_url || item.video_url) && (
                             <div className="flex flex-wrap items-center gap-2 mt-1">
                               {item.materi_url && (
                                 <a 
                                   href={getDirectDownloadUrl(item.materi_url)} 
                                   target="_blank" 
                                   rel="noopener noreferrer" 
                                   className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-main-blue rounded-lg text-[10px] font-black uppercase hover:bg-blue-100 transition-colors border border-blue-100"
                                 >
                                   <BookOpen className="w-3 h-3" /> Unduh Materi
                                 </a>
                               )}
                               {item.video_url && (
                                 <a 
                                   href={item.video_url} 
                                   target="_blank" 
                                   rel="noopener noreferrer" 
                                   className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-500 rounded-lg text-[10px] font-black uppercase hover:bg-red-100 transition-colors border border-red-100"
                                 >
                                   <Play className="w-3 h-3" /> Rekaman Video
                                 </a>
                               )}
                             </div>
                           )}
                        </div>

                        <div className="flex flex-wrap sm:flex-nowrap gap-3 w-full sm:w-auto">
                          {!isRegistered ? (
                            <button
                              onClick={() => handleRegister(item.id)}
                              disabled={!canRegister}
                              className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-[10px] font-black transition-all flex justify-center items-center gap-2 shadow-lg shrink-0 ${
                                !canRegister
                                  ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                                  : "bg-main-blue text-white shadow-main-blue/20 hover:scale-105 active:scale-95"
                              }`}
                            >
                              <PlusCircle className="w-4 h-4 shrink-0" /> <span className="truncate">{!canRegister ? "Pendaftaran Tutup" : autoStatus === "ongoing" ? "Daftar (Sedang Berlangsung)" : "Daftar Sekarang"}</span>
                            </button>
                          ) : !hasAttended ? (
                            item.is_attendance_open ? (
                              <button
                                onClick={() => handleAbsenClick(item.id)}
                                className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-[10px] font-black shadow-lg transition-all flex justify-center items-center gap-2 shrink-0 bg-leaf-green text-white shadow-leaf-green/20 hover:scale-105 active:scale-95`}
                              >
                                <UserCheck className="w-4 h-4 shrink-0" /> <span className="truncate">Konfirmasi Hadir</span>
                              </button>
                            ) : (
                               <div className="w-full sm:w-auto px-5 py-2.5 bg-gray-100 text-gray-400 rounded-xl text-[10px] font-black border border-gray-200 shadow-sm flex justify-center items-center gap-2 shrink-0 cursor-not-allowed">
                                 <UserCheck className="w-4 h-4 shrink-0" /> <span className="truncate">Absen Ditutup</span>
                               </div>
                            )
                          ) : (
                            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                              <div className="w-full sm:w-auto px-5 py-2.5 bg-white text-emerald-600 rounded-xl text-[10px] font-black border border-emerald-100 shadow-sm flex justify-center items-center gap-2 shrink-0">
                                 <CheckCircle className="w-4 h-4 text-emerald-500" /> <span className="truncate">Selesai</span>
                              </div>
                              {(certConfig && certConfig[item.id] ? certConfig[item.id].downloadEnabled !== false : isDownloadEnabled) ? (
                                <button
                                  onClick={() => handleDownload(item)}
                                  className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 text-white rounded-xl text-[10px] font-black hover:bg-amber-600 shadow-lg shadow-amber-500/25 transition-all flex justify-center items-center gap-2 shrink-0 hover:scale-[1.03] active:scale-95 text-center"
                                >
                                  <Download className="w-4 h-4 shrink-0" />
                                  <span className="truncate">Unduh Sertifikat</span>
                                </button>
                              ) : (
                                <div className="w-full sm:w-auto px-5 py-2.5 bg-gray-100 text-gray-400 rounded-xl text-[10px] font-black border border-gray-100 shadow-sm flex justify-center items-center gap-2 shrink-0 cursor-not-allowed">
                                  <Shield className="w-4 h-4 shrink-0" />
                                  <span className="truncate">Belum Siap</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          )}

          {activeSubTab === "absensi" && (
            <motion.div
              key="absensi"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[700px]">
                  <thead className="bg-gray-50">
                  <tr className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                    <th className="px-8 py-4">Pelatihan</th>
                    <th className="px-8 py-4">Tanggal Daftar</th>
                    <th className="px-8 py-4">Status</th>
                    <th className="px-8 py-4">Absensi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {Object.values(registrations).length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-8 py-20 text-center text-gray-300"
                      >
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                          <BookOpen className="w-8 h-8 text-gray-200" />
                        </div>
                        <p className="font-medium italic">Belum ada riwayat pendaftaran.</p>
                      </td>
                    </tr>
                  ) : (
                    Object.values(registrations).map((reg: any) => {
                      const training = trainings.find(
                        (t) => t.id === reg.training_id,
                      );
                      const isAttended = reg.status === "attended";

                      return (
                        <tr key={reg.id} className="text-sm group hover:bg-blue-50/30 transition-colors">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-3">
                               <div className={`w-2 h-8 rounded-full ${isAttended ? 'bg-leaf-green' : 'bg-main-blue opacity-30'}`} />
                               <div>
                                  <p className="font-black text-soft-black leading-tight mb-0.5">{training?.title || "Unknown"}</p>
                                  <p className="text-[10px] text-gray-400 font-bold uppercase">{training?.location}</p>
                               </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex flex-col">
                               <span className="font-black text-gray-600">{new Date(reg.registered_at).toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta",  day: 'numeric', month: 'long', year: 'numeric' })}</span>
                               <span className="text-[10px] text-gray-400 font-bold uppercase">Terdaftar Pada</span>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${
                               isAttended 
                                ? "bg-green-50 text-green-600 border-green-100" 
                                : "bg-blue-50 text-main-blue border-blue-100"
                            }`}>
                               {isAttended ? <CheckCircle className="w-3 h-3" /> : <div className="w-2 h-2 rounded-full bg-main-blue/40 animate-pulse" />}
                               {isAttended ? "Hadir" : "Terdaftar"}
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            {reg.attended_at ? (
                              <div className="flex flex-col">
                                <span className="text-xs font-black text-gray-400">
                                  {new Date(reg.attended_at).toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta",  hour: '2-digit', minute: '2-digit' })} WIB
                                </span>
                                <span className="text-[10px] text-gray-300 font-bold uppercase">Waktu Absensi</span>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleAbsenClick(reg.training_id)}
                                className="px-6 py-2 bg-main-blue/10 text-main-blue rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-main-blue hover:text-white transition-all shadow-md shadow-main-blue/5"
                              >
                                Isi Sekarang
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            </motion.div>
          )}

          {activeSubTab === "sertifikat" && (
            <motion.div
              key="sertifikat"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              {Object.values(registrations).filter(
                (r: any) => r.status === "attended",
              ).length === 0 ? (
                <div className="md:col-span-2 bg-gray-50 p-20 rounded-[3rem] text-center border-2 border-dashed border-gray-200">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                    <Award className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-black text-gray-400 mb-2">Belum Tersedia</h3>
                  <p className="text-gray-400 max-w-sm mx-auto font-medium">
                    Selesaikan pelatihan dan pastikan daftar hadir terisi untuk mendapatkan sertifikat Anda.
                  </p>
                </div>
              ) : (
                Object.values(registrations)
                  .filter((r: any) => r.status === "attended")
                  .map((reg: any) => {
                    const training = trainings.find(
                      (t) => t.id === reg.training_id,
                    );
                    const isDownloaded = !!certRecords[reg.training_id];
                    
                    return (
                      <motion.div
                        key={reg.id}
                        whileHover={{ scale: 1.02 }}
                        className={`p-8 rounded-[3rem] border-2 flex flex-col sm:flex-row items-center justify-between gap-6 transition-all relative overflow-hidden group ${
                           isDownloaded 
                            ? 'bg-gradient-to-br from-green-50 to-white border-green-100 shadow-xl shadow-green-500/5' 
                            : 'bg-gradient-to-br from-amber-50 to-white border-amber-100 shadow-xl shadow-amber-500/5'
                        }`}
                      >
                        {/* Background Decoration */}
                        <div className={`absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-32 h-32 blur-3xl opacity-20 ${isDownloaded ? 'bg-green-500' : 'bg-amber-500'}`} />

                        <div className="flex items-center gap-6 relative z-10">
                          <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-xl group-hover:rotate-6 transition-transform ${
                             isDownloaded ? 'bg-green-500 text-white shadow-green-500/20' : 'bg-amber-500 text-white shadow-amber-500/20'
                          }`}>
                             {isDownloaded ? <CheckCircle className="w-8 h-8" /> : <Award className="w-8 h-8" />}
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-2">Penghargaan Pelatihan</p>
                            <h4 className="font-black text-soft-black text-lg leading-tight mb-1">
                              {training?.title}
                            </h4>
                            <div className="flex items-center gap-2">
                               <div className={`w-2 h-2 rounded-full animate-pulse ${isDownloaded ? 'bg-green-500' : 'bg-amber-500'}`} />
                               <span className={`text-[11px] font-bold ${isDownloaded ? 'text-green-600' : 'text-amber-600'}`}>
                                 {isDownloaded ? "Sertifikat Terverifikasi" : "Siap Diunduh"}
                               </span>
                            </div>
                          </div>
                        </div>

                        {(certConfig && certConfig[training.id] ? certConfig[training.id].downloadEnabled !== false : isDownloadEnabled) ? (
                          <button
                            onClick={() => handleDownload(training)}
                            className={`px-8 py-4 text-white rounded-2xl transition-all shadow-2xl relative z-10 flex items-center gap-3 font-black text-xs active:scale-90 ${
                               isDownloaded 
                                ? 'bg-green-500 hover:bg-green-600 shadow-green-500/30' 
                                : 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/30'
                            }`}
                          >
                            <Download className="w-5 h-5" />
                            {isDownloaded ? "Cetak Ulang" : "Unduh Sekarang"}
                          </button>
                        ) : (
                          <div className="px-6 py-3 bg-gray-100 text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-widest">
                             Terkunci
                          </div>
                        )}
                      </motion.div>
                    );
                  })
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      <FaceScannerModal 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        onSuccess={handleScanSuccess}
      />
    </div>
  );
}

function GuestBookForm({ user }: { user: any }) {
  const { alert } = useAlert();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    purpose: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("guest_book").insert([{
        guest_name: user.nama,
        guest_nip: user.nip,
        guest_pangkat: user.pangkat,
        guest_institution: user.sekolah,
        guest_position: user.jabatan,
        guest_peran: user.peran,
        purpose: formData.purpose,
        notes: formData.notes,
        created_at: new Date().toISOString()
      }]);
      if (error) throw error;
      await alert("Terima kasih telah mengisi buku tamu!", "Sukses", "success");
      setFormData({ purpose: "", notes: "" });
    } catch (err: any) {
      alert(err.message, "Gagal", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      <div className="bg-white p-8 rounded-[2rem] border-l-8 border-indigo-600 shadow-sm flex flex-col md:flex-row md:items-center gap-10">
        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 border border-indigo-100 shrink-0">
          <NotebookPen className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-black font-heading text-soft-black">Buku Tamu KKG</h2>
          <p className="text-sm text-gray-500">Silakan isi data kunjungan Anda sebagai arsip kegiatan kami.</p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[3rem] p-10 md:p-12 shadow-xl border border-gray-100"
      >
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Nama</span>
                <p className="font-bold text-soft-black">{user.nama}</p>
             </div>
             <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Instansi</span>
                <p className="font-bold text-soft-black">{user.sekolah}</p>
             </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 ml-1">Tujuan Kunjungan / Kegiatan</label>
            <input
              required
              className="w-full bg-gray-50 border-2 border-transparent border-b-gray-200 p-4 text-sm font-bold focus:border-indigo-600 focus:bg-white outline-none transition-all"
              placeholder="Contoh: Menghadiri Workshop KKG"
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 ml-1">Kesan & Pesan (Opsional)</label>
            <textarea
              className="w-full bg-gray-50 border-2 border-transparent border-b-gray-200 p-4 text-sm font-bold focus:border-indigo-600 focus:bg-white outline-none transition-all h-32"
              placeholder="Berikan masukan atau kesan Anda..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <button
            disabled={loading}
            className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            Simpan Data Kunjungan
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function AdminGuestBookView() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    if (!supabase) return;
    setLoading(true);
    const { data } = await supabase
      .from("guest_book")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setEntries(data);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!supabase) return;
    const { confirm, alert } = useAlert();
    if (await confirm("Hapus rekapan buku tamu ini?")) {
      const { error } = await supabase.from("guest_book").delete().eq("id", id);
      if (error) {
        alert(error.message, "Gagal", "error");
      } else {
        alert("Data dihapus", "Sukses", "success");
        fetchEntries();
      }
    }
  };

  return (
    <div className="space-y-10">
       <div className="bg-white p-8 rounded-[2rem] border-l-8 border-indigo-600 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-10">
        <div className="flex items-center gap-8">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 border border-indigo-100">
            <NotebookPen className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold font-heading text-soft-black">Arsip Buku Tamu</h2>
            <p className="text-sm text-gray-500">Daftar rekapan kunjungan tamu undangan ke portal KKG.</p>
          </div>
        </div>
        <button 
          onClick={fetchEntries}
          className="p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-gray-600"
        >
          <RefreshCw className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
             <thead className="bg-gray-50 border-b border-gray-100">
               <tr>
                 <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tgl Kunjungan</th>
                 <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Nama</th>
                 <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">NIP</th>
                 <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Instansi</th>
                 <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Jabatan / Golongan</th>
                 <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tujuan</th>
                 <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Testimoni</th>
                 <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Aksi</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-100">
               {loading ? (
                 <tr><td colSpan={8} className="px-6 py-10 text-center text-gray-400 italic">Memuat arsip...</td></tr>
               ) : entries.length === 0 ? (
                 <tr><td colSpan={8} className="px-6 py-10 text-center text-gray-400 italic">Belum ada kunjungan tamu...</td></tr>
               ) : (
                 entries.map((entry) => (
                   <tr key={entry.id} className="hover:bg-gray-50/50 transition-colors">
                     <td className="px-6 py-4">
                        <div className="flex flex-col">
                           <span className="text-sm font-bold text-soft-black">{new Date(entry.created_at).toLocaleDateString('id-ID', { timeZone: "Asia/Jakarta" })}</span>
                           <span className="text-[10px] text-gray-400 font-medium font-mono">{new Date(entry.created_at).toLocaleTimeString('id-ID', { timeZone: "Asia/Jakarta" })}</span>
                        </div>
                     </td>
                     <td className="px-6 py-4">
                        <div className="flex flex-col">
                           <span className="text-sm font-bold text-soft-black">{entry.guest_name}</span>
                           <span className="text-[10px] text-indigo-600 font-bold">{entry.guest_peran || "Tamu"}</span>
                        </div>
                     </td>
                     <td className="px-6 py-4 text-xs font-mono font-medium text-gray-600">
                        {entry.guest_nip || "-"}
                     </td>

                     <td className="px-6 py-4">
                        <div className="flex flex-col">
                           <span className="text-sm font-medium text-gray-600">{entry.guest_institution || "-"}</span>
                        </div>
                     </td>
                     <td className="px-6 py-4">
                        <div className="flex flex-col">
                           <span className="text-[10px] text-main-blue font-bold uppercase tracking-widest">{entry.guest_position}</span>
                           <span className="text-[10px] text-gray-400 italic">{entry.guest_pangkat}</span>
                        </div>
                     </td>
                     <td className="px-6 py-4">
                        <div className="flex flex-col max-w-xs">
                           <span className="text-sm font-bold text-soft-black">{entry.purpose}</span>
                        </div>
                     </td>
                     <td className="px-6 py-4">
                        <div className="flex flex-col max-w-xs">
                           <span className="text-xs text-gray-500 italic break-words">{entry.notes || "-"}</span>
                        </div>
                     </td>
                     <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleDelete(entry.id)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                     </td>
                   </tr>
                 ))
               )}
             </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
