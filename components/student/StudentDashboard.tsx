
import React, { useMemo, useState } from 'react';
import CustomModal from '../CustomModal';
import { useNavigate } from 'react-router-dom';
import { Student, SchoolProfileData, TeacherProfileData, ViewState } from '../../types';
import { BarChart2, Calendar, Users, Briefcase, GraduationCap, Heart, Sparkles, DollarSign, Trophy, AlertTriangle, Bell, Activity, Printer } from 'lucide-react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  Bar, XAxis, YAxis, CartesianGrid, BarChart as RechartsBarChart
} from 'recharts';

interface StudentDashboardProps {
    students: Student[];
    allAttendanceRecords: any[];
    schoolProfile?: SchoolProfileData;
    teacherProfile?: TeacherProfileData;
    hasNewMessages?: boolean;
    unreadMessageCount?: number;
}

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#64748b'];
const POSITIVE_COLOR = '#10b981'; // green
const NEGATIVE_COLOR = '#ef4444'; // red

const StudentDashboard: React.FC<StudentDashboardProps> = ({ students, allAttendanceRecords, schoolProfile, teacherProfile, hasNewMessages = false, unreadMessageCount = 0 }) => {
    const navigate = useNavigate();
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        type: 'alert' | 'confirm' | 'success' | 'error';
        title?: string;
        message: string;
    }>({
        isOpen: false,
        type: 'alert',
        title: '',
        message: ''
    });

    const handlePrintCard = (cardName: string) => {
        const classId = students[0]?.classId || "-";
        
        let docTitle = "";
        let contentHtml = "";
        let orientation: 'portrait' | 'landscape' = 'portrait';

        if (cardName === 'bulan-lahir') {
            docTitle = "DAFTAR UMUR SISWA MENURUT BULAN LAHIR";
            orientation = 'landscape';
            contentHtml = `
                <table style="width: 100%; border-collapse: collapse; font-size: 8pt; text-align: center; margin-top: 10px;">
                    <thead>
                        <tr style="background-color: #f2f2f2;">
                            <th style="border: 1px solid #000; padding: 4px; font-weight: bold; width: 100px;">Bulan Lahir</th>
                            ${Array.from({length: 13}, (_,i) => i+6).map(age => `<th style="border: 1px solid #000; padding: 4px; font-weight: bold; width: 35px;">${age} Th</th>`).join('')}
                            <th style="border: 1px solid #000; padding: 4px; font-weight: bold; width: 50px; background-color: #e5e5e5;">Jumlah</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${ageByMonthData.map((monthData, monthIndex) => {
                            const monthName = new Date(0, monthIndex).toLocaleString('id-ID', {month: 'long'});
                            return `
                                <tr>
                                    <td style="border: 1px solid #000; padding: 4px; font-weight: bold; text-align: left;">${monthName}</td>
                                    ${Array.from({length: 13}, (_,i) => i).map(ageIndex => {
                                        const l = monthData.L[ageIndex];
                                        const p = monthData.P[ageIndex];
                                        const parts = [];
                                        if (l > 0) parts.push(`L:${l}`);
                                        if (p > 0) parts.push(`P:${p}`);
                                        return `<td style="border: 1px solid #000; padding: 4px;">${parts.join(' ') || '-'}</td>`;
                                    }).join('')}
                                    <td style="border: 1px solid #000; padding: 4px; font-weight: bold; background-color: #f9f9f9;">${monthData.total}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            `;
        } else if (cardName === 'tahun-lahir') {
            docTitle = "DAFTAR JUMLAH SISWA MENURUT TAHUN LAHIR";
            orientation = 'portrait';
            contentHtml = `
                <table style="width: 100%; border-collapse: collapse; font-size: 10pt; text-align: center; margin-top: 10px;">
                    <thead>
                        <tr style="background-color: #f2f2f2;">
                            <th style="border: 1px solid #000; padding: 8px; font-weight: bold; width: 60px;">No</th>
                            <th style="border: 1px solid #000; padding: 8px; font-weight: bold;">Tahun Kelahiran</th>
                            <th style="border: 1px solid #000; padding: 8px; font-weight: bold;">Estimasi Umur</th>
                            <th style="border: 1px solid #000; padding: 8px; font-weight: bold; width: 100px;">Laki-Laki (L)</th>
                            <th style="border: 1px solid #000; padding: 8px; font-weight: bold; width: 100px;">Perempuan (P)</th>
                            <th style="border: 1px solid #000; padding: 8px; font-weight: bold; width: 120px; background-color: #e5e5e5;">Jumlah</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${countByYearData.map(([year, data], index) => `
                            <tr>
                                <td style="border: 1px solid #000; padding: 8px;">${index + 1}</td>
                                <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">${year}</td>
                                <td style="border: 1px solid #000; padding: 8px;">${data.age} Th</td>
                                <td style="border: 1px solid #000; padding: 8px;">${data.L}</td>
                                <td style="border: 1px solid #000; padding: 8px;">${data.P}</td>
                                <td style="border: 1px solid #000; padding: 8px; font-weight: bold; background-color: #f9f9f9;">${data.total}</td>
                            </tr>
                        `).join('')}
                        <tr style="background-color: #f2f2f2; font-weight: bold;">
                            <td colspan="3" style="border: 1px solid #000; padding: 8px; text-align: right;">TOTAL:</td>
                            <td style="border: 1px solid #000; padding: 8px;">${countByYearData.reduce((acc, [, d]) => acc + d.L, 0)}</td>
                            <td style="border: 1px solid #000; padding: 8px;">${countByYearData.reduce((acc, [, d]) => acc + d.P, 0)}</td>
                            <td style="border: 1px solid #000; padding: 8px; background-color: #e5e5e5;">${countByYearData.reduce((acc, [, d]) => acc + d.total, 0)}</td>
                        </tr>
                    </tbody>
                </table>
            `;
        } else if (cardName === 'kesehatan') {
            docTitle = "TABEL DATA KESEHATAN SISWA";
            orientation = 'portrait';
            contentHtml = `
                <table style="width: 100%; border-collapse: collapse; font-size: 9pt; text-align: left; margin-top: 10px;">
                    <thead>
                        <tr style="background-color: #f2f2f2; text-align: center;">
                            <th style="border: 1px solid #000; padding: 6px; font-weight: bold; width: 40px;">No</th>
                            <th style="border: 1px solid #000; padding: 6px; font-weight: bold; width: 80px;">NIS</th>
                            <th style="border: 1px solid #000; padding: 6px; font-weight: bold;">Nama Lengkap</th>
                            <th style="border: 1px solid #000; padding: 6px; font-weight: bold; width: 50px;">L/P</th>
                            <th style="border: 1px solid #000; padding: 6px; font-weight: bold; width: 100px;">Tinggi (cm)</th>
                            <th style="border: 1px solid #000; padding: 6px; font-weight: bold; width: 100px;">Berat (kg)</th>
                            <th style="border: 1px solid #000; padding: 6px; font-weight: bold; width: 80px;">Gol. Darah</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${students.map((student, index) => `
                            <tr>
                                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${index + 1}</td>
                                <td style="border: 1px solid #000; padding: 6px; font-family: monospace; text-align: center;">${student.nis}</td>
                                <td style="border: 1px solid #000; padding: 6px; font-weight: bold; text-transform: uppercase;">${student.name}</td>
                                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${student.gender}</td>
                                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${student.height || '-'}</td>
                                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${student.weight || '-'}</td>
                                <td style="border: 1px solid #000; padding: 6px; text-align: center; font-weight: bold;">${student.bloodType || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } else if (cardName === 'minat-bakat') {
            docTitle = "PETA MINAT & BAKAT SISWA";
            orientation = 'landscape';
            contentHtml = `
                <div style="display: flex; gap: 20px; margin-bottom: 25px; margin-top: 10px;">
                    <div style="flex: 1;">
                        <h4 style="font-size: 11pt; font-weight: bold; text-align: center; margin-bottom: 8px;">Top 5 Hobi Siswa</h4>
                        <table style="width: 100%; border-collapse: collapse; font-size: 10pt;">
                            <thead>
                                <tr style="background-color: #f2f2f2;">
                                    <th style="border: 1px solid #000; padding: 6px; text-align: center; width: 40px;">No</th>
                                    <th style="border: 1px solid #000; padding: 6px; text-align: left;">Hobi</th>
                                    <th style="border: 1px solid #000; padding: 6px; text-align: center; width: 100px;">Jumlah</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${talentsData.topHobbies.map(([name, count], i) => `
                                    <tr>
                                        <td style="border: 1px solid #000; padding: 6px; text-align: center;">${i + 1}</td>
                                        <td style="border: 1px solid #000; padding: 6px; text-transform: capitalize; font-weight: bold;">${name}</td>
                                        <td style="border: 1px solid #000; padding: 6px; text-align: center;">${count} siswa</td>
                                    </tr>
                                `).join('')}
                                ${talentsData.topHobbies.length === 0 ? `<tr><td colspan="3" style="border: 1px solid #000; padding: 6px; text-align: center; color: #777;">Belum ada data</td></tr>` : ''}
                            </tbody>
                        </table>
                    </div>
                    <div style="flex: 1;">
                        <h4 style="font-size: 11pt; font-weight: bold; text-align: center; margin-bottom: 8px;">Top 5 Cita-cita Siswa</h4>
                        <table style="width: 100%; border-collapse: collapse; font-size: 10pt;">
                            <thead>
                                <tr style="background-color: #f2f2f2;">
                                    <th style="border: 1px solid #000; padding: 6px; text-align: center; width: 40px;">No</th>
                                    <th style="border: 1px solid #000; padding: 6px; text-align: left;">Cita-cita</th>
                                    <th style="border: 1px solid #000; padding: 6px; text-align: center; width: 100px;">Jumlah</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${talentsData.topAmbitions.map(([name, count], i) => `
                                    <tr>
                                        <td style="border: 1px solid #000; padding: 6px; text-align: center;">${i + 1}</td>
                                        <td style="border: 1px solid #000; padding: 6px; text-transform: capitalize; font-weight: bold;">${name}</td>
                                        <td style="border: 1px solid #000; padding: 6px; text-align: center;">${count} siswa</td>
                                    </tr>
                                `).join('')}
                                ${talentsData.topAmbitions.length === 0 ? `<tr><td colspan="3" style="border: 1px solid #000; padding: 6px; text-align: center; color: #777;">Belum ada data</td></tr>` : ''}
                            </tbody>
                        </table>
                    </div>
                </div>

                <h4 style="font-size: 11pt; font-weight: bold; text-align: left; margin: 20px 0 8px 0; border-bottom: 1px solid #000; padding-bottom: 4px;">Daftar Detail Minat & Bakat Per Siswa</h4>
                <table style="width: 100%; border-collapse: collapse; font-size: 9pt;">
                    <thead>
                        <tr style="background-color: #f2f2f2;">
                            <th style="border: 1px solid #000; padding: 5px; text-align: center; width: 40px;">No</th>
                            <th style="border: 1px solid #000; padding: 5px; text-align: center; width: 80px;">NIS</th>
                            <th style="border: 1px solid #000; padding: 5px; text-align: left;">Nama Lengkap</th>
                            <th style="border: 1px solid #000; padding: 5px; text-align: center; width: 50px;">L/P</th>
                            <th style="border: 1px solid #000; padding: 5px; text-align: left;">Hobi</th>
                            <th style="border: 1px solid #000; padding: 5px; text-align: left;">Cita-Cita</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${students.map((student, index) => `
                            <tr>
                                <td style="border: 1px solid #000; padding: 5px; text-align: center;">${index + 1}</td>
                                <td style="border: 1px solid #000; padding: 5px; text-align: center; font-family: monospace;">${student.nis}</td>
                                <td style="border: 1px solid #000; padding: 5px; font-weight: bold; text-transform: uppercase;">${student.name}</td>
                                <td style="border: 1px solid #000; padding: 5px; text-align: center;">${student.gender}</td>
                                <td style="border: 1px solid #000; padding: 5px; text-transform: capitalize;">${student.hobbies || '-'}</td>
                                <td style="border: 1px solid #000; padding: 5px; text-transform: capitalize;">${student.ambition || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } else if (cardName === 'prestasi-pelanggaran') {
            docTitle = "CATATAN PRESTASI & PELANGGARAN SISWA";
            orientation = 'portrait';
            contentHtml = `
                <table style="width: 100%; border-collapse: collapse; font-size: 9pt; text-align: left; margin-bottom: 25px; margin-top: 10px;">
                    <thead>
                        <tr style="background-color: #f2f2f2; text-align: center;">
                            <th style="border: 1px solid #000; padding: 6px; font-weight: bold; width: 40px;">No</th>
                            <th style="border: 1px solid #000; padding: 6px; font-weight: bold; width: 80px;">NIS</th>
                            <th style="border: 1px solid #000; padding: 6px; font-weight: bold;">Nama Lengkap</th>
                            <th style="border: 1px solid #000; padding: 6px; font-weight: bold; width: 50px;">L/P</th>
                            <th style="border: 1px solid #000; padding: 6px; font-weight: bold; width: 100px;">Jml Prestasi</th>
                            <th style="border: 1px solid #000; padding: 6px; font-weight: bold; width: 110px;">Jml Pelanggaran</th>
                            <th style="border: 1px solid #000; padding: 6px; font-weight: bold; width: 80px;">Skor Sikap</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${students.map((student, index) => {
                            const achCount = student.achievements?.length || 0;
                            const vioCount = student.violations?.length || 0;
                            return `
                                <tr>
                                    <td style="border: 1px solid #000; padding: 6px; text-align: center;">${index + 1}</td>
                                    <td style="border: 1px solid #000; padding: 6px; font-family: monospace; text-align: center;">${student.nis}</td>
                                    <td style="border: 1px solid #000; padding: 6px; font-weight: bold; text-transform: uppercase;">${student.name}</td>
                                    <td style="border: 1px solid #000; padding: 6px; text-align: center;">${student.gender}</td>
                                    <td style="border: 1px solid #000; padding: 6px; text-align: center; font-weight: bold; color: ${achCount > 0 ? '#10b981' : '#000'}">${achCount}</td>
                                    <td style="border: 1px solid #000; padding: 6px; text-align: center; font-weight: bold; color: ${vioCount > 0 ? '#ef4444' : '#000'}">${vioCount}</td>
                                    <td style="border: 1px solid #000; padding: 6px; text-align: center; font-weight: bold; font-family: monospace;">${student.behaviorScore || 100}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>

                <h4 style="font-size: 11pt; font-weight: bold; text-align: left; margin: 20px 0 8px 0; border-bottom: 1px solid #000; padding-bottom: 4px;">Detail Catatan Khusus Siswa</h4>
                <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt;">
                    <thead>
                        <tr style="background-color: #f2f2f2;">
                            <th style="border: 1px solid #000; padding: 5px; text-align: center; width: 40px;">No</th>
                            <th style="border: 1px solid #000; padding: 5px; text-align: left; width: 180px;">Nama Siswa</th>
                            <th style="border: 1px solid #000; padding: 5px; text-align: left;">Daftar Prestasi</th>
                            <th style="border: 1px solid #000; padding: 5px; text-align: left;">Daftar Pelanggaran</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${students.filter(s => (s.achievements && s.achievements.length > 0) || (s.violations && s.violations.length > 0)).map((student, idx) => `
                            <tr>
                                <td style="border: 1px solid #000; padding: 5px; text-align: center;">${idx + 1}</td>
                                <td style="border: 1px solid #000; padding: 5px; font-weight: bold; text-transform: uppercase;">${student.name}</td>
                                <td style="border: 1px solid #000; padding: 5px; color: #10b981; font-weight: 500;">
                                    ${student.achievements && student.achievements.length > 0 
                                        ? `<ul>${student.achievements.map(a => `<li>${a}</li>`).join('')}</ul>` 
                                        : '-'
                                    }
                                </td>
                                <td style="border: 1px solid #000; padding: 5px; color: #ef4444; font-weight: 500;">
                                    ${student.violations && student.violations.length > 0 
                                        ? `<ul>${student.violations.map(v => `<li>${v}</li>`).join('')}</ul>` 
                                        : '-'
                                    }
                                </td>
                            </tr>
                        `).join('')}
                        ${students.filter(s => (s.achievements && s.achievements.length > 0) || (s.violations && s.violations.length > 0)).length === 0 
                            ? `<tr><td colspan="4" style="border: 1px solid #000; padding: 15px; text-align: center; color: #777; font-style: italic;">Tidak ada catatan prestasi maupun pelanggaran untuk siswa kelas ini.</td></tr>` 
                            : ''
                        }
                    </tbody>
                </table>
            `;
        }

        const printWindow = window.open('', '_blank', 'width=1200,height=800');
        if (!printWindow) {
            setModalConfig({
                isOpen: true,
                type: 'alert',
                title: 'Pop-Up Diblokir',
                message: 'Gagal membuka jendela cetak. Pastikan pop-up tidak diblokir oleh peramban Anda.'
            });
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
                    <title>${docTitle} KELAS ${classId}</title>
                    <style>
                        @page {
                            size: A4 ${orientation};
                            margin: 12mm 10mm 12mm 10mm;
                        }
                        body {
                            font-family: Arial, Helvetica, sans-serif !important;
                            color: #000;
                            background: #fff;
                            margin: 0;
                            padding: 0;
                            font-size: 9.5pt;
                            line-height: 1.3;
                        }
                        .kop-surat {
                            display: flex;
                            align-items: center;
                            justify-content: space-between;
                            border-bottom: 4px double #000;
                            padding-bottom: 8px;
                            margin-bottom: 20px;
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
                            margin-bottom: 20px;
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
                        .signature-section {
                            margin-top: 35px;
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
                            height: 65px;
                            position: relative;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        }
                        .signature-img {
                            height: 60px;
                            object-fit: contain;
                            position: absolute;
                        }
                        ul {
                            margin: 0;
                            padding-left: 15px;
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
                                ${schoolProfile?.address ? `Alamat: ${schoolProfile.address}` : ''}
                                ${schoolProfile?.address && schoolProfile?.postalCode ? ' • ' : ''}
                                ${schoolProfile?.postalCode ? `Kode Pos: ${schoolProfile.postalCode}` : ''}
                            </p>
                        </div>
                        <div class="kop-logo">${logoKananHtml}</div>
                    </div>

                    <div class="doc-title-block">
                        <h2>${docTitle} KELAS ${classId}</h2>
                        <p>TAHUN AJARAN ${schoolProfile?.year || "2024/2025"} - SEMESTER ${schoolProfile?.semester || "1"}</p>
                    </div>

                    <div class="main-content">
                        ${contentHtml}
                    </div>

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
                            <p style="font-weight: bold;">Guru Kelas ${classId}</p>
                            <div class="signature-space">
                                ${teacherProfile?.signature ? `<img src="${teacherProfile.signature}" class="signature-img" />` : ''}
                            </div>
                            <p style="text-decoration: underline; font-weight: bold; margin: 0;">${teacherProfile?.name || "[Nama Guru]"}</p>
                            <p style="margin: 2px 0 0 0; font-size: 8.5pt;">NIP. ${teacherProfile?.nip || "[NIP Guru]"}</p>
                        </div>
                    </div>
                </body>
            </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };

    const currentSemesterInfo = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const isSemester1 = currentMonth >= 6;
        const startMonth = isSemester1 ? 6 : 0;
        const endMonth = isSemester1 ? 11 : 5;
        return {
            isSemester1,
            startMonth,
            endMonth,
            currentMonth,
            currentYear,
            semesterName: isSemester1 ? 'Ganjil' : 'Genap',
            startMonthName: new Date(currentYear, startMonth).toLocaleString('id-ID', { month: 'long' }),
            endMonthName: new Date(currentYear, endMonth).toLocaleString('id-ID', { month: 'long' }),
            currentMonthName: new Date(currentYear, currentMonth).toLocaleString('id-ID', { month: 'long' })
        };
    }, []);

    const studentAttendanceRecap = useMemo(() => {
        const { startMonth, endMonth, currentYear } = currentSemesterInfo;
        
        return students.map(student => {
            const accumulatedRecords = allAttendanceRecords.filter((r: any) => {
                if (!r.date) return false;
                const parts = r.date.split('-');
                if (parts.length !== 3) return false;
                const y = parseInt(parts[0]);
                const m = parseInt(parts[1]) - 1;
                
                return String(r.studentId) === String(student.id) && 
                       y === currentYear &&
                       m >= startMonth &&
                       m <= endMonth;
            });

            const counts = { S: 0, I: 0, A: 0, D: 0, H: 0 };
            accumulatedRecords.forEach((r: any) => {
                if (r.status === 'sick') counts.S++;
                else if (r.status === 'permit') counts.I++;
                else if (r.status === 'alpha') counts.A++;
                else if (r.status === 'dispensation') counts.D++;
                else if (r.status === 'present') counts.H++;
            });

            return {
                id: student.id,
                name: student.name,
                ...counts,
                totalHadir: counts.H + counts.D
            };
        });
    }, [students, allAttendanceRecords, currentSemesterInfo]);

    const calculateAge = (birthDate: string): number => {
        if (!birthDate) return 0;
        try {
            const today = new Date();
            const birth = new Date(birthDate);
            let age = today.getFullYear() - birth.getFullYear();
            const monthDiff = today.getMonth() - birth.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
                age--;
            }
            return age;
        } catch (e) {
            return 0;
        }
    };
    
    const ageByMonthData = useMemo(() => {
        const months = Array.from({ length: 12 }, () => ({
            L: Array(13).fill(0), // Ages 6-18
            P: Array(13).fill(0),
            total: 0
        }));

        students.forEach(student => {
            if (student.birthDate) {
                const birthMonth = new Date(student.birthDate).getMonth();
                const age = calculateAge(student.birthDate);
                if (age >= 6 && age <= 18) {
                    const ageIndex = age - 6;
                    if (student.gender === 'L') {
                        months[birthMonth].L[ageIndex]++;
                    } else {
                        months[birthMonth].P[ageIndex]++;
                    }
                    months[birthMonth].total++;
                }
            }
        });
        return months;
    }, [students]);

    const countByYearData = useMemo(() => {
        const yearMap: Record<string, { L: number; P: number; total: number; age: number }> = {};
        students.forEach(s => {
            if (s.birthDate) {
                const year = new Date(s.birthDate).getFullYear();
                const age = calculateAge(s.birthDate);
                if (!yearMap[year]) {
                    yearMap[year] = { L: 0, P: 0, total: 0, age: age };
                }
                if (s.gender === 'L') yearMap[year].L++;
                else yearMap[year].P++;
                yearMap[year].total++;
            }
        });
        return Object.entries(yearMap).sort((a,b) => Number(b[0]) - Number(a[0]));
    }, [students]);

    const parentOccupationData = useMemo(() => {
        const jobs = students.flatMap(s => [s.fatherJob, s.motherJob]);
        
        const validJobs = jobs.filter((j): j is string => !!j && j.trim() !== '');
        
        const counts: Record<string, number> = {};
        validJobs.forEach(job => {
            const normalized = job.trim().toLowerCase();
            counts[normalized] = (counts[normalized] || 0) + 1;
        });
        
        const sorted = Object.entries(counts).sort(([, a], [, b]) => b - a);
        const top5 = sorted.slice(0, 6);
        const others = sorted.slice(6).reduce((acc, [, count]) => acc + count, 0);

        const chartData = top5.map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
        if (others > 0) chartData.push({ name: 'Lainnya', value: others });
        
        return chartData;
    }, [students]);

    const parentEducationData = useMemo(() => {
        const educations = students.flatMap(s => [s.fatherEducation, s.motherEducation]);
        
        const validEducations = educations.filter((e): e is string => !!e && e.trim() !== '');

        const counts: Record<string, number> = {};
        validEducations.forEach(edu => {
            const normalized = edu.trim().toUpperCase();
            counts[normalized] = (counts[normalized] || 0) + 1;
        });
        return Object.entries(counts).sort(([, a], [, b]) => b - a).map(([name, value])=>({name, value}));
    }, [students]);

    // NEW: Talents Data
    const talentsData = useMemo(() => {
        const hobbies: Record<string, number> = {};
        const ambitions: Record<string, number> = {};
        students.forEach(s => {
            if (s.hobbies) {
                const hobby = s.hobbies.trim().charAt(0).toUpperCase() + s.hobbies.trim().slice(1).toLowerCase();
                hobbies[hobby] = (hobbies[hobby] || 0) + 1;
            }
            if (s.ambition) {
                const ambition = s.ambition.trim().charAt(0).toUpperCase() + s.ambition.trim().slice(1).toLowerCase();
                ambitions[ambition] = (ambitions[ambition] || 0) + 1;
            }
        });
        const topHobbies = Object.entries(hobbies).sort((a,b) => b[1] - a[1]).slice(0, 5);
        const topAmbitions = Object.entries(ambitions).sort((a,b) => b[1] - a[1]).slice(0, 5);
        return { topHobbies, topAmbitions };
    }, [students]);

    // NEW: Economy Data
    const economyData = useMemo(() => {
        const statuses: Record<string, number> = { 'Mampu': 0, 'Cukup': 0, 'Kurang Mampu': 0, 'KIP': 0 };
        students.forEach(s => {
            const status = s.economyStatus || 'Mampu';
            if (statuses[status] !== undefined) {
                statuses[status]++;
            }
        });
        return Object.entries(statuses).map(([name, value]) => ({ name, value }));
    }, [students]);

    // NEW: Records Data
    const recordsData = useMemo(() => {
        let totalAchievements = 0;
        let totalViolations = 0;
        students.forEach(s => {
            totalAchievements += s.achievements?.length || 0;
            totalViolations += s.violations?.length || 0;
        });
        return [
            { name: 'Prestasi', total: totalAchievements },
            { name: 'Pelanggaran', total: totalViolations }
        ];
    }, [students]);

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Dashboard Siswa</h2>
                <button 
                    onClick={() => navigate('/buku-penghubung')}
                    className={`relative bg-white p-2.5 rounded-xl shadow-sm border border-gray-100 transition-all ${
                        hasNewMessages 
                        ? 'text-indigo-600 border-indigo-200 bg-indigo-50 animate-vibrate' 
                        : 'text-gray-500 hover:bg-gray-50 hover:text-indigo-600'
                    }`}
                    title="Buku Penghubung"
                >
                    <Bell size={24} />
                    {hasNewMessages && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-bounce border-2 border-white">
                            {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                        </div>
                    )}
                </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 no-print-report">
                <div className="bg-white p-4 rounded-lg shadow-sm border col-span-1 lg:col-span-2">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-2 mb-3">
                        <h3 className="font-bold text-gray-700 flex items-center"><Calendar size={16} className="mr-2 text-indigo-500" /> Daftar Umur Siswa Menurut Bulan Lahir</h3>
                        <button 
                            onClick={() => handlePrintCard('bulan-lahir')}
                            className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold border shadow-sm"
                            title="Cetak Laporan"
                        >
                            <Printer size={14} />
                            <span>Cetak</span>
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-center border-collapse">
                            <thead className="bg-gray-50 font-semibold">
                                <tr>
                                    <th className="border p-1 w-24">Bulan Lahir</th>
                                    {Array.from({length: 13}, (_,i) => i+6).map(age => <th key={age} className="border p-1 w-12">{age}</th>)}
                                    <th className="border p-1 w-16 bg-gray-100">Jumlah</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ageByMonthData.map((monthData, monthIndex) => (
                                    <tr key={monthIndex}>
                                        <td className="border p-1 font-semibold">{new Date(0, monthIndex).toLocaleString('id-ID', {month: 'long'})}</td>
                                        {Array.from({length: 13}, (_,i) => i).map(ageIndex => (
                                            <td key={ageIndex} className="border p-1">
                                                {monthData.L[ageIndex] > 0 && <span className="text-blue-600">L:{monthData.L[ageIndex]}</span>}
                                                {monthData.P[ageIndex] > 0 && <span className="text-pink-600 ml-1">P:{monthData.P[ageIndex]}</span>}
                                            </td>
                                        ))}
                                        <td className="border p-1 font-bold bg-gray-50">{monthData.total}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-2 mb-3">
                        <h3 className="font-bold text-gray-700 flex items-center"><Users size={16} className="mr-2 text-indigo-500" /> Daftar Jumlah Siswa Menurut Tahun Lahir</h3>
                        <button 
                            onClick={() => handlePrintCard('tahun-lahir')}
                            className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold border shadow-sm"
                            title="Cetak Laporan"
                        >
                            <Printer size={14} />
                            <span>Cetak</span>
                        </button>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                        <table className="w-full text-xs text-center border-collapse">
                            <thead className="bg-gray-50 font-semibold sticky top-0">
                                <tr>
                                    <th className="border p-2">Tahun Kelahiran</th>
                                    <th className="border p-2">Umur</th>
                                    <th className="border p-2">L</th>
                                    <th className="border p-2">P</th>
                                    <th className="border p-2">Jumlah</th>
                                </tr>
                            </thead>
                            <tbody>
                                {countByYearData.map(([year, data]) => (
                                    <tr key={year}>
                                        <td className="border p-2">{year}</td>
                                        <td className="border p-2">{data.age} Th</td>
                                        <td className="border p-2">{data.L}</td>
                                        <td className="border p-2">{data.P}</td>
                                        <td className="border p-2 font-bold">{data.total}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <h3 className="font-bold text-gray-700 flex items-center mb-2"><Briefcase size={16} className="mr-2 text-indigo-500" /> Data Pekerjaan Orang Tua</h3>
                    <div style={{width: '100%', height: 280}}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie 
                                    data={parentOccupationData} 
                                    dataKey="value" 
                                    nameKey="name" 
                                    cx="50%" 
                                    cy="45%" 
                                    outerRadius={65} 
                                    label={({ name, value, percent }) => percent > 0.05 ? `${name} (${value})` : ''}
                                >
                                    {parentOccupationData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip formatter={(value) => [value, 'Jumlah']} />
                                <Legend iconSize={10} layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '10px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border col-span-1 lg:col-span-2">
                    <h3 className="font-bold text-gray-700 flex items-center mb-2"><GraduationCap size={16} className="mr-2 text-indigo-500" /> Data Pendidikan Orang Tua</h3>
                    <div style={{width: '100%', height: 250}}>
                        <ResponsiveContainer>
                            <RechartsBarChart data={parentEducationData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip formatter={(value) => [value, 'Jumlah']} />
                                <Bar dataKey="value" fill="#8884d8" />
                            </RechartsBarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* NEW DASHBOARDS SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 no-print-report">
                {/* Attendance Recap Dashboard */}
                <div className="bg-white p-4 rounded-lg shadow-sm border col-span-1 lg:col-span-2">
                    <h3 className="font-bold text-gray-700 flex items-center mb-2">
                        <Activity size={16} className="mr-2 text-blue-500" /> 
                        Rekap Absensi Semester {currentSemesterInfo.semesterName} ({currentSemesterInfo.startMonthName} - {currentSemesterInfo.endMonthName} {currentSemesterInfo.currentYear})
                    </h3>
                    <div className="max-h-[300px] overflow-y-auto">
                        <table className="w-full text-xs text-left border-collapse">
                            <thead className="bg-gray-50 font-semibold sticky top-0">
                                <tr>
                                    <th className="border p-2 w-8">No</th>
                                    <th className="border p-2">Nama Siswa</th>
                                    <th className="border p-2 text-center bg-emerald-50 text-emerald-700">Hadir</th>
                                    <th className="border p-2 text-center bg-amber-50 text-amber-700">Sakit</th>
                                    <th className="border p-2 text-center bg-blue-50 text-blue-700">Izin</th>
                                    <th className="border p-2 text-center bg-red-50 text-red-700">Alpha</th>
                                    <th className="border p-2 text-center bg-purple-50 text-purple-700">Dispen</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {studentAttendanceRecap.map((recap, index) => (
                                    <tr key={recap.id} className="hover:bg-gray-50">
                                        <td className="border p-2 text-center">{index + 1}</td>
                                        <td className="border p-2 font-medium">{recap.name}</td>
                                        <td className="border p-2 text-center font-bold text-emerald-600">{recap.totalHadir}</td>
                                        <td className="border p-2 text-center font-bold text-amber-600">{recap.S}</td>
                                        <td className="border p-2 text-center font-bold text-blue-600">{recap.I}</td>
                                        <td className="border p-2 text-center font-bold text-red-600">{recap.A}</td>
                                        <td className="border p-2 text-center font-bold text-purple-600">{recap.D}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Health Dashboard */}
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-2 mb-3">
                        <h3 className="font-bold text-gray-700 flex items-center"><Heart size={16} className="mr-2 text-red-500" /> Tabel Data Kesehatan</h3>
                        <button 
                            onClick={() => handlePrintCard('kesehatan')}
                            className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold border shadow-sm"
                            title="Cetak Laporan"
                        >
                            <Printer size={14} />
                            <span>Cetak</span>
                        </button>
                    </div>
                    <div className="max-h-[250px] overflow-y-auto">
                        <table className="w-full text-xs text-left border-collapse">
                            <thead className="bg-gray-50 font-semibold sticky top-0">
                                <tr>
                                    <th className="border p-2 w-8">No</th>
                                    <th className="border p-2">Nama Siswa</th>
                                    <th className="border p-2 text-center">Tinggi (cm)</th>
                                    <th className="border p-2 text-center">Berat (kg)</th>
                                    <th className="border p-2 text-center">Gol. Darah</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {students.map((student, index) => (
                                    <tr key={student.id} className="hover:bg-gray-50">
                                        <td className="border p-2 text-center">{index + 1}</td>
                                        <td className="border p-2 font-medium">{student.name}</td>
                                        <td className="border p-2 text-center">{student.height || '-'}</td>
                                        <td className="border p-2 text-center">{student.weight || '-'}</td>
                                        <td className="border p-2 text-center">{student.bloodType || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Talents Dashboard */}
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-2 mb-3">
                        <h3 className="font-bold text-gray-700 flex items-center"><Sparkles size={16} className="mr-2 text-yellow-500" /> Peta Minat & Bakat</h3>
                        <button 
                            onClick={() => handlePrintCard('minat-bakat')}
                            className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold border shadow-sm"
                            title="Cetak Laporan"
                        >
                            <Printer size={14} />
                            <span>Cetak</span>
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <h4 className="font-semibold text-sm mb-2 text-center">Top 5 Hobi</h4>
                            <table className="w-full text-xs">
                                <tbody>
                                {talentsData.topHobbies.map(([name, count], i) => (
                                    <tr key={i} className="border-b"><td className="p-1 capitalize">{name}</td><td className="p-1 text-right font-bold">{count} siswa</td></tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                        <div>
                            <h4 className="font-semibold text-sm mb-2 text-center">Top 5 Cita-cita</h4>
                             <table className="w-full text-xs">
                                <tbody>
                                {talentsData.topAmbitions.map(([name, count], i) => (
                                    <tr key={i} className="border-b"><td className="p-1 capitalize">{name}</td><td className="p-1 text-right font-bold">{count} siswa</td></tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                
                {/* Economy Dashboard */}
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <h3 className="font-bold text-gray-700 flex items-center mb-2"><DollarSign size={16} className="mr-2 text-green-500" /> Diagram Sosial Ekonomi</h3>
                    <div style={{width: '100%', height: 250}}>
                        <ResponsiveContainer>
                            <RechartsBarChart data={economyData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis allowDecimals={false}/>
                                <Tooltip formatter={(value) => [value, 'Jumlah Siswa']} />
                                <Bar dataKey="value" fill="#10b981" name="Jumlah Siswa" />
                            </RechartsBarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Records Dashboard */}
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-2 mb-3">
                        <h3 className="font-bold text-gray-700 flex items-center"><BarChart2 size={16} className="mr-2 text-blue-500" /> Catatan Prestasi & Pelanggaran</h3>
                        <button 
                            onClick={() => handlePrintCard('prestasi-pelanggaran')}
                            className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold border shadow-sm"
                            title="Cetak Laporan"
                        >
                            <Printer size={14} />
                            <span>Cetak</span>
                        </button>
                    </div>
                     <div style={{width: '100%', height: 250}}>
                        <ResponsiveContainer>
                            <RechartsBarChart data={recordsData} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" />
                                <Tooltip formatter={(value) => [value, 'Total Catatan']} />
                                <Bar dataKey="total" name="Total Catatan">
                                    {recordsData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.name === 'Prestasi' ? POSITIVE_COLOR : NEGATIVE_COLOR} />
                                    ))}
                                </Bar>
                            </RechartsBarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <CustomModal
                isOpen={modalConfig.isOpen}
                type={modalConfig.type}
                title={modalConfig.title}
                message={modalConfig.message}
                onConfirm={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                onCancel={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
}

export default StudentDashboard;
