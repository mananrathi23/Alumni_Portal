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
  rateSession,
  getMyMentorStats,
} from "../controllers/MentorshipController.js";
import { cacheMiddleware } from "../middlewares/cache.js";

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
// Cached per viewer (the list leaves out the viewer); invalidated on slot/settings changes
const mentorsCache = cacheMiddleware("mentors", { ttl: 120, partitionByUser: true });
router.get("/mentors",        mentorsCache, getMentors);
router.get("/smart-match",    smartMatchMentors);
// alias used by student dashboard feed
router.get("/available",      mentorsCache, getMentors);

// ── Request lifecycle ──────────────────────────────────────────────────────
router.post("/requests",                        createMentorshipRequest);
router.get("/requests",                         getMentorshipRequests);
router.put("/requests/:requestId/respond",      respondToMentorshipRequest);
router.delete("/requests/:requestId/cancel",    cancelMentorshipRequest);
router.put("/requests/:requestId/complete",     completeMentorshipSession);
router.put("/requests/:requestId/meeting-link", setMeetingLink);
router.post("/requests/:requestId/rate",        rateSession);


// ── Stats ──────────────────────────────────────────────────────────────────
router.get("/my-stats", getMyMentorStats);

export default router;