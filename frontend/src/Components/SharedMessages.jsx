// SharedMessages.jsx — messages page for Student, Alumni, Teacher
// Usage: <SharedMessages role="Student" accentColor="sky" />
// Route: /student/messages, /alumni/messages, /teacher/messages
// One conversation per person: connection chat and every mentorship session with
// the same person share a single thread.
// Deep links: ?with=<userId>, ?session=<mentorshipId>, ?conn=<connectionId>

import { useState, useEffect, useContext } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { API } from "../utils/api";
import { Context } from "../context";
import { useSocket } from "../useSocket";
import ConversationChat from "./ConversationChat";
import { PiMagnifyingGlass, PiChatsCircle, PiCircleNotch, PiHandshake } from "react-icons/pi";

// Colour scheme per role
const THEME = {
  Student: { ring: "ring-sky-500",     bg: "bg-sky-500",     text: "text-sky-400",     border: "border-sky-500/30" },
  Alumni:  { ring: "ring-emerald-500", bg: "bg-emerald-500", text: "text-emerald-400", border: "border-emerald-500/30" },
  Teacher: { ring: "ring-violet-500",  bg: "bg-violet-500",  text: "text-violet-400",  border: "border-violet-500/30" },
};

const ROLE_GRADIENT = {
  Alumni:  "bg-gradient-to-br from-emerald-400 to-emerald-600",
  Teacher: "bg-gradient-to-br from-violet-400 to-violet-600",
  Student: "bg-gradient-to-br from-sky-400 to-sky-600",
};

function formatListTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toDateString() === new Date().toDateString()
    ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString([], { month: "short", day: "numeric" });
}

// The conversation a deep link points at, if any
const matchesDeepLink = (c, link) =>
  (link.with && c.userId === link.with) ||
  (link.conn && c.connectionId === link.conn) ||
  (link.session && c.mentorships.some((m) => m._id === link.session));

