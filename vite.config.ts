import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: './',  // Add this line to set the base path
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
})