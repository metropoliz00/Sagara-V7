import React, { useState } from 'react';
import PrintButton from './PrintButton';
import { PrintOrientation, PrintPreviewProps } from '../../types/print';
import { Eye, ZoomIn, ZoomOut, Maximize2, RefreshCw } from 'lucide-react';

/**
 * SAGARA Print Preview Component
 * Renders document in a realistic A4 sheet container for screen preview.
 * Resets cleanly for printer output.
 */
export const PrintPreview: React.FC<PrintPreviewProps> = ({
  children,
  title = 'Pratinjau Dokumen',
  orientation = 'portrait',
  className = '',
  showControls = true,
}) => {
  const [scale, setScale] = useState<number>(100);
  const [currentOrientation, setCurrentOrientation] = useState<PrintOrientation>(orientation);

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 10, 150));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 10, 50));
  const handleResetZoom = () => setScale(100);

  const toggleOrientation = () => {
    setCurrentOrientation((prev) => (prev === 'portrait' ? 'landscape' : 'portrait'));
  };

  const triggerPrint = () => {
    const originalTitle = document.title;
    if (title) document.title = title;

    if (currentOrientation === 'landscape') {
      document.body.classList.add('print-orientation-landscape');
    } else {
      document.body.classList.remove('print-orientation-landscape');
    }

    let styleTag = document.getElementById('sagara-dynamic-print-style');
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'sagara-dynamic-print-style';
      document.head.appendChild(styleTag);
    }
    styleTag.innerHTML = `@media print { @page { size: A4 ${currentOrientation}; margin: 10mm; } }`;

    window.print();

    const cleanup = () => {
      if (title) document.title = originalTitle;
      document.body.classList.remove('print-orientation-landscape');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    setTimeout(cleanup, 2000);
  };

  return (
    <div className={`sagara-preview-wrapper w-full ${className}`}>
      {/* Interactive Controls Bar */}
      {showControls && (
        <div className="no-print flex flex-wrap items-center justify-between bg-slate-900 text-white rounded-xl p-3 mb-4 shadow-lg">
          <div className="flex items-center space-x-3 mb-2 sm:mb-0">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400">
              <Eye className="w-4 h-4" />
            </span>
            <div>
              <h4 className="text-sm font-semibold text-slate-100">{title}</h4>
              <p className="text-xs text-slate-400">Pratinjau Kertas A4 • Skala {scale}%</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Orientation Toggle */}
            <button
              type="button"
              onClick={toggleOrientation}
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700 flex items-center space-x-1"
              title="Ubah Orientasi Kertas"
            >
              <span>{currentOrientation === 'portrait' ? 'Portrait (210×297mm)' : 'Landscape (297×210mm)'}</span>
            </button>

            {/* Zoom Controls */}
            <div className="hidden md:flex items-center space-x-1 bg-slate-800 rounded-lg p-1 border border-slate-700">
              <button
                type="button"
                onClick={handleZoomOut}
                className="p-1 hover:bg-slate-700 rounded text-slate-300"
                title="Perkecil"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                className="px-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 rounded"
                title="Reset Zoom"
              >
                {scale}%
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                className="p-1 hover:bg-slate-700 rounded text-slate-300"
                title="Perbesar"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Print Button */}
            <PrintButton label="Cetak Sekarang" onClick={triggerPrint} size="sm" />
          </div>
        </div>
      )}

      {/* Screen Preview Container with A4 Simulation */}
      <div className="sagara-a4-preview-container overflow-auto max-w-full py-6 bg-slate-100 rounded-2xl border border-slate-200 shadow-inner flex justify-center">
        <div
          className={`sagara-a4-sheet bg-white transition-all duration-200 ${
            currentOrientation === 'landscape'
              ? 'print-landscape landscape w-[297mm] min-h-[210mm]'
              : 'print-page portrait w-[210mm] min-h-[297mm]'
          }`}
          style={{
            transform: scale !== 100 ? `scale(${scale / 100})` : 'none',
            transformOrigin: 'top center',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default PrintPreview;
