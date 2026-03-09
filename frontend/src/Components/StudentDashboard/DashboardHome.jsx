import React from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  PiUsersThree, PiBriefcase, PiChatsCircle,
  PiCalendarCheck, PiHandshake, PiArrowRight,
} from "react-icons/pi";

const DashboardHome = () => {
  const navigate = useNavigate();
  const { student } = useOutletContext();

  const stats = [
    {
      label: "Connections",
      value: student.stats?.alumniCount ?? 0,
      icon: PiUsersThree,
      color: "sky",
      path: "/student/alumni",
      desc: "Professionals to connect with",
    },
    {
      label: "Open Positions",
      value: student.stats?.openPositions ?? 0,
      icon: PiBriefcase,
      color: "emerald",
      path: "/student/jobs",
      desc: "Jobs & internships available",
    },
    {
      label: "Discussions",
      value: student.stats?.discussions ?? 0,
      icon: PiChatsCircle,
      color: "violet",
      path: "/student/forum",
      desc: "Active forum threads",
    },
    {
      label: "Upcoming Events",
      value: student.stats?.events ?? 0,
      icon: PiCalendarCheck,
      color: "amber",
      path: "/student/events",
      desc: "Meetups & sessions",
    },
  ];

  const colorMap = {
    sky:    { bg: "bg-sky-500/10",    border: "border-sky-500/20",    icon: "text-sky-400",    val: "text-sky-400"    },
    emerald:{ bg: "bg-emerald-500/10",border: "border-emerald-500/20",icon: "text-emerald-400",val: "text-emerald-400"},
    violet: { bg: "bg-violet-500/10", border: "border-violet-500/20", icon: "text-violet-400", val: "text-violet-400" },
    amber:  { bg: "bg-amber-500/10",  border: "border-amber-500/20",  icon: "text-amber-400",  val: "text-amber-400"  },
  };

  const quickLinks = [
    { label: "Browse Alumni",       path: "/student/alumni",   icon: PiUsersThree,   desc: "Find and connect" },
    { label: "My Mentorship Requests", path: "/student/requests", icon: PiHandshake, desc: "Track your requests" },
    { label: "Job Board",           path: "/student/jobs",     icon: PiBriefcase,    desc: "Explore opportunities" },
    { label: "Join Discussions",    path: "/student/forum",    icon: PiChatsCircle,  desc: "Share & learn" },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* Welcome Banner */}
      <div
        className="relative rounded-2xl overflow-hidden p-6 sm:p-8"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #0c4a6e 100%)" }}
      >
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        {/* Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20 pointer-events-none"
          style={{ background: "radial-gradient(circle, #0ea5e9, transparent 70%)" }} />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-sky-500/15 border border-sky-500/30 rounded-full px-3 py-1 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
            <span className="text-sky-400 text-xs font-semibold tracking-widest uppercase">Student Dashboard</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">
            Welcome back, <span className="text-sky-400">{student.name}</span>!
          </h2>
          <p className="text-slate-400 text-sm mb-5">
            {student.department && <span className="text-slate-300">{student.department}</span>}
            {student.year && <span className="text-slate-500"> · {student.year}</span>}
          </p>
          <p className="text-slate-400 text-sm leading-relaxed max-w-lg">
            Connect with alumni, explore job opportunities, join discussions, and grow your professional network — all in one place.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map(({ label, value, icon: Icon, color, path, desc }) => {
          const c = colorMap[color];
          return (
            <div
              key={label}
              onClick={() => navigate(path)}
              className={`cursor-pointer rounded-xl p-4 sm:p-5 border ${c.bg} ${c.border} hover:scale-[1.02] transition-transform duration-200 group`}
            >
              <div className="flex items-start justify-between mb-3">
                <Icon size={20} className={c.icon} />
                <PiArrowRight size={14} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
              </div>
              <p className={`text-2xl font-bold ${c.val} mb-0.5`}>{value}</p>
              <p className="text-slate-300 text-xs font-medium">{label}</p>
              <p className="text-slate-600 text-xs mt-0.5 hidden sm:block">{desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardHome;
