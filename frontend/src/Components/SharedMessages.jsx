// SharedMessages.jsx — unified messages page for Student, Alumni, Teacher
// Usage: <SharedMessages role="Student" accentColor="sky" />
// Route: /student/messages, /alumni/messages, /teacher/messages
// Deep-link: /student/messages?session=<mentorshipId>

import { useState, useEffect, useContext } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { Context } from "../main";
import { useSocket } from "../SocketContext";
import MentorshipChat from "./MentorshipChat";
import {
  PiMagnifyingGlass, PiEnvelope, PiChatsCircle,
  PiHandshake, PiCircleNotch, PiClock,
} from "react-icons/pi";

const API = "http://localhost:4000/api/v1/mentorship";

const GOAL_LABELS = {
  career:"Career Guidance", resume:"Resume Review",
  interview:"Interview Prep", technical:"Technical Help", general:"General Advice",
};

// Colour scheme per role
const THEME = {
  Student: { ring: "ring-sky-500",     bg: "bg-sky-500",     text: "text-sky-400",     border: "border-sky-500/30" },
  Alumni:  { ring: "ring-emerald-500", bg: "bg-emerald-500", text: "text-emerald-400", border: "border-emerald-500/30" },
  Teacher: { ring: "ring-violet-500",  bg: "bg-violet-500",  text: "text-violet-400",  border: "border-violet-500/30" },
};

export default function SharedMessages({ role, accentColor }) {
  const { user }               = useContext(Context);
  const { socketRef, isSocketReady } = useSocket();
  const [searchParams]         = useSearchParams();
  const deepLinkId             = searchParams.get("session"); // auto-open this session

  const [sessions, setSessions]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [selectedId, setSelectedId]       = useState(deepLinkId || null);
  const [search, setSearch]               = useState("");
  const [unreadCounts, setUnreadCounts]   = useState({});
  const [mobileShowChat, setMobileShowChat] = useState(!!deepLinkId);

  const theme = THEME[role] || THEME.Student;
  const color = accentColor || (role === "Alumni" ? "emerald" : role === "Teacher" ? "violet" : "sky");

  // Fetch accepted + completed sessions
  const fetchSessions = async () => {
    try {
      const res = await axios.get(`${API}/requests`, { withCredentials: true });
      const all = res.data.requests || [];
      const active = all.filter(r => ["Accepted", "Completed"].includes(r.status));
      setSessions(active);
      // Auto-select first if deep-link didn't match
      if (!deepLinkId && active.length > 0 && !selectedId) {
        setSelectedId(active[0]._id);
      }
    } catch { setSessions([]); }
    finally { setLoading(false); }
  };

  const fetchUnread = async () => {
    try {
      const res = await axios.get(`${API}/chat/unread-counts`, { withCredentials: true });
      setUnreadCounts(res.data.unread || {});
    } catch {}
  };

  useEffect(() => {
    fetchSessions();
    fetchUnread();
  }, []);

  // Auto-open from deep link
  useEffect(() => {
    if (deepLinkId) { setSelectedId(deepLinkId); setMobileShowChat(true); }
  }, [deepLinkId]);

  // Socket: refresh unread counts when new message arrives
  useEffect(() => {
    if (!isSocketReady || !socketRef.current) return;
    const socket = socketRef.current;
    const handler = () => fetchUnread();
    socket.on("chat:new_message", handler);
    return () => socket.off("chat:new_message", handler);
  }, [isSocketReady]);

  // Clear unread for selected session
  useEffect(() => {
    if (selectedId) {
      setUnreadCounts(prev => ({ ...prev, [selectedId]: 0 }));
    }
  }, [selectedId]);

  const filtered = sessions.filter(s => {
    const q = search.toLowerCase();
    const other = role === "Student" ? s.mentor?.name : s.student?.name;
    return !search || (other || "").toLowerCase().includes(q);
  });

  const selectedSession = sessions.find(s => s._id === selectedId);

  // Helper: other person's info
  const getOther = (s) => role === "Student"
    ? { name: s.mentor?.name,  role: s.mentor?.role  }
    : { name: s.student?.name, role: "Student" };

  const getInitial = (s) => (getOther(s).name || "?").charAt(0).toUpperCase();

  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-slate-900 border border-white/[0.07] rounded-xl overflow-hidden"
        style={{ height: "calc(100vh - 7rem)" }}>
        <div className="flex h-full">

          {/* ── LEFT: Conversation list ── */}
          <div className={`${mobileShowChat ? "hidden sm:flex" : "flex"} w-full sm:w-72 lg:w-80 flex-col border-r border-white/[0.07] flex-shrink-0`}>

            {/* Header */}
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
                  onChange={e => setSearch(e.target.value)}
                  className={`w-full pl-8 pr-3 py-2 rounded-lg bg-slate-800 border border-white/[0.07] text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 ${theme.ring}`}
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <PiCircleNotch size={22} className={`${theme.text} animate-spin`}/>
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-6">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mb-3">
                    <PiHandshake size={22} className="text-slate-600"/>
                  </div>
                  <p className="text-slate-400 font-medium text-sm">No active sessions yet</p>
                  <p className="text-slate-600 text-xs mt-1">
                    {role === "Student"
                      ? "Send a mentorship request to start chatting"
                      : "Accept a request to unlock chat"}
                  </p>
                </div>
              ) : (
                filtered.map(s => {
                  const other   = getOther(s);
                  const unread  = unreadCounts[s._id] || 0;
                  const isActive = selectedId === s._id;
                  return (
                    <button key={s._id}
                      onClick={() => { setSelectedId(s._id); setMobileShowChat(true); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 border-b border-white/[0.04] text-left transition-all ${
                        isActive ? `bg-slate-800 ${theme.border} border-l-2` : "hover:bg-slate-800/50"
                      }`}>
                      <div className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-bold text-sm ${
                        other.role === "Alumni" ? "bg-gradient-to-br from-emerald-400 to-emerald-600"
                          : other.role === "Teacher" ? "bg-gradient-to-br from-violet-400 to-violet-600"
                          : "bg-gradient-to-br from-sky-400 to-sky-600"
                      }`}>
                        {getInitial(s)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-white text-sm font-semibold truncate">{other.name}</p>
                          {unread > 0 && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${theme.bg} text-white ml-2 flex-shrink-0`}>
                              {unread}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-500 text-xs truncate">
                          {GOAL_LABELS[s.goal] || s.goal} · {s.slot?.day} {s.slot?.time}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${s.status === "Accepted" ? "bg-emerald-400" : "bg-slate-500"}`}/>
                          <span className="text-slate-600 text-[10px]">{s.status}</span>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* ── RIGHT: Chat panel ── */}
          <div className={`${mobileShowChat ? "flex" : "hidden sm:flex"} flex-1 flex-col min-w-0`}>
            {selectedSession ? (
              <MentorshipChat
                mentorshipId={selectedId}
                currentUser={{ _id: user?._id, name: user?.name, role }}
                otherPerson={getOther(selectedSession)}
                accentColor={color}
                onClose={() => { setMobileShowChat(false); setSelectedId(null); }}
              />
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center text-center px-8">
                <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
                  <PiChatsCircle size={30} className="text-slate-600"/>
                </div>
                <p className="text-slate-300 font-semibold">Select a conversation</p>
                <p className="text-slate-500 text-sm mt-1">
                  {role === "Student"
                    ? "Your accepted mentorship chats appear here"
                    : "Chats with your students appear here"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
