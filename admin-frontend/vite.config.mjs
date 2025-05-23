import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'https://starship-api.onrender.com',
        changeOrigin: true,
        secure: true
      }
    }
  }
})