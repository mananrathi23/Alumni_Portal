import express from "express";
import { isAuthenticated, isAdmin } from "../middlewares/auth.js";
import { getNews, createNews, updateNews, deleteNews } from "../controllers/NewsController.js";

const router = express.Router();

// PUBLIC — no auth required (for ticker on homepage)
router.get("/", getNews);

// Admin-only routes
router.post("/", isAuthenticated, isAdmin, createNews);
router.put("/:id", isAuthenticated, isAdmin, updateNews);
router.delete("/:id", isAuthenticated, isAdmin, deleteNews);

export default router;
