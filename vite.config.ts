import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// El base path permite publicar tanto en un subdirectorio de GitHub Pages
// (/LACASADELARBOL309/) como en un dominio propio (/).
export default defineConfig(() => ({
  base: process.env.VITE_BASE_PATH ?? '/',
  plugins: [react(), tailwindcss()],
  build: { outDir: 'dist', sourcemap: false },
}))
