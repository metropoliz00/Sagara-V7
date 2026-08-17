import React from 'react';
import { Student } from '../../types';

interface BiodataTabProps {
  student: Student;
  onChange: (field: keyof Student, value: any) => void;
}

const BiodataTab: React.FC<BiodataTabProps> = ({ student, onChange }) => {
  return (
    <div className="space-y-6 animate-fade-in">
        <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Identitas Utama Siswa</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nama Lengkap *</label>
                <input type="text" value={student.name} onChange={(e) => onChange('name', e.target.value.toUpperCase())} className="w-full border p-2 rounded focus:ring-2 focus:ring-[#5AB2FF] outline-none uppercase font-medium" />
            </div>
            <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Jenis Kelamin (JK) *</label>
                <select value={student.gender} onChange={(e) => onChange('gender', e.target.value)} className="w-full border p-2 rounded focus:ring-2 focus:ring-[#5AB2FF] outline-none">
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                </select>
            </div>
            <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">NIS *</label>
                <input type="text" value={student.nis} onChange={(e) => onChange('nis', e.target.value)} className="w-full border p-2 rounded focus:ring-2 focus:ring-[#5AB2FF] outline-none font-mono" />
            </div>
            <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">NISN</label>
                <input type="text" value={student.nisn || ''} onChange={(e) => onChange('nisn', e.target.value)} className="w-full border p-2 rounded focus:ring-2 focus:ring-[#5AB2FF] outline-none font-mono" placeholder="-" />
            </div>
            <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">NIK</label>
                <input type="text" value={student.nik || ''} onChange={(e) => onChange('nik', e.target.value)} className="w-full border p-2 rounded focus:ring-2 focus:ring-[#5AB2FF] outline-none font-mono" placeholder="16 digit NIK" />
            </div>
            <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">No. KK</label>
                <input type="text" value={student.noKk || ''} onChange={(e) => onChange('noKk', e.target.value)} className="w-full border p-2 rounded focus:ring-2 focus:ring-[#5AB2FF] outline-none font-mono" placeholder="16 digit No. KK" />
            </div>
            <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Tempat Lahir</label>
                <input type="text" value={student.birthPlace || ''} onChange={(e) => onChange('birthPlace', e.target.value)} className="w-full border p-2 rounded focus:ring-2 focus:ring-[#5AB2FF] outline-none" />
            </div>
            <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Tanggal Lahir</label>
                <input type="date" value={student.birthDate || ''} onChange={(e) => onChange('birthDate', e.target.value)} className="w-full border p-2 rounded focus:ring-2 focus:ring-[#5AB2FF] outline-none" />
            </div>
            <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Agama</label>
                <select value={student.religion || 'Islam'} onChange={(e) => onChange('religion', e.target.value)} className="w-full border p-2 rounded focus:ring-2 focus:ring-[#5AB2FF] outline-none">
                    <option value="Islam">Islam</option>
                    <option value="Kristen">Kristen</option>
                    <option value="Katolik">Katolik</option>
                    <option value="Hindu">Hindu</option>
                    <option value="Buddha">Buddha</option>
                    <option value="Konghucu">Konghucu</option>
                </select>
            </div>
            <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Rombel Saat Ini (Kelas)</label>
                <input type="text" value={student.rombel || student.classId || ''} onChange={(e) => { onChange('rombel', e.target.value); onChange('classId', e.target.value); }} className="w-full border p-2 rounded focus:ring-2 focus:ring-[#5AB2FF] outline-none font-medium" />
            </div>
            <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Anak Ke-berapa</label>
                <input type="text" value={student.anakKe || ''} onChange={(e) => onChange('anakKe', e.target.value)} className="w-full border p-2 rounded focus:ring-2 focus:ring-[#5AB2FF] outline-none" placeholder="1" />
            </div>
            <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Jml. Saudara Kandung</label>
                <input type="number" value={student.jmlSaudaraKandung || 0} onChange={(e) => onChange('jmlSaudaraKandung', Number(e.target.value))} className="w-full border p-2 rounded focus:ring-2 focus:ring-[#5AB2FF] outline-none" />
            </div>
            <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Sekolah Asal</label>
                <input type="text" value={student.sekolahAsal || ''} onChange={(e) => onChange('sekolahAsal', e.target.value)} className="w-full border p-2 rounded focus:ring-2 focus:ring-[#5AB2FF] outline-none" placeholder="TK / RA / SD Asal" />
            </div>
            <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">No. Registrasi Akta Lahir</label>
                <input type="text" value={student.noRegistrasiAktaLahir || ''} onChange={(e) => onChange('noRegistrasiAktaLahir', e.target.value)} className="w-full border p-2 rounded focus:ring-2 focus:ring-[#5AB2FF] outline-none" />
            </div>
            <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Kebutuhan Khusus</label>
                <input type="text" value={student.kebutuhanKhusus || ''} onChange={(e) => onChange('kebutuhanKhusus', e.target.value)} className="w-full border p-2 rounded focus:ring-2 focus:ring-[#5AB2FF] outline-none" placeholder="Tidak ada" />
            </div>
        </div>

        {/* ALAMAT & KONTAK */}
        <h3 className="text-lg font-bold text-gray-800 border-b pb-2 pt-2">Alamat & Kontak</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="md:col-span-2 lg:col-span-4">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Alamat Lengkap Jalan</label>
                <input type="text" value={student.address || ''} onChange={(e) => onChange('address', e.target.value)} className="w-full border p-2 rounded focus:ring-2 focus:ring-[#5AB2FF] outline-none" placeholder="Jl. Raya ..." />
            </div>
            <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">RT</label>
                <input type="text" value={student.rt || ''} onChange={(e) => onChange('rt', e.target.value)} className="w-full border p-2 rounded focus:ring-2 focus:ring-[#5AB2FF] outline-none" placeholder="001" />
            </div>
            <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">RW</label>
                <input type="text" value={student.rw || ''} onChange={(e) => onChange('rw', e.target.value)} className="w-full border p-2 rounded focus:ring-2 focus:ring-[#5AB2FF] outline-none" placeholder="002" />
            </div>
            <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Dusun</label>
                <input type="text" value={student.dusun || ''} onChange={(e) => onChange('dusun', e.target.value)} className="w-full border p-2 rounded focus:ring-2 focus:ring-[#5AB2FF] outline-none" placeholder="Dusun" />
            </div>
            <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Kelurahan / Desa</label>
                <input type="text" value={student.kelurahan || ''} onChange={(e) => onChange('kelurahan', e.target.value)} className="w-full border p-2 rounded focus:ring-2 focus:ring-[#5AB2FF] outline-none" placeholder="Kelurahan" />
            </div>
            <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Kecamatan</label>
                <input type="text" value={student.kecamatan || ''} onChange={(e) => onChange('kecamatan', e.target.value)} className="w-full border p-2 rounded focus:ring-2 focus:ring-[#5AB2FF] outline-none" placeholder="Kecamatan" />
            </div>
            <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Kode Pos</label>
                <input type="text" value={student.kodePos || ''} onChange={(e) => onChange('kodePos', e.target.value)} className="w-full border p-2 rounded focus:ring-2 focus:ring-[#5AB2FF] outline-none" placeholder="62356" />
            </div>
            <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Jenis Tinggal</label>
                <input type="text" value={student.jenisTinggal || ''} onChange={(e) => onChange('jenisTinggal', e.target.value)} className="w-full border p-2 rounded focus:ring-2 focus:ring-[#5AB2FF] outline-none" placeholder="Bersama orang tua / Asrama / Kost" />
            </div>
            <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Alat Transportasi</label>
                <input type="text" value={student.alatTransportasi || ''} onChange={(e) => onChange('alatTransportasi', e.target.value)} className="w-full border p-2 rounded focus:ring-2 focus:ring-[#5AB2FF] outline-none" placeholder="Jalan kaki / Sepeda / Motor" />
            </div>
            <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Telepon Rumah</label>
                <input type="text" value={student.telepon || ''} onChange={(e) => onChange('telepon', e.target.value)} className="w-full border p-2 rounded focus:ring-2 focus:ring-[#5AB2FF] outline-none" placeholder="-" />
            </div>
            <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">HP / WhatsApp</label>
                <input type="text" value={student.hp || student.parentPhone || ''} onChange={(e) => { onChange('hp', e.target.value); onChange('parentPhone', e.target.value); }} className="w-full border p-2 rounded focus:ring-2 focus:ring-[#5AB2FF] outline-none font-mono" placeholder="08..." />
            </div>
            <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">E-Mail Siswa / Ortu</label>
                <input type="email" value={student.email || ''} onChange={(e) => onChange('email', e.target.value)} className="w-full border p-2 rounded focus:ring-2 focus:ring-[#5AB2FF] outline-none" placeholder="email@gmail.com" />
            </div>
            <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Jarak Rumah ke Sekolah (KM)</label>
                <input type="number" step="0.1" value={student.jarakRumahKm || 0} onChange={(e) => onChange('jarakRumahKm', Number(e.target.value))} className="w-full border p-2 rounded focus:ring-2 focus:ring-[#5AB2FF] outline-none" />
            </div>
            <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Lintang (Latitude)</label>
                <input type="text" value={student.lintang || ''} onChange={(e) => onChange('lintang', e.target.value)} className="w-full border p-2 rounded focus:ring-2 focus:ring-[#5AB2FF] outline-none" placeholder="-6.89..." />
            </div>
            <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Bujur (Longitude)</label>
                <input type="text" value={student.bujur || ''} onChange={(e) => onChange('bujur', e.target.value)} className="w-full border p-2 rounded focus:ring-2 focus:ring-[#5AB2FF] outline-none" placeholder="112.05..." />
            </div>
        </div>

        {/* DATA ORANG TUA (AYAH & IBU) */}
        <h3 className="text-lg font-bold text-gray-800 border-b pb-2 pt-2">Data Orang Tua Kandung</h3>
        
        {/* Data Ayah */}
        <div className="bg-sky-50/50 p-4 rounded-xl border border-sky-100">
            <h4 className="font-bold text-sky-800 text-sm mb-3">A. Data Ayah</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Nama Ayah</label>
                    <input type="text" value={student.fatherName || ''} onChange={(e) => onChange('fatherName', e.target.value.toUpperCase())} className="w-full border p-2 rounded bg-white focus:ring-2 focus:ring-[#5AB2FF] outline-none uppercase font-medium" />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">NIK Ayah</label>
                    <input type="text" value={student.fatherNik || ''} onChange={(e) => onChange('fatherNik', e.target.value)} className="w-full border p-2 rounded bg-white focus:ring-2 focus:ring-[#5AB2FF] outline-none font-mono" placeholder="16 digit NIK" />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Tahun Lahir Ayah</label>
                    <input type="text" value={student.fatherBirthYear || ''} onChange={(e) => onChange('fatherBirthYear', e.target.value)} className="w-full border p-2 rounded bg-white focus:ring-2 focus:ring-[#5AB2FF] outline-none" placeholder="1980" />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Jenjang Pendidikan Ayah</label>
                    <input type="text" value={student.fatherEducation || ''} onChange={(e) => onChange('fatherEducation', e.target.value)} className="w-full border p-2 rounded bg-white focus:ring-2 focus:ring-[#5AB2FF] outline-none" placeholder="SMA / S1 / SMP / SD" />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Pekerjaan Ayah</label>
                    <input type="text" value={student.fatherJob || ''} onChange={(e) => onChange('fatherJob', e.target.value)} className="w-full border p-2 rounded bg-white focus:ring-2 focus:ring-[#5AB2FF] outline-none" placeholder="Wiraswasta / Petani / PNS" />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Penghasilan Ayah</label>
                    <input type="text" value={student.fatherIncome || ''} onChange={(e) => onChange('fatherIncome', e.target.value)} className="w-full border p-2 rounded bg-white focus:ring-2 focus:ring-[#5AB2FF] outline-none" placeholder="Rp 1.000.000 - Rp 2.000.000" />
                </div>
            </div>
        </div>

        {/* Data Ibu */}
        <div className="bg-pink-50/50 p-4 rounded-xl border border-pink-100">
            <h4 className="font-bold text-pink-800 text-sm mb-3">B. Data Ibu</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Nama Ibu</label>
                    <input type="text" value={student.motherName || ''} onChange={(e) => onChange('motherName', e.target.value.toUpperCase())} className="w-full border p-2 rounded bg-white focus:ring-2 focus:ring-[#5AB2FF] outline-none uppercase font-medium" />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">NIK Ibu</label>
                    <input type="text" value={student.motherNik || ''} onChange={(e) => onChange('motherNik', e.target.value)} className="w-full border p-2 rounded bg-white focus:ring-2 focus:ring-[#5AB2FF] outline-none font-mono" placeholder="16 digit NIK" />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Tahun Lahir Ibu</label>
                    <input type="text" value={student.motherBirthYear || ''} onChange={(e) => onChange('motherBirthYear', e.target.value)} className="w-full border p-2 rounded bg-white focus:ring-2 focus:ring-[#5AB2FF] outline-none" placeholder="1985" />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Jenjang Pendidikan Ibu</label>
                    <input type="text" value={student.motherEducation || ''} onChange={(e) => onChange('motherEducation', e.target.value)} className="w-full border p-2 rounded bg-white focus:ring-2 focus:ring-[#5AB2FF] outline-none" placeholder="SMA / S1 / SMP / SD" />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Pekerjaan Ibu</label>
                    <input type="text" value={student.motherJob || ''} onChange={(e) => onChange('motherJob', e.target.value)} className="w-full border p-2 rounded bg-white focus:ring-2 focus:ring-[#5AB2FF] outline-none" placeholder="Ibu Rumah Tangga / PNS / Pedagang" />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Penghasilan Ibu</label>
                    <input type="text" value={student.motherIncome || ''} onChange={(e) => onChange('motherIncome', e.target.value)} className="w-full border p-2 rounded bg-white focus:ring-2 focus:ring-[#5AB2FF] outline-none" placeholder="Tidak Berpenghasilan / Rp ..." />
                </div>
            </div>
        </div>

        {/* DATA WALI */}
        <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100">
            <h4 className="font-bold text-amber-800 text-sm mb-3">C. Data Wali (Jika Ada)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Nama Wali</label>
                    <input type="text" value={student.parentName || ''} onChange={(e) => onChange('parentName', e.target.value.toUpperCase())} className="w-full border p-2 rounded bg-white focus:ring-2 focus:ring-[#5AB2FF] outline-none uppercase" />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">NIK Wali</label>
                    <input type="text" value={student.guardianNik || ''} onChange={(e) => onChange('guardianNik', e.target.value)} className="w-full border p-2 rounded bg-white focus:ring-2 focus:ring-[#5AB2FF] outline-none font-mono" />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Tahun Lahir Wali</label>
                    <input type="text" value={student.guardianBirthYear || ''} onChange={(e) => onChange('guardianBirthYear', e.target.value)} className="w-full border p-2 rounded bg-white focus:ring-2 focus:ring-[#5AB2FF] outline-none" />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Jenjang Pendidikan Wali</label>
                    <input type="text" value={student.guardianEducation || ''} onChange={(e) => onChange('guardianEducation', e.target.value)} className="w-full border p-2 rounded bg-white focus:ring-2 focus:ring-[#5AB2FF] outline-none" />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Pekerjaan Wali</label>
                    <input type="text" value={student.parentJob || ''} onChange={(e) => onChange('parentJob', e.target.value)} className="w-full border p-2 rounded bg-white focus:ring-2 focus:ring-[#5AB2FF] outline-none" />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Penghasilan Wali</label>
                    <input type="text" value={student.guardianIncome || ''} onChange={(e) => onChange('guardianIncome', e.target.value)} className="w-full border p-2 rounded bg-white focus:ring-2 focus:ring-[#5AB2FF] outline-none" />
                </div>
            </div>
        </div>

        {/* REGISTRASI & UJIAN / PIP / KIP / BANK */}
        <h3 className="text-lg font-bold text-gray-800 border-b pb-2 pt-2">Registrasi, Bantuan & Data Rekening Bank</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">No. Peserta Ujian Nasional</label>
                <input type="text" value={student.noUjianNasional || ''} onChange={(e) => onChange('noUjianNasional', e.target.value)} className="w-full border p-2 rounded focus:ring-2 focus:ring-[#5AB2FF] outline-none font-mono" />
            </div>
            <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">No. Seri Ijazah</label>
                <input type="text" value={student.noSeriIjazah || ''} onChange={(e) => onChange('noSeriIjazah', e.target.value)} className="w-full border p-2 rounded focus:ring-2 focus:ring-[#5AB2FF] outline-none font-mono" />
            </div>
            <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">SKHUN</label>
                <input type="text" value={student.skhun || ''} onChange={(e) => onChange('skhun', e.target.value)} className="w-full border p-2 rounded focus:ring-2 focus:ring-[#5AB2FF] outline-none" />
            </div>

            <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Penerima KPS</label>
                <select value={student.penerimaKps || 'Tidak'} onChange={(e) => onChange('penerimaKps', e.target.value)} className="w-full border p-2 rounded focus:ring-2 focus:ring-[#5AB2FF] outline-none">
                    <option value="Ya">Ya</option>
                    <option value="Tidak">Tidak</option>
                </select>
            </div>
            <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">No. KPS</label>
                <input type="text" value={student.noKps || ''} onChange={(e) => onChange('noKps', e.target.value)} className="w-full border p-2 rounded focus:ring-2 focus:ring-[#5AB2FF] outline-none" />
            </div>
            <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nomor KKS</label>
                <input type="text" value={student.nomorKks || ''} onChange={(e) => onChange('nomorKks', e.target.value)} className="w-full border p-2 rounded focus:ring-2 focus:ring-[#5AB2FF] outline-none" />
            </div>

            <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Penerima KIP</label>
                <select value={student.penerimaKip || 'Tidak'} onChange={(e) => onChange('penerimaKip', e.target.value)} className="w-full border p-2 rounded focus:ring-2 focus:ring-[#5AB2FF] outline-none">
                    <option value="Ya">Ya</option>
                    <option value="Tidak">Tidak</option>
                </select>
            </div>
            <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nomor KIP</label>
                <input type="text" value={student.nomorKip || ''} onChange={(e) => onChange('nomorKip', e.target.value)} className="w-full border p-2 rounded focus:ring-2 focus:ring-[#5AB2FF] outline-none" />
            </div>
            <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nama di KIP</label>
                <input type="text" value={student.namaDiKip || ''} onChange={(e) => onChange('namaDiKip', e.target.value)} className="w-full border p-2 rounded focus:ring-2 focus:ring-[#5AB2FF] outline-none" />
            </div>

            <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Layak PIP (Usulan dari Sekolah)</label>
                <select value={student.layakPip || 'Tidak'} onChange={(e) => onChange('layakPip', e.target.value)} className="w-full border p-2 rounded focus:ring-2 focus:ring-[#5AB2FF] outline-none">
                    <option value="Ya">Ya</option>
                    <option value="Tidak">Tidak</option>
                </select>
            </div>
            <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Alasan Layak PIP</label>
                <input type="text" value={student.alasanLayakPip || ''} onChange={(e) => onChange('alasanLayakPip', e.target.value)} className="w-full border p-2 rounded focus:ring-2 focus:ring-[#5AB2FF] outline-none" placeholder="Pemegang PKH / KIP / Yatim Piatu / Siswa Kurang Mampu" />
            </div>

            <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Bank</label>
                <input type="text" value={student.bank || ''} onChange={(e) => onChange('bank', e.target.value)} className="w-full border p-2 rounded focus:ring-2 focus:ring-[#5AB2FF] outline-none" placeholder="BRI / BNI / Mandiri" />
            </div>
            <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nomor Rekening Bank</label>
                <input type="text" value={student.nomorRekeningBank || ''} onChange={(e) => onChange('nomorRekeningBank', e.target.value)} className="w-full border p-2 rounded focus:ring-2 focus:ring-[#5AB2FF] outline-none font-mono" />
            </div>
            <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Rekening Atas Nama</label>
                <input type="text" value={student.rekeningAtasNama || ''} onChange={(e) => onChange('rekeningAtasNama', e.target.value)} className="w-full border p-2 rounded focus:ring-2 focus:ring-[#5AB2FF] outline-none" />
            </div>
        </div>
    </div>
  );
};

export default BiodataTab;