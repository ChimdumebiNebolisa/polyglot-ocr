import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/index.html'),
        background: resolve(__dirname, 'src/background/background.ts'),
        content: resolve(__dirname, 'src/content/content.ts'),
        offscreen: resolve(__dirname, 'src/offscreen/offscreen.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'background') return 'background.js'
          if (chunkInfo.name === 'content') return 'content.js'
          if (chunkInfo.name === 'offscreen') return 'offscreen.js'
          return '[name].js'
        },
        chunkFileNames: '[name].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.html')) {
            return 'src/[name]/[name].[ext]'
          }
          return '[name].[ext]'
        },
        // Ensure proper format for Chrome extensions
        format: 'iife',
        // Bundle everything into single files
        manualChunks: undefined,
      }
    },
    outDir: 'dist',
    emptyOutDir: true,
    // Ensure proper bundling for Chrome extensions
    target: 'es2015',
    minify: false, // Disable minification for debugging
  },
})
