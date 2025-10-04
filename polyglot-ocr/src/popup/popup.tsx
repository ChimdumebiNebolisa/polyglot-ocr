import { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { MessageBus } from '../shared/messageBus';
import { MessageType, Settings } from '../types';
import { transcribeAudio } from '../shared/transcribeAudio';
import RecordButton from './RecordButton';
import './popup.css';

const messageBus = MessageBus.getInstance();

// Language options
const LANGUAGES = [
  { code: 'auto', name: 'Auto-detect' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
];

export function Popup() {
  const [settings, setSettings] = useState<Settings>({
    targetLanguage: 'en',
    sourceLanguage: 'auto',
    enableAudioSubtitles: true,
    enableScreenshotOCR: true
  });
  
  const [isAudioActive, setIsAudioActive] = useState(false);
  const [isScreenshotMode, setIsScreenshotMode] = useState(false);
  const [isTestingSTT, setIsTestingSTT] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Results state
  const [transcriptResult, setTranscriptResult] = useState<string | null>(null);
  const [translationResult, setTranslationResult] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Load settings from storage
    chrome.storage.sync.get().then((storedSettings) => {
      setSettings(prev => ({ ...prev, ...storedSettings }));
    }).catch((error) => {
      console.error('Failed to load settings:', error);
      setErrorMessage('Failed to load settings');
    });

    // Setup message handlers
    messageBus.setupListener();
  }, []);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (errorMessage || successMessage) {
      const timer = setTimeout(() => {
        setErrorMessage(null);
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage, successMessage]);

  const handleStartAudio = async () => {
    console.log('[Polyglot OCR] handleStartAudio: 🎤 Start Audio Translation button clicked');
    try {
      setErrorMessage(null);
      setSuccessMessage('Starting audio translation...');
      console.log('[Polyglot OCR] handleStartAudio: Sending START_AUDIO_CAPTURE message to background...');
      messageBus.sendToBackground(MessageType.START_AUDIO_CAPTURE);
      setIsAudioActive(true);
      setSuccessMessage('🎤 Audio translation started - Speak to see live translations');
      console.log('[Polyglot OCR] handleStartAudio: Audio translation started successfully');
    } catch (error) {
      console.error('[Polyglot OCR] handleStartAudio: Failed to start audio:', error);
      console.error('[Polyglot OCR] handleStartAudio: Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      const errorMsg = error instanceof Error ? error.message : 'Failed to start audio translation';
      setErrorMessage(`❌ Audio Error: ${errorMsg}`);
      setIsAudioActive(false);
    }
  };

  const handleStopAudio = async () => {
    try {
      setErrorMessage(null);
      setSuccessMessage('Stopping audio translation...');
      messageBus.sendToBackground(MessageType.STOP_AUDIO_CAPTURE);
      setIsAudioActive(false);
      setSuccessMessage('🛑 Audio translation stopped');
    } catch (error) {
      console.error('Failed to stop audio:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to stop audio translation';
      setErrorMessage(`❌ Stop Error: ${errorMsg}`);
    }
  };

  const handleStartScreenshot = async () => {
    try {
      setErrorMessage(null);
      setSuccessMessage('Activating screenshot mode...');
      messageBus.sendToBackground(MessageType.START_SCREENSHOT_MODE);
      setIsScreenshotMode(true);
      setSuccessMessage('📸 Screenshot mode activated - Click and drag to select area for OCR');
    } catch (error) {
      console.error('Failed to start screenshot mode:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to start screenshot mode';
      setErrorMessage(`❌ Screenshot Error: ${errorMsg}`);
      setIsScreenshotMode(false);
    }
  };

  const handleStopScreenshot = async () => {
    try {
      setErrorMessage(null);
      setSuccessMessage('Deactivating screenshot mode...');
      messageBus.sendToBackground(MessageType.STOP_SCREENSHOT_MODE);
      setIsScreenshotMode(false);
      setSuccessMessage('🛑 Screenshot mode deactivated');
    } catch (error) {
      console.error('Failed to stop screenshot mode:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to stop screenshot mode';
      setErrorMessage(`❌ Screenshot Error: ${errorMsg}`);
    }
  };

  const handleSettingChange = (key: keyof Settings, value: any) => {
    try {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      chrome.storage.sync.set(newSettings).catch((error) => {
        console.error('Failed to save settings:', error);
        setErrorMessage('Failed to save settings');
      });
      messageBus.sendToBackground(MessageType.UPDATE_SETTINGS, newSettings);
    } catch (error) {
      console.error('Failed to update settings:', error);
      setErrorMessage('Failed to update settings');
    }
  };

  const handleTestSTT = async () => {
    console.log('[Polyglot OCR] handleTestSTT: 🧪 Test STT button clicked');
    setIsTestingSTT(true);
    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage('Testing STT service...');
    
    try {
      console.log('[Polyglot OCR] handleTestSTT: Creating test audio blob...');
      // Create a simple test audio blob with actual audio data
      const testBlob = new Blob([new ArrayBuffer(16000)], { type: 'audio/wav' });
      console.log('[Polyglot OCR] handleTestSTT: Test blob created:', {
        size: testBlob.size,
        type: testBlob.type
      });
      
      console.log('[Polyglot OCR] handleTestSTT: About to call transcribeAudio...');
      const transcript = await transcribeAudio(testBlob);
      console.log('[Polyglot OCR] handleTestSTT: transcribeAudio completed, result:', transcript);
      
      // Check if transcript is empty or just whitespace
      if (!transcript || transcript.trim() === '') {
        console.warn('[Polyglot OCR] handleTestSTT: Received empty transcript');
        setErrorMessage('❌ STT Test: Deepgram returned no text. Try speaking louder or check your microphone.');
        setTranscriptResult(null);
      } else {
        setTranscriptResult(transcript);
        setSuccessMessage('🧪 STT test completed successfully - Check results below');
        console.log('[Polyglot OCR] handleTestSTT: STT test completed successfully');
      }
    } catch (error) {
      console.error('[Polyglot OCR] handleTestSTT: STT test failed:', error);
      console.error('[Polyglot OCR] handleTestSTT: Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Provide user-friendly error messages based on the error type
      let userMessage = 'STT test failed';
      if (error instanceof Error) {
        if (error.message.includes('STT failed:')) {
          // This is a structured error from the proxy
          userMessage = error.message.replace('STT failed: ', '');
        } else if (error.message.includes('Invalid audio')) {
          userMessage = 'Invalid audio format. Please check your microphone settings.';
        } else if (error.message.includes('service is temporarily unavailable')) {
          userMessage = 'Speech recognition service is temporarily unavailable. Please try again later.';
        } else if (error.message.includes('Too many requests')) {
          userMessage = 'Too many requests. Please wait a moment and try again.';
        } else if (error.message.includes('API key')) {
          userMessage = 'Speech recognition service configuration error. Please contact support.';
        } else {
          userMessage = `STT Error: ${error.message}`;
        }
      }
      
      setErrorMessage(`❌ ${userMessage}`);
      setTranscriptResult(null);
    } finally {
      console.log('[Polyglot OCR] handleTestSTT: Cleaning up state...');
      setIsTestingSTT(false);
      setIsProcessing(false);
    }
  };

  const handleTranscriptResult = (transcript: string) => {
    setTranscriptResult(transcript);
    console.log('Transcript received in popup:', transcript);
  };

  const handleClearResults = () => {
    setTranscriptResult(null);
    setTranslationResult(null);
    setOcrResult(null);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  return (
    <div className="w-80 p-4 bg-white shadow-xl rounded-lg">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Polyglot OCR
        </h1>
        <p className="text-sm text-gray-600">Real-time translation and OCR</p>
      </div>

      {/* Language Settings */}
      <div className="mb-6 card">
        <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
          <span className="mr-2">🌐</span>
          Language Settings
        </h2>
        
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Source Language
          </label>
          <select
            value={settings.sourceLanguage}
            onChange={(e) => handleSettingChange('sourceLanguage', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {LANGUAGES.map(lang => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Target Language
          </label>
          <select
            value={settings.targetLanguage}
            onChange={(e) => handleSettingChange('targetLanguage', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {LANGUAGES.filter(lang => lang.code !== 'auto').map(lang => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Feature Toggles */}
      <div className="mb-6 card">
        <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
          <span className="mr-2">⚙️</span>
          Features
        </h2>
        
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.enableAudioSubtitles}
              onChange={(e) => handleSettingChange('enableAudioSubtitles', e.target.checked)}
              className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">Enable Audio Subtitles</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.enableScreenshotOCR}
              onChange={(e) => handleSettingChange('enableScreenshotOCR', e.target.checked)}
              className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">Enable Screenshot OCR</span>
          </label>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mb-6 card">
        <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
          <span className="mr-2">🚀</span>
          Actions
        </h2>
        <div className="space-y-3">
        {/* Record Button - Always visible */}
        <div>
          <RecordButton 
            onError={setErrorMessage}
            onSuccess={setSuccessMessage}
            onTranscript={handleTranscriptResult}
          />
          <p className="text-xs text-gray-500 mt-1">
            Record up to 5 seconds of audio for transcription
          </p>
        </div>

        {settings.enableAudioSubtitles && (
          <div>
            <button
              onClick={isAudioActive ? handleStopAudio : handleStartAudio}
              className={`w-full ${isAudioActive ? 'btn-danger' : 'btn-primary'}`}
            >
              {isAudioActive ? '🛑 Stop Audio Translation' : '🎤 Start Audio Translation'}
            </button>
            <p className="text-xs text-gray-500 mt-1">
              {isAudioActive ? 'Capturing and translating audio in real-time' : 'Start continuous audio translation'}
            </p>
          </div>
        )}

        {settings.enableScreenshotOCR && (
          <div>
            <button
              onClick={isScreenshotMode ? handleStopScreenshot : handleStartScreenshot}
              className={`w-full ${isScreenshotMode ? 'btn-danger' : 'btn-success'}`}
            >
              {isScreenshotMode ? '🛑 Stop Screenshot Mode' : '📸 Start Screenshot OCR'}
            </button>
            <p className="text-xs text-gray-500 mt-1">
              {isScreenshotMode ? 'Click and drag to select area for OCR' : 'Select an area to extract and translate text'}
            </p>
          </div>
        )}
        </div>
      </div>

      {/* Test STT Button */}
      <div className="mb-4">
        <button
          onClick={handleTestSTT}
          disabled={isTestingSTT}
          className="w-full btn-secondary disabled:opacity-50"
        >
          {isTestingSTT ? '⏳ Testing STT...' : '🧪 Test STT (Check Console)'}
        </button>
      </div>

      {/* Clear Results Button */}
      {(transcriptResult || translationResult || ocrResult) && (
        <div className="mb-4">
          <button
            onClick={handleClearResults}
            className="w-full py-1 px-3 rounded-md text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
          >
            🗑️ Clear Results
          </button>
        </div>
      )}

      {/* Results Display */}
      <div className="space-y-3">
        {transcriptResult && (
          <div className="result-container result-transcript">
            <h3 className="text-sm font-medium mb-2 flex items-center">
              <span className="mr-2">🎤</span>
              Transcript Result:
            </h3>
            <div className="text-sm bg-white p-3 rounded border shadow-sm">
              {transcriptResult}
            </div>
          </div>
        )}

        {translationResult && (
          <div className="result-container result-translation">
            <h3 className="text-sm font-medium mb-2 flex items-center">
              <span className="mr-2">🌍</span>
              Translation Result:
            </h3>
            <div className="text-sm bg-white p-3 rounded border shadow-sm">
              {translationResult}
            </div>
          </div>
        )}

        {ocrResult && (
          <div className="result-container result-ocr">
            <h3 className="text-sm font-medium mb-2 flex items-center">
              <span className="mr-2">📄</span>
              OCR Result:
            </h3>
            <div className="text-sm bg-white p-3 rounded border shadow-sm">
              {ocrResult}
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-2"></div>
              <span className="text-sm text-yellow-700">Processing...</span>
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="text-sm text-red-600 flex items-center">
            <span className="mr-2">❌</span>
            {errorMessage}
          </div>
        </div>
      )}
      
      {successMessage && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <div className="text-sm text-green-600 flex items-center">
            <span className="mr-2">✅</span>
            {successMessage}
          </div>
        </div>
      )}

      {/* Status */}
      <div className="mt-4 p-3 bg-gray-50 rounded-md">
        <div className="text-sm text-gray-600">
          <div className="flex items-center justify-between">
            <span>🎤 Audio:</span>
            <span className={`font-medium ${isAudioActive ? 'text-green-600' : 'text-gray-500'}`}>
              {isAudioActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span>📸 Screenshot:</span>
            <span className={`font-medium ${isScreenshotMode ? 'text-green-600' : 'text-gray-500'}`}>
              {isScreenshotMode ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Render the popup
function renderPopup() {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(<Popup />);
  } else {
    console.error('Root element not found! Make sure the HTML has a div with id="root"');
    // Try to create root element if it doesn't exist
    const body = document.body;
    if (body) {
      const newRoot = document.createElement('div');
      newRoot.id = 'root';
      body.appendChild(newRoot);
      const root = ReactDOM.createRoot(newRoot);
      root.render(<Popup />);
    }
  }
}

// Ensure DOM is ready before rendering
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderPopup);
} else {
  // DOM is already ready, render immediately
  renderPopup();
}
