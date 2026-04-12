import React, { useState, useEffect } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import axios from "axios";
import {
  PiUsersThree, PiBriefcase, PiChatsCircle,
  PiCalendarCheck, PiHandshake, PiArrowRight,
  PiEnvelope, PiRocketLaunch, PiSparkle,
} from "react-icons/pi";
import DashboardTicker from "../DashboardTicker.jsx";

const BASE = "http://localhost:4000/api/v1";

// ── Mini feed card ─────────────────────────────────────────────────────────────
const FeedCard = ({ items, emptyText, renderItem, onViewAll, color }) => {
  const cls = {
    sky:    "border-sky-500/20 bg-sky-500/5",
    emerald:"border-emerald-500/20 bg-emerald-500/5",
    violet: "border-violet-500/20 bg-violet-500/5",
    amber:  "border-amber-500/20 bg-amber-500/5",
  }[color] || "border-white/[0.06] bg-slate-900";

  return (
    <div className={`rounded-xl border ${cls} overflow-hidden`}>
      {items.length === 0 ? (
        <p className="text-slate-600 text-xs text-center py-5">{emptyText}</p>
      ) : (
        <div className="divide-y divide-white/[0.04]">
          {items.slice(0, 3).map((item, i) => (
            <div key={i} className="px-4 py-3 hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={onViewAll}>
              {renderItem(item)}
            </div>
          ))}
        </div>
      )}
      <button
        onClick={onViewAll}
        className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-300 border-t border-white/[0.04] transition-colors"
      >
        View all <PiArrowRight size={11}/>
      </button>
    </div>
  );
};

