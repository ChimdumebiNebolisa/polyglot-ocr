import { _TranslationRequest, _TranslationResponse } from '../types';
import { config } from './config';

/**
 * Translates text using Google Translate API
 * @param text - Text to translate
 * @param sourceLang - Source language code (e.g., 'en', 'auto')
 * @param targetLang - Target language code (e.g., 'es', 'fr')
 * @returns Promise<string> - Translated text
 */
export async function translateText(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  try {
    console.log('Translating text:', { 
      text, 
      sourceLang, 
      targetLang,
      apiUrl: config.TRANSLATE_API_URL,
      environment: config.isProduction ? 'production' : 'development'
    });

    // Skip translation if source and target are the same
    if (sourceLang === targetLang || (sourceLang === 'auto' && targetLang === 'en')) {
      console.log('No translation needed - same language');
      return text;
    }

    // Use Google Translate API (free tier)
    const response = await fetch(config.TRANSLATE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client: 'gtx',
        sl: sourceLang === 'auto' ? 'auto' : sourceLang,
        tl: targetLang,
        dt: 't',
        q: text,
      }),
    });

    if (!response.ok) {
      throw new Error(`Translation API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract translated text from Google's response format
    let translatedText = '';
    if (data && data[0] && Array.isArray(data[0])) {
      translatedText = data[0]
        .map((item: any) => item[0])
        .filter((item: any) => item !== null)
        .join('');
    }

    if (!translatedText) {
      throw new Error('No translation result received');
    }

    console.log('Translation result:', translatedText);
    return translatedText;
  } catch (error) {
    console.error('Translation failed:', error);
    
    // Fallback: return original text with error indicator
    return `[Translation Error] ${text}`;
  }
}

/**
 * Translates text using Chrome's built-in Translator API (if available)
 * Falls back to Google Translate API
 */
export async function translateTextWithChromeAPI(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  try {
    // Check if Chrome's Translator API is available
    if (typeof chrome !== 'undefined' && chrome.i18n) {
      // Note: Chrome's Translator API requires Origin Trial or specific flags
      // For now, we'll use the Google Translate fallback
      console.log('Chrome Translator API not available, using Google Translate');
    }
    
    return await translateText(text, sourceLang, targetLang);
  } catch (error) {
    console.error('Chrome Translator API failed:', error);
    return await translateText(text, sourceLang, targetLang);
  }
}
