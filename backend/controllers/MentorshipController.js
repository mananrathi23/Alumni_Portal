import ErrorHandler from "../middlewares/error.js";
import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import { Alumni } from "../models/AlumniModel.js";
import { Teacher } from "../models/TeacherModel.js";
import { Student } from "../models/StudentModel.js";
import { MentorshipRequest } from "../models/MentorshipRequestModel.js";
import { ChatMessage } from "../models/ChatMessageModel.js";
import { sendEmail } from "../utils/sendEmail.js";
import {
  mentorshipAcceptedStudentEmail,
  mentorshipAcceptedMentorEmail,
  mentorshipRejectedStudentEmail,
  mentorshipSlotTakenEmail,
} from "../utils/mentorshipEmailTemplates.js";
import { emitToUser } from "../Socket.js";

// ── Helpers ───────────────────────────────────────────────────────────────────
function getMentorModel(role) {
  if (role === "Alumni")  return Alumni;
  if (role === "Teacher") return Teacher;
  return null;
}

async function findMentorById(id) {
  const alumni = await Alumni.findById(id);
  if (alumni) return { mentor: alumni, mentorRole: "Alumni" };
  const teacher = await Teacher.findById(id);
  if (teacher) return { mentor: teacher, mentorRole: "Teacher" };
  return { mentor: null, mentorRole: null };
}

// ── Ranking score computation (used by multiple functions below) ─────────────
// score = (rating*0.4) + (sessions*0.3) + (acceptanceRate*0.2) + (responseSpeed*0.1)
// All components normalised to 0–5
function computeMentorScore(stats) {
  const rating       = Math.min((stats.averageRating    || 0), 5);
  const sessions     = Math.min((stats.totalSessions    || 0) / 10, 1) * 5;
  const acceptRate   = ((stats.acceptedRequests || 0) / Math.max(stats.totalRequests || 1, 1)) * 5;
  const maxMs        = 24 * 60 * 60 * 1000;
  const responseSpeed = Math.max(0, (1 - Math.min((stats.avgResponseMs || 0) / maxMs, 1))) * 5;
  const score = (rating * 0.4) + (sessions * 0.3) + (acceptRate * 0.2) + (responseSpeed * 0.1);
  return Math.round(score * 100) / 100;
}



// ── GET /api/v1/mentorship/settings ──────────────────────────────────────────
export const getMentorSettings = catchAsyncError(async (req, res, next) => {
  const user = req.user;
  const role = user.constructor.modelName;
  if (!["Alumni", "Teacher"].includes(role)) {
    return next(new ErrorHandler("Only mentors can access settings.", 403));
  }
  res.status(200).json({
    success: true,
    settings: {
      availableForMentorship: user.availableForMentorship ?? false,
      mentorshipSlots:        user.mentorshipSlots ?? [],
      weeklyLimit:            user.weeklyLimit ?? 5,
    },
  });
});

// ── PUT /api/v1/mentorship/settings ──────────────────────────────────────────
// Saves availability toggle + time slots to the mentor's own document
export const updateMentorshipAvailability = catchAsyncError(async (req, res, next) => {
  const user = req.user;
  const role = user.constructor.modelName;
  if (!["Alumni", "Teacher"].includes(role)) {
    return next(new ErrorHandler("Only alumni and teachers can update mentorship availability.", 403));
  }

  const { availableForMentorship, mentorshipSlots, weeklyLimit } = req.body;

  if (availableForMentorship === undefined && mentorshipSlots === undefined && weeklyLimit === undefined) {
    return next(new ErrorHandler("availableForMentorship, mentorshipSlots, or weeklyLimit is required.", 400));
  }

  if (availableForMentorship !== undefined) {
    user.availableForMentorship = !!availableForMentorship;
  }

  if (weeklyLimit !== undefined) {
    const wl = Number(weeklyLimit);
    if (wl >= 1 && wl <= 20) user.weeklyLimit = wl;
  }

  if (Array.isArray(mentorshipSlots)) {
    // Preserve booked state for existing slots
    const existingSlotMap = new Map(
      (user.mentorshipSlots || []).map(s => [`${s.day}-${s.time}`, s.booked])
    );
    user.mentorshipSlots = mentorshipSlots.map((s) => ({
      id:     s.id || `${s.day}-${s.time}`,
      day:    s.day,
      time:   s.time,
      booked: existingSlotMap.get(`${s.day}-${s.time}`) ?? !!s.booked,
    }));
  }

  await user.save({ validateModifiedOnly: true });

  res.status(200).json({
    success: true,
    message: "Mentorship settings saved.",
    settings: {
      availableForMentorship: user.availableForMentorship,
      mentorshipSlots: user.mentorshipSlots,
    },
  });
});

