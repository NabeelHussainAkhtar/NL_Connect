# <div align="center">🚀 N&L Connect SuperApp</div>

<div align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Capacitor-8-119EFF?style=for-the-badge&logo=capacitor&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" />
  <img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" />
</div>

<br/>

<div align="center">
  <h3>The World's Smartest All-in-One Digital Ecosystem</h3>
  <p>Connect, Play, Listen, and Explore with the power of <b>RAMSHA AI</b></p>
</div>

---

## 🌟 Overview

**N&L Connect** is a premium SuperApp designed to unify your digital life. Built for performance and aesthetics, it offers a seamless blend of communication, entertainment, and artificial intelligence.

### 📸 App Experience

<img width="1536" height="1024" alt="image" src="https://github.com/user-attachments/assets/49890c53-eb1b-492f-acf4-c366ff9a1895" />

---

## 🔥 Features

### 💬 Communication & Social
*   **High-Fidelity Calls**: WebRTC video/voice calls with draggable PIP (Picture-in-Picture) UI.
*   **Smart Messaging**: Lightning-fast chat with stickers, GIFs, and real-time typing indicators.
*   **Social Feed**: A vibrant hub to share moments and updates with your circle.

### 🎵 Media & Entertainment
*   **Listen Together**: Real-time synchronized music playback rooms.
*   **Local Library Scanner**: Scan and play your device's audio files natively.
*   **Watch Party**: Synchronized YouTube video playback with integrated chat.

### 🤖 RAMSHA AI Engine
*   **Contextual Memory**: RAMSHA remembers your preferences and past conversations.
*   **Intent Matching**: Seamlessly control the app using natural language.
*   **Rich Tools**: Integrated weather, finance, dictionary, and sports data.

---

## 🛠️ Architecture & Stack

| Layer | Technology |
|:--- |:--- |
| **Frontend** | React 19 (Vite), Framer Motion, Lucide Icons |
| **Native Bridge** | Capacitor 8 (Android/iOS) |
| **Backend** | Cloudflare Workers, D1 SQL, R2 Storage |
| **Auth** | Firebase Auth (Phone + Google) |
| **Real-time** | PeerJS (WebRTC) + WebSocket Proxies |
| **Database** | SQLite (D1) + LocalStorage Persistence |

---

## 🚀 Getting Started

### 1. Prerequisites
*   Node.js 20+
*   Android Studio (for APK building)
*   Firebase Project (for Authentication)

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/NabeelHussainAkhtar/NL_Connect.git

# Install dependencies
npm install
```

### 3. Setup Environment
Create a `.env` file in the root directory:
```env
VITE_FIREBASE_API_KEY=your_key
VITE_YOUTUBE_API_KEY=your_key
VITE_AI_BASE_URL=your_proxy_url
```

### 4. Run Development
```bash
npm run dev
```

### 5. Build Android APK
```bash
# Build the web assets
npm run build

# Sync with Capacitor
npx cap sync android

# Open in Android Studio
npx cap open android
```

---

## 🔍 Module Deep-Dive

### 🎙️ Communication & WebRTC (`/src/modules/comms`)
The communication engine is built on **PeerJS** for peer-to-peer signaling.
*   **Video Calls**: Utilizes native hardware access via `@capacitor/camera` to handle rear/front camera switching without freezing.
*   **Draggable PIP**: A custom-built floating UI using `framer-motion` that allows users to move the call window while browsing other app features.
*   **Real-time Chat**: Messages are synchronized through Cloudflare D1. The UI supports stickers, emojis, and GIFs via the Giphy API bridge.

### 🎵 Media Synchronization (`/src/modules/media`)
*   **Listen Together**: Uses a custom socket-based synchronization protocol. When a host plays a track, a "room-sync" event is broadcasted to all peers, keeping playback offset within 500ms.
*   **Background Playback**: Implemented using the `MediaSession API` and a silent loop audio trick. This prevents Android from killing the webview process when the app is minimized.
*   **Local Scanner**: Uses `@capacitor/filesystem` to index the device's external storage, filtering for `.mp3` and `.wav` files and saving metadata to `localStorage` for offline access.

### 🤖 RAMSHA AI Engine (`/src/lib/ai`)
RAMSHA is more than a chatbot; it's an **Intent Router**.
*   **Intent Matching**: Instead of sending every message to an expensive LLM, RAMSHA first matches keywords locally. If you say "Play music", it triggers the `play_music` intent immediately.
*   **Memory Persistence**: Conversations are serialized and stored in `localStorage`. RAMSHA retrieves the last 50 messages to maintain context across app restarts.
*   **Tool Integration**: RAMSHA can call real-time APIs for Weather, Finance (CoinGecko), and Sports (CricAPI) to provide live data cards.

### 🎮 Gaming Lounge (`/src/modules/gaming`)
*   **Multiplayer Logic**: Uses a lobby-based system. Players join a shared `RoomID`, and game states (like a Ludo move or a Tic-Tac-Toe mark) are synced via the Cloudflare Worker.
*   **Responsive Grids**: The gaming UI adapts from a 2-column mobile layout to a high-density desktop grid using custom CSS Grid utilities.

---

## 📂 Project Structure

```bash
├── android/               # Native Android Project Files
├── public/                # Static assets (Favicons, Logos)
├── src/
│   ├── components/        # Reusable UI (Avatar, Buttons, Layouts)
│   ├── contexts/          # Global State (Auth, Player, Call)
│   ├── hooks/             # Custom Logic (useWebRTC, useRoomSync)
│   ├── lib/               # Core Utilities (AI Engine, Firebase, YouTube)
│   ├── modules/           # Feature Modules (AI, Comms, Gaming, Media)
│   └── pages/             # Route Components (Home, Media, Social)
├── workers/               # Cloudflare Worker Source (D1 API)
└── capacitor.config.ts    # Native App Configuration
```

---

## 🔧 Troubleshooting

### 1. APK Storage Permissions
If the local music scanner fails, ensure you have enabled "Music and Audio" permissions in the Android App Info settings.

### 2. Camera Freeze
If the camera freezes on older devices, check that the device supports WebRTC hardware acceleration in the system WebView.

### 3. API Quotas
The YouTube search uses a proxy to avoid rate limits. If search fails, verify the `YOUTUBE_API_KEY` in your Cloudflare Worker environment.

---

## 🛡️ Security & Optimization
*   **Secret Management**: All API keys are stored in encrypted Cloudflare Worker secrets.
*   **Live Updates**: Integrated with CapGo for over-the-air (OTA) updates.
*   **Memory Efficiency**: Local message and media caching for lightning-fast performance.

---

## 🤝 Contribution
Created with ❤️ by **Nabeel Hussain**. Contributions and feedback are welcome!

<div align="center">
  <p>© 2026 N&L Connect. All rights reserved.</p>
</div>
