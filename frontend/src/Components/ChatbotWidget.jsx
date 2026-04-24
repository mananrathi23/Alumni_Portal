import React, { useState, useEffect, useRef, useContext } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import * as htmlToImage from "html-to-image";
import { 
  PiChatTeardropText, PiX, PiPaperPlaneRight, 
  PiRobot, PiUser, PiHeadset, PiShieldCheck
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
      const res = await axios.get("http://localhost:4000/api/v1/support/my-ticket", {
        withCredentials: true,
      });
      if (res.data.ticket) {
        setMessages(res.data.ticket.messages);
        setStatus(res.data.ticket.status);
      } else {
        setMessages([
          { sender: "AI", text: "Hi there! I am your AI assistant. How can I help you navigate the portal today?" }
        ]);
      }
    } catch (err) {
      console.error("Failed to fetch chat:", err);
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
        filter: (node) => {
          return node.id !== "chatbot-widget" && node.id !== "chatbot-button";
        }
      });
    } catch (err) {
      console.error("Screenshot failed:", err);
    }

    try {
      const res = await axios.post(
        "http://localhost:4000/api/v1/support/ask",
        { text: userMessage, image: screenshotBase64 },
        { withCredentials: true }
      );
      
      setStatus(res.data.ticket.status);
      
      // Only append AI reply if it exists (if Escalated, AI might not reply further)
      if (res.data.reply) {
        setMessages((prev) => [...prev, { sender: "AI", text: res.data.reply }]);
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
              {status === "Escalated" ? <PiHeadset size={20} /> : <PiRobot size={20} />}
            </div>
            <div>
              <h3 className="font-bold leading-tight">Support</h3>
              <p className="text-xs text-sky-100">
                {status === "AI_Handling" ? "AI Assistant (Online)" : status === "Escalated" ? "Waiting for Admin..." : "Ticket Resolved"}
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
                    p: ({node, ...props}) => <p className="mb-1 last:mb-0" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc ml-4 mb-2" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal ml-4 mb-2" {...props} />,
                    li: ({node, ...props}) => <li className="mb-0.5" {...props} />,
                    strong: ({node, ...props}) => <strong className="font-bold" {...props} />,
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
