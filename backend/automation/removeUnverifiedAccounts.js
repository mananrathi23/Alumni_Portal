import cron from "node-cron";
import { Student } from "../models/StudentModel.js";
import { Teacher } from "../models/TeacherModel.js";
import { Alumni } from "../models/AlumniModel.js";
import { Admin } from "../models/AdminModel.js";

export const removeUnverifiedAccounts = () => {
  cron.schedule("*/30 * * * *", async () => {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    const filter = {
      accountVerified: false,
      createdAt: { $lt: thirtyMinutesAgo },
    };

    await Student.deleteMany(filter);
    await Teacher.deleteMany(filter);
    await Alumni.deleteMany(filter);
    await Admin.deleteMany(filter);
  });
};