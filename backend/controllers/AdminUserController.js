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