// ── GET /api/v1/mentorship/mentors ────────────────────────────────────────────
// Returns all available mentors with their slots
export const getMentors = catchAsyncError(async (req, res) => {
  const { search, filterRole, department } = req.query;
  const roles = filterRole && filterRole !== "All" ? [filterRole] : ["Alumni", "Teacher"];

  const mentorQueries = roles.map(async (role) => {
    const model = getMentorModel(role);
    const filter = {
      accountVerified: true,
      availableForMentorship: true,
      _id: { $ne: req.user._id },
    };

    if (department && department !== "All") filter.department = department;

    if (search) {
      const re = { $regex: search, $options: "i" };
      filter.$or = [
        { name: re },
        { department: re },
        { currentCompany: re },
        { currentDesignation: re },
        { designation: re },
        { skills: re },
      ];
    }

    const fields = role === "Alumni"
      ? "name department graduationYear currentCompany currentDesignation industry skills bio linkedIn availableForMentorship mentorshipSlots weeklyLimit mentorStats"
      : "name department designation experience qualifications bio linkedIn availableForMentorship mentorshipSlots weeklyLimit mentorStats";

    const docs = await model.find(filter).select(fields).lean();
    return docs.map((d) => ({
      ...d,
      role,
      availableSlots: (d.mentorshipSlots || []).map((s) => ({
        ...s,
        id: s.id || `${s.day}-${s.time}`,
      })),
    }));
  });

  const results = (await Promise.all(mentorQueries)).flat();
  // Sort by mentor score descending (highest ranked first)
  results.sort((a, b) => (b.mentorStats?.score || 0) - (a.mentorStats?.score || 0));
  res.status(200).json({ success: true, count: results.length, mentors: results });
});

// ── POST /api/v1/mentorship/requests ─────────────────────────────────────────
// Student sends a mentorship request — all edge cases handled
export const createMentorshipRequest = catchAsyncError(async (req, res, next) => {
  const user = req.user;
  if (user.constructor.modelName !== "Student") {
    return next(new ErrorHandler("Only students can send mentorship requests.", 403));
  }

  const { mentorId, goal, slot, note } = req.body;
  if (!mentorId || !goal || !slot?.day || !slot?.time) {
    return next(new ErrorHandler("mentorId, goal and slot (day/time) are required.", 400));
  }

  // Find mentor
  const { mentor, mentorRole } = await findMentorById(mentorId);
  if (!mentor || !mentor.accountVerified || !mentor.availableForMentorship) {
    return next(new ErrorHandler("Mentor not found or unavailable for mentorship.", 404));
  }

  // Slot must exist and be free
  const mentorSlot = (mentor.mentorshipSlots || []).find(
    (s) => s.day === slot.day && s.time === slot.time
  );
  if (!mentorSlot || mentorSlot.booked) {
    return next(new ErrorHandler("Selected slot is not available.", 400));
  }

  // No duplicate pending request from this student to this mentor
  const duplicatePending = await MentorshipRequest.findOne({
    "student.id": user._id,
    "mentor.id": mentor._id,
    status: "Pending",
  });
  if (duplicatePending) {
    return next(new ErrorHandler("You already have a pending request with this mentor.", 409));
  }

  // No already-accepted session for this slot
  const slotAlreadyAccepted = await MentorshipRequest.findOne({
    "mentor.id": mentor._id,
    "slot.day": slot.day,
    "slot.time": slot.time,
    status: "Accepted",
  });
  if (slotAlreadyAccepted) {
    return next(new ErrorHandler("This slot is already booked by another student.", 409));
  }

  // Student cannot request same slot they've already requested (different mentor is fine)
  const studentSameSlotPending = await MentorshipRequest.findOne({
    "student.id": user._id,
    "slot.day": slot.day,
    "slot.time": slot.time,
    status: { $in: ["Pending", "Accepted"] },
  });
  if (studentSameSlotPending) {
    return next(new ErrorHandler("You already have a pending or accepted request for this time slot.", 409));
  }

  const request = await MentorshipRequest.create({
    student: { id: user._id, name: user.name, department: user.department, year: user.year },
    mentor:  { id: mentor._id, name: mentor.name, role: mentorRole },
    goal,
    note,
    slot,
  });

  // Real-time: notify mentor of new request
  emitToUser(mentor._id, "mentorship:new_request", {
    requestId: request._id,
    student:   request.student,
    goal:      request.goal,
    slot:      request.slot,
    note:      request.note,
  });

  res.status(201).json({ success: true, request });
});

