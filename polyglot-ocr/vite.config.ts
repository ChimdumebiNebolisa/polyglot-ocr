import { defineConfig } from "vite";
import react from '@vitejs/plugin-react';
import { resolve } from "path";
import { copyFileSync, mkdirSync, existsSync } from 'fs';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    // Plugin to copy manifest.json and icons to dist
    {
      name: 'copy-extension-files',
      closeBundle() {
        // Copy manifest.json
        const manifestSrc = resolve(__dirname, 'manifest.json');
        const manifestDest = resolve(__dirname, 'dist/manifest.json');
        if (existsSync(manifestSrc)) {
          copyFileSync(manifestSrc, manifestDest);
          console.log('✓ Copied manifest.json to dist/');
        }

        // Copy icons directory
        const iconsSrc = resolve(__dirname, 'icons');
        const iconsDest = resolve(__dirname, 'dist/icons');
        if (existsSync(iconsSrc)) {
          mkdirSync(iconsDest, { recursive: true });
          
          // Copy all icon files
          const iconFiles = ['icon16.png', 'icon32.png', 'icon48.png', 'icon128.png'];
          iconFiles.forEach(iconFile => {
            const srcFile = resolve(iconsSrc, iconFile);
            const destFile = resolve(iconsDest, iconFile);
            if (existsSync(srcFile)) {
              copyFileSync(srcFile, destFile);
            }
          });
          console.log('✓ Copied icons to dist/icons/');
        }
      }
    }
  ],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    target: 'es2015',
    minify: false, // Disable minification for debugging
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "src/popup/index.html"),
        background: resolve(__dirname, "src/background/background.ts"),
        content: resolve(__dirname, "src/content/content.ts"),
        offscreen: resolve(__dirname, "src/offscreen/offscreen.ts"),
      },
      output: {
        dir: "dist",
        format: "esm",
        entryFileNames: "[name].js",
        chunkFileNames: "[name]-[hash].js",
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.html')) {
            return 'src/[name]/[name].[ext]'
          }
          return "[name].[ext]"
        },
        // Explicitly disable inlineDynamicImports for multiple entry points
        inlineDynamicImports: false,
        // Bundle everything into single files
        manualChunks: undefined,
      }
    }
  }
});
