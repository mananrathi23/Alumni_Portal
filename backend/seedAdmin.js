/**
 * ─────────────────────────────────────────────────────────────
 *  ADMIN SEEDER — Run once to create the admin account
 *  Usage:  node seedAdmin.js
 *
 *  ⚠️  CHANGE the password before running in production!
 *  Admin credentials (save these securely):
 *    Email   : admin@alumniportal.com
 *    Password: Admin@1234
 * ─────────────────────────────────────────────────────────────
 */

import { config } from "dotenv";
config({ path: "./.env" });

import mongoose from "mongoose";
import { Admin } from "./models/AdminModel.js";

const ADMIN_EMAIL = "admin@alumniportal.com";
const ADMIN_PASSWORD = "Admin@1234";
const ADMIN_NAME = "Portal Admin";
const ADMIN_PHONE = "+919000000000"; // placeholder

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: "Alumni-Portal",
    })
    console.log("✅ Connected to MongoDB");

    const existing = await Admin.findOne({ email: ADMIN_EMAIL });
    if (existing) {
      console.log("⚠️  Admin already exists. Skipping.");
      process.exit(0);
    }

    const admin = new Admin({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      phone: ADMIN_PHONE,
      password: ADMIN_PASSWORD,
      accountVerified: true,              // skip OTP for seeded admin
      adminLevel: "super_admin",
      permissions: {
        manageUsers: true,
        manageEvents: true,
        manageJobs: true,
        manageForum: true,
        manageAnnouncements: true,
      },
    });

    await admin.save();

    console.log("🎉 Admin created successfully!");
    console.log("─────────────────────────────");
    console.log("  Email   :", ADMIN_EMAIL);
    console.log("  Password:", ADMIN_PASSWORD);
    console.log("  Role    : Admin (super_admin)");
    console.log("─────────────────────────────");
    console.log("🔐 Login at /login and use Role = Admin");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding admin:", err.message);
    process.exit(1);
  }
}

seed();
