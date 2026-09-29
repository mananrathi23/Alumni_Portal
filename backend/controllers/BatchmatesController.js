import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/error.js";
import { Student } from "../models/StudentModel.js";
import { Alumni } from "../models/AlumniModel.js";
import { searchRegex } from "../utils/escapeRegex.js";

const STUDENT_FIELDS = "name email department enrollmentYear year skills bio linkedIn github portfolio profilePhoto";
const ALUMNI_FIELDS  = "name email department enrollmentYear currentCompany currentDesignation industry skills bio linkedIn github profilePhoto";

// Members shown on each collapsed batch card
const PREVIEW_SIZE = 4;
const MAX_PAGE_SIZE = 50;

const toProjection = (fields, role) => ({
  ...Object.fromEntries(fields.split(" ").map((f) => [f, 1])),
  role: { $literal: role },
});

const buildFilter = (search) => {
  const filter = { accountVerified: true, adminVerified: true, isBlocked: false };
  const re = searchRegex(search);
  if (re) filter.name = re;
  return filter;
};

// Students and alumni live in separate collections; $unionWith lets one
// pipeline sort, group and paginate across both inside MongoDB.
const unionPipeline = (filter) => [
  { $match: filter },
  { $project: toProjection(STUDENT_FIELDS, "Student") },
  {
    $unionWith: {
      coll: Alumni.collection.name,
      pipeline: [{ $match: filter }, { $project: toProjection(ALUMNI_FIELDS, "Alumni") }],
    },
  },
];

// GET /api/v1/batchmates
// One card per enrollmentYear ("Class of YEAR") with counts and a small preview;
// members are loaded per batch via GET /api/v1/batchmates/:year.
export const getBatchmates = catchAsyncError(async (req, res) => {
  const groups = await Student.aggregate([
    ...unionPipeline(buildFilter(req.query.search)),
    { $sort: { name: 1, _id: 1 } },
    {
      $group: {
        _id: "$enrollmentYear",
        count:        { $sum: 1 },
        studentCount: { $sum: { $cond: [{ $eq: ["$role", "Student"] }, 1, 0] } },
        alumniCount:  { $sum: { $cond: [{ $eq: ["$role", "Alumni"] }, 1, 0] } },
        preview:      { $push: "$$ROOT" },
      },
    },
    { $project: { count: 1, studentCount: 1, alumniCount: 1, preview: { $slice: ["$preview", PREVIEW_SIZE] } } },
  ]);

  // Sort: newest year first, unset always last
  const batches = groups
    .map((g) => ({
      year: g._id ?? null,
      count: g.count,
      studentCount: g.studentCount,
      alumniCount: g.alumniCount,
      preview: g.preview,
    }))
    .sort((a, b) => {
      if (a.year === null) return  1;
      if (b.year === null) return -1;
      return b.year - a.year;
    });

  const totalUsers = batches.reduce((sum, b) => sum + b.count, 0);
  res.status(200).json({ success: true, totalUsers, batches });
});

// GET /api/v1/batchmates/:year?page=1&limit=24&search=
// `year` is a number, or "unset" for members without an enrollment year.
export const getBatchMembers = catchAsyncError(async (req, res, next) => {
  const { year } = req.params;
  const enrollmentYear = year === "unset" ? null : Number(year);
  if (enrollmentYear !== null && !Number.isInteger(enrollmentYear)) {
    return next(new ErrorHandler("Invalid batch year.", 400));
  }

  const page  = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(req.query.limit) || 24));

  // { enrollmentYear: null } also matches documents where the field is missing
  const filter = { ...buildFilter(req.query.search), enrollmentYear };

  const [result] = await Student.aggregate([
    ...unionPipeline(filter),
    { $sort: { name: 1, _id: 1 } },
    {
      $facet: {
        members: [{ $skip: (page - 1) * limit }, { $limit: limit }],
        total:   [{ $count: "n" }],
      },
    },
  ]);

  const total = result.total[0]?.n ?? 0;
  res.status(200).json({
    success: true,
    members: result.members,
    total,
    page,
    hasMore: page * limit < total,
  });
});
