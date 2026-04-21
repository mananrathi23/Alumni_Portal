/**
 * DashboardTicker
 * ─────────────────────────────────────────────────────────────
 * A continuously scrolling ticker bar showing recent mix of
 * forums, events, and jobs. Used on all 3 dashboards.
 *
 * Props:
 *   accentColor  — "sky" | "emerald" | "violet"
 *   forumPath    — e.g. "/student/forum"
 *   eventsPath   — e.g. "/student/events"
 *   jobsPath     — e.g. "/student/jobs"
 */
import { useState, useEffect } from "react";
import { useNavigate }         from "react-router-dom";
import axios                   from "axios";
import { PiSpeakerHigh }       from "react-icons/pi";

const BASE = "http://localhost:4000/api/v1";

const DashboardTicker = ({ accentColor = "sky", forumPath, eventsPath, jobsPath }) => {
  const [items,   setItems]   = useState([]);
  const navigate = useNavigate();

  const COLOR = {
    sky:    { bar: "bg-sky-900/80 border-sky-700/40",    tag: "bg-sky-800 text-sky-300",    sep: "text-sky-500" },
    emerald:{ bar: "bg-emerald-900/80 border-emerald-700/40", tag: "bg-emerald-800 text-emerald-300", sep: "text-emerald-500" },
    violet: { bar: "bg-violet-900/80 border-violet-700/40",  tag: "bg-violet-800 text-violet-300",  sep: "text-violet-500" },
  }[accentColor] || {};

  useEffect(() => {
    const load = async () => {
      const [forumsR, eventsR, jobsR] = await Promise.allSettled([
        axios.get(`${BASE}/forum/questions`,  { withCredentials: true }),
        axios.get(`${BASE}/events`, { params: { view: "upcoming" }, withCredentials: true }),
        axios.get(`${BASE}/jobs`,   { withCredentials: true }),
      ]);

      const collected = [];

      // Forums — "title (description)"
      const forums = forumsR.status === "fulfilled"
        ? (forumsR.value.data.questions || forumsR.value.data.posts || forumsR.value.data.forums || [])
        : [];
      forums.slice(0, 4).forEach((f) => {
        const title = f.title || f.content?.slice(0, 60) || "New discussion";
        const desc  = f.content ? f.content.slice(0, 80) : "";
        collected.push({
          tag:  "Forum",
          text: desc ? `${title} (${desc}…)` : title,
          path: forumPath,
        });
      });

      // Events — "title (Day, Time)"
      const events = eventsR.status === "fulfilled"
        ? (eventsR.value.data.events || [])
        : [];
      events.slice(0, 4).forEach((e) => {
        const dateStr = new Date(e.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
        collected.push({
          tag:  "Event",
          text: `${e.title} (${dateStr}, ${e.time})`,
          path: eventsPath,
        });
      });

      // Jobs — "Role at Company (type)"
      const jobs = jobsR.status === "fulfilled"
        ? (jobsR.value.data.jobs || [])
        : [];
      jobs.slice(0, 4).forEach((j) => {
        const desc = j.type ? j.type.charAt(0).toUpperCase() + j.type.slice(1) : "Opening";
        collected.push({
          tag:  "Job",
          text: `${j.role} at ${j.company} (${desc})`,
          path: jobsPath,
        });
      });

      setItems(collected);
    };
    load();
  }, []);

  if (!items.length) return null;

  // Build the ticker string — repeat 3× so the seamless loop works at any width
  const tickerContent = items.map((item) => `[${item.tag}] ${item.text}`).join("   ·   ");
  const repeated = `${tickerContent}   ·   ${tickerContent}   ·   ${tickerContent}`;

  return (
    <div className={`w-full border rounded-xl overflow-hidden ${COLOR.bar}`}>
      <div className="flex items-center h-9">
        {/* Label pill */}
        <div className={`flex-shrink-0 flex items-center gap-1.5 px-3 h-full border-r border-white/[0.08]`}>
          <PiSpeakerHigh size={13} className={COLOR.sep} />
          <span className={`text-[10px] font-bold tracking-widest uppercase whitespace-nowrap ${COLOR.sep}`}>
            Live Feed
          </span>
        </div>

        {/* Scrolling text */}
        <div className="flex-1 overflow-hidden relative">
          <div
            className="flex whitespace-nowrap text-xs text-slate-300 font-medium"
            style={{ animation: "dash-ticker 40s linear infinite" }}
          >
            <span className="px-6">{repeated}</span>
            <span className="px-6">{repeated}</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes dash-ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
};

export default DashboardTicker;
