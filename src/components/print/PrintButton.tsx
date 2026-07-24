import React from 'react';
import { Printer } from 'lucide-react';

export interface PrintButtonProps {
  label?: string;
  className?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  disabled?: boolean;
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * SAGARA Reusable Global Print Button
 * Automatically includes class 'no-print' to prevent appearing on printed documents.
 */
export const PrintButton: React.FC<PrintButtonProps> = ({
  label = 'Cetak Dokumen',
  className = '',
  onClick,
  variant = 'primary',
  disabled = false,
  icon,
  size = 'md',
}) => {
  const handlePrint = () => {
    if (disabled) return;
    if (onClick) {
      onClick();
    } else {
      window.print();
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-slate-700 hover:bg-slate-800 text-white shadow-sm';
      case 'outline':
        return 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm';
      case 'danger':
        return 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm';
      case 'ghost':
        return 'bg-transparent hover:bg-slate-100 text-slate-700';
      case 'primary':
      default:
        return 'bg-[#5AB2FF] hover:bg-[#4A9FE6] text-white shadow-md hover:shadow-lg';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-xs gap-1.5 rounded-md';
      case 'lg':
        return 'px-6 py-3 text-base gap-2.5 rounded-xl font-bold';
      case 'md':
      default:
        return 'px-4 py-2 text-sm gap-2 rounded-lg font-medium';
    }
  };

  return (
    <button
      type="button"
      onClick={handlePrint}
      disabled={disabled}
      className={`no-print print-button inline-flex items-center justify-center transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer ${getVariantClasses()} ${getSizeClasses()} ${className}`}
      title="Cetak Dokumen (A4)"
    >
      {icon || <Printer className={size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />}
      <span>{label}</span>
    </button>
  );
};

export default PrintButton;
