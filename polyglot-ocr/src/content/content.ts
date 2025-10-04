import { MessageBus } from '../shared/messageBus';
import { MessageType } from '../types';
import './content.css';

// Initialize message bus
const messageBus = MessageBus.getInstance();

// Setup message listener
messageBus.setupListener();

// State
let isScreenshotMode = false;
let subtitleContainer: HTMLElement | null = null;

// Initialize content script
function init() {
  console.log('Content script loaded');
  
  // Ensure subtitle container is always created
  createSubtitleContainer();
  
  // Setup message handlers
  setupMessageHandlers();
  
  console.log('Content script initialization complete');
}

function createSubtitleContainer() {
  console.log('Creating subtitle container...');
  
  // Ensure document.body exists
  if (!document.body) {
    console.error('Document body not available for subtitle container creation');
    return;
  }
  
  // Check if container already exists
  const existingContainer = document.getElementById('polyglot-subtitle-container');
  if (existingContainer) {
    console.log('Subtitle container already exists, reusing it');
    subtitleContainer = existingContainer;
    return;
  }
  
  // Create floating subtitle container
  subtitleContainer = document.createElement('div');
  subtitleContainer.id = 'polyglot-subtitle-container';
  subtitleContainer.className = 'fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 max-w-2xl px-4 py-2 bg-black bg-opacity-80 text-white rounded-lg shadow-lg pointer-events-none';
  subtitleContainer.style.display = 'none';
  
  try {
    document.body.appendChild(subtitleContainer);
    console.log('Subtitle container created and appended to body');
  } catch (error) {
    console.error('Failed to append subtitle container to body:', error);
    subtitleContainer = null;
  }
}

function setupMessageHandlers() {
  console.log('Setting up message handlers...');
  
  messageBus.onMessage(MessageType.START_SCREENSHOT_MODE, () => {
    console.log('Received START_SCREENSHOT_MODE message');
    enableScreenshotMode();
  });
  
  messageBus.onMessage(MessageType.STOP_SCREENSHOT_MODE, () => {
    console.log('Received STOP_SCREENSHOT_MODE message');
    disableScreenshotMode();
  });
  
  messageBus.onMessage(MessageType.SHOW_SUBTITLE, (message) => {
    console.log('Received subtitle message:', message.payload);
    showSubtitle(message.payload);
  });
  
  messageBus.onMessage(MessageType.HIDE_SUBTITLE, () => {
    console.log('Received HIDE_SUBTITLE message');
    hideSubtitle();
  });
  
  console.log('Message handlers setup complete');
}

function enableScreenshotMode() {
  isScreenshotMode = true;
  
  // Ensure document.body exists before modifying it
  if (document.body) {
    document.body.style.cursor = 'crosshair';
  }
  
  // Add click handler for screenshot selection
  document.addEventListener('click', handleScreenshotClick, true);
  document.addEventListener('mousedown', handleScreenshotMouseDown, true);
  document.addEventListener('mousemove', handleScreenshotMouseMove, true);
  document.addEventListener('mouseup', handleScreenshotMouseUp, true);
}

function disableScreenshotMode() {
  isScreenshotMode = false;
  
  // Ensure document.body exists before modifying it
  if (document.body) {
    document.body.style.cursor = 'default';
  }
  
  // Remove screenshot handlers
  document.removeEventListener('click', handleScreenshotClick, true);
  document.removeEventListener('mousedown', handleScreenshotMouseDown, true);
  document.removeEventListener('mousemove', handleScreenshotMouseMove, true);
  document.removeEventListener('mouseup', handleScreenshotMouseUp, true);
  
  // Remove selection overlay if exists
  const overlay = document.getElementById('polyglot-selection-overlay');
  if (overlay) {
    overlay.remove();
  }
}

let isSelecting = false;
let startX = 0;
let startY = 0;
let selectionOverlay: HTMLElement | null = null;

