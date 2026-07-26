import React, { useState, useRef } from 'react';
import { UploadCloud, File as FileIcon } from 'lucide-react';
import { useAlert } from '../contexts/AlertContext';

interface FileUploadProps {
  label?: string;
  value?: string;
  onChange: (base64: string, filename?: string) => void;
  accept?: string;
  className?: string;
  compact?: boolean;
}

export default function FileUpload({ 
  label = "Upload File", 
  value, 
  onChange, 
  accept = "*/*",
  className = "",
  compact = false
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  let customAlert: any = null;
  try {
    const context = useAlert();
    customAlert = context.alert;
  } catch (e) {
    customAlert = async (msg: string) => { alert(msg); };
  }

  const processFile = async (file: File) => {
    // Limit file size to 1.5 MB to prevent database bloat
    const MAX_SIZE_MB = 1.5;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      if (customAlert) {
         await customAlert(
           `Ukuran file '${file.name}' terlalu besar (${(file.size / (1024 * 1024)).toFixed(2)} MB).\n\nUntuk menjaga performa sistem tetap ringan dan cepat, batas maksimal upload dokumen langsung adalah ${MAX_SIZE_MB} MB. Silakan kompres file Anda terlebih dahulu, atau upload ke Google Drive/OneDrive lalu bagikan link/tautannya di deskripsi/konten.`,
           "Ukuran File Melebihi Batas",
           "error"
         );
      }
      return;
    }

    setIsLoading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      onChange(dataUrl, file.name);
      setIsLoading(false);
    };
    
    reader.onerror = () => {
      if (customAlert) {
        customAlert("Gagal membaca file yang dipilih.", "Error", "error");
      }
      setIsLoading(false);
    };
    
    reader.readAsDataURL(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <label className="block text-sm font-semibold text-gray-700">{label}</label>}
      <div 
        className={`relative border-2 border-dashed rounded-xl overflow-hidden transition-colors ${
          isDragging ? 'border-main-blue bg-blue-50/50' : 'border-gray-200 hover:border-main-blue/50 bg-gray-50'
        } ${value ? 'p-2' : 'p-6'}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept={accept}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              processFile(e.target.files[0]);
            }
          }}
        />
        
        {isLoading ? (
          <div className="flex flex-col flex-1 items-center justify-center p-4">
             <div className="w-8 h-8 rounded-full border-2 border-main-blue border-t-transparent animate-spin mb-2"></div>
             {!compact && <p className="text-xs text-gray-500 font-medium">Memproses file...</p>}
          </div>
        ) : value ? (
          compact ? (
             <div className="w-10 h-10 rounded-full overflow-hidden shadow-sm shrink-0 bg-white p-0.5 mx-auto flex items-center justify-center">
               <FileIcon className="w-5 h-5 text-main-blue" />
             </div>
          ) : (
            <div className="flex gap-4 items-center">
               <div className="w-16 h-16 rounded-xl overflow-hidden shadow-sm shrink-0 bg-white p-3 flex items-center justify-center">
                 <FileIcon className="w-8 h-8 text-main-blue" />
               </div>
               <div className="flex-1 overflow-hidden">
                 <p className="text-sm font-semibold text-gray-700 mb-1 truncate">File terpilih</p>
                 <p className="text-xs text-gray-500 truncate">Klik atau drag untuk mengganti.</p>
               </div>
            </div>
          )
        ) : (
          compact ? (
            <div className="flex flex-col items-center justify-center text-center cursor-pointer p-1">
              <UploadCloud className="w-5 h-5 text-gray-400 hover:text-main-blue transition-colors" />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center cursor-pointer">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-3">
                <UploadCloud className="w-6 h-6 text-main-blue" />
              </div>
              <p className="text-sm font-bold text-gray-700 mb-1">Pilih File</p>
              <p className="text-xs text-gray-500 max-w-[200px] mx-auto">Klik atau drag & drop file. File akan diubah menjadi format data didatabase.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
