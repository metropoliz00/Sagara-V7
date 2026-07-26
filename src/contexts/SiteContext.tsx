import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const defaultContent = {
  hero: {
    title1: "GUGUS 03 MELATI",
    title2: "KECAMATAN JENU",
    description: "Kolaboratif, Inovatif, dan Berkualitas. Menggerakkan komunitas pendidik di Gugus 03 Melati Kecamatan Jenu menuju transformasi digital yang inklusif.",
    logo: "https://www.image2url.com/r2/default/images/1778156189287-e4930eb4-3c36-4ace-8420-ca8908132e66.png"
  },
  stats: [
    { id: 1, label: "Sekolah Imbas", value: 6, suffix: "", color: "text-dark-green" },
    { id: 2, label: "Guru Profesional", value: 120, suffix: "+", color: "text-main-blue" },
    { id: 3, label: "Total Siswa", value: 1500, suffix: "+", color: "text-accent-orange" },
  ],
  profil: {
    title: "Bersama Kita Tumbuh, Menginspirasi Masa Depan",
    quote: "\"Pendidikan bukan sekadar transfer ilmu, melainkan proses membentuk karakter dan peradaban. Di Gugus 03 Melati Kecamatan Jenu, kami berkomitmen menjadi wadah kolaborasi antar sekolah untuk memastikan setiap anak mendapatkan hak pendidikan terbaiknya.\"",
    name: "Sulastri, S.Pd",
    role: "Ketua Gugus 03 Melati Kecamatan Jenu",
    periodeKepengurusan: "2024-2027",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=1000&auto=format&fit=crop"
  },
  footer: {
    description: "Mewujudkan ekosistem pendidikan yang kolaboratif, inovatif, dan berkualitas di Kecamatan Jenu untuk generasi penerus bangsa.",
    address: "Sekretariat Gugus 03 Jalan Raya Mentoso, Desa Mentoso Kec. Jenu, Kabupaten Tuban, Jawa Timur 62352",
    phone: "085604431706",
    email: "gugus3jenu@gmail.com",
    waNumber: "6281234567890",
    social: {
      instagram: "#",
      facebook: "#",
      tiktok: "#",
      youtube: "#"
    }
  },
  schools: [
    { 
      name: "UPT SD Negeri Mentoso", 
      head: "Sulastri, S.Pd", 
      headImg: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=600&auto=format&fit=crop",
      students: 320, 
      teachers: 24, 
      img: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=2000&auto=format&fit=crop",
      visi: "Terwujudnya siswa yang beriman, berprestasi, ramah lingkungan dan berwawasan global.",
      misi: [
        "Meningkatkan keimanan dan ketakwaan melalui kegiatan keagamaan.",
        "Membangun lingkungan sekolah yang bersih, sehat, dan asri.",
        "Meningkatkan kualitas pembelajaran melalui pendekatan inovatif."
      ],
      tujuan: [
        "Menghasilkan lulusan yang cerdas dan berkarakter.",
        "Mampu bersaing di tingkat regional maupun nasional."
      ],
      moto: "Berprestasi dalam Karya, Berpijak pada Budaya Bangsa",
      mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15844.757833075678!2d111.96674681669921!3d-6.790938361099195!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e7706a1d4715501%3A0xeebd2de5c7c2b3e8!2sJenu%2C%20Tuban%20Regency%2C%20East%20Java!5e0!3m2!1sen!2sid!4v1703649514732!5m2!1sen!2sid"
    },
    { 
      name: "UPT SD Negeri Sumurgeneng 1", 
      head: "Umar Faroch, S.Pd.I", 
      headImg: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=600&auto=format&fit=crop",
      students: 280, 
      teachers: 20, 
      img: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=2064&auto=format&fit=crop",
      visi: "Mewujudkan sekolah unggul dalam prestasi dan berkarakter profil pelajar Pancasila.",
      misi: [
        "Melaksanakan pembelajaran yang aktif, kreatif, efektif, dan menyenangkan.",
        "Mengembangkan potensi minat dan bakat siswa di bidang akademik dan non-akademik.",
      ],
      tujuan: [
        "Terwujudnya peningkatan mutu lulusan secara akademis.",
        "Terbentuknya karakter jujur, disiplin, dan bertanggung jawab."
      ],
      moto: "Belajar Cerdas, Bekerja Ikhlas, Berkarya Tuntas",
      mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15844.757833075678!2d111.96674681669921!3d-6.790938361099195!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e7706a1d4715501%3A0xeebd2de5c7c2b3e8!2sJenu%2C%20Tuban%20Regency%2C%20East%20Java!5e0!3m2!1sen!2sid!4v1703649514732!5m2!1sen!2sid"
    },
    { 
      name: "UPT SD Negeri Sumurgeneng 2", 
      head: "Umar Faroch, S.Pd.I", 
      headImg: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=600&auto=format&fit=crop",
      students: 410, 
      teachers: 30, 
      img: "https://images.unsplash.com/photo-1546410531-bea4cada4ff8?q=80&w=2000&auto=format&fit=crop",
      visi: "Generasi unggul yang religius, berbudaya lingkungan, dan mandiri.",
      misi: [
        "Menanamkan nilai-nilai keagamaan dalam kehidupan sehari-hari.",
        "Mengembangkan kemandirian melalui program ekstrakurikuler."
      ],
      tujuan: [
        "Menanamkan karakter peduli lingkungan sejak dini.",
        "Mampu menjadi teladan bagi masyarakat sekitar."
      ],
      moto: "Santun Berperilaku, Unggul Bermutu",
      mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15844.757833075678!2d111.96674681669921!3d-6.790938361099195!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e7706a1d4715501%3A0xeebd2de5c7c2b3e8!2sJenu%2C%20Tuban%20Regency%2C%20East%20Java!5e0!3m2!1sen!2sid!4v1703649514732!5m2!1sen!2sid"
    },
    { 
      name: "UPT SD Negeri Remen 1", 
      head: "Sunarsih, S.Pd", 
      headImg: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=600&auto=format&fit=crop",
      students: 250, 
      teachers: 18, 
      img: "https://images.unsplash.com/photo-1510531704581-5b28709ec68c?q=80&w=2000&auto=format&fit=crop",
      visi: "Pusat keunggulan pendidikan yang berwawasan global dan cinta tanah air.",
      misi: [
        "Meningkatkan rasa nasionalisme melalui pendidikan kewarganegaraan.",
        "Melengkapi sarana prasarana penunjang pembelajaran."
      ],
      tujuan: [
        "Memiliki prestasi tingkat nasional di bidang seni maupun olahraga.",
        "Menciptakan lingkungan yang mendukung penguasaan bahasa dan tata krama."
      ],
      moto: "Mendidik dengan Hati, Meraih Prestasi",
      mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15844.757833075678!2d111.96674681669921!3d-6.790938361099195!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e7706a1d4715501%3A0xeebd2de5c7c2b3e8!2sJenu%2C%20Tuban%20Regency%2C%20East%20Java!5e0!3m2!1sen!2sid!4v1703649514732!5m2!1sen!2sid"
    },
    { 
      name: "UPT SD Negeri Remen 2", 
      head: "Nurhariadji, S.Pd", 
      headImg: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=600&auto=format&fit=crop",
      students: 210, 
      teachers: 15, 
      img: "https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=2070&auto=format&fit=crop",
      visi: "Terwujudnya sekolah yang ramah anak, kreatif, dan mandiri.",
      misi: [
        "Menyelenggarakan pendidikan yang menyenangkan dan bermakna.",
        "Mengembangkan minat baca pada peserta didik."
      ],
      tujuan: [
        "Menumbuhkan kebiasaan positif melalui kegiatan literasi.",
        "Mampu menghadapi tantangan perubahan zaman."
      ],
      moto: "Tiada Hari Tanpa Prestasi",
      mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15844.757833075678!2d111.96674681669921!3d-6.790938361099195!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e7706a1d4715501%3A0xeebd2de5c7c2b3e8!2sJenu%2C%20Tuban%20Regency%2C%20East%20Java!5e0!3m2!1sen!2sid!4v1703649514732!5m2!1sen!2sid"
    },
    { 
      name: "UPT SD Negeri Tasikharjo", 
      head: "Totok, S.Pd.SD", 
      headImg: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=600&auto=format&fit=crop",
      students: 350, 
      teachers: 22, 
      img: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=1000&auto=format&fit=crop",
      visi: "Sekolah berkarakter, berbudaya, dan kompetitif dalam era IPTEK.",
      misi: [
        "Mengintegrasikan teknologi dalam proses pembelajaran.",
        "Melibatkan masyarakat dalam pelestarian budaya lokal."
      ],
      tujuan: [
        "Menjadi sekolah rujukan dalam penerapan kurikulum berbasis teknologi.",
        "Meluluskan siswa yang cakap digital dan berakhlak mulia."
      ],
      moto: "Maju Bersama, Hebat Semua",
      mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15844.757833075678!2d111.96674681669921!3d-6.790938361099195!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e7706a1d4715501%3A0xeebd2de5c7c2b3e8!2sJenu%2C%20Tuban%20Regency%2C%20East%20Java!5e0!3m2!1sen!2sid!4v1703649514732!5m2!1sen!2sid"
    }
  ],
  kkg: {
    sejarah: "Kelompok Kerja Guru (KKG) Gugus 03 Melati Kecamatan Jenu didirikan sebagai wadah pengembangan keprofesian berkelanjutan bagi para pendidik di wilayah Kecamatan Jenu. Sejak berdirinya, KKG ini telah menjadi pusat inovasi dan kolaborasi antar sekolah anggota untuk meningkatkan kualitas pembelajaran.",
    gambarProfil: "https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=2070&auto=format&fit=crop",
    persentaseKolaborasi: "100%",
    tahunDedikasi: "10+",
    anggotaAktif: "120+",
    programDiselesaikan: 13,
    totalWorkshop: 5,
    realisasiProgram: 65,
    partisipasiGuru: 88,
    statistikKkg: [
      { label: "Anggota Aktif", value: 120, suffix: "+" },
      { label: "Program Diselesaikan", value: 13, suffix: "" },
      { label: "Workshop", value: 5, suffix: "" }
    ],
    visi: "Terwujudnya Guru Profesional, Kreatif, and Inovatif dalam Menyelenggarakan Pembelajaran yang Berpusat pada Peserta Didik.",
    misi: [
      "Meningkatkan kompetensi pedagogik dan profesional guru.",
      "Mengembangkan media dan sumber belajar interaktif.",
      "Memfasilitasi pertukaran informasi dan praktik baik antar guru."
    ],
    tujuan: [
      "Menciptakan iklim pembelajaran yang kondusif.",
      "Standarisasi perangkat dan evaluasi pembelajaran.",
      "Memberdayakan guru dalam penelitian tindakan kelas (PTK)."
    ],
    dokumen: [],
    pengumuman: {
      title: "Pengumuman Penting KKG Gugus 03",
      desc: "Seluruh anggota KKG diharapkan hadir dalam rapat koordinasi bulanan yang akan dilaksanakan pada hari Jumat mendatang.",
      isActive: true
    },
    struktur: [
      { role: "Pembina", name: "Drs. H. Abdullah, M.Pd", school: "Dinas Pendidikan" },
      { role: "Ketua KKG", name: "Drs. Budi Santoso, M.Pd", school: "SDN Jenu 1" },
      { role: "Sekretaris", name: "Ahmad Fauzi, S.Pd", school: "SDN Jenu 3" },
      { role: "Bendahara", name: "Rina Kusuma, S.Pd", school: "SDN Jenu 1" },
      { role: "Pemandu Kelas", name: "Siti Rahmawati, S.Pd", school: "SDN Jenu 2" },
      { role: "Pemandu Mapel", name: "Andi Wijaya, S.Pd", school: "SDN Jenu 2" }
    ],
    programs: {
      tahunan: [
        { title: "Penyusunan Perangkat Pembelajaran Terpadu", desc: "Kolaborasi antara guru kelas untuk menyusun RPP, Silabus, dan Modul Ajar yang adaptif terhadap Kurikulum Merdeka.", date: "Juli 2024", status: "Selesai" },
        { title: "Evaluasi Hasil Belajar Gugus", desc: "Pertemuan rutin untuk mengevaluasi hasil capaian belajar siswa antar sekolah di Gugus 03 Melati Kecamatan Jenu.", date: "Desember 2024", status: "Berjalan" }
      ],
      workshop: [
        { title: "Workshop Pemanfaatan AI dalam Kelas", desc: "Implementasi teknologi AI untuk pembuatan media ajar dan otomatisasi penilaian.", date: "Agustus 2024", status: "Selesai" },
        { title: "Pelatihan Pedagogik Modern", desc: "Meningkatkan kemampuan problem solving dan critical thinking guru.", date: "Oktober 2024", status: "Berjalan" }
      ],
      supervisi: [
        { title: "Kunjungan Kelas Silang", desc: "Supervisi akademik dengan meninjau cara mengajar guru di sekolah lain dalam satu gugus.", date: "November 2024", status: "Terjadwal" },
        { title: "Review Instrumen Penilaian", desc: "Standarisasi instrumen per-mata pelajaran.", date: "Februari 2025", status: "Terjadwal" }
      ],
      media: [
        { title: "Lomba Pembuatan Video Pembelajaran", desc: "Kompetisi internal guru gugus untuk memproduksi video ajar terbaik.", date: "Maret 2025", status: "Menunggu" },
        { title: "Bimtek Alat Peraga Edukatif (APE)", desc: "Pembuatan APE dari bahan daur ulang dan aplikasinya.", date: "Mei 2025", status: "Menunggu" }
      ]
    }
  },
  news: [
    { title: "Penerapan Kurikulum Merdeka di Jenu", date: "12 Mar 2024", author: "Humas Gugus", img: "https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=2070&auto=format&fit=crop", cat: "Berita" },
    { title: "Jadwal Workshop Peningkatan Kompetensi Guru", date: "10 Mar 2024", author: "Admin", img: "https://images.unsplash.com/photo-1427504494785-3b9ca2044fcc?q=80&w=2000&auto=format&fit=crop", cat: "Pengumuman" },
    { title: "Pentingnya Pendidikan Karakter Siswa", date: "08 Mar 2024", author: "Budi S.", img: "https://images.unsplash.com/photo-1546410531-bea4cada4ff8?q=80&w=2000&auto=format&fit=crop", cat: "Artikel" },
  ],
  gallery: [
    { type: 'image', size: 'large', url: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=2070&auto=format&fit=crop' },
    { type: 'image', size: 'small', url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=2022&auto=format&fit=crop' },
    { type: 'image', size: 'small', url: 'https://images.unsplash.com/photo-1546410531-bea4cada4ff8?q=80&w=2000&auto=format&fit=crop' },
    { type: 'video', size: 'medium', url: 'https://images.unsplash.com/photo-1510531704581-5b28709ec68c?q=80&w=2000&auto=format&fit=crop' },
    { type: 'image', size: 'medium', url: 'https://images.unsplash.com/photo-1427504494785-3b9ca2044fcc?q=80&w=2000&auto=format&fit=crop' },
  ],
  gugus: {
    sejarah: "Gugus 03 Melati Kecamatan Jenu didirikan sebagai pusat koordinasi administratif dan pengembangan kualitas antara sekolah-sekolah dasar di wilayah Jenu utara. Organisasi ini telah menjadi pilar penggerak dalam menyelaraskan kebijakan pendidikan pusat dengan implementasi di tingkat sekolah.",
    visi: "Terwujudnya Sinergi Antar Sekolah dalam Menciptakan Lingkungan Belajar yang Berkualitas dan Mandiri.",
    misi: [
      "Mengordinasi pelaksanaan program pendidikan di tingkat gugus.",
      "Membangun manajemen sekolah yang transparan dan akuntabel.",
      "Meningkatkan pemberdayaan sumber daya sekolah anggota."
    ],
    tujuan: [
      "Mewujudkan pemerataan kualitas pendidikan antar sekolah anggota.",
      "Optimalisasi sarana dan prasarana penunjang kegiatan belajar.",
      "Meningkatkan peran serta masyarakat dalam pendanaan pendidikan."
    ],
    tahunBerdiri: "2010",
    sekolahInti: "UPT SDN Mentoso",
    wilayahKerja: "Kec. Jenu Utara",
    struktur: [
      { role: "Ketua Gugus", name: "Sulastri, S.Pd", school: "UPT SDN Mentoso" },
      { role: "Sekretaris Gugus", name: "Sunarsih, S.Pd", school: "UPT SDN Remen 1" },
      { role: "Bendahara Gugus", name: "Nurhariadji, S.Pd", school: "UPT SDN Remen 2" }
    ],
    programs: [
      { title: "Rapat Koordinasi Kepala Sekolah Gugus", desc: "Pertemuan bulanan kepala sekolah untuk sinkronisasi kebijakan.", date: "Setiap Awal Bulan" },
      { title: "Monitoring dan Evaluasi Kinerja Sekolah", desc: "Pelaporan dan penjaminan mutu rutin.", date: "Tiap Semester" },
      { title: "Pembinaan Manajerial", desc: "Pelatihan administrasi sekolah bagi staf dan pimpinan.", date: "Agustus 2024" }
    ],
    dokumen: []
  },
  agenda: [
    { title: 'Rapat Persiapan Ujian', time: 'Kamis, 09:00 WIB', location: 'Ruang Guru Utama' },
    { title: 'Pertemuan KKG Gugus 03', time: 'Jumat, 13:00 WIB', location: 'SDN Mentoso' },
    { title: 'Batas Upload Nilai Akhir', time: 'Senin Depan', location: 'Daring (Sistem)' },
  ],
  announcement: {
    title: "Pengumuman Penting",
    subtitle: "Pendaftaran Peserta Didik Baru Telah Dibuka!",
    desc: "Mari daftarkan putra/putri Anda di sekolah-sekolah unggulan Gugus 03 Melati Kecamatan Jenu. Kuota terbatas!"
  },
  activeMenus: {
    overview: true,
    profil: true,
    jadwal: true,
    materi: true,
    notulen: true,
    pelatihan: true,
    forum: true,
    sharing: true,
    upload_karya: true,
    gugus: true,
    kkg: true,
    berita: true,
    galeri: true,
    download: true
  }
};

export type SiteContent = typeof defaultContent;

const recursivelyReplaceGugus3 = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') {
    return obj.replace(/Gugus 3(?!\d)/gi, (match) => {
      if (match.toUpperCase() === match) return 'GUGUS 03';
      if (match.toLowerCase() === match) return 'gugus 03';
      return 'Gugus 03';
    });
  }
  if (Array.isArray(obj)) {
    return obj.map(item => recursivelyReplaceGugus3(item));
  }
  if (typeof obj === 'object') {
    const newObj: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        newObj[key] = recursivelyReplaceGugus3(obj[key]);
      }
    }
    return newObj;
  }
  return obj;
};

