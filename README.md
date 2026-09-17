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

## Architecture & Multi-Transport Engine

The application employs an adaptive multi-transport sync engine designed for high availability across any hosting platform:

```
                  ┌──────────────────────────────────────────────┐
                  │           Device A (Web Browser)             │
                  │  AES-256-GCM Encryption (crypto.subtle)      │
                  └──────┬───────────────────────┬───────────────┘
                         │                       │
      Primary Transport  │    Zero-Knowledge     │  Same-Machine
       (Local/VPS/Cloud) │      Cloud Mesh       │   Tabs Sync
                         ▼    (Vercel/Serverless)▼
             ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
             │ Node.js /ws Server   │  │ TLS MQTT WSS Mesh    │  │ BroadcastChannel API │
             │  Express + WS Engine │  │ EMQX & HiveMQ Clusters│  │ Direct Tab-to-Tab    │
             └───────────┬──────────┘  └──────────┬───────────┘  └──────────┬───────────┘
                         │                        │                         │
                         └────────────────┬───────┴─────────────────────────┘
                                          │ Encrypted Ciphertext
                                          ▼
                  ┌──────────────────────────────────────────────┐
                  │           Device B (Phone/Tablet)            │
                  │  AES-256-GCM Decryption (crypto.subtle)      │
                  │  Instant Auto-Copy to Clipboard              │
                  └──────────────────────────────────────────────┘
```

### Transport Modes
1. **Dedicated WebSocket Server (`/ws`):** Used when running locally, in Docker, or on container hosts (Cloud Run, Railway, Render, Fly.io, VPS).
2. **Serverless Encrypted Cloud Mesh (TLS WSS):** Automatically engaged when hosted on Vercel, Netlify, Cloudflare Pages, or static CDNs where persistent custom WebSocket servers are not supported. Operates over TLS port 8084 with zero server-side state.
3. **Local BroadcastChannel:** Instantly mirrors clipboard events across tabs and windows open on the same computer without consuming external network bandwidth.
4. **Serverless REST Outbox:** Serverless fallback endpoints (`/api/rooms/[roomCode]/items`) for asynchronous catchup and firewalled networks.

---

## Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS, Motion (`motion/react`)
- **Backend:** Node.js, Express, WebSocket Server (`ws`), Serverless functions (`/api/*`)
- **Mesh Transport:** MQTT over WebSocket (`mqtt`), BroadcastChannel API
- **Cryptography:** Native Web Crypto API (`window.crypto.subtle`), AES-256-GCM, PBKDF2 (100k rounds)
- **PWA:** Installable Service Worker with offline caching

---

## Deployment Options

### Deploy to Vercel (Serverless)
The app is pre-configured for Vercel via `vercel.json` and serverless API handlers in `/api/`:
1. Push this repository to GitHub.
2. Import the project into Vercel.
3. Deploy! The app will automatically connect through the encrypted zero-knowledge cloud mesh and `BroadcastChannel`, enabling cross-device sync with zero server maintenance.

### Deploy with Custom WebSocket Server (Render / Railway / Cloud Run / Docker)
```bash
# Build the client and bundle the server
npm run build

# Start the unified Express & WebSocket server
npm start
```

---

## Privacy & Security

- **No Accounts Required:** Rooms are ephemeral and created on demand without accounts or logins.
- **End-to-End Encrypted:** Keys are held exclusively in device memory and client-side storage.
- **Memory-Only Relay:** Relayed clipboard payloads can be cleared at any time across all connected peers.
