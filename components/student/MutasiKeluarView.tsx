import React, { useState } from 'react';
import { MutasiKeluarRecord, SchoolProfileData } from '../../types';
import { UserMinus, Printer, Trash2, Search } from 'lucide-react';
import { useModal } from '../../context/ModalContext';

interface MutasiKeluarViewProps {
  records: MutasiKeluarRecord[];
  onDeleteRecord: (id: string) => void;
  schoolProfile?: SchoolProfileData;
  onShowNotification: (msg: string, type: 'success' | 'error' | 'warning') => void;
  currentUser?: any;
}

export const MutasiKeluarView: React.FC<MutasiKeluarViewProps> = ({
  records,
  onDeleteRecord,
  schoolProfile,
  onShowNotification,
  currentUser
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { showConfirm } = useModal();

  const filteredRecords = records.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.nis.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.tujuanSekolah.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (id: string) => {
    showConfirm('Apakah Anda yakin ingin menghapus catatan mutasi keluar ini?', () => {
      onDeleteRecord(id);
      onShowNotification('Catatan mutasi keluar berhasil dihapus', 'success');
    }, 'Hapus Data Mutasi');
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const logoKiri = schoolProfile?.regencyLogo || '';
    const logoKanan = schoolProfile?.schoolLogo || '';

    const htmlContent = `
      <html>
        <head>
          <title>Buku Mutasi Keluar Siswa</title>
          <style>
            @page { size: A4 landscape; margin: 10mm; }
            body { font-family: Arial, sans-serif; font-size: 8pt; color: #000; margin: 0; padding: 10px; }
            .kop { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px double #000; padding-bottom: 8px; margin-bottom: 15px; }
            .kop img { width: 60px; height: 60px; object-fit: contain; }
            .kop-text { text-align: center; flex: 1; }
            .kop-text h3 { margin: 0; font-size: 11pt; font-weight: bold; text-transform: uppercase; }
            .kop-text h2 { margin: 2px 0; font-size: 13pt; font-weight: bold; text-transform: uppercase; }
            .kop-text p { margin: 2px 0 0; font-size: 8pt; }
            .title { text-align: center; margin-bottom: 15px; }
            .title h2 { margin: 0; font-size: 12pt; text-transform: uppercase; text-decoration: underline; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; table-layout: fixed; font-size: 8pt; }
            th, td { border: 1px solid #000; padding: 4px; vertical-align: middle; word-break: break-word; overflow-wrap: break-word; white-space: normal; font-size: 8pt; }
            th { background-color: #f2f2f2 !important; text-align: center !important; vertical-align: middle !important; font-weight: bold; -webkit-print-color-adjust: exact; text-transform: uppercase; }
            .text-center { text-align: center; }
            .signature { margin-top: 30px; display: flex; justify-content: space-between; font-size: 9pt; page-break-inside: avoid; line-height: 1.15; }
            .sig-box { width: 250px; text-align: center; line-height: 1.15; }
          </style>
        </head>
        <body>
          <div class="kop">
            <div>${logoKiri ? `<img src="${logoKiri}" />` : '<div style="width:60px;height:60px;border:1px solid #000;display:flex;align-items:center;justify-content:center;font-size:8px;">LOGO</div>'}</div>
            <div class="kop-text">
              <h3>PEMERINTAH KABUPATEN ${schoolProfile?.kabupaten?.toUpperCase() || 'TUBAN'}</h3>
              <h2>${schoolProfile?.name?.toUpperCase() || 'UPTD SATUAN PENDIDIKAN SDN'}</h2>
              <p>${schoolProfile?.address || ''} ${schoolProfile?.postalCode ? `• Kode Pos: ${schoolProfile.postalCode}` : ''}</p>
            </div>
            <div>${logoKanan ? `<img src="${logoKanan}" />` : '<div style="width:60px;"></div>'}</div>
          </div>

          <div class="title">
            <h2>BUKU MUTASI KELUAR SISWA</h2>
            <p>Tahun Ajaran: ${schoolProfile?.year || '2024/2025'}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th rowspan="2" style="width: 3%;">No</th>
                <th rowspan="2" style="width: 7%;">Tanggal<br/>Mutasi</th>
                <th rowspan="2" style="width: 8%;">NIS</th>
                <th rowspan="2" style="width: 13%;">Nama Siswa</th>
                <th rowspan="2" style="width: 4%;">L/P</th>
                <th rowspan="2" style="width: 12%;">Tempat & Tanggal Lahir</th>
                <th rowspan="2" style="width: 4%;">Kls</th>
                <th rowspan="2" style="width: 11%;">Nama Orang Tua</th>
                <th rowspan="2" style="width: 10%;">Alasan Mutasi</th>
                <th colspan="2">Mutasi ke</th>
                <th colspan="2">Surat Mutasi</th>
              </tr>
              <tr>
                <th style="width: 10%;">Nama Sekolah</th>
                <th style="width: 8%;">Kota/Kab/Prop.</th>
                <th style="width: 6%;">Nomor</th>
                <th style="width: 4%;">Tanggal</th>
              </tr>
            </thead>
            <tbody>
              ${records.length === 0 ? `<tr><td colspan="13" class="text-center" style="padding: 15px;">Belum ada data mutasi keluar.</td></tr>` : 
                records.map((r, idx) => `
                  <tr>
                    <td class="text-center">${idx + 1}</td>
                    <td class="text-center">${r.tanggalMutasi}</td>
                    <td class="text-center" style="font-family: monospace;">${r.nis}</td>
                    <td style="font-weight: bold;">${r.name}</td>
                    <td class="text-center">${r.gender}</td>
                    <td>${r.birthPlace}, ${r.birthDate}</td>
                    <td class="text-center font-bold">${r.classId}</td>
                    <td>${r.parentName}</td>
                    <td>${r.alasanMutasi}</td>
                    <td>${r.tujuanSekolah}</td>
                    <td>${r.tujuanKota}</td>
                    <td>${r.suratNomor || '-'}</td>
                    <td class="text-center">${r.suratTanggal || '-'}</td>
                  </tr>
                `).join('')}
            </tbody>
          </table>

          <div class="signature">
            <div class="sig-box">
              <p>Mengetahui,</p>
              <p style="font-weight: bold;">Kepala Sekolah</p>
              <br/><br/><br/>
              <p style="text-decoration: underline; font-weight: bold;">${schoolProfile?.headmaster || '...................................'}</p>
              <p>NIP. ${schoolProfile?.headmasterNip || '...................................'}</p>
            </div>
            <div class="sig-box">
              <p>${schoolProfile?.desa ? `${schoolProfile.desa}, ` : ''}${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <p style="font-weight: bold;">Pencatat / Staff Admin</p>
              <br/><br/><br/>
              <p style="text-decoration: underline; font-weight: bold;">${currentUser?.fullName || '...................................'}</p>
              <p>NIP. ${currentUser?.nip || '...................................'}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <UserMinus className="text-rose-600" /> Buku Mutasi Keluar Siswa
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Catatan siswa yang pindah keluar sekolah. Anda dapat melakukan mutasi siswa langsung dari menu Data Siswa.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-all"
          >
            <Printer size={16} /> Cetak Buku
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Cari nama siswa, NIS, atau sekolah tujuan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="text-sm font-semibold text-slate-500">
            Total: {records.length} Siswa Keluar
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3 text-center border-b">No</th>
                <th className="p-3 text-center border-b">Tgl Mutasi</th>
                <th className="p-3 text-center border-b">NIS</th>
                <th className="p-3 border-b">Nama Siswa</th>
                <th className="p-3 text-center border-b">L/P</th>
                <th className="p-3 border-b">Tempat, Tgl Lahir</th>
                <th className="p-3 text-center border-b">Kelas</th>
                <th className="p-3 border-b">Alasan Mutasi</th>
                <th className="p-3 border-b">Mutasi ke Sekolah</th>
                <th className="p-3 border-b">Surat Mutasi</th>
                <th className="p-3 text-center border-b">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-slate-400">
                    Belum ada data mutasi keluar. Lakukan mutasi siswa dari menu Data Siswa.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r, idx) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 text-center font-medium">{idx + 1}</td>
                    <td className="p-3 text-center">{r.tanggalMutasi}</td>
                    <td className="p-3 text-center font-mono">{r.nis}</td>
                    <td className="p-3 font-bold text-slate-800">{r.name}</td>
                    <td className="p-3 text-center font-bold">{r.gender}</td>
                    <td className="p-3">{r.birthPlace}, {r.birthDate}</td>
                    <td className="p-3 text-center font-bold bg-rose-50/50 text-rose-700">{r.classId}</td>
                    <td className="p-3">{r.alasanMutasi}</td>
                    <td className="p-3">
                      <div className="font-medium text-slate-800">{r.tujuanSekolah}</div>
                      <div className="text-slate-400 text-[11px]">{r.tujuanKota}</div>
                    </td>
                    <td className="p-3">
                      <div>No: {r.suratNomor || '-'}</div>
                      <div className="text-slate-400 text-[11px]">Tgl: {r.suratTanggal || '-'}</div>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Hapus"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
