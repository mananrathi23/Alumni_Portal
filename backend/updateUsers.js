import { config } from "dotenv";
config({ path: "./.env" });
import { connection } from "./database/dbConnection.js";
import { Student } from "./models/StudentModel.js";
import { Teacher } from "./models/TeacherModel.js";
import { Alumni } from "./models/AlumniModel.js";
import mongoose from "mongoose";

async function run() {
  try {
    await connection();
    console.log("Connected to database. Updating existing users...");

    await Student.updateMany({}, { $set: { adminVerified: true, isBlocked: false } });
    await Teacher.updateMany({}, { $set: { adminVerified: true, isBlocked: false } });
    await Alumni.updateMany({}, { $set: { adminVerified: true, isBlocked: false } });

    console.log("All users successfully updated!");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    mongoose.connection.close();
  }
}

run();
