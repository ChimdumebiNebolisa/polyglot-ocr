/**
 * Deepgram STT Proxy for Cloudflare Workers
 * 
 * Accepts POST with raw audio/wav (16kHz mono)
 * Forwards to Deepgram API for speech-to-text conversion
 * Returns standardized JSON with transcription results
 */

export interface Env {
  DEEPGRAM_API_KEY: string;
}

interface DeepgramResponse {
  results?: {
    channels?: Array<{
      alternatives?: Array<{
        transcript?: string;
      }>;
    }>;
  };
}

interface StandardResponse {
  success: boolean;
  transcript: string | null;
  error: string | null;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Root route: quick health check
    if (url.pathname === "/") {
      return new Response(
        JSON.stringify({
          status: "ok",
          message: "Polyglot OCR Proxy running",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Test route: static success response for debugging
    if (url.pathname === "/test" && request.method === "GET") {
      const testResponse: StandardResponse = {
        success: true,
        transcript: "Test transcript from proxy",
        error: null
      };
      
      console.log("[Polyglot Proxy] Test endpoint called");
      return new Response(
        JSON.stringify(testResponse),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // STT route
    if (url.pathname === "/stt" && request.method === "POST") {
      // 🔑 Check if key exists
      if (!env.DEEPGRAM_API_KEY) {
        console.error("[Polyglot Proxy] DEEPGRAM_API_KEY not configured");
        const errorResponse: StandardResponse = {
          success: false,
          transcript: null,
          error: "Server configuration error: DEEPGRAM_API_KEY not configured"
        };
        return new Response(
          JSON.stringify(errorResponse),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      console.log("[Polyglot Proxy] Deepgram key loaded ✅");

      try {
        const audio = await request.arrayBuffer();
        
        // Validate audio data
        if (!audio || audio.byteLength === 0) {
          console.error("[Polyglot Proxy] Invalid audio data: empty or null");
          const errorResponse: StandardResponse = {
            success: false,
            transcript: null,
            error: "Invalid audio data: empty or null"
          };
          return new Response(
            JSON.stringify(errorResponse),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        console.log(`[Polyglot Proxy] Sending audio to Deepgram (${audio.byteLength} bytes)`);
        
        const dgResp = await fetch("https://api.deepgram.com/v1/listen", {
          method: "POST",
          headers: {
            "Authorization": `Token ${env.DEEPGRAM_API_KEY}`,
            "Content-Type": "audio/wav",
          },
          body: audio,
        });

        // Check Deepgram response status
        if (!dgResp.ok) {
          let errorMessage = "Deepgram API request failed";
          
          if (dgResp.status === 401) {
            errorMessage = "Deepgram returned invalid API key";
          } else if (dgResp.status === 400) {
            errorMessage = "Deepgram returned bad request (invalid audio format)";
          } else if (dgResp.status === 413) {
            errorMessage = "Deepgram returned audio file too large";
          } else if (dgResp.status === 429) {
            errorMessage = "Deepgram returned rate limit exceeded";
          } else if (dgResp.status >= 500) {
            errorMessage = "Deepgram server error";
          } else {
            errorMessage = `Deepgram returned HTTP ${dgResp.status}`;
          }
          
          console.error(`[Polyglot Proxy] Deepgram API error: ${dgResp.status} ${dgResp.statusText}`, errorMessage);
          
          const errorResponse: StandardResponse = {
            success: false,
            transcript: null,
            error: errorMessage
          };
          
          return new Response(
            JSON.stringify(errorResponse),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }

        const result = await dgResp.json() as DeepgramResponse;
        console.log("[Polyglot Proxy] Deepgram response received:", JSON.stringify(result, null, 2));

        // Extract transcript from Deepgram response
        const transcript = result?.results?.channels?.[0]?.alternatives?.[0]?.transcript;
        
        if (!transcript || transcript.trim() === "") {
          console.error("[Polyglot Proxy] Deepgram returned no transcript");
          const errorResponse: StandardResponse = {
            success: false,
            transcript: null,
            error: "Deepgram returned no transcript"
          };
          
          return new Response(
            JSON.stringify(errorResponse),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }

        console.log(`[Polyglot Proxy] Transcription successful: "${transcript}"`);
        
        const successResponse: StandardResponse = {
          success: true,
          transcript: transcript.trim(),
          error: null
        };

        return new Response(
          JSON.stringify(successResponse),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
        
      } catch (err) {
        console.error("[Polyglot Proxy] Deepgram request failed:", err);
        
        const errorResponse: StandardResponse = {
          success: false,
          transcript: null,
          error: `Deepgram request failed: ${err instanceof Error ? err.message : String(err)}`
        };
        
        return new Response(
          JSON.stringify(errorResponse),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Fallback
    return new Response("Not Found", { status: 404 });
  },
};