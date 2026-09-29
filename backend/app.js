import { config } from "dotenv";
config({ path: "./.env" });
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import compression from "compression";
import { connection } from "./database/dbConnection.js";
import { errorMiddleware } from "./middlewares/error.js";
import userRouter from "./routes/userRouter.js";
import connectionRouter from "./routes/ConnectionRouter.js";
import conversationRouter from "./routes/ConversationRouter.js";
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
import healthRouter from "./routes/healthRouter.js";
import { removeUnverifiedAccounts } from "./automation/removeUnverifiedAccounts.js";
import { expireMentorshipRequests } from "./automation/expireMentorshipRequests.js";
import { backfillConversationKeys } from "./utils/conversations.js";
import { runExclusive } from "./utils/cronLock.js";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import { createLimiter, userOrIpKey } from "./utils/rateLimiter.js";

export const app = express();
app.set("trust proxy", 1); // Trust first proxy to fix express-rate-limit issues

// ── JWT Secret Security Validation ───────────────────────────────────────────
const jwtSecret = process.env.JWT_SECRET_KEY || "";
if (!jwtSecret || jwtSecret.length < 32) {
  console.error(
    "\n[SECURITY WARNING] JWT_SECRET_KEY is missing or too short (< 32 chars).\n" +
    "Generate a strong secret: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\"\n"
  );
  if (process.env.NODE_ENV === "production") {
    process.exit(1); // Refuse to start in production with a weak secret
  }
}

// ── Security Hardening ───────────────────────────────────────────────────────
app.use(helmet());
app.use(mongoSanitize());
// No HTML-escaping of input: text is stored as typed (React escapes it on screen,
// email templates escape it with utils/escapeHtml.js). Escaping on input turned
// "a < b" into "a &lt; b" everywhere it was shown.

// ── Fix 2: Gzip compression for all responses (~70% size reduction) ────────────
app.use(compression());

app.use(cors({
  origin: [process.env.FRONTEND_URL],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
}));

app.use(cookieParser());

// While shutting down, ask clients not to reuse this connection so they
// reconnect to a replica that is still running.
app.use((req, res, next) => {
  if (req.app.locals.shuttingDown) res.set("Connection", "close");
  next();
});

// ── Fix 2: Reduce body size limit from 50mb → 2mb ─────────────────────────────
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// ── Fix 3: Rate limiting ───────────────────────────────────────────────────────
// Limits are per logged-in user (per IP only for anonymous requests) and shared
// across instances via Redis — see utils/rateLimiter.js.
// Global: 1500 requests per 15 minutes
const globalLimiter = createLimiter({
  name: "global",
  windowMs: 15 * 60 * 1000,
  max: 1500,
  keyGenerator: userOrIpKey,
  message: "Too many requests, please try again later.",
});

// Support chat: 20 requests per 5 minutes
const supportLimiter = createLimiter({
  name: "support",
  windowMs: 5 * 60 * 1000,
  max: 20,
  keyGenerator: userOrIpKey,
  message: "Too many support messages, please slow down.",
});

app.use(globalLimiter);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/v1/user", userRouter);  // route-level limiting inside userRouter.js
app.use("/api/v1/connections", connectionRouter);
app.use("/api/v1/connection", connectionRouter); // alias
app.use("/api/v1/conversations", conversationRouter);
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
// Health check — no auth required (used by Docker HEALTHCHECK, Nginx, Uptime Kuma)
app.use("/api/v1/health", healthRouter);

removeUnverifiedAccounts();
expireMentorshipRequests();
connection().then(async (connected) => {
  if (!connected) return;
  // Move chat messages from before connection and mentorship chats were merged into
  // per-person conversations. Idempotent; the lock keeps replicas from racing.
  try {
    const migrated = await runExclusive("backfill-conversations", 600, backfillConversationKeys)();
    if (migrated) console.log(`[Chat] Moved ${migrated} older messages into conversations.`);
  } catch (err) {
    console.error("[Chat] Conversation backfill failed:", err.message);
  }
});

app.use(errorMiddleware);
