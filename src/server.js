/**
 * Real-time Whiteboard server
 * Syncs canvas drawing events between connected clients via Socket.io
 */
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "..", "public");

const app = express();
const httpServer = createServer(app);
app.use(express.static(PUBLIC_DIR));

app.get("/health", (req, res) => {
  res.json({ status: "ok", users: io.engine.clientsCount, uptime: process.uptime() });
});

const io = new Server(httpServer, { cors: { origin: "*" } });

io.on("connection", (socket) => {
  console.log(`[+] ${socket.id} connected`);

  // New user joins — broadcast current canvas state from any existing user
  socket.broadcast.emit("user:joined", { id: socket.id });
  // Ask one existing user to send their canvas snapshot
  socket.broadcast.emit("canvas:request-snapshot", { to: socket.id });

  // Drawing events
  socket.on("draw:stroke", (data) => {
    socket.broadcast.emit("draw:stroke", data);
  });

  socket.on("canvas:snapshot", (data) => {
    if (data.to) {
      io.to(data.to).emit("canvas:snapshot", { imageData: data.imageData });
    }
  });

  socket.on("canvas:clear", () => {
    socket.broadcast.emit("canvas:clear");
  });

  socket.on("disconnect", () => {
    console.log(`[-] ${socket.id} disconnected`);
    socket.broadcast.emit("user:left", { id: socket.id });
  });
});

if (import.meta.url === `file://${process.argv[1]}`) {
  httpServer.listen(PORT, () => {
    console.log(`🎨 Real-time Whiteboard running at http://localhost:${PORT}`);
  });
}

export { app, httpServer, io };
