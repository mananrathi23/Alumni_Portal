import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import axios from "axios";
import { Context } from "../../main";
import {
  PiUsersThree, PiBriefcase, PiChatsCircle,
  PiCalendarCheck, PiHandshake, PiArrowRight,
  PiEnvelope, PiRocketLaunch, PiSparkle,
} from "react-icons/pi";

const BASE = "http://localhost:4000/api/v1";

const colorMap = {
  sky:    { bg:"bg-sky-50 dark:bg-sky-900/20",     border:"border-sky-200 dark:border-sky-500/20",     icon:"text-sky-500",     val:"text-sky-600",     feedBg:"bg-sky-50 dark:bg-sky-900/20",     feedBorder:"border-sky-200 dark:border-sky-500/20"     },
  violet: { bg:"bg-violet-50 dark:bg-violet-900/20", border:"border-violet-200 dark:border-violet-500/20", icon:"text-violet-500", val:"text-violet-600", feedBg:"bg-violet-50 dark:bg-violet-900/20", feedBorder:"border-violet-200 dark:border-violet-500/20" },
  amber:  { bg:"bg-amber-50 dark:bg-amber-900/20",  border:"border-amber-200 dark:border-amber-500/20",  icon:"text-amber-500",  val:"text-amber-600",  feedBg:"bg-amber-50 dark:bg-amber-900/20",  feedBorder:"border-amber-200 dark:border-amber-500/20"  },
  emerald:{ bg:"bg-emerald-50 dark:bg-emerald-900/20",border:"border-emerald-200 dark:border-emerald-500/20",icon:"text-emerald-500",val:"text-emerald-600",feedBg:"bg-emerald-50 dark:bg-emerald-900/20",feedBorder:"border-emerald-200 dark:border-emerald-500/20" },
};

const FeedCard = ({ items, emptyText, renderItem, onViewAll, color }) => {
  const c = colorMap[color];
  return (
    <div className={`rounded-xl border ${c.feedBg} ${c.feedBorder} overflow-hidden`}>
      {items.length === 0
        ? <p className="text-slate-400 text-xs text-center py-5">{emptyText}</p>
        : <div className="divide-y divide-slate-100">
            {items.slice(0,3).map((item, i) => (
              <div key={i} onClick={onViewAll} className="px-4 py-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                {renderItem(item)}
              </div>
            ))}
          </div>
      }
      <button onClick={onViewAll}
        className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-slate-400 dark:text-slate-300 hover:text-slate-600 dark:hover:text-slate-200 border-t border-slate-100 dark:border-white/[0.08] transition-colors">
        View all <PiArrowRight size={11}/>
      </button>
    </div>
  );
};

