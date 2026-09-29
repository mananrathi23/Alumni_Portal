// Backend/server.js
import { app }          from "./app.js";
import { createServer } from "http";
import { Server }       from "socket.io";
import { config }       from "dotenv";
import { initSocket }   from "./Socket.js";
import { startReminderCron } from "./utils/reminderCron.js";
import { createAdapter } from "@socket.io/redis-adapter";
import { createRedisDuplicate } from "./utils/redisClient.js";

config({ path: "./.env" });

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin:      [process.env.FRONTEND_URL],
    methods:     ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

// Configure Redis adapter for Socket.io clustering when Redis is available
let pubClient;
let subClient;

try {
  pubClient = createRedisDuplicate("Redis Pub");
  subClient = createRedisDuplicate("Redis Sub");
  if (pubClient && subClient) {
    io.adapter(createAdapter(pubClient, subClient));
  }
} catch (err) {
  console.warn("[Socket.io] Redis adapter unavailable, continuing without Redis:", err.message);
}

initSocket(io);
startReminderCron();

const port = Number(process.env.PORT || 4000);

httpServer.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.warn(`Port ${port} is already in use. Trying a different port...`);
    httpServer.listen(0, () => {
      const assignedPort = httpServer.address().port;
      console.log(`Server listening on port ${assignedPort}`);
    });
  } else {
    console.error("HTTP server error:", error);
    process.exit(1);
  }
});

httpServer.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
