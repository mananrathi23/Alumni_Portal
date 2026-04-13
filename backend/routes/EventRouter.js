import express from "express";
import { isAuthenticated, isAdmin, isStaff } from "../middlewares/auth.js";
import {
  getEvents, getEvent, createEvent, updateEvent, deleteEvent, registerForEvent,
} from "../controllers/EventController.js";

const router = express.Router();
router.use(isAuthenticated);

router.get("/",                   getEvents);
router.post("/",                  isStaff, createEvent);       // Alumni + Teacher + Admin
router.get("/:eventId",           getEvent);
router.put("/:eventId",           isStaff, updateEvent);       // organizer check happens inside controller
router.delete("/:eventId",        isStaff, deleteEvent);
router.post("/:eventId/register", registerForEvent);

export default router;
