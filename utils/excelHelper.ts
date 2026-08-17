import * as XLSX from 'xlsx';
import { formatDateID, getTimeWithZone } from './dateUtils';

export interface GroupHeaderConfig {
  title: string;
  startIndex: number;
  endIndex: number;
}

export interface ExcelExportOptions {
  title: string;
  subtitle?: string | string[];
  filename: string;
  sheetName?: string;
  headers: string[];
  data: (string | number | boolean | null | undefined)[][] | Record<string, any>[];
  currentUser?: { fullName?: string; username?: string; role?: string } | null;
  isTemplate?: boolean;
  notes?: string;
  columnWidths?: number[];
  groupHeaders?: GroupHeaderConfig[];
}

/**
 * Mendapatkan nama dan peran pengguna yang saat ini sedang login
 */
export const getCurrentUserInfo = (user?: { fullName?: string; username?: string; role?: string } | null): { name: string; role: string } => {
  if (user && (user.fullName || user.username)) {
    return {
      name: user.fullName || user.username || 'Pengguna',
      role: user.role || 'Staff'
    };
  }

  try {
    const saved = localStorage.getItem('sagara_user');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        name: parsed.fullName || parsed.username || 'Pengguna',
        role: parsed.role || 'Staff'
      };
    }
  } catch (e) {
    // Ignore JSON parse error
  }

  return { name: 'Pengguna', role: 'Staff' };
};

/**
 * Menghitung lebar kolom optimal berdasarkan panjang karakter di setiap kolom.
 * Mengabaikan baris judul/metadata di atas agar kolom pertama tidak menjadi terlalu lebar.
 */
export const calculateAutoColumnWidths = (
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][],
  defaultMinWidth = 6,
  padding = 3
): { wch: number }[] => {
  const numCols = headers.length;
  const colWidths: number[] = new Array(numCols).fill(0);

  for (let colIdx = 0; colIdx < numCols; colIdx++) {
    const len = headers[colIdx] ? String(headers[colIdx]).length : 0;
    if (len > colWidths[colIdx]) {
      colWidths[colIdx] = len;
    }
  }

  // 2. Periksa panjang isi data baris
  rows.forEach(row => {
    if (!Array.isArray(row)) return;
    row.forEach((cell, colIdx) => {
      if (colIdx < numCols) {
        if (cell !== null && cell !== undefined) {
          // Tangani string multiline
          const strVal = String(cell);
          const lines = strVal.split('\n');
          const maxLineLen = Math.max(...lines.map(l => l.length));
          if (maxLineLen > colWidths[colIdx]) {
            colWidths[colIdx] = maxLineLen;
          }
        }
      }
    });
  });

  // 3. Tambahkan padding dan batasi batas maksimum
  return colWidths.map((w) => {
    const calculated = w + padding;
    return { wch: Math.max(4, Math.min(calculated, 80)) };
  });
};

/**
 * Menghasilkan file Excel lengkap dengan Judul, Tanggal & Jam, Nama Pengunduh,
 * serta penyesuaian lebar kolom otomatis.
 */
