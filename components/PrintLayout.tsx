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
          @media print {
            body {
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .no-print {
              display: none !important;
            }
            .print-only {
              display: block !important;
            }
            /* Reset transform and scaling for print */
            #print-area, #print-area > div {
              transform: none !important;
              width: 100% !important;
              max-width: none !important;
              margin: 0 !important;
              padding: 0 !important;
              box-shadow: none !important;
              min-height: 0 !important;
            }
            /* Avoid page breaks inside important elements */
            .avoid-break {
              break-inside: avoid;
              page-break-inside: avoid;
            }
            /* Force page break */
            .page-break {
              break-before: page;
            }
            /* Typography fixes for print */
            h1, h2, h3, h4 {
              break-after: avoid;
            }
            img {
              max-width: 100% !important;
            }
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
