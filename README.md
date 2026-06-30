# Real-time Whiteboard

> Multi-user real-time whiteboard with shared canvas. Draw together in real time via WebSockets. Node.js + Socket.io + HTML5 Canvas.

![CI](https://github.com/arjundroid12/realtime-whiteboard/actions/workflows/ci.yml/badge.svg)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

## ✨ Features

- **Real-time sync** — draw on the canvas; everyone else sees it instantly
- **Multi-user** — open the URL in multiple tabs/devices, all draw together
- **Canvas snapshot on join** — new users receive the current canvas state from existing users
- **Color picker** — any color via native color input
- **Brush size** — 1-40px slider
- **Undo** — last 20 snapshots
- **Clear all** — clears for everyone (with confirmation)
- **Touch support** — works on mobile and tablet
- **Auto-resize** — canvas fills the window
- **Connection status indicator**

## 🚀 Quick Start

```bash
git clone https://github.com/arjundroid12/realtime-whiteboard.git
cd realtime-whiteboard
npm install
npm start
# Visit http://localhost:3000
```

**Test multi-user:** Open `http://localhost:3000` in two browser tabs. Draw in one — the other sees it instantly.

## 🚢 Deploy

**Render:** Push to GitHub → New Web Service → Build: `npm install`, Start: `npm start`

## 📡 How It Works

1. Each `mousemove` while drawing emits a `draw:stroke` event with the line coordinates
2. Server broadcasts the event to all OTHER connected clients
3. Each client renders the stroke on their local canvas
4. When a new user joins, server asks an existing user for a canvas snapshot
5. Existing user sends `canvas.toDataURL()` privately to the new user
6. New user renders the snapshot to "catch up"

## 📁 Project Structure

```
realtime-whiteboard/
├── .github/workflows/ci.yml
├── public/
│   ├── app.js         # Canvas drawing + Socket.io client
│   ├── index.html     # UI shell
│   └── styles.css     # Layout
├── src/
│   └── server.js      # Express + Socket.io server
└── package.json
```

## 📄 License

MIT © Arjun Vashishtha