const DashboardHome = () => {
  const navigate = useNavigate();
  const { student } = useOutletContext();

  const [stats,   setStats]   = useState({ connections: 0, jobs: 0, forums: 0, events: 0 });
  const [jobs,    setJobs]    = useState([]);
  const [forums,  setForums]  = useState([]);
  const [events,  setEvents]  = useState([]);
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const go = async () => {
      try {
        const [jobsR, forumsR, eventsR, mentorsR] = await Promise.allSettled([
          axios.get(`${BASE}/jobs`,       { withCredentials: true }),
          axios.get(`${BASE}/forum`,      { withCredentials: true }),
          axios.get(`${BASE}/events`,     { params: { view: "upcoming" }, withCredentials: true }),
          axios.get(`${BASE}/mentorship/available`, { withCredentials: true }),
        ]);

        const jobsList    = jobsR.status    === "fulfilled" ? (jobsR.value.data.jobs       || []) : [];
        const forumsList  = forumsR.status  === "fulfilled" ? (forumsR.value.data.posts    || forumsR.value.data.forums || []) : [];
        const eventsList  = eventsR.status  === "fulfilled" ? (eventsR.value.data.events   || []) : [];
        const mentorsList = mentorsR.status === "fulfilled" ? (mentorsR.value.data.mentors || []) : [];

        setJobs(jobsList);
        setForums(forumsList);
        setEvents(eventsList);
        setMentors(mentorsList);
        setStats({
          connections: student.stats?.alumniCount ?? 0,
          jobs:        jobsList.length,
          forums:      forumsList.length,
          events:      eventsList.length,
        });
      } catch {}
      finally { setLoading(false); }
    };
    go();
  }, []);

  const statCards = [
    { label: "Connections",     value: stats.connections, icon: PiUsersThree,    color: "sky",     path: "/student/alumni" },
    { label: "Open Positions",  value: stats.jobs,        icon: PiBriefcase,     color: "emerald", path: "/student/jobs" },
    { label: "Discussions",     value: stats.forums,      icon: PiChatsCircle,   color: "violet",  path: "/student/forum" },
    { label: "Upcoming Events", value: stats.events,      icon: PiCalendarCheck, color: "amber",   path: "/student/events" },
  ];

  const colorMap = {
    sky:    { bg:"bg-sky-500/10",    border:"border-sky-500/20",    icon:"text-sky-400",    val:"text-sky-400"    },
    emerald:{ bg:"bg-emerald-500/10",border:"border-emerald-500/20",icon:"text-emerald-400",val:"text-emerald-400"},
    violet: { bg:"bg-violet-500/10", border:"border-violet-500/20", icon:"text-violet-400", val:"text-violet-400" },
    amber:  { bg:"bg-amber-500/10",  border:"border-amber-500/20",  icon:"text-amber-400",  val:"text-amber-400"  },
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* Live feed ticker */}
      <DashboardTicker
        accentColor="sky"
        forumPath="/student/forum"
        eventsPath="/student/events"
        jobsPath="/student/jobs"
      />

      {/* Welcome Banner */}
      <div className="relative rounded-2xl overflow-hidden p-6 sm:p-8"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #0c4a6e 100%)" }}>
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{ backgroundImage:"linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)", backgroundSize:"40px 40px" }}/>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20 pointer-events-none"
          style={{ background:"radial-gradient(circle, #0ea5e9, transparent 70%)" }}/>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-sky-500/15 border border-sky-500/30 rounded-full px-3 py-1 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"/>
            <span className="text-sky-400 text-xs font-semibold tracking-widest uppercase">Student Dashboard</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">
            Welcome back, <span className="text-sky-400">{student.name}</span>!
          </h2>
          <p className="text-slate-400 text-sm">
            {student.department && <span className="text-slate-300">{student.department}</span>}
            {student.year && <span className="text-slate-500"> · {student.year}</span>}
            {student.enrollmentYear && <span className="text-slate-500"> · Class of {student.enrollmentYear}</span>}
          </p>
        </div>
      </div>

      {/* Live Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map(({ label, value, icon: Icon, color, path }) => {
          const c = colorMap[color];
          return (
            <div key={label} onClick={() => navigate(path)}
              className={`cursor-pointer rounded-xl p-4 sm:p-5 border ${c.bg} ${c.border} hover:scale-[1.02] transition-transform duration-200 group`}>
              <div className="flex items-start justify-between mb-3">
                <Icon size={20} className={c.icon}/>
                <PiArrowRight size={14} className="text-slate-600 group-hover:text-slate-400 transition-colors"/>
              </div>
              <p className={`text-2xl font-bold ${c.val} mb-0.5`}>{loading ? "—" : value}</p>
              <p className="text-slate-300 text-xs font-medium">{label}</p>
            </div>
          );
        })}
      </div>

      {/* Activity Feed — 2-col grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Latest Jobs */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2"><PiBriefcase className="text-emerald-400"/> Latest Jobs</h3>
          </div>
          <FeedCard
            color="emerald"
            items={jobs}
            emptyText="No job listings yet"
            onViewAll={() => navigate("/student/jobs")}
            renderItem={(j) => (
              <div>
                <p className="text-slate-200 text-xs font-semibold truncate">{j.title}</p>
                <p className="text-slate-500 text-[11px] mt-0.5">{j.company || j.postedBy?.name} {j.location ? `· ${j.location}` : ""}</p>
              </div>
            )}
          />
        </div>

        {/* Forum Discussions */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2"><PiChatsCircle className="text-violet-400"/> Discussions</h3>
          </div>
          <FeedCard
            color="violet"
            items={forums}
            emptyText="No forum posts yet"
            onViewAll={() => navigate("/student/forum")}
            renderItem={(f) => (
              <div>
                <p className="text-slate-200 text-xs font-semibold truncate">{f.title || f.content?.slice(0,60)}</p>
                <p className="text-slate-500 text-[11px] mt-0.5">{f.author?.name || "Anonymous"} · {f.replies?.length ?? 0} replies</p>
              </div>
            )}
          />
        </div>

        {/* Upcoming Events */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2"><PiCalendarCheck className="text-amber-400"/> Upcoming Events</h3>
          </div>
          <FeedCard
            color="amber"
            items={events}
            emptyText="No upcoming events"
            onViewAll={() => navigate("/student/events")}
            renderItem={(e) => (
              <div>
                <p className="text-slate-200 text-xs font-semibold truncate">{e.title}</p>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  {new Date(e.date).toLocaleDateString("en-IN", { day:"numeric", month:"short" })}
                  {e.location ? ` · ${e.location}` : ""}
                </p>
              </div>
            )}
          />
        </div>

        {/* Available Mentors */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2"><PiHandshake className="text-sky-400"/> Available Mentors</h3>
          </div>
          <FeedCard
            color="sky"
            items={mentors}
            emptyText="No mentors available"
            onViewAll={() => navigate("/student/mentorship")}
            renderItem={(m) => (
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${m.role==="Alumni" ? "bg-emerald-500/20 text-emerald-400" : "bg-violet-500/20 text-violet-400"}`}>
                  {m.name?.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-slate-200 text-xs font-semibold truncate">{m.name}</p>
                  <p className="text-slate-500 text-[11px]">{m.currentDesignation || m.designation || m.role}</p>
                </div>
              </div>
            )}
          />
        </div>
      </div>

    </div>
  );
};

export default DashboardHome;
