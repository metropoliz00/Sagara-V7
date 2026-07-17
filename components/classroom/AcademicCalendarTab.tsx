import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AcademicCalendarData, Holiday } from '../../types';
import { Calendar, Save, Loader2, RefreshCw, AlertTriangle, X, Lock, Edit2, FileDown, FileUp, ClipboardList, Zap, Info, Share2 } from 'lucide-react';
import { CALENDAR_CODES, PREFILLED_CALENDAR_2025, HOLIDAY_DESCRIPTIONS_2025_2026 } from '../../constants';
import * as XLSX from 'xlsx';

interface AcademicCalendarTabProps {
  initialData: AcademicCalendarData;
  onSave: (data: AcademicCalendarData) => Promise<void>;
  onAddHoliday: (holidays: Omit<Holiday, 'id'>[]) => Promise<void>;
  onShowNotification: (message: string, type: 'success' | 'error' | 'warning') => void;
  classId: string;
  isReadOnly?: boolean; // NEW PROP
  schoolYear?: string; // NEW PROP
}

const HOLIDAY_CODES = ['LHB', 'LU', 'LS1', 'LS2', 'CB', 'LHR'];

// ... (Holiday Descriptions and Prefilled Data remain the same)

const AcademicCalendarTab: React.FC<AcademicCalendarTabProps> = ({ initialData, onSave, onAddHoliday, onShowNotification, classId, isReadOnly = false, schoolYear }) => {
  const getStartYearFromProp = () => {
    if (schoolYear && schoolYear.includes('/')) {
        return Number(schoolYear.split('/')[0]);
    }
    return 2025; // Default fallback
  };

  const [startYear, setStartYear] = useState(getStartYearFromProp());
  const [localData, setLocalData] = useState<AcademicCalendarData>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isActionsVisible, setIsActionsVisible] = useState(true);
  const [isLegendVisible, setIsLegendVisible] = useState(true);
  const [editingDescription, setEditingDescription] = useState<{date: string, code: string, currentDesc: string, defaultDesc: string} | null>(null);
  
  // State for Import Features
  const [pastedText, setPastedText] = useState('');
  const [pastedCode, setPastedCode] = useState('LHB');
  const [showTextImportModal, setShowTextImportModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (schoolYear) {
      setStartYear(getStartYearFromProp());
    }
  }, [schoolYear]);

  useEffect(() => {
    // Prioritaskan data dari backend.
    if (initialData && Object.keys(initialData).length > 0) {
      setLocalData(initialData);
    } 
    // Jika tidak ada data backend, putuskan apakah akan mengisi data contoh atau mengosongkan.
    else {
      // Hanya isi data contoh untuk tahun ajaran default sebagai titik awal.
      if (startYear === 2025) {
        setLocalData(PREFILLED_CALENDAR_2025);
      } else {
        // Untuk tahun ajaran lain yang tidak memiliki data, pastikan kalender kosong.
        setLocalData({});
      }
    }
  }, [initialData, startYear]);

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStartYear(Number(e.target.value));
  };

  const handleDownloadTemplate = () => {
    // Generate all dates for the current startYear academic year: July 1 of startYear to June 30 of startYear+1
    const rows = [];
    const start = new Date(startYear, 6, 1); // July 1st
    const end = new Date(startYear + 1, 5, 30); // June 30th
    
    let current = new Date(start);
    while (current <= end) {
      const y = current.getFullYear();
      const m = String(current.getMonth() + 1).padStart(2, '0');
      const d = String(current.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;
      
      // Check if Sunday
      const isSunday = current.getDay() === 0;
      
      rows.push({
        'Tanggal (YYYY-MM-DD)': dateStr,
        'Hari': current.toLocaleDateString('id-ID', { weekday: 'long' }),
        'Kode Kalender (Kosongkan jika KBM biasa)': isSunday ? 'LU' : '',
        'Keterangan (Optional)': isSunday ? 'Libur Umum/Minggu' : '',
      });
      
      current.setDate(current.getDate() + 1);
    }
    
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Kalender');
    
    // Add a help sheet explaining codes
    const helpRows = Object.entries(CALENDAR_CODES).map(([code, { label }]) => ({
      'Kode': code,
      'Arti/Keterangan': label
    }));
    const helpWorksheet = XLSX.utils.json_to_sheet(helpRows);
    XLSX.utils.book_append_sheet(workbook, helpWorksheet, 'Daftar Kode');
    
    XLSX.writeFile(workbook, `Template_Kalender_Akademik_${startYear}_${startYear + 1}.xlsx`);
    onShowNotification('Template Excel berhasil diunduh!', 'success');
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);
        
        const updatedData = { ...localData };
        if (!updatedData.__descriptions__) {
          updatedData.__descriptions__ = {};
        }
        
        let importCount = 0;
        
        jsonData.forEach((row: any) => {
          let dateValue = '';
          let codeValue = '';
          let descValue = '';
          
          Object.entries(row).forEach(([key, val]) => {
            const lowerKey = key.toLowerCase();
            const strVal = String(val).trim();
            
            if (lowerKey.includes('tanggal') || lowerKey.includes('date') || lowerKey.includes('tgl') || lowerKey.includes('year-month-day')) {
              if (/^\d{4}-\d{2}-\d{2}$/.test(strVal)) {
                dateValue = strVal;
              } else if (val instanceof Date || !isNaN(Date.parse(strVal))) {
                const d = new Date(strVal);
                if (!isNaN(d.getTime())) {
                  const y = d.getFullYear();
                  const m = String(d.getMonth() + 1).padStart(2, '0');
                  const dy = String(d.getDate()).padStart(2, '0');
                  dateValue = `${y}-${m}-${dy}`;
                }
              }
            } else if (lowerKey.includes('kode') || lowerKey.includes('code') || lowerKey.includes('kategori')) {
              codeValue = strVal.toUpperCase();
            } else if (lowerKey.includes('keterangan') || lowerKey.includes('desc') || lowerKey.includes('kegiatan') || lowerKey.includes('info')) {
              descValue = strVal;
            }
          });
          
          if (!dateValue || !codeValue) {
            const vals = Object.values(row);
            vals.forEach((v: any) => {
              const str = String(v).trim();
              if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
                dateValue = str;
              } else if (HOLIDAY_CODES.includes(str.toUpperCase())) {
                codeValue = str.toUpperCase();
              }
            });
            
            if (dateValue && codeValue && !descValue) {
              const keys = Object.keys(row);
              const descKey = keys.find(k => !k.toLowerCase().includes('tanggal') && !k.toLowerCase().includes('kode') && !k.toLowerCase().includes('hari'));
              if (descKey) {
                descValue = String(row[descKey]).trim();
              }
            }
          }
          
          if (dateValue) {
            const [y, m, d] = dateValue.split('-').map(Number);
            const yearMonthKey = `${y}-${String(m).padStart(2, '0')}`;
            const dayIndex = d - 1;
            
            if (yearMonthKey && dayIndex >= 0 && dayIndex < 31) {
              if (!updatedData[yearMonthKey]) {
                updatedData[yearMonthKey] = Array(31).fill(null);
              }
              
              const codeUpper = codeValue.toUpperCase();
              if (codeValue && (HOLIDAY_CODES.includes(codeUpper) || codeUpper === '')) {
                updatedData[yearMonthKey][dayIndex] = codeUpper || null;
              }
              
              if (descValue) {
                if (!updatedData.__descriptions__) {
                  updatedData.__descriptions__ = {};
                }
                const descriptions = updatedData.__descriptions__ as Record<string, string>;
                descriptions[dateValue] = descValue;
              }
              
              importCount++;
            }
          }
        });
        
        setLocalData(updatedData);
        onShowNotification(`Berhasil mengimpor ${importCount} baris kalender dari Excel!`, 'success');
      } catch (error) {
        console.error(error);
        onShowNotification('Gagal mengurai file Excel. Pastikan format tabel sesuai template.', 'error');
      }
    };
    
    reader.readAsBinaryString(file);
    // Reset file input value to allow uploading same file again
    if (e.target) e.target.value = '';
  };

  const handleExportJSONConfig = () => {
    try {
      const exportPayload = {
        startYear,
        calendarData: localData
      };
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `Settingan_Kalender_Akademik_${startYear}_${startYear + 1}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      onShowNotification('File konfigurasi kalender (.json) berhasil diekspor! Bagikan file ini ke sekolah lain.', 'success');
    } catch (e) {
      console.error(e);
      onShowNotification('Gagal mengekspor file konfigurasi kalender.', 'error');
    }
  };

  const handleImportJSONConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const content = evt.target?.result as string;
        const parsed = JSON.parse(content);
        
        if (parsed && typeof parsed === 'object') {
          let importedData: AcademicCalendarData = {};
          if (parsed.calendarData) {
            importedData = parsed.calendarData;
            if (parsed.startYear) {
              setStartYear(Number(parsed.startYear));
            }
          } else {
            importedData = parsed;
          }
          
          setLocalData(importedData);
          onShowNotification('File settingan kalender (.json) berhasil diunggah! Klik tombol "Simpan Kalender" untuk menerapkan perubahan.', 'success');
        } else {
          onShowNotification('Format file JSON tidak cocok.', 'error');
        }
      } catch (error) {
        console.error(error);
        onShowNotification('Gagal mengimpor file JSON kalender. Pastikan file valid.', 'error');
      }
    };
    
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  const handleImportText = () => {
    const lines = pastedText.split('\n');
    const monthNames = [
      ['januari', 'jan'],
      ['februari', 'feb'],
      ['maret', 'mar'],
      ['april', 'apr'],
      ['mei'],
      ['juni', 'jun'],
      ['juli', 'jul'],
      ['agustus', 'agu', 'agt'],
      ['september', 'sep'],
      ['oktober', 'okt'],
      ['november', 'nov'],
      ['desember', 'des']
    ];
    
    // Helper to get month index from name
    const getMonthIndexFromName = (monthStr: string): number => {
      const lower = monthStr.toLowerCase();
      for (let i = 0; i < monthNames.length; i++) {
        const variants = monthNames[i];
        for (const variant of variants) {
          if (lower === variant || lower.startsWith(variant)) {
            return i + 1;
          }
        }
      }
      return -1;
    };

    const updatedData = { ...localData };
    if (!updatedData.__descriptions__) {
      updatedData.__descriptions__ = {};
    }
    
    let importCount = 0;
    
    lines.forEach(line => {
      if (!line.trim()) return;
      
      let datesToImport: { day: number; month: number; year: number }[] = [];
      let eventName = '';

      // 1. Try word-based range across different months/years (e.g. "28 April 2027 - 2 Mei 2027" or "28 April - 2 Mei 2027")
      const crossMonthWordMatch = line.match(/(\d{1,2})\s+([a-zA-Z]+)(?:\s+(\d{4}))?\s*(?:-|\bs\.?d\.?\b|s\/d|sampai\s+dengan|sampai|ke)\s*(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})/i);
      if (crossMonthWordMatch) {
        const startDay = parseInt(crossMonthWordMatch[1]);
        const startMonthName = crossMonthWordMatch[2];
        const endDay = parseInt(crossMonthWordMatch[4]);
        const endMonthName = crossMonthWordMatch[5];
        const endYear = parseInt(crossMonthWordMatch[6]);
        const startYear = crossMonthWordMatch[3] ? parseInt(crossMonthWordMatch[3]) : endYear;
        
        const startMonthIndex = getMonthIndexFromName(startMonthName);
        const endMonthIndex = getMonthIndexFromName(endMonthName);
        
        if (startMonthIndex !== -1 && endMonthIndex !== -1) {
          const startDate = new Date(startYear, startMonthIndex - 1, startDay);
          const endDate = new Date(endYear, endMonthIndex - 1, endDay);
          
          if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime()) && startDate <= endDate) {
            let curr = new Date(startDate);
            while (curr <= endDate) {
              datesToImport.push({
                day: curr.getDate(),
                month: curr.getMonth() + 1,
                year: curr.getFullYear()
              });
              curr.setDate(curr.getDate() + 1);
            }
            eventName = line.replace(crossMonthWordMatch[0], '')
              .replace(/^[:\-\s]+/, '').replace(/[:\-\s]+$/, '').trim();
          }
        }
      }

      // 2. Try numeric range across different months/years (e.g. "28/04/2027 - 02/05/2027")
      if (datesToImport.length === 0) {
        const crossMonthNumMatch = line.match(/(\d{1,2})[\/\-.](\d{1,2})(?:[\/\-.](\d{4}))?\s*(?:-|\bs\.?d\.?\b|s\/d|sampai\s+dengan|sampai|ke)\s*(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/i);
        if (crossMonthNumMatch) {
          const startDay = parseInt(crossMonthNumMatch[1]);
          const startMonth = parseInt(crossMonthNumMatch[2]);
          const endDay = parseInt(crossMonthNumMatch[4]);
          const endMonth = parseInt(crossMonthNumMatch[5]);
          const endYear = parseInt(crossMonthNumMatch[6]);
          const startYear = crossMonthNumMatch[3] ? parseInt(crossMonthNumMatch[3]) : endYear;
          
          if (startMonth >= 1 && startMonth <= 12 && endMonth >= 1 && endMonth <= 12) {
            const startDate = new Date(startYear, startMonth - 1, startDay);
            const endDate = new Date(endYear, endMonth - 1, endDay);
            
            if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime()) && startDate <= endDate) {
              let curr = new Date(startDate);
              while (curr <= endDate) {
                datesToImport.push({
                  day: curr.getDate(),
                  month: curr.getMonth() + 1,
                  year: curr.getFullYear()
                });
                curr.setDate(curr.getDate() + 1);
              }
              eventName = line.replace(crossMonthNumMatch[0], '')
                .replace(/^[:\-\s]+/, '').replace(/[:\-\s]+$/, '').trim();
            }
          }
        }
      }

      // 3. Try word-based range of days in same month (e.g. "1-8 April 2027" or "1 s.d. 8 April 2027")
      if (datesToImport.length === 0) {
        const rangeWordMatch = line.match(/(\d{1,2})\s*(?:-|\bs\.?d\.?\b|s\/d|sampai\s+dengan|sampai|ke)\s*(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})/i);
        
        if (rangeWordMatch) {
          const startDay = parseInt(rangeWordMatch[1]);
          const endDay = parseInt(rangeWordMatch[2]);
          const monthName = rangeWordMatch[3];
          const year = parseInt(rangeWordMatch[4]);
          const monthIndex = getMonthIndexFromName(monthName);
          
          if (monthIndex !== -1 && startDay > 0 && endDay >= startDay && endDay <= 31) {
            for (let d = startDay; d <= endDay; d++) {
              datesToImport.push({ day: d, month: monthIndex, year });
            }
            eventName = line.replace(rangeWordMatch[0], '')
              .replace(/^[:\-\s]+/, '').replace(/[:\-\s]+$/, '').trim();
          }
        }
      }

      // 4. Try numeric range of days in same month (e.g. "01-08/04/2027" or "1-8-04-2027")
      if (datesToImport.length === 0) {
        const rangeNumMatch = line.match(/(\d{1,2})\s*(?:-|\bs\.?d\.?\b|s\/d|sampai|ke)\s*(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/i);
        if (rangeNumMatch) {
          const startDay = parseInt(rangeNumMatch[1]);
          const endDay = parseInt(rangeNumMatch[2]);
          const month = parseInt(rangeNumMatch[3]);
          const year = parseInt(rangeNumMatch[4]);
          
          if (month >= 1 && month <= 12 && startDay > 0 && endDay >= startDay && endDay <= 31) {
            for (let d = startDay; d <= endDay; d++) {
              datesToImport.push({ day: d, month, year });
            }
            eventName = line.replace(rangeNumMatch[0], '')
              .replace(/^[:\-\s]+/, '').replace(/[:\-\s]+$/, '').trim();
          }
        }
      }

      // 3. Try single numeric date (e.g. "17-08-2027" or "17/08/2027")
      if (datesToImport.length === 0) {
        const singleNumMatch = line.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/);
        if (singleNumMatch) {
          const day = parseInt(singleNumMatch[1]);
          const month = parseInt(singleNumMatch[2]);
          const year = parseInt(singleNumMatch[3]);
          
          if (month >= 1 && month <= 12 && day > 0 && day <= 31) {
            datesToImport.push({ day, month, year });
            eventName = line.replace(singleNumMatch[0], '')
              .replace(/^[:\-\s]+/, '').replace(/[:\-\s]+$/, '').trim();
          }
        }
      }

      // 4. Try single word-based date (e.g. "17 Agustus 2027: Hari Kemerdekaan")
      if (datesToImport.length === 0) {
        let foundMonthIndex = -1;
        let monthStringInText = '';
        
        for (let i = 0; i < monthNames.length; i++) {
          const variants = monthNames[i];
          for (const variant of variants) {
            const regex = new RegExp(`\\b${variant}\\b`, 'i');
            if (regex.test(line)) {
              foundMonthIndex = i + 1;
              monthStringInText = variant;
              break;
            }
          }
          if (foundMonthIndex !== -1) break;
        }
        
        if (foundMonthIndex !== -1) {
          const dayMatch = line.match(new RegExp(`(\\d{1,2})\\s*(?:${monthStringInText})`, 'i')) || 
                           line.match(new RegExp(`(?:${monthStringInText})\\s*(\\d{1,2})`, 'i'));
                           
          const yearMatch = line.match(/\b(20\d{2})\b/);
          
          if (dayMatch && yearMatch) {
            const day = parseInt(dayMatch[1]);
            const year = parseInt(yearMatch[1]);
            
            if (day > 0 && day <= 31) {
              datesToImport.push({ day, month: foundMonthIndex, year });
              eventName = line
                .replace(dayMatch[0], '')
                .replace(yearMatch[0], '')
                .replace(/^[:\-\s]+/, '')
                .replace(/[:\-\s]+$/, '')
                .trim();
            }
          }
        }
      }

      // Process any detected dates for the current line
      datesToImport.forEach(({ day, month, year }) => {
        const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const yearMonthKey = `${year}-${String(month).padStart(2, '0')}`;
        const dayIndex = day - 1;
        
        if (dayIndex >= 0 && dayIndex < 31) {
          if (!updatedData[yearMonthKey]) {
            updatedData[yearMonthKey] = Array(31).fill(null);
          }
          
          updatedData[yearMonthKey][dayIndex] = pastedCode;
          const descriptions = updatedData.__descriptions__ as Record<string, string>;
          if (eventName) {
            descriptions[dateKey] = eventName;
          } else {
            descriptions[dateKey] = CALENDAR_CODES[pastedCode]?.label || 'Libur';
          }
          importCount++;
        }
      });
    });
    
    if (importCount > 0) {
      setLocalData(updatedData);
      onShowNotification(`Berhasil mengimpor ${importCount} tanggal libur dari teks!`, 'success');
      setShowTextImportModal(false);
      setPastedText('');
    } else {
      onShowNotification('Tidak dapat menemukan pola tanggal atau rentang tanggal yang valid di teks yang Anda tempel. Contoh format: "1-8 April 2027: Libur Lebaran"', 'warning');
    }
  };

  const handleAutoPopulateHolidays = () => {
    if (isReadOnly) return;

    // Detailed Holiday Data Source per Year
    const HOLIDAY_DATABASE: Record<number, Record<string, { code: string; desc: string }>> = {
      2024: {
        '01-01': { code: 'LHB', desc: 'Tahun Baru Masehi' },
        '02-08': { code: 'LHB', desc: "Isra Mi'raj Nabi Muhammad SAW" },
        '02-09': { code: 'CB', desc: 'Cuti Bersama Tahun Baru Imlek' },
        '02-10': { code: 'LHB', desc: 'Tahun Baru Imlek 2575' },
        '03-11': { code: 'LHB', desc: 'Hari Raya Nyepi Tahun Saka 1946' },
        '03-12': { code: 'CB', desc: 'Cuti Bersama Hari Raya Nyepi' },
        '03-29': { code: 'LHB', desc: 'Wafat Yesus Kristus' },
        '03-31': { code: 'LHB', desc: 'Hari Kebangkitan Yesus Kristus (Paskah)' },
        '04-08': { code: 'CB', desc: 'Cuti Bersama Idul Fitri 1445 H' },
        '04-09': { code: 'CB', desc: 'Cuti Bersama Idul Fitri 1445 H' },
        '04-10': { code: 'LHB', desc: 'Hari Raya Idul Fitri 1445 H' },
        '04-11': { code: 'LHB', desc: 'Hari Raya Idul Fitri 1445 H' },
        '04-12': { code: 'CB', desc: 'Cuti Bersama Idul Fitri 1445 H' },
        '04-15': { code: 'CB', desc: 'Cuti Bersama Idul Fitri 1445 H' },
        '05-01': { code: 'LHB', desc: 'Hari Buruh Internasional' },
        '05-09': { code: 'LHB', desc: 'Kenaikan Yesus Kristus' },
        '05-10': { code: 'CB', desc: 'Cuti Bersama Kenaikan Yesus Kristus' },
        '05-23': { code: 'LHB', desc: 'Hari Raya Waisak 2568' },
        '05-24': { code: 'CB', desc: 'Cuti Bersama Hari Raya Waisak' },
        '06-01': { code: 'LHB', desc: 'Hari Lahir Pancasila' },
        '06-17': { code: 'LHB', desc: 'Hari Raya Idul Adha 1445 H' },
        '06-18': { code: 'CB', desc: 'Cuti Bersama Hari Raya Idul Adha' },
        '07-07': { code: 'LHB', desc: 'Tahun Baru Islam 1446 H' },
        '08-17': { code: 'LHB', desc: 'HUT Republik Indonesia' },
        '09-16': { code: 'LHB', desc: 'Maulid Nabi Muhammad SAW' },
        '12-25': { code: 'LHB', desc: 'Hari Raya Natal' },
        '12-26': { code: 'CB', desc: 'Cuti Bersama Hari Raya Natal' },
      },
      2025: {
        '01-01': { code: 'LHB', desc: 'Tahun Baru Masehi' },
        '01-27': { code: 'LHB', desc: "Isra Mi'raj Nabi Muhammad SAW" },
        '01-28': { code: 'CB', desc: 'Cuti Bersama Tahun Baru Imlek' },
        '01-29': { code: 'LHB', desc: 'Tahun Baru Imlek 2576' },
        '03-27': { code: 'CB', desc: 'Cuti Bersama Hari Raya Idul Fitri' },
        '03-28': { code: 'CB', desc: 'Cuti Bersama Hari Raya Nyepi & Idul Fitri' },
        '03-29': { code: 'LHB', desc: 'Hari Raya Nyepi Tahun Saka 1947' },
        '03-31': { code: 'LHB', desc: 'Hari Raya Idul Fitri 1446 H' },
        '04-01': { code: 'LHB', desc: 'Hari Raya Idul Fitri 1446 H' },
        '04-02': { code: 'CB', desc: 'Cuti Bersama Hari Raya Idul Fitri' },
        '04-03': { code: 'CB', desc: 'Cuti Bersama Hari Raya Idul Fitri' },
        '04-04': { code: 'CB', desc: 'Cuti Bersama Hari Raya Idul Fitri' },
        '04-18': { code: 'LHB', desc: 'Wafat Yesus Kristus' },
        '04-20': { code: 'LHB', desc: 'Hari Kebangkitan Yesus Kristus (Paskah)' },
        '05-01': { code: 'LHB', desc: 'Hari Buruh Internasional' },
        '05-12': { code: 'LHB', desc: 'Hari Raya Waisak 2569' },
        '05-13': { code: 'CB', desc: 'Cuti Bersama Hari Raya Waisak' },
        '05-29': { code: 'LHB', desc: 'Kenaikan Yesus Kristus' },
        '05-30': { code: 'CB', desc: 'Cuti Bersama Kenaikan Yesus Kristus' },
        '06-01': { code: 'LHB', desc: 'Hari Lahir Pancasila' },
        '06-06': { code: 'LHB', desc: 'Hari Raya Idul Adha 1446 H' },
        '06-09': { code: 'CB', desc: 'Cuti Bersama Hari Raya Idul Adha' },
        '06-27': { code: 'LHB', desc: 'Tahun Baru Islam 1447 H' },
        '08-17': { code: 'LHB', desc: 'HUT Republik Indonesia' },
        '09-05': { code: 'LHB', desc: 'Maulid Nabi Muhammad SAW' },
        '12-25': { code: 'LHB', desc: 'Hari Raya Natal' },
        '12-26': { code: 'CB', desc: 'Cuti Bersama Hari Raya Natal' },
      },
      2026: {
        '01-01': { code: 'LHB', desc: 'Tahun Baru Masehi' },
        '01-15': { code: 'LHB', desc: "Isra Mi'raj Nabi Muhammad SAW" },
        '02-17': { code: 'LHB', desc: 'Tahun Baru Imlek 2577' },
        '03-19': { code: 'LHB', desc: 'Hari Raya Nyepi 1948' },
        '03-20': { code: 'LHB', desc: 'Hari Raya Idul Fitri 1447 H' },
        '03-21': { code: 'LHB', desc: 'Hari Raya Idul Fitri 1447 H' },
        '04-03': { code: 'LHB', desc: 'Wafat Yesus Kristus' },
        '05-01': { code: 'LHB', desc: 'Hari Buruh Internasional' },
        '05-14': { code: 'LHB', desc: 'Kenaikan Yesus Kristus' },
        '05-27': { code: 'LHB', desc: 'Hari Raya Idul Adha 1447 H' },
        '05-31': { code: 'LHB', desc: 'Hari Raya Waisak 2570' },
        '06-01': { code: 'LHB', desc: 'Hari Lahir Pancasila' },
        '06-16': { code: 'LHB', desc: 'Tahun Baru Hijriyah 1448 H' },
        '08-17': { code: 'LHB', desc: 'HUT Republik Indonesia' },
        '08-25': { code: 'LHB', desc: 'Maulid Nabi Muhammad SAW' },
        '12-25': { code: 'LHB', desc: 'Hari Raya Natal' },
        '12-26': { code: 'CB', desc: 'Cuti Bersama Hari Raya Natal' },
      },
      2027: {
        '01-01': { code: 'LHB', desc: 'Tahun Baru Masehi' },
        '01-05': { code: 'LHB', desc: "Isra Mi'raj Nabi Muhammad SAW" },
        '02-06': { code: 'LHB', desc: 'Tahun Baru Imlek 2578' },
        '03-08': { code: 'LHB', desc: 'Hari Raya Nyepi 1949' },
        '03-09': { code: 'LHB', desc: 'Hari Raya Idul Fitri 1448 H' },
        '03-10': { code: 'LHB', desc: 'Hari Raya Idul Fitri 1448 H' },
        '03-26': { code: 'LHB', desc: 'Wafat Yesus Kristus' },
        '05-01': { code: 'LHB', desc: 'Hari Buruh Internasional' },
        '05-06': { code: 'LHB', desc: 'Kenaikan Yesus Kristus' },
        '05-16': { code: 'LHB', desc: 'Hari Raya Idul Adha 1448 H' },
        '05-20': { code: 'LHB', desc: 'Hari Raya Waisak 2571' },
        '06-01': { code: 'LHB', desc: 'Hari Lahir Pancasila' },
        '06-06': { code: 'LHB', desc: 'Tahun Baru Hijriyah 1449 H' },
        '08-15': { code: 'LHB', desc: 'Maulid Nabi Muhammad SAW' },
        '08-17': { code: 'LHB', desc: 'HUT Republik Indonesia' },
        '12-25': { code: 'LHB', desc: 'Hari Raya Natal' },
        '12-26': { code: 'CB', desc: 'Cuti Bersama Hari Raya Natal' },
      },
      2028: {
        '01-01': { code: 'LHB', desc: 'Tahun Baru Masehi' },
        '01-24': { code: 'LHB', desc: "Isra Mi'raj Nabi Muhammad SAW" },
        '01-26': { code: 'LHB', desc: 'Tahun Baru Imlek 2579' },
        '02-25': { code: 'LHB', desc: 'Hari Raya Nyepi 1950' },
        '03-01': { code: 'LHB', desc: 'Hari Raya Idul Fitri 1449 H' },
        '03-02': { code: 'LHB', desc: 'Hari Raya Idul Fitri 1449 H' },
        '04-14': { code: 'LHB', desc: 'Wafat Yesus Kristus' },
        '05-01': { code: 'LHB', desc: 'Hari Buruh Internasional' },
        '05-05': { code: 'LHB', desc: 'Hari Raya Idul Adha 1449 H' },
        '05-08': { code: 'LHB', desc: 'Hari Raya Waisak 2572' },
        '05-25': { code: 'LHB', desc: 'Kenaikan Yesus Kristus' },
        '06-01': { code: 'LHB', desc: 'Hari Lahir Pancasila' },
        '06-24': { code: 'LHB', desc: 'Tahun Baru Hijriyah 1450 H' },
        '08-17': { code: 'LHB', desc: 'HUT Republik Indonesia' },
        '09-02': { code: 'LHB', desc: 'Maulid Nabi Muhammad SAW' },
        '12-25': { code: 'LHB', desc: 'Hari Raya Natal' },
        '12-26': { code: 'CB', desc: 'Cuti Bersama Hari Raya Natal' },
      },
      2029: {
        '01-01': { code: 'LHB', desc: 'Tahun Baru Masehi' },
        '01-13': { code: 'LHB', desc: "Isra Mi'raj Nabi Muhammad SAW" },
        '02-13': { code: 'LHB', desc: 'Tahun Baru Imlek 2580' },
        '03-15': { code: 'LHB', desc: 'Hari Raya Nyepi 1951' },
        '03-30': { code: 'LHB', desc: 'Wafat Yesus Kristus' },
        '04-16': { code: 'LHB', desc: 'Hari Raya Idul Fitri 1450 H' },
        '04-17': { code: 'LHB', desc: 'Hari Raya Idul Fitri 1450 H' },
        '05-01': { code: 'LHB', desc: 'Hari Buruh Internasional' },
        '05-10': { code: 'LHB', desc: 'Kenaikan Yesus Kristus' },
        '05-27': { code: 'LHB', desc: 'Hari Raya Waisak 2573' },
        '06-01': { code: 'LHB', desc: 'Hari Lahir Pancasila' },
        '06-13': { code: 'LHB', desc: 'Tahun Baru Hijriyah 1451 H' },
        '08-17': { code: 'LHB', desc: 'HUT Republik Indonesia' },
        '08-22': { code: 'LHB', desc: 'Maulid Nabi Muhammad SAW' },
        '12-25': { code: 'LHB', desc: 'Hari Raya Natal' },
        '12-26': { code: 'CB', desc: 'Cuti Bersama Hari Raya Natal' },
      },
      2030: {
        '01-01': { code: 'LHB', desc: 'Tahun Baru Masehi' },
        '01-02': { code: 'LHB', desc: "Isra Mi'raj Nabi Muhammad SAW" },
        '02-03': { code: 'LHB', desc: 'Tahun Baru Imlek 2581' },
        '03-05': { code: 'LHB', desc: 'Hari Raya Nyepi 1952' },
        '04-05': { code: 'LHB', desc: 'Hari Raya Idul Fitri 1451 H' },
        '04-06': { code: 'LHB', desc: 'Hari Raya Idul Fitri 1451 H' },
        '04-19': { code: 'LHB', desc: 'Wafat Yesus Kristus' },
        '05-01': { code: 'LHB', desc: 'Hari Buruh Internasional' },
        '05-16': { code: 'LHB', desc: 'Hari Raya Waisak 2574' },
        '05-30': { code: 'LHB', desc: 'Kenaikan Yesus Kristus' },
        '06-01': { code: 'LHB', desc: 'Hari Lahir Pancasila' },
        '06-02': { code: 'LHB', desc: 'Tahun Baru Hijriyah 1452 H' },
        '08-11': { code: 'LHB', desc: 'Maulid Nabi Muhammad SAW' },
        '08-17': { code: 'LHB', desc: 'HUT Republik Indonesia' },
        '12-25': { code: 'LHB', desc: 'Hari Raya Natal' },
        '12-26': { code: 'CB', desc: 'Cuti Bersama Hari Raya Natal' },
      }
    };

    const updatedData = { ...localData };
    if (!updatedData.__descriptions__) {
      updatedData.__descriptions__ = {};
    }
    const descriptions = updatedData.__descriptions__ as Record<string, string>;

    const start = new Date(startYear, 6, 1);
    const end = new Date(startYear + 1, 5, 30);
    let current = new Date(start);
    let populatedCount = 0;

    while (current <= end) {
      const year = current.getFullYear();
      const monthIndex = current.getMonth();
      const day = current.getDate();

      const yearMonthKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
      const dateKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const shortDateKey = `${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayIndex = day - 1;

      if (!updatedData[yearMonthKey]) {
        updatedData[yearMonthKey] = Array(31).fill(null);
      }

      const isSunday = current.getDay() === 0;

      if (isSunday) {
        updatedData[yearMonthKey][dayIndex] = 'LU';
        descriptions[dateKey] = 'Libur Umum/Minggu';
        populatedCount++;
      } else {
        const holidayForYear = HOLIDAY_DATABASE[year];
        let holidayInfo = holidayForYear?.[shortDateKey];

        // Fallback for static annual national holidays outside known database
        if (!holidayInfo) {
          if (shortDateKey === '01-01') holidayInfo = { code: 'LHB', desc: 'Tahun Baru Masehi' };
          else if (shortDateKey === '05-01') holidayInfo = { code: 'LHB', desc: 'Hari Buruh Internasional' };
          else if (shortDateKey === '06-01') holidayInfo = { code: 'LHB', desc: 'Hari Lahir Pancasila' };
          else if (shortDateKey === '08-17') holidayInfo = { code: 'LHB', desc: 'HUT Republik Indonesia' };
          else if (shortDateKey === '12-25') holidayInfo = { code: 'LHB', desc: 'Hari Raya Natal' };
          else if (shortDateKey === '12-26') holidayInfo = { code: 'CB', desc: 'Cuti Bersama Hari Raya Natal' };
        }

        if (holidayInfo) {
          updatedData[yearMonthKey][dayIndex] = holidayInfo.code;
          descriptions[dateKey] = holidayInfo.desc;
          populatedCount++;
        }
      }

      current.setDate(current.getDate() + 1);
    }

    setLocalData(updatedData);
    onShowNotification(`Berhasil otomatis mendeteksi Minggu & menempatkan libur nasional/cuti bersama untuk tahun ajaran ${startYear}/${startYear + 1}!`, 'success');
  };

  const handleAutoNumberDays = () => {
    if (isReadOnly) return;
    
    const updatedData = { ...localData };
    let kbmCounter = 1;
    let currentSemester: 1 | 2 = 1; // July is in Semester 1
    
    const start = new Date(startYear, 6, 1);
    const end = new Date(startYear + 1, 5, 30);
    
    let current = new Date(start);
    let countModified = 0;
    
    while (current <= end) {
      const y = current.getFullYear();
      const m = current.getMonth();
      const d = current.getDate();
      
      const semester = (m >= 6 && m <= 11) ? 1 : 2;
      if (semester !== currentSemester) {
        currentSemester = semester;
        kbmCounter = 1; // Reset counter for new semester
      }
      
      const yearMonthKey = `${y}-${String(m + 1).padStart(2, '0')}`;
      const dayIndex = d - 1;
      
      const isSunday = current.getDay() === 0;
      
      if (!updatedData[yearMonthKey]) {
        updatedData[yearMonthKey] = Array(31).fill(null);
      }
      
      const existingCode = updatedData[yearMonthKey][dayIndex];
      
      if (isSunday) {
        updatedData[yearMonthKey][dayIndex] = 'LU';
      } else {
        // Cek apakah cell terisi agenda atau hari libur non-numerik (misal: MPLS, KTS, LHB, dll.)
        const isNumeric = existingCode && /^\d+$/.test(String(existingCode).trim());
        
        if (existingCode && !isNumeric) {
          // Lewati penomoran (geser otomatis) untuk hari beragenda khusus/libur
        } else {
          updatedData[yearMonthKey][dayIndex] = String(kbmCounter);
          kbmCounter++;
          countModified++;
        }
      }
      
      current.setDate(current.getDate() + 1);
    }
    
    setLocalData(updatedData);
    onShowNotification(`Berhasil menomori ${countModified} hari KBM Efektif secara otomatis (dimulai dari 1 untuk setiap semester)!`, 'success');
  };
  
  const academicYearMonths = Array.from({ length: 12 }, (_, i) => {
    const month = (i + 6) % 12;
    const year = startYear + Math.floor((i + 6) / 12);
    return { year, month }; // month is 0-indexed
  });

  const handleCellChange = (year: number, month: number, day: number, value: string) => {
    if (isReadOnly) return; // Prevent edits in read-only mode
    
    const yearMonthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
    const dayIndex = day - 1;

    setLocalData(prev => {
      const newData = { ...prev };
      if (!newData[yearMonthKey]) {
        newData[yearMonthKey] = Array(31).fill(null);
      }
      const newMonthData = [...newData[yearMonthKey]];
      newMonthData[dayIndex] = value.toUpperCase();
      newData[yearMonthKey] = newMonthData;
      return newData;
    });
  };

  const handleSaveCalendar = async () => {
    if (isReadOnly) return;
    setIsSaving(true);
    await onSave(localData);
    setIsSaving(false);
  };
  
  const handleSyncHolidays = async () => {
      if (isReadOnly) return;
      setIsSyncing(true);
      
      const newHolidays: Omit<Holiday, 'id'>[] = [];
      
      for (const yearMonthKey in localData) {
          if (yearMonthKey === '__descriptions__') continue;
          const [year, month] = yearMonthKey.split('-').map(Number);
          const dayContents = localData[yearMonthKey];
          
          dayContents.forEach((content: any, index: number) => {
              const day = index + 1;
              // FILTER UPDATE: Exclude 'LU' (Libur Umum/Minggu) from being synced to database
              if (content && HOLIDAY_CODES.includes(content) && content !== 'LU') {
                  const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const specificDescription = localData.__descriptions__?.[date] || HOLIDAY_DESCRIPTIONS_2025_2026[date];
                  const codeInfo = CALENDAR_CODES[content];
                  
                  newHolidays.push({
                      classId: "__SCHOOL_WIDE__",
                      date: date,
                      description: specificDescription || codeInfo.label,
                      type: codeInfo.type as Holiday['type'],
                  });
              }
          });
      }

      try {
          await onAddHoliday(newHolidays);
          onShowNotification(`${newHolidays.length} hari libur disinkronkan. Data duplikat akan diabaikan.`, 'success');
      } catch (e) {
          onShowNotification("Gagal menyinkronkan hari libur.", "error");
      } finally {
          setIsSyncing(false);
      }
  };

  const handleDescriptionChange = (date: string, description: string) => {
      setLocalData(prev => ({
          ...prev,
          __descriptions__: {
              ...(prev.__descriptions__ || {}),
              [date]: description
          }
      }));
  };

  const calendarMetrics = useMemo(() => {
    let ganjilKbm = 0;
    let genapKbm = 0;
    let ktsCount = 0;
    let mplsCount = 0;

    const ganjilMonths = ['07', '08', '09', '10', '11', '12'];
    const genapMonths = ['01', '02', '03', '04', '05', '06'];

    // Scan for startYear (Jul - Dec)
    ganjilMonths.forEach(m => {
      const key = `${startYear}-${m}`;
      const days = localData[key] || [];
      days.forEach((val: any) => {
        if (val) {
          const s = String(val).trim();
          if (/^\d+$/.test(s)) {
            ganjilKbm++;
          } else if (s === 'KTS') {
            ktsCount++;
          } else if (s === 'MPLS') {
            mplsCount++;
          }
        }
      });
    });

    // Scan for startYear + 1 (Jan - Jun)
    genapMonths.forEach(m => {
      const key = `${startYear + 1}-${m}`;
      const days = localData[key] || [];
      days.forEach((val: any) => {
        if (val) {
          const s = String(val).trim();
          if (/^\d+$/.test(s)) {
            genapKbm++;
          } else if (s === 'KTS') {
            ktsCount++;
          } else if (s === 'MPLS') {
            mplsCount++;
          }
        }
      });
    });

    return {
      ganjilKbm,
      genapKbm,
      ktsCount,
      mplsCount
    };
  }, [localData, startYear]);

  const holidayDates = useMemo(() => {
      const dates: { date: string, code: string, defaultDesc: string, customDesc?: string }[] = [];
      for (const yearMonthKey in localData) {
          if (yearMonthKey === '__descriptions__') continue;
          const [year, month] = yearMonthKey.split('-').map(Number);
          const dayContents = localData[yearMonthKey] as (string | null)[];
          if (!dayContents) continue;
          
          dayContents.forEach((content, index) => {
              const day = index + 1;
              if (content && HOLIDAY_CODES.includes(content) && content !== 'LU') {
                  const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  dates.push({
                      date,
                      code: content,
                      defaultDesc: HOLIDAY_DESCRIPTIONS_2025_2026[date] || CALENDAR_CODES[content]?.label || '',
                      customDesc: localData.__descriptions__?.[date]
                  });
              }
          });
      }
      return dates.sort((a, b) => a.date.localeCompare(b.date));
  }, [localData]);

  return (
    <div className="flex flex-col gap-6">
        <div className="w-full bg-white p-4 rounded-xl border border-gray-200 shadow-sm overflow-x-auto lg:overflow-x-visible">
            <div className="flex justify-between items-center mb-4 no-print">
                <div className="flex items-center gap-2">
                    <label htmlFor="year-select" className="font-bold text-gray-700">Tahun Ajaran:</label>
                    <select id="year-select" value={startYear} onChange={handleYearChange} className="p-2 border rounded-lg font-semibold">
                        {Array.from({ length: 40 }, (_, i) => 2020 + i).map(y => (
                            <option key={y} value={y}>{y}/{y+1}</option>
                        ))}
                    </select>
                </div>
                {isReadOnly && (
                    <div className="bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg border border-amber-200 text-xs font-bold flex items-center">
                        <Lock size={14} className="mr-1.5"/> Read Only (Global)
                    </div>
                )}
            </div>

            <table className="w-full border-collapse text-[9px] lg:text-[10px]">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="p-1 border text-left font-bold sm:w-24 min-w-[60px]">Bulan</th>
                        {Array.from({length: 31}, (_, i) => i + 1).map(day => (
                            <th key={day} className="p-0.5 border font-bold text-center min-w-[20px] max-w-[32px]">{day}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {academicYearMonths.map(({ year, month }) => {
                        const monthName = new Date(year, month).toLocaleString('id-ID', { month: 'long' });
                        const daysInMonth = new Date(year, month + 1, 0).getDate();
                        const yearMonthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
                        const monthData = localData[yearMonthKey] || [];

                        return (
                            <tr key={yearMonthKey}>
                                <td className="p-1 border font-bold bg-gray-50 uppercase">{monthName} {year}</td>
                                {Array.from({length: 31}, (_, i) => i + 1).map(day => {
                                    const isDisabled = day > daysInMonth;
                                    const content = monthData[day - 1] || '';
                                    const codeInfo = CALENDAR_CODES[content];
                                    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                    const specificDescription = localData.__descriptions__?.[dateString] || HOLIDAY_DESCRIPTIONS_2025_2026[dateString];
                                    let tooltipText = '';
                                    if (codeInfo) {
                                        tooltipText = specificDescription || codeInfo.label;
                                    }

                                    return (
                                        <td key={day} className={`p-0 border relative group ${isDisabled ? 'bg-gray-200' : ''}`} title={tooltipText}>
                                            {!isDisabled && (
                                                <>
                                                    <input
                                                        type="text"
                                                        value={content}
                                                        onChange={(e) => handleCellChange(year, month, day, e.target.value)}
                                                        onDoubleClick={() => {
                                                            if (isReadOnly || !codeInfo || content === 'LU') return;
                                                            setEditingDescription({
                                                                date: dateString,
                                                                code: content,
                                                                currentDesc: localData.__descriptions__?.[dateString] || '',
                                                                defaultDesc: HOLIDAY_DESCRIPTIONS_2025_2026[dateString] || codeInfo.label
                                                            });
                                                        }}
                                                        className={`w-full h-full text-center outline-none focus:ring-2 focus:ring-indigo-500 font-bold ${codeInfo ? codeInfo.color : 'bg-white text-gray-700'} ${isReadOnly ? 'cursor-not-allowed' : ''}`}
                                                        disabled={isReadOnly}
                                                    />
                                                    {codeInfo && content !== 'LU' && !isReadOnly && (
                                                        <div 
                                                            className="absolute -top-1 -right-1 bg-white rounded-full shadow cursor-pointer hidden group-hover:flex items-center justify-center border border-gray-300 p-0.5 z-10 w-4 h-4"
                                                            onClick={() => {
                                                                setEditingDescription({
                                                                    date: dateString,
                                                                    code: content,
                                                                    currentDesc: localData.__descriptions__?.[dateString] || '',
                                                                    defaultDesc: HOLIDAY_DESCRIPTIONS_2025_2026[dateString] || codeInfo.label
                                                                });
                                                            }}
                                                            title="Edit Keterangan"
                                                        >
                                                            <Edit2 size={10} className="text-indigo-600" />
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {/* Rekapitulasi Hari Efektif & Keterangan Tambahan */}
            <div className="mt-6 border-t border-gray-150 pt-5 font-sans">
                <div className="flex flex-col lg:flex-row gap-6 justify-between items-stretch">
                    {/* Sisi Kiri: Rekapitulasi Hari Efektif sesuai Gambar */}
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-sm max-w-md w-full flex flex-col justify-between">
                        <div>
                            <h4 className="text-sm font-bold text-slate-850 mb-3.5 flex items-center gap-2 uppercase tracking-wide">
                                <Info size={16} className="text-indigo-500" />
                                Rekapitulasi Hari Efektif
                            </h4>
                            <div className="space-y-3 text-xs text-slate-700 font-medium">
                                <div className="flex items-center justify-between border-b border-dashed border-slate-300 pb-2">
                                    <span>Hari efektif Semester Ganjil</span>
                                    <div className="flex items-center gap-1">
                                        <span className="font-bold text-slate-400">:</span>
                                        <div className="flex items-baseline gap-1 font-bold text-slate-900 w-24 justify-end">
                                            <span className="text-indigo-600 text-sm font-black">{calendarMetrics.ganjilKbm}</span>
                                            <span className="text-[10px] text-slate-500 font-normal">hari</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between border-b border-dashed border-slate-300 pb-2">
                                    <span>Hari efektif Semester Genap</span>
                                    <div className="flex items-center gap-1">
                                        <span className="font-bold text-slate-400">:</span>
                                        <div className="flex items-baseline gap-1 font-bold text-slate-900 w-24 justify-end">
                                            <span className="text-indigo-600 text-sm font-black">{calendarMetrics.genapKbm}</span>
                                            <span className="text-[10px] text-slate-500 font-normal">hari</span>
                                        </div>
                                    </div>
                                </div>
                                {calendarMetrics.ktsCount > 0 && (
                                    <div className="flex items-center justify-between border-b border-dashed border-slate-300 pb-2">
                                        <span>KTS</span>
                                        <div className="flex items-center gap-1">
                                            <span className="font-bold text-slate-400">:</span>
                                            <div className="flex items-baseline gap-1 font-bold text-slate-900 w-24 justify-end">
                                                <span className="text-purple-600 text-sm font-black">{calendarMetrics.ktsCount}</span>
                                                <span className="text-[10px] text-slate-500 font-normal">hari</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {calendarMetrics.mplsCount > 0 && (
                                    <div className="flex items-center justify-between border-b border-dashed border-slate-300 pb-2">
                                        <span>MPLS</span>
                                        <div className="flex items-center gap-1">
                                            <span className="font-bold text-slate-400">:</span>
                                            <div className="flex items-baseline gap-1 font-bold text-slate-900 w-24 justify-end">
                                                <span className="text-teal-600 text-sm font-black">{calendarMetrics.mplsCount}</span>
                                                <span className="text-[10px] text-slate-500 font-normal">hari</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="text-xs text-slate-600 font-bold italic mt-4 pt-1.5 flex items-start gap-1">
                            <span>* Libur Semester untuk murid</span>
                        </div>
                    </div>
                    
                    {/* Sisi Kanan: Agenda List untuk Kemudahan Peninjauan */}
                    <div className="flex-1 bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
                        <div>
                            <h4 className="text-xs font-bold text-gray-450 mb-3 uppercase tracking-wider">Rincian Hari Libur & Cuti Bersama Terdaftar</h4>
                            {holidayDates.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 max-h-40 overflow-y-auto pr-1">
                                    {holidayDates.slice(0, 14).map(({ date, code, defaultDesc, customDesc }) => {
                                        const d = new Date(date);
                                        const formattedDate = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
                                        const desc = customDesc || defaultDesc;
                                        const codeColor = CALENDAR_CODES[code]?.color || 'bg-gray-100 text-gray-700';
                                        return (
                                            <div key={date} className="flex items-center gap-2 text-[11px] border-b border-gray-50 pb-1">
                                                <span className={`px-1 rounded text-[9px] font-extrabold shrink-0 ${codeColor}`}>{code}</span>
                                                <span className="text-gray-400 font-mono shrink-0">{formattedDate}</span>
                                                <span className="text-gray-700 truncate font-semibold" title={desc}>{desc}</span>
                                            </div>
                                        );
                                    })}
                                    {holidayDates.length > 14 && (
                                        <div className="text-[10px] text-gray-400 italic col-span-2 pt-1 text-right">
                                            + {holidayDates.length - 14} hari libur lainnya terdaftar di tahun ajaran ini
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-xs text-gray-400 italic">Belum ada hari libur nasional atau cuti bersama yang dimasukkan.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div className="w-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 no-print">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                 <div className="flex justify-between items-center mb-3 border-b pb-2">
                    <h3 className="font-bold text-gray-800">Aksi Cepat</h3>
                    <button onClick={() => setIsActionsVisible(!isActionsVisible)} className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full" title={isActionsVisible ? "Sembunyikan" : "Tampilkan"}>
                        <X size={16} />
                    </button>
                 </div>
                 {isActionsVisible && (
                    <>
                        <div className="space-y-2">
                            {/* Hide Buttons if Read Only */}
                            {!isReadOnly ? (
                                <>
                                    <button onClick={handleSaveCalendar} disabled={isSaving} className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold px-4 py-2 rounded-lg shadow-md hover:bg-indigo-700 disabled:opacity-50 text-sm">
                                        {isSaving ? <Loader2 className="animate-spin"/> : <Save size={16}/>}
                                        {isSaving ? 'Menyimpan...' : 'Simpan Kalender'}
                                    </button>
                                    <button onClick={handleSyncHolidays} disabled={isSyncing} className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white font-bold px-4 py-2 rounded-lg shadow-md hover:bg-emerald-700 disabled:opacity-50 text-sm">
                                        {isSyncing ? <Loader2 className="animate-spin"/> : <RefreshCw size={16}/>}
                                        {isSyncing ? 'Menyinkronkan...' : 'Sinkronkan ke Atur Libur'}
                                    </button>
                                </>
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-xs text-gray-500 italic text-center">Anda hanya memiliki akses melihat kalender ini.</p>
                                    <button 
                                        onClick={handleExportJSONConfig}
                                        className="w-full flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold border border-blue-200 px-4 py-2 rounded-lg text-xs transition-colors shadow-sm"
                                        title="Ekspor seluruh settingan kalender aktif termasuk deskripsi hari libur ke file JSON"
                                    >
                                        <FileDown size={14} />
                                        Ekspor Settingan (.JSON)
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-xs text-amber-800 mt-4 flex items-start">
                            <AlertTriangle size={24} className="mr-2 shrink-0" />
                            <span>Kalender ini berlaku untuk semua kelas. Hanya Admin yang dapat mengubahnya.</span>
                        </div>
                    </>
                 )}
            </div>

            {!isReadOnly && (
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                    <div className="border-b pb-2">
                        <h3 className="font-bold text-gray-800 flex items-center gap-1.5">
                            <Zap size={16} className="text-amber-500" />
                            Unggah & Impor Kalender
                        </h3>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">
                        Masukkan kalender ajaran baru lewat Excel atau salinan teks liburan.
                    </p>
                    
                    <div className="space-y-2 pt-1 font-sans">
                        <button 
                            onClick={handleDownloadTemplate} 
                            className="w-full flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold border border-slate-300 px-3 py-2 rounded-lg text-xs transition-colors shadow-sm"
                        >
                            <FileDown size={14} />
                            Unduh Templat Excel
                        </button>
                        
                        <button 
                            onClick={() => fileInputRef.current?.click()} 
                            className="w-full flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-200 px-3 py-2 rounded-lg text-xs transition-colors shadow-sm"
                        >
                            <FileUp size={14} />
                            Unggah Excel / CSV
                        </button>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleImportExcel} 
                            accept=".xlsx, .xls, .csv" 
                            className="hidden" 
                        />

                        <button 
                            onClick={() => setShowTextImportModal(true)} 
                            className="w-full flex items-center justify-center gap-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 font-bold border border-indigo-300 px-3 py-2 rounded-lg text-xs transition-colors shadow-sm"
                            title="Salin dan tempel daftar hari libur dari file gambar kalender Anda"
                        >
                            <ClipboardList size={14} />
                            Tempel Teks (OCR Kalender)
                        </button>

                        <button 
                            onClick={handleAutoNumberDays} 
                            className="w-full flex items-center justify-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold border border-amber-200 px-3 py-2 rounded-lg text-xs transition-colors shadow-sm"
                            title="Mengisi hari belajar efektif secara otomatis (1, 2, 3...) untuk hari-hari non-libur"
                        >
                            <Zap size={14} className="text-amber-600 animate-pulse" />
                            Nomori Hari KBM Otomatis
                        </button>

                        <button 
                            onClick={handleAutoPopulateHolidays} 
                            className="w-full flex items-center justify-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-200 px-3 py-2 rounded-lg text-xs transition-colors shadow-sm mt-1"
                            title="Otomatis menandai hari Minggu sebagai libur umum (LU) dan memasukkan libur hari besar (LHB) serta cuti bersama (CB) untuk tahun ajaran aktif"
                        >
                            <Calendar size={14} className="text-rose-600" />
                            Otomatiskan Libur & Minggu
                        </button>

                        {/* Berbagi Konfigurasi Section */}
                        <div className="border-t pt-3 mt-3 space-y-2">
                            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                                <Share2 size={13} className="text-indigo-600" />
                                Setting Kalender Antar Sekolah
                            </h4>
                            <p className="text-[10px] text-gray-500 leading-relaxed">
                                Ekspor kalender Anda ke file <strong>.json</strong> untuk dibagikan. Sekolah lain cukup mengunggah file tersebut untuk menyalin seluruh agenda & libur secara instan.
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                <button 
                                    onClick={handleExportJSONConfig}
                                    className="flex items-center justify-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold border border-blue-200 px-2.5 py-2 rounded-lg text-xs transition-colors shadow-sm"
                                    title="Unduh seluruh konfigurasi kalender saat ini"
                                >
                                    <FileDown size={13} />
                                    Ekspor JSON
                                </button>
                                <button 
                                    onClick={() => jsonFileInputRef.current?.click()}
                                    className="flex items-center justify-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-200 px-2.5 py-2 rounded-lg text-xs transition-colors shadow-sm"
                                    title="Unggah file konfigurasi kalender (.json) dari sekolah lain"
                                >
                                    <FileUp size={13} />
                                    Impor JSON
                                </button>
                                <input 
                                    type="file" 
                                    ref={jsonFileInputRef} 
                                    onChange={handleImportJSONConfig} 
                                    accept=".json" 
                                    className="hidden" 
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center mb-3 border-b pb-2">
                    <h3 className="font-bold text-gray-800">Keterangan Kode</h3>
                     <button onClick={() => setIsLegendVisible(!isLegendVisible)} className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full" title={isLegendVisible ? "Sembunyikan" : "Tampilkan"}>
                        <X size={16} />
                     </button>
                </div>
                {isLegendVisible && (
                    <div className="space-y-2">
                        {Object.entries(CALENDAR_CODES).map(([code, {label, color}]) => (
                            <div key={code} className="flex items-center gap-2 text-xs">
                                <span className={`w-12 text-center font-bold p-1 rounded ${color}`}>{code}</span>
                                <span className="text-gray-600">{label}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>

        {editingDescription && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">
                    <h3 className="text-lg font-bold mb-4 text-gray-800">Edit Keterangan Libur</h3>
                    <div className="mb-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <p className="text-sm text-gray-600 mb-2 flex justify-between">
                            <span>Tanggal:</span>
                            <span className="font-semibold text-gray-800">{editingDescription.date}</span>
                        </p>
                        <p className="text-sm text-gray-600 flex justify-between items-center">
                            <span>Kode:</span>
                            <span className={`text-xs px-2 py-1 rounded-full font-bold ${CALENDAR_CODES[editingDescription.code]?.color || 'bg-gray-200 text-gray-700'}`}>
                                {editingDescription.code}
                            </span>
                        </p>
                    </div>
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Keterangan Khusus</label>
                        <input 
                            type="text" 
                            value={editingDescription.currentDesc} 
                            onChange={(e) => setEditingDescription({...editingDescription, currentDesc: e.target.value})}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            placeholder={editingDescription.defaultDesc}
                            autoFocus
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            Kosongkan untuk menggunakan keterangan default: <br/>
                            <span className="italic">{editingDescription.defaultDesc}</span>
                        </p>
                    </div>
                    <div className="flex justify-end gap-3">
                        <button 
                            onClick={() => setEditingDescription(null)}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                        >
                            Batal
                        </button>
                        <button 
                            onClick={() => {
                                handleDescriptionChange(editingDescription.date, editingDescription.currentDesc);
                                setEditingDescription(null);
                            }}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors shadow-sm"
                        >
                            Simpan Keterangan
                        </button>
                    </div>
                </div>
            </div>
        )}

        {showTextImportModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-lg">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <ClipboardList className="text-indigo-600" size={20} />
                            Membaca Kalender dari Salinan Teks (OCR / Gambar)
                        </h3>
                        <button onClick={() => setShowTextImportModal(false)} className="text-gray-400 hover:text-gray-600">
                            <X size={20} />
                        </button>
                    </div>
                    
                    <div className="mb-4 bg-indigo-50 border border-indigo-200 p-3 rounded-lg text-xs text-indigo-950 leading-relaxed flex gap-2">
                        <Info size={20} className="shrink-0 text-indigo-600 mt-0.5" />
                        <div>
                            <strong>Tips Mudah untuk Kalender Gambar/PDF:</strong><br />
                            Gunakan pemindai atau fitur salin teks (seperti Google Lens di HP, foto galeri iPhone/Android, atau snipping tool pembaca teks gambar) pada brosur/gambar kalender Anda. Salin tulisan hari libur tersebut lalu tempel di kotak di bawah ini!
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Pilih Kode Libur Default</label>
                        <select 
                            value={pastedCode} 
                            onChange={(e) => setPastedCode(e.target.value)}
                            className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white"
                        >
                            {Object.entries(CALENDAR_CODES).filter(([code]) => code !== 'LU').map(([code, { label }]) => (
                                <option key={code} value={code}>[{code}] {label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tempel Teks Daftar Hari Libur / Kegiatan</label>
                        <textarea 
                            value={pastedText} 
                            onChange={(e) => setPastedText(e.target.value)}
                            className="w-full h-44 p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                            placeholder={"Contoh salinan teks:\n17 Agustus 2026: Hari Kemerdekaan RI\n25 Desember 2026 - Hari Raya Natal\n1 Januari 2027: Tahun Baru Masehi"}
                        />
                        <p className="text-[10px] text-gray-500 mt-1 italic">
                            Sistem akan otomatis mendeteksi format tanggal bahasa Indonesia seperti "17 Agustus 2026" atau "17-08-2026" pada setiap baris tulisan.
                        </p>
                    </div>

                    <div className="flex justify-end gap-3">
                        <button 
                            onClick={() => setShowTextImportModal(false)}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors text-sm"
                        >
                            Batal
                        </button>
                        <button 
                            onClick={handleImportText}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors shadow-sm text-sm"
                            disabled={!pastedText.trim()}
                        >
                            Impor Sebagai Hari Libur / Kegiatan
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default AcademicCalendarTab;
