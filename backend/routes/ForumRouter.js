import express from "express";
import { isAuthenticated, isVerifiedByAdmin } from "../middlewares/auth.js";
import {
  getQuestions, getQuestion, createQuestion, deleteQuestion,
  addAnswer, deleteAnswer, toggleUpvote,
} from "../controllers/ForumController.js";

const router = express.Router();
router.use(isAuthenticated);
router.use(isVerifiedByAdmin);

router.get("/questions",                                          getQuestions);
router.post("/questions",                                         createQuestion);
router.get("/questions/:questionId",                              getQuestion);
router.delete("/questions/:questionId",                           deleteQuestion);
router.post("/questions/:questionId/answers",                     addAnswer);
router.delete("/questions/:questionId/answers/:answerId",         deleteAnswer);
router.put("/questions/:questionId/answers/:answerId/upvote",     toggleUpvote);

export default router;
