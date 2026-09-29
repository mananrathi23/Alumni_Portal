import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import ErrorHandler        from "../middlewares/error.js";
import { Event }           from "../models/EventModel.js";
import { Student }         from "../models/StudentModel.js";
import { Alumni }          from "../models/AlumniModel.js";
import { Teacher }         from "../models/TeacherModel.js";
import { invalidateCache } from "../middlewares/cache.js";
import { emitFeedUpdated } from "../Socket.js";
import { findInvalidUrlField } from "../utils/validateUrl.js";
import { pageParams } from "../utils/pagination.js";

const POSTER_ROLES = ["Admin", "Alumni", "Teacher"];

// Registrants' names and emails are visible only to the organizer and admins;
// everyone else gets a count and whether they themselves are registered.
const canSeeRegistrants = (event, user) =>
  user.constructor.modelName === "Admin" || event.organizer?.id?.toString() === user._id.toString();

// Mutates each event: isRegistered, registeredCount, and registeredStudents
// (populated for organizer/admin, empty for everyone else)
const shapeRegistrations = async (events, user) => {
  const me = user._id.toString();
  const visibleIds = new Set();
  for (const e of events) {
    const ids = (e.registeredStudents || []).map(String);
    e.isRegistered = ids.includes(me);
    e.registeredCount = ids.length;
    if (canSeeRegistrants(e, user)) ids.forEach((id) => visibleIds.add(id));
  }

  const userMap = {};
  if (visibleIds.size > 0) {
    const ids = [...visibleIds];
    const [students, alumni, teachers] = await Promise.all([
      Student.find({ _id: { $in: ids } }, "name email department enrollmentYear").lean(),
      Alumni.find({ _id: { $in: ids } }, "name email department enrollmentYear").lean(),
      Teacher.find({ _id: { $in: ids } }, "name email department").lean(),
    ]);
    [...students, ...alumni, ...teachers].forEach((u) => { userMap[u._id.toString()] = u; });
  }

  for (const e of events) {
    e.registeredStudents = canSeeRegistrants(e, user)
      ? (e.registeredStudents || []).map((id) => {
        const strId = id.toString();
        return userMap[strId] ? { ...userMap[strId], _id: strId } : { _id: strId, name: "Unknown" };
      })
      : [];
  }
};

// Non-admins see events for "All", for their role, or that they organise
const visibleTo = (event, user) => {
  const role = user.constructor.modelName;
  if (role === "Admin" || event.organizer?.id?.toString() === user._id.toString()) return true;
  return !event.audience || event.audience === "All" || event.audience === role;
};

// ── GET /api/v1/events ────────────────────────────────────────────────────────
// Query: type, view (upcoming|past|mine), page, limit
export const getEvents = catchAsyncError(async (req, res) => {
  const { type, view = "upcoming" } = req.query;
  const { limit, skip } = pageParams(req.query, { defaultLimit: 20, maxLimit: 50 });

  const now    = new Date();
  const filter = { isActive: true };

  if (view === "upcoming") filter.date = { $gte: now };
  if (view === "past")     filter.date = { $lt:  now };
  if (view === "mine")     filter["organizer.id"] = req.user._id;
  if (type && type !== "all") filter.type = String(type);

  const role = req.user.constructor.modelName;
  if (role !== "Admin") {
    // Audience filter: audience is "All", or audience matches user role, or the user is the organizer
    filter.$or = [
      { audience: { $in: ["All", role] } },
      { "organizer.id": req.user._id }
    ];
  }

  const sortObj = view === "past" ? { date: -1 } : { date: 1 }; // upcoming asc, past desc

  const [events, total] = await Promise.all([
    Event.find(filter).sort(sortObj).skip(skip).limit(limit).lean(),
    Event.countDocuments(filter),
  ]);

  await shapeRegistrations(events, req.user);
  res.status(200).json({ success: true, events, total });
});

// ── GET /api/v1/events/:eventId ───────────────────────────────────────────────
export const getEvent = catchAsyncError(async (req, res, next) => {
  const event = await Event.findById(req.params.eventId).lean();
  if (!event || !event.isActive || !visibleTo(event, req.user)) {
    return next(new ErrorHandler("Event not found.", 404));
  }

  await shapeRegistrations([event], req.user);
  res.status(200).json({ success: true, event, isRegistered: event.isRegistered });
});

