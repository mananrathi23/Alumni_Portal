import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import {
  getEvents, getEvent, createEvent, updateEvent, deleteEvent, registerForEvent,
} from "../controllers/EventController.js";

const router = express.Router();
router.use(isAuthenticated);

router.get("/",                        getEvents);
router.post("/",                       createEvent);
router.get("/:eventId",                getEvent);
router.put("/:eventId",                updateEvent);
router.delete("/:eventId",             deleteEvent);
router.post("/:eventId/register",      registerForEvent);

export default router;
