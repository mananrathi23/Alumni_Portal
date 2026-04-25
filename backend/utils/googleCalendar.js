import { google } from "googleapis";

// ── Singleton OAuth2 client ───────────────────────────────────────────────────
const getOAuth2Client = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.BACKEND_URL || "http://localhost:4000"}/api/v1/mentorship/auth/callback`
  );
};

// ── Convert slot day + time → next real ISO datetime ─────────────────────────
// Handles both 3-letter ("Mon") and full ("Monday") day names
// Handles both 12-hr ("10:00 AM") and 24-hr ("14:00") time formats
export function getNextSlotISO(day, time) {
  const DAY_MAP = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
    Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3,
    Thursday: 4, Friday: 5, Saturday: 6,
  };

  const targetDay = DAY_MAP[day];
  if (targetDay === undefined) throw new Error(`Unknown day value: "${day}"`);

  const now  = new Date();
  const date = new Date();

  // Minimum 1 day ahead — prevents creating a meeting in the past
  const diff = ((targetDay - now.getDay() + 7) % 7) || 7;
  date.setDate(now.getDate() + diff);

  // Parse time string: "10:00 AM" / "2:00 PM" / "14:00"
  const parts        = time.trim().split(" ");
  const [hStr, mStr] = parts[0].split(":");
  let   hours        = parseInt(hStr, 10);
  const minutes      = parseInt(mStr, 10);
  const meridiem     = parts[1]?.toUpperCase();

  if (meridiem === "PM" && hours !== 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours  = 0;

  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

// ── Generate the Google OAuth consent URL ────────────────────────────────────
// mentorId + mentorRole are encoded into the `state` param so the callback
// can identify the mentor WITHOUT needing isAuthenticated middleware.
// Google's redirect carries no JWT cookie — state is the only safe channel.
// Replace your buildGoogleAuthUrl in backend/utils/googleCalendar.js with this:
export function buildGoogleAuthUrl(mentorId, mentorRole) {
  // Add this console.log to debug. If it says "undefined", your .env isn't loading!
  console.log("Using Client ID:", process.env.GOOGLE_CLIENT_ID);

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.BACKEND_URL || "http://localhost:4000"}/api/v1/mentorship/auth/callback`
  );

  const state = Buffer.from(
    JSON.stringify({ mentorId, mentorRole })
  ).toString("base64");

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/calendar.events"],
    prompt: "consent",
    state: state,
    client_id: process.env.GOOGLE_CLIENT_ID, // Explicitly pass it here
    redirect_uri: `${process.env.BACKEND_URL || "http://localhost:4000"}/api/v1/mentorship/auth/callback`
  });
}

// ── Decode the state param Google sends back on redirect ─────────────────────
export function decodeOAuthState(state) {
  try {
    const decoded = JSON.parse(Buffer.from(state, "base64").toString("utf8"));
    if (!decoded.mentorId || !decoded.mentorRole) throw new Error("Missing fields");
    return decoded;
  } catch {
    throw new Error("Invalid OAuth state parameter.");
  }
}

// ── Exchange one-time Google code for tokens ──────────────────────────────────
export async function exchangeCodeForTokens(code) {
  try {
    const client = getOAuth2Client(); // <── Create a fresh client here
    const { tokens } = await client.getToken(code);
    return tokens;
  } catch (error) {
    console.error("GOOGLE EXCHANGE ERROR:", error.response?.data || error.message);
    throw error;
  }
}

// ── Create Google Calendar event + return Meet link ───────────────────────────
// storedTokens  = { access_token, refresh_token, ... } saved in mentor's DB doc
// eventDetails  = { requestId, studentName, mentorName, studentEmail,
//                   mentorEmail, goal, startISO }
export async function createGoogleMeetLink(storedTokens, eventDetails) {
  const client = getOAuth2Client(); // <── Create a fresh client here
  client.setCredentials(storedTokens);

  const calendar = google.calendar({ version: "v3", auth: client });

  const startISO = eventDetails.startISO;
  const endISO   = new Date(new Date(startISO).getTime() + 60 * 60 * 1000).toISOString();

  const GOAL_LABELS = {
    career:    "Career Guidance",
    resume:    "Resume Review",
    interview: "Interview Prep",
    technical: "Technical Help",
    general:   "General Advice",
  };

  const event = {
    summary:     `Mentorship: ${eventDetails.studentName} & ${eventDetails.mentorName}`,
    description: `Topic: ${GOAL_LABELS[eventDetails.goal] || eventDetails.goal}`,
    start: { dateTime: startISO, timeZone: "Asia/Kolkata" },
    end:   { dateTime: endISO,   timeZone: "Asia/Kolkata" },
    attendees: [
      { email: eventDetails.studentEmail },
      { email: eventDetails.mentorEmail  },
    ],
    conferenceData: {
      createRequest: {
        // Unique per request — no duplicate Meet rooms if retried
        requestId: `mentorship-${eventDetails.requestId}`,
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    },
    reminders: {
      useDefault: false,
      overrides:  [{ method: "email", minutes: 15 }],
    },
  };

  const response = await calendar.events.insert({
    calendarId:            "primary",
    resource:              event,
    conferenceDataVersion: 1, // REQUIRED — without this, no Meet link is created
  });

  return response.data.hangoutLink;
}