import { useOutletContext } from "react-router-dom";
import { NavLink } from "react-router-dom";
import {
  PiShieldCheck, PiNewspaper, PiCalendarCheck, PiBriefcase,
  PiArrowRight,
} from "react-icons/pi";

const CARDS = [
  {
    title: "Manage News",
    desc:  "Post announcements shown on the public homepage ticker.",
    icon:  PiNewspaper,
    color: "rose",
    path:  "/admin/news",
  },
  {
    title: "Manage Events",
    desc:  "Create and manage events visible to all portal users.",
    icon:  PiCalendarCheck,
    color: "sky",
    path:  "/admin/events",
  },
  {
    title: "Manage Jobs",
    desc:  "Post and manage job listings for students and alumni.",
    icon:  PiBriefcase,
    color: "emerald",
    path:  "/admin/jobs",
  },
];

const COLOR = {
  rose:    { bg: "bg-rose-500/10",    border: "border-rose-500/20",    icon: "text-rose-400",    btn: "bg-rose-500 hover:bg-rose-400" },
  sky:     { bg: "bg-sky-500/10",     border: "border-sky-500/20",     icon: "text-sky-400",     btn: "bg-sky-500 hover:bg-sky-400" },
  emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: "text-emerald-400", btn: "bg-emerald-500 hover:bg-emerald-400" },
};

const DashboardHome = () => {
  const { admin } = useOutletContext();

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <PiShieldCheck className="text-rose-400 text-2xl" />
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        </div>
        <p className="text-slate-400 text-sm">
          Welcome back, <span className="text-white font-medium">{admin?.name}</span>. You have full admin access.
        </p>
      </div>

      {/* Admin badge */}
      <div className="flex items-center gap-3 px-4 py-3 bg-rose-500/10 border border-rose-500/20 rounded-xl w-fit">
        <PiShieldCheck className="text-rose-400 text-lg" />
        <div>
          <p className="text-rose-300 text-xs font-bold uppercase tracking-widest">Admin Account</p>
          <p className="text-slate-400 text-xs mt-0.5">{admin?.email} · {admin?.adminLevel?.replace("_", " ")}</p>
        </div>
      </div>

      {/* Quick-action cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {CARDS.map(({ title, desc, icon: Icon, color, path }) => {
          const c = COLOR[color];
          return (
            <div key={path} className={`rounded-xl border ${c.border} ${c.bg} p-5 flex flex-col gap-4`}>
              <div className={`text-2xl ${c.icon}`}><Icon /></div>
              <div className="flex-1">
                <p className="text-white font-semibold text-sm">{title}</p>
                <p className="text-slate-400 text-xs mt-1 leading-relaxed">{desc}</p>
              </div>
              <NavLink
                to={path}
                className={`flex items-center justify-center gap-2 ${c.btn} text-white text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-lg transition-all`}
              >
                Open <PiArrowRight size={13} />
              </NavLink>
            </div>
          );
        })}
      </div>

      {/* Notice */}
      <div className="bg-slate-900 border border-white/[0.06] rounded-xl p-5">
        <p className="text-slate-400 text-xs leading-relaxed">
          <span className="text-white font-semibold">Security Notice:</span> This admin account was pre-created by the system administrator.
          Admin accounts cannot be self-registered. All admin actions are performed under your authenticated session.
          Do not share your credentials.
        </p>
      </div>
    </div>
  );
};

export default DashboardHome;
