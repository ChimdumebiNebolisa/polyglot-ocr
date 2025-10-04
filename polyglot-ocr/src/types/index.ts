// Extension message types
export interface Message {
  type: string;
  payload?: any;
}

// Audio capture types
export interface AudioChunk {
  data: ArrayBuffer;
  timestamp: number;
  sampleRate: number;
}

// Translation types
export interface _TranslationRequest {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
}

export interface _TranslationResponse {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
}

// OCR types
export interface OCRRequest {
  imageData: string; // base64 encoded image
}

export interface OCRResponse {
  text: string;
  confidence: number;
}

// STT types
export interface STTResponse {
  text: string;
  timestamp: number;
  confidence?: number;
}

// Settings types
export interface Settings {
  targetLanguage: string;
  sourceLanguage: string;
  enableAudioSubtitles: boolean;
  enableScreenshotOCR: boolean;
  sttProxyUrl?: string;
  ocrProxyUrl?: string;
}

// Subtitle types
export interface Subtitle {
  text: string;
  timestamp: number;
  duration: number;
}

// Message types enum
export enum MessageType {
  // Audio capture
  START_AUDIO_CAPTURE = 'START_AUDIO_CAPTURE',
  STOP_AUDIO_CAPTURE = 'STOP_AUDIO_CAPTURE',
  AUDIO_CHUNK = 'AUDIO_CHUNK',
  
  // STT
  STT_REQUEST = 'STT_REQUEST',
  STT_RESPONSE = 'STT_RESPONSE',
  
  // Translation
  TRANSLATE_REQUEST = 'TRANSLATE_REQUEST',
  TRANSLATE_RESPONSE = 'TRANSLATE_RESPONSE',
  
  // OCR
  OCR_REQUEST = 'OCR_REQUEST',
  OCR_RESPONSE = 'OCR_RESPONSE',
  
  // UI
  SHOW_SUBTITLE = 'SHOW_SUBTITLE',
  HIDE_SUBTITLE = 'HIDE_SUBTITLE',
  UPDATE_SETTINGS = 'UPDATE_SETTINGS',
  
  // Screenshot
  START_SCREENSHOT_MODE = 'START_SCREENSHOT_MODE',
  STOP_SCREENSHOT_MODE = 'STOP_SCREENSHOT_MODE',
  CAPTURE_SCREENSHOT = 'CAPTURE_SCREENSHOT',
}
