const fs = require('fs');
const path = require('path');

// Simple PNG icon generator using Canvas API
async function createIcons() {
  try {
    // Check if canvas is available
    const { createCanvas } = require('canvas');
    
    const sizes = [16, 32, 48, 128];
    
    for (const size of sizes) {
      const canvas = createCanvas(size, size);
      const ctx = canvas.getContext('2d');
      
      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, size, size);
      gradient.addColorStop(0, '#667eea');
      gradient.addColorStop(1, '#764ba2');
      
      // Draw background circle
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(size/2, size/2, size/2 - 2, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw white border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw microphone icon (left)
      const micX = size * 0.2;
      const micY = size * 0.3;
      const micSize = size * 0.15;
      
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(micX + micSize/2, micY + micSize, micSize/2, micSize * 1.2);
      ctx.fillRect(micX, micY + micSize * 0.8, micSize * 1.5, micSize * 0.4);
      ctx.fillRect(micX + micSize * 0.6, micY + micSize * 2.2, micSize * 0.3, micSize * 0.4);
      ctx.fillRect(micX + micSize/2, micY + micSize * 2.6, micSize/2, micSize * 0.2);
      
      // Draw translation arrows (center)
      const arrowX = size * 0.45;
      const arrowY = size * 0.45;
      const arrowSize = size * 0.1;
      
      ctx.fillStyle = '#ffffff';
      // Left arrow
      ctx.beginPath();
      ctx.moveTo(arrowX, arrowY);
      ctx.lineTo(arrowX + arrowSize, arrowY);
      ctx.lineTo(arrowX + arrowSize * 0.7, arrowY - arrowSize * 0.3);
      ctx.lineTo(arrowX + arrowSize * 1.3, arrowY);
      ctx.lineTo(arrowX + arrowSize * 0.7, arrowY + arrowSize * 0.3);
      ctx.closePath();
      ctx.fill();
      
      // Right arrow
      ctx.beginPath();
      ctx.moveTo(arrowX + arrowSize * 2, arrowY);
      ctx.lineTo(arrowX + arrowSize, arrowY);
      ctx.lineTo(arrowX + arrowSize * 1.3, arrowY - arrowSize * 0.3);
      ctx.lineTo(arrowX + arrowSize * 0.7, arrowY);
      ctx.lineTo(arrowX + arrowSize * 1.3, arrowY + arrowSize * 0.3);
      ctx.closePath();
      ctx.fill();
      
      // Draw camera icon (right)
      const camX = size * 0.65;
      const camY = size * 0.3;
      const camSize = size * 0.2;
      
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(camX, camY + camSize * 0.3, camSize * 1.2, camSize * 0.8);
      ctx.fillStyle = '#667eea';
      ctx.beginPath();
      ctx.arc(camX + camSize * 0.6, camY + camSize * 0.7, camSize * 0.3, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw text lines (bottom)
      const textY = size * 0.75;
      const textWidth = size * 0.6;
      const textHeight = size * 0.02;
      
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 0.8;
      ctx.fillRect(size * 0.2, textY, textWidth, textHeight);
      ctx.globalAlpha = 0.6;
      ctx.fillRect(size * 0.2, textY + textHeight * 3, textWidth * 0.8, textHeight);
      ctx.globalAlpha = 0.4;
      ctx.fillRect(size * 0.2, textY + textHeight * 6, textWidth * 0.7, textHeight);
      ctx.globalAlpha = 1;
      
      // Save the icon
      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(path.join(__dirname, 'icons', `icon${size}.png`), buffer);
      console.log(`Created icon${size}.png`);
    }
    
    console.log('All icons created successfully!');
    
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.log('Canvas module not found. Installing...');
      const { execSync } = require('child_process');
      execSync('npm install canvas', { stdio: 'inherit' });
      
      // Retry after installation
      console.log('Retrying icon creation...');
      return createIcons();
    } else {
      throw error;
    }
  }
}

createIcons().catch(console.error);
