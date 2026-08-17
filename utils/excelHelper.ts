import * as XLSX from 'xlsx';
import { formatDateID, getTimeWithZone } from './dateUtils';

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
  defaultMinWidth = 12,
  padding = 4
): { wch: number }[] => {
  const numCols = headers.length;
  const colWidths: number[] = new Array(numCols);
  const isNumColFlags: boolean[] = new Array(numCols);

  for (let colIdx = 0; colIdx < numCols; colIdx++) {
    const h = headers[colIdx] ? String(headers[colIdx]).toLowerCase().trim() : '';
    const isNumberCol = h === 'no' || h === 'no.' || h === 'nomor' || h === '#' || h === 'no urut';
    isNumColFlags[colIdx] = isNumberCol;
    const colMinWidth = isNumberCol ? 5 : defaultMinWidth;
    colWidths[colIdx] = colMinWidth;

    // 1. Periksa panjang header
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
  return colWidths.map((w, colIdx) => {
    const isNumberCol = isNumColFlags[colIdx];
    const colMinWidth = isNumberCol ? 5 : defaultMinWidth;
    const calculated = w + padding;
    return { wch: Math.max(colMinWidth, Math.min(calculated, 80)) };
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
  aoa.push([mainTitle]);

  // Baris 2: Metadata Pengunduhan (Tanggal, Jam, dan Nama Pengunduh)
  const metaText = `Diunduh pada: ${dateStr}, Pukul: ${timeStr} | Oleh: ${userInfo.name} (${userInfo.role.toUpperCase()})`;
  aoa.push([metaText]);

  // Baris 3: Subtitle atau Informasi Tambahan jika ada
  if (subtitle) {
    if (Array.isArray(subtitle)) {
      aoa.push([subtitle.join(' | ')]);
    } else {
      aoa.push([subtitle]);
    }
  }

  // Baris Catatan / Catatan Pengisian Template jika ada
  if (notes) {
    aoa.push([`Catatan: ${notes}`]);
  }

  // Baris Kosong sebagai pemisah sebelum tabel
  aoa.push([]);

  // Baris Header Tabel
  aoa.push(headers);

  // Baris Data / Contoh
  rowsArray.forEach(row => {
    aoa.push(row);
  });

  // Buat worksheet dan workbook
  const worksheet = XLSX.utils.aoa_to_sheet(aoa);

  // Terapkan lebar kolom otomatis
  if (customWidths && customWidths.length === headers.length) {
    worksheet['!cols'] = customWidths.map(w => ({ wch: w }));
  } else {
    worksheet['!cols'] = calculateAutoColumnWidths(headers, rowsArray);
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
    // Jika tidak ada kata kunci khusus, cari baris pertama yang memiliki lebih dari 1 kolom teks
    for (let i = 0; i < Math.min(rawRows.length, 6); i++) {
      const row = rawRows[i];
      if (Array.isArray(row) && row.filter(c => c !== null && c !== undefined && String(c).trim() !== '').length > 1) {
        headerRowIndex = i;
        break;
      }
    }
  }

  const headerRow = (rawRows[headerRowIndex] || []).map(cell => String(cell || '').trim());
  const dataRows = rawRows.slice(headerRowIndex + 1);

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
