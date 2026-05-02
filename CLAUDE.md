# Mocking Bird AI — CLAUDE.md

AI assistant reference for the Mocking Bird AI codebase. Keep this file current when architecture, IPC contracts, prompts, or release flows change.

---

## Project Overview

Mocking Bird AI is a cross-platform Electron desktop app (Windows + macOS) that acts as an AI interview copilot. It captures system audio and microphone audio, transcribes speech in real time, and surfaces answer guidance in a transparent overlay widget.

Current version: **2.1.17**

---

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop framework | Electron 30 |
| Frontend | React 18 + TypeScript |
| Build tool | Vite + vite-plugin-electron |
| Styling | Tailwind CSS 3 |
| State (renderer) | Zustand |
| State (main) | electron-store |
| Local database | SQLite via better-sqlite3 |
| Cloud | Supabase (auth, sync, license, trial) |
| Speech-to-text | Deepgram streaming WebSocket |
| LLM | OpenAI chat completions |
| Packaging | electron-builder |

---

## Repository Structure

```
mocking-bird-ai/
├── main/                     # Electron main process (Node.js)
│   ├── main.ts               # App entry: windows, tray, IPC, shortcuts, updater
│   ├── preload.ts            # Context-isolated bridge → window.electronAPI
│   ├── db.ts                 # SQLite schema and helpers
│   └── cloud.ts              # Supabase auth, sync, trial, license
├── src/                      # Renderer process (React)
│   ├── App.tsx               # Root component; screen-level routing
│   ├── main.tsx              # Renderer entry point
│   ├── index.css             # Global Tailwind styles
│   ├── screens/              # Full-page views
│   │   ├── CloudLogin.tsx    # Auth/onboarding screen
│   │   ├── History.tsx       # Past session list
│   │   ├── HomeDashboard.tsx # Session setup form
│   │   ├── KnowledgeBase.tsx # Document upload/management
│   │   ├── LiveSession.tsx   # Core: transcription, buffering, answer generation
│   │   ├── Onboarding.tsx    # First-run wizard
│   │   ├── Scorecard.tsx     # Post-session evaluation
│   │   ├── Settings.tsx      # API keys, audio, preferences
│   │   └── Widget.tsx        # Transparent always-on-top overlay
│   ├── components/           # Shared UI components
│   │   ├── TitleBar.tsx      # Custom drag region
│   │   ├── WhatsNewModal.tsx # Release notes dialog
│   │   └── ui/               # Primitive UI elements
│   ├── lib/                  # Core business logic
│   │   ├── audio.ts          # Mic + system audio capture
│   │   ├── llm.ts            # Prompt construction + OpenAI calls
│   │   ├── questionDetect.ts # Detects interviewer questions heuristically
│   │   ├── stt.ts            # Deepgram streaming provider
│   │   ├── types.ts          # Shared TypeScript types
│   │   └── utils.ts          # Utility helpers (cn, etc.)
│   └── store/
│       └── useStore.ts       # Zustand renderer session state
├── scripts/                  # Build helpers (icon generation, codesign prep)
├── public/                   # Static assets (icons)
├── index.html                # Vite HTML entry
├── vite.config.ts            # Vite + electron plugin config
├── tailwind.config.js        # Tailwind theme
├── tsconfig.json             # Renderer TS config
├── tsconfig.node.json        # Main process TS config
└── package.json              # Scripts, deps, electron-builder config
```

---

## Development Commands

```bash
npm run dev        # Start Vite dev server + Electron (hot reload)
npm run build      # tsc + vite build + electron-builder (produces installer)
npm run build:dir  # tsc + vite build + unpacked app (no installer, faster)
npm run serve      # Run Electron against an existing built dist
npm install        # Also runs electron-builder install-app-deps (native modules)
```

**Prerequisites:** Node.js 18+, npm.

---

## Architecture

### Two-Window Model

| Window | Purpose | Security |
|---|---|---|
| Main window | Dashboard, settings, live session, scorecard | `contextIsolation: true`, `nodeIntegration: false` |
| Widget window | Transparent always-on-top overlay for live answers | `nodeIntegration: true` ← security-sensitive |

The widget window's `nodeIntegration: true` is a known issue. Treat any changes around the widget as security-sensitive.

### IPC Contract

All renderer-to-main communication goes through `window.electronAPI`, exposed by `main/preload.ts`.

Rules:
- Add new IPC endpoints in **both** `main/preload.ts` and `main/main.ts`.
- Validate channel names for listener-style APIs (see `app.onShortcut`).
- Use typed payloads; avoid `any` in IPC contracts.
- Never expose arbitrary filesystem, shell, or network primitives to the renderer.

### Audio Capture

