/**
 * DashboardShell — shared layout for all 3 roles
 * Dark theme only. Mobile bottom nav (lg:hidden).
 * Topbar has embedded live ticker with fast-read toggle.
 */
import { useState, useEffect, useRef, useContext } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FaSignOutAlt, FaBars, FaTimes } from "react-icons/fa";
import { PiGraduationCap, PiUserCircle, PiCaretDown, PiSpeakerHigh, PiWarningCircle } from "react-icons/pi";
import axios from "axios";
import ChatbotWidget from "./ChatbotWidget";
import ThemeToggle from "./ThemeToggle.jsx";
import { Context } from "../main";

const BASE = `${import.meta.env.VITE_BACKEND_URL}/api/v1`;

const ACCENT = {
  sky:    { logo:"bg-sky-500",     avatar:"from-sky-400 to-sky-600",    active:"bg-sky-500/15 text-sky-400 ring-sky-500/20",    text:"text-sky-400",    dot:"bg-sky-500"    },
  emerald:{ logo:"bg-emerald-500", avatar:"from-emerald-400 to-emerald-600", active:"bg-emerald-500/15 text-emerald-400 ring-emerald-500/20", text:"text-emerald-400", dot:"bg-emerald-500" },
  violet: { logo:"bg-violet-500",  avatar:"from-violet-400 to-violet-600",  active:"bg-violet-500/15 text-violet-400 ring-violet-500/20",  text:"text-violet-400",  dot:"bg-violet-500"  },
};

// ── Colour cycle for ticker items (alternates red / green) ────────────────────
const ITEM_COLORS = [
  "text-red-400",
  "text-emerald-400",
  "text-amber-400",
  "text-sky-400",
];

// ── Inline ticker ─────────────────────────────────────────────────────────────
const InlineTicker = ({ collapsed }) => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    (async () => {
      const [fR, eR, jR] = await Promise.allSettled([
        axios.get(`${BASE}/forum/questions`,  { withCredentials: true }),
        axios.get(`${BASE}/events`, { params:{ view:"upcoming" }, withCredentials: true }),
        axios.get(`${BASE}/jobs`,   { withCredentials: true }),
      ]);
      const c = [];
      (fR.status==="fulfilled" ? fR.value.data.questions||fR.value.data.posts||fR.value.data.forums||[] : []).slice(0,3)
        .forEach(f => c.push({ tag:"Forum", text: f.title||f.content?.slice(0,60)||"New discussion" }));
      (eR.status==="fulfilled" ? eR.value.data.events||[] : []).slice(0,3)
        .forEach(e => c.push({ tag:"Event", text:`${e.title} · ${new Date(e.date).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}, ${e.time}` }));
      (jR.status==="fulfilled" ? jR.value.data.jobs||[] : []).slice(0,3)
        .forEach(j => c.push({ tag:"Job", text:`${j.role} at ${j.company}` }));
      setItems(c);
    })();
  }, []);

  if (!items.length || collapsed) return null;

  // Fixed speed: 1x
  const duration = "45s";

  // Build the repeating ticker with alternating coloured spans
  const makeSpans = (offset = 0) =>
    items.map((item, i) => {
      const col = ITEM_COLORS[(i + offset) % ITEM_COLORS.length];
      return (
        <span key={`${offset}-${i}`} className={`${col} font-semibold`}>
          [{item.tag}] {item.text}
          <span className="text-slate-600 mx-3">·</span>
        </span>
      );
    });

  return (
    <div className="flex-1 flex items-center h-full overflow-hidden">
      {/* Scrolling strip (no Live/role/speed controls) */}
      <div className="flex-1 overflow-hidden relative">
        <div className="flex whitespace-nowrap text-xs items-center"
          style={{ animation: `dash-ticker ${duration} linear infinite` }}>
          <span className="px-3">{makeSpans(0)}</span>
          <span className="px-3">{makeSpans(0)}</span>
          <span className="px-3">{makeSpans(0)}</span>
        </div>
      </div>
      <style>{`
        @keyframes dash-ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
      `}</style>
    </div>
  );
};

