/**
 * OAuthController.js
 * Handles Google and LinkedIn OAuth flows.
 *
 * Flow:
 *   1. Frontend calls /api/v1/oauth/google/url?role=Student  → gets redirect URL
 *   2. User consents on Google → Google redirects to /auth/google/callback?code=…&state=…
 *   3. Backend exchanges code for tokens → fetches user profile
 *   4. If user exists → login; if not → register then login
 *   5. Sets JWT cookie and redirects to /oauth-success?token=…&role=…
 */

import { config } from "dotenv";
config();

import axios   from "axios";
import crypto  from "crypto";
import bcrypt  from "bcrypt";
import { Student } from "../models/StudentModel.js";
import { Alumni  } from "../models/AlumniModel.js";
import { Teacher } from "../models/TeacherModel.js";
import { Admin } from "../models/AdminModel.js";
import { sendToken } from "../utils/sendToken.js";
import ErrorHandler from "../middlewares/error.js";
import { catchAsyncError } from "../middlewares/catchAsyncError.js";

// ── Helpers ────────────────────────────────────────────────────────────────────
function getModelByRole(role) {
  switch (role) {
    case "Student": return Student;
    case "Alumni":  return Alumni;
    case "Teacher": return Teacher;
    default:        return null;
  }
}

function randomPassword() {
  // Plain 20-char password — passes the 32-char validator.
  // The model's pre("save") bcrypt hook will hash it automatically.
  return crypto.randomBytes(10).toString("hex"); // 20 hex chars
}

// ══════════════════════════════════════════════════════════════════════════════
// GOOGLE OAUTH
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/v1/oauth/google/url?role=Student
export const getGoogleOAuthUrl = (req, res) => {
  const role = req.query.role || "Student";
  const state = Buffer.from(JSON.stringify({ role })).toString("base64");

  const params = new URLSearchParams({
    client_id:     process.env.GOOGLE_CLIENT_ID_LOGIN,
    redirect_uri:  `${process.env.BACKEND_URL_LOGIN || "http://localhost:4000"}/auth/google/callback`,
    response_type: "code",
    scope:         "openid email profile",
    access_type:   "offline",
    state,
  });

  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  res.status(200).json({ success: true, url });
};