// ── GET /api/v1/mentorship/requests ──────────────────────────────────────────
export const getMentorshipRequests = catchAsyncError(async (req, res) => {
  const user = req.user;
  const role = user.constructor.modelName;

  let query;
  if (role === "Student") {
    query = { "student.id": user._id };
  } else if (["Alumni", "Teacher"].includes(role)) {
    query = { "mentor.id": user._id };
  } else {
    return res.status(200).json({ success: true, requests: [] });
  }

  const requests = await MentorshipRequest.find(query).sort({ createdAt: -1 }).lean();
  res.status(200).json({ success: true, count: requests.length, requests });
});

// ── PUT /api/v1/mentorship/requests/:requestId/respond ───────────────────────
// Accept or reject. On accept:
//   1. Atomically mark slot booked (prevents double-booking)
//   2. Auto-reject all other pending requests for same slot
//   3. Emit socket events
//   4. Send emails to both parties
//   5. Auto-reject others with slot-taken email
export const respondToMentorshipRequest = catchAsyncError(async (req, res, next) => {
  const user = req.user;
  const role = user.constructor.modelName;
  if (!["Alumni", "Teacher"].includes(role)) {
    return next(new ErrorHandler("Only mentors can respond to mentorship requests.", 403));
  }

  const { status } = req.body;
  if (!["Accepted", "Rejected"].includes(status)) {
    return next(new ErrorHandler("status must be Accepted or Rejected.", 400));
  }

  const mentorship = await MentorshipRequest.findById(req.params.requestId);
  if (!mentorship) return next(new ErrorHandler("Mentorship request not found.", 404));
  if (!mentorship.mentor.id.equals(user._id)) return next(new ErrorHandler("Not authorized.", 403));
  if (mentorship.status !== "Pending") {
    return next(new ErrorHandler(`This request is already ${mentorship.status}.`, 400));
  }

  if (status === "Accepted") {
    // ── Concurrency safety: use findOneAndUpdate with atomic slot-booking ──
    const mentorModel = getMentorModel(role);

    // Atomically set booked=true only if it was false
    const updatedMentor = await mentorModel.findOneAndUpdate(
      {
        _id: user._id,
        "mentorshipSlots.day":    mentorship.slot.day,
        "mentorshipSlots.time":   mentorship.slot.time,
        "mentorshipSlots.booked": false, // only succeeds if still free
      },
      { $set: { "mentorshipSlots.$.booked": true } },
      { new: true }
    );

    if (!updatedMentor) {
      // Slot was grabbed by a concurrent request
      return next(new ErrorHandler("This slot was just booked. Please reject this request.", 409));
    }

    // ── Weekly limit check ──────────────────────────────────────────────────
    const weekStart = new Date();
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weeklyAccepted = await MentorshipRequest.countDocuments({
      "mentor.id": user._id,
      status:      "Accepted",
      respondedAt: { $gte: weekStart },
    });
    if (weeklyAccepted >= (updatedMentor.weeklyLimit || 5)) {
      // Roll back slot booking
      await mentorModel.findOneAndUpdate(
        { _id: user._id, "mentorshipSlots.day": mentorship.slot.day, "mentorshipSlots.time": mentorship.slot.time },
        { $set: { "mentorshipSlots.$.booked": false } }
      );
      return next(new ErrorHandler("You have reached your weekly session limit. Increase it in Settings to accept more.", 400));
    }

    // Mark this request accepted
    mentorship.status      = "Accepted";
    mentorship.respondedAt = new Date();
    await mentorship.save();

    // ── Update mentor stats: acceptedRequests, avgResponseMs ──────────────
    const responseMs = mentorship.requestedAt
      ? new Date() - new Date(mentorship.requestedAt)
      : 0;
    await mentorModel.findByIdAndUpdate(user._id, {
      $inc: {
        "mentorStats.acceptedRequests": 1,
        "mentorStats.totalRequests":    1,
      },
      $set: {
        "mentorStats.avgResponseMs": responseMs,
      },
    });

    // ── Auto-reject all other Pending requests for the same mentor+slot ──
    const conflictingRequests = await MentorshipRequest.find({
      _id:          { $ne: mentorship._id },
      "mentor.id":  user._id,
      "slot.day":   mentorship.slot.day,
      "slot.time":  mentorship.slot.time,
      status:       "Pending",
    }).lean();

    if (conflictingRequests.length > 0) {
      await MentorshipRequest.updateMany(
        { _id: { $in: conflictingRequests.map(r => r._id) } },
        { status: "Rejected", respondedAt: new Date() }
      );

      // Notify each displaced student via socket + email
      for (const cr of conflictingRequests) {
        emitToUser(cr.student.id, "mentorship:slot_taken", {
          requestId:  cr._id,
          mentorName: user.name,
          slot:       cr.slot,
        });

        // Get student email
        const student = await Student.findById(cr.student.id).select("email").lean();
        if (student?.email) {
          sendEmail({
            email:   student.email,
            subject: "Mentorship Slot No Longer Available",
            message: mentorshipSlotTakenEmail({
              studentName: cr.student.name,
              mentorName:  user.name,
              slotDay:     cr.slot.day,
              slotTime:    cr.slot.time,
            }),
          }).catch(console.error); // fire-and-forget
        }
      }
    }

    // ── Socket: notify accepted student ──
    emitToUser(mentorship.student.id, "mentorship:accepted", {
      requestId:  mentorship._id,
      mentorName: user.name,
      mentorRole: role,
      slot:       mentorship.slot,
      goal:       mentorship.goal,
    });

    // ── Socket: notify mentor (self) — tab refresh ──
    emitToUser(user._id, "mentorship:request_responded", {
      requestId: mentorship._id,
      status:    "Accepted",
    });

    // ── Emails (fire-and-forget — don't block the response) ──
    const acceptedStudent = await Student.findById(mentorship.student.id).select("email").lean();
    if (acceptedStudent?.email) {
      sendEmail({
        email:   acceptedStudent.email,
        subject: `✅ Mentorship Accepted by ${user.name}`,
        message: mentorshipAcceptedStudentEmail({
          studentName: mentorship.student.name,
          mentorName:  user.name,
          mentorRole:  role,
          goal:        mentorship.goal,
          slotDay:     mentorship.slot.day,
          slotTime:    mentorship.slot.time,
        }),
      }).catch(console.error);
    }

    sendEmail({
      email:   user.email,
      subject: `📋 Session Confirmed with ${mentorship.student.name}`,
      message: mentorshipAcceptedMentorEmail({
        mentorName:  user.name,
        studentName: mentorship.student.name,
        studentDept: mentorship.student.department,
        studentYear: mentorship.student.year,
        goal:        mentorship.goal,
        slotDay:     mentorship.slot.day,
        slotTime:    mentorship.slot.time,
      }),
    }).catch(console.error);

  } else {
    // Normal rejection
    mentorship.status      = "Rejected";
    mentorship.respondedAt = new Date();
    await mentorship.save();

    // Update stats: totalRequests
    const mentorModelRej = getMentorModel(role);
    await mentorModelRej.findByIdAndUpdate(user._id, {
      $inc: { "mentorStats.totalRequests": 1 },
    });

    // Socket: notify student
    emitToUser(mentorship.student.id, "mentorship:rejected", {
      requestId:  mentorship._id,
      mentorName: user.name,
      slot:       mentorship.slot,
    });

    // Email: notify student
    const rejectedStudent = await Student.findById(mentorship.student.id).select("email").lean();
    if (rejectedStudent?.email) {
      sendEmail({
        email:   rejectedStudent.email,
        subject: `Mentorship Request Update from ${user.name}`,
        message: mentorshipRejectedStudentEmail({
          studentName: mentorship.student.name,
          mentorName:  user.name,
          slotDay:     mentorship.slot.day,
          slotTime:    mentorship.slot.time,
        }),
      }).catch(console.error);
    }
  }

  res.status(200).json({ success: true, mentorship });
});

