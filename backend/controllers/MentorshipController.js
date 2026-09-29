import ErrorHandler from "../middlewares/error.js";
import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import { Alumni } from "../models/AlumniModel.js";
import { Teacher } from "../models/TeacherModel.js";
import { Student } from "../models/StudentModel.js";
import { MentorshipRequest } from "../models/MentorshipRequestModel.js";
import { sendEmail } from "../utils/sendEmail.js";
import {
  mentorshipAcceptedStudentEmail,
  mentorshipAcceptedMentorEmail,
  mentorshipRejectedStudentEmail,
  mentorshipSlotTakenEmail,
} from "../utils/mentorshipEmailTemplates.js";
import { emitToUser } from "../Socket.js";
import {
  buildGoogleAuthUrl,
  decodeOAuthState,
  exchangeCodeForTokens,
  createGoogleMeetLink,
  getNextSlotISO,
} from "../utils/googleCalendar.js";
import { postChatMessage } from "../utils/conversations.js";
import { isSafeUrl } from "../utils/validateUrl.js";
import { searchRegex } from "../utils/escapeRegex.js";
import { invalidateCache, invalidateUserListings } from "../middlewares/cache.js";
import { getMentorModel } from "../utils/userModels.js";

// ── Helpers ───────────────────────────────────────────────────────────────────
async function findMentorById(id) {
  const alumni = await Alumni.findById(id);
  if (alumni) return { mentor: alumni, mentorRole: "Alumni" };
  const teacher = await Teacher.findById(id);
  if (teacher) return { mentor: teacher, mentorRole: "Teacher" };
  return { mentor: null, mentorRole: null };
}

// Mentors students may see and book: verified by email and by an admin, not blocked
const BOOKABLE_MENTOR = { accountVerified: true, adminVerified: true, isBlocked: { $ne: true }, availableForMentorship: true };

// ── Ranking score computation ─────────────────────────────────────────────────
// Score is out of 10, based on:
//   - Rating from mentees (40%) — avg rating out of 5, scaled to 10
//   - Sessions completed (25%)  — capped at 20 sessions
//   - Acceptance rate (15%)     — % of requests accepted
//   - Response speed (10%)      — faster responses score higher
//   - Jobs posted (5%)          — community contribution, capped at 10
//   - Events organized (5%)     — community contribution, capped at 10
function computeMentorScore(stats) {
  const rating = Math.min((stats.averageRating || 0), 5) / 5 * 4;          // max 4
  const sessions = Math.min((stats.totalSessions || 0) / 20, 1) * 2.5;        // max 2.5
  const acceptRate = ((stats.acceptedRequests || 0) / Math.max(stats.totalRequests || 1, 1)) * 1.5; // max 1.5
  const maxMs = 24 * 60 * 60 * 1000;
  const responseSpeed = Math.max(0, (1 - Math.min((stats.avgResponseMs || 0) / maxMs, 1))) * 1.0; // max 1.0
  const jobsBonus = Math.min((stats.jobsPosted || 0) / 10, 1) * 0.5;           // max 0.5
  const eventsBonus = Math.min((stats.eventsOrganized || 0) / 10, 1) * 0.5;      // max 0.5
  const score = rating + sessions + acceptRate + responseSpeed + jobsBonus + eventsBonus;
  return Math.min(Math.round(score * 100) / 100, 10); // cap at 10
}

// ── Badge from score ──────────────────────────────────────────────────────────
// Returns { badge, color } based on computed score out of 10
function getMentorBadge(score) {
  if (score >= 8.5) return { badge: "🏆 Elite Mentor", tier: "elite" };
  if (score >= 6.5) return { badge: "⭐ Expert Mentor", tier: "expert" };
  if (score >= 4.5) return { badge: "🌟 Rising Mentor", tier: "rising" };
  if (score >= 2.0) return { badge: "🌱 New Mentor", tier: "new" };
  return { badge: "Mentor", tier: "default" };
}

// ═════════════════════════════════════════════════════════════════════════════
// GOOGLE CALENDAR AUTH
// ═════════════════════════════════════════════════════════════════════════════

// ── GET /api/v1/mentorship/auth/google ────────────────────────────────────────
// Returns the Google OAuth consent URL for the mentor to open (one-time setup).
// mentorId + role are embedded in the `state` param inside the URL.
export const getGoogleAuthUrl = catchAsyncError(async (req, res, next) => {
  const role = req.user.constructor.modelName;
  if (!["Alumni", "Teacher"].includes(role)) {
    return next(new ErrorHandler("Only mentors can link Google Calendar.", 403));
  }

  // Pass mentorId and role so the callback (which has NO JWT) can identify who to update
  const url = buildGoogleAuthUrl(req.user._id.toString(), role);
  res.status(200).json({ success: true, url });
});

