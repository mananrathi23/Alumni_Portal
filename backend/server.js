// Backend/server.js
import { app }          from "./app.js";
import { createServer } from "http";
import { Server }       from "socket.io";
import { config }       from "dotenv";
import { initSocket }   from "./Socket.js";
import { startReminderCron } from "./utils/reminderCron.js";
import { createAdapter } from "@socket.io/redis-adapter";
import { createRedisDuplicate, redis } from "./utils/redisClient.js";
import mongoose from "mongoose";
import cron from "node-cron";

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

// ── Graceful shutdown ────────────────────────────────────────────────────────
// On SIGTERM (docker stop / redeploy) or SIGINT (Ctrl+C): stop taking new work,
// let in-flight requests finish, then close sockets, MongoDB and Redis cleanly.
// Socket.io clients reconnect automatically to another replica.
const SHUTDOWN_TIMEOUT_MS = Number(process.env.SHUTDOWN_TIMEOUT_MS) || 20000;
let shuttingDown = false;

const shutdown = async (signal) => {
  if (shuttingDown) return;
  shuttingDown = true;
  app.locals.shuttingDown = true; // health check starts returning 503
  console.log(`[Shutdown] ${signal} received, draining connections...`);

  // Safety net: never hang forever on a stuck connection
  setTimeout(() => {
    console.error(`[Shutdown] Still busy after ${SHUTDOWN_TIMEOUT_MS}ms, forcing exit.`);
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS).unref();

  try {
    cron.getTasks().forEach((task) => task.stop());

    // io.close() disconnects all sockets and closes the HTTP server; the callback
    // fires once every in-flight HTTP request has finished.
    const serverClosed = new Promise((resolve) => io.close(() => resolve()));
    httpServer.closeIdleConnections?.(); // drop idle keep-alive connections now
    await serverClosed;

    await mongoose.connection.close();
    await Promise.allSettled([redis, pubClient, subClient].filter(Boolean).map((c) => c.quit()));

    console.log("[Shutdown] Clean exit.");
    process.exit(0);
  } catch (err) {
    console.error("[Shutdown] Error during shutdown:", err.message);
    process.exit(1);
  }
};

// A stray rejected promise (e.g. a fire-and-forget DB write or email) must not
// take the whole server down — Node's default is to exit on unhandled rejections.
// Log it so the underlying bug can still be found and fixed.
process.on("unhandledRejection", (reason) => {
  console.error("[Unhandled rejection]", reason instanceof Error ? reason.stack : reason);
});

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT",  () => shutdown("SIGINT"));
