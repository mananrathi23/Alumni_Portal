import { Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { useSocket } from "../../SocketContext";
import { toast } from "react-toastify";
import { Context } from "../../main";
import ProfileIncompleteModal from "./ProfileIncompleteModal";
import { isAlumniProfileComplete } from "./Profile";
import DashboardShell from "../DashboardShell";
import {
  PiHouseLine, PiChatsCircle, PiEnvelope, PiUsersThree,
  PiHandshake, PiBriefcase, PiCalendarCheck, PiUserCircle,
  PiRocketLaunch, PiGraduationCap,
} from "react-icons/pi";

const AlumniLayout = () => {
  const [alumni, setAlumni] = useState(null);
  const [showIncompleteModal, setShowIncompleteModal] = useState(false);
  const [pendingMentorship, setPendingMentorship] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const navigate = useNavigate();
  const { setIsAuthenticated, setUser } = useContext(Context);

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user/me`, { withCredentials: true })
      .then((res) => {
        setIsAuthenticated(true);
        setUser(res.data.user);
        setAlumni(res.data.user);
        if (!isAlumniProfileComplete(res.data.user)) setShowIncompleteModal(true);
      })
      .catch(() => { setIsAuthenticated(false); navigate("/login"); });
  }, []);

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/mentorship/requests`, { withCredentials: true })
      .then((res) => {
        const pending = (res.data.requests || []).filter(r => r.status === "Pending").length;
        setPendingMentorship(pending);
      }).catch(() => {});
  }, []);

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/connection/chat/unread-counts`, { withCredentials: true })
      .then((res) => {
        const total = Object.values(res.data.unread || {}).reduce((s, n) => s + n, 0);
        setUnreadMessages(total);
      }).catch(() => {});
  }, []);

  // Re-fetch alumni data (called after settings save, etc.)
  const refreshAlumni = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user/me`, { withCredentials: true });
      setUser(res.data.user);
      setAlumni(res.data.user);
    } catch {}
  };

  const { socketRef, isSocketReady } = useSocket();
  useEffect(() => {
    if (!isSocketReady || !socketRef.current) return;
    const socket = socketRef.current;

    // Reminder notification
    const reminderHandler = (data) => {
      const link = data.meetingLink;
      const msg = data.mentorName
        ? `⏰ Session with ${data.mentorName} starts in 15 min!${link ? " Join: " + link : ""}`
        : `⏰ Session with ${data.studentName} starts in 15 min!`;
      toast.info(msg, { autoClose: 10000 });
    };

    // Admin verified this user in real-time
    const verifiedHandler = ({ adminVerified }) => {
      setAlumni(prev => prev ? { ...prev, adminVerified } : prev);
      setUser(prev => prev ? { ...prev, adminVerified } : prev);
    };

    // New mentorship request from a student
    const onNewMentorshipRequest = () => setPendingMentorship(prev => prev + 1);
    const onMentorshipUpdate = () => {
      axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/mentorship/requests`, { withCredentials: true })
        .then((res) => {
          const pending = (res.data.requests || []).filter(r => r.status === "Pending").length;
          setPendingMentorship(pending);
        }).catch(() => {});
    };
    // New chat message → bump Messages badge
    const onNewChat = () => setUnreadMessages(prev => prev + 1);
    const onChatRead = () => {
      axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/connection/chat/unread-counts`, { withCredentials: true })
        .then((res) => {
          const total = Object.values(res.data.unread || {}).reduce((s, n) => s + n, 0);
          setUnreadMessages(total);
        }).catch(() => {});
    };

    socket.on("mentorship:reminder",          reminderHandler);
    socket.on("user:verified",                verifiedHandler);
    socket.on("mentorship:new_request",       onNewMentorshipRequest);
    socket.on("mentorship:request_cancelled", onMentorshipUpdate);
    socket.on("mentorship:request_responded", onMentorshipUpdate);
    socket.on("chat:new_message",             onNewChat);
    socket.on("chat:read",                    onChatRead);
    return () => {
      socket.off("mentorship:reminder",          reminderHandler);
      socket.off("user:verified",                verifiedHandler);
      socket.off("mentorship:new_request",       onNewMentorshipRequest);
      socket.off("mentorship:request_cancelled", onMentorshipUpdate);
      socket.off("mentorship:request_responded", onMentorshipUpdate);
      socket.off("chat:new_message",             onNewChat);
      socket.off("chat:read",                    onChatRead);
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
        { label: "Dashboard",   path: "/alumni/dashboard",  icon: PiHouseLine },
      ],
    },
    {
      heading: "Community",
      links: [
        { label: "Connections", path: "/alumni/students",    icon: PiUsersThree },
        { label: "Batchmates",  path: "/alumni/batchmates",  icon: PiGraduationCap },
        { label: "Forum",       path: "/alumni/forum",       icon: PiChatsCircle },
        { label: "Messages",    path: "/alumni/messages",    icon: PiEnvelope, badge: unreadMessages },
      ],
    },
    {
      heading: "Opportunities",
      links: [
        { label: "Jobs",        path: "/alumni/jobs",        icon: PiBriefcase },
        { label: "Events",      path: "/alumni/events",      icon: PiCalendarCheck },
        { label: "Mentorship",  path: "/alumni/mentorship",  icon: PiHandshake, badge: pendingMentorship },
        { label: "Incubation",  path: "/alumni/incubation",  icon: PiRocketLaunch },
      ],
    },
    {
      heading: "Account",
      links: [
        { label: "My Profile",  path: "/alumni/profile",    icon: PiUserCircle },
      ],
    },
  ];

  if (!alumni) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
        <p className="text-slate-500 text-sm">Loading your dashboard…</p>
      </div>
    </div>
  );

  return (
    <>
      <DashboardShell
        user={alumni}
        role="Alumni"
        accentColor="emerald"
        navGroups={NAV_GROUPS}
        profilePath="/alumni/profile"
        forumPath="/alumni/forum"
        eventsPath="/alumni/events"
        jobsPath="/alumni/jobs"
        onLogout={handleLogout}
      >
        <Outlet context={{ alumni, setAlumni, refreshAlumni }} />
      </DashboardShell>

      {showIncompleteModal && (
        <ProfileIncompleteModal alumni={alumni} onClose={() => setShowIncompleteModal(false)} />
      )}
    </>
  );
};

export default AlumniLayout;