// ── GET /api/v1/mentorship/auth/callback ──────────────────────────────────────
// ⚠️  DO NOT add isAuthenticated middleware to this route in your router file.
//     Google's redirect carries no JWT cookie. Identity comes from `state` param.
export const handleGoogleCallback = catchAsyncError(async (req, res, next) => {
  const { code, state } = req.query;

  if (!code) return next(new ErrorHandler("No auth code received from Google.", 400));
  if (!state) return next(new ErrorHandler("Missing state parameter.", 400));

  // Decode mentorId + mentorRole that were packed into the auth URL
  let mentorId, mentorRole;
  try {
    ({ mentorId, mentorRole } = decodeOAuthState(state));
  } catch (err) {
    return next(new ErrorHandler("Invalid OAuth state parameter.", 400));
  }

  if (!["Alumni", "Teacher"].includes(mentorRole)) {
    return next(new ErrorHandler("Invalid mentor role in state.", 400));
  }

  // Exchange the one-time code for access + refresh tokens
  const tokens = await exchangeCodeForTokens(code);

  // Persist tokens to the mentor's document
  const Model = getMentorModel(mentorRole);
  await Model.findByIdAndUpdate(mentorId, { googleTokens: tokens });

  // The /google-linked page signals the opener and closes itself
  res.redirect(`${process.env.FRONTEND_URL}/google-linked`);
});

// ── GET /api/v1/mentorship/auth/status ───────────────────────────────────────
export const getGoogleLinkStatus = catchAsyncError(async (req, res, next) => {
  const role = req.user.constructor.modelName;
  if (!["Alumni", "Teacher"].includes(role)) {
    return next(new ErrorHandler("Only mentors can check Google link status.", 403));
  }
  const Model = getMentorModel(role);
  const mentor = await Model.findById(req.user._id)
    .select("+googleTokens.refresh_token")
    .lean();
  const linked = !!(mentor?.googleTokens?.refresh_token);
  res.status(200).json({ success: true, linked });
});

// ═════════════════════════════════════════════════════════════════════════════
// MENTOR SETTINGS
// ═════════════════════════════════════════════════════════════════════════════

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
      mentorshipSlots: user.mentorshipSlots ?? [],
      weeklyLimit: user.weeklyLimit ?? 5,
    },
  });
});

export const updateMentorshipAvailability = catchAsyncError(async (req, res, next) => {
  const user = req.user;
  const role = user.constructor.modelName;
  if (!["Alumni", "Teacher"].includes(role)) {
    return next(new ErrorHandler("Only alumni and teachers can update mentorship availability.", 403));
  }

  const { availableForMentorship, mentorshipSlots, weeklyLimit } = req.body;

  if (
    availableForMentorship === undefined &&
    mentorshipSlots === undefined &&
    weeklyLimit === undefined
  ) {
    return next(new ErrorHandler("availableForMentorship, mentorshipSlots, or weeklyLimit is required.", 400));
  }

  if (availableForMentorship !== undefined) user.availableForMentorship = !!availableForMentorship;

  if (weeklyLimit !== undefined) {
    const wl = Number(weeklyLimit);
    if (wl >= 1 && wl <= 20) user.weeklyLimit = wl;
  }

  if (Array.isArray(mentorshipSlots)) {
    const existingSlotMap = new Map(
      (user.mentorshipSlots || []).map(s => [`${s.day}-${s.time}`, s.booked])
    );
    user.mentorshipSlots = mentorshipSlots.map((s) => ({
      id: s.id || `${s.day}-${s.time}`,
      day: s.day,
      time: s.time,
      booked: existingSlotMap.get(`${s.day}-${s.time}`) ?? !!s.booked,
    }));
  }

  await user.save({ validateModifiedOnly: true });
  await invalidateUserListings();

  res.status(200).json({
    success: true,
    message: "Mentorship settings saved.",
    settings: {
      availableForMentorship: user.availableForMentorship,
      mentorshipSlots: user.mentorshipSlots,
    },
  });
});

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
  await invalidateCache("mentors");
  res.status(200).json({ success: true, weeklyLimit: user.weeklyLimit });
});

// ═════════════════════════════════════════════════════════════════════════════
// BROWSE MENTORS
// ═════════════════════════════════════════════════════════════════════════════

