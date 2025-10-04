import React, { useState } from "react";
import { transcribeAudio } from "../shared/transcribeAudio";

interface RecordButtonProps {
  onError?: (error: string) => void;
  onSuccess?: (message: string) => void;
  onTranscript?: (transcript: string) => void;
}

export default function RecordButton({ onError, onSuccess, onTranscript }: RecordButtonProps) {
  const [recording, setRecording] = useState(false);

  const handleRecord = async () => {
    console.log('[Polyglot OCR] RecordButton: 🎤 Record & Transcribe button clicked');
    try {
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('[Polyglot OCR] RecordButton: Browser doesn\'t support audio recording');
        onError?.("Recording failed: Browser doesn't support audio recording");
        return;
      }

      // Try to get microphone permission first
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          } 
        });
      } catch (micError) {
        console.warn('Microphone access denied, trying tab capture:', micError);
        // Fallback to tab capture if microphone is denied
        try {
          stream = await navigator.mediaDevices.getDisplayMedia({
            audio: {
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false,
            },
            video: false
          });
        } catch (tabError) {
          console.error('Both microphone and tab capture failed:', tabError);
          throw micError; // Throw original microphone error for user-friendly message
        }
      }
      
      // Check if MediaRecorder is supported
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        onError?.("Recording failed: MediaRecorder not supported");
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      let chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      recorder.onstop = async () => {
        try {
          // Stop all tracks to release the microphone
          stream.getTracks().forEach(track => {
            if (track.readyState === 'live') {
              track.stop();
            }
          });
          
          const blob = new Blob(chunks, { type: "audio/webm" });
          
          if (blob.size === 0) {
            onError?.("Recording failed: No audio data captured");
            return;
          }
          
          console.log('[Polyglot OCR] RecordButton: Processing recorded audio...', { blobSize: blob.size, blobType: blob.type });
          console.log('[Polyglot OCR] RecordButton: About to call transcribeAudio...');
          const transcript = await transcribeAudio(blob);
          console.log('[Polyglot OCR] RecordButton: transcribeAudio completed, result:', transcript);
          onTranscript?.(transcript);
          onSuccess?.("Recording transcribed successfully");
          console.log('[Polyglot OCR] RecordButton: Recording transcribed successfully');
        } catch (err) {
          console.error('[Polyglot OCR] RecordButton: Transcription failed:', err);
          console.error('[Polyglot OCR] RecordButton: Error details:', {
            name: err instanceof Error ? err.name : 'Unknown',
            message: err instanceof Error ? err.message : String(err),
            stack: err instanceof Error ? err.stack : undefined
          });
          const errorMessage = err instanceof Error ? err.message : 'Transcription failed';
          onError?.(errorMessage);
        }
      };

      recorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        onError?.("Recording failed: MediaRecorder error");
        setRecording(false);
      };

      recorder.start();
      setRecording(true);
      onSuccess?.("Recording started - speak now");
      
      // Auto-stop after 5 seconds
      setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop();
          setRecording(false);
        }
      }, 5000);
      
    } catch (err) {
      console.error('[Polyglot OCR] RecordButton: Recording failed:', err);
      console.error('[Polyglot OCR] RecordButton: Error details:', {
        name: err instanceof Error ? err.name : 'Unknown',
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined
      });
      setRecording(false);
      
      // Provide user-friendly error messages
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          onError?.("🎤 Microphone access denied - Please allow microphone access in your browser settings");
        } else if (err.name === 'NotFoundError') {
          onError?.("🎤 No microphone found - Please connect a microphone and try again");
        } else if (err.name === 'NotSupportedError') {
          onError?.("🎤 Browser doesn't support audio recording - Try using Chrome or Firefox");
        } else if (err.message.includes('Audio access denied')) {
          onError?.("🎤 Audio access denied - Please allow microphone or tab audio access");
        } else {
          onError?.("🎤 Recording failed: " + err.message);
        }
      } else {
        onError?.("🎤 Recording failed: Unknown error occurred");
      }
    }
  };

  return (
    <button 
      onClick={handleRecord}
      disabled={recording}
      className={`w-full py-2 px-4 rounded-md font-medium ${
        recording
          ? 'bg-red-600 hover:bg-red-700 text-white'
          : 'bg-purple-600 hover:bg-purple-700 text-white'
      } disabled:opacity-50`}
    >
      {recording ? "Recording..." : "Record & Transcribe"}
    </button>
  );
}
