import express from "express";
import { isAuthenticated, isAdmin } from "../middlewares/auth.js";
import {
  askSupportChat,
  getUserTicket,
  getAdminTickets,
  adminReply,
  handleEscalationChoice,
} from "../controllers/SupportController.js";

const router = express.Router();

// User Routes
router.post("/ask", isAuthenticated, askSupportChat);
router.get("/my-ticket", isAuthenticated, getUserTicket);
router.post("/escalation-choice", isAuthenticated, handleEscalationChoice);

// Admin Routes
router.get("/admin/tickets", isAuthenticated, isAdmin, getAdminTickets);
router.post("/admin/tickets/:ticketId/reply", isAuthenticated, isAdmin, adminReply);

export default router;