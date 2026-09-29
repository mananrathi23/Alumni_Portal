import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
} from "../controllers/AnnouncementController.js";

const router = express.Router();

// Public read (still must be authenticated to see the app)
router.get("/",      isAuthenticated, getAnnouncements);
router.post("/",     isAuthenticated, createAnnouncement);
router.delete("/:id",isAuthenticated, deleteAnnouncement);

export default router;
