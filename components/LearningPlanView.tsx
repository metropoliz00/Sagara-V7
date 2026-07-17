import React, { useState, useEffect } from 'react';
import html2pdf from 'html2pdf.js';
import { 
  Plus, Edit2, Trash2, Printer, CheckSquare, Square, 
  BookText, History, Settings, FilePlus, ChevronRight, Save, Undo, Eye, BookOpen, AlertCircle, Sparkles,
  Clock, RefreshCw
} from 'lucide-react';
import { User, SchoolProfileData, LearningPlan, Attachment } from '../types';
import { apiService } from '../services/apiService';
import { useModal } from '../context/ModalContext';
import { AttachmentEditor } from './AttachmentEditor';
import { parseRichText, markdownToHtml, groupBlocks } from '../utils/textParser';

interface LearningPlanViewProps {
  classId: string;
  isReadOnly: boolean;
  schoolProfile: SchoolProfileData | null;
  teacherProfile: any | null;
  currentUser: User | null;
  onShowNotification: (message: string, type: 'success' | 'error' | 'warning') => void;
  onSyncReport?: (report: any) => Promise<void>;
}


// Checkbox choices for Dimensi Profil Lulusan
const DIMENSIONS = [
  'Keimanan dan Ketakwaan terhadap Tuhan YME',
  'Kewargaan',
  'Penalaran Kritis',
  'Kreativitas',
  'Kolaborasi',
  'Kemandirian',
  'Kesehatan',
  'Komunikasi'
];

// CP templates matching BSKA 046 2025
const CP_TEMPLATES: Record<string, Record<string, string>> = {
  'Fase A': {
    'PAI': '1.1. Sejarah: Memahami kisah beberapa tokoh Kepercayaan Terhadap Tuhan Yang Maha Esa. 1.2. Keagungan Tuhan: Memahami dan mensyukuri keberadaan diri sendiri dan alam sekitar sebagai karunia ciptaan Tuhan. 1.3. Budi Pekerti: Memahami makna budi pekerti dan menerapkannya dalam berbagai aspek kehidupan. 1.4. Martabat Spiritual: Memahami tempat kegiatan ritual Kepercayaan Terhadap Tuhan Yang Maha Esa dan mengikuti ritualnya. 1.5. Larangan dan Kewajiban: Mengenal larangan dan kewajiban sederhana dalam Kepercayaan Terhadap Tuhan Yang Maha Esa di lingkungan keluarga dan sekolah.',
    'Pendidikan Pancasila': 'Mengenal bendera negara, lagu kebangsaan, simbol dan sila-sila Pancasila dalam lambang negara Garuda Pancasila; menerapkan nilai-nilai Pancasila di keluarga; mengenal aturan di lingkungan keluarga; mengidentifikasi dan menghargai identitas diri sesuai jenis kelamin, hobi, dan agama; menceritakan dan mempraktikkan kerja sama menjaga lingkungan sekitar.',
    'Bahasa Indonesia': 'Menyimak: Memahami informasi dari teks nonsastra dan pesan teks sastra lisan. Membaca: Membaca kata-kata sederhana dengan fasih dan memahami isi bacaan tentang diri dan lingkungan. Berbicara: Merespons instruksi, bertanya dan menjawab, serta menceritakan kembali isi teks narasi. Menulis: Menulis permulaan dengan benar dan menulis teks rekon sederhana tentang pengalaman diri.',
    'Matematika': 'Bilangan: Mengenal bilangan cacah sampai 100, nilai tempat, komposisi dan dekomposisi, serta pecahan setengah dan seperempat. Aljabar: Memahami simbol "=" dalam penjumlahan/pengurangan sampai 20. Pengukuran: Membandingkan panjang, berat, dan durasi waktu menggunakan satuan tidak baku. Geometri: Mengenal bangun datar dan bangun ruang sederhana serta menentukan posisi benda.',
    'IPAS': 'Mengenal bagian tubuh manusia dan panca indra; mengenal siklus hidup makhluk hidup secara sederhana; mengidentifikasi wujud benda; mengenal bentuk energi dan perubahannya dalam kehidupan sehari-hari; mengenal letak rumah dan sekolah, serta identitas diri dan keluarga.',
    'Seni dan Budaya': 'Mengenali unsur-unsur rupa, nada, dan irama dalam benda di sekitar; melakukan umpan balik terhadap karya seni diri sendiri; mengeksplorasi alat dan bahan seni; menciptakan karya seni sederhana (rupa, musik, tari, atau teater) berdasarkan pengalaman sehari-hari.',
    'PJOK': 'Mempraktikkan keterampilan gerak fundamental dan menerapkannya dalam berbagai situasi gerak; mengeksplorasi strategi dan konsep gerak; menaati peraturan fair play; menerapkan strategi kolaborasi; berpartisipasi dalam aktivitas jasmani; mengenali gaya hidup aktif dan makanan bergizi seimbang.',
    'Bahasa Jawa': 'Melafalkan bunyi huruf, suku kata, dan kata dalam ragam ngoko dan krama; memahami pesan lisan dari dongeng dan tembang dolanan; berbicara santun sesuai unggah-ungguh basa; menulis Latin permulaan (huruf tegak bersambung sederhana).',
    'Koding dan Kecerdasan Artifisial': 'Mengenal konsep dasar berpikir komputasional melalui kegiatan unplugged; mengenal perangkat teknologi digital di sekitar; memahami etika dasar penggunaan teknologi secara aman.'
  },
  'Fase B': {
    'PAI': '2.1. Sejarah: Memahami keteladanan sikap tokoh Kepercayaan Terhadap Tuhan Yang Maha Esa di daerahnya. 2.2. Keagungan Tuhan: Memahami rasa syukur atas keagungan Tuhan Yang Maha Esa dengan cara manembah. 2.3. Budi Pekerti: Memahami sikap jujur dan tolong menolong dalam berinteraksi dengan keluarga dan lingkungan sekitar. 2.4. Martabat Spiritual: Memahami rasa syukur atas anugerah Tuhan Yang Maha Esa dengan melaksanakan kegiatan ritual Kepercayaan Terhadap Tuhan Yang Maha Esa dan menerapkan sikap budi pekerti luhur. 2.5. Larangan dan Kewajiban: Memahami sikap patuh terhadap bentuk-bentuk larangan dan kewajiban dalam ajaran Kepercayaan Terhadap Tuhan Yang Maha Esa.',
    'Pendidikan Pancasila': 'Mengidentifikasi makna sila-sila Pancasila; mengenal karakter para perumus Pancasila; mengidentifikasi aturan di sekolah dan lingkungan tempat tinggal; menghargai identitas budaya; menunjukkan perilaku kerja sama dalam berbagai bentuk keberagaman suku bangsa dan sosial yang terikat persatuan NKRI.',
    'Bahasa Indonesia': 'Menyimak: Memahami ide pokok informasi teks nonsastra dan sastra lisan. Membaca: Membaca kata-kata baru dengan fasih dan memahami ide pokok/pendukung teks informatif. Berbicara: Menyampaikan pendapat dengan santun dan menceritakan kembali informasi berbagai tipe teks. Menulis: Menulis berbagai tipe teks sederhana dengan rangkaian kalimat beragam dan kosakata baru.',
    'Matematika': 'Bilangan: Mengenal bilangan cacah sampai 10.000, nilai tempat, operasi hitung sampai 1.000 (kali/bagi sampai 100), dan pecahan senilai. Aljabar: Menemukan nilai yang belum diketahui dalam kalimat matematika; pola gambar dan pola bilangan. Pengukuran: Mengukur panjang dan berat dengan satuan baku (cm, m, g, kg) serta estimasi luas dan volume. Geometri: Mendeskripsikan ciri bangun datar dan melakukan komposisi/dekomposisi.',
    'IPAS': 'Memahami fungsi pancaindra; menganalisis siklus hidup makhluk hidup; pelestarian SDA dan mitigasi perubahan iklim; memahami wujud zat dan perubahan bentuk energi; mengenal gaya; interaksi sosial di sekitar; letak geografis kabupaten/kota; sejarah masyarakat lokal; mengelola keuangan secara bijak.',
    'Seni dan Budaya': 'Mengidentifikasi variasi pola irama dan nada; melakukan umpan balik praktik bermusik dengan istilah musik; menirukan pola irama dan melodi; menggunakan alat musik ritmis atau melodis; mengidentifikasi unsur utama tari sesuai level gerak; mengenal teknik dasar akting (mimesis); menciptakan karya seni berdasarkan pengalaman nyata.',
    'PJOK': 'Menghaluskan keterampilan gerak fundamental; menyesuaikan strategi gerak untuk capaian tertentu; memperagakan berbagai konsep gerak dalam rangkaian gerak; memecahkan masalah gerak; menerapkan peraturan fair play; berpartisipasi positif dalam kelompok/tim; mengenali risiko kesehatan gaya hidup pasif.',
    'Bahasa Jawa': 'Memahami ide pokok pesan lisan dan teks narasi dongeng; memahami makna geguritan (puisi jawa) dan basa rinengga; berbicara dengan pilihan kata santun sesuai unggah-ungguh; menulis teks narasi/deskripsi sederhana dan terampil menggunakan Aksara Jawa Legena.',
    'Bahasa Inggris': 'Memahami dan merespons teks lisan atau teks multimodal sederhana tentang kehidupan sehari-hari baik verbal atau non-verbal; memahami teks tulis pendek sederhana; mengomunikasikan gagasan tentang topik sehari-hari dalam teks tulis pendek.',
    'Koding dan Kecerdasan Artifisial': 'Menerapkan berpikir komputasional dalam pemecahan masalah sederhana; memahami literasi digital tingkat dasar; menyadari manfaat dan dampak awal teknologi kecerdasan artifisial bagi manusia.'
  },
  'Fase C': {
    'PAI': '3.1. Sejarah: Memahami keragaman Kepercayaan Terhadap Tuhan Yang Maha Esa, dan kearifan lokal di daerahnya. 3.2. Keagungan Tuhan: Memahami rasa bersyukur kepada Tuhan Yang Maha Esa dengan mengikuti kegiatan seni tradisi nusantara di lingkungan sekolah. 3.3. Budi Pekerti: Memahami sikap dan perilaku budi pekerti luhur dalam berinteraksi dengan keluarga, masyarakat, serta kehidupan berbangsa dan bernegara. 3.4. Martabat Spiritual: Memahami adat, kesenian dan ritual Kepercayaan Terhadap Tuhan Yang Maha Esa serta kearifan lokal di daerahnya. 3.5. Larangan dan Kewajiban: Memahami manfaat mematuhi kewajiban dan tidak melanggar aturan dalam ajaran Kepercayaan Terhadap Tuhan Yang Maha Esa di lingkungan keluarga, sekolah, dan lingkungan sekitar.',
    'Pendidikan Pancasila': 'Memahami kronologi sejarah kelahiran Pancasila; meneladani sikap para perumus Pancasila; mengidentifikasi norma, hak, dan kewajiban; melestarikan keberagaman budaya sesuai semboyan Bhinneka Tunggal Ika; mengenal wilayah NKRI dalam konteks kabupaten/kota/provinsi.',
    'Bahasa Indonesia': 'Menyimak: Menganalisis informasi dari teks nonsastra dan sastra lisan. Membaca: Membaca kata-kata dengan berbagai pola kombinasi huruf secara fasih dan menganalisis nilai-nilai teks. Berbicara: Mempresentasikan gagasan secara efektif dan menyampaikan perasaan berdasarkan fakta/imajinasi. Menulis: Menulis berbagai tipe teks dengan rangkaian kalimat kompleks dan kosakata baru yang variatif.',
    'Matematika': 'Bilangan: Memahami bilangan cacah sampai 1.000.000, KPK dan FPB, serta operasi pecahan dan desimal. Aljabar: Mengidentifikasi pola bilangan membesar dan mengecil; bernalar secara proporsional. Pengukuran: Menentukan keliling dan luas berbagai bentuk bangun datar; mengukur besar sudut. Geometri: Mengkonstruksi dan mengurai bangun ruang serta visualisasi spasial (lokasi berpetak).',
    'IPAS': 'Merefleksikan sistem organ tubuh manusia; hubungan biotik dan abiotik dalam ekosistem; fenomena gelombang bunyi dan cahaya; menghasilkan upaya penghematan dan pemanfaatan energi alternatif; sistem tata surya; letak geografis Indonesia dan kebhinekaan nasional; mengaplikasikan kegiatan ekonomi masyarakat.',
    'Seni dan Budaya': 'Menerapkan unsur-unsur musik (nada, irama, melodi); mengeksplorasi variasi pola irama, tempo dan melodi; menggunakan notasi musik dan teknik dasar; menciptakan pola irama menggunakan anggota tubuh atau alat musik ritmis/melodis; merangkai gerak tari tradisi/kreasi; melakukan permainan peran improvisasi dan elaborasi karakter.',
    'PJOK': 'Menyesuaikan keterampilan gerak melintasi berbagai situasi; mentransfer strategi gerak; menginvestigasi konsep gerak; menguji efektivitas strategi gerak; merancang peraturan alternatif/modifikasi; menjalankan berbagai peran untuk keberhasilan tim; menjelaskan pengaruh aktivitas fisik teratur bagi kesehatan.',
    'Bahasa Jawa': 'Menganalisis teks informatif, fiksi, dan tembang macapat (Pucung, Gambuh, Kinanthi); menganalisis basa rinengga (paribasan, saloka); menyampaikan informasi secara lisan dengan bahasa krama yang fasih; menulis teks prosa/puisi secara kreatif; terampil menggunakan Aksara Jawa pasangan.',
    'Bahasa Inggris': 'Memahami alur informasi teks secara keseluruhan; merespons teks lisan atau multimodal tentang topik sehari-hari; memahami gagasan utama dan informasi rinci dari beragam teks pendek; mengomunikasikan ide dan pengalaman melalui teks tulis sederhana.',
    'Koding dan Kecerdasan Artifisial': 'Berpikir Komputasional: Menerapkan pemecahan masalah kompleks secara sistematis. Literasi Digital: Memahami sistem komputer pradasar, keamanan komunikasi daring, dan diseminasi konten. Literasi dan Etika KA: Memahami konsep, manfaat, dampak, dan etika KA. Pemanfaatan KA: Menyimulasikan kerja KA dalam mengenali pola dan klasifikasi.'
  }
};

const getPhaseFromGrade = (gradeValue: string): string => {
  const normalized = gradeValue.toUpperCase();
  if (normalized.includes('I') || normalized.includes('II')) {
    if (normalized.includes('III') || normalized.includes('IV') || normalized.includes('VI') || normalized.includes('VII')) {
      // B/C
    } else {
      if (normalized.match(/\bI\b/) || normalized.match(/\bII\b/)) return 'Fase A';
    }
  }
  if (normalized.includes('III') || normalized.includes('IV')) return 'Fase B';
  if (normalized.includes('V') || normalized.includes('VI')) return 'Fase C';
  if (normalized.includes('KELAS 1') || normalized.includes('KELAS 2')) return 'Fase A';
  if (normalized.includes('KELAS 3') || normalized.includes('KELAS 4')) return 'Fase B';
  if (normalized.includes('KELAS 5') || normalized.includes('KELAS 6')) return 'Fase C';

  return 'Fase C';
};