// ── DELETE /api/v1/mentorship/requests/:requestId/cancel ─────────────────────
// Student withdraws a Pending request
export const cancelMentorshipRequest = catchAsyncError(async (req, res, next) => {
  const user       = req.user;
  const mentorship = await MentorshipRequest.findById(req.params.requestId);
  if (!mentorship) return next(new ErrorHandler("Mentorship request not found.", 404));
  if (!mentorship.student.id.equals(user._id)) {
    return next(new ErrorHandler("You are not authorized to cancel this request.", 403));
  }
  if (mentorship.status !== "Pending") {
    return next(new ErrorHandler("Only pending requests can be cancelled.", 400));
  }

  mentorship.status = "Cancelled";
  await mentorship.save();

  // Notify mentor their pending count changed
  emitToUser(mentorship.mentor.id, "mentorship:request_cancelled", {
    requestId:   mentorship._id,
    studentName: mentorship.student.name,
  });

  res.status(200).json({ success: true, mentorship });
});

// ── PUT /api/v1/mentorship/requests/:requestId/complete ──────────────────────
// Mentor marks the session as Completed and frees the slot
export const completeMentorshipSession = catchAsyncError(async (req, res, next) => {
  const user       = req.user;
  const role       = user.constructor.modelName;
  const mentorship = await MentorshipRequest.findById(req.params.requestId);

  if (!mentorship) return next(new ErrorHandler("Mentorship session not found.", 404));
  if (!mentorship.mentor.id.equals(user._id)) return next(new ErrorHandler("Not authorized.", 403));
  if (mentorship.status !== "Accepted") {
    return next(new ErrorHandler("Only accepted sessions can be marked complete.", 400));
  }

  mentorship.status      = "Completed";
  mentorship.completedAt = new Date();
  await mentorship.save();

  // ── Update mentor stats: totalSessions + score ──────────────────────────
  const mentor_ = await getMentorModel(role).findById(user._id);
  if (mentor_) {
    const s = mentor_.mentorStats || {};
    mentor_.mentorStats = {
      ...s,
      totalSessions: (s.totalSessions || 0) + 1,
    };
    mentor_.mentorStats.score = computeMentorScore(mentor_.mentorStats);
    await mentor_.save({ validateModifiedOnly: true });
  }

  // Free the slot back
  const mentorModel = getMentorModel(role);
  await mentorModel.findOneAndUpdate(
    {
      _id:                   user._id,
      "mentorshipSlots.day":  mentorship.slot.day,
      "mentorshipSlots.time": mentorship.slot.time,
    },
    { $set: { "mentorshipSlots.$.booked": false } }
  );

  // Notify student so they can rate the session
  emitToUser(mentorship.student.id, "mentorship:completed", {
    requestId:  mentorship._id,
    mentorName: user.name,
  });

  res.status(200).json({ success: true, mentorship });
});