export const exportToExcelWithHeader = (options: ExcelExportOptions): void => {
  const {
    title,
    subtitle,
    filename,
    sheetName = 'Data',
    headers,
    data,
    currentUser,
    isTemplate = false,
    notes,
    columnWidths: customWidths
  } = options;

  const now = new Date();
  const dateStr = formatDateID(now.toISOString().split('T')[0]);
  const timeStr = getTimeWithZone(now);
  const userInfo = getCurrentUserInfo(currentUser);

  // Ubah data object array menjadi array 2 dimensi jika diperlukan
  let rowsArray: (string | number | boolean | null | undefined)[][] = [];
  if (data.length > 0 && typeof data[0] === 'object' && !Array.isArray(data[0])) {
    rowsArray = (data as Record<string, any>[]).map(rowObj => {
      return headers.map(header => {
        if (rowObj[header] !== undefined) return rowObj[header];
        const lowerH = header.toLowerCase();
        const foundKey = Object.keys(rowObj).find(k => k.toLowerCase() === lowerH);
        return foundKey ? rowObj[foundKey] : '';
      });
    });
  } else {
    rowsArray = data as (string | number | boolean | null | undefined)[][];
  }

  // Susun baris-baris worksheet (AOA - Array of Arrays)
  const aoa: any[][] = [];

  // Baris 1: Judul Utama
  const mainTitle = isTemplate ? `TEMPLATE: ${title.toUpperCase()}` : title.toUpperCase();
  const titleRow = new Array(headers.length).fill('');
  titleRow[0] = mainTitle; // Mulai di kolom A (indeks 0)
  aoa.push(titleRow);

  // Baris 2: Metadata Pengunduhan (Tanggal, Jam, dan Nama Pengunduh)
  const metaText = `Diunduh pada: ${dateStr}, Pukul: ${timeStr} | Oleh: ${userInfo.name} (${userInfo.role.toUpperCase()})`;
  const metaRow = new Array(headers.length).fill('');
  metaRow[0] = metaText; // Mulai di kolom A (indeks 0)
  aoa.push(metaRow);

  // Baris 3: Subtitle atau Informasi Tambahan jika ada
  let subtitleRowIndex = -1;
  if (subtitle) {
    subtitleRowIndex = aoa.length;
    const subRow = new Array(headers.length).fill('');
    subRow[0] = Array.isArray(subtitle) ? subtitle.join(' | ') : subtitle;
    aoa.push(subRow);
  }

  // Baris Catatan / Catatan Pengisian Template jika ada
  if (notes) {
    const notesRow = new Array(headers.length).fill('');
    notesRow[0] = `Catatan: ${notes}`;
    aoa.push(notesRow);
  }

  // Baris Kosong sebagai pemisah sebelum tabel
  aoa.push([]);

  const headerStartRow = aoa.length;
  const { groupHeaders } = options;

  let worksheet: XLSX.WorkSheet;

  if (groupHeaders && groupHeaders.length > 0) {
    const row1Headers = new Array(headers.length).fill('');
    const row2Headers = new Array(headers.length).fill('');
    const merges: XLSX.Range[] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: headers.length - 1 } }
    ];
    if (subtitle) {
      merges.push({ s: { r: subtitleRowIndex, c: 0 }, e: { r: subtitleRowIndex, c: headers.length - 1 } });
    }
    if (notes) {
      const notesIdx = subtitleRowIndex !== -1 ? subtitleRowIndex + 1 : 2;
      merges.push({ s: { r: notesIdx, c: 0 }, e: { r: notesIdx, c: headers.length - 1 } });
    }

    headers.forEach((h, idx) => {
      const group = groupHeaders.find(g => idx >= g.startIndex && idx <= g.endIndex);
      if (group) {
        if (idx === group.startIndex) {
          row1Headers[idx] = group.title;
        } else {
          row1Headers[idx] = '';
        }
        let sub = h;
        if (h.includes(' - ')) {
          sub = h.split(' - ').slice(1).join(' - ');
        }
        row2Headers[idx] = sub;
      } else {
        row1Headers[idx] = h;
        row2Headers[idx] = '';
        merges.push({
          s: { r: headerStartRow, c: idx },
          e: { r: headerStartRow + 1, c: idx }
        });
      }
    });

    groupHeaders.forEach(group => {
      merges.push({
        s: { r: headerStartRow, c: group.startIndex },
        e: { r: headerStartRow, c: group.endIndex }
      });
    });

    aoa.push(row1Headers);
    aoa.push(row2Headers);

    rowsArray.forEach(row => {
      aoa.push(row);
    });

    worksheet = XLSX.utils.aoa_to_sheet(aoa);
    worksheet['!merges'] = merges;
  } else {
    // Baris Header Tabel Standar (1 baris)
    aoa.push(headers);
    rowsArray.forEach(row => {
      aoa.push(row);
    });
    worksheet = XLSX.utils.aoa_to_sheet(aoa);
    const merges: XLSX.Range[] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: headers.length - 1 } }
    ];
    if (subtitle) {
      merges.push({ s: { r: subtitleRowIndex, c: 0 }, e: { r: subtitleRowIndex, c: headers.length - 1 } });
    }
    if (notes) {
      const notesIdx = subtitleRowIndex !== -1 ? subtitleRowIndex + 1 : 2;
      merges.push({ s: { r: notesIdx, c: 0 }, e: { r: notesIdx, c: headers.length - 1 } });
    }
    worksheet['!merges'] = merges;
  }

  // Terapkan lebar kolom otomatis
  if (customWidths && customWidths.length === headers.length) {
    worksheet['!cols'] = customWidths.map(w => ({ wch: w }));
  } else {
    worksheet['!cols'] = calculateAutoColumnWidths(headers, rowsArray);
  }

  // Styling 셀 (Cell styles) menggunakan xlsx cell styling properties
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  
  const borderStyle = {
    top: { style: 'thin', color: { rgb: '000000' } },
    bottom: { style: 'thin', color: { rgb: '000000' } },
    left: { style: 'thin', color: { rgb: '000000' } },
    right: { style: 'thin', color: { rgb: '000000' } }
  };

  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      if (!worksheet[cellAddress]) continue;

      if (!worksheet[cellAddress].s) {
        worksheet[cellAddress].s = {};
      }

      // 1. Judul Utama (Baris 0)
      if (R === 0) {
        worksheet[cellAddress].s = {
          font: { bold: true, sz: 14, color: { rgb: '1F2937' } },
          alignment: { horizontal: 'center', vertical: 'center' }
        };
      }
      // 2. Info Pengunduh / Metadata (Baris 1)
      else if (R === 1) {
        worksheet[cellAddress].s = {
          font: { bold: true, sz: 10, color: { rgb: '4B5563' } },
          alignment: { horizontal: 'center', vertical: 'center' }
        };
      }
      // 3. Subtitle / Notes jika ada
      else if (R === subtitleRowIndex || (notes && R === subtitleRowIndex + 1)) {
        worksheet[cellAddress].s = {
          font: { italic: true, sz: 10, color: { rgb: '4B5563' } },
          alignment: { horizontal: 'center', vertical: 'center' }
        };
      }
      // 4. Header Tabel (Header Start Row ke bawah sampai akhir header rows)
      else if (R >= headerStartRow && R <= (groupHeaders && groupHeaders.length > 0 ? headerStartRow + 1 : headerStartRow)) {
        worksheet[cellAddress].s = {
          font: { bold: true, sz: 11, color: { rgb: '000000' } },
          alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
          fill: { fgColor: { rgb: 'E5E7EB' } },
          border: borderStyle
        };
      }
      // 5. Baris Data (Data rows) - tanpa styling bold khusus, hanya border
      else if (R > (groupHeaders && groupHeaders.length > 0 ? headerStartRow + 1 : headerStartRow)) {
        worksheet[cellAddress].s = {
          border: borderStyle
        };
      }
    }
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));

  // Pastikan ekstensi .xlsx
  const safeFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  XLSX.writeFile(workbook, safeFilename);
};