export default function SharedMessages({ role, accentColor }) {
  const { user } = useContext(Context);
  const { socketRef, isSocketReady } = useSocket();
  const [searchParams] = useSearchParams();
  const deepLink = {
    with: searchParams.get("with"),
    session: searchParams.get("session"),
    conn: searchParams.get("conn"),
  };
  const deepLinkKey = [deepLink.with, deepLink.session, deepLink.conn].join("|");
  const hasDeepLink = deepLinkKey !== "||";

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  // undefined = nothing picked yet (a deep link may choose); null = closed
  const [pickedUserId, setPickedUserId] = useState(undefined);
  const [mobileShowChat, setMobileShowChat] = useState(hasDeepLink);

  // A new deep link (e.g. opening a different session's chat) takes over again.
  // Adjusting state during render avoids an extra effect-triggered render.
  const [seenDeepLink, setSeenDeepLink] = useState(deepLinkKey);
  if (deepLinkKey !== seenDeepLink) {
    setSeenDeepLink(deepLinkKey);
    setPickedUserId(undefined);
    if (hasDeepLink) setMobileShowChat(true);
  }

  const theme = THEME[role] || THEME.Student;
  const color = accentColor || (role === "Alumni" ? "emerald" : role === "Teacher" ? "violet" : "sky");
  const myId = user?._id?.toString();

  const fetchConversations = () =>
    axios.get(`${API}/conversations`, { withCredentials: true })
      .then((res) => setConversations(res.data.conversations || []))
      .catch(() => { /* non-critical: keep current list */ });

  useEffect(() => {
    // `loading` starts true; it flips once the list has arrived
    fetchConversations().then(() => setLoading(false));
  }, []);

  const activeUserId = pickedUserId === undefined
    ? conversations.find((c) => matchesDeepLink(c, deepLink))?.userId ?? null
    : pickedUserId;
  const active = conversations.find((c) => c.userId === activeUserId) || null;
  // On phones the chat replaces the list, but only once there's a chat to show
  const showChatOnMobile = mobileShowChat && !!active;

  // Move a conversation to the top with its new last message
  const bumpConversation = (key, message, { countUnread }) => {
    setConversations((prev) => {
      const current = prev.find((c) => c.key === key);
      if (!current) return prev;
      const updated = {
        ...current,
        lastMessage: { text: message.text, senderId: message.sender?.id, createdAt: message.createdAt },
        unread: countUnread ? current.unread + 1 : current.unread,
      };
      return [updated, ...prev.filter((c) => c.key !== key)];
    });
  };

  // Live: new messages reorder the list and update unread badges
  useEffect(() => {
    if (!isSocketReady || !socketRef.current) return;
    const socket = socketRef.current;
    const onNewMessage = (data) => {
      const known = conversations.some((c) => c.key === data.conversationKey);
      if (!known) {
        fetchConversations(); // e.g. a mentorship was just accepted
        return;
      }
      const isOpen = active?.key === data.conversationKey;
      bumpConversation(data.conversationKey, data.message, {
        countUnread: !isOpen && data.fromUserId !== myId,
      });
    };
    socket.on("chat:new_message", onNewMessage);
    return () => socket.off("chat:new_message", onNewMessage);
  }, [isSocketReady, socketRef, conversations, active?.key, myId]);

  const openConversation = (userId) => {
    setPickedUserId(userId);
    setMobileShowChat(true);
    setConversations((prev) => prev.map((c) => (c.userId === userId ? { ...c, unread: 0 } : c)));
  };

  const q = search.trim().toLowerCase();
  const filtered = q ? conversations.filter((c) => (c.user?.name || "").toLowerCase().includes(q)) : conversations;
  // The open chat is being read, so it never counts as unread
  const unreadOf = (c) => (c.userId === activeUserId ? 0 : c.unread);
  const totalUnread = conversations.reduce((sum, c) => sum + unreadOf(c), 0);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-slate-900 border border-white/[0.07] rounded-xl overflow-hidden"
        style={{ height: "calc(100vh - 7rem)" }}>
        <div className="flex h-full">

          {/* ── LEFT: one row per person ── */}
          <div className={`${showChatOnMobile ? "hidden sm:flex" : "flex"} w-full sm:w-72 lg:w-80 flex-col border-r border-white/[0.07] flex-shrink-0`}>
            <div className="px-4 pt-4 pb-3 border-b border-white/[0.07]">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-white font-bold text-base">Messages</h2>
                {totalUnread > 0 && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${theme.bg} text-white`}>
                    {totalUnread}
                  </span>
                )}
              </div>
              <div className="relative">
                <PiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={15}/>
                <input type="text" placeholder="Search conversations…" value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={`w-full pl-8 pr-3 py-2 rounded-lg bg-slate-800 border border-white/[0.07] text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 ${theme.ring}`}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <PiCircleNotch size={22} className={`${theme.text} animate-spin`}/>
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-6">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mb-3">
                    <PiChatsCircle size={22} className="text-slate-600"/>
                  </div>
                  <p className="text-slate-400 font-medium text-sm">
                    {q ? "No matching conversations" : "No conversations yet"}
                  </p>
                  {!q && (
                    <p className="text-slate-600 text-xs mt-1">
                      {role === "Student"
                        ? "Connect with people or book a mentorship session to start chatting"
                        : "Connect with people or accept a mentorship request to start chatting"}
                    </p>
                  )}
                </div>
              ) : (
                filtered.map((c) => {
                  const unread = unreadOf(c);
                  const isActive = c.userId === activeUserId;
                  const hasActiveSession = c.mentorships.some((m) => m.status === "Accepted");
                  const fromMe = c.lastMessage?.senderId?.toString() === myId;
                  return (
                    <button key={c.key}
                      onClick={() => openConversation(c.userId)}
                      className={`w-full flex items-center gap-3 px-4 py-3 border-b border-white/[0.04] text-left transition-all ${
                        isActive ? `bg-slate-800 ${theme.border} border-l-2` : "hover:bg-slate-800/50"
                      }`}>
                      <div className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-bold text-sm overflow-hidden ${
                        c.user?.profilePhoto?.url ? "bg-slate-800" : ROLE_GRADIENT[c.user?.role] || ROLE_GRADIENT.Student
                      }`}>
                        {c.user?.profilePhoto?.url
                          ? <img src={c.user.profilePhoto.url} alt={c.user.name} className="w-full h-full object-cover" />
                          : (c.user?.name || "?").charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-white text-sm font-semibold truncate">{c.user?.name}</p>
                          <span className="text-slate-600 text-[10px] flex-shrink-0">{formatListTime(c.lastMessage?.createdAt)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <p className={`text-xs truncate ${unread ? "text-slate-300 font-medium" : "text-slate-500"}`}>
                            {c.lastMessage
                              ? `${fromMe ? "You: " : ""}${c.lastMessage.text}`
                              : c.user?.role}
                          </p>
                          {unread > 0 && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${theme.bg} text-white flex-shrink-0`}>
                              {unread}
                            </span>
                          )}
                        </div>
                        {hasActiveSession && (
                          <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold text-emerald-400">
                            <PiHandshake size={11}/> Active mentorship
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* ── RIGHT: the conversation ── */}
          <div className={`${showChatOnMobile ? "flex" : "hidden sm:flex"} flex-1 flex-col min-w-0`}>
            {active ? (
              <ConversationChat
                key={active.key}
                conversation={active}
                currentUser={{ _id: myId, name: user?.name, role }}
                accentColor={color}
                onClose={() => { setMobileShowChat(false); setPickedUserId(null); }}
                onSent={(message) => bumpConversation(active.key, message, { countUnread: false })}
              />
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center text-center px-8">
                <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
                  <PiChatsCircle size={30} className="text-slate-600"/>
                </div>
                <p className="text-slate-300 font-semibold">Select a conversation</p>
                <p className="text-slate-500 text-sm mt-1">
                  Chats with your connections and mentorship partners appear here
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
