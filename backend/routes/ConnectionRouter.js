import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import {
  sendConnectionRequest,
  respondToRequest,
  withdrawRequest,
  removeConnection,
  getMyConnections,
  getPendingRequests,
  getConnectionStatus,
} from "../controllers/ConnectionController.js";
import {
  getConnectionChat,
  sendConnectionMessage,
  getConnectionUnreadCounts,
} from "../controllers/ConnectionChatController.js";

const router = express.Router();
router.use(isAuthenticated);

// ── Existing connection routes ─────────────────────────────────────────────
router.post("/send",                    sendConnectionRequest);
router.get("/",                         getMyConnections);
router.get("/pending",                  getPendingRequests);
router.get("/status/:userId",           getConnectionStatus);
router.put("/:requestId/respond",       respondToRequest);
router.delete("/:requestId/withdraw",   withdrawRequest);
router.delete("/:requestId/remove",     removeConnection);

// ── Chat routes ────────────────────────────────────────────────────────────
router.get("/chat/unread-counts",       getConnectionUnreadCounts);
router.get("/:connectionId/chat",       getConnectionChat);
router.post("/:connectionId/chat",      sendConnectionMessage);

export default router;