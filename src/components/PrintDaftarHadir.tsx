import React from "react";

interface PrintDaftarHadirProps {
  selectedActivity: {
    title: string;
    date_start: string;
  } | null;
  participants: Array<{
    profile?: {
      nama?: string;
      nip?: string;
      jabatan?: string;
      sekolah?: string;
    };
  }>;
  chairman: {
    name?: string;
    nip?: string;
  } | null;
}

export default function PrintDaftarHadir({ selectedActivity, participants, chairman }: PrintDaftarHadirProps) {
  if (!selectedActivity) return null;

  const formatName = (name: string | undefined | null) => {
    return name || "-";
  };

  const getJabatanRank = (jabatanRaw?: string): number => {
    if (!jabatanRaw) return 5;
    const j = jabatanRaw.trim().toLowerCase();

    // Rank 1: Pejabat Dinas Pendidikan
    if (
      j.includes("pejabat dinas") ||
      j.includes("dinas pendidikan") ||
      j.includes("pejabat dinas pendidikan") ||
      j.includes("pejabat")
    ) {
      return 1;
    }

    // Rank 2: Pengawas
    if (j.includes("pengawas")) {
      return 2;
    }

    // Rank 3: Narasumber
    if (j.includes("narasumber") || j.includes("pemateri")) {
      return 3;
    }

    // Rank 4: Kepala Sekolah
    if (
      j.includes("kepala sekolah") ||
      j.includes("kepala sd") ||
      j.includes("kepsek") ||
      j === "ks"
    ) {
      return 4;
    }

    // Rank 5: selanjutnya sesuai dengan urutan masuk absennya
    return 5;
  };

  const sortedParticipants = React.useMemo(() => {
    if (!participants || participants.length === 0) return [];

    return [...participants]
      .map((item, originalIndex) => ({ item, originalIndex }))
      .sort((a, b) => {
        const jabatanA = a.item.profile?.jabatan || "";
        const jabatanB = b.item.profile?.jabatan || "";

        const rankA = getJabatanRank(jabatanA);
        const rankB = getJabatanRank(jabatanB);

        if (rankA !== rankB) {
          return rankA - rankB;
        }

        // Within same rank, sort by attendance time / original arrival order
        const timeA = (a.item as any).attended_at || (a.item as any).created_at;
        const timeB = (b.item as any).attended_at || (b.item as any).created_at;

        if (timeA && timeB) {
          const tA = new Date(timeA).getTime();
          const tB = new Date(timeB).getTime();
          if (!isNaN(tA) && !isNaN(tB) && tA !== tB) {
            return tA - tB;
          }
        }

        return a.originalIndex - b.originalIndex;
      })
      .map((wrapper) => wrapper.item);
  }, [participants]);

  return (
    <div className="bg-white p-12 rounded-[3rem] shadow-xl border border-gray-100 print:shadow-none print:border-none print:p-0 w-full" id="print-area">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 5mm;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Reset ancestor styling to prevent pushing down or cropping */
          body *:has(#print-area) {
            margin: 0 !important;
            padding: 0 !important;
            position: static !important;
            display: block !important;
            height: auto !important;
            width: auto !important;
            box-shadow: none !important;
            border: none !important;
            background: transparent !important;
          }
          /* Hide all elements during print */
          body * {
            visibility: hidden;
          }
          /* Show only the print area and its contents */
          #print-area, #print-area * {
            visibility: visible !important;
          }
          #print-area {
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
            display: block !important;
          }
          .no-print, .print\:hidden {
            display: none !important;
          }
          #print-kop-surat {
            margin-top: 0 !important;
            padding-top: 0 !important;
          }
          /* Background colors for print */
          .print-bg-emerald {
            background-color: #ecfdf5 !important;
            color: #047857 !important;
          }
        }
      `}</style>

      {/* KOP - Visible on screen and in print */}
      <div id="print-kop-surat" className="flex items-center justify-between border-b-4 border-double border-black pb-4 mb-6 mt-0">
        <img 
          src="https://www.image2url.com/r2/default/images/1778851343355-1a6a088b-6728-48ec-b530-6f16d372b2ee.png" 
          className="w-24 h-24 object-contain" 
          alt="Logo Kemendikdasmen" 
        />
        <div className="text-center flex-1 px-4">
          <h1 className="text-xl font-bold font-serif leading-tight">KELOMPOK KERJA GURU ( KKG )</h1>
          <h2 className="text-2xl font-black font-serif leading-tight">GUGUS 03 “MELATI”</h2>
          <p className="text-sm font-bold font-serif">KECAMATAN JENU KABUPATEN TUBAN</p>
        </div>
        <img 
          src="https://www.image2url.com/r2/default/images/1778156189287-e4930eb4-3c36-4ace-8420-ca8908132e66.png" 
          className="w-24 h-24 object-contain" 
          alt="Logo KKG" 
        />
      </div>

      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold uppercase underline mb-2 decoration-2 underline-offset-4">Rekap Daftar Hadir</h2>
        <p className="text-xl font-bold text-soft-black mb-1">{selectedActivity.title}</p>
        <p className="text-sm font-medium text-gray-500">
          Hari, Tanggal: {new Date(selectedActivity.date_start).toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta", weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      <table className="w-full border-collapse border-2 border-black text-[11px] sm:text-xs">
        <thead>
          <tr className="bg-gray-100 print:bg-gray-100 font-bold uppercase tracking-wider">
            <th className="border-2 border-black px-2 py-3 w-[4%] text-center">No</th>
            <th className="border-2 border-black px-3 py-2 text-center w-[30%] whitespace-normal">Nama</th>
            <th className="border-2 border-black px-3 py-2 text-center w-[18%]">NIP</th>
            <th className="border-2 border-black px-3 py-2 text-center w-[12%]">Jabatan</th>
            <th className="border-2 border-black px-3 py-2 text-center w-[16%] whitespace-normal">Instansi</th>
            <th className="border-2 border-black px-2 py-2 text-center w-[8%]">Kehadiran</th>
            <th className="border-2 border-black px-2 py-2 text-center w-[12%]">Tanda Tangan</th>
          </tr>
        </thead>
        <tbody>
          {sortedParticipants.length === 0 ? (
            <tr>
              <td colSpan={7} className="border-2 border-black px-4 py-12 text-center italic text-gray-400">Belum ada participant yang hadir</td>
            </tr>
          ) : (
            sortedParticipants.map((p, idx) => {
              const profile = p.profile;
              const nama = profile?.nama || "";
              const rowNum = idx + 1;
              const isGanjil = rowNum % 2 !== 0;

              return (
                <tr key={idx} className="hover:bg-gray-50 print:hover:bg-transparent transition-colors">
                  <td className="border-2 border-black px-2 py-2.5 text-center font-bold">{rowNum}</td>
                  <td className={`border-2 border-black px-3 py-2.5 font-bold text-soft-black leading-tight break-words ${nama.length > 35 ? "text-[8px]" : nama.length > 25 ? "text-[9px]" : "text-[10px]"}`}>
                    {formatName(nama)}
                  </td>
                  <td className={`border-2 border-black px-3 py-2.5 font-mono leading-tight ${profile?.nip && profile.nip.length > 18 ? "text-[8px]" : "text-[9px]"}`}>
                    {profile?.nip || "-"}
                  </td>
                  <td className={`border-2 border-black px-3 py-2.5 leading-tight ${profile?.jabatan && profile.jabatan.length > 20 ? "text-[8px]" : "text-[9px]"}`}>
                    {profile?.jabatan || "-"}
                  </td>
                  <td className={`border-2 border-black px-3 py-2.5 leading-tight ${profile?.sekolah && profile.sekolah.length > 25 ? "text-[8px]" : "text-[9px]"}`}>
                    {profile?.sekolah || "-"}
                  </td>
                  <td className="border-2 border-black px-2 py-2.5 text-center">
                    <span className="px-2 py-1 bg-emerald-50 text-emerald-700 print:bg-emerald-50 print:print-bg-emerald rounded-full font-bold uppercase text-[8px]">Hadir</span>
                  </td>
                  <td className="border-2 border-black px-2 py-2.5 h-12 relative min-w-[100px]">
                    <span 
                      className={`text-[10px] text-gray-500 font-mono absolute top-2 ${
                        isGanjil ? "left-2 text-left" : "left-1/2 -translate-x-1/2 text-center"
                      }`}
                    >
                      {rowNum}.
                    </span>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      <div className="mt-12 flex justify-end">
        <div className="text-center w-72">
          <p className="text-sm italic mb-2">Jenu, {new Date().toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta", year: "numeric", month: "long", day: "numeric" })}</p>
          <p className="text-sm font-bold mb-20 uppercase tracking-wide">Ketua KKG,</p>
          <p className="text-sm font-bold underline underline-offset-4 leading-none mb-1">{formatName(chairman?.name) || "......................................"}</p>
          <p className="text-sm font-bold">NIP. {chairman?.nip || "....................................."}</p>
        </div>
      </div>
    </div>
  );
}
