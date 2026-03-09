// Backend/server.js
import { app } from "./app.js";
import { createServer } from "http";
import { Server } from "socket.io";
import { config } from "dotenv";
import { initSocket } from "./Socket.js";

config({ path: "./.env" });

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: [process.env.FRONTEND_URL],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

// Initialize all socket event listeners
initSocket(io);

httpServer.listen(process.env.PORT, () => {
  console.log(`Server listening on port ${process.env.PORT}`);
});