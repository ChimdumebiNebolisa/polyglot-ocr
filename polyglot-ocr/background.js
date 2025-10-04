// Background service worker for Polyglot OCR
console.log('Polyglot OCR background service worker loaded');

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Polyglot OCR extension installed:', details);
});

// Handle messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);
  return true;
});