// ── Mobile bottom nav ─────────────────────────────────────────────────────────
const MobileBottomNav = ({ navGroups, accentColor }) => {
  const ac = ACCENT[accentColor] || ACCENT.sky;
  const allLinks  = navGroups.flatMap(g => g.links);
  const dashboard = allLinks.find(l => l.label === "Dashboard");
  const rest      = allLinks.filter(l => l.label !== "Dashboard" && l.label !== "My Profile").slice(0, 3);
  const profile   = allLinks.find(l => l.label === "My Profile");
  const tabs      = [dashboard, ...rest, profile].filter(Boolean).slice(0, 5);

  const { theme } = useContext(Context);

  return (
    <nav className={`lg:hidden fixed bottom-0 left-0 right-0 z-30 flex items-stretch ${theme === "dark" ? "bg-slate-900 border-t border-white/[0.06]" : "bg-white border-t border-slate-200/70"}`}>
      {tabs.map(({ label, path, icon: Icon, badge }) => (
        <NavLink key={path} to={path}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center gap-0.5 py-2 px-1 text-[10px] font-semibold transition-colors relative ${
              isActive ? `${ac.text} border-t-2 border-current -mt-px` : "text-slate-500 hover:text-slate-300"
            }`
          }
        >
          {Icon && <Icon size={20} />}
          <span className="truncate max-w-[48px] text-center leading-none">{label}</span>
          {badge > 0 && (
            <span className="absolute top-1.5 right-2 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
              {badge > 9 ? "9+" : badge}
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  );
};

// ── DashboardShell ────────────────────────────────────────────────────────────
const DashboardShell = ({
  user, role, accentColor = "sky",
  navGroups = [], children,
  profilePath, onLogout,
}) => {
  const { theme } = useContext(Context);
  const [sidebarOpen, setSidebar]   = useState(false);
  const [showLogout,  setShowLogout] = useState(false);
  const [showDrop,    setShowDrop]   = useState(false);
  const [tickerOff,   setTickerOff]  = useState(false);
  const dropRef  = useRef(null);
  const navigate = useNavigate();
  const ac       = ACCENT[accentColor] || ACCENT.sky;
  const initials = user?.name?.charAt(0)?.toUpperCase() ?? "?";

  useEffect(() => {
    const h = e => { if (dropRef.current && !dropRef.current.contains(e.target)) setShowDrop(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const bgGradient = theme === "dark"
    ? {
      sky:    "linear-gradient(135deg,#0a0f1e 0%,#0d1829 40%,#060d1a 100%)",
      emerald:"linear-gradient(135deg,#030f0a 0%,#071a0f 40%,#020a06 100%)",
      violet: "linear-gradient(135deg,#0d0814 0%,#150d22 40%,#080512 100%)",
    }[accentColor]
    : {
      sky:    "linear-gradient(135deg,#eff6ff 0%,#dbeafe 40%,#bfdbfe 100%)",
      emerald:"linear-gradient(135deg,#ecfdf5 0%,#d1fae5 40%,#bbf7d0 100%)",
      violet: "linear-gradient(135deg,#f5f3ff 0%,#ede9fe 40%,#ddd6fe 100%)",
    }[accentColor];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="h-14 flex items-center gap-3 px-4 border-b border-slate-200/70 dark:border-white/[0.06] flex-shrink-0">
        <div className={`${ac.logo} p-1.5 rounded-lg shadow flex-shrink-0`}>
          <PiGraduationCap className="text-white" size={17} />
        </div>
        <p className={`${theme === "dark" ? "text-white" : "text-slate-900"} font-bold text-sm tracking-wider`}>
          Alumni Portal
        </p>
        <button
          onClick={() => setSidebar(false)}
          className="ml-auto lg:hidden p-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <FaTimes size={14} />
        </button>
      </div>
      {/* User mini-card
      <button
        onClick={() => { setSidebar(false); navigate(profilePath); }}
        className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06] hover:bg-white/[0.03] transition-colors text-left"
      >
        <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 shadow">
          {user?.profilePhoto?.url
            ? <img src={user.profilePhoto.url} alt={user.name} className="w-full h-full object-cover"/>
            : <div className={`w-full h-full bg-gradient-to-br ${ac.avatar} flex items-center justify-center text-white font-bold text-sm`}>{initials}</div>
          }
        </div>
        <div className="min-w-0">
          <p className="text-white text-sm font-semibold truncate">{user?.name}</p>
          <p className={`${ac.text} text-[10px] tracking-widest uppercase font-medium`}>View Profile →</p>
        </div>
      </button> */}

      {/* Nav groups */}
      <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.heading}>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold tracking-widest uppercase px-2 mb-1.5">
              {group.heading}
            </p>
            <div className="space-y-0.5">
              {group.links.map(({ label, path, icon: Icon, badge }) => (
                <NavLink
                  key={path}
                  to={path}
                  onClick={() => setSidebar(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? "bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-white ring-1"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                    }`
                  }
                >
                  {Icon && <Icon size={17} className="flex-shrink-0" />}
                  <span className="flex-1 truncate">{label}</span>
                  {badge > 0 && (
                    <span className="ml-auto min-w-[20px] h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
                      {badge > 9 ? "9+" : badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-3 border-t border-slate-200/70 dark:border-white/[0.06]">
        <button
          onClick={() => {
            setSidebar(false);
            setShowLogout(true);
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <FaSignOutAlt size={14} /> Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex" style={{ background: bgGradient }}>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 xl:w-60 flex-shrink-0 bg-white dark:bg-slate-900 backdrop-blur border-r border-slate-200/70 dark:border-white/[0.06] fixed top-0 left-0 h-full z-30">
        <SidebarContent />
      </aside>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebar(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`fixed top-0 left-0 h-full w-60 z-50 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200/70 dark:border-white/[0.06] transform transition-transform duration-300 lg:hidden ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <SidebarContent />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-56 xl:ml-60">
        {/* Topbar */}
        <header className="sticky top-0 z-20 h-14 flex items-center bg-white dark:bg-slate-900 backdrop-blur border-b border-slate-200/70 dark:border-white/[0.06]">
          {/* Left */}
          <div className="flex items-center px-3 gap-2 flex-shrink-0">
            <button
              onClick={() => setSidebar(true)}
              className="lg:hidden p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            >
              <FaBars size={16} />
            </button>
            <div className="hidden lg:flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${ac.dot}`} />
            </div>
          </div>

          {/* Ticker + collapse arrow — always flex-1 to keep profile pinned to the right */}
          <div className="flex-1 flex items-center min-w-0 h-full">
            <InlineTicker collapsed={tickerOff} />
            <button
              onClick={() => setTickerOff((p) => !p)}
              className="flex-shrink-0 px-2 text-slate-500 hover:text-slate-300 transition-colors text-xs"
            >
              {tickerOff ? "▶" : "◀"}
            </button>
          </div>

          <div className="hidden sm:flex items-center px-2">
            <ThemeToggle size="sm" />
          </div>

          {/* Right: name + avatar */}
          <div className="flex items-center gap-2 px-3 flex-shrink-0">
            <div className="hidden sm:block text-right leading-tight">
              <p className={`${theme === "dark" ? "text-white" : "text-slate-900"} text-sm font-semibold`}>
                {user?.name}
              </p>
            </div>
            <div className="relative" ref={dropRef}>
              <button
                onClick={() => setShowDrop((p) => !p)}
                className="flex items-center gap-1"
              >
                <div className="w-8 h-8 rounded-xl overflow-hidden shadow">
                  {user?.profilePhoto?.url ? (
                    <img
                      src={user.profilePhoto.url}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className={`w-full h-full bg-gradient-to-br ${ac.avatar} flex items-center justify-center text-white font-bold text-sm`}
                    >
                      {initials}
                    </div>
                  )}
                </div>
                <PiCaretDown
                  size={12}
                  className={`text-slate-500 transition-transform duration-200 ${showDrop ? "rotate-180" : ""}`}
                />
              </button>
              {showDrop && (
                <div className="absolute right-0 top-full mt-2 w-44 bg-slate-900 border border-white/[0.07] rounded-xl shadow-2xl overflow-hidden z-50">
                  <button
                    onClick={() => {
                      setShowDrop(false);
                      navigate(profilePath);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all text-left"
                  >
                    <PiUserCircle size={16} className={ac.text} /> My Profile
                  </button>
                  <div className="h-px bg-white/[0.07]" />
                  <button
                    onClick={() => {
                      setShowDrop(false);
                      setShowLogout(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-slate-500 dark:text-slate-300 hover:bg-red-500/10 hover:text-red-400 transition-all text-left"
                  >
                    <FaSignOutAlt size={13} /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto pb-20 lg:pb-8">
          {user && user.role !== "Admin" && !user.adminVerified && (
            <div className={`mb-6 flex items-start gap-3 p-4 rounded-xl border ${theme === "dark" ? "bg-amber-500/10 border-amber-500/20" : "bg-amber-50 border-amber-200 shadow-sm"}`}>
              <PiWarningCircle className={`mt-0.5 flex-shrink-0 ${theme === "dark" ? "text-amber-400" : "text-amber-600"}`} size={20} />
              <div>
                <p className={`font-bold ${theme === "dark" ? "text-amber-400" : "text-amber-800"}`}>Account Pending Verification</p>
                <p className={`text-sm mt-1 leading-relaxed ${theme === "dark" ? "text-amber-200/80" : "text-amber-700"}`}>
                  Your account is currently under review by an administrator. Core portal features such as the Forum, Jobs, Events, and Mentorship are restricted until you are verified.
                </p>
              </div>
            </div>
          )}
          {children}
        </main>

        {/* Mobile bottom nav */}
        <MobileBottomNav navGroups={navGroups} accentColor={accentColor} />
      </div>

      {/* Logout modal */}
      {showLogout && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/[0.07] rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
              <FaSignOutAlt className="text-red-400" size={18} />
            </div>
            <h3 className="text-white font-bold text-lg">Log out?</h3>
            <p className="text-slate-400 text-sm mt-1 mb-6">
              Are you sure you want to log out?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogout(false)}
                className="flex-1 py-2.5 rounded-lg bg-slate-800 border border-white/[0.07] text-slate-300 text-sm font-semibold hover:bg-slate-700 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLogout(false);
                  onLogout();
                }}
                className="flex-1 py-2.5 rounded-lg bg-red-500 hover:bg-red-400 text-white text-sm font-bold transition-all shadow shadow-red-500/30"
              >
                Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      )}
      <ChatbotWidget />
    </div>
  );
};

export default DashboardShell;
