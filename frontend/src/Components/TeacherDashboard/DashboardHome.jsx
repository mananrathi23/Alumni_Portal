import { useState, useEffect, useContext } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import axios from "axios";
import { Context } from "../../main";
import {
  PiUsersThree, PiBriefcase, PiChatsCircle,
  PiCalendarCheck, PiHandshake, PiArrowRight, PiRocketLaunch,
} from "react-icons/pi";

const BASE = `${import.meta.env.VITE_BACKEND_URL || "http://localhost:4000"}/api/v1`;

// ── Mini feed card ─────────────────────────────────────────────────────────────
const FeedCard = ({ items, emptyText, renderItem, onViewAll, color }) => {
  const cls = {
    sky:    "border-sky-200 bg-sky-50 dark:border-sky-500/20 dark:bg-sky-900/20",
    emerald:"border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-900/20",
    violet: "border-violet-200 bg-violet-50 dark:border-violet-500/20 dark:bg-violet-900/20",
    amber:  "border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-900/20",
  }[color] || "border-slate-200 bg-slate-900 dark:border-white/[0.08] dark:bg-slate-900";

  return (
    <div className={`rounded-xl border ${cls} overflow-hidden`}>
      {items.length === 0 ? (
        <p className="text-slate-400 text-xs text-center py-5">{emptyText}</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {items.slice(0, 3).map((item, i) => (
            <div key={i} className="px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer" onClick={onViewAll}>
              {renderItem(item)}
            </div>
          ))}
        </div>
      )}
      <button
        onClick={onViewAll}
        className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-slate-400 dark:text-slate-300 hover:text-slate-700 dark:hover:text-slate-100 border-t border-slate-100 dark:border-white/[0.08] transition-colors"
      >
        View all <PiArrowRight size={11}/>
      </button>
    </div>
  );
};

