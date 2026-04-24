import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import ErrorHandler        from "../middlewares/error.js";
import { Event }           from "../models/EventModel.js";
import { Student }         from "../models/StudentModel.js";
import { Alumni }          from "../models/AlumniModel.js";
import { Teacher }         from "../models/TeacherModel.js";

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
    Event.find(filter).sort(sortObj).skip(skip).limit(Number(limit)).lean(),
    Event.countDocuments(filter),
  ]);

  // Manually populate registeredStudents from all roles
  const allIds = [];
  events.forEach(e => {
    (e.registeredStudents || []).forEach(id => {
      if (id) allIds.push(id.toString());
    });
  });
  const uniqueIds = [...new Set(allIds)];
  if (uniqueIds.length > 0) {
    const [students, alumni, teachers] = await Promise.all([
      Student.find({ _id: { $in: uniqueIds } }, "name email department enrollmentYear").lean(),
      Alumni.find({ _id: { $in: uniqueIds } }, "name email department enrollmentYear").lean(),
      Teacher.find({ _id: { $in: uniqueIds } }, "name email department").lean(),
    ]);
    const userMap = {};
    students.forEach(u => userMap[u._id.toString()] = u);
    alumni.forEach(u => userMap[u._id.toString()] = u);
    teachers.forEach(u => userMap[u._id.toString()] = u);

    events.forEach(e => {
      e.registeredStudents = (e.registeredStudents || []).map(id => {
        const strId = id.toString();
        return userMap[strId] ? { ...userMap[strId], _id: strId } : { _id: strId, name: "Unknown" };
      });
    });
  }

  res.status(200).json({ success: true, events, total });
});

// ── GET /api/v1/events/:eventId ───────────────────────────────────────────────
export const getEvent = catchAsyncError(async (req, res, next) => {
  const event = await Event.findById(req.params.eventId).lean();
  if (!event || !event.isActive) return next(new ErrorHandler("Event not found.", 404));

  // Manually populate registeredStudents
  const rIds = (event.registeredStudents || []).map(String);
  if (rIds.length > 0) {
    const [students, alumni, teachers] = await Promise.all([
      Student.find({ _id: { $in: rIds } }, "name email department enrollmentYear").lean(),
      Alumni.find({ _id: { $in: rIds } }, "name email department enrollmentYear").lean(),
      Teacher.find({ _id: { $in: rIds } }, "name email department").lean(),
    ]);
    const userMap = {};
    students.forEach(u => userMap[u._id.toString()] = u);
    alumni.forEach(u => userMap[u._id.toString()] = u);
    teachers.forEach(u => userMap[u._id.toString()] = u);

    event.registeredStudents = rIds.map(id => {
      return userMap[id] ? { ...userMap[id], _id: id } : { _id: id, name: "Unknown" };
    });
  }

  const isRegistered = event.registeredStudents
    ?.map(s => String(s._id))
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

  const { title, description, date, time, location, link, type, audience, registrationDeadline } = req.body;

  if (!title?.trim())       return next(new ErrorHandler("Title is required.", 400));
  if (!description?.trim()) return next(new ErrorHandler("Description is required.", 400));
  if (!date)                return next(new ErrorHandler("Date is required.", 400));
  if (!time?.trim())        return next(new ErrorHandler("Time is required.", 400));
  if (!location?.trim() && !link?.trim()) {
    return next(new ErrorHandler("Provide either a physical location or an online link.", 400));
  }

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

  const allowed = ["title","description","date","time","location","link","type","audience"];
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
