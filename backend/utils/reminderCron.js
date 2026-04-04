// utils/reminderCron.js
// Runs every minute — finds sessions starting in ≤15 min that haven't had a reminder sent
// Sends email + pushes meeting link message to chat

import cron from "node-cron";
import { MentorshipRequest } from "../models/MentorshipRequestModel.js";
import { Student }           from "../models/StudentModel.js";
import { Alumni }            from "../models/AlumniModel.js";
import { Teacher }           from "../models/TeacherModel.js";
import { ChatMessage }       from "../models/ChatMessageModel.js";
import { sendEmail }         from "./sendEmail.js";
import { sessionReminderEmail } from "./mentorshipEmailTemplates.js";
import { emitToUser }        from "../Socket.js";

// Day string → JS day-of-week number (Sun=0 … Sat=6)
const DAY_MAP = { Sun:0, Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6 };

// "9:00 AM" / "3:30 PM" → { hour, minute }
function parseTime(timeStr) {
  const [timePart, meridiem] = timeStr.trim().split(" ");
  let [hour, minute] = timePart.split(":").map(Number);
  if (meridiem === "PM" && hour !== 12) hour += 12;
  if (meridiem === "AM" && hour === 12) hour = 0;
  return { hour, minute };
}

// Given slot { day:"Mon", time:"3:00 PM" }, return the next occurrence as a Date
function nextSlotDate(slotDay, slotTime) {
  const now       = new Date();
  const targetDow = DAY_MAP[slotDay];
  const { hour, minute } = parseTime(slotTime);

  const candidate = new Date(now);
  candidate.setHours(hour, minute, 0, 0);

  // Advance to correct day of week
  const diffDays = (targetDow - candidate.getDay() + 7) % 7;
  candidate.setDate(candidate.getDate() + diffDays);

  // If that time already passed today/this week, move to next week
  if (candidate <= now) candidate.setDate(candidate.getDate() + 7);

  return candidate;
}

export function startReminderCron() {
  // Run every minute
  cron.schedule("* * * * *", async () => {
    try {
      const now        = new Date();
      const in15       = new Date(now.getTime() + 15 * 60 * 1000); // 15 min from now
      const in16       = new Date(now.getTime() + 16 * 60 * 1000); // 16 min buffer

      // Fetch all accepted sessions without reminder sent yet
      const sessions = await MentorshipRequest.find({
        status:       "Accepted",
        reminderSent: false,
      }).lean();

      for (const session of sessions) {
        // Compute next occurrence of this slot
        const sessionTime = nextSlotDate(session.slot.day, session.slot.time);

        // Only send if session is between 14 and 16 minutes away
        if (sessionTime >= in15 && sessionTime <= in16) {
          // Mark sent immediately (atomic update) to prevent duplicate sends
          const updated = await MentorshipRequest.findOneAndUpdate(
            { _id: session._id, reminderSent: false },
            { $set: { reminderSent: true } },
            { new: true }
          );
          if (!updated) continue; // another process already handled it

          // Fetch emails
          const student = await Student.findById(session.student.id).select("email name").lean();
          const MentorModel = session.mentor.role === "Alumni" ? Alumni : Teacher;
          const mentor  = await MentorModel.findById(session.mentor.id).select("email name").lean();

          const link    = session.meetingLink || null;
          const slotDay = session.slot.day;
          const slotTime = session.slot.time;

          // Email student
          if (student?.email) {
            sendEmail({
              email:   student.email,
              subject: `⏰ Reminder: Session with ${session.mentor.name} in 15 minutes`,
              message: sessionReminderEmail({
                recipientName:   session.student.name,
                otherPersonName: session.mentor.name,
                otherPersonRole: session.mentor.role,
                slotDay,
                slotTime,
                meetingLink: link,
              }),
            }).catch(console.error);
          }

          // Email mentor
          if (mentor?.email) {
            sendEmail({
              email:   mentor.email,
              subject: `⏰ Reminder: Session with ${session.student.name} in 15 minutes`,
              message: sessionReminderEmail({
                recipientName:   session.mentor.name,
                otherPersonName: session.student.name,
                otherPersonRole: "Student",
                slotDay,
                slotTime,
                meetingLink: link,
              }),
            }).catch(console.error);
          }

          // Push meeting link into chat if available (only if not already posted)
          if (link) {
            const alreadyPosted = await ChatMessage.findOne({
              mentorshipId: session._id,
              meetingLink:  link,
            });
            if (!alreadyPosted) {
              const reminderMsg = await ChatMessage.create({
                mentorshipId: session._id,
                sender:       { id: session.mentor.id, name: session.mentor.name, role: session.mentor.role },
                text:         `⏰ Reminder: Your session starts in 15 minutes!\n📎 Meeting Link: ${link}`,
                meetingLink:  link,
              });
              // Notify both participants via socket
              emitToUser(session.student.id, "chat:new_message", { mentorshipId: session._id, message: reminderMsg });
              emitToUser(session.mentor.id,  "chat:new_message", { mentorshipId: session._id, message: reminderMsg });
            }
          }

          // Socket: push reminder notification to both
          emitToUser(session.student.id, "mentorship:reminder", {
            mentorName: session.mentor.name,
            slotDay,
            slotTime,
            meetingLink: link,
          });
          emitToUser(session.mentor.id, "mentorship:reminder", {
            studentName: session.student.name,
            slotDay,
            slotTime,
            meetingLink: link,
          });

          console.log(`[Reminder] Sent for session ${session._id} (${slotDay} ${slotTime})`);
        }
      }
    } catch (err) {
      console.error("[Reminder Cron] Error:", err.message);
    }
  });

  console.log("✅ Meeting reminder cron started (runs every minute)");
}
