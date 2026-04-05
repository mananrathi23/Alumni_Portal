import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import ErrorHandler        from "../middlewares/error.js";
import { Event }           from "../models/EventModel.js";

const POSTER_ROLES = ["Admin", "Alumni", "Teacher"];

// ── GET /api/v1/events ────────────────────────────────────────────────────────
// Query: type, upcoming (bool), past (bool), mine (bool), page, limit
export const getEvents = catchAsyncError(async (req, res) => {
  const { type, view = "upcoming", page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const now    = new Date();
  const filter = { isActive: true };

  if (view === "upcoming") filter.date = { $gte: now };
  if (view === "past")     filter.date = { $lt:  now };
  if (view === "mine")     filter["organizer.id"] = req.user._id;
  if (type && type !== "all") filter.type = type;

  const sortObj = view === "past" ? { date: -1 } : { date: 1 }; // upcoming asc, past desc

  const [events, total] = await Promise.all([
    Event.find(filter).sort(sortObj).skip(skip).limit(Number(limit)).lean(),
    Event.countDocuments(filter),
  ]);

  res.status(200).json({ success: true, events, total });
});

// ── GET /api/v1/events/:eventId ───────────────────────────────────────────────
export const getEvent = catchAsyncError(async (req, res, next) => {
  const event = await Event.findById(req.params.eventId).lean();
  if (!event || !event.isActive) return next(new ErrorHandler("Event not found.", 404));

  const isRegistered = event.registeredStudents
    ?.map(String)
    .includes(req.user._id.toString());

  res.status(200).json({ success: true, event, isRegistered: isRegistered || false });
});

// ── POST /api/v1/events ───────────────────────────────────────────────────────
// Only Admin, Alumni, Teacher
export const createEvent = catchAsyncError(async (req, res, next) => {
  const role = req.user.constructor.modelName;
  if (!POSTER_ROLES.includes(role)) {
    return next(new ErrorHandler("Only Admin, Alumni, and Teachers can create events.", 403));
  }

  const { title, description, date, time, location, link, type } = req.body;

  if (!title?.trim())       return next(new ErrorHandler("Title is required.", 400));
  if (!description?.trim()) return next(new ErrorHandler("Description is required.", 400));
  if (!date)                return next(new ErrorHandler("Date is required.", 400));
  if (!time?.trim())        return next(new ErrorHandler("Time is required.", 400));
  if (!location?.trim() && !link?.trim()) {
    return next(new ErrorHandler("Provide either a physical location or an online link.", 400));
  }

  const event = await Event.create({
    title:       title.trim(),
    description: description.trim(),
    date:        new Date(date),
    time:        time.trim(),
    location:    location?.trim() || "",
    link:        link?.trim()     || "",
    type:        type || "other",
    organizer: {
      id:   req.user._id,
      name: req.user.name,
      role,
    },
  });

  res.status(201).json({ success: true, event });
});

// ── PUT /api/v1/events/:eventId ───────────────────────────────────────────────
// Organizer or Admin can edit
export const updateEvent = catchAsyncError(async (req, res, next) => {
  const event = await Event.findById(req.params.eventId);
  if (!event || !event.isActive) return next(new ErrorHandler("Event not found.", 404));

  const role      = req.user.constructor.modelName;
  const isOrganizer = event.organizer.id.equals(req.user._id);
  if (!isOrganizer && role !== "Admin") {
    return next(new ErrorHandler("Not authorized to edit this event.", 403));
  }

  const allowed = ["title","description","date","time","location","link","type"];
  allowed.forEach(f => {
    if (req.body[f] !== undefined) event[f] = req.body[f];
  });

  await event.save();
  res.status(200).json({ success: true, event });
});

// ── DELETE /api/v1/events/:eventId ───────────────────────────────────────────
export const deleteEvent = catchAsyncError(async (req, res, next) => {
  const event = await Event.findById(req.params.eventId);
  if (!event) return next(new ErrorHandler("Event not found.", 404));

  const role        = req.user.constructor.modelName;
  const isOrganizer = event.organizer.id.equals(req.user._id);
  if (!isOrganizer && role !== "Admin") {
    return next(new ErrorHandler("Not authorized.", 403));
  }

  event.isActive = false;
  await event.save();
  res.status(200).json({ success: true, message: "Event removed." });
});

// ── POST /api/v1/events/:eventId/register ────────────────────────────────────
// Students can RSVP to an event
export const registerForEvent = catchAsyncError(async (req, res, next) => {
  const event = await Event.findById(req.params.eventId);
  if (!event || !event.isActive) return next(new ErrorHandler("Event not found.", 404));
  if (new Date(event.date) < new Date()) {
    return next(new ErrorHandler("Cannot register for a past event.", 400));
  }

  const userId    = req.user._id.toString();
  const alreadyIn = event.registeredStudents.map(String).includes(userId);

  if (alreadyIn) {
    // Toggle off — unregister
    event.registeredStudents = event.registeredStudents.filter(id => id.toString() !== userId);
    await event.save();
    return res.status(200).json({ success: true, registered: false, message: "Unregistered." });
  }

  event.registeredStudents.push(req.user._id);
  await event.save();
  res.status(200).json({
    success: true,
    registered: true,
    message:    "Successfully registered!",
  });
});
