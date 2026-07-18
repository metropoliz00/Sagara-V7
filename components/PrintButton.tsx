import React from 'react';
import { Printer } from 'lucide-react';

interface PrintButtonProps {
  label?: string;
  className?: string;
  onClick?: () => void;
}

/**
 * A standardized print button component.
 * Usage:
 * <PrintButton />
 * 
 * Ensure the printable content is wrapped in an element with id="print-area"
 * or that your print styles target the correct container.
 */
export const PrintButton: React.FC<PrintButtonProps> = ({ 
  label = 'Cetak', 
  className,
  onClick 
}) => {
  const handlePrint = () => {
    if (onClick) {
      onClick();
    } else {
      window.print();
    }
  };

  return (
    <button 
      onClick={handlePrint} 
      className={`px-4 py-2 bg-[#5AB2FF] text-white rounded-lg font-bold flex items-center space-x-2 hover:bg-[#4A9FE6] transition-colors ${className}`}
    >
      <Printer size={16} />
      <span>{label}</span>
    </button>
  );
};
