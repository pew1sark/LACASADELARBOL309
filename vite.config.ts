import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// El código fuente vive en app/ para que la raíz del repositorio pueda alojar
// el sitio ya compilado: GitHub Pages sirve esta rama directamente.
// Ver scripts/publicar-en-raiz.sh
export default defineConfig(() => ({
  root: 'app',
  base: process.env.VITE_BASE_PATH ?? '/',
  envDir: '..',
  plugins: [react(), tailwindcss()],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        // Librerías en archivos aparte: cambian poco y quedan en caché entre
        // publicaciones, así la visita desde un anuncio carga más rápido.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
}))