const DashboardHome = () => {
  const navigate = useNavigate();
  const { student } = useOutletContext();
  const { theme } = useContext(Context);
  const [stats,  setStats]  = useState({ mentors:0, jobs:0, forums:0, events:0 });
  const [jobs,   setJobs]   = useState([]);
  const [forums, setForums] = useState([]);
  const [events, setEvents] = useState([]);
  const [mentors,setMentors]= useState([]);
  const [loading,setLoading]= useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [jR, fR, eR, mR] = await Promise.allSettled([
          axios.get(`${BASE}/jobs`,       { withCredentials:true }),
          axios.get(`${BASE}/forum/questions`,      { withCredentials:true }),
          axios.get(`${BASE}/events`,     { params:{view:"upcoming"}, withCredentials:true }),
          axios.get(`${BASE}/mentorship/available`, { withCredentials:true }),
        ]);
        const j = jR.status==="fulfilled" ? jR.value.data.jobs||[]  : [];
        const f = fR.status==="fulfilled" ? fR.value.data.questions||fR.value.data.posts||fR.value.data.forums||[] : [];
        const e = eR.status==="fulfilled" ? eR.value.data.events||[] : [];
        const m = mR.status==="fulfilled" ? mR.value.data.mentors||[] : [];
        setJobs(j); setForums(f); setEvents(e); setMentors(m);
        setStats({ jobs:j.length, forums:f.length, events:e.length, mentors:m.length });
      } catch {}
      finally { setLoading(false); }
    })();
  }, []);

  const statCards = [
    { label:"Available Mentors", value:stats.mentors, icon:PiHandshake,    color:"sky",     path:"/student/mentorship" },
    { label:"Open Jobs",          value:stats.jobs,    icon:PiBriefcase,    color:"violet",  path:"/student/jobs" },
    { label:"Discussions",        value:stats.forums,  icon:PiChatsCircle,  color:"emerald", path:"/student/forum" },
    { label:"Upcoming Events",    value:stats.events,  icon:PiCalendarCheck,color:"amber",   path:"/student/events" },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Welcome banner */}
      <div className="relative rounded-2xl overflow-hidden p-6 sm:p-8"
        style={{ background: theme === "dark"
          ? "linear-gradient(135deg,#0f172a 0%,#1e3a5f 60%,#0c4a6e 100%)"
          : "linear-gradient(135deg,#eff6ff 0%,#dbeafe 60%,#bfdbfe 100%)" }}>
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage:"linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)", backgroundSize:"40px 40px" }}/>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20"
          style={{ background:"radial-gradient(circle,#38bdf8,transparent 70%)" }}/>
        <div className="relative z-10">
          <div className={theme === "dark" ? "inline-flex items-center gap-2 bg-sky-500/15 border border-sky-500/30 rounded-full px-3 py-1 mb-4" : "inline-flex items-center gap-2 bg-sky-100 border border-sky-200 rounded-full px-3 py-1 mb-4"}>
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"/>
            <span className={theme === "dark" ? "text-sky-400 text-xs font-semibold tracking-widest uppercase" : "text-sky-700 text-xs font-semibold tracking-widest uppercase"}>Student Dashboard</span>
          </div>
          <h2 className={theme === "dark" ? "text-2xl sm:text-3xl font-bold text-white mb-1" : "text-2xl sm:text-3xl font-bold text-slate-950 mb-1"}>
            Welcome back, <span className="text-sky-400">{student?.name?.split(" ")[0] || "Student"}</span>!
          </h2>
          <p className={theme === "dark" ? "text-slate-300 text-sm" : "text-slate-600 text-sm"}>
            {student?.department && student.department !== "Not Set" && <span>{student.department}</span>}
            {student?.year && <span className="text-slate-400"> · {student.year}</span>}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map(({ label, value, icon:Icon, color, path }) => {
          const c = colorMap[color];
          return (
            <div key={label} onClick={()=>navigate(path)}
              className={`cursor-pointer rounded-xl p-4 sm:p-5 border ${c.bg} ${c.border} hover:scale-[1.02] transition-transform duration-200 group`}>
              <div className="flex items-start justify-between mb-3">
                <Icon size={20} className={c.icon}/>
                <PiArrowRight size={14} className="text-slate-400 dark:text-slate-300 group-hover:text-slate-600 dark:group-hover:text-slate-100 transition-colors"/>
              </div>
              <p className={`text-2xl font-bold ${c.val} mb-0.5`}>{loading ? "—" : value}</p>
              <p className="text-slate-600 dark:text-slate-400 text-xs font-medium">{label}</p>
            </div>
          );
        })}
      </div>

      {/* Activity feed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className={`text-sm font-bold flex items-center gap-2 mb-2 ${theme === "dark" ? "text-white" : "text-slate-950"}`}>
            <PiBriefcase className="text-violet-500"/> Latest Jobs
          </h3>
          <FeedCard color="violet" items={jobs} emptyText="No jobs posted yet" onViewAll={()=>navigate("/student/jobs")}
            renderItem={j=>(
              <div>
                <p className={`text-xs font-semibold truncate ${theme === "dark" ? "text-slate-100" : "text-slate-950"}`}>{j.role}</p>
                <p className="text-slate-500 text-[11px] mt-0.5">{j.company}{j.location ? ` · ${j.location}`:""}</p>
              </div>
            )}/>
        </div>
        <div>
          <h3 className={`text-sm font-bold flex items-center gap-2 mb-2 ${theme === "dark" ? "text-white" : "text-slate-950"}`}>
            <PiChatsCircle className="text-emerald-500"/> Forum Discussions
          </h3>
          <FeedCard color="emerald" items={forums} emptyText="No posts yet" onViewAll={()=>navigate("/student/forum")}
            renderItem={f=>(
              <div>
                <p className={`text-xs font-semibold truncate ${theme === "dark" ? "text-slate-100" : "text-slate-950"}`}>{f.title||f.content?.slice(0,60)}</p>
                <p className="text-slate-500 text-[11px] mt-0.5">{f.author?.name||"Anonymous"}</p>
              </div>
            )}/>
        </div>
        <div>
          <h3 className={`text-sm font-bold flex items-center gap-2 mb-2 ${theme === "dark" ? "text-white" : "text-slate-950"}`}>
            <PiCalendarCheck className="text-amber-500"/> Upcoming Events
          </h3>
          <FeedCard color="amber" items={events} emptyText="No upcoming events" onViewAll={()=>navigate("/student/events")}
            renderItem={e=>(
              <div>
                <p className={`text-xs font-semibold truncate ${theme === "dark" ? "text-slate-100" : "text-slate-950"}`}>{e.title}</p>
                <p className="text-slate-500 text-[11px] mt-0.5">{new Date(e.date).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}{e.location ? ` · ${e.location}`:""}</p>
              </div>
            )}/>
        </div>
        <div>
          <h3 className={`text-sm font-bold flex items-center gap-2 mb-2 ${theme === "dark" ? "text-white" : "text-slate-950"}`}>
            <PiHandshake className="text-sky-500"/> Available Mentors
          </h3>
          <FeedCard color="sky" items={mentors} emptyText="No mentors available yet" onViewAll={()=>navigate("/student/mentorship")}
            renderItem={m=>(
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center text-[11px] font-bold flex-shrink-0">
                  {m.name?.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className={`text-xs font-semibold truncate ${theme === "dark" ? "text-slate-100" : "text-slate-950"}`}>{m.name}</p>
                  <p className="text-slate-500 text-[11px]">{m.department||m.currentDesignation||m.role}</p>
                </div>
              </div>
            )}/>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
