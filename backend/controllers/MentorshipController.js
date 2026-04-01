import ErrorHandler from "../middlewares/error.js";
import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import { Alumni } from "../models/AlumniModel.js";
import { Teacher } from "../models/TeacherModel.js";
import { MentorshipRequest } from "../models/MentorshipRequestModel.js";

// GET /api/v1/mentorship/mentors
export const getMentors = catchAsyncError(async (req, res) => {
  const { search, filterRole, department } = req.query;
  const roles = filterRole && filterRole !== "All" ? [filterRole] : ["Alumni", "Teacher"];

  const mentorQueries = roles.map(async (role) => {
    let filter = { accountVerified: true, _id: { $ne: req.user._id } };

    if (role === "Alumni") {
      filter.availableForMentorship = true;
    } else if (role === "Teacher") {
      filter.availableForMentorship = true;
    }

    if (department && department !== "All") {
      filter.department = department;
    }

    if (search) {
      const searchRegex = { $regex: search, $options: "i" };
      filter.$or = [
        { name: searchRegex },
        { department: searchRegex },
        { currentCompany: searchRegex },
        { currentDesignation: searchRegex },
      ];
    }

    const model = role === "Teacher" ? Teacher : Alumni;
    const fields = {
      Teacher: "name email department designation experience qualifications bio linkedIn profilePhoto availableForMentorship mentorshipSlots",
      Alumni: "name email department graduationYear currentCompany currentDesignation industry skills bio linkedIn github availableForMentorship mentorshipSlots profilePhoto",
    };

    const docs = await model.find(filter).select(fields[role]).lean();
    return docs.map((d) => ({
      ...d,
      role,
      availableSlots: (d.mentorshipSlots || []).map((slot) => ({
        ...slot,
        id: slot.id || `${slot.day}-${slot.time}`,
      })),
    }));
  });

  const results = (await Promise.all(mentorQueries)).flat();

  res.status(200).json({ success: true, count: results.length, mentors: results });
});

// POST /api/v1/mentorship/requests
export const createMentorshipRequest = catchAsyncError(async (req, res, next) => {
  const user = req.user;
  if (user.constructor.modelName !== "Student") {
    return next(new ErrorHandler("Only students can send mentorship requests.", 403));
  }

  const { mentorId, goal, slot, note } = req.body;
  if (!mentorId || !goal || !slot?.day || !slot?.time) {
    return next(new ErrorHandler("mentorId, goal and slot (day/time) are required.", 400));
  }

  const mentor = await Alumni.findOne({ _id: mentorId, accountVerified: true, availableForMentorship: true })
    || await Teacher.findOne({ _id: mentorId, accountVerified: true, availableForMentorship: true });

  if (!mentor) {
    return next(new ErrorHandler("Mentor not found or unavailable for mentorship.", 404));
  }

  const mentorSlot = (mentor.mentorshipSlots || []).find(
    (s) => s.day === slot.day && s.time === slot.time,
  );

  if (!mentorSlot || mentorSlot.booked) {
    return next(new ErrorHandler("Selected slot is not available.", 400));
  }

  const existing = await MentorshipRequest.findOne({
    "student.id": user._id,
    "mentor.id": mentor._id,
    status: "Pending",
  });
  if (existing) {
    return next(new ErrorHandler("A pending request already exists for this mentor.", 409));
  }

  const existingAccepted = await MentorshipRequest.findOne({
    "mentor.id": mentor._id,
    "slot.day": slot.day,
    "slot.time": slot.time,
    status: "Accepted",
  });
  if (existingAccepted) {
    return next(new ErrorHandler("This slot is already booked.", 409));
  }

  const request = await MentorshipRequest.create({
    student: { id: user._id, name: user.name, department: user.department, year: user.year },
    mentor: { id: mentor._id, name: mentor.name, role: mentor.constructor.modelName },
    goal,
    note,
    slot,
  });
  const slotConflict = await MentorshipRequest.findOne({
    "student.id": user._id,
    "slot.day": slot.day,
    "slot.time": slot.time,
    status: "Pending",
  });

  if (slotConflict) {
    return next(new ErrorHandler("You already requested this slot.", 409));
  }

  res.status(201).json({ success: true, request });
});

// GET /api/v1/mentorship/requests
export const getMentorshipRequests = catchAsyncError(async (req, res) => {
  const user = req.user;
  let query;

  if (user.constructor.modelName === "Student") {
    query = { "student.id": user._id };
  } else if (user.constructor.modelName === "Alumni" || user.constructor.modelName === "Teacher") {
    query = { "mentor.id": user._id };
  } else {
    return res.status(200).json({ success: true, requests: [] });
  }

  const requests = await MentorshipRequest.find(query).sort({ requestedAt: -1 }).lean();
  res.status(200).json({ success: true, count: requests.length, requests });
});

