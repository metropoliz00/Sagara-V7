import { useCallback } from 'react';
import { PrintOrientation } from '../types/print';

interface UsePrintOptions {
  title?: string;
  orientation?: PrintOrientation;
}

/**
 * SAGARA Global Print Hook
 * Provides a standardized method to trigger window.print() with optional title and orientation configuration.
 */
export const usePrint = (options?: UsePrintOptions) => {
  const print = useCallback(
    (customTitle?: string, customOrientation?: PrintOrientation) => {
      const activeTitle = customTitle || options?.title;
      const activeOrientation = customOrientation || options?.orientation || 'portrait';

      const originalTitle = document.title;
      if (activeTitle) {
        document.title = activeTitle;
      }

      // Handle orientation dynamically if landscape
      if (activeOrientation === 'landscape') {
        document.body.classList.add('print-orientation-landscape');
      } else {
        document.body.classList.remove('print-orientation-landscape');
      }

      // Ensure style tag for print orientation if needed
      let styleTag = document.getElementById('sagara-dynamic-print-style');
      if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'sagara-dynamic-print-style';
        document.head.appendChild(styleTag);
      }

      styleTag.innerHTML = `@media print { @page { size: A4 ${activeOrientation}; margin: 10mm; } }`;

      // Mobile-Safe Print Engine Isolation: clone #print-area directly to document.body
      const printTarget = document.getElementById('print-area') || document.querySelector('.sagara-print-content');
      if (printTarget) {
        let standaloneContainer = document.getElementById('sagara-standalone-print-container');
        if (!standaloneContainer) {
          standaloneContainer = document.createElement('div');
          standaloneContainer.id = 'sagara-standalone-print-container';
          document.body.appendChild(standaloneContainer);
        }
        standaloneContainer.innerHTML = '';
        const clonedContent = printTarget.cloneNode(true) as HTMLElement;
        clonedContent.id = 'sagara-cloned-print-content';
        clonedContent.className = `sagara-print-content print-page ${
          activeOrientation === 'landscape' ? 'print-landscape' : 'print-portrait'
        }`;
        standaloneContainer.appendChild(clonedContent);
      }

      // Trigger standard browser print window
      window.print();

      // Clean up after print window opens
      const cleanup = () => {
        if (activeTitle) {
          document.title = originalTitle;
        }
        document.body.classList.remove('print-orientation-landscape');
        const containerToRemove = document.getElementById('sagara-standalone-print-container');
        if (containerToRemove) {
          containerToRemove.innerHTML = '';
        }
        window.removeEventListener('afterprint', cleanup);
      };

      window.addEventListener('afterprint', cleanup);

      // Fallback cleanup timer in case afterprint isn't fired
      setTimeout(cleanup, 2000);
    },
    [options?.title, options?.orientation]
  );

  return { print };
};

export default usePrint;
