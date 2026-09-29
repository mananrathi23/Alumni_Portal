// ConversationChat.jsx — the chat with one person. Connection messages, every
// mentorship session and meeting links between the two of you share this thread.
// Props: conversation (an item from GET /conversations), currentUser, accentColor,
//        onClose, onSent(message) (so the list can update its preview)

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API } from "../utils/api";
import { useSocket } from "../useSocket";
import { isProfane } from "../utils/profanityCheck";
import { useChatHistory } from "../utils/useChatHistory";
import {
  PiX, PiPaperPlaneTilt, PiLink, PiCircleNotch, PiCheckCircle, PiWarningCircle,
  PiChatCircleText, PiLockSimple, PiHandshake, PiUsersThree, PiVideoCamera,
} from "react-icons/pi";
import { safeUrl } from "../utils/safeUrl";
import { GOAL_LABELS } from "../utils/mentorship";

const ACCENT = {
  sky:     { bg: "bg-sky-500",     text: "text-sky-400",     bubble: "bg-sky-500 text-white",     ring: "focus:ring-sky-500" },
  emerald: { bg: "bg-emerald-500", text: "text-emerald-400", bubble: "bg-emerald-500 text-white", ring: "focus:ring-emerald-500" },
  violet:  { bg: "bg-violet-500",  text: "text-violet-400",  bubble: "bg-violet-500 text-white",  ring: "focus:ring-violet-500" },
};

const BLOCKED_REASON = "This chat has been blocked due to a policy violation. Please contact an administrator.";

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

