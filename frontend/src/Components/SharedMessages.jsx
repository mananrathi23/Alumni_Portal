// SharedMessages.jsx — Unified messages page for Student, Alumni, Teacher
// Tab 1: Mentorship chats (accepted/completed mentorship sessions)
// Tab 2: Connection chats (peer-to-peer connections chat)

import { useState, useEffect, useContext, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { Context } from "../main";
import { useSocket } from "../SocketContext";
import MentorshipChat from "./MentorshipChat";
import {
  PiMagnifyingGlass, PiEnvelope, PiChatsCircle,
  PiHandshake, PiCircleNotch, PiUsersThree,
  PiPaperPlaneTilt, PiX, PiTrash, PiCheckCircle,
  PiChatCircleText, PiClock,
} from "react-icons/pi";
import { FaLinkedin, FaGithub } from "react-icons/fa";

const API_MENTORSHIP = "http://localhost:4000/api/v1/mentorship";
const API_CONN = "http://localhost:4000/api/v1/connections";

const GOAL_LABELS = {
  career: "Career Guidance", resume: "Resume Review",
  interview: "Interview Prep", technical: "Technical Help", general: "General Advice",
};

const THEME = {
  Student: { ring: "ring-sky-500", bg: "bg-sky-500", text: "text-sky-400", border: "border-sky-500/30", active: "bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/30" },
  Alumni:  { ring: "ring-emerald-500", bg: "bg-emerald-500", text: "text-emerald-400", border: "border-emerald-500/30", active: "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30" },
  Teacher: { ring: "ring-violet-500", bg: "bg-violet-500", text: "text-violet-400", border: "border-violet-500/30", active: "bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/30" },
};

const ROLE_GRADIENT = {
  Student: "from-sky-400 to-sky-600",
  Alumni:  "from-emerald-400 to-emerald-600",
  Teacher: "from-violet-400 to-violet-600",
};

const ROLE_BADGE = {
  Student: "bg-sky-500/15 text-sky-400 border-sky-500/25",
  Alumni:  "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  Teacher: "bg-violet-500/15 text-violet-400 border-violet-500/25",
};

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

// ── Connection Chat Panel ─────────────────────────────────────────────────────
const ConnectionChatPanel = ({ connection, currentUser, accentColor, onClose, onRemove }) => {
  const { socketRef, isSocketReady } = useSocket();
  const theme = THEME[currentUser.role] || THEME.Student;

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);
  const connectionId = connection.connectionId;
  const other = connection.connectedWith;

  useEffect(() => {
    setLoading(true);
    setMessages([]);
    axios.get(`${API_CONN}/${connectionId}/chat`, { withCredentials: true })
      .then((r) => setMessages(r.data.messages || []))
      .finally(() => setLoading(false));
  }, [connectionId]);

  useEffect(() => {
    if (!isSocketReady || !socketRef.current) return;
    const socket = socketRef.current;
    socket.emit("conn_chat:join", connectionId);

    const onMsg = (data) => {
      if (data.connectionId?.toString() === connectionId?.toString()) {
        setMessages((prev) => {
          const ids = new Set(prev.map((m) => m._id));
          return ids.has(data.message._id) ? prev : [...prev, data.message];
        });
        setIsTyping(false);
      }
    };
    const onTyping = (data) => { if (data.connectionId === connectionId) setIsTyping(true); };
    const onStopTyping = (data) => { if (data.connectionId === connectionId) setIsTyping(false); };

    socket.on("connection:chat_message", onMsg);
    socket.on("conn_chat:typing", onTyping);
    socket.on("conn_chat:stop_typing", onStopTyping);

    return () => {
      socket.emit("conn_chat:leave", connectionId);
      socket.off("connection:chat_message", onMsg);
      socket.off("conn_chat:typing", onTyping);
      socket.off("conn_chat:stop_typing", onStopTyping);
    };
  }, [isSocketReady, connectionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
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
      const res = await axios.post(`${API_CONN}/${connectionId}/chat`, { text: trimmed }, { withCredentials: true });
      setMessages((prev) => prev.map((m) => (m._id === optimistic._id ? res.data.message : m)));
    } catch {
      setMessages((prev) => prev.filter((m) => m._id !== optimistic._id));
    } finally {
      setSending(false);
    }
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
    if (!socketRef.current) return;
    socketRef.current.emit("conn_chat:typing", { connectionId, userName: currentUser.name });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socketRef.current?.emit("conn_chat:stop_typing", { connectionId });
    }, 1500);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const grouped = messages.reduce((acc, msg) => {
    const day = formatDay(msg.createdAt);
    if (!acc[day]) acc[day] = [];
    acc[day].push(msg);
    return acc;
  }, {});

  const grad = ROLE_GRADIENT[other?.role] || "from-sky-400 to-sky-600";

  const bubbleBg = accentColor === "sky" ? "bg-sky-500"
    : accentColor === "emerald" ? "bg-emerald-500"
    : "bg-violet-500";

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-xl border border-white/[0.07] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07] bg-slate-900/90 flex-shrink-0">
        <button onClick={() => setShowInfo((v) => !v)} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center text-white font-bold text-sm`}>
            {other?.name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div className="text-left">
            <p className="text-white font-semibold text-sm leading-tight">{other?.name}</p>
            <p className={`text-xs ${theme.text}`}>{other?.role} · Connected</p>
          </div>
        </button>
        <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-all">
          <PiX size={16} />
        </button>
      </div>

      {/* Info panel */}
      {showInfo && (
        <div className="bg-slate-800/80 border-b border-white/[0.06] px-4 py-3 space-y-1.5 flex-shrink-0">
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${ROLE_BADGE[other?.role]}`}>{other?.role}</span>
            <button onClick={onRemove} className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded-lg hover:bg-red-500/10 transition-all">
              <PiTrash size={12} /> Remove
            </button>
          </div>
          <div className="flex gap-2 mt-1">
            {other?.linkedIn && (
              <a href={other.linkedIn} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-sky-400 transition-colors">
                <FaLinkedin size={14} />
              </a>
            )}
            {other?.github && (
              <a href={other.github} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-white transition-colors">
                <FaGithub size={14} />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <PiCircleNotch size={22} className={`${theme.text} animate-spin`} />
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <PiChatCircleText size={28} className="text-slate-600 mb-3" />
            <p className="text-slate-400 font-medium text-sm">No messages yet</p>
            <p className="text-slate-600 text-xs mt-1">Say hello to {other?.name}!</p>
          </div>
        ) : (
          Object.entries(grouped).map(([day, dayMsgs]) => (
            <div key={day}>
              <div className="flex items-center gap-3 my-3">
                <div className="flex-1 h-px bg-white/[0.06]" />
                <span className="text-slate-600 text-[11px] font-medium">{day}</span>
                <div className="flex-1 h-px bg-white/[0.06]" />
              </div>
              <div className="space-y-2">
                {dayMsgs.map((msg) => {
                  const isOwn = msg.sender?.id?.toString() === currentUser._id?.toString();
                  return (
                    <div key={msg._id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[78%] flex flex-col gap-1 ${isOwn ? "items-end" : "items-start"}`}>
                        {!isOwn && <span className="text-xs text-slate-600 px-1">{msg.sender?.name}</span>}
                        <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed break-words ${
                          isOwn ? `${bubbleBg} text-white rounded-br-sm` : "bg-slate-800 text-slate-200 rounded-bl-sm"
                        } ${msg.optimistic ? "opacity-70" : ""}`}>
                          <span className="whitespace-pre-line">{msg.text}</span>
                        </div>
                        <span className="text-[10px] text-slate-600 px-1">
                          {formatTime(msg.createdAt)}
                          {isOwn && !msg.optimistic && <PiCheckCircle size={11} className="inline ml-1 text-slate-600" />}
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

      {/* Input */}
      <div className="px-4 py-3 border-t border-white/[0.07] flex gap-2 items-end flex-shrink-0">
        <textarea
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message… (Enter to send)"
          rows={1}
          className={`flex-1 px-3 py-2.5 rounded-xl bg-slate-800 border border-white/[0.07] text-slate-200 placeholder-slate-500 text-sm resize-none focus:outline-none focus:ring-2 ${theme.ring} max-h-32 overflow-y-auto`}
          style={{ minHeight: "42px" }}
        />
        <button
          onClick={sendMessage}
          disabled={!text.trim() || sending}
          className={`p-2.5 rounded-xl ${theme.bg} text-white flex-shrink-0 disabled:opacity-40 transition-all`}
        >
          {sending ? <PiCircleNotch size={18} className="animate-spin" /> : <PiPaperPlaneTilt size={18} />}
        </button>
      </div>
    </div>
  );
};

// ── Main Unified Messages Component ──────────────────────────────────────────
export default function SharedMessages({ role, accentColor }) {
  const { user } = useContext(Context);
  const { socketRef, isSocketReady } = useSocket();
  const [searchParams] = useSearchParams();
  const deepLinkSession = searchParams.get("session");
  const deepLinkConn = searchParams.get("conn");

  const theme = THEME[role] || THEME.Student;
  const color = accentColor || (role === "Alumni" ? "emerald" : role === "Teacher" ? "violet" : "sky");

  // ── Tab state ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState(deepLinkConn ? "connections" : "mentorship");

  // ── Mentorship state ───────────────────────────────────────────────────────
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [selectedSessionId, setSelectedSessionId] = useState(deepLinkSession || null);
  const [mentorshipUnread, setMentorshipUnread] = useState({});
  const [sessionSearch, setSessionSearch] = useState("");
  const [mobileShowMentorChat, setMobileShowMentorChat] = useState(!!deepLinkSession);

  // ── Connections state ──────────────────────────────────────────────────────
  const [connections, setConnections] = useState([]);
  const [connectionsLoading, setConnectionsLoading] = useState(true);
  const [selectedConnId, setSelectedConnId] = useState(deepLinkConn || null);
  const [connUnread, setConnUnread] = useState({});
  const [connSearch, setConnSearch] = useState("");
  const [mobileShowConnChat, setMobileShowConnChat] = useState(!!deepLinkConn);

  // ── Fetch mentorship sessions ──────────────────────────────────────────────
  const fetchSessions = async () => {
    try {
      const res = await axios.get(`${API_MENTORSHIP}/requests`, { withCredentials: true });
      const all = res.data.requests || [];
      const active = all.filter((r) => ["Accepted", "Completed"].includes(r.status));
      setSessions(active);
    } catch { setSessions([]); }
    finally { setSessionsLoading(false); }
  };

  const fetchMentorshipUnread = async () => {
    try {
      const res = await axios.get(`${API_MENTORSHIP}/chat/unread-counts`, { withCredentials: true });
      setMentorshipUnread(res.data.unread || {});
    } catch {}
  };

  // ── Fetch connections ──────────────────────────────────────────────────────
  const fetchConnections = useCallback(async () => {
    try {
      const res = await axios.get(`${API_CONN}`, { withCredentials: true });
      setConnections(res.data.connections || []);
    } catch { setConnections([]); }
    finally { setConnectionsLoading(false); }
  }, []);

  const fetchConnUnread = useCallback(async () => {
    try {
      const res = await axios.get(`${API_CONN}/chat/unread-counts`, { withCredentials: true });
      setConnUnread(res.data.unread || {});
    } catch {}
  }, []);

  useEffect(() => {
    fetchSessions();
    fetchMentorshipUnread();
    fetchConnections();
    fetchConnUnread();
  }, []);

  // ── Deep link handling ─────────────────────────────────────────────────────
  useEffect(() => {
    if (deepLinkSession) { setSelectedSessionId(deepLinkSession); setMobileShowMentorChat(true); setActiveTab("mentorship"); }
  }, [deepLinkSession]);

  useEffect(() => {
    if (deepLinkConn) { setSelectedConnId(deepLinkConn); setMobileShowConnChat(true); setActiveTab("connections"); }
  }, [deepLinkConn]);

  // ── Socket: new message notifications ─────────────────────────────────────
  useEffect(() => {
    if (!isSocketReady || !socketRef.current) return;
    const socket = socketRef.current;

    // Mentorship unread
    const onMentorMsg = () => fetchMentorshipUnread();
    socket.on("chat:new_message", onMentorMsg);

    // Connection unread
    const onConnMsg = (data) => {
      const cid = data.connectionId?.toString();
      if (cid && cid !== selectedConnId?.toString()) {
        setConnUnread((prev) => ({ ...prev, [cid]: (prev[cid] || 0) + 1 }));
      }
    };
    socket.on("connection:chat_message", onConnMsg);

    return () => {
      socket.off("chat:new_message", onMentorMsg);
      socket.off("connection:chat_message", onConnMsg);
    };
  }, [isSocketReady, selectedConnId]);

  // Clear unread on open
  useEffect(() => {
    if (selectedSessionId) setMentorshipUnread((prev) => ({ ...prev, [selectedSessionId]: 0 }));
  }, [selectedSessionId]);
  useEffect(() => {
    if (selectedConnId) setConnUnread((prev) => ({ ...prev, [selectedConnId]: 0 }));
  }, [selectedConnId]);

  // ── Filtered lists ─────────────────────────────────────────────────────────
  const filteredSessions = sessions.filter((s) => {
    const q = sessionSearch.toLowerCase();
    const other = role === "Student" ? s.mentor?.name : s.student?.name;
    return !sessionSearch || (other || "").toLowerCase().includes(q);
  });

  const filteredConnections = connections.filter((c) => {
    const q = connSearch.toLowerCase();
    return !connSearch || (c.connectedWith?.name || "").toLowerCase().includes(q);
  });

  const selectedSession = sessions.find((s) => s._id === selectedSessionId);
  const selectedConnection = connections.find((c) => c.connectionId?.toString() === selectedConnId?.toString());

  const getOther = (s) => role === "Student"
    ? { name: s.mentor?.name, role: s.mentor?.role }
    : { name: s.student?.name, role: "Student" };

  // ── Totals for tab badges ──────────────────────────────────────────────────
  const totalMentorUnread = Object.values(mentorshipUnread).reduce((a, b) => a + b, 0);
  const totalConnUnread = Object.values(connUnread).reduce((a, b) => a + b, 0);

  const handleRemoveConnection = async () => {
    if (!selectedConnId) return;
    try {
      await axios.delete(`${API_CONN}/${selectedConnId}/remove`, { withCredentials: true });
      setConnections((prev) => prev.filter((c) => c.connectionId?.toString() !== selectedConnId?.toString()));
      setSelectedConnId(null);
      setMobileShowConnChat(false);
    } catch {}
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-slate-900 border border-white/[0.07] rounded-xl overflow-hidden" style={{ height: "calc(100vh - 7rem)" }}>
        <div className="flex h-full">

          {/* ── LEFT PANEL ── */}
          <div className={`${
            (activeTab === "mentorship" && mobileShowMentorChat) || (activeTab === "connections" && mobileShowConnChat)
              ? "hidden sm:flex" : "flex"
          } w-full sm:w-72 lg:w-80 flex-col border-r border-white/[0.07] flex-shrink-0`}>

            {/* Tab switcher */}
            <div className="px-3 pt-3 pb-2 border-b border-white/[0.07] flex-shrink-0">
              <div className="flex gap-1 bg-slate-800/60 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab("mentorship")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-semibold transition-all ${
                    activeTab === "mentorship" ? theme.active : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  <PiHandshake size={14} />
                  Mentorship
                  {totalMentorUnread > 0 && (
                    <span className={`text-[9px] font-bold px-1 py-0.5 rounded-full ${theme.bg} text-white`}>{totalMentorUnread}</span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("connections")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-semibold transition-all ${
                    activeTab === "connections" ? theme.active : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  <PiUsersThree size={14} />
                  Connections
                  {totalConnUnread > 0 && (
                    <span className={`text-[9px] font-bold px-1 py-0.5 rounded-full ${theme.bg} text-white`}>{totalConnUnread}</span>
                  )}
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="px-3 py-2 border-b border-white/[0.07] flex-shrink-0">
              <div className="relative">
                <PiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={13} />
                <input
                  type="text"
                  placeholder={activeTab === "mentorship" ? "Search sessions…" : "Search connections…"}
                  value={activeTab === "mentorship" ? sessionSearch : connSearch}
                  onChange={(e) => activeTab === "mentorship" ? setSessionSearch(e.target.value) : setConnSearch(e.target.value)}
                  className={`w-full pl-8 pr-3 py-2 rounded-lg bg-slate-800 border border-white/[0.07] text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:ring-2 ${theme.ring}`}
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">

              {/* ── Mentorship sessions list ── */}
              {activeTab === "mentorship" && (
                sessionsLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <PiCircleNotch size={22} className={`${theme.text} animate-spin`} />
                  </div>
                ) : filteredSessions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center px-6">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mb-3">
                      <PiHandshake size={22} className="text-slate-600" />
                    </div>
                    <p className="text-slate-400 font-medium text-sm">No active sessions</p>
                    <p className="text-slate-600 text-xs mt-1">
                      {role === "Student" ? "Send a mentorship request to start chatting" : "Accept a request to unlock chat"}
                    </p>
                  </div>
                ) : (
                  filteredSessions.map((s) => {
                    const other = getOther(s);
                    const unread = mentorshipUnread[s._id] || 0;
                    const isActive = selectedSessionId === s._id;
                    return (
                      <button
                        key={s._id}
                        onClick={() => { setSelectedSessionId(s._id); setMobileShowMentorChat(true); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 border-b border-white/[0.04] text-left transition-all ${
                          isActive ? `bg-slate-800 ${theme.border} border-l-2` : "hover:bg-slate-800/50"
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-bold text-sm ${
                          other.role === "Alumni" ? "bg-gradient-to-br from-emerald-400 to-emerald-600"
                            : other.role === "Teacher" ? "bg-gradient-to-br from-violet-400 to-violet-600"
                            : "bg-gradient-to-br from-sky-400 to-sky-600"
                        }`}>
                          {(other.name || "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-white text-sm font-semibold truncate">{other.name}</p>
                            {unread > 0 && (
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${theme.bg} text-white ml-2 flex-shrink-0`}>{unread}</span>
                            )}
                          </div>
                          <p className="text-slate-500 text-xs truncate">
                            {GOAL_LABELS[s.goal] || s.goal} · {s.slot?.day} {s.slot?.time}
                          </p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${s.status === "Accepted" ? "bg-emerald-400" : "bg-slate-500"}`} />
                            <span className="text-slate-600 text-[10px]">{s.status}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )
              )}

              {/* ── Connections list ── */}
              {activeTab === "connections" && (
                connectionsLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <PiCircleNotch size={22} className={`${theme.text} animate-spin`} />
                  </div>
                ) : filteredConnections.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center px-6">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mb-3">
                      <PiUsersThree size={22} className="text-slate-600" />
                    </div>
                    <p className="text-slate-400 font-medium text-sm">
                      {connSearch ? "No results found" : "No connections yet"}
                    </p>
                    <p className="text-slate-600 text-xs mt-1">
                      {!connSearch && "Connect with people from the People Directory"}
                    </p>
                  </div>
                ) : (
                  filteredConnections.map((c) => {
                    const other = c.connectedWith;
                    const unread = connUnread[c.connectionId?.toString()] || 0;
                    const isActive = selectedConnId?.toString() === c.connectionId?.toString();
                    const grad = ROLE_GRADIENT[other?.role] || "from-sky-400 to-sky-600";
                    return (
                      <button
                        key={c.connectionId}
                        onClick={() => { setSelectedConnId(c.connectionId); setMobileShowConnChat(true); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 border-b border-white/[0.04] text-left transition-all ${
                          isActive ? `bg-slate-800 ${theme.border} border-l-2` : "hover:bg-slate-800/50"
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                          {other?.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-white text-sm font-semibold truncate">{other?.name}</p>
                            {unread > 0 && (
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-2 flex-shrink-0 ${theme.bg} text-white`}>{unread}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${ROLE_BADGE[other?.role]}`}>{other?.role}</span>
                            <span className="text-slate-600 text-[10px]">Connected</span>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )
              )}
            </div>

            {/* Footer count */}
            {!sessionsLoading && !connectionsLoading && (
              <div className="px-4 py-2 border-t border-white/[0.06] flex-shrink-0">
                <p className="text-slate-600 text-xs text-center">
                  {activeTab === "mentorship"
                    ? `${sessions.length} session${sessions.length !== 1 ? "s" : ""}`
                    : `${connections.length} connection${connections.length !== 1 ? "s" : ""}`}
                </p>
              </div>
            )}
          </div>

          {/* ── RIGHT PANEL (Chat) ── */}
          <div className={`${
            (activeTab === "mentorship" && mobileShowMentorChat) || (activeTab === "connections" && mobileShowConnChat)
              ? "flex" : "hidden sm:flex"
          } flex-1 flex-col min-w-0`}>

            {/* Mentorship chat */}
            {activeTab === "mentorship" && (
              selectedSession ? (
                <MentorshipChat
                  key={selectedSessionId}
                  mentorshipId={selectedSessionId}
                  currentUser={{ _id: user?._id, name: user?.name, role }}
                  otherPerson={getOther(selectedSession)}
                  accentColor={color}
                  sessionStatus={selectedSession.status}
                  onClose={() => { setMobileShowMentorChat(false); setSelectedSessionId(null); }}
                />
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center text-center px-8">
                  <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
                    <PiHandshake size={30} className="text-slate-600" />
                  </div>
                  <p className="text-slate-300 font-semibold">Select a mentorship session</p>
                  <p className="text-slate-500 text-sm mt-1">
                    {role === "Student" ? "Your accepted mentorship chats appear here" : "Chats with your students appear here"}
                  </p>
                </div>
              )
            )}

            {/* Connection chat */}
            {activeTab === "connections" && (
              selectedConnection ? (
                <ConnectionChatPanel
                  key={selectedConnId}
                  connection={selectedConnection}
                  currentUser={{ _id: user?._id, name: user?.name, role }}
                  accentColor={color}
                  onClose={() => { setMobileShowConnChat(false); setSelectedConnId(null); }}
                  onRemove={handleRemoveConnection}
                />
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center text-center px-8">
                  <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
                    <PiUsersThree size={30} className="text-slate-600" />
                  </div>
                  <p className="text-slate-300 font-semibold">Select a connection</p>
                  <p className="text-slate-500 text-sm mt-1">
                    Chat directly with your connections
                  </p>
                </div>
              )
            )}
          </div>

        </div>
      </div>
    </div>
  );
}