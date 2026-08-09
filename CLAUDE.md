# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Package Manager:** pnpm

- `pnpm install` - Install dependencies (runs `electron-builder install-app-deps` postinstall)
- `pnpm dev` - Start development with HMR (electron-vite dev --watch)
- `pnpm build` - Build all bundles (main/preload/renderer) to `out/`
- `pnpm build:win` - Build and package for Windows (NSIS x64)
- `pnpm build:mac` - Build and package for macOS (dmg/zip)
- `pnpm build:linux` - Build and package for Linux (deb/AppImage/rpm)
- `pnpm start` - Preview production build (electron-vite preview)
- `pnpm format` - Run Prettier formatting
- `pnpm lint` - Run ESLint with caching

## Architecture

This is an **Electron Vue 3 desktop application** that provides an AIGC (AI-Generated Content) production suite for content creators. It integrates AI voice cloning, TTS, ASR speech recognition, digital human/avatar generation, video parsing, automated social media publishing, and LLM script processing.

### Process Architecture

- **Main Process** (`src/main/`): Electron main entry, manages windows, SQLite database, registers IPC handlers.
  - `ipc/`: Modular IPC channels by domain (db, account, file, video, publish, llm, python, audio, task, etc.)
  - `login/`: Playwright-driven login automation for 4 platforms
  - `publish/`: Automated video publishing workflows
  - `database/`: SQLite with better-sqlite3 for data persistence
- **Preload** (`src/preload/index.js`): Exposes `window.api` via contextBridge, forwards IPC events to renderer
- **Renderer** (`src/renderer/src/`): Vue 3 frontend application
  - **State Management**: Pinia (`store/project.js`)
  - **Routing**: Vue Router 4 with hash mode
  - **UI Framework**: Ant Design Vue 4 + TailwindCSS 3
  - **Key Features**: Canvas-based video editing (vue-konva), audio waveform (wavesurfer.js), drag-drop sorting

### Key Integrations

- **Python AI Modules**: Bundled Python venvs with precompiled AI inference binaries (`python-modules/`)
  - `asrModule`: FunASR automatic speech recognition
  - `voiceV2Module`: Voice cloning / TTS V2 (PyTorch, DeepSpeed)
  - `hdModule`: Digital human V1
  - `humanModule`: Face detection + landmark-based lip-sync
- **Automated Publishing**: Playwright browser automation for Douyin, Kuaishou, Xiaohongshu, WeChat Video Channels
- **Native Modules**: better-sqlite3, sharp bundled externally via electron-builder extraResources

### Build Configuration

- Bundler: `electron-vite` (uses Vite under the hood)
- Packager: `electron-builder`
- `python-modules/**` and `resources/**` are excluded from ASAR and shipped as extraResources
- Targets: Windows NSIS, macOS dmg/zip, Linux deb/AppImage/rpm

### Important Paths

- Entry point: `src/main/index.js` (main process), `src/renderer/src/main.js` (renderer)
- IPC registration: `src/main/ipc/` (one file per domain)
- UI views/components: `src/renderer/src/`
  - `components/studio/`: Video editing studio panels
  - `hooks/`: Vue composables for workflow functionality
- Python AI runtimes: `python-modules/`
- Resources (ffmpeg, fonts, assets): `resources/`
