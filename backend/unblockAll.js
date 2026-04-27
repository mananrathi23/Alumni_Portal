import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
import { Student } from "./models/StudentModel.js";
import { Alumni } from "./models/AlumniModel.js";
import { Teacher } from "./models/TeacherModel.js";
import { Connection } from "./models/ConnectionModel.js";
import { MentorshipRequest } from "./models/MentorshipRequestModel.js";

await mongoose.connect(process.env.MONGO_URI);
const [s, a, t, c, m] = await Promise.all([
  Student.updateMany({ isBlocked: true }, { isBlocked: false }),
  Alumni.updateMany({ isBlocked: true }, { isBlocked: false }),
  Teacher.updateMany({ isBlocked: true }, { isBlocked: false }),
  Connection.updateMany({ isBlocked: true }, { isBlocked: false }),
  MentorshipRequest.updateMany({ isBlocked: true }, { isBlocked: false }),
]);
console.log(`Unblocked -> Students:${s.modifiedCount} Alumni:${a.modifiedCount} Teachers:${t.modifiedCount} Connections:${c.modifiedCount} Mentorships:${m.modifiedCount}`);
await mongoose.disconnect();
process.exit(0);
