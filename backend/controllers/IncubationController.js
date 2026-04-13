import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/error.js";
import { Incubation } from "../models/IncubationModel.js";

// ── GET all active ideas (feed) ───────────────────────────────────────────────
export const getIdeas = catchAsyncError(async (req, res) => {
  const { search, stage, tag, mine } = req.query;
  const user = req.user;
  const role = user.constructor.modelName;

  const filter = { active: true };

  if (mine === "true") {
    filter.authorId = user._id;
  }
  if (stage && stage !== "all") {
    filter.stage = stage;
  }
  if (tag) {
    filter.tags = { $regex: tag, $options: "i" };
  }
  if (search) {
    filter.$or = [
      { title:       { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { tags:        { $regex: search, $options: "i" } },
    ];
  }

  const ideas = await Incubation.find(filter)
    .sort({ createdAt: -1 })
    .select("-comments"); // exclude comments from list view for performance

  res.status(200).json({ success: true, count: ideas.length, ideas });
});

// ── GET single idea with comments ─────────────────────────────────────────────
export const getIdea = catchAsyncError(async (req, res, next) => {
  const idea = await Incubation.findById(req.params.id);
  if (!idea || !idea.active) return next(new ErrorHandler("Idea not found.", 404));
  res.status(200).json({ success: true, idea });
});

// ── POST create idea ──────────────────────────────────────────────────────────
export const createIdea = catchAsyncError(async (req, res, next) => {
  const user = req.user;
  const role = user.constructor.modelName;
  const { title, description, problemStatement, targetAudience, stage, tags, lookingFor, projectLink, repoLink } = req.body;

  if (!title || !description) {
    return next(new ErrorHandler("Title and description are required.", 400));
  }

  const idea = await Incubation.create({
    title, description, problemStatement, targetAudience,
    stage:      stage      || "idea",
    tags:       tags       || [],
    lookingFor: lookingFor || [],
    projectLink: (["prototype","mvp"].includes(stage) ? projectLink?.trim() : "") || "",
    repoLink:    (["prototype","mvp"].includes(stage) ? repoLink?.trim()    : "") || "",
    authorId:   user._id,
    authorName: user.name,
    authorRole: role,
    authorDept: user.department || "",
  });

  res.status(201).json({ success: true, message: "Idea posted successfully!", idea });
});

// ── PUT update idea (author only) ─────────────────────────────────────────────
export const updateIdea = catchAsyncError(async (req, res, next) => {
  const idea = await Incubation.findById(req.params.id);
  if (!idea || !idea.active) return next(new ErrorHandler("Idea not found.", 404));

  if (idea.authorId.toString() !== req.user._id.toString()) {
    return next(new ErrorHandler("Only the author can edit this idea.", 403));
  }

  const fields = ["title", "description", "problemStatement", "targetAudience", "stage", "tags", "lookingFor", "projectLink", "repoLink"];
  fields.forEach((f) => { if (req.body[f] !== undefined) idea[f] = req.body[f]; });

  await idea.save();
  res.status(200).json({ success: true, message: "Idea updated.", idea });
});

// ── DELETE idea (author only) ─────────────────────────────────────────────────
export const deleteIdea = catchAsyncError(async (req, res, next) => {
  const idea = await Incubation.findById(req.params.id);
  if (!idea) return next(new ErrorHandler("Idea not found.", 404));

  const isAuthor = idea.authorId.toString() === req.user._id.toString();
  const isAdmin  = req.user.constructor.modelName === "Admin";
  if (!isAuthor && !isAdmin) {
    return next(new ErrorHandler("Not authorised to delete this idea.", 403));
  }

  idea.active = false;
  await idea.save();
  res.status(200).json({ success: true, message: "Idea removed." });
});

// ── POST add comment ──────────────────────────────────────────────────────────
export const addComment = catchAsyncError(async (req, res, next) => {
  const { text } = req.body;
  if (!text?.trim()) return next(new ErrorHandler("Comment text is required.", 400));

  const idea = await Incubation.findById(req.params.id);
  if (!idea || !idea.active) return next(new ErrorHandler("Idea not found.", 404));

  const user = req.user;
  const role = user.constructor.modelName;

  idea.comments.push({
    authorId:   user._id,
    authorName: user.name,
    authorRole: role,
    text:       text.trim(),
  });
  await idea.save();

  res.status(201).json({ success: true, message: "Comment added.", comments: idea.comments });
});

// ── DELETE comment (comment author only) ──────────────────────────────────────
export const deleteComment = catchAsyncError(async (req, res, next) => {
  const idea = await Incubation.findById(req.params.id);
  if (!idea) return next(new ErrorHandler("Idea not found.", 404));

  const comment = idea.comments.id(req.params.commentId);
  if (!comment) return next(new ErrorHandler("Comment not found.", 404));

  if (comment.authorId.toString() !== req.user._id.toString()) {
    return next(new ErrorHandler("Not authorised.", 403));
  }

  comment.deleteOne();
  await idea.save();
  res.status(200).json({ success: true, message: "Comment deleted." });
});

// ── POST express interest ─────────────────────────────────────────────────────
export const expressInterest = catchAsyncError(async (req, res, next) => {
  const idea = await Incubation.findById(req.params.id);
  if (!idea || !idea.active) return next(new ErrorHandler("Idea not found.", 404));

  const user = req.user;
  const role = user.constructor.modelName;
  const { type, message } = req.body;

  // Remove previous interest if re-submitting
  idea.interestedUsers = idea.interestedUsers.filter(
    (u) => u.userId?.toString() !== user._id.toString()
  );

  idea.interestedUsers.push({
    userId:  user._id,
    name:    user.name,
    role,
    type:    type    || "other",
    message: message || "",
  });

  await idea.save();
  res.status(200).json({ success: true, message: "Interest expressed!", count: idea.interestedUsers.length });
});

// ── POST toggle upvote ────────────────────────────────────────────────────────
export const toggleUpvote = catchAsyncError(async (req, res, next) => {
  const idea = await Incubation.findById(req.params.id);
  if (!idea || !idea.active) return next(new ErrorHandler("Idea not found.", 404));

  const uid = req.user._id.toString();
  const idx = idea.upvotes.findIndex((id) => id.toString() === uid);

  if (idx === -1) {
    idea.upvotes.push(req.user._id);
  } else {
    idea.upvotes.splice(idx, 1);
  }

  await idea.save();
  res.status(200).json({ success: true, upvotes: idea.upvotes.length, upvoted: idx === -1 });
});
