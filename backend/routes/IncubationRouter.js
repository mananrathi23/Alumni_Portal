import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import {
  getIdeas, getIdea, createIdea, updateIdea, deleteIdea,
  addComment, deleteComment, expressInterest, toggleUpvote,
} from "../controllers/IncubationController.js";

const router = express.Router();
router.use(isAuthenticated);

router.get("/",                                  getIdeas);
router.post("/",                                 createIdea);
router.get("/:id",                               getIdea);
router.put("/:id",                               updateIdea);
router.delete("/:id",                            deleteIdea);
router.post("/:id/comment",                      addComment);
router.delete("/:id/comment/:commentId",         deleteComment);
router.post("/:id/interest",                     expressInterest);
router.post("/:id/upvote",                       toggleUpvote);

export default router;
