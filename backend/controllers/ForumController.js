import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import ErrorHandler        from "../middlewares/error.js";
import { Question }        from "../models/ForumModel.js";
import { emitFeedUpdated } from "../Socket.js";
import { pageParams } from "../utils/pagination.js";

// ── Helper: build author object from req.user ─────────────────────────────────
function makeAuthor(user) {
  return {
    id:   user._id,
    name: user.name,
    role: user.constructor.modelName,
  };
}

// ── GET /api/v1/forum/questions ───────────────────────────────────────────────
// Query params: search, tag, sort (newest|top|unanswered), page, limit
export const getQuestions = catchAsyncError(async (req, res) => {
  const { search, tag, sort = "newest" } = req.query;
  const { page, limit, skip } = pageParams(req.query, { defaultLimit: 15, maxLimit: 50 });

  const filter = {};
  if (search) filter.$text = { $search: String(search) };
  if (tag && tag !== "all") filter.tags = String(tag);
  if (sort === "unanswered") filter["answers.0"] = { $exists: false };

  // "top" = most answers; counts are computed in MongoDB so answers aren't shipped
  const sortStage = sort === "top" ? { answerCount: -1, createdAt: -1 } : { createdAt: -1 };

  const [questions, total] = await Promise.all([
    Question.aggregate([
      { $match: filter },
      {
        $addFields: {
          answerCount: { $size: { $ifNull: ["$answers", []] } },
          topVotes: {
            $ifNull: [
              { $max: { $map: { input: { $ifNull: ["$answers", []] }, as: "a", in: { $size: { $ifNull: ["$$a.upvotes", []] } } } } },
              0,
            ],
          },
        },
      },
      { $sort: { ...sortStage, _id: -1 } },
      { $skip: skip },
      { $limit: limit },
      { $project: { title: 1, tags: 1, author: 1, views: 1, createdAt: 1, isClosed: 1, answerCount: 1, topVotes: 1 } },
    ]),
    Question.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    questions,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
});

// ── GET /api/v1/forum/questions/:questionId ───────────────────────────────────
// Full question with all answers sorted by upvotes desc
export const getQuestion = catchAsyncError(async (req, res, next) => {
  // viewedBy (every viewer's id) is internal — never sent to clients
  const question = await Question.findById(req.params.questionId).select("-viewedBy").lean();
  if (!question) return next(new ErrorHandler("Question not found.", 404));

  // Sort answers by upvote count descending
  const sorted = [...(question.answers || [])].sort(
    (a, b) => (b.upvotes?.length || 0) - (a.upvotes?.length || 0)
  );

  // Count one view per user, atomically (fire-and-forget)
  Question.updateOne(
    { _id: question._id, viewedBy: { $ne: req.user._id } },
    { $inc: { views: 1 }, $addToSet: { viewedBy: req.user._id } }
  ).catch((err) => console.error("[Forum] view count update failed:", err.message));

  res.status(200).json({
    success: true,
    question: { ...question, answers: sorted },
  });
});

// ── POST /api/v1/forum/questions ──────────────────────────────────────────────
// All authenticated users can post
export const createQuestion = catchAsyncError(async (req, res, next) => {
  const { title, body, tags } = req.body;
  if (!title?.trim()) return next(new ErrorHandler("Title is required.", 400));

  const question = await Question.create({
    author: makeAuthor(req.user),
    title:  title.trim(),
    body:   body?.trim() || "",
    tags:   Array.isArray(tags) ? tags : [],
  });

  emitFeedUpdated("forum");
  res.status(201).json({ success: true, question });
});

// ── DELETE /api/v1/forum/questions/:questionId ────────────────────────────────
// Only the author or Admin can delete
export const deleteQuestion = catchAsyncError(async (req, res, next) => {
  const question = await Question.findById(req.params.questionId);
  if (!question) return next(new ErrorHandler("Question not found.", 404));

  const role = req.user.constructor.modelName;
  const isAuthor = question.author.id.equals(req.user._id);
  const isAdmin  = role === "Admin";

  if (!isAuthor && !isAdmin) {
    return next(new ErrorHandler("You are not authorized to delete this question.", 403));
  }

  await question.deleteOne();
  emitFeedUpdated("forum");
  res.status(200).json({ success: true, message: "Question deleted." });
});

// ── POST /api/v1/forum/questions/:questionId/answers ─────────────────────────
// All authenticated users can answer
export const addAnswer = catchAsyncError(async (req, res, next) => {
  const { body } = req.body;
  if (!body?.trim()) return next(new ErrorHandler("Answer body is required.", 400));

  const question = await Question.findById(req.params.questionId);
  if (!question) return next(new ErrorHandler("Question not found.", 404));
  if (question.isClosed) return next(new ErrorHandler("This question is closed.", 400));

  question.answers.push({
    author: makeAuthor(req.user),
    body:   body.trim(),
    upvotes: [],
  });

  await question.save();

  // Return the newly added answer
  const newAnswer = question.answers[question.answers.length - 1];
  emitFeedUpdated("forum");
  res.status(201).json({ success: true, answer: newAnswer });
});

// ── DELETE /api/v1/forum/questions/:questionId/answers/:answerId ──────────────
export const deleteAnswer = catchAsyncError(async (req, res, next) => {
  const question = await Question.findById(req.params.questionId);
  if (!question) return next(new ErrorHandler("Question not found.", 404));

  const answer = question.answers.id(req.params.answerId);
  if (!answer) return next(new ErrorHandler("Answer not found.", 404));

  const role     = req.user.constructor.modelName;
  const isAuthor = answer.author.id.equals(req.user._id);
  const isAdmin  = role === "Admin";

  if (!isAuthor && !isAdmin) {
    return next(new ErrorHandler("Not authorized.", 403));
  }

  answer.deleteOne();
  await question.save();
  emitFeedUpdated("forum");
  res.status(200).json({ success: true, message: "Answer deleted." });
});

// ── PUT /api/v1/forum/questions/:questionId/answers/:answerId/upvote ──────────
// Toggle upvote — adds if not present, removes if already upvoted
export const toggleUpvote = catchAsyncError(async (req, res, next) => {
  const question = await Question.findById(req.params.questionId);
  if (!question) return next(new ErrorHandler("Question not found.", 404));

  const answer = question.answers.id(req.params.answerId);
  if (!answer) return next(new ErrorHandler("Answer not found.", 404));

  // Prevent authors from upvoting their own answer
  if (answer.author.id.equals(req.user._id)) {
    return next(new ErrorHandler("You cannot upvote your own answer.", 400));
  }

  const userId   = req.user._id.toString();
  const upvoted  = answer.upvotes.map(String).includes(userId);

  if (upvoted) {
    answer.upvotes = answer.upvotes.filter(id => id.toString() !== userId);
  } else {
    answer.upvotes.push(req.user._id);
  }

  await question.save();
  res.status(200).json({
    success: true,
    upvoted: !upvoted,
    voteCount: answer.upvotes.length,
  });
});
