import express from "express";
import http from "http";
import path from "path";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";

interface DeviceInfo {
  id: string;
  name: string;
  type: "desktop" | "mobile" | "tablet" | "browser";
  joinedAt: number;
  lastSeen: number;
}

interface EncryptedClipboardItem {
  id: string;
  encryptedPayload: string; // Base64 ciphertext
  iv: string; // Base64 IV (12 bytes)
  salt: string; // Base64 salt
  senderId: string;
  senderName: string;
  senderType: string;
  timestamp: number;
  contentType: "text" | "code" | "link" | "image";
  previewHint?: string; // Optional non-sensitive length/type preview e.g. "Text • 42 chars"
  pinned?: boolean;
}

interface RoomData {
  clients: Set<WebSocket>;
  devices: Map<string, DeviceInfo>;
  items: EncryptedClipboardItem[];
  createdAt: number;
  lastActive: number;
}

const rooms = new Map<string, RoomData>();

function getOrCreateRoom(roomCode: string): RoomData {
  const normalized = roomCode.trim().toUpperCase();
  let room = rooms.get(normalized);
  if (!room) {
    room = {
      clients: new Set(),
      devices: new Map(),
      items: [],
      createdAt: Date.now(),
      lastActive: Date.now(),
    };
    rooms.set(normalized, room);
  }
  room.lastActive = Date.now();
  return room;
}

