// Backend/socket.js
let ioInstance = null;
const onlineUsers = new Map();

export const initSocket = (io) => {
  ioInstance = io;

  io.on("connection", (socket) => {
    console.log("✅ Socket connected:", socket.id);

    socket.on("register", (userId) => {
      onlineUsers.set(userId.toString(), socket.id);
      console.log(`✅ Registered: userId=${userId} socketId=${socket.id}`);
      console.log("📋 Online users:", Object.fromEntries(onlineUsers));
    });

    socket.on("disconnect", () => {
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          console.log(`❌ Disconnected: userId=${userId}`);
          break;
        }
      }
    });
  });
};

export const emitToUser = (userId, event, data) => {
  if (!ioInstance) {
    console.log("⚠️  emitToUser: ioInstance is null");
    return;
  }
  const socketId = onlineUsers.get(userId.toString());
  console.log(`📡 emitToUser → userId=${userId} event=${event} socketId=${socketId || "NOT FOUND"}`);
  console.log("📋 Current online users:", Object.fromEntries(onlineUsers));
  if (socketId) {
    ioInstance.to(socketId).emit(event, data);
    console.log(`✅ Emitted ${event} to ${userId}`);
  } else {
    console.log(`⚠️  User ${userId} is not online — event not delivered`);
  }
};