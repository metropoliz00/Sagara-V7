
import React from 'react';
import { SchoolProfileData } from '../../types';
import { compressImage } from '../../utils/imageHelper';
import { Code, Image as ImageIcon, MessageSquare, Edit } from 'lucide-react';

interface DeveloperInfoTabProps {
  school: SchoolProfileData;
  setSchool: React.Dispatch<React.SetStateAction<SchoolProfileData>>;
  isReadOnly?: boolean;
}

const PERMANENT_DEV_NAME = "Dedy Meyga Saputra, S.Pd, M.Pd";
const PERMANENT_DEV_PHOTO = "https://www.image2url.com/r2/default/images/1782534086979-5b315be8-d0b6-425a-8674-00f0fc9c3064.jpg";
const DEV_SOCIALS = {
    whatsapp: '085604431706',
    facebook: 'https://www.facebook.com/share/18ivFCu4Fh/',
    instagram: 'https://www.instagram.com/dedy_meyga?igsh=cGp5ZTQ4bzFwZGp5',
    tiktok: 'https://vt.tiktok.com/ZSXLjPNJQ/',
    youtube: 'https://youtube.com/@masgurupemula4766?si=bearyAkgJTr0eGkO',
    email: 'metropoliz00@gmail.com'
};

const DeveloperInfoTab: React.FC<DeveloperInfoTabProps> = ({ school, setSchool, isReadOnly }) => {
    const devInfo = school.developerInfo || { 
        name: PERMANENT_DEV_NAME, 
        moto: '', 
        photo: PERMANENT_DEV_PHOTO
    };

    const handleFieldChange = (field: string, value: string) => {
        if (isReadOnly) return;
        setSchool(prev => {
            const currentDevInfo = prev.developerInfo || { name: PERMANENT_DEV_NAME, moto: '', photo: PERMANENT_DEV_PHOTO };
            return {
                ...prev,
                developerInfo: { ...currentDevInfo, [field]: value, name: PERMANENT_DEV_NAME, photo: PERMANENT_DEV_PHOTO }
            };
        });
    };
    
    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (isReadOnly) return;
        const file = e.target.files?.[0];
        if (file) {
            try {
                const base64 = await compressImage(file, 200, 0.7);
                setSchool(prev => ({
                    ...prev,
                    developerInfo: { ...(prev.developerInfo || { name: '', moto: '', photo: '' }), photo: base64 }
                }));
            } catch (error) {
                console.error("Gagal upload foto pengembang", error);
            }
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <h3 className="text-lg font-bold text-gray-800 border-b pb-2 flex items-center">
                <Code size={20} className="mr-2 text-indigo-600"/>
                Info Pengembang Aplikasi
            </h3>
            
            <p className="text-sm text-gray-500 bg-indigo-50 border border-indigo-100 p-3 rounded-lg">
                Informasi ini akan ditampilkan dalam pop-up di halaman login untuk memberikan kredit kepada pengembang.
            </p>

            <div className="flex items-center gap-6">
                <div 
                    className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gray-100 border-4 border-white shadow-md overflow-hidden relative"
                >
                    <img src={PERMANENT_DEV_PHOTO} alt="Developer" className="w-full h-full object-cover object-top"/>
                </div>
                <div>
                    <h4 className="font-bold text-gray-700">Foto Pengembang</h4>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Pengembang</label>
                <input 
                    type="text" 
                    value={PERMANENT_DEV_NAME} 
                    disabled={true}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 outline-none" 
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Moto / Kutipan</label>
                <textarea 
                    rows={2}
                    value={devInfo.moto || ''}
                    onChange={e => handleFieldChange('moto', e.target.value)}
                    disabled={isReadOnly}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none resize-none disabled:bg-gray-50"
                />
            </div>

                        <div className="space-y-3">
                <h4 className="font-bold text-gray-700">Kontak Pengembang</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <p><strong>WhatsApp:</strong> <a href={`https://wa.me/${DEV_SOCIALS.whatsapp}`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">{DEV_SOCIALS.whatsapp}</a></p>
                    <p><strong>Facebook:</strong> <a href={DEV_SOCIALS.facebook} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Link Profil</a></p>
                    <p><strong>Instagram:</strong> <a href={DEV_SOCIALS.instagram} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Link Profil</a></p>
                    <p><strong>TikTok:</strong> <a href={DEV_SOCIALS.tiktok} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Link Profil</a></p>
                    <p><strong>YouTube:</strong> <a href={DEV_SOCIALS.youtube} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Link Channel</a></p>
                    <p><strong>Email:</strong> <a href={`mailto:${DEV_SOCIALS.email}`} className="text-indigo-600 hover:underline">{DEV_SOCIALS.email}</a></p>
                </div>
            </div>
        </div>
    );
};

export default DeveloperInfoTab;
