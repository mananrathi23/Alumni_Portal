/**
 * ─────────────────────────────────────────────────────────────
 *  PLACEMENT ADMIN SEEDER — Run once to create placement admin
 *  Usage:  node seedPlacementAdmin.js
 *
 *  ⚠️  CHANGE the password before running in production!
 *  Placement admin credentials (save these securely):
 *    Email   : placement@alumniportal.com
 *    Password: Placement@1234
 * ─────────────────────────────────────────────────────────────
 */
import { config } from "dotenv";
config({ path: "./.env" });

import mongoose from "mongoose";
import { Admin } from "./models/AdminModel.js";

const ADMIN_EMAIL = "placement@alumniportal.com";
const ADMIN_PASSWORD = "Placement@1234";
const ADMIN_NAME = "Placement Cell";
const ADMIN_PHONE = "+919000000001"; // placeholder

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { dbName: "Alumni-Portal" });
    console.log("✅ Connected to MongoDB");

    const existing = await Admin.findOne({ email: ADMIN_EMAIL });
    if (existing) {
      console.log("⚠️  Placement admin already exists. Skipping.");
      process.exit(0);
    }

    const admin = new Admin({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      phone: ADMIN_PHONE,
      password: ADMIN_PASSWORD,
      accountVerified: true,
      adminLevel: "placement_admin",
      permissions: {
        manageUsers: false,
        manageEvents: true,
        manageJobs: true,
        manageForum: false,
        manageNews: true,
        manageAnnouncements: false,
        viewStudents: true,
      },
    });

    await admin.save();

    console.log("🎉 Placement admin created successfully!");
    console.log("─────────────────────────────");
    console.log("  Email   :", ADMIN_EMAIL);
    console.log("  Password:", ADMIN_PASSWORD);
    console.log("  Role    : Admin (placement_admin)");
    console.log("─────────────────────────────");
    console.log("🔐 Login at /login and use Role = Admin");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding placement admin:", err.message);
    process.exit(1);
  }
}

seed();

