import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import { Student } from "../models/StudentModel.js";
import { Alumni } from "../models/AlumniModel.js";
import { Teacher } from "../models/TeacherModel.js";

// Everyone can see everyone:
// Student  → sees Alumni + Teachers + other Students
// Alumni   → sees Students + Teachers + other Alumni
// Teacher  → sees Students + Alumni + other Teachers
// Only restriction: you never see yourself
const visibleRoles = {
  Student: ["Student", "Alumni", "Teacher"],
  Alumni:  ["Student", "Alumni", "Teacher"],
  Teacher: ["Student", "Alumni", "Teacher"],
  Admin:   ["Student", "Alumni", "Teacher"],
};

// ── Fix 5: Paginated getPeople — page=1, limit=20 by default ─────────────────
// GET /api/v1/people
export const getPeople = catchAsyncError(async (req, res) => {
  const user    = req.user;
  const myRole  = user.constructor.modelName;
  const allowed = visibleRoles[myRole] || [];

  const { search, filterRole, department } = req.query;
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 20);
  const skip  = (page - 1) * limit;

  const rolesToQuery = filterRole && filterRole !== "All"
    ? [filterRole]
    : allowed;

  const searchFilter = search
    ? { $or: [
        { name:       { $regex: search, $options: "i" } },
        { department: { $regex: search, $options: "i" } },
      ]}
    : {};

  const deptFilter = department && department !== "All"
    ? { department }
    : {};

  const baseFilter = {
    accountVerified: true,
    adminVerified: true,   // hide users not yet verified by admin
    isBlocked: false,      // hide blocked users
    _id: { $ne: user._id }, // never show yourself
    ...searchFilter,
    ...deptFilter,
  };

  const fields = {
    Student: "name email department year skills bio linkedIn github portfolio enrollmentNumber enrollmentYear profilePhoto",
    Alumni:  "name email department graduationYear currentCompany currentDesignation industry skills bio linkedIn github availableForMentorship profilePhoto",
    Teacher: "name email department designation experience qualifications bio linkedIn profilePhoto",
  };

  // Run count + paginated find in parallel for each role
  const queries = rolesToQuery.map(async (role) => {
    let Model;
    if (role === "Student")      Model = Student;
    else if (role === "Alumni")  Model = Alumni;
    else if (role === "Teacher") Model = Teacher;
    else return { docs: [], total: 0 };

    const [docs, total] = await Promise.all([
      Model.find(baseFilter).select(fields[role]).skip(skip).limit(limit).lean(),
      Model.countDocuments(baseFilter),
    ]);
    return { docs: docs.map((d) => ({ ...d, role })), total };
  });

  const results = await Promise.all(queries);
  const people  = results.flatMap((r) => r.docs);
  const total   = results.reduce((sum, r) => sum + r.total, 0);

  res.status(200).json({
    success: true,
    count: people.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    hasMore: page * limit < total,
    people,
  });
});