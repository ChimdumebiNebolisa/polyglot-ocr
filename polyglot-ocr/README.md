# Polyglot OCR Chrome Extension

## Overview
Polyglot OCR is a Chrome extension that lets you take screenshots, extract text with OCR, and translate or transcribe audio using a Cloudflare Worker proxy.

## Features
- 📷 Screenshot OCR (select an area on the page and extract text)
- 🎤 Audio transcription (records mic input and sends to Deepgram via proxy)
- 🌍 Translation support (connects to external APIs)
- 🔒 Secure backend proxy with Cloudflare Workers

## Project Structure

```
polyglot-ocr/
├── manifest.json # Extension manifest (MV3)
├── src/ # Popup, background, content scripts
├── assets/ # Icons, images
└── README.md
```

## Development
1. Clone this repo:
   ```bash
   git clone https://github.com/<your-username>/chrome-translate-ocr-extension.git
   ```

2. Load the extension in Chrome:
   - Go to `chrome://extensions`
   - Enable Developer Mode
   - Click "Load unpacked"
   - Select the `polyglot-ocr` folder

## Backend Proxy
The extension communicates with a private Cloudflare Worker (`polyglot-ocr-proxy`) which handles API calls securely.
This folder is not included in the repo for security reasons.

## License
MIT