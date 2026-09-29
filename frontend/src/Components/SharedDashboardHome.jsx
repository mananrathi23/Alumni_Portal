// SharedDashboardHome.jsx — dashboard home for Alumni and Teachers
// Usage: <SharedDashboardHome role="Alumni" /> (reads the user from the layout's outlet context)
import { useState, useEffect, useContext } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import axios from "axios";
import { API } from "../utils/api";
import { Context } from "../context";
import {
  PiBriefcase, PiChatsCircle, PiCalendarCheck, PiHandshake, PiArrowRight, PiRocketLaunch,
} from "react-icons/pi";

const isSet = (v) => !!v && v !== "Not Set";

// Per-role colours and the line under "Welcome back"
const ROLES = {
  Alumni: {
    label: "Alumni Dashboard",
    colors: { mentees: "emerald", jobs: "sky", forums: "violet", events: "amber", ideas: "emerald" },
    badge: "bg-emerald-500/15 border-emerald-500/30", dot: "bg-emerald-400", badgeText: "text-emerald-400",
    name: { dark: "text-emerald-300", light: "text-emerald-700" },
    hero: {
      dark: "linear-gradient(135deg, #0f172a 0%, #064e3b 60%, #065f46 100%)",
      light: "linear-gradient(135deg, #daf7ef 0%, #bceee0 60%, #92e0cd 100%)",
      glow: "#10b981",
    },
    subtitle: (u) => [
      [u.currentDesignation, u.currentCompany && `at ${u.currentCompany}`].filter(Boolean).join(" "),
      u.enrollmentYear && `Class of ${u.enrollmentYear}`,
    ],
  },
  Teacher: {
    label: "Teacher Dashboard",
    colors: { mentees: "violet", jobs: "emerald", forums: "sky", events: "amber", ideas: "violet" },
    badge: "bg-violet-500/15 border-violet-500/30", dot: "bg-violet-400", badgeText: "text-violet-400",
    name: { dark: "text-violet-300", light: "text-violet-700" },
    hero: {
      dark: "linear-gradient(135deg, #0f172a 0%, #2e1065 60%, #3b0764 100%)",
      light: "linear-gradient(135deg, #e9d5ff 0%, #d8b4fe 60%, #c084fc 100%)",
      glow: "#8b5cf6",
    },
    subtitle: (u) => [isSet(u.department) && u.department, isSet(u.designation) && u.designation],
  },
};

const COLOR = {
  violet:  { bg: "bg-violet-500/10",  border: "border-violet-500/20",  text: "text-violet-400",  chip: "bg-violet-500/15 text-violet-400",
             feed: "border-violet-200 bg-violet-50 dark:border-violet-500/20 dark:bg-violet-900/20" },
  emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400", chip: "bg-emerald-500/15 text-emerald-400",
             feed: "border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-900/20" },
  sky:     { bg: "bg-sky-500/10",     border: "border-sky-500/20",     text: "text-sky-400",     chip: "bg-sky-500/15 text-sky-400",
             feed: "border-sky-200 bg-sky-50 dark:border-sky-500/20 dark:bg-sky-900/20" },
  amber:   { bg: "bg-amber-500/10",   border: "border-amber-500/20",   text: "text-amber-400",   chip: "bg-amber-500/15 text-amber-400",
             feed: "border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-900/20" },
};

const FEED_SIZE = 3;

