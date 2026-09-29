import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import { getBatchmates, getBatchMembers } from "../controllers/BatchmatesController.js";
import { cacheMiddleware } from "../middlewares/cache.js";

const router = express.Router();

router.use(isAuthenticated);
// Same result for every viewer, so the cache is shared (invalidated on profile changes)
router.get("/",      cacheMiddleware("directory", { ttl: 300 }), getBatchmates);
router.get("/:year", cacheMiddleware("directory", { ttl: 300 }), getBatchMembers);

export default router;
