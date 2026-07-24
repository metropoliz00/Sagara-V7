import React, { useEffect, useRef, useCallback } from 'react';
import PrintButton from './PrintButton';
import { PrintOrientation } from '../../types/print';
import { Printer, FileText, Compass } from 'lucide-react';

export interface PrintManagerProps {
  children: React.ReactNode;
  title?: string;
  orientation?: PrintOrientation;
  showPrintButton?: boolean;
  autoPrint?: boolean;
  onPrint?: () => void;
  headerTitle?: string;
  subtitle?: string;
  className?: string;
}

/**
 * SAGARA Global Print Manager
 * Standardized print wrapper component for all SAGARA modules.
 * Standard Paper: A4 (210mm x 297mm), Margin: 10mm all sides.
 */
export const PrintManager: React.FC<PrintManagerProps> = ({
  children,
  title = 'Dokumen',
  orientation = 'portrait',
  showPrintButton = true,
  autoPrint = false,
  onPrint,
  headerTitle,
  subtitle,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePrint = useCallback(() => {
    // Save original document title
    const originalTitle = document.title;
    if (title) {
      document.title = title;
    }

    // Set body class for orientation
    if (orientation === 'landscape') {
      document.body.classList.add('print-orientation-landscape');
    } else {
      document.body.classList.remove('print-orientation-landscape');
    }

    // Dynamic @page style injection
    let styleTag = document.getElementById('sagara-dynamic-print-style');
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'sagara-dynamic-print-style';
      document.head.appendChild(styleTag);
    }
    styleTag.innerHTML = `@media print { @page { size: A4 ${orientation}; margin: 10mm; } }`;

    if (onPrint) {
      onPrint();
    }

    // Trigger browser print
    window.print();

    // Cleanup title and class after print dialog handles
    const cleanup = () => {
      if (title) {
        document.title = originalTitle;
      }
      document.body.classList.remove('print-orientation-landscape');
      window.removeEventListener('afterprint', cleanup);
    };

    window.addEventListener('afterprint', cleanup);
    setTimeout(cleanup, 2000);
  }, [title, orientation, onPrint]);

  useEffect(() => {
    if (autoPrint) {
      const timer = setTimeout(() => {
        handlePrint();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [autoPrint, handlePrint]);

  return (
    <div className={`sagara-print-wrapper w-full ${className}`} ref={containerRef}>
      {/* Top Screen Toolbar (Hidden on Print) */}
      {showPrintButton && (
        <div className="no-print sagara-print-toolbar flex items-center justify-between bg-white border border-slate-200 rounded-xl p-3.5 mb-5 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#5AB2FF] flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-slate-800 text-sm md:text-base">
                  {headerTitle || title}
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider">
                  A4 {orientation}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {subtitle || 'Siap dicetak dengan standar A4 margin 10mm'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <PrintButton
              label="Cetak Dokumen"
              onClick={handlePrint}
              icon={<Printer className="w-4 h-4" />}
            />
          </div>
        </div>
      )}

      {/* Main Document Content Container */}
      <div
        id="print-area"
        className={`sagara-print-content print-page ${
          orientation === 'landscape' ? 'print-landscape' : 'print-portrait'
        }`}
      >
        {children}
      </div>
    </div>
  );
};

export default PrintManager;
