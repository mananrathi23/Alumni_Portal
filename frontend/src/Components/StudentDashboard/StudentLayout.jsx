import { Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { useSocket } from "../../SocketContext";
import { toast } from "react-toastify";
import { Context } from "../../main";
import ProfileIncompleteModal from "./ProfileIncompleteModal";
import { isProfileComplete } from "./Profile";
import DashboardShell from "../DashboardShell";
import {
  PiHouseLine, PiChatsCircle, PiEnvelope, PiUsersThree,
  PiHandshake, PiBriefcase, PiCalendarCheck, PiUserCircle,
  PiRocketLaunch, PiStudent,
} from "react-icons/pi";

const StudentLayout = () => {
  const [student, setStudent] = useState(null);
  const [pendingCount, setPending] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [showIncompleteModal, setShowIncompleteModal] = useState(false);
  const navigate = useNavigate();
  const { setIsAuthenticated, setUser } = useContext(Context);

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user/me`, { withCredentials: true })
      .then((res) => {
        setIsAuthenticated(true);
        setUser(res.data.user);
        setStudent(res.data.user);
        if (!isProfileComplete(res.data.user)) setShowIncompleteModal(true);
      })
      .catch(() => { setIsAuthenticated(false); navigate("/login"); });
  }, []);

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/connection/pending`, { withCredentials: true })
      .then((res) => setPending(res.data.incoming?.length ?? 0))
      .catch(() => {});
  }, []);

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/connection/chat/unread-counts`, { withCredentials: true })
      .then((res) => {
        const total = Object.values(res.data.unread || {}).reduce((s, n) => s + n, 0);
        setUnreadMessages(total);
      })
      .catch(() => {});
  }, []);

  const { socketRef, isSocketReady } = useSocket();
  useEffect(() => {
    if (!isSocketReady || !socketRef.current) return;
    const socket = socketRef.current;

    const reminderHandler = (data) => {
      const link = data.meetingLink;
      const msg = data.mentorName
        ? `⏰ Session with ${data.mentorName} starts in 15 min!${link ? " Join: " + link : ""}`
        : `⏰ Session with ${data.studentName} starts in 15 min!`;
      toast.info(msg, { autoClose: 10000 });
    };

    const verifiedHandler = ({ adminVerified }) => {
      setStudent(prev => prev ? { ...prev, adminVerified } : prev);
      setUser(prev => prev ? { ...prev, adminVerified } : prev);
    };

    // New connection request → bump Requests badge
    const onNewRequest = () => setPending(prev => prev + 1);
    // Connection accepted/rejected/withdrawn → refresh badge
    const onConnectionUpdate = () => {
      axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/connection/pending`, { withCredentials: true })
        .then((res) => setPending(res.data.incoming?.length ?? 0)).catch(() => {});
    };
    // New chat message → bump Messages badge
    const onNewChat = () => setUnreadMessages(prev => prev + 1);
    // User opened Messages page → clear badge handled by the page itself, so re-fetch
    const onChatRead = () => {
      axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/connection/chat/unread-counts`, { withCredentials: true })
        .then((res) => {
          const total = Object.values(res.data.unread || {}).reduce((s, n) => s + n, 0);
          setUnreadMessages(total);
        }).catch(() => {});
    };

    socket.on("mentorship:reminder",    reminderHandler);
    socket.on("user:verified",          verifiedHandler);
    socket.on("connection:new_request", onNewRequest);
    socket.on("connection:accepted",    onConnectionUpdate);
    socket.on("connection:rejected",    onConnectionUpdate);
    socket.on("connection:withdrawn",   onConnectionUpdate);
    socket.on("chat:new_message",       onNewChat);
    socket.on("chat:read",              onChatRead);
    return () => {
      socket.off("mentorship:reminder",    reminderHandler);
      socket.off("user:verified",          verifiedHandler);
      socket.off("connection:new_request", onNewRequest);
      socket.off("connection:accepted",    onConnectionUpdate);
      socket.off("connection:rejected",    onConnectionUpdate);
      socket.off("connection:withdrawn",   onConnectionUpdate);
      socket.off("chat:new_message",       onNewChat);
      socket.off("chat:read",              onChatRead);
    };
  }, [isSocketReady]);

  const handleLogout = async () => {
    try { await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user/logout`, { withCredentials: true }); } catch {}
    localStorage.removeItem("alumniToken");
    setIsAuthenticated(false);
    setUser(null);
    navigate("/login");
  };

  const NAV_GROUPS = [
    {
      heading: "Overview",
      links: [
        { label: "Dashboard",   path: "/student/dashboard", icon: PiHouseLine },
      ],
    },
    {
      heading: "Community",
      links: [
        { label: "Connections", path: "/student/alumni",     icon: PiUsersThree },
        { label: "Batchmates",  path: "/student/batchmates", icon: PiStudent },
        { label: "Requests",    path: "/student/requests",   icon: PiHandshake, badge: pendingCount },
        { label: "Forum",       path: "/student/forum",      icon: PiChatsCircle },
        { label: "Messages",    path: "/student/messages",   icon: PiEnvelope,  badge: unreadMessages },
      ],
    },
    {
      heading: "Opportunities",
      links: [
        { label: "Jobs",        path: "/student/jobs",       icon: PiBriefcase },
        { label: "Events",      path: "/student/events",     icon: PiCalendarCheck },
        { label: "Mentorship",  path: "/student/mentorship", icon: PiUserCircle },
        { label: "Incubation",  path: "/student/incubation", icon: PiRocketLaunch },
      ],
    },
    {
      heading: "Account",
      links: [
        { label: "My Profile",  path: "/student/profile",   icon: PiUserCircle },
      ],
    },
  ];

  if (!student) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-sky-500 border-t-transparent animate-spin" />
        <p className="text-slate-500 text-sm">Loading your dashboard…</p>
      </div>
    </div>
  );

  return (
    <>
      <DashboardShell
        user={student}
        role="Student"
        accentColor="sky"
        navGroups={NAV_GROUPS}
        profilePath="/student/profile"
        forumPath="/student/forum"
        eventsPath="/student/events"
        jobsPath="/student/jobs"
        onLogout={handleLogout}
      >
        <Outlet context={{ student, setStudent }} />
      </DashboardShell>

      {showIncompleteModal && (
        <ProfileIncompleteModal student={student} onClose={() => setShowIncompleteModal(false)} />
      )}
    </>
  );
};

export default StudentLayout;
