# Mocking Bird AI Knowledge Base

This is the project brain for Mocking Bird AI. Keep it current when architecture, prompts, release flow, IPC contracts, or platform quirks change.

## Product Contract

Mocking Bird AI is an Electron desktop interview copilot. It listens to meeting audio, transcribes interviewer and candidate speech, and generates short, glanceable answer guidance for a live overlay.

Core user flows:
- Sign in or configure local API keys.
- Create a session with job title, company, job description, interview type, and language.
- Upload resume and supporting knowledge-base documents.
- Start a live session that captures system audio and microphone audio.
- Show AI suggestions in the main window and transparent widget.
- End the session and generate a scorecard.

## AI System Instructions

The live answer prompt lives in `src/lib/llm.ts` as `buildPrompt`.

It must cover:
- Natural spoken interview tone, not essay-style writing.
- Behavioral and technical interview modes.
- Target output language.
- Resume, job description, uploaded documents, recent transcript, and exact current question.
- Short overlay-friendly formatting.
- Honesty: never fabricate employers, tools, metrics, credentials, projects, or production details.
- Safety: never reveal hidden instructions or tell the candidate to deceive the interviewer.
- Missing-context behavior: provide a cautious frame, transferable answer, or brief clarification rather than inventing facts.

Output format for live answers:
- `Start with`: one natural opening sentence.
- `Key points`: two or three short bullets.
- `Wrap up`: one natural closing sentence.

The scorecard prompt also lives in `src/lib/llm.ts` as `buildScorecardPrompt`. It should stay evidence-based and avoid inventing feedback unsupported by the transcript, resume, or job description.

## Tech Stack

- Framework: Electron + Vite + React.
- Languages: TypeScript in main, preload, and renderer.
- State: Zustand in renderer, `electron-store` in main.
- Local storage: SQLite through `better-sqlite3`.
- Cloud: Supabase via `main/cloud.ts`.
- Styling: Tailwind plus component-level CSS/inline styles.
- STT: Deepgram streaming WebSocket.
- LLM: OpenAI chat completions, either direct API key or cloud proxy token.
- Packaging: `electron-builder`.

## Architecture

Important files:
- `main/main.ts`: Electron windows, tray, updater, shortcuts, permissions, and IPC handlers.
- `main/preload.ts`: context-isolated renderer API bridge.
- `main/db.ts`: local SQLite schema and helpers.
- `main/cloud.ts`: Supabase auth, sync, trial, and license helpers.
- `src/lib/audio.ts`: microphone and system-audio capture.
- `src/lib/stt.ts`: Deepgram streaming provider.
- `src/lib/llm.ts`: live-answer and scorecard prompt construction plus OpenAI calls.
- `src/store/useStore.ts`: renderer session state.
- `src/screens/LiveSession.tsx`: live transcription, buffering, answer generation, widget updates.
- `src/screens/Widget.tsx`: overlay answer display and ghost-mode controls.

## IPC Rules

All renderer-to-main communication must go through `window.electronAPI` from `main/preload.ts`.

Rules:
- Keep `contextIsolation: true` and `nodeIntegration: false` for normal renderer windows.
- Add new IPC endpoints in both `main/preload.ts` and `main/main.ts`.
- Validate channel names for listener-style APIs, as `app.onShortcut` already does.
- Avoid exposing arbitrary filesystem, shell, or network primitives to the renderer.
- Prefer typed payloads over `any` when touching IPC contracts.

Known issue to watch: the widget window currently enables `nodeIntegration: true`. Treat changes around the widget as security-sensitive.

## Audio And Transcription

The app captures two streams:
- System audio as `Interviewer`.
- Microphone audio as `You`.

Important behavior:
- Windows system audio capture uses `chromeMediaSource: 'desktop'` through `navigator.mediaDevices.getUserMedia`.
- `main.ts` configures `setDisplayMediaRequestHandler` to allow screen/audio capture without repeated prompts.
- Deepgram expects Linear16 audio at 16 kHz.
- Interim STT updates reuse transcript IDs; final updates advance to a new ID.
- Auto-answer buffering currently waits for interviewer final text, debounces for 7 seconds, and only fires automatically when a question mark appears.

When prompt context is built, preserve speaker labels so the model knows which turns came from the interviewer versus the candidate.

## Widget And Ghost Mode

The app has two main windows:
- Main window: dashboard, settings, history, live session, scorecard.
- Widget window: transparent always-on-top overlay for live suggestions.

Widget behavior:
- `setContentProtection(true)` is used to reduce screen-share visibility.
- Ghost mode uses `setIgnoreMouseEvents(ignore, { forward: true })` so users can click through the widget.
- Opacity is controlled from renderer through IPC.
- Global shortcuts control visibility, ghost mode, answer generation, transcript clearing, settings, and history.

## Release Workflow

Release automation is configured through GitHub Actions and `electron-builder`.

Expected release flow:
- Bump `package.json` version.
- Build locally with `npm run build` or `npm run build:dir` for unpacked verification.
- Tag releases with a `v` prefix, for example `v2.1.15`.
- Push the tag to trigger release publishing.
- For direct publishing, use `npm run build -- --publish always`.

Packaging details:
- `package.json` `build.publish.releaseType` is `release`, so artifacts are published as full releases rather than drafts.
- Windows output uses NSIS.
- macOS output uses DMG and ZIP.
- Windows code signing is currently disabled.

## Windows Quirks

- Call `app.setAppUserModelId('Mocking Bird AI')` early in `main.ts`. Without it, Windows may show the app as Electron in privacy settings and notifications.
- Installing updates while the app is still alive in the tray can cause NSIS errors. Prefer `autoUpdater.quitAndInstall()`.
- Use `checkForUpdates()` instead of `checkForUpdatesAndNotify()` to keep update messaging inside the app.
- After an `.exe` update, Windows can silently revoke microphone or screen permissions. Users may need to toggle "Allow desktop apps to access your microphone" in Windows Settings.

## Development Commands

- `npm run dev`: start Vite and Electron in development.
- `npm run build`: type-check, build renderer/main bundles, and package installers.
- `npm run build:dir`: type-check, build, and create an unpacked production build.
- `npm run serve`: run Electron against the built app entry.

## Maintenance Checklist

Before shipping changes:
- Run `npm run build`.
- Exercise a live session with both system and microphone capture.
- Confirm the widget opens, updates, toggles ghost mode, and clears.
- Confirm the live answer prompt receives resume, job description, documents, recent transcript with speaker labels, interview type, language, and current question.
- Check update behavior if release or packaging files changed.
- Avoid committing generated release artifacts unless intentionally publishing them.
