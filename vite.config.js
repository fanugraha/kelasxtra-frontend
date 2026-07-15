import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // Build di-deploy langsung ke root domain kelasxtra.my.id (nginx serve dari /var/www/kelasxtra-frontend/dist).
  // base '/app/' penting supaya URL asset (JS/CSS) hasil build selalu absolut
  // ke /app/assets/..., benar dipanggil dari path manapun (/login, /app/dashboard, dst)
  // — bukan relatif ke folder index.html-nya diakses.
  base: '/',
  plugins: [react(), tailwindcss()],
})