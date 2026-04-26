import cron from "node-cron";
import { MentorshipRequest } from "../models/MentorshipRequestModel.js";
import { emitToUser } from "../Socket.js";

export const expireMentorshipRequests = () => {
  // Run every hour at minute 0
  cron.schedule("0 * * * *", async () => {
    try {
      const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

      // Find all pending requests older than 48 hours
      const expiredRequests = await MentorshipRequest.find({
        status: "Pending",
        createdAt: { $lt: fortyEightHoursAgo },
      });

      if (expiredRequests.length === 0) return;

      console.log(`[Cron] Auto-cancelling ${expiredRequests.length} expired mentorship requests`);

      for (const req of expiredRequests) {
        req.status = "Cancelled";
        req.respondedAt = new Date();
        await req.save();

        // Notify the student
        emitToUser(req.student.id, "mentorship:rejected", {
          mentorshipId: req._id,
          mentorName: req.mentor.name,
          message: `Your request to ${req.mentor.name} was automatically cancelled because the mentor was unavailable to respond within 48 hours.`,
        });

        // Optionally, notify the mentor that it expired
        emitToUser(req.mentor.id, "mentorship:request_cancelled", {
          mentorshipId: req._id,
          studentName: req.student.name,
          message: `The mentorship request from ${req.student.name} automatically expired because you did not respond within 48 hours.`,
        });
      }
    } catch (error) {
      console.error("[Cron Error] Failed to expire mentorship requests:", error.message);
    }
  });
};
