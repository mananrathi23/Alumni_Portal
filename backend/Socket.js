// Backend/Socket.js
import jwt from "jsonwebtoken";
import { isTokenBlacklisted } from "./utils/tokenBlacklist.js";

let ioInstance = null;

// The login JWT: sent by the client in the handshake `auth`, or as the auth cookie
const tokenFrom = (socket) => {
  if (socket.handshake.auth?.token) return socket.handshake.auth.token;
  const match = (socket.handshake.headers.cookie || "").match(/(?:^|;\s*)token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
};

export const initSocket = (io) => {
  ioInstance = io;

  // Every socket must prove who it is. Each user's private events (chat messages,
  // notifications) go to the room user:<id>, so the room is chosen from the
  // verified token — never from an id the client claims.
  io.use(async (socket, next) => {
    try {
      const token = tokenFrom(socket);
      if (!token) return next(new Error("unauthorized"));
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      if (decoded.jti && await isTokenBlacklisted(decoded.jti)) return next(new Error("unauthorized"));
      socket.data.userId = decoded.id.toString();
      next();
    } catch {
      next(new Error("unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId;
    socket.join(`user:${userId}`);

    // Older clients announce themselves after connecting; the room is already joined
    socket.on("register", () => {});

    // ── Typing indicator for a 1:1 conversation, relayed to the other person ──
    socket.on("chat:typing", ({ toUserId } = {}) => {
      if (toUserId) socket.to(`user:${toUserId}`).emit("chat:typing", { fromUserId: userId });
    });
    socket.on("chat:stop_typing", ({ toUserId } = {}) => {
      if (toUserId) socket.to(`user:${toUserId}`).emit("chat:stop_typing", { fromUserId: userId });
    });
  });
};

// ── Send event to a specific user by their DB _id ────────────────────────────
// In a clustered environment, we emit to the user's room to route the event correctly
export const emitToUser = (userId, event, data) => {
  if (!ioInstance || !userId) return;
  ioInstance.to(`user:${userId.toString()}`).emit(event, data);
};

// ── Broadcast to ALL connected clients ───────────────────────────────────────
// Used for public feeds like incubation comments
export const emitToAll = (event, data) => {
  if (!ioInstance) return;
  ioInstance.emit(event, data);
};

// ── Tell open list pages (jobs, events, forum, incubation) that content changed ─
// Clients refetch on this instead of polling every few seconds.
export const emitFeedUpdated = (feed) => emitToAll("feed:updated", { feed });
