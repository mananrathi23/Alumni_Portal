import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/error.js";
import { SupportTicket } from "../models/SupportTicketModel.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { emitToUser } from "../Socket.js";

// Initialize Gemini
let genAI = null;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

const SYSTEM_PROMPT = `You are a helpful AI support assistant for a College Alumni Portal. 
Your job is to answer questions about the portal's UI and features. 
The portal has three main dashboards:
1. Student Dashboard: Connect with Alumni, find jobs/internships, participate in forums, and request mentorship.
2. Alumni Dashboard: Offer mentorship, post jobs, answer forum questions, and network.
3. Teacher Dashboard: Manage students, post events, and oversee connections.
4. Admin Dashboard: Verify users, manage roles, and handle support escalations.

Important Rules:
- Keep your answers concise, friendly, and helpful.
- If the user types a single word or feature name (like "mentorship", "jobs", "events"), briefly explain what that feature does on the portal and how to access it. Do NOT escalate immediately.
- If a user asks a complex question you don't know, or needs human assistance (like account deletion, reporting a user, or complex issues), reply EXACTLY with the word "ESCALATE" (and nothing else). This will trigger an escalation to the Admin.
- Only answer questions related to the portal, UI, networking, mentorship, jobs, and events.
`;

function normalizeChoiceFromText(text = "") {
  const t = String(text).trim().toLowerCase();
  if (!t) return null;
  if (["2", "admin", "human", "support", "talk to admin", "escalate"].some((k) => t.includes(k))) {
    return "escalate_to_admin";
  }
  if (["1", "ai", "continue", "continue with ai", "chat with ai"].some((k) => t.includes(k))) {
    return "continue_with_ai";
  }
  return null;
}

async function applyEscalationChoice(ticket, choice) {
  ticket.userChoice = choice;

  if (choice === "escalate_to_admin") {
    ticket.status = "Escalated";
    ticket.messages.push({
      sender: "AI",
      text: "Okay, I'm connecting you with a support admin. They'll assist you shortly."
    });
  } else {
    ticket.status = "AI_Handling";
    ticket.escalationOffered = false;
    ticket.messages.push({
      sender: "AI",
      text: "Great! I'm here to help. Please tell me more about what you need, and I'll do my best to assist you."
    });
  }

  await ticket.save();
}

// ── ASK AI (User sends message) ────────────────────────────────────────────
export const askSupportChat = catchAsyncError(async (req, res, next) => {
  const { text, image } = req.body;
  if (!text) return next(new ErrorHandler("Message text is required.", 400));

  const userId = req.user._id;
  const userModel = req.user.constructor.modelName;

  // Find active ticket (not resolved)
  let ticket = await SupportTicket.findOne({ userId, status: { $ne: "Resolved" } });

  if (!ticket) {
    ticket = await SupportTicket.create({
      userId,
      userModel,
      status: "AI_Handling",
      messages: [],
    });
  }

  // If escalation was offered earlier, wait for explicit choice
  // (or accept typed shortcuts like "1/2", "ai/admin").
  if (ticket.status === "Escalation_Offered") {
    const inferredChoice = normalizeChoiceFromText(text);
    if (!inferredChoice) {
      return res.status(200).json({
        success: true,
        ticket,
        reply: null,
        escalationPending: true,
      });
    }

    await applyEscalationChoice(ticket, inferredChoice);
    return res.status(200).json({
      success: true,
      ticket,
      reply: ticket.messages[ticket.messages.length - 1]?.text || null,
      choice: inferredChoice,
    });
  }

  // Append user message
  ticket.messages.push({ sender: "User", text });
  await ticket.save();

  // If already escalated, just save and return (Admin will reply later)
  if (ticket.status === "Escalated") {
    return res.status(200).json({
      success: true,
      ticket,
      reply: null // No AI reply
    });
  }

  // AI Handling
  let aiText = "Sorry, I am currently unavailable. Please ask an Admin.";
  
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
      
      // Build conversation history for Gemini
      const history = ticket.messages.slice(-10).map((m) => {
        return {
          role: m.sender === "User" ? "user" : "model",
          parts: [{ text: m.text }]
        };
      });

      const chat = model.startChat({
        history: history.slice(0, -1), // Everything except the last message
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] }
      });

      let messageParts = [text];
      
      if (image) {
        const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
        messageParts.push({
          inlineData: {
            data: base64Data,
            mimeType: "image/jpeg"
          }
        });
      }

      const result = await chat.sendMessage(messageParts);
      aiText = result.response.text().trim();
    } catch (err) {
      console.error("Gemini Error:", err);
      aiText = "ESCALATE"; // Force escalation on error
    }
  } else {
    // Mock if no API key
    if (text.toLowerCase().includes("help") || text.toLowerCase().includes("admin") || text.toLowerCase().includes("error")) {
      aiText = "ESCALATE";
    } else {
      aiText = "I am a simple bot (No Gemini API key found). How can I help you with the portal? Type 'admin' to escalate.";
    }
  }

  // Handle Escalation Trigger - Offer Choice Instead of Auto-Escalating
  if (aiText === "ESCALATE" || aiText.includes("ESCALATE")) {
    ticket.status = "Escalation_Offered";
    ticket.escalationOffered = true;
    aiText = "I'm not able to fully assist with this. Would you like to:\n1. Continue discussing with me\n2. Speak with a support admin\n\nPlease let me know your preference!";
  }

  // Append AI message
  ticket.messages.push({ sender: "AI", text: aiText });
  await ticket.save();

  res.status(200).json({
    success: true,
    ticket,
    reply: aiText,
    escalationOffered: ticket.escalationOffered // Frontend knows to show choice buttons
  });
});

