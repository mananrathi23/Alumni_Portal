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
  const navigate = useNavigate();
  const { setIsAuthenticated, setUser } = useContext(Context);

  useEffect(() => {
    axios.get("http://localhost:4000/api/v1/user/me", { withCredentials: true })
      .then((res) => {
        setIsAuthenticated(true);
        setUser(res.data.user);
        setAlumni(res.data.user);
        if (!isAlumniProfileComplete(res.data.user)) setShowIncompleteModal(true);
      })
      .catch(() => { setIsAuthenticated(false); navigate("/login"); });
  }, []);

  // Re-fetch alumni data (called after settings save, etc.)
  const refreshAlumni = async () => {
    try {
      const res = await axios.get("http://localhost:4000/api/v1/user/me", { withCredentials: true });
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

    socket.on("mentorship:reminder", reminderHandler);
    socket.on("user:verified", verifiedHandler);
    return () => {
      socket.off("mentorship:reminder", reminderHandler);
      socket.off("user:verified", verifiedHandler);
    };
  }, [isSocketReady]);

  const handleLogout = async () => {
    try { await axios.get("http://localhost:4000/api/v1/user/logout", { withCredentials: true }); } catch {}
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
        { label: "Messages",    path: "/alumni/messages",    icon: PiEnvelope },
      ],
    },
    {
      heading: "Opportunities",
      links: [
        { label: "Jobs",        path: "/alumni/jobs",        icon: PiBriefcase },
        { label: "Events",      path: "/alumni/events",      icon: PiCalendarCheck },
        { label: "Mentorship",  path: "/alumni/mentorship",  icon: PiHandshake },
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
        <Outlet context={{ alumni, refreshAlumni }} />
      </DashboardShell>

      {showIncompleteModal && (
        <ProfileIncompleteModal alumni={alumni} onClose={() => setShowIncompleteModal(false)} />
      )}
    </>
  );
};

export default AlumniLayout;
