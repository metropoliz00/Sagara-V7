import { motion, AnimatePresence } from "motion/react";
import { X, AlertCircle, CheckCircle } from "lucide-react";
import React from "react";

export type AlertModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  type?: 'info' | 'confirm' | 'success' | 'error';
  onConfirm?: () => void;
};

export default function AlertModal({ isOpen, onClose, title, message, type = 'info', onConfirm }: AlertModalProps) {
  const isConfirm = type === 'confirm';
  const isError = type === 'error';
  const isSuccess = type === 'success';

  const bgColor = isConfirm ? 'bg-amber-50' : isError ? 'bg-red-50' : isSuccess ? 'bg-green-50' : 'bg-blue-50';
  const iconColor = isConfirm ? 'text-amber-600' : isError ? 'text-red-600' : isSuccess ? 'text-green-600' : 'text-blue-600';
  const buttonColor = isConfirm ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/30' : isError ? 'bg-red-600 hover:bg-red-700 shadow-red-600/30' : isSuccess ? 'bg-green-600 hover:bg-green-700 shadow-green-600/30' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30';
  const Icon = isConfirm ? AlertCircle : isError ? AlertCircle : isSuccess ? CheckCircle : AlertCircle;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4 py-6 overflow-y-auto w-full h-full">
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
            className="relative w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl my-auto"
          >
            <div className={`p-6 pb-3 ${bgColor} text-gray-800 relative`}>
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 hover:bg-black/5 rounded-full transition-colors text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3 mb-2">
                <Icon className={`w-8 h-8 ${iconColor}`} />
                <h3 className="font-heading text-xl font-bold">{title || (isConfirm ? 'Konfirmasi' : isError ? 'Terjadi Kesalahan' : isSuccess ? 'Berhasil' : 'Informasi')}</h3>
              </div>
            </div>

            <div className="p-6">
              <p className="text-gray-600 mb-6">{message}</p>
              
              <div className="flex gap-3">
                {isConfirm && (
                  <button 
                    onClick={onClose}
                    className="flex-1 py-3 px-4 border border-gray-300 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Batal
                  </button>
                )}
                <button 
                  onClick={() => {
                    if (isConfirm && onConfirm) onConfirm();
                    onClose();
                  }}
                  className={`flex-1 py-3 px-4 text-white font-semibold rounded-xl transition-all shadow-lg ${buttonColor}`}
                >
                  {isConfirm ? 'Ya' : 'OK'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
