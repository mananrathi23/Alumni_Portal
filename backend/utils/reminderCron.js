import cron    from "node-cron";
import { MentorshipRequest } from "../models/MentorshipRequestModel.js";
import { Student }           from "../models/StudentModel.js";
import { Alumni }            from "../models/AlumniModel.js";
import { Teacher }           from "../models/TeacherModel.js";
import { sendEmail }         from "./sendEmail.js";
import { sessionReminderEmail } from "./mentorshipEmailTemplates.js";

// ── 15-minute session reminder cron ──────────────────────────────────────────
// Runs every minute, finds sessions starting in 14–16 min, sends branded reminder email
// Slots are NOT auto-reset — mentors manage their own availability manually.

export function startReminderCron() {
  cron.schedule("* * * * *", async () => {
    try {
      const now         = new Date();
      const windowStart = new Date(now.getTime() + 14 * 60 * 1000);
      const windowEnd   = new Date(now.getTime() + 16 * 60 * 1000);

      const upcoming = await MentorshipRequest.find({
        status:          "Accepted",
        reminderSent:    false,
        sessionDateTime: { $gte: windowStart, $lte: windowEnd },
      }).lean();

      if (!upcoming.length) return;

      console.log(`⏰ Reminder cron: ${upcoming.length} session(s) starting soon`);

      for (const session of upcoming) {
        const student = await Student.findById(session.student.id).select("email").lean();
        const mentorDoc =
          (await Alumni.findById(session.mentor.id).select("email name").lean()) ||
          (await Teacher.findById(session.mentor.id).select("email name").lean());

        if (student?.email) {
          sendEmail({
            email:   student.email,
            subject: "⏰ Your mentorship session starts in 15 minutes!",
            message: sessionReminderEmail({
              recipientName:   session.student.name,
              otherPersonName: session.mentor.name,
              otherPersonRole: session.mentor.role,
              slotDay:         session.slot.day,
              slotTime:        session.slot.time,
              meetingLink:     session.meetingLink || "",
            }),
          }).catch(err => console.error(`Reminder email to student failed: ${err.message}`));
        }

        if (mentorDoc?.email) {
          sendEmail({
            email:   mentorDoc.email,
            subject: "⏰ Your mentorship session starts in 15 minutes!",
            message: sessionReminderEmail({
              recipientName:   mentorDoc.name,
              otherPersonName: session.student.name,
              otherPersonRole: "Student",
              slotDay:         session.slot.day,
              slotTime:        session.slot.time,
              meetingLink:     session.meetingLink || "",
            }),
          }).catch(err => console.error(`Reminder email to mentor failed: ${err.message}`));
        }

        await MentorshipRequest.findByIdAndUpdate(session._id, { reminderSent: true });
        console.log(`✅ Reminder sent for session ${session._id}`);
      }
    } catch (err) {
      console.error("❌ Reminder cron error:", err.message);
    }
  });

  console.log("🕐 15-minute session reminder cron started");
}
