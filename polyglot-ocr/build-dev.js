import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Building Polyglot OCR extension...');

try {
  // Run TypeScript compilation and Vite build
  console.log('Running TypeScript compilation and Vite build...');
  execSync('npm run build', { stdio: 'inherit' });
  
  // Copy offscreen HTML file to dist directory and fix script path
  console.log('Copying offscreen HTML file...');
  const srcOffscreenHtml = path.join(__dirname, 'src/offscreen/offscreen.html');
  const distOffscreenDir = path.join(__dirname, 'dist/src/offscreen');
  const distOffscreenHtml = path.join(distOffscreenDir, 'offscreen.html');
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(distOffscreenDir)) {
    fs.mkdirSync(distOffscreenDir, { recursive: true });
  }
  
  // Read the source HTML file and fix the script path
  let htmlContent = fs.readFileSync(srcOffscreenHtml, 'utf8');
  htmlContent = htmlContent.replace('src="offscreen.js"', 'src="../../offscreen.js"');
  
  // Write the modified content to dist
  fs.writeFileSync(distOffscreenHtml, htmlContent);
  
  // Copy manifest.json to dist with corrected paths
  console.log('Copying and fixing manifest.json...');
  const srcManifest = path.join(__dirname, 'manifest.json');
  const distManifest = path.join(__dirname, 'dist', 'manifest.json');
  
  let manifestContent = fs.readFileSync(srcManifest, 'utf8');
  // Fix paths for dist directory
  manifestContent = manifestContent.replace(/dist\//g, '');
  fs.writeFileSync(distManifest, manifestContent);
  
  // Copy icons directory to dist
  console.log('Copying icons...');
  const srcIconsDir = path.join(__dirname, 'icons');
  const distIconsDir = path.join(__dirname, 'dist', 'icons');
  
  if (fs.existsSync(srcIconsDir)) {
    if (!fs.existsSync(distIconsDir)) {
      fs.mkdirSync(distIconsDir, { recursive: true });
    }
    
    const iconFiles = fs.readdirSync(srcIconsDir);
    iconFiles.forEach(file => {
      if (file.endsWith('.png')) {
        const srcIcon = path.join(srcIconsDir, file);
        const distIcon = path.join(distIconsDir, file);
        fs.copyFileSync(srcIcon, distIcon);
      }
    });
  }
  
  console.log('Build completed successfully!');
  console.log('Extension files are ready in the dist/ directory');
  console.log('Load the extension from the dist/ folder in Chrome');
  
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}