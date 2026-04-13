import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import {
  getGoogleAuthUrl,
  handleGoogleCallback,
  getGoogleLinkStatus,
  getMentorSettings,
  updateMentorshipAvailability,
  updateWeeklyLimit,
  getMentors,
  smartMatchMentors,
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
} from "../controllers/MentorshipController.js";

const router = express.Router();

// ── Google Calendar OAuth ──────────────────────────────────────────────────
router.get("/auth/google",    isAuthenticated, getGoogleAuthUrl);
router.get("/auth/status",    isAuthenticated, getGoogleLinkStatus);
router.get("/auth/callback",  handleGoogleCallback);

// ── Mentor settings ────────────────────────────────────────────────────────
router.get("/settings",       isAuthenticated, getMentorSettings);
router.put("/settings",       isAuthenticated, updateMentorshipAvailability);
router.put("/weekly-limit",   isAuthenticated, updateWeeklyLimit);

// ── Browse & Smart Match ───────────────────────────────────────────────────
router.get("/mentors",        isAuthenticated, getMentors);
router.get("/smart-match",    isAuthenticated, smartMatchMentors);
// alias used by student dashboard feed
router.get("/available",      isAuthenticated, getMentors);

// ── Request lifecycle ──────────────────────────────────────────────────────
router.post("/requests",                        isAuthenticated, createMentorshipRequest);
router.get("/requests",                         isAuthenticated, getMentorshipRequests);
router.put("/requests/:requestId/respond",      isAuthenticated, respondToMentorshipRequest);
router.delete("/requests/:requestId/cancel",    isAuthenticated, cancelMentorshipRequest);
router.put("/requests/:requestId/complete",     isAuthenticated, completeMentorshipSession);
router.put("/requests/:requestId/meeting-link", isAuthenticated, setMeetingLink);
router.post("/requests/:requestId/rate",        isAuthenticated, rateSession);

// ── Chat ───────────────────────────────────────────────────────────────────
router.get("/chat/unread-counts",       isAuthenticated, getUnreadCounts);
router.get("/chat/:mentorshipId",       isAuthenticated, getChatMessages);
router.post("/chat/:mentorshipId",      isAuthenticated, sendChatMessage);

// ── Stats ──────────────────────────────────────────────────────────────────
router.get("/my-stats", isAuthenticated, getMyMentorStats);

export default router;