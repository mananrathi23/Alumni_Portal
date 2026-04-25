// MentorshipChat.jsx — Real-time chat for accepted mentorship sessions
// Fix 4: Chat is read-only after session Completed/expired
// Fix 5: Meeting link auto-posted on acceptance; no manual link button needed

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useSocket } from "../SocketContext";
import {
  PiX, PiPaperPlaneTilt, PiLink, PiCircleNotch,
  PiCheckCircle, PiWarningCircle, PiChatCircleText, PiLockSimple,
} from "react-icons/pi";

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function formatDay(iso) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

const MentorshipChat = ({ sessionId, apiBaseUrl = `${import.meta.env.VITE_BACKEND_URL}/api/v1/mentorship`, currentUser, otherPerson, accentColor = "sky", onClose, sessionStatus: initialStatus }) => {
  const { socketRef, isSocketReady } = useSocket();
  const [messages,  setMessages]  = useState([]);
  const [text,      setText]      = useState("");
  const [loading,   setLoading]   = useState(true);
  const [sending,   setSending]   = useState(false);
  const [error,     setError]     = useState(null);
  const [isTyping,  setIsTyping]  = useState(false);
  // Fix 4: track session status for read-only mode
  const [sessionStatus, setSessionStatus] = useState(initialStatus || "Accepted");

  const bottomRef     = useRef(null);
  const typingTimeout = useRef(null);

  // Session is read-only if Completed
  const isReadOnly = sessionStatus === "Completed";

  // ── Fetch history ──────────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    axios.get(`${apiBaseUrl}/${sessionId}/chat`, { withCredentials: true })
      .then(res => { setMessages(res.data.messages || []); setError(null); })
      .catch(() => setError("Failed to load messages."))
      .finally(() => setLoading(false));
  }, [sessionId, apiBaseUrl]);

  // ── Socket listeners ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!isSocketReady || !socketRef.current) return;
    const socket = socketRef.current;

    socket.emit("chat:join", sessionId);

    const onNewMessage = (data) => {
      // Allow for both mentorshipId and connectionId from backend
      const incomingId = data.mentorshipId || data.connectionId;
      if (incomingId?.toString() === sessionId?.toString()) {
        setMessages(prev => {
          const ids = new Set(prev.map(m => m._id));
          return ids.has(data.message._id) ? prev : [...prev, data.message];
        });
        setIsTyping(false);
        // Mark as read explicitly to avoid unread badge bug
        axios.put(`${apiBaseUrl}/${sessionId}/chat/read`, {}, { withCredentials: true }).catch(() => {});
      }
    };

    // Fix 4: listen for session_expired → switch to read-only
    const onSessionExpired = (data) => {
      if (data.requestId?.toString() === sessionId?.toString()) {
        setSessionStatus("Completed");
      }
    };

    socket.on("chat:new_message",        onNewMessage);
    socket.on("chat:typing",             () => setIsTyping(true));
    socket.on("chat:stop_typing",        () => setIsTyping(false));
    socket.on("mentorship:session_expired", onSessionExpired);
    socket.on("mentorship:completed",    onSessionExpired);

    return () => {
      socket.emit("chat:leave", sessionId);
      socket.off("chat:new_message",        onNewMessage);
      socket.off("chat:typing",             () => setIsTyping(true));
      socket.off("chat:stop_typing",        () => setIsTyping(false));
      socket.off("mentorship:session_expired", onSessionExpired);
      socket.off("mentorship:completed",    onSessionExpired);
    };
  }, [isSocketReady, sessionId]);

  // ── Auto-scroll ────────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // ── Send message ───────────────────────────────────────────────────────────
  const sendMessage = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending || isReadOnly) return;
    setSending(true);
    const optimistic = {
      _id: `opt-${Date.now()}`,
      text: trimmed,
      sender: { id: currentUser._id, name: currentUser.name, role: currentUser.role },
      createdAt: new Date().toISOString(),
      optimistic: true,
    };
    setMessages(prev => [...prev, optimistic]);
    setText("");
    try {
      const res = await axios.post(`${apiBaseUrl}/${sessionId}/chat`, { text: trimmed }, { withCredentials: true });
      setMessages(prev => prev.map(m => m._id === optimistic._id ? res.data.message : m));
    } catch (err) {
      setMessages(prev => prev.filter(m => m._id !== optimistic._id));
      const msg = err.response?.data?.message || "Message failed to send.";
      // If session ended mid-chat, reflect that in UI
      if (err.response?.status === 403) {
        setSessionStatus("Completed");
      }
      setError(msg);
    } finally {
      setSending(false);
    }
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
    if (!socketRef.current || isReadOnly) return;
    socketRef.current.emit("chat:typing", { mentorshipId: sessionId, userName: currentUser.name });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socketRef.current?.emit("chat:stop_typing", { mentorshipId: sessionId });
    }, 1500);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // ── Group messages by day ──────────────────────────────────────────────────
  const grouped = messages.reduce((acc, msg) => {
    const day = formatDay(msg.createdAt);
    if (!acc[day]) acc[day] = [];
    acc[day].push(msg);
    return acc;
  }, {});

  const accent = {
    sky:    { bg: "bg-sky-500",     text: "text-sky-400",     bubble: "bg-sky-500 text-white" },
    emerald:{ bg: "bg-emerald-500", text: "text-emerald-400", bubble: "bg-emerald-500 text-white" },
    violet: { bg: "bg-violet-500",  text: "text-violet-400",  bubble: "bg-violet-500 text-white" },
  }[accentColor] || { bg: "bg-sky-500", text: "text-sky-400", bubble: "bg-sky-500 text-white" };

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-xl border border-white/[0.07] overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07] bg-slate-900/80">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg ${accent.bg} flex items-center justify-center text-white font-bold text-sm`}>
            {otherPerson?.name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div>
            <p className="text-white font-semibold text-sm">{otherPerson?.name || "Mentor"}</p>
            <p className={`text-xs ${accent.text}`}>
              {otherPerson?.role || ""} · {isReadOnly ? "Session ended" : "Active Session"}
            </p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-all">
            <PiX size={16} />
          </button>
        )}
      </div>

      {/* ── Read-only banner (Fix 4) ── */}
      {isReadOnly && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/60 border-b border-white/[0.06]">
          <PiLockSimple size={14} className="text-slate-400 flex-shrink-0" />
          <p className="text-slate-400 text-xs">
            This session has ended. Chat history is read-only.
          </p>
        </div>
      )}

      {/* ── Messages area ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <PiCircleNotch size={24} className={`${accent.text} animate-spin`} />
          </div>
        ) : error && messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <PiWarningCircle size={24} className="text-red-400 mb-2" />
            <p className="text-slate-400 text-sm">{error}</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <PiChatCircleText size={28} className="text-slate-600 mb-3" />
            <p className="text-slate-400 font-medium text-sm">No messages yet</p>
            <p className="text-slate-600 text-xs mt-1">
              {isReadOnly ? "Session ended with no messages." : "Start the conversation!"}
            </p>
          </div>
        ) : (
          Object.entries(grouped).map(([day, dayMessages]) => (
            <div key={day}>
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-white/[0.06]" />
                <span className="text-slate-600 text-[11px] font-medium">{day}</span>
                <div className="flex-1 h-px bg-white/[0.06]" />
              </div>
              <div className="space-y-2">
                {dayMessages.map((msg) => {
                  const isOwn   = msg.sender?.id?.toString() === currentUser._id?.toString();
                  const isLink  = !!msg.meetingLink;
                  const isSys   = msg.isSystem || msg.sender?.role === "System";

                  // System messages — centered, neutral style
                  if (isSys) {
                    return (
                      <div key={msg._id} className="flex justify-center my-2">
                        <div className="px-4 py-2 bg-slate-800/60 border border-white/[0.06] rounded-xl text-xs text-slate-400 text-center max-w-sm">
                          {msg.text}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={msg._id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] ${isOwn ? "items-end" : "items-start"} flex flex-col gap-1`}>
                        {!isOwn && (
                          <span className="text-xs text-slate-600 px-1">{msg.sender?.name}</span>
                        )}
                        <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed break-words ${
                          isOwn
                            ? `${accent.bubble} rounded-br-sm`
                            : "bg-slate-800 text-slate-200 rounded-bl-sm"
                        } ${msg.optimistic ? "opacity-70" : ""} ${isLink ? "border border-emerald-500/30" : ""}`}>
                          {isLink ? (
                            <div>
                              <p className="mb-1.5 whitespace-pre-line">{msg.text.split("\n")[0]}</p>
                              <a href={msg.meetingLink} target="_blank" rel="noreferrer"
                                className="flex items-center gap-1.5 text-emerald-300 underline underline-offset-2 text-xs font-medium break-all">
                                <PiLink size={12} /> {msg.meetingLink}
                              </a>
                            </div>
                          ) : (
                            <span className="whitespace-pre-line">{msg.text}</span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-600 px-1">
                          {formatTime(msg.createdAt)}
                          {isOwn && !msg.optimistic && <PiCheckCircle size={11} className="inline ml-1 text-slate-500" />}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-slate-800 rounded-2xl rounded-bl-sm px-4 py-2.5 flex gap-1 items-center">
              {[0,1,2].map(i => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Error banner ── */}
      {error && !loading && messages.length > 0 && (
        <div className="px-4 py-2 bg-red-500/10 border-t border-red-500/20">
          <p className="text-red-400 text-xs">{error}</p>
        </div>
      )}

      {/* ── Input area OR read-only footer ── */}
      {isReadOnly ? (
        <div className="px-4 py-3 border-t border-white/[0.07] flex items-center justify-center gap-2 bg-slate-900/60">
          <PiLockSimple size={14} className="text-slate-600" />
          <p className="text-slate-600 text-xs">Chat is closed for this session</p>
        </div>
      ) : (
        <div className="px-4 py-3 border-t border-white/[0.07] flex gap-2 items-end">
          <textarea
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message… (Enter to send)"
            rows={1}
            className={`flex-1 px-3 py-2.5 rounded-xl bg-slate-800 border border-white/[0.07] text-slate-200 placeholder-slate-500 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-${accentColor}-500 max-h-32 overflow-y-auto`}
            style={{ minHeight: "42px" }}
          />
          <button
            onClick={sendMessage}
            disabled={!text.trim() || sending}
            className={`p-2.5 rounded-xl ${accent.bg} text-white flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:opacity-90`}>
            {sending
              ? <PiCircleNotch size={18} className="animate-spin" />
              : <PiPaperPlaneTilt size={18} />
            }
          </button>
        </div>
      )}
    </div>
  );
};

export default MentorshipChat;
