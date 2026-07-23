const fs = require('fs');

const content = fs.readFileSync('components/StaffLeaveView.tsx', 'utf8');

const regex = /\{\/\* Printable Content \*\/\}([\s\S]*?)<div id="printable-area" className="p-8 sm:p-12 text-black bg-white print:p-0">/;

const FormCutiStr = `
            {letterType === 'Form Cuti' && (
              <div className="p-4 bg-gray-50 border-b border-gray-200 print:hidden grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-bold text-sm">Data Pegawai</h4>
                  <div className="flex gap-2">
                    <input type="text" placeholder="Masa Kerja Tahun" value={formCutiData.masaKerjaTahun} onChange={e => setFormCutiData({...formCutiData, masaKerjaTahun: e.target.value})} className="border p-1 text-sm rounded w-full" />
                    <input type="text" placeholder="Masa Kerja Bulan" value={formCutiData.masaKerjaBulan} onChange={e => setFormCutiData({...formCutiData, masaKerjaBulan: e.target.value})} className="border p-1 text-sm rounded w-full" />
                  </div>
                  <input type="text" placeholder="Telepon" value={formCutiData.telp} onChange={e => setFormCutiData({...formCutiData, telp: e.target.value})} className="border p-1 text-sm rounded w-full" />
                  <textarea placeholder="Alamat Cuti" value={formCutiData.alamat} onChange={e => setFormCutiData({...formCutiData, alamat: e.target.value})} className="border p-1 text-sm rounded w-full h-16" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-bold text-sm">Pejabat & Atasan</h4>
                  <input type="text" placeholder="Nama Pejabat Berwenang" value={formCutiData.pejabatName} onChange={e => setFormCutiData({...formCutiData, pejabatName: e.target.value})} className="border p-1 text-sm rounded w-full" />
                  <input type="text" placeholder="NIP Pejabat Berwenang" value={formCutiData.pejabatNip} onChange={e => setFormCutiData({...formCutiData, pejabatNip: e.target.value})} className="border p-1 text-sm rounded w-full" />
                  <input type="text" placeholder="Nama Atasan Langsung" value={formCutiData.atasanName} onChange={e => setFormCutiData({...formCutiData, atasanName: e.target.value})} className="border p-1 text-sm rounded w-full" />
                  <input type="text" placeholder="NIP Atasan Langsung" value={formCutiData.atasanNip} onChange={e => setFormCutiData({...formCutiData, atasanNip: e.target.value})} className="border p-1 text-sm rounded w-full" />
                </div>
              </div>
            )}

            {/* Printable Content */}
            {(() => {
              const cleanCat = printRequestedLeave.kategoriIjin.replace(/cuti\\s*-\\s*/gi, '');
              
              const isCuti = (type: string) => cleanCat.toLowerCase().includes(type.toLowerCase()) ? '✓' : '';
              const lamaHari = Math.ceil((new Date(printRequestedLeave.tanggalSelesai).getTime() - new Date(printRequestedLeave.tanggalMulai).getTime()) / (1000 * 60 * 60 * 24));
              const tglMulai = new Date(printRequestedLeave.tanggalMulai).toLocaleDateString('id-ID', {day: '2-digit', month: 'long', year: 'numeric'});
              const tglSelesai = new Date(printRequestedLeave.tanggalSelesai).toLocaleDateString('id-ID', {day: '2-digit', month: 'long', year: 'numeric'});

              const FormCutiPage = () => (
                <div className="text-[11px] leading-tight font-sans mb-12" style={{ breakAfter: 'page' }}>
                  <div className="border-b-2 border-black pb-2 mb-4 flex items-center gap-4">
                    <div className="w-16 h-16 bg-transparent flex-shrink-0 flex items-center justify-center">
                       {schoolProfile?.regencyLogo ? <img src={schoolProfile.regencyLogo} alt="Logo Kab" className="w-full h-full object-contain" /> : <div className="text-[8px]">LOGO</div>}
                    </div>
                    <div className="text-center flex-1">
                      <p className="font-bold uppercase text-sm">PEMERINTAH KABUPATEN TUBAN</p>
                      <p className="font-bold uppercase text-lg">DINAS PENDIDIKAN</p>
                      <p className="text-xs">Jalan Dr. Wahidin Sudirohusodo Nomor 875 Tuban 62315 Telepon (0356) 327880</p>
                      <p className="text-xs">Laman : dispendik.tubankab.go.id  Pos-el : dispendik@tubankab.go.id</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-start mb-4">
                    <div className="w-1/2">
                      <p>Yth. {formCutiData.pejabatJabatan}</p>
                      <p>di -</p>
                      <p className="ml-4">Tuban</p>
                    </div>
                    <div className="text-right">
                      <p>Tuban, {new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
                    </div>
                  </div>
                  
                  <div className="text-center font-bold mb-4">
                    <p className="underline">PERMINTAAN DAN PEMBERIAN CUTI</p>
                    <p>Nomor : {manualLetterNumber || '800.1.11.3/           /414.101/2026'}</p>
                  </div>

                  <table className="w-full border-collapse border border-black mb-2">
                    <tbody>
                      <tr><td colSpan={4} className="border border-black p-1 font-bold">I. DATA PEGAWAI</td></tr>
                      <tr>
                        <td className="border border-black p-1 w-[15%]">Nama</td>
                        <td className="border border-black p-1 w-[35%]">{printRequestedLeave.userName}</td>
                        <td className="border border-black p-1 w-[15%]">NIP</td>
                        <td className="border border-black p-1 w-[35%]">{printRequestedLeave.nip}</td>
                      </tr>
                      <tr>
                        <td className="border border-black p-1">Jabatan</td>
                        <td className="border border-black p-1">{printRequestedLeave.jabatan}</td>
                        <td className="border border-black p-1">Masa Kerja</td>
                        <td className="border border-black p-1">{formCutiData.masaKerjaTahun} Tahun {formCutiData.masaKerjaBulan} Bulan</td>
                      </tr>
                      <tr>
                        <td className="border border-black p-1">Unit Kerja</td>
                        <td colSpan={3} className="border border-black p-1">{schoolProfile?.name || ''} Kabupaten Tuban</td>
                      </tr>
                    </tbody>
                  </table>

                  <table className="w-full border-collapse border border-black mb-2">
                    <tbody>
                      <tr><td colSpan={6} className="border border-black p-1 font-bold">II. JENIS CUTI YANG DIAMBIL **</td></tr>
                      <tr>
                        <td className="border border-black p-1 w-[5%] text-center">1.</td>
                        <td className="border border-black p-1 w-[40%]">Cuti Tahunan</td>
                        <td className="border border-black p-1 w-[10%] text-center font-bold">{isCuti('tahunan')}</td>
                        <td className="border border-black p-1 w-[5%] text-center">2.</td>
                        <td className="border border-black p-1 w-[30%]">Cuti Besar</td>
                        <td className="border border-black p-1 w-[10%] text-center font-bold">{isCuti('besar')}</td>
                      </tr>
                      <tr>
                        <td className="border border-black p-1 text-center">3.</td>
                        <td className="border border-black p-1">Cuti Sakit</td>
                        <td className="border border-black p-1 text-center font-bold">{isCuti('sakit')}</td>
                        <td className="border border-black p-1 text-center">4.</td>
                        <td className="border border-black p-1">Cuti Melahirkan</td>
                        <td className="border border-black p-1 text-center font-bold">{isCuti('melahirkan')}</td>
                      </tr>
                      <tr>
                        <td className="border border-black p-1 text-center">5.</td>
                        <td className="border border-black p-1">Cuti Karena Alasan Penting</td>
                        <td className="border border-black p-1 text-center font-bold">{isCuti('penting')}</td>
                        <td className="border border-black p-1 text-center">6.</td>
                        <td className="border border-black p-1">Cuti di Luar Tanggungan Negara</td>
                        <td className="border border-black p-1 text-center font-bold">{isCuti('tanggungan')}</td>
                      </tr>
                    </tbody>
                  </table>

                  <table className="w-full border-collapse border border-black mb-2">
                    <tbody>
                      <tr><td className="border border-black p-1 font-bold">III. ALASAN CUTI</td></tr>
                      <tr><td className="border border-black p-1 h-8 align-top">{printRequestedLeave.alasan}</td></tr>
                    </tbody>
                  </table>

                  <table className="w-full border-collapse border border-black mb-2">
                    <tbody>
                      <tr><td colSpan={6} className="border border-black p-1 font-bold">IV. LAMANYA CUTI</td></tr>
                      <tr>
                        <td className="border border-black p-1 w-[15%]">Selama</td>
                        <td className="border border-black p-1 w-[20%]">{lamaHari} Hari</td>
                        <td className="border border-black p-1 w-[15%]">Mulai Tanggal</td>
                        <td className="border border-black p-1 w-[20%]">{tglMulai}</td>
                        <td className="border border-black p-1 w-[10%] text-center">s/d</td>
                        <td className="border border-black p-1 w-[20%]">{tglSelesai}</td>
                      </tr>
                    </tbody>
                  </table>

                  <table className="w-full border-collapse border border-black mb-2">
                    <tbody>
                      <tr><td colSpan={5} className="border border-black p-1 font-bold">V. CATATAN CUTI ***</td></tr>
                      <tr>
                        <td colSpan={3} className="border border-black p-1 w-[50%] font-bold">1. CUTI TAHUNAN</td>
                        <td className="border border-black p-1 w-[40%] font-bold">2. CUTI BESAR</td>
                        <td className="border border-black p-1 w-[10%] text-center">--</td>
                      </tr>
                      <tr>
                        <td className="border border-black p-1 w-[15%] text-center">Tahun</td>
                        <td className="border border-black p-1 w-[15%] text-center">Sisa</td>
                        <td className="border border-black p-1 w-[20%] text-center">Keterangan</td>
                        <td className="border border-black p-1 font-bold">3. CUTI SAKIT</td>
                        <td className="border border-black p-1 text-center">--</td>
                      </tr>
                      <tr>
                        <td className="border border-black p-1 text-center">N-2</td>
                        <td className="border border-black p-1 text-center">--</td>
                        <td className="border border-black p-1 text-center">--</td>
                        <td className="border border-black p-1 font-bold">4. CUTI MELAHIRKAN</td>
                        <td className="border border-black p-1 text-center">--</td>
                      </tr>
                      <tr>
                        <td className="border border-black p-1 text-center">N-1</td>
                        <td className="border border-black p-1 text-center">--</td>
                        <td className="border border-black p-1 text-center">--</td>
                        <td className="border border-black p-1 font-bold">5. CUTI KARENA ALASAN PENTING</td>
                        <td className="border border-black p-1 text-center">--</td>
                      </tr>
                      <tr>
                        <td className="border border-black p-1 text-center">N</td>
                        <td className="border border-black p-1 text-center">--</td>
                        <td className="border border-black p-1 text-center">--</td>
                        <td className="border border-black p-1 font-bold">6. CUTI DI LUAR TANGGUNGAN NEGARA</td>
                        <td className="border border-black p-1 text-center">--</td>
                      </tr>
                    </tbody>
                  </table>

                  <table className="w-full border-collapse border border-black mb-2">
                    <tbody>
                      <tr><td colSpan={3} className="border border-black p-1 font-bold">VI. ALAMAT SELAMA MENJALANKAN CUTI</td></tr>
                      <tr>
                        <td className="border border-black p-1 w-[15%] text-center">Alamat Lengkap</td>
                        <td className="border border-black p-1 w-[45%] text-center">
                          Telpon <span className="inline-block ml-4 w-32 border-b border-black">{formCutiData.telp}</span>
                        </td>
                        <td className="border border-black p-1 w-[40%] text-center" rowSpan={2}>
                          Hormat Saya,
                          <br/><br/><br/>
                          <span className="font-bold underline">{printRequestedLeave.userName}</span>
                          <br/>
                          NIP. {printRequestedLeave.nip}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={2} className="border border-black p-1 h-12 align-top text-center">
                          {formCutiData.alamat}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <table className="w-full border-collapse border border-black mb-2">
                    <tbody>
                      <tr><td colSpan={4} className="border border-black p-1 font-bold">VII. PERTIMBANGAN ATASAN LANGSUNG **</td></tr>
                      <tr>
                        <td className="border border-black p-1 text-center w-[25%]">DISETUJUI</td>
                        <td className="border border-black p-1 text-center w-[25%]">PERUBAHAN ****</td>
                        <td className="border border-black p-1 text-center w-[25%]">DITANGGUHKAN ****</td>
                        <td className="border border-black p-1 text-center w-[25%]">TIDAK DISETUJUI ****</td>
                      </tr>
                      <tr>
                        <td className="border border-black p-1 h-6"></td>
                        <td className="border border-black p-1"></td>
                        <td className="border border-black p-1"></td>
                        <td className="border border-black p-1"></td>
                      </tr>
                      <tr>
                        <td colSpan={3} className="border border-black p-1 border-r-0"></td>
                        <td className="border border-black p-1 border-l-0 text-center">
                          {formCutiData.atasanJabatan}
                          <br/><br/><br/>
                          <span className="font-bold underline">{formCutiData.atasanName}</span>
                          <br/>
                          NIP. {formCutiData.atasanNip}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <table className="w-full border-collapse border border-black mb-2">
                    <tbody>
                      <tr><td colSpan={4} className="border border-black p-1 font-bold">VIII. KEPUTUSAN PEJABAT YANG BERWENANG MEMBERIKAN CUTI **</td></tr>
                      <tr>
                        <td className="border border-black p-1 text-center w-[25%]">DISETUJUI</td>
                        <td className="border border-black p-1 text-center w-[25%]">PERUBAHAN ****</td>
                        <td className="border border-black p-1 text-center w-[25%]">DITANGGUHKAN ****</td>
                        <td className="border border-black p-1 text-center w-[25%]">TIDAK DISETUJUI ****</td>
                      </tr>
                      <tr>
                        <td className="border border-black p-1 h-6"></td>
                        <td className="border border-black p-1"></td>
                        <td className="border border-black p-1"></td>
                        <td className="border border-black p-1"></td>
                      </tr>
                      <tr>
                        <td colSpan={3} className="border border-black p-1 border-r-0">
                           <div className="text-[9px] mt-4">
                             <p className="font-bold underline">Tembusan :</p>
                             <p>1. Inspektur Daerah Kabupaten Tuban</p>
                             <p>2. Kepala BKPSDM Kabupaten Tuban</p>
                           </div>
                        </td>
                        <td className="border border-black p-1 border-l-0 text-center">
                          {formCutiData.pejabatJabatan}
                          <br/><br/><br/>
                          <span className="font-bold underline">{formCutiData.pejabatName}</span>
                          <br/>
                          NIP. {formCutiData.pejabatNip}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              );

              return (
                <div id="printable-area" className="p-8 sm:p-12 text-black bg-white print:p-0">
`;

const newContent = content.replace(regex, FormCutiStr);
fs.writeFileSync('components/StaffLeaveView.tsx', newContent);
