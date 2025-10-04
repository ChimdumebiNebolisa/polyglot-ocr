import { build } from 'vite';
import { resolve } from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function buildExtension() {
  console.log('Building Chrome Extension...');
  
  // First, run TypeScript compilation
  try {
    execSync('npx tsc', { stdio: 'inherit' });
    console.log('TypeScript compilation completed');
  } catch (error) {
    console.error('TypeScript compilation failed:', error.message);
    process.exit(1);
  }

  // Build each entry point separately
  const entries = [
    { name: 'popup', input: 'src/popup/index.html' },
    { name: 'background', input: 'src/background/background.ts' },
    { name: 'content', input: 'src/content/content.ts' },
    { name: 'offscreen', input: 'src/offscreen/offscreen.ts' }
  ];

  for (const entry of entries) {
    console.log(`Building ${entry.name}...`);
    
    try {
      await build({
        base: './',
        plugins: [(await import('@vitejs/plugin-react')).default()],
        build: {
          rollupOptions: {
            input: entry.input,
            output: {
              entryFileNames: entry.name === 'popup' ? 'popup.js' : `${entry.name}.js`,
              chunkFileNames: '[name].js',
              assetFileNames: (assetInfo) => {
                if (assetInfo.name?.endsWith('.html')) {
                  return `src/${entry.name}/${entry.name}.[ext]`;
                }
                return '[name].[ext]';
              }
            },
            external: (id) => {
              // Don't externalize anything - bundle everything
              return false;
            }
          },
          outDir: 'dist',
          emptyOutDir: entry === entries[0], // Only empty on first build
          target: 'es2015',
          minify: false,
          write: true
        }
      });
      
      console.log(`${entry.name} build completed`);
    } catch (error) {
      console.error(`Failed to build ${entry.name}:`, error);
      process.exit(1);
    }
  }

  // Copy additional files
  console.log('Copying additional files...');
  
  // Copy manifest.json and fix paths
  let manifestContent = fs.readFileSync('manifest.json', 'utf8');
  // Fix paths for dist directory - remove dist/ prefix since we're in the dist folder
  manifestContent = manifestContent.replace(/dist\//g, '');
  fs.writeFileSync('dist/manifest.json', manifestContent);
  
  // Copy icons
  if (!fs.existsSync('dist/icons')) {
    fs.mkdirSync('dist/icons', { recursive: true });
  }
  
  const iconFiles = ['icon16.png', 'icon32.png', 'icon48.png', 'icon128.png'];
  for (const icon of iconFiles) {
    if (fs.existsSync(`icons/${icon}`)) {
      fs.copyFileSync(`icons/${icon}`, `dist/icons/${icon}`);
    }
  }
  
  // Copy CSS files
  if (fs.existsSync('src/content/content.css')) {
    fs.copyFileSync('src/content/content.css', 'dist/content.css');
  }
  
  // Copy offscreen HTML file
  if (fs.existsSync('src/offscreen/offscreen.html')) {
    // Ensure the offscreen directory exists
    if (!fs.existsSync('dist/src/offscreen')) {
      fs.mkdirSync('dist/src/offscreen', { recursive: true });
    }
    fs.copyFileSync('src/offscreen/offscreen.html', 'dist/src/offscreen/offscreen.html');
  }
  
  console.log('Chrome Extension build completed successfully!');
}

buildExtension().catch(console.error);