// ── GET USER TICKET ────────────────────────────────────────────────────────
export const getUserTicket = catchAsyncError(async (req, res, next) => {
  const userId = req.user._id;
  const ticket = await SupportTicket.findOne({ userId, status: { $ne: "Resolved" } });

  res.status(200).json({
    success: true,
    ticket,
  });
});

// ── HANDLE ESCALATION CHOICE (Continue with AI or Escalate to Admin) ────────
export const handleEscalationChoice = catchAsyncError(async (req, res, next) => {
  const { choice } = req.body; // 'continue_with_ai' or 'escalate_to_admin'
  
  if (!choice || !["continue_with_ai", "escalate_to_admin"].includes(choice)) {
    return next(new ErrorHandler("Invalid choice. Must be 'continue_with_ai' or 'escalate_to_admin'.", 400));
  }

  const userId = req.user._id;
  let ticket = await SupportTicket.findOne({ userId, status: "Escalation_Offered" });

  if (!ticket) {
    return next(new ErrorHandler("No pending escalation choice found.", 404));
  }

  await applyEscalationChoice(ticket, choice);

  res.status(200).json({
    success: true,
    ticket,
    choice,
  });
});

// ── GET ALL ESCALATED TICKETS (Admin) ──────────────────────────────────────
export const getAdminTickets = catchAsyncError(async (req, res, next) => {
  const tickets = await SupportTicket.find({ status: { $ne: "Resolved" } })
    .populate("userId", "name email profilePhoto role")
    .sort("-updatedAt");

  res.status(200).json({
    success: true,
    tickets,
  });
});

// ── ADMIN REPLY TO TICKET ──────────────────────────────────────────────────
export const adminReply = catchAsyncError(async (req, res, next) => {
  const { ticketId } = req.params;
  const { text, resolve } = req.body;

  if (!text && !resolve) {
    return next(new ErrorHandler("Message text or resolve action required.", 400));
  }

  const ticket = await SupportTicket.findById(ticketId);
  if (!ticket) return next(new ErrorHandler("Ticket not found", 404));

  if (text) {
    ticket.messages.push({ sender: "Admin", text });
    // If Admin replies to a resolved ticket, reopen it
    if (ticket.status === "Resolved") ticket.status = "Escalated";
  }

  if (resolve) {
    ticket.status = "Resolved";
  }

  await ticket.save();

  // Notify user in real-time
  emitToUser(ticket.userId, "support:reply", {
    ticketId: ticket._id,
    message: text ? { sender: "Admin", text, timestamp: new Date() } : null,
    resolved: resolve
  });

  res.status(200).json({
    success: true,
    ticket,
  });
});
