import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { 
  Search, Printer, Download, ArrowUpDown, ChevronUp, ChevronDown, 
  Users, UserCheck, Eye, RefreshCw, X, Shield, Award, MapPin, 
  Phone, Briefcase, Heart, BookOpen
} from 'lucide-react';
import { Student } from '../types';

interface IkhtisarIndukViewProps {
  students: Student[];
  schoolProfile: any;
  onShowNotification: (message: string, type: 'success' | 'error' | 'warning') => void;
  isReadOnly?: boolean;
  onUpdateMultipleStudents?: (updatedStudents: Student[]) => void;
}

export const IkhtisarIndukView: React.FC<IkhtisarIndukViewProps> = ({
  students,
  schoolProfile,
  onShowNotification,
  isReadOnly = false,
  onUpdateMultipleStudents
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedGender, setSelectedGender] = useState('all');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [bulkBukuInduk, setBulkBukuInduk] = useState('');
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  
  // Default sorting A-Z berdasarkan NIS (key: 'nis', direction: 'asc')
  const [sortConfig, setSortConfig] = useState<{ key: keyof Student; direction: 'asc' | 'desc' }>({
    key: 'nis',
    direction: 'asc'
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    // Asumsi format yyyy-mm-dd
    const parts = dateString.split('-');
    if (parts.length === 3) {
      return `${parts[2]} - ${parts[1]} - ${parts[0]}`;
    }
    return dateString;
  };

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Get list of unique classIds
  const classes = useMemo(() => {
    const classSet = new Set(students.map(s => s.classId).filter(Boolean));
    return Array.from(classSet).sort();
  }, [students]);

  // Statistics
  const stats = useMemo(() => {
    const total = students.length;
    const lCount = students.filter(s => s.gender === 'L').length;
    const pCount = students.filter(s => s.gender === 'P').length;
    return { total, lCount, pCount };
  }, [students]);

  // Handle Sort
  const requestSort = (key: keyof Student) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Filter and Sort Students
  const processedStudents = useMemo(() => {
    let result = [...students];

    // 1. Search term filter
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(s => 
        s.name.toLowerCase().includes(term) || 
        s.nis.toLowerCase().includes(term) || 
        (s.nisn && s.nisn.toLowerCase().includes(term)) ||
        (s.nik && s.nik.toLowerCase().includes(term))
      );
    }

    // 2. Class filter
    if (selectedClass !== 'all') {
      result = result.filter(s => s.classId === selectedClass);
    }

    // 3. Gender filter
    if (selectedGender !== 'all') {
      result = result.filter(s => s.gender === selectedGender);
    }

    // 4. Sorting (Default is A-Z based on NIS)
    result.sort((a, b) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];

      if (valA === undefined || valA === null) valA = '';
      if (valB === undefined || valB === null) valB = '';

      // Alphanumeric sorting (e.g. comparing '002' with '010', or names)
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortConfig.direction === 'asc'
          ? valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' })
          : valB.localeCompare(valA, undefined, { numeric: true, sensitivity: 'base' });
      }

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [students, searchTerm, selectedClass, selectedGender, sortConfig]);

  // Export to Excel
  const handleExportExcel = () => {
    if (processedStudents.length === 0) {
      onShowNotification('Tidak ada data untuk diekspor', 'warning');
      return;
    }

    const headers = [
      'No', 'No. Buku Induk', 'NIS', 'NISN', 'NIK', 'Nama Lengkap', 'L/P', 'Kelas', 
      'Tempat, Tanggal Lahir', 'Agama', 'Alamat', 
      'Nama Ayah', 'Pekerjaan Ayah', 'Nama Ibu', 'Pekerjaan Ibu', 
      'No. HP Orang Tua', 'Status Ekonomi'
    ];

    const rows = processedStudents.map((s, idx) => [
      idx + 1,
      s.bukuInduk || '-',
      s.nis,
      s.nisn || '-',
      s.nik || '-',
      s.name.toUpperCase(),
      s.gender,
      s.classId || '-',
      `${s.birthPlace || '-'}, ${formatDate(s.birthDate)}`,
      s.religion || '-',
      s.address || '-',
      s.fatherName || '-',
      s.fatherJob || '-',
      s.motherName || '-',
      s.motherJob || '-',
      s.parentPhone ? String(s.parentPhone).replace(/^'/, '') : '-',
      s.economyStatus || '-'
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ikhtisar Induk');
    
    // Auto-fit column widths
    const maxLens = headers.map((_, i) => Math.max(...[headers[i], ...rows.map(r => String(r[i] || ''))].map(v => v.length)));
    worksheet['!cols'] = maxLens.map(len => ({ wch: Math.min(40, Math.max(10, len + 2)) }));

    XLSX.writeFile(workbook, `ikhtisar_induk_siswa_${new Date().toISOString().split('T')[0]}.xlsx`);
    onShowNotification('Data berhasil diekspor ke Excel', 'success');
  };

  // Print in Arial Font
  const handlePrint = () => {
    if (processedStudents.length === 0) {
      onShowNotification('Tidak ada data untuk dicetak', 'warning');
      return;
    }

    // Hitung panjang karakter maksimal untuk menentukan lebar kolom secara proporsional
    let maxNameLen = 10;
    let maxBirthLen = 10;
    let maxAddressLen = 10;
    let maxParentsLen = 10;
    let maxNisLen = 5;
    let maxBukuIndukLen = 5;
    let maxNisnLen = 5;
    let maxPhoneLen = 8;

    processedStudents.forEach(s => {
      const nameLen = (s.name || '').length;
      const birthLen = `${s.birthPlace || ''}, ${formatDate(s.birthDate)}`.length;
      const addrLen = (s.address || '').length;
      const parentsLen = `${s.fatherName || ''} / ${s.motherName || ''}`.length;
      const nisLen = (s.nis || '').length;
      const bukuIndukLen = (s.bukuInduk || '').length;
      const nisnLen = (s.nisn || '').length;
      const phoneLen = String(s.parentPhone || '').replace(/^'/, '').length;

      if (nameLen > maxNameLen) maxNameLen = nameLen;
      if (birthLen > maxBirthLen) maxBirthLen = birthLen;
      if (addrLen > maxAddressLen) maxAddressLen = addrLen;
      if (parentsLen > maxParentsLen) maxParentsLen = parentsLen;
      if (nisLen > maxNisLen) maxNisLen = nisLen;
      if (bukuIndukLen > maxBukuIndukLen) maxBukuIndukLen = bukuIndukLen;
      if (nisnLen > maxNisnLen) maxNisnLen = nisnLen;
      if (phoneLen > maxPhoneLen) maxPhoneLen = phoneLen;
    });

    // Lebar kolom tetap (fixed columns)
    const colNoWidth = 30;
    const colGenderWidth = 35;
    const colClassWidth = 45;
    
    // Lebar kolom terukur (semi-fixed)
    const colNisWidth = Math.max(60, Math.min(85, maxNisLen * 7 + 10));
    const colBukuIndukWidth = Math.max(70, Math.min(90, maxBukuIndukLen * 7 + 10));
    const colNisnWidth = Math.max(70, Math.min(95, maxNisnLen * 7 + 10));
    const colPhoneWidth = Math.max(85, Math.min(110, maxPhoneLen * 7 + 10));
    
    const sumFixed = colNoWidth + colBukuIndukWidth + colNisWidth + colGenderWidth + colClassWidth + colNisnWidth + colPhoneWidth;
    
    // Total printable width pada kertas A4 landscape adalah ~1060px
    const totalPrintableWidth = 1060;
    const remainingWidth = totalPrintableWidth - sumFixed; // sisa lebar didistribusikan ke kolom fleksibel
    
    // Bobot pembagian lebar berdasarkan panjang karakter
    const nameWeight = maxNameLen;
    const birthWeight = maxBirthLen * 0.9;
    const addressWeight = maxAddressLen * 1.15; // Beri bobot lebih untuk alamat agar tidak terlalu sempit
    const parentsWeight = maxParentsLen * 0.95;
    
    const totalWeight = nameWeight + birthWeight + addressWeight + parentsWeight;
    
    // Alokasi lebar kolom dalam pixel
    const colNameWidth = Math.round((nameWeight / totalWeight) * remainingWidth);
    const colBirthWidth = Math.round((birthWeight / totalWeight) * remainingWidth);
    const colAddressWidth = Math.round((addressWeight / totalWeight) * remainingWidth);
    const colParentsWidth = Math.round((parentsWeight / totalWeight) * remainingWidth);

    // Tentukan ukuran font secara cerdas dan otomatis berdasarkan kepadatan teks total
    let tableFontSize = '8.5pt';
    let tableLineHeight = '1.3';
    if (totalWeight > 140) {
      tableFontSize = '7.2pt';
      tableLineHeight = '1.15';
    } else if (totalWeight > 110) {
      tableFontSize = '8pt';
      tableLineHeight = '1.2';
    } else if (totalWeight < 65) {
      tableFontSize = '9.5pt';
      tableLineHeight = '1.4';
    }

    const rowsHtml = processedStudents.map((s, idx) => `
      <tr style="page-break-inside: avoid; break-inside: avoid;">
        <td style="text-align: center; width: ${colNoWidth}px; max-width: ${colNoWidth}px;">${idx + 1}</td>
        <td style="font-family: monospace; font-size: 0.95em; text-align: center; width: ${colBukuIndukWidth}px; max-width: ${colBukuIndukWidth}px;">${s.bukuInduk || '-'}</td>
        <td style="font-family: monospace; font-size: 0.95em; text-align: center; width: ${colNisWidth}px; max-width: ${colNisWidth}px;">${s.nis}</td>
        <td style="font-family: monospace; font-size: 0.95em; text-align: center; width: ${colNisnWidth}px; max-width: ${colNisnWidth}px;">${s.nisn || '-'}</td>
        <td style="font-weight: bold; text-transform: uppercase; width: ${colNameWidth}px; max-width: ${colNameWidth}px; word-wrap: break-word; overflow-wrap: break-word; white-space: normal;">${s.name}</td>
        <td style="text-align: center; font-weight: bold; width: ${colGenderWidth}px; max-width: ${colGenderWidth}px;">${s.gender}</td>
        <td style="text-align: center; font-weight: bold; width: ${colClassWidth}px; max-width: ${colClassWidth}px;">${s.classId || '-'}</td>
        <td style="width: ${colBirthWidth}px; max-width: ${colBirthWidth}px; word-wrap: break-word; overflow-wrap: break-word; white-space: normal;">${s.birthPlace || '-'}, ${formatDate(s.birthDate)}</td>
        <td style="width: ${colAddressWidth}px; max-width: ${colAddressWidth}px; word-wrap: break-word; overflow-wrap: break-word; white-space: normal; font-size: 0.95em;">${s.address || '-'}</td>
        <td style="width: ${colParentsWidth}px; max-width: ${colParentsWidth}px; word-wrap: break-word; overflow-wrap: break-word; white-space: normal;">
          <div style="font-weight: bold; color: #111;">A: ${s.fatherName || '-'}</div>
          <div style="color: #444; margin-top: 2px;">I: ${s.motherName || '-'}</div>
        </td>
        <td style="font-family: monospace; text-align: center; width: ${colPhoneWidth}px; max-width: ${colPhoneWidth}px;">${s.parentPhone ? String(s.parentPhone).replace(/^'/, '') : '-'}</td>
      </tr>
    `).join('');

    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!printWindow) {
      onShowNotification('Gagal membuka jendela cetak. Pastikan pop-up tidak diblokir.', 'error');
      return;
    }

    const logoKiriHtml = schoolProfile?.regencyLogo 
      ? `<img src="${schoolProfile.regencyLogo}" alt="" style="max-width: 65px; max-height: 65px; object-fit: contain;" />`
      : `<div style="width: 50px; height: 50px; border: 1px solid #000; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 8px; font-weight: bold;">LOGO</div>`;

    const logoKananHtml = schoolProfile?.schoolLogo 
      ? `<img src="${schoolProfile.schoolLogo}" alt="" style="max-width: 65px; max-height: 65px; object-fit: contain;" />`
      : `<div style="width: 65px; height: 65px;"></div>`;

    const htmlContent = `
      <html>
        <head>
          <title>Ikhtisar Induk Data Siswa</title>
          <style>
            @page {
              size: A4 landscape;
              margin: 12mm 10mm 12mm 10mm;
            }
            body {
              font-family: Arial, Helvetica, sans-serif !important;
              color: #000;
              background: #fff;
              margin: 0;
              padding: 0;
              font-size: 9pt;
              line-height: 1.3;
            }
            .kop-surat {
              display: flex;
              align-items: center;
              justify-content: space-between;
              border-bottom: 4px double #000;
              padding-bottom: 8px;
              margin-bottom: 15px;
            }
            .kop-logo {
              width: 70px;
              height: 70px;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .kop-text {
              flex: 1;
              text-align: center;
              padding: 0 10px;
            }
            .kop-text h3 {
              margin: 0;
              font-size: 11pt;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .kop-text h4 {
              margin: 2px 0 0 0;
              font-size: 9pt;
              font-weight: bold;
              text-transform: uppercase;
            }
            .kop-text h2 {
              margin: 2px 0 0 0;
              font-size: 11.5pt;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .kop-text p {
              margin: 3px 0 0 0;
              font-size: 8pt;
              color: #444;
            }
            .doc-title-block {
              text-align: center;
              margin-bottom: 15px;
            }
            .doc-title-block h2 {
              margin: 0;
              font-size: 11.5pt;
              font-weight: bold;
              text-transform: uppercase;
              text-decoration: underline;
            }
            .doc-title-block p {
              margin: 5px 0 0 0;
              font-size: 9pt;
              font-weight: bold;
              text-transform: uppercase;
            }
            .meta-info {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
              font-weight: bold;
              font-size: 8.5pt;
              color: #333;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 25px;
              table-layout: fixed;
            }
            th, td {
              border: 1px solid #000;
              padding: 5px 6px;
              text-align: left;
              vertical-align: middle;
              font-size: ${tableFontSize};
              line-height: ${tableLineHeight};
            }
            th {
              background-color: #f2f2f2 !important;
              text-align: center;
              font-weight: bold;
              -webkit-print-color-adjust: exact;
            }
            .signature-section {
              margin-top: 30px;
              display: flex;
              justify-content: space-between;
              font-size: 9.5pt;
              page-break-inside: avoid;
              break-inside: avoid;
              line-height: 1.15;
            }
            .signature-block {
              width: 250px;
              text-align: center;
              line-height: 1.15;
            }
            .signature-space {
              height: 60px;
              position: relative;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .signature-img {
              height: 55px;
              object-fit: contain;
              position: absolute;
            }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="kop-surat">
            <div class="kop-logo">${logoKiriHtml}</div>
            <div class="kop-text">
              <h3>PEMERINTAH KABUPATEN ${schoolProfile?.kabupaten?.toUpperCase() || "TUBAN"}</h3>
              <h4>DINAS PENDIDIKAN</h4>
              <h2>${schoolProfile?.name?.toUpperCase() || "UPTD SATUAN PENDIDIKAN SDN REMEN"}</h2>
              <p>
                ${(schoolProfile?.jalan || schoolProfile?.address) ? `Alamat: ${schoolProfile?.jalan || schoolProfile?.address}` : ''}
                ${(schoolProfile?.jalan || schoolProfile?.address) && schoolProfile?.postalCode ? ' • ' : ''}
                ${schoolProfile?.postalCode ? `Kode Pos: ${schoolProfile.postalCode}` : ''}
              </p>
            </div>
            <div class="kop-logo">${logoKananHtml}</div>
          </div>

          <div class="doc-title-block">
            <h2>IKHTISAR INDUK DATA SISWA LENGKAP</h2>
            <p>TAHUN AJARAN ${schoolProfile?.year || "2024/2025"} - SEMESTER ${schoolProfile?.semester || "1"}</p>
          </div>

          <div class="meta-info">
            <div>Jumlah Total: ${processedStudents.length} Siswa Terdaftar (L: ${processedStudents.filter(s => s.gender === 'L').length}, P: ${processedStudents.filter(s => s.gender === 'P').length})</div>
            <div>Dicetak pada: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: ${colNoWidth}px; max-width: ${colNoWidth}px;">No</th>
                <th style="width: ${colBukuIndukWidth}px; max-width: ${colBukuIndukWidth}px;">No. Buku Induk</th>
                <th style="width: ${colNisWidth}px; max-width: ${colNisWidth}px;">NIS</th>
                <th style="width: ${colNisnWidth}px; max-width: ${colNisnWidth}px;">NISN</th>
                <th style="width: ${colNameWidth}px; max-width: ${colNameWidth}px;">Nama Lengkap</th>
                <th style="width: ${colGenderWidth}px; max-width: ${colGenderWidth}px;">L/P</th>
                <th style="width: ${colClassWidth}px; max-width: ${colClassWidth}px;">Kelas</th>
                <th style="width: ${colBirthWidth}px; max-width: ${colBirthWidth}px;">Tempat, Tgl Lahir</th>
                <th style="width: ${colAddressWidth}px; max-width: ${colAddressWidth}px;">Alamat</th>
                <th style="width: ${colParentsWidth}px; max-width: ${colParentsWidth}px;">Orang Tua (A/I)</th>
                <th style="width: ${colPhoneWidth}px; max-width: ${colPhoneWidth}px;">HP Orang Tua</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div class="signature-section">
            <div class="signature-block">
              <p>Mengetahui,</p>
              <p style="font-weight: bold;">Kepala ${schoolProfile?.name || "Sekolah"}</p>
              <div class="signature-space">
                ${schoolProfile?.headmasterSignature ? `<img src="${schoolProfile.headmasterSignature}" class="signature-img" />` : ''}
              </div>
              <p style="text-decoration: underline; font-weight: bold; margin: 0;">${schoolProfile?.headmaster || "[Nama Kepala Sekolah]"}</p>
              <p style="margin: 2px 0 0 0; font-size: 8.5pt;">NIP. ${schoolProfile?.headmasterNip || "[NIP Kepala Sekolah]"}</p>
            </div>
            <div class="signature-block">
              <p>
                ${schoolProfile?.desa ? `${schoolProfile.desa}, ` : ""}${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              <p style="font-weight: bold;">Wali Kelas / Petugas TU</p>
              <div class="signature-space">
                <!-- write space for signature -->
              </div>
              <p style="text-decoration: underline; font-weight: bold; margin: 0;">...................................</p>
              <p style="margin: 2px 0 0 0; font-size: 8.5pt;">NIP. ...................................</p>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* HEADER CARD */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#CAF4FF] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
            <div className="p-2 bg-[#CAF4FF]/50 text-[#5AB2FF] rounded-xl">
              <Users size={24} />
            </div>
            IKHTISAR INDUK DATA SISWA
          </h2>
          <p className="text-slate-400 mt-1 font-medium">
            Rekapitulasi dan overview data seluruh siswa di sekolah.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 w-full md:w-auto">
          <button 
            onClick={handlePrint}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-all"
          >
            <Printer size={16} /> Cetak
          </button>
          <button 
            onClick={handleExportExcel}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-[#5AB2FF] hover:bg-[#5AB2FF]/90 text-white font-bold text-sm rounded-xl shadow-md shadow-[#5AB2FF]/20 transition-all"
          >
            <Download size={16} /> Ekspor Excel
          </button>
        </div>
      </div>

      {/* STATS PANELS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-[#CAF4FF]/40 to-[#A0DEFF]/20 border border-[#CAF4FF] rounded-2xl p-4 flex items-center space-x-4">
          <div className="p-3 bg-white text-[#5AB2FF] rounded-xl shadow-sm">
            <Users size={24} />
          </div>
          <div>
            <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Total Siswa Terdaftar</span>
            <span className="text-2xl font-black text-slate-800 font-mono">{stats.total}</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-50/50 to-indigo-100/20 border border-indigo-100 rounded-2xl p-4 flex items-center space-x-4">
          <div className="p-3 bg-white text-indigo-500 rounded-xl shadow-sm">
            <UserCheck size={24} />
          </div>
          <div>
            <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Laki-Laki (L)</span>
            <span className="text-2xl font-black text-slate-800 font-mono">{stats.lCount}</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-rose-50/50 to-rose-100/20 border border-rose-100 rounded-2xl p-4 flex items-center space-x-4">
          <div className="p-3 bg-white text-rose-500 rounded-xl shadow-sm">
            <UserCheck size={24} />
          </div>
          <div>
            <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Perempuan (P)</span>
            <span className="text-2xl font-black text-slate-800 font-mono">{stats.pCount}</span>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white rounded-2xl border border-[#CAF4FF] p-4 flex flex-col lg:flex-row gap-4 items-center">
        {/* Search input */}
        <div className="relative w-full lg:flex-1">
          <Search size={18} className="absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama, NIS, NISN, atau NIK siswa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-[#5AB2FF] focus:ring-1 focus:ring-[#5AB2FF] outline-none transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          {/* Class Filter */}
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-400 uppercase whitespace-nowrap">Kelas:</span>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="flex-1 sm:flex-none px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none font-semibold text-slate-700 hover:border-slate-300 focus:bg-white focus:border-[#5AB2FF] transition-all"
            >
              <option value="all">Semua Kelas</option>
              {classes.map(c => (
                <option key={c} value={c}>Kelas {c}</option>
              ))}
            </select>
          </div>

          {/* Gender Filter */}
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-400 uppercase whitespace-nowrap">Gender:</span>
            <select
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
              className="flex-1 sm:flex-none px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none font-semibold text-slate-700 hover:border-slate-300 focus:bg-white focus:border-[#5AB2FF] transition-all"
            >
              <option value="all">Semua</option>
              <option value="L">Laki-Laki (L)</option>
              <option value="P">Perempuan (P)</option>
            </select>
          </div>

          {/* Reset Filter Button */}
          {(searchTerm !== '' || selectedClass !== 'all' || selectedGender !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedClass('all');
                setSelectedGender('all');
              }}
              className="p-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 w-full sm:w-auto whitespace-nowrap"
            >
              <RefreshCw size={14} /> Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* BULK ACTION BAR */}
      {selectedStudentIds.length > 0 && !isReadOnly && (
        <div className="bg-indigo-50 rounded-2xl border border-indigo-100 p-4 flex flex-col sm:flex-row gap-4 justify-between items-center animate-scale-up">
          <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm">
            <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded-lg">{selectedStudentIds.length}</span> Siswa Terpilih
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="No. Buku Induk..."
              value={bulkBukuInduk}
              onChange={(e) => setBulkBukuInduk(e.target.value)}
              className="flex-1 sm:flex-none px-3 py-2 bg-white border border-indigo-200 rounded-xl text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
            <button
              onClick={() => {
                if (!bulkBukuInduk.trim()) {
                  onShowNotification('Masukkan No. Buku Induk terlebih dahulu', 'warning');
                  return;
                }
                if (onUpdateMultipleStudents) {
                  const studentsToUpdate = students
                    .filter(s => selectedStudentIds.includes(s.id))
                    .map(s => ({ ...s, bukuInduk: bulkBukuInduk }));
                  onUpdateMultipleStudents(studentsToUpdate);
                  setSelectedStudentIds([]);
                  setBulkBukuInduk('');
                  onShowNotification(`Berhasil memperbarui No. Buku Induk untuk ${studentsToUpdate.length} siswa`, 'success');
                }
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-colors whitespace-nowrap"
            >
              Simpan
            </button>
          </div>
        </div>
      )}

      {/* TABLE VIEW */}
      <div className="bg-white rounded-2xl border border-[#CAF4FF] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-[#CAF4FF]/30 text-slate-700 font-semibold border-b border-[#CAF4FF]">
              <tr>
                {!isReadOnly && (
                  <th className="px-4 py-3.5 text-center w-10">
                    <input
                      type="checkbox"
                      checked={processedStudents.length > 0 && selectedStudentIds.length === processedStudents.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedStudentIds(processedStudents.map(s => s.id));
                        } else {
                          setSelectedStudentIds([]);
                        }
                      }}
                      className="w-4 h-4 rounded text-[#5AB2FF] border-slate-300 focus:ring-[#5AB2FF]"
                    />
                  </th>
                )}
                <th className="px-4 py-3.5 text-center w-12">No</th>
                
                <th className="px-4 py-3.5 w-32 font-bold">No. Buku Induk</th>
                
                {/* Clickable Header for NIS */}
                <th 
                  className="px-4 py-3.5 cursor-pointer hover:bg-[#CAF4FF]/50 transition-colors w-28 group select-none"
                  onClick={() => requestSort('nis')}
                >
                  <div className="flex items-center gap-1 font-bold">
                    NIS
                    <ArrowUpDown size={14} className="text-slate-400 group-hover:text-slate-600 transition-colors shrink-0" />
                    {sortConfig.key === 'nis' && (
                      sortConfig.direction === 'asc' ? <ChevronUp size={12} className="text-[#5AB2FF] shrink-0" /> : <ChevronDown size={12} className="text-[#5AB2FF] shrink-0" />
                    )}
                  </div>
                </th>

                <th className="px-4 py-3.5 w-32 font-bold">NISN</th>
                
                {/* Clickable Header for Name */}
                <th 
                  className="px-4 py-3.5 cursor-pointer hover:bg-[#CAF4FF]/50 transition-colors group select-none"
                  onClick={() => requestSort('name')}
                >
                  <div className="flex items-center gap-1 font-bold">
                    Nama Siswa
                    <ArrowUpDown size={14} className="text-slate-400 group-hover:text-slate-600 transition-colors shrink-0" />
                    {sortConfig.key === 'name' && (
                      sortConfig.direction === 'asc' ? <ChevronUp size={12} className="text-[#5AB2FF] shrink-0" /> : <ChevronDown size={12} className="text-[#5AB2FF] shrink-0" />
                    )}
                  </div>
                </th>

                <th className="px-4 py-3.5 text-center w-20 font-bold">L/P</th>
                <th className="px-4 py-3.5 text-center w-24 font-bold">Kelas</th>
                <th className="px-4 py-3.5 font-bold">Tempat, Tanggal Lahir</th>
                <th className="px-4 py-3.5 font-bold">No. HP Orang Tua</th>
                <th className="px-4 py-3.5 text-center w-28 font-bold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {processedStudents.length > 0 ? (
                processedStudents.map((student, index) => (
                  <tr 
                    key={student.id} 
                    className={`hover:bg-[#CAF4FF]/10 transition-colors group cursor-pointer ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}
                    onClick={() => setSelectedStudent(student)}
                  >
                    {!isReadOnly && (
                      <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedStudentIds.includes(student.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStudentIds(prev => [...prev, student.id]);
                            } else {
                              setSelectedStudentIds(prev => prev.filter(id => id !== student.id));
                            }
                          }}
                          className="w-4 h-4 rounded text-[#5AB2FF] border-slate-300 focus:ring-[#5AB2FF]"
                        />
                      </td>
                    )}
                    <td className="px-4 py-3 text-center text-slate-400 font-mono text-xs">{index + 1}</td>
                    <td className="px-4 py-3 font-mono text-slate-800 font-bold whitespace-nowrap text-xs bg-indigo-50/50">{student.bukuInduk || '-'}</td>
                    <td className="px-4 py-3 font-mono text-slate-600 font-semibold whitespace-nowrap text-xs">{student.nis}</td>
                    <td className="px-4 py-3 font-mono text-slate-400 whitespace-nowrap text-xs">{student.nisn || '-'}</td>
                    <td className="px-4 py-3 font-semibold text-slate-700 whitespace-nowrap uppercase text-xs">
                      {student.name}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span className={`inline-block px-2.5 py-0.5 text-[10px] font-extrabold rounded-full ${
                        student.gender === 'L' 
                          ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' 
                          : 'bg-rose-50 text-rose-600 border border-rose-100'
                      }`}>
                        {student.gender}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold border border-slate-200">
                        Kelas {student.classId}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {student.birthPlace || '-'}, {formatDate(student.birthDate)}
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-semibold font-mono text-xs whitespace-nowrap">
                      {student.parentPhone ? String(student.parentPhone).replace(/^'/, '') : '-'}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedStudent(student)}
                        className="px-3 py-1 bg-slate-100 hover:bg-[#CAF4FF]/50 hover:text-[#5AB2FF] text-slate-600 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1 border border-slate-200"
                      >
                        <Eye size={12} /> Detail
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-slate-400 font-medium">
                    <Users size={32} className="mx-auto mb-2 text-slate-300" />
                    Tidak ada data siswa yang cocok dengan filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="bg-slate-50 px-4 py-3 border-t border-slate-100 text-xs font-semibold text-slate-400 flex justify-between items-center">
          <span>Menampilkan {processedStudents.length} dari {students.length} siswa</span>
          <span className="italic">* Urutan default: A-Z berdasarkan NIS</span>
        </div>
      </div>

      {/* STUDENT DETAILS MODAL */}
      {selectedStudent && (
        <div className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-[#CAF4FF] animate-scale-up">
            {/* Modal Header */}
            <div className="bg-[#CAF4FF]/40 border-b border-[#CAF4FF] px-6 py-4 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white text-[#5AB2FF] rounded-xl shadow-sm">
                  <Shield size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 tracking-tight uppercase">
                    BIODATA INDUK SISWA LENGKAP
                  </h3>
                  <p className="text-xs font-semibold text-[#5AB2FF] tracking-wide mt-0.5">
                    NIS: {selectedStudent.nis} &bull; NISN: {selectedStudent.nisn || '-'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedStudent(null)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Profile Overview */}
              <div className="flex flex-col md:flex-row items-center gap-6 pb-6 border-b border-slate-100">
                <div className="w-24 h-24 rounded-2xl bg-[#CAF4FF]/30 border-2 border-white shadow-md overflow-hidden shrink-0 flex items-center justify-center">
                  {selectedStudent.photo ? (
                    <img src={selectedStudent.photo} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <Users size={40} className="text-[#5AB2FF]/70" />
                  )}
                </div>
                <div className="text-center md:text-left space-y-1">
                  <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">{selectedStudent.name}</h4>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-xs">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold rounded-lg border border-slate-200">
                      Kelas {selectedStudent.classId}
                    </span>
                    <span className={`px-2 py-0.5 font-extrabold rounded-lg ${
                      selectedStudent.gender === 'L' 
                        ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' 
                        : 'bg-rose-50 text-rose-600 border border-rose-100'
                    }`}>
                      {selectedStudent.gender === 'L' ? 'Laki-Laki (L)' : 'Perempuan (P)'}
                    </span>
                    {selectedStudent.economyStatus && (
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-600 font-bold rounded-lg border border-amber-100">
                        Status: {selectedStudent.economyStatus}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Biodata Pribadi */}
                <div className="space-y-4">
                  <h5 className="text-sm font-bold text-slate-700 border-b border-slate-100 pb-1.5 flex items-center gap-2">
                    <Eye size={16} className="text-[#5AB2FF]" />
                    DATA DIRI SISWA
                  </h5>
                  <div className="space-y-2.5 text-xs text-slate-600">
                    <div className="flex justify-between border-b border-dashed border-slate-100 pb-1.5">
                      <span className="font-medium text-slate-400">No. Buku Induk</span>
                      <span className="font-semibold text-slate-800 font-mono">{selectedStudent.bukuInduk || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-slate-100 pb-1.5">
                      <span className="font-medium text-slate-400">NIK (No. KTP)</span>
                      <span className="font-semibold text-slate-800 font-mono">{selectedStudent.nik || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-slate-100 pb-1.5">
                      <span className="font-medium text-slate-400">Tempat, Tanggal Lahir</span>
                      <span className="font-semibold text-slate-800">{selectedStudent.birthPlace || '-'}, {formatDate(selectedStudent.birthDate)}</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-slate-100 pb-1.5">
                      <span className="font-medium text-slate-400">Agama</span>
                      <span className="font-semibold text-slate-800">{selectedStudent.religion || '-'}</span>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <span className="font-medium text-slate-400">Alamat Lengkap</span>
                      <span className="font-semibold text-slate-800 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100">
                        {selectedStudent.address || '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Data Orang Tua */}
                <div className="space-y-4">
                  <h5 className="text-sm font-bold text-slate-700 border-b border-slate-100 pb-1.5 flex items-center gap-2">
                    <Phone size={16} className="text-[#5AB2FF]" />
                    DATA ORANG TUA / WALI
                  </h5>
                  <div className="space-y-2.5 text-xs text-slate-600">
                    <div className="flex justify-between border-b border-dashed border-slate-100 pb-1.5">
                      <span className="font-medium text-slate-400">Nama Ayah</span>
                      <span className="font-semibold text-slate-800 uppercase">{selectedStudent.fatherName || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-slate-100 pb-1.5">
                      <span className="font-medium text-slate-400">Pekerjaan Ayah</span>
                      <span className="font-semibold text-slate-800">{selectedStudent.fatherJob || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-slate-100 pb-1.5">
                      <span className="font-medium text-slate-400">Pendidikan Ayah</span>
                      <span className="font-semibold text-slate-800">{selectedStudent.fatherEducation || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-slate-100 pb-1.5">
                      <span className="font-medium text-slate-400">Nama Ibu</span>
                      <span className="font-semibold text-slate-800 uppercase">{selectedStudent.motherName || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-slate-100 pb-1.5">
                      <span className="font-medium text-slate-400">Pekerjaan Ibu</span>
                      <span className="font-semibold text-slate-800">{selectedStudent.motherJob || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-slate-100 pb-1.5">
                      <span className="font-medium text-slate-400">Pendidikan Ibu</span>
                      <span className="font-semibold text-slate-800">{selectedStudent.motherEducation || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-slate-100 pb-1.5">
                      <span className="font-medium text-slate-400">No. HP Orang Tua / Wali</span>
                      <span className="font-bold text-[#5AB2FF] font-mono">{selectedStudent.parentPhone ? String(selectedStudent.parentPhone).replace(/^'/, '') : '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Data Kesehatan & Minat */}
                <div className="space-y-4">
                  <h5 className="text-sm font-bold text-slate-700 border-b border-slate-100 pb-1.5 flex items-center gap-2">
                    <Heart size={16} className="text-[#5AB2FF]" />
                    KESEHATAN, HOBI & CITA-CITA
                  </h5>
                  <div className="space-y-2.5 text-xs text-slate-600">
                    <div className="flex justify-between border-b border-dashed border-slate-100 pb-1.5">
                      <span className="font-medium text-slate-400">Tinggi / Berat Badan</span>
                      <span className="font-semibold text-slate-800">
                        {selectedStudent.height ? `${selectedStudent.height} cm` : '-'} / {selectedStudent.weight ? `${selectedStudent.weight} kg` : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-slate-100 pb-1.5">
                      <span className="font-medium text-slate-400">Golongan Darah</span>
                      <span className="font-bold text-slate-800 uppercase font-mono">{selectedStudent.bloodType || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-slate-100 pb-1.5">
                      <span className="font-medium text-slate-400">Hobi</span>
                      <span className="font-semibold text-slate-800">{selectedStudent.hobbies || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-slate-100 pb-1.5">
                      <span className="font-medium text-slate-400">Cita-Cita</span>
                      <span className="font-semibold text-slate-800">{selectedStudent.ambition || '-'}</span>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <span className="font-medium text-slate-400">Catatan Kesehatan / Alergi</span>
                      <span className="font-semibold text-slate-800 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                        {selectedStudent.healthNotes || 'Tidak ada catatan khusus.'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Prestasi & Catatan Lain */}
                <div className="space-y-4">
                  <h5 className="text-sm font-bold text-slate-700 border-b border-slate-100 pb-1.5 flex items-center gap-2">
                    <Award size={16} className="text-[#5AB2FF]" />
                    PRESTASI & INTEGRITAS
                  </h5>
                  <div className="space-y-3.5 text-xs">
                    <div>
                      <span className="block font-medium text-slate-400 mb-1">Daftar Prestasi</span>
                      {selectedStudent.achievements && selectedStudent.achievements.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {selectedStudent.achievements.map((item, i) => (
                            <span key={i} className="px-2 py-1 bg-emerald-50 text-emerald-700 font-semibold rounded-lg border border-emerald-100">
                              {item}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Belum ada catatan prestasi.</span>
                      )}
                    </div>

                    <div>
                      <span className="block font-medium text-slate-400 mb-1">Catatan Pelanggaran</span>
                      {selectedStudent.violations && selectedStudent.violations.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {selectedStudent.violations.map((item, i) => (
                            <span key={i} className="px-2 py-1 bg-rose-50 text-rose-700 font-semibold rounded-lg border border-rose-100">
                              {item}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Tidak ada catatan pelanggaran (Bersih).</span>
                      )}
                    </div>

                    <div className="flex justify-between border-t border-slate-100 pt-2.5">
                      <span className="font-semibold text-slate-500">Skor Sikap & Perilaku</span>
                      <span className="font-black text-indigo-600 text-sm font-mono">{selectedStudent.behaviorScore || 100} / 100</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setSelectedStudent(null)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                Tutup Biodata
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
