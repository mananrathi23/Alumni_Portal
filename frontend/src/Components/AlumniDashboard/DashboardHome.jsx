import { useNavigate, useOutletContext } from "react-router-dom";
import { PiUsersThree, PiBriefcase, PiChatsCircle, PiCalendarCheck, PiHandshake, PiArrowRight } from "react-icons/pi";

const DashboardHome = () => {
  const navigate = useNavigate();
  const { alumni } = useOutletContext();

  const stats = [
    { label: "Mentee Requests", value: alumni.stats?.menteeRequests ?? 0, icon: PiHandshake,  color: "emerald", path: "/alumni/mentorship", desc: "Students awaiting your guidance" },
    { label: "Jobs Posted",     value: alumni.stats?.jobsPosted     ?? 0, icon: PiBriefcase,  color: "sky",     path: "/alumni/jobs",       desc: "Opportunities you've shared" },
    { label: "Discussions",     value: alumni.stats?.discussions    ?? 0, icon: PiChatsCircle,color: "violet",  path: "/alumni/forum",      desc: "Active forum threads" },
    { label: "Upcoming Events", value: alumni.stats?.events         ?? 0, icon: PiCalendarCheck,color:"amber",  path: "/alumni/events",     desc: "Meetups & reunions" },
  ];

  const colorMap = {
    emerald:{ bg:"bg-emerald-500/10", border:"border-emerald-500/20", icon:"text-emerald-400", val:"text-emerald-400" },
    sky:    { bg:"bg-sky-500/10",     border:"border-sky-500/20",     icon:"text-sky-400",     val:"text-sky-400"     },
    violet: { bg:"bg-violet-500/10",  border:"border-violet-500/20",  icon:"text-violet-400",  val:"text-violet-400"  },
    amber:  { bg:"bg-amber-500/10",   border:"border-amber-500/20",   icon:"text-amber-400",   val:"text-amber-400"   },
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Welcome banner */}
      <div className="relative rounded-2xl overflow-hidden p-6 sm:p-8"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #064e3b 60%, #065f46 100%)" }}>
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{ backgroundImage:"linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)", backgroundSize:"40px 40px" }} />
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20 pointer-events-none"
          style={{ background:"radial-gradient(circle, #10b981, transparent 70%)" }} />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 rounded-full px-3 py-1 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-xs font-semibold tracking-widest uppercase">Alumni Dashboard</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">
            Welcome back, <span className="text-emerald-400">{alumni.name}</span>!
          </h2>
          <p className="text-slate-400 text-sm mb-2">
            {alumni.currentDesignation && <span className="text-slate-300">{alumni.currentDesignation}</span>}
            {alumni.currentCompany && <span className="text-slate-500"> at {alumni.currentCompany}</span>}
            {alumni.graduationYear && <span className="text-slate-500"> · Class of {alumni.graduationYear}</span>}
          </p>
          <p className="text-slate-400 text-sm leading-relaxed max-w-lg">
            Give back to your community — mentor students, share job opportunities, and stay connected.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map(({ label, value, icon: Icon, color, path, desc }) => {
          const c = colorMap[color];
          return (
            <div key={label} onClick={() => navigate(path)}
              className={`cursor-pointer rounded-xl p-4 sm:p-5 border ${c.bg} ${c.border} hover:scale-[1.02] transition-transform duration-200 group`}>
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
