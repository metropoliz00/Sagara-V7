import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  UserCheck, 
  ShieldCheck, 
  CheckCircle2, 
  Building2, 
  Briefcase, 
  Award, 
  KeyRound, 
  Sparkles, 
  ArrowRight, 
  LogIn, 
  User, 
  FileText,
  HelpCircle,
  Check
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAlert } from "../contexts/AlertContext";

export default function RegistrasiTamu({ onLoginSuccess }: { onLoginSuccess?: (userData: any) => void }) {
  const navigate = useNavigate();
  const { alert } = useAlert();

  const [formData, setFormData] = useState({
    name: "",
    nip: "",
    pangkat_golongan: "",
    position: "",
    institution: "",
    peran: "Tamu Undangan",
    customPeran: ""
  });

  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);

  const peranOptions = [
    "Tamu Undangan",
    "Pengawas / Pembina",
    "Pejabat Dinas Pendidikan",
    "Pemateri / Narasumber",
    "Kepala Sekolah Tamu",
    "Komite Sekolah",
    "Lainnya"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanNip = formData.nip.trim();
    if (!cleanNip) {
      alert("NIP wajib diisi sebagai identitas dasar Username & Password.", "Peringatan", "info");
      return;
    }

    if (!formData.name.trim()) {
      alert("Nama lengkap wajib diisi.", "Peringatan", "info");
      return;
    }

    const finalPeran = formData.peran === "Lainnya" 
      ? (formData.customPeran.trim() || "Tamu Undangan")
      : formData.peran;

    setLoading(true);

    const payload = {
      name: formData.name.trim(),
      nip: cleanNip,
      pangkat_golongan: formData.pangkat_golongan.trim(),
      position: formData.position.trim(),
      institution: formData.institution.trim(),
      peran: finalPeran,
      username: cleanNip,
      password: cleanNip
    };

    try {
      // Try backend API first
      let resData: any = null;
      let isSuccess = false;

      try {
        const response = await fetch("/api/guest-register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          resData = await response.json();
          if (resData.success) {
            isSuccess = true;
          }
        }
      } catch (err) {
        console.warn("API guest registration failed, falling back to client-side insert:", err);
      }

      // Fallback to direct client insert if server API wasn't used or failed
      if (!isSuccess && supabase) {
        // Check if username/nip exists
        const { data: existing } = await supabase
          .from("guest_accounts")
          .select("id")
          .or(`username.eq.${cleanNip},nip.eq.${cleanNip}`)
          .maybeSingle();

        if (existing) {
          const { data: updated, error: updateErr } = await supabase
            .from("guest_accounts")
            .update({
              username: cleanNip,
              password: cleanNip,
              name: payload.name,
              nip: cleanNip,
              position: payload.position,
              institution: payload.institution,
              pangkat_golongan: payload.pangkat_golongan,
              peran: payload.peran
            })
            .eq("id", existing.id)
            .select()
            .single();

          if (updateErr) throw updateErr;
          resData = { guest: updated };
          isSuccess = true;
        } else {
          const { data: inserted, error: insertErr } = await supabase
            .from("guest_accounts")
            .insert([payload])
            .select()
            .single();

          if (insertErr) throw insertErr;
          resData = { guest: inserted };
          isSuccess = true;
        }
      }

      if (isSuccess && resData?.guest) {
        setSuccessData(resData.guest);
      } else {
        throw new Error(resData?.error || "Gagal mendaftarkan akun tamu.");
      }
    } catch (err: any) {
      console.error("Registration error:", err);
      alert(err.message || "Gagal melakukan registrasi tamu.", "Error", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAutoLogin = () => {
    if (!successData) return;

    const guestUser = {
      id: successData.id,
      nama: successData.name,
      username: successData.username,
      role: 'tamu',
      nip: successData.nip,
      jabatan: successData.position,
      sekolah: successData.institution,
      pangkat: successData.pangkat_golongan,
      peran: successData.peran || 'Tamu Undangan',
      is_guest: true,
      guest_id: successData.id
    };

    localStorage.setItem("guest_session", JSON.stringify(guestUser));
    
    if (onLoginSuccess) {
      onLoginSuccess(guestUser);
    } else {
      window.location.href = "/dashboard";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-sky-50/40 pt-28 pb-20 px-4 md:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Top Header Card */}
        <div className="bg-gradient-to-r from-white via-sky-50 to-emerald-50/80 p-8 md:p-12 rounded-[2.5rem] text-soft-black border border-blue-100 shadow-xl shadow-blue-500/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-3 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-blue-50 backdrop-blur-md rounded-full border border-blue-200 text-xs font-bold uppercase tracking-widest text-main-blue">
                <ShieldCheck className="w-4 h-4 text-main-blue" /> Registrasi Akses Mandiri
              </div>
              <h1 className="text-3xl md:text-4xl font-black font-heading tracking-tight leading-tight text-soft-black">
                Registrasi Akun Tamu Undangan
              </h1>
              <p className="text-gray-600 text-sm md:text-base max-w-xl font-medium leading-relaxed">
                Daftarkan identitas Anda untuk mendapatkan akses khusus Tamu Undangan di portal KKG Gugus 03 Melati Kec. Jenu.
              </p>
            </div>
            <div className="w-20 h-20 bg-white border border-blue-100 rounded-3xl flex items-center justify-center text-main-blue shrink-0 shadow-md">
              <UserCheck className="w-10 h-10" />
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {successData ? (
            /* Success Screen */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl shadow-blue-900/5 border border-emerald-100 space-y-8"
            >
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto border-4 border-emerald-100 shadow-md">
                  <Check className="w-10 h-10" />
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-soft-black font-heading">
                  Registrasi Tamu Berhasil!
                </h2>
                <p className="text-gray-600 text-sm max-w-md mx-auto leading-relaxed">
                  Data Anda telah tersimpan di sistem. Akun ini otomatis masuk ke menu <strong className="text-soft-black">Kelola Akun Tamu</strong> Admin.
                </p>
              </div>

              {/* Credentials Card */}
              <div className="bg-gradient-to-br from-indigo-50/80 via-sky-50/50 to-emerald-50/50 p-6 md:p-8 rounded-3xl border border-indigo-100 space-y-6">
                <div className="flex items-center gap-3 text-indigo-800 font-bold text-sm border-b border-indigo-100 pb-4">
                  <KeyRound className="w-5 h-5 text-indigo-600" />
                  <span>Kredensial Login Akun Tamu Anda</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-sm">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                      Username (NIP)
                    </span>
                    <p className="text-lg font-mono font-black text-main-blue tracking-wide">
                      {successData.nip}
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                      Password (NIP)
                    </span>
                    <p className="text-lg font-mono font-black text-emerald-600 tracking-wide">
                      {successData.nip}
                    </p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 space-y-2 text-xs text-gray-600">
                  <div className="flex items-center gap-2 font-bold text-soft-black">
                    <User className="w-4 h-4 text-main-blue" />
                    <span>Detail Profil Terdaftar:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-gray-600">
                    <p><strong>Nama:</strong> {successData.name}</p>
                    <p><strong>Instansi:</strong> {successData.institution}</p>
                    <p><strong>Jabatan:</strong> {successData.position}</p>
                    <p><strong>Pangkat/Gol:</strong> {successData.pangkat_golongan || "-"}</p>
                    <p><strong>Kategori Tamu:</strong> {successData.peran}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <button
                  onClick={handleAutoLogin}
                  className="flex-1 py-4 px-6 bg-gradient-to-r from-main-blue to-indigo-600 text-white rounded-2xl font-bold text-sm tracking-wide shadow-xl shadow-main-blue/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <LogIn className="w-5 h-5" />
                  Masuk ke Dashboard Tamu Sekarang
                </button>

                <button
                  onClick={() => {
                    setSuccessData(null);
                    setFormData({
                      name: "",
                      nip: "",
                      pangkat_golongan: "",
                      position: "",
                      institution: "",
                      peran: "Tamu Undangan",
                      customPeran: ""
                    });
                  }}
                  className="py-4 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-bold text-sm transition-all"
                >
                  Daftarkan Tamu Lain
                </button>
              </div>
            </motion.div>
          ) : (
            /* Registration Form */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl shadow-blue-900/5 border border-blue-100/80"
            >
              {/* Form Info Box */}
              <div className="bg-sky-50/80 border border-sky-100 p-5 rounded-2xl flex items-start gap-4 mb-8 text-xs text-sky-900 leading-relaxed">
                <Sparkles className="w-5 h-5 text-main-blue shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold text-main-blue block mb-0.5">Catatan Penting Login Tamu:</strong>
                  Data NIP yang Anda masukkan akan dijadikan <strong>Username</strong> dan <strong>Password</strong> akun Anda. Setelah registrasi, Anda dapat langsung login untuk mengisi absensi & mengakses layanan tamu.
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  {/* Nama Lengkap & Gelar */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black text-gray-600 uppercase tracking-widest flex items-center gap-2">
                      <User className="w-4 h-4 text-main-blue" /> Nama Lengkap & Gelar <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Nama Lengkap & Gelar"
                      className="w-full bg-white border border-gray-200 focus:border-main-blue focus:ring-4 focus:ring-blue-100/80 p-4 rounded-2xl text-sm font-bold text-soft-black outline-none transition-all shadow-sm placeholder:text-gray-400 placeholder:font-normal"
                    />
                  </div>

                  {/* NIP / Nomor Identitas */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black text-gray-600 uppercase tracking-widest flex items-center gap-2">
                      <FileText className="w-4 h-4 text-main-blue" /> NIP / Nomor Identitas <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nip}
                      onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                      placeholder="NIP / Nomor Identitas"
                      className="w-full bg-white border border-gray-200 focus:border-main-blue focus:ring-4 focus:ring-blue-100/80 p-4 rounded-2xl text-sm font-mono font-bold text-soft-black outline-none transition-all shadow-sm placeholder:text-gray-400 placeholder:font-normal"
                    />
                    <p className="text-[11px] text-gray-400 italic">
                      *Akan menjadi dasar Username & Password akun tamu Anda.
                    </p>
                  </div>

                  {/* Pangkat / Golongan */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black text-gray-600 uppercase tracking-widest flex items-center gap-2">
                      <Award className="w-4 h-4 text-main-blue" /> Pangkat / Golongan
                    </label>
                    <input
                      type="text"
                      value={formData.pangkat_golongan}
                      onChange={(e) => setFormData({ ...formData, pangkat_golongan: e.target.value })}
                      placeholder="Pangkat / Golongan"
                      className="w-full bg-white border border-gray-200 focus:border-main-blue focus:ring-4 focus:ring-blue-100/80 p-4 rounded-2xl text-sm font-bold text-soft-black outline-none transition-all shadow-sm placeholder:text-gray-400 placeholder:font-normal"
                    />
                  </div>

                  {/* Jabatan */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black text-gray-600 uppercase tracking-widest flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-main-blue" /> Jabatan <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      placeholder="Jabatan"
                      className="w-full bg-white border border-gray-200 focus:border-main-blue focus:ring-4 focus:ring-blue-100/80 p-4 rounded-2xl text-sm font-bold text-soft-black outline-none transition-all shadow-sm placeholder:text-gray-400 placeholder:font-normal"
                    />
                  </div>

                  {/* Asal Instansi */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black text-gray-600 uppercase tracking-widest flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-main-blue" /> Asal Instansi <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.institution}
                      onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                      placeholder="Asal Instansi"
                      className="w-full bg-white border border-gray-200 focus:border-main-blue focus:ring-4 focus:ring-blue-100/80 p-4 rounded-2xl text-sm font-bold text-soft-black outline-none transition-all shadow-sm placeholder:text-gray-400 placeholder:font-normal"
                    />
                  </div>

                  {/* Peran / Kategori Tamu */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black text-gray-600 uppercase tracking-widest flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-main-blue" /> Peran / Kategori Tamu <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.peran}
                      onChange={(e) => setFormData({ ...formData, peran: e.target.value })}
                      className="w-full bg-white border border-gray-200 focus:border-main-blue focus:ring-4 focus:ring-blue-100/80 p-4 rounded-2xl text-sm font-bold text-soft-black outline-none transition-all shadow-sm cursor-pointer"
                    >
                      {peranOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>

                    {formData.peran === "Lainnya" && (
                      <input
                        type="text"
                        required
                        value={formData.customPeran}
                        onChange={(e) => setFormData({ ...formData, customPeran: e.target.value })}
                        placeholder="Peran / Kategori Tamu"
                        className="w-full mt-3 bg-white border border-gray-200 focus:border-main-blue focus:ring-4 focus:ring-blue-100/80 p-3 rounded-2xl text-sm font-bold text-soft-black outline-none transition-all shadow-sm placeholder:text-gray-400 placeholder:font-normal"
                      />
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <Link
                    to="/"
                    className="text-xs font-bold text-gray-500 hover:text-main-blue transition-colors"
                  >
                    &larr; Kembali ke Beranda
                  </Link>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto py-4 px-10 bg-gradient-to-r from-main-blue to-leaf-green text-white rounded-2xl font-black text-sm uppercase tracking-wider shadow-xl shadow-main-blue/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Simpan & Registrasi Tamu</span>
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
