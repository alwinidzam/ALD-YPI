import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'firebase-core': ['firebase/app', 'firebase/auth'],
            'firebase-db': ['firebase/firestore'],
            'ui-icons': ['lucide-react'],
            'ui-motion': ['motion/react', 'framer-motion'],
            'ui-charts': ['recharts'],
            'scanner': ['@zxing/library', '@zxing/browser'],
            'pdf-export': ['jspdf', 'jspdf-autotable', 'html2canvas']
          }
        }
      }
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR === 'true' ? false : {
        protocol: 'wss',
        clientPort: 443,
      },
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
