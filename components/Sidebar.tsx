import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { 
  LayoutDashboard, Users, CalendarCheck, GraduationCap, School, LogOut, X, ChevronRight, ChevronLeft,
  UserCog, HeartHandshake, Tent, BookText, Smile, Link2, FileText, Contact, BookOpen, 
  UserCheck, Database, NotebookPen, Files, Activity, Building, Wallet, Camera, Book,
  Star, FolderOpen, BookOpenCheck, UsersRound, Briefcase, Settings, Award, ListTodo,
  AlertTriangle, ClipboardList, Code, Mail, UserPlus, UserMinus
} from 'lucide-react';
import { ViewState, User } from '../types';

interface SidebarProps {
  currentUser: User | null;
  currentView: ViewState;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export interface MenuItem {
  id: string;
  label: string;
  icon: any;
  roles: string[];
  subItems?: MenuItem[];
}

interface MenuGroup {
  title: string;
  icon: any;
  items: MenuItem[];
}

// 1. Dashboard dipisahkan sebagai item mandiri
const dashboardItem = { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'guru', 'siswa', 'superadmin'] };

// 2. Overview KS dipisahkan sebagai item mandiri (Moved from Utama)
const supervisorItem = { id: 'supervisi', label: 'Supervisi KS', icon: Activity, roles: ['supervisor', 'admin'] };

// 3. Menu Groups (Updated with Submenu)
const menuGroups: MenuGroup[] = [
  {
    title: 'Utama',
    icon: Star,
    items: [
      { id: 'pendahuluan', label: 'Pendahuluan', icon: BookText, roles: ['admin', 'guru', 'supervisor'] },
      { id: 'manual-book', label: 'Buku Panduan', icon: BookOpen, roles: ['admin', 'guru', 'supervisor'] },
      { id: 'mitigasi-bencana', label: 'Mitigasi Bencana', icon: AlertTriangle, roles: ['admin', 'guru'] },
    ]
  },
  {
    title: 'Kepegawaian',
    icon: Contact,
    items: [
      { id: 'data-gtk', label: 'Data GTK', icon: Users, roles: ['admin', 'guru', 'supervisor'] },
      { id: 'administrasi/surat', label: 'Arsip Surat', icon: Mail, roles: ['admin', 'guru', 'supervisor'] },
      { id: 'administrasi/izin-pegawai', label: 'Izin Pegawai', icon: FileText, roles: ['admin', 'guru', 'supervisor'] },
    ]
  },
  {
    title: 'Data Induk',
    icon: FolderOpen,
    items: [
      { id: 'siswa', label: 'Data Siswa', icon: Users, roles: ['admin', 'guru', 'supervisor'] },
      { id: 'ikhtisar-induk', label: 'Ikhtisar Induk', icon: ClipboardList, roles: ['admin', 'supervisor'] },
      { id: 'data-lulusan', label: 'Data Lulusan', icon: Award, roles: ['admin', 'guru', 'supervisor'] },
      {
        id: 'mutasi',
        label: 'Mutasi Siswa',
        icon: UsersRound,
        roles: ['admin', 'supervisor'],
        subItems: [
          { id: 'mutasi-masuk', label: 'Mutasi Masuk', icon: UserPlus, roles: ['admin', 'supervisor'] },
          { id: 'mutasi-keluar', label: 'Mutasi Keluar', icon: UserMinus, roles: ['admin', 'supervisor'] },
        ]
      },
    ]
  },
  {
    title: 'Akademik',
    icon: BookOpenCheck,
    items: [
      { id: 'absensi', label: 'Absensi', icon: CalendarCheck, roles: ['admin', 'guru', 'supervisor'] },
      { id: 'agenda', label: 'Agenda', icon: ListTodo, roles: ['admin', 'guru', 'supervisor', 'siswa'] },
      { id: 'materi', label: 'Materi', icon: BookOpen, roles: ['admin', 'guru', 'supervisor', 'siswa'] },
      { id: 'formatif', label: 'Formatif', icon: ClipboardList, roles: ['admin', 'guru', 'supervisor', 'siswa'] },
      { id: 'sumatif', label: 'Sumatif', icon: FileText, roles: ['admin', 'guru', 'supervisor', 'siswa'] },
      { id: 'nilai', label: 'Nilai & Rapor', icon: GraduationCap, roles: ['admin', 'guru', 'supervisor'] },
      { id: 'sikap', label: 'DPL & 7KAIH', icon: Smile, roles: ['admin', 'guru', 'supervisor'] },
      { id: 'jurnal-pembelajaran', label: 'Jurnal Pembelajaran', icon: NotebookPen, roles: ['admin', 'guru', 'supervisor'] },
      { id: 'laporan-pembelajaran', label: 'Laporan Pembelajaran', icon: FileText, roles: ['admin', 'guru', 'supervisor'] },
      { id: 'dokumentasi-pembelajaran', label: 'Dokumentasi Pembelajaran', icon: Camera, roles: ['admin', 'guru', 'supervisor'] },
    ]
  },
  {
    title: 'Perencanaan',
    icon: BookText,
    items: [
      { id: 'rencana-pembelajaran/rpm', label: 'RPM', icon: FileText, roles: ['admin', 'guru', 'supervisor'] },
      { id: 'rencana-pembelajaran/rpk', label: 'RPK', icon: FileText, roles: ['admin', 'guru', 'supervisor'] },
    ]
  },
  {
    title: 'Kesiswaan',
    icon: UsersRound,
    items: [
      { id: 'monitor-siswa', label: 'Monitoring Siswa', icon: UserCheck, roles: ['admin', 'guru', 'supervisor'] },
      { id: 'konseling', label: 'Konseling & Perilaku', icon: HeartHandshake, roles: ['admin', 'guru', 'supervisor'] },
      { id: 'kegiatan', label: 'Ekstrakurikuler', icon: Tent, roles: ['admin', 'guru', 'supervisor', 'siswa'] },
      { id: 'buku-penghubung', label: 'Buku Penghubung', icon: BookOpen, roles: ['admin', 'guru', 'supervisor'] },
    ]
  },
  {
    title: 'Administrasi',
    icon: Briefcase,
    items: [
      { id: 'administrasi/kelas', label: 'Administrasi Kelas', icon: School, roles: ['admin', 'guru', 'supervisor'] },
      { id: 'administrasi/peminjaman-buku', label: 'Peminjaman Buku', icon: Book, roles: ['admin', 'guru', 'supervisor'] },
      { id: 'administrasi/sarana-prasarana', label: 'Sarana Prasarana', icon: Building, roles: ['admin', 'supervisor'] },
      { id: 'administrasi/dana-bos', label: 'Pengelolaan BOS', icon: Wallet, roles: ['admin', 'supervisor'] },
      { id: 'administrasi/bukti-dukung', label: 'Bukti Dukung', icon: Files, roles: ['admin', 'guru', 'supervisor'] },
    ]
  },
  {
    title: 'Pengaturan',
    icon: Settings,
    items: [
       { id: 'profil', label: 'Profil', icon: UserCog, roles: ['admin', 'guru', 'supervisor'] },
       { id: 'edit-pengembang', label: 'Edit Pengembang', icon: Code, roles: ['superadmin'] },
       { id: 'manajemen-akun', label: 'Manajemen Akun', icon: UserCog, roles: ['admin'] },
       { id: 'tautan-kepegawaian', label: 'Aplikasi Terintegrasi', icon: Link2, roles: ['admin'] },
       { id: 'manajemen-database-pusat', label: 'Manajemen Pusat', icon: Database, roles: ['superadmin'] },
       { id: 'cadangan-pemulihan', label: 'Backup & Restore', icon: Database, roles: ['admin'] },
    ]
  }
];

