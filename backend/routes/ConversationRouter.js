import express from "express";
import { isAuthenticated, isVerifiedByAdmin } from "../middlewares/auth.js";
import {
  listConversations, getUnreadSummary, getMessages, sendMessage, markConversationRead,
} from "../controllers/ConversationController.js";

// One chat per pair of users (connection + mentorship messages merged).
// :userId is the other person.
const router = express.Router();
router.use(isAuthenticated);
router.use(isVerifiedByAdmin);

router.get("/",                  listConversations);
router.get("/unread",            getUnreadSummary);
router.get("/:userId/messages",  getMessages);
router.post("/:userId/messages", sendMessage);
router.put("/:userId/read",      markConversationRead);

export default router;
