import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import {
  getMentors,
  createMentorshipRequest,
  getMentorshipRequests,
  respondToMentorshipRequest,
  cancelMentorshipRequest,
  updateMentorshipAvailability 
} from "../controllers/MentorshipController.js";

const router = express.Router();
router.use(isAuthenticated);

router.get("/mentors", getMentors);
router.put("/settings", updateMentorshipAvailability);
router.post("/requests", createMentorshipRequest);
router.get("/requests", getMentorshipRequests);
router.put("/requests/:requestId/respond", respondToMentorshipRequest);
router.delete("/requests/:requestId/cancel", cancelMentorshipRequest);

export default router;
