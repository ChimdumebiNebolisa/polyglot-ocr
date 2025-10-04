/**
 * Configuration for Polyglot OCR Extension
 * Handles environment-specific API endpoints
 */

// Environment detection
const isProduction = typeof process !== 'undefined' && process.env?.NODE_ENV === 'production';
const isDevelopment = !isProduction;

// Production API endpoint
const PRODUCTION_API_URL = 'https://polyglot-ocr-proxy.polyglotocr2025.workers.dev';

// Development API endpoint (local Cloudflare Worker)
const DEVELOPMENT_API_URL = 'http://127.0.0.1:8787';

/**
 * Get the appropriate API base URL based on environment
 * In development, uses local Cloudflare Worker
 * In production, uses deployed Workers.dev URL
 */
export const API_BASE_URL = isProduction ? PRODUCTION_API_URL : DEVELOPMENT_API_URL;

/**
 * Configuration object with all API endpoints
 */
export const config = {
  // Speech-to-Text API
  STT_API_URL: API_BASE_URL,
  
  // Google Translate API (always production)
  TRANSLATE_API_URL: 'https://translate.googleapis.com/translate_a/single',
  
  // Environment info
  isProduction,
  isDevelopment,
  
  // Logging
  logConfig: () => {
    console.log('Polyglot OCR Config:', {
      environment: isProduction ? 'production' : 'development',
      apiBaseUrl: API_BASE_URL,
      sttApiUrl: API_BASE_URL,
      translateApiUrl: 'https://translate.googleapis.com/translate_a/single'
    });
  }
};

// Log configuration on import (only in development)
if (isDevelopment) {
  config.logConfig();
}

export default config;