// ── Mini feed card ─────────────────────────────────────────────────────────────
const FeedCard = ({ items, emptyText, renderItem, onViewAll, color }) => (
  <div className={`rounded-xl border ${COLOR[color].feed} overflow-hidden`}>
    {items.length === 0 ? (
      <p className="text-slate-400 text-xs text-center py-5">{emptyText}</p>
    ) : (
      <div className="divide-y divide-slate-100">
        {items.slice(0, FEED_SIZE).map((item, i) => (
          <div key={item._id || i} className="px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer" onClick={onViewAll}>
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

export default function SharedDashboardHome({ role }) {
  const navigate = useNavigate();
  const { alumni, teacher } = useOutletContext();
  const user = alumni ?? teacher ?? {};
  const { theme } = useContext(Context);
  const config = ROLES[role];
  const base = `/${role.toLowerCase()}`;
  const dark = theme === "dark";

  const [stats,   setStats]   = useState({ mentees: 0, jobs: 0, forums: 0, events: 0 });
  const [jobs,    setJobs]    = useState([]);
  const [forums,  setForums]  = useState([]);
  const [events,  setEvents]  = useState([]);
  const [ideas,   setIdeas]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Feeds show FEED_SIZE items; the stat cards use each list's server total
    const feed = { params: { limit: FEED_SIZE }, withCredentials: true };
    Promise.allSettled([
      axios.get(`${API}/jobs`, feed),
      axios.get(`${API}/forum/questions`, feed),
      axios.get(`${API}/events`, { ...feed, params: { ...feed.params, view: "upcoming" } }),
      axios.get(`${API}/incubation`, feed),
      axios.get(`${API}/mentorship/requests`, { params: { status: "Pending", countOnly: "true" }, withCredentials: true }),
    ]).then(([jobsR, forumsR, eventsR, ideasR, mentorshipR]) => {
      const data = (r) => (r.status === "fulfilled" ? r.value.data : {});
      setJobs(data(jobsR).jobs || []);
      setForums(data(forumsR).questions || []);
      setEvents(data(eventsR).events || []);
      setIdeas(data(ideasR).ideas || []);
      setStats({
        mentees: data(mentorshipR).count || 0,
        jobs: data(jobsR).total || 0,
        forums: data(forumsR).total || 0,
        events: data(eventsR).total || 0,
      });
      setLoading(false);
    });
  }, []);

  const statCards = [
    { label: "Mentee Requests", value: stats.mentees, icon: PiHandshake,     color: config.colors.mentees, path: `${base}/mentorship` },
    { label: "Open Positions",  value: stats.jobs,    icon: PiBriefcase,     color: config.colors.jobs,    path: `${base}/jobs` },
    { label: "Discussions",     value: stats.forums,  icon: PiChatsCircle,   color: config.colors.forums,  path: `${base}/forum` },
    { label: "Upcoming Events", value: stats.events,  icon: PiCalendarCheck, color: config.colors.events,  path: `${base}/events` },
  ];

  const heading = (Icon, color, text) => (
    <h3 className={`text-sm font-bold flex items-center gap-2 mb-2 ${dark ? "text-white" : "text-slate-950"}`}>
      <Icon className={COLOR[color].text}/> {text}
    </h3>
  );
  const titleCls = `text-xs font-semibold truncate ${dark ? "text-slate-100" : "text-slate-950"}`;
  const subtitle = config.subtitle(user).filter(Boolean).join(" · ");

  return (
    <div className="space-y-5 max-w-5xl mx-auto">

      {/* Welcome banner */}
      <div className="relative rounded-2xl overflow-hidden p-6 sm:p-8"
        style={{ background: dark ? config.hero.dark : config.hero.light }}>
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{ backgroundImage:"linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)", backgroundSize:"40px 40px" }}/>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20 pointer-events-none"
          style={{ background: `radial-gradient(circle, ${config.hero.glow}, transparent 70%)` }}/>
        <div className="relative z-10">
          <div className={`inline-flex items-center gap-2 border rounded-full px-3 py-1 mb-4 ${config.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${config.dot}`}/>
            <span className={`text-xs font-semibold tracking-widest uppercase ${config.badgeText}`}>{config.label}</span>
          </div>
          <h2 className={`text-2xl sm:text-3xl font-bold mb-1 ${dark ? "text-white" : "text-slate-950"}`}>
            Welcome back, <span className={`font-semibold ${dark ? config.name.dark : config.name.light}`}>{user.name}</span>!
          </h2>
          {subtitle && <p className={`text-sm ${dark ? "text-slate-300" : "text-slate-700"}`}>{subtitle}</p>}
        </div>
      </div>

      {/* Live Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map(({ label, value, icon: Icon, color, path }) => (
          <div key={label} onClick={() => navigate(path)}
            className={`cursor-pointer rounded-xl p-4 sm:p-5 border ${COLOR[color].bg} ${COLOR[color].border} hover:scale-[1.02] transition-transform duration-200 group`}>
            <div className="flex items-start justify-between mb-3">
              <Icon size={20} className={COLOR[color].text}/>
              <PiArrowRight size={14} className="text-slate-400 transition-colors"/>
            </div>
            <p className={`text-2xl font-bold ${COLOR[color].text} mb-0.5`}>{loading ? "—" : value}</p>
            <p className="text-slate-600 text-xs font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Activity Feed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          {heading(PiBriefcase, config.colors.jobs, "Latest Job Postings")}
          <FeedCard color={config.colors.jobs} items={jobs} emptyText="No jobs posted yet" onViewAll={() => navigate(`${base}/jobs`)}
            renderItem={(j) => (
              <div>
                <p className={titleCls}>{j.role}</p>
                <p className="text-slate-400 text-[11px] mt-0.5">{j.company}</p>
              </div>
            )}
          />
        </div>

        <div>
          {heading(PiChatsCircle, config.colors.forums, "Active Discussions")}
          <FeedCard color={config.colors.forums} items={forums} emptyText="No forum posts yet" onViewAll={() => navigate(`${base}/forum`)}
            renderItem={(f) => (
              <div>
                <p className={titleCls}>{f.title}</p>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  {f.author?.name || "Anonymous"} · {f.answerCount ?? 0} answer{f.answerCount === 1 ? "" : "s"}
                </p>
              </div>
            )}
          />
        </div>

        <div>
          {heading(PiCalendarCheck, config.colors.events, "Upcoming Events")}
          <FeedCard color={config.colors.events} items={events} emptyText="No upcoming events" onViewAll={() => navigate(`${base}/events`)}
            renderItem={(e) => (
              <div>
                <p className={titleCls}>{e.title}</p>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  {new Date(e.date).toLocaleDateString("en-IN", { day:"numeric", month:"short" })}
                  {e.location ? ` · ${e.location}` : ""}
                </p>
              </div>
            )}
          />
        </div>

        <div>
          {heading(PiRocketLaunch, config.colors.ideas, "Student Project Ideas")}
          <FeedCard color={config.colors.ideas} items={ideas} emptyText="No ideas posted yet" onViewAll={() => navigate(`${base}/incubation`)}
            renderItem={(idea) => (
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={titleCls}>{idea.title}</p>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded capitalize flex-shrink-0 ${COLOR[config.colors.ideas].chip}`}>{idea.stage}</span>
                </div>
                <p className="text-slate-400 text-[11px] mt-0.5">{idea.authorName} · {idea.upvotes?.length ?? 0} upvotes</p>
              </div>
            )}
          />
        </div>
      </div>
    </div>
  );
}