export const getMentors = catchAsyncError(async (req, res) => {
  const { search, filterRole, department } = req.query;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 12));
  const skip = (page - 1) * limit;

  const roles = filterRole && filterRole !== "All" ? [filterRole] : ["Alumni", "Teacher"];

  const mentorQueries = roles.map(async (role) => {
    const model = getMentorModel(role);
    const filter = { ...BOOKABLE_MENTOR, _id: { $ne: req.user._id } };

    if (department && department !== "All") filter.department = department;

    const re = searchRegex(search);
    if (re) {
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

    const [docs, total] = await Promise.all([
      model.find(filter).select(fields).skip(skip).limit(limit).lean(),
      model.countDocuments(filter),
    ]);
    return {
      docs: docs.map((d) => ({
        ...d,
        role,
        availableSlots: (d.mentorshipSlots || [])
          .filter((s) => !s.booked)
          .map((s) => ({ ...s, id: s.id || `${s.day}-${s.time}` })),
      })),
      total,
    };
  });

  const results = await Promise.all(mentorQueries);
  const mentors = results.flatMap((r) => r.docs);
  const total = results.reduce((sum, r) => sum + r.total, 0);
  mentors.sort((a, b) => (b.mentorStats?.score || 0) - (a.mentorStats?.score || 0));

  res.status(200).json({
    success: true,
    count: mentors.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    hasMore: page * limit < total,
    mentors,
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// REQUEST LIFECYCLE
// ═════════════════════════════════════════════════════════════════════════════

export const createMentorshipRequest = catchAsyncError(async (req, res, next) => {
  const user = req.user;
  if (user.constructor.modelName !== "Student") {
    return next(new ErrorHandler("Only students can send mentorship requests.", 403));
  }

  const { mentorId, goal, slot, note } = req.body;
  if (!mentorId || !goal || !slot?.day || !slot?.time) {
    return next(new ErrorHandler("mentorId, goal and slot (day/time) are required.", 400));
  }

  const { mentor, mentorRole } = await findMentorById(mentorId);
  if (!mentor || !mentor.accountVerified || !mentor.adminVerified || mentor.isBlocked || !mentor.availableForMentorship) {
    return next(new ErrorHandler("Mentor not found or unavailable for mentorship.", 404));
  }

  const mentorSlot = (mentor.mentorshipSlots || []).find(
    (s) => s.day === slot.day && s.time === slot.time
  );
  if (!mentorSlot || mentorSlot.booked) {
    return next(new ErrorHandler("Selected slot is not available.", 400));
  }

  const duplicatePending = await MentorshipRequest.findOne({
    "student.id": user._id,
    "mentor.id": mentor._id,
    status: "Pending",
  });
  if (duplicatePending) {
    return next(new ErrorHandler("You already have a pending request with this mentor.", 409));
  }

  // ── Fix 1: One booking per mentor per week ────────────────────────────────
  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Sunday of current week

  const weeklyBookingWithSameMentor = await MentorshipRequest.findOne({
    "student.id": user._id,
    "mentor.id": mentor._id,
    status: { $in: ["Accepted", "Pending"] },
    requestedAt: { $gte: weekStart },
  });
  if (weeklyBookingWithSameMentor) {
    return next(new ErrorHandler(
      "You can only book one session per mentor per week. Your existing session with this mentor is still active this week.",
      409
    ));
  }

  const slotAlreadyAccepted = await MentorshipRequest.findOne({
    "mentor.id": mentor._id,
    "slot.day": slot.day,
    "slot.time": slot.time,
    status: "Accepted",
  });
  if (slotAlreadyAccepted) {
    return next(new ErrorHandler("This slot is already booked by another student.", 409));
  }

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
    mentor: { id: mentor._id, name: mentor.name, role: mentorRole },
    goal,
    note,
    slot,
  });

  emitToUser(mentor._id, "mentorship:new_request", {
    requestId: request._id,
    student: request.student,
    goal: request.goal,
    slot: request.slot,
    note: request.note,
  });

  res.status(201).json({ success: true, request });
});

const MAX_REQUESTS = 200;

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

  // ?status=Pending or ?status=Accepted,Completed narrows the list
  if (req.query.status) {
    const statuses = String(req.query.status).split(",").map((s) => s.trim()).filter(Boolean);
    query.status = { $in: statuses };
  }

  // ?countOnly=true — badges and dashboard stats only need the number
  if (req.query.countOnly === "true") {
    const count = await MentorshipRequest.countDocuments(query);
    return res.status(200).json({ success: true, count });
  }

  // Newest first, capped so one account's long history can't produce a huge response
  const limit = Math.min(MAX_REQUESTS, Math.max(1, parseInt(req.query.limit) || MAX_REQUESTS));
  const requests = await MentorshipRequest.find(query).sort({ createdAt: -1 }).limit(limit).lean();
  res.status(200).json({ success: true, count: requests.length, requests });
});

