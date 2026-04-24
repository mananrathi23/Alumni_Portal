import express      from "express";
import multer       from "multer";
import { isAuthenticated } from "../middlewares/auth.js";
import {
  uploadResume,
  getMyResume,
  downloadResume,
  deleteResume,
} from "../controllers/ResumeController.js";

// Use memory storage — buffer is written to MongoDB as base64
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 5 * 1024 * 1024 }, // 5 MB hard limit
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files are accepted."), false);
  },
});

const router = express.Router();
router.use(isAuthenticated);

router.post("/upload",   upload.single("resume"), uploadResume);
router.get("/me",        getMyResume);
router.get("/download",  downloadResume);
router.delete("/",       deleteResume);

export default router;
