/**
 * utils/tokenBlacklist.js
 * JWT blacklisting via Redis.
 * On logout, the token's JTI is stored in Redis until it would have expired anyway.
 * On every authenticated request, we check if the JTI is blacklisted.
 */
import { redis } from "./redisClient.js";

const PREFIX = "bl:";  // blacklist namespace

/**
 * Add a JWT JTI to the blacklist.
 * @param {string} jti  - The JWT ID (jti claim)
 * @param {number} exp  - The JWT exp claim (Unix timestamp in seconds)
 */
export const blacklistToken = async (jti, exp) => {
  try {
    const ttl = exp - Math.floor(Date.now() / 1000);
    if (ttl > 0) {
      await redis.set(`${PREFIX}${jti}`, "1", "EX", ttl);
    }
  } catch (err) {
    console.error("[Blacklist] Failed to blacklist token:", err.message);
  }
};

/**
 * Check if a JTI is blacklisted.
 * Returns true if blacklisted, false otherwise (or if Redis is down — fail open).
 * @param {string} jti
 */
export const isTokenBlacklisted = async (jti) => {
  try {
    const val = await redis.get(`${PREFIX}${jti}`);
    return val === "1";
  } catch {
    return false; // Fail open — don't block users if Redis is down
  }
};
