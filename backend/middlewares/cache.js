/**
 * middlewares/cache.js
 * Redis caching middleware with support for version-based cache invalidation,
 * user-specific partitioning (for RSVPs/audience roles), and safe fail-open degradation.
 */
import { safeRedisGet, safeRedisSet, redis } from "../utils/redisClient.js";

/**
 * Middleware to cache successful GET requests in Redis.
 * 
 * @param {string} prefix - Namespace prefix for the cache keys (e.g., 'jobs', 'events')
 * @param {object} options - Caching options
 * @param {number} options.ttl - Cache expiration time in seconds (default: 3600)
 * @param {boolean} options.partitionByUser - Partition cache by user ID (useful when data visibility is user-specific)
 * @param {function} options.bypass - Callback function (req) => boolean. If true, bypasses the cache.
 */
export const cacheMiddleware = (prefix, options = {}) => {
  return async (req, res, next) => {
    // If Redis is not connected, fail open gracefully
    if (!redis || redis.status !== "ready") {
      return next();
    }

    try {
      // Check if request should bypass the cache
      if (options.bypass && options.bypass(req)) {
        return next();
      }

      // Fetch cache version for this prefix (for O(1) invalidation)
      const versionKey = `cache:${prefix}:version`;
      const version = (await safeRedisGet(versionKey)) || "0";

      // Build unique cache key
      let key = `cache:${prefix}:${version}`;
      if (options.partitionByUser && req.user) {
        const role = req.user.constructor.modelName;
        // Admins can share cache as they see everything; others are partitioned by user ID
        const partitionId = role === "Admin" ? "admin" : req.user._id.toString();
        key += `:${partitionId}`;
      }
      key += `:${req.originalUrl}`;

      // Try fetching cached response
      const cachedData = await safeRedisGet(key);
      if (cachedData) {
        res.setHeader("X-Cache", "HIT");
        return res.status(200).json(JSON.parse(cachedData));
      }

      // Cache miss: override res.json to capture response
      res.setHeader("X-Cache", "MISS");
      const originalJson = res.json;
      res.json = function (body) {
        if (res.statusCode >= 200 && res.statusCode < 300 && body && body.success !== false) {
          const ttl = options.ttl || 3600;
          safeRedisSet(key, JSON.stringify(body), ttl).catch((err) => {
            console.error(`[Redis Cache Set Error] Prefix ${prefix}:`, err.message);
          });
        }
        return originalJson.call(this, body);
      };

      next();
    } catch (err) {
      console.error(`[Redis Cache Middleware Error] Prefix ${prefix}:`, err.message);
      next();
    }
  };
};

/**
 * Invalidate the cache for a given prefix by incrementing its version key.
 * 
 * @param {string} prefix - Namespace prefix (e.g., 'jobs', 'events')
 */
export const invalidateCache = async (prefix) => {
  if (!redis || redis.status !== "ready") return;
  try {
    const versionKey = `cache:${prefix}:version`;
    await redis.incr(versionKey);
    console.log(`[Redis Cache] Invalidated cache for prefix: ${prefix} (incremented version).`);
  } catch (err) {
    console.error(`[Redis Cache Invalidation Error] Prefix ${prefix}:`, err.message);
  }
};