const Sidebar: React.FC<SidebarProps> = ({ currentUser, currentView, isOpen, onClose, onLogout }) => {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>({});
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [schoolName, setSchoolName] = useState('Dinas Pendidikan');

  useEffect(() => {
    const fetchSchoolName = async () => {
      try {
        const profiles = await apiService.getProfiles();
        if (profiles.school && profiles.school.name && profiles.school.name.trim()) {
          setSchoolName(profiles.school.name);
        } else {
          setSchoolName('Dinas Pendidikan');
        }
      } catch (e) {}
    };
    fetchSchoolName();
  }, []);

  useEffect(() => {
    const handleMinimizeSidebar = () => setIsCollapsed(true);
    window.addEventListener('minimizeSidebar', handleMinimizeSidebar);
    return () => window.removeEventListener('minimizeSidebar', handleMinimizeSidebar);
  }, []);

  useEffect(() => {
    let activeGroup = '';
    let activeSubMenu = '';
    for (const group of menuGroups) {
      let found = false;
      for (const item of group.items) {
        if (item.id === currentView || currentView.startsWith(item.id + '/')) {
          activeGroup = group.title;
          found = true;
          break;
        }
        if (item.subItems) {
          if (item.subItems.some(sub => sub.id === currentView || currentView.startsWith(sub.id + '/'))) {
            activeGroup = group.title;
            activeSubMenu = item.id;
            found = true;
            break;
          }
        }
      }
      if (found) break;
    }

    if (activeGroup) {
      setOpenGroups(prev => ({ ...prev, [activeGroup]: true }));
    }
    if (activeSubMenu) {
      setOpenSubMenus(prev => ({ ...prev, [activeSubMenu]: true }));
    }
  }, [currentView]);

  const toggleGroup = (title: string) => {
      if (isCollapsed) {
          setIsCollapsed(false);
          setOpenGroups({ [title]: true });
      } else {
          setOpenGroups(prev => ({ ...prev, [title]: !prev[title] }));
      }
  };

  const toggleSubMenu = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (isCollapsed) {
      setIsCollapsed(false);
      setOpenSubMenus({ [id]: true });
    } else {
      setOpenSubMenus(prev => ({ ...prev, [id]: !prev[id] }));
    }
  };

  const userEffectiveRole = currentUser?.role === 'Kepala Sekolah' ? 'supervisor' : currentUser?.role;

  const renderMenuItem = (item: MenuItem) => {
    const Icon = item.icon;
    let isVisible = currentUser && userEffectiveRole && item.roles.includes(userEffectiveRole);
    
    if (item.id === 'data-lulusan' && currentUser) {
      if (currentUser.role === 'guru') {
        const position = currentUser.position?.toLowerCase() || '';
        if (!position.includes('kelas 6')) {
          isVisible = false;
        }
      }
    }
    
    if (!isVisible) return null;

    const hasSubItems = item.subItems && item.subItems.length > 0;
    
    if (hasSubItems) {
      const visibleSubItems = item.subItems!.filter(sub => currentUser && userEffectiveRole && sub.roles.includes(userEffectiveRole));
      if (visibleSubItems.length === 0) return null;

      const isSubActive = item.subItems?.some(sub => sub.id === currentView || currentView.startsWith(sub.id + '/'));
      const isSubOpen = openSubMenus[item.id] || false;

      return (
        <div key={item.id} className="w-full flex flex-col">
          <button
            onClick={(e) => toggleSubMenu(item.id, e)}
            title={isCollapsed ? item.label : undefined}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} text-left ${isCollapsed ? 'px-2' : 'px-4'} py-3.5 rounded-2xl transition-all duration-300 group relative overflow-hidden ${
              isSubActive
                ? 'bg-gradient-to-r from-[#5AB2FF]/10 to-[#A0DEFF]/10 text-[#5AB2FF] border border-[#5AB2FF]/30 translate-x-1'
                : 'text-slate-500 hover:bg-[#FFF9D0]/50 hover:text-[#5AB2FF] hover:translate-x-1'
            }`}
          >
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} relative z-10 w-full`}>
              <Icon size={20} className={`${isSubActive ? 'text-[#5AB2FF]' : 'text-slate-400 group-hover:text-[#5AB2FF] transition-colors'} ${isCollapsed ? 'mx-auto' : ''}`} />
              {!isCollapsed && (
                <span className={`font-medium whitespace-nowrap ${isSubActive ? 'text-[#5AB2FF] font-semibold' : 'text-slate-600 group-hover:text-[#5AB2FF]'}`}>{item.label}</span>
              )}
            </div>
            {!isCollapsed && (
              <ChevronRight size={16} className={`text-slate-400 transition-transform duration-300 shrink-0 ${isSubOpen ? 'rotate-90 text-[#5AB2FF]' : ''}`} />
            )}
          </button>
          
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isSubOpen && !isCollapsed ? 'max-h-[500px] opacity-100 mt-1 pl-4 ml-4 border-l-2 border-[#CAF4FF]' : 'max-h-0 opacity-0'}`}>
            <div className="space-y-1 py-1">
              {visibleSubItems.map(sub => {
                const SubIcon = sub.icon;
                const isSubItemActive = sub.id === currentView || currentView.startsWith(sub.id + '/');
                const subPath = `/${sub.id}`;
                
                return (
                  <NavLink
                    key={sub.id}
                    to={subPath}
                    onClick={onClose}
                    className={() => `w-full flex items-center justify-between text-left px-4 py-2.5 rounded-xl transition-all duration-300 group relative overflow-hidden ${
                      isSubItemActive 
                        ? 'bg-[#5AB2FF] text-white shadow-md shadow-[#5AB2FF]/20 translate-x-1' 
                        : 'text-slate-500 hover:bg-[#FFF9D0]/40 hover:text-[#5AB2FF] hover:translate-x-1'
                    }`}
                  >
                    {() => (
                      <>
                        <div className="flex items-center space-x-3 relative z-10 w-full">
                          <SubIcon size={16} className={`${isSubItemActive ? 'text-white' : 'text-slate-400 group-hover:text-[#5AB2FF] transition-colors'}`} />
                          <span className={`text-xs font-medium whitespace-nowrap ${isSubItemActive ? 'text-white' : 'text-slate-600 group-hover:text-[#5AB2FF]'}`}>{sub.label}</span>
                        </div>
                        {isSubItemActive && <ChevronRight size={12} className="text-[#CAF4FF] animate-pulse shrink-0" />}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    const path = item.id === 'dashboard' ? '/dashboard' : `/${item.id}`;

    return (
      <NavLink
        key={item.id}
        to={path}
        onClick={onClose}
        title={isCollapsed ? item.label : undefined}
        className={({ isActive }) => `w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} text-left ${isCollapsed ? 'px-2' : 'px-4'} py-3.5 rounded-2xl transition-all duration-300 group relative overflow-hidden ${
          isActive 
            ? 'bg-gradient-to-r from-[#5AB2FF] to-[#A0DEFF] text-white shadow-lg shadow-[#5AB2FF]/30 translate-x-1' 
            : 'text-slate-500 hover:bg-[#FFF9D0]/50 hover:text-[#5AB2FF] hover:translate-x-1'
        }`}
      >
        {({ isActive }) => (
          <>
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} relative z-10 w-full`}>
              <Icon size={20} className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-[#5AB2FF] transition-colors'} ${isCollapsed ? 'mx-auto' : ''}`} />
              {!isCollapsed && (
                <span className={`font-medium whitespace-nowrap ${isActive ? 'text-white' : 'text-slate-600 group-hover:text-[#5AB2FF]'}`}>{item.label}</span>
              )}
            </div>
            {isActive && !isCollapsed && <ChevronRight size={16} className="text-[#CAF4FF] animate-pulse shrink-0" />}
          </>
        )}
      </NavLink>
    );
  };


  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 z-[999] bg-gray-900/50 backdrop-blur-sm transition-opacity lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Sidebar Container */}
      <div className={`fixed inset-y-0 left-0 z-[1000] ${isCollapsed ? 'w-20' : 'w-72'} bg-white border-r border-[#CAF4FF] text-slate-600 transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto flex flex-col shadow-xl lg:shadow-none ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Header Logo */}
        <div className={`p-8 pb-4 relative ${isCollapsed ? 'px-4' : ''}`}>
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} mb-8`}>
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
              <div className="w-12 h-12 flex items-center justify-center shrink-0">
                <img 
                  src="https://www.image2url.com/r2/default/images/1776528081180-f5356afe-2059-4426-8309-4f5af1b9227e.png" 
                  alt="Logo SAGARA" 
                  className="w-full h-full object-contain animate-float"
                />
              </div>
              {!isCollapsed && (
                <div className="flex flex-col overflow-hidden">
                  <h1 className="text-xl font-extrabold tracking-tight text-slate-800 flex items-center">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5AB2FF] to-[#A0DEFF]">SAGARA</span>
                  </h1>
                  <span 
                    className="font-medium text-slate-400 mt-0.5 block whitespace-nowrap overflow-hidden text-ellipsis"
                    style={{ fontSize: schoolName.length > 20 ? `${Math.max(8, Math.min(12, Math.floor(240 / schoolName.length)))}px` : '12px' }}
                  >
                      {schoolName}
                  </span>
                </div>
              )}
            </div>
            <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-slate-600 transition-colors">
              <X size={24} />
            </button>
          </div>
          
          {/* Desktop Collapse Toggle */}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex absolute top-10 -right-3 bg-white border border-[#CAF4FF] rounded-full p-1 text-slate-400 hover:text-[#5AB2FF] shadow-sm z-50 transition-colors"
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
          
          {/* Render item Dashboard & Overview KS sebagai tombol mandiri */}
          <div className="py-1 space-y-1">
            {renderMenuItem(dashboardItem)}
            {renderMenuItem(supervisorItem)}
          </div>

          {menuGroups.map((group) => {
            const visibleItems = group.items.filter(item => currentUser && userEffectiveRole && item.roles.includes(userEffectiveRole));
            if (visibleItems.length === 0) return null;

            const isGroupOpen = openGroups[group.title] || false;

            return (
              <div key={group.title} className="py-1">
                <button
                  onClick={() => toggleGroup(group.title)}
                  className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-4 py-2 text-left text-xs font-bold text-slate-400 uppercase tracking-wider rounded-lg hover:bg-gray-50 transition-colors`}
                  title={isCollapsed ? group.title : undefined}
                >
                  {isCollapsed ? (
                    <group.icon size={18} className="text-slate-400 hover:text-[#5AB2FF] transition-colors" />
                  ) : (
                    <>
                      <div className="flex items-center space-x-2">
                        <group.icon size={14} className="text-slate-400" />
                        <span>{group.title}</span>
                      </div>
                      <ChevronRight size={14} className={`transform transition-transform duration-200 ${isGroupOpen ? 'rotate-90' : ''}`} />
                    </>
                  )}
                </button>
                
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isGroupOpen ? 'max-h-[1000px]' : 'max-h-0'}`}>
                  <div className="pt-1 space-y-1">
                    {visibleItems.map(item => renderMenuItem(item))}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>
      </div>
    </>
  );
};

export default Sidebar;