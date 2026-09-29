/**
 * utils/cronLock.js
 * Makes a cron job run on only ONE instance when the API is scaled out
 * (multiple Docker replicas, PM2 cluster, etc.). Each tick, instances race for a
 * Redis lock (SET NX EX); only the winner runs the job.
 *
 * Without Redis (single instance), or if Redis errors, the job just runs —
 * same fail-open policy as the rest of the Redis usage.
 */
import { randomUUID } from "crypto";
import { redis } from "./redisClient.js";

const instanceId = randomUUID();

/**
 * Wrap a cron handler so only one instance runs it per tick.
 *
 * @param {string}   name       - Unique job name (used in the lock key)
 * @param {number}   ttlSeconds - How long the lock is held; keep it a bit shorter
 *                                than the schedule interval
 * @param {function} fn         - The async job
 */
export const runExclusive = (name, ttlSeconds, fn) => async () => {
  if (redis) {
    try {
      const acquired = await redis.set(`cronlock:${name}`, instanceId, "EX", ttlSeconds, "NX");
      if (acquired !== "OK") return; // another instance is running this tick
    } catch (err) {
      console.warn(`[CronLock] Redis unavailable for "${name}", running anyway:`, err.message);
    }
  }
  return fn();
};
