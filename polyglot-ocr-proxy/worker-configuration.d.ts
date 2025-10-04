/// <reference types="@cloudflare/workers-types" />

declare namespace Cloudflare {
  interface GlobalProps {
    mainModule: typeof import("./src/index");
  }
  interface Env {
    DEEPGRAM_API_KEY: string;
    DG_API_KEY?: string; // Legacy support
    ALLOWED_ORIGIN?: string;
    GOOGLE_TRANSLATE_API_KEY?: string;
    OPENAI_API_KEY?: string;
  }
}

interface Env extends Cloudflare.Env {}
