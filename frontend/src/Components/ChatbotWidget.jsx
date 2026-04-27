import React, { useState, useEffect, useRef, useContext } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import * as htmlToImage from "html-to-image";
import {
  PiChatTeardropText, PiX, PiPaperPlaneRight,
  PiRobot, PiUser, PiHeadset, PiShieldCheck,
  PiCheckCircle, PiCircleNotch
} from "react-icons/pi";
import { Context } from "../main";
import { useSocket } from "../SocketContext.jsx";

const ChatbotWidget = () => {
  const { user } = useContext(Context);
  const { socketRef } = useSocket();
  const socket = socketRef.current;
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("AI_Handling");
  const [ticketId, setTicketId] = useState(null);
  const [choosingEscalation, setChoosingEscalation] = useState(false);
  const [startChoicePending, setStartChoicePending] = useState(false);
  const messagesEndRef = useRef(null);



  useEffect(() => {
    if (isOpen) {
      fetchTicket();
    }
  }, [isOpen]);

  useEffect(() => {
    if (socket) {
      socket.on("support:reply", (data) => {
        if (data.message) {
          setMessages((prev) => [...prev, data.message]);
        }
        if (data.resolved) {
          setStatus("Resolved");
          setMessages((prev) => [
            ...prev,
            { sender: "System", text: "Your ticket has been resolved by the Admin." }
          ]);
        }
      });
    }
    return () => {
      if (socket) socket.off("support:reply");
    };
  }, [socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const fetchTicket = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:4000"}/api/v1/support/my-ticket`, {
        withCredentials: true,
      });
      if (res.data.ticket) {
        setMessages(res.data.ticket.messages);
        setStatus(res.data.ticket.status);
        setTicketId(res.data.ticket._id);
        setStartChoicePending(false);
        // If escalation is offered, show choice buttons
        if (res.data.ticket.status === "Escalation_Offered") {
          setChoosingEscalation(true);
        }
      } else {
        setMessages([
          { sender: "AI", text: "Hi there! I am your AI assistant. How can I help you navigate the portal today?" }
        ]);
        setStartChoicePending(true);
      }
    } catch (err) {
      console.error("Failed to fetch chat:", err);
    }
  };

  const handleStartChoiceAdmin = async () => {
    setLoading(true);
    setStartChoicePending(false);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL || "http://localhost:4000"}/api/v1/support/ask`,
        { text: "I want to talk to support admin." },
        { withCredentials: true }
      );

      setStatus(res.data.ticket.status);
      setTicketId(res.data.ticket._id);
      if (res.data.reply) {
        setMessages((prev) => [...prev, { sender: "AI", text: res.data.reply }]);
      }

      if (res.data.ticket.status === "Escalation_Offered" || res.data.escalationOffered || res.data.escalationPending) {
        const choiceRes = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL || "http://localhost:4000"}/api/v1/support/escalation-choice`,
          { choice: "escalate_to_admin" },
          { withCredentials: true }
        );
        setStatus(choiceRes.data.ticket.status);
        setMessages(choiceRes.data.ticket.messages);
        setChoosingEscalation(false);
      }
    } catch (err) {
      console.error("Failed to start admin chat:", err);
      setMessages((prev) => [...prev, { sender: "System", text: "Failed to connect to admin. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleEscalationChoice = async (choice) => {
    setChoosingEscalation(false);
    setLoading(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL || "http://localhost:4000"}/api/v1/support/escalation-choice`,
        { choice },
        { withCredentials: true }
      );

      setStatus(res.data.ticket.status);
      setMessages(res.data.ticket.messages);
      setStartChoicePending(false);

      if (choice === "continue_with_ai") {
        // Continue with AI - show input field
        setInput("");
      } else if (choice === "escalate_to_admin") {
        // Escalated - show admin waiting message
        setInput("");
      }
    } catch (err) {
      console.error("Failed to handle escalation choice:", err);
      setChoosingEscalation(true); // Show choice buttons again
      setMessages((prev) => [...prev, { sender: "System", text: "Failed to process your choice. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || status === "Resolved") return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { sender: "User", text: userMessage }]);
    setLoading(true);

    let screenshotBase64 = null;
    try {
      screenshotBase64 = await htmlToImage.toJpeg(document.body, {
        quality: 0.6,
        allowTaint: true,
        useCORS: true,
        logging: false,
        filter: (node) => {
          // Exclude chatbot widget and images that may cause tracking prevention issues
          if (node.id === "chatbot-widget" || node.id === "chatbot-button") return false;
          // Hide Cloudinary images to avoid tracking prevention blocks
          if (node.tagName === "IMG" && node.src?.includes("cloudinary.com")) {
            node.style.display = "none";
            return true;
          }
          return true;
        }
      });
    } catch (err) {
      console.error("Screenshot failed (non-critical):", err);
      // Screenshot failure should not block message sending
    }

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL || "http://localhost:4000"}/api/v1/support/ask`,
        { text: userMessage, image: screenshotBase64 },
        { withCredentials: true }
      );

      setStatus(res.data.ticket.status);
      setTicketId(res.data.ticket._id);
      setStartChoicePending(false);

      // Only append AI reply if it exists (if Escalated, AI might not reply further)
      if (res.data.reply) {
        setMessages((prev) => [...prev, { sender: "AI", text: res.data.reply }]);
      }

      // Check if escalation is offered
      if (res.data.escalationOffered) {
        setChoosingEscalation(true);
      }
      if (res.data.escalationPending) {
        setChoosingEscalation(true);
      }
      if (res.data.ticket.status !== "Escalation_Offered" && !res.data.escalationPending) {
        setChoosingEscalation(false);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, { sender: "System", text: "Failed to send message. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  // If Admin or not logged in, do not show the floating widget
  if (!user || user.role === "Admin") return null;

  return (
    <>
      {/* Floating Button */}
      <button
        id="chatbot-button"
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 rounded-full shadow-2xl transition-all duration-300 z-50 flex items-center justify-center 
        ${isOpen ? "opacity-0 scale-50 pointer-events-none" : "opacity-100 scale-100"} 
        bg-gradient-to-r from-sky-500 to-indigo-600 hover:shadow-sky-500/50 text-white`}
      >
        <PiChatTeardropText size={28} />
      </button>

      {/* Chat Window */}
      <div
        id="chatbot-widget"
        className={`fixed bottom-6 right-6 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl flex flex-col transition-all duration-300 z-50 origin-bottom-right
        ${isOpen ? "scale-100 opacity-100" : "scale-50 opacity-0 pointer-events-none"}`}
        style={{ height: "500px", maxHeight: "80vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-sky-500 to-indigo-600 rounded-t-2xl text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              {status === "Escalated" ? <PiHeadset size={20} /> : status === "Escalation_Offered" ? <PiCircleNotch size={20} /> : <PiRobot size={20} />}
            </div>
            <div>
              <h3 className="font-bold leading-tight">Support</h3>
              <p className="text-xs text-sky-100">
                {status === "AI_Handling" ? "AI Assistant (Online)" : status === "Escalation_Offered" ? "Choose assistance method..." : status === "Escalated" ? "Waiting for Admin..." : "Ticket Resolved"}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            <PiX size={18} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/50">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col max-w-[85%] ${msg.sender === "User" ? "ml-auto items-end" : "mr-auto items-start"}`}
            >
              <div className="flex items-center gap-1.5 mb-1 text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">
                {msg.sender === "AI" && <PiRobot />}
                {msg.sender === "Admin" && <PiShieldCheck className="text-emerald-500" />}
                {msg.sender === "User" && <PiUser />}
                {msg.sender}
              </div>
              <div
                className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm markdown-body
                  ${msg.sender === "User"
                    ? "bg-sky-500 text-white rounded-br-sm"
                    : msg.sender === "System"
                      ? "bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-200 italic"
                      : msg.sender === "Admin"
                        ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-900 dark:text-emerald-100 rounded-bl-sm border border-emerald-200 dark:border-emerald-500/30"
                        : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-sm border border-slate-200 dark:border-white/5"
                  }`}
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ node, ...props }) => <p className="mb-1 last:mb-0" {...props} />,
                    ul: ({ node, ...props }) => <ul className="list-disc ml-4 mb-2" {...props} />,
                    ol: ({ node, ...props }) => <ol className="list-decimal ml-4 mb-2" {...props} />,
                    li: ({ node, ...props }) => <li className="mb-0.5" {...props} />,
                    strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
                  }}
                >
                  {msg.text}
                </ReactMarkdown>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 mr-auto">
              <PiRobot size={16} />
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce delay-75" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce delay-150" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-white/10 rounded-b-2xl">
          {status === "Resolved" ? (
            <div className="text-center text-sm text-slate-500 dark:text-slate-400 py-2">
              This ticket has been resolved.
            </div>
          ) : startChoicePending ? (
            <div className="space-y-2">
              <p className="text-xs text-slate-600 dark:text-slate-400 text-center mb-3">
                How would you like to start?
              </p>
              <button
                onClick={() => setStartChoicePending(false)}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-400 text-white rounded-lg font-medium text-sm disabled:opacity-50 transition-colors"
              >
                <PiRobot size={16} />
                Discuss with AI
              </button>
              <button
                onClick={handleStartChoiceAdmin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg font-medium text-sm disabled:opacity-50 transition-colors"
              >
                {loading ? <PiCircleNotch size={16} className="animate-spin" /> : <PiHeadset size={16} />}
                Discuss with Admin
              </button>
            </div>
          ) : (choosingEscalation || status === "Escalation_Offered") ? (
            <div className="space-y-2">
              <p className="text-xs text-slate-600 dark:text-slate-400 text-center mb-3">
                How would you like to proceed?
              </p>
              <button
                onClick={() => handleEscalationChoice("continue_with_ai")}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-400 text-white rounded-lg font-medium text-sm disabled:opacity-50 transition-colors"
              >
                {loading ? <PiCircleNotch size={16} className="animate-spin" /> : <PiRobot size={16} />}
                Continue with AI
              </button>
              <button
                onClick={() => handleEscalationChoice("escalate_to_admin")}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg font-medium text-sm disabled:opacity-50 transition-colors"
              >
                {loading ? <PiCircleNotch size={16} className="animate-spin" /> : <PiHeadset size={16} />}
                Talk to Admin
              </button>
            </div>
          ) : (
            <form onSubmit={handleSend} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={status === "Escalated" ? "Reply to Admin..." : "Ask AI a question..."}
                disabled={loading}
                className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="p-2.5 bg-sky-500 hover:bg-sky-400 text-white rounded-xl disabled:opacity-50 transition-colors shadow-md shadow-sky-500/20"
              >
                <PiPaperPlaneRight size={18} className={input.trim() ? "translate-x-0.5" : ""} />
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
};

export default ChatbotWidget;