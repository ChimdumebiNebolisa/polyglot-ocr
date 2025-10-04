// Content script for Polyglot OCR
console.log('Polyglot OCR content script loaded');

// Initialize content script
function init() {
  console.log('Content script initialized');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
