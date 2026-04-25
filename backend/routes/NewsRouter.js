import express from "express";
import { isAuthenticated, isAdmin, requireAdminPermission } from "../middlewares/auth.js";
import { getNews, createNews, updateNews, deleteNews } from "../controllers/NewsController.js";

const router = express.Router();

// PUBLIC — no auth required (for ticker on homepage)
router.get("/", getNews);

// Admin-only routes
router.post("/", isAuthenticated, isAdmin, requireAdminPermission("manageNews"), createNews);
router.put("/:id", isAuthenticated, isAdmin, requireAdminPermission("manageNews"), updateNews);
router.delete("/:id", isAuthenticated, isAdmin, requireAdminPermission("manageNews"), deleteNews);

export default router;