const DashboardHome = () => {
  const navigate = useNavigate();
  const { teacher } = useOutletContext();
  const { theme } = useContext(Context);

  const [stats,   setStats]   = useState({ mentees: 0, jobs: 0, forums: 0, events: 0 });
  const [jobs,    setJobs]    = useState([]);
  const [forums,  setForums]  = useState([]);
  const [events,  setEvents]  = useState([]);
  const [ideas,   setIdeas]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const go = async () => {
      try {
        const [jobsR, forumsR, eventsR, ideasR, mentorshipR] = await Promise.allSettled([
          axios.get(`${BASE}/jobs`,        { withCredentials: true }),
          axios.get(`${BASE}/forum/questions`,       { withCredentials: true }),
          axios.get(`${BASE}/events`,      { params: { view: "upcoming" }, withCredentials: true }),
          axios.get(`${BASE}/incubation`,  { withCredentials: true }),
          axios.get(`${BASE}/mentorship/requests`, { withCredentials: true }),
        ]);

        const jobsList    = jobsR.status      === "fulfilled" ? (jobsR.value.data.jobs       || []) : [];
        const forumsList  = forumsR.status    === "fulfilled" ? (forumsR.value.data.questions || forumsR.value.data.posts    || forumsR.value.data.forums || []) : [];
        const eventsList  = eventsR.status    === "fulfilled" ? (eventsR.value.data.events   || []) : [];
        const ideasList   = ideasR.status     === "fulfilled" ? (ideasR.value.data.ideas     || []) : [];
        const mentorReqs  = mentorshipR.status === "fulfilled" ? (mentorshipR.value.data.requests || []) : [];
        const pendingMentees = mentorReqs.filter(r => r.status === "Pending").length;

        setJobs(jobsList);
        setForums(forumsList);
        setEvents(eventsList);
        setIdeas(ideasList);
        setStats({ mentees: pendingMentees, jobs: jobsList.length, forums: forumsList.length, events: eventsList.length });
      } catch {}
      finally { setLoading(false); }
    };
    go();
  }, []);

  const statCards = [
    { label: "Mentee Requests", value: stats.mentees, icon: PiHandshake,    color: "violet", path: "/teacher/mentorship" },
    { label: "Open Positions",  value: stats.jobs,    icon: PiBriefcase,    color: "emerald",path: "/teacher/jobs" },
    { label: "Discussions",     value: stats.forums,  icon: PiChatsCircle,  color: "sky",    path: "/teacher/forum" },
    { label: "Upcoming Events", value: stats.events,  icon: PiCalendarCheck,color: "amber",  path: "/teacher/events" },
  ];

  const colorMap = {
    violet: { bg:"bg-violet-500/10", border:"border-violet-500/20", icon:"text-violet-400", val:"text-violet-400" },
    emerald:{ bg:"bg-emerald-500/10",border:"border-emerald-500/20",icon:"text-emerald-400",val:"text-emerald-400"},
    sky:    { bg:"bg-sky-500/10",    border:"border-sky-500/20",    icon:"text-sky-400",    val:"text-sky-400"    },
    amber:  { bg:"bg-amber-500/10",  border:"border-amber-500/20",  icon:"text-amber-400",  val:"text-amber-400"  },
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto">

      {/* Welcome banner */}
      <div className="relative rounded-2xl overflow-hidden p-6 sm:p-8"
        style={{ background: theme === "dark"
          ? "linear-gradient(135deg, #0f172a 0%, #2e1065 60%, #3b0764 100%)"
          : "linear-gradient(135deg, #e9d5ff 0%, #d8b4fe 60%, #c084fc 100%)" }}>
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{ backgroundImage:"linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)", backgroundSize:"40px 40px" }}/>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20 pointer-events-none"
          style={{ background:"radial-gradient(circle, #8b5cf6, transparent 70%)" }}/>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-violet-500/15 border border-violet-500/30 rounded-full px-3 py-1 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse"/>
            <span className="text-violet-400 text-xs font-semibold tracking-widest uppercase">Teacher Dashboard</span>
          </div>
          <h2 className={`text-2xl sm:text-3xl font-bold mb-1 ${theme === "dark" ? "text-white" : "text-slate-950"}`}>
            Welcome back, <span className={`font-semibold ${theme === "dark" ? "text-violet-300" : "text-violet-700"}`}>{teacher.name}</span>!
          </h2>
          <p className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}>
            {teacher.department && teacher.department !== "Not Set" && <span className={`${theme === "dark" ? "text-slate-300" : "text-slate-700"}`}>{teacher.department}</span>}
            {teacher.designation && teacher.designation !== "Not Set" && <span className={`${theme === "dark" ? "text-slate-300" : "text-slate-600"}`}> · {teacher.designation}</span>}
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
                <PiArrowRight size={14} className="text-slate-400 group-hover:text-slate-400 transition-colors"/>
              </div>
              <p className={`text-2xl font-bold ${c.val} mb-0.5`}>{loading ? "—" : value}</p>
              <p className="text-slate-600 text-xs font-medium">{label}</p>
            </div>
          );
        })}
      </div>

      {/* Activity Feed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Latest Jobs */}
        <div>
          <h3 className={`text-sm font-bold flex items-center gap-2 mb-2 ${theme === "dark" ? "text-white" : "text-slate-950"}`}>
            <PiBriefcase className="text-emerald-400"/> Latest Job Postings
          </h3>
          <FeedCard color="emerald" items={jobs} emptyText="No jobs posted yet" onViewAll={() => navigate("/teacher/jobs")}
            renderItem={(j) => (
              <div>
                <p className={`text-xs font-semibold truncate ${theme === "dark" ? "text-slate-100" : "text-slate-950"}`}>{j.role}</p>
                <p className="text-slate-400 dark:text-slate-400 text-[11px] mt-0.5">{j.company}{j.location ? ` · ${j.location}` : ""}</p>
              </div>
            )}
          />
        </div>

        {/* Forum Discussions */}
        <div>
          <h3 className={`text-sm font-bold flex items-center gap-2 mb-2 ${theme === "dark" ? "text-white" : "text-slate-950"}`}>
            <PiChatsCircle className="text-sky-400"/> Active Discussions
          </h3>
          <FeedCard color="sky" items={forums} emptyText="No forum posts yet" onViewAll={() => navigate("/teacher/forum")}
            renderItem={(f) => (
              <div>
                <p className={`text-xs font-semibold truncate ${theme === "dark" ? "text-slate-100" : "text-slate-950"}`}>{f.title || f.content?.slice(0,60)}</p>
                <p className="text-slate-400 text-[11px] mt-0.5">{f.author?.name || "Anonymous"}</p>
              </div>
            )}
          />
        </div>

        {/* Upcoming Events */}
        <div>
          <h3 className={`text-sm font-bold flex items-center gap-2 mb-2 ${theme === "dark" ? "text-white" : "text-slate-950"}`}>
            <PiCalendarCheck className="text-amber-400"/> Upcoming Events
          </h3>
          <FeedCard color="amber" items={events} emptyText="No upcoming events" onViewAll={() => navigate("/teacher/events")}
            renderItem={(e) => (
              <div>
                <p className={`text-xs font-semibold truncate ${theme === "dark" ? "text-slate-100" : "text-slate-950"}`}>{e.title}</p>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  {new Date(e.date).toLocaleDateString("en-IN", { day:"numeric", month:"short" })}
                  {e.location ? ` · ${e.location}` : ""}
                </p>
              </div>
            )}
          />
        </div>

        {/* Student Incubation Ideas */}
        <div>
          <h3 className={`text-sm font-bold flex items-center gap-2 mb-2 ${theme === "dark" ? "text-white" : "text-slate-950"}`}>
            <PiRocketLaunch className="text-violet-400"/> Student Project Ideas
          </h3>
          <FeedCard color="violet" items={ideas} emptyText="No ideas posted yet" onViewAll={() => navigate("/teacher/incubation")}
            renderItem={(idea) => (
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={`text-xs font-semibold truncate ${theme === "dark" ? "text-slate-100" : "text-slate-950"}`}>{idea.title}</p>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-400 capitalize flex-shrink-0">{idea.stage}</span>
                </div>
                <p className="text-slate-400 text-[11px] mt-0.5">{idea.authorName} · {idea.upvotes?.length ?? 0} upvotes</p>
              </div>
            )}
          />
        </div>

      </div>
    </div>
  );
};

export default DashboardHome;
