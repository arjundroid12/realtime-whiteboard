/* Real-time Whiteboard client (gracefully degrades to local mode when Socket.io is unavailable) */
(() => {
  "use strict";
  const canvas = document.getElementById("board");
  const ctx = canvas.getContext("2d");
  const colorPicker = document.getElementById("colorPicker");
  const brushSize = document.getElementById("brushSize");
  const brushSizeValue = document.getElementById("brushSizeValue");
  const undoBtn = document.getElementById("undoBtn");
  const clearBtn = document.getElementById("clearBtn");
  const statusEl = document.getElementById("status");
  const usersEl = document.getElementById("users");

  // Resize canvas to fit window
  function resizeCanvas() {
    const wrap = canvas.parentElement;
    const data = canvas.toDataURL(); // preserve current drawing
    canvas.width = wrap.clientWidth;
    canvas.height = wrap.clientHeight;
    const img = new Image();
    img.onload = () => ctx.drawImage(img, 0, 0);
    img.src = data;
  }
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  // Drawing state
  let drawing = false;
  let lastX = 0, lastY = 0;
  let color = "#6366f1";
  let size = 4;
  const history = [];
  const MAX_HISTORY = 20;

  function saveSnapshot() {
    history.push(canvas.toDataURL());
    if (history.length > MAX_HISTORY) history.shift();
  }

  // Socket.io — optional. If unavailable (e.g. static hosting on Vercel), run in local mode.
  let socket = null;
  try {
    if (typeof io !== "undefined") {
      socket = io();
      socket.on("connect", () => {
        statusEl.textContent = "connected";
        statusEl.classList.add("online");
        usersEl.textContent = "Multiple users may be drawing";
      });
      socket.on("disconnect", () => {
        statusEl.textContent = "disconnected";
        statusEl.classList.remove("online");
      });
      socket.on("draw:stroke", (data) => {
        drawLine(data.x1, data.y1, data.x2, data.y2, data.color, data.size);
      });
      socket.on("canvas:snapshot", (data) => {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0);
        img.src = data.imageData;
      });
      socket.on("canvas:request-snapshot", (data) => {
        socket.emit("canvas:snapshot", { to: data.to, imageData: canvas.toDataURL() });
      });
      socket.on("canvas:clear", () => {
        saveSnapshot();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      });
    }
  } catch (e) {
    console.warn("Socket.io unavailable — running in local mode", e);
  }

  if (!socket) {
    statusEl.textContent = "local mode";
    statusEl.classList.remove("online");
    usersEl.textContent = "Single-user drawing canvas";
  }

  // Drawing functions
  function drawLine(x1, y1, x2, y2, strokeColor, strokeSize) {
    ctx.beginPath();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const evt = e.touches ? e.touches[0] : e;
    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top,
    };
  }

  function startDraw(e) {
    e.preventDefault();
    drawing = true;
    const pos = getPos(e);
    lastX = pos.x;
    lastY = pos.y;
    saveSnapshot();
  }

  function draw(e) {
    if (!drawing) return;
    e.preventDefault();
    const pos = getPos(e);
    drawLine(lastX, lastY, pos.x, pos.y, color, size);
    if (socket) {
      socket.emit("draw:stroke", { x1: lastX, y1: lastY, x2: pos.x, y2: pos.y, color, size });
    }
    lastX = pos.x;
    lastY = pos.y;
  }

  function endDraw() { drawing = false; }

  canvas.addEventListener("mousedown", startDraw);
  canvas.addEventListener("mousemove", draw);
  canvas.addEventListener("mouseup", endDraw);
  canvas.addEventListener("mouseleave", endDraw);
  canvas.addEventListener("touchstart", startDraw, { passive: false });
  canvas.addEventListener("touchmove", draw, { passive: false });
  canvas.addEventListener("touchend", endDraw);

  // Controls
  colorPicker.addEventListener("input", (e) => { color = e.target.value; });
  brushSize.addEventListener("input", (e) => {
    size = parseInt(e.target.value);
    brushSizeValue.textContent = size;
  });

  undoBtn.addEventListener("click", () => {
    if (history.length === 0) return;
    const last = history.pop();
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = last;
  });

  clearBtn.addEventListener("click", () => {
    if (!confirm("Clear the entire canvas?")) return;
    saveSnapshot();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (socket) socket.emit("canvas:clear");
  });
})();
