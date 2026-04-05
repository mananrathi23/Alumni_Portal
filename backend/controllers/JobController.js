import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import ErrorHandler        from "../middlewares/error.js";
import { Job }             from "../models/JobModel.js";

const POSTER_ROLES = ["Admin", "Alumni", "Teacher"];

// ── GET /api/v1/jobs ──────────────────────────────────────────────────────────
// Query: search, type, mine, page, limit
export const getJobs = catchAsyncError(async (req, res) => {
  const { search, type, mine, page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const filter = { isActive: true };

  if (search) {
    filter.$text = { $search: search };
  }
  if (type && type !== "all") {
    filter.type = type;
  }
  if (mine === "true") {
    filter["postedBy.id"] = req.user._id;
  }

  // Hide expired jobs (past deadline) unless fetching own
  if (mine !== "true") {
    filter.$or = [
      { deadline: { $exists: false } },
      { deadline: null },
      { deadline: { $gte: new Date() } },
    ];
  }

  const [jobs, total] = await Promise.all([
    Job.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    Job.countDocuments(filter),
  ]);

  res.status(200).json({ success: true, jobs, total });
});

// ── GET /api/v1/jobs/:jobId ───────────────────────────────────────────────────
export const getJob = catchAsyncError(async (req, res, next) => {
  const job = await Job.findById(req.params.jobId).lean();
  if (!job || !job.isActive) return next(new ErrorHandler("Job not found.", 404));
  res.status(200).json({ success: true, job });
});

// ── POST /api/v1/jobs ─────────────────────────────────────────────────────────
// Only Admin, Alumni, Teacher
export const createJob = catchAsyncError(async (req, res, next) => {
  const role = req.user.constructor.modelName;
  if (!POSTER_ROLES.includes(role)) {
    return next(new ErrorHandler("Only Admin, Alumni, and Teachers can post jobs.", 403));
  }

  const { company, role: jobRole, description, eligibility, link, type, skills, deadline } = req.body;

  if (!company?.trim())     return next(new ErrorHandler("Company name is required.", 400));
  if (!jobRole?.trim())     return next(new ErrorHandler("Role/position is required.", 400));
  if (!description?.trim()) return next(new ErrorHandler("Description is required.", 400));

  const job = await Job.create({
    company:     company.trim(),
    role:        jobRole.trim(),
    description: description.trim(),
    eligibility: eligibility?.trim() || "",
    link:        link?.trim() || "",
    type:        type || "full-time",
    skills:      Array.isArray(skills) ? skills : [],
    deadline:    deadline ? new Date(deadline) : null,
    postedBy: {
      id:   req.user._id,
      name: req.user.name,
      role,
    },
  });

  res.status(201).json({ success: true, job });
});

// ── PUT /api/v1/jobs/:jobId ───────────────────────────────────────────────────
// Poster or Admin can edit
export const updateJob = catchAsyncError(async (req, res, next) => {
  const job = await Job.findById(req.params.jobId);
  if (!job || !job.isActive) return next(new ErrorHandler("Job not found.", 404));

  const role     = req.user.constructor.modelName;
  const isPoster = job.postedBy.id.equals(req.user._id);
  if (!isPoster && role !== "Admin") {
    return next(new ErrorHandler("Not authorized to edit this job.", 403));
  }

  const allowed = ["company","role","description","eligibility","link","type","skills","deadline"];
  allowed.forEach(f => { if (req.body[f] !== undefined) job[f] = req.body[f]; });
  await job.save();

  res.status(200).json({ success: true, job });
});

// ── DELETE /api/v1/jobs/:jobId ────────────────────────────────────────────────
export const deleteJob = catchAsyncError(async (req, res, next) => {
  const job = await Job.findById(req.params.jobId);
  if (!job) return next(new ErrorHandler("Job not found.", 404));

  const role     = req.user.constructor.modelName;
  const isPoster = job.postedBy.id.equals(req.user._id);
  if (!isPoster && role !== "Admin") {
    return next(new ErrorHandler("Not authorized.", 403));
  }

  job.isActive = false;
  await job.save();
  res.status(200).json({ success: true, message: "Job removed." });
});
