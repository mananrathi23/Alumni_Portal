// MentorshipChat.jsx — Real-time chat for accepted mentorship sessions
// Works for Student, Alumni, and Teacher dashboards
// Usage: <MentorshipChat mentorshipId={...} currentUser={...} otherPerson={{ name, role }} onClose={...} />

import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { useSocket } from "../SocketContext";
import {
  PiX, PiPaperPlaneTilt, PiLink, PiCircleNotch,
  PiCheckCircle, PiWarningCircle, PiChatCircleText,
} from "react-icons/pi";

const API = "http://localhost:4000/api/v1/mentorship";

// Format timestamp as "HH:MM AM/PM"
function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
// Format date as "Today", "Yesterday", or "Mar 5"
function formatDay(iso) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

const MentorshipChat = ({ mentorshipId, currentUser, otherPerson, accentColor = "sky", onClose }) => {
  const { socketRef, isSocketReady } = useSocket();
  const [messages, setMessages]       = useState([]);
  const [text, setText]               = useState("");
  const [loading, setLoading]         = useState(true);
  const [sending, setSending]         = useState(false);
  const [error, setError]             = useState(null);
  const [isTyping, setIsTyping]       = useState(false);
  const [meetingLink, setMeetingLink] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [settingLink, setSettingLink]   = useState(false);
  const bottomRef     = useRef(null);
  const typingTimeout = useRef(null);
  const isMentor      = currentUser.role === "Alumni" || currentUser.role === "Teacher";

  // ── Fetch history on mount ─────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    axios.get(`${API}/chat/${mentorshipId}`, { withCredentials: true })
      .then(res => { setMessages(res.data.messages || []); setError(null); })
      .catch(() => setError("Failed to load messages."))
      .finally(() => setLoading(false));
  }, [mentorshipId]);

  // ── Socket: join room + listen for events ──────────────────────────────────
  useEffect(() => {
    if (!isSocketReady || !socketRef.current) return;
    const socket = socketRef.current;

    socket.emit("chat:join", mentorshipId);

    const onNewMessage = (data) => {
      if (data.mentorshipId?.toString() === mentorshipId?.toString()) {
        setMessages(prev => {
          // Deduplicate by _id
          const ids = new Set(prev.map(m => m._id));
          return ids.has(data.message._id) ? prev : [...prev, data.message];
        });
        setIsTyping(false);
      }
    };

    const onTyping    = () => setIsTyping(true);
    const onStopTyping = () => setIsTyping(false);

    socket.on("chat:new_message",  onNewMessage);
    socket.on("chat:typing",       onTyping);
    socket.on("chat:stop_typing",  onStopTyping);

    return () => {
      socket.emit("chat:leave", mentorshipId);
      socket.off("chat:new_message",  onNewMessage);
      socket.off("chat:typing",       onTyping);
      socket.off("chat:stop_typing",  onStopTyping);
    };
  }, [isSocketReady, mentorshipId]);

  // ── Auto-scroll to bottom when new message arrives ────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    // Optimistic UI
    const optimistic = {
      _id:       `opt-${Date.now()}`,
      text:      trimmed,
      sender:    { id: currentUser._id, name: currentUser.name, role: currentUser.role },
      createdAt: new Date().toISOString(),
      optimistic: true,
    };
    setMessages(prev => [...prev, optimistic]);
    setText("");
    try {
      const res = await axios.post(`${API}/chat/${mentorshipId}`, { text: trimmed }, { withCredentials: true });
      // Replace optimistic with real
      setMessages(prev => prev.map(m => m._id === optimistic._id ? res.data.message : m));
    } catch {
      // Rollback optimistic
      setMessages(prev => prev.filter(m => m._id !== optimistic._id));
      setError("Message failed to send. Try again.");
    } finally {
      setSending(false);
    }
  };

  // ── Typing indicator ──────────────────────────────────────────────────────
  const handleTextChange = (e) => {
    setText(e.target.value);
    if (!socketRef.current) return;
    socketRef.current.emit("chat:typing", { mentorshipId, userName: currentUser.name });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socketRef.current?.emit("chat:stop_typing", { mentorshipId });
    }, 1500);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // ── Set meeting link (mentor only) ────────────────────────────────────────
  const saveMeetingLink = async () => {
    if (!meetingLink.trim()) return;
    setSettingLink(true);
    try {
      await axios.put(`${API}/requests/${mentorshipId}/meeting-link`,
        { link: meetingLink.trim() }, { withCredentials: true });
      setShowLinkInput(false);
      setMeetingLink("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to set meeting link.");
    } finally { setSettingLink(false); }
  };

  // ── Group messages by day ─────────────────────────────────────────────────
  const grouped = messages.reduce((acc, msg) => {
    const day = formatDay(msg.createdAt);
    if (!acc[day]) acc[day] = [];
    acc[day].push(msg);
    return acc;
  }, {});

  const accent = {
    sky:     { ring: "ring-sky-500",     bg: "bg-sky-500",     text: "text-sky-400",     bubble: "bg-sky-500 text-white" },
    emerald: { ring: "ring-emerald-500", bg: "bg-emerald-500", text: "text-emerald-400", bubble: "bg-emerald-500 text-white" },
    violet:  { ring: "ring-violet-500",  bg: "bg-violet-500",  text: "text-violet-400",  bubble: "bg-violet-500 text-white" },
  }[accentColor] || { ring: "ring-sky-500", bg: "bg-sky-500", text: "text-sky-400", bubble: "bg-sky-500 text-white" };

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-xl border border-white/[0.07] overflow-hidden">

      {/* ── Header ── */}
      <div className={`flex items-center justify-between px-4 py-3 border-b border-white/[0.07] bg-slate-900/80`}>
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg ${accent.bg} flex items-center justify-center text-white font-bold text-sm`}>
            {otherPerson?.name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div>
            <p className="text-white font-semibold text-sm">{otherPerson?.name || "Mentor"}</p>
            <p className={`text-xs ${accent.text}`}>{otherPerson?.role || ""} · Session Chat</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isMentor && (
            <button onClick={() => setShowLinkInput(p => !p)}
              title="Share Meeting Link"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
              <PiLink size={16} />
            </button>
          )}
          {onClose && (
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-all">
              <PiX size={16} />
            </button>
          )}
        </div>
      </div>

      {/* ── Meeting link input (mentor only) ── */}
      {showLinkInput && isMentor && (
        <div className="px-4 py-3 border-b border-white/[0.07] bg-slate-800/50 flex gap-2">
          <input
            type="url"
            value={meetingLink}
            onChange={e => setMeetingLink(e.target.value)}
            placeholder="Paste Google Meet or Zoom link…"
            className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-white/[0.07] text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <button onClick={saveMeetingLink} disabled={settingLink}
            className={`px-3 py-2 rounded-lg ${accent.bg} text-white text-sm font-semibold disabled:opacity-50 transition-all`}>
            {settingLink ? <PiCircleNotch size={16} className="animate-spin"/> : "Share"}
          </button>
        </div>
      )}

      {/* ── Messages area ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <PiCircleNotch size={24} className={`${accent.text} animate-spin`} />
          </div>
        ) : error ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <PiWarningCircle size={24} className="text-red-400 mb-2" />
            <p className="text-slate-400 text-sm">{error}</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <PiChatCircleText size={28} className="text-slate-600 mb-3" />
            <p className="text-slate-400 font-medium text-sm">No messages yet</p>
            <p className="text-slate-600 text-xs mt-1">Start the conversation!</p>
          </div>
        ) : (
          Object.entries(grouped).map(([day, dayMessages]) => (
            <div key={day}>
              {/* Day separator */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-white/[0.06]" />
                <span className="text-slate-600 text-[11px] font-medium">{day}</span>
                <div className="flex-1 h-px bg-white/[0.06]" />
              </div>

              <div className="space-y-2">
                {dayMessages.map((msg) => {
                  const isOwn = msg.sender?.id?.toString() === currentUser._id?.toString();
                  const isLink = msg.meetingLink;

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
                        } ${msg.optimistic ? "opacity-70" : ""} ${isLink ? "border border-sky-500/30" : ""}`}>
                          {isLink ? (
                            <a href={msg.meetingLink} target="_blank" rel="noreferrer"
                              className="underline flex items-center gap-1.5">
                              <PiLink size={13} /> {msg.text}
                            </a>
                          ) : msg.text}
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

        {/* Typing indicator */}
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

      {/* ── Input area ── */}
      <div className="px-4 py-3 border-t border-white/[0.07] flex gap-2 items-end">
        <textarea
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message… (Enter to send)"
          rows={1}
          className="flex-1 px-3 py-2.5 rounded-xl bg-slate-800 border border-white/[0.07] text-slate-200 placeholder-slate-500 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sky-500 max-h-32 overflow-y-auto"
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
    </div>
  );
};

export default MentorshipChat;
