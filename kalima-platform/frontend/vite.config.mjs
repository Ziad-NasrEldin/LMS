import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api/v1': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist', // <- Important! Output outside frontend
    emptyOutDir: true,
    base: process.env.VITE_BASE_PATH || '/',
    cssMinify: 'lightningcss',
  },
  optimizeDeps: {
    exclude: ['dynamsoft-barcode-reader-bundle']
  },
})
