import express from "express";
import { isAuthenticated, isAdmin, isStaff, isVerifiedByAdmin } from "../middlewares/auth.js";
import {
  getEvents, getEvent, createEvent, updateEvent, deleteEvent, registerForEvent,
} from "../controllers/EventController.js";
import { cacheMiddleware } from "../middlewares/cache.js";

const router = express.Router();
router.use(isAuthenticated);
router.use(isVerifiedByAdmin);

router.get("/",                   cacheMiddleware("events", { ttl: 1800, partitionByUser: true, bypass: (req) => req.query.view === "mine" }), getEvents);
router.post("/",                  isStaff, createEvent);       // Alumni + Teacher + Admin
router.get("/:eventId",           cacheMiddleware("events", { ttl: 1800, partitionByUser: true }), getEvent);
router.put("/:eventId",           isStaff, updateEvent);       // organizer check happens inside controller
router.delete("/:eventId",        isStaff, deleteEvent);
router.post("/:eventId/register", registerForEvent);

export default router;