// ── POST /api/v1/events ───────────────────────────────────────────────────────
// Only Admin, Alumni, Teacher
export const createEvent = catchAsyncError(async (req, res, next) => {
  const role = req.user.constructor.modelName;
  if (!POSTER_ROLES.includes(role)) {
    return next(new ErrorHandler("Only Admin, Alumni, and Teachers can create events.", 403));
  }

  const { title, description, date, time, location, link, type, audience, registrationDeadline } = req.body;

  if (!title?.trim())       return next(new ErrorHandler("Title is required.", 400));
  if (!description?.trim()) return next(new ErrorHandler("Description is required.", 400));
  if (!date)                return next(new ErrorHandler("Date is required.", 400));
  if (!time?.trim())        return next(new ErrorHandler("Time is required.", 400));
  if (!location?.trim() && !link?.trim()) {
    return next(new ErrorHandler("Provide either a physical location or an online link.", 400));
  }
  const badLink = findInvalidUrlField(req.body, ["link"]);
  if (badLink) return next(new ErrorHandler(`${badLink} must be a full http(s) link, e.g. https://…`, 400));

  // ── Date validations ──────────────────────────────────────────────────────
  const eventDate = new Date(date);
  const now       = new Date();
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

  if (eventDate <= now) {
    return next(new ErrorHandler("Event date must be in the future.", 400));
  }
  if (eventDate > oneYearFromNow) {
    return next(new ErrorHandler("Event cannot be scheduled more than 1 year in advance.", 400));
  }

  // Registration deadline must be before event date and in the future
  let regDeadline = null;
  if (registrationDeadline) {
    regDeadline = new Date(registrationDeadline);
    if (regDeadline <= now) {
      return next(new ErrorHandler("Registration deadline must be in the future.", 400));
    }
    if (regDeadline >= eventDate) {
      return next(new ErrorHandler("Registration deadline must be before the event date.", 400));
    }
  }

  const event = await Event.create({
    title:       title.trim(),
    description: description.trim(),
    date:        eventDate,
    time:        time.trim(),
    location:    location?.trim() || "",
    link:        link?.trim()     || "",
    type:        type || "other",
    audience:    audience || "All",
    registrationDeadline: regDeadline,
    organizer: {
      id:   req.user._id,
      name: req.user.name,
      role,
    },
  });

  // Invalidate cache
  await invalidateCache("events");

  emitFeedUpdated("events");
  res.status(201).json({ success: true, event });

  // Increment community score counter (fire-and-forget)
  if (role === "Alumni") {
    Alumni.findByIdAndUpdate(req.user._id, { $inc: { "mentorStats.eventsOrganized": 1 } }).catch(() => {});
  } else if (role === "Teacher") {
    Teacher.findByIdAndUpdate(req.user._id, { $inc: { "mentorStats.eventsOrganized": 1 } }).catch(() => {});
  }
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

  const badLink = findInvalidUrlField(req.body, ["link"]);
  if (badLink) return next(new ErrorHandler(`${badLink} must be a full http(s) link, e.g. https://…`, 400));
  if (req.body.date !== undefined) {
    const newDate = new Date(req.body.date);
    if (Number.isNaN(newDate.getTime())) return next(new ErrorHandler("Invalid event date.", 400));
    if (newDate <= new Date()) return next(new ErrorHandler("Event date must be in the future.", 400));
  }

  const allowed = ["title","description","date","time","location","link","type","audience"];
  allowed.forEach(f => {
    if (req.body[f] !== undefined) event[f] = req.body[f];
  });

  await event.save();

  // Invalidate cache
  await invalidateCache("events");

  emitFeedUpdated("events");
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

  // Invalidate cache
  await invalidateCache("events");

  emitFeedUpdated("events");
  res.status(200).json({ success: true, message: "Event removed." });
});

// ── POST /api/v1/events/:eventId/register ────────────────────────────────────
// Students can RSVP to an event
export const registerForEvent = catchAsyncError(async (req, res, next) => {
  const event = await Event.findById(req.params.eventId);
  if (!event || !event.isActive || !visibleTo(event, req.user)) {
    return next(new ErrorHandler("Event not found.", 404));
  }

  const role = req.user.constructor.modelName;

  // Admin cannot register for events
  if (role === "Admin") {
    return next(new ErrorHandler("Admins cannot register for events.", 403));
  }

  // The person who posted the event cannot register for their own event
  if (event.organizer?.id?.toString() === req.user._id.toString()) {
    return next(new ErrorHandler("You cannot register for an event you created.", 403));
  }

  const now = new Date();

  if (new Date(event.date) < now) {
    return next(new ErrorHandler("Cannot register for a past event.", 400));
  }

  // Block if registration deadline has passed
  if (event.registrationDeadline && new Date(event.registrationDeadline) < now) {
    return next(new ErrorHandler("Registration deadline for this event has passed.", 400));
  }

  // Atomic toggle: a double-click can't register the same person twice
  const unregistered = await Event.updateOne(
    { _id: event._id, registeredStudents: req.user._id },
    { $pull: { registeredStudents: req.user._id } }
  );
  if (unregistered.modifiedCount > 0) {
    await invalidateCache("events");
    return res.status(200).json({ success: true, registered: false, message: "Unregistered." });
  }

  await Event.updateOne({ _id: event._id }, { $addToSet: { registeredStudents: req.user._id } });
  await invalidateCache("events");
  res.status(200).json({
    success: true,
    registered: true,
    message:    "Successfully registered!",
  });
});
