import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      host: '0.0.0.0',
      port: 3000,
    },
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode === 'production' ? 'production' : 'development'),
      'process.env': JSON.stringify(env)
    },
    build: {
      chunkSizeWarningLimit: 2000, // Menaikkan batas peringatan ukuran chunk menjadi 2000 kB
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react-pdf') || id.includes('pdfjs-dist')) {
                return 'react-pdf';
              }
              if (id.includes('xlsx')) {
                return 'xlsx';
              }
              if (id.includes('jspdf') || id.includes('html2pdf')) {
                return 'jspdf';
              }
              if (id.includes('recharts') || id.includes('d3')) {
                return 'recharts';
              }
              if (id.includes('react-dom') || id.includes('react-router') || id.includes('framer-motion')) {
                return 'framework';
              }
              return 'vendor';
            }
            if (id.includes('/components/')) {
              const parts = id.split('/components/');
              const name = parts[parts.length - 1].split('.')[0].replace(/[\/\\\s]/g, '-').toLowerCase();
              return `comp-${name}`;
            }
          }
        }
      }
    },
  }
})