import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/demos/client-finder-1-0/',
  build: {
    outDir: '../../../../michaelwegter.com/public/demos/client-finder-1-0',
    emptyOutDir: true,
  },
  optimizeDeps: {
    exclude: ['@huggingface/transformers'],
  },
  worker: {
    format: 'es',
  },
});