// ── PUT /api/v1/mentorship/requests/:requestId/respond ───────────────────────
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
    const mentorModel = getMentorModel(role);

    // 1. Atomic slot booking — only succeeds if slot is still free
    const updatedMentor = await mentorModel.findOneAndUpdate(
      {
        _id: user._id,
        "mentorshipSlots.day": mentorship.slot.day,
        "mentorshipSlots.time": mentorship.slot.time,
        "mentorshipSlots.booked": false,
      },
      { $set: { "mentorshipSlots.$.booked": true } },
      { new: true }
    );

    if (!updatedMentor) {
      return next(new ErrorHandler("This slot was just booked. Please reject this request.", 409));
    }
    await invalidateCache("mentors"); // the slot no longer shows as free

    // 2. Weekly limit check
    const weekStart = new Date();
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    // Sessions accepted this week count toward the limit even once completed
    // (counting only "Accepted" let a mentor accept, complete, and accept again)
    const weeklyAccepted = await MentorshipRequest.countDocuments({
      "mentor.id": user._id,
      status: { $in: ["Accepted", "Completed"] },
      respondedAt: { $gte: weekStart },
      _id: { $ne: mentorship._id },
    });
    if (weeklyAccepted >= (updatedMentor.weeklyLimit || 5)) {
      await mentorModel.findOneAndUpdate(
        {
          _id: user._id,
          "mentorshipSlots.day": mentorship.slot.day,
          "mentorshipSlots.time": mentorship.slot.time,
        },
        { $set: { "mentorshipSlots.$.booked": false } }
      );
      return next(new ErrorHandler("You have reached your weekly session limit. Increase it in Settings to accept more.", 400));
    }

    // 3. Auto-generate Google Meet link
    let generatedMeetLink = null;
    let sessionDateTime = null;

    try {
      // ── KEY FIX: must use .select("+googleTokens") ──
      // googleTokens has select:false in the schema — without this it is undefined
      const mentorWithTokens = await mentorModel
        .findById(user._id)
        .select(
          "+googleTokens.access_token +googleTokens.refresh_token +googleTokens.scope +googleTokens.token_type +googleTokens.expiry_date"
        )
        .lean();

      if (mentorWithTokens?.googleTokens?.refresh_token) {
        // Convert "Mon" + "10:00 AM" → next real ISO datetime
        const startISO = getNextSlotISO(mentorship.slot.day, mentorship.slot.time);
        sessionDateTime = new Date(startISO); // Store as Date object for cron

        // Fetch student email to add as Google Calendar attendee
        const studentForMeet = await Student
          .findById(mentorship.student.id)
          .select("email")
          .lean();

        generatedMeetLink = await createGoogleMeetLink(mentorWithTokens.googleTokens, {
          requestId: mentorship._id.toString(),
          studentName: mentorship.student.name,
          mentorName: user.name,
          studentEmail: studentForMeet?.email || "",
          mentorEmail: user.email,
          goal: mentorship.goal,
          startISO,
        });
      }
    } catch (err) {
      // Never block acceptance if Google fails — mentor can share link via chat
      console.error(`❌ Google Meet generation failed for request ${mentorship._id}:`, err.message);
    }

    // 4. Save acceptance + Meet link + session datetime
    mentorship.status = "Accepted";
    mentorship.respondedAt = new Date();
    mentorship.meetingLink = generatedMeetLink;
    mentorship.sessionDateTime = sessionDateTime; // Enables the 15-min cron job
    await mentorship.save();

    // Update mentor stats
    const responseMs = mentorship.requestedAt
      ? new Date() - new Date(mentorship.requestedAt)
      : 0;
    await mentorModel.findByIdAndUpdate(user._id, {
      $inc: {
        "mentorStats.acceptedRequests": 1,
        "mentorStats.totalRequests": 1,
      },
      $set: { "mentorStats.avgResponseMs": responseMs },
    });

    // 5. Auto-reject other Pending requests for same slot
    const conflictingRequests = await MentorshipRequest.find({
      _id: { $ne: mentorship._id },
      "mentor.id": user._id,
      "slot.day": mentorship.slot.day,
      "slot.time": mentorship.slot.time,
      status: "Pending",
    }).lean();

    if (conflictingRequests.length > 0) {
      await MentorshipRequest.updateMany(
        { _id: { $in: conflictingRequests.map(r => r._id) } },
        { status: "Rejected", respondedAt: new Date() }
      );

      for (const cr of conflictingRequests) {
        emitToUser(cr.student.id, "mentorship:slot_taken", {
          requestId: cr._id,
          mentorName: user.name,
          slot: cr.slot,
        });

        const student = await Student.findById(cr.student.id).select("email").lean();
        if (student?.email) {
          sendEmail({
            email: student.email,
            subject: "Mentorship Slot No Longer Available",
            message: mentorshipSlotTakenEmail({
              studentName: cr.student.name,
              mentorName: user.name,
              slotDay: cr.slot.day,
              slotTime: cr.slot.time,
            }),
          }).catch(console.error);
        }
      }
    }

    // Socket: notify accepted student
    emitToUser(mentorship.student.id, "mentorship:accepted", {
      requestId: mentorship._id,
      mentorName: user.name,
      mentorRole: role,
      slot: mentorship.slot,
      goal: mentorship.goal,
      meetingLink: generatedMeetLink,
    });

    // Socket: notify mentor (self) for tab refresh
    emitToUser(user._id, "mentorship:request_responded", {
      requestId: mentorship._id,
      status: "Accepted",
    });

    // ── Fix 5: Auto-post meeting link to the student–mentor conversation ──
    // (postChatMessage also pushes it to both users over the socket)
    await postChatMessage({
      sender: { id: user._id, name: user.name, role: user.constructor.modelName },
      recipientId: mentorship.student.id,
      mentorshipId: mentorship._id,
      ...(generatedMeetLink
        ? {
          text: `🎉 Session confirmed! Here is your meeting link:\n${generatedMeetLink}`,
          meetingLink: generatedMeetLink,
        }
        // No Google Calendar linked — mentor will share link manually via chat
        : { text: `✅ Your session request has been accepted! Use this chat to coordinate meeting details.` }),
    });

    // Emails to both parties (fire-and-forget)
    const acceptedStudent = await Student.findById(mentorship.student.id).select("email").lean();
    if (acceptedStudent?.email) {
      sendEmail({
        email: acceptedStudent.email,
        subject: `✅ Mentorship Accepted by ${user.name}`,
        message: mentorshipAcceptedStudentEmail({
          studentName: mentorship.student.name,
          mentorName: user.name,
          mentorRole: role,
          goal: mentorship.goal,
          slotDay: mentorship.slot.day,
          slotTime: mentorship.slot.time,
          meetingLink: generatedMeetLink,
        }),
      }).catch(console.error);
    }

    sendEmail({
      email: user.email,
      subject: `📋 Session Confirmed with ${mentorship.student.name}`,
      message: mentorshipAcceptedMentorEmail({
        mentorName: user.name,
        studentName: mentorship.student.name,
        studentDept: mentorship.student.department,
        studentYear: mentorship.student.year,
        goal: mentorship.goal,
        slotDay: mentorship.slot.day,
        slotTime: mentorship.slot.time,
        meetingLink: generatedMeetLink,
      }),
    }).catch(console.error);

  } else {
    // Rejection path
    mentorship.status = "Rejected";
    mentorship.respondedAt = new Date();
    await mentorship.save();

    await getMentorModel(role).findByIdAndUpdate(user._id, {
      $inc: { "mentorStats.totalRequests": 1 },
    });

    emitToUser(mentorship.student.id, "mentorship:rejected", {
      requestId: mentorship._id,
      mentorName: user.name,
      slot: mentorship.slot,
    });

    const rejectedStudent = await Student.findById(mentorship.student.id).select("email").lean();
    if (rejectedStudent?.email) {
      sendEmail({
        email: rejectedStudent.email,
        subject: `Mentorship Request Update from ${user.name}`,
        message: mentorshipRejectedStudentEmail({
          studentName: mentorship.student.name,
          mentorName: user.name,
          slotDay: mentorship.slot.day,
          slotTime: mentorship.slot.time,
        }),
      }).catch(console.error);
    }
  }

  res.status(200).json({ success: true, mentorship });
});

