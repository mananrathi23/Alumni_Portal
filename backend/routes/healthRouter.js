/**
 * routes/healthRouter.js
 * Exposes GET /api/v1/health — returns live status of all system services.
 * Used by Uptime Kuma, Docker HEALTHCHECK, and Nginx health probes.
 */
import express from "express";
import mongoose from "mongoose";
import { redis } from "../utils/redisClient.js";
import os from "os";

const router = express.Router();

router.get("/", async (req, res) => {
  const start = Date.now();

  // ── MongoDB status ────────────────────────────────────────────────────────
  const mongoState = mongoose.connection.readyState;
  const mongoStatusMap = { 0: "disconnected", 1: "connected", 2: "connecting", 3: "disconnecting" };
  const mongoOk = mongoState === 1;

  // ── Redis status ──────────────────────────────────────────────────────────
  let redisOk = false;
  let redisLatencyMs = null;
  try {
    const t0 = Date.now();
    await redis.ping();
    redisLatencyMs = Date.now() - t0;
    redisOk = true;
  } catch {
    redisOk = false;
  }

  // ── System info ───────────────────────────────────────────────────────────
  const uptimeSeconds = process.uptime();
  const memUsage = process.memoryUsage();
  const loadAvg = os.loadavg();

  const healthy = mongoOk && redisOk;
  const responseTimeMs = Date.now() - start;
  // 503 while draining during shutdown, so load balancers stop sending traffic here
  const shuttingDown = req.app.locals.shuttingDown === true;
  const statusCode = mongoOk && !shuttingDown ? 200 : 503;

  res.status(statusCode).json({
    status: healthy ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    responseTimeMs,
    services: {
      mongodb: {
        status: mongoStatusMap[mongoState] || "unknown",
        ok: mongoOk,
      },
      redis: {
        status: redisOk ? "connected" : "disconnected",
        ok: redisOk,
        latencyMs: redisLatencyMs,
      },
    },
    system: {
      uptimeSeconds: Math.floor(uptimeSeconds),
      memoryMB: {
        rss:        Math.round(memUsage.rss / 1024 / 1024),
        heapUsed:   Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotal:  Math.round(memUsage.heapTotal / 1024 / 1024),
      },
      loadAvg1min: loadAvg[0].toFixed(2),
      nodeVersion: process.version,
      pid: process.pid,
    },
  });
});

export default router;