/**
 * Helper untuk membaca file Excel yang diunggah dan secara cerdas mencari baris header tabel
 * (mengakomodasi file dengan baris judul di atas maupun file tabel langsung).
 */
export const parseExcelWithHeaders = (
  worksheet: XLSX.WorkSheet,
  expectedHeaderKeywords: string[] = []
): { headers: string[]; rows: Record<string, any>[] } => {
  const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  if (!rawRows || rawRows.length === 0) {
    return { headers: [], rows: [] };
  }

  // Cari baris yang kemungkinan merupakan baris header tabel
  let headerRowIndex = 0;

  if (expectedHeaderKeywords.length > 0) {
    const lowerKeywords = expectedHeaderKeywords.map(k => k.toLowerCase().trim());
    for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
      const row = rawRows[i];
      if (Array.isArray(row) && row.length > 0) {
        const matches = row.filter(cell => {
          if (!cell) return false;
          const str = String(cell).toLowerCase().trim();
          return lowerKeywords.some(kw => str.includes(kw) || kw.includes(str));
        });
        if (matches.length >= Math.min(2, expectedHeaderKeywords.length)) {
          headerRowIndex = i;
          break;
        }
      }
    }
  } else {
    for (let i = 0; i < Math.min(rawRows.length, 6); i++) {
      const row = rawRows[i];
      if (Array.isArray(row) && row.filter(c => c !== null && c !== undefined && String(c).trim() !== '').length > 1) {
        headerRowIndex = i;
        break;
      }
    }
  }

  let actualHeaderRow = (rawRows[headerRowIndex] || []).map(cell => String(cell || '').trim());
  let dataStartIndex = headerRowIndex + 1;

  // Cek apakah ada baris group header tepat di atas headerRowIndex (2-row grouped headers)
  if (headerRowIndex > 0) {
    const prevRow = rawRows[headerRowIndex - 1];
    if (Array.isArray(prevRow)) {
      const hasGroupHeader = prevRow.some(c => {
        const s = String(c || '').toLowerCase();
        return s.includes('data ayah') || s.includes('data ibu') || s.includes('data wali');
      });
      if (hasGroupHeader) {
        let currentGroup = '';
        actualHeaderRow = actualHeaderRow.map((subHeader, colIdx) => {
          for (let c = colIdx; c >= 0; c--) {
            const val = prevRow[c] ? String(prevRow[c]).trim() : '';
            if (val && (val.toLowerCase().includes('data ayah') || val.toLowerCase().includes('data ibu') || val.toLowerCase().includes('data wali'))) {
              currentGroup = val;
              break;
            }
          }
          if (currentGroup && subHeader && !subHeader.toLowerCase().includes('data ayah') && !subHeader.toLowerCase().includes('data ibu') && !subHeader.toLowerCase().includes('data wali')) {
            return `${currentGroup} - ${subHeader}`;
          }
          return subHeader;
        });
      }
    }
  }

  const headerRow = actualHeaderRow;
  const dataRows = rawRows.slice(dataStartIndex);

  const resultRows: Record<string, any>[] = [];
  dataRows.forEach(row => {
    if (!Array.isArray(row) || row.every(c => c === null || c === undefined || String(c).trim() === '')) {
      return; // lewati baris kosong
    }
    const rowObj: Record<string, any> = {};
    headerRow.forEach((colName, colIdx) => {
      if (colName) {
        rowObj[colName] = row[colIdx] !== undefined ? row[colIdx] : '';
      }
    });
    resultRows.push(rowObj);
  });

  return { headers: headerRow, rows: resultRows };
};
