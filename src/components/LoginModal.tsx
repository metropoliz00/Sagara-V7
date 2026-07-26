import { motion, AnimatePresence } from "motion/react";
import { X, User, Lock, ArrowRight, Eye, EyeOff, AtSign } from "lucide-react";
import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { useSiteContent } from '../contexts/SiteContext';
import { supabase } from '../lib/supabase';

export default function LoginModal({ isOpen, onClose, onLoginSuccess }: { isOpen: boolean, onClose: () => void, onLoginSuccess: (user: any) => void }) {
  const { content } = useSiteContent(); 
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Username dan Password wajib diisi");
      return;
    }
    
    setIsLoading(true);
    setError("");

    try {
      const trimmedUsername = username.trim();
      let loginSuccessful = false;

      // 1. Try Member Logic First
      try {
        let loginEmail = trimmedUsername;
        let isMemberCandidate = true;

        if (!trimmedUsername.includes('@')) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('email')
            .eq('username', trimmedUsername)
            .single();
          
          if (!profile) {
            isMemberCandidate = false;
          } else {
            loginEmail = profile.email;
          }
        }

        if (isMemberCandidate) {
          const { data, error: supaError } = await supabase.auth.signInWithPassword({
            email: loginEmail,
            password
          });

          if (!supaError && data.session) {
            const { data: profile, error: profileError } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('id', data.session.user.id)
              .single();

            if (!profileError) {
              onLoginSuccess(profile);
              onClose();
              loginSuccessful = true;
            }
          }
        }
      } catch (e) {
        // Continue to guest check
      }

      if (loginSuccessful) return;

      // 2. Try Guest Logic
      const { data: guest, error: guestError } = await supabase
        .from('guest_accounts')
        .select('*')
        .eq('username', trimmedUsername)
        .eq('password', password)
        .single();

      if (!guestError && guest) {
        const guestUser = {
          id: guest.id,
          nama: guest.name,
          username: guest.username,
          role: 'tamu',
          nip: guest.nip,
          jabatan: guest.position,
          sekolah: guest.institution,
          pangkat: guest.pangkat_golongan,
          peran: guest.peran || 'Tamu Undangan',
          is_guest: true,
          guest_id: guest.id
        };
        localStorage.setItem("guest_session", JSON.stringify(guestUser));
        onLoginSuccess(guestUser);
        onClose();
        loginSuccessful = true;
      }

      if (!loginSuccessful) {
        throw new Error("Username atau Password salah.");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Gagal masuk.");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6 overflow-y-auto w-full h-full">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-dark-gray/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl shadow-main-blue/20 border border-main-orange/20 my-auto`}
          >
            {/* Header */}
            <div className={`p-8 pb-3 bg-gradient-to-br from-main-blue to-dark-green text-white relative`}>
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                disabled={isLoading}
              >
                <X className="w-5 h-5" />
              </button>
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md mb-4 border border-main-orange/40">
                <User className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-heading text-2xl font-bold">Portal Login</h3>
              <p className="text-white/80 text-sm mt-1">Silakan masuk menggunakan akun Anda.</p>
            </div>

            {/* Body */}
            <div className="p-8 pb-10">
              <form className="space-y-5" onSubmit={handleSubmit}>
                {error && (
                  <div className={`p-3 text-sm rounded-lg border bg-red-50 text-red-600 border-red-100`}>
                    {error}
                  </div>
                )}
                
                <div className="space-y-5">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Username</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <AtSign className="w-5 h-5 text-gray-400" />
                      </div>
                      <input 
                        type="text" 
                        value={username}
                        maxLength={50}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-light-gray border border-gray-200 rounded-xl focus:ring-2 focus:ring-main-blue focus:border-main-blue transition-all outline-none"
                        placeholder="Masukkan Username Anda"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Kata Sandi</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="w-5 h-5 text-gray-400" />
                      </div>
                      <input 
                        type={showPassword ? "text" : "password"} 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-11 pr-11 py-3 bg-light-gray border border-gray-200 rounded-xl focus:ring-2 focus:ring-main-blue focus:border-main-blue transition-all outline-none"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button 
                    type="submit"
                    disabled={isLoading}
                    className={`w-full py-4 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-main-blue to-leaf-green hover:from-dark-blue hover:to-dark-green shadow-lg shadow-main-blue/30 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {isLoading ? 'Memproses...' : (
                      <>Masuk Sekarang <ArrowRight className="w-5 h-5" /></>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