- **System audio** → labelled as `Interviewer`
- **Microphone** → labelled as `You`
- Windows system audio uses `chromeMediaSource: 'desktop'` via `navigator.mediaDevices.getUserMedia`.
- `main.ts` sets `setDisplayMediaRequestHandler` so capture works without repeated permission prompts.
- Deepgram expects **Linear16 PCM at 16 kHz**.
- Interim STT updates reuse the same transcript ID; final updates advance to a new ID.
- Auto-answer buffering: waits for interviewer `final` text, debounces 7 seconds, fires only when a `?` is detected.

### AI Prompts (`src/lib/llm.ts`)

`buildPrompt` constructs the live-answer prompt. It must include:
- Resume, job description, uploaded documents, recent transcript with **speaker labels**, interview type, language, and the current question.
- Natural spoken tone, not essay style.
- Output format: **Start with** / **Key points** / **Wrap up**.
- No fabrication: never invent employers, tools, metrics, credentials, projects, or production details.
- Missing-context fallback: provide a cautious frame or transferable answer; never invent facts.

`buildScorecardPrompt` generates the post-session scorecard. Keep feedback evidence-based; do not invent observations not supported by the transcript, resume, or job description.

### Ghost Mode & Widget

- `setContentProtection(true)` reduces screen-share visibility.
- Ghost mode: `setIgnoreMouseEvents(ignore, { forward: true })` at 50% opacity — click-through enabled.
- Opacity is set from the renderer via IPC.
- `Alt+C`: global shortcut to show/hide the widget.

---

## State Management

| Store | Location | What it holds |
|---|---|---|
| Zustand `useStore` | `src/store/useStore.ts` | Session config, transcript, AI answers, UI state |
| `electron-store` | main process | Persisted settings, API keys, license state |
| SQLite | `main/db.ts` | Session history, scorecard results, uploaded documents |

---

## Cloud & Auth (`main/cloud.ts`)

- Supabase handles authentication, resume sync, trial status, and license validation.
- Cloud tokens are stored in `electron-store`; never keep them in the renderer's memory longer than needed.

---

## Release Workflow

1. Bump the version in `package.json`.
2. Run `npm run build:dir` to verify the unpacked app locally.
3. Exercise a full live session: audio capture, transcription, AI answer, widget, ghost mode, scorecard.
4. Commit and push a tag with the `v` prefix (e.g., `v2.1.18`).
5. GitHub Actions publishes the release automatically via `electron-builder` (`releaseType: "release"`).
6. For manual publishing: `npm run build -- --publish always`.

**Artifacts:**
- Windows: NSIS installer (`.exe`)
- macOS: DMG + ZIP

Code signing is currently **disabled** on Windows (`sign: null`).

---

## Platform Quirks

### Windows
- Call `app.setAppUserModelId('Mocking Bird AI')` early in `main.ts`; without it Windows may show "Electron" in privacy settings.
- After `.exe` updates, Windows can silently revoke microphone or screen capture permissions. Direct users to Windows Settings → Privacy → Microphone.
- Use `autoUpdater.quitAndInstall()` for updates; installing while the tray app is alive can trigger NSIS errors.
- Use `checkForUpdates()` not `checkForUpdatesAndNotify()` — keep update messaging inside the app.

---

## Pre-Ship Checklist

Before merging any change:

- [ ] `npm run build` passes without TypeScript errors.
- [ ] Live session works: system audio + mic capture both transcribe.
- [ ] Widget opens, updates with AI answers, toggles ghost mode, and clears.
- [ ] Live-answer prompt context includes: resume, job description, documents, transcript with speaker labels, interview type, language, and current question.
- [ ] Update logic verified if packaging or release files were modified.
- [ ] Release artifacts are **not** committed to the repository.

---

## Key Files Quick Reference

| File | Purpose |
|---|---|
| `main/main.ts` | Electron app lifecycle, windows, tray, IPC handlers, shortcuts |
| `main/preload.ts` | `window.electronAPI` — the only renderer↔main bridge |
| `main/db.ts` | SQLite schema, session/document/scorecard helpers |
| `main/cloud.ts` | Supabase auth, sync, trial, license |
| `src/lib/audio.ts` | Mic and system audio MediaStream capture |
| `src/lib/stt.ts` | Deepgram WebSocket streaming provider |
| `src/lib/llm.ts` | `buildPrompt` and `buildScorecardPrompt` + OpenAI calls |
| `src/lib/questionDetect.ts` | Heuristic interviewer-question detection |
| `src/store/useStore.ts` | Zustand global renderer state |
| `src/screens/LiveSession.tsx` | Orchestrates transcription, buffering, answer generation, widget updates |
| `src/screens/Widget.tsx` | Transparent overlay — ghost mode, answer display |
| `KNOWLEDGE_BASE.md` | Extended architecture notes, Windows quirks, IPC details |
