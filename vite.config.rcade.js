import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  root: './rcade',
  build: {
    outDir: resolve(__dirname, 'dist-rcade'),
    emptyOutDir: true,
  },
  // Serve games folder as static assets (for game assets like images/audio)
  publicDir: resolve(__dirname, 'games'),
  server: {
    port: 5173,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'client'),
    },
  },
})
