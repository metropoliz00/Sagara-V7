import React, { ReactNode } from 'react';

interface PrintLayoutProps {
  children: ReactNode;
}

const PrintLayout: React.FC<PrintLayoutProps> = ({ children }) => {
  return (
    <div className="print-wrapper">
      <style type="text/css" media="print">
        {`
          @page {
            size: A4;
            margin: 10mm;
          }
          body {
            margin: 0;
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          /* Avoid page breaks inside important elements */
          .avoid-break {
            break-inside: avoid;
          }
          /* Force page break */
          .page-break {
            page-break-after: always;
          }
        `}
      </style>
      <div id="print-area">
        {children}
      </div>
    </div>
  );
};

export default PrintLayout;
