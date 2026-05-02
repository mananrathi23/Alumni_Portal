import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/error.js";
import { Student } from "../models/StudentModel.js";
import { Teacher } from "../models/TeacherModel.js";
import { Alumni } from "../models/AlumniModel.js";
import { Connection } from "../models/ConnectionModel.js";
import { MentorshipRequest } from "../models/MentorshipRequestModel.js";
import { emitToUser } from "../Socket.js";

// Helper to get model
function getModelByRole(role) {
  switch (role) {
    case "Student": return Student;
    case "Teacher": return Teacher;
    case "Alumni":  return Alumni;
    default:        return null;
  }
}

// ── GET ALL USERS ──────────────────────────────────────────────────────────
export const getAllUsers = catchAsyncError(async (req, res, next) => {
  const students = await Student.find().select("-password").lean();
  const teachers = await Teacher.find().select("-password").lean();
  const alumni   = await Alumni.find().select("-password").lean();

  const allUsers = [
    ...students.map(u => ({ ...u, role: "Student" })),
    ...teachers.map(u => ({ ...u, role: "Teacher" })),
    ...alumni.map(u => ({ ...u, role: "Alumni" })),
  ];

  // Sort by most recently seen first (active users at the top)
  allUsers.sort((a, b) => {
    if (a.lastSeenAt && b.lastSeenAt) return new Date(b.lastSeenAt) - new Date(a.lastSeenAt);
    if (a.lastSeenAt) return -1;
    if (b.lastSeenAt) return 1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  res.status(200).json({
    success: true,
    users: allUsers,
  });
});

// ── GET ALL ADMIN-VERIFIED STUDENTS (for Placement Cell) ───────────────────
// GET /api/v1/admin/students
export const getAllStudents = catchAsyncError(async (req, res, next) => {
  const { search, department, year, enrollmentYear } = req.query;

  const filter = {
    accountVerified: true,
    adminVerified: true,
    isBlocked: false,
  };

  // Optional filters
  if (search) {
    filter.$or = [
      { name:       { $regex: search, $options: "i" } },
      { department: { $regex: search, $options: "i" } },
      { email:      { $regex: search, $options: "i" } },
    ];
  }
  if (department && department !== "All") filter.department = department;
  if (year       && year !== "All")       filter.year = year;
  if (enrollmentYear && enrollmentYear !== "All") filter.enrollmentYear = Number(enrollmentYear);

  const students = await Student.find(filter)
    .select("name email department year enrollmentYear enrollmentNumber skills bio linkedIn github portfolio profilePhoto createdAt")
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    count: students.length,
    students,
  });
});

// ── TOGGLE VERIFY ──────────────────────────────────────────────────────────
export const toggleVerifyUser = catchAsyncError(async (req, res, next) => {
  const { role, id } = req.params;
  const Model = getModelByRole(role);
  if (!Model) return next(new ErrorHandler("Invalid role", 400));

  const user = await Model.findById(id);
  if (!user) return next(new ErrorHandler("User not found", 404));

  user.adminVerified = !user.adminVerified;
  await user.save({ validateModifiedOnly: true });

  // ✅ Notify the user in real-time so their dashboard updates immediately
  emitToUser(user._id, "user:verified", { adminVerified: user.adminVerified });

  res.status(200).json({
    success: true,
    message: `User ${user.adminVerified ? "verified" : "unverified"} successfully.`,
    user: { ...user.toObject(), role }
  });
});

// ── TOGGLE BLOCK ───────────────────────────────────────────────────────────
export const toggleBlockUser = catchAsyncError(async (req, res, next) => {
  const { role, id } = req.params;
  const Model = getModelByRole(role);
  if (!Model) return next(new ErrorHandler("Invalid role", 400));

  const user = await Model.findById(id);
  if (!user) return next(new ErrorHandler("User not found", 404));

  user.isBlocked = !user.isBlocked;
  await user.save({ validateModifiedOnly: true });

  // ✅ Notify the user in real-time
  emitToUser(user._id, "user:blocked", { isBlocked: user.isBlocked });

  res.status(200).json({
    success: true,
    message: `User ${user.isBlocked ? "blocked" : "unblocked"} successfully.`,
    user: { ...user.toObject(), role }
  });
});

