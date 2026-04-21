import express from "express";
import { isAuthenticated, isVerifiedByAdmin } from "../middlewares/auth.js";
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
  markChatAsRead,
  rateSession,
  getMyMentorStats,
} from "../controllers/MentorshipController.js";

const router = express.Router();
router.use(isAuthenticated);
router.use(isVerifiedByAdmin); // apply to all mentorship routes


// ── Google Calendar OAuth ──────────────────────────────────────────────────
router.get("/auth/google",    getGoogleAuthUrl);
router.get("/auth/status",    getGoogleLinkStatus);
router.get("/auth/callback",  handleGoogleCallback);

// ── Mentor settings ────────────────────────────────────────────────────────
router.get("/settings",       getMentorSettings);
router.put("/settings",       updateMentorshipAvailability);
router.put("/weekly-limit",   updateWeeklyLimit);

// ── Browse & Smart Match ───────────────────────────────────────────────────
router.get("/mentors",        getMentors);
router.get("/smart-match",    smartMatchMentors);
// alias used by student dashboard feed
router.get("/available",      getMentors);

// ── Request lifecycle ──────────────────────────────────────────────────────
router.post("/requests",                        createMentorshipRequest);
router.get("/requests",                         getMentorshipRequests);
router.put("/requests/:requestId/respond",      respondToMentorshipRequest);
router.delete("/requests/:requestId/cancel",    cancelMentorshipRequest);
router.put("/requests/:requestId/complete",     completeMentorshipSession);
router.put("/requests/:requestId/meeting-link", setMeetingLink);
router.post("/requests/:requestId/rate",        rateSession);

// ── Chat ───────────────────────────────────────────────────────────────────
router.get("/chat/unread-counts",       getUnreadCounts);
router.put("/:mentorshipId/chat/read",  markChatAsRead);
router.get("/:mentorshipId/chat",       getChatMessages);
router.post("/:mentorshipId/chat",      sendChatMessage);

// ── Stats ──────────────────────────────────────────────────────────────────
router.get("/my-stats", getMyMentorStats);

export default router;