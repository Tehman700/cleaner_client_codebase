import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/auth':     'http://localhost:8000',
      '/plots':    'http://localhost:8000',
      '/schedule': 'http://localhost:8000',
      '/jobs':     'http://localhost:8000',
    },
  },
})
