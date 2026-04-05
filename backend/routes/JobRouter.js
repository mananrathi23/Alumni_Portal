import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import {
  getJobs, getJob, createJob, updateJob, deleteJob,
} from "../controllers/JobController.js";

const router = express.Router();
router.use(isAuthenticated);

router.get("/",          getJobs);
router.post("/",         createJob);
router.get("/:jobId",    getJob);
router.put("/:jobId",    updateJob);
router.delete("/:jobId", deleteJob);

export default router;
