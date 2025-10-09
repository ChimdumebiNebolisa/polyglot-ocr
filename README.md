# Polyglot-OCR 🌍📄

An AI-powered Chrome extension and Cloudflare Worker project that performs real-time Optical Character Recognition (OCR) and text translation across multiple languages using free APIs like Deepgram STT and OpenAI-compatible translation endpoints.

---

## 🧠 Overview

Polyglot-OCR allows users to extract and translate text directly from images or screenshots within their browser. Designed for accessibility and multilingual users, it enables seamless reading and understanding of content in any language — instantly and privately.

---

## YOUR PROJECT README

- **Problem:** Many users encounter text in images or PDFs they cannot easily translate or extract.  
- **Solution:** A browser extension that detects text in images, extracts it using OCR, and translates it using fast, cost-free APIs.  
- **Users:** Students, researchers, travelers, and professionals working with multilingual documents.  
- **Outcome:** Faster comprehension and accessibility across languages without needing third-party websites or paid APIs.

---

## 🚀 Features

- 📸 Real-time text extraction (OCR) from screenshots or uploaded images  
- 🌐 Instant translation into user-selected target languages  
- 🔊 Optional speech output using free text-to-speech APIs  
- ⚡ Lightweight: runs in the browser with a Cloudflare Worker backend  
- 🔒 Privacy-first: no persistent storage, temporary in-memory processing  
- 🧠 Language detection and script auto-selection  
- 🌈 Supports over 40 languages including English, French, Spanish, Chinese, Arabic, and Yoruba  

---

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|---------------|
| Frontend | Chrome Extension (Manifest v3), React |
| Backend | Cloudflare Worker (TypeScript) |
| OCR | Tesseract.js |
| Speech-to-Text | Deepgram API |
| Translation | OpenAI-compatible / LibreTranslate API |
| Styling | Tailwind CSS |
| Build Tools | Vite, Esbuild |
| Language | TypeScript |

---

## 📂 Project Structure

```
polyglot-ocr/
├── public/              # Extension assets (icons, manifest)
├── src/
│   ├── background/      # Background worker for browser events
│   ├── components/      # Popup UI components
│   ├── hooks/           # Custom React hooks
│   ├── pages/           # Main UI pages
│   ├── utils/           # Shared functions (OCR, translation)
│   └── worker/          # Cloudflare Worker code
├── manifest.json        # Chrome extension manifest (v3)
├── package.json
└── README.md
```

---

## 🔧 Setup & Installation

### Prerequisites
- Node.js 18+  
- npm or yarn  
- Cloudflare CLI (Wrangler) for deployment

### Installation

1. Clone the repository:
```bash
git clone https://github.com/ChimdumebiNebolisa/polyglot-ocr.git
cd polyglot-ocr
```

2. Install dependencies:
```bash
npm install
```

3. Build the extension:
```bash
npm run build
```

4. Load the extension in Chrome:  
   - Go to `chrome://extensions/`  
   - Enable **Developer Mode**  
   - Click **Load unpacked** and select the `dist` folder

5. Run the Cloudflare Worker:
```bash
wrangler dev
```

---

## RECRUITEMENT GATHERING (WHATEVER THAT MEANS)

- Identify common multilingual OCR use cases (e.g., academic papers, web screenshots, signs, notes).  
- Define required features: OCR accuracy, translation speed, privacy.  
- Specify performance expectations and limits (browser memory usage, latency).

---

## ANALYSIS AND DESIGN

- Designed for offline-first UX with minimal UI overhead.  
- Chrome Extension interacts asynchronously with Cloudflare Worker API.  
- Used background scripts for permissions, event listeners, and messaging.  
- Defined modular architecture to allow future support for Firefox extensions.  

---

## IMPLEMENTATION

- Integrated **Tesseract.js** for browser-based OCR.  
- Deployed **Cloudflare Worker** to handle translation API calls.  
- Configured API routes for Deepgram and translation endpoints.  
- Used message passing between popup, content, and background scripts.  
- Built responsive popup UI with Tailwind CSS + React.  

---

## TESTING

- Unit tests for translation and OCR utilities.  
- Manual testing across Chrome, Edge, and Brave.  
- Verified OCR accuracy for 10+ sample languages.  
- Latency benchmarks under 1.2 seconds per request.  

---

## DEPLOYMENT

- Worker deployed via `wrangler publish`.  
- Chrome Extension packaged with build artifacts and manifest v3.  
- Versioning handled through Git tags and release notes.  
- Auto-deployment pipeline available for production builds.

---

## MAINTENANCE

- Scheduled dependency updates and security audits.  
- Monitor Worker logs for API errors and downtime.  
- Maintain documentation for new contributors.  
- Regular testing of extension permissions and browser compatibility.  

---

## 📈 Roadmap

- 🖼️ Add drag-and-drop OCR for entire webpages  
- 🗣️ Integrate multilingual speech synthesis  
- 🔤 Improve OCR accuracy for non-Latin scripts  
- 🧩 Firefox and Edge extension support  
- 🧠 On-device translation model (experimental)  

---

## 🤝 Contributing

1. Fork the repository  
2. Create a feature branch (`git checkout -b feature/new-feature`)  
3. Commit changes (`git commit -m "Add new OCR enhancement"`)  
4. Push to your branch  
5. Open a Pull Request  

---

## 📝 License

This project is licensed under the **MIT License** — see the `LICENSE` file for details.

---

## 🙏 Acknowledgments

- Deepgram for free STT API access  
- Tesseract.js contributors for open-source OCR engine  
- Cloudflare Workers for serverless scalability  
- Inspired by the idea of removing language barriers through open technology
