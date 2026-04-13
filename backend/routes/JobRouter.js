import express from "express";
import { isAuthenticated, isStaff } from "../middlewares/auth.js";
import {
  getJobs, getJob, createJob, updateJob, deleteJob,
} from "../controllers/JobController.js";

const router = express.Router();
router.use(isAuthenticated);

router.get("/",          getJobs);
router.post("/",         isStaff, createJob);    // Alumni + Teacher + Admin
router.get("/:jobId",    getJob);
router.put("/:jobId",    isStaff, updateJob);
router.delete("/:jobId", isStaff, deleteJob);

export default router;
