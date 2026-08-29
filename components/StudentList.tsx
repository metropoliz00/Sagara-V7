import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Student, TeacherProfileData, SchoolProfileData, Graduate } from '../types';
import * as XLSX from 'xlsx';
import { exportToExcelWithHeader, parseExcelWithHeaders } from '../utils/excelHelper';
import JSZip from 'jszip';
import html2pdf from 'html2pdf.js';
import { compressImage } from '../utils/imageHelper';
import { formatDateID } from '../utils/dateUtils';
import QRCode from 'react-qr-code';
import { 
  Search, Plus, ArrowLeft, Save, User, Heart, Activity, DollarSign, 
  AlertTriangle, UserCircle, Trash2, X, FileSpreadsheet, Printer, Upload, Download,
  LayoutGrid, List as ListIcon,
  Image as ImageIcon, PieChart as PieChartIcon,
  QrCode as QrCodeIcon, Users, ArrowUpCircle, GraduationCap, ChevronDown, UserMinus
} from 'lucide-react';
import { useModal } from '../context/ModalContext';
import { apiService } from '../services/apiService';
import { MOCK_SUBJECTS } from '../constants';

import BiodataTab from './student/BiodataTab';
import HealthTab from './student/HealthTab';
import TalentsTab from './student/TalentsTab';
import EconomyTab from './student/EconomyTab';
import RecordsTab from './student/RecordsTab';
import StudentDashboard from './student/StudentDashboard';

interface StudentListProps {
  students: Student[];
  teacherProfile?: TeacherProfileData;
  schoolProfile?: SchoolProfileData;
  classId: string;
  allAttendanceRecords: any[];
  onAdd: (student: Omit<Student, 'id'>) => void;
  onBatchAdd?: (students: Omit<Student, 'id'>[]) => void;
  onUpdate: (student: Student) => void;
  onDelete: (id: string) => void;
  onRemoveFiltered?: (id: string) => void;
  onShowNotification: (message: string, type: 'success' | 'error' | 'warning') => void;
  onMutasiKeluar?: (student: Student, mutasiData: any) => void;
  isReadOnly?: boolean;
}

type TabType = 'biodata' | 'health' | 'talents' | 'economy' | 'records';
type ViewType = 'grid' | 'list' | 'dashboard' | 'qr-codes' | 'health-data' | 'parent-data' | 'talents-data';

