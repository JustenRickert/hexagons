import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    proxy: {
      '/ws': {
        target: 'ws://localhost:8001',
        ws: true
      }
    }
  },
  plugins: [preact()],
})
