import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  base: '/demos/agripro/',
  build: {
    outDir: '../../../../michaelwegter.com/public/demos/agripro',
    emptyOutDir: true,
  },
  optimizeDeps: { exclude: ['tesseract.js'] },
});
