import React, { useState, useEffect } from 'react';
import { SchoolProfileData } from '../types';
import { compressImage } from '../utils/imageHelper';
import { Code, Image as ImageIcon, MessageSquare, Save, Loader2, Globe, User, Mail, Phone, Facebook, Instagram, Youtube } from 'lucide-react';

interface DeveloperInfoViewProps {
  schoolProfile: SchoolProfileData;
  onSave: (type: 'school', data: any) => Promise<void>;
  onShowNotification: (message: string, type: 'success' | 'error' | 'warning') => void;
  isAdminOrSuperadmin: boolean;
  userRole?: string;
}

const DEFAULT_DEV_NAME = "Dedy Meyga Saputra, S.Pd, M.Pd";
const DEFAULT_DEV_PHOTO = "https://www.image2url.com/r2/default/images/1782534086979-5b315be8-d0b6-425a-8674-00f0fc9c3064.jpg";

export const DeveloperInfoView: React.FC<DeveloperInfoViewProps> = ({ 
  schoolProfile, 
  onSave, 
  onShowNotification,
  isAdminOrSuperadmin,
  userRole
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    moto: '',
    photo: '',
    email: '',
    whatsapp: '',
    facebook: '',
    instagram: '',
    tiktok: '',
    youtube: ''
  });

  const isSuperadmin = userRole === 'superadmin';

  useEffect(() => {
    if (schoolProfile) {
      const dev = schoolProfile.developerInfo || {
        name: '',
        moto: '',
        photo: '',
        email: '',
        whatsapp: '',
        facebook: '',
        instagram: '',
        tiktok: '',
        youtube: ''
      };
      setForm({
        name: dev.name || DEFAULT_DEV_NAME,
        moto: dev.moto || '',
        photo: dev.photo || DEFAULT_DEV_PHOTO,
        email: dev.email || 'metropoliz00@gmail.com',
        whatsapp: dev.whatsapp || 'https://wa.me/6285604431706',
        facebook: dev.facebook || 'https://www.facebook.com/share/18ivFCu4Fh/',
        instagram: dev.instagram || 'https://www.instagram.com/dedy_meyga?igsh=cGp5ZTQ4bzFwZGp5',
        tiktok: dev.tiktok || 'https://vt.tiktok.com/ZSXLjPNJQ/',
        youtube: dev.youtube || 'https://youtube.com/@masgurupemula4766?si=bearyAkgJTr0eGkO'
      });
    }
  }, [schoolProfile]);

  const handleFieldChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isSuperadmin) return;
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await compressImage(file, 200, 0.7);
        setForm(prev => ({ ...prev, photo: base64 }));
        onShowNotification("Foto pengembang berhasil diunggah secara lokal.", "success");
      } catch (error) {
        console.error("Gagal upload foto pengembang", error);
        onShowNotification("Gagal memproses foto pengembang.", "error");
      }
    }
  };

  const handleSave = async () => {
    if (!isAdminOrSuperadmin) {
      onShowNotification("Anda tidak memiliki izin untuk mengedit profil pengembang.", "error");
      return;
    }

    setIsSaving(true);
    try {
      const updatedSchoolProfile = {
        ...schoolProfile,
        developerInfo: {
          ...form
        }
      };
      await onSave('school', updatedSchoolProfile);
      onShowNotification("Profil Pengembang Aplikasi berhasil disimpan!", "success");
    } catch (err: any) {
      console.error(err);
      onShowNotification(err.message || "Gagal menyimpan profil pengembang.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-[#CAF4FF] p-6 md:p-8 animate-fade-in">
      <div className="flex justify-between items-center border-b border-[#CAF4FF] pb-4 mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-[#CAF4FF]/50 rounded-xl text-indigo-600">
            <Code size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Edit Pengembang Aplikasi</h2>
            <p className="text-sm text-slate-500">Kelola informasi, kontak sosial media, dan foto profil pengembang aplikasi.</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center gap-6 bg-slate-50 p-5 rounded-2xl border border-slate-100">
          <div className="relative w-28 h-28 rounded-full border-4 border-white shadow overflow-hidden group shrink-0">
            <img 
              src={form.photo || DEFAULT_DEV_PHOTO} 
              alt="Foto Pengembang" 
              className="w-full h-full object-cover object-top"
            />
            {isSuperadmin && (
              <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <ImageIcon size={20} className="text-white" />
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handlePhotoUpload} 
                  className="hidden" 
                />
              </label>
            )}
          </div>
          <div className="text-center sm:text-left">
            <h3 className="font-bold text-slate-800 text-lg">Foto & Avatar</h3>
            {isSuperadmin && (
              <div className="mt-2 flex gap-2 justify-center sm:justify-start">
                <label className="cursor-pointer text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                  Unggah Foto Baru
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handlePhotoUpload} 
                    className="hidden" 
                  />
                </label>
                <span className="text-slate-300">|</span>
                <button 
                  onClick={() => handleFieldChange('photo', DEFAULT_DEV_PHOTO)}
                  className="text-xs font-bold text-rose-500 hover:text-rose-700 transition-colors"
                >
                  Reset Default
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <User size={16} className="text-slate-400" />
              Nama Pengembang
            </label>
            <input 
              type="text" 
              value={form.name} 
              onChange={e => handleFieldChange('name', e.target.value)}
              disabled={!isSuperadmin}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none disabled:bg-slate-50 text-slate-800 font-medium" 
              placeholder="Contoh: Nama Pengembang, S.Pd"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Mail size={16} className="text-slate-400" />
              Email Pengembang
            </label>
            <input 
              type="email" 
              value={form.email} 
              onChange={e => handleFieldChange('email', e.target.value)}
              disabled={!isAdminOrSuperadmin}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none disabled:bg-slate-50 text-slate-800" 
              placeholder="Email Pengembang"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <MessageSquare size={16} className="text-slate-400" />
            Moto / Kutipan Pengembang
          </label>
          <textarea 
            rows={3}
            value={form.moto}
            onChange={e => handleFieldChange('moto', e.target.value)}
            disabled={!isAdminOrSuperadmin}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none disabled:bg-slate-50 text-slate-800"
            placeholder="Tuliskan kata motivasi atau deskripsi singkat pengembang..."
          />
        </div>

        <div className="border-t border-[#CAF4FF] pt-6">
          <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Globe size={18} className="text-indigo-600" />
            Tautan Media Sosial & Kontak
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Phone size={16} className="text-emerald-500" />
                WhatsApp (Nomor / Link)
              </label>
              <input 
                type="text" 
                value={form.whatsapp} 
                onChange={e => handleFieldChange('whatsapp', e.target.value)}
                disabled={!isAdminOrSuperadmin}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none disabled:bg-slate-50 text-slate-800 text-sm" 
                placeholder="Contoh: https://wa.me/6281234567890"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Facebook size={16} className="text-blue-600" />
                Facebook URL
              </label>
              <input 
                type="url" 
                value={form.facebook} 
                onChange={e => handleFieldChange('facebook', e.target.value)}
                disabled={!isAdminOrSuperadmin}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none disabled:bg-slate-50 text-slate-800 text-sm" 
                placeholder="Contoh: https://facebook.com/username"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Instagram size={16} className="text-pink-600" />
                Instagram URL
              </label>
              <input 
                type="url" 
                value={form.instagram} 
                onChange={e => handleFieldChange('instagram', e.target.value)}
                disabled={!isAdminOrSuperadmin}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none disabled:bg-slate-50 text-slate-800 text-sm" 
                placeholder="Contoh: https://instagram.com/username"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Globe size={16} className="text-sky-500" />
                TikTok URL
              </label>
              <input 
                type="url" 
                value={form.tiktok} 
                onChange={e => handleFieldChange('tiktok', e.target.value)}
                disabled={!isAdminOrSuperadmin}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none disabled:bg-slate-50 text-slate-800 text-sm" 
                placeholder="Contoh: https://tiktok.com/@username"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Youtube size={16} className="text-red-600" />
                YouTube URL
              </label>
              <input 
                type="url" 
                value={form.youtube} 
                onChange={e => handleFieldChange('youtube', e.target.value)}
                disabled={!isAdminOrSuperadmin}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none disabled:bg-slate-50 text-slate-800 text-sm" 
                placeholder="Contoh: https://youtube.com/@channel"
              />
            </div>
          </div>
        </div>

        {isAdminOrSuperadmin && (
          <div className="border-t border-[#CAF4FF] pt-6 flex justify-end">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow hover:opacity-95 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              Simpan Perubahan
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeveloperInfoView;