// ── PUT /api/v1/mentorship/requests/:requestId/meeting-link ─────────────────
// Mentor stores a meeting link on the session document
export const setMeetingLink = catchAsyncError(async (req, res, next) => {
  const user       = req.user;
  const { link }   = req.body;
  const mentorship = await MentorshipRequest.findById(req.params.requestId);

  if (!mentorship) return next(new ErrorHandler("Session not found.", 404));
  if (!mentorship.mentor.id.equals(user._id)) return next(new ErrorHandler("Not authorized.", 403));
  if (mentorship.status !== "Accepted") return next(new ErrorHandler("Can only set link on active sessions.", 400));
  if (!link) return next(new ErrorHandler("Meeting link is required.", 400));

  mentorship.meetingLink = link;
  await mentorship.save();

  // Push meeting link as a chat message too
  const msg = await ChatMessage.create({
    mentorshipId: mentorship._id,
    sender:       { id: user._id, name: user.name, role: user.constructor.modelName },
    text:         `📎 Meeting Link: ${link}`,
    meetingLink:  link,
  });

  // Real-time: notify student via socket
  emitToUser(mentorship.student.id, "chat:new_message", {
    mentorshipId: mentorship._id,
    message:      msg,
  });

  res.status(200).json({ success: true, meetingLink: link });
});

// ═════════════════════════════════════════════════════════════════════════════
// CHAT
// ═════════════════════════════════════════════════════════════════════════════