const StudentList: React.FC<StudentListProps> = ({ 
  students, teacherProfile, schoolProfile, classId, allAttendanceRecords,
  onAdd, onBatchAdd, onUpdate, onDelete, onRemoveFiltered, onShowNotification, onMutasiKeluar, isReadOnly = false
}) => {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('biodata');
  const [viewType, setViewType] = useState<ViewType>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMutasiKeluarModalOpen, setIsMutasiKeluarModalOpen] = useState(false);
  const [mutasiKeluarForm, setMutasiKeluarForm] = useState({
    tanggalMutasi: new Date().toISOString().split('T')[0],
    alasanMutasi: 'Pindah Sekolah',
    tujuanSekolah: '',
    tujuanKota: '',
    suratNomor: '',
    suratTanggal: new Date().toISOString().split('T')[0]
  });
  const [addModalTab, setAddModalTab] = useState<TabType>('biodata');
  const [isPromotingBatch, setIsPromotingBatch] = useState(false);
  const { showAlert, showConfirm } = useModal();
  
  const isClass6 = useMemo(() => {
    return classId?.startsWith('6') || (classId?.match(/^(.*?)(\d+)(.*)$/)?.[2] === '6');
  }, [classId]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper completeness functions
  const calculateCompleteness = (s: Student) => {
    const fields: (keyof Student)[] = [
      'nis', 'nik', 'name', 'gender', 'birthPlace', 'birthDate', 'address', 'photo', 'religion',
      'fatherName', 'fatherJob', 'fatherEducation', 'motherName', 'motherJob', 'motherEducation',
      'parentName', 'parentPhone', 'parentJob',
      'height', 'weight', 'bloodType', 'healthNotes',
      'hobbies', 'ambition', 'economyStatus'
    ];
    let filledCount = 0;
    fields.forEach(field => {
      const val = s[field];
      if (typeof val === 'number' && val > 0) filledCount++;
      else if (typeof val === 'string' && val.trim().length > 0 && !val.startsWith('ERROR')) filledCount++;
    });
    return Math.round((filledCount / fields.length) * 100);
  };

  const getCompletenessColor = (pct: number) => {
    if (pct === 100) return 'text-emerald-600 bg-emerald-100';
    if (pct >= 80) return 'text-[#5AB2FF] bg-[#CAF4FF]';
    if (pct >= 50) return 'text-amber-600 bg-amber-100';
    return 'text-rose-600 bg-rose-100';
  };
  
  const getCompletenessBarColor = (pct: number) => {
    if (pct === 100) return 'bg-emerald-500';
    if (pct >= 80) return 'bg-[#5AB2FF]'; 
    if (pct >= 50) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const isPhotoError = (url?: string) => url && (url.startsWith('ERROR') || url.startsWith('error'));

  const handlePrint = () => {
    const logoKiri = schoolProfile?.regencyLogo || '';
    const logoKanan = schoolProfile?.schoolLogo || '';
    const kabupaten = schoolProfile?.kabupaten?.toUpperCase() || 'TUBAN';
    const namaSekolah = schoolProfile?.name?.toUpperCase() || 'UPTD SATUAN PENDIDIKAN SDN REMEN';
    const alamatSekolah = schoolProfile?.jalan || schoolProfile?.address || '';
    const kodePos = schoolProfile?.postalCode ? `Kode Pos: ${schoolProfile.postalCode}` : '';
    const emailSekolah = schoolProfile?.email ? `Email: ${schoolProfile.email}` : '';
    const tahunAjaran = schoolProfile?.year || '2025/2026';
    const semester = schoolProfile?.semester || '1';
    const desa = schoolProfile?.desa || 'Remen';
    const tanggalCetak = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    // Kop Surat HTML Template
    const kopSuratHtml = `
      <div class="kop">
        <div class="logo-box">
          ${logoKiri ? `<img src="${logoKiri}" alt="Logo Daerah" />` : '<div class="no-logo">LOGO</div>'}
        </div>
        <div class="kop-text">
          <h3>PEMERINTAH KABUPATEN ${kabupaten}</h3>
          <h4>DINAS PENDIDIKAN</h4>
          <h2>${namaSekolah}</h2>
          <p>${alamatSekolah}${alamatSekolah && kodePos ? ' • ' : ''}${kodePos}</p>
          ${emailSekolah ? `<p>${emailSekolah}</p>` : ''}
        </div>
        <div class="logo-box">
          ${logoKanan ? `<img src="${logoKanan}" alt="Logo Sekolah" />` : '<div style="width: 55px;"></div>'}
        </div>
      </div>
    `;

    // Tanda Tangan HTML Template
    const signatureHtml = `
      <div class="signature-section">
        <div class="sig-box">
          <p>Mengetahui,</p>
          <p style="font-weight: bold;">Kepala ${schoolProfile?.name || 'Sekolah'}</p>
          <div class="sig-space"></div>
          <p style="text-decoration: underline; font-weight: bold;">${schoolProfile?.headmaster || '...................................'}</p>
          <p>NIP. ${schoolProfile?.headmasterNip || '...................................'}</p>
        </div>
        <div class="sig-box">
          <p>${desa}, ${tanggalCetak}</p>
          <p style="font-weight: bold;">Guru Kelas ${classId}</p>
          <div class="sig-space"></div>
          <p style="text-decoration: underline; font-weight: bold;">${teacherProfile?.name || '...................................'}</p>
          <p>NIP. ${teacherProfile?.nip || '...................................'}</p>
        </div>
      </div>
    `;

    // CSS Styling for precise table print
    const baseCss = `
      @page {
        size: ${selectedStudent ? 'A4 portrait' : 'A4 landscape'};
        margin: 8mm;
      }
      * {
        box-sizing: border-box;
      }
      body {
        font-family: Arial, Helvetica, sans-serif;
        font-size: 8pt;
        color: #000;
        background: #fff;
        margin: 0;
        padding: 8px;
        line-height: 1.2;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .kop {
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 3px double #000;
        padding-bottom: 6px;
        margin-bottom: 10px;
      }
      .logo-box {
        width: 55px;
        height: 55px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .logo-box img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
      }
      .no-logo {
        width: 45px;
        height: 45px;
        border: 1px solid #000;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 8px;
        font-weight: bold;
      }
      .kop-text {
        text-align: center;
        flex: 1;
        padding: 0 10px;
      }
      .kop-text h3 {
        margin: 0;
        font-size: 10pt;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        line-height: 1.2;
      }
      .kop-text h4 {
        margin: 2px 0 0 0;
        font-size: 9.5pt;
        font-weight: bold;
        text-transform: uppercase;
        line-height: 1.2;
      }
      .kop-text h2 {
        margin: 2px 0 0 0;
        font-size: 11pt;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.8px;
        line-height: 1.2;
      }
      .kop-text p {
        margin: 2px 0 0 0;
        font-size: 7.5pt;
        line-height: 1.2;
        color: #111;
      }
      .doc-header {
        text-align: center;
        margin-bottom: 12px;
      }
      .doc-header h2 {
        margin: 0;
        font-size: 11pt;
        font-weight: bold;
        text-transform: uppercase;
        text-decoration: underline;
        letter-spacing: 0.5px;
        line-height: 1.2;
      }
      .doc-header p {
        margin: 3px 0 0 0;
        font-size: 8.5pt;
        font-weight: 600;
        text-transform: uppercase;
      }

      /* Print Table Styling */
      table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 12px;
        table-layout: fixed;
        font-size: 8pt;
        line-height: 1.25;
      }
      th, td {
        border: 1px solid #000;
        padding: 4px 5px;
        vertical-align: middle;
        word-wrap: break-word;
        overflow-wrap: break-word;
        white-space: normal;
      }
      th {
        background-color: #f2f2f2 !important;
        text-align: center !important;
        vertical-align: middle !important;
        font-weight: bold;
        font-size: 8pt;
        text-transform: uppercase;
        -webkit-print-color-adjust: exact;
      }
      .text-center { text-align: center !important; }
      .text-left { text-align: left !important; }
      .text-right { text-align: right !important; }

      /* Signature Styles */
      .signature-section {
        margin-top: 20px;
        display: flex;
        justify-content: space-between;
        font-size: 8.5pt;
        line-height: 1.2;
        page-break-inside: avoid;
        break-inside: avoid;
      }
      .sig-box {
        width: 250px;
        text-align: center;
      }
      .sig-space {
        height: 50px;
      }

      /* Single Biodata Card Styles */
      .biodata-grid {
        display: flex;
        gap: 15px;
        margin-bottom: 12px;
      }
      .photo-box {
        width: 110px;
        height: 140px;
        border: 1px solid #000;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        overflow: hidden;
      }
      .photo-box img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .section-title {
        font-weight: bold;
        background-color: #e2e8f0;
        padding: 3px 6px;
        border: 1px solid #000;
        font-size: 8.5pt;
        text-transform: uppercase;
        margin-top: 10px;
        margin-bottom: 4px;
      }
    `;

    let title = "DAFTAR SISWA";
    let tableHtml = "";

    // CASE 1: Individual Student Biodata Print
    if (selectedStudent) {
      title = "LEMBAR BIODATA SISWA";
      const s = selectedStudent;
      const photoSrc = s.photo && !isPhotoError(s.photo) ? s.photo : '';

      tableHtml = `
        <div class="biodata-grid">
          <div class="photo-box">
            ${photoSrc ? `<img src="${photoSrc}" alt="Foto Siswa" />` : '<div style="text-align:center; font-size:8px; color:#555;">FOTO SISWA<br/>3 x 4</div>'}
          </div>
          <div style="flex: 1;">
            <table>
              <tr>
                <td style="width: 25%; font-weight: bold; background-color:#f8fafc;">NAMA LENGKAP</td>
                <td style="width: 75%; font-weight: bold; text-transform: uppercase;">${s.name.toUpperCase()}</td>
              </tr>
              <tr>
                <td style="font-weight: bold; background-color:#f8fafc;">NIS / NISN</td>
                <td>${s.nis} / ${s.nisn || '-'}</td>
              </tr>
              <tr>
                <td style="font-weight: bold; background-color:#f8fafc;">KELAS</td>
                <td>KELAS ${classId}</td>
              </tr>
              <tr>
                <td style="font-weight: bold; background-color:#f8fafc;">JENIS KELAMIN</td>
                <td>${s.gender === 'L' ? 'LAKI-LAKI (L)' : 'PEREMPUAN (P)'}</td>
              </tr>
            </table>
          </div>
        </div>

        <div class="section-title">I. DATA PRIBADI SISWA</div>
        <table>
          <tr>
            <td style="width: 25%; font-weight: bold;">NIK / No. KTP</td>
            <td style="width: 75%;">${s.nik || '-'}</td>
          </tr>
          <tr>
            <td style="font-weight: bold;">Tempat, Tanggal Lahir</td>
            <td>${s.birthPlace || '-'}, ${s.birthDate ? formatDateID(s.birthDate) : '-'}</td>
          </tr>
          <tr>
            <td style="font-weight: bold;">Agama</td>
            <td>${s.religion || '-'}</td>
          </tr>
          <tr>
            <td style="font-weight: bold;">Alamat Tempat Tinggal</td>
            <td>${s.address || '-'}</td>
          </tr>
        </table>

        <div class="section-title">II. DATA ORANG TUA / WALI</div>
        <table>
          <tr>
            <th style="width: 25%;">Keterangan</th>
            <th style="width: 37.5%;">Ayah Kandung</th>
            <th style="width: 37.5%;">Ibu Kandung</th>
          </tr>
          <tr>
            <td style="font-weight: bold;">Nama Lengkap</td>
            <td style="text-transform: uppercase;">${s.fatherName ? s.fatherName.toUpperCase() : '-'}</td>
            <td style="text-transform: uppercase;">${s.motherName ? s.motherName.toUpperCase() : '-'}</td>
          </tr>
          <tr>
            <td style="font-weight: bold;">Pendidikan Terakhir</td>
            <td>${s.fatherEducation || '-'}</td>
            <td>${s.motherEducation || '-'}</td>
          </tr>
          <tr>
            <td style="font-weight: bold;">Pekerjaan Utama</td>
            <td>${s.fatherJob || '-'}</td>
            <td>${s.motherJob || '-'}</td>
          </tr>
          <tr>
            <td style="font-weight: bold;">Nama Wali / Kontak HP</td>
            <td colspan="2">${s.parentName || '-'} (${s.parentPhone ? String(s.parentPhone).replace(/^'/, '') : '-'})</td>
          </tr>
        </table>

        <div class="section-title">III. DATA FISIK, KESEHATAN & LAINNYA</div>
        <table>
          <tr>
            <td style="width: 25%; font-weight: bold;">Tinggi & Berat Badan</td>
            <td style="width: 25%;">${s.height ? `${s.height} cm` : '-'} / ${s.weight ? `${s.weight} kg` : '-'}</td>
            <td style="width: 25%; font-weight: bold;">Golongan Darah</td>
            <td style="width: 25%;">${s.bloodType || '-'}</td>
          </tr>
          <tr>
            <td style="font-weight: bold;">Riwayat Penyakit</td>
            <td colspan="3">${s.healthNotes || '-'}</td>
          </tr>
          <tr>
            <td style="font-weight: bold;">Hobi & Cita-cita</td>
            <td colspan="3">${s.hobbies ? `Hobi: ${s.hobbies}` : '-'} | ${s.ambition ? `Cita-cita: ${s.ambition}` : '-'}</td>
          </tr>
        </table>
      `;
    } 
    // CASE 2: Health Data Table
    else if (viewType === 'health-data') {
      title = "DATA KESEHATAN SISWA";
      tableHtml = `
        <table>
          <thead>
            <tr>
              <th style="width: 4%;">No</th>
              <th style="width: 10%;">NIS</th>
              <th style="width: 24%;">Nama Siswa</th>
              <th style="width: 5%;">L/P</th>
              <th style="width: 8%;">BB (kg)</th>
              <th style="width: 8%;">TB (cm)</th>
              <th style="width: 7%;">Gol. Darah</th>
              <th style="width: 34%;">Riwayat Penyakit / Catatan Kesehatan</th>
            </tr>
          </thead>
          <tbody>
            ${filteredStudents.map((s, idx) => `
              <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f9fafb'};">
                <td class="text-center">${idx + 1}</td>
                <td class="text-center">${s.nis}</td>
                <td class="text-left" style="font-weight: bold; text-transform: uppercase;">${s.name.toUpperCase()}</td>
                <td class="text-center">${s.gender}</td>
                <td class="text-center">${s.weight || '-'}</td>
                <td class="text-center">${s.height || '-'}</td>
                <td class="text-center">${s.bloodType || '-'}</td>
                <td class="text-left">${s.healthNotes || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } 
    // CASE 3: Parent Data Table
    else if (viewType === 'parent-data') {
      title = "DATA ORANG TUA SISWA";
      tableHtml = `
        <table>
          <thead>
            <tr>
              <th style="width: 3%;">No</th>
              <th style="width: 7%;">NIS</th>
              <th style="width: 14%;">Nama Siswa</th>
              <th style="width: 11%;">Nama Ayah</th>
              <th style="width: 7%;">Pend. Ayah</th>
              <th style="width: 10%;">Pekerjaan Ayah</th>
              <th style="width: 11%;">Nama Ibu</th>
              <th style="width: 7%;">Pend. Ibu</th>
              <th style="width: 10%;">Pekerjaan Ibu</th>
              <th style="width: 8%;">No. HP</th>
              <th style="width: 12%;">Alamat</th>
            </tr>
          </thead>
          <tbody>
            ${filteredStudents.map((s, idx) => `
              <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f9fafb'};">
                <td class="text-center">${idx + 1}</td>
                <td class="text-center">${s.nis}</td>
                <td class="text-left" style="font-weight: bold; text-transform: uppercase;">${s.name.toUpperCase()}</td>
                <td class="text-left" style="text-transform: uppercase;">${s.fatherName ? s.fatherName.toUpperCase() : '-'}</td>
                <td class="text-center">${s.fatherEducation || '-'}</td>
                <td class="text-left">${s.fatherJob || '-'}</td>
                <td class="text-left" style="text-transform: uppercase;">${s.motherName ? s.motherName.toUpperCase() : '-'}</td>
                <td class="text-center">${s.motherEducation || '-'}</td>
                <td class="text-left">${s.motherJob || '-'}</td>
                <td class="text-center">${s.parentPhone ? String(s.parentPhone).replace(/^'/, '') : '-'}</td>
                <td class="text-left">${s.address || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } 
    // CASE 4: Talents Data Table
    else if (viewType === 'talents-data') {
      title = "DATA BAKAT DAN MINAT SISWA";
      tableHtml = `
        <table>
          <thead>
            <tr>
              <th style="width: 4%;">No</th>
              <th style="width: 8%;">NIS</th>
              <th style="width: 9%;">NISN</th>
              <th style="width: 18%;">Nama Siswa</th>
              <th style="width: 10%;">Tempat Lahir</th>
              <th style="width: 9%;">Tgl Lahir</th>
              <th style="width: 11%;">NIK</th>
              <th style="width: 15%;">Hobi</th>
              <th style="width: 16%;">Cita-cita</th>
            </tr>
          </thead>
          <tbody>
            ${filteredStudents.map((s, idx) => `
              <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f9fafb'};">
                <td class="text-center">${idx + 1}</td>
                <td class="text-center">${s.nis}</td>
                <td class="text-center">${s.nisn || '-'}</td>
                <td class="text-left" style="font-weight: bold; text-transform: uppercase;">${s.name.toUpperCase()}</td>
                <td class="text-left">${s.birthPlace || '-'}</td>
                <td class="text-center">${s.birthDate ? formatDateID(s.birthDate) : '-'}</td>
                <td class="text-center">${s.nik || '-'}</td>
                <td class="text-left">${s.hobbies || '-'}</td>
                <td class="text-left">${s.ambition || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } 
    // CASE 5: Main List Table View (Default)
    else {
      title = "DAFTAR SISWA";
      tableHtml = `
        <table>
          <thead>
            <tr>
              <th style="width: 3%;">No</th>
              <th style="width: 13%;">Nama Siswa</th>
              <th style="width: 7%;">NIS</th>
              <th style="width: 8%;">NISN</th>
              <th style="width: 4%;">L/P</th>
              <th style="width: 9%;">Tempat Lahir</th>
              <th style="width: 8%;">Tgl Lahir</th>
              <th style="width: 10%;">NIK</th>
              <th style="width: 6%;">Agama</th>
              <th style="width: 11%;">Nama Ayah</th>
              <th style="width: 11%;">Nama Ibu</th>
              <th style="width: 10%;">Alamat</th>
            </tr>
          </thead>
          <tbody>
            ${filteredStudents.map((s, idx) => `
              <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f9fafb'};">
                <td class="text-center">${idx + 1}</td>
                <td class="text-left" style="font-weight: bold; text-transform: uppercase;">${s.name.toUpperCase()}</td>
                <td class="text-center">${s.nis}</td>
                <td class="text-center">${s.nisn || '-'}</td>
                <td class="text-center">${s.gender}</td>
                <td class="text-left">${s.birthPlace || '-'}</td>
                <td class="text-center">${s.birthDate ? formatDateID(s.birthDate) : '-'}</td>
                <td class="text-center">${s.nik || '-'}</td>
                <td class="text-center">${s.religion || '-'}</td>
                <td class="text-left" style="text-transform: uppercase;">${s.fatherName ? s.fatherName.toUpperCase() : '-'}</td>
                <td class="text-left" style="text-transform: uppercase;">${s.motherName ? s.motherName.toUpperCase() : '-'}</td>
                <td class="text-left">${s.address || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    const htmlDocument = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${title} KELAS ${classId}</title>
          <style>
            ${baseCss}
          </style>
        </head>
        <body>
          ${kopSuratHtml}
          
          <div class="doc-header">
            <h2>${title} KELAS ${classId}</h2>
            <p>TAHUN AJARAN ${tahunAjaran} - SEMESTER ${semester}</p>
          </div>

          ${tableHtml}

          ${signatureHtml}
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      onShowNotification('Gagal membuka jendela cetak. Izinkan popup di browser Anda.', 'error');
      return;
    }

    printWindow.document.write(htmlDocument);
    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const handleDeleteClick = (id: string) => {
      showConfirm("Apakah Anda yakin ingin menghapus data siswa ini? Tindakan ini tidak dapat dibatalkan.", async () => {
          onDelete(id);
          setSelectedStudent(null);
      });
  };

  const handleNaikKelas = async (student: Student) => {
    const currentClass = student.classId || classId;
    const match = currentClass.match(/^(.*?)(\d+)(.*)$/);
    if (match) {
      const prefix = match[1];
      const num = parseInt(match[2], 10);
      const suffix = match[3];
      if (num < 6) {
        const newClassId = `${prefix}${num + 1}${suffix}`;
        showConfirm(`Apakah Anda yakin ingin menaikkan kelas siswa ini ke kelas ${newClassId}?`, async () => {
          try {
            // Save grade history
            const currentGrades = await apiService.getGradesForStudent(student.id);
            if (currentGrades && Object.keys(currentGrades.subjects).length > 0) {
              const historyEntry = {
                id: `${schoolProfile?.year || new Date().getFullYear()}-Semester ${schoolProfile?.semester || '1'}-${currentClass}`,
                academicYear: schoolProfile?.year || new Date().getFullYear().toString(),
                semester: schoolProfile?.semester || '1',
                classId: currentClass,
                timestamp: Date.now(),
                subjects: currentGrades.subjects
              };
              await apiService.saveGradeHistory(student.id, historyEntry);
              await apiService.deleteGradesForStudent(student.id);
            }
            
            onUpdate({ ...student, classId: newClassId });
            onShowNotification(`Siswa berhasil dinaikkan ke kelas ${newClassId}`, 'success');
            setSelectedStudent(null);
          } catch (error) {
            console.error("Error during naik kelas:", error);
            onShowNotification("Terjadi kesalahan saat menaikkan kelas siswa.", 'error');
          }
        });
      } else {
        onShowNotification("Siswa sudah berada di kelas tertinggi (Kelas 6).", 'warning');
      }
    } else {
      onShowNotification("Format kelas tidak dikenali untuk naik kelas otomatis.", 'warning');
    }
  };

  const handleBatchNaikKelas = async () => {
    if (students.length === 0) {
      onShowNotification("Tidak ada siswa di kelas ini.", 'warning');
      return;
    }

    const currentClass = classId;

    if (isClass6) {
      showConfirm(`Apakah Anda yakin ingin MELULUSKAN SELURUH (${students.length}) SISWA di kelas ${currentClass} ini ke Data Lulusan? Tindakan ini akan mengarsipkan seluruh data nilai aktif mereka terlebih dahulu ke riwayat.`, async () => {
        setIsPromotingBatch(true);
        let successCount = 0;
        let failCount = 0;
        try {
          const isConfigured = apiService.isConfigured();
          
          for (const student of students) {
            try {
              if (isConfigured) {
                // Save grade history
                try {
                  const currentGrades = await apiService.getGradesForStudent(student.id);
                  if (currentGrades && Object.keys(currentGrades.subjects || {}).length > 0) {
                    const historyEntry = {
                      id: `${schoolProfile?.year || new Date().getFullYear()}-Semester ${schoolProfile?.semester || '1'}-${currentClass}`,
                      academicYear: schoolProfile?.year || new Date().getFullYear().toString(),
                      semester: schoolProfile?.semester || '1',
                      classId: currentClass,
                      timestamp: Date.now(),
                      subjects: currentGrades.subjects
                    };
                    await apiService.saveGradeHistory(student.id, historyEntry);
                    await apiService.deleteGradesForStudent(student.id);
                  }
                } catch (gradeError) {
                  console.warn(`Failed to save grade history for student ${student.name}:`, gradeError);
                }

                const graduate: Graduate = {
                  id: student.id,
                  nis: student.nis || '',
                  nisn: student.nisn || student.nis,
                  name: student.name,
                  ijazahNumber: '',
                  status: 'Lulus',
                  graduationYear: new Date().getFullYear().toString(),
                  continuedTo: '',
                  createdAt: Date.now(),
                  updatedAt: Date.now()
                };
                
                await apiService.saveGraduate(graduate);
                await apiService.deleteStudent(student.id);
              }

              // Update local state
              if (onRemoveFiltered) {
                onRemoveFiltered(student.id);
              } else {
                onDelete(student.id);
              }
              successCount++;
            } catch (error) {
              console.error(`Error graduating student ${student.name}:`, error);
              failCount++;
            }
          }
          
          if (successCount > 0) {
            onShowNotification(
              isConfigured 
                ? `Selesai! ${successCount} siswa berhasil diluluskan dan dipindah ke Data Lulusan.` + (failCount > 0 ? ` ${failCount} siswa gagal.` : '')
                : `Selesai! ${successCount} siswa berhasil diluluskan (Mode Demo).`,
              'success'
            );
          } else {
            onShowNotification("Gagal melangsungkan proses lulus massal.", 'error');
          }
          setSelectedStudent(null);
        } catch (e) {
          console.error("Batch graduation error:", e);
          onShowNotification("Terjadi kesalahan saat proses kelulusan massal.", 'error');
        } finally {
          setIsPromotingBatch(false);
        }
      });
      return;
    }

    const match = currentClass.match(/^(.*?)(\d+)(.*)$/);
    if (match) {
      const prefix = match[1];
      const num = parseInt(match[2], 10);
      const suffix = match[3];
      if (num < 6) {
        const newClassId = `${prefix}${num + 1}${suffix}`;
        const studentsToPromote = selectedStudentIds.length > 0 
          ? students.filter(s => selectedStudentIds.includes(s.id))
          : students;
          
        showConfirm(`Apakah Anda yakin ingin MENAIKKAN ${studentsToPromote.length} SISWA di kelas ${currentClass} ini ke Kelas ${newClassId}? Tindakan ini akan mengarsipkan seluruh data nilai aktif mereka terlebih dahulu ke riwayat.`, async () => {
          setIsPromotingBatch(true);
          let successCount = 0;
          let failCount = 0;
          try {
            for (const student of studentsToPromote) {
              try {
                // Save grade history
                const currentGrades = await apiService.getGradesForStudent(student.id);
                if (currentGrades && Object.keys(currentGrades.subjects || {}).length > 0) {
                  const historyEntry = {
                    id: `${schoolProfile?.year || new Date().getFullYear()}-Semester ${schoolProfile?.semester || '1'}-${currentClass}`,
                    academicYear: schoolProfile?.year || new Date().getFullYear().toString(),
                    semester: schoolProfile?.semester || '1',
                    classId: currentClass,
                    timestamp: Date.now(),
                    subjects: currentGrades.subjects
                  };
                  await apiService.saveGradeHistory(student.id, historyEntry);
                  await apiService.deleteGradesForStudent(student.id);
                }
                
                await onUpdate({ ...student, classId: newClassId });
                successCount++;
              } catch (error) {
                console.error(`Error promoting student ${student.name}:`, error);
                failCount++;
              }
            }
            if (successCount > 0) {
              onShowNotification(`Selesai! ${successCount} siswa berhasil dinaikkan ke kelas ${newClassId}.` + (failCount > 0 ? ` ${failCount} siswa gagal.` : ''), 'success');
            } else {
              onShowNotification("Gagal melangsungkan proses naik kelas massal.", 'error');
            }
            setSelectedStudent(null);
            setSelectedStudentIds([]);
          } catch (e) {
            console.error("Batch promotion error:", e);
            onShowNotification("Terjadi kesalahan saat proses kenaikan kelas massal.", 'error');
          } finally {
            setIsPromotingBatch(false);
          }
        });
      } else {
        onShowNotification("Kelas ini sudah berada di tingkat tertinggi (Kelas 6). Untuk Kelas 6 silakan gunakan fitur kelulusan di detail profil siswa.", 'warning');
      }
    } else {
      onShowNotification("Format kelas tidak dikenali untuk naik kelas otomatis.", 'warning');
    }
  };

  const handleLulus = (student: Student) => {
    showConfirm("Apakah Anda yakin ingin meluluskan siswa ini? Data akan dipindah ke Data Lulusan.", async () => {
      try {
        const currentClass = student.classId || classId;
        
        // Skip backend calls in Demo Mode
        const isConfigured = apiService.isConfigured();

        if (isConfigured) {
            // Save grade history
            try {
                const currentGrades = await apiService.getGradesForStudent(student.id);
                if (currentGrades && Object.keys(currentGrades.subjects || {}).length > 0) {
                  const historyEntry = {
                    id: `${schoolProfile?.year || new Date().getFullYear()}-Semester ${schoolProfile?.semester || '1'}-${currentClass}`,
                    academicYear: schoolProfile?.year || new Date().getFullYear().toString(),
                    semester: schoolProfile?.semester || '1',
                    classId: currentClass,
                    timestamp: Date.now(),
                    subjects: currentGrades.subjects
                  };
                  await apiService.saveGradeHistory(student.id, historyEntry);
                  await apiService.deleteGradesForStudent(student.id);
                }
            } catch (gradeError) {
                console.warn("Failed to save grade history, continuing with graduation:", gradeError);
            }

        const graduate: Graduate = {
          id: student.id, // Use strict UUID from student object
          nisn: student.nisn || student.nis,
          name: student.name,
          ijazahNumber: '',
          status: 'Lulus',
          graduationYear: new Date().getFullYear().toString(),
          continuedTo: '',
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
            
            await apiService.saveGraduate(graduate);
            await apiService.deleteStudent(student.id);
        }
        
        // Update local state
        if (onRemoveFiltered) {
          onRemoveFiltered(student.id);
        } else {
          onDelete(student.id);
        }
        
        onShowNotification(
            isConfigured 
            ? "Siswa berhasil diluluskan dan dipindah ke Data Lulusan." 
            : "Siswa berhasil diluluskan (Mode Demo).", 
            'success'
        );
        setSelectedStudent(null);
      } catch (error: any) {
        console.error("Error graduating student:", error);
        onShowNotification(`Gagal meluluskan siswa. Pastikan koneksi dan database sudah siap. (${error.message || 'Database Error'})`, 'error');
      }
    });
  };

  const handleDownloadTemplate = () => {
    try {
      const headers = [
        "No",
        "Nama",
        "NIS",
        "JK",
        "NISN",
        "Tempat Lahir",
        "Tanggal Lahir",
        "NIK",
        "Agama",
        "Alamat",
        "RT",
        "RW",
        "Dusun",
        "Kelurahan",
        "Kecamatan",
        "Kode Pos",
        "Jenis Tinggal",
        "Alat Transportasi",
        "Telepon",
        "HP",
        "E-Mail",
        "SKHUN",
        "Penerima KPS",
        "No. KPS",
        "Data Ayah - Nama",
        "Data Ayah - Tahun Lahir",
        "Data Ayah - Jenjang Pendidikan",
        "Data Ayah - Pekerjaan",
        "Data Ayah - Penghasilan",
        "Data Ayah - NIK",
        "Data Ibu - Nama",
        "Data Ibu - Tahun Lahir",
        "Data Ibu - Jenjang Pendidikan",
        "Data Ibu - Pekerjaan",
        "Data Ibu - Penghasilan",
        "Data Ibu - NIK",
        "Data Wali - Nama",
        "Data Wali - Tahun Lahir",
        "Data Wali - Jenjang Pendidikan",
        "Data Wali - Pekerjaan",
        "Data Wali - Penghasilan",
        "Data Wali - NIK",
        "Rombel Saat Ini",
        "No. Peserta Ujian Nasional",
        "No. Seri Ijazah",
        "Penerima KIP",
        "Nomor KIP",
        "Nama di KIP",
        "Nomor KKS",
        "No. Registrasi Akta Lahir",
        "Bank",
        "Nomor Rekening Bank",
        "Rekening Atas Nama",
        "Layak PIP (Usulan dari Sekolah)",
        "Alasan Layak PIP",
        "Kebutuhan Khusus",
        "Sekolah Asal",
        "Anak ke-berapa",
        "Lintang",
        "Bujur",
        "No. KK",
        "Berat Badan",
        "Tinggi Badan",
        "Lingkar Kepala",
        "Jml. Saudara Kandung",
        "Jarak Rumah ke Sekolah (KM)"
      ];

      const example = [
        1,
        "AHMAD SANTOSO",
        "2024001",
        "L",
        "0012345678",
        "Tuban",
        "2015-05-20",
        "3523010101150001",
        "Islam",
        "Jl. Merpati No. 10",
        "001",
        "002",
        "Dusun Krajan",
        "Remen",
        "Jenu",
        "62356",
        "Bersama orang tua",
        "Jalan kaki",
        "-",
        "081234567890",
        "ahmad@gmail.com",
        "-",
        "Tidak",
        "-",
        "BUDI SANTOSO",
        "1980",
        "SMA",
        "Wiraswasta",
        "Rp 2.000.000 - Rp 3.000.000",
        "3523010101800001",
        "SITI AMINAH",
        "1985",
        "SMP",
        "Ibu Rumah Tangga",
        "Tidak Berpenghasilan",
        "3523010101850002",
        "-",
        "-",
        "-",
        "-",
        "-",
        "-",
        classId || "1",
        "-",
        "-",
        "Tidak",
        "-",
        "-",
        "-",
        "AHU-00123.456",
        "BRI",
        "123401000123530",
        "AHMAD SANTOSO",
        "Tidak",
        "-",
        "Tidak ada",
        "TK Dharma Wanita Remen",
        "1",
        "-6.891234",
        "112.056789",
        "3523010101100001",
        "38",
        "145",
        "52",
        "2",
        "0.5"
      ];

      const groupHeaders = [
        { title: "Data Ayah", startIndex: 24, endIndex: 29 },
        { title: "Data Ibu", startIndex: 30, endIndex: 35 },
        { title: "Data Wali", startIndex: 36, endIndex: 41 }
      ];

      exportToExcelWithHeader({
        title: "Template Input Data Siswa Sagara",
        subtitle: `Kelas: ${classId === 'ALL' || !classId ? 'Semua Kelas (Seluruh Siswa)' : classId}`,
        filename: classId === 'ALL' || !classId ? "template_input_seluruh_siswa.xlsx" : "template_input_siswa_sagara.xlsx",
        sheetName: "Template Siswa",
        headers,
        data: [example],
        isTemplate: true,
        notes: "Isi data siswa mulai baris setelah judul tabel. Kolom wajib: Nama, NISN/NIS, JK, Tanggal Lahir (YYYY-MM-DD), Rombel Saat Ini.",
        groupHeaders
      });
      onShowNotification("Template Excel Sagara berhasil diunduh!", "success");
    } catch (err: any) {
      console.error("Gagal mengunduh template:", err);
      onShowNotification("Gagal mengunduh template Excel.", "error");
    }
  };

  const handleExport = () => {
    try {
      const headers = [
        "No",
        "Nama",
        "NIS",
        "JK",
        "NISN",
        "Tempat Lahir",
        "Tanggal Lahir",
        "NIK",
        "Agama",
        "Alamat",
        "RT",
        "RW",
        "Dusun",
        "Kelurahan",
        "Kecamatan",
        "Kode Pos",
        "Jenis Tinggal",
        "Alat Transportasi",
        "Telepon",
        "HP",
        "E-Mail",
        "SKHUN",
        "Penerima KPS",
        "No. KPS",
        "Data Ayah - Nama",
        "Data Ayah - Tahun Lahir",
        "Data Ayah - Jenjang Pendidikan",
        "Data Ayah - Pekerjaan",
        "Data Ayah - Penghasilan",
        "Data Ayah - NIK",
        "Data Ibu - Nama",
        "Data Ibu - Tahun Lahir",
        "Data Ibu - Jenjang Pendidikan",
        "Data Ibu - Pekerjaan",
        "Data Ibu - Penghasilan",
        "Data Ibu - NIK",
        "Data Wali - Nama",
        "Data Wali - Tahun Lahir",
        "Data Wali - Jenjang Pendidikan",
        "Data Wali - Pekerjaan",
        "Data Wali - Penghasilan",
        "Data Wali - NIK",
        "Rombel Saat Ini",
        "No. Peserta Ujian Nasional",
        "No. Seri Ijazah",
        "Penerima KIP",
        "Nomor KIP",
        "Nama di KIP",
        "Nomor KKS",
        "No. Registrasi Akta Lahir",
        "Bank",
        "Nomor Rekening Bank",
        "Rekening Atas Nama",
        "Layak PIP (Usulan dari Sekolah)",
        "Alasan Layak PIP",
        "Kebutuhan Khusus",
        "Sekolah Asal",
        "Anak ke-berapa",
        "Lintang",
        "Bujur",
        "No. KK",
        "Berat Badan",
        "Tinggi Badan",
        "Lingkar Kepala",
        "Jml. Saudara Kandung",
        "Jarak Rumah ke Sekolah (KM)"
      ];

      const rows = students.map((s, idx) => [
        idx + 1,
        s.name ? s.name.toUpperCase() : '',
        s.nis || '',
        s.gender || 'L',
        s.nisn || '',
        s.birthPlace || '',
        s.birthDate ? (() => {
          const parts = s.birthDate.split('-');
          if (parts.length === 3) {
            // If format is yyyy-mm-dd or yyyy/mm/dd
            if (parts[0].length === 4) {
              return `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
          }
          return s.birthDate;
        })() : '',
        s.nik || '',
        s.religion || 'Islam',
        s.address || '',
        s.rt || '',
        s.rw || '',
        s.dusun || '',
        s.kelurahan || '',
        s.kecamatan || '',
        s.kodePos || '',
        s.jenisTinggal || '',
        s.alatTransportasi || '',
        s.telepon || '',
        s.hp ? String(s.hp).replace(/^'/, '') : (s.parentPhone ? String(s.parentPhone).replace(/^'/, '') : ''),
        s.email || '',
        s.skhun || '',
        s.penerimaKps || 'Tidak',
        s.noKps || '',
        s.fatherName ? s.fatherName.toUpperCase() : '',
        s.fatherBirthYear || '',
        s.fatherEducation || '',
        s.fatherJob || '',
        s.fatherIncome || '',
        s.fatherNik || '',
        s.motherName ? s.motherName.toUpperCase() : '',
        s.motherBirthYear || '',
        s.motherEducation || '',
        s.motherJob || '',
        s.motherIncome || '',
        s.motherNik || '',
        s.parentName ? s.parentName.toUpperCase() : '',
        s.guardianBirthYear || '',
        s.guardianEducation || '',
        s.parentJob || '',
        s.guardianIncome || '',
        s.guardianNik || '',
        s.rombel || s.classId || '',
        s.noUjianNasional || '',
        s.noSeriIjazah || '',
        s.penerimaKip || 'Tidak',
        s.nomorKip || '',
        s.namaDiKip || '',
        s.nomorKks || '',
        s.noRegistrasiAktaLahir || '',
        s.bank || '',
        s.nomorRekeningBank || '',
        s.rekeningAtasNama || '',
        s.layakPip || 'Tidak',
        s.alasanLayakPip || '',
        s.kebutuhanKhusus || '',
        s.sekolahAsal || '',
        s.anakKe || '',
        s.lintang || '',
        s.bujur || '',
        s.noKk || '',
        s.weight || 0,
        s.height || 0,
        s.lingkarKepala || 0,
        s.jmlSaudaraKandung || 0,
        s.jarakRumahKm || 0
      ]);

      const groupHeaders = [
        { title: "Data Ayah", startIndex: 24, endIndex: 29 },
        { title: "Data Ibu", startIndex: 30, endIndex: 35 },
        { title: "Data Wali", startIndex: 36, endIndex: 41 }
      ];

      exportToExcelWithHeader({
        title: "Laporan Data Siswa Sagara",
        subtitle: `Kelas: ${classId === 'ALL' || !classId ? 'Semua Kelas (Seluruh Siswa)' : classId} | Total Siswa: ${students.length}`,
        filename: `data_siswa_sagara_${classId === 'ALL' || !classId ? 'seluruh_siswa' : classId}.xlsx`,
        sheetName: "Data Siswa",
        headers,
        data: rows,
        groupHeaders
      });
      onShowNotification("Data siswa berhasil diekspor ke Excel!", "success");
    } catch (err: any) {
      console.error("Gagal melakukan ekspor:", err);
      onShowNotification("Gagal mengekspor data ke Excel.", "error");
    }
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const parseExcelDate = (val: any): string => {
    if (!val) return '';
    if (typeof val === 'number') {
      const date = new Date(Math.round((val - 25569) * 86400 * 1000));
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
      return '';
    }
    const str = String(val).trim();
    if (!str || str === '-') return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    const parts = str.split(/[\/\.-]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      } else if (parts[2].length === 4) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
    return str;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      onShowNotification("Ukuran file melebihi batas maksimum 2 MB.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const rawRows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
        const { rows: jsonObjects } = parseExcelWithHeaders(ws, ['Nama', 'NIS', 'NISN', 'JK']);

        const newStudentsBatch: Omit<Student, 'id'>[] = [];

        // Helper to get field from json object case-insensitively
        const getVal = (row: Record<string, any>, ...keys: string[]): any => {
          for (const key of keys) {
            if (row[key] !== undefined && row[key] !== null) return row[key];
            const lowerKey = key.toLowerCase();
            const matchedKey = Object.keys(row).find(k => k.toLowerCase() === lowerKey || k.toLowerCase().replace(/[^a-z0-9]/g, '') === lowerKey.replace(/[^a-z0-9]/g, ''));
            if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== null) return row[matchedKey];
          }
          return undefined;
        };

        if (jsonObjects.length > 0 && typeof jsonObjects[0] === 'object' && !Array.isArray(jsonObjects[0])) {
          jsonObjects.forEach((row) => {
            const name = String(getVal(row, 'Nama', 'Nama Lengkap', 'name') || '').trim().toUpperCase();
            const nis = String(getVal(row, 'NIS', 'nis') || '').trim();
            const nisn = String(getVal(row, 'NISN', 'nisn') || '').trim();
            const nik = String(getVal(row, 'NIK', 'nik') || '').trim();
            const rombel = String(getVal(row, 'Rombel Saat Ini', 'Rombel', 'Class ID', 'Kelas', 'classId') || classId || '').trim();

            if (name) {
              const genderRaw = String(getVal(row, 'JK', 'Gender (L/P)', 'Gender', 'Jenis Kelamin') || 'L').trim().toUpperCase();
              const gender = (genderRaw.includes('P') || genderRaw.includes('PEREMPUAN') || genderRaw.includes('WANITA')) ? 'P' : 'L';
              const rawBirthDate = getVal(row, 'Tanggal Lahir', 'Tanggal Lahir (YYYY-MM-DD)', 'Tanggal Lahir (YYYY-MM-DD)*');

              const hpVal = String(getVal(row, 'HP', 'No HP', 'No. HP', 'No HP Wali') || '').trim().replace(/^'/, '');
              const parentPhone = hpVal;

              const newStudent: Omit<Student, 'id'> = {
                classId: rombel || classId,
                rombel: rombel || classId,
                nis: nis || (nisn ? nisn.slice(-6) : `NIS-${Math.floor(1000 + Math.random() * 9000)}`),
                nisn,
                nik,
                name,
                gender,
                birthPlace: String(getVal(row, 'Tempat Lahir') || '').trim(),
                birthDate: parseExcelDate(rawBirthDate),
                religion: String(getVal(row, 'Agama') || 'Islam').trim(),
                address: String(getVal(row, 'Alamat') || '').trim(),
                rt: String(getVal(row, 'RT') || '').trim(),
                rw: String(getVal(row, 'RW') || '').trim(),
                dusun: String(getVal(row, 'Dusun') || '').trim(),
                kelurahan: String(getVal(row, 'Kelurahan', 'Desa') || '').trim(),
                kecamatan: String(getVal(row, 'Kecamatan') || '').trim(),
                kodePos: String(getVal(row, 'Kode Pos') || '').trim(),
                jenisTinggal: String(getVal(row, 'Jenis Tinggal') || '').trim(),
                alatTransportasi: String(getVal(row, 'Alat Transportasi') || '').trim(),
                telepon: String(getVal(row, 'Telepon') || '').trim(),
                hp: hpVal,
                email: String(getVal(row, 'E-Mail', 'Email') || '').trim(),
                skhun: String(getVal(row, 'SKHUN') || '').trim(),
                penerimaKps: String(getVal(row, 'Penerima KPS') || 'Tidak').trim(),
                noKps: String(getVal(row, 'No. KPS', 'No KPS') || '').trim(),

                fatherName: String(getVal(row, 'Data Ayah - Nama', 'Nama Ayah') || '').trim().toUpperCase(),
                fatherBirthYear: String(getVal(row, 'Data Ayah - Tahun Lahir', 'Tahun Lahir Ayah') || '').trim(),
                fatherEducation: String(getVal(row, 'Data Ayah - Jenjang Pendidikan', 'Pendidikan Ayah') || '').trim(),
                fatherJob: String(getVal(row, 'Data Ayah - Pekerjaan', 'Pekerjaan Ayah') || '').trim(),
                fatherIncome: String(getVal(row, 'Data Ayah - Penghasilan', 'Penghasilan Ayah') || '').trim(),
                fatherNik: String(getVal(row, 'Data Ayah - NIK', 'NIK Ayah') || '').trim(),

                motherName: String(getVal(row, 'Data Ibu - Nama', 'Nama Ibu') || '').trim().toUpperCase(),
                motherBirthYear: String(getVal(row, 'Data Ibu - Tahun Lahir', 'Tahun Lahir Ibu') || '').trim(),
                motherEducation: String(getVal(row, 'Data Ibu - Jenjang Pendidikan', 'Pendidikan Ibu') || '').trim(),
                motherJob: String(getVal(row, 'Data Ibu - Pekerjaan', 'Pekerjaan Ibu') || '').trim(),
                motherIncome: String(getVal(row, 'Data Ibu - Penghasilan', 'Penghasilan Ibu') || '').trim(),
                motherNik: String(getVal(row, 'Data Ibu - NIK', 'NIK Ibu') || '').trim(),

                parentName: String(getVal(row, 'Data Wali - Nama', 'Nama Wali') || getVal(row, 'Data Ayah - Nama', 'Nama Ayah') || getVal(row, 'Data Ibu - Nama', 'Nama Ibu') || '').trim().toUpperCase(),
                guardianBirthYear: String(getVal(row, 'Data Wali - Tahun Lahir', 'Tahun Lahir Wali') || '').trim(),
                guardianEducation: String(getVal(row, 'Data Wali - Jenjang Pendidikan', 'Pendidikan Wali') || '').trim(),
                parentJob: String(getVal(row, 'Data Wali - Pekerjaan', 'Pekerjaan Wali') || getVal(row, 'Data Ayah - Pekerjaan', 'Pekerjaan Ayah') || '').trim(),
                guardianIncome: String(getVal(row, 'Data Wali - Penghasilan', 'Penghasilan Wali') || '').trim(),
                guardianNik: String(getVal(row, 'Data Wali - NIK', 'NIK Wali') || '').trim(),
                parentPhone,

                noUjianNasional: String(getVal(row, 'No. Peserta Ujian Nasional', 'No Peserta Ujian Nasional') || '').trim(),
                noSeriIjazah: String(getVal(row, 'No. Seri Ijazah', 'No Seri Ijazah') || '').trim(),
                penerimaKip: String(getVal(row, 'Penerima KIP') || 'Tidak').trim(),
                nomorKip: String(getVal(row, 'Nomor KIP', 'No KIP') || '').trim(),
                namaDiKip: String(getVal(row, 'Nama di KIP', 'Nama Pada KIP') || '').trim(),
                nomorKks: String(getVal(row, 'Nomor KKS', 'No KKS') || '').trim(),
                noRegistrasiAktaLahir: String(getVal(row, 'No. Registrasi Akta Lahir', 'No Registrasi Akta Lahir', 'No Akta') || '').trim(),
                bank: String(getVal(row, 'Bank') || '').trim(),
                nomorRekeningBank: String(getVal(row, 'Nomor Rekening Bank', 'No Rekening Bank', 'No Rekening') || '').trim(),
                rekeningAtasNama: String(getVal(row, 'Rekening Atas Nama', 'Atas Nama Rekening') || '').trim(),
                layakPip: String(getVal(row, 'Layak PIP (Usulan dari Sekolah)', 'Layak PIP') || 'Tidak').trim(),
                alasanLayakPip: String(getVal(row, 'Alasan Layak PIP') || '').trim(),
                kebutuhanKhusus: String(getVal(row, 'Kebutuhan Khusus') || '').trim(),
                sekolahAsal: String(getVal(row, 'Sekolah Asal') || '').trim(),
                anakKe: String(getVal(row, 'Anak ke-berapa', 'Anak Ke') || '').trim(),
                lintang: String(getVal(row, 'Lintang') || '').trim(),
                bujur: String(getVal(row, 'Bujur') || '').trim(),
                noKk: String(getVal(row, 'No. KK', 'No KK', 'Nomor KK') || '').trim(),
                weight: Number(getVal(row, 'Berat Badan', 'Berat (kg)', 'Berat')) || 0,
                height: Number(getVal(row, 'Tinggi Badan', 'Tinggi (cm)', 'Tinggi')) || 0,
                lingkarKepala: Number(getVal(row, 'Lingkar Kepala')) || 0,
                jmlSaudaraKandung: Number(getVal(row, 'Jml. Saudara Kandung', 'Jml Saudara Kandung', 'Jumlah Saudara')) || 0,
                jarakRumahKm: Number(getVal(row, 'Jarak Rumah ke Sekolah (KM)', 'Jarak Rumah (KM)', 'Jarak Rumah')) || 0,

                economyStatus: (getVal(row, 'Status Ekonomi') as any) || (getVal(row, 'Penerima KIP') === 'Ya' || getVal(row, 'Penerima KPS') === 'Ya' ? 'KIP' : 'Mampu'),
                bloodType: String(getVal(row, 'Gol Darah', 'Golongan Darah') || '').trim(),
                healthNotes: String(getVal(row, 'Riwayat Penyakit', 'Catatan Kesehatan') || '').trim(),
                hobbies: String(getVal(row, 'Hobi') || '').trim(),
                ambition: String(getVal(row, 'Cita-cita') || '').trim(),
                achievements: getVal(row, 'Prestasi') ? String(getVal(row, 'Prestasi')).split(',').map(s=>s.trim()).filter(Boolean) : [],
                violations: getVal(row, 'Pelanggaran') ? String(getVal(row, 'Pelanggaran')).split(',').map(s=>s.trim()).filter(Boolean) : [],
                behaviorScore: 100,
                attendance: { present: 0, sick: 0, permit: 0, alpha: 0 }
              };
              newStudentsBatch.push(newStudent);
            }
          });
        }

        // Fallback for headerless / index-based arrays if jsonObjects didn't match
        if (newStudentsBatch.length === 0 && rawRows.length > 1) {
          const rows = rawRows.slice(1);
          rows.forEach((row) => {
            if (!row || row.length === 0) return;
            
            // Check if it's 66-column format (row[1] is Nama, row[2] is NIS)
            // or legacy format (row[0] is ClassID, row[1] is NIS, row[4] is Nama)
            let name = '';
            let nis = '';
            let nisn = '';
            let nik = '';
            let gender: 'L' | 'P' = 'L';
            let birthPlace = '';
            let birthDate = '';
            let religion = 'Islam';
            let address = '';

            if (row.length >= 40) {
              // 66 Dapodik format
              name = row[1] ? String(row[1]).trim().toUpperCase() : '';
              nis = row[2] ? String(row[2]).trim() : '';
              const genderRaw = row[3] ? String(row[3]).toUpperCase() : 'L';
              gender = (genderRaw.includes('P') || genderRaw.includes('PEREMPUAN')) ? 'P' : 'L';
              nisn = row[4] ? String(row[4]).trim() : '';
              birthPlace = row[5] ? String(row[5]).trim() : '';
              birthDate = parseExcelDate(row[6]);
              nik = row[7] ? String(row[7]).trim() : '';
              religion = row[8] ? String(row[8]).trim() : 'Islam';
              address = row[9] ? String(row[9]).trim() : '';
              const rt = row[10] ? String(row[10]).trim() : '';
              const rw = row[11] ? String(row[11]).trim() : '';
              const dusun = row[12] ? String(row[12]).trim() : '';
              const kelurahan = row[13] ? String(row[13]).trim() : '';
              const kecamatan = row[14] ? String(row[14]).trim() : '';
              const kodePos = row[15] ? String(row[15]).trim() : '';
              const jenisTinggal = row[16] ? String(row[16]).trim() : '';
              const alatTransportasi = row[17] ? String(row[17]).trim() : '';
              const telepon = row[18] ? String(row[18]).trim() : '';
              const hp = row[19] ? String(row[19]).trim().replace(/^'/, '') : '';
              const email = row[20] ? String(row[20]).trim() : '';
              const skhun = row[21] ? String(row[21]).trim() : '';
              const penerimaKps = row[22] ? String(row[22]).trim() : 'Tidak';
              const noKps = row[23] ? String(row[23]).trim() : '';

              const fatherName = row[24] ? String(row[24]).trim().toUpperCase() : '';
              const fatherBirthYear = row[25] ? String(row[25]).trim() : '';
              const fatherEducation = row[26] ? String(row[26]).trim() : '';
              const fatherJob = row[27] ? String(row[27]).trim() : '';
              const fatherIncome = row[28] ? String(row[28]).trim() : '';
              const fatherNik = row[29] ? String(row[29]).trim() : '';

              const motherName = row[30] ? String(row[30]).trim().toUpperCase() : '';
              const motherBirthYear = row[31] ? String(row[31]).trim() : '';
              const motherEducation = row[32] ? String(row[32]).trim() : '';
              const motherJob = row[33] ? String(row[33]).trim() : '';
              const motherIncome = row[34] ? String(row[34]).trim() : '';
              const motherNik = row[35] ? String(row[35]).trim() : '';

              const parentName = row[36] ? String(row[36]).trim().toUpperCase() : (fatherName || motherName);
              const guardianBirthYear = row[37] ? String(row[37]).trim() : '';
              const guardianEducation = row[38] ? String(row[38]).trim() : '';
              const parentJob = row[39] ? String(row[39]).trim() : (fatherJob || motherJob);
              const guardianIncome = row[40] ? String(row[40]).trim() : '';
              const guardianNik = row[41] ? String(row[41]).trim() : '';

              const rombel = row[42] ? String(row[42]).trim() : classId;
              const noUjianNasional = row[43] ? String(row[43]).trim() : '';
              const noSeriIjazah = row[44] ? String(row[44]).trim() : '';
              const penerimaKip = row[45] ? String(row[45]).trim() : 'Tidak';
              const nomorKip = row[46] ? String(row[46]).trim() : '';
              const namaDiKip = row[47] ? String(row[47]).trim() : '';
              const nomorKks = row[48] ? String(row[48]).trim() : '';
              const noRegistrasiAktaLahir = row[49] ? String(row[49]).trim() : '';
              const bank = row[50] ? String(row[50]).trim() : '';
              const nomorRekeningBank = row[51] ? String(row[51]).trim() : '';
              const rekeningAtasNama = row[52] ? String(row[52]).trim() : '';
              const layakPip = row[53] ? String(row[53]).trim() : 'Tidak';
              const alasanLayakPip = row[54] ? String(row[54]).trim() : '';
              const kebutuhanKhusus = row[55] ? String(row[55]).trim() : '';
              const sekolahAsal = row[56] ? String(row[56]).trim() : '';
              const anakKe = row[57] ? String(row[57]).trim() : '';
              const lintang = row[58] ? String(row[58]).trim() : '';
              const bujur = row[59] ? String(row[59]).trim() : '';
              const noKk = row[60] ? String(row[60]).trim() : '';
              const weight = Number(row[61]) || 0;
              const height = Number(row[62]) || 0;
              const lingkarKepala = Number(row[63]) || 0;
              const jmlSaudaraKandung = Number(row[64]) || 0;
              const jarakRumahKm = Number(row[65]) || 0;

              if (name) {
                newStudentsBatch.push({
                  classId: rombel || classId,
                  rombel: rombel || classId,
                  nis: nis || `NIS-${Math.floor(1000 + Math.random() * 9000)}`,
                  nisn,
                  nik,
                  name,
                  gender,
                  birthPlace,
                  birthDate,
                  religion,
                  address,
                  rt, rw, dusun, kelurahan, kecamatan, kodePos, jenisTinggal, alatTransportasi,
                  telepon, hp, email, skhun, penerimaKps, noKps,
                  fatherName, fatherBirthYear, fatherEducation, fatherJob, fatherIncome, fatherNik,
                  motherName, motherBirthYear, motherEducation, motherJob, motherIncome, motherNik,
                  parentName, guardianBirthYear, guardianEducation, parentJob, guardianIncome, guardianNik,
                  parentPhone: hp,
                  noUjianNasional, noSeriIjazah, penerimaKip, nomorKip, namaDiKip, nomorKks,
                  noRegistrasiAktaLahir, bank, nomorRekeningBank, rekeningAtasNama,
                  layakPip, alasanLayakPip, kebutuhanKhusus, sekolahAsal, anakKe, lintang, bujur, noKk,
                  weight, height, lingkarKepala, jmlSaudaraKandung, jarakRumahKm,
                  economyStatus: penerimaKip === 'Ya' || penerimaKps === 'Ya' ? 'KIP' : 'Mampu',
                  behaviorScore: 100,
                  attendance: { present: 0, sick: 0, permit: 0, alpha: 0 },
                  achievements: [],
                  violations: []
                });
              }
            } else {
              // Legacy format fallback
              const classIdInput = row[0] ? String(row[0]).trim() : classId;
              nis = row[1] ? String(row[1]).trim() : '';
              nisn = row[2] ? String(row[2]).trim() : '';
              nik = row[3] ? String(row[3]).trim() : '';
              name = row[4] ? String(row[4]).trim().toUpperCase() : (row[3] && isNaN(Number(row[3])) ? String(row[3]).trim().toUpperCase() : '');

              if (nis && name) {
                const genderRaw = row[5] ? String(row[5]).toUpperCase() : 'L';
                gender = (genderRaw.includes('P') || genderRaw.includes('PEREMPUAN')) ? 'P' : 'L';

                const newStudent: Omit<Student, 'id'> = {
                  classId: classIdInput || classId,
                  rombel: classIdInput || classId,
                  nis,
                  nisn,
                  nik,
                  name,
                  gender,
                  birthPlace: row[6] ? String(row[6]).trim() : '',
                  birthDate: parseExcelDate(row[7]),
                  religion: row[8] ? String(row[8]).trim() : 'Islam',
                  address: row[9] ? String(row[9]).trim() : '',
                  fatherName: row[10] ? String(row[10]).trim().toUpperCase() : '',
                  fatherJob: row[11] ? String(row[11]).trim() : '',
                  fatherEducation: row[12] ? String(row[12]).trim() : '',
                  motherName: row[13] ? String(row[13]).trim().toUpperCase() : '',
                  motherJob: row[14] ? String(row[14]).trim() : '',
                  motherEducation: row[15] ? String(row[15]).trim() : '',
                  parentName: row[16] ? String(row[16]).trim().toUpperCase() : (row[10] ? String(row[10]).trim().toUpperCase() : (row[13] ? String(row[13]).trim().toUpperCase() : '')),
                  parentPhone: row[17] ? String(row[17]).trim().replace(/^'/, '') : '',
                  parentJob: row[18] ? String(row[18]).trim() : '',
                  economyStatus: (row[19] as any) || 'Mampu',
                  height: Number(row[20]) || 0,
                  weight: Number(row[21]) || 0,
                  bloodType: row[22] ? String(row[22]).trim() : '',
                  healthNotes: row[23] ? String(row[23]).trim() : '',
                  hobbies: row[24] ? String(row[24]).trim() : '',
                  ambition: row[25] ? String(row[25]).trim() : '',
                  achievements: row[26] ? String(row[26]).split(',').map(s=>s.trim()).filter(Boolean) : [],
                  violations: row[27] ? String(row[27]).split(',').map(s=>s.trim()).filter(Boolean) : [],
                  behaviorScore: 100,
                  attendance: { present: 0, sick: 0, permit: 0, alpha: 0 }
                };
                newStudentsBatch.push(newStudent);
              }
            }
          });
        }

        if (newStudentsBatch.length > 0) {
          if (onBatchAdd) {
            onBatchAdd(newStudentsBatch);
            onShowNotification(`Berhasil mengimpor ${newStudentsBatch.length} data siswa.`, 'success');
          } else {
            newStudentsBatch.forEach(s => onAdd(s));
            onShowNotification(`Berhasil mengimpor ${newStudentsBatch.length} data siswa.`, 'success');
          }
        } else {
          onShowNotification("Tidak ada data siswa yang valid ditemukan dalam berkas Excel.", 'warning');
        }
      } catch (err) {
        console.error("Gagal membaca file Excel:", err);
        onShowNotification("Gagal membaca berkas Excel. Pastikan format sesuai template.", 'error');
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, isNew: boolean) => {
    if (isReadOnly) return;
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024) {
        onShowNotification("Ukuran file maksimal 500 KB.", 'error');
        return;
      }
      try {
        const resizedBase64 = await compressImage(file, 300, 0.6);
        if (isNew) { setNewStudent(prev => ({ ...prev, photo: resizedBase64 })); } else if (selectedStudent) { handleChange('photo', resizedBase64); }
      } catch (error) { onShowNotification("Gagal memproses gambar.", 'error'); }
    }
  };

  const [detailTempAchievements, setDetailTempAchievements] = useState('');
  const [detailTempViolations, setDetailTempViolations] = useState('');

  useEffect(() => {
    if (selectedStudent) {
      setDetailTempAchievements(selectedStudent.achievements?.join(', ') || '');
      setDetailTempViolations(selectedStudent.violations?.join(', ') || '');
    }
  }, [selectedStudent]);

  const handleSaveDetail = () => {
    if (isReadOnly) return;
    if (selectedStudent) {
      const achievementsArray = detailTempAchievements ? detailTempAchievements.split(',').map(s => s.trim()) : [];
      const violationsArray = detailTempViolations ? detailTempViolations.split(',').map(s => s.trim()) : [];
      const syncedClass = selectedStudent.rombel || selectedStudent.classId;
      onUpdate({ 
        ...selectedStudent, 
        classId: syncedClass,
        rombel: syncedClass,
        achievements: achievementsArray, 
        violations: violationsArray 
      });
      onShowNotification("Data siswa berhasil disimpan!", 'success');
      setSelectedStudent(null);
    }
  };

  const handleChange = (field: keyof Student, value: any) => {
    if (isReadOnly) return;
    if(selectedStudent) {
      let updated = { ...selectedStudent, [field]: value };
      if (field === 'classId') {
        updated.rombel = value;
      } else if (field === 'rombel') {
        updated.classId = value;
      }
      if (field === 'fatherName' || field === 'motherName') { const f = field === 'fatherName' ? value : updated.fatherName; const m = field === 'motherName' ? value : updated.motherName; updated.parentName = (f ? f : m).toUpperCase(); }
      setSelectedStudent(updated);
    }
  };

  const [tempAchievements, setTempAchievements] = useState('');
  const [tempViolations, setTempViolations] = useState('');
  const [newStudent, setNewStudent] = useState<Partial<Student>>({
     name: '', nis: '', nisn: '', nik: '', classId: classId, rombel: classId, gender: 'L', religion: 'Islam', birthPlace: '', birthDate: '', address: '', photo: '',
     fatherName: '', fatherJob: '', fatherEducation: '', motherName: '', motherJob: '', motherEducation: '', parentName: '', parentPhone: '', parentJob: '',
     height: 0, weight: 0, bloodType: '', healthNotes: '', hobbies: '', ambition: '', economyStatus: 'Mampu', behaviorScore: 100, attendance: {present:0, sick:0, permit:0, alpha:0}, achievements: [], violations: []
  });

  const handleSubmitNew = (e: React.FormEvent) => {
    if (isReadOnly) return;
    e.preventDefault();
    if(newStudent.name && newStudent.nis) {
       const achievementsArray = tempAchievements ? tempAchievements.split(',').map(s => s.trim()) : [];
       const violationsArray = tempViolations ? tempViolations.split(',').map(s => s.trim()) : [];
       const syncedClass = newStudent.rombel || newStudent.classId || classId;
       onAdd({ 
         ...newStudent, 
         classId: syncedClass,
         rombel: syncedClass,
         achievements: achievementsArray, 
         violations: violationsArray 
       } as Omit<Student, 'id'>);
       setIsAddModalOpen(false);
       setNewStudent({ 
         name: '', nis: '', nisn: '', nik: '', classId: classId, rombel: classId, gender: 'L', religion: 'Islam', birthPlace: '', birthDate: '', address: '', photo: '',
         fatherName: '', fatherJob: '', fatherEducation: '', motherName: '', motherJob: '', motherEducation: '', parentName: '', parentPhone: '', parentJob: '',
         height: 0, weight: 0, bloodType: '', healthNotes: '', hobbies: '', ambition: '', economyStatus: 'Mampu', behaviorScore: 100, attendance: {present:0,sick:0,permit:0,alpha:0},
         achievements: [], violations: []
       });
       setTempAchievements(''); setTempViolations(''); setAddModalTab('biodata');
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter(student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.nis.includes(searchTerm) ||
      (student.nisn && student.nisn.includes(searchTerm)) ||
      student.classId.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => a.name.localeCompare(b.name));
  }, [students, searchTerm]);

  const [isDownloadingAllQR, setIsDownloadingAllQR] = useState(false);

  const handleDownloadAllQR = async () => {
    setIsDownloadingAllQR(true);
    try {
      const zip = new JSZip();
      
      const generateQRBlob = (student: Student): Promise<Blob | null> => {
        return new Promise((resolve) => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const dpi = 300;
          const width = Math.round((65 / 25.4) * dpi); 
          const height = Math.round((102 / 25.4) * dpi);

          canvas.width = width;
          canvas.height = height;

          if (!ctx) { resolve(null); return; }

          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);

          ctx.strokeStyle = '#5AB2FF'; 
          ctx.lineWidth = 30;
          ctx.strokeRect(0, 0, width, height);
          
          ctx.strokeStyle = '#A0DEFF';
          ctx.lineWidth = 5;
          ctx.strokeRect(30, 30, width - 60, height - 60);

          const centerX = width / 2;

          ctx.fillStyle = '#1e3a8a';
          ctx.font = 'bold 45px Arial, sans-serif';
          ctx.textAlign = 'center';
          const schoolName = (schoolProfile?.name || 'SEKOLAH').toUpperCase();
          ctx.fillText(schoolName, centerX, 120);

          ctx.fillStyle = '#64748b';
          ctx.font = '35px Arial, sans-serif';
          ctx.fillText('KARTU IDENTITAS DIGITAL', centerX, 180);

          const svgElement = document.getElementById(`qr-code-${student.id}`);
          if (!svgElement) { resolve(null); return; }
          
          const svgData = new XMLSerializer().serializeToString(svgElement);
          const img = new Image();
          img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
          
          img.onload = () => {
              const qrSize = 500; 
              const qrY = 250;
              ctx.drawImage(img, centerX - (qrSize / 2), qrY, qrSize, qrSize);

              ctx.fillStyle = '#000000';
              ctx.font = 'bold 50px Arial, sans-serif';
              
              const maxWidth = width - 120;
              const words = student.name.split(' ');
              let line = '';
              const lines = [];
              
              for (let n = 0; n < words.length; n++) {
                  const testLine = line + words[n] + ' ';
                  const metrics = ctx.measureText(testLine);
                  if (metrics.width > maxWidth && n > 0) {
                      lines.push(line.trim());
                      line = words[n] + ' ';
                  } else {
                      line = testLine;
                  }
              }
              lines.push(line.trim());

              const lineHeight = 60;
              const nameBaseY = height - 280;
              const startY = nameBaseY - ((lines.length - 1) * lineHeight / 2);

              lines.forEach((l, i) => {
                  ctx.fillText(l, centerX, startY + (i * lineHeight));
              });

              const boxY = height - 220;
              const boxHeight = 150;
              const boxWidth = width - 100;
              
              ctx.fillStyle = '#f0f9ff';
              ctx.fillRect((width - boxWidth)/2, boxY, boxWidth, boxHeight);
              
              ctx.fillStyle = '#0369a1';
              ctx.font = 'bold 40px monospace';
              ctx.fillText(`NIS : ${student.nis}`, centerX, boxY + 60);
              
              if (student.nisn) {
                  ctx.fillText(`NISN: ${student.nisn}`, centerX, boxY + 110);
              } else {
                  ctx.fillText(`KELAS: ${student.classId}`, centerX, boxY + 110);
              }

              canvas.toBlob((blob) => {
                  resolve(blob);
              }, 'image/jpeg', 0.9);
          };
          img.onerror = () => resolve(null);
        });
      };

      for (const student of filteredStudents) {
        const blob = await generateQRBlob(student);
        if (blob) {
            const safeName = student.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            zip.file(`${student.classId}_${safeName}_QR.jpg`, blob);
        }
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `QR_Code_${classId || 'All'}_${new Date().toISOString().split('T')[0]}.zip`;
      link.click();
      URL.revokeObjectURL(link.href);

    } catch (error) {
      console.error("Error generating zip:", error);
      onShowNotification("Gagal mengunduh QR Code masal", "error");
    } finally {
      setIsDownloadingAllQR(false);
    }
  };

  // --- QR Code Downloader Logic ---
  const handleDownloadQR = (student: Student) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      // Set to 300 DPI for high quality print
      const dpi = 300;
      // Target: 65mm x 102mm
      const width = Math.round((65 / 25.4) * dpi);  // ~768 px
      const height = Math.round((102 / 25.4) * dpi); // ~1205 px

      canvas.width = width;
      canvas.height = height;

      if (ctx) {
          // 1. Background
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);

          // 2. Decorative Border/Frame
          ctx.strokeStyle = '#5AB2FF'; // Ocean Blue
          ctx.lineWidth = 30;
          ctx.strokeRect(0, 0, width, height);
          
          // Inner thin border
          ctx.strokeStyle = '#A0DEFF';
          ctx.lineWidth = 5;
          ctx.strokeRect(30, 30, width - 60, height - 60);

          const centerX = width / 2;

          // 3. Header Text (School Name)
          ctx.fillStyle = '#1e3a8a'; // Dark Blue
          ctx.font = 'bold 45px Arial, sans-serif';
          ctx.textAlign = 'center';
          const schoolName = (schoolProfile?.name || 'SEKOLAH').toUpperCase();
          ctx.fillText(schoolName, centerX, 120);

          // 4. Sub Header
          ctx.fillStyle = '#64748b'; // Slate 500
          ctx.font = '35px Arial, sans-serif';
          ctx.fillText('KARTU IDENTITAS DIGITAL', centerX, 180);

          // 5. Draw QR Code Image from SVG
          const svgElement = document.getElementById(`qr-code-${student.id}`);
          if (svgElement) {
              const svgData = new XMLSerializer().serializeToString(svgElement);
              const img = new Image();
              // Encode SVG to base64
              img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
              
              img.onload = () => {
                  // Center the QR code
                  const qrSize = 500; // Large QR for clarity
                  const qrY = 250;
                  ctx.drawImage(img, centerX - (qrSize / 2), qrY, qrSize, qrSize);

                  // 6. Student Name
                  ctx.fillStyle = '#000000';
                  ctx.font = 'bold 50px Arial, sans-serif';
                  
                  const maxWidth = width - 120;
                  const words = student.name.split(' ');
                  let line = '';
                  const lines = [];
                  
                  for (let n = 0; n < words.length; n++) {
                      const testLine = line + words[n] + ' ';
                      const metrics = ctx.measureText(testLine);
                      const testWidth = metrics.width;
                      if (testWidth > maxWidth && n > 0) {
                          lines.push(line.trim());
                          line = words[n] + ' ';
                      } else {
                          line = testLine;
                      }
                  }
                  lines.push(line.trim());

                  // Draw lines
                  const lineHeight = 60;
                  // Base Y position for the name section
                  const nameBaseY = height - 280;
                  // Adjust startY based on number of lines to keep it centered around nameBaseY
                  const startY = nameBaseY - ((lines.length - 1) * lineHeight / 2);

                  lines.forEach((l, i) => {
                      ctx.fillText(l, centerX, startY + (i * lineHeight));
                  });

                  // 7. NIS & NISN Box
                  const boxY = height - 220;
                  const boxHeight = 150;
                  const boxWidth = width - 100;
                  
                  ctx.fillStyle = '#f0f9ff'; // Very light blue bg
                  ctx.fillRect((width - boxWidth)/2, boxY, boxWidth, boxHeight);
                  
                  ctx.fillStyle = '#0369a1'; // Sky 700
                  ctx.font = 'bold 40px monospace';
                  ctx.fillText(`NIS : ${student.nis}`, centerX, boxY + 60);
                  
                  if (student.nisn) {
                      ctx.fillText(`NISN: ${student.nisn}`, centerX, boxY + 110);
                  } else {
                      ctx.fillText(`KELAS: ${student.classId}`, centerX, boxY + 110);
                  }

                  // 8. Trigger Download
                  const link = document.createElement('a');
                  const safeName = student.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                  link.download = `${safeName}_QR.jpg`;
                  link.href = canvas.toDataURL('image/jpeg', 0.9);
                  link.click();
              };
          }
      }
  };


  // -- RENDER --
  if (viewType === 'dashboard') {
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 no-print no-print-report">
                <div><h2 className="text-2xl font-bold text-gray-800">Manajemen Siswa</h2><p className="text-gray-500">Statistik dan database lengkap profil siswa.</p></div>
                <div className="flex flex-wrap gap-2 justify-end">
                    <div className="bg-white p-1 rounded-lg border border-gray-200 flex shadow-sm mr-2">
                        <button onClick={() => setViewType('dashboard')} className="p-2 rounded-md transition-all bg-[#5AB2FF] text-white shadow-sm" title="Dashboard"><PieChartIcon size={18} /></button>
                        <button onClick={() => setViewType('list')} className="p-2 rounded-md transition-all text-gray-400 hover:text-gray-600" title="Tampilan Tabel"><ListIcon size={18} /></button>
                        <button onClick={() => setViewType('grid')} className="p-2 rounded-md transition-all text-gray-400 hover:text-gray-600" title="Tampilan Grid"><LayoutGrid size={18} /></button>
                        <button onClick={() => setViewType('qr-codes')} className="p-2 rounded-md transition-all text-gray-400 hover:text-gray-600" title="QR Code Siswa"><QrCodeIcon size={18} /></button>
                        <button onClick={() => setViewType('health-data')} className="p-2 rounded-md transition-all text-gray-400 hover:text-gray-600" title="Data Kesehatan"><Heart size={18} /></button>
                        <button onClick={() => setViewType('parent-data')} className="p-2 rounded-md transition-all text-gray-400 hover:text-gray-600" title="Data Orang Tua"><Users size={18} /></button>
                        <button onClick={() => setViewType('talents-data')} className="p-2 rounded-md transition-all text-gray-400 hover:text-gray-600" title="Data Bakat Minat"><Activity size={18} /></button>
                    </div>
                </div>
            </div>
            <StudentDashboard students={students} allAttendanceRecords={allAttendanceRecords} schoolProfile={schoolProfile} teacherProfile={teacherProfile} />
        </div>
    );
  }

  if (selectedStudent) {
    const completeness = calculateCompleteness(selectedStudent);
    return (
      <div className="space-y-6 animate-fade-in print-container">
        
        <div className="flex items-center justify-between no-print">
          <button onClick={() => setSelectedStudent(null)} className="flex items-center text-gray-500 hover:text-[#5AB2FF] transition-colors">
            <ArrowLeft size={20} className="mr-2" /> <span className="font-medium">Kembali ke Daftar</span>
          </button>
          <div className="flex space-x-2">
            <button onClick={handlePrint} className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-lg hover:bg-[#FFF9D0] font-medium flex items-center shadow-sm">
               <Printer size={18} className="mr-2"/> Cetak Biodata
            </button>
            {!isReadOnly && (
              <>
                {selectedStudent.classId?.startsWith('6') ? (
                  <button 
                    onClick={() => handleLulus(selectedStudent)} 
                    className="flex items-center bg-emerald-50 text-emerald-600 px-4 py-2 rounded-lg hover:bg-emerald-100 font-medium"
                    title="Luluskan Siswa"
                  >
                    <GraduationCap size={18} className="mr-2" /> Lulus
                  </button>
                ) : (
                  <button 
                    onClick={() => handleNaikKelas(selectedStudent)} 
                    className="flex items-center bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-100 font-medium"
                    title="Naik Kelas"
                  >
                    <ArrowUpCircle size={18} className="mr-2" /> Naik Kelas
                  </button>
                )}
                <button 
                  onClick={() => setIsMutasiKeluarModalOpen(true)} 
                  className="flex items-center bg-rose-50 text-rose-600 px-4 py-2 rounded-lg hover:bg-rose-100 font-medium"
                  title="Mutasi Keluar Siswa"
                >
                  <UserMinus size={18} className="mr-2" /> Mutasi Keluar
                </button>
                <button 
                    onClick={() => handleDeleteClick(selectedStudent.id)} 
                    className="bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 font-medium"
                >
                  <Trash2 size={18} />
                </button>
                <button onClick={handleSaveDetail} className="flex items-center bg-[#5AB2FF] text-white px-4 py-2 rounded-lg hover:bg-[#A0DEFF] font-medium shadow-sm">
                  <Save size={16} className="mr-2" /> Simpan Data
                </button>
              </>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#CAF4FF] flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6 print:shadow-none print:border-none">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full bg-[#CAF4FF]/50 flex items-center justify-center border-4 border-white shadow-md overflow-hidden print:border-gray-300">
               {selectedStudent.photo && !isPhotoError(selectedStudent.photo) ? (
                 <img src={selectedStudent.photo} alt={selectedStudent.name.toUpperCase()} className="w-full h-full object-cover" />
               ) : (
                 <div className="flex flex-col items-center text-center">
                    <UserCircle size={80} className="text-[#A0DEFF]" />
                 </div>
               )}
            </div>
            {!isReadOnly && (
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer no-print">
                <label className="cursor-pointer text-white text-xs font-bold flex flex-col items-center">
                    <Upload size={20} className="mb-1" />
                    <span>Ubah Foto</span>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handlePhotoUpload(e, false)} />
                </label>
                </div>
            )}
            <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-sm no-print pointer-events-none">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white ${getCompletenessColor(completeness)}`}>
                    {completeness}%
                </div>
            </div>
          </div>
          <div className="text-center md:text-left flex-1">
                <input className="text-2xl font-bold text-gray-800 border-b border-dashed border-transparent hover:border-gray-300 focus:border-[#5AB2FF] outline-none w-full md:w-auto bg-transparent print:border-none uppercase" value={selectedStudent.name} onChange={(e) => handleChange('name', e.target.value)} />
            <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-2 text-sm text-gray-500">
               <span className="bg-gray-100 px-3 py-1 rounded-full font-medium">NIS: {selectedStudent.nis}</span>
               {selectedStudent.nisn && <span className="bg-[#CAF4FF] text-[#5AB2FF] px-3 py-1 rounded-full font-medium">NISN: {selectedStudent.nisn}</span>}
               <span className="bg-[#FFF9D0] text-amber-700 px-3 py-1 rounded-full font-medium">Kelas: {selectedStudent.classId}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 no-print">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 space-y-1 sticky top-6">
               {[{ id: 'biodata', label: 'Biodata & Ortu', icon: User }, { id: 'health', label: 'Fisik & Kesehatan', icon: Heart }, { id: 'talents', label: 'Minat & Bakat', icon: Activity }, { id: 'economy', label: 'Sosial Ekonomi', icon: DollarSign }, { id: 'records', label: 'Prestasi & Pelanggaran', icon: AlertTriangle }].map((tab) => (
                 <button key={tab.id} onClick={() => setActiveTab(tab.id as TabType)} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-[#CAF4FF] text-[#5AB2FF] shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}>
                   <tab.icon size={18} /> <span>{tab.label}</span>
                 </button>
               ))}
            </div>
          </div>
          <div className="lg:col-span-3 print:col-span-4">
             <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 min-h-[500px] print:shadow-none print:border-none print:p-0">
                <div className={activeTab === 'biodata' ? '' : 'hidden print:block'}><BiodataTab student={selectedStudent} onChange={handleChange} /></div>
                <div className={activeTab === 'health' ? '' : 'hidden print:block'}><HealthTab student={selectedStudent} onChange={handleChange} /></div>
                <div className={activeTab === 'talents' ? '' : 'hidden print:block'}><TalentsTab student={selectedStudent} onChange={handleChange} /></div>
                <div className={activeTab === 'economy' ? '' : 'hidden print:block'}><EconomyTab student={selectedStudent} onChange={handleChange} /></div>
                 <div className={activeTab === 'records' ? '' : 'hidden print:block'}><RecordsTab student={selectedStudent} tempAchievements={detailTempAchievements} setTempAchievements={setDetailTempAchievements} tempViolations={detailTempViolations} setTempViolations={setDetailTempViolations}/></div>
              </div>
            </div>
          </div>
        </div>
      );
    }

  // --- Main List View (Grid) ---
  return (
    <div className={`space-y-6 animate-fade-in relative ${viewType === 'qr-codes' ? '' : 'page-portrait'}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 no-print">
        <div><h2 className="text-2xl font-bold text-gray-800">Manajemen Siswa</h2><p className="text-gray-500">Database lengkap profil siswa.</p></div>
        <div className="flex flex-wrap gap-2 justify-end">
           <div className="bg-white p-1 rounded-lg border border-gray-200 flex shadow-sm mr-2">
              <button onClick={() => setViewType('dashboard')} className="p-2 rounded-md transition-all text-gray-400 hover:text-gray-600" title="Dashboard"><PieChartIcon size={18} /></button>
              <button onClick={() => setViewType('list')} className={`p-2 rounded-md transition-all ${viewType === 'list' ? 'bg-[#5AB2FF] text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`} title="Tampilan Tabel"><ListIcon size={18} /></button>
              <button onClick={() => setViewType('grid')} className={`p-2 rounded-md transition-all ${viewType === 'grid' ? 'bg-[#5AB2FF] text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`} title="Tampilan Grid"><LayoutGrid size={18} /></button>
              <button onClick={() => setViewType('qr-codes')} className={`p-2 rounded-md transition-all ${viewType === 'qr-codes' ? 'bg-[#5AB2FF] text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`} title="QR Code Siswa"><QrCodeIcon size={18} /></button>
              <button onClick={() => setViewType('health-data')} className={`p-2 rounded-md transition-all ${viewType === 'health-data' ? 'bg-[#5AB2FF] text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`} title="Data Kesehatan"><Heart size={18} /></button>
              <button onClick={() => setViewType('parent-data')} className={`p-2 rounded-md transition-all ${viewType === 'parent-data' ? 'bg-[#5AB2FF] text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`} title="Data Orang Tua"><Users size={18} /></button>
              <button onClick={() => setViewType('talents-data')} className={`p-2 rounded-md transition-all ${viewType === 'talents-data' ? 'bg-[#5AB2FF] text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`} title="Data Bakat Minat"><Activity size={18} /></button>
           </div>
           
            {!isReadOnly && <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".xlsx, .xls, .csv" />}
            
            <div className="flex flex-wrap gap-2 no-print">
              <button 
                onClick={handleDownloadTemplate} 
                className="flex items-center space-x-2 bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                title="Unduh Template Excel Data Siswa"
              >
                <FileSpreadsheet size={16} /> <span className="hidden sm:inline">Template</span>
              </button>

              {!isReadOnly && (
                <button 
                  onClick={handleImportClick} 
                  className="flex items-center space-x-2 bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                  title="Impor Data Siswa dari Excel"
                >
                  <Upload size={16} /> <span className="hidden sm:inline">Import</span>
                </button>
              )}
              
              <button onClick={handleExport} className="flex items-center space-x-2 bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"><Download size={16} /> <span className="hidden sm:inline">Export</span></button>
              <button onClick={handlePrint} className="flex items-center space-x-2 bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"><Printer size={16} /> <span>Cetak</span></button>
              {!isReadOnly && (
                <button 
                  onClick={handleBatchNaikKelas} 
                  disabled={isPromotingBatch}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors shadow-md font-bold ${
                    isClass6 
                      ? 'bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white' 
                      : 'bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white'
                  }`}
                  title={isClass6 ? "Luluskan seluruh siswa di kelas ini ke Data Lulusan" : "Naikkan seluruh siswa di kelas ini ke jenjang kelas berikutnya"}
                >
                  {isClass6 ? <GraduationCap size={16} /> : <ArrowUpCircle size={16} />}
                  <span>{isClass6 ? "Lulus Massal" : "Naik Kelas Massal"}</span>
                </button>
              )}
              {!isReadOnly && <button onClick={() => { setIsAddModalOpen(true); setAddModalTab('biodata'); }} className="flex items-center space-x-2 bg-[#5AB2FF] hover:bg-[#A0DEFF] text-white px-4 py-2 rounded-lg transition-colors shadow-md"><Plus size={18} /><span>Tambah</span></button>}
            </div>
        </div>
      </div>

      <div className={`bg-white rounded-xl shadow-sm border border-[#CAF4FF] overflow-hidden ${viewType === 'qr-codes' ? 'print-container border-none shadow-none' : 'print-container'}`}>
        <div className="p-4 border-b border-gray-100 flex items-center bg-[#CAF4FF]/20 no-print">
            <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Cari nama, NIS, NISN, atau Kelas..." className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5AB2FF]" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
        </div>

        {viewType === 'grid' ? (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-gray-50/30">
             {filteredStudents.map((student, index) => {
                const completeness = calculateCompleteness(student);
                // Rotate colors: White, Cream, Baby Blue
                const cardVariants = [
                    'bg-white border-gray-100',
                    'bg-[#FFF9D0]/40 border-amber-100',
                    'bg-[#CAF4FF]/30 border-blue-100',
                ];
                const variant = cardVariants[index % cardVariants.length];

                return (
                <div key={student.id} onClick={() => setSelectedStudent(student)} className={`${variant} rounded-xl border shadow-sm hover:shadow-lg hover:border-[#A0DEFF] hover:-translate-y-1 transition-all duration-300 cursor-pointer group overflow-hidden`}>
                   <div className="p-5 flex items-start space-x-4">
                      <div className="relative shrink-0">
                         <div className="w-16 h-16 rounded-full bg-white/80 flex items-center justify-center text-2xl font-bold text-[#5AB2FF] border-2 border-white shadow-sm overflow-hidden">
                            {student.photo && !isPhotoError(student.photo) ? (
                                <img src={student.photo} alt={student.name.toUpperCase()} className="w-full h-full object-cover" />
                            ) : ( student.gender === 'L' ? '👦' : '👧' )}
                         </div>
                      </div>
                      <div className="flex-1 min-w-0 min-h-16">
                         <h3 className={`font-bold text-gray-800 group-hover:text-[#5AB2FF] transition-colors uppercase ${student.name.length > 22 ? 'text-base leading-tight' : 'text-lg'}`}>{student.name.toUpperCase()}</h3>
                         <div className="flex flex-wrap gap-1.5 mt-2">
                            <span className="bg-white/80 text-gray-600 text-[10px] px-2 py-0.5 rounded font-mono border border-gray-200 shadow-sm flex items-center" title="NIS">
                                NIS: {student.nis}
                            </span>
                            {student.nisn && (
                                <span className="bg-indigo-50 text-indigo-600 text-[10px] px-2 py-0.5 rounded font-mono border border-indigo-100 shadow-sm flex items-center" title="NISN">
                                    NISN: {student.nisn}
                                </span>
                            )}
                            <span className="bg-amber-50 text-amber-700 text-[10px] px-2 py-0.5 rounded font-bold border border-amber-100 shadow-sm flex items-center" title="Kelas">
                                Kls {student.classId}
                            </span>
                         </div>
                      </div>
                   </div>
                   <div className="bg-white/50 px-5 py-3 border-t border-gray-100 flex flex-col justify-center">
                      <div className="flex justify-between items-center mb-1"><span className="text-xs font-semibold text-gray-500">Kelengkapan Data</span><span className={`text-xs font-bold ${getCompletenessColor(completeness)} px-2 py-0.5 rounded`}>{completeness}%</span></div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5"><div className={`h-1.5 rounded-full ${getCompletenessBarColor(completeness)}`} style={{width: `${completeness}%`}}></div></div>
                   </div>
                </div>
             )})}
          </div>
        ) : viewType === 'qr-codes' ? (
            /* QR CODE CARD LAYOUT */
            <div className="p-6 bg-gray-50 flex flex-col space-y-4">
                <div className="flex justify-between items-center bg-indigo-50 p-4 rounded-xl border border-indigo-100 no-print">
                    <div className="flex items-center text-indigo-800">
                        <QrCodeIcon className="mr-3" size={24} />
                        <div>
                            <h3 className="font-bold">QR Code Siswa</h3>
                            <p className="text-sm opacity-80">Total {filteredStudents.length} QR Code siap dicetak atau didownload</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleDownloadAllQR}
                        disabled={isDownloadingAllQR || filteredStudents.length === 0}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-bold flex items-center shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isDownloadingAllQR ? (
                            <>
                                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                                Memproses ZIP...
                            </>
                        ) : (
                            <>
                                <Download size={18} className="mr-2" /> Download Semua QR (.zip)
                            </>
                        )}
                    </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredStudents.map((student) => (
                        <div key={student.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 flex flex-col items-center text-center">
                            <h3 className="font-bold text-gray-800 text-sm mb-1 truncate w-full uppercase">{student.name.toUpperCase()}</h3>
                            <span className="text-xs font-mono text-gray-500 mb-3 bg-gray-100 px-2 py-0.5 rounded">NIS: {student.nis}</span>
                            
                            <div className="bg-white p-2 rounded-lg border border-gray-100 shadow-inner mb-3">
                                <QRCode 
                                    id={`qr-code-${student.id}`} // Unique ID for finding SVG
                                    value={student.id} 
                                    size={120} 
                                    viewBox={`0 0 256 256`} 
                                    style={{ height: "auto", maxWidth: "100%", width: "120px" }}
                                />
                            </div>

                            <button 
                                onClick={() => handleDownloadQR(student)}
                                className="w-full py-2 bg-indigo-50 text-indigo-600 font-bold text-xs rounded-lg hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2"
                            >
                                <Download size={14}/> Download JPG
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        ) : viewType === 'health-data' ? (
            /* HEALTH DATA TABLE VIEW */
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-[#CAF4FF]/50 text-gray-700 font-medium border-b border-[#A0DEFF]">
                        <tr>
                            <th className="px-4 py-3 text-center w-12">No</th>
                            <th className="px-4 py-3">NIS</th>
                            <th className="px-4 py-3">Nama</th>
                            <th className="px-4 py-3 text-center">Berat (kg)</th>
                            <th className="px-4 py-3 text-center">Tinggi (cm)</th>
                            <th className="px-4 py-3">Riwayat Penyakit</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredStudents.map((student, index) => (
                            <tr key={student.id} className={`hover:bg-[#CAF4FF]/20 cursor-pointer ${index % 2 === 0 ? 'bg-white' : 'bg-[#CAF4FF]/10'}`} onClick={() => setSelectedStudent(student)}>
                                <td className="px-4 py-3 text-center text-gray-500 font-mono w-12">{index + 1}</td>
                                <td className="px-4 py-3 font-mono text-gray-500 whitespace-nowrap">{student.nis}</td>
                                <td className="px-4 py-3 font-medium flex items-center whitespace-nowrap uppercase">
                                    {student.photo && !isPhotoError(student.photo) && <img src={student.photo} className="w-8 h-8 rounded-full mr-3 object-cover" alt=""/>}
                                    {student.name.toUpperCase()}
                                </td>
                                <td className="px-4 py-3 text-center font-mono">{student.weight || '-'}</td>
                                <td className="px-4 py-3 text-center font-mono">{student.height || '-'}</td>
                                <td className="px-4 py-3 text-gray-600 italic">{student.healthNotes || 'Tidak ada'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        ) : viewType === 'parent-data' ? (
            /* PARENT DATA TABLE VIEW */
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-[#CAF4FF]/50 text-gray-700 font-medium border-b border-[#A0DEFF]">
                        <tr>
                            <th className="px-4 py-3 text-center w-12">No</th>
                            <th className="px-4 py-3">NIS</th>
                            <th className="px-4 py-3">Nama</th>
                            <th className="px-4 py-3">Nama Ayah</th>
                            <th className="px-4 py-3">Pendidikan Ayah</th>
                            <th className="px-4 py-3">Pekerjaan Ayah</th>
                            <th className="px-4 py-3">Nama Ibu</th>
                            <th className="px-4 py-3">Pendidikan Ibu</th>
                            <th className="px-4 py-3">Pekerjaan Ibu</th>
                            <th className="px-4 py-3">Alamat</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredStudents.map((student, index) => (
                            <tr key={student.id} className={`hover:bg-[#CAF4FF]/20 cursor-pointer ${index % 2 === 0 ? 'bg-white' : 'bg-[#CAF4FF]/10'}`} onClick={() => setSelectedStudent(student)}>
                                <td className="px-4 py-3 text-center text-gray-500 font-mono w-12">{index + 1}</td>
                                <td className="px-4 py-3 font-mono text-gray-500 whitespace-nowrap">{student.nis}</td>
                                <td className="px-4 py-3 font-medium flex items-center whitespace-nowrap uppercase">
                                    {student.photo && !isPhotoError(student.photo) && <img src={student.photo} className="w-8 h-8 rounded-full mr-3 object-cover" alt=""/>}
                                    {student.name.toUpperCase()}
                                </td>
                                <td className="px-4 py-3 uppercase">{student.fatherName?.toUpperCase() || '-'}</td>
                                <td className="px-4 py-3">{student.fatherEducation || '-'}</td>
                                <td className="px-4 py-3">{student.fatherJob || '-'}</td>
                                <td className="px-4 py-3 uppercase">{student.motherName?.toUpperCase() || '-'}</td>
                                <td className="px-4 py-3">{student.motherEducation || '-'}</td>
                                <td className="px-4 py-3">{student.motherJob || '-'}</td>
                                <td className="px-4 py-3 truncate max-w-[200px]">{student.address}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        ) : viewType === 'talents-data' ? (
            /* TALENTS DATA TABLE VIEW */
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-[#CAF4FF]/50 text-gray-700 font-medium border-b border-[#A0DEFF]">
                        <tr>
                            <th className="px-4 py-3 text-center w-12">No</th>
                            <th className="px-4 py-3">NIS</th>
                            <th className="px-4 py-3">NISN</th>
                            <th className="px-4 py-3">Nama</th>
                            <th className="px-4 py-3">Tempat Lahir</th>
                            <th className="px-4 py-3">Tanggal Lahir</th>
                            <th className="px-4 py-3">NIK</th>
                            <th className="px-4 py-3">Hobi</th>
                            <th className="px-4 py-3">Cita-cita</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredStudents.map((student, index) => (
                            <tr key={student.id} className={`hover:bg-[#CAF4FF]/20 cursor-pointer ${index % 2 === 0 ? 'bg-white' : 'bg-[#CAF4FF]/10'}`} onClick={() => setSelectedStudent(student)}>
                                <td className="px-4 py-3 text-center text-gray-500 font-mono w-12">{index + 1}</td>
                                <td className="px-4 py-3 font-mono text-gray-500 whitespace-nowrap">{student.nis}</td>
                                <td className="px-4 py-3 font-mono text-gray-500 whitespace-nowrap">{student.nisn || '-'}</td>
                                <td className="px-4 py-3 font-medium flex items-center whitespace-nowrap uppercase">
                                    {student.photo && !isPhotoError(student.photo) && <img src={student.photo} className="w-8 h-8 rounded-full mr-3 object-cover" alt=""/>}
                                    {student.name.toUpperCase()}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">{student.birthPlace || '-'}</td>
                                <td className="px-4 py-3 whitespace-nowrap">{student.birthDate ? formatDateID(student.birthDate) : '-'}</td>
                                <td className="px-4 py-3 font-mono text-gray-500 whitespace-nowrap">{student.nik || '-'}</td>
                                <td className="px-4 py-3">{student.hobbies || '-'}</td>
                                <td className="px-4 py-3">{student.ambition || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        ) : (
           <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#CAF4FF]/50 text-gray-700 font-medium border-b border-[#A0DEFF]">
                <tr>
                    <th className="px-4 py-3 text-center w-12">
                        <input type="checkbox" className="rounded text-[#5AB2FF] focus:ring-[#5AB2FF]" onChange={(e) => {
                            if (e.target.checked) {
                                setSelectedStudentIds(filteredStudents.map(s => s.id));
                            } else {
                                setSelectedStudentIds([]);
                            }
                        }} checked={selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0} />
                    </th>
                    <th className="px-4 py-3 text-center w-12">No</th>
                    <th className="px-4 py-3">NIS</th>
                    <th className="px-4 py-3">NISN</th>
                    <th className="px-4 py-3">Nama</th>
                    <th className="px-4 py-3 text-center">L/P</th>
                    <th className="px-4 py-3">Tempat Lahir</th>
                    <th className="px-4 py-3">Tanggal Lahir</th>
                    <th className="px-4 py-3">NIK</th>
                    <th className="px-4 py-3">Agama</th>
                    <th className="px-4 py-3">Nama Ayah</th>
                    <th className="px-4 py-3">Nama Ibu</th>
                    <th className="px-4 py-3">Alamat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStudents.map((student, index) => (
                  <tr key={student.id} className={`hover:bg-[#CAF4FF]/20 ${index % 2 === 0 ? 'bg-white' : 'bg-[#CAF4FF]/10'}`}>
                    <td className="px-4 py-3 text-center">
                        <input type="checkbox" className="rounded text-[#5AB2FF] focus:ring-[#5AB2FF]" checked={selectedStudentIds.includes(student.id)} onChange={(e) => {
                            if (e.target.checked) {
                                setSelectedStudentIds([...selectedStudentIds, student.id]);
                            } else {
                                setSelectedStudentIds(selectedStudentIds.filter(id => id !== student.id));
                            }
                        }} />
                    </td>
                    <td className="px-4 py-3 text-center text-gray-500 font-mono w-12" onClick={() => setSelectedStudent(student)}>{index + 1}</td>
                    <td className="px-4 py-3 font-mono text-gray-500 whitespace-nowrap" onClick={() => setSelectedStudent(student)}>{student.nis}</td>
                    <td className="px-4 py-3 font-mono text-gray-500 whitespace-nowrap" onClick={() => setSelectedStudent(student)}>{student.nisn || '-'}</td>
                    <td className="px-4 py-3 font-medium flex items-center whitespace-nowrap uppercase" onClick={() => setSelectedStudent(student)}>{student.photo && !isPhotoError(student.photo) && <img src={student.photo} className="w-8 h-8 rounded-full mr-3 object-cover"/>}{student.name.toUpperCase()}</td>
                    <td className="px-4 py-3 text-center" onClick={() => setSelectedStudent(student)}>{student.gender}</td>
                    <td className="px-4 py-3 whitespace-nowrap" onClick={() => setSelectedStudent(student)}>{student.birthPlace || '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap" onClick={() => setSelectedStudent(student)}>{student.birthDate ? formatDateID(student.birthDate) : '-'}</td>
                    <td className="px-4 py-3 font-mono text-gray-500 whitespace-nowrap" onClick={() => setSelectedStudent(student)}>{student.nik || '-'}</td>
                    <td className="px-4 py-3" onClick={() => setSelectedStudent(student)}>{student.religion || '-'}</td>
                    <td className="px-4 py-3 uppercase" onClick={() => setSelectedStudent(student)}>{student.fatherName?.toUpperCase() || '-'}</td>
                    <td className="px-4 py-3 uppercase" onClick={() => setSelectedStudent(student)}>{student.motherName?.toUpperCase() || '-'}</td>
                    <td className="px-4 py-3 truncate max-w-[150px]" onClick={() => setSelectedStudent(student)}>{student.address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
           </div>
        )}
      </div>

      {isAddModalOpen && !isReadOnly && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm no-print">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-[#CAF4FF]/30">
               <div><h3 className="font-bold text-xl text-gray-800">Tambah Data Siswa</h3></div>
               <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full"><X size={20}/></button>
            </div>
            <form onSubmit={handleSubmitNew} className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                    <div className="flex justify-center mb-4">
                       <div className="relative group w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden cursor-pointer hover:bg-gray-200">
                          {newStudent.photo ? <img src={newStudent.photo} className="w-full h-full object-cover"/> : <ImageIcon size={24} className="text-gray-400"/>}
                          <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={(e) => handlePhotoUpload(e, true)} />
                       </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <input required className="border p-2 rounded uppercase" placeholder="Nama" value={newStudent.name} onChange={e=>setNewStudent({...newStudent, name:e.target.value.toUpperCase()})}/>
                        <input required className="border p-2 rounded uppercase" placeholder="NIS" value={newStudent.nis} onChange={e=>setNewStudent({...newStudent, nis:e.target.value})}/>
                        <input className="border p-2 rounded font-mono" placeholder="NISN" value={newStudent.nisn || ''} onChange={e=>setNewStudent({...newStudent, nisn:e.target.value})}/>
                        <input className="border p-2 rounded font-mono" placeholder="NIK" value={newStudent.nik || ''} onChange={e=>setNewStudent({...newStudent, nik:e.target.value})}/>
                        <input className="border p-2 rounded" placeholder="Kelas / Rombel" value={newStudent.classId || newStudent.rombel || ''} onChange={e=>setNewStudent({...newStudent, classId:e.target.value, rombel:e.target.value})}/>
                        <select className="border p-2 rounded" value={newStudent.gender} onChange={e=>setNewStudent({...newStudent, gender:e.target.value as any})}><option value="L">Laki-laki</option><option value="P">Perempuan</option></select>
                        <input className="border p-2 rounded" placeholder="Tempat Lahir" value={newStudent.birthPlace || ''} onChange={e=>setNewStudent({...newStudent, birthPlace:e.target.value})}/>
                        <input type="date" className="border p-2 rounded" placeholder="Tanggal Lahir" value={newStudent.birthDate || ''} onChange={e=>setNewStudent({...newStudent, birthDate:e.target.value})}/>
                    </div>
                </div>
            </form>
            <div className="p-5 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
               <button onClick={() => setIsAddModalOpen(false)} className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100">Batal</button>
               <button onClick={handleSubmitNew} className="px-5 py-2.5 rounded-lg bg-[#5AB2FF] text-white font-bold hover:bg-[#A0DEFF] shadow-md">Simpan Data Siswa</button>
            </div>
          </div>
        </div>
      )}

      {isMutasiKeluarModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm no-print">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-rose-50">
               <h3 className="font-bold text-lg text-rose-700 flex items-center gap-2">
                 <UserMinus size={20} /> Form Mutasi Keluar: {(selectedStudent as Student).name}
               </h3>
               <button onClick={() => setIsMutasiKeluarModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full"><X size={20}/></button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!mutasiKeluarForm.tujuanSekolah) {
                onShowNotification('Harap masukkan nama sekolah tujuan mutasi!', 'warning');
                return;
              }
              if (onMutasiKeluar) {
                onMutasiKeluar(selectedStudent, mutasiKeluarForm);
              }
              setIsMutasiKeluarModalOpen(false);
              setSelectedStudent(null);
            }} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tanggal Mutasi *</label>
                <input
                  type="date"
                  value={mutasiKeluarForm.tanggalMutasi}
                  onChange={e => setMutasiKeluarForm({...mutasiKeluarForm, tanggalMutasi: e.target.value})}
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-rose-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Alasan Mutasi *</label>
                <input
                  type="text"
                  placeholder="Alasan Mutasi"
                  value={mutasiKeluarForm.alasanMutasi}
                  onChange={e => setMutasiKeluarForm({...mutasiKeluarForm, alasanMutasi: e.target.value})}
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-rose-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nama Sekolah Tujuan *</label>
                <input
                  type="text"
                  placeholder="Nama Sekolah Tujuan"
                  value={mutasiKeluarForm.tujuanSekolah}
                  onChange={e => setMutasiKeluarForm({...mutasiKeluarForm, tujuanSekolah: e.target.value})}
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-rose-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Kota / Kabupaten / Propinsi Tujuan *</label>
                <input
                  type="text"
                  placeholder="Kota / Kabupaten / Propinsi Tujuan"
                  value={mutasiKeluarForm.tujuanKota}
                  onChange={e => setMutasiKeluarForm({...mutasiKeluarForm, tujuanKota: e.target.value})}
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-rose-500 outline-none"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nomor Surat Mutasi</label>
                  <input
                    type="text"
                    placeholder="Nomor Surat Mutasi"
                    value={mutasiKeluarForm.suratNomor}
                    onChange={e => setMutasiKeluarForm({...mutasiKeluarForm, suratNomor: e.target.value})}
                    className="w-full p-2.5 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tanggal Surat Mutasi</label>
                  <input
                    type="date"
                    value={mutasiKeluarForm.suratTanggal}
                    onChange={e => setMutasiKeluarForm({...mutasiKeluarForm, suratTanggal: e.target.value})}
                    className="w-full p-2.5 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                 <button type="button" onClick={() => setIsMutasiKeluarModalOpen(false)} className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 text-sm">Batal</button>
                 <button type="submit" className="px-5 py-2 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 shadow-md text-sm">Proses Mutasi Keluar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default StudentList;