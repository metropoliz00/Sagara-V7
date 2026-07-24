import React, { useState, useMemo } from 'react';
import { Printer, X, Filter } from 'lucide-react';
import { Student, Holiday, SchoolProfileData, TeacherProfileData } from '../../types';
import usePrint from '../../hooks/usePrint';
import './AttendancePrint.css';
import { getLocalISODate } from '../../utils/dateUtils';

interface AttendancePrintProps {
  students: Student[];
  allStudents?: Student[];
  allAttendanceRecords: any[];
  holidays: Holiday[];
  schoolProfile?: SchoolProfileData;
  teacherProfile?: TeacherProfileData;
  currentClassId: string;
  type?: 'month' | 'semester';
}

export const AttendancePrint: React.FC<AttendancePrintProps> = ({
  students,
  allStudents,
  allAttendanceRecords,
  holidays,
  schoolProfile,
  teacherProfile,
  currentClassId,
  type = 'month'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Filters
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedClass, setSelectedClass] = useState(currentClassId);
  const [selectedSemester, setSelectedSemester] = useState<'ganjil' | 'genap'>('ganjil');
  
  // Handle ALL class selection by finding unique classes
  const availableClasses = useMemo(() => {
    const all = allStudents || students;
    const classSet = new Set(all.map(s => s.classId || 'Tidak Ada Kelas').filter(Boolean));
    return Array.from(classSet).sort();
  }, [allStudents, students]);

  // Derived filtered students
  const filteredStudents = useMemo(() => {
    const all = allStudents || students;
    if (selectedClass === 'ALL' || !selectedClass) return all;
    return all.filter(s => s.classId === selectedClass);
  }, [allStudents, students, selectedClass]);

  const { print } = usePrint({ orientation: 'landscape', title: 'Laporan Absensi' });

  // Get days array for selected month
  const daysInMonth = useMemo(() => {
    return new Date(selectedYear, selectedMonth, 0).getDate();
  }, [selectedMonth, selectedYear]);

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const getDateStr = (day: number) => {
    return `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const isHolidayOrSunday = (day: number) => {
    const dateStr = getDateStr(day);
    const date = new Date(dateStr + 'T00:00:00');
    const isSunday = date.getDay() === 0;
    const isHoliday = holidays.some(h => h.date === dateStr);
    return isSunday || isHoliday;
  };

  // Map attendance
  const attendanceMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (Array.isArray(allAttendanceRecords)) {
      allAttendanceRecords.forEach(record => {
        let dateStr = String(record.date).trim();
        if (dateStr.includes('T')) dateStr = dateStr.split('T')[0];
        
        const [y, m, d] = dateStr.split('-');
        if (Number(y) === selectedYear && Number(m) === selectedMonth) {
          const key = `${record.studentId}_${Number(d)}`;
          map[key] = String(record.status).toLowerCase();
        }
      });
    }
    return map;
  }, [allAttendanceRecords, selectedMonth, selectedYear]);

  const getStatus = (studentId: string, day: number) => {
    return attendanceMap[`${studentId}_${day}`];
  };

  const getStatusChar = (status: string) => {
    if (status === 'present') return 'H';
    if (status === 'sick') return 'S';
    if (status === 'permit') return 'I';
    if (status === 'alpha') return 'A';
    return '-';
  };

  const getStatusClass = (status: string) => {
    if (status === 'present') return 'status-h';
    if (status === 'sick') return 'status-s';
    if (status === 'permit') return 'status-i';
    if (status === 'alpha') return 'status-a';
    return '';
  };

  const generateAttendanceRows = () => {
    return filteredStudents.map((student, index) => {
      let H = 0, S = 0, I = 0, A = 0;
      
      const dayCells = daysArray.map(day => {
        const isOff = isHolidayOrSunday(day);
        if (isOff) {
           return <td key={day} className="bg-sunday"></td>;
        }

        const status = getStatus(student.id, day);
        if (status === 'present') H++;
        else if (status === 'sick') S++;
        else if (status === 'permit') I++;
        else if (status === 'alpha') A++;

        const char = getStatusChar(status);
        const cellClass = getStatusClass(status);
        
        return <td key={day} className={cellClass}>{char}</td>;
      });

      return (
        <tr key={student.id}>
          <td>{index + 1}</td>
          <td className="col-name">{student.name.toUpperCase()}</td>
          {dayCells}
          <td className="col-rekap">{H}</td>
          <td className="col-rekap">{S}</td>
          <td className="col-rekap">{I}</td>
          <td className="col-rekap">{A}</td>
        </tr>
      );
    });
  };

  const calculateAttendanceSummary = () => {
    let effectiveDays = 0;
    daysArray.forEach(day => {
      if (!isHolidayOrSunday(day)) effectiveDays++;
    });

    let totalS = 0, totalI = 0, totalA = 0;
    const totalStudents = filteredStudents.length;

    filteredStudents.forEach(student => {
      daysArray.forEach(day => {
        if (!isHolidayOrSunday(day)) {
           const status = getStatus(student.id, day);
           if (status === 'sick') totalS++;
           else if (status === 'permit') totalI++;
           else if (status === 'alpha') totalA++;
        }
      });
    });

    const totalPossible = effectiveDays * totalStudents;
    const getPct = (val: number) => totalPossible === 0 ? 0 : (val / totalPossible) * 100;

    return {
      effectiveDays,
      sakit: getPct(totalS).toFixed(1),
      izin: getPct(totalI).toFixed(1),
      alpha: getPct(totalA).toFixed(1)
    };
  };

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  // SEMESTER LOGIC
  const semesterMonths = useMemo(() => {
    return selectedSemester === 'ganjil' 
        ? [{num: 7, name: 'Juli'}, {num: 8, name: 'Agustus'}, {num: 9, name: 'September'}, {num: 10, name: 'Oktober'}, {num: 11, name: 'November'}, {num: 12, name: 'Desember'}]
        : [{num: 1, name: 'Januari'}, {num: 2, name: 'Februari'}, {num: 3, name: 'Maret'}, {num: 4, name: 'April'}, {num: 5, name: 'Mei'}, {num: 6, name: 'Juni'}];
  }, [selectedSemester]);

  const semesterRecapData = useMemo(() => {
    const data: Record<string, Record<number, { S: number; I: number; A: number }>> = {};
    filteredStudents.forEach(s => {
      data[s.id] = {};
      semesterMonths.forEach(m => {
        data[s.id][m.num] = { S: 0, I: 0, A: 0 };
      });
    });

    if (allAttendanceRecords && Array.isArray(allAttendanceRecords)) {
      allAttendanceRecords.forEach((record: any) => {
        const sId = String(record.studentId).trim();
        if (!data[sId]) return;

        let dateStr = String(record.date).trim();
        if (dateStr.includes('T')) dateStr = dateStr.split('T')[0];
        const parts = dateStr.split('-');
        if (parts.length === 3) {
           const recYear = parseInt(parts[0], 10);
           const recMonth = parseInt(parts[1], 10);
           
           let isMatch = false;
           if (selectedSemester === 'ganjil') {
             if (recYear === selectedYear && recMonth >= 7 && recMonth <= 12) isMatch = true;
           } else {
             if (recYear === selectedYear && recMonth >= 1 && recMonth <= 6) isMatch = true;
           }
           
           if (isMatch && data[sId][recMonth]) {
             const status = String(record.status).toLowerCase();
             if (status === 'sick') data[sId][recMonth].S++;
             if (status === 'permit') data[sId][recMonth].I++;
             if (status === 'alpha') data[sId][recMonth].A++;
           }
        }
      });
    }
    return data;
  }, [filteredStudents, allAttendanceRecords, selectedSemester, selectedYear, semesterMonths]);

  const handlePrintClick = () => {
    print('Laporan Absensi', 'landscape', 'attendance-special-print-area');
    setIsOpen(false);
  };

  const summary = calculateAttendanceSummary();
  const printDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  
  const extractLocation = (addr: string) => {
    if (!addr) return '[Desa/Kota]';
    // Look for Desa/Kelurahan/Kota/Kabupaten/Kab.
    const match = addr.match(/(?:Desa|Kelurahan|Kota|Kabupaten|Kab\.)\s+([a-zA-Z0-9\s]+)(?:,|$)/i);
    if (match) {
       // if it matched "Desa X", we return "Desa X", otherwise just "X" or the match
       const fullMatch = addr.match(/(Desa|Kelurahan|Kota|Kabupaten|Kab\.)\s+([a-zA-Z0-9\s]+)(?:,|$)/i);
       if (fullMatch && fullMatch[1].toLowerCase() === 'desa') {
           return `Desa ${fullMatch[2].trim()}`;
       }
       return match[1].trim();
    }
    
    // Fallback: take the last part of comma-separated string
    const parts = addr.split(',').map(s => s.trim());
    return parts.length > 1 ? parts[parts.length - 1] : addr;
  };

  const hmMame = schoolProfile?.headmaster || '[Nama Kepala Sekolah]';
  const hmNip = schoolProfile?.headmasterNip || '[NIP Kepala Sekolah]';
  
  const tcName = teacherProfile?.name || '[Nama Guru Kelas]';
  const tcNip = teacherProfile?.nip || '[NIP Guru Kelas]';
  
  // Get city/village name directly from desa, or extract from address
  const getCityOrVillage = () => {
    if (schoolProfile?.desa) return schoolProfile.desa;
    if (schoolProfile?.kabupaten) return schoolProfile.kabupaten;
    return extractLocation(schoolProfile?.address || '');
  };
  const city = getCityOrVillage();

  // Determine Academic Year based on month (simple heuristic)
  const currentAcademicYear = selectedMonth >= 7 ? `${selectedYear}/${selectedYear + 1}` : `${selectedYear - 1}/${selectedYear}`;

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-[#5AB2FF] text-white px-4 py-2 rounded-lg hover:bg-[#A0DEFF] transition-colors shadow-md font-semibold"
      >
        <Printer size={18} />
        <span>Cetak Laporan</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden p-6 relative">
              <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
                 <X size={24} />
              </button>
              <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">
                {type === 'semester' ? 'Cetak Laporan Semester' : 'Cetak Laporan Absensi'}
              </h3>
              <div className="space-y-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
                   <select 
                     className="w-full border rounded-lg px-3 py-2"
                     value={selectedClass}
                     onChange={(e) => setSelectedClass(e.target.value)}
                   >
                      {availableClasses.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                   </select>
                 </div>
                 
                 {type === 'semester' ? (
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                      <select className="w-full border rounded-lg px-3 py-2" value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value as 'ganjil' | 'genap')}>
                        <option value="ganjil">Ganjil (Juli - Des)</option>
                        <option value="genap">Genap (Jan - Jun)</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tahun</label>
                      <input 
                        type="number" 
                        className="w-full border rounded-lg px-3 py-2"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                      />
                    </div>
                  </div>
                 ) : (
                 <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bulan</label>
                      <select 
                        className="w-full border rounded-lg px-3 py-2"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                      >
                        {monthNames.map((m, i) => (
                          <option key={i+1} value={i+1}>{m}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tahun</label>
                      <input 
                        type="number" 
                        className="w-full border rounded-lg px-3 py-2"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                      />
                    </div>
                 </div>
                 )}
                 <div className="pt-4 flex justify-end gap-2">
                    <button onClick={() => setIsOpen(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50 font-bold">Batal</button>
                    <button onClick={handlePrintClick} className="px-4 py-2 bg-[#5AB2FF] text-white rounded-lg hover:bg-[#A0DEFF] flex items-center gap-2 font-bold shadow-md">
                      <Printer size={16} /> Cetak Sekarang
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Hidden Print Area */}
      <div className="hidden">
        <div id="attendance-special-print-area" className="sagara-print-content print-landscape">
          <div className="attendance-print-table-wrapper">
             <div className="header-info">
                <h2>{type === 'semester' ? 'REKAP ABSENSI SATU SEMESTER' : 'LAPORAN ABSENSI'}</h2>
                <table style={{ width: 'auto', border: 'none' }}>
                   <tbody>
                      <tr>
                        <td style={{ width: '120px', padding: '2px 0', border: 'none', textAlign: 'left' }}>KELAS</td>
                        <td style={{ width: '10px', padding: '2px 0', border: 'none', textAlign: 'left' }}>:</td>
                        <td style={{ padding: '2px 0', border: 'none', textAlign: 'left', fontWeight: 'bold' }}>{selectedClass}</td>
                      </tr>
                      {type === 'semester' ? (
                        <tr>
                          <td style={{ padding: '2px 0', border: 'none', textAlign: 'left' }}>SEMESTER</td>
                          <td style={{ padding: '2px 0', border: 'none', textAlign: 'left' }}>:</td>
                          <td style={{ padding: '2px 0', border: 'none', textAlign: 'left', fontWeight: 'bold' }}>{selectedSemester === 'ganjil' ? 'GANJIL' : 'GENAP'}</td>
                        </tr>
                      ) : (
                        <tr>
                          <td style={{ padding: '2px 0', border: 'none', textAlign: 'left' }}>BULAN</td>
                          <td style={{ padding: '2px 0', border: 'none', textAlign: 'left' }}>:</td>
                          <td style={{ padding: '2px 0', border: 'none', textAlign: 'left', fontWeight: 'bold' }}>{monthNames[selectedMonth - 1].toUpperCase()}</td>
                        </tr>
                      )}
                      <tr>
                        <td style={{ padding: '2px 0', border: 'none', textAlign: 'left' }}>TAHUN AJARAN</td>
                        <td style={{ padding: '2px 0', border: 'none', textAlign: 'left' }}>:</td>
                        <td style={{ padding: '2px 0', border: 'none', textAlign: 'left', fontWeight: 'bold' }}>{currentAcademicYear}</td>
                      </tr>
                   </tbody>
                </table>
             </div>

             {type === 'semester' ? (
              <table className="attendance-print-table">
                <thead>
                    <tr>
                        <th rowSpan={2} className="col-no">NO</th>
                        <th rowSpan={2} className="col-name">NAMA SISWA</th>
                        {semesterMonths.map(m => (
                            <th key={m.num} colSpan={3}>{m.name.toUpperCase()}</th>
                        ))}
                        <th colSpan={3}>TOTAL</th>
                    </tr>
                    <tr>
                        {semesterMonths.map(m => (
                            <React.Fragment key={m.num}>
                                <th style={{width: '20px'}}>S</th>
                                <th style={{width: '20px'}}>I</th>
                                <th style={{width: '20px'}}>A</th>
                            </React.Fragment>
                        ))}
                        <th style={{width: '30px'}}>S</th>
                        <th style={{width: '30px'}}>I</th>
                        <th style={{width: '30px'}}>A</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredStudents.map((s, idx) => {
                        let totalS = 0; let totalI = 0; let totalA = 0;
                        return (
                            <tr key={s.id}>
                                <td>{idx + 1}</td>
                                <td className="col-name">{s.name.toUpperCase()}</td>
                                {semesterMonths.map(m => {
                                    const monthData = semesterRecapData[s.id]?.[m.num] || { S: 0, I: 0, A: 0 };
                                    totalS += monthData.S; totalI += monthData.I; totalA += monthData.A;
                                    return (
                                        <React.Fragment key={m.num}>
                                            <td className={monthData.S > 0 ? "status-s font-bold" : ""}>{monthData.S || '-'}</td>
                                            <td className={monthData.I > 0 ? "status-i font-bold" : ""}>{monthData.I || '-'}</td>
                                            <td className={monthData.A > 0 ? "status-a font-bold" : ""}>{monthData.A || '-'}</td>
                                        </React.Fragment>
                                    );
                                })}
                                <td style={{fontWeight: 'bold'}}>{totalS || '-'}</td>
                                <td style={{fontWeight: 'bold'}}>{totalI || '-'}</td>
                                <td style={{fontWeight: 'bold'}}>{totalA || '-'}</td>
                            </tr>
                        );
                    })}
                </tbody>
              </table>
             ) : (
             <table className="attendance-print-table">
                <thead>
                   <tr>
                     <th className="col-no" rowSpan={2}>NO</th>
                     <th className="col-name" rowSpan={2}>NAMA SISWA</th>
                     <th colSpan={daysInMonth}>TANGGAL</th>
                     <th colSpan={4}>REKAP</th>
                   </tr>
                   <tr>
                     {daysArray.map(d => <th key={d} className="col-date">{d}</th>)}
                     <th className="col-rekap">H</th>
                     <th className="col-rekap">S</th>
                     <th className="col-rekap">I</th>
                     <th className="col-rekap">A</th>
                   </tr>
                </thead>
                <tbody>
                   {generateAttendanceRows()}
                </tbody>
             </table>
             )}

             {type !== 'semester' && (
             <div className="attendance-print-summary">
                <h3>RINGKASAN ABSENSI</h3>
                <table>
                   <tbody>
                      <tr>
                        <td className="summary-label">HARI EFEKTIF</td>
                        <td>{summary.effectiveDays} Hari</td>
                      </tr>
                      <tr>
                        <td className="summary-label">Izin</td>
                        <td>{summary.izin}%</td>
                      </tr>
                      <tr>
                        <td className="summary-label">Sakit</td>
                        <td>{summary.sakit}%</td>
                      </tr>
                      <tr>
                        <td className="summary-label">Alpha</td>
                        <td>{summary.alpha}%</td>
                      </tr>
                   </tbody>
                </table>
             </div>
             )}

             <div className="attendance-print-signatures">
                <div className="sig-box">
                   <div>Mengetahui,</div>
                   <div>Kepala Sekolah</div>
                   <div className="name-line">{hmMame}</div>
                   <div className="nip-line">NIP. {hmNip}</div>
                </div>
                <div className="sig-box">
                   <div>{city}, {printDate}</div>
                   <div>Guru Kelas</div>
                   <div className="name-line">{tcName}</div>
                   <div className="nip-line">NIP. {tcNip}</div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </>
  );
};
