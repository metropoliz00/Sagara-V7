import React from "react";
import { FinanceTransaction } from "../types";

interface PrintLaporanKeuanganProps {
  selectedMonth: string; // Format: "YYYY-MM"
  records: FinanceTransaction[];
  tempatLaporan: string;
  tanggalLaporan: string;
  bendahara: { name: string; nip: string };
  ketuaKkg: { name: string; nip: string };
  ketuaGugus: { name: string; nip: string };
}

export default function PrintLaporanKeuangan({
  selectedMonth,
  records,
  tempatLaporan,
  tanggalLaporan,
  bendahara,
  ketuaKkg,
  ketuaGugus,
}: PrintLaporanKeuanganProps) {
  if (!selectedMonth) return null;

  // Parsing month and year to localized Indonesian
  const [yearStr, monthStr] = selectedMonth.split("-");
  const monthNamesId = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  const monthIdx = parseInt(monthStr, 10) - 1;
  const monthName = monthNamesId[monthIdx] || "";
  const formatPeriod = `${monthName} ${yearStr}`;

  // Filter transactions
  // 1. Transactions before selected month (Saldo Awal)
  const previousTransactions = records.filter((r) => r.date < `${selectedMonth}-01`);
  const totalPrevIncome = previousTransactions.reduce((sum, r) => sum + (Number(r.income) || 0), 0);
  const totalPrevExpense = previousTransactions.reduce((sum, r) => sum + (Number(r.expense) || 0), 0);
  const saldoAwal = totalPrevIncome - totalPrevExpense;

  // 2. Transactions in selected month (sorted ascending for chronological statement)
  const currentMonthTransactions = records
    .filter((r) => r.date.startsWith(selectedMonth))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Calculate totals of current month
  const currentMonthIncome = currentMonthTransactions.reduce((sum, r) => sum + (Number(r.income) || 0), 0);
  const currentMonthExpense = currentMonthTransactions.reduce((sum, r) => sum + (Number(r.expense) || 0), 0);
  const saldoAkhir = saldoAwal + currentMonthIncome - currentMonthExpense;

  const formatCurrency = (val: number) => {
    const isNegative = val < 0;
    const absValue = Math.abs(val);
    const formatted = new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: 0,
    }).format(absValue);
    return `${isNegative ? "-" : ""}Rp. ${formatted}`;
  };

  const formatDateId = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta", day: "numeric", month: "short", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  let cumulativeBalance = saldoAwal;

  return (
    <div
      className="bg-white p-12 rounded-[2rem] shadow-xl border border-gray-100 print:shadow-none print:border-none print:p-0 w-full"
      id="print-area-keuangan"
    >
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 1cm 1cm 1cm 1cm;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Hide everything first */
          body * {
            visibility: hidden;
            background-color: transparent !important;
          }
          /* Show only print-area-keuangan and its descendants */
          #print-area-keuangan, #print-area-keuangan * {
            visibility: visible;
          }
          #print-area-keuangan {
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
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* KOP - Double Border & Official Logos */}
      <div className="flex items-center justify-between border-b-4 border-double border-black pb-2 mb-4 mt-0">
        <img
          src="https://www.image2url.com/r2/default/images/1778851343355-1a6a088b-6728-48ec-b530-6f16d372b2ee.png"
          className="w-16 h-16 object-contain"
          alt="Logo Kemendikdasmen"
        />
        <div className="text-center flex-1 px-4">
          <h1 className="text-sm font-bold font-serif leading-tight">KELOMPOK KERJA GURU ( KKG )</h1>
          <h2 className="text-base font-black font-serif leading-tight">GUGUS 03 “MELATI”</h2>
          <p className="text-[10px] font-bold font-serif leading-tight uppercase">KECAMATAN JENU KABUPATEN TUBAN</p>
        </div>
        <img
          src="https://www.image2url.com/r2/default/images/1778156189287-e4930eb4-3c36-4ace-8420-ca8908132e66.png"
          className="w-16 h-16 object-contain"
          alt="Logo KKG"
        />
      </div>

      {/* Document Header */}
      <div className="text-center mb-4 pt-0 mt-0">
        <h3 className="text-sm font-bold uppercase tracking-wider">
          LAPORAN KEUANGAN
        </h3>
        <p className="text-xs font-semibold text-gray-700 uppercase tracking-widest mt-0.5">
          PERIODE: {formatPeriod}
        </p>
      </div>

      {/* Transaction Table */}
      <div className="overflow-x-auto mb-6">
        <table className="w-full text-xs border-collapse border border-black text-left">
          <thead>
            <tr className="bg-gray-100 print:bg-gray-150 text-black border border-black font-bold uppercase text-[10px] tracking-wider">
              <th className="border border-black px-2.5 py-1.5 text-center w-8">No</th>
              <th className="border border-black px-2.5 py-1.5 text-center w-28">Tanggal</th>
              <th className="border border-black px-3 py-1.5 text-center">Uraian / Keterangan Kegiatan</th>
              <th className="border border-black px-2.5 py-1.5 text-center w-32">Pemasukan (Debit)</th>
              <th className="border border-black px-2.5 py-1.5 text-center w-32">Pengeluaran (Kredit)</th>
              <th className="border border-black px-2.5 py-1.5 text-center w-32">Saldo</th>
            </tr>
          </thead>
          <tbody>
            {/* Saldo Awal Row */}
            <tr className="bg-gray-50/50 font-semibold text-gray-750">
              <td className="border border-black px-2.5 py-1.5 text-center">-</td>
              <td className="border border-black px-2.5 py-1.5 text-center text-[11px]">
                {formatDateId(`${selectedMonth}-01`)}
              </td>
              <td className="border border-black px-3 py-1.5 italic text-gray-650 text-[11px]">
                Saldo Awal
              </td>
              <td className="border border-black px-2.5 py-1.5 text-right">-</td>
              <td className="border border-black px-2.5 py-1.5 text-right">-</td>
              <td className="border border-black px-2.5 py-1.5 text-right font-mono font-bold">
                {formatCurrency(saldoAwal)}
              </td>
            </tr>

            {currentMonthTransactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="border border-black px-3 py-4 text-center text-gray-405 italic">
                  Tidak ada transaksi di periode {formatPeriod}
                </td>
              </tr>
            ) : (
              currentMonthTransactions.map((r, index) => {
                cumulativeBalance += (Number(r.income) || 0) - (Number(r.expense) || 0);
                return (
                  <tr key={r.id} className="text-black">
                    <td className="border border-black px-2.5 py-1.5 text-center">{index + 1}</td>
                    <td className="border border-black px-2.5 py-1.5 text-center whitespace-nowrap text-[11px]">
                      {formatDateId(r.date)}
                    </td>
                    <td className="border border-black px-3 py-1.5 font-medium">
                      {r.activity_name}
                    </td>
                    <td className="border border-black px-2.5 py-1.5 text-right font-mono">
                      {r.income > 0 ? formatCurrency(r.income) : "-"}
                    </td>
                    <td className="border border-black px-2.5 py-1.5 text-right font-mono text-red-600 print:text-black">
                      {r.expense > 0 ? formatCurrency(r.expense) : "-"}
                    </td>
                    <td className="border border-black px-2.5 py-1.5 text-right font-mono font-bold">
                      {formatCurrency(cumulativeBalance)}
                    </td>
                  </tr>
                );
              })
            )}

            {/* Total Row */}
            <tr className="bg-gray-100 print:bg-gray-200 font-bold border-t-2 border-black">
              <td colSpan={3} className="border border-black px-3 py-1.5 text-right uppercase">
                Jumlah Mutasi Bulanan
              </td>
              <td className="border border-black px-2.5 py-1.5 text-right font-mono">
                {formatCurrency(currentMonthIncome)}
              </td>
              <td className="border border-black px-2.5 py-1.5 text-right font-mono">
                {formatCurrency(currentMonthExpense)}
              </td>
              <td className="border border-black px-2.5 py-1.5 text-right font-mono bg-gray-50/50">
                -
              </td>
            </tr>

            {/* Saldo Akhir Summary Row */}
            <tr className="bg-emerald-50/10 print:bg-gray-150 font-black border-t-2 border-black text-[12px]">
              <td colSpan={5} className="border border-black px-3 py-2 text-right uppercase text-emerald-800 print:text-black">
                Saldo Akhir per {formatPeriod}
              </td>
              <td className="border border-black px-2.5 py-2 text-right font-mono text-emerald-800 print:text-black">
                {formatCurrency(saldoAkhir)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Signature Section - exact layout requested */}
      <div className="mt-4 text-black text-xs">
        {/* Row 1: Left (Ketua KKG) and Right (Tempat, Tanggal + Bendahara) */}
        <div className="grid grid-cols-2 gap-8 text-center pb-4">
          <div>
            <p className="font-bold">Mengetahui,</p>
            <p className="font-bold text-gray-800 font-heading">Ketua KKG Gugus 03 Melati</p>
            <div className="h-16" /> {/* Spacer for physical signature */}
            <p className="font-bold underline">{ketuaKkg.name || "[Nama Ketua KKG]"}</p>
            <p className="text-xs text-gray-650">
              NIP. {ketuaKkg.nip || "____________________"}
            </p>
          </div>

          <div>
            <p className="font-semibold text-gray-805">
              {tempatLaporan}, {tanggalLaporan}
            </p>
            <p className="font-bold text-gray-808 font-heading">Bendahara KKG Gugus 03 Melati</p>
            <div className="h-16" /> {/* Spacer for physical signature */}
            <p className="font-bold underline">{bendahara.name || "[Nama Bendahara]"}</p>
            <p className="text-xs text-gray-650">
              NIP. {bendahara.nip || "____________________"}
            </p>
          </div>
        </div>

        {/* Row 2: Tengah bawah (Mengetahui, Ketua Gugus) */}
        <div className="flex justify-center text-center mt-2">
          <div className="w-1/2">
            <p className="font-bold">Mengetahui,</p>
            <p className="font-bold text-gray-800">Ketua Gugus 03 Melati</p>
            <div className="h-16" /> {/* Spacer for physical signature */}
            <p className="font-bold underline">{ketuaGugus.name || "[Nama Ketua Gugus]"}</p>
            <p className="text-xs text-gray-600">
              NIP. {ketuaGugus.nip || "____________________"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
