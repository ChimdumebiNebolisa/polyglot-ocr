import { MessageBus } from '../shared/messageBus';
import { MessageType } from '../types';

// Initialize message bus
const messageBus = MessageBus.getInstance();

// Setup message listener
messageBus.setupListener();

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Polyglot OCR extension installed:', details);
  
  // Set default settings
  chrome.storage.sync.set({
    targetLanguage: 'en',
    sourceLanguage: 'auto',
    enableAudioSubtitles: true,
    enableScreenshotOCR: true
  });
});

// Handle tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Only inject content script for http/https pages
    if (tab.url.startsWith('http://') || tab.url.startsWith('https://')) {
      // Inject content script if needed
      try {
        // Check if scripting API is available
        if (chrome.scripting && chrome.scripting.executeScript) {
          chrome.scripting.executeScript({
            target: { tabId },
            files: ['content.js']
          }).catch((error) => {
            // Log clear error for debugging
            console.error('Failed to inject content script for tab', tabId, ':', error);
          });
        } else {
          console.warn('Chrome scripting API not available');
        }
      } catch (error) {
        console.error('Scripting API error for tab', tabId, ':', error);
      }
    }
  }
});

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener((message, sender) => {
  console.log('Background received message:', message);
  
  // Handle messages targeted to offscreen document
  if (message.target === 'offscreen') {
    // Forward message to offscreen document
    chrome.runtime.sendMessage(message).catch((error) => {
      console.error('Failed to send message to offscreen:', error);
    });
    return true;
  }
  
  switch (message.type) {
    case MessageType.START_AUDIO_CAPTURE:
      handleStartAudioCapture(sender.tab?.id);
      break;
      
    case MessageType.STOP_AUDIO_CAPTURE:
      handleStopAudioCapture();
      break;
      
    case MessageType.START_SCREENSHOT_MODE:
      handleStartScreenshotMode(sender.tab?.id);
      break;
      
    case MessageType.STOP_SCREENSHOT_MODE:
      handleStopScreenshotMode(sender.tab?.id);
      break;
      
    case MessageType.UPDATE_SETTINGS:
      handleUpdateSettings(message.payload);
      break;
      
    case MessageType.STT_RESPONSE:
      handleSTTResponse(message.payload, sender.tab?.id);
      break;
      
    case MessageType.CAPTURE_SCREENSHOT:
      handleCaptureScreenshot(message.payload, sender.tab?.id);
      break;
      
    case MessageType.SHOW_SUBTITLE:
      handleShowSubtitle(message.payload, sender.tab?.id);
      break;
  }
  
  return true;
});

async function handleStartAudioCapture(tabId?: number) {
  if (!tabId) return;
  
  try {
    // Check if offscreen document already exists
    const hasDocument = await chrome.offscreen.hasDocument();
    
    if (!hasDocument) {
      // Create offscreen document for audio capture
      await chrome.offscreen.createDocument({
        url: 'src/offscreen/offscreen.html',
        reasons: ['USER_MEDIA' as any],
        justification: 'Audio capture for real-time translation'
      });
      console.log('Offscreen document created successfully');
      
      // Wait for the document to fully load and initialize
      await new Promise(resolve => setTimeout(resolve, 500));
    } else {
      console.log('Offscreen document already exists');
    }
    
    // Send message to offscreen to start capture with retry logic
    let retryCount = 0;
    const maxRetries = 3;
    
    const sendMessage = async () => {
      try {
        messageBus.sendToOffscreen(MessageType.START_AUDIO_CAPTURE, { tabId });
        console.log('Start audio capture message sent successfully');
      } catch (error) {
        console.warn(`Failed to send message to offscreen (attempt ${retryCount + 1}):`, error);
        if (retryCount < maxRetries) {
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, 200));
          return sendMessage();
        } else {
          throw new Error('Failed to communicate with offscreen document after multiple attempts');
        }
      }
    };
    
    await sendMessage();
  } catch (error) {
    console.error('Failed to start audio capture:', error);
  }
}

async function handleStopAudioCapture() {
  try {
    // Check if offscreen document exists before trying to close it
    const hasDocument = await chrome.offscreen.hasDocument();
    console.log('Offscreen document exists:', hasDocument);
    
    if (hasDocument) {
      // Send stop message to offscreen document first
      try {
        messageBus.sendToOffscreen(MessageType.STOP_AUDIO_CAPTURE);
        // Wait a moment for cleanup
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.warn('Failed to send stop message to offscreen:', error);
      }
      
      // Close offscreen document
      await chrome.offscreen.closeDocument();
      console.log('Offscreen document closed successfully');
    } else {
      console.log('No offscreen document to close');
    }
  } catch (error) {
    console.error('Failed to stop audio capture:', error);
  }
}

async function handleStartScreenshotMode(tabId?: number) {
  if (!tabId) return;
  
  // Send message to content script to enable screenshot mode
  messageBus.sendToContent(tabId, MessageType.START_SCREENSHOT_MODE);
}

async function handleStopScreenshotMode(tabId?: number) {
  if (!tabId) return;
  
  // Send message to content script to disable screenshot mode
  messageBus.sendToContent(tabId, MessageType.STOP_SCREENSHOT_MODE);
}

async function handleUpdateSettings(settings: any) {
  await chrome.storage.sync.set(settings);
}

async function handleSTTResponse(sttData: any, tabId?: number) {
  if (!tabId) return;
  
  // Forward STT response to content script for subtitle display
  messageBus.sendToContent(tabId, MessageType.SHOW_SUBTITLE, {
    text: sttData.translatedText || sttData.text,
    originalText: sttData.originalText,
    sourceLanguage: sttData.sourceLanguage,
    targetLanguage: sttData.targetLanguage
  });
}

async function handleCaptureScreenshot(screenshotData: any, tabId?: number) {
  if (!tabId) return;
  
  try {
    console.log('Forwarding screenshot capture to offscreen document:', screenshotData);
    
    // Check if offscreen document exists, create if needed
    const hasDocument = await chrome.offscreen.hasDocument();
    
    if (!hasDocument) {
      await chrome.offscreen.createDocument({
        url: 'src/offscreen/offscreen.html',
        reasons: ['USER_MEDIA' as any],
        justification: 'Screenshot processing for OCR'
      });
    }
    
    // Forward screenshot capture to offscreen document
    messageBus.sendToOffscreen(MessageType.CAPTURE_SCREENSHOT, screenshotData);
  } catch (error) {
    console.error('Failed to forward screenshot capture:', error);
    // Send error message to content script
    messageBus.sendToContent(tabId, MessageType.SHOW_SUBTITLE, {
      text: 'Screenshot processing failed',
      type: 'error'
    });
  }
}

async function handleShowSubtitle(subtitleData: any, tabId?: number) {
  if (!tabId) return;
  
  try {
    console.log('Forwarding subtitle to content script:', subtitleData);
    messageBus.sendToContent(tabId, MessageType.SHOW_SUBTITLE, subtitleData);
  } catch (error) {
    console.error('Failed to forward subtitle:', error);
  }
}

