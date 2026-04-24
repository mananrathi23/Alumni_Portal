// ── Mentorship Email Templates ────────────────────────────────────────────────
// Consistent, production-quality HTML emails for all mentorship lifecycle events

const BASE_STYLES = `
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Segoe UI', Arial, sans-serif; background: #eef2f7; }
.wrap { padding: 32px 16px; }
.card { max-width: 560px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
.header { padding: 32px 36px 28px; }
.header h1 { font-size: 22px; color: #fff; font-weight: 700; margin-bottom: 4px; }
.header p { font-size: 13px; color: rgba(255,255,255,0.75); }
.body { padding: 32px 36px; }
.body p { font-size: 15px; color: #4a5568; line-height: 1.7; margin-bottom: 16px; }
.info-box { background: #f7fafc; border-radius: 10px; padding: 18px 20px; margin: 20px 0; border-left: 4px solid; }
.info-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid rgba(0,0,0,0.05); }
.info-row:last-child { border-bottom: none; }
.info-label { font-size: 12px; color: #718096; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
.info-value { font-size: 14px; color: #2d3748; font-weight: 600; }
.btn { display: inline-block; padding: 13px 28px; border-radius: 8px; font-size: 14px; font-weight: 700; text-decoration: none; margin-top: 8px; }
.footer { background: #1a202c; padding: 20px 36px; text-align: center; }
.footer p { font-size: 12px; color: #718096; }
@media (max-width: 600px) { .header, .body { padding: 24px 20px; } .info-row { flex-direction: column; align-items: flex-start; gap: 2px; } }
`;

// ── Accepted — to student ─────────────────────────────────────────────────────
export function mentorshipAcceptedStudentEmail({
  studentName, mentorName, mentorRole, goal, slotDay, slotTime, meetingLink,
}) {
  const goalLabel = {
    career:    "Career Guidance",
    resume:    "Resume Review",
    interview: "Interview Prep",
    technical: "Technical Help",
    general:   "General Advice",
  }[goal] || goal;

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><style>${BASE_STYLES}</style></head><body>
<div class="wrap"><div class="card">
  <div class="header" style="background:linear-gradient(135deg,#0f2244,#1b4d8e)">
    <h1>🎉 Mentorship Accepted!</h1>
    <p>Your request has been confirmed</p>
  </div>
  <div class="body">
    <p>Hi <strong>${studentName}</strong>,</p>
    <p>Great news! <strong>${mentorName}</strong> (${mentorRole}) has accepted your mentorship request. Your session is now booked.</p>
    <div class="info-box" style="border-color:#38a169">
      <div class="info-row"><span class="info-label">Mentor</span><span class="info-value">${mentorName} · ${mentorRole}</span></div>
      <div class="info-row"><span class="info-label">Topic</span><span class="info-value">${goalLabel}</span></div>
      <div class="info-row"><span class="info-label">Day</span><span class="info-value">${slotDay}</span></div>
      <div class="info-row"><span class="info-label">Time</span><span class="info-value">${slotTime}</span></div>
      ${meetingLink
        ? `<div class="info-row"><span class="info-label">Meeting Link</span><span class="info-value"><a href="${meetingLink}" style="color:#2b6cb0;word-break:break-all;">${meetingLink}</a></span></div>`
        : ""}
    </div>
    ${meetingLink
      ? `<a href="${meetingLink}" class="btn" style="background:#38a169;color:#fff;">Join Google Meet →</a>
         <p style="margin-top:16px;font-size:13px;color:#718096;">You will also receive a reminder email 15 minutes before the session.</p>`
      : `<p>The meeting link will be shared automatically in your chat on the Alumni Portal once confirmed.</p>
         <p style="margin-top:8px;">Log in to the Alumni Portal to open your chat and prepare for your session. Good luck! 🚀</p>`
    }
  </div>
  <div class="footer"><p>© Alumni Connect Portal · You received this because you have an active mentorship session.</p></div>
</div></div></body></html>`;
}

// ── Accepted — to mentor ──────────────────────────────────────────────────────
export function mentorshipAcceptedMentorEmail({
  mentorName, studentName, studentDept, studentYear, goal, slotDay, slotTime, meetingLink,
}) {
  const goalLabel = {
    career:    "Career Guidance",
    resume:    "Resume Review",
    interview: "Interview Prep",
    technical: "Technical Help",
    general:   "General Advice",
  }[goal] || goal;

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><style>${BASE_STYLES}</style></head><body>
<div class="wrap"><div class="card">
  <div class="header" style="background:linear-gradient(135deg,#1a365d,#2b6cb0)">
    <h1>✅ Session Confirmed</h1>
    <p>You accepted a mentorship request</p>
  </div>
  <div class="body">
    <p>Hi <strong>${mentorName}</strong>,</p>
    <p>This is a confirmation that you have accepted a mentorship session. The slot is now booked and the student has been notified.</p>
    <div class="info-box" style="border-color:#3182ce">
      <div class="info-row"><span class="info-label">Student</span><span class="info-value">${studentName}</span></div>
      <div class="info-row"><span class="info-label">Department</span><span class="info-value">${studentDept || "—"} · ${studentYear || "—"}</span></div>
      <div class="info-row"><span class="info-label">Topic</span><span class="info-value">${goalLabel}</span></div>
      <div class="info-row"><span class="info-label">Day</span><span class="info-value">${slotDay}</span></div>
      <div class="info-row"><span class="info-label">Time</span><span class="info-value">${slotTime}</span></div>
      ${meetingLink
        ? `<div class="info-row"><span class="info-label">Meeting Link</span><span class="info-value"><a href="${meetingLink}" style="color:#2b6cb0;word-break:break-all;">${meetingLink}</a></span></div>`
        : ""}
    </div>
    ${meetingLink
      ? `<a href="${meetingLink}" class="btn" style="background:#3182ce;color:#fff;">Join Google Meet →</a>
         <p style="margin-top:16px;font-size:13px;color:#718096;">A reminder will be sent 15 minutes before the session.</p>`
      : `<p>The chat with ${studentName} is now open. The meeting link has been posted there automatically.</p>`
    }
  </div>
  <div class="footer"><p>© Alumni Connect Portal · Thank you for giving back to your community.</p></div>
</div></div></body></html>`;
}

