import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
        sw: './public/service-worker.js'
      },
      output: {
        entryFileNames: (assetInfo) => {
          return assetInfo.name === 'sw' 
            ? 'service-worker.js'  // Keep service worker at root
            : 'assets/[name]-[hash].js';
        }
      }
    }
  },
  // Ensure service worker and manifest are copied to dist
  publicDir: 'public'
})