export const cancelMentorshipRequest = catchAsyncError(async (req, res, next) => {
  const user = req.user;
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

  emitToUser(mentorship.mentor.id, "mentorship:request_cancelled", {
    requestId: mentorship._id,
    studentName: mentorship.student.name,
  });

  res.status(200).json({ success: true, mentorship });
});

export const completeMentorshipSession = catchAsyncError(async (req, res, next) => {
  const user = req.user;
  const role = user.constructor.modelName;
  const mentorship = await MentorshipRequest.findById(req.params.requestId);

  if (!mentorship) return next(new ErrorHandler("Mentorship session not found.", 404));
  if (!mentorship.mentor.id.equals(user._id)) return next(new ErrorHandler("Not authorized.", 403));
  if (mentorship.status !== "Accepted") {
    return next(new ErrorHandler("Only accepted sessions can be marked complete.", 400));
  }

  // Atomic: two clicks (or two tabs) can't complete — and count — a session twice
  const completed = await MentorshipRequest.findOneAndUpdate(
    { _id: mentorship._id, status: "Accepted" },
    { $set: { status: "Completed", completedAt: new Date() } },
    { new: true }
  );
  if (!completed) return next(new ErrorHandler("Only accepted sessions can be marked complete.", 400));
  mentorship.status = completed.status;
  mentorship.completedAt = completed.completedAt;

  // $inc can't lose concurrent updates; the score is then recomputed from fresh stats
  const MentorModel = getMentorModel(role);
  const updatedMentor = await MentorModel.findByIdAndUpdate(
    user._id,
    { $inc: { "mentorStats.totalSessions": 1 } },
    { new: true, projection: { mentorStats: 1 } }
  ).lean();
  if (updatedMentor) {
    await MentorModel.updateOne(
      { _id: user._id },
      { $set: { "mentorStats.score": computeMentorScore(updatedMentor.mentorStats || {}) } }
    );
  }

  await getMentorModel(role).findOneAndUpdate(
    {
      _id: user._id,
      "mentorshipSlots.day": mentorship.slot.day,
      "mentorshipSlots.time": mentorship.slot.time,
    },
    { $set: { "mentorshipSlots.$.booked": false } }
  );
  await invalidateCache("mentors");

  emitToUser(mentorship.student.id, "mentorship:completed", {
    requestId: mentorship._id,
    mentorName: user.name,
  });

  // Also notify mentor (other open tabs) to refresh in real time
  emitToUser(user._id, "mentorship:completed", {
    requestId: mentorship._id,
    studentName: mentorship.student?.name,
  });

  res.status(200).json({ success: true, mentorship });
});

