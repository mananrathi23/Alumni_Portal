import express from "express";
import { isAdmin, isAuthenticated } from "../middlewares/auth.js";
import {
  getAllUsers,
  getAllStudents,
  toggleVerifyUser,
  toggleBlockUser,
  unblockConnection,
  unblockMentorship,
  backfillMentorStats,
} from "../controllers/AdminUserController.js";

const router = express.Router();

// Apply auth middlewares
router.use(isAuthenticated, isAdmin);

router.get("/", getAllUsers);
router.get("/students", getAllStudents);   // Placement Cell: all admin-verified students
router.put("/:role/:id/verify", toggleVerifyUser);
router.put("/:role/:id/block", toggleBlockUser);

router.put("/connection/:id/unblock", unblockConnection);
router.put("/mentorship/:id/unblock", unblockMentorship);

// ONE-TIME: recalculate mentorStats from existing session data
router.post("/backfill-mentor-stats", backfillMentorStats);

export default router;