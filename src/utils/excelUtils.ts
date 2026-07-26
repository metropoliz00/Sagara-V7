import * as XLSX from 'xlsx';

export const exportToExcel = (
  data: any[],
  fileName: string,
  sheetName: string,
  columns: { key: string; header: string; width: number }[],
  currentUser: { fullName: string } | null
) => {
  // Add metadata
  const timestamp = new Date().toLocaleString();
  const userName = currentUser?.fullName || 'Anonim';
  
  const metadata = [
    ['Laporan', sheetName],
    ['Diunduh oleh', userName],
    ['Waktu Unduh', timestamp],
    [], // Empty row
  ];

  // Prepare data
  const headers = columns.map(col => col.header);
  const rows = data.map(item => columns.map(col => item[col.key] || ''));
  
  const worksheetData = [...metadata, headers, ...rows];
  
  const ws = XLSX.utils.aoa_to_sheet(worksheetData);

  // Set column widths
  ws['!cols'] = columns.map(col => ({ wch: col.width }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${fileName}.xlsx`);
};
