import React, { useState, useEffect } from "react";
import { Printer, X, ShieldCheck, Key, Globe, LogIn } from "lucide-react";
import { motion } from "motion/react";
import { supabase } from "../lib/supabase";

interface PrintKartuTamuProps {
  account: {
    id: string;
    username: string;
    password?: string;
    name: string;
    nip?: string;
    position?: string;
    institution?: string;
    pangkat_golongan?: string;
    peran?: string;
  } | null;
  onClose: () => void;
}

export default function PrintKartuTamu({ account, onClose }: PrintKartuTamuProps) {
  const [chairman, setChairman] = useState<{ name: string; nip: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadChairman() {
      try {
        const { data } = await supabase
          .from("org_kkg")
          .select("name, nip")
          .ilike("role", "%Ketua%")
          .limit(1)
          .maybeSingle();
        if (data) {
          setChairman(data);
        }
      } catch (err) {
        console.error("Failed to load chairman for guest card:", err);
      } finally {
        setLoading(false);
      }
    }
    loadChairman();
  }, []);

  if (!account) return null;

  const handlePrint = () => {
    window.print();
  };

  const today = new Date();
  const day = today.getDate();
  const monthName = today.toLocaleDateString("id-ID", { month: "long" });
  const year = today.getFullYear();
  const formattedDate = `${day} ${monthName} ${year}`;
  const websiteUrl = window.location.origin;

  return (
    <div className="fixed inset-0 z-[120] flex flex-col bg-slate-900/40 backdrop-blur-md overflow-hidden">
      {/* Top action bar - Hidden during physical print */}
      <div className="print:hidden flex items-center justify-between p-6 bg-white border-b border-gray-100 shadow-sm z-50">
        <div className="flex items-center gap-3">
          <div className="bg-main-blue/10 p-2.5 rounded-2xl text-main-blue">
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-soft-black">Cetak Kartu Login Tamu</h3>
            <p className="text-xs text-gray-500 font-medium">
              Pratinjau kertas resmi A4 untuk akun: <span className="text-main-blue font-bold">{account.name}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="px-6 py-3 bg-main-blue text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-dark-blue shadow-lg shadow-main-blue/20 transition-all active:scale-95"
            id="btn-print-action"
          >
            <Printer className="w-4 h-4" /> Cetak Kartu
          </button>
          <button
            onClick={onClose}
            className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
            id="btn-close-action"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Screen Preview Container - Scrollable on screen */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100 print:bg-white print:overflow-visible print:p-0">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto bg-white shadow-2xl p-12 sm:p-16 border border-gray-200/60 print:shadow-none print:border-none print:p-4 my-4 max-w-[210mm] min-h-[297mm] flex flex-col justify-between"
          id="guest-print-area"
        >
          {/* Custom style for this print scope */}
          <style>{`
            @media print {
              @page {
                size: A4 portrait;
                margin: 15mm 15mm 15mm 15mm;
              }
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                background: white !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              /* Hide all components */
              body * {
                visibility: hidden;
              }
              /* Show ONLY our print area */
              #guest-print-area, #guest-print-area * {
                visibility: visible;
              }
              #guest-print-area {
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
              .print-hidden-element {
                display: none !important;
              }
            }
          `}</style>

          <div>
            {/* Kop Surat KKG Melati */}
            <div className="flex items-center justify-between border-b-4 border-double border-black pb-4 mb-8 mt-0">
              <img
                src="https://www.image2url.com/r2/default/images/1778851343355-1a6a088b-6728-48ec-b530-6f16d372b2ee.png"
                className="w-20 h-20 object-contain"
                alt="Logo Kemendikdasmen"
              />
              <div className="text-center flex-1 px-4">
                <h1 className="text-lg font-bold font-serif leading-tight">KELOMPOK KERJA GURU ( KKG )</h1>
                <h2 className="text-2xl font-black font-serif leading-tight">GUGUS 03 “MELATI”</h2>
                <h3 className="text-sm font-bold font-serif leading-tight">KECAMATAN JENU KABUPATEN TUBAN</h3>
              </div>
              <img
                src="https://www.image2url.com/r2/default/images/1778156189287-e4930eb4-3c36-4ace-8420-ca8908132e66.png"
                className="w-20 h-20 object-contain"
                alt="Logo KKG"
              />
            </div>

            {/* Document Title */}
            <div className="text-center mb-6">
              <h2 className="text-lg font-bold uppercase underline decoration-2 underline-offset-4 tracking-wide font-sans">
                Lembar Akses Login Tamu
              </h2>
              <p className="text-xs font-mono text-gray-500 mt-1">
                Nomor: AKSES/{account.id.substring(0, 5).toUpperCase()}/KKG-G03/TAMU/{year}
              </p>
            </div>

            {/* Official Greeting / Preamble */}
            <div className="text-sm text-soft-black leading-relaxed space-y-4 mb-6">
              <p>
                Dengan hormat, sehubungan dengan pelaksanaan rangkaian kegiatan Kelompok Kerja Guru (KKG) Gugus 03 Melati, Kecamatan Jenu, Kabupaten Tuban, yang bertandatangan di bawah ini menerangkan bahwa:
              </p>
            </div>

            {/* Identity Table */}
            <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-150 mb-6 print:bg-transparent print:p-2 print:border-none">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-gray-100 print:border-b-black/10 py-2.5">
                    <td className="w-1/3 font-bold text-gray-500 py-2.5 print:text-black/75">Nama Lengkap</td>
                    <td className="w-4 text-center text-gray-400 py-2.5">:</td>
                    <td className="font-bold text-soft-black py-2.5 print:text-black">{account.name}</td>
                  </tr>
                  <tr className="border-b border-gray-100 print:border-b-black/10 py-2.5">
                    <td className="font-bold text-gray-500 py-2.5 print:text-black/75">NIP</td>
                    <td className="text-center text-gray-400 py-2.5">:</td>
                    <td className="font-mono text-soft-black py-2.5 print:text-black">{account.nip || "-"}</td>
                  </tr>
                  <tr className="border-b border-gray-100 print:border-b-black/10 py-2.5">
                    <td className="font-bold text-gray-500 py-2.5 print:text-black/75">Pangkat / Golongan</td>
                    <td className="text-center text-gray-400 py-2.5">:</td>
                    <td className="text-soft-black py-2.5 print:text-black">{account.pangkat_golongan || "-"}</td>
                  </tr>
                  <tr className="border-b border-gray-100 print:border-b-black/10 py-2.5">
                    <td className="font-bold text-gray-500 py-2.5 print:text-black/75">Jabatan</td>
                    <td className="text-center text-gray-400 py-2.5">:</td>
                    <td className="text-soft-black py-2.5 print:text-black">{account.position || "Tamu Undangan"}</td>
                  </tr>
                  <tr className="border-b border-gray-100 print:border-b-black/10 py-2.5">
                    <td className="font-bold text-gray-500 py-2.5 print:text-black/75">Asal Instansi</td>
                    <td className="text-center text-gray-400 py-2.5">:</td>
                    <td className="font-semibold text-soft-black py-2.5 print:text-black">{account.institution || "-"}</td>
                  </tr>
                  <tr className="border-b border-gray-100 print:border-b-black/10 py-2.5">
                    <td className="font-bold text-gray-500 py-2.5 print:text-black/75">Peran / Kategori</td>
                    <td className="text-center text-gray-400 py-2.5">:</td>
                    <td className="py-2.5">
                      <span className="px-2.5 py-1 bg-main-blue/10 text-main-blue print:bg-transparent print:p-0 print:text-black font-bold text-xs rounded-full uppercase">
                        {account.peran || "Tamu Undangan"}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="text-sm text-soft-black leading-relaxed mb-6">
              <p>
                Diberikan akses penuh untuk masuk ke dalam Portal Resmi KKG Gugus 03 Melati sebagai tamu undangan guna memantau agenda, mengisi lembar daftar hadir kegiatan, serta mengakses berkas materi. Silakan gunakan kartu login berikut untuk mengakses sistem:
              </p>
            </div>

            {/* Cut-out Login Card Component */}
            <div className="relative border-2 border-dashed border-main-blue/40 bg-slate-50/50 rounded-2xl p-6 print:bg-white print:border-black/50 print:border-2">
              <div className="absolute -top-3 left-6 px-3 py-0.5 bg-main-blue text-white print:bg-black text-[10px] uppercase font-bold tracking-wider rounded-md">
                Gunting Di Sini (Kartu Akses)
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mt-2">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="bg-main-blue/10 p-1.5 rounded-lg text-main-blue print:hidden">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase tracking-wider text-gray-400 font-bold">Portal Website</span>
                      <span className="text-sm font-semibold text-main-blue underline print:text-black font-mono">{websiteUrl}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded-xl border border-gray-100 print:border-black/20">
                      <span className="block text-[10px] uppercase tracking-wider text-gray-400 font-bold">Username</span>
                      <span className="text-sm font-bold text-soft-black font-mono">{account.username}</span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-gray-100 print:border-black/20">
                      <span className="block text-[10px] uppercase tracking-wider text-gray-400 font-bold">Password</span>
                      <span className="text-sm font-bold text-soft-black font-mono">{account.password || "-"}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 print:border-t-black/15 text-[10px] text-gray-500 font-medium leading-relaxed">
                <span className="font-bold text-soft-black block mb-1">Petunjuk Login KKG Gugus 03:</span>
                1. Buka link website di atas. 2. Tekan tombol <b className="text-soft-black">Masuk / Login</b>. 3. Pilih tipe akses <b className="text-soft-black">Tamu Undangan</b>. 4. Isikan Username dan Password di atas.
              </div>
            </div>

            <div className="text-sm text-soft-black leading-relaxed mt-6">
              <p>
                Demikian lembar akses sekaligus kartu login ini diterbitkan secara sah oleh Kelompok Kerja Guru Gugus 03 Melati untuk digunakan sebagaimana mestinya.
              </p>
            </div>
          </div>

          {/* Signature Block */}
          <div className="mt-8 flex justify-end">
            <div className="text-center w-64">
              <p className="text-sm italic mb-1.5">Jenu, {formattedDate}</p>
              <p className="text-sm font-bold mb-16 uppercase tracking-wide">Ketua KKG Gugus 03 Melati,</p>
              
              <p className="text-sm font-bold underline underline-offset-4 leading-none mb-1">
                {loading ? "Memuat..." : (chairman?.name || "......................................")}
              </p>
              <p className="text-xs text-gray-650">
                {loading ? "" : (chairman?.nip ? `NIP. ${chairman.nip}` : "NIP. .....................................")}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