// PUT /api/v1/mentorship/requests/:requestId/respond
export const respondToMentorshipRequest = catchAsyncError(
  async (req, res, next) => {
    const user = req.user;

    if (!["Alumni", "Teacher"].includes(user.constructor.modelName)) {
      return next(
        new ErrorHandler(
          "Only mentors can respond to mentorship requests.",
          403,
        ),
      );
    }

    const { requestId } = req.params;
    const { status } = req.body;

    if (!["Accepted", "Rejected"].includes(status)) {
      return next(
        new ErrorHandler("status must be Accepted or Rejected.", 400),
      );
    }

    const mentorship = await MentorshipRequest.findById(requestId);
    if (!mentorship) {
      return next(new ErrorHandler("Mentorship request not found.", 404));
    }

    if (!mentorship.mentor.id.equals(user._id)) {
      return next(new ErrorHandler("Not authorized.", 403));
    }

    if (status === "Accepted") {
      const existingAccepted = await MentorshipRequest.findOne({
        "mentor.id": user._id,
        "slot.day": mentorship.slot.day,
        "slot.time": mentorship.slot.time,
        status: "Accepted",
      });

      if (existingAccepted) {
        return next(new ErrorHandler("This slot is already booked.", 400));
      }

      mentorship.status = "Accepted";
      mentorship.respondedAt = Date.now();
      await mentorship.save();

      const mentorModel = user.constructor.modelName === "Teacher" ? Teacher : Alumni;
      const mentor = await mentorModel.findById(user._id);
      if (mentor) {
        mentor.mentorshipSlots = (mentor.mentorshipSlots || []).map((s) =>
          s.day === mentorship.slot.day && s.time === mentorship.slot.time
            ? { ...s, booked: true }
            : s,
        );
        await mentor.save({ validateModifiedOnly: true });
      }

      await MentorshipRequest.updateMany(
        {
          _id: { $ne: mentorship._id },
          "mentor.id": user._id,
          "slot.day": mentorship.slot.day,
          "slot.time": mentorship.slot.time,
          status: "Pending",
        },
        {
          status: "Rejected",
          respondedAt: Date.now(),
        },
      );
    } else {
      // Normal rejection
      mentorship.status = "Rejected";
      mentorship.respondedAt = Date.now();
      await mentorship.save();
    }

    res.status(200).json({ success: true, mentorship });
  },
);


// DELETE /api/v1/mentorship/requests/:requestId/cancel
export const cancelMentorshipRequest = catchAsyncError(async (req, res, next) => {
  const user = req.user;
  const { requestId } = req.params;

  const mentorship = await MentorshipRequest.findById(requestId);
  if (!mentorship) {
    return next(new ErrorHandler("Mentorship request not found.", 404));
  }

  if (!mentorship.student.id.equals(user._id)) {
    return next(new ErrorHandler("You are not authorized to cancel this request.", 403));
  }

  if (mentorship.status !== "Pending") {
    return next(new ErrorHandler("Only pending requests can be cancelled.", 400));
  }

  mentorship.status = "Cancelled";
  await mentorship.save();

  res.status(200).json({ success: true, mentorship });
});

// PUT /api/v1/mentorship/settings
export const updateMentorshipAvailability = catchAsyncError(async (req, res, next) => {
  const user = req.user;
  const role = user.constructor.modelName;

  if (!["Alumni", "Teacher"].includes(role)) {
    return next(new ErrorHandler("Only alumni and teachers can update mentorship availability.", 403));
  }

  const { availableForMentorship, mentorshipSlots } = req.body;

  if (availableForMentorship === undefined && mentorshipSlots === undefined) {
    return next(new ErrorHandler("availableForMentorship or mentorshipSlots is required", 400));
  }

  if (availableForMentorship !== undefined) {
    user.availableForMentorship = !!availableForMentorship;
  }

  if (Array.isArray(mentorshipSlots)) {
    user.mentorshipSlots = mentorshipSlots.map((s) => ({
      id: s.id || `${s.day}-${s.time}`,
      day: s.day,
      time: s.time,
      booked: !!s.booked,
    }));
  }

  await user.save({ validateModifiedOnly: true });

  res.status(200).json({ success: true, user, message: "Mentorship availability updated." });
});
