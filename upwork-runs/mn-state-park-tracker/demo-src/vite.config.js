import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/demos/mn-state-park-tracker/',
  build: {
    outDir: '../../../../michaelwegter.com/public/demos/mn-state-park-tracker',
    emptyOutDir: true
  }
})