export const setMeetingLink = catchAsyncError(async (req, res, next) => {
  const user = req.user;
  const { link } = req.body;
  const mentorship = await MentorshipRequest.findById(req.params.requestId);

  if (!mentorship) return next(new ErrorHandler("Session not found.", 404));
  if (!mentorship.mentor.id.equals(user._id)) return next(new ErrorHandler("Not authorized.", 403));
  if (mentorship.status !== "Accepted") return next(new ErrorHandler("Can only set link on active sessions.", 400));
  if (!link) return next(new ErrorHandler("Meeting link is required.", 400));
  if (!isSafeUrl(link)) return next(new ErrorHandler("Meeting link must be a full http(s) link, e.g. https://meet.google.com/…", 400));

  mentorship.meetingLink = link;
  await mentorship.save();

  await postChatMessage({
    sender: { id: user._id, name: user.name, role: user.constructor.modelName },
    recipientId: mentorship.student.id,
    mentorshipId: mentorship._id,
    text: `📎 Meeting Link: ${link}`,
    meetingLink: link,
  });

  res.status(200).json({ success: true, meetingLink: link });
});

// ═════════════════════════════════════════════════════════════════════════════
// RATING
// ═════════════════════════════════════════════════════════════════════════════

export const rateSession = catchAsyncError(async (req, res, next) => {
  const user = req.user;
  if (user.constructor.modelName !== "Student") {
    return next(new ErrorHandler("Only students can rate sessions.", 403));
  }

  const value = Number(req.body.value);
  const feedback = req.body.feedback;
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    return next(new ErrorHandler("Rating value must be a whole number from 1 to 5.", 400));
  }

  const mentorship = await MentorshipRequest.findById(req.params.requestId);
  if (!mentorship) return next(new ErrorHandler("Session not found.", 404));
  if (!mentorship.student.id.equals(user._id)) {
    return next(new ErrorHandler("You can only rate your own sessions.", 403));
  }
  if (mentorship.status !== "Completed") {
    return next(new ErrorHandler("You can only rate completed sessions.", 400));
  }

  // Atomic: only succeeds if the session has no rating yet, so a double submit
  // can't count twice toward the mentor's average
  const rating = { value, feedback: String(feedback ?? "").trim().slice(0, 500), ratedAt: new Date() };
  const rated = await MentorshipRequest.findOneAndUpdate(
    { _id: mentorship._id, $or: [{ "rating.value": null }, { "rating.value": { $exists: false } }] },
    { $set: { rating } },
    { new: true }
  );
  if (!rated) return next(new ErrorHandler("You have already rated this session.", 409));
  mentorship.rating = rated.rating;

  const MentorModel = getMentorModel(mentorship.mentor.role);
  const mentorDoc = await MentorModel.findByIdAndUpdate(
    mentorship.mentor.id,
    { $inc: { "mentorStats.totalRatings": 1, "mentorStats.sumRatings": value } },
    { new: true, projection: { mentorStats: 1 } }
  ).lean();
  if (mentorDoc) {
    const stats = mentorDoc.mentorStats || {};
    const averageRating = Math.round(((stats.sumRatings || 0) / Math.max(stats.totalRatings || 1, 1)) * 10) / 10;
    await MentorModel.updateOne(
      { _id: mentorship.mentor.id },
      { $set: { "mentorStats.averageRating": averageRating, "mentorStats.score": computeMentorScore({ ...stats, averageRating }) } }
    );
  }

  // Notify mentor in real time (so stats/history refresh immediately)
  emitToUser(mentorship.mentor.id, "mentorship:rating_submitted", {
    requestId: mentorship._id,
    studentName: mentorship.student?.name,
    rating: mentorship.rating,
  });

  res.status(200).json({ success: true, message: "Rating submitted.", rating: mentorship.rating });
});

