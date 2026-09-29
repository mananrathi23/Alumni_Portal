/**
 * utils/redisClient.js
 * Shared ioredis client — used by caching, rate-limiting, blacklist, and Socket.io adapter.
 * The server degrades gracefully (no crash) if Redis is unavailable.
 */
import { config } from "dotenv";
import Redis from "ioredis";

config({ path: "./.env" });

function buildRedisUrl() {
  if (process.env.REDIS_URL) return process.env.REDIS_URL;
  const host = process.env.REDIS_HOST || "127.0.0.1";
  const port = process.env.REDIS_PORT || "6379";
  const password = process.env.REDIS_PASSWORD;
  if (!password) return `redis://${host}:${port}`;
  return `redis://:${encodeURIComponent(password)}@${host}:${port}`;
}

const REDIS_URL = buildRedisUrl();
const REDIS_ENABLED = process.env.REDIS_ENABLED !== "false";

function attachRedisHandlers(client, label = "Redis") {
  client.on("connect", () => console.log(`[${label}] Connected.`));
  client.on("ready", () => console.log(`[${label}] Ready.`));
  client.on("error", (err) => console.error(`[${label}] Error:`, err.message));
  client.on("close", () => console.warn(`[${label}] Connection closed.`));
  client.on("reconnecting", () => console.log(`[${label}] Reconnecting...`));
}

function createRedisClient(label = "Redis") {
  if (!REDIS_ENABLED) {
    console.warn(`[${label}] Disabled by configuration; continuing without Redis.`);
    return null;
  }

  const sanitizedUrl = REDIS_URL.replace(/(redis:\/\/):[^@]*@/, "$1****@");
  console.log(`[${label}] connecting using REDIS_URL=${sanitizedUrl}`);

  const client = new Redis(REDIS_URL, {
    lazyConnect: true,
    enableReadyCheck: true,
    enableOfflineQueue: true,
    maxRetriesPerRequest: 1,
    retryStrategy: (times) => {
      if (times > 2) {
        console.error(`[${label}] Max retries reached — running without Redis.`);
        return null;
      }
      return Math.min(times * 200, 1000);
    },
  });

  attachRedisHandlers(client, label);
  return client;
}

export const redis = createRedisClient();

export function createRedisDuplicate(label = "Redis") {
  if (!redis) return null;
  const client = redis.duplicate();
  attachRedisHandlers(client, label);
  return client;
}

/**
 * Safe wrapper — returns null instead of throwing if Redis is down.
 */
export const safeRedisGet = async (key) => {
  if (!redis) return null;
  try { return await redis.get(key); }
  catch { return null; }
};

export const safeRedisSet = async (key, value, ttl) => {
  if (!redis) return null;
  try {
    if (ttl) return await redis.set(key, value, "EX", ttl);
    return await redis.set(key, value);
  } catch { return null; }
};

