import { config } from './config';

/**
 * Transcribes audio blob using the configured STT proxy
 * @param audioBlob - Audio data as WAV Blob
 * @returns Promise<string> - Transcribed text
 */
export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  try {
    // Validate blob before sending
    if (!audioBlob || audioBlob.size === 0) {
      console.error('[Polyglot OCR] transcribeAudio: Invalid audio blob - empty or null');
      throw new Error('Invalid audio blob: empty or null');
    }
    
    const sttUrl = `${config.STT_API_URL}/stt`;
    
    console.log('[Polyglot OCR] transcribeAudio: Starting STT transcription...', { 
      blobSize: audioBlob.size, 
      blobType: audioBlob.type,
      apiUrl: sttUrl,
      environment: config.isProduction ? 'production' : 'development'
    });
    
    console.log('[Polyglot OCR] transcribeAudio: About to make fetch call to:', sttUrl);
    console.log('[Polyglot OCR] transcribeAudio: Fetch options:', {
      method: "POST",
      headers: { "Content-Type": "application/octet-stream" },
      bodySize: audioBlob.size
    });
    
    const res = await fetch(sttUrl, {
      method: "POST",
      headers: { "Content-Type": "application/octet-stream" },
      body: audioBlob,
    });
    
    console.log('[Polyglot OCR] transcribeAudio: Fetch completed, response received:', {
      status: res.status,
      statusText: res.statusText,
      ok: res.ok,
      headers: Object.fromEntries(res.headers.entries())
    });

    if (!res.ok) {
      console.error('[Polyglot OCR] transcribeAudio: Response not OK, attempting to read error text...');
      let errorText;
      try {
        errorText = await res.text();
        console.error('[Polyglot OCR] transcribeAudio: Error text received:', errorText);
      } catch (error) {
        errorText = 'Unknown error';
        console.error('[Polyglot OCR] transcribeAudio: Failed to read error text:', error);
      }
      
      console.error('[Polyglot OCR] transcribeAudio: STT proxy error:', { status: res.status, statusText: res.statusText, error: errorText });
      
      // Provide user-friendly error messages
      let userMessage;
      if (res.status === 502) {
        userMessage = 'Speech recognition service is temporarily unavailable. Please try again later.';
      } else if (res.status === 413) {
        userMessage = 'Audio file is too large. Please record a shorter audio clip.';
      } else if (res.status === 400) {
        userMessage = 'Invalid audio format. Please try recording again.';
      } else if (res.status === 429) {
        userMessage = 'Too many requests. Please wait a moment and try again.';
      } else {
        userMessage = `Speech recognition failed (Error ${res.status}). Please try again.`;
      }
      
      console.error('[Polyglot OCR] transcribeAudio: Throwing error with message:', userMessage);
      throw new Error(userMessage);
    }

    console.log('[Polyglot OCR] transcribeAudio: Response OK, attempting to parse JSON...');
    const data = await res.json();
    console.log('[Polyglot OCR] transcribeAudio: JSON parsed successfully:', JSON.stringify(data, null, 2));
    console.log('[Polyglot OCR] transcribeAudio: Response type:', typeof data);
    console.log('[Polyglot OCR] transcribeAudio: Response keys:', Object.keys(data));
    
    // Handle standardized response format
    if (data.success === true) {
      if (!data.transcript || typeof data.transcript !== 'string') {
        console.error('[Polyglot OCR] transcribeAudio: Success response but no transcript:', data);
        throw new Error('Speech recognition completed but returned no transcript');
      }
      
      console.log('[Polyglot OCR] transcribeAudio: Transcription completed successfully, returning:', data.transcript);
      return data.transcript;
    } else if (data.success === false) {
      // Display error to user
      const errorMessage = data.error || 'Unknown error';
      console.error('[Polyglot OCR] transcribeAudio: STT service returned error:', errorMessage);
      throw new Error(`STT failed: ${errorMessage}`);
    } else {
      // Fallback for unexpected response format
      console.error('[Polyglot OCR] transcribeAudio: Unexpected response format:', JSON.stringify(data, null, 2));
      console.error('[Polyglot OCR] transcribeAudio: Response type:', typeof data);
      console.error('[Polyglot OCR] transcribeAudio: Response keys:', Object.keys(data));
      throw new Error(`Invalid STT response format. Expected standardized response with success property, got: ${JSON.stringify(data)}`);
    }
  } catch (error) {
    console.error('[Polyglot OCR] transcribeAudio: STT transcription failed:', error);
    console.error('[Polyglot OCR] transcribeAudio: Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // If it's a JSON parsing error, provide more context
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      console.error('[Polyglot OCR] transcribeAudio: JSON parsing failed - response might not be valid JSON');
      throw new Error('Invalid response from speech recognition service. Please try again.');
    }
    
    throw error;
  }
}