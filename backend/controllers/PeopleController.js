import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import { getMemberModel } from "../utils/userModels.js";
import { pageParams } from "../utils/pagination.js";
import { searchRegex } from "../utils/escapeRegex.js";

const MEMBER_ROLES = ["Student", "Alumni", "Teacher"];
const MENTOR_ROLES = ["Alumni", "Teacher"];

const FIELDS = {
  Student: "name email department year skills bio linkedIn github portfolio enrollmentNumber enrollmentYear profilePhoto",
  Alumni: "name email department graduationYear currentCompany currentDesignation industry skills bio linkedIn github availableForMentorship profilePhoto",
  Teacher: "name email department designation experience qualifications skills bio linkedIn github availableForMentorship profilePhoto",
};

// GET /api/v1/people?search=&filterRole=&department=&mentorOnly=true&page=&limit=
// Everyone sees every verified, unblocked member except themselves. Each role is
// paged separately (up to `limit` per role per page) and merged.
export const getPeople = catchAsyncError(async (req, res) => {
  const user = req.user;
  const { search, filterRole, department } = req.query;
  const { page, limit, skip } = pageParams(req.query, { defaultLimit: 20, maxLimit: 100 });
  const mentorOnly = req.query.mentorOnly === "true";

  let roles = MEMBER_ROLES.includes(filterRole) ? [filterRole] : MEMBER_ROLES;
  if (mentorOnly) roles = roles.filter((r) => MENTOR_ROLES.includes(r));

  const baseFilter = {
    accountVerified: true,
    adminVerified: true,          // hide users not yet verified by admin
    isBlocked: { $ne: true },     // hide blocked users
    _id: { $ne: user._id },       // never show yourself
  };
  const re = searchRegex(search);
  if (re) baseFilter.$or = [{ name: re }, { department: re }];
  if (department && department !== "All") baseFilter.department = String(department);
  if (mentorOnly) baseFilter.availableForMentorship = true;

  const results = await Promise.all(roles.map(async (role) => {
    const Model = getMemberModel(role);
    const [docs, total] = await Promise.all([
      Model.find(baseFilter).select(FIELDS[role]).skip(skip).limit(limit).lean(),
      Model.countDocuments(baseFilter),
    ]);
    return { docs: docs.map((d) => ({ ...d, role })), total };
  }));

  const people = results.flatMap((r) => r.docs);
  const total = results.reduce((sum, r) => sum + r.total, 0);

  res.status(200).json({
    success: true,
    count: people.length,
    total,
    page,
    // More pages exist while any role still has people beyond this page
    hasMore: results.some((r) => page * limit < r.total),
    people,
  });
});