// ── UNBLOCK CONNECTION ─────────────────────────────────────────────────────
export const unblockConnection = catchAsyncError(async (req, res, next) => {
  const connection = await Connection.findById(req.params.id);
  if (!connection) return next(new ErrorHandler("Connection not found.", 404));

  connection.isBlocked = false;
  await connection.save();

  res.status(200).json({
    success: true,
    message: "Connection unblocked successfully.",
    connection,
  });
});

// ── UNBLOCK MENTORSHIP ─────────────────────────────────────────────────────
export const unblockMentorship = catchAsyncError(async (req, res, next) => {
  const mentorship = await MentorshipRequest.findById(req.params.id);
  if (!mentorship) return next(new ErrorHandler("Mentorship request not found.", 404));

  mentorship.isBlocked = false;
  await mentorship.save();

  res.status(200).json({
    success: true,
    message: "Mentorship unblocked successfully.",
    mentorship,
  });
});

// ── ONE-TIME BACKFILL: recompute mentorStats from actual session data ────────
function computeScore(stats) {
  const rating        = Math.min((stats.averageRating || 0), 5) / 5 * 4;
  const sessions      = Math.min((stats.totalSessions || 0) / 20, 1) * 2.5;
  const acceptRate    = ((stats.acceptedRequests || 0) / Math.max(stats.totalRequests || 1, 1)) * 1.5;
  const maxMs         = 24 * 60 * 60 * 1000;
  const speed         = Math.max(0, (1 - Math.min((stats.avgResponseMs || 0) / maxMs, 1))) * 1.0;
  const jobsBonus     = Math.min((stats.jobsPosted || 0) / 10, 1) * 0.5;
  const eventsBonus   = Math.min((stats.eventsOrganized || 0) / 10, 1) * 0.5;
  return Math.min(Math.round((rating + sessions + acceptRate + speed + jobsBonus + eventsBonus) * 100) / 100, 10);
}

export const backfillMentorStats = catchAsyncError(async (req, res) => {
  const results = [];

  for (const [Model, roleName] of [[Alumni, "Alumni"], [Teacher, "Teacher"]]) {
    const mentors = await Model.find({}).select("_id name mentorStats").lean();

    for (const mentor of mentors) {
      const id = mentor._id;

      const [totalRequests, acceptedRequests, totalSessions, ratedSessions] = await Promise.all([
        MentorshipRequest.countDocuments({ "mentor.id": id }),
        MentorshipRequest.countDocuments({ "mentor.id": id, status: { $in: ["Accepted", "Completed"] } }),
        MentorshipRequest.countDocuments({ "mentor.id": id, status: "Completed" }),
        MentorshipRequest.find({ "mentor.id": id, status: "Completed", "rating.value": { $exists: true, $ne: null } })
          .select("rating").lean(),
      ]);

      const totalRatings   = ratedSessions.length;
      const sumRatings     = ratedSessions.reduce((acc, s) => acc + (s.rating?.value || 0), 0);
      const averageRating  = totalRatings > 0 ? Math.round((sumRatings / totalRatings) * 10) / 10 : 0;
      const existing       = mentor.mentorStats || {};
      const newStats       = { totalSessions, totalRatings, sumRatings, averageRating, totalRequests, acceptedRequests, avgResponseMs: existing.avgResponseMs || 0, jobsPosted: existing.jobsPosted || 0, eventsOrganized: existing.eventsOrganized || 0 };
      const score          = computeScore(newStats);

      await Model.findByIdAndUpdate(id, {
        $set: {
          "mentorStats.totalSessions":    totalSessions,
          "mentorStats.totalRatings":     totalRatings,
          "mentorStats.sumRatings":       sumRatings,
          "mentorStats.averageRating":    averageRating,
          "mentorStats.totalRequests":    totalRequests,
          "mentorStats.acceptedRequests": acceptedRequests,
          "mentorStats.score":            score,
        },
      });

      if (totalRequests > 0 || totalRatings > 0) {
        results.push({ role: roleName, name: mentor.name, totalSessions, totalRatings, averageRating, score });
      }
    }
  }

  res.status(200).json({ success: true, message: "Backfill complete.", updated: results });
});
