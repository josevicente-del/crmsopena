import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configuración corporativa Vite: Exposición en 0.0.0.0 para acceso local y de red
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    cors: true
  },
  preview: {
    host: true,
    port: 5173,
    cors: true
  }
})