// ═════════════════════════════════════════════════════════════════════════════
// MENTOR STATS
// ═════════════════════════════════════════════════════════════════════════════

export const getMyMentorStats = catchAsyncError(async (req, res, next) => {
  const user = req.user;
  const role = user.constructor.modelName;
  if (!["Alumni", "Teacher"].includes(role)) {
    return next(new ErrorHandler("Only mentors can view their stats.", 403));
  }

  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());

  const weeklyCount = await MentorshipRequest.countDocuments({
    "mentor.id": user._id,
    status: { $in: ["Accepted", "Completed"] },
    respondedAt: { $gte: weekStart },
  });

  const ratedSessions = await MentorshipRequest.find({
    "mentor.id": user._id,
    status: "Completed",
    "rating.value": { $ne: null, $exists: true },
  }).select("student goal slot rating completedAt").sort({ completedAt: -1 }).lean();

  // ── Always re-fetch from DB so we get the latest $set values, not the stale req.user snapshot ──
  const freshMentor = await getMentorModel(role).findById(user._id)
    .select("mentorStats weeklyLimit")
    .lean();
  const stats = freshMentor?.mentorStats || {};


  res.status(200).json({
    success: true,
    weeklyCount,
    weeklyLimit: freshMentor?.weeklyLimit || user.weeklyLimit || 5,
    stats: {
      totalSessions: stats.totalSessions || 0,
      averageRating: stats.averageRating || 0,
      totalRatings: stats.totalRatings || 0,
      acceptanceRate: stats.totalRequests > 0
        ? Math.round((stats.acceptedRequests / stats.totalRequests) * 100)
        : 0,
      score: stats.score || 0,
    },
    ratedSessions,
  });
});
// ═════════════════════════════════════════════════════════════════════════════
// SMART MENTOR MATCHING  — GET /api/v1/mentorship/smart-match
// ═════════════════════════════════════════════════════════════════════════════
// Algorithm:
//   1. Department match         — 30 pts  (exact), 15 pts (CS↔IT cross-match)
//   2. Skills overlap           — up to 25 pts  (5 pts per shared skill, max 5 skills)
//   3. Goal → mentor expertise  — up to 20 pts
//   4. Mentor score (0–10)      — up to 15 pts
//   5. Has free slots           — 10 pts bonus
// Total max ≈ 100 pts, returned sorted descending.

const GOAL_INDUSTRY_MAP = {
  career: ["Technology", "Finance", "Consulting", "Manufacturing", "Healthcare"],
  resume: [],   // any industry helps — will give partial bonus to all
  interview: ["Technology", "Finance", "Consulting"],
  technical: ["Technology", "Electronics", "Manufacturing"],
  general: [],   // any
};

// Department cross-match groups (partial credit if in same group)
const DEPT_GROUPS = [
  ["Computer Science", "Information Technology", "Computer Engineering"],
  ["Electronics", "Electrical", "Electronics and Communication"],
  ["Mechanical", "Civil", "Production Engineering"],
];

function deptGroupOf(dept) {
  return DEPT_GROUPS.find(g => g.some(d => dept?.toLowerCase().includes(d.toLowerCase())));
}

