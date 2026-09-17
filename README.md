# Cross-Device Clipboard Sync

> Zero-knowledge, end-to-end encrypted real-time cross-device clipboard mesh with instant QR pairing, offline persistence, and live peer presence.

---

## Overview

**Cross-Device Clipboard Sync** enables immediate synchronization of text, code snippets, links, and markdown across phones, tablets, laptops, and desktops. Every clip is encrypted client-side using **AES-256-GCM** before transmission over low-latency WebSockets, ensuring zero-knowledge privacy where the server never sees plaintext data.

---

## Core Capabilities

### 1. Instant Real-Time Synchronization
- **Low Latency (<50ms):** WebSocket bidirectional broadcast delivers clips across devices instantaneously.
- **Auto-Copy Option:** Automatically writes incoming snippets to the system clipboard upon arrival.
- **Loop Prevention:** Cryptographic fingerprinting and echo suppression prevent copy feedback loops.

### 2. Live Device Presence & Real-Time Count
- **Dynamic Mesh Tracking:** The header displays the active number of connected devices, updating immediately when a peer joins or leaves.
- **Pulsing Indicator:** A live green mesh beacon signals active multi-device pairing.
- **Connection Alerts:** Non-intrusive haptic and visual toasts notify you whenever a device connects or leaves the mesh.

### 3. Zero-Knowledge Cryptographic Architecture
- **AES-256-GCM:** 256-bit Galois/Counter Mode authenticated encryption executed directly in the browser via the native Web Crypto API (`crypto.subtle`).
- **PBKDF2 Key Derivation:** 100,000 rounds of SHA-256 key stretching with randomized salts.
- **Zero Server Knowledge:** The relay server routes encrypted blobs (`ciphertext`, `iv`, `salt`) and has no ability to decrypt payloads.

### 4. Effortless Device Pairing
- **QR Code Scanning:** Point a phone camera at the on-screen QR code to open the app and connect to the room with matching encryption keys in a single step.
- **Direct Link Sharing:** Single-click shareable URLs containing room credentials.
- **6-Digit Room Codes:** Manual room entry automatically derives cryptographic keys without needing to copy 32-character hex strings.

### 5. Offline-First Resilience
- **Local Persistence:** All items and settings are cached locally on each device.
- **Offline Queue:** Snippets created while disconnected are queued and automatically flushed once connectivity is restored.
- **REST Fallback:** Graceful fallback to HTTP polling (`/api/rooms/:roomCode/items`) if WebSocket upgrades are blocked by strict corporate firewalls.

### 6. Power User Features
- **Stealth HUD (`Alt + S`):** Collapse the full UI into a minimalist floating status bar.
- **Keyboard Shortcuts:**
  - `Alt + N` / `Cmd + K`: Focus new clip composer or search.
  - `Ctrl + Shift + V`: Manually pull and sync clipboard.
  - `Alt + L`: Toggle architectural protocol overview and live workspace.
  - `?`: Open keyboard shortcuts cheat sheet.
- **Batch Actions:** Multi-select clips to copy, pin, or delete in bulk.
- **24-Hour Activity Sparkline:** Real-time sync frequency and throughput analytics.

---

## Architecture & Data Flow

```
[ Device A (Desktop) ]
        │  1. Capture & Encrypt (AES-256-GCM)
        ▼
[ WebSocket Relay Server (/ws) ]
        │  2. Ephemeral Room Broadcast (Zero-Knowledge)
        ▼
[ Device B (Mobile Phone) ]
        │  3. Decrypt (Web Crypto API) & Auto-Copy to Clipboard
```

---

## Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS, Motion (`motion/react`)
- **Backend:** Node.js, Express, WebSocket Server (`ws`)
- **Cryptography:** Native Web Crypto API (`window.crypto.subtle`)
- **PWA:** Installable Service Worker with offline caching

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd <project-directory>

# Install dependencies
npm install
```

### Development

```bash
# Start the unified Express & Vite development server
npm run dev
```

Open `http://localhost:3000` in your browser.

### Production Build

```bash
# Build the client and bundle the server
npm run build

# Start the production server
npm start
```

---

## Privacy & Security

- **No Accounts Required:** Rooms are ephemeral and created on demand without accounts or logins.
- **End-to-End Encrypted:** Keys are held exclusively in device memory and client-side storage.
- **Memory-Only Relay:** Relayed clipboard payloads can be cleared at any time across all connected peers.
