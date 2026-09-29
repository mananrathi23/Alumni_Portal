/**
 * utils/rateLimiter.js
 * Shared rate-limiter factory.
 *
 * - Uses Redis as the store whenever Redis is configured, so limits are shared
 *   across all backend instances. If Redis errors, requests are let through
 *   (passOnStoreError) instead of failing — same fail-open policy as the cache.
 * - Keys logged-in users by their user id instead of IP. On a campus network
 *   hundreds of students share one public IP, so per-IP limits would lock
 *   everyone out at once.
 */
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import jwt from "jsonwebtoken";
import { redis } from "./redisClient.js";

const passThrough = (req, res, next) => next();

const ipKey = (req) => `ip:${ipKeyGenerator(req.ip)}`;

// Verified user id from the auth cookie / Bearer token, or null
const getUserIdFromToken = (req) => {
  let token = req.cookies?.token;
  const authHeader = req.headers.authorization;
  if (!token && authHeader?.startsWith("Bearer ")) token = authHeader.split(" ")[1];
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET_KEY)?.id || null;
  } catch {
    return null;
  }
};

// Logged-in users are limited per user id, anonymous requests per IP
export const userOrIpKey = (req) => {
  const userId = getUserIdFromToken(req);
  return userId ? `user:${userId}` : ipKey(req);
};

// Login / register / OTP: per IP + email, so brute-forcing one account is
// blocked without locking out everyone else behind the same campus IP
export const ipAndEmailKey = (req) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  return `${ipKey(req)}:${email}`;
};

/**
 * @param {object}   opts
 * @param {string}   opts.name         - Redis key namespace (must be unique per limiter)
 * @param {number}   opts.windowMs
 * @param {number}   opts.max          - Max hits per window
 * @param {string}   opts.message
 * @param {function} [opts.keyGenerator] - Defaults to per-IP
 */
export const createLimiter = ({ name, windowMs, max, message, keyGenerator = ipKey }) => {
  if (process.env.NODE_ENV === "test") return passThrough;

  return rateLimit({
    windowMs,
    limit: max,
    keyGenerator,
    standardHeaders: true,
    legacyHeaders: false,
    passOnStoreError: true,
    message: { success: false, message },
    store: redis
      ? new RedisStore({ prefix: `rl:${name}:`, sendCommand: (...args) => redis.call(...args) })
      : undefined,
  });
};
