// Backend/Socket.js
let ioInstance = null;
const onlineUsers = new Map(); // userId → socketId

export const initSocket = (io) => {
  ioInstance = io;

  io.on("connection", (socket) => {
    // ── Register user (called right after connect from frontend) ──────────────
    socket.on("register", (userId) => {
      if (userId) {
        const userIdStr = userId.toString();
        socket.join(`user:${userIdStr}`);
        onlineUsers.set(userIdStr, socket.id);
      }
    });

    // ── Join a mentorship chat room ───────────────────────────────────────────
    // Called when user opens a chat window for a specific mentorship session
    socket.on("chat:join", (mentorshipId) => {
      socket.join(`chat:${mentorshipId}`);
    });

    // ── Leave a mentorship chat room ──────────────────────────────────────────
    socket.on("chat:leave", (mentorshipId) => {
      socket.leave(`chat:${mentorshipId}`);
    });

    // ── Typing indicator ──────────────────────────────────────────────────────
    socket.on("chat:typing", ({ mentorshipId, userName }) => {
      // Broadcast to everyone in the room except sender
      socket.to(`chat:${mentorshipId}`).emit("chat:typing", { userName });
    });

    socket.on("chat:stop_typing", ({ mentorshipId }) => {
      socket.to(`chat:${mentorshipId}`).emit("chat:stop_typing");
    });

    // ── Disconnect cleanup ────────────────────────────────────────────────────
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

// ── Send event to a specific user by their DB _id ────────────────────────────
// In a clustered environment, we emit to the user's room to route the event correctly
export const emitToUser = (userId, event, data) => {
  if (!ioInstance || !userId) return;
  ioInstance.to(`user:${userId.toString()}`).emit(event, data);
};

// ── Broadcast to all members of a chat room ───────────────────────────────────
// Used for real-time message delivery to the chat room (both participants)
export const emitToRoom = (mentorshipId, event, data) => {
  if (!ioInstance) return;
  ioInstance.to(`chat:${mentorshipId}`).emit(event, data);
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