// GET /auth/google/callback
export const handleGoogleOAuth = catchAsyncError(async (req, res, next) => {
  const { code, state } = req.query;
  if (!code) return next(new ErrorHandler("No auth code from Google.", 400));

  let role = "Student";
  try {
    const parsed = JSON.parse(Buffer.from(state, "base64").toString());
    role = parsed.role || "Student";
  } catch {}

  // Exchange code for tokens
  const tokenRes = await axios.post("https://oauth2.googleapis.com/token", {
    code,
    client_id:     process.env.GOOGLE_CLIENT_ID_LOGIN,
    client_secret: process.env.GOOGLE_CLIENT_SECRET_LOGIN,
    redirect_uri:  `${process.env.BACKEND_URL_LOGIN || "http://localhost:4000"}/auth/google/callback`,
    grant_type:    "authorization_code",
  });

  const { access_token } = tokenRes.data;

  // Fetch user profile
  const profileRes = await axios.get("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  const { email, name, picture } = profileRes.data;
  if (!email) return next(new ErrorHandler("Could not get email from Google.", 400));

  const Model = getModelByRole(role);
  if (!Model) return next(new ErrorHandler("Invalid role.", 400));

  const allModels = [
    { name: "Student", model: Student },
    { name: "Alumni", model: Alumni },
    { name: "Teacher", model: Teacher },
    { name: "Admin", model: Admin },
  ];

  let existingRole = null;
  for (const m of allModels) {
    const existing = await m.model.findOne({ email, accountVerified: true });
    if (existing) {
      existingRole = m.name;
      break;
    }
  }

  let user;

  if (existingRole) {
    if (existingRole !== role) {
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      return res.redirect(`${frontendUrl}/oauth-success?error=This+email+is+already+registered+as+a+${existingRole}.+Please+login+to+the+correct+dashboard.`);
    }
    user = await Model.findOne({ email, accountVerified: true });
  } else {
    // Auto-register OAuth user
    user = await Model.create({
      name,
      email,
      phone:           "+910000000000", // placeholder — can update in profile
      password:        randomPassword(),   // pre-save hook will bcrypt this
      accountVerified: true,
      profilePhoto:    picture ? { public_id: "", url: picture } : undefined,
    });
  }

  if (user.isBlocked) {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    return res.redirect(`${frontendUrl}/oauth-success?error=Your+account+has+been+suspended+by+the+administrator.`);
  }

  // Issue JWT and redirect to frontend
  const token = user.generateToken();
  const daysExpire = Number(process.env.COOKIE_EXPIRE) || 7;

  res.cookie("token", token, {
    expires:  new Date(Date.now() + daysExpire * 24 * 60 * 60 * 1000),
    httpOnly: true,
    sameSite: "none",
    secure: true,
  });

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  res.redirect(`${frontendUrl}/oauth-success?role=${role}`);
});

// ══════════════════════════════════════════════════════════════════════════════
// LINKEDIN OAUTH
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/v1/oauth/linkedin/url?role=Alumni
export const getLinkedInOAuthUrl = (req, res) => {
  const role  = req.query.role || "Alumni";
  const state = Buffer.from(JSON.stringify({ role })).toString("base64");

  const params = new URLSearchParams({
    response_type: "code",
    client_id:     process.env.LINKEDIN_CLIENT_ID,
    redirect_uri:  `${process.env.BACKEND_URL || "http://localhost:4000"}/api/v1/oauth/linkedin/callback`,
    scope:         "openid profile email",
    state,
  });

  const url = `https://www.linkedin.com/oauth/v2/authorization?${params}`;
  res.status(200).json({ success: true, url });
};

// GET /api/v1/oauth/linkedin/callback
export const handleLinkedInOAuth = catchAsyncError(async (req, res, next) => {
  const { code, state } = req.query;
  if (!code) return next(new ErrorHandler("No auth code from LinkedIn.", 400));

  let role = "Alumni";
  try {
    const parsed = JSON.parse(Buffer.from(state, "base64").toString());
    role = parsed.role || "Alumni";
  } catch {}

  const backendUrl = process.env.BACKEND_URL || "http://localhost:4000";

  // Exchange code for access token
  const tokenRes = await axios.post(
    "https://www.linkedin.com/oauth/v2/accessToken",
    new URLSearchParams({
      grant_type:    "authorization_code",
      code,
      redirect_uri:  `${backendUrl}/api/v1/oauth/linkedin/callback`,
      client_id:     process.env.LINKEDIN_CLIENT_ID,
      client_secret: process.env.LINKEDIN_CLIENT_SECRET,
    }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );

  const { access_token } = tokenRes.data;

  // Fetch user info via OpenID Connect userinfo endpoint
  const userRes = await axios.get("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  const { email, name, picture } = userRes.data;
  if (!email) return next(new ErrorHandler("Could not get email from LinkedIn.", 400));

  const Model = getModelByRole(role);
  if (!Model) return next(new ErrorHandler("Invalid role.", 400));

  const allModels = [
    { name: "Student", model: Student },
    { name: "Alumni", model: Alumni },
    { name: "Teacher", model: Teacher },
    { name: "Admin", model: Admin },
  ];

  let existingRole = null;
  for (const m of allModels) {
    const existing = await m.model.findOne({ email, accountVerified: true });
    if (existing) {
      existingRole = m.name;
      break;
    }
  }

  let user;

  if (existingRole) {
    if (existingRole !== role) {
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      return res.redirect(`${frontendUrl}/oauth-success?error=This+email+is+already+registered+as+a+${existingRole}.+Please+login+to+the+correct+dashboard.`);
    }
    user = await Model.findOne({ email, accountVerified: true });
  } else {
    user = await Model.create({
      name:            name || email.split("@")[0],
      email,
      phone:           "+910000000000",
      password:        randomPassword(),   // pre-save hook will bcrypt this
      accountVerified: true,
      profilePhoto:    picture ? { public_id: "", url: picture } : undefined,
    });
  }

  if (user.isBlocked) {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    return res.redirect(`${frontendUrl}/oauth-success?error=Your+account+has+been+suspended+by+the+administrator.`);
  }

  const token = user.generateToken();
  const daysExpire = Number(process.env.COOKIE_EXPIRE) || 7;

  res.cookie("token", token, {
    expires:  new Date(Date.now() + daysExpire * 24 * 60 * 60 * 1000),
    httpOnly: true,
    sameSite: "none",
    secure: true,
  });

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  res.redirect(`${frontendUrl}/oauth-success?role=${role}`);
});