function handleScreenshotMouseDown(event: MouseEvent) {
  if (!isScreenshotMode) return;
  
  isSelecting = true;
  startX = event.clientX;
  startY = event.clientY;
  
  // Create selection overlay
  selectionOverlay = document.createElement('div');
  selectionOverlay.id = 'polyglot-selection-overlay';
  selectionOverlay.className = 'fixed border-2 border-blue-500 bg-blue-500 bg-opacity-20 pointer-events-none z-50';
  selectionOverlay.style.left = startX + 'px';
  selectionOverlay.style.top = startY + 'px';
  selectionOverlay.style.width = '0px';
  selectionOverlay.style.height = '0px';
  
  // Ensure document.body exists before appending
  if (document.body) {
    document.body.appendChild(selectionOverlay);
  } else {
    console.error('Cannot append selection overlay: document.body not available');
  }
}

function handleScreenshotMouseMove(event: MouseEvent) {
  if (!isSelecting || !selectionOverlay) return;
  
  const currentX = event.clientX;
  const currentY = event.clientY;
  
  const left = Math.min(startX, currentX);
  const top = Math.min(startY, currentY);
  const width = Math.abs(currentX - startX);
  const height = Math.abs(currentY - startY);
  
  selectionOverlay.style.left = left + 'px';
  selectionOverlay.style.top = top + 'px';
  selectionOverlay.style.width = width + 'px';
  selectionOverlay.style.height = height + 'px';
}

function handleScreenshotMouseUp(_event: MouseEvent) {
  if (!isSelecting || !selectionOverlay) return;
  
  isSelecting = false;
  
  const rect = selectionOverlay.getBoundingClientRect();
  
  // Capture screenshot of selected area
  captureScreenshot(rect);
  
  // Remove selection overlay
  selectionOverlay.remove();
  selectionOverlay = null;
  
  // Disable screenshot mode
  disableScreenshotMode();
}

function handleScreenshotClick(_event: MouseEvent) {
  // Prevent default click behavior during screenshot mode
  if (isScreenshotMode) {
    _event.preventDefault();
    _event.stopPropagation();
  }
}

async function captureScreenshot(rect: DOMRect) {
  try {
    // Send message to background to capture screenshot
    messageBus.sendToBackground(MessageType.CAPTURE_SCREENSHOT, {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height
    });
  } catch (error) {
    console.error('Failed to capture screenshot:', error);
  }
}

function showSubtitle(subtitleData: any) {
  console.log('showSubtitle called with:', subtitleData);
  
  // Ensure subtitle container exists - try multiple times if needed
  if (!subtitleContainer) {
    console.log('Subtitle container not found, creating it...');
    createSubtitleContainer();
  }
  
  // Double-check container exists after creation
  if (!subtitleContainer) {
    console.error('Failed to create subtitle container after retry');
    return;
  }
  
  const { text, originalText, sourceLanguage, targetLanguage, type } = subtitleData;
  
  console.log('Displaying subtitle:', { text, originalText, sourceLanguage, targetLanguage, type });
  
  // Create subtitle content with additional info
  let subtitleContent = text;
  
  // Add source info if available and different from target
  if (originalText && originalText !== text && type !== 'error') {
    subtitleContent = `${text}`;
    
    // Add a small indicator for translation
    const translationIndicator = document.createElement('div');
    translationIndicator.className = 'text-xs text-gray-300 mt-1 opacity-70';
    translationIndicator.textContent = `Translated from ${sourceLanguage || 'auto'} to ${targetLanguage || 'en'}`;
    subtitleContainer.appendChild(translationIndicator);
  }
  
  // Set main text content
  subtitleContainer.innerHTML = subtitleContent;
  subtitleContainer.style.display = 'block';
  
  // Style based on type
  if (type === 'error') {
    subtitleContainer.className = subtitleContainer.className.replace('bg-black bg-opacity-80', 'bg-red-600 bg-opacity-90');
  } else if (type === 'screenshot') {
    subtitleContainer.className = subtitleContainer.className.replace('bg-black bg-opacity-80', 'bg-green-600 bg-opacity-90');
  } else {
    subtitleContainer.className = subtitleContainer.className.replace(/bg-(red|green)-\d+ bg-opacity-\d+/, 'bg-black bg-opacity-80');
  }
  
  console.log('Subtitle displayed successfully at bottom of page');
  
  // Auto-hide after 8 seconds (longer for translated content)
  setTimeout(() => {
    hideSubtitle();
  }, 8000);
}

function hideSubtitle() {
  if (subtitleContainer) {
    subtitleContainer.style.display = 'none';
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  // DOM is already ready, initialize immediately
  init();
}
