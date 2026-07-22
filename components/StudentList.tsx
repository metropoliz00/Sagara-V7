import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Student, TeacherProfileData, SchoolProfileData, Graduate } from '../types';
import * as XLSX from 'xlsx';
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
  QrCode as QrCodeIcon, Users, ArrowUpCircle, GraduationCap, ChevronDown
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
  isReadOnly?: boolean;
}

type TabType = 'biodata' | 'health' | 'talents' | 'economy' | 'records';
type ViewType = 'grid' | 'list' | 'dashboard' | 'qr-codes' | 'health-data' | 'parent-data' | 'talents-data';

const StudentList: React.FC<StudentListProps> = ({ 
  students, teacherProfile, schoolProfile, classId, allAttendanceRecords,
  onAdd, onBatchAdd, onUpdate, onDelete, onRemoveFiltered, onShowNotification, isReadOnly = false
}) => {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('biodata');
  const [viewType, setViewType] = useState<ViewType>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
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
    let title = "DAFTAR SISWA";
    let headers = "";
    let rows = "";

    if (viewType === 'health-data') {
      title = "DATA KESEHATAN";
      headers = `
        <tr>
          <th>No</th>
          <th>NIS</th>
          <th>Nama</th>
          <th>Berat (kg)</th>
          <th>Tinggi (cm)</th>
          <th>Riwayat Penyakit</th>
        </tr>
      `;
      rows = filteredStudents.map((s, index) => `
        <tr style="background-color: ${index % 2 === 0 ? '#f8f9fa' : '#ffffff'};">
          <td style="text-align: center;">${index + 1}</td>
          <td style="text-align: center;">${s.nis}</td>
          <td>${s.name.toUpperCase()}</td>
          <td style="text-align: center;">${s.weight || '-'}</td>
          <td style="text-align: center;">${s.height || '-'}</td>
          <td>${s.healthNotes || '-'}</td>
        </tr>
      `).join('');
    } else if (viewType === 'parent-data') {
      title = "DATA ORANG TUA";
      headers = `
        <tr>
          <th>No</th>
          <th>NIS</th>
          <th>Nama</th>
          <th>Nama Ayah</th>
          <th>Pendidikan Ayah</th>
          <th>Pekerjaan Ayah</th>
          <th>Nama Ibu</th>
          <th>Pendidikan Ibu</th>
          <th>Pekerjaan Ibu</th>
          <th>Alamat</th>
        </tr>
      `;
      rows = filteredStudents.map((s, index) => `
        <tr style="background-color: ${index % 2 === 0 ? '#f8f9fa' : '#ffffff'};">
          <td style="text-align: center;">${index + 1}</td>
          <td style="text-align: center;">${s.nis}</td>
          <td>${s.name.toUpperCase()}</td>
          <td>${(s.fatherName || '-').toUpperCase()}</td>
          <td>${(s.fatherEducation || '-').toUpperCase()}</td>
          <td>${(s.fatherJob || '-').toUpperCase()}</td>
          <td>${(s.motherName || '-').toUpperCase()}</td>
          <td>${(s.motherEducation || '-').toUpperCase()}</td>
          <td>${(s.motherJob || '-').toUpperCase()}</td>
          <td>${s.address}</td>
        </tr>
      `).join('');
    } else if (viewType === 'talents-data') {
      title = "DATA BAKAT MINAT";
      headers = `
        <tr>
          <th>No</th>
          <th>NIS</th>
          <th>NISN</th>
          <th>Nama</th>
          <th>Tempat Lahir</th>
          <th>Tanggal Lahir</th>
          <th>NIK</th>
          <th>Hobi</th>
          <th>Cita-cita</th>
        </tr>
      `;
      rows = filteredStudents.map((s, index) => `
        <tr style="background-color: ${index % 2 === 0 ? '#f8f9fa' : '#ffffff'};">
          <td style="text-align: center;">${index + 1}</td>
          <td style="text-align: center;">${s.nis}</td>
          <td style="text-align: center;">${s.nisn || '-'}</td>
          <td>${s.name.toUpperCase()}</td>
          <td>${s.birthPlace || '-'}</td>
          <td style="text-align: center;">${s.birthDate ? formatDateID(s.birthDate) : '-'}</td>
          <td style="text-align: center;">${s.nik || '-'}</td>
          <td>${s.hobbies || '-'}</td>
          <td>${s.ambition || '-'}</td>
        </tr>
      `).join('');
    } else {
      // Default list view
      headers = `
        <tr>
          <th>No</th>
          <th>Nama</th>
          <th>NIS</th>
          <th>NISN</th>
          <th>L/P</th>
          <th>Tempat Lahir</th>
          <th>Tanggal Lahir</th>
          <th>NIK</th>
          <th>Agama</th>
          <th>Nama Ayah</th>
          <th>Nama Ibu</th>
          <th>Alamat</th>
        </tr>
      `;
      rows = filteredStudents.map((s, index) => `
        <tr style="background-color: ${index % 2 === 0 ? '#f8f9fa' : '#ffffff'};">
          <td style="text-align: center;">${index + 1}</td>
          <td>${s.name.toUpperCase()}</td>
          <td>${s.nis}</td>
          <td>${s.nisn || '-'}</td>
          <td style="text-align: center;">${s.gender}</td>
          <td>${s.birthPlace || '-'}</td>
          <td>${s.birthDate ? formatDateID(s.birthDate) : '-'}</td>
          <td>${s.nik || '-'}</td>
          <td>${s.religion || '-'}</td>
          <td>${(s.fatherName || '-').toUpperCase()}</td>
          <td>${(s.motherName || '-').toUpperCase()}</td>
          <td>${s.address}</td>
        </tr>
      `).join('');
    }

    const printContent = `
      <div style="text-align: center; margin-bottom: 20px; line-height: 1;">
        <h2 style="margin: 0; text-transform: uppercase;">${title}</h2>
        <h3 style="margin: 5px 0 0 0;">KELAS: ${classId}</h3>
        <h4 style="margin: 5px 0 0 0;">TAHUN AJARAN: ${schoolProfile?.year || new Date().getFullYear()}</h4>
      </div>
      <table>
        <thead style="background-color: #e9ecef;">
          ${headers}
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
      <div style="margin-top: 30px; display: flex; justify-content: space-between; font-size: 12px; line-height: 1;">
        <div style="text-align: center;">
          <p>Mengetahui,</p>
          <p>Kepala ${schoolProfile?.name || 'Sekolah'}</p>
          <br/><br/><br/>
          <p style="text-decoration: underline; font-weight: bold;">${schoolProfile?.headmaster || '.........................'}</p>
          <p>NIP. ${schoolProfile?.headmasterNip || '.........................'}</p>
        </div>
        <div style="text-align: center;">
          <p>Remen, ${new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
          <p>Guru Kelas ${classId}</p>
          <br/><br/><br/>
          <p style="text-decoration: underline; font-weight: bold;">${teacherProfile?.name || '.........................'}</p>
          <p>NIP. ${teacherProfile?.nip || '.........................'}</p>
        </div>
      </div>
    `;

    const htmlContent = `
      <div style="font-family: 'Times New Roman', serif; line-height: 1.2; padding: 20px; font-size: 10pt; color: #000; background: #fff; width: 100%;">
        <style>
          table { width: 100%; border-collapse: collapse; font-size: 9pt; margin-bottom: 20px; table-layout: fixed; page-break-inside: avoid; break-inside: avoid; }
          th, td { border: 1px solid black; padding: 4px; text-align: left; word-wrap: break-word; }
          th { text-align: center; background-color: #f2f2f2 !important; -webkit-print-color-adjust: exact; font-weight: bold; }
          tr { page-break-inside: avoid; break-inside: avoid; }
          @page { size: A4 landscape; margin: 10mm; }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            table, tr, td, th { page-break-inside: avoid !important; break-inside: avoid !important; }
          }
        </style>
        ${printContent}
      </div>
    `;

    onShowNotification('Sedang menyiapkan dokumen PDF...', 'warning');
    
    const element = document.createElement('div');
    element.innerHTML = htmlContent;
    
    const opt = {
      margin: 10,
      filename: `${title.replace(/\s+/g, '_')}_Kelas_${classId}_${new Date().getTime()}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { 
          scale: 2, 
          useCORS: true,
          logging: false,
          letterRendering: true,
          windowWidth: 1122
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' as const },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'], avoid: ['table', 'tr', '.print-header', '.print-footer', '.signature-box'] }
    };

    html2pdf().set(opt).from(element).save().then(() => {
        onShowNotification('PDF berhasil diunduh', 'success');
    }).catch((err: any) => {
        console.error('PDF generation error:', err);
        onShowNotification('Gagal mengunduh PDF, mencoba membuka jendela cetak browser...', 'error');
        
        const newWindow = window.open("", "", "width=1200,height=800");
        if (newWindow) {
            newWindow.document.write(`
              <html>
                <head>
                  <title>${title} Kelas ${classId}</title>
                </head>
                <body>
                  ${htmlContent}
                </body>
              </html>
            `);
            newWindow.document.close();
            setTimeout(() => {
                newWindow.focus();
                newWindow.print();
                newWindow.close();
            }, 500);
        }
    });
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
      const headers = ["Class ID", "NIS", "NISN", "NIK", "Nama Lengkap", "Gender (L/P)", "Tempat Lahir", "Tanggal Lahir (YYYY-MM-DD)", "Agama", "Alamat", "Nama Ayah", "Pekerjaan Ayah", "Pendidikan Ayah", "Nama Ibu", "Pekerjaan Ibu", "Pendidikan Ibu", "Nama Wali", "No HP Wali", "Pekerjaan Wali", "Status Ekonomi", "Tinggi (cm)", "Berat (kg)", "Gol Darah", "Riwayat Penyakit", "Hobi", "Cita-cita", "Prestasi", "Pelanggaran"];
      const example = ["1A", "2024001", "0012345678", "1234567890123456", "Ahmad Santoso", "L", "Surabaya", "2015-05-20", "Islam", "Jl. Merpati No. 10", "Budi Santoso", "Wiraswasta", "SMA", "Siti Aminah", "Ibu Rumah Tangga", "SMP", "Budi Santoso", "081234567890", "Wiraswasta", "Mampu", "145", "38", "O", "Tidak ada", "Sepak Bola", "Polisi", "Juara 1 Lari", "-"];
      const worksheet = XLSX.utils.aoa_to_sheet([headers, example]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Template Input Siswa");
      XLSX.writeFile(workbook, "template_input_siswa.xlsx");
      onShowNotification("Template Excel berhasil diunduh!", "success");
    } catch (err: any) {
      console.error("Gagal mengunduh template:", err);
      onShowNotification("Gagal mengunduh template Excel.", "error");
    }
  };

  const handleExport = () => {
    try {
      const headers = ["Class ID", "NIS", "NISN", "NIK", "Nama Lengkap", "Gender (L/P)", "Tempat Lahir", "Tanggal Lahir (YYYY-MM-DD)", "Agama", "Alamat", "Nama Ayah", "Pekerjaan Ayah", "Pendidikan Ayah", "Nama Ibu", "Pekerjaan Ibu", "Pendidikan Ibu", "Nama Wali", "No HP Wali", "Pekerjaan Wali", "Status Ekonomi", "Tinggi (cm)", "Berat (kg)", "Gol Darah", "Riwayat Penyakit", "Hobi", "Cita-cita", "Prestasi", "Pelanggaran", "Kelengkapan Data (%)"];
      const rows = students.map(s => [s.classId, s.nis, s.nisn || '-', s.nik || '-', s.name, s.gender, s.birthPlace || '-', s.birthDate, s.religion || '-', s.address, s.fatherName, s.fatherJob || '-', s.fatherEducation || '-', s.motherName, s.motherJob || '-', s.motherEducation || '-', s.parentName, s.parentPhone, s.parentJob || '-', s.economyStatus || 'Mampu', s.height || 0, s.weight || 0, s.bloodType || '-', s.healthNotes || '-', s.hobbies || '-', s.ambition || '-', s.achievements?.join(', ') || '-', s.violations?.join(', ') || '-', calculateCompleteness(s) + '%']);
      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Data Siswa Lengkap");
      XLSX.writeFile(workbook, "data_siswa_lengkap.xlsx");
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

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        
        const jsonObjects = XLSX.utils.sheet_to_json<Record<string, any>>(ws);
        const rawRows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });

        const newStudentsBatch: Omit<Student, 'id'>[] = [];

        if (jsonObjects.length > 0 && typeof jsonObjects[0] === 'object' && !Array.isArray(jsonObjects[0])) {
          jsonObjects.forEach((row) => {
            const classIdInput = String(row['Class ID'] || row['Kelas'] || row['classId'] || classId || '').trim();
            const nis = String(row['NIS'] || row['nis'] || '').trim();
            const nisn = String(row['NISN'] || row['nisn'] || '').trim();
            const nik = String(row['NIK'] || row['nik'] || '').trim();
            const name = String(row['Nama Lengkap'] || row['Nama'] || row['name'] || '').trim().toUpperCase();

            if (nis && name) {
              const genderRaw = String(row['Gender (L/P)'] || row['Gender'] || row['Jenis Kelamin'] || 'L').trim().toUpperCase();
              const gender = (genderRaw.includes('P') || genderRaw.includes('PEREMPUAN') || genderRaw.includes('WANITA')) ? 'P' : 'L';

              const rawBirthDate = row['Tanggal Lahir (YYYY-MM-DD)'] || row['Tanggal Lahir'] || row['Tanggal Lahir (YYYY-MM-DD)*'];

              const newStudent: Omit<Student, 'id'> = {
                classId: classIdInput || classId,
                nis,
                nisn,
                nik,
                name,
                gender,
                birthPlace: String(row['Tempat Lahir'] || '').trim(),
                birthDate: parseExcelDate(rawBirthDate),
                religion: String(row['Agama'] || 'Islam').trim(),
                address: String(row['Alamat'] || '').trim(),
                fatherName: String(row['Nama Ayah'] || '').trim().toUpperCase(),
                fatherJob: String(row['Pekerjaan Ayah'] || '').trim(),
                fatherEducation: String(row['Pendidikan Ayah'] || '').trim(),
                motherName: String(row['Nama Ibu'] || '').trim().toUpperCase(),
                motherJob: String(row['Pekerjaan Ibu'] || '').trim(),
                motherEducation: String(row['Pendidikan Ibu'] || '').trim(),
                parentName: String(row['Nama Wali'] || row['Nama Ayah'] || row['Nama Ibu'] || '').trim().toUpperCase(),
                parentPhone: String(row['No HP Wali'] || row['No HP'] || '').trim(),
                parentJob: String(row['Pekerjaan Wali'] || '').trim(),
                economyStatus: (row['Status Ekonomi'] as any) || 'Mampu',
                height: Number(row['Tinggi (cm)'] || row['Tinggi']) || 0,
                weight: Number(row['Berat (kg)'] || row['Berat']) || 0,
                bloodType: String(row['Gol Darah'] || '').trim(),
                healthNotes: String(row['Riwayat Penyakit'] || '').trim(),
                hobbies: String(row['Hobi'] || '').trim(),
                ambition: String(row['Cita-cita'] || '').trim(),
                achievements: row['Prestasi'] ? String(row['Prestasi']).split(',').map(s=>s.trim()).filter(Boolean) : [],
                violations: row['Pelanggaran'] ? String(row['Pelanggaran']).split(',').map(s=>s.trim()).filter(Boolean) : [],
                behaviorScore: 100,
                attendance: { present: 0, sick: 0, permit: 0, alpha: 0 }
              };
              newStudentsBatch.push(newStudent);
            }
          });
        }

        if (newStudentsBatch.length === 0 && rawRows.length > 1) {
          const rows = rawRows.slice(1);
          rows.forEach((row) => {
            if (!row || row.length === 0) return;
            const classIdInput = row[0] ? String(row[0]).trim() : classId;
            const nis = row[1] ? String(row[1]).trim() : '';
            const nisn = row[2] ? String(row[2]).trim() : '';
            const nik = row[3] ? String(row[3]).trim() : '';
            const name = row[4] ? String(row[4]).trim().toUpperCase() : (row[3] && isNaN(Number(row[3])) ? String(row[3]).trim().toUpperCase() : '');

            if (nis && name) {
              const genderRaw = row[5] ? String(row[5]).toUpperCase() : 'L';
              const gender = (genderRaw.includes('P') || genderRaw.includes('PEREMPUAN')) ? 'P' : 'L';

              const newStudent: Omit<Student, 'id'> = {
                classId: classIdInput || classId,
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
                parentPhone: row[17] ? String(row[17]).trim() : '',
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
      onUpdate({ ...selectedStudent, achievements: achievementsArray, violations: violationsArray });
      onShowNotification("Data siswa berhasil disimpan!", 'success');
      setSelectedStudent(null);
    }
  };

  const handleChange = (field: keyof Student, value: any) => {
    if (isReadOnly) return;
    if(selectedStudent) {
      let updated = { ...selectedStudent, [field]: value };
      if (field === 'fatherName' || field === 'motherName') { const f = field === 'fatherName' ? value : updated.fatherName; const m = field === 'motherName' ? value : updated.motherName; updated.parentName = (f ? f : m).toUpperCase(); }
      setSelectedStudent(updated);
    }
  };

  const [tempAchievements, setTempAchievements] = useState('');
  const [tempViolations, setTempViolations] = useState('');
  const [newStudent, setNewStudent] = useState<Partial<Student>>({
     name: '', nis: '', nisn: '', nik: '', classId: classId, gender: 'L', religion: 'Islam', birthPlace: '', birthDate: '', address: '', photo: '',
     fatherName: '', fatherJob: '', fatherEducation: '', motherName: '', motherJob: '', motherEducation: '', parentName: '', parentPhone: '', parentJob: '',
     height: 0, weight: 0, bloodType: '', healthNotes: '', hobbies: '', ambition: '', economyStatus: 'Mampu', behaviorScore: 100, attendance: {present:0, sick:0, permit:0, alpha:0}, achievements: [], violations: []
  });

  const handleSubmitNew = (e: React.FormEvent) => {
    if (isReadOnly) return;
    e.preventDefault();
    if(newStudent.name && newStudent.nis) {
       const achievementsArray = tempAchievements ? tempAchievements.split(',').map(s => s.trim()) : [];
       const violationsArray = tempViolations ? tempViolations.split(',').map(s => s.trim()) : [];
       onAdd({ ...newStudent, achievements: achievementsArray, violations: violationsArray } as Omit<Student, 'id'>);
       setIsAddModalOpen(false);
       setNewStudent({ 
         name: '', nis: '', nisn: '', nik: '', classId: classId, gender: 'L', religion: 'Islam', birthPlace: '', birthDate: '', address: '', photo: '',
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
                        <input className="border p-2 rounded" placeholder="Kelas" value={newStudent.classId} onChange={e=>setNewStudent({...newStudent, classId:e.target.value})}/>
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
    </div>
  );
};
export default StudentList;