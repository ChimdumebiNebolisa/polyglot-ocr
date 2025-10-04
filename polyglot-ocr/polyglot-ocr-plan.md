
# Chrome Extension: Real-Time Translate + OCR (MVP)
*(Single-file plan for Cursor; includes PRD, Tech Roadmap, Task List, DoD, and “You vs Cursor” duties.)*

> Built for the **Google Chrome Built-in AI Challenge 2025**. Uses **Translator API** (core) and **Prompt API** (optional tone/clarity). Deliverables aligned with Devpost (working extension, repo, 3-min demo, write-up).

---

## Product Requirements Document (PRD)

### Value Proposition
A Chrome extension that makes any page understandable in your language without leaving the tab:

- **Live tab-audio translation**: while a YouTube (or any site) video plays **without captions**, the extension captures tab audio, transcribes it to text (STT), translates it, and shows a **floating subtitle box** on the page.  
- **Screenshot → OCR → translate**: click the extension, drag to select an area; it screenshots, runs OCR, and instantly translates the extracted text.

### Users
- Students watching lectures/tutorials without captions.  
- Anyone reading images/memes/diagrams in another language.  
- Travelers/ESL learners browsing foreign sites.

### MVP Features
1. **Audio subtitles (tab)**  
2. **Screenshot OCR**  
3. **Language controls**  
4. **Minimal UI**  

*(Stretch)*  
- **TTS playback**  
- **History**  
- **Auto language detect**  

### Out of Scope (MVP)
- Full closed-caption tracks export, downloadable SRT.  
- Multi-tab simultaneous capture.  
- Server-side user accounts / auth.

### Non-Functional Requirements
- Latency ~3–6s.  
- Privacy: no analytics, keys hidden.  
- Graceful fallbacks.

### Acceptance Criteria
- Audio → subtitles works in-page.  
- Screenshot → OCR → translate works.  
- README explains setup.  

### API Shapes
- Translator API  
- Prompt API  
- STT (via proxy)  
- OCR (Tesseract.js)  

### Data Model
- Settings.json  
- History (optional)

### Edge Cases
- Low/noisy audio.  
- Vertical text.  
- Missing APIs.

---

## Technical Roadmap

### Overview
- MV3 extension: service worker, content script, offscreen doc, popup.  
- Built-in AI: Translator (core), Prompt (optional).  
- STT: Proxy with AssemblyAI/Deepgram/Google Cloud STT.  
- OCR: Tesseract.js.  

### Tech Stack
- TypeScript, React, Tailwind, Vite.  
- Tesseract.js.  
- Cloud STT proxy.  

### Local vs Deployment Environment
- Local: Canary + Origin Trial if needed.  
- Prod: unpacked extension, repo demo.

### Setup & Tooling
- Vite, ESLint, Prettier.  
- Husky pre-commit.  

### Architecture Overview
- Popup ↔ Service Worker ↔ Content Script ↔ Offscreen.  
- Offscreen: audio + OCR.  

### Deployment Plan
- Unpacked extension.  
- Proxy on Vercel/Cloudflare Worker.  

### Testing & Data
- Unit: message bus, OCR adapter.  
- Manual: YouTube, news, low-contrast.  

### README Plan
- What it does, Setup, APIs, Privacy, Known issues.  

### Roadmap & Reflection
- Add SRT export, improve OCR speed, mobile support.  

---

## Task List

### Milestone 1 — Project Setup
- **🧑 YOU:** Create repo, license, Origin Trial token if needed.  
- **🤖 CURSOR:** Scaffold MV3, manifest.json, folders.  

### Milestone 2 — Floating UI + Content Script
- **🤖 CURSOR:** Floating subtitle box, message bus.  
- **🧑 YOU:** Approve UX.  

### Milestone 3 — Tab Audio Capture
- **🤖 CURSOR:** Implement tabCapture, chunking.  
- **🧑 YOU:** Decide STT path.  

### Milestone 4 — STT Integration
- **🤖 CURSOR:** Add STT client.  
- **🧑 YOU:** Build proxy, hide keys.  

### Milestone 5 — Translator + Prompt
- **🤖 CURSOR:** Translator integration, optional Prompt tone.  
- **🧑 YOU:** Validate translations.  

### Milestone 6 — Screenshot OCR
- **🤖 CURSOR:** Region select overlay, capture, OCR, translate.  
- **🧑 YOU:** Optionally add cloud OCR.  

### Milestone 7 — Popup + Settings
- **🤖 CURSOR:** Popup UI, storage.  

### Milestone 8 — TTS (Stretch)
- **🤖 CURSOR:** Add Web Speech Synthesis.  
- **🧑 YOU:** Test conflicts with audio.  

### Milestone 9 — Testing & Polish
- **🤖 CURSOR:** Unit + integration tests.  
- **🧑 YOU:** Manual test runs.  

### Milestone 10 — Packaging & Devpost
- **🤖 CURSOR:** Generate README.  
- **🧑 YOU:** Record demo video, submit to Devpost.  

---

## “You” vs “Cursor” Duties

### Cursor Does
- MV3 scaffolding.  
- Floating UI.  
- Tab audio capture + OCR.  
- Translator integration.  
- Popup/settings.  
- Tests + README draft.  

### You Do
- Secure API setup (STT, OCR fallback).  
- Proxy deployment (Vercel/Cloudflare).  
- Enable built-in AI (flags / Origin Trial).  
- UI/UX decisions.  
- Devpost submission.  

---

## Definition of Done
- Audio → subtitles works.  
- Screenshot OCR works.  
- Uses built-in Translator API (Prompt optional).  
- README + Demo video.  

---

## Cursor Prompt
> **Project**: Chrome Extension “Live Translate + OCR”  
> **Goal**: 2 flows: live tab audio → subtitles; screenshot → OCR → translate.  
> **APIs**: Translator (core) + Prompt (optional).  
> **Architecture**: SW + content + offscreen; tabCapture; Tesseract; popup settings.  
> **Do NOT** hardcode secrets. I’ll provide PROXY_URL.  
> **Subtasks**: scaffold MV3, floating box, tabCapture, STT client, Translator, OCR, popup, README.  
> Stop after each subtask and show diffs.
