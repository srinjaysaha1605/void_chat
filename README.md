# ⚡ VOID_CHAT

> A futuristic retro-gaming terminal chatroom for real-time communication across encrypted channels, complete with secret override consoles, cyberpunk visual effects, and AI entities.

---

## 🚀 Overview

**VOID_CHAT** is a retro-cyberpunk terminal chat interface designed with a classic CRT matrix aesthetic. It provides a real-time room-based chatting environment where agents can communicate across secure channels, trigger custom terminal overrides, and experience dynamic visual distortions.

---

## ✨ Key Features

### 💬 Real-Time Multi-Room Chat
- **Instant Channel Synchronization**: Join or create room codes (`#MAIN`, custom encrypted channels) with real-time database persistence.
- **Canonical Database Messaging**: Ensures direct table persistence without temporary or duplicate message flashes.
- **Audio Feedback**: Built-in retro terminal chime sound triggers for incoming messages.

### 💻 Secret Override Terminal (`Ctrl` + `Shift` + `K`)
- Press **`Ctrl` + `Shift` + `K`** anywhere to bring up the classified system command console.
- Execute direct system commands:
  - `glitch` / `overclock` / `/glitch` — Triggers a 3.5-second cyberpunk CRT screen distortion & chromatic aberration overlay.
  - `Going Dark` — Activates stealth monochrome CMD theme.
  - `Going Light` — Restores standard Matrix green phosphor theme.
  - `clear` — Wipes the console log buffer.
  - `exit` — Closes the secret terminal.

### 🎨 Cyberpunk Visual Effects & UI
- **Matrix Phosphor Aesthetic**: Glowing green terminal UI with scanline overlays.
- **Dynamic Glitch Engine**: 3.5-second screen jitter, chromatic aberration, and RGB color dodge effects.
- **Dotted Glow Canvas**: Animated ambient particle node network background.
- **Side Drawer Navigation**: Channel switcher, system diagnostics, and artifact cards.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS & Custom CRT keyframe animations
- **Icons**: Lucide React
- **Animations**: Motion (`motion/react`)
- **Backend / Realtime**: Supabase / Firestore with local fallback support

---

## 🏃 Getting Started

### Installation
```bash
npm install
Development Server
code
Bash
npm run dev
Open http://localhost:3000 in your browser.
Production Build
code
Bash
npm run build
⌨️ Quick Keyboard Shortcuts
Shortcut	Action
Ctrl + Shift + K	Toggle Secret Override Console
Enter	Send message in main chat input
/glitch	Trigger CRT glitch distortion in main chat