// Sintaks/Phases template per model
const MODEL_SINTAKS_TEMPLATES: Record<string, { phase: string; description: string }[]> = {
  'Problem Based Learning (PBL)': [
    { phase: 'A. Orientasi pada masalah', description: '[Memahami] 1. Murid mengamati gambar, video, teks, atau fenomena nyata yang disajikan guru melalui media digital di lingkungan belajar secara seksama.\n2. Murid mengidentifikasi informasi penting yang ditemukan pada permasalahan secara kritis menggunakan strategi pembelajaran yang aktif.\n3. Murid menyampaikan tanggapan awal terhadap masalah dengan pendekatan pembelajaran relevan seperti saintifik atau diferensiasi.' },
    { phase: 'B. Mengorganisasi peserta didik', description: '1. Murid membentuk kelompok belajar secara kolaboratif sesuai bimbingan guru demi terlaksananya strategi diferensiasi proses.\n2. Murid membagi peran dan tugas tanggung jawab spesifik dalam kelompok.\n3. Murid merumuskan pertanyaan penyelidikan yang akan diselidiki melalui metode diskusi kelompok.' },
    { phase: 'C. Membimbing penyelidikan', description: '[Mengaplikasikan] 1. Murid mencari informasi pendukung dari berbagai sumber belajar digital dan literatur yang relevan.\n2. Murid melakukan observasi, eksperimen sederhana, atau pengumpulan data yang diperlukan di lingkungan sekitar.\n3. Murid mencatat dan mengorganisasikan hasil temuan untuk dianalisis bersama kelompok menggunakan metode kolaboratif.' },
    { phase: 'D. Mengembangkan dan menyajikan hasil karya', description: '[Mengaplikasikan] 1. Murid mendiskusikan alternatif solusi berdasarkan data dan temuan yang diperoleh.\n2. Murid menyusun laporan, poster, atau media presentasi kreatif di Canva atau platform digital lainnya.\n3. Murid mempresentasikan hasil pemecahan masalah materi pelajaran secara berkelompok di depan kelas dengan penuh percaya diri.' },
    { phase: 'E. Menganalisis dan mengevaluasi proses pemecahan masalah', description: '[Merefleksi] 1. Murid memberikan tanggapan apresiatif dan masukan konstruktif terhadap presentasi kelompok lain.\n2. Murid bersama guru mengevaluasi kelebihan dan kekurangan solusi pemecahan masalah yang dihasilkan.\n3. Murid menuliskan refleksi pembelajaran mandiri mengenai konsep esensial yang berhasil dikuasai.' }
  ],
  'Project Based Learning (PjBL)': [
    { phase: 'A. Pertanyaan mendasar', description: '[Memahami] 1. Murid mengamati fenomena atau permasalahan kontekstual yang diberikan guru lewat tayangan media interaktif.\n2. Murid mengidentifikasi masalah nyata yang menantang untuk dijadikan proyek pembelajaran yang bermakna.\n3. Murid mengajukan pertanyaan terkait rancangan proyek yang akan dibuat sesuai pendekatan penemuan.' },
    { phase: 'B. Mendesain perencanaan proyek', description: '[Mengaplikasikan] 1. Murid menentukan target dan tujuan proyek yang akan dicapai secara terukur.\n2. Murid menyusun rencana langkah-langkah pengerjaan proyek secara sistematis sesuai strategi aktif.\n3. Murid menentukan alat, bahan, and media digital yang diperlukan di lingkungan kelas.' },
    { phase: 'C. Menyusun jadwal', description: '[Mengaplikasikan] 1. Murid membagi tugas dan peran anggota kelompok secara adil sesuai minatnya.\n2. Murid menentukan alokasi waktu pelaksanaan setiap tahapan pengerjaan proyek.\n3. Murid menyepakati target penyelesaian (milestones) proyek bersama guru.' },
    { phase: 'D. Memonitor kemajuan proyek', description: '[Mengaplikasikan] 1. Murid melaksanakan pengerjaan proyek secara aktif sesuai rencana yang telah disusun bersama kelompok.\n2. Murid mencatat perkembangan pengerjaan proyek secara berkala.\n3. Murid mendiskusikan dan memperbaiki hambatan yang ditemukan selama proses pengerjaan dengan bimbingan guru.' },
    { phase: 'E. Menguji hasil', description: '[Mengaplikasikan] 1. Murid memeriksa kualitas dan kesesuaian produk akhir yang dihasilkan.\n2. Murid menguji fungsi atau manfaat dari produk yang dibuat sesuai tujuan awal proyek.\n3. Murid melakukan revisi atau perbaikan produk berdasarkan hasil pengujian awal.' },
    { phase: 'F. Evaluasi pengalaman', description: '[Merefleksi] 1. Murid mempresentasikan hasil proyek dan menunjukkan unjuk karya di depan kelas secara komunikatif.\n2. Murid menerima masukan berharga serta umpan balik dari guru dan teman.\n3. Murid merefleksikan seluruh pengalaman belajar yang diperoleh selama merencanakan dan menyelesaikan proyek.' }
  ],
  'Discovery Learning': [
    { phase: 'A. Stimulation', description: '[Memahami] 1. Murid mengamati media gambar, video, atau alat peraga yang disajikan guru secara menarik.\n2. Murid mencatat hal-hal penting atau fenomena unik yang menarik perhatian panca indra.\n3. Murid menghubungkan pengamatan awal tersebut dengan pengalaman belajar mereka sebelumnya.' },
    { phase: 'B. Problem Statement', description: '[Memahami] 1. Murid mengajukan berbagai pertanyaan kritis berdasarkan hasil pengamatan fenomena.\n2. Murid mengidentifikasi masalah utama yang akan dikaji lebih dalam.\n3. Murid merumuskan permasalahan tersebut secara sederhana dalam bentuk pertanyaan penelitian.' },
    { phase: 'C. Data Collection', description: '[Mengaplikasikan] 1. Murid mencari informasi terpercaya dari buku, internet, atau sumber belajar digital lainnya.\n2. Murid melakukan pengamatan atau percobaan sederhana di lingkungan belajar sekolah.\n3. Murid mengumpulkan dan mendata informasi yang relevan untuk menjawab rumusan masalah.' },
    { phase: 'D. Data Processing', description: '[Mengaplikasikan] 1. Murid mengelompokkan dan mengklasifikasikan data yang telah diperoleh secara logis.\n2. Murid membandingkan kebenaran informasi yang didapat dari berbagai sumber rujukan.\n3. Murid mendiskusikan hasil analisis temuan data bersama kelompok kecil.' },
    { phase: 'E. Verification', description: '[Mengaplikasikan] 1. Murid memeriksa kembali kebenaran dan kevalidan data yang telah diperoleh.\n2. Murid membandingkan hasil temuan data kelompok mereka dengan teori atau konsep ilmiah terkait.\n3. Murid memperbaiki draf hasil analisis atau simpulan apabila ditemukan ketidaksesuaian.' },
    { phase: 'F. Generalization', description: '[Merefleksi] 1. Murid menyusun kesimpulan akhir berdasarkan data yang telah dianalisis dan dibuktikan.\n2. Murid menyampaikan/mempresentasikan hasil penemuan baru kepada teman-teman kelas.\n3. Murid menuliskan konsep esensial yang berhasil ditemukan sebagai pemahaman bermakna.' }
  ],
  'Inquiry Learning': [
    { phase: 'A. Orientasi', description: '[Memahami] 1. Murid mengamati fenomena alam, sosial, atau teks yang disajikan sebagai stimulus oleh guru.\n2. Murid mengidentifikasi fakta-fakta penting yang ditemukan dari pengamatan tersebut.\n3. Murid menyampaikan pendapat atau gagasan awal mengenai fenomena menarik tersebut.' },
    { phase: 'B. Merumuskan masalah', description: '[Memahami] 1. Murid menentukan fokus atau ruang lingkup masalah yang akan diselidiki.\n2. Murid menyusun pertanyaan penelitian sederhana yang menuntut pembuktian ilmiah.\n3. Murid mendiskusikan kriteria masalah tersebut bersama teman kelompok.' },
    { phase: 'C. Merumuskan hipotesis', description: '[Mengaplikasikan] 1. Murid mengemukakan dugaan atau jawaban sementara terhadap masalah secara logis.\n2. Murid menuliskan argumen atau alasan rasional yang mendukung dugaan tersebut.\n3. Murid menyepakati rumusan hipotesis kelompok yang siap diuji.' },
    { phase: 'D. Mengumpulkan data', description: '[Mengaplikasikan] 1. Murid melakukan observasi terarah atau eksperimen sederhana secara cermat.\n2. Murid mencari informasi pendukung tambahan dari berbagai sumber rujukan terpercaya.\n3. Murid mencatat seluruh data dan fakta empiris yang diperoleh dari proses penyelidikan.' },
    { phase: 'E. Menguji hipotesis', description: '[Mengaplikasikan] 1. Murid membandingkan temuan data di lapangan dengan hipotesis yang telah dibuat sebelumnya.\n2. Murid menganalisis keselarasan dan kesesuaian antara data aktual dengan dugaan awal.\n3. Murid menentukan keputusan apakah hipotesis mereka diterima atau ditolak berdasarkan bukti.' },
    { phase: 'F. Menarik kesimpulan', description: '[Merefleksi] 1. Murid menyusun simpulan terperinci berdasarkan hasil pembuktian data.\n2. Murid mempresentasikan hasil penyelidikan ilmiah mereka secara lisan di depan kelas.\n3. Murid refleksi seluruh proses pembelajaran dan penyelidikan yang telah dilalui.' }
  ],
  'Cooperative Learning': [
    { phase: 'A. Menyampaikan tujuan dan motivasi', description: '[Memahami] 1. Murid mendengarkan penjelasan guru mengenai tujuan pembelajaran serta indikator ketercapaian secara saksama.\n2. Murid menyiapkan diri secara mental dan fisik untuk mengikuti seluruh rangkaian kegiatan belajar.\n3. Murid merespons pertanyaan pemantik/apersepsi yang diajukan guru dengan antusias.' },
    { phase: 'B. Menyajikan informasi', description: '[Memahami] 1. Murid mengamati pemaparan materi pembelajaran yang disampaikan oleh guru melalui media visual/audio.\n2. Murid membuat catatan ringkas mengenai informasi esensial yang didapatkan.\n3. Murid mengajukan pertanyaan klarifikasi jika terdapat konsep materi yang belum dipahami secara tuntas.' },
    { phase: 'C. Mengorganisasi kelompok', description: '[Mengaplikasikan] 1. Murid membentuk kelompok belajar kecil yang heterogen sesuai koordinasi guru.\n2. Murid menentukan pembagian peran, hak, dan tanggung jawab kerja spesifik bagi setiap anggota.\n3. Murid memahami bersama instruksi dan tugas kelompok pada lembar kerja.' },
    { phase: 'D. Membimbing kerja kelompok', description: '[Mengaplikasikan] 1. Murid berdiskusi aktif dan berkolaborasi dalam menyelesaikan tugas atau lembar kegiatan.\n2. Murid saling membantu memberi penjelasan kepada sesama anggota yang belum memahami materi.\n3. Murid menyusun draf hasil diskusi kelompok secara tertulis dan rapi.' },
    { phase: 'E. Evaluasi', description: '[Mengaplikasikan] 1. Murid mempresentasikan hasil kerja kelompok mereka secara bergantian dengan percaya diri.\n2. Murid memberikan tanggapan berupa apresiasi atau pertanyaan konstruktif terhadap kelompok lain.\n3. Murid memperbaiki draf hasil diskusi kelompok berdasarkan masukan tepercaya.' },
    { phase: 'F. Pemberian penghargaan', description: '[Merefleksi] 1. Murid menerima apresiasi lisan atau penghargaan khusus dari guru atas kinerja terbaik kelompoknya.\n2. Murid memberikan tepuk tangan atau apresiasi balik kepada kelompok lain yang sukses tampil.\n3. Murid termotivasi untuk terus meningkatkan hasil belajar dan soliditas kerja sama kelompok.' }
  ],
  'Problem Solving': [
    { phase: 'A. Identifikasi masalah', description: '[Memahami] 1. Murid mengamati masalah yang diberikan guru lewat contoh studi kasus nyata.\n2. Murid mengidentifikasi penyebab masalah serta latar belakang timbulnya kasus.\n3. Murid menentukan fokus masalah yang akan diselesaikan secara berkelompok.' },
    { phase: 'B. Analisis masalah', description: '[Memahami] 1. Murid mengumpulkan informasi terkait masalah dari berbagai rujukan.\n2. Murid mendiskusikan faktor-faktor yang memengaruhi masalah secara mendalam.\n3. Murid mencatat dan memetakan draf hasil analisis kelompok.' },
    { phase: 'C. Menentukan alternatif solusi', description: '[Mengaplikasikan] 1. Murid mengemukakan beberapa ide solusi kreatif yang mungkin dapat dilakukan.\n2. Murid mendiskusikan kelebihan dan kekurangan dari setiap solusi yang ditawarkan.\n3. Murid menyusun daftar urutan alternatif solusi kelompok.' },
    { phase: 'D. Memilih solusi terbaik', description: '[Mengaplikasikan] 1. Murid membandingkan setiap alternatif solusi secara kritis.\n2. Murid menentukan solusi yang paling efektif dan efisien.\n3. Murid menyepakati keputusan solusi utama yang akan digunakan.' },
    { phase: 'E. Melaksanakan solusi', description: '[Mengaplikasikan] 1. Murid menerapkan rancangan solusi terpilih ke dalam situasi pembiasaan atau studi kasus nyata.\n2. Murid mencatat perkembangan dan respons dari hasil pelaksanaan tindakan solusi tersebut.\n3. Murid bekerja sama secara sinergis dalam menuntaskan penyelesaian masalah.' },
    { phase: 'F. Evaluasi hasil', description: '[Merefleksi] 1. Murid menilai keberhasilan dan dampak dari solusi yang telah dijalankan kelompok.\n2. Murid mengidentifikasi sisa kendala atau hambatan baru yang sekiranya masih muncul.\n3. Murid menyusun draf rekomendasi perbaikan agar solusi tersebut dapat berjalan lebih sempurna.' }
  ],
  'Experiential Learning': [
    { phase: 'A. Concrete Experience', description: '[Memahami] 1. Murid mengikuti kegiatan praktik, simulasi langsung, atau petualangan belajar di lingkungan sekitar.\n2. Murid mengamat secara aktif seluruh proses kejadian yang berlangsung selama eksperimen nyata.\n3. Murid mencatat detail pengalaman berharga atau temuan fisik yang diperoleh secara empiris.' },
    { phase: 'B. Reflective Observation', description: '[Merefleksi] 1. Murid menceritakan kembali secara tertulis atau lisan mengenai petualangan pengalaman yang dialami.\n2. Murid mengidentifikasi hal menarik atau momen penting dari aktivitas yang sudah dikerjakannya.\n3. Murid mendiskusikan hasil refleksi pengamatan pribadi mereka bersama teman kelompok.' },
    { phase: 'C. Abstract Conceptualization', description: '[Mengaplikasikan] 1. Murid menghubungkan fakta pengalaman nyata yang didapatkan dengan konsep atau teori ilmiah.\n2. Murid menemukan prinsip mendasar, hakikat, atau aturan umum yang menjelaskan fenomena tersebut.\n3. Murid menyusun peta konsep atau pemahaman baru yang bermakna berdasarkan pengalaman kongret.' },
    { phase: 'D. Active Experimentation', description: '[Mengaplikasikan] 1. Murid mencoba menerapkan pemahaman dan konsep baru tersebut dalam memecahkan situasi teka-teki lain.\n2. Murid melakukan praktik lanjutan secara mandiri untuk mengasah keterampilan nyata mereka.\n3. Murid mengevaluasi hasil efektivitas penerapan konsep baru tersebut dalam menyelesaikan tugas meluas.' }
  ],
  'Flipped Classroom': [
    { phase: 'A. Belajar mandiri sebelum kelas', description: '[Memahami] 1. Murid menyimak materi pelajaran secara mandiri di rumah melalui video pembelajaran interaktif yang dikirim guru sebelum kelas.\n2. Murid membaca rangkuman materi atau bahan ajar secara mandiri di rumah.\n3. Murid mencatat pertanyaan krusial mengenai konsep yang dirasa masih sulit atau belum dipahami.' },
    { phase: 'B. Diskusi dan klarifikasi', description: '[Memahami] 1. Murid mengajukan pertanyaan terarah terkait konsep materi mandiri yang sempat dipelajari di rumah.\n2. Murid berdiskusi aktif dengan guru serta teman sekelas guna memperoleh kejelasan konsep.\n3. Murid mengklarifikasi pemahaman teoretis yang masih keliru di bawah bimbingan guru.' },
    { phase: 'C. Aktivitas kolaboratif', description: '[Mengaplikasikan] 1. Murid bekerja sama dalam kelompok belajar untuk menyelesaikan lembar kerja praktik di kelas.\n2. Murid memecahkan tantangan tugas terapan atau analisis studi kasus yang diberikan secara tim.\n3. Murid membagikan gagasan orisinal, ide solusi, dan curah pendapat bersama teman.' },
    { phase: 'D. Presentasi hasil', description: '[Mengaplikasikan] 1. Murid menyampaikan paparan hasil diskusi dan kesepakatan kelompok di depan kelas.\n2. Murid menjelaskan logika berpikir, alasan, atau rincian langkah pengerjaan tugas kelompok mereka.\n3. Murid menanggapi secara santun setiap pertanyaan dan sanggahan yang didapat dari kelompok lain.' },
    { phase: 'E. Refleksi dan evaluasi', description: '[Merefleksi] 1. Murid menuliskan simpulan esensial mengenai konsep paling bermakna yang dipelajari hari ini.\n2. Murid mengevaluasi pemahaman mereka sendiri terhadap penguasaan kompetensi materi tersebut.\n3. Murid menyusun draf rencana aksi perbaikan belajar mandiri untuk memperkuat kompetensi di masa depan.' }
  ],
  'Direct Instruction': [
    { phase: 'A. Menyampaikan tujuan', description: '[Memahami] 1. Murid mendengarkan dengan konsentrasi penuh target tujuan pembelajaran yang dipaparkan guru.\n2. Murid memahami kompetensi kognitif atau psikomotorik yang wajib dikuasai di akhir sesi.\n3. Murid menyiapkan seluruh peralatan belajar dan alat bantu yang diperlukan.' },
    { phase: 'B. Demonstrasi', description: '[Memahami] 1. Murid mengamati peragaan terstruktur atau model pengerjaan tugas yang dipraktikkan langsung oleh guru.\n2. Murid mencatat urutan langkah-langkah prosedural penting secara cermat.\n3. Murid mengajukan pertanyaan klarifikasi mengenai detail teknik demonstrasi tersebut.' },
    { phase: 'C. Latihan terbimbing', description: '[Mengaplikasikan] 1. Murid meniru langkah pengerjaan bersama-sama di bawah panduan intensif dari guru.\n2. Murid mencoba menyelesaikan beberapa soal latihan bertahap menggunakan bimbingan langsung.\n3. Murid memperbaiki kesalahan taktis pengerjaan berdasarkan asistensi atau arahan guru.' },
    { phase: 'D. Pengecekan pemahaman', description: '[Mengaplikasikan] 1. Murid menjawab umpan balik kuis cepat atau soal spontan yang diajukan oleh guru.\n2. Murid menunjukkan draf hasil latihan mandiri mereka yang sedang berjalan untuk divalidasi.\n3. Murid menerima umpan balik korektif dan penjelasan penguatan materi dari guru.' },
    { phase: 'E. Latihan mandiri', description: '[Mengaplikasikan] 1. Murid mengerjakan lembar kerja secara mandiri dan disiplin guna mematangkan kebiasaan.\n2. Murid mendiseminasikan atau menerapkan konsep yang terserap dalam pengerjaan beragam tingkat kesulitan tugas.\n3. Murid mengumpulkan lembar portofolio hasil kerja mandiri mereka kepada guru untuk dinilai.' }
  ],
  'Contextual Teaching and Learning (CTL)': [
    { phase: 'A. Konstruktivisme', description: '[Memahami] 1. Murid secara aktif menghubungkan materi baru yang dipelajari dengan pengalaman sehari-hari dan pengetahuan yang sudah mereka miliki sebelumnya.\n2. Murid mengemukakan pengetahuan awal atau persepsi yang berkembang di lingkungannya tentang materi.\n3. Murid membangun pemahaman konsep baru yang kokoh berdasarkan jembatan pengalaman riil tersebut.' },
    { phase: 'B. Inquiry', description: '[Memahami] 1. Murid melakukan penyelidikan terhadap permasalahan nyata yang diberikan untuk menemukan sendiri konsep inti dari materi tersebut.\n2. Murid mengobservasi secara langsung stimulus masalah kontekstual yang disajikan di lingkungan.\n3. Murid menemukan konsep mandiri melalui penguraian masalah dan penelaahan mandiri.' },
    { phase: 'C. Questioning', description: '[Mengaplikasikan] 1. Murid mengajukan pertanyaan untuk menggali informasi lebih dalam dan menjawab pertanyaan teman atau guru untuk memperluas cakrawala berpikir.\n2. Murid memberikan jawaban atas pertanyaan yang ditanyakan oleh guru atau rekan sebahaya.\n3. Murid memperdalam pemahaman rasional konsep materi melalui aktivitas tanya jawab dua arah.' },
    { phase: 'D. Learning Community', description: '[Mengaplikasikan] 1. Murid berdiskusi, bekerja sama, dan saling bertukar pikiran dengan anggota kelompok lainnya untuk memecahkan masalah bersama.\n2. Murid saling berbagi modalitas pengalaman, keahlian, dan informasi guna memecahkan ketidaktahuan.\n3. Murid berkolaborasi menuntaskan lembar pemecahan masalah dengan bersandar pada kontribusi tim.' },
    { phase: 'E. Modelling', description: '[Mengaplikasikan] 1. Murid mengamati contoh penerapan nyata dari konsep yang sedang dipelajari baik melalui guru maupun sumber belajar lainnya.\n2. Murid menirukan dan menerapkan langkah/pola tersistem yang telah dicontohkan tersebut secara saksama.' }
  ]
};

// Selection Options
const PENDEKATAN_OPTIONS = [
  'Diferensiasi',
  'Saintifik',
  'Kontekstual (CTL)',
  'Konstruktivisme',
  'TPACK (Technological Pedagogical Content Knowledge)',
  'STEM (Science, Technology, Engineering, and Math)'
];

const MODEL_OPTIONS = [
  'Problem Based Learning (PBL)',
  'Project Based Learning (PjBL)',
  'Discovery Learning',
  'Inquiry Learning',
  'Cooperative Learning',
  'Problem Solving',
  'Experiential Learning',
  'Flipped Classroom',
  'Direct Instruction',
  'Contextual Teaching and Learning (CTL)'
];

const STRATEGI_OPTIONS = [
  'Active Learning',
  'Kooperatif',
  'Inkuiri',
  'Ekspositori',
  'Kolaboratif',
  'Diferensiasi Konten',
  'Diferensiasi Proses',
  'Diferensiasi Produk',
  'Flipped Classroom'
];

const METODE_OPTIONS = [
  'Diskusi',
  'Ceramah',
  'Tanya Jawab',
  'Demonstrasi',
  'Eksperimen',
  'Penugasan',
  'Presentasi',
  'Bermain Peran',
  'Kunjungan Lapangan',
  'Simulasi'
];

const MEDIA_OPTIONS = [
  'Media Pembelajaran Interaktif',
  'YouTube',
  'Canva',
  'Quizizz',
  'Padlet',
  'Wordwall',
  'Google Maps',
  'Google Arts & Culture',
  'Mentimeter',
  'Kahoot',
  'Google Drive',
  'Scratch',
  'PhET Interactive Simulations',
  'Virtual Tour Museum Nasional'
];

const LINGKUNGAN_OPTIONS = [
  'Ruang kelas',
  'Situs bersejarah di lingkungan sekitar',
  'Museum daerah',
  'Perpustakaan sekolah',
  'Sanggar seni budaya',
  'Lapangan olahraga',
  'Lab Komputer',
  'Lab IPA',
  'Kebun/Sawah',
  'Taman sekolah',
  'Lingkungan sekitar rumah'
];

const LINTAS_DISIPLIN_OPTIONS = [
  'PAI',
  'Pendidikan Pancasila',
  'Bahasa Indonesia',
  'Matematika',
  'IPAS',
  'Seni Rupa',
  'Seni Musik',
  'Seni Tari',
  'Seni Teater',
  'PJOK',
  'Koding dan Kecerdasan Artifisial',
  'Bahasa Inggris'
];

// Helper functions for comma-separated selections
const toggleCommaSeparated = (current: string, choice: string): string => {
  const items = current
    ? current.split(',').map(s => s.trim()).filter(Boolean)
    : [];
  if (items.includes(choice)) {
    return items.filter(i => i !== choice).join(', ');
  } else {
    items.push(choice);
    return items.join(', ');
  }
};

const isChoiceSelected = (current: string, choice: string): boolean => {
  const items = current
    ? current.split(',').map(s => s.trim()).filter(Boolean)
    : [];
  return items.includes(choice);
};

const formatAktivitasAwalItemText = (item: string, learningGoals: string[]): string => {
  if (!item) return '';
  let text = item;

  // 1. Format Pertanyaan Pemantik/Pemitik
  if (/pertanyaan\s+pem[aa]ntik/i.test(text)) {
    // If inline numbers exist, convert them to newlines if not already formatted
    if (text.includes('1.') && !text.includes('\n1.')) {
      text = text.replace(/1\./, '\n1.');
    }
    for (let i = 2; i <= 10; i++) {
      const inlinePattern = new RegExp(`\\s+${i}\\.\\s+`, 'g');
      if (inlinePattern.test(text) && !text.includes(`\n${i}.`)) {
        text = text.replace(inlinePattern, `\n${i}. `);
      }
    }
    // Match colon and fix spacing for vertical numbered lists
    if (/:(\s*)(?=\n1\.)/.test(text)) {
      text = text.replace(/:(\s*)(?=\n1\.)/, ':\n');
    } else if (/:(\s*)(?=1\.)/.test(text)) {
      text = text.replace(/:(\s*)(?=1\.)/, ':\n');
    }
  }

  // 2. Format Tujuan Pembelajaran
  if (/tujuan\s+pembelajaran/i.test(text) && learningGoals && learningGoals.length > 0) {
    if (!text.includes('§')) {
      // Find suitable split index
      const splitRegex = /, yaitu|yaitu:|yang akan dicapai/i;
      const parts = text.split(splitRegex);
      if (parts.length > 0) {
        const intro = parts[0].trim();
        const goalsList = learningGoals
          .map((g) => g.trim())
          .filter(Boolean);
        if (goalsList.length > 0) {
          text = `${intro}, yaitu:§${goalsList.map((g) => `${g}`).join('§')}`;
        }
      }
    }
  }

  return text;
};

const extractLabel = (desc: string) => {
  const match = desc.match(/^\s*\[(Memahami|Mengaplikasi|Mengaplikasikan|Merefleksi)\]\s*(.*)/i);
  if (match) {
    return {
      label: match[1],
      description: match[2]
    };
  }
  return { label: null, description: desc };
};

const parseTotalMinutes = (allocation: string): number => {
  if (!allocation) return 0;
  const matchX = allocation.match(/(\d+)\s*x\s*(\d+)/i);
  if (matchX) {
    return parseInt(matchX[1]) * parseInt(matchX[2]);
  }
  const matchMenit = allocation.match(/(\d+)\s*menit/i);
  if (matchMenit) {
    return parseInt(matchMenit[1]);
  }
  const matchNum = allocation.match(/\d+/g);
  if (matchNum && matchNum.length === 1) {
    return parseInt(matchNum[0]);
  }
  return 0;
};

const getPrintPlanDurations = (p: LearningPlan) => {
  const totalMin = parseTotalMinutes(p.timeAllocation || '');
  const loadedAwal = p.durasiAwal !== undefined && p.durasiAwal > 0 ? p.durasiAwal : (totalMin === 35 ? 5 : totalMin >= 140 ? 15 : 10);
  const loadedPenutup = p.durasiPenutup !== undefined && p.durasiPenutup > 0 ? p.durasiPenutup : (totalMin === 35 ? 5 : totalMin >= 140 ? 15 : 10);
  const loadedInti = p.durasiInti !== undefined && p.durasiInti > 0 ? p.durasiInti : (Math.max(0, totalMin - loadedAwal - loadedPenutup) || 50);
  return { awal: loadedAwal, inti: loadedInti, penutup: loadedPenutup };
};

const DEFAULT_PLANS: LearningPlan[] = [];

