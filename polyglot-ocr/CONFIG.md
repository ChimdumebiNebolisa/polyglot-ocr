# Configuration Guide

## Environment Configuration

The Polyglot OCR extension uses environment-based configuration to switch between development and production API endpoints.

### Automatic Environment Detection

The extension automatically detects the environment based on `NODE_ENV`:

- **Development**: `NODE_ENV !== "production"` → Uses `http://127.0.0.1:8787`
- **Production**: `NODE_ENV === "production"` → Uses `https://polyglot-ocr-proxy.polyglotocr2025.workers.dev`

### Configuration File

The configuration is managed in `src/shared/config.ts`:

```typescript
export const config = {
  STT_API_URL: API_BASE_URL,  // Speech-to-Text API
  TRANSLATE_API_URL: 'https://translate.googleapis.com/translate_a/single',
  isProduction,
  isDevelopment
};
```

### Development Setup

1. **Local Cloudflare Worker**: Start your local Cloudflare Worker on port 8787
2. **Build Extension**: Run `npm run build:extension`
3. **Load Extension**: Load the `dist/` folder in Chrome Developer Mode

### Production Setup

1. **Set Environment**: Ensure `NODE_ENV=production` during build
2. **Build Extension**: Run `npm run build:extension`
3. **Deploy**: The extension will use the production Workers.dev URL

### Manual Override

To manually override the API URL, modify `src/shared/config.ts`:

```typescript
// Force development URL
export const API_BASE_URL = 'http://127.0.0.1:8787';

// Force production URL  
export const API_BASE_URL = 'https://polyglot-ocr-proxy.polyglotocr2025.workers.dev';
```

### Logging

The configuration logs the current environment and API URLs in development mode for debugging.