function skillSimilarity(studentSkills = [], mentorSkills = []) {
  if (!studentSkills.length || !mentorSkills.length) return 0;
  const sLower = studentSkills.map(s => s.toLowerCase());
  const mLower = mentorSkills.map(s => s.toLowerCase());
  const matches = sLower.filter(sk => mLower.some(ms => ms.includes(sk) || sk.includes(ms)));
  return Math.min(matches.length, 5) * 5; // 5 pts each, max 25 pts
}

export const smartMatchMentors = catchAsyncError(async (req, res) => {
  const user = req.user;
  if (user.constructor.modelName !== "Student") {
    return res.status(403).json({ success: false, message: "Only students can use smart match." });
  }

  const { goal = "general" } = req.query;
  const studentDept = user.department || "";
  const studentSkills = user.skills || [];
  const studentGroup = deptGroupOf(studentDept);

  // Fetch all available mentors
  const [alumniDocs, teacherDocs] = await Promise.all([
    Alumni.find({ ...BOOKABLE_MENTOR, _id: { $ne: user._id } })
      .select("name department industry currentDesignation skills bio linkedIn mentorshipSlots mentorStats graduationYear currentCompany")
      .lean(),
    Teacher.find(BOOKABLE_MENTOR)
      .select("name department designation experience qualifications skills bio linkedIn mentorshipSlots mentorStats")
      .lean(),
  ]);

  const mentors = [
    ...alumniDocs.map(d => ({ ...d, role: "Alumni" })),
    ...teacherDocs.map(d => ({ ...d, role: "Teacher" })),
  ];

  const preferredIndustries = GOAL_INDUSTRY_MAP[goal] || [];

  const scored = mentors.map(mentor => {
    let pts = 0;
    const breakdown = [];

    // 1. Department match (30 pts max)
    const mentorDept = mentor.department || "";
    const mentorGroup = deptGroupOf(mentorDept);
    if (mentorDept && studentDept &&
      mentorDept.toLowerCase() === studentDept.toLowerCase()) {
      pts += 30;
      breakdown.push("Same department (+30)");
    } else if (studentGroup && mentorGroup &&
      studentGroup.some(d => mentorGroup.includes(d))) {
      pts += 15;
      breakdown.push("Related department (+15)");
    }

    // 2. Skills overlap (up to 25 pts)
    const skillPts = skillSimilarity(studentSkills, mentor.skills || []);
    if (skillPts > 0) {
      pts += skillPts;
      breakdown.push(`Skills match (+${skillPts})`);
    }

    // 3. Goal → industry / designation (up to 20 pts)
    if (preferredIndustries.length > 0) {
      const mentorIndustry = mentor.industry || mentor.designation || "";
      if (preferredIndustries.some(ind =>
        mentorIndustry.toLowerCase().includes(ind.toLowerCase()))) {
        pts += 20;
        breakdown.push(`Goal-relevant industry (+20)`);
      } else {
        pts += 5; // partial — any mentor is somewhat helpful
        breakdown.push("General relevance (+5)");
      }
    } else {
      // "resume" or "general" — everyone gets partial
      pts += 8;
      breakdown.push("General guidance (+8)");
    }

    // 4. Mentor score (up to 15 pts)
    const scorePts = Math.round(((mentor.mentorStats?.score || 0) / 10) * 15);
    if (scorePts > 0) {
      pts += scorePts;
      breakdown.push(`Mentor score ${(mentor.mentorStats?.score || 0).toFixed(1)}/10 (+${scorePts})`);
    }

    // 5. Has free slots (10 pts bonus)
    const freeSlots = (mentor.mentorshipSlots || []).filter(s => !s.booked);
    if (freeSlots.length > 0) {
      pts += 10;
      breakdown.push(`${freeSlots.length} free slot(s) (+10)`);
    }

    const { badge, tier } = getMentorBadge(mentor.mentorStats?.score || 0);

    return {
      ...mentor,
      availableSlots: freeSlots.map(s => ({ ...s, id: s.id || `${s.day}-${s.time}` })),
      matchScore: pts,
      matchBreakdown: breakdown,
      badge,
      badgeTier: tier,
    };
  });

  // Sort by matchScore desc, filter out anyone with 0 pts (no overlap at all)
  const results = scored
    .filter(m => m.matchScore > 0 && (m.availableSlots?.length > 0))
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 20);

  res.status(200).json({
    success: true,
    count: results.length,
    goal,
    matchBasis: [
      "Department / branch alignment (30 pts)",
      "Shared skills overlap (up to 25 pts)",
      "Goal-relevant industry or expertise (up to 20 pts)",
      "Overall mentor score — rating, sessions, community posts (up to 15 pts)",
      "Free booking slots available (10 pts)",
    ],
    mentors: results,
  });
});