export const LearningPlanView: React.FC<LearningPlanViewProps> = ({
  classId,
  isReadOnly,
  schoolProfile,
  teacherProfile,
  currentUser,
  onShowNotification,
  onSyncReport
}) => {
  const { showConfirm, showAlert } = useModal();
  const [plans, setPlans] = useState<LearningPlan[]>([]);
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'form'>('dashboard');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Dynamic schedule subjects state
  const [scheduleSubjects, setScheduleSubjects] = useState<string[]>([]);

  // Helper to derive Class, Semester, and Fase automatically
  const autoClassSemesterPlusFase = () => {
    // 1. Semester
    let activeSemester = schoolProfile?.semester || '1';
    let semesterLabel = activeSemester;
    if (activeSemester === '1' || activeSemester.toLowerCase().includes('ganjil')) {
      semesterLabel = '1 (Ganjil)';
    } else if (activeSemester === '2' || activeSemester.toLowerCase().includes('genap')) {
      semesterLabel = '2 (Genap)';
    }

    // 2. Class
    let classNum = '';
    const sourceStr = (classId || teacherProfile?.teachingClass || '').toString().toUpperCase();
    const match = sourceStr.match(/[1-6]/);
    if (match) {
      classNum = match[0];
    } else {
      classNum = '5'; // fallback
    }

    const romanClasses: Record<string, string> = {
      '1': 'I', '2': 'II', '3': 'III', '4': 'IV', '5': 'V', '6': 'VI'
    };
    const romanVal = romanClasses[classNum] || 'V';

    // 3. Fase
    // Fase A ( Kelas 1 dan 2), Fase B ( Kelas 3 dan 4), Fase C (Kelas 5 dan 6)
    let phaseLabel = 'Fase C';
    if (classNum === '1' || classNum === '2') {
      phaseLabel = 'Fase A';
    } else if (classNum === '3' || classNum === '4') {
      phaseLabel = 'Fase B';
    } else if (classNum === '5' || classNum === '6') {
      phaseLabel = 'Fase C';
    }

    return {
      kelasNum: classNum,
      roman: romanVal,
      fase: phaseLabel,
      semester: semesterLabel,
      display: `${romanVal} / ${semesterLabel} / ${phaseLabel}`
    };
  };

  // Merge schedule subjects with standard base keys from CP_TEMPLATES
  const getDynamicSubjects = () => {
    // 10 Core/Main elementary school subjects ordered with PAI and Koding (KKA) first
    const standardCoreKeys = [
      'PAI',
      'Pendidikan Pancasila',
      'Bahasa Indonesia',
      'Matematika',
      'IPAS',
      'PJOK',
      'Seni dan Budaya',
      'Bahasa Inggris',
      'Bahasa Jawa',
      'Koding dan Kecerdasan Artifisial',
    ];

    // Check if the current user is a teacher and has assigned subjects
    const teacherSubjects = (currentUser?.role === 'guru' && teacherProfile && teacherProfile.subjects) 
      ? (Array.isArray(teacherProfile.subjects) ? teacherProfile.subjects : [teacherProfile.subjects])
      : null;

    const filterOutKeywords = [
      'istirahat', 'sholat', 'upacara', 'dhuha', 'pembiasaan', 'piket', 'senam', 'literasi',
      'break', 'snack', 'makan', 'pulang', 'baca', 'mengaji', 'ekstrakurikuler', 'pramuka',
      'upacara bendera'
    ];

    const combined: string[] = [];

    // Prioritize standardCoreKeys, but filter by teacherSubjects if applicable
    standardCoreKeys.forEach(sub => {
      if (teacherSubjects && !teacherSubjects.includes(sub)) return;

      const exists = combined.some(s => s.toLowerCase() === sub.toLowerCase());
      if (!exists) {
        combined.push(sub);
      }
    });


    // Populate extra custom academic subjects from class schedule that are not already in standard core
    scheduleSubjects.forEach(sub => {
      const trimmed = sub.trim();
      if (!trimmed) return;
      const lower = trimmed.toLowerCase();

      // Ensure it is not a non-academic/schedule activity
      const isActivity = filterOutKeywords.some(keyword => lower === keyword || lower.includes(keyword));
      if (isActivity) return;

      const exists = combined.some(s => s.toLowerCase() === lower);
      if (!exists) {
        combined.push(trimmed);
      }
    });

    return combined;
  };

  // Form Fields
  const [schoolName, setSchoolName] = useState('UPT SD Negeri Remen 2');
  const [tempatPengesahan, setTempatPengesahan] = useState('');
  const [compiler, setCompiler] = useState('Dedy Meyga Saputra, S.Pd, M.Pd');
  const [nip, setNip] = useState('198905202020121006');
  const [subject, setSubject] = useState('IPAS');
  const [topic, setTopic] = useState('');
  const [classSemester, setClassSemester] = useState('V / 2 (Genap)');
  const [academicYear, setAcademicYear] = useState('2025/2026');
  const [timeAllocation, setTimeAllocation] = useState('4 JP (4 x 35 Menit)');
  const [durasiAwal, setDurasiAwal] = useState<number>(15);
  const [durasiInti, setDurasiInti] = useState<number>(105);
  const [durasiPenutup, setDurasiPenutup] = useState<number>(20);
  const [kegiatanAwalTitle, setKegiatanAwalTitle] = useState('Kegiatan Awal (Kesan dan Bermakna)');
  const [kegiatanIntiTitle, setKegiatanIntiTitle] = useState('Kegiatan Inti');
  const [kegiatanPenutupTitle, setKegiatanPenutupTitle] = useState('Kegiatan Penutup (Berkesadaran)');

  const calculateAutoDurasi = (changedField: 'awal' | 'inti' | 'penutup', newValue: number) => {
    const totalMin = parseTotalMinutes(timeAllocation);
    if (totalMin <= 0) return;

    if (changedField === 'awal') {
      const val = Math.max(0, Math.min(newValue, totalMin));
      setDurasiAwal(val);
      const rem = totalMin - val;
      const currentP = Math.max(0, Math.min(durasiPenutup, rem));
      const newI = rem - currentP;
      setDurasiInti(newI);
      setDurasiPenutup(currentP);
    } else if (changedField === 'inti') {
      const val = Math.max(0, Math.min(newValue, totalMin));
      setDurasiInti(val);
      const rem = totalMin - val;
      let newA = durasiAwal;
      let newP = durasiPenutup;
      if (newA + newP !== rem) {
        if (rem <= 10) {
          newA = Math.round(rem / 2);
          newP = rem - newA;
        } else {
          newA = Math.min(15, Math.round(rem * 0.5));
          newP = rem - newA;
        }
      }
      setDurasiAwal(newA);
      setDurasiPenutup(newP);
    } else if (changedField === 'penutup') {
      const val = Math.max(0, Math.min(newValue, totalMin));
      setDurasiPenutup(val);
      const rem = totalMin - val;
      const currentA = Math.max(0, Math.min(durasiAwal, rem));
      const newI = rem - currentA;
      setDurasiInti(newI);
      setDurasiAwal(currentA);
    }
  };

  const handleManualChange = (field: 'awal' | 'inti' | 'penutup', num: number) => {
    const parsed = isNaN(num) ? 0 : Math.max(0, num);
    const totalMin = parseTotalMinutes(timeAllocation);
    if (totalMin <= 0) {
      if (field === 'awal') setDurasiAwal(parsed);
      if (field === 'inti') setDurasiInti(parsed);
      if (field === 'penutup') setDurasiPenutup(parsed);
    } else {
      calculateAutoDurasi(field, parsed);
    }
  };

  const handleTimeAllocationChange = (val: string) => {
    setTimeAllocation(val);
    const totalMin = parseTotalMinutes(val);
    if (totalMin > 0) {
      let awal = 10;
      let penutup = 10;
      if (totalMin === 35) {
        awal = 5;
        penutup = 5;
      } else if (totalMin >= 140) {
        awal = 15;
        penutup = 15;
      }
      const inti = totalMin - awal - penutup;
      setDurasiAwal(awal);
      setDurasiInti(inti);
      setDurasiPenutup(penutup);
    }
  };
  const [customCreatedDate, setCustomCreatedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Identifikasi
  const [studentCharacteristics, setStudentCharacteristics] = useState('Murid dengan karakteristik beragam (Audio, Visual, Kinestetik), minat yang bervariasi.');
  const [selectedDimensions, setSelectedDimensions] = useState<string[]>([]);
  
  // Design
  const [capaianPembelajaran, setCapaianPembelajaran] = useState('');
  const [goalsInput, setGoalsInput] = useState<string[]>(['']);
  
  // Pedagogis
  const [pendekatan, setPendekatan] = useState('Diferensiasi');
  const [pendekatanReason, setPendekatanReason] = useState('');
  const [model, setModel] = useState('Problem Based Learning (PBL)');
  const [modelReason, setModelReason] = useState('');
  const [strategi, setStrategi] = useState('Active Learning');
  const [strategiReason, setStrategiReason] = useState('');
  const [metode, setMetode] = useState<string[]>(['Diskusi']);
  const [metodeReason, setMetodeReason] = useState('');

  const [isCustomPendekatanMode, setIsCustomPendekatanMode] = useState(false);
  const [isCustomModelMode, setIsCustomModelMode] = useState(false);
  const [isCustomStrategiMode, setIsCustomStrategiMode] = useState(false);
  const [customMetodeInput, setCustomMetodeInput] = useState('');

  const handleAddCustomMetode = () => {
    const trimmed = customMetodeInput.trim();
    if (trimmed && !metode.includes(trimmed)) {
      setMetode([...metode, trimmed]);
      setCustomMetodeInput('');
    }
  };

  // Lintas disiplin dll
  const [lintasDisiplin, setLintasDisiplin] = useState('Pendidikan Pancasila');
  const [mitra, setMitra] = useState('Orang Tua Murid, Budayawan');
  const [digital, setDigital] = useState('Google Maps, YouTube, Canva, Quizizz');
  const [lingkungan, setLingkungan] = useState('Ruang kelas, Perpustakaan sekolah');

  // Helper templates for Kegiatan Awal and Kegiatan Penutup
  const getAwalTemplate = (t: string, goals: string[], m: string) => {
    const tMateri = t ? t.trim() : '[Materi Pokok / Bahasan]';
    const firstGoal = (goals && goals[0] && goals[0].trim()) ? goals[0].trim() : '[Tujuan pembelajaran]';
    const tModel = m ? m.trim() : '[Model Pembelajaran]';

    return [
      'Guru mengucapkan salam, berdoa, dan mengecek kehadiran murid',
      'Murid bersama guru menyanyikan lagu wajib "Indonesia Raya"',
      `Murid mengikuti kegiatan apersepsi tentang ${tMateri} dan menjawab pertanyaan pemantik yang diajukan guru: 1. Apa yang kamu ketahui tentang ${tMateri}? 2. Bagaimana cara kamu untuk belajar tentang ${tMateri}?`,
      `Murid menyimak penjelasan guru mengenai tujuan pembelajaran hari ini, yaitu ${goals.map((g, gi) => `${gi + 1}. ${g}`).join('\n')}`,
      `Murid menerima motivasi mengenai relevansi materi terhadap kehidupan sehari-hari dan memahami garis besar kegiatan yang akan dilakukan menggunakan model ${tModel}`
    ];
  };

  const getPenutupTemplate = (t: string, m: string) => {
    const tMateri = t ? t.trim() : '[Materi Pokok / Bahasan]';
    const tModel = m ? m.trim() : '[Model Pembelajaran]';

    return [
      `Evaluasi dan Refleksi: Murid bersama guru menyimpulkan hasil pemecahan masalah terkait [materi ${tMateri}], kemudian Murid melakukan refleksi terhadap proses pembelajaran yang telah dilakukan dengan mengungkapkan perasaan serta hambatan yang dialami selama diskusi kelompok.`,
      `Apresiasi dan Umpan Balik: Murid menerima apresiasi atas partisipasi aktif dalam kegiatan ${tMateri} yang disajikan, serta murid mendapatkan umpan balik konstruktif terhadap hasil presentasi yang telah dipaparkan oleh masing-masing kelompok.`,
      `Tindak Lanjut dan Penutup: Murid mendapatkan informasi mengenai rencana pembelajaran pada pertemuan berikutnya, kemudian Murid mengakhiri kegiatan dengan doa bersama dan salam penutup sebagai bentuk syukur atas kelancaran proses belajar.`
    ];
  };

  const syncKegiatanAwalDanPenutup = () => {
    const activeTopic = topic || '[Topik Bahasan]';
    const goalsList = (goalsInput && goalsInput.length > 0)
      ? goalsInput.filter(g => g.trim() !== '')
      : ['[Tujuan pembelajaran]'];
    const activeModel = model || 'Problem Based Learning (PBL)';

    const synchedAwal = [
      'Guru mengucapkan salam, berdoa, dan mengecek kehadiran murid',
      'Murid bersama guru menyanyikan lagu wajib "Indonesia Raya"',
      `Murid mengikuti kegiatan apersepsi terkait materi ${activeTopic} dan menjawab pertanyaan pemantik:\n1. Apa yang kamu ketahui tentang ${activeTopic}?\n2. Bagaimana cara kamu untuk belajar tentang ${activeTopic}?`,
      `Murid menyimak penjelasan guru mengenai tujuan pembelajaran hari ini, yaitu:\n${goalsList.map((g, gi) => `${gi + 1}. ${g}`).join('\n')}`,
      `Murid menerima motivasi mengenai relevansi materi terhadap kehidupan sehari-hari dan memahami garis besar kegiatan yang akan dilakukan menggunakan model ${activeModel}`
    ];

    const synchedPenutup = [
      `Evaluasi dan Refleksi: Murid bersama guru menyimpulkan hasil pemecahan masalah terkait ${activeTopic}, kemudian Murid melakukan refleksi terhadap proses pembelajaran yang telah dilakukan dengan mengungkapkan perasaan serta hambatan yang dialami selama diskusi kelompok.`,
      `Apresiasi dan Umpan Balik: Murid menerima apresiasi atas partisipasi aktif dalam kegiatan pembelajaran ${activeTopic} yang disajikan, serta murid mendapatkan umpan balik konstruktif terhadap hasil presentasi yang telah dipaparkan oleh masing-masing kelompok.`,
      `Tindak Lanjut dan Penutup: Murid mendapatkan informasi mengenai rencana pembelajaran pada pertemuan berikutnya, kemudian Murid mengakhiri kegiatan dengan doa bersama dan salam penutup sebagai bentuk syukur atas kelancaran proses belajar.`
    ];

    setAwalInput(synchedAwal);
    setPenutupInput(synchedPenutup);
    onShowNotification('Kegiatan Awal & Penutup berhasil disinkronkan otomatis dengan Topik, TP & Model!', 'success');
  };

  // Pengalaman Pembelajaran
  const [awalInput, setAwalInput] = useState<string[]>([
    'Guru mengucapkan salam, berdoa, dan mengecek kehadiran murid',
    'Murid bersama guru menyanyikan lagu wajib "Indonesia Raya"',
    `Murid mengikuti kegiatan apersepsi terkait materi ${topic || '[Topik]'} dan menjawab pertanyaan pemantik:\n1. Apa yang kamu ketahui tentang ${topic || '[Topik]'}?\n2. Bagaimana cara kamu untuk belajar tentang ${topic || '[Topik]'}?`,
    `Murid menyimak penjelasan guru mengenai tujuan pembelajaran hari ini, yaitu:\n${goalsInput.map((g, gi) => `${gi + 1}. ${g}`).join('\n')}`,
    `Murid menerima motivasi mengenai relevansi materi terhadap kehidupan sehari-hari dan memahami garis besar kegiatan yang akan dilakukan menggunakan model ${model || 'Problem Based Learning (PBL)'}`
  ]);
  const [intiInput, setIntiInput] = useState<{ phase: string; description: string }[]>(
    JSON.parse(JSON.stringify(MODEL_SINTAKS_TEMPLATES['Problem Based Learning (PBL)'] || []))
  );
  const [penutupInput, setPenutupInput] = useState<string[]>([
    'Evaluasi dan Refleksi: Murid bersama guru menyimpulkan hasil pemecahan masalah terkait materi yang dipelajari, kemudian Murid melakukan refleksi terhadap proses pembelajaran yang telah dilakukan dengan mengungkapkan perasaan.',
    'Apresiasi dan Umpan Balik: Murid menerima apresiasi atas partisipasi aktif dalam kegiatan pembelajaran, serta murid mendapatkan umpan balik konstruktif terhadap hasil presentasi yang telah dipaparkan.',
    'Tindak Lanjut dan Penutup: Murid mendapatkan informasi mengenai rencana pembelajaran pada pertemuan berikutnya, kemudian Murid mengakhiri kegiatan dengan doa bersama dan salam penutup.'
  ]);

  // Asesmen
  const [asesmenAwal, setAsesmenAwal] = useState('Pertanyaan pemantik lisan, Kuis singkat (Diagnostik Kognitif)');
  const [asesmenProses, setAsesmenProses] = useState('Observasi Profil Lulusan, Kinerja Kelompok');
  const [asesmenAkhir, setAsesmenAkhir] = useState('Tes Sumatif (Soal Evaluasi / Rubrik Produk)');
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  // Print Preview state
  const [printPlan, setPrintPlan] = useState<LearningPlan | null>(null);

  // TP Generator States
  const [selectedGoalIndex, setSelectedGoalIndex] = useState<number | null>(null);
  const [tempPrefixType, setTempPrefixType] = useState('pendekatan');
  const [tempKko, setTempKko] = useState('menganalisis');
  const [tempMateri, setTempMateri] = useState('');
  const [tempDegree, setTempDegree] = useState('dengan tepat');
  const [customGeneratedText, setCustomGeneratedText] = useState('');

  // Kegiatan Inti Assistant States
  const [selectedSintaksIndex, setSelectedSintaksIndex] = useState<number | null>(null);
  const [tempSintaksText, setTempSintaksText] = useState('');

  const getSintaksSuggestion = (sIdx: number) => {
    const tMateri = topic || '[Topik Bahasan]';
    const tModel = model || '[Model Pembelajaran]';
    const tPendekatan = pendekatan || 'Diferensiasi';
    const tStrategi = strategi || 'Active Learning';
    const tMetode = (Array.isArray(metode) ? metode.join(', ') : metode) || 'Diskusi';
    const tDigital = digital || 'Media Digital';
    const tLingkungan = lingkungan || 'Ruang kelas';
    const tTP = goalsInput[0] ? `"${goalsInput[0]}"` : '"memahami materi pembelajaran"';

    const checkModel = (match: string) => model.toLowerCase().includes(match.toLowerCase());

    const isPBL = checkModel('pbl') || checkModel('problem based');
    const isPjBL = checkModel('pjbl') || checkModel('project based');
    const isDiscovery = checkModel('discovery');
    const isInquiry = checkModel('inquiry');
    const isCooperative = checkModel('cooperative');
    const isProblemSolving = checkModel('problem solving');
    const isExperiential = checkModel('experiential');
    const isFlipped = checkModel('flipped');
    const isDirect = checkModel('direct instruction');
    const isCTL = checkModel('ctl') || checkModel('contextual');

    if (isPBL) {
      if (sIdx === 0) {
        return `1. Murid dengan penuh kesadaran mengamati gambar, video, teks, atau fenomena nyata terkait ${tMateri} yang disajikan oleh guru memanfaatkan media digital ${tDigital} di ${tLingkungan}.\n2. Murid mengidentifikasi informasi penting yang ditemukan pada permasalahan tersebut secara kritis.\n3. Murid menyampaikan tanggapan awal terhadap masalah yang diberikan dengan bimbingan dan arahan guru.`;
      }
      if (sIdx === 1) {
        return `1. Murid membentuk kelompok belajar secara kolaboratif sesuai dengan arahan guru demi mendukung efektivitas strategi ${tStrategi}.\n2. Murid membagi peran dan tugas tanggung jawab spesifik dalam kelompok guna menyukseskan kolaborasi.\n3. Murid merumuskan pertanyaan penyelidikan terkait materi ${tMateri} yang akan diselidiki melalui metode ${tMetode}.`;
      }
      if (sIdx === 2) {
        return `1. Murid secara aktif mencari informasi pendukung dari berbagai sumber belajar digital ${tDigital} dan literatur yang relevan.\n2. Murid melakukan observasi, eksperimen, atau pengumpulan data yang diperlukan di lingkungan ${tLingkungan} menggunakan pendekatan ${tPendekatan}.\n3. Murid mencatat dan mengorganisasikan hasil temuan untuk dianalisis bersama kelompok menggunakan metode ${tMetode}.`;
      }
      if (sIdx === 3) {
        return `1. Murid mendiskusikan keputusan alternatif solusi teoretis berdasarkan temuan data yang diperoleh.\n2. Murid menyusun laporan, poster, atau media presentasi kelompok yang kreatif di Canva atau platform digital lainnya.\n3. Murid mempresentasikan hasil pemecahan masalah materi ${tMateri} secara berkelompok di depan kelas secara komunikatif dan penuh percaya diri.`;
      }
      if (sIdx === 4) {
        return `1. Murid memberikan tanggapan apresiatif maupun masukan yang konstruktif terhadap presentasi kelompok lain.\n2. Murid bersama guru mengevaluasi kelebihan dan kekurangan solusi pemecahan masalah yang dihasilkan.\n3. Murid menuliskan refleksi pembelajaran mandiri mengenai konsep esensial guna memenuhi target: ${tTP}.`;
      }
    }

    if (isPjBL) {
      if (sIdx === 0) {
        return `1. Murid mengamati fenomena atau skenario permasalahan kontekstual ${tMateri} yang disajikan guru lewat tayangan media ${tDigital}.\n2. Murid mengidentifikasi tantangan dunia nyata yang menantang untuk dijadikan proyek pembelajaran bergengsi di ${tLingkungan}.\n3. Murid mengajukan pertanyaan terkait rancangan proyek yang akan dibuat dengan pendekatan pembelajaran ${tPendekatan}.`;
      }
      if (sIdx === 1) {
        return `1. Murid menetapkan target dan rancangan spesifikasi produk proyek materi ${tMateri} secara terukur.\n2. Murid menyusun rencana langkah-langkah pengerjaan proyek secara sistematis sesuai arahan strategi ${tStrategi}.\n3. Murid menentukan alat, bahan, dan media pendukung digital ${tDigital} yang diperlukan.`;
      }
      if (sIdx === 2) {
        return `1. Murid membagi peran, hak, dan tanggung jawab kerja spesifik bagi setiap anggota kelompok memanfaatkan metode ${tMetode}.\n2. Murid menyusun estimasi alokasi waktu pelaksanaan setiap tahapan pengerjaan proyek.\n3. Murid menyepakati target penyelesaian (milestones) proyek bersama guru.`;
      }
      if (sIdx === 3) {
        return `1. Murid melaksanakan pengerjaan proyek fisikal secara aktif bersama kelompok sesuai rencana yang telah disusun.\n2. Murid mencatat perkembangan dan progres kelompok secara berkala menggunakan media ${tDigital}.\n3. Murid mendiskusikan dan memperbaiki hambatan pembuatan proyek dengan guru di ${tLingkungan}.`;
      }
      if (sIdx === 4) {
        return `1. Murid memeriksa kualitas dan kesesuaian produk akhir ${tMateri} yang berhasil diselesaikan.\n2. Murid menguji fungsi atau manfaat dari produk yang dibuat sesuai tujuan awal proyek.\n3. Murid melakukan revisi atau perbaikan produk berdasarkan hasil uji coba awal.`;
      }
      if (sIdx === 5) {
        return `1. Murid mempresentasikan unjuk karya hasil proyek di depan kelas secara komunikatif dengan percaya diri.\n2. Murid merespons masukan berharga serta umpan balik dari guru dan teman.\n3. Murid merefleksikan seluruh pengalaman belajar guna memenuhi target tujuan pembelajaran: ${tTP}.`;
      }
    }

    if (isDiscovery) {
      if (sIdx === 0) {
        return `1. Murid mengamati media visual atau video edukasi ${tDigital} yang disajikan oleh guru terkait materi ${tMateri}.\n2. Murid mencatat poin esensial atau fenomena unik yang menarik perhatian panca indra.\n3. Murid menghubungkan hasil pengamatan awal dengan pengalaman belajar yang mereka miliki sebelumnya.`;
      }
      if (sIdx === 1) {
        return `1. Murid mengajukan berbagai pertanyaan kritis berdasarkan pengamatan masalah di ${tLingkungan}.\n2. Murid mengidentifikasi masalah utama yang relevan dengan topik bahasan ${tMateri}.\n3. Murid merumuskan permasalahan tersebut secara lisan/tulisan sesuai pendekatan ${tPendekatan}.`;
      }
      if (sIdx === 2) {
        return `1. Murid melacak dan mencari informasi terpercaya dari buku, internet, atau platform digital ${tDigital}.\n2. Murid melakukan eksplorasi atau pengamatan mandiri menggunakan metode ${tMetode}.\n3. Murid mengumpulkan dan mendata informasi yang relevan untuk menjawab rumusan masalah.`;
      }
      if (sIdx === 3) {
        return `1. Murid mengelompokkan data yang telah diperoleh secara analitis.\n2. Murid membandingkan validitas informasi dari berbagai sumber rujukan sesuai strategi ${tStrategi}.\n3. Murid mendiskusikan hasil analisis temuan data bersama kelompok kecil.`;
      }
      if (sIdx === 4) {
        return `1. Murid memeriksa kembali kebenaran dan kevalidan data yang telah diperoleh.\n2. Murid berpasangan membandingkan hasil temuan data kelompok mereka dengan teori atau konsep ilmiah terkait.\n3. Murid melakukan konfirmasi dan memperbaiki draf hasil analisis jika ditemukan ketidaksesuaian.`;
      }
      if (sIdx === 5) {
        return `1. Murid merangkum kesimpulan akhir konsep ${tMateri} berdasarkan pengolahan data yang valid.\n2. Murid mengomunikasikan hasil penemuan barunya kepada seluruh teman kelas.\n3. Murid menuliskan konsep esensial tersebut sebagai bukti penguasaan target kompetensi: ${tTP}.`;
      }
    }

    if (isInquiry) {
      if (sIdx === 0) {
        return `1. Murid mengamati fenomena kontekstual tentang materi ${tMateri} yang ditunjukkan asisten virtual/guru lewat ${tDigital}.\n2. Murid mengidentifikasi fakta-fakta spesifik yang ditemukan dari stimulus di ${tLingkungan}.\n3. Murid menyampaikan argumen atau dugaan awal rasional terhadap fenomena tersebut.`;
      }
      if (sIdx === 1) {
        return `1. Murid menentukan fokus atau ruang lingkup masalah yang akan diselidiki terkait ${tMateri}.\n2. Murid menyusun pertanyaan penelitian sederhana yang menuntut pembuktian ilmiah.\n3. Murid mendiskusikan kriteria masalah tersebut bersama teman kelompok menggunakan metode ${tMetode}.`;
      }
      if (sIdx === 2) {
        return `1. Murid merumuskan dugaan sementara (hipotesis) terhadap penyelesaian masalah secara logis.\n2. Murid memaparkan argumen ilmiah yang mendasari dugaan tersebut menggunakan pendekatan ${tPendekatan}.\n3. Murid menyepakati rumusan hipotesis kelompok yang siap diuji kebenarannya.`;
      }
      if (sIdx === 3) {
        return `1. Murid melakukan observasi sistematis atau percobaan laboratorium sederhana secara cermat.\n2. Murid menelusuri data pendukung tambahan lewat rujukan tepercaya di internet memanfaatkan ${tDigital}.\n3. Murid mencatat seluruh data and fakta empiris yang diperoleh dari proses penyelidikan kelompok di ${tLingkungan}.`;
      }
      if (sIdx === 4) {
        return `1. Murid membandingkan temuan data di lapangan dengan draf hipotesis kelompok yang telah disusun.\n2. Murid menganalisis keselarasan dan kesesuaian antara data aktual dengan dugaan awal bersandarkan strategi ${tStrategi}.\n3. Murid menentukan keputusan apakah hipotesis ilmiah kelompok diterima atau ditolak.`;
      }
      if (sIdx === 5) {
        return `1. Murid menyusun simpulan terperinci hasil pembuktian data ilmiah tentang ${tMateri}.\n2. Murid mempresentasikan hasil penyelidikan ilmiah mereka secara lisan di depan kelas.\n3. Murid merefleksikan seluruh proses pembelajaran dan penyelidikan guna mewujudkan target ${tTP}.`;
      }
    }

    if (isCooperative) {
      if (sIdx === 0) {
        return `1. Murid mendengarkan dengan penuh konsentrasi target kompetensi ${tMateri} yang harus dikuasai melalui penjelasan guru.\n2. Murid menyiapkan kelengkapan belajar diri untuk mengikuti rangkaian aktivitas kooperatif.\n3. Murid merespons pertanyaan pemantik/apersepsi awal yang diantarkan pendidik.`;
      }
      if (sIdx === 1) {
        return `1. Murid mengamati pemaparan materi ${tMateri} yang ditayangkan lewat media pembelajaran ${tDigital}.\n2. Murid mencatat ringkasan poin-poin penting materi tersebut secara mandiri.\n3. Murid mengajukan pertanyaan klarifikasi jika terdapat konsep materi yang belum dipahami secara tuntas.`;
      }
      if (sIdx === 2) {
        return `1. Murid bergabung ke dalam kelompok belajar kooperatif (heterogen) di ${tLingkungan} sesuai arahan guru.\n2. Murid menentukan pembagian peran kerja spesifik bagi setiap anggota kelompok.\n3. Murid memahami instruksi kerja kelompok bertema ${tMateri} guna memenuhi kriteria strategi ${tStrategi}.`;
      }
      if (sIdx === 3) {
        return `1. Murid berdiskusi aktif mengerjakan lembar kerja kolaboratif menggunakan metode ${tMetode}.\n2. Murid bergotong-royong dan saling membantu memahami konsep materi ${tMateri} di dalam tim.\n3. Murid menyusun draf laporan hasil diskusi kelompok secara tertulis dan rapi.`;
      }
      if (sIdx === 4) {
        return `1. Murid mempresentasikan hasil kerja kelompok mereka secara bergantian dengan percaya diri.\n2. Murid memberikan tanggapan berupa apresiasi atau pertanyaan konstruktif terhadap kelompok lain.\n3. Murid merefleksikan dan memperbaiki hasil diskusi kelompok berdasarkan masukan positif.`;
      }
      if (sIdx === 5) {
        return `1. Murid menerima apresiasi lisan atau penghargaan khusus dari guru atas kinerja terbaik kelompoknya.\n2. Murid memberikan tepuk tangan atau apresiasi balik kepada kelompok lain yang sukses tampil.\n3. Murid termotivasi untuk terus bekerjasama mencapai tujuan pembelajaran: ${tTP}.`;
      }
    }

    if (isProblemSolving) {
      if (sIdx === 0) {
        return `1. Murid mengamati studi kasus nyata terkait ${tMateri} yang disajikan guru lewat media ${tDigital}.\n2. Murid mengidentifikasi penyebab timbulnya permasalahan tersebut di ${tLingkungan}.\n3. Murid menentukan fokus masalah esensial yang akan dicarikan jalan keluarnya secara berkelompok.`;
      }
      if (sIdx === 1) {
        return `1. Murid mengumpulkan informasi pelengkap terkait masalah menggunakan pendekatan ${tPendekatan}.\n2. Murid mendiskusikan faktor-faktor penting yang memengaruhi masalah melalui metode ${tMetode}.\n3. Murid mencatat dan memetakan draf hasil analisis masalah kelompok secara teratur.`;
      }
      if (sIdx === 2) {
        return `1. Murid mengemukakan beberapa ide gagasan solusi inovatif yang mungkin dapat diterapkan dalam memecahkan masalah ${tMateri}.\n2. Murid mendiskusikan perbandingan kelebihan, kekurangan, serta risiko dari masing-masing pilihan solusi.\n3. Murid menyusun draf dokumen daftar urutan alternatif solusi kelompok.`;
      }
      if (sIdx === 3) {
        return `1. Murid membandingkan tingkat efektivitas dan kelayakan setiap opsi alternatif solusi bersandar pada strategi ${tStrategi}.\n2. Murid merumuskan dan menentukan solusi terbaik yang dinilai paling efisien berkelompok.\n3. Murid menyepakati keputusan solusi terpilih tersebut bersama seluruh anggota kelompok.`;
      }
      if (sIdx === 4) {
        return `1. Murid mencoba menerapkan konsep tindakan solusi secara nyata pada studi kasus ${tMateri}.\n2. Murid mencatat perkembangan dan respons dari hasil pelaksanaan tindakan solusi di lingkungan ${tLingkungan}.\n3. Murid bekerjasama secara sinergis dalam menuntaskan penyelesaian masalah.`;
      }
      if (sIdx === 5) {
        return `1. Murid menilai keberhasilan dan dampak dari solusi yang telah dijalankan kelompok.\n2. Murid mengidentifikasi sisa kendala atau hambatan baru yang sekiranya masih muncul.\n3. Murid menyusun draf rekomendasi perbaikan solusi demi mencapai target pembelajaran: ${tTP}.`;
      }
    }

    if (isExperiential) {
      if (sIdx === 0) {
        return `1. Murid mengikuti kegiatan praktik, simulasi langsung, atau petualangan belajar di lingkungan sekitar ${tLingkungan}.\n2. Murid mengobservasi secara aktif seluruh proses kejadian yang berlangsung selama eksperimen nyata.\n3. Murid mencatat detail pengalaman berharga yang diperoleh dengan pendekatan ${tPendekatan}.`;
      }
      if (sIdx === 1) {
        return `1. Murid menceritakan kembali secara tertulis atau lisan mengenai petualangan pengalaman yang dialami.\n2. Murid mengidentifikasi hal menarik atau momen penting dari aktivitas pembelajaran ${tMateri} yang sudah dikerjakannya.\n3. Murid mendiskusikan hasil refleksi pengamatan pribadi mereka bersama teman kelompok menggunakan metode ${tMetode}.`;
      }
      if (sIdx === 2) {
        return `1. Murid menghubungkan fakta pengalaman nyata yang didapatkan dengan konsep atau teori ilmiah ${tMateri}.\n2. Murid menemukan prinsip mendasar, hakikat, atau aturan umum yang menjelaskan fenomena tersebut.\n3. Murid menyusun peta konsep atau pemahaman baru yang bermakna berdasarkan strategi ${tStrategi}.`;
      }
      if (sIdx === 3) {
        return `1. Murid mencoba menerapkan pemahaman dan konsep baru tersebut dalam memecahkan situasi teka-teki lain lewat bantuan ${tDigital}.\n2. Murid melakukan praktik lanjutan secara mandiri untuk mengasah keterampilan nyata mereka.\n3. Murid mengevaluasi dampak efektivitas penerapan konsep baru tersebut dalam menyelesaikan tugas meluas guna mewujudkan target ${tTP}.`;
      }
    }

    if (isFlipped) {
      if (sIdx === 0) {
        return `1. Murid menyimak materi pelajaran ${tMateri} secara mandiri di rumah melalui video pembelajaran interaktif ${tDigital} sebelum kelas dimulai.\n2. Murid membaca rangkuman materi atau bahan ajar secara mandiri di rumah.\n3. Murid mencatat pertanyaan krusial mengenai konsep yang dirasa masih sulit atau belum dipahami.`;
      }
      if (sIdx === 1) {
        return `1. Murid mengajukan pertanyaan terarah terkait konsep materi mandiri yang sempat dipelajari di rumah.\n2. Murid berdiskusi aktif dengan guru serta teman sekelas guna memperoleh kejelasan konsep.\n3. Murid mengklarifikasi pemahaman teoretis yang masih keliru di bawah bimbingan guru dengan pendekatan ${tPendekatan}.`;
      }
      if (sIdx === 2) {
        return `1. Murid bekerja kolaboratif dalam kelompok kecil untuk menyelesaikan lembar kerja praktik di kelas ${tLingkungan}.\n2. Murid memecahkan tantangan tugas terapan atau analisis studi kasus yang diberikan secara tim.\n3. Murid membagikan gagasan orisinal, ide solusi, dan curah pendapat bersama teman sesuai strategi ${tStrategi}.`;
      }
      if (sIdx === 3) {
        return `1. Murid menyampaikan paparan hasil diskusi dan kesepakatan kelompok menggunakan metode ${tMetode} di depan kelas.\n2. Murid menjelaskan logika berpikir, alasan, atau rincian langkah pengerjaan tugas kelompok mereka.\n3. Murid menanggapi secara santun setiap masukan konstruktif atau sanggahan dari kelompok lain.`;
      }
      if (sIdx === 4) {
        return `1. Murid menuliskan simpulan esensial mengenai konsep paling bermakna yang dipelajari hari ini.\n2. Murid mengevaluasi pemahaman mereka sendiri terhadap penguasaan kompetensi materi ${tMateri}.\n3. Murid menyusun draf rencana aksi perbaikan belajar mandiri untuk memperkuat penguasaan kompetensi demi meraih target: ${tTP}.`;
      }
    }

    if (isDirect) {
      if (sIdx === 0) {
        return `1. Murid mendengarkan penjelasan guru mengenai target tujuan pembelajaran ${tMateri} secara saksama.\n2. Murid mendata kompetensi kognitif atau psikomotorik yang wajib dikuasai di akhir sesi.\n3. Murid menyiapkan seluruh peralatan belajar dan instrumen yang diperlukan di lingkungan ${tLingkungan}.`;
      }
      if (sIdx === 1) {
        return `1. Murid mengamat demonstrasi atau contoh pengerjaan tugas yang diberikan guru langkah demi langkah menggunakan alat peraga atau media ${tDigital}.\n2. Murid menyalin dan merangkum urutan langkah-langkah prosedural penting secara cermat.\n3. Murid mengajukan pertanyaan klarifikasi mengenai detail teknik demonstrasi tersebut.`;
      }
      if (sIdx === 2) {
        return `1. Murid meniru langkah pengerjaan bersama-sama di bawah panduan intensif dari guru menggunakan pendekatan ${tPendekatan}.\n2. Murid mencoba menyelesaikan beberapa soal latihan bertahap menggunakan bimbingan langsung.\n3. Murid memperbaiki kesalahan taktis pengerjaan berdasarkan asistensi atau arahan guru.`;
      }
      if (sIdx === 3) {
        return `1. Murid menjawab umpan balik kuis cepat atau soal spontan yang diajukan oleh guru terkait materi ${tMateri}.\n2. Murid menunjukkan draf hasil latihan mandiri mereka yang sedang berjalan untuk divalidasi.\n3. Murid menerima umpan balik korektif dan penjelasan penguatan materi dari guru.`;
      }
      if (sIdx === 4) {
        return `1. Murid mengerjakan lembar kerja secara mandiri dan disiplin guna mematangkan pembiasaan lewat metode ${tMetode}.\n2. Murid menerapkan konsep yang terserap dalam pengerjaan beragam tingkat kesulitan tugas bersandar pada strategi ${tStrategi}.\n3. Murid mengumpulkan lembar portofolio hasil kerja mandiri mereka kepada guru untuk dievaluasi demi target ${tTP}.`;
      }
    }

    if (isCTL) {
      if (sIdx === 0) {
        return `1. Murid menghubungkan topik materi pelajaran baru ${tMateri} dengan pengetahuan awal dan pengalaman hidup sehari-hari secara rasional.\n2. Murid mengemukakan pengetahuan awal atau persepsi yang berkembang di lingkungannya tentang materi.\n3. Murid membangun pemahaman konsep baru yang kokoh berdasarkan jembatan pengalaman riil tersebut menggunakan pendekatan ${tPendekatan}.`;
      }
      if (sIdx === 1) {
        return `1. Murid melakukan proses penemuan (inquiry) secara mandiri atau kolaboratif di lingkungan ${tLingkungan}.\n2. Murid mengobservasi secara langsung stimulus masalah kontekstual yang disajikan memanfaatkan ${tDigital}.\n3. Murid menemukan secara mandiri konsep esensial dari penelaahan data tersebut.`;
      }
      if (sIdx === 2) {
        return `1. Murid mengajukan pertanyaan untuk menggali informasi lebih dalam dan menjawab pertanyaan teman atau guru.\n2. Murid memberikan jawaban atas pertanyaan pemancing yang ditanyakan oleh guru.\n3. Murid memperdalam pemahaman rasional konsep materi melalui aktivitas tanya jawab dua arah.`;
      }
      if (sIdx === 3) {
        return `1. Murid berpasangan dalam kelompok masyarakat belajar untuk memecahkan masalah bersama menggunakan metode ${tMetode}.\n2. Murid saling berbagi modalitas pengalaman, keahlian, dan informasi guna memecahkan ketidaktahuan.\n3. Murid berkolaborasi menuntaskan lembar pemecahan masalah bertema ${tMateri} bersandar pada kontribusi tim sesuai strategi ${tStrategi}.`;
      }
      if (sIdx === 4) {
        return `1. Murid mengamati contoh penerapan nyata dari konsep ${tMateri} yang sedang dipelajari baik melalui guru maupun perwakilan teman.\n2. Murid menirukan dan menerapkan langkah/pola sukses pemodelan yang dicontohkan tersebut secara saksama demi menggapai target: ${tTP}.`;
      }
    }

    // Default Fallback suggest based on index
    if (sIdx === 0) {
      return `1. Murid diperkenalkan pada materi ${tMateri} melalui tayangan edukatif di ${tDigital}.\n2. Murid mengobservasi kondisi riil di ${tLingkungan} serta merumuskan pertanyaan penting dengan bimbingan pendidik.`;
    } else if (sIdx === 1) {
      return `1. Murid berdiskusi aktif dalam kelompok dengan menerapkan pendekatan ${tPendekatan} dan strategi ${tStrategi}.\n2. Murid menggunakan metode ${tMetode} untuk memecahkan penugasan kelompok bertema ${tMateri}.`;
    } else {
      return `1. Murid secara bergiliran menyajikan hasil diskusi mereka di depan kelas.\n2. Murid mengevaluasi pemecahan masalah bersama guru dan menarik kesimpulan komprehensif demi memenuhi target ${tTP}.`;
    }
  };

  const getPrefixText = (type: string) => {
    switch (type) {
      case 'pendekatan':
        return `Melalui pendekatan ${pendekatan || '[Pendekatan]'}, `;
      case 'model':
        return `Melalui model ${model || '[Model]'}, `;
      case 'strategi':
        return `Melalui strategi ${strategi || '[Strategi]'}, `;
      case 'media':
        return `Melalui pemanfaatan media ${digital || '[Media Digital]'}, `;
      case 'metode':
        const methodStr = Array.isArray(metode) ? metode.join(', ') : (metode || '[Metode]');
        return `Melalui metode ${methodStr}, `;
      case 'combined_model_media':
        const cleanModel = model ? model.replace(/\s*\(PBL\)|\s*\(PjBL\)/gi, '') : '[Model]';
        return `Melalui penerapan model ${cleanModel} dan pemanfaatan media ${digital || '[Media Digital]'}, `;
      case 'combined_pendekatan_model':
        const cleanModel2 = model ? model.replace(/\s*\(PBL\)|\s*\(PjBL\)/gi, '') : '[Model]';
        return `Melalui pendekatan ${pendekatan || '[Pendekatan]'} dan penerapan model ${cleanModel2}, `;
      default:
        return `Melalui pendekatan ${pendekatan || '[Pendekatan]'} dan pemanfaatan media ${digital || '[Media Digital]'}, `;
    }
  };

  useEffect(() => {
    if (selectedGoalIndex !== null) {
      setTempMateri(topic || '');
    }
  }, [selectedGoalIndex, topic]);

  useEffect(() => {
    if (selectedGoalIndex !== null) {
      const prefix = getPrefixText(tempPrefixType);
      const targetMaterial = tempMateri ? `materi ${tempMateri}` : '[materi]';
      setCustomGeneratedText(`${prefix}murid dapat ${tempKko} ${targetMaterial} ${tempDegree}`);
    }
  }, [selectedGoalIndex, tempPrefixType, tempKko, tempMateri, tempDegree, pendekatan, model, strategi, metode, digital]);

  // Load from Supabase (fallback to local storage)
  useEffect(() => {
    const loadPlans = async () => {
      let loadedPlans: LearningPlan[] = [];
      
      const saved = localStorage.getItem('sagara_learning_plans');
      if (saved) {
        try {
          loadedPlans = JSON.parse(saved).filter((p: any) => p && p.id !== 'plan-1');
        } catch (e) {
          loadedPlans = [];
        }
      } else {
        localStorage.setItem('sagara_learning_plans', JSON.stringify([]));
      }
      setPlans(loadedPlans);

      if (apiService.isConfigured()) {
        try {
          const dbPlans = await apiService.getLearningPlans();
          if (dbPlans && dbPlans.length > 0) {
            const filtered = dbPlans.filter((p: any) => p && p.id !== 'plan-1');
            setPlans(filtered);
            localStorage.setItem('sagara_learning_plans', JSON.stringify(filtered));
          } else if (dbPlans && dbPlans.length === 0 && !saved) {
            // Seed defaults to database if empty
            for (const p of DEFAULT_PLANS) {
              try {
                await apiService.saveLearningPlan(p);
              } catch (err) {
                console.error("Failed to seed default plan to DB:", err);
              }
            }
            const syncedPlans = await apiService.getLearningPlans();
            const filteredSynced = syncedPlans.filter((p: any) => p && p.id !== 'plan-1');
            setPlans(filteredSynced);
            localStorage.setItem('sagara_learning_plans', JSON.stringify(filteredSynced));
          }
        } catch (err) {
          console.warn("Supabase not fully migrated or empty, loaded from localStorage:", err);
        }
      }
    };
    loadPlans();
  }, []);

  // Synchronize subjects from the database schedule
  useEffect(() => {
    const loadScheduleSubjects = async () => {
      if (!classId) return;
      try {
        const scheduleData = await apiService.getSchedule(classId);
        if (scheduleData && scheduleData.length > 0) {
          const uniqueSubjects = Array.from(
            new Set<string>(
              scheduleData
                .map(item => item.subject?.trim())
                .filter(Boolean)
            )
          );
          setScheduleSubjects(uniqueSubjects);
        } else {
          setScheduleSubjects([]);
        }
      } catch (err) {
        console.error("Error loading schedule subjects:", err);
      }
    };
    loadScheduleSubjects();
  }, [classId]);

  // Update profile variables if profile is loaded
  useEffect(() => {
    if (editingId) return; // Don't overwrite when editing an existing plan
    
    if (schoolProfile) {
      setSchoolName(schoolProfile.name || 'UPT SD Negeri Remen 2');
      if (schoolProfile.year) {
        setAcademicYear(schoolProfile.year);
      }
    }
    if (teacherProfile) {
      setCompiler(teacherProfile.name || '');
      setNip(teacherProfile.nip || '');
    } else if (currentUser) {
      setCompiler(currentUser.fullName || '');
      setNip(currentUser.nip || '');
    }

    // Automatically set Class/Semester/Fase
    const autoInfo = autoClassSemesterPlusFase();
    setClassSemester(autoInfo.display);
  }, [schoolProfile, teacherProfile, currentUser, classId, editingId]);

  // Trigger templates when Subject or Phase updates (with phase-aware lookup)
  useEffect(() => {
    if (editingId) return; // Don't overwrite saved CP when editing
    
    const currentPhase = autoClassSemesterPlusFase().fase; // e.g., 'Fase A', 'Fase B', 'Fase C'
    const phaseTemplates = CP_TEMPLATES[currentPhase] || CP_TEMPLATES['Fase C'];

    if (phaseTemplates[subject]) {
      setCapaianPembelajaran(phaseTemplates[subject]);
    } else {
      const matchedKey = Object.keys(phaseTemplates).find(k => 
        subject.toLowerCase().includes(k.toLowerCase()) || 
        k.toLowerCase().includes(subject.toLowerCase())
      );
      if (matchedKey) {
        setCapaianPembelajaran(phaseTemplates[matchedKey]);
      } else {
        const fallbacks: Record<string, string> = {
          'Fase A': 'Memahami materi pembelajaran di Fase A secara dasar melalui bimbingan guru dan kegiatan eksplorasi terbimbing.',
          'Fase B': 'Menganalisis konsep-konsep materi di Fase B secara mandiri and mampu menerapkannya dalam pemecahan masalah sederhana.',
          'Fase C': 'Merefleksikan dan mengevaluasi pemahaman materi di Fase C secara kritis serta mampu menghasilkan karya kreatif sebagai bukti penguasaan kompetensi.'
        };
        const fallbackMsg = fallbacks[currentPhase] || fallbacks['Fase C'];
        setCapaianPembelajaran(`${fallbackMsg} (Mata Pelajaran: ${subject})`);
      }
    }
  }, [subject, classId, editingId]);



  const savePlansToStorage = (newPlans: LearningPlan[]) => {
    setPlans(newPlans);
    localStorage.setItem('sagara_learning_plans', JSON.stringify(newPlans));
  };

  // Metode checkbox toggler
  const handleToggleMetode = (option: string) => {
    if (metode.includes(option)) {
      setMetode(metode.filter(m => m !== option));
    } else {
      setMetode([...metode, option]);
    }
  };

  // Dimension checkbox toggler
  const handleToggleDimension = (dim: string) => {
    if (selectedDimensions.includes(dim)) {
      setSelectedDimensions(selectedDimensions.filter(d => d !== dim));
    } else {
      setSelectedDimensions([...selectedDimensions, dim]);
    }
  };

  // Helper arrays for multi-inputs
  const handleAddGoal = () => setGoalsInput([...goalsInput, '']);
  const handleRemoveGoal = (idx: number) => {
    if (goalsInput.length > 1) {
      setGoalsInput(goalsInput.filter((_, i) => i !== idx));
    }
  };
  const handleGoalChange = (idx: number, val: string) => {
    const next = [...goalsInput];
    next[idx] = val;
    setGoalsInput(next);
  };

  const handleAddAwal = () => setAwalInput([...awalInput, '']);
  const handleRemoveAwal = (idx: number) => {
    if (awalInput.length > 1) {
      setAwalInput(awalInput.filter((_, i) => i !== idx));
    }
  };
  const handleAwalChange = (idx: number, val: string) => {
    const next = [...awalInput];
    next[idx] = val;
    setAwalInput(next);
  };

  const handleIntiDescChange = (idx: number, val: string) => {
    const next = [...intiInput];
    // Check if it already has a label
    if (extractLabel(val).label) {
       next[idx].description = val;
    } else {
       // Prepend old label if it was present
       const { label } = extractLabel(next[idx].description);
       next[idx].description = label ? `[${label}] ${val}` : val;
    }
    setIntiInput(next);
  };

  const handleAddPenutup = () => setPenutupInput([...penutupInput, '']);
  const handleRemovePenutup = (idx: number) => {
    if (penutupInput.length > 1) {
      setPenutupInput(penutupInput.filter((_, i) => i !== idx));
    }
  };
  const handlePenutupChange = (idx: number, val: string) => {
    const next = [...penutupInput];
    next[idx] = val;
    setPenutupInput(next);
  };

  const handleResetForm = () => {
    setEditingId(null);
    setTopic('');
    
    // Automatically set Class/Semester/Fase and other defaults on reset
    const autoInfo = autoClassSemesterPlusFase();
    setClassSemester(autoInfo.display);
    
    if (schoolProfile) {
      setSchoolName(schoolProfile.name || 'UPT SD Negeri Remen 2');
      if (schoolProfile.year) {
        setAcademicYear(schoolProfile.year);
      }
    }
    if (teacherProfile) {
      setCompiler(teacherProfile.name || '');
      setNip(teacherProfile.nip || '');
    } else if (currentUser) {
      setCompiler(currentUser.fullName || '');
      setNip(currentUser.nip || '');
    }

    setTimeAllocation('2 JP (2 x 35 Menit)');
    setDurasiAwal(10);
    setDurasiInti(50);
    setDurasiPenutup(10);
    setKegiatanAwalTitle('Kegiatan Awal (Kesan dan Bermakna)');
    setKegiatanIntiTitle('Kegiatan Inti');
    setKegiatanPenutupTitle('Kegiatan Penutup (Berkesadaran)');
    setStudentCharacteristics('Murid dengan karakteristik beragam (Audio, Visual, Kinestetik), minat yang bervariasi.');
    setSelectedDimensions([]);
    setCapaianPembelajaran('');
    setGoalsInput(['']);
    setPendekatan('Diferensiasi');
    setPendekatanReason('');
    setModel('Problem Based Learning (PBL)');
    setModelReason('');
    setStrategi('Active Learning');
    setStrategiReason('');
    setMetode(['Diskusi']);
    setMetodeReason('');
    setLintasDisiplin('');
    setMitra('');
    setDigital('');
    setLingkungan('');
    setAwalInput([
      'Guru mengucapkan salam, berdoa, dan mengecek kehadiran murid.',
      'Guru mengajak murid menyanyikan lagu wajib "Indonesia Raya".',
      'Guru melakukan apersepsi {sesuaikan dengan materi} dan guru menggali pengalaman murid terkait materi yang akan diajarkan dengan mengajukan pertanyaan pemantik:\n1. [Isi sesuaikan dengan materi]',
      'Guru menyampaikan tujuan pembelajaran hari ini, yaitu:\n1. [sesuaikan dengan Tujuan pembelajaran]',
      'Guru memberikan motivasi dengan menjelaskan relevansi materi terhadap kehidupan sehari-hari dan menyampaikan garis besar kegiatan yang akan dilakukan selama proses pembelajaran menggunakan [sesuai dengan model pembelajaran]'
    ]);
    setIntiInput(JSON.parse(JSON.stringify(MODEL_SINTAKS_TEMPLATES['Problem Based Learning (PBL)'] || [])));
    setPenutupInput([
      'Evaluasi dan Refleksi: Murid bersama guru menyimpulkan hasil pemecahan masalah terkait [sesuaikan dengan materi], kemudian murid melakukan refleksi terhadap proses pembelajaran yang telah dilakukan dengan mengungkapkan perasaan serta hambatan yang dialami selama diskusi kelompok.',
      'Apresiasi dan Umpan Balik: Guru memberikan apresiasi atas partisipasi aktif murid dalam [sesuai dengan kegiatan pembelajaran] yang disajikan, serta memberikan umpan balik konstruktif terhadap hasil presentasi yang telah dipaparkan oleh masing-masing kelompok.',
      'Tindak Lanjut dan Penutup: Murid mendapatkan informasi mengenai rencana pembelajaran pada pertemuan berikutnya, kemudian kegiatan diakhiri dengan doa bersama and salam penutup sebagai bentuk syukur atas kelancaran proses belajar.'
    ]);
    setAsesmenAwal('Pertanyaan pemantik lisan, Kuis singkat (Diagnostik Kognitif)');
    setAsesmenProses('Observasi Profil Lulusan, Kinerja Kelompok');
    setAsesmenAkhir('Tes Sumatif (Soal Evaluasi / Rubrik Produk)');
    setCustomCreatedDate(new Date().toISOString().split('T')[0]);
    setSelectedGoalIndex(null);
  };

  const handleEdit = (plan: LearningPlan) => {
    setEditingId(plan.id);
    setSchoolName(plan.schoolName);
    setTempatPengesahan(plan.tempatPengesahan || '');
    setCompiler(plan.compiler);
    setNip(plan.nip);
    setSubject(plan.subject);
    setTopic(plan.topic);
    setClassSemester(plan.classSemester);
    setAcademicYear(plan.academicYear);
    setTimeAllocation(plan.timeAllocation);
    setStudentCharacteristics(plan.studentCharacteristics);
    setSelectedDimensions(plan.profileDimensions || []);
    setCapaianPembelajaran(plan.capaianPembelajaran);
    setGoalsInput(plan.learningGoals || ['']);
    setPendekatan(plan.pendekatan);
    setPendekatanReason(plan.pendekatanReason);
    setModel(plan.model);
    setModelReason(plan.modelReason);
    setStrategi(plan.strategi);
    setStrategiReason(plan.strategiReason);
    setMetode(Array.isArray(plan.metode) ? plan.metode : [plan.metode]);
    setMetodeReason(plan.metodeReason);
    setLintasDisiplin(plan.lintasDisiplin);
    setMitra(plan.mitra);
    setDigital(plan.digital);
    setLingkungan(plan.lingkungan);
    setAwalInput(plan.kegiatanAwal || ['']);
    setIntiInput(plan.kegiatanInti || []);
    setPenutupInput(plan.kegiatanPenutup || ['']);
    setKegiatanAwalTitle(plan.kegiatanAwalTitle || 'Kegiatan Awal (Kesan dan Bermakna)');
    setAttachments(plan.attachments || []);
    setKegiatanIntiTitle(plan.kegiatanIntiTitle || 'Kegiatan Inti');
    setKegiatanPenutupTitle(plan.kegiatanPenutupTitle || 'Kegiatan Penutup (Berkesadaran)');

    const loadedTotal = parseTotalMinutes(plan.timeAllocation);
    const loadedAwal = plan.durasiAwal !== undefined && plan.durasiAwal > 0 ? plan.durasiAwal : (loadedTotal === 35 ? 5 : loadedTotal >= 140 ? 15 : 10);
    const loadedPenutup = plan.durasiPenutup !== undefined && plan.durasiPenutup > 0 ? plan.durasiPenutup : (loadedTotal === 35 ? 5 : loadedTotal >= 140 ? 15 : 10);
    const loadedInti = plan.durasiInti !== undefined && plan.durasiInti > 0 ? plan.durasiInti : (Math.max(0, loadedTotal - loadedAwal - loadedPenutup) || 50);
    setDurasiAwal(loadedAwal);
    setDurasiInti(loadedInti);
    setDurasiPenutup(loadedPenutup);

    setAsesmenAwal(plan.asesmenAwal);
    setAsesmenProses(plan.asesmenProses);
    setAsesmenAkhir(plan.asesmenAkhir);
    setCustomCreatedDate(plan.createdDate || plan.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0]);
    
    setCurrentTab('form');
  };

  const handleSync = async (plan: LearningPlan) => {
    try {
      showConfirm('Apakah Anda yakin ingin mensinkronkan rencana pembelajaran ini ke Laporan Pembelajaran secara otomatis?', async () => {
        const dateStr = plan.createdDate || (plan.createdAt ? plan.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]);
        
        const reportData = {
          classId: classId,
          schoolId: schoolProfile?.npsn || '',
          date: dateStr,
          type: 'RPP/Modul Ajar' as const,
          subject: plan.subject,
          topic: plan.topic,
          documentLink: '',
          teacherName: plan.compiler || currentUser?.fullName || 'Guru Kelas'
        };

        if (onSyncReport) {
          await onSyncReport(reportData);
          onShowNotification('Berhasil mensinkronkan rencana pembelajaran ke Laporan Pembelajaran.', 'success');
        } else {
          if (apiService.isConfigured()) {
            await apiService.saveLearningReport(reportData as any);
          } else {
            const existing = localStorage.getItem('sagara_learning_reports');
            const reports = existing ? JSON.parse(existing) : [];
            reports.push({
              id: `report-${Date.now()}`,
              ...reportData
            });
            localStorage.setItem('sagara_learning_reports', JSON.stringify(reports));
          }
          onShowNotification('Berhasil mensinkronkan rencana pembelajaran ke Laporan Pembelajaran.', 'success');
        }
      });
    } catch (error) {
      console.error(error);
      onShowNotification('Gagal mensinkronkan ke Laporan Pembelajaran.', 'error');
    }
  };

  const handleDelete = (id: string) => {
    showConfirm('Apakah Anda yakin ingin menghapus rencana pembelajaran ini?', async () => {
      const next = plans.filter(p => p.id !== id);
      setPlans(next);
      localStorage.setItem('sagara_learning_plans', JSON.stringify(next));

      if (apiService.isConfigured()) {
        try {
          await apiService.deleteLearningPlan(id);
          onShowNotification('Rencana pembelajaran berhasil dihapus', 'success');
        } catch (err) {
          console.error("Failed to delete from database:", err);
          onShowNotification('Berhasil dihapus secara lokal (sinkronisasi database gagal)', 'warning');
        }
      } else {
        onShowNotification('Rencana pembelajaran berhasil dihapus', 'success');
      }
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      showAlert('Harap isi materi pokok!', 'error');
      return;
    }

    const targetId = editingId || 'plan-' + Date.now();

    const planData: LearningPlan = {
      id: targetId,
      schoolName,
      tempatPengesahan,
      compiler,
      nip,
      subject,
      topic,
      classSemester,
      academicYear,
      timeAllocation,
      studentCharacteristics,
      profileDimensions: selectedDimensions,
      capaianPembelajaran,
      learningGoals: goalsInput.filter(g => g.trim() !== ''),
      pendekatan,
      pendekatanReason,
      model,
      modelReason,
      strategi,
      strategiReason,
      metode,
      metodeReason,
      lintasDisiplin,
      mitra,
      digital,
      lingkungan,
      kegiatanAwal: awalInput.filter(x => x.trim() !== ''),
      kegiatanInti: intiInput,
      kegiatanPenutup: penutupInput.filter(x => x.trim() !== ''),
      kegiatanAwalTitle,
      kegiatanIntiTitle,
      kegiatanPenutupTitle,
      durasiAwal,
      durasiInti,
      durasiPenutup,
      asesmenAwal,
      asesmenProses,
      asesmenAkhir,
      attachments,
      createdDate: customCreatedDate,
      createdAt: new Date(customCreatedDate + 'T12:00:00').toISOString()
    };

    let nextPlans = [...plans];
    if (editingId) {
      nextPlans = nextPlans.map(p => p.id === editingId ? planData : p);
    } else {
      nextPlans.unshift(planData);
    }

    setPlans(nextPlans);
    localStorage.setItem('sagara_learning_plans', JSON.stringify(nextPlans));

    if (apiService.isConfigured()) {
      try {
        await apiService.saveLearningPlan(planData);
        onShowNotification(editingId ? 'Rencana pembelajaran berhasil diperbarui' : 'Rencana pembelajaran berhasil disimpan', 'success');
      } catch (err) {
        console.error("Failed to sync save to database:", err);
        onShowNotification('Rencana tersimpan secara lokal (gagal sinkronisasi ke database)', 'warning');
      }
    } else {
      onShowNotification(editingId ? 'Rencana pembelajaran berhasil diperbarui (lokal)' : 'Rencana pembelajaran berhasil disimpan (lokal)', 'success');
    }

    setCurrentTab('dashboard');
    handleResetForm();
  };
  const getRPM_HTML = (plan: LearningPlan) => {
    const totalMin = parseTotalMinutes(plan.timeAllocation || '');
    let defaultDurAwal = 10;
    let defaultDurPenutup = 10;
    let defaultDurInti = 50;
    if (totalMin > 0) {
      defaultDurAwal = totalMin === 35 ? 5 : totalMin >= 140 ? 15 : 10;
      defaultDurPenutup = totalMin === 35 ? 5 : totalMin >= 140 ? 15 : 10;
      defaultDurInti = Math.max(0, totalMin - defaultDurAwal - defaultDurPenutup);
    }
    const durAwal = plan.durasiAwal !== undefined && plan.durasiAwal > 0 ? plan.durasiAwal : defaultDurAwal;
    const durInti = plan.durasiInti !== undefined && plan.durasiInti > 0 ? plan.durasiInti : defaultDurInti;
    const durPenutup = plan.durasiPenutup !== undefined && plan.durasiPenutup > 0 ? plan.durasiPenutup : defaultDurPenutup;

    const titleAwal = plan.kegiatanAwalTitle || 'Kegiatan Awal (Kesan dan Bermakna)';
    const titleInti = plan.kegiatanIntiTitle || `Kegiatan Inti (${plan.model})`;
    const titlePenutup = plan.kegiatanPenutupTitle || 'Kegiatan Penutup (Berkesadaran)';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Rencana Pembelajaran Mendalam (RPM)</title>
        <style>
          @page {
            size: A4;
            margin: 0;
          }
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            font-size: 11pt;
            line-height: 1.5;
            color: #0f172a;
            padding: 0;
            margin: 0;
            width: 100%;
            background: white;
          }
          .content-wrapper {
            width: 800px;
            margin: 0 auto;
            padding: 15mm;
            box-sizing: border-box;
          }
          p, li, div {
            margin: 0;
            padding: 0;
          }
          ol, ul {
            margin: 0 0 5px 0;
            padding-left: 25px;
          }
          h2 {
            text-align: center;
            font-size: 14pt;
            text-transform: uppercase;
            font-weight: bold;
            margin: 0 0 5px 0;
            color: #0f172a;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            margin-bottom: 15px;
          }
          tr {
            page-break-inside: avoid !important;
          }
          td {
            word-wrap: break-word !important;
            vertical-align: top;
          }
          .meta-table td {
            padding: 3px;
            font-size: 10pt;
          }
          .main-table {
            border: 1.5pt solid #000;
          }
          .main-table td {
            border: 1pt solid #000;
            padding: 8px;
            font-size: 9.5pt;
          }
          .col-label {
            width: 25%;
            font-weight: bold;
            text-transform: uppercase;
            text-align: center;
            background-color: #f8fafc;
            color: #0f172a;
          }
          .signature-section {
            page-break-inside: avoid !important;
            margin-top: 25px;
          }
          .signature-table td {
            width: 50%;
            text-align: center;
            font-size: 10pt;
            padding: 10px;
          }
          .fase-box {
            border-left: 3px solid #e2e8f0;
            padding-left: 10px;
            margin-bottom: 8px;
            page-break-inside: avoid !important;
          }
          .bg-slate { background-color: #F8FAFC; border: 1px solid #E2E8F0; padding: 6px; }
          .text-blue { color: #1E3A8A; font-weight: bold; }
          .pedagogis-table, .pedagogis-table td, .pedagogis-td {
            border: none !important;
          }
        </style>
      </head>
      <body>
        <div class="content-wrapper">
          <div style="text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 15px;">
            <div style="font-size: 13.5pt; font-weight: bold; text-transform: uppercase; color: #0f172a; letter-spacing: 0.05em; line-height: 1;">RENCANA PEMBELAJARAN MENDALAM</div>
            <div style="font-size: 9pt; font-weight: 500; color: #475569; margin-top: 2px;">${plan.model || 'Problem Based Learning (PBL)'}</div>
          </div>

        <table class="meta-table">
          <tr>
            <td class="meta-label" style="width: 18%;">Nama Sekolah</td>
            <td style="width: 2%; text-align: center;">:</td>
            <td style="width: 30%;">${plan.schoolName}</td>
            <td class="meta-label" style="width: 18%;">Materi Pokok</td>
            <td style="width: 2%; text-align: center;">:</td>
            <td style="width: 30%;">${plan.topic}</td>
          </tr>
          <tr>
            <td class="meta-label">Nama Penyusun</td>
            <td style="text-align: center;">:</td>
            <td>${plan.compiler}</td>
            <td class="meta-label">Kelas/Semester</td>
            <td style="text-align: center;">:</td>
            <td>${plan.classSemester}</td>
          </tr>
          <tr>
            <td class="meta-label">NIP</td>
            <td style="text-align: center;">:</td>
            <td>${plan.nip || '-'}</td>
            <td class="meta-label">Tahun Ajaran</td>
            <td style="text-align: center;">:</td>
            <td>${plan.academicYear}</td>
          </tr>
          <tr>
            <td class="meta-label">Mata Pelajaran</td>
            <td style="text-align: center;">:</td>
            <td class="text-blue">${plan.subject}</td>
            <td class="meta-label">Alokasi Waktu</td>
            <td style="text-align: center;">:</td>
            <td>${plan.timeAllocation}</td>
          </tr>
        </table>

        <table class="main-table">
          <tr>
            <td class="col-label">Identifikasi</td>
            <td class="col-value">
              <div style="margin-bottom: 10px;">
                <p style="font-weight: bold; color: #334155; margin-bottom: 4px; font-size: 10pt;">Murid:</p>
                <p class="bg-slate" style="font-size: 10pt;">${plan.studentCharacteristics?.replace(/\n/g, '<br/>')}</p>
              </div>
              <div>
                <p style="font-weight: bold; color: #334155; margin-bottom: 6px; font-size: 10pt;">Dimensi Profil Lulusan:</p>
                <table style="width: 100%; border-collapse: collapse; border: none; margin-top: 5px; table-layout: fixed;" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    ${DIMENSIONS.slice(0, 4).map(dim => `
                      <td style="font-size: 8.5pt; width: 25%; border: none; padding-bottom: 5px; vertical-align: top;">
                        <span style="font-size: 10pt;">${plan.profileDimensions?.includes(dim) ? '☑' : '☐'}</span>
                        <span style="margin-left: 2px;">${dim}</span>
                      </td>
                    `).join('')}
                  </tr>
                  <tr>
                    ${DIMENSIONS.slice(4, 8).map(dim => `
                      <td style="font-size: 8.5pt; width: 25%; border: none; padding-bottom: 5px; vertical-align: top;">
                        <span style="font-size: 10pt;">${plan.profileDimensions?.includes(dim) ? '☑' : '☐'}</span>
                        <span style="margin-left: 2px;">${dim}</span>
                      </td>
                    `).join('')}
                  </tr>
                </table>
              </div>
            </td>
          </tr>
        </table>

        <table class="main-table">
          <tr>
            <td class="col-label">Design Pembelajaran</td>
            <td class="col-value">
              <div style="margin-bottom: 10px;">
                <p style="font-weight: bold; color: #334155; margin-bottom: 4px; font-size: 10pt;">Capaian Pembelajaran:</p>
                <p style="text-align: justify; font-size: 10pt;">${plan.capaianPembelajaran?.replace(/\n/g, '<br/>')}</p>
              </div>
              <div style="margin-bottom: 10px;">
                <p style="font-weight: bold; color: #334155; margin-bottom: 4px; font-size: 10pt;">Tujuan Pembelajaran:</p>
                <ol style="font-size: 10pt; padding-left: 25px;">${plan.learningGoals?.map(goal => `<li>${goal}</li>`).join('')}</ol>
              </div>
              <div style="margin-bottom: 10px;">
                <p style="font-weight: bold; color: #334155; margin-bottom: 6px; font-size: 10pt;">Praktik Pedagogis:</p>
                <table class="pedagogis-table" style="width: 100%; border-collapse: collapse; border: none !important;">
                  <tr>
                    <td class="pedagogis-td" style="width: 50%; vertical-align: top; padding: 0 8px 0 0; font-size: 10pt; border: none !important;">
                      <div style="margin-bottom: 4px;"><strong style="color: #0f172a;">Pendekatan Pembelajaran:</strong></div>
                      <div style="color: #334155; margin-bottom: 8px;">${plan.pendekatan}</div>
                      <div style="margin-bottom: 4px;"><strong style="color: #0f172a;">Model Pembelajaran:</strong></div>
                      <div style="color: #334155;">${plan.model}</div>
                    </td>
                    <td class="pedagogis-td" style="width: 50%; vertical-align: top; padding: 0 0 0 8px; font-size: 10pt; border: none !important;">
                      <div style="margin-bottom: 4px;"><strong style="color: #0f172a;">Strategi Pembelajaran:</strong></div>
                      <div style="color: #334155; margin-bottom: 8px;">${plan.strategi}</div>
                      <div style="margin-bottom: 4px;"><strong style="color: #0f172a;">Metode Pembelajaran:</strong></div>
                      <div style="color: #334155;">${Array.isArray(plan.metode) ? plan.metode.join(', ') : plan.metode}</div>
                    </td>
                  </tr>
                </table>
              </div>
              <div>
                <p style="font-weight: bold; color: #334155; margin-bottom: 6px; font-size: 10pt;">Lintas Disiplin, Mitra, Digital & Lingkungan:</p>
                <table style="width: 100%; border-collapse: collapse; font-size: 9.5pt;" border="0">
                  <tr>
                    <td style="width: 50%; padding: 3px;"><div class="bg-slate"><b>Lintas:</b> ${plan.lintasDisiplin}</div></td>
                    <td style="width: 50%; padding: 3px;"><div class="bg-slate"><b>Mitra:</b> ${plan.mitra}</div></td>
                  </tr>
                  <tr>
                    <td colspan="2" style="padding: 3px;"><div class="bg-slate"><b>Digital:</b> ${plan.digital}</div></td>
                  </tr>
                  <tr>
                    <td colspan="2" style="padding: 3px;"><div class="bg-slate"><b>Lingkungan:</b> ${plan.lingkungan}</div></td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>
        </table>

        <table class="main-table">
          <tr>
            <td class="col-label">Pengalaman Pembelajaran</td>
            <td class="col-value">
              <div style="margin-bottom: 10px;">
                <p style="font-weight: bold; color: #334155; margin-bottom: 4px; font-size: 10pt;">${titleAwal} (${durAwal} Menit):</p>
                <ol style="font-size: 10pt; padding-left: 25px; text-align: justify;">${plan.kegiatanAwal?.map(item => {
                  const formatted = formatAktivitasAwalItemText(item, plan.learningGoals || []);
                  if (formatted.includes('§')) {
                    const parts = formatted.split('§');
                    const intro = parts[0];
                    const goals = parts.slice(1);
                    return `<li style="margin-bottom: 6px;">
                      <div style="white-space: normal;">${intro.replace(/\n/g, '<br/>')}</div>
                      <ol style="padding-left: 20px; margin-top: 4px;">
                        ${goals.map(goal => `<li style="padding-left: 5px;">${goal}</li>`).join('')}
                      </ol>
                    </li>`;
                  }
                  return `<li style="white-space: normal; margin-bottom: 6px;">${formatted.replace(/\n/g, '<br/>')}</li>`;
                }).join('')}</ol>
              </div>
              <div style="margin-bottom: 10px;">
                <p style="font-weight: bold; color: #334155; margin-bottom: 6px; font-size: 10pt;">${titleInti} (${durInti} Menit):</p>
                ${plan.kegiatanInti?.map((inti, index) => {
                      const match = inti.description.match(/^\s*\[(.*?)\]/);
                      const tag = match ? match[1] : '';
                      const cleanDescription = inti.description.replace(/^(\[.*?\])?\s*/, '');
                      return `
                        <div class="fase-box">
                          <p style="font-weight: bold; font-size: 10pt; color: #1e293b; margin-bottom: 2px;">
                            ${index + 1}. Fase ${index + 1}: ${inti.phase.replace(/^[A-Z]\.\s+/, '')}
                            ${tag ? `<span style="background: #e0f2fe; padding: 2px 6px; border-radius: 4px; font-size: 8pt; margin-left: 8px; color: #075985;">${tag}</span>` : ''}
                          </p>
                          <ol style="font-size: 10pt; color: #334155; padding-left: 25px; text-align: justify;">
                            ${cleanDescription.split('\n').filter(line => line.trim()).map(line => `<li>${line.replace(/^\d+[\s.)-]+\s*/, '').trim()}</li>`).join('')}
                          </ol>
                        </div>
                      `;
                    }).join('')}
              </div>
              <div>
                <p style="font-weight: bold; color: #334155; margin-bottom: 4px; font-size: 10pt;">${titlePenutup} (${durPenutup} Menit):</p>
                <ol style="font-size: 10pt; padding-left: 25px; text-align: justify;">${plan.kegiatanPenutup?.map(item => `<li style="white-space: normal; margin-bottom: 6px;">${item.replace(/\n/g, '<br/>')}</li>`).join('')}</ol>
              </div>
            </td>
          </tr>
        </table>

        <table class="main-table">
          <tr>
            <td class="col-label">Asesmen Pembelajaran</td>
            <td class="col-value">
              ${[
                { label: 'Asesmen Awal', value: plan.asesmenAwal },
                { label: 'Asesmen Proses', value: plan.asesmenProses },
                { label: 'Asesmen Akhir', value: plan.asesmenAkhir }
              ].map(item => `
                <div style="margin-bottom: 15px;">
                  <p style="font-weight: bold; margin-bottom: 5px; font-size: 10pt; border-bottom: 0.5px solid #000;">${item.label}:</p>
                  <div style="font-size: 10pt; text-align: justify;">
                    ${groupBlocks(parseRichText(item.value || '-')).map(node => {
                      const alignStyle = node.align ? `text-align: ${node.align};` : '';
                      if (node.type === 'list_group') {
                        const tag = node.listType === 'bullet' ? 'ul' : 'ol';
                        const listStyleType = node.listType === 'bullet' ? 'list-style-type: disc;' : (node.listStyle === 'lower-alpha' ? 'list-style-type: lower-alpha;' : 'list-style-type: decimal;');
                        const marginLeft = node.listStyle === 'lower-alpha' ? 'margin-left: 45px;' : 'margin-left: 25px;';
                        const startAttr = (node.listType === 'numbered' && node.startIndex && node.startIndex > 1) ? ` start="${node.startIndex}"` : '';
                        let items = node.items!.map(li => `<li>${li.content}</li>`).join('');
                        return `<${tag}${startAttr} style="margin-bottom: 10px; ${alignStyle} ${listStyleType} ${marginLeft}">${items}</${tag}>`;
                      }
                      const blk = node.block!;
                      if (blk.type === 'image') {
                        return `<div style="text-align: center; margin: 10px 0;"><img src="${blk.content}" style="max-height: 250px; max-width: 100%; border-radius: 6px;" alt="Media" /></div>`;
                      }
                      if (blk.content === '' || blk.content === '-') return `<span style="color: #64748b; font-style: italic;">-</span>`;
                      return `<div style="margin-bottom: 5px; ${alignStyle}">${blk.content?.replace(/\n/g, '<br/>')}</div>`;
                    }).join('')}
                  </div>
                </div>
              `).join('')}
            </td>
          </tr>
        </table>

        <div class="signature-section">
          <table class="signature-table">
            <tr>
              <td>
                <p>Mengetahui,<br/>Kepala UPT SD Negeri Remen 2</p>
                <br/><br/><br/>
                <p style="font-weight: bold; font-size: 10pt;">Nurhariadji, S.Pd</p>
                <p style="font-size: 10pt;">NIP. 196701161994031012</p>
              </td>
              <td>
                <p>Remen, ${new Date(plan.createdAt || new Date()).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}<br/>Guru Kelas V</p>
                <br/><br/><br/>
                <p style="font-weight: bold; font-size: 10pt;">${plan.compiler}</p>
                <p style="font-size: 10pt;">NIP. ${plan.nip || '198905202020121006'}</p>
              </td>
            </tr>
          </table>
        </div>
          <div style="margin-top: 15px; text-align: center; font-size: 7.5pt; color: #64748b; font-style: italic;">
            By ${plan.compiler}
          </div>
          ${plan.attachments?.length ? plan.attachments.map(att => `
            <div style="page-break-before: always; margin-top: 20px; border-top: 1px solid #000; padding-top: 15px;">
              <h3 style="font-size: 16pt; font-weight: bold; margin-bottom: 20px; text-align: center; color: #0f172a;">${att.title.toUpperCase()}</h3>
              <div style="font-size: 11pt; text-align: justify; line-height: 1.5; font-family: 'Times New Roman', serif; color: #0f172a;">
                ${groupBlocks(parseRichText(att.content)).map(node => {
                const alignStyle = node.align ? `text-align: ${node.align};` : '';
                
                if (node.type === 'list_group') {
                    const tag = node.listType === 'bullet' ? 'ul' : 'ol';
                    const listStyleType = node.listType === 'bullet' ? 'list-style-type: disc;' : (node.listStyle === 'lower-alpha' ? 'list-style-type: lower-alpha;' : 'list-style-type: decimal;');
                    const marginLeft = node.listStyle === 'lower-alpha' ? 'margin-left: 55px;' : 'margin-left: 35px;';
                    const startAttr = (node.listType === 'numbered' && node.startIndex && node.startIndex > 1) ? ` start="${node.startIndex}"` : '';
                    let items = node.items!.map(item => `<li>${item.content}</li>`).join('');
                    return `<${tag}${startAttr} style="margin-bottom: 15px; font-family: 'Times New Roman', serif; ${alignStyle} ${listStyleType} ${marginLeft}">${items}</${tag}>`;
                }

                const block = node.block!;
                if (block.type === 'image') {
                  return `<div style="text-align: center; margin: 15px 0;"><img src="${block.content}" style="max-width: 100%; max-height: 400px; border-radius: 6px; border: 1px solid #cbd5e1;" alt="Media" /></div>`;
                }
                if (block.type === 'heading') {
                  return `<h4 style="font-size: 13pt; font-weight: bold; margin-top: 15px; margin-bottom: 5px; font-family: 'Times New Roman', serif; ${alignStyle}">${block.content}</h4>`;
                }
                if (block.type === 'table') {
                  const tableWidth = block.content || '100%';
                  const widthAttr = tableWidth.includes('%') ? `width="${tableWidth.replace('%', '')}%"` : `width="${tableWidth}"`;
                  return `
                    <table ${widthAttr} align="center" style="width: ${tableWidth}; border-collapse: collapse; margin: 15px auto; font-family: 'Times New Roman', serif; font-size: 10pt; border: 1px solid #cbd5e1;">
                      ${block.caption ? `<caption style="caption-side: top; padding: 5px; font-weight: bold; text-align: center; font-size: 11pt; color: #1e293b;">${block.caption}</caption>` : ''}
                      <thead>
                        <tr style="background-color: #f1f5f9;">
                          ${block.headers?.map((header, hIdx) => {
                            const isNoCol = header.toLowerCase() === 'no.' || header.toLowerCase() === 'no' || header.toLowerCase().includes('absen') || header.toLowerCase().includes('presensi');
                            return `<th style="border: 1px solid #cbd5e1; padding: 6px 8px; font-weight: bold; text-align: center; ${isNoCol ? 'width: 50px;' : ''}">${header}</th>`;
                          }).join('')}
                        </tr>
                      </thead>
                      <tbody>
                        ${block.rows?.map((row, rIdx) => `
                          <tr style="${rIdx % 2 === 1 ? 'background-color: #f8fafc;' : ''}">
                            ${row.map((cell, cIdx) => {
                              const header = block.headers?.[cIdx] || '';
                              const isNoCol = header.toLowerCase() === 'no.' || header.toLowerCase() === 'no' || header.toLowerCase().includes('absen') || header.toLowerCase().includes('presensi');
                              return `<td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: ${isNoCol ? 'center' : 'left'}; vertical-align: top; white-space: normal;">${cell?.replace(/\n/g, '<br/>')}</td>`;
                            }).join('')}
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>
                  `;
                }
                const blockAlignStyle = block.align ? `text-align: ${block.align};` : '';
                return `<div style="margin-bottom: 10px; font-family: 'Times New Roman', serif; ${blockAlignStyle}">${block.content?.replace(/\n/g, '<br/>')}</div>`;
              }).join('')}
            </div>
          </div>
        `).join('') : ''}
        </div>
      </body>
      </html>
    `;
  };

  const handleDownloadPDF = (plan: LearningPlan) => {
    onShowNotification('Sedang menyiapkan PDF...', 'warning');
    
    const element = document.createElement('div');
    element.innerHTML = getRPM_HTML(plan);
    
    // Improved options to avoid blank pages and ensure high quality
    const opt = {
      margin: 0,
      filename: `RPM_${plan.topic.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
      image: { type: 'jpeg' as const, quality: 1.0 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        letterRendering: true,
        logging: false,
        windowWidth: 800 
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
      pagebreak: { mode: ['css', 'legacy'] as const }
    };

    html2pdf().set(opt).from(element).save().then(() => {
      onShowNotification('PDF berhasil diunduh', 'success');
    }).catch(err => {
      console.error('PDF generation error:', err);
      onShowNotification('Gagal mengunduh PDF, silakan gunakan fitur cetak', 'error');
    });
  };

  const handlePrint = (plan: LearningPlan) => {
    setPrintPlan(plan);
    setTimeout(() => {
      window.print();
      // Reset print plan after dialog opens
      setTimeout(() => setPrintPlan(null), 2000);
    }, 500);
  };

  const printDur = printPlan ? getPrintPlanDurations(printPlan) : { awal: 10, inti: 50, penutup: 10 };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 select-none font-sans print:p-0">
      {/* Printable Area Wrapper */}
      {printPlan && (
        <div className="bg-white p-12 rounded-[3rem] shadow-xl border border-gray-100 print:shadow-none print:border-none print:p-0 w-full overflow-hidden" id="print-area">
          <style>{`
            @media print {
              @page {
                size: A4 portrait;
                margin: 15mm;
              }
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                background: white !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              /* Reset ancestor styling to prevent pushing down or cropping */
              body *:has(#print-area) {
                margin: 0 !important;
                padding: 0 !important;
                position: static !important;
                display: block !important;
                height: auto !important;
                width: auto !important;
                box-shadow: none !important;
                border: none !important;
                background: transparent !important;
              }
              /* Hide all elements during print */
              body * {
                visibility: hidden;
              }
              /* Show only the print area and its contents */
              #print-area, #print-area * {
                visibility: visible !important;
              }
              #print-area {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                max-width: 100% !important;
                box-shadow: none !important;
                border: none !important;
                padding: 0 !important;
                margin: 0 !important;
                background: white !important;
                color: #0f172a !important;
                display: block !important;
              }
              .no-print, .print\:hidden {
                display: none !important;
              }
              #print-kop-surat {
                margin-top: 0 !important;
                padding-top: 0 !important;
              }
              /* Background colors for print */
              .print-bg-emerald {
                background-color: #ecfdf5 !important;
                color: #047857 !important;
              }
              
              /* Table specific print fixes */
              table {
                width: 100% !important;
                border-collapse: collapse !important;
                page-break-inside: auto !important;
              }
              tr {
                page-break-inside: avoid !important;
                page-break-after: auto !important;
              }
              th, td {
                border: 1px solid #000 !important;
                padding: 8px !important;
                word-wrap: break-word !important;
              }
              /* Avoid empty pages at the end */
              body, html {
                height: auto !important;
              }
            }
          `}</style>
          
          <div className="space-y-4">
            {/* Main Header */}
            <div className="text-center space-y-0.5 pb-2 border-b-2 border-slate-900 mt-0">
              <h2 className="text-lg font-bold tracking-wider uppercase text-slate-900 leading-none m-0 p-0">RENCANA PEMBELAJARAN MENDALAM</h2>
              <div className="text-xs font-medium text-slate-600 m-0 p-0">{printPlan.model || 'Problem Based Learning (PBL)'}</div>
            </div>

            {/* School Profile Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs font-medium py-2">
              <div className="space-y-1">
                <div className="flex items-start">
                  <span className="w-28 text-slate-500 shrink-0">Nama Sekolah</span>
                  <span className="mr-2 shrink-0">:</span>
                  <span className="font-bold text-slate-800 flex-1 min-w-0 break-words">{printPlan.schoolName}</span>
                </div>
                <div className="flex items-start">
                  <span className="w-28 text-slate-500 shrink-0">Nama Penyusun</span>
                  <span className="mr-2 shrink-0">:</span>
                  <span className="font-bold text-slate-800 flex-1 min-w-0 break-words">{printPlan.compiler}</span>
                </div>
                <div className="flex items-start">
                  <span className="w-28 text-slate-500 shrink-0">NIP</span>
                  <span className="mr-2 shrink-0">:</span>
                  <span className="font-mono text-slate-800 flex-1 min-w-0 break-words">{printPlan.nip || '-'}</span>
                </div>
                <div className="flex items-start">
                  <span className="w-28 text-slate-500 shrink-0">Mata Pelajaran</span>
                  <span className="mr-2 shrink-0">:</span>
                  <span className="font-bold text-indigo-900 flex-1 min-w-0 break-words">{printPlan.subject}</span>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-start">
                  <span className="w-28 text-slate-500 shrink-0">Materi Pokok</span>
                  <span className="mr-2 shrink-0">:</span>
                  <span className="font-bold text-slate-800 flex-1 min-w-0 break-words">{printPlan.topic}</span>
                </div>
                <div className="flex items-start">
                  <span className="w-28 text-slate-500 shrink-0">Kelas/Semester</span>
                  <span className="mr-2 shrink-0">:</span>
                  <span className="font-bold text-slate-800 flex-1 min-w-0 break-words">{printPlan.classSemester}</span>
                </div>
                <div className="flex items-start">
                  <span className="w-28 text-slate-500 shrink-0">Tahun Ajaran</span>
                  <span className="mr-2 shrink-0">:</span>
                  <span className="font-bold text-slate-800 flex-1 min-w-0 break-words">{printPlan.academicYear}</span>
                </div>
                <div className="flex items-start">
                  <span className="w-28 text-slate-500 shrink-0">Alokasi Waktu</span>
                  <span className="mr-2 shrink-0">:</span>
                  <span className="font-bold text-slate-800 flex-1 min-w-0 break-words">{printPlan.timeAllocation}</span>
                </div>
              </div>
            </div>

            {/* Main Plan Matrix exactly matching the required PDF format */}
            <table className="w-full border-collapse border border-slate-900 mb-6">
              <tbody>
                {/* Row Identifikasi */}
                <tr className="border-b border-slate-900">
                  <td className="w-1/4 bg-slate-100 font-bold uppercase text-center align-middle text-slate-800 border-r border-slate-900" style={{ fontSize: '12px' }}>
                    Identifikasi
                  </td>
                  <td className="w-3/4 p-3 space-y-4 text-[11px]">
                    <div>
                      <span className="font-bold text-slate-700 block mb-1">Murid:</span>
                      <p className="text-slate-800 leading-relaxed bg-slate-50 p-2 rounded border border-slate-150">{printPlan.studentCharacteristics}</p>
                    </div>
                    <div>
                      <span className="font-bold text-slate-700 block mb-1">Dimensi Profil Lulusan:</span>
                      <div className="grid grid-cols-4 gap-3 mt-1">
                        {DIMENSIONS.map((dim) => {
                          const isSelected = printPlan.profileDimensions?.includes(dim);
                          return (
                            <div key={dim} className="flex items-start space-x-1.5 text-slate-800 text-[9.5px] leading-tight">
                              <span className="shrink-0">{isSelected ? '☑' : '☐'}</span>
                              <span className="break-words">{dim}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Row Design Pembelajaran */}
            <table className="w-full border-collapse border border-slate-900 mb-6">
              <tbody>
                <tr className="border-b border-slate-900">
                  <td className="w-1/4 bg-slate-100 font-bold uppercase text-center align-middle text-slate-800 border-r border-slate-900" style={{ fontSize: '12px' }}>
                    Design Pembelajaran
                  </td>
                  <td className="w-3/4 p-3 space-y-4 text-[11px]">
                    <div>
                      <span className="font-bold text-slate-700 block mb-1">Capaian Pembelajaran:</span>
                      <p className="text-slate-800 leading-relaxed text-justify">{printPlan.capaianPembelajaran}</p>
                    </div>

                    <div>
                      <span className="font-bold text-slate-700 block mb-1">Tujuan Pembelajaran:</span>
                      <ol className="list-decimal pl-4 space-y-1 text-slate-800">
                        {printPlan.learningGoals?.map((goal, idx) => (
                          <li key={idx} className="leading-relaxed">{goal}</li>
                        ))}
                      </ol>
                    </div>

                    <div>
                      <span className="font-bold text-slate-700 block mb-1.5">Praktik Pedagogis:</span>
                      <div className="grid grid-cols-2 gap-4 text-[11px] py-1 border-0">
                        <div className="space-y-2">
                          <div>
                            <strong className="text-slate-900 block mb-0.5">Pendekatan Pembelajaran:</strong>
                            <span className="text-slate-800">{printPlan.pendekatan}</span>
                          </div>
                          <div>
                            <strong className="text-slate-900 block mb-0.5">Model Pembelajaran:</strong>
                            <span className="text-slate-800">{printPlan.model}</span>
                          </div>
                        </div>
                        <div className="space-y-2 pl-4">
                          <div>
                            <strong className="text-slate-900 block mb-0.5">Strategi Pembelajaran:</strong>
                            <span className="text-slate-800">{printPlan.strategi}</span>
                          </div>
                          <div>
                            <strong className="text-slate-900 block mb-0.5">Metode Pembelajaran:</strong>
                            <span className="text-slate-800">{Array.isArray(printPlan.metode) ? printPlan.metode.join(', ') : printPlan.metode}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <span className="font-bold text-slate-700 block mb-1">Lintas Disiplin, Mitra, Digital & Lingkungan:</span>
                      <div className="grid grid-cols-2 gap-3 mt-1 text-[10px] text-slate-800 leading-tight">
                        <div className="bg-slate-50 p-2 rounded">
                          <strong className="text-indigo-900">Lintas Disiplin:</strong> {printPlan.lintasDisiplin}
                        </div>
                        <div className="bg-slate-50 p-2 rounded">
                          <strong className="text-indigo-900">Mitra:</strong> {printPlan.mitra}
                        </div>
                        <div className="bg-slate-50 p-2 rounded col-span-2">
                          <strong className="text-indigo-900">Digital:</strong> {printPlan.digital}
                        </div>
                        <div className="bg-slate-50 p-2 rounded col-span-2">
                          <strong className="text-indigo-900">Lingkungan:</strong> {printPlan.lingkungan}
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Row Pengalaman Pembelajaran */}
            <table className="w-full border-collapse border border-slate-900 mb-6">
              <tbody>
                <tr className="border-b border-slate-900">
                  <td className="w-1/4 bg-slate-100 font-bold uppercase text-center align-middle text-slate-800 border-r border-slate-900" style={{ fontSize: '12px' }}>
                    Pengalaman Pembelajaran
                  </td>
                  <td className="w-3/4 p-3 space-y-4 text-[11px]">
                    <div>
                      <strong className="text-slate-900 block mb-1 text-xs font-sans font-bold">{printPlan.kegiatanAwalTitle || 'Kegiatan Awal (Kesan, Bermakna)'} ({printDur.awal} Menit):</strong>
                      <ol className="list-decimal pl-4 space-y-1 block text-slate-800">
                        {printPlan.kegiatanAwal?.map((item, idx) => {
                          const formatted = formatAktivitasAwalItemText(item, printPlan.learningGoals || []);
                          return (
                            <li key={idx} className="leading-relaxed mb-1">
                              {formatted.includes('§') ? (
                                <div className="flex flex-col">
                                  <div className="whitespace-pre-line">{formatted.split('§')[0]}</div>
                                  <ol className="list-decimal pl-6">
                                    {formatted.split('§').slice(1).map((goal, i) => <li key={i}>{goal}</li>)}
                                  </ol>
                                </div>
                              ) : (
                                <div className="whitespace-pre-line">{formatted}</div>
                              )}
                            </li>
                          );
                        })}
                      </ol>
                    </div>

                    <div>
                      <strong className="text-slate-900 block mb-1.5 text-xs font-sans font-bold">{printPlan.kegiatanIntiTitle || `Kegiatan Inti (${printPlan.model})`} ({printDur.inti} Menit):</strong>
                      <div className="space-y-3 pl-1">
                        {printPlan.kegiatanInti?.map((inti, idx) => (
                          <div key={idx} className="border-l-2 border-indigo-200 pl-3">
                            <div className="flex justify-between items-center mb-0.5">
                              <span className="font-bold text-slate-800 text-[11px]">{idx + 1}. Fase {idx + 1}: {inti.phase.replace(/^[A-Z]\.\s+/, '')}</span>
                              {extractLabel(inti.description).label && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-sky-100 text-sky-700 uppercase">{extractLabel(inti.description).label}</span>
                              )}
                            </div>
                            <ol className="list-decimal list-outside ml-4 text-slate-700 text-xs leading-relaxed text-justify space-y-0.5">
                              {extractLabel(inti.description).description.split('\n').filter(line => line.trim()).map((line, lIdx) => (
                                <li key={lIdx} className="pl-1">
                                  {line.replace(/^\d+[\s.)-]+\s*/, '').trim()}
                                </li>
                              ))}
                            </ol>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <strong className="text-[#0f172a] block mb-1 text-xs font-sans font-bold">{printPlan.kegiatanPenutupTitle || 'Kegiatan Penutup (Berkesadaran)'} ({printDur.penutup} Menit):</strong>
                      <ol className="list-decimal pl-4 space-y-1 text-slate-800">
                        {printPlan.kegiatanPenutup?.map((item, idx) => (
                          <li key={idx} className="leading-relaxed">{item}</li>
                        ))}
                      </ol>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Row Asesmen Pembelajaran */}
            <table className="w-full border-collapse border border-slate-900 mb-6 font-sans">
              <tbody>
                <tr>
                  <td className="w-1/4 bg-slate-100 font-bold uppercase text-center align-middle text-slate-800 border-r border-slate-900" style={{ fontSize: '12px' }}>
                    Asesmen Pembelajaran
                  </td>
                  <td className="w-3/4 p-3 text-[11px] space-y-4">
                    {[
                      { label: 'Asesmen Awal', value: printPlan.asesmenAwal },
                      { label: 'Asesmen Proses', value: printPlan.asesmenProses },
                      { label: 'Asesmen Akhir', value: printPlan.asesmenAkhir }
                    ].map((item, idx) => (
                      <div key={idx} className="group">
                        <span className="font-bold text-slate-700 block mb-1 border-b border-slate-200 pb-0.5">{item.label}:</span>
                        <div className="text-slate-800 leading-relaxed bg-slate-50/50 p-2.5 rounded-sm border border-slate-150 min-h-[40px]">
                          {groupBlocks(parseRichText(item.value || '-')).map((node) => {
                            const style = node.align ? { textAlign: node.align as any } : undefined;
                            if (node.type === 'list_group') {
                              const Tag = node.listType === 'bullet' ? 'ul' : 'ol';
                              const listClass = node.listType === 'bullet' ? 'list-disc' : (node.listStyle === 'lower-alpha' ? 'list-[lower-alpha]' : 'list-decimal');
                              const marginClass = node.listStyle === 'lower-alpha' ? 'ml-12' : 'ml-6';
                              return (
                                <Tag 
                                  key={node.key} 
                                  className={`${listClass} ${marginClass} mb-2 space-y-1 block`} 
                                  style={style}
                                  {...(node.listType === 'numbered' && node.startIndex && node.startIndex > 1 ? { start: node.startIndex } : {})}
                                >
                                  {node.items!.map((li: any) => (
                                    <li key={li.key} className="pl-1" dangerouslySetInnerHTML={{ __html: li.content || '' }} />
                                  ))}
                                </Tag>
                              );
                            }
                            const blk = node.block!;
                            if (blk.type === 'image') {
                              return (
                                <div key={node.key} className="flex justify-center my-3">
                                  <img 
                                    src={blk.content || ''} 
                                    alt="Media" 
                                    className="max-h-60 max-w-full object-contain rounded border border-slate-200 shadow-sm"
                                  />
                                </div>
                              );
                            }
                            if (blk.content === '' || blk.content === '-') return <span key={node.key} className="text-slate-400 italic">-</span>;
                            return <div key={node.key} style={style} className="mb-2 last:mb-0" dangerouslySetInnerHTML={{ __html: blk.content || '' }} />;
                          })}
                        </div>
                      </div>
                    ))}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Signature Section */}
            <div className="flex justify-between items-center pt-8 mt-12 text-xs font-semibold" style={{ pageBreakInside: 'avoid' }}>
              <div className="text-center w-60 space-y-14">
                <div>
                  <p>Mengetahui,</p>
                  <p>Kepala UPT SD Negeri Remen 2</p>
                </div>
                <div className="space-y-0.5">
                  <p className="font-bold text-[11px]">Nurhariadji, S.Pd</p>
                  <p className="text-[11px] text-slate-500 font-mono">NIP. 196701161994031012</p>
                </div>
              </div>
              
              <div className="text-center w-60 space-y-14">
                <div>
                  <p>Remen, {new Date(printPlan.createdAt).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
                  <p>Guru Kelas V</p>
                </div>
                <div className="space-y-0.5">
                  <p className="font-bold text-[11px]">{printPlan.compiler}</p>
                  <p className="text-[11px] text-slate-500 font-mono">NIP. {printPlan.nip || '198905202020121006'}</p>
                </div>
              </div>
            </div>
            {/* Credit Footer */}
            <div className="mt-6 text-center text-[9px] text-slate-400 italic">
              By {printPlan.compiler}
            </div>

            {/* Attachments */}
            {printPlan.attachments?.map(att => (
              <div key={att.id} className="break-before-page mt-8 w-full border-t border-black pt-4">
                <h3 className="font-bold text-center text-[12px] mb-6">{att.title.toUpperCase()}</h3>
                <div className="text-justify text-slate-900 leading-relaxed text-[11px] font-serif">
                  {groupBlocks(parseRichText(att.content)).map((node) => {
                    const style = node.align ? { textAlign: node.align as any } : undefined;
                    
                    if (node.type === 'list_group') {
                      const Tag = node.listType === 'bullet' ? 'ul' : 'ol';
                      const listClass = node.listType === 'bullet' ? 'list-disc' : (node.listStyle === 'lower-alpha' ? 'list-[lower-alpha]' : 'list-decimal');
                      const marginClass = node.listStyle === 'lower-alpha' ? 'ml-14' : 'ml-8';
                      return (
                        <Tag 
                          key={node.key} 
                          className={`${listClass} ${marginClass} mb-3 space-y-1 block`} 
                          style={style}
                          {...(node.listType === 'numbered' && (node as any).startIndex && (node as any).startIndex > 1 ? { start: (node as any).startIndex } : {})}
                        >
                          {node.items!.map((item: any) => (
                            <li key={item.key} className="pl-1" dangerouslySetInnerHTML={{ __html: item.content || '' }} />
                          ))}
                        </Tag>
                      );
                    }

                    const line = node.block!;
                    return (
                      <div key={node.key} style={style}>
                        {line.type === 'heading' && <h4 className="font-bold text-[12px] mt-4 mb-2" dangerouslySetInnerHTML={{ __html: line.content || '' }} />}
                        {line.type === 'image' && (
                          <div className="my-3 flex justify-center">
                            <img 
                              src={line.content || ''} 
                              alt="Media Pendukung" 
                              className="max-h-80 max-w-full object-contain rounded-lg border border-gray-300 shadow-sm"
                            />
                          </div>
                        )}
                        {line.type === 'paragraph' && <p className="mb-2" dangerouslySetInnerHTML={{ __html: line.content || '' }} />}
                        {line.type === 'table' && (
                            <div className="my-3 overflow-x-auto">
                              <table 
                                className="divide-y divide-gray-300 text-xs text-left border border-gray-300 rounded-lg shadow-sm"
                                style={{ width: line.content || '100%', margin: '0 auto' }}
                              >
                                {line.caption && (
                                  <caption className="caption-top py-2 font-bold text-sm text-slate-800 text-center">
                                    {line.caption}
                                  </caption>
                                )}
                                <thead className="bg-[#f8fafc] border-b border-gray-300">
                                  <tr>
                                    {line.headers?.map((header, hIdx) => {
                                      const isNoCol = header.toLowerCase() === 'no.' || header.toLowerCase() === 'no' || header.toLowerCase().includes('absen') || header.toLowerCase().includes('presensi');
                                      return (
                                        <th key={hIdx} style={isNoCol ? { width: '60px', minWidth: '60px' } : undefined} className={`px-3 py-2 font-semibold text-slate-800 border-r last:border-r-0 border-gray-300 uppercase tracking-wider text-[9px] text-center`} dangerouslySetInnerHTML={{ __html: header }} />
                                      );
                                    })}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                  {line.rows?.map((row, rIdx) => (
                                    <tr key={rIdx} className={rIdx % 2 === 1 ? 'bg-slate-50/50' : ''}>
                                      {row.map((cell, cIdx) => {
                                        const header = line.headers?.[cIdx] || '';
                                        const isNoCol = header.toLowerCase() === 'no.' || header.toLowerCase() === 'no' || header.toLowerCase().includes('absen') || header.toLowerCase().includes('presensi');
                                        return (
                                          <td key={cIdx} className={`px-3 py-2 text-slate-700 border-r last:border-r-0 border-gray-200 whitespace-pre-wrap ${isNoCol ? 'text-center font-mono' : ''}`} dangerouslySetInnerHTML={{ __html: cell }} />
                                        );
                                      })}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Screen view content */}
      <div className="space-y-6 print:hidden">
        {/* Banner with action button */}
        <div className="bg-gradient-to-r from-[#5AB2FF] to-[#A0DEFF] rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-[#5AB2FF]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <BookText size={32} className="text-white drop-shadow" />
              Rencana Pembelajaran Mendalam
            </h1>
            <p className="text-xs sm:text-sm text-blue-50/90 font-medium max-w-xl">
              Susun, kelola, dan cetak perangkat serta modul rencana pembelajaran mendalam yang terintegrasi dengan Capaian Pembelajaran standar kurikulum BSKAP 045/046 Tahun 2025.
            </p>
          </div>
          <button 
            onClick={() => {
              if (currentTab === 'dashboard') {
                handleResetForm();
                setCurrentTab('form');
              } else {
                setCurrentTab('dashboard');
              }
            }}
            className="bg-white text-indigo-900 font-bold px-5 py-3 rounded-2xl shadow hover:bg-indigo-50 active:scale-95 transition-all text-sm shrink-0 flex items-center justify-center gap-2"
          >
            {currentTab === 'dashboard' ? (
              <>
                <Plus size={18} />
                Susun Baru
              </>
            ) : (
              <>
                <History size={18} />
                Kembalike Rekapitulasi
              </>
            )}
          </button>
        </div>

        {currentTab === 'dashboard' ? (
          /* DASHBOARD VIEW */
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-blue-100 shadow-xl overflow-hidden">
              <div className="bg-[#5AB2FF] text-white px-6 py-4 flex items-center justify-between">
                <h3 className="text-sm font-extrabold tracking-wider uppercase flex items-center gap-2">
                  <History size={18} />
                  Daftar Rencana Pembelajaran Tersimpan
                </h3>
                <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full shadow-inner border border-white/10 whitespace-nowrap shrink-0">
                  {plans.length} Berkas
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                      <th className="p-4 text-center w-12">No</th>
                      <th className="p-4 min-w-[140px] w-36">Mata Pelajaran</th>
                      <th className="p-4 min-w-[220px] w-auto">Materi Pokok / Bahasan</th>
                      <th className="p-4 min-w-[220px] w-56">Penyusun</th>
                      <th className="p-4 min-w-[130px] w-36 whitespace-nowrap">Alokasi Waktu</th>
                      <th className="p-4 min-w-[110px] w-32 text-center whitespace-nowrap">Tanggal Dibuat</th>
                      <th className="p-4 text-center min-w-[145px] w-40">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                    {plans.map((plan, idx) => (
                      <tr key={plan.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 text-center text-slate-400 font-mono">{idx + 1}</td>
                        <td className="p-4">
                          <span className={`bg-indigo-50 text-indigo-700 font-extrabold px-2.5 py-1.5 rounded-full border border-indigo-100 uppercase tracking-wide inline-block text-center align-middle break-words leading-tight ${
                            plan.subject && plan.subject.length > 18
                              ? 'text-[9px] px-1.5 py-1 max-w-[120px]'
                              : plan.subject && plan.subject.length > 10
                              ? 'text-[10px] px-2 py-1 max-w-[125px]'
                              : 'text-xs max-w-[130px]'
                          }`} title={plan.subject}>
                            {plan.subject}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-slate-800 text-sm break-words leading-relaxed">{plan.topic}</div>
                          <div className="text-[10px] text-slate-400 mt-1 uppercase">Kelas {plan.classSemester}</div>
                        </td>
                        <td className="p-4 min-w-[220px] w-56">
                          <div className="font-semibold text-slate-700 whitespace-nowrap leading-relaxed">{plan.compiler}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5 whitespace-nowrap">NIP. {plan.nip || '-'}</div>
                        </td>
                        <td className="p-4 text-slate-500 font-semibold whitespace-nowrap">{plan.timeAllocation}</td>
                        <td className="p-4 text-center text-slate-500 font-mono">
                          {new Date(plan.createdAt).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handlePrint(plan)}
                              title="Cetak RPM"
                              className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 p-2 rounded-xl transition-all border border-emerald-200"
                            >
                              <Printer size={16} />
                            </button>
                            {!isReadOnly && (
                              <>
                                <button
                                  onClick={() => handleSync(plan)}
                                  title="Sinkronkan ke Laporan Pembelajaran"
                                  className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 p-2 rounded-xl transition-all border border-indigo-200"
                                >
                                  <RefreshCw size={16} />
                                </button>
                                <button
                                  onClick={() => handleEdit(plan)}
                                  title="Edit RPM"
                                  className="bg-blue-50 text-blue-700 hover:bg-blue-100 p-2 rounded-xl transition-all border border-blue-200"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={() => handleDelete(plan.id)}
                                  title="Hapus RPM"
                                  className="bg-rose-50 text-rose-700 hover:bg-rose-100 p-2 rounded-xl transition-all border border-rose-200"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {plans.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-16 text-center text-slate-400 italic bg-slate-50/20">
                          Tidak ada rencana pembelajaran yang tersimpan. Klik "Susun Baru" untuk mulai membuat Rencana Pembelajaran Mendalam.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          /* FORM VIEW */
          <form onSubmit={handleSave} className="space-y-6">
            <div className="bg-white rounded-3xl border border-blue-100 shadow-xl overflow-hidden">
              <div className="bg-[#5AB2FF] text-white px-6 py-4 flex items-center justify-between">
                <h3 className="text-sm font-extrabold tracking-wider uppercase flex items-center gap-2">
                  <FilePlus size={18} />
                  {editingId ? 'Edit Rencana Pembelajaran' : 'Form Penyusunan Rencana Pembelajaran Mendalam'}
                </h3>
                <span className="text-xs bg-indigo-900/40 text-white font-bold px-3 py-1 rounded-full">
                  Fase A, B dan C Kurikulum Merdeka
                </span>
              </div>

              {/* Form Content */}
              <div className="p-6 sm:p-8 space-y-8">
                {/* 1. INFORMASI UMUM */}
                <div className="space-y-4">
                  <h4 className="text-sm font-extrabold text-slate-800 border-l-4 border-[#5AB2FF] pl-3 uppercase tracking-wider">
                    1. Informasi Umum Rencana Pembelajaran
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Instansi */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase">Nama Sekolah</label>
                      <input 
                        type="text"
                        value={schoolName}
                        onChange={(e) => setSchoolName(e.target.value)}
                        placeholder="Masukkan Nama Sekolah..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#5AB2FF]"
                        required
                      />
                    </div>

                    {/* Compiler */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase">Nama Penyusun</label>
                      <input 
                        type="text"
                        value={compiler}
                        onChange={(e) => setCompiler(e.target.value)}
                        placeholder="Masukkan Nama Penyusun..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#5AB2FF]"
                        required
                      />
                    </div>
                    {/* NIP */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase">NIP</label>
                      <input 
                        type="text"
                        value={nip}
                        onChange={(e) => setNip(e.target.value)}
                        placeholder="Masukkan NIP (Sesuai NIP Guru)..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#5AB2FF]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Mapel */}
                    <div className="space-y-1.5 col-span-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Mata Pelajaran</label>
                      <select 
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#5AB2FF]"
                      >
                        {getDynamicSubjects().map(sub => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                      </select>
                    </div>

                    {/* Topic */}
                    <div className="space-y-1.5 col-span-1 md:col-span-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">Materi Pokok / Topik Bahasan</label>
                      <input 
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="Masukkan Materi Pokok / Topik Bahasan..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#5AB2FF]"
                        required
                      />
                    </div>

                    {/* Alokasi Waktu */}
                    <div className="space-y-1.5 col-span-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Alokasi Waktu</label>
                      <select 
                        value={timeAllocation}
                        onChange={(e) => handleTimeAllocationChange(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#5AB2FF]"
                      >
                        {['1 JP (1 x 35 Menit)', '2 JP (2 x 35 Menit)', '3 JP (3 x 35 Menit)', '4 JP (4 x 35 Menit)', '5 JP (5 x 35 Menit)'].map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Kelas Semester */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-slate-500 uppercase">Kelas / Semester / Fase</label>
                        <span className="text-[10px] bg-[#5AB2FF]/10 text-[#5AB2FF] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">Otomatis</span>
                      </div>
                      <input 
                        type="text"
                        value={classSemester}
                        readOnly
                        disabled
                        placeholder="Mendeteksi kelas..."
                        className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm font-bold text-slate-500 cursor-not-allowed focus:outline-none"
                        required
                      />
                    </div>
                    {/* Tahun Ajaran */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-slate-500 uppercase">Tahun Ajaran</label>
                        <span className="text-[10px] bg-[#5AB2FF]/10 text-[#5AB2FF] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">Otomatis</span>
                      </div>
                      <input 
                        type="text"
                        value={academicYear}
                        readOnly
                        disabled
                        placeholder="Mendeteksi tahun ajaran..."
                        className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm font-bold text-slate-500 cursor-not-allowed focus:outline-none"
                        required
                      />
                    </div>
                    {/* Tempat Pengesahan */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase">Tempat Pengesahan</label>
                      <input 
                        type="text"
                        value={tempatPengesahan}
                        onChange={(e) => setTempatPengesahan(e.target.value)}
                        placeholder="Contoh: Tuban..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#5AB2FF]"
                      />
                    </div>

                    {/* Tanggal Pembuatan */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase">Tanggal Pembuatan</label>
                      <input 
                        type="date"
                        value={customCreatedDate}
                        onChange={(e) => setCustomCreatedDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#5AB2FF]"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* 2. IDENTIFIKASI */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h4 className="text-sm font-extrabold text-slate-800 border-l-4 border-[#5AB2FF] pl-3 uppercase tracking-wider">
                    2. Identifikasi Pembelajaran
                  </h4>

                  <div className="space-y-4">
                    {/* Karakteristik Murid */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase">Profil Murid (Gaya Belajar & Minat)</label>
                      <textarea 
                        value={studentCharacteristics}
                        onChange={(e) => setStudentCharacteristics(e.target.value)}
                        placeholder="Masukkan Deskripsi Profil Murid (Gaya Belajar, Minat, dan Karakteristik)..."
                        rows={2}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#5AB2FF]"
                        required
                      />
                    </div>

                    {/* Dimensi Profil Lulusan*/}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Dimensi Profil Lulusan</label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-150">
                        {DIMENSIONS.map(dim => {
                          const isSelected = selectedDimensions.includes(dim);
                          return (
                            <button
                              type="button"
                              key={dim}
                              onClick={() => handleToggleDimension(dim)}
                              className={`flex items-center space-x-2 text-left p-2.5 rounded-xl border text-xs font-bold transition-all ${
                                isSelected 
                                  ? 'bg-[#5AB2FF] text-white border-blue-300 shadow-md shadow-[#5AB2FF]/25' 
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                              <span>{dim}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. DESIGN PEMBELAJARAN */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h4 className="text-sm font-extrabold text-slate-800 border-l-4 border-[#5AB2FF] pl-3 uppercase tracking-wider">
                    3. Desain Pembelajaran (Design)
                  </h4>

                  <div className="space-y-4">
                    {/* Capaian Pembelajaran */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Capaian Pembelajaran (CP) - Terisi Otomatis Sesuai Mapel Terpilih</label>
                        <button
                          type="button"
                          onClick={() => {
                            const currentPhase = autoClassSemesterPlusFase().fase;
                            const phaseTemplates = CP_TEMPLATES[currentPhase] || CP_TEMPLATES['Fase C'];
                            const matchedKey = Object.keys(phaseTemplates).find(k => 
                              subject.toLowerCase().includes(k.toLowerCase()) || 
                              k.toLowerCase().includes(subject.toLowerCase())
                            );

                            if (matchedKey && phaseTemplates[matchedKey]) {
                              setCapaianPembelajaran(phaseTemplates[matchedKey]);
                              onShowNotification(`Template CP ${matchedKey} ${currentPhase} berhasil dimuat`, 'success');
                            } else {
                              onShowNotification('Gagal menemukan template CP yang sesuai untuk fase ini', 'error');
                            }
                          }}
                          className="text-[#5AB2FF] hover:underline text-[11px] font-bold flex items-center gap-1"
                        >
                          <Undo size={12} />
                          Reset ke Template CP {subject}
                        </button>
                      </div>
                      <textarea 
                        value={capaianPembelajaran}
                        onChange={(e) => setCapaianPembelajaran(e.target.value)}
                        placeholder="Tuliskan Capaian Pembelajaran (CP) atau klik tombol Reset untuk memuat standard BSKAP..."
                        rows={4}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#5AB2FF] text-justify"
                        required
                      />
                    </div>



                    {/* Praktik Pedagogis */}
                    <div className="bg-slate-50/50 rounded-2xl border border-slate-200 p-4 space-y-4">
                      <h5 className="text-[11px] font-extrabold text-[#5AB2FF] uppercase tracking-wider">
                        Praktik Pedagogis
                      </h5>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Pendekatan */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase">Pendekatan Pembelajaran</label>
                          <select 
                            value={isCustomPendekatanMode || (pendekatan && !PENDEKATAN_OPTIONS.includes(pendekatan)) ? 'Lainnya' : pendekatan}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === 'Lainnya') {
                                setIsCustomPendekatanMode(true);
                                setPendekatan('');
                              } else {
                                setIsCustomPendekatanMode(false);
                                setPendekatan(val);
                              }
                            }}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#5AB2FF]"
                          >
                            {PENDEKATAN_OPTIONS.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                            <option value="Lainnya">Lainnya (Input Manual)</option>
                          </select>
                          {(isCustomPendekatanMode || (pendekatan && !PENDEKATAN_OPTIONS.includes(pendekatan))) && (
                            <input 
                              type="text"
                              value={pendekatan}
                              onChange={(e) => setPendekatan(e.target.value)}
                              placeholder="Ketik pendekatan pembelajaran manual..."
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-800 focus:outline-[#5AB2FF] mt-1"
                            />
                          )}
                        </div>

                        {/* Model */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase">Model Pembelajaran</label>
                          <select 
                            value={isCustomModelMode || (model && !MODEL_OPTIONS.includes(model)) ? 'Lainnya' : model}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === 'Lainnya') {
                                setIsCustomModelMode(true);
                                setModel('');
                              } else {
                                setIsCustomModelMode(false);
                                setModel(val);
                                if (MODEL_SINTAKS_TEMPLATES[val]) {
                                  setIntiInput(JSON.parse(JSON.stringify(MODEL_SINTAKS_TEMPLATES[val])));
                                }
                              }
                            }}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#5AB2FF]"
                          >
                            {MODEL_OPTIONS.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                            <option value="Lainnya">Lainnya (Input Manual)</option>
                          </select>
                          {(isCustomModelMode || (model && !MODEL_OPTIONS.includes(model))) && (
                            <input 
                              type="text"
                              value={model}
                              onChange={(e) => setModel(e.target.value)}
                              placeholder="Ketik model pembelajaran manual..."
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-800 focus:outline-[#5AB2FF] mt-1"
                            />
                          )}
                        </div>

                        {/* Strategi */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase">Strategi Pembelajaran</label>
                          <select 
                            value={isCustomStrategiMode || (strategi && !STRATEGI_OPTIONS.includes(strategi)) ? 'Lainnya' : strategi}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === 'Lainnya') {
                                setIsCustomStrategiMode(true);
                                setStrategi('');
                              } else {
                                setIsCustomStrategiMode(false);
                                setStrategi(val);
                              }
                            }}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#5AB2FF]"
                          >
                            {STRATEGI_OPTIONS.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                            <option value="Lainnya">Lainnya (Input Manual)</option>
                          </select>
                          {(isCustomStrategiMode || (strategi && !STRATEGI_OPTIONS.includes(strategi))) && (
                            <input 
                              type="text"
                              value={strategi}
                              onChange={(e) => setStrategi(e.target.value)}
                              placeholder="Ketik strategi pembelajaran manual..."
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-800 focus:outline-[#5AB2FF] mt-1"
                            />
                          )}
                        </div>

                        {/* Metode */}
                        <div className="space-y-1.5 md:col-span-3">
                          <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Metode Pembelajaran (Dapat pilih lebih dari 1)</label>
                          <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-3">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                              {METODE_OPTIONS.map(opt => {
                                const isSelected = metode.includes(opt);
                                return (
                                  <button
                                    type="button"
                                    key={opt}
                                    onClick={() => handleToggleMetode(opt)}
                                    className={`flex items-center space-x-2 text-left p-1.5 rounded-lg border text-[10px] font-bold transition-all ${
                                      isSelected 
                                        ? 'bg-[#5AB2FF] text-white border-blue-300 shadow-sm' 
                                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                    }`}
                                  >
                                    {isSelected ? <CheckSquare size={14} /> : <Square size={14} />}
                                    <span className="truncate">{opt}</span>
                                  </button>
                                );
                              })}

                              {/* Custom Methods inside state */}
                              {metode.filter(m => !METODE_OPTIONS.includes(m)).map(opt => (
                                <button
                                  type="button"
                                  key={opt}
                                  onClick={() => handleToggleMetode(opt)}
                                  className="flex items-center justify-between space-x-2 text-left p-1.5 rounded-lg border text-[10px] bg-[#5AB2FF] text-white border-blue-300 shadow-sm font-bold transition-all"
                                >
                                  <span className="flex items-center space-x-1.5 truncate">
                                    <CheckSquare size={14} />
                                    <span className="truncate">{opt}</span>
                                  </span>
                                  <span className="text-[12px] leading-none opacity-80 hover:opacity-100 pl-1 font-extrabold">&times;</span>
                                </button>
                              ))}
                            </div>

                            {/* Manual Input for Metode */}
                            <div className="flex gap-2 items-center pt-2 border-t border-slate-100 max-w-md">
                              <input 
                                type="text"
                                value={customMetodeInput}
                                onChange={(e) => setCustomMetodeInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddCustomMetode();
                                  }
                                }}
                                placeholder="Metode lainnya tidak ada di daftar? Ketik di sini..."
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#5AB2FF]"
                              />
                              <button
                                type="button"
                                onClick={handleAddCustomMetode}
                                className="bg-[#5AB2FF] hover:bg-[#409BFA] text-white font-bold text-xs px-4 py-1.5 rounded-xl transition-all flex items-center gap-1 shrink-0"
                              >
                                <Plus size={14} />
                                Tambah
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Lintas Disiplin, Mitra, Digital, dan Lingkungan */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
                      {/* Lintas Disiplin */}
                      <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50/40 border border-slate-100">
                        <label className="text-xs font-bold text-indigo-900 uppercase">Komponen Lintas Disiplin Ilmu</label>
                        <input 
                          type="text"
                          value={lintasDisiplin}
                          onChange={(e) => setLintasDisiplin(e.target.value)}
                          placeholder="Masukkan Komponen Lintas Disiplin (contoh: Bahasa Indonesia, Matematika)..."
                          className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#5AB2FF]"
                        />
                        <div className="flex flex-wrap gap-1 mt-1 bg-white/70 p-2 rounded-xl border border-dashed border-slate-100">
                          <span className="text-[9px] text-slate-400 font-bold block w-full mb-0.5">Pilih Cepat:</span>
                          {getDynamicSubjects().map(opt => {
                            const active = isChoiceSelected(lintasDisiplin, opt);
                            return (
                              <button
                                type="button"
                                key={opt}
                                onClick={() => setLintasDisiplin(toggleCommaSeparated(lintasDisiplin, opt))}
                                className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${
                                  active 
                                    ? 'bg-[#5AB2FF] text-white border-[#5AB2FF] font-black' 
                                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                {active ? '✓' : '+'} {opt}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Mitra */}
                      <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50/40 border border-slate-100">
                        <label className="text-xs font-bold text-indigo-900 uppercase">Mitra Terkait</label>
                        <input 
                          type="text"
                          value={mitra}
                          onChange={(e) => setMitra(e.target.value)}
                          placeholder="Masukkan Mitra Terkait (contoh: Rekan Sejawat, Orang Tua Murid)..."
                          className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#5AB2FF]"
                        />
                        <div className="flex flex-wrap gap-1 mt-1 bg-white/70 p-2 rounded-xl border border-dashed border-slate-100">
                          <span className="text-[9px] text-slate-400 font-bold block w-full mb-0.5">Pilih Cepat:</span>
                          {['Rekan Sejawat', 'Orang Tua Murid', 'Pakar Adat/Budayawan', 'Pengrajin Lokal', 'Tokoh Masyarakat', 'Puskesmas', 'Polsek', 'Koramil', 'PT.TPPI', 'PT. Pertamina'].map(opt => {
                            const active = isChoiceSelected(mitra, opt);
                            return (
                              <button
                                type="button"
                                key={opt}
                                onClick={() => setMitra(toggleCommaSeparated(mitra, opt))}
                                className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${
                                  active 
                                    ? 'bg-[#5AB2FF] text-white border-[#5AB2FF] font-black' 
                                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                {active ? '✓' : '+'} {opt}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Digital */}
                      <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50/40 border border-slate-100">
                        <label className="text-xs font-bold text-indigo-900 uppercase">Media / Ekosistem Digital</label>
                        <input 
                          type="text"
                          value={digital}
                          onChange={(e) => setDigital(e.target.value)}
                          placeholder="Masukkan Media / Ekosistem Digital (contoh: YouTube, Canva)..."
                          className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#5AB2FF]"
                        />
                        <div className="flex flex-wrap gap-1 mt-1 bg-white/70 p-2 rounded-xl border border-dashed border-slate-100">
                          <span className="text-[9px] text-slate-400 font-bold block w-full mb-0.5">Pilih Cepat:</span>
                          {MEDIA_OPTIONS.map(opt => {
                            const active = isChoiceSelected(digital, opt);
                            return (
                              <button
                                type="button"
                                key={opt}
                                onClick={() => setDigital(toggleCommaSeparated(digital, opt))}
                                className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${
                                  active 
                                    ? 'bg-[#5AB2FF] text-white border-[#5AB2FF] font-black' 
                                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                {active ? '✓' : '+'} {opt}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Lingkungan */}
                      <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50/40 border border-slate-100">
                        <label className="text-xs font-bold text-indigo-900 uppercase">Lingkungan Pembelajaran</label>
                        <input 
                          type="text"
                          value={lingkungan}
                          onChange={(e) => setLingkungan(e.target.value)}
                          placeholder="Masukkan Lingkungan Pembelajaran (contoh: Ruang Kelas, Kebun Sekolah)..."
                          className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#5AB2FF]"
                        />
                        <div className="flex flex-wrap gap-1 mt-1 bg-white/70 p-2 rounded-xl border border-dashed border-slate-100">
                          <span className="text-[9px] text-slate-400 font-bold block w-full mb-0.5">Pilih Cepat:</span>
                          {LINGKUNGAN_OPTIONS.map(opt => {
                            const active = isChoiceSelected(lingkungan, opt);
                            return (
                              <button
                                type="button"
                                key={opt}
                                onClick={() => setLingkungan(toggleCommaSeparated(lingkungan, opt))}
                                className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${
                                  active 
                                    ? 'bg-[#5AB2FF] text-white border-[#5AB2FF] font-black' 
                                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                {active ? '✓' : '+'} {opt}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Tujuan Pembelajaran */}
                    <div className="space-y-2 mt-4 pt-4 border-t border-dashed border-slate-200">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-indigo-900 uppercase">Tujuan Pembelajaran (TP)</label>
                        <button
                          type="button"
                          onClick={handleAddGoal}
                          className="text-[#5AB2FF] border border-[#5AB2FF]/30 hover:bg-indigo-50 px-3 py-1 rounded-xl text-[11px] font-extrabold flex items-center gap-1"
                        >
                          <Plus size={12} />
                          Tambah TP
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        {goalsInput.map((goal, gIdx) => (
                          <div key={gIdx} className="space-y-2 border border-slate-100 p-3 rounded-2xl bg-slate-50/20">
                            <div className="flex gap-2 items-center">
                              <input 
                                type="text"
                                value={goal}
                                onChange={(e) => handleGoalChange(gIdx, e.target.value)}
                                placeholder={`Tuliskan tujuan pembelajaran ke-${gIdx + 1} (atau gunakan asisten generator di sebelah kanan...)`}
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#5AB2FF]"
                                required
                              />
                              
                              {/* Semi-Generate Button */}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedGoalIndex(selectedGoalIndex === gIdx ? null : gIdx);
                                  if (selectedGoalIndex !== gIdx) {
                                    setTempMateri(topic);
                                  }
                                }}
                                className={`px-3 py-2 rounded-xl text-[11px] font-extrabold flex items-center gap-1 shrink-0 transition-all border ${
                                  selectedGoalIndex === gIdx
                                    ? 'bg-indigo-600 text-white border-indigo-700'
                                    : 'bg-indigo-50 hover:bg-indigo-100 text-[#5AB2FF] border-[#5AB2FF]/30'
                                }`}
                              >
                                <Sparkles size={12} />
                                <span>{selectedGoalIndex === gIdx ? 'Tutup Asisten' : 'Asisten TP'}</span>
                              </button>

                              {goalsInput.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (selectedGoalIndex === gIdx) {
                                      setSelectedGoalIndex(null);
                                    }
                                    handleRemoveGoal(gIdx);
                                  }}
                                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 p-2 rounded-xl transition-all border border-rose-200"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>

                            {/* Dropdown / Accordion content for Semi-Generation */}
                            {selectedGoalIndex === gIdx && (
                              <div className="bg-indigo-50/50 rounded-2xl border border-indigo-100 p-4 space-y-4 animate-fadeIn">
                                <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                                  <div className="flex items-center gap-1.5 text-indigo-700 font-extrabold text-xs uppercase">
                                    <Sparkles size={14} className="text-[#5AB2FF]" />
                                    <span>Asisten Instan Tujuan Pembelajaran Sagara</span>
                                  </div>
                                  <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
                                    Semi-Otomatis
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                  {/* Bagian 1: Model/Metode Pembuka */}
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-extrabold text-slate-500 uppercase">1. Pengantar / Kondisi</label>
                                    <select
                                      value={tempPrefixType}
                                      onChange={(e) => setTempPrefixType(e.target.value)}
                                      className="w-full bg-white border border-indigo-200/60 rounded-xl px-2.5 py-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#5AB2FF]"
                                    >
                                      <option value="pendekatan">Pendekatan ({pendekatan || 'Belum diisi'})</option>
                                      <option value="model">Model ({model ? (model.length > 15 ? model.substring(0, 15) + '...' : model) : 'Belum diisi'})</option>
                                      <option value="strategi">Strategi ({strategi || 'Belum diisi'})</option>
                                      <option value="media">Media Digital ({digital ? (digital.length > 15 ? digital.substring(0, 15) + '...' : digital) : 'Belum diisi/dipilih'})</option>
                                      <option value="metode">Metode ({Array.isArray(metode) ? metode.join(', ') : (metode || 'Belum diisi')})</option>
                                      <option value="combined_model_media">Model + Media Digital</option>
                                      <option value="combined_pendekatan_model">Pendekatan + Model</option>
                                    </select>
                                  </div>

                                  {/* Bagian 2: Bloom KKO */}
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-extrabold text-slate-500 uppercase">2. Kata Kerja Operasional (KKO)</label>
                                    <select
                                      value={tempKko}
                                      onChange={(e) => setTempKko(e.target.value)}
                                      className="w-full bg-white border border-indigo-200/60 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#5AB2FF]"
                                    >
                                      <optgroup label="C1-C2 (Pemahaman & Ingatan)">
                                        <option value="mengidentifikasi">mengidentifikasi</option>
                                        <option value="menyebutkan">menyebutkan</option>
                                        <option value="menjelaskan">menjelaskan</option>
                                        <option value="menguraikan">menguraikan</option>
                                        <option value="menunjukkan">menunjukkan</option>
                                      </optgroup>
                                      <optgroup label="C3-C4 (Aplikasi & Analisis)">
                                        <option value="menerapkan">menerapkan</option>
                                        <option value="mempraktikkan">mempraktikkan</option>
                                        <option value="menggunakan">menggunakan</option>
                                        <option value="mensimulasikan">mensimulasikan</option>
                                        <option value="menganalisis">menganalisis</option>
                                        <option value="menelaah">menelaah</option>
                                        <option value="membandingkan">membandingkan</option>
                                      </optgroup>
                                      <optgroup label="C5-C6 (Evaluasi & Kreasi)">
                                        <option value="mengevaluasi">mengevaluasi</option>
                                        <option value="merefleksikan">merefleksikan</option>
                                        <option value="menguji">menguji</option>
                                        <option value="merancang">merancang</option>
                                        <option value="membuat">membuat</option>
                                        <option value="menyusun">menyusun</option>
                                        <option value="mengkreasi">mengkreasi</option>
                                      </optgroup>
                                    </select>
                                  </div>

                                  {/* Bagian 3: Materi Bahasan */}
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-extrabold text-slate-500 uppercase">3. Materi / Sasaran</label>
                                    <input
                                      type="text"
                                      value={tempMateri}
                                      onChange={(e) => setTempMateri(e.target.value)}
                                      placeholder="Masukkan materi pokok..."
                                      className="w-full bg-white border border-indigo-200/60 rounded-xl px-2.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#5AB2FF]"
                                    />
                                  </div>

                                  {/* Bagian 4: Kriteria (Degree) */}
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-extrabold text-slate-500 uppercase">4. Kriteria Keberhasilan</label>
                                    <select
                                      value={tempDegree}
                                      onChange={(e) => setTempDegree(e.target.value)}
                                      className="w-full bg-white border border-indigo-200/60 rounded-xl px-2.5 py-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#5AB2FF]"
                                    >
                                      <option value="dengan tepat">dengan tepat</option>
                                      <option value="dengan benar">dengan benar</option>
                                      <option value="dengan baik dan benar">dengan baik dan benar</option>
                                      <option value="secara mandiri dan bertanggung jawab">secara mandiri & bertanggung jawab</option>
                                      <option value="secara kritis dan mendalam">secara kritis & mendalam</option>
                                      <option value="secara kreatif dan kolaboratif">secara kreatif & kolaboratif</option>
                                      <option value="dengan percaya diri">dengan percaya diri</option>
                                    </select>
                                  </div>
                                </div>

                                {/* Live Preview Textbox */}
                                <div className="space-y-1.5 bg-white p-3 rounded-xl border border-indigo-100">
                                  <label className="text-[10px] font-bold text-slate-400 uppercase">Pratinjau Hasil Rumusan TP (Dapat diedit bebas):</label>
                                  <textarea
                                    value={customGeneratedText}
                                    onChange={(e) => setCustomGeneratedText(e.target.value)}
                                    rows={2}
                                    className="w-full bg-slate-50 text-xs font-semibold text-slate-800 p-2 border border-slate-100 rounded-lg focus:outline-none focus:bg-white text-justify"
                                  />
                                </div>

                                {/* Action button inside generator card */}
                                <div className="flex justify-end gap-2 text-xs">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedGoalIndex(null)}
                                    className="px-3 py-1.5 border border-slate-200 text-slate-500 rounded-lg font-bold hover:bg-slate-50"
                                  >
                                    Batal
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleGoalChange(gIdx, customGeneratedText);
                                      setSelectedGoalIndex(null);
                                      onShowNotification('Tujuan pembelajaran berhasil diterapkan!', 'success');
                                    }}
                                    className="px-4 py-1.5 bg-[#5AB2FF] text-white rounded-lg font-black hover:opacity-90 transition-all shadow-md shadow-[#5AB2FF]/20 flex items-center gap-1"
                                  >
                                    <Save size={12} />
                                    Terapkan ke TP
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. PENGALAMAN PEMBELAJARAN */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h4 className="text-sm font-extrabold text-slate-800 border-l-4 border-[#5AB2FF] pl-3 uppercase tracking-wider">
                    4. Pengalaman Pembelajaran (Skenario Kegiatan)
                  </h4>

                  <div className="space-y-6">
                    {/* Kegiatan Awal */}
                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <label className="text-xs font-bold text-slate-500 uppercase">Kegiatan Awal:</label>
                          <input
                            type="text"
                            value={kegiatanAwalTitle}
                            onChange={(e) => setKegiatanAwalTitle(e.target.value)}
                            className="bg-white border border-slate-200 hover:border-slate-300 focus:border-[#5AB2FF] rounded-xl px-3 py-1 text-xs font-black text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#5AB2FF] w-64 shadow-xs"
                            placeholder="Kegiatan Awal (Kesan dan Bermakna)"
                          />
                          <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-xl shadow-xs">
                            <Clock size={12} className="text-[#5AB2FF] shrink-0" />
                            <input
                              type="number"
                              value={durasiAwal || ''}
                              onChange={(e) => handleManualChange('awal', parseInt(e.target.value))}
                              className="w-12 text-center bg-white border border-slate-200 rounded-lg text-xs font-black text-slate-800 py-0.5 focus:outline-none focus:ring-1 focus:ring-[#5AB2FF]"
                              min="0"
                              required
                            />
                            <span className="text-[10px] font-extrabold text-slate-500 pr-0.5">Mnt</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={syncKegiatanAwalDanPenutup}
                            className="bg-indigo-50 hover:bg-indigo-100 text-[#5AB2FF] border border-[#5AB2FF]/30 px-3 py-1 rounded-xl text-[11px] font-black flex items-center gap-1 transition-all"
                            title="Sesuaikan otomatis isi kegiatan awal & penutup berdasarkan Topik, TP, dan Model Pembelajaran"
                          >
                            <Sparkles size={11} className="text-amber-500" />
                            Sesuaikan Otomatis
                          </button>
                          <button
                            type="button"
                            onClick={handleAddAwal}
                            className="text-[#5AB2FF] border border-[#5AB2FF]/30 hover:bg-indigo-50 px-3 py-1 rounded-xl text-[11px] font-extrabold flex items-center gap-1"
                          >
                            <Plus size={12} />
                            Tambah Kegiatan
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {awalInput.map((awalItem, aIdx) => (
                          <div key={aIdx} className="flex gap-2">
                            <textarea 
                              value={awalItem}
                              onChange={(e) => handleAwalChange(aIdx, e.target.value)}
                              placeholder={`Langkah Kegiatan Awal ke-${aIdx + 1}`}
                              rows={2}
                              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#5AB2FF] text-justify"
                              required
                            />
                            {awalInput.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveAwal(aIdx)}
                                className="bg-rose-50 hover:bg-rose-100 text-rose-700 p-2 rounded-xl transition-all border border-rose-200"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Kegiatan Inti */}
                    <div className="bg-slate-50 rounded-2xl border border-slate-150 p-4 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <CheckSquare className="text-[#5AB2FF]" size={16} />
                          <label className="text-xs font-bold text-slate-500 uppercase">Kegiatan Inti:</label>
                          <input
                            type="text"
                            value={kegiatanIntiTitle}
                            onChange={(e) => setKegiatanIntiTitle(e.target.value)}
                            className="bg-white border border-slate-200 hover:border-slate-300 focus:border-[#5AB2FF] rounded-xl px-3 py-1 text-xs font-black text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#5AB2FF] w-64 shadow-xs"
                            placeholder="Kegiatan Inti"
                          />
                        </div>
                        <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-xl shadow-xs self-start sm:self-auto">
                          <Clock size={12} className="text-[#5AB2FF] shrink-0" />
                          <input
                            type="number"
                            value={durasiInti || ''}
                            onChange={(e) => handleManualChange('inti', parseInt(e.target.value))}
                            className="w-12 text-center bg-white border border-slate-200 rounded-lg text-xs font-black text-slate-800 py-0.5 focus:outline-none focus:ring-1 focus:ring-[#5AB2FF]"
                            min="0"
                            required
                          />
                          <span className="text-[10px] font-extrabold text-slate-500 pr-0.5">Mnt</span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {intiInput.map((phaseItem, sIdx) => (
                          <div key={sIdx} className="space-y-2 bg-white p-3.5 rounded-2xl border border-slate-200/60 shadow-sm">
                            <div className="flex justify-between items-center mb-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-extrabold text-indigo-700 uppercase block leading-relaxed">{phaseItem.phase}</span>
                                {extractLabel(phaseItem.description).label && (
                                  <span className="px-2 py-0.5 rounded-lg text-[9px] font-bold bg-sky-100 text-sky-700 uppercase">
                                    {extractLabel(phaseItem.description).label}
                                  </span>
                                )}
                              </div>
                              
                              <button
                                type="button"
                                onClick={() => {
                                  if (selectedSintaksIndex === sIdx) {
                                    setSelectedSintaksIndex(null);
                                  } else {
                                    setSelectedSintaksIndex(sIdx);
                                    setTempSintaksText(getSintaksSuggestion(sIdx));
                                  }
                                }}
                                className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold flex items-center gap-1 transition-all border shrink-0 ${
                                  selectedSintaksIndex === sIdx
                                    ? 'bg-indigo-600 text-white border-indigo-700'
                                    : 'bg-indigo-50 hover:bg-indigo-100 text-[#5AB2FF] border-[#5AB2FF]/30'
                                }`}
                              >
                                <Sparkles size={11} />
                                <span>{selectedSintaksIndex === sIdx ? 'Tutup Asisten' : 'Asisten Kegiatan Inti'}</span>
                              </button>
                            </div>

                            <textarea 
                              value={extractLabel(phaseItem.description).description}
                              onChange={(e) => handleIntiDescChange(sIdx, e.target.value)}
                              rows={3}
                              placeholder="Deskripsikan langkah kegiatan pada bagian ini..."
                              className="w-full bg-slate-50 border border-slate-150 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:bg-white text-justify"
                              required
                            />

                            {/* Dropdown collapsible for Sintaks Core Activity suggestion */}
                            {selectedSintaksIndex === sIdx && (
                              <div className="mt-2 bg-indigo-50/50 rounded-xl border border-indigo-100 p-3.5 space-y-3.5 animate-fadeIn text-left">
                                <div className="flex items-center justify-between border-b border-indigo-150 pb-1.5">
                                  <div className="flex items-center gap-1 text-indigo-700 font-extrabold text-[10px] uppercase">
                                    <Sparkles size={12} className="text-[#5AB2FF]" />
                                    <span>Asisten Penulisan Kegiatan Inti Sagara</span>
                                  </div>
                                  <span className="text-[9px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
                                    Integrasi Data
                                  </span>
                                </div>
                                
                                <p className="text-[10px] text-slate-600 leading-relaxed bg-white/60 p-2.5 rounded-lg border border-slate-100 italic">
                                  Menyesuaikan secara otomatis terhadap: Model <strong className="text-indigo-900 font-bold">{model}</strong>, Pendekatan <strong className="text-indigo-900 font-bold">{pendekatan}</strong>, Strategi <strong className="text-indigo-900 font-bold">{strategi}</strong>, Lingkungan <strong className="text-indigo-900 font-bold">{lingkungan || 'Ruang kelas'}</strong>, and Media <strong className="text-indigo-900 font-bold">{digital || 'YouTube / Canva'}</strong>.
                                </p>

                                <div className="space-y-1">
                                  <label className="text-[9px] font-bold text-slate-400 uppercase block">Usulan Deskripsi Guru & Murid (Bebas disunting):</label>
                                  <textarea
                                    value={tempSintaksText}
                                    onChange={(e) => setTempSintaksText(e.target.value)}
                                    rows={4}
                                    className="w-full bg-white text-xs text-slate-800 p-2 border border-indigo-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#5AB2FF] text-justify"
                                  />
                                </div>

                                <div className="flex justify-end gap-1.5 text-[10px] pt-1">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedSintaksIndex(null)}
                                    className="px-2.5 py-1.5 border border-slate-200 text-slate-500 rounded-lg font-bold bg-white hover:bg-slate-50"
                                  >
                                    Batal
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleIntiDescChange(sIdx, tempSintaksText);
                                      setSelectedSintaksIndex(null);
                                      onShowNotification('Saran skenario dipasang di Kegiatan Inti!', 'success');
                                    }}
                                    className="px-3.5 py-1.5 bg-[#5AB2FF] text-white rounded-lg font-black hover:opacity-95 transition-all shadow-sm shadow-[#5AB2FF]/10 flex items-center gap-1"
                                  >
                                    <Save size={10} />
                                    Terapkan ke Kegiatan Inti
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Kegiatan Penutup */}
                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <label className="text-xs font-bold text-slate-500 uppercase">Kegiatan Penutup:</label>
                          <input
                            type="text"
                            value={kegiatanPenutupTitle}
                            onChange={(e) => setKegiatanPenutupTitle(e.target.value)}
                            className="bg-white border border-slate-200 hover:border-slate-300 focus:border-[#5AB2FF] rounded-xl px-3 py-1 text-xs font-black text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#5AB2FF] w-64 shadow-xs"
                            placeholder="Kegiatan Penutup (Berkesadaran)"
                          />
                          <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-xl shadow-xs">
                            <Clock size={12} className="text-[#5AB2FF] shrink-0" />
                            <input
                              type="number"
                              value={durasiPenutup || ''}
                              onChange={(e) => handleManualChange('penutup', parseInt(e.target.value))}
                              className="w-12 text-center bg-white border border-slate-200 rounded-lg text-xs font-black text-slate-800 py-0.5 focus:outline-none focus:ring-1 focus:ring-[#5AB2FF]"
                              min="0"
                              required
                            />
                            <span className="text-[10px] font-extrabold text-slate-500 pr-0.5">Mnt</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={syncKegiatanAwalDanPenutup}
                            className="bg-indigo-50 hover:bg-indigo-100 text-[#5AB2FF] border border-[#5AB2FF]/30 px-3 py-1 rounded-xl text-[11px] font-black flex items-center gap-1 transition-all"
                            title="Sesuaikan otomatis isi kegiatan awal & penutup berdasarkan Topik, TP, dan Model Pembelajaran"
                          >
                            <Sparkles size={11} className="text-amber-500" />
                            Sesuaikan Otomatis
                          </button>
                          <button
                            type="button"
                            onClick={handleAddPenutup}
                            className="text-[#5AB2FF] border border-[#5AB2FF]/30 hover:bg-indigo-50 px-3 py-1 rounded-xl text-[11px] font-extrabold flex items-center gap-1"
                          >
                            <Plus size={12} />
                            Tambah Kegiatan
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {penutupInput.map((penutupItem, pIdx) => (
                          <div key={pIdx} className="flex gap-2">
                            <textarea 
                              value={penutupItem}
                              onChange={(e) => handlePenutupChange(pIdx, e.target.value)}
                              placeholder={`Langkah Kegiatan Penutup ke-${pIdx + 1}`}
                              rows={2}
                              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#5AB2FF] text-justify"
                              required
                            />
                            {penutupInput.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemovePenutup(pIdx)}
                                className="bg-rose-50 hover:bg-rose-100 text-rose-700 p-2 rounded-xl transition-all border border-rose-200"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5. ASESMEN PEMBELAJARAN */}
                <div className="space-y-4 pt-4 border-t border-slate-100 font-sans">
                  <h4 className="text-sm font-extrabold text-slate-800 border-l-4 border-[#5AB2FF] pl-3 uppercase tracking-wider font-sans">
                    5. Asesmen & Penilaian Hasil Belajar
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans">
                    {/* Asesmen Awal */}
                    <div className="space-y-1.5 font-sans">
                      <label className="text-xs font-bold text-slate-500 uppercase">Asesmen Awal</label>
                      <textarea 
                        value={asesmenAwal}
                        onChange={(e) => setAsesmenAwal(e.target.value)}
                        rows={2}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                        required
                      />
                    </div>
                    {/* Asesmen Proses */}
                    <div className="space-y-1.5 font-sans">
                      <label className="text-xs font-bold text-slate-500 uppercase font-sans">Asesmen Proses</label>
                      <textarea 
                        value={asesmenProses}
                        onChange={(e) => setAsesmenProses(e.target.value)}
                        rows={2}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                        required
                      />
                    </div>
                    {/* Asesmen Akhir */}
                    <div className="space-y-1.5 font-sans">
                      <label className="text-xs font-bold text-slate-500 uppercase font-sans">Asesmen Akhir</label>
                      <textarea 
                        value={asesmenAkhir}
                        onChange={(e) => setAsesmenAkhir(e.target.value)}
                        rows={2}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  {/* NEW: Lampiran - Moved outside grid for full width */}
                  <div className="space-y-2 font-sans mt-6 border-t border-slate-100 pt-6">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-500 uppercase font-sans tracking-widest">Lampiran Dokumen RPM</label>
                      <span className="text-[10px] text-slate-400 italic">Maksimal 3 Lampiran</span>
                    </div>
                    <AttachmentEditor 
                      attachments={attachments}
                      onChange={setAttachments}
                      planData={{ topic, subject, classSemester, timeAllocation, profileDimensions: selectedDimensions }}
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions Footer */}
              <div className="bg-slate-50 border-t border-slate-100 p-6 flex items-center justify-end gap-3 rounded-b-3xl">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentTab('dashboard');
                    handleResetForm();
                  }}
                  className="bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 font-bold px-5 py-2.5 rounded-2xl transition-all text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-[#5AB2FF] to-[#A0DEFF] text-white font-bold px-6 py-2.5 rounded-2xl shadow hover:opacity-95 active:scale-95 transition-all text-xs flex items-center gap-1"
                >
                  <Save size={14} />
                  Simpan RPM
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
