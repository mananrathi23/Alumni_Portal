// MemberLayout.jsx — the dashboard frame (sidebar, badges, live notifications)
// for Students, Alumni and Teachers. Usage: <MemberLayout role="Alumni" />
// Pages read the signed-in user from the outlet context under the role's name
// ({ student } / { alumni } / { teacher }), plus its setter and refreshProfile().
import { Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { API } from "../utils/api";
import { useSocket } from "../useSocket";
import { Context } from "../context";
import ProfileIncompleteModal from "./ProfileIncompleteModal";
import { isProfileComplete } from "../utils/profileCompletion";
import DashboardShell from "./DashboardShell";
import {
  PiHouseLine, PiChatsCircle, PiEnvelope, PiUsersThree, PiHandshake, PiBriefcase,
  PiCalendarCheck, PiUserCircle, PiRocketLaunch, PiStudent, PiGraduationCap,
} from "react-icons/pi";

// Sidebar entries: [label, path under /<role>/, icon, badge key]
const ROLE_CONFIG = {
  Student: {
    accent: "sky", spinner: "border-sky-500",
    // Students see pending connection requests; mentors see pending mentorship requests
    badgeSource: "connections",
    nav: [
      ["Overview", [["Dashboard", "dashboard", PiHouseLine]]],
      ["Community", [
        ["Connections", "alumni", PiUsersThree],
        ["Batchmates", "batchmates", PiStudent],
        ["Requests", "requests", PiHandshake, "pending"],
        ["Forum", "forum", PiChatsCircle],
        ["Messages", "messages", PiEnvelope, "unread"],
      ]],
      ["Opportunities", [
        ["Jobs", "jobs", PiBriefcase],
        ["Events", "events", PiCalendarCheck],
        ["Mentorship", "mentorship", PiUserCircle],
        ["Incubation", "incubation", PiRocketLaunch],
      ]],
      ["Account", [["My Profile", "profile", PiUserCircle]]],
    ],
  },
  Alumni: {
    accent: "emerald", spinner: "border-emerald-500", badgeSource: "mentorship",
    nav: [
      ["Overview", [["Dashboard", "dashboard", PiHouseLine]]],
      ["Community", [
        ["Connections", "students", PiUsersThree],
        ["Batchmates", "batchmates", PiGraduationCap],
        ["Forum", "forum", PiChatsCircle],
        ["Messages", "messages", PiEnvelope, "unread"],
      ]],
      ["Opportunities", [
        ["Jobs", "jobs", PiBriefcase],
        ["Events", "events", PiCalendarCheck],
        ["Mentorship", "mentorship", PiHandshake, "pending"],
        ["Incubation", "incubation", PiRocketLaunch],
      ]],
      ["Account", [["My Profile", "profile", PiUserCircle]]],
    ],
  },
  Teacher: {
    accent: "violet", spinner: "border-violet-500", badgeSource: "mentorship",
    nav: [
      ["Overview", [["Dashboard", "dashboard", PiHouseLine]]],
      ["Community", [
        ["Connections", "students", PiUsersThree],
        ["Our Students", "batchmates", PiStudent],
        ["Forum", "forum", PiChatsCircle],
        ["Messages", "messages", PiEnvelope, "unread"],
      ]],
      ["Opportunities", [
        ["Jobs", "jobs", PiBriefcase],
        ["Events", "events", PiCalendarCheck],
        ["Mentorship", "mentorship", PiHandshake, "pending"],
        ["Incubation", "incubation", PiRocketLaunch],
      ]],
      ["Account", [["My Profile", "profile", PiUserCircle]]],
    ],
  },
};

// Pending count for the role's badge (connection requests or mentorship requests)
const fetchPendingCount = (badgeSource) =>
  badgeSource === "connections"
    ? axios.get(`${API}/connection/pending`, { withCredentials: true }).then((res) => res.data.incoming?.length ?? 0)
    : axios.get(`${API}/mentorship/requests`, { params: { status: "Pending", countOnly: "true" }, withCredentials: true })
      .then((res) => res.data.count || 0);

const fetchUnreadCount = () =>
  axios.get(`${API}/conversations/unread`, { withCredentials: true }).then((res) => res.data.total || 0);

export default function MemberLayout({ role }) {
  const config = ROLE_CONFIG[role];
  const base = `/${role.toLowerCase()}`;
  const contextKey = role.toLowerCase(); // "student" | "alumni" | "teacher"

  // ProtectedRoute has already loaded /user/me into Context before rendering this layout
  const { user: sessionUser, setIsAuthenticated, setUser } = useContext(Context);
  const [member, setMember] = useState(sessionUser);
  const [pending, setPending] = useState(0);
  const [unread, setUnread] = useState(0);
  const [showIncompleteModal, setShowIncompleteModal] = useState(() => !!sessionUser && !isProfileComplete(role, sessionUser));
  const navigate = useNavigate();
  const { socketRef, isSocketReady } = useSocket();

  const refreshPending = () => fetchPendingCount(config.badgeSource).then(setPending).catch(() => { /* badge stays */ });
  const refreshUnread = () => fetchUnreadCount().then(setUnread).catch(() => { /* badge stays */ });

  // Re-fetch the profile (e.g. after mentorship settings change availability)
  const refreshProfile = () =>
    axios.get(`${API}/user/me`, { withCredentials: true })
      .then((res) => { setUser(res.data.user); setMember(res.data.user); })
      .catch(() => { /* keep current profile */ });

  useEffect(() => {
    refreshPending();
    refreshUnread();
  }, []);

  useEffect(() => {
    if (!isSocketReady || !socketRef.current) return;
    const socket = socketRef.current;

    const onReminder = (data) => {
      const link = data.meetingLink;
      const msg = data.mentorName
        ? `⏰ Session with ${data.mentorName} starts in 15 min!${link ? " Join: " + link : ""}`
        : `⏰ Session with ${data.studentName} starts in 15 min!`;
      toast.info(msg, { autoClose: 10000 });
    };
    // Admin verified this user in real time
    const onVerified = ({ adminVerified }) => {
      setMember((prev) => (prev ? { ...prev, adminVerified } : prev));
      setUser((prev) => (prev ? { ...prev, adminVerified } : prev));
    };
    // Only messages from other people change my unread count (senders get their own echoed back)
    const onNewChat = (data) => {
      if (data?.fromUserId !== sessionUser?._id?.toString()) refreshUnread();
    };
    const onNewPending = () => setPending((n) => n + 1);

    const handlers = {
      "mentorship:reminder": onReminder,
      "user:verified": onVerified,
      "chat:new_message": onNewChat,
      "chat:read": refreshUnread,
      ...(config.badgeSource === "connections"
        ? {
          "connection:new_request": onNewPending,
          "connection:accepted": refreshPending,
          "connection:rejected": refreshPending,
          "connection:withdrawn": refreshPending,
        }
        : {
          "mentorship:new_request": onNewPending,
          "mentorship:request_cancelled": refreshPending,
          "mentorship:request_responded": refreshPending,
        }),
    };
    Object.entries(handlers).forEach(([event, fn]) => socket.on(event, fn));
    return () => Object.entries(handlers).forEach(([event, fn]) => socket.off(event, fn));
  }, [isSocketReady]);

  const handleLogout = async () => {
    try { await axios.get(`${API}/user/logout`, { withCredentials: true }); } catch { /* logging out locally anyway */ }
    localStorage.removeItem("alumniToken");
    setIsAuthenticated(false);
    setUser(null);
    navigate("/login");
  };

  const badges = { pending, unread };
  const navGroups = config.nav.map(([heading, links]) => ({
    heading,
    links: links.map(([label, path, icon, badgeKey]) => ({
      label, path: `${base}/${path}`, icon, ...(badgeKey && { badge: badges[badgeKey] }),
    })),
  }));

  if (!member) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-3">
        <div className={`w-10 h-10 rounded-full border-2 border-t-transparent animate-spin ${config.spinner}`} />
        <p className="text-slate-500 text-sm">Loading your dashboard…</p>
      </div>
    </div>
  );

  return (
    <>
      <DashboardShell
        user={member}
        accentColor={config.accent}
        navGroups={navGroups}
        profilePath={`${base}/profile`}
        forumPath={`${base}/forum`}
        eventsPath={`${base}/events`}
        jobsPath={`${base}/jobs`}
        onLogout={handleLogout}
      >
        <Outlet context={{ [contextKey]: member, [`set${role}`]: setMember, refreshProfile }} />
      </DashboardShell>

      {showIncompleteModal && (
        <ProfileIncompleteModal role={role} user={member} onClose={() => setShowIncompleteModal(false)} />
      )}
    </>
  );
}