// ── GET /api/v1/mentorship/chat/:mentorshipId ────────────────────────────────
// Fetch full message history for an accepted session
export const getChatMessages = catchAsyncError(async (req, res, next) => {
  const user         = req.user;
  const mentorshipId = req.params.mentorshipId;

  const mentorship = await MentorshipRequest.findById(mentorshipId);
  if (!mentorship) return next(new ErrorHandler("Session not found.", 404));

  // Only the student and the mentor can access this chat
  const isStudent = mentorship.student.id.equals(user._id);
  const isMentor  = mentorship.mentor.id.equals(user._id);
  if (!isStudent && !isMentor) {
    return next(new ErrorHandler("You are not part of this mentorship session.", 403));
  }

  if (mentorship.status !== "Accepted" && mentorship.status !== "Completed") {
    return next(new ErrorHandler("Chat is only available for accepted or completed sessions.", 403));
  }

  const messages = await ChatMessage.find({ mentorshipId })
    .sort({ createdAt: 1 })
    .lean();

  // Mark all unread messages as read by this user
  await ChatMessage.updateMany(
    { mentorshipId, "sender.id": { $ne: user._id }, readBy: { $ne: user._id } },
    { $addToSet: { readBy: user._id } }
  );

  res.status(200).json({ success: true, messages });
});

// ── POST /api/v1/mentorship/chat/:mentorshipId ───────────────────────────────
// Send a message — only for accepted/completed sessions, only participants
export const sendChatMessage = catchAsyncError(async (req, res, next) => {
  const user         = req.user;
  const role         = user.constructor.modelName;
  const mentorshipId = req.params.mentorshipId;
  const { text }     = req.body;

  if (!text?.trim()) return next(new ErrorHandler("Message text is required.", 400));

  const mentorship = await MentorshipRequest.findById(mentorshipId);
  if (!mentorship) return next(new ErrorHandler("Session not found.", 404));

  const isStudent = mentorship.student.id.equals(user._id);
  const isMentor  = mentorship.mentor.id.equals(user._id);
  if (!isStudent && !isMentor) {
    return next(new ErrorHandler("You are not part of this mentorship session.", 403));
  }

  if (mentorship.status !== "Accepted" && mentorship.status !== "Completed") {
    return next(new ErrorHandler("Chat is only available for accepted or completed sessions.", 403));
  }

  const message = await ChatMessage.create({
    mentorshipId,
    sender: { id: user._id, name: user.name, role },
    text:   text.trim(),
  });

  // Real-time: push to the other participant
  const recipientId = isStudent ? mentorship.mentor.id : mentorship.student.id;
  emitToUser(recipientId, "chat:new_message", {
    mentorshipId,
    message,
  });

  res.status(201).json({ success: true, message });
});

// ── GET /api/v1/mentorship/chat/unread-counts ────────────────────────────────
// Returns total unread message count for the logged-in user across all sessions
export const getUnreadCounts = catchAsyncError(async (req, res) => {
  const user = req.user;
  const role = user.constructor.modelName;

  // Find all sessions this user is part of
  const query = role === "Student"
    ? { "student.id": user._id, status: { $in: ["Accepted", "Completed"] } }
    : { "mentor.id":  user._id, status: { $in: ["Accepted", "Completed"] } };

  const sessions = await MentorshipRequest.find(query).select("_id").lean();
  const sessionIds = sessions.map(s => s._id);

  const counts = await ChatMessage.aggregate([
    {
      $match: {
        mentorshipId:  { $in: sessionIds },
        "sender.id":   { $ne: user._id },
        readBy:        { $ne: user._id },
      },
    },
    { $group: { _id: "$mentorshipId", count: { $sum: 1 } } },
  ]);

  const unread = {};
  counts.forEach(c => { unread[c._id.toString()] = c.count; });

  res.status(200).json({ success: true, unread });
});

