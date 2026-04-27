# Mocking Bird AI - Project Knowledge Base

This document serves as the "Project Brain" for Mocking Bird AI. It contains the essential architectural knowledge, deployment workflows, and technical quirks discovered during development.

## 🚀 Core Functionality
- **Live Transcription:** Uses Deepgram to transcribe both System Audio (interviewer) and Microphone (user) in real-time.
- **AI Suggested Answers:** Sends transcripts to OpenAI to generate real-time interview coaching and answers.
- **Stealth Overlay (Widget):** A transparent, "ghost-mode" window that sits on top of other apps (like Zoom/Teams) and is invisible to screen-sharing software.
- **Ghost Mode:** An interactive state where the widget becomes click-through, allowing users to interact with windows behind it while still seeing the AI suggestions.

## 🛠 Tech Stack
- **Framework:** Electron + Vite + React.
- **Languages:** TypeScript (Main and Renderer).
- **State Management:** Zustand (Renderer), `electron-store` (Main).
- **Styling:** Vanilla CSS with a focus on premium aesthetics (glassmorphism, dark mode).
- **External APIs:**
  - **Deepgram:** Streaming STT (Speech-to-Text).
  - **OpenAI:** GPT-4o for real-time coaching.

## 🏗 Architecture & IPC Layer
- **IPC Bridges (`preload.ts`):** All communication between React and Electron must go through the `electronAPI` exposed in the preload script.
- **Main Window vs Widget Window:** The app maintains two primary windows. The Main Window handles history/settings, while the Widget Window handles the live overlay.
- **Silent Audio Capture:** The `main.ts` process uses a `setDisplayMediaRequestHandler` to silently grant screen/audio capture permissions without user prompts.

## 📦 Release & Deployment Workflow
- **CI/CD:** Powered by GitHub Actions (`.github/workflows/release.yml`).
- **Trigger:** Builds are triggered by pushing a Git Tag starting with `v` (e.g., `git tag v2.1.12`).
- **Build Step:** Always use `npm run build -- --publish always` to ensure `electron-builder` publishes the artifacts directly to GitHub Releases.
- **Release Type:** Configured in `package.json` with `"releaseType": "release"` to ensure updates are published immediately and not left as drafts.

## ⚠️ Critical Quirks & Lessons Learned
### Windows Branding & Notifications
- **AUMID:** Must call `app.setAppUserModelId('Mocking Bird AI')` early in `main.ts`. Without this, Windows shows the app as "Electron" in Privacy Settings and uses the generic Atom logo in notifications.

### Update Mechanism
- **NSIS Error 2:** Occurs if the user tries to install an update while the app is still running in the System Tray. Always use `autoUpdater.quitAndInstall()` or ensure the app is fully quit before manual installation.
- **Notification Loop:** Disable `autoUpdater.checkForUpdatesAndNotify()` and use `checkForUpdates()` instead to prevent confusing system-level toast notifications that don't handle tray-minimization well.

### Audio Capture
- **NotSupportedError:** `getDisplayMedia` often fails on Windows for system audio loopback. 
- **Solution:** Use the lower-level `chromeMediaSource: 'desktop'` API inside `navigator.mediaDevices.getUserMedia` for robust system audio capture.
- **Permission Revocation:** When the `.exe` is updated, Windows may silently revoke Microphone/Screen permissions. Users must toggle "Allow desktop apps to access your microphone" in Windows Settings if capture fails.

## 🛠 Development Scripts
- `npm run dev`: Starts the Vite dev server and Electron.
- `npm run build`: Compiles everything and prepares a production installer.
- `npm run build:dir`: Unpacked build for quick testing of production logic.