const mergeContent = (base: any, incomingRaw: any) => {
  if (!incomingRaw) return base;
  const incoming = recursivelyReplaceGugus3(incomingRaw);
  return {
    ...base,
    ...incoming,
    hero: base.hero && incoming.hero ? { ...base.hero, ...incoming.hero } : (incoming.hero || base.hero),
    profil: base.profil && incoming.profil ? { ...base.profil, ...incoming.profil } : (incoming.profil || base.profil),
    footer: base.footer && incoming.footer ? { ...base.footer, ...incoming.footer } : (incoming.footer || base.footer),
    kkg: base.kkg && incoming.kkg ? { ...base.kkg, ...incoming.kkg } : (incoming.kkg || base.kkg),
    gugus: base.gugus && incoming.gugus ? { ...base.gugus, ...incoming.gugus } : (incoming.gugus || base.gugus),
    announcement: base.announcement && incoming.announcement ? { ...base.announcement, ...incoming.announcement } : (incoming.announcement || base.announcement),
    activeMenus: base.activeMenus && incoming.activeMenus ? { ...base.activeMenus, ...incoming.activeMenus } : (incoming.activeMenus || base.activeMenus),
  };
};

const getInitialContent = (): SiteContent => {
  if (typeof window !== 'undefined') {
    try {
      const local = localStorage.getItem('siteContent');
      if (local) {
        const parsed = JSON.parse(local);
        return mergeContent(defaultContent, parsed);
      }
    } catch (e) {
      console.warn("Failed to load initial site content from localStorage:", e);
    }
  }
  return defaultContent;
};

