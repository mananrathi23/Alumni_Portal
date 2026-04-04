import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import {
  getMentors,
  getMentorSettings,
  updateMentorshipAvailability,
  createMentorshipRequest,
  getMentorshipRequests,
  respondToMentorshipRequest,
  cancelMentorshipRequest,
  completeMentorshipSession,
  setMeetingLink,
  getChatMessages,
  sendChatMessage,
  getUnreadCounts,
  rateSession,
  getMyMentorStats,
  updateWeeklyLimit,
} from "../controllers/MentorshipController.js";

const router = express.Router();
router.use(isAuthenticated);

// ── Mentor settings ──────────────────────────────────────────────────────────
router.get("/settings",            getMentorSettings);
router.put("/settings",            updateMentorshipAvailability);
router.put("/weekly-limit",        updateWeeklyLimit);

// ── Mentor stats + ranking ────────────────────────────────────────────────────
router.get("/my-stats",            getMyMentorStats);

// ── Browse mentors (student) ─────────────────────────────────────────────────
router.get("/mentors",             getMentors);

// ── Request lifecycle ────────────────────────────────────────────────────────
router.post("/requests",                         createMentorshipRequest);
router.get("/requests",                          getMentorshipRequests);
router.put("/requests/:requestId/respond",       respondToMentorshipRequest);
router.delete("/requests/:requestId/cancel",     cancelMentorshipRequest);
router.put("/requests/:requestId/complete",      completeMentorshipSession);
router.put("/requests/:requestId/meeting-link",  setMeetingLink);
router.post("/requests/:requestId/rate",         rateSession);

// ── Chat ──────────────────────────────────────────────────────────────────────
router.get("/chat/unread-counts",   getUnreadCounts);
router.get("/chat/:mentorshipId",   getChatMessages);
router.post("/chat/:mentorshipId",  sendChatMessage);

export default router;