// ═════════════════════════════════════════════════════════════════════════════
// RATING — student rates a completed session
// POST /api/v1/mentorship/requests/:requestId/rate
// Body: { value: 1-5, feedback?: string }
// ═════════════════════════════════════════════════════════════════════════════
export const rateSession = catchAsyncError(async (req, res, next) => {
  const user       = req.user;
  if (user.constructor.modelName !== "Student") {
    return next(new ErrorHandler("Only students can rate sessions.", 403));
  }

  const { value, feedback } = req.body;
  if (!value || value < 1 || value > 5) {
    return next(new ErrorHandler("Rating value must be between 1 and 5.", 400));
  }

  const mentorship = await MentorshipRequest.findById(req.params.requestId);
  if (!mentorship) return next(new ErrorHandler("Session not found.", 404));
  if (!mentorship.student.id.equals(user._id)) {
    return next(new ErrorHandler("You can only rate your own sessions.", 403));
  }
  if (mentorship.status !== "Completed") {
    return next(new ErrorHandler("You can only rate completed sessions.", 400));
  }
  if (mentorship.rating?.value) {
    return next(new ErrorHandler("You have already rated this session.", 409));
  }

  mentorship.rating = { value, feedback: feedback?.trim() || "", ratedAt: new Date() };
  await mentorship.save();

  // Update cached mentor stats + recompute score
  const MentorModel = getMentorModel(mentorship.mentor.role);
  const mentor = await MentorModel.findById(mentorship.mentor.id);
  if (mentor) {
    const stats = mentor.mentorStats || {};
    const newTotalRatings = (stats.totalRatings || 0) + 1;
    const newSumRatings   = (stats.sumRatings   || 0) + value;
    const newAvg          = newSumRatings / newTotalRatings;

    mentor.mentorStats = {
      ...stats,
      totalRatings:  newTotalRatings,
      sumRatings:    newSumRatings,
      averageRating: Math.round(newAvg * 10) / 10,
    };
    mentor.mentorStats.score = computeMentorScore(mentor.mentorStats);
    await mentor.save({ validateModifiedOnly: true });
  }

  res.status(200).json({ success: true, message: "Rating submitted.", rating: mentorship.rating });
});

// ═════════════════════════════════════════════════════════════════════════════
// MENTOR STATS — get mentor's own stats (for dashboard)
// GET /api/v1/mentorship/my-stats
// ═════════════════════════════════════════════════════════════════════════════
export const getMyMentorStats = catchAsyncError(async (req, res, next) => {
  const user = req.user;
  const role = user.constructor.modelName;
  if (!["Alumni", "Teacher"].includes(role)) {
    return next(new ErrorHandler("Only mentors can view their stats.", 403));
  }

  // Weekly sessions count (current ISO week)
  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Sunday

  const weeklyCount = await MentorshipRequest.countDocuments({
    "mentor.id": user._id,
    status:      "Accepted",
    respondedAt: { $gte: weekStart },
  });

  // Per-session ratings for history tab
  const ratedSessions = await MentorshipRequest.find({
    "mentor.id":   user._id,
    status:        "Completed",
    "rating.value": { $ne: null, $exists: true },
  }).select("student goal slot rating completedAt").sort({ completedAt: -1 }).lean();

  const stats = user.mentorStats || {};

  res.status(200).json({
    success: true,
    weeklyCount,
    weeklyLimit: user.weeklyLimit || 5,
    stats: {
      totalSessions:    stats.totalSessions    || 0,
      averageRating:    stats.averageRating    || 0,
      totalRatings:     stats.totalRatings     || 0,
      acceptanceRate:   stats.totalRequests > 0
        ? Math.round((stats.acceptedRequests / stats.totalRequests) * 100)
        : 0,
      score:            stats.score            || 0,
    },
    ratedSessions,
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// WEEKLY LIMIT — update mentor's weekly limit
// PUT /api/v1/mentorship/settings (already exists — handled in updateMentorshipAvailability)
// But we need to also handle weeklyLimit in that function — patch it separately here
// via: PUT /api/v1/mentorship/weekly-limit  { weeklyLimit: 5 }
// ═════════════════════════════════════════════════════════════════════════════
export const updateWeeklyLimit = catchAsyncError(async (req, res, next) => {
  const user = req.user;
  const role = user.constructor.modelName;
  if (!["Alumni", "Teacher"].includes(role)) {
    return next(new ErrorHandler("Only mentors can update their weekly limit.", 403));
  }

  const { weeklyLimit } = req.body;
  if (!weeklyLimit || weeklyLimit < 1 || weeklyLimit > 20) {
    return next(new ErrorHandler("weeklyLimit must be between 1 and 20.", 400));
  }

  user.weeklyLimit = weeklyLimit;
  await user.save({ validateModifiedOnly: true });

  res.status(200).json({ success: true, weeklyLimit: user.weeklyLimit });
});

// ═════════════════════════════════════════════════════════════════════════════
// RANKING SCORE — helper used internally
// score = (rating * 0.4) + (sessions * 0.3) + (acceptanceRate * 0.2) + (responseSpeed * 0.1)
// All components normalised to 0-5 range
// ═════════════════════════════════════════════════════════════════════════════


// NOTE: weeklyLimit is also accepted by updateMentorshipAvailability (PUT /settings)
// The patch below adds weeklyLimit handling to that existing function via a monkey-patch
// Actually we handle it separately via PUT /weekly-limit — both routes work
