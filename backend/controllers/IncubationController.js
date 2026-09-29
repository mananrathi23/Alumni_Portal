import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/error.js";
import { Incubation } from "../models/IncubationModel.js";
import { emitToAll, emitFeedUpdated } from "../Socket.js";
import { searchRegex } from "../utils/escapeRegex.js";
import { findInvalidUrlField } from "../utils/validateUrl.js";

// Who expressed interest (and their messages) is for the idea's author only;
// everyone else sees a count and whether they themselves are interested.
const shapeIdea = (idea, user) => {
  const obj = typeof idea.toObject === "function" ? idea.toObject() : { ...idea };
  const me = user._id.toString();
  const interested = obj.interestedUsers || [];
  obj.interestedCount = interested.length;
  obj.amInterested = interested.some((u) => u.userId?.toString() === me);
  if (obj.authorId?.toString() !== me) obj.interestedUsers = [];
  return obj;
};

// ── GET all active ideas (feed) ───────────────────────────────────────────────
export const getIdeas = catchAsyncError(async (req, res) => {
  const { search, stage, tag, mine } = req.query;
  const user = req.user;

  const filter = { active: true };

  if (mine === "true") {
    filter.authorId = user._id;
  }
  if (stage && stage !== "all") {
    filter.stage = stage;
  }
  const tagRe = searchRegex(tag);
  if (tagRe) {
    filter.tags = tagRe;
  }
  const re = searchRegex(search);
  if (re) {
    filter.$or = [{ title: re }, { description: re }, { tags: re }];
  }

  const page  = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));

  const [ideas, total] = await Promise.all([
    Incubation.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select("-comments"), // exclude comments from list view for performance
    Incubation.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true, count: ideas.length, total, page, hasMore: page * limit < total,
    ideas: ideas.map((i) => shapeIdea(i, user)),
  });
});

// ── GET single idea with comments ─────────────────────────────────────────────
export const getIdea = catchAsyncError(async (req, res, next) => {
  const idea = await Incubation.findById(req.params.id);
  if (!idea || !idea.active) return next(new ErrorHandler("Idea not found.", 404));
  res.status(200).json({ success: true, idea: shapeIdea(idea, req.user) });
});

// ── POST create idea ──────────────────────────────────────────────────────────
export const createIdea = catchAsyncError(async (req, res, next) => {
  const user = req.user;
  const role = user.constructor.modelName;
  const { title, description, problemStatement, targetAudience, stage, tags, lookingFor, projectLink, repoLink } = req.body;

  if (!title || !description) {
    return next(new ErrorHandler("Title and description are required.", 400));
  }
  const badLink = findInvalidUrlField(req.body, ["projectLink", "repoLink"]);
  if (badLink) return next(new ErrorHandler(`${badLink} must be a full http(s) link, e.g. https://…`, 400));

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

  emitFeedUpdated("incubation");
  res.status(201).json({ success: true, message: "Idea posted successfully!", idea });
});

// ── PUT update idea (author only) ─────────────────────────────────────────────
export const updateIdea = catchAsyncError(async (req, res, next) => {
  const idea = await Incubation.findById(req.params.id);
  if (!idea || !idea.active) return next(new ErrorHandler("Idea not found.", 404));

  if (idea.authorId.toString() !== req.user._id.toString()) {
    return next(new ErrorHandler("Only the author can edit this idea.", 403));
  }

  const badLink = findInvalidUrlField(req.body, ["projectLink", "repoLink"]);
  if (badLink) return next(new ErrorHandler(`${badLink} must be a full http(s) link, e.g. https://…`, 400));

  const fields = ["title", "description", "problemStatement", "targetAudience", "stage", "tags", "lookingFor", "projectLink", "repoLink"];
  fields.forEach((f) => { if (req.body[f] !== undefined) idea[f] = req.body[f]; });

  await idea.save();
  emitFeedUpdated("incubation");
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
  emitFeedUpdated("incubation");
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

  const newComment = idea.comments[idea.comments.length - 1];

  // ✅ Broadcast new comment to all connected clients in real-time
  emitToAll("incubation:new_comment", {
    ideaId:  idea._id.toString(),
    comment: newComment,
    commentCount: idea.comments.length,
  });

  res.status(201).json({ success: true, message: "Comment added.", comments: idea.comments });
});

// ── DELETE comment (comment author only) ──────────────────────────────────────
export const deleteComment = catchAsyncError(async (req, res, next) => {
  const idea = await Incubation.findById(req.params.id);
  if (!idea) return next(new ErrorHandler("Idea not found.", 404));

  const comment = idea.comments.id(req.params.commentId);
  if (!comment) return next(new ErrorHandler("Comment not found.", 404));

  // The commenter, the idea's author, or an admin (moderation) may delete
  const me = req.user._id.toString();
  const canDelete = comment.authorId.toString() === me
    || idea.authorId.toString() === me
    || req.user.constructor.modelName === "Admin";
  if (!canDelete) {
    return next(new ErrorHandler("Not authorised.", 403));
  }

  comment.deleteOne();
  await idea.save();

  // ✅ Broadcast comment deletion to all connected clients
  emitToAll("incubation:comment_deleted", {
    ideaId:    idea._id.toString(),
    commentId: req.params.commentId,
    commentCount: idea.comments.length,
  });

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
// Atomic toggle: concurrent clicks can't add the same vote twice
export const toggleUpvote = catchAsyncError(async (req, res, next) => {
  const filter = { _id: req.params.id, active: true };
  const removed = await Incubation.findOneAndUpdate(
    { ...filter, upvotes: req.user._id },
    { $pull: { upvotes: req.user._id } },
    { new: true, projection: { upvotes: 1 } }
  );
  if (removed) {
    return res.status(200).json({ success: true, upvotes: removed.upvotes.length, upvoted: false });
  }

  const added = await Incubation.findOneAndUpdate(
    filter,
    { $addToSet: { upvotes: req.user._id } },
    { new: true, projection: { upvotes: 1 } }
  );
  if (!added) return next(new ErrorHandler("Idea not found.", 404));
  res.status(200).json({ success: true, upvotes: added.upvotes.length, upvoted: true });
});
