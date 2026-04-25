// SharedConnectionsPage.jsx
// My Connections tab: shows accepted connections + opens real-time chat
// Usage: <SharedConnectionsPage role="Student" accentColor="sky" />

import { useState, useEffect, useRef, useContext, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { Context } from "../main";
import { useSocket } from "../SocketContext";
import {
  PiMagnifyingGlass, PiUsersThree, PiChatCircleText,
  PiPaperPlaneTilt, PiCircleNotch, PiX, PiTrash,
  PiCheckCircle, PiClock, PiEnvelopeSimple,
} from "react-icons/pi";
import { FaLinkedin, FaGithub, FaGlobe } from "react-icons/fa";

const API_BASE = "http://localhost:4000/api/v1";

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

const ACCENT = {
  sky:    { ring: "focus:ring-sky-500",     send: "bg-sky-500 hover:bg-sky-400",     text: "text-sky-400",     border: "border-l-sky-500",     active: "bg-sky-500/10" },
  emerald:{ ring: "focus:ring-emerald-500", send: "bg-emerald-500 hover:bg-emerald-400", text: "text-emerald-400", border: "border-l-emerald-500", active: "bg-emerald-500/10" },
  violet: { ring: "focus:ring-violet-500",  send: "bg-violet-500 hover:bg-violet-400",  text: "text-violet-400",  border: "border-l-violet-500",  active: "bg-violet-500/10" },
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

// ── Chat Panel ────────────────────────────────────────────────────────────────
const ChatPanel = ({ connection, currentUser, accentColor, onClose, onRemove }) => {
  const { socketRef, isSocketReady } = useSocket();
  const ac = ACCENT[accentColor] || ACCENT.sky;

  const [messages, setMessages]   = useState([]);
  const [text, setText]           = useState("");
  const [loading, setLoading]     = useState(true);
  const [sending, setSending]     = useState(false);
  const [isTyping, setIsTyping]   = useState(false);
  const [showInfo, setShowInfo]   = useState(false);

  const bottomRef     = useRef(null);
  const typingTimeout = useRef(null);
  const connectionId  = connection.connectionId;
  const other         = connection.connectedWith;

  // Fetch chat history
  useEffect(() => {
    setLoading(true);
    setMessages([]);
    axios
      .get(`${API_BASE}/connections/${connectionId}/chat`, { withCredentials: true })
      .then((r) => setMessages(r.data.messages || []))
      .catch(() => toast.error("Failed to load messages."))
      .finally(() => setLoading(false));
  }, [connectionId]);

  // Socket listeners
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
        // Mark as read explicitly to avoid unread badge bug
        axios.put(`${API_BASE}/connections/${connectionId}/chat/read`, {}, { withCredentials: true }).catch(() => {});
      }
    };
    const onTyping    = (data) => { if (data.connectionId === connectionId) setIsTyping(true); };
    const onStopTyping = (data) => { if (data.connectionId === connectionId) setIsTyping(false); };

    socket.on("connection:chat_message", onMsg);
    socket.on("conn_chat:typing",        onTyping);
    socket.on("conn_chat:stop_typing",   onStopTyping);

    return () => {
      socket.emit("conn_chat:leave", connectionId);
      socket.off("connection:chat_message", onMsg);
      socket.off("conn_chat:typing",        onTyping);
      socket.off("conn_chat:stop_typing",   onStopTyping);
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
      const res = await axios.post(
        `${API_BASE}/connections/${connectionId}/chat`,
        { text: trimmed },
        { withCredentials: true }
      );
      setMessages((prev) =>
        prev.map((m) => (m._id === optimistic._id ? res.data.message : m))
      );
    } catch {
      setMessages((prev) => prev.filter((m) => m._id !== optimistic._id));
      toast.error("Failed to send message.");
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

  // Group by day
  const grouped = messages.reduce((acc, msg) => {
    const day = formatDay(msg.createdAt);
    if (!acc[day]) acc[day] = [];
    acc[day].push(msg);
    return acc;
  }, {});

  const grad = ROLE_GRADIENT[other?.role] || "from-sky-400 to-sky-600";

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-xl border border-white/[0.07] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07] bg-slate-900/90 flex-shrink-0">
        <button
          onClick={() => setShowInfo((v) => !v)}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center text-white font-bold text-sm`}>
            {other?.name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div className="text-left">
            <p className="text-white font-semibold text-sm leading-tight">{other?.name}</p>
            <p className={`text-xs ${ac.text}`}>{other?.role}</p>
          </div>
        </button>
        <div className="flex items-center gap-1">
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-all"
          >
            <PiX size={16} />
          </button>
        </div>
      </div>

      {/* Info panel slide-down */}
      {showInfo && (
        <div className="bg-slate-800/80 border-b border-white/[0.06] px-4 py-3 space-y-1.5 flex-shrink-0">
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${ROLE_BADGE[other?.role]}`}>{other?.role}</span>
            <button
              onClick={onRemove}
              className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded-lg hover:bg-red-500/10 transition-all"
            >
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
            {other?.portfolio && (
              <a href={other.portfolio} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-emerald-400 transition-colors" title="Portfolio">
                <FaGlobe size={14} />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <PiCircleNotch size={22} className={`${ac.text} animate-spin`} />
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
                        {!isOwn && (
                          <span className="text-xs text-slate-600 px-1">{msg.sender?.name}</span>
                        )}
                        <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed break-words ${
                          isOwn
                            ? `bg-${accentColor === "sky" ? "sky" : accentColor === "emerald" ? "emerald" : "violet"}-500 text-white rounded-br-sm`
                            : "bg-slate-800 text-slate-200 rounded-bl-sm"
                        } ${msg.optimistic ? "opacity-70" : ""}`}>
                          <span className="whitespace-pre-line">{msg.text}</span>
                        </div>
                        <span className="text-[10px] text-slate-600 px-1">
                          {formatTime(msg.createdAt)}
                          {isOwn && !msg.optimistic && (
                            <PiCheckCircle size={11} className="inline ml-1 text-slate-600" />
                          )}
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
          className={`flex-1 px-3 py-2.5 rounded-xl bg-slate-800 border border-white/[0.07] text-slate-200 placeholder-slate-500 text-sm resize-none focus:outline-none focus:ring-2 ${ac.ring} max-h-32 overflow-y-auto`}
          style={{ minHeight: "42px" }}
        />
        <button
          onClick={sendMessage}
          disabled={!text.trim() || sending}
          className={`p-2.5 rounded-xl ${ac.send} text-white flex-shrink-0 disabled:opacity-40 transition-all`}
        >
          {sending
            ? <PiCircleNotch size={18} className="animate-spin" />
            : <PiPaperPlaneTilt size={18} />
          }
        </button>
      </div>
    </div>
  );
};

// ── Connection Card (sidebar item) ────────────────────────────────────────────
const ConnectionItem = ({ connection, isSelected, unread, onClick, accentColor }) => {
  const ac = ACCENT[accentColor] || ACCENT.sky;
  const other = connection.connectedWith;
  const grad  = ROLE_GRADIENT[other?.role] || "from-sky-400 to-sky-600";

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 border-b border-white/[0.04] text-left transition-all hover:bg-slate-800/50 ${
        isSelected ? `${ac.active} border-l-2 ${ac.border}` : ""
      }`}
    >
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
        {other?.name?.charAt(0)?.toUpperCase() || "?"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-white text-sm font-semibold truncate">{other?.name}</p>
          {unread > 0 && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-2 flex-shrink-0 ${
              accentColor === "sky" ? "bg-sky-500 text-white" :
              accentColor === "emerald" ? "bg-emerald-500 text-white" :
              "bg-violet-500 text-white"
            }`}>
              {unread}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${ROLE_BADGE[other?.role]}`}>
            {other?.role}
          </span>
          <span className="text-slate-600 text-[10px]">Connected</span>
        </div>
      </div>
    </button>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
export default function SharedConnectionsPage({ role, accentColor = "sky" }) {
  const { user }                     = useContext(Context);
  const { socketRef, isSocketReady } = useSocket();
  const [searchParams]               = useSearchParams();
  const deepLinkId                   = searchParams.get("conn");

  const ac = ACCENT[accentColor] || ACCENT.sky;

  const [connections, setConnections]   = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [selectedId, setSelectedId]     = useState(deepLinkId || null);
  const [unread, setUnread]             = useState({});
  const [mobileShowChat, setMobileShowChat] = useState(!!deepLinkId);

  const fetchConnections = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/connections`, { withCredentials: true });
      setConnections(res.data.connections || []);
    } catch {
      setConnections([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUnread = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/connections/chat/unread-counts`, { withCredentials: true });
      setUnread(res.data.unread || {});
    } catch {}
  }, []);

  useEffect(() => {
    fetchConnections();
    fetchUnread();
  }, []);

  // Socket: new message notification
  useEffect(() => {
    if (!isSocketReady || !socketRef.current) return;
    const socket = socketRef.current;

    const onMsg = (data) => {
      const cid = data.connectionId?.toString();
      if (cid && cid !== selectedId?.toString()) {
        setUnread((prev) => ({ ...prev, [cid]: (prev[cid] || 0) + 1 }));
      }
    };
    socket.on("connection:chat_message", onMsg);
    return () => socket.off("connection:chat_message", onMsg);
  }, [isSocketReady, selectedId]);

  // Clear unread when opening chat
  useEffect(() => {
    if (selectedId) {
      setUnread((prev) => ({ ...prev, [selectedId]: 0 }));
    }
  }, [selectedId]);

  // Deep link
  useEffect(() => {
    if (deepLinkId) { setSelectedId(deepLinkId); setMobileShowChat(true); }
  }, [deepLinkId]);

  const filtered = connections.filter((c) => {
    const q = search.toLowerCase();
    return !search || (c.connectedWith?.name || "").toLowerCase().includes(q);
  });

  const selectedConnection = connections.find((c) => c.connectionId?.toString() === selectedId?.toString());

  const handleRemove = async () => {
    if (!selectedId) return;
    try {
      await axios.delete(`${API_BASE}/connections/${selectedId}/remove`, { withCredentials: true });
      toast.success("Connection removed.");
      setConnections((prev) => prev.filter((c) => c.connectionId?.toString() !== selectedId?.toString()));
      setSelectedId(null);
      setMobileShowChat(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove connection.");
    }
  };

  const totalUnread = Object.values(unread).reduce((a, b) => a + b, 0);

  return (
    <div className="max-w-5xl mx-auto">
      <div
        className="bg-slate-900 border border-white/[0.07] rounded-xl overflow-hidden"
        style={{ height: "calc(100vh - 7rem)" }}
      >
        <div className="flex h-full">

          {/* ── LEFT: Connections list ── */}
          <div className={`${mobileShowChat ? "hidden sm:flex" : "flex"} w-full sm:w-72 lg:w-80 flex-col border-r border-white/[0.07] flex-shrink-0`}>

            {/* Header */}
            <div className="px-4 pt-4 pb-3 border-b border-white/[0.07]">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-white font-bold text-base flex items-center gap-2">
                  <PiUsersThree className={ac.text} size={18} />
                  My Connections
                </h2>
                {totalUnread > 0 && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    accentColor === "sky" ? "bg-sky-500" :
                    accentColor === "emerald" ? "bg-emerald-500" : "bg-violet-500"
                  } text-white`}>
                    {totalUnread}
                  </span>
                )}
              </div>
              <div className="relative">
                <PiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                <input
                  type="text"
                  placeholder="Search connections…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={`w-full pl-8 pr-3 py-2 rounded-lg bg-slate-800 border border-white/[0.07] text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 ${ac.ring}`}
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <PiCircleNotch size={22} className={`${ac.text} animate-spin`} />
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-6">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mb-3">
                    <PiUsersThree size={22} className="text-slate-600" />
                  </div>
                  <p className="text-slate-400 font-medium text-sm">
                    {search ? "No results found" : "No connections yet"}
                  </p>
                  <p className="text-slate-600 text-xs mt-1">
                    {!search && "Connect with people from the People Directory"}
                  </p>
                </div>
              ) : (
                filtered.map((c) => (
                  <ConnectionItem
                    key={c.connectionId}
                    connection={c}
                    isSelected={selectedId?.toString() === c.connectionId?.toString()}
                    unread={unread[c.connectionId?.toString()] || 0}
                    accentColor={accentColor}
                    onClick={() => {
                      setSelectedId(c.connectionId);
                      setMobileShowChat(true);
                    }}
                  />
                ))
              )}
            </div>

            {/* Footer: total count */}
            {!loading && connections.length > 0 && (
              <div className="px-4 py-2.5 border-t border-white/[0.06]">
                <p className="text-slate-600 text-xs text-center">
                  {connections.length} connection{connections.length !== 1 ? "s" : ""}
                </p>
              </div>
            )}
          </div>

          {/* ── RIGHT: Chat panel ── */}
          <div className={`${mobileShowChat ? "flex" : "hidden sm:flex"} flex-1 flex-col min-w-0`}>
            {selectedConnection ? (
              <ChatPanel
                key={selectedId}
                connection={selectedConnection}
                currentUser={{ _id: user?._id, name: user?.name, role }}
                accentColor={accentColor}
                onClose={() => { setMobileShowChat(false); setSelectedId(null); }}
                onRemove={handleRemove}
              />
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center text-center px-8">
                <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
                  <PiEnvelopeSimple size={30} className="text-slate-600" />
                </div>
                <p className="text-slate-300 font-semibold">Select a connection</p>
                <p className="text-slate-500 text-sm mt-1">
                  Chat with your connections directly here
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}