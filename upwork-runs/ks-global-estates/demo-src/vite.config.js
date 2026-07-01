import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/demos/ks-global-estates/',
  build: {
    outDir: '../../../../michaelwegter.com/public/demos/ks-global-estates',
    emptyOutDir: true
  }
})
