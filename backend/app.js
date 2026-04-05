import express from "express";
import { config } from "dotenv";
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
import { removeUnverifiedAccounts } from "./automation/removeUnverifiedAccounts.js";

export const app = express();
config({ path: "./.env" });

app.use(cors({
  origin:      [process.env.FRONTEND_URL],
  methods:     ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/v1/user",        userRouter);
app.use("/api/v1/connections", connectionRouter);
app.use("/api/v1/connection",  connectionRouter); // alias
app.use("/api/v1/people",      peopleRouter);
app.use("/api/v1/mentorship",  mentorshipRouter);
app.use("/api/v1/forum",       forumRouter);
app.use("/api/v1/events",      eventRouter);
app.use("/api/v1/jobs",        jobRouter);

removeUnverifiedAccounts();
connection();

app.use(errorMiddleware);
