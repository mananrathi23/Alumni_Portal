import cron from "node-cron";
import { runExclusive } from "../utils/cronLock.js";
import { Student } from "../models/StudentModel.js";
import { Teacher } from "../models/TeacherModel.js";
import { Alumni } from "../models/AlumniModel.js";
import { Admin } from "../models/AdminModel.js";

export const removeUnverifiedAccounts = () => {
  cron.schedule("*/30 * * * *", runExclusive("remove-unverified", 1500, async () => {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    const filter = {
      accountVerified: false,
      createdAt: { $lt: thirtyMinutesAgo },
    };

    try {
      await Promise.all([
        Student.deleteMany(filter),
        Teacher.deleteMany(filter),
        Alumni.deleteMany(filter),
        Admin.deleteMany(filter),
      ]);
    } catch (error) {
      console.error("[Cron Error] Failed to remove unverified accounts:", error.message);
    }
  }));
};