import Tesseract from 'tesseract.js';
import { OCRRequest, OCRResponse } from '../types';

/**
 * Extracts text from an image using Tesseract.js OCR
 * @param imageBlob - Image data as Blob
 * @returns Promise<string> - Extracted text
 */
export async function extractTextFromImage(imageBlob: Blob): Promise<string> {
  try {
    console.log('Starting OCR processing...');
    
    // Convert blob to image URL for Tesseract
    const imageUrl = URL.createObjectURL(imageBlob);
    
    try {
      // Use Tesseract.js to recognize text
      const { data: { text } } = await Tesseract.recognize(
        imageUrl,
        'eng', // Language - can be made configurable
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
            }
          }
        }
      );
      
      const extractedText = text.trim();
      console.log('OCR extraction complete:', extractedText);
      
      return extractedText;
    } finally {
      // Clean up the object URL
      URL.revokeObjectURL(imageUrl);
    }
  } catch (error) {
    console.error('OCR processing failed:', error);
    throw new Error(`OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Processes an OCR request with additional metadata
 * @param request - OCR request containing image data
 * @returns Promise<OCRResponse> - OCR response with text and confidence
 */
export async function processOCRRequest(request: OCRRequest): Promise<OCRResponse> {
  try {
    console.log('Processing OCR request...');
    
    // Convert base64 to blob
    const imageBlob = base64ToBlob(request.imageData);
    
    // Extract text using Tesseract
    const text = await extractTextFromImage(imageBlob);
    
    // Calculate confidence (simplified - Tesseract provides confidence per word)
    const confidence = text.length > 0 ? 0.8 : 0.0; // Placeholder confidence
    
    const response: OCRResponse = {
      text,
      confidence
    };
    
    console.log('OCR request processed:', response);
    return response;
  } catch (error) {
    console.error('OCR request failed:', error);
    throw error;
  }
}

/**
 * Converts base64 string to Blob
 * @param base64 - Base64 encoded image data
 * @returns Blob - Image blob
 */
function base64ToBlob(base64: string): Blob {
  try {
    // Remove data URL prefix if present
    const base64Data = base64.replace(/^data:image\/[a-z]+;base64,/, '');
    
    // Convert base64 to binary
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Determine MIME type from base64 prefix
    let mimeType = 'image/png';
    if (base64.startsWith('data:image/jpeg')) {
      mimeType = 'image/jpeg';
    } else if (base64.startsWith('data:image/png')) {
      mimeType = 'image/png';
    } else if (base64.startsWith('data:image/webp')) {
      mimeType = 'image/webp';
    }
    
    return new Blob([bytes], { type: mimeType });
  } catch (error) {
    console.error('Failed to convert base64 to blob:', error);
    throw new Error('Invalid base64 image data');
  }
}

/**
 * Captures a screenshot of a specific area and returns it as base64
 * @param x - X coordinate of the area
 * @param y - Y coordinate of the area
 * @param width - Width of the area
 * @param height - Height of the area
 * @returns Promise<string> - Base64 encoded image data
 */
export async function captureAreaScreenshot(
  x: number,
  y: number,
  width: number,
  height: number
): Promise<string> {
  try {
    console.log('Capturing area screenshot:', { x, y, width, height });
    
    // Use Chrome's captureVisibleTab API
    const dataUrl = await chrome.tabs.captureVisibleTab({
      format: 'png',
      quality: 100
    });
    
    // Convert to canvas to crop the specific area
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }
    
    const img = new Image();
    
    return new Promise((resolve, reject) => {
      img.onload = () => {
        try {
          // Set canvas size to the cropped area
          canvas.width = width;
          canvas.height = height;
          
          // Draw the cropped portion
          ctx.drawImage(
            img,
            x, y, width, height,  // Source rectangle
            0, 0, width, height   // Destination rectangle
          );
          
          // Convert to base64
          const croppedDataUrl = canvas.toDataURL('image/png');
          console.log('Area screenshot captured successfully');
          resolve(croppedDataUrl);
        } catch (error) {
          console.error('Failed to crop screenshot:', error);
          reject(error);
        }
      };
      
      img.onerror = () => {
        console.error('Failed to load screenshot image');
        reject(new Error('Failed to load screenshot'));
      };
      
      img.src = dataUrl;
    });
  } catch (error) {
    console.error('Screenshot capture failed:', error);
    throw error;
  }
}
