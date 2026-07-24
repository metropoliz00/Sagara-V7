import React, { ReactNode } from 'react';
import PrintManager from '../src/components/print/PrintManager';
import { PrintOrientation } from '../src/types/print';

interface PrintLayoutProps {
  children: ReactNode;
  title?: string;
  orientation?: PrintOrientation;
}

const PrintLayout: React.FC<PrintLayoutProps> = ({
  children,
  title = 'Dokumen',
  orientation = 'portrait',
}) => {
  return (
    <PrintManager title={title} orientation={orientation}>
      <div id="print-area">{children}</div>
    </PrintManager>
  );
};

export default PrintLayout;