// ── Rejected — to student ─────────────────────────────────────────────────────
export function mentorshipRejectedStudentEmail({ studentName, mentorName, slotDay, slotTime }) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><style>${BASE_STYLES}</style></head><body>
<div class="wrap"><div class="card">
  <div class="header" style="background:linear-gradient(135deg,#742a2a,#c53030)">
    <h1>Request Update</h1>
    <p>Your mentorship request could not be accepted</p>
  </div>
  <div class="body">
    <p>Hi <strong>${studentName}</strong>,</p>
    <p>Unfortunately, <strong>${mentorName}</strong> was unable to accept your mentorship request for the <strong>${slotDay} at ${slotTime}</strong> slot. This could be because the slot was filled or they were unavailable.</p>
    <p>Don't be discouraged! You can browse other available mentors on the Alumni Portal and send a new request. There are many mentors ready to help.</p>
    <a href="${process.env.FRONTEND_URL}/student/mentorship" class="btn" style="background:#c53030;color:#fff;">Browse Mentors →</a>
  </div>
  <div class="footer"><p>© Alumni Connect Portal · Keep reaching out — the right mentor is waiting for you.</p></div>
</div></div></body></html>`;
}

// ── Auto-rejected (slot taken by another student) — to student ────────────────
export function mentorshipSlotTakenEmail({ studentName, mentorName, slotDay, slotTime }) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><style>${BASE_STYLES}</style></head><body>
<div class="wrap"><div class="card">
  <div class="header" style="background:linear-gradient(135deg,#744210,#d69e2e)">
    <h1>⚡ Slot No Longer Available</h1>
    <p>Someone else booked this slot first</p>
  </div>
  <div class="body">
    <p>Hi <strong>${studentName}</strong>,</p>
    <p>The <strong>${slotDay} at ${slotTime}</strong> slot with <strong>${mentorName}</strong> was just booked by another student. Your request for that slot has been automatically declined.</p>
    <p>Please visit the Alumni Portal to check if ${mentorName} has other available slots, or browse other mentors who can help you.</p>
    <a href="${process.env.FRONTEND_URL}/student/mentorship" class="btn" style="background:#d69e2e;color:#fff;">Find Another Slot →</a>
  </div>
  <div class="footer"><p>© Alumni Connect Portal · Act fast — popular mentors fill up quickly!</p></div>
</div></div></body></html>`;
}

// ── 15-min reminder — to both student and mentor ──────────────────────────────
export function sessionReminderEmail({
  recipientName, otherPersonName, otherPersonRole, slotDay, slotTime, meetingLink,
}) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><style>${BASE_STYLES}</style></head><body>
<div class="wrap"><div class="card">
  <div class="header" style="background:linear-gradient(135deg,#2d3748,#4a5568)">
    <h1>⏰ Session Reminder</h1>
    <p>Your mentorship session starts in 15 minutes</p>
  </div>
  <div class="body">
    <p>Hi <strong>${recipientName}</strong>,</p>
    <p>Your mentorship session with <strong>${otherPersonName}</strong> (${otherPersonRole}) is starting in <strong>15 minutes</strong>!</p>
    <div class="info-box" style="border-color:#667eea">
      <div class="info-row"><span class="info-label">Day</span><span class="info-value">${slotDay}</span></div>
      <div class="info-row"><span class="info-label">Time</span><span class="info-value">${slotTime}</span></div>
      <div class="info-row"><span class="info-label">With</span><span class="info-value">${otherPersonName}</span></div>
      ${meetingLink
        ? `<div class="info-row"><span class="info-label">Meeting Link</span><span class="info-value"><a href="${meetingLink}" style="color:#4c51bf;word-break:break-all;">${meetingLink}</a></span></div>`
        : ""}
    </div>
    ${meetingLink
      ? `<a href="${meetingLink}" class="btn" style="background:#4c51bf;color:#fff;">Join Meeting Now →</a>`
      : `<p>Check your chat on the Alumni Portal — the meeting link has been posted there automatically.</p>`
    }
  </div>
  <div class="footer"><p>© Alumni Connect Portal · Good luck with your session!</p></div>
</div></div></body></html>`;
}