// Clean inactive rooms every 30 minutes
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms.entries()) {
    if (room.clients.size === 0 && now - room.lastActive > 24 * 60 * 60 * 1000) {
      rooms.delete(code);
    }
  }
}, 30 * 60 * 1000);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "25mb" }));

  // API endpoints
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      uptime: process.uptime(),
      activeRooms: rooms.size,
      timestamp: Date.now(),
    });
  });

  // REST fallback for room sync
  app.get("/api/rooms/:roomCode/items", (req, res) => {
    const roomCode = req.params.roomCode.toUpperCase();
    const room = rooms.get(roomCode);
    if (!room) {
      return res.json({ items: [], devices: [] });
    }
    const devicesList = Array.from(room.devices.values());
    res.json({
      items: room.items,
      devices: devicesList,
      count: room.items.length,
    });
  });

  // REST fallback to push item
  app.post("/api/rooms/:roomCode/items", (req, res) => {
    const roomCode = req.params.roomCode.toUpperCase();
    const item = req.body as EncryptedClipboardItem;
    if (!item || !item.id || !item.encryptedPayload) {
      return res.status(400).json({ error: "Invalid clipboard payload" });
    }

    const room = getOrCreateRoom(roomCode);
    // Deduplicate
    const exists = room.items.some((it) => it.id === item.id);
    if (!exists) {
      room.items.unshift(item);
      if (room.items.length > 60) {
        room.items = room.items.slice(0, 60);
      }
    }

    // Broadcast to WS clients in room
    const message = JSON.stringify({
      type: "item:new",
      item,
      roomCode,
    });
    for (const client of room.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }

    res.json({ success: true, id: item.id });
  });

  const httpServer = http.createServer(app);

  // Setup WebSocket Server
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on("upgrade", (request, socket, head) => {
    try {
      const host = request.headers.host || "localhost:3000";
      const pathname = request.url ? new URL(request.url, `http://${host}`).pathname : "/";
      if (pathname === "/ws") {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit("connection", ws, request);
        });
      }
    } catch (err) {
      console.warn("WebSocket upgrade error:", err);
    }
  });

  interface ClientMeta {
    roomCode?: string;
    deviceId?: string;
    isAlive: boolean;
  }

  const clientMetadata = new WeakMap<WebSocket, ClientMeta>();

  wss.on("connection", (ws: WebSocket) => {
    const meta: ClientMeta = { isAlive: true };
    clientMetadata.set(ws, meta);

    ws.on("pong", () => {
      const m = clientMetadata.get(ws);
      if (m) m.isAlive = true;
    });

    ws.on("message", (data) => {
      try {
        const payload = JSON.parse(data.toString());
        const { type } = payload;

        if (type === "join-room") {
          const { roomCode, deviceId, deviceName, deviceType } = payload;
          if (!roomCode || !deviceId) return;

          const normCode = roomCode.trim().toUpperCase();

          // If client was previously in a different room, clean up old room membership
          if (meta.roomCode && meta.roomCode !== normCode) {
            const oldRoom = rooms.get(meta.roomCode);
            if (oldRoom) {
              oldRoom.clients.delete(ws);
              if (meta.deviceId) {
                oldRoom.devices.delete(meta.deviceId);
                const leaveMsg = JSON.stringify({
                  type: "device:left",
                  deviceId: meta.deviceId,
                  devices: Array.from(oldRoom.devices.values()),
                });
                for (const client of oldRoom.clients) {
                  if (client.readyState === WebSocket.OPEN) {
                    client.send(leaveMsg);
                  }
                }
              }
            }
          }

          const room = getOrCreateRoom(normCode);
          room.clients.add(ws);

          meta.roomCode = normCode;
          meta.deviceId = deviceId;

          const devInfo: DeviceInfo = {
            id: deviceId,
            name: deviceName || "Unknown Device",
            type: deviceType || "desktop",
            joinedAt: Date.now(),
            lastSeen: Date.now(),
          };
          room.devices.set(deviceId, devInfo);

          // Send back initial state to the newly joined client
          ws.send(
            JSON.stringify({
              type: "room:joined",
              roomCode: normCode,
              items: room.items,
              devices: Array.from(room.devices.values()),
            })
          );

          // Broadcast device joined to everyone in the room
          const joinMsg = JSON.stringify({
            type: "device:joined",
            device: devInfo,
            devices: Array.from(room.devices.values()),
          });
          for (const client of room.clients) {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(joinMsg);
            }
          }
        } else if (type === "ping") {
          ws.send(JSON.stringify({ type: "pong", timestamp: Date.now() }));
          if (meta.roomCode && meta.deviceId) {
            const room = rooms.get(meta.roomCode);
            if (room && room.devices.has(meta.deviceId)) {
              const dev = room.devices.get(meta.deviceId)!;
              dev.lastSeen = Date.now();
            }
          }
        } else if (type === "item:send") {
          const { roomCode, item } = payload;
          if (!roomCode || !item || !item.id) return;

          const normCode = roomCode.trim().toUpperCase();
          const room = getOrCreateRoom(normCode);

          // Deduplicate
          const idx = room.items.findIndex((i) => i.id === item.id);
          if (idx >= 0) {
            room.items[idx] = item;
          } else {
            room.items.unshift(item);
            if (room.items.length > 60) {
              room.items = room.items.slice(0, 60);
            }
          }

          // Broadcast to all clients in room except sender (or including if requested)
          const broadcastMsg = JSON.stringify({
            type: "item:new",
            item,
            senderId: meta.deviceId,
          });

          for (const client of room.clients) {
            if (client.readyState === WebSocket.OPEN) {
              client.send(broadcastMsg);
            }
          }
        } else if (type === "item:delete") {
          const { roomCode, itemId } = payload;
          if (!roomCode || !itemId) return;

          const normCode = roomCode.trim().toUpperCase();
          const room = rooms.get(normCode);
          if (!room) return;

          room.items = room.items.filter((i) => i.id !== itemId);

          const delMsg = JSON.stringify({
            type: "item:deleted",
            itemId,
          });
          for (const client of room.clients) {
            if (client.readyState === WebSocket.OPEN) {
              client.send(delMsg);
            }
          }
        } else if (type === "item:pin") {
          const { roomCode, itemId, pinned } = payload;
          if (!roomCode || !itemId) return;
          const normCode = roomCode.trim().toUpperCase();
          const room = rooms.get(normCode);
          if (!room) return;

          const it = room.items.find((i) => i.id === itemId);
          if (it) {
            it.pinned = !!pinned;
            const pinMsg = JSON.stringify({
              type: "item:pinned",
              itemId,
              pinned: it.pinned,
            });
            for (const client of room.clients) {
              if (client.readyState === WebSocket.OPEN) {
                client.send(pinMsg);
              }
            }
          }
        } else if (type === "items:delete_batch") {
          const { roomCode, itemIds } = payload;
          if (!roomCode || !Array.isArray(itemIds)) return;
          const normCode = roomCode.trim().toUpperCase();
          const room = rooms.get(normCode);
          if (!room) return;

          const idSet = new Set(itemIds);
          room.items = room.items.filter((i) => !idSet.has(i.id));

          const delBatchMsg = JSON.stringify({
            type: "items:deleted_batch",
            itemIds,
          });
          for (const client of room.clients) {
            if (client.readyState === WebSocket.OPEN) {
              client.send(delBatchMsg);
            }
          }
        } else if (type === "items:pin_batch") {
          const { roomCode, itemIds, pinned } = payload;
          if (!roomCode || !Array.isArray(itemIds)) return;
          const normCode = roomCode.trim().toUpperCase();
          const room = rooms.get(normCode);
          if (!room) return;

          const idSet = new Set(itemIds);
          for (const it of room.items) {
            if (idSet.has(it.id)) {
              it.pinned = !!pinned;
            }
          }

          const pinBatchMsg = JSON.stringify({
            type: "items:pinned_batch",
            itemIds,
            pinned: !!pinned,
          });
          for (const client of room.clients) {
            if (client.readyState === WebSocket.OPEN) {
              client.send(pinBatchMsg);
            }
          }
        } else if (type === "items:clear") {
          const { roomCode } = payload;
          if (!roomCode) return;
          const normCode = roomCode.trim().toUpperCase();
          const room = rooms.get(normCode);
          if (!room) return;

          // Keep pinned items only if wanted, or wipe unpinned
          room.items = room.items.filter((i) => i.pinned);

          const clearMsg = JSON.stringify({
            type: "items:cleared",
            remaining: room.items,
          });
          for (const client of room.clients) {
            if (client.readyState === WebSocket.OPEN) {
              client.send(clearMsg);
            }
          }
        }
      } catch (err) {
        console.error("WS error handling message:", err);
      }
    });

    ws.on("close", () => {
      const { roomCode, deviceId } = meta;
      if (roomCode) {
        const room = rooms.get(roomCode);
        if (room) {
          room.clients.delete(ws);
          if (deviceId) {
            room.devices.delete(deviceId);
            // Notify remaining devices
            const leaveMsg = JSON.stringify({
              type: "device:left",
              deviceId,
              devices: Array.from(room.devices.values()),
            });
            for (const client of room.clients) {
              if (client.readyState === WebSocket.OPEN) {
                client.send(leaveMsg);
              }
            }
          }
        }
      }
    });
  });

  // Heartbeat interval for stale WS detection
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      const meta = clientMetadata.get(ws);
      if (!meta) return;
      if (!meta.isAlive) {
        ws.terminate();
        return;
      }
      meta.isAlive = false;
      ws.ping();
    });
  }, 25000);

  wss.on("close", () => {
    clearInterval(heartbeatInterval);
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Clipboard Sync Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
