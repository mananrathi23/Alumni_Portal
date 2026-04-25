import { Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { useSocket } from "../../SocketContext";
import { toast } from "react-toastify";
import { Context } from "../../main";
import ProfileIncompleteModal from "./ProfileIncompleteModal";
import { isTeacherProfileComplete } from "./Profile";
import DashboardShell from "../DashboardShell";
import {
  PiHouseLine, PiChatsCircle, PiEnvelope, PiUsersThree,
  PiHandshake, PiBriefcase, PiCalendarCheck, PiUserCircle,
  PiRocketLaunch, PiStudent,
} from "react-icons/pi";

const TeacherLayout = () => {
  const [teacher, setTeacher] = useState(null);
  const [showIncompleteModal, setShowIncompleteModal] = useState(false);
  const navigate = useNavigate();
  const { setIsAuthenticated, setUser } = useContext(Context);

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user/me`, { withCredentials: true })
      .then((res) => {
        setIsAuthenticated(true);
        setUser(res.data.user);
        setTeacher(res.data.user);
        if (!isTeacherProfileComplete(res.data.user)) setShowIncompleteModal(true);
      })
      .catch(() => { setIsAuthenticated(false); navigate("/login"); });
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
      setTeacher(prev => prev ? { ...prev, adminVerified } : prev);
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
    try { await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user/logout`, { withCredentials: true }); } catch {}
    navigate("/login");
  };

  const NAV_GROUPS = [
    {
      heading: "Overview",
      links: [
        { label: "Dashboard",    path: "/teacher/dashboard",  icon: PiHouseLine },
      ],
    },
    {
      heading: "Community",
      links: [
        { label: "Connections",  path: "/teacher/students",    icon: PiUsersThree },
        { label: "Our Students", path: "/teacher/batchmates",  icon: PiStudent },
        { label: "Forum",        path: "/teacher/forum",       icon: PiChatsCircle },
        { label: "Messages",     path: "/teacher/messages",    icon: PiEnvelope },
      ],
    },
    {
      heading: "Opportunities",
      links: [
        { label: "Jobs",         path: "/teacher/jobs",        icon: PiBriefcase },
        { label: "Events",       path: "/teacher/events",      icon: PiCalendarCheck },
        { label: "Mentorship",   path: "/teacher/mentorship",  icon: PiHandshake },
        { label: "Incubation",   path: "/teacher/incubation",  icon: PiRocketLaunch },
      ],
    },
    {
      heading: "Account",
      links: [
        { label: "My Profile",   path: "/teacher/profile",    icon: PiUserCircle },
      ],
    },
  ];

  if (!teacher) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
        <p className="text-slate-500 text-sm">Loading your dashboard…</p>
      </div>
    </div>
  );

  return (
    <>
      <DashboardShell
        user={teacher}
        role="Teacher"
        accentColor="violet"
        navGroups={NAV_GROUPS}
        profilePath="/teacher/profile"
        forumPath="/teacher/forum"
        eventsPath="/teacher/events"
        jobsPath="/teacher/jobs"
        onLogout={handleLogout}
      >
        <Outlet context={{ teacher, setTeacher }} />
      </DashboardShell>

      {showIncompleteModal && (
        <ProfileIncompleteModal teacher={teacher} onClose={() => setShowIncompleteModal(false)} />
      )}
    </>
  );
};

export default TeacherLayout;
