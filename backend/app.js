import { config } from "dotenv";
config({ path: "./.env" });
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { connection } from "./database/dbConnection.js";
import { errorMiddleware } from "./middlewares/error.js";
import userRouter from "./routes/userRouter.js";
import connectionRouter from "./routes/ConnectionRouter.js";
import peopleRouter from "./routes/PeopleRouter.js";
import mentorshipRouter from "./routes/MentorshipRouter.js";
import forumRouter from "./routes/ForumRouter.js";
import eventRouter from "./routes/EventRouter.js";
import jobRouter from "./routes/JobRouter.js";
import newsRouter from "./routes/NewsRouter.js";
import batchmatesRouter from "./routes/BatchmatesRouter.js";
import incubationRouter from "./routes/IncubationRouter.js";
import oauthRouter from "./routes/OAuthRouter.js";
import adminUserRouter from "./routes/AdminUserRouter.js";
import supportRouter from "./routes/SupportRouter.js";
import { removeUnverifiedAccounts } from "./automation/removeUnverifiedAccounts.js";
import { expireMentorshipRequests } from "./automation/expireMentorshipRequests.js";

export const app = express();
app.set("trust proxy", 1); // Trust first proxy to fix express-rate-limit issues

// ── Fix 2: Gzip compression for all responses (~70% size reduction) ────────────
app.use(compression());

app.use(cors({
  origin: [process.env.FRONTEND_URL],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
}));

app.use(cookieParser());

// ── Fix 2: Reduce body size limit from 50mb → 2mb ─────────────────────────────
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// ── Fix 3: Rate limiting ───────────────────────────────────────────────────────
// Global: 1000 requests per 15 minutes per IP
// Disabled in test environment
const globalLimiter = process.env.NODE_ENV === "test"
  ? (req, res, next) => next()
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 1000,
      standardHeaders: true,
      legacyHeaders: false,
      message: { success: false, message: "Too many requests, please try again later." },
    });

// Strict: 10 requests per 15 minutes for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many login attempts, please try again in 15 minutes." },
});

// Support chat: 20 requests per 5 minutes
const supportLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many support messages, please slow down." },
});

app.use(globalLimiter);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/v1/user", userRouter);  // route-level limiting inside userRouter.js
app.use("/api/v1/connections", connectionRouter);
app.use("/api/v1/connection", connectionRouter); // alias
app.use("/api/v1/people", peopleRouter);
app.use("/api/v1/mentorship", mentorshipRouter);
app.use("/api/v1/forum", forumRouter);
app.use("/api/v1/events", eventRouter);
app.use("/api/v1/jobs", jobRouter);
app.use("/api/v1/news", newsRouter);
app.use("/api/v1/batchmates", batchmatesRouter);
app.use("/api/v1/incubation", incubationRouter);
app.use("/api/v1/oauth", oauthRouter);
app.use("/api/v1/admin/users", adminUserRouter);
app.use("/api/v1/support", supportLimiter, supportRouter);
// Alias matching what was registered in Google Console
app.use("/auth", oauthRouter);

removeUnverifiedAccounts();
expireMentorshipRequests();
connection();

app.use(errorMiddleware);
