import { config } from "dotenv";
config({ path: "./.env" });
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { connection } from "./database/dbConnection.js";
import { errorMiddleware } from "./middlewares/error.js";
import userRouter       from "./routes/userRouter.js";
import connectionRouter from "./routes/ConnectionRouter.js";
import peopleRouter     from "./routes/PeopleRouter.js";
import mentorshipRouter from "./routes/MentorshipRouter.js";
import forumRouter      from "./routes/ForumRouter.js";
import eventRouter      from "./routes/EventRouter.js";
import jobRouter        from "./routes/JobRouter.js";
import newsRouter       from "./routes/NewsRouter.js";
import batchmatesRouter from "./routes/BatchmatesRouter.js";
import incubationRouter from "./routes/IncubationRouter.js";
import oauthRouter      from "./routes/OAuthRouter.js";
import adminUserRouter  from "./routes/AdminUserRouter.js";
import supportRouter    from "./routes/SupportRouter.js";
import { removeUnverifiedAccounts } from "./automation/removeUnverifiedAccounts.js";

export const app = express();

app.use(cors({
  origin:      [process.env.FRONTEND_URL],
  methods:     ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/v1/user",        userRouter);
app.use("/api/v1/connections", connectionRouter);
app.use("/api/v1/connection",  connectionRouter); // alias
app.use("/api/v1/people",      peopleRouter);
app.use("/api/v1/mentorship",  mentorshipRouter);
app.use("/api/v1/forum",       forumRouter);
app.use("/api/v1/events",      eventRouter);
app.use("/api/v1/jobs",        jobRouter);
app.use("/api/v1/news",        newsRouter);
app.use("/api/v1/batchmates",  batchmatesRouter);
app.use("/api/v1/incubation",  incubationRouter);
app.use("/api/v1/oauth",       oauthRouter);
app.use("/api/v1/admin/users", adminUserRouter);
app.use("/api/v1/support",     supportRouter);
// Alias matching what was registered in Google Console
app.use("/auth",              oauthRouter);

removeUnverifiedAccounts();
connection();

app.use(errorMiddleware);

// Trigger restart