interface SiteContextType {
  content: SiteContent;
  updateContent: (newContent: Partial<SiteContent>) => Promise<void>;
  isLoading: boolean;
  saveMessage: string | null;
}

const SiteContext = createContext<SiteContextType>({
  content: defaultContent,
  updateContent: async () => {},
  isLoading: true,
  saveMessage: null,
});

export const useSiteContent = () => useContext(SiteContext);

export const SiteProvider = ({ children }: { children: React.ReactNode }) => {
  const [content, setContent] = useState<SiteContent>(getInitialContent);
  const [isLoading, setIsLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      if (supabase) {
        const { data, error } = await supabase.from('site_settings').select('content').eq('id', 1).single();
        if (data && data.content) {
          const merged = mergeContent(defaultContent, data.content);
          setContent(merged);
          try {
            localStorage.setItem('siteContent', JSON.stringify(merged));
          } catch (storageError) {
            console.warn("Failed to store siteContent in localStorage (quota exceeded):", storageError);
          }
        }
      }
    } catch (e) {
      console.error("Backend load error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const updateContent = async (newContent: Partial<SiteContent>) => {
    const updated = { ...content, ...newContent };
    setContent(updated);
    try {
      localStorage.setItem('siteContent', JSON.stringify(updated));
    } catch (storageError) {
      console.warn("Failed to store siteContent in localStorage (quota exceeded):", storageError);
    }
    setSaveMessage("Menyimpan...");
    
    try {
      if (supabase) {
        const { error } = await supabase.from('site_settings').upsert({ id: 1, content: updated });
        if (!error) {
          setSaveMessage("Berhasil tersimpan!");
        } else {
          console.error(error);
          setSaveMessage("Disimpan ke browser (Backend error).");
        }
      } else {
        setSaveMessage("Disimpan ke browser (Cek koneksi).");
      }
    } catch (e) {
      console.error(e);
      setSaveMessage("Disimpan ke browser (Cek koneksi).");
    }

    setTimeout(() => {
      setSaveMessage(null);
    }, 3000);
  };

  return (
    <SiteContext.Provider value={{ content, updateContent, isLoading, saveMessage }}>
      {children}
    </SiteContext.Provider>
  );
};
