import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import { getPeople } from "../controllers/PeopleController.js";
import { cacheMiddleware } from "../middlewares/cache.js";

const router = express.Router();

router.use(isAuthenticated);

// GET /api/v1/people
// Query params:
//   search     → search by name or department
//   filterRole → "All" | "Student" | "Alumni" | "Teacher"
//   department → filter by department
// Cached per viewer because the list leaves out the viewer themself
router.get("/", cacheMiddleware("directory", { ttl: 120, partitionByUser: true }), getPeople);

export default router;