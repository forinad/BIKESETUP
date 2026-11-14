import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Относительные пути нужны для запуска собранной версии из файла (Electron).
  base: './',
  plugins: [react(), tailwindcss()],
  server: {
    watch: {
      // electron-builder пишет в release/, не нужно перезапускать Vite на эти файлы
      ignored: ['**/release/**', '**/dist/**'],
    },
  },
})
