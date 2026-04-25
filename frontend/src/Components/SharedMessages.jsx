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

const MENTORSHIP_API = `${import.meta.env.VITE_BACKEND_URL}/api/v1/mentorship`;
const CONNECTIONS_API = `${import.meta.env.VITE_BACKEND_URL}/api/v1/connections`;

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

  const [activeTab, setActiveTab]           = useState("mentorship"); // "mentorship" or "connections"
  const [mentorshipSessions, setMentorshipSessions] = useState([]);
  const [connectionSessions, setConnectionSessions] = useState([]);
  
  const [loading, setLoading]               = useState(true);
  const [selectedId, setSelectedId]         = useState(deepLinkId || null);
  const [search, setSearch]                 = useState("");
  
  const [mentorshipUnread, setMentorshipUnread]   = useState({});
  const [connectionUnread, setConnectionUnread]   = useState({});
  const [mobileShowChat, setMobileShowChat] = useState(!!deepLinkId);

  const theme = THEME[role] || THEME.Student;
  const color = accentColor || (role === "Alumni" ? "emerald" : role === "Teacher" ? "violet" : "sky");

  // Fetch accepted + completed mentorship sessions
  const fetchMentorship = async () => {
    try {
      const res = await axios.get(`${MENTORSHIP_API}/requests`, { withCredentials: true });
      const all = res.data.requests || [];
      const active = all.filter(r => ["Accepted", "Completed"].includes(r.status));
      setMentorshipSessions(active);
    } catch { setMentorshipSessions([]); }
  };

  const fetchConnections = async () => {
    try {
      const res = await axios.get(`${CONNECTIONS_API}`, { withCredentials: true });
      setConnectionSessions(res.data.connections || []);
    } catch { setConnectionSessions([]); }
  };

  const fetchAllSessions = async () => {
    setLoading(true);
    await Promise.all([fetchMentorship(), fetchConnections()]);
    setLoading(false);
  }

  const fetchUnread = async () => {
    try {
      const [mRes, cRes] = await Promise.all([
        axios.get(`${MENTORSHIP_API}/chat/unread-counts`, { withCredentials: true }),
        axios.get(`${CONNECTIONS_API}/chat/unread-counts`, { withCredentials: true })
      ]);
      setMentorshipUnread(mRes.data.unread || {});
      setConnectionUnread(cRes.data.unread || {});
    } catch {}
  };

  useEffect(() => {
    fetchAllSessions();
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
      if (activeTab === "mentorship") {
        setMentorshipUnread(prev => ({ ...prev, [selectedId]: 0 }));
      } else {
        setConnectionUnread(prev => ({ ...prev, [selectedId]: 0 }));
      }
    }
  }, [selectedId, activeTab]);

  const getOtherMentorship = (s) => role === "Student"
    ? { name: s.mentor?.name,  role: s.mentor?.role  }
    : { name: s.student?.name, role: "Student" };
    
  const currentSessions = activeTab === "mentorship" ? mentorshipSessions : connectionSessions;
  const currentUnread = activeTab === "mentorship" ? mentorshipUnread : connectionUnread;

  const filtered = currentSessions.filter(s => {
    const q = search.toLowerCase();
    let otherName = "";
    if (activeTab === "mentorship") {
      otherName = getOtherMentorship(s).name;
    } else {
      otherName = s.connectedWith?.name;
    }
    return !search || (otherName || "").toLowerCase().includes(q);
  });

  const selectedSession = currentSessions.find(s => (s._id || s.connectionId) === selectedId);

  const getInitial = (name) => (name || "?").charAt(0).toUpperCase();

  const totalUnreadMentorship = Object.values(mentorshipUnread).reduce((a, b) => a + b, 0);
  const totalUnreadConnection = Object.values(connectionUnread).reduce((a, b) => a + b, 0);
  const totalUnread = totalUnreadMentorship + totalUnreadConnection;

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
              <div className="relative mb-3">
                <PiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={15}/>
                <input type="text" placeholder="Search conversations…" value={search}
                  onChange={e => setSearch(e.target.value)}
                  className={`w-full pl-8 pr-3 py-2 rounded-lg bg-slate-800 border border-white/[0.07] text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 ${theme.ring}`}
                />
              </div>

              {/* Tabs */}
              <div className="flex bg-slate-800/50 p-1 rounded-lg border border-white/[0.04]">
                <button
                  onClick={() => { setActiveTab("mentorship"); setSelectedId(null); }}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-2 ${
                    activeTab === "mentorship" ? `${theme.bg} text-white shadow` : "text-slate-400 hover:text-white"
                  }`}>
                  Mentorship
                  {totalUnreadMentorship > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px] text-white">
                      {totalUnreadMentorship}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => { setActiveTab("connections"); setSelectedId(null); }}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-2 ${
                    activeTab === "connections" ? `${theme.bg} text-white shadow` : "text-slate-400 hover:text-white"
                  }`}>
                  Connections
                  {totalUnreadConnection > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px] text-white">
                      {totalUnreadConnection}
                    </span>
                  )}
                </button>
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
                  const id = activeTab === "mentorship" ? s._id : s.connectionId;
                  const otherName = activeTab === "mentorship" ? getOtherMentorship(s).name : s.connectedWith?.name;
                  const otherRole = activeTab === "mentorship" ? getOtherMentorship(s).role : s.connectedWith?.role;
                  const unread  = currentUnread[id] || 0;
                  const isActive = selectedId === id;
                  return (
                    <button key={id}
                      onClick={() => { setSelectedId(id); setMobileShowChat(true); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 border-b border-white/[0.04] text-left transition-all ${
                        isActive ? `bg-slate-800 ${theme.border} border-l-2` : "hover:bg-slate-800/50"
                      }`}>
                      <div className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-bold text-sm ${
                        otherRole === "Alumni" ? "bg-gradient-to-br from-emerald-400 to-emerald-600"
                          : otherRole === "Teacher" ? "bg-gradient-to-br from-violet-400 to-violet-600"
                          : "bg-gradient-to-br from-sky-400 to-sky-600"
                      }`}>
                        {getInitial(otherName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-white text-sm font-semibold truncate">{otherName}</p>
                          {unread > 0 && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${theme.bg} text-white ml-2 flex-shrink-0`}>
                              {unread}
                            </span>
                          )}
                        </div>
                        {activeTab === "mentorship" ? (
                          <p className="text-slate-500 text-xs truncate">
                            {GOAL_LABELS[s.goal] || s.goal} · {s.slot?.day} {s.slot?.time}
                          </p>
                        ) : (
                          <p className="text-slate-500 text-xs truncate">
                            Connected {new Date(s.connectedAt).toLocaleDateString()}
                          </p>
                        )}
                        {activeTab === "mentorship" && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${s.status === "Accepted" ? "bg-emerald-400" : "bg-slate-500"}`}/>
                            <span className="text-slate-600 text-[10px]">{s.status}</span>
                          </div>
                        )}
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
                sessionId={activeTab === "mentorship" ? selectedSession._id : selectedSession.connectionId}
                apiBaseUrl={activeTab === "mentorship" ? MENTORSHIP_API : CONNECTIONS_API}
                currentUser={{ _id: user?._id, name: user?.name, role }}
                otherPerson={activeTab === "mentorship" ? getOtherMentorship(selectedSession) : selectedSession.connectedWith}
                accentColor={color}
                sessionStatus={activeTab === "mentorship" ? selectedSession.status : "Accepted"}
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
