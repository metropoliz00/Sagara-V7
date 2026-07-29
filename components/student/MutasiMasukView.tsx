import React, { useState } from 'react';
import { MutasiMasukRecord, Student, SchoolProfileData } from '../../types';
import { UserPlus, Printer, Plus, Trash2, Calendar, Search, X } from 'lucide-react';
import { useModal } from '../../context/ModalContext';

interface MutasiMasukViewProps {
  records: MutasiMasukRecord[];
  onAddRecord: (record: Omit<MutasiMasukRecord, 'id'>, studentData: Omit<Student, 'id'>) => void;
  onDeleteRecord: (id: string) => void;
  schoolProfile?: SchoolProfileData;
  onShowNotification: (msg: string, type: 'success' | 'error' | 'warning') => void;
  currentUser?: any;
}

export const MutasiMasukView: React.FC<MutasiMasukViewProps> = ({
  records,
  onAddRecord,
  onDeleteRecord,
  schoolProfile,
  onShowNotification,
  currentUser
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { showConfirm } = useModal();

  const [formData, setFormData] = useState({
    tanggalDiterima: new Date().toISOString().split('T')[0],
    nis: '',
    nisn: '',
    name: '',
    gender: 'L' as 'L' | 'P',
    birthPlace: '',
    birthDate: '',
    asalSekolahName: '',
    asalSekolahKota: '',
    parentName: '',
    classId: '1',
    suratNomor: '',
    suratTanggal: new Date().toISOString().split('T')[0]
  });

  const filteredRecords = records.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.nis.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.asalSekolahName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nis || !formData.name || !formData.birthPlace || !formData.birthDate || !formData.classId) {
      onShowNotification('Harap isi data wajib (NIS, Nama, Tempat/Tanggal Lahir, Kelas)!', 'warning');
      return;
    }

    const newRecord: Omit<MutasiMasukRecord, 'id'> = {
      tanggalDiterima: formData.tanggalDiterima,
      nis: formData.nis,
      nisn: formData.nisn,
      name: formData.name,
      gender: formData.gender,
      birthPlace: formData.birthPlace,
      birthDate: formData.birthDate,
      asalSekolahName: formData.asalSekolahName,
      asalSekolahKota: formData.asalSekolahKota,
      parentName: formData.parentName,
      classId: formData.classId,
      suratNomor: formData.suratNomor,
      suratTanggal: formData.suratTanggal
    };

    const studentData: Omit<Student, 'id'> = {
      classId: formData.classId,
      nis: formData.nis,
      nisn: formData.nisn,
      name: formData.name,
      gender: formData.gender,
      birthPlace: formData.birthPlace,
      birthDate: formData.birthDate,
      address: formData.asalSekolahKota ? `Eks ${formData.asalSekolahName}, ${formData.asalSekolahKota}` : '-',
      fatherName: formData.parentName,
      motherName: '-',
      parentName: formData.parentName,
      parentPhone: '-',
      behaviorScore: 100,
      attendance: { present: 0, sick: 0, permit: 0, alpha: 0 }
    };

    onAddRecord(newRecord, studentData);
    setIsModalOpen(false);
    onShowNotification('Siswa mutasi masuk berhasil ditambahkan ke sistem & data induk!', 'success');
    setFormData({
      tanggalDiterima: new Date().toISOString().split('T')[0],
      nis: '',
      nisn: '',
      name: '',
      gender: 'L',
      birthPlace: '',
      birthDate: '',
      asalSekolahName: '',
      asalSekolahKota: '',
      parentName: '',
      classId: '1',
      suratNomor: '',
      suratTanggal: new Date().toISOString().split('T')[0]
    });
  };

  const handleDelete = (id: string) => {
    showConfirm('Apakah Anda yakin ingin menghapus catatan mutasi masuk ini?', () => {
      onDeleteRecord(id);
      onShowNotification('Catatan mutasi berhasil dihapus', 'success');
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
          <title>Buku Mutasi Masuk Siswa</title>
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
            <h2>BUKU MUTASI MASUK SISWA</h2>
            <p>Tahun Ajaran: ${schoolProfile?.year || '2024/2025'}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th rowspan="2" style="width: 3%;">No</th>
                <th rowspan="2" style="width: 7%;">Tanggal<br/>Diterima</th>
                <th rowspan="2" style="width: 14%;">Nama Siswa</th>
                <th rowspan="2" style="width: 4%;">L/P</th>
                <th rowspan="2" style="width: 12%;">Tempat & Tanggal Lahir</th>
                <th colspan="2">Asal Sekolah</th>
                <th rowspan="2" style="width: 12%;">Nama Orang Tua</th>
                <th colspan="2">Diterima di</th>
                <th colspan="2">Surat Rekomendasi</th>
              </tr>
              <tr>
                <th style="width: 10%;">Nama Sekolah</th>
                <th style="width: 10%;">Kota/Kab/Prop.</th>
                <th style="width: 4%;">Kelas</th>
                <th style="width: 8%;">Nomor Induk</th>
                <th style="width: 8%;">Nomor</th>
                <th style="width: 8%;">Tanggal</th>
              </tr>
            </thead>
            <tbody>
              ${records.length === 0 ? `<tr><td colspan="12" class="text-center" style="padding: 15px;">Belum ada data mutasi masuk.</td></tr>` : 
                records.map((r, idx) => `
                  <tr>
                    <td class="text-center">${idx + 1}</td>
                    <td class="text-center">${r.tanggalDiterima}</td>
                    <td style="font-weight: bold;">${r.name}</td>
                    <td class="text-center">${r.gender}</td>
                    <td>${r.birthPlace}, ${r.birthDate}</td>
                    <td>${r.asalSekolahName}</td>
                    <td>${r.asalSekolahKota}</td>
                    <td>${r.parentName}</td>
                    <td class="text-center font-bold">${r.classId}</td>
                    <td class="text-center" style="font-family: monospace;">${r.nis}</td>
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
            <UserPlus className="text-indigo-600" /> Buku Mutasi Masuk Siswa
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Catatan siswa pindahan masuk. Data yang diinputkan akan otomatis terintegrasi ke Data Induk Siswa.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-all"
          >
            <Printer size={16} /> Cetak Buku
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-200 transition-all"
          >
            <Plus size={16} /> Tambah Mutasi Masuk
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Cari nama siswa, NIS, atau asal sekolah..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="text-sm font-semibold text-slate-500">
            Total: {records.length} Siswa Masuk
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3 text-center border-b">No</th>
                <th className="p-3 text-center border-b">Tgl Diterima</th>
                <th className="p-3 border-b">Nama Siswa & NIS</th>
                <th className="p-3 text-center border-b">L/P</th>
                <th className="p-3 border-b">Tempat, Tgl Lahir</th>
                <th className="p-3 border-b">Asal Sekolah</th>
                <th className="p-3 border-b">Orang Tua</th>
                <th className="p-3 text-center border-b">Kelas</th>
                <th className="p-3 border-b">Surat Rekomendasi</th>
                <th className="p-3 text-center border-b">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">
                    Belum ada data mutasi masuk. Klik "Tambah Mutasi Masuk" untuk memasukkan data.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r, idx) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 text-center font-medium">{idx + 1}</td>
                    <td className="p-3 text-center">{r.tanggalDiterima}</td>
                    <td className="p-3">
                      <div className="font-bold text-slate-800">{r.name}</div>
                      <div className="font-mono text-slate-400 text-[11px]">NIS: {r.nis} {r.nisn ? `• NISN: ${r.nisn}` : ''}</div>
                    </td>
                    <td className="p-3 text-center font-bold">{r.gender}</td>
                    <td className="p-3">{r.birthPlace}, {r.birthDate}</td>
                    <td className="p-3">
                      <div className="font-medium text-slate-800">{r.asalSekolahName}</div>
                      <div className="text-slate-400 text-[11px]">{r.asalSekolahKota}</div>
                    </td>
                    <td className="p-3">{r.parentName || '-'}</td>
                    <td className="p-3 text-center font-bold bg-indigo-50/50 text-indigo-700">{r.classId}</td>
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

      {/* Modal Tambah Mutasi Masuk */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-indigo-600 text-white p-5 flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <UserPlus size={20} /> Form Input Mutasi Masuk Siswa
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tanggal Diterima *</label>
                  <input
                    type="date"
                    value={formData.tanggalDiterima}
                    onChange={(e) => setFormData({...formData, tanggalDiterima: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-medium focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Diterima di Kelas *</label>
                  <select
                    value={formData.classId}
                    onChange={(e) => setFormData({...formData, classId: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-medium focus:border-indigo-500 focus:outline-none"
                    required
                  >
                    <option value="1">Kelas 1</option>
                    <option value="2">Kelas 2</option>
                    <option value="3">Kelas 3</option>
                    <option value="4">Kelas 4</option>
                    <option value="5">Kelas 5</option>
                    <option value="6">Kelas 6</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nomor Induk Siswa (NIS) *</label>
                  <input
                    type="text"
                    placeholder="Nomor Induk Siswa (NIS)"
                    value={formData.nis}
                    onChange={(e) => setFormData({...formData, nis: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-medium focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">NISN</label>
                  <input
                    type="text"
                    placeholder="NISN"
                    value={formData.nisn}
                    onChange={(e) => setFormData({...formData, nisn: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-medium focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nama Lengkap Siswa *</label>
                <input
                  type="text"
                  placeholder="Nama Lengkap Siswa"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-medium focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Jenis Kelamin *</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({...formData, gender: e.target.value as 'L' | 'P'})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-medium focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tempat Lahir *</label>
                  <input
                    type="text"
                    placeholder="Tempat Lahir"
                    value={formData.birthPlace}
                    onChange={(e) => setFormData({...formData, birthPlace: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-medium focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tanggal Lahir *</label>
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-medium focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nama Sekolah Asal *</label>
                  <input
                    type="text"
                    placeholder="Nama Sekolah Asal"
                    value={formData.asalSekolahName}
                    onChange={(e) => setFormData({...formData, asalSekolahName: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-medium focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Kota / Kabupaten / Propinsi Asal *</label>
                  <input
                    type="text"
                    placeholder="Kota / Kabupaten / Propinsi Asal"
                    value={formData.asalSekolahKota}
                    onChange={(e) => setFormData({...formData, asalSekolahKota: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-medium focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nama Orang Tua / Wali *</label>
                <input
                  type="text"
                  placeholder="Nama Orang Tua / Wali"
                  value={formData.parentName}
                  onChange={(e) => setFormData({...formData, parentName: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-medium focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nomor Surat Rekomendasi Pindahan</label>
                  <input
                    type="text"
                    placeholder="Nomor Surat Rekomendasi Pindahan"
                    value={formData.suratNomor}
                    onChange={(e) => setFormData({...formData, suratNomor: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-medium focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tanggal Surat Rekomendasi</label>
                  <input
                    type="date"
                    value={formData.suratTanggal}
                    onChange={(e) => setFormData({...formData, suratTanggal: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-medium focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-200 transition-all"
                >
                  Simpan & Masukkan ke Data Siswa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
