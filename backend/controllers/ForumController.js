import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import ErrorHandler        from "../middlewares/error.js";
import { Question }        from "../models/ForumModel.js";

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
  const { search, tag, sort = "newest", page = 1, limit = 15 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const filter = {};

  if (search) {
    filter.$text = { $search: search };
  }
  if (tag && tag !== "all") {
    filter.tags = tag;
  }

  let sortObj = { createdAt: -1 }; // newest
  if (sort === "top") sortObj = { "answers.0": -1, createdAt: -1 }; // most answers
  if (sort === "unanswered") filter["answers.0"] = { $exists: false };

  const [questions, total] = await Promise.all([
    Question.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(Number(limit))
      .select("title tags author answers views createdAt isClosed")
      .lean(),
    Question.countDocuments(filter),
  ]);

  // Enrich with answer count + top upvote count
  const enriched = questions.map(q => ({
    ...q,
    answerCount:  q.answers?.length || 0,
    topVotes:     q.answers?.length
      ? Math.max(...q.answers.map(a => a.upvotes?.length || 0))
      : 0,
    answers: undefined, // don't send full answers in list view
  }));

  res.status(200).json({
    success: true,
    questions: enriched,
    total,
    page:  Number(page),
    pages: Math.ceil(total / Number(limit)),
  });
});

// ── GET /api/v1/forum/questions/:questionId ───────────────────────────────────
// Full question with all answers sorted by upvotes desc
export const getQuestion = catchAsyncError(async (req, res, next) => {
  const question = await Question.findById(req.params.questionId).lean();
  if (!question) return next(new ErrorHandler("Question not found.", 404));

  // Sort answers by upvote count descending
  const sorted = [...(question.answers || [])].sort(
    (a, b) => (b.upvotes?.length || 0) - (a.upvotes?.length || 0)
  );

  // Increment view count (fire-and-forget)
  Question.findByIdAndUpdate(req.params.questionId, { $inc: { views: 1 } }).exec();

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
