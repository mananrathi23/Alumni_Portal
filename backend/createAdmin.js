/**
 * ONE-TIME ADMIN SEED SCRIPT
 * Run with: node createAdmin.js <email> <password>
 * This creates an admin account directly in MongoDB.
 */

import { config } from "dotenv";
config({ path: "./.env" });

import mongoose from "mongoose";
import bcryptjs from "bcryptjs";

// ── Admin Schema (inline — avoids circular imports) ──────────────────────────
const adminSchema = new mongoose.Schema({
  name:             { type: String,  required: true },
  email:            { type: String,  required: true, unique: true },
  password:         { type: String,  required: true },
  role:             { type: String,  default: "Admin" },
  accountVerified:  { type: Boolean, default: true },
  adminVerified:    { type: Boolean, default: true },
  isBlocked:        { type: Boolean, default: false },
  department:       { type: String,  default: "Administration" },
});

const Admin = mongoose.models.Admin || mongoose.model("Admin", adminSchema, "admins");

// ── Credentials ───────────────────────────────────────────────────────────────
const [EMAIL, PASSWORD] = process.argv.slice(2);
if (!EMAIL || !PASSWORD || PASSWORD.length < 8) {
  console.error("Usage: node createAdmin.js <email> <password>   (password: 8+ characters)");
  process.exit(1);
}

// ── Connect ──────────────────────────────────────────────────────────────────
await mongoose.connect(process.env.MONGO_URI, { dbName: "Alumni-Portal" });
console.log("✅ Connected to MongoDB");

// ── Create if not exists ──────────────────────────────────────────────────────
const existing = await Admin.findOne({ email: EMAIL });
if (existing) {
  console.log(`ℹ️  Admin already exists.`);
  console.log(`   📧 Email:    ${EMAIL}`);
  console.log(`   🆔 MongoDB _id: ${existing._id}`);
} else {
  const hashed = await bcryptjs.hash(PASSWORD, 10);
  const admin = await Admin.create({
    name:            "Portal Admin",
    email:           EMAIL,
    password:        hashed,
    accountVerified: true,
    adminVerified:   true,
    department:      "Administration",
  });
  console.log("🎉 Admin created successfully!");
  console.log(`   📧 Email:       ${EMAIL}`);
  console.log(`   🆔 MongoDB _id: ${admin._id}`);
}

await mongoose.disconnect();
process.exit(0);
