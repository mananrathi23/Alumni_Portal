import mongoose from "mongoose";
import dotenv from "dotenv";
import { Student } from "./backend/models/StudentModel.js";
dotenv.config({ path: "./backend/.env" });

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const total = await Student.countDocuments();
  const accVerified = await Student.countDocuments({ accountVerified: true });
  const adminVerified = await Student.countDocuments({ adminVerified: true });
  const bothVerified = await Student.countDocuments({ accountVerified: true, adminVerified: true, isBlocked: false });
  console.log({ total, accVerified, adminVerified, bothVerified });
  mongoose.disconnect();
}
check();
