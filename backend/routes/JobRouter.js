import express from "express";
import { isAuthenticated, isStaff, isVerifiedByAdmin } from "../middlewares/auth.js";
import {
  getJobs, getJob, createJob, updateJob, deleteJob,
} from "../controllers/JobController.js";
import { cacheMiddleware } from "../middlewares/cache.js";

const router = express.Router();
router.use(isAuthenticated);
router.use(isVerifiedByAdmin);

router.get("/",          cacheMiddleware("jobs", { ttl: 1800, bypass: (req) => req.query.mine === "true" }), getJobs);
router.post("/",         isStaff, createJob);    // Alumni + Teacher + Admin
router.get("/:jobId",    cacheMiddleware("jobs", { ttl: 1800 }), getJob);
router.put("/:jobId",    isStaff, updateJob);
router.delete("/:jobId", isStaff, deleteJob);

export default router;
