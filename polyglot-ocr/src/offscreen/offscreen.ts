import { MessageBus } from '../shared/messageBus';
import { MessageType } from '../types';
import { transcribeAudio } from '../shared/transcribeAudio';
import { translateTextWithChromeAPI } from '../shared/translateText';
import { captureAreaScreenshot, extractTextFromImage } from '../shared/ocrService';

// Initialize message bus
const messageBus = MessageBus.getInstance();

// Setup message listener
messageBus.setupListener();

// Audio capture state
let mediaRecorder: MediaRecorder | null = null;
let audioStream: MediaStream | null = null;
let isCapturing = false;

// Convert WebM audio to WAV format for STT processing
async function convertWebMToWAV(webmBlob: Blob): Promise<Blob> {
  try {
    // For now, we'll use the WebM blob directly
    // In a production app, you might want to use a library like webm-writer
    // or implement proper WebM to WAV conversion
    return webmBlob;
  } catch (error) {
    console.error('Failed to convert WebM to WAV:', error);
    throw error;
  }
}

// Initialize offscreen document
function init() {
  console.log('Offscreen document loaded');
  setupMessageHandlers();
}

function setupMessageHandlers() {
  messageBus.onMessage(MessageType.START_AUDIO_CAPTURE, async (message) => {
    await startAudioCapture(message.payload.tabId);
  });
  
  messageBus.onMessage(MessageType.STOP_AUDIO_CAPTURE, () => {
    stopAudioCapture();
  });

  messageBus.onMessage(MessageType.CAPTURE_SCREENSHOT, async (message) => {
    await handleScreenshotCapture(message.payload);
  });
}

async function startAudioCapture(_tabId: number) {
  try {
    console.log('Starting audio capture in offscreen document');
    
    // Check if we already have an active stream
    if (audioStream && audioStream.active) {
      console.log('Audio stream already active, stopping previous stream');
      audioStream.getTracks().forEach(track => track.stop());
    }
    
    // Try to get microphone audio stream first
    try {
      audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      console.log('Microphone access granted');
    } catch (micError) {
      console.warn('Microphone access denied, trying tab capture:', micError);
      
      // Fallback to tab capture if microphone is denied
      try {
        audioStream = await new Promise<MediaStream>((resolve, reject) => {
          chrome.tabCapture.capture({
            audio: true,
            video: false
          }, (stream) => {
            if (stream) {
              resolve(stream);
            } else {
              reject(new Error('Tab capture failed - no stream returned'));
            }
          });
        });
        console.log('Tab capture access granted');
      } catch (tabError) {
        console.error('Both microphone and tab capture failed:', tabError);
        throw new Error('Audio access denied. Please allow microphone or tab audio access.');
      }
    }

    // Create MediaRecorder
    mediaRecorder = new MediaRecorder(audioStream, {
      mimeType: 'audio/webm;codecs=opus'
    });

    // Handle data available
    mediaRecorder.ondataavailable = async (event) => {
      if (event.data.size > 0) {
        try {
          // Convert WebM to WAV for STT processing
          const wavBlob = await convertWebMToWAV(event.data);
          
          // Transcribe audio using STT service
          const transcript = await transcribeAudio(wavBlob);
          console.log('Audio transcription complete:', transcript);
          
          // Get current settings for translation
          const settings = await chrome.storage.sync.get([
            'sourceLanguage',
            'targetLanguage',
            'enableAudioSubtitles'
          ]);
          
          if (settings.enableAudioSubtitles && transcript.trim()) {
            // Translate the transcript
            const translatedText = await translateTextWithChromeAPI(
              transcript,
              settings.sourceLanguage || 'auto',
              settings.targetLanguage || 'en'
            );
            
            console.log('Translation complete:', translatedText);
            
            // Send translated text to content script for display
            messageBus.sendToBackground(MessageType.STT_RESPONSE, {
              originalText: transcript,
              translatedText: translatedText,
              sourceLanguage: settings.sourceLanguage || 'auto',
              targetLanguage: settings.targetLanguage || 'en'
            });
          }
        } catch (error) {
          console.error('Failed to process audio chunk:', error);
        }
      }
    };

    // Start recording
    mediaRecorder.start(1000); // Collect data every second
    isCapturing = true;
    
    console.log('Audio capture started');
  } catch (error) {
    console.error('Failed to start audio capture:', error);
  }
}

function stopAudioCapture() {
  console.log('Stopping audio capture in offscreen document');
  
  try {
    if (mediaRecorder && isCapturing) {
      if (mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
      }
      isCapturing = false;
    }
    
    if (audioStream) {
      audioStream.getTracks().forEach(track => {
        if (track.readyState === 'live') {
          track.stop();
        }
      });
      audioStream = null;
    }
    
    mediaRecorder = null;
    console.log('Audio capture stopped successfully');
  } catch (error) {
    console.error('Error stopping audio capture:', error);
  }
}

// Initialize when DOM is ready
function initializeOffscreen() {
  try {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  } catch (error) {
    console.error('Failed to initialize offscreen document:', error);
  }
}

async function handleScreenshotCapture(screenshotData: any) {
  try {
    console.log('Processing screenshot capture in offscreen:', screenshotData);
    
    // Capture the screenshot of the specified area
    const imageDataUrl = await captureAreaScreenshot(
      screenshotData.x,
      screenshotData.y,
      screenshotData.width,
      screenshotData.height
    );
    
    // Extract text using OCR
    const imageBlob = base64ToBlob(imageDataUrl);
    const extractedText = await extractTextFromImage(imageBlob);
    
    console.log('OCR extraction complete:', extractedText);
    
    if (extractedText.trim()) {
      // Get current settings for translation
      const settings = await chrome.storage.sync.get([
        'sourceLanguage',
        'targetLanguage',
        'enableScreenshotOCR'
      ]);
      
      if (settings.enableScreenshotOCR) {
        // Translate the extracted text
        const translatedText = await translateTextWithChromeAPI(
          extractedText,
          settings.sourceLanguage || 'auto',
          settings.targetLanguage || 'en'
        );
        
        console.log('Screenshot translation complete:', translatedText);
        
        // Send translated text to background script for forwarding to content
        messageBus.sendToBackground(MessageType.SHOW_SUBTITLE, {
          text: translatedText,
          originalText: extractedText,
          sourceLanguage: settings.sourceLanguage || 'auto',
          targetLanguage: settings.targetLanguage || 'en',
          type: 'screenshot'
        });
      }
    } else {
      console.log('No text found in screenshot');
      // Show a message indicating no text was found
      messageBus.sendToBackground(MessageType.SHOW_SUBTITLE, {
        text: 'No text found in selected area',
        type: 'screenshot'
      });
    }
  } catch (error) {
    console.error('Screenshot processing failed:', error);
    // Send error message to background script
    messageBus.sendToBackground(MessageType.SHOW_SUBTITLE, {
      text: 'Screenshot processing failed',
      type: 'error'
    });
  }
}

// Helper function to convert base64 to blob
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

initializeOffscreen();
