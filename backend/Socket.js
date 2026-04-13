// Backend/Socket.js
let ioInstance = null;
const onlineUsers = new Map(); // userId → socketId

export const initSocket = (io) => {
  ioInstance = io;

  io.on("connection", (socket) => {
    // ── Register user ──────────────────────────────────────────────────────────
    socket.on("register", (userId) => {
      onlineUsers.set(userId.toString(), socket.id);
    });

    // ── Mentorship chat rooms ──────────────────────────────────────────────────
    socket.on("chat:join",       (mentorshipId) => socket.join(`chat:${mentorshipId}`));
    socket.on("chat:leave",      (mentorshipId) => socket.leave(`chat:${mentorshipId}`));
    socket.on("chat:typing",     ({ mentorshipId, userName }) => {
      socket.to(`chat:${mentorshipId}`).emit("chat:typing", { userName });
    });
    socket.on("chat:stop_typing", ({ mentorshipId }) => {
      socket.to(`chat:${mentorshipId}`).emit("chat:stop_typing");
    });

    // ── Connection (peer-to-peer) chat rooms ───────────────────────────────────
    socket.on("conn_chat:join",  (connectionId) => socket.join(`conn_chat:${connectionId}`));
    socket.on("conn_chat:leave", (connectionId) => socket.leave(`conn_chat:${connectionId}`));
    socket.on("conn_chat:typing", ({ connectionId, userName }) => {
      socket.to(`conn_chat:${connectionId}`).emit("conn_chat:typing", { connectionId, userName });
    });
    socket.on("conn_chat:stop_typing", ({ connectionId }) => {
      socket.to(`conn_chat:${connectionId}`).emit("conn_chat:stop_typing", { connectionId });
    });

    // ── Disconnect cleanup ─────────────────────────────────────────────────────
    socket.on("disconnect", () => {
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          break;
        }
      }
    });
  });
};

// ── Emit to a specific user ────────────────────────────────────────────────────
export const emitToUser = (userId, event, data) => {
  if (!ioInstance) return;
  const socketId = onlineUsers.get(userId.toString());
  if (socketId) {
    ioInstance.to(socketId).emit(event, data);
  }
};

// ── Broadcast to a mentorship chat room ───────────────────────────────────────
export const emitToRoom = (mentorshipId, event, data) => {
  if (!ioInstance) return;
  ioInstance.to(`chat:${mentorshipId}`).emit(event, data);
};

// ── Broadcast to a connection chat room ───────────────────────────────────────
export const emitToConnRoom = (connectionId, event, data) => {
  if (!ioInstance) return;
  ioInstance.to(`conn_chat:${connectionId}`).emit(event, data);
};