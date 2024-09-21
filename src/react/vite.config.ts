import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
        output: {
            dir: 'dist/assets/',
            entryFileNames: 'static/index.js',
            assetFileNames: 'static/index.css',
            //chunkFileNames: "chunk.js",
            manualChunks: undefined,
        }
    }
  }
})
