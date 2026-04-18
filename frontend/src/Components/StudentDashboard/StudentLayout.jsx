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
  const [showIncompleteModal, setShowIncompleteModal] = useState(false);
  const navigate = useNavigate();
  const { setIsAuthenticated, setUser } = useContext(Context);

  useEffect(() => {
    axios.get("http://localhost:4000/api/v1/user/me", { withCredentials: true })
      .then((res) => {
        setIsAuthenticated(true);
        setUser(res.data.user);
        setStudent(res.data.user);
        if (!isProfileComplete(res.data.user)) setShowIncompleteModal(true);
      })
      .catch(() => { setIsAuthenticated(false); navigate("/login"); });
  }, []);

  useEffect(() => {
    axios.get("http://localhost:4000/api/v1/connection/pending", { withCredentials: true })
      .then((res) => setPending(res.data.requests?.length ?? 0))
      .catch(() => {});
  }, []);

  const { socketRef, isSocketReady } = useSocket();
  useEffect(() => {
    if (!isSocketReady || !socketRef.current) return;
    const socket = socketRef.current;
    const handler = (data) => {
      const link = data.meetingLink;
      const msg = data.mentorName
        ? `⏰ Session with ${data.mentorName} starts in 15 min!${link ? " Join: " + link : ""}`
        : `⏰ Session with ${data.studentName} starts in 15 min!`;
      toast.info(msg, { autoClose: 10000 });
    };
    socket.on("mentorship:reminder", handler);
    return () => socket.off("mentorship:reminder", handler);
  }, [isSocketReady]);

  const handleLogout = async () => {
    try { await axios.get("http://localhost:4000/api/v1/user/logout", { withCredentials: true }); } catch {}
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
        { label: "Messages",    path: "/student/messages",   icon: PiEnvelope },
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
        <Outlet context={{ student }} />
      </DashboardShell>

      {showIncompleteModal && (
        <ProfileIncompleteModal student={student} onClose={() => setShowIncompleteModal(false)} />
      )}
    </>
  );
};

export default StudentLayout;