export default function ConversationChat({ conversation, currentUser, accentColor = "sky", onClose, onSent }) {
  const { socketRef, isSocketReady } = useSocket();
  const accent = ACCENT[accentColor] || ACCENT.sky;
  const other = conversation.user;
  const otherId = conversation.userId;
  const messagesUrl = `${API}/conversations/${otherId}/messages`;

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [profanityWarning, setProfanityWarning] = useState(false);
  // Why the input is closed (session ended, blocked…), or null when chatting is allowed
  const [readOnlyReason, setReadOnlyReason] = useState(
    conversation.isBlocked ? BLOCKED_REASON : conversation.canSend ? null : conversation.readOnlyReason
  );

  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);

  const chat = useChatHistory(messagesUrl, { onError: setError });
  const { messages, setMessages, loading, consumePrepend } = chat;

  // ── Live updates ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isSocketReady || !socketRef.current) return;
    const socket = socketRef.current;

    const onNewMessage = (data) => {
      if (data.conversationKey !== conversation.key) return;
      const fromMe = data.fromUserId === currentUser._id?.toString();
      setMessages((prev) => {
        if (prev.some((m) => m._id === data.message._id)) return prev;
        // Our own message echoed back before the POST returned: swap out the placeholder
        const optimistic = fromMe && prev.find((m) => m.optimistic && m.text === data.message.text);
        return optimistic
          ? prev.map((m) => (m === optimistic ? data.message : m))
          : [...prev, data.message];
      });
      if (!fromMe) {
        setIsTyping(false);
        axios.put(`${API}/conversations/${otherId}/read`, {}, { withCredentials: true }).catch(() => { /* badge refreshes later */ });
      }
    };
    const onTyping = (data) => { if (data.fromUserId === otherId) setIsTyping(true); };
    const onStopTyping = (data) => { if (data.fromUserId === otherId) setIsTyping(false); };
    const onBlocked = (data) => { if (data.conversationKey === conversation.key) setReadOnlyReason(BLOCKED_REASON); };

    socket.on("chat:new_message", onNewMessage);
    socket.on("chat:typing", onTyping);
    socket.on("chat:stop_typing", onStopTyping);
    socket.on("chat:blocked", onBlocked);
    return () => {
      socket.off("chat:new_message", onNewMessage);
      socket.off("chat:typing", onTyping);
      socket.off("chat:stop_typing", onStopTyping);
      socket.off("chat:blocked", onBlocked);
    };
  }, [isSocketReady, socketRef, conversation.key, otherId, currentUser._id, setMessages]);

  useEffect(() => {
    if (consumePrepend()) return; // older messages were added above; keep position
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, consumePrepend]);

  // ── Send ───────────────────────────────────────────────────────────────────
  const sendMessage = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending || readOnlyReason) return;
    if (await isProfane(trimmed)) {
      setProfanityWarning(true);
      return;
    }
    setProfanityWarning(false);
    setError(null);
    setSending(true);
    const optimistic = {
      _id: `opt-${Date.now()}`,
      text: trimmed,
      sender: { id: currentUser._id, name: currentUser.name, role: currentUser.role },
      createdAt: new Date().toISOString(),
      optimistic: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    setText("");
    try {
      const res = await axios.post(messagesUrl, { text: trimmed }, { withCredentials: true });
      const real = res.data.message;
      setMessages((prev) => prev.some((m) => m._id === real._id)
        ? prev.filter((m) => m._id !== optimistic._id)
        : prev.map((m) => (m._id === optimistic._id ? real : m)));
      onSent?.(real);
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m._id !== optimistic._id));
      const msg = err.response?.data?.message || "Message failed to send.";
      if (err.response?.status === 403) setReadOnlyReason(msg); // session ended or chat blocked
      else setError(msg);
    } finally {
      setSending(false);
    }
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
    if (profanityWarning) setProfanityWarning(false);
    const socket = socketRef.current;
    if (!socket || readOnlyReason) return;
    socket.emit("chat:typing", { toUserId: otherId });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socketRef.current?.emit("chat:stop_typing", { toUserId: otherId });
    }, 1500);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const grouped = messages.reduce((acc, msg) => {
    const day = formatDay(msg.createdAt);
    (acc[day] ||= []).push(msg);
    return acc;
  }, {});

  const activeSessions = conversation.mentorships.filter((m) => m.status === "Accepted");
  const pastSessions = conversation.mentorships.length - activeSessions.length;

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-xl border border-white/[0.07] overflow-hidden">

      {/* ── Header: who, and how you're connected ── */}
      <div className="px-4 py-3 border-b border-white/[0.07] bg-slate-900/80 space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-9 h-9 rounded-xl ${accent.bg} flex-shrink-0 flex items-center justify-center text-white font-bold text-sm overflow-hidden`}>
              {other?.profilePhoto?.url
                ? <img src={other.profilePhoto.url} alt={other.name} className="w-full h-full object-cover" />
                : other?.name?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm truncate">{other?.name}</p>
              <p className={`text-xs ${accent.text}`}>{other?.role}</p>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-all">
              <PiX size={16} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {conversation.connectionId && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-white/[0.06]">
              <PiUsersThree size={11} /> Connected
            </span>
          )}
          {activeSessions.map((m) => (
            <span key={m._id} className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/25">
              <PiHandshake size={11} />
              Mentorship · {GOAL_LABELS[m.goal] || m.goal} · {m.slot?.day} {m.slot?.time}
              {m.meetingLink && (
                <a href={safeUrl(m.meetingLink)} target="_blank" rel="noreferrer"
                  className="ml-1 inline-flex items-center gap-0.5 underline underline-offset-2 hover:text-white">
                  <PiVideoCamera size={11} /> Join
                </a>
              )}
            </span>
          ))}
          {pastSessions > 0 && (
            <span className="text-[10px] text-slate-500">
              {pastSessions} past mentorship session{pastSessions !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* ── Messages ── */}
      <div ref={chat.containerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {!loading && chat.hasMore && (
          <button
            onClick={chat.loadOlder}
            disabled={chat.loadingOlder}
            className={`mx-auto block text-xs ${accent.text} hover:underline disabled:opacity-60`}
          >
            {chat.loadingOlder ? "Loading…" : "Load earlier messages"}
          </button>
        )}
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
              {readOnlyReason ? "There is no chat history with this person." : `Say hello to ${other?.name}!`}
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
                  const isOwn = msg.sender?.id?.toString() === currentUser._id?.toString();
                  const isLink = !!msg.meetingLink;
                  const isSys = msg.isSystem || msg.sender?.role === "System";

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
                        <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed break-words ${isOwn
                          ? `${accent.bubble} rounded-br-sm`
                          : "bg-slate-800 text-slate-200 rounded-bl-sm"
                          } ${msg.optimistic ? "opacity-70" : ""} ${isLink ? "border border-emerald-500/30" : ""}`}>
                          {isLink ? (
                            <div>
                              <p className="mb-1.5 whitespace-pre-line">{msg.text.split("\n")[0]}</p>
                              <a href={safeUrl(msg.meetingLink)} target="_blank" rel="noreferrer"
                                className="flex items-center gap-1.5 text-emerald-300 underline underline-offset-2 text-xs font-medium break-all">
                                <PiLink size={12} /> {msg.meetingLink}
                              </a>
                            </div>
                          ) : (
                            <span className="whitespace-pre-line">{msg.text}</span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-600 px-1">
                          {msg.mentorshipId && <span className="text-emerald-500/80 mr-1">Mentorship ·</span>}
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
              {[0, 1, 2].map((i) => (
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

      {/* ── Input, or why it's closed ── */}
      {readOnlyReason ? (
        <div className="px-4 py-3 border-t border-white/[0.07] flex items-center justify-center gap-2 bg-slate-900/60">
          <PiLockSimple size={14} className="text-slate-500 flex-shrink-0" />
          <p className="text-slate-500 text-xs text-center">{readOnlyReason}</p>
        </div>
      ) : (
        <div className="px-4 py-3 border-t border-white/[0.07] flex flex-col gap-2">
          {profanityWarning && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/25 rounded-lg">
              <PiWarningCircle size={14} className="text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-xs">Your message contains unprofessional language. Please revise before sending.</p>
            </div>
          )}
          <div className="flex gap-2 items-end">
            <textarea
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message… (Enter to send)"
              rows={1}
              className={`flex-1 px-3 py-2.5 rounded-xl bg-slate-800 border ${profanityWarning ? "border-red-500/50" : "border-white/[0.07]"} text-slate-200 placeholder-slate-500 text-sm resize-none focus:outline-none focus:ring-2 ${accent.ring} max-h-32`}
            />
            <button
              onClick={sendMessage}
              disabled={!text.trim() || sending}
              className={`p-2.5 rounded-xl ${accent.bg} text-white disabled:opacity-40 transition-all flex-shrink-0`}
            >
              {sending ? <PiCircleNotch size={18} className="animate-spin" /> : <PiPaperPlaneTilt size={18} />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
