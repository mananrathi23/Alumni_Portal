/**
 * DashboardShell
 * ──────────────────────────────────────────────────────────────
 * Shared layout: slim top bar (logo + user + logout only)
 *                + grouped left sidebar (all nav links)
 *
 * Props:
 *   user         — the logged-in user object
 *   role         — "Student" | "Alumni" | "Teacher"
 *   accentColor  — "sky" | "emerald" | "violet"
 *   navGroups    — array of { heading, links: [{ label, path, icon, badge? }] }
 *   children     — page content (Outlet)
 *   profilePath  — path to profile page
 *   onLogout     — logout handler
 */

import { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FaSignOutAlt, FaBars, FaTimes } from "react-icons/fa";
import { PiGraduationCap, PiUserCircle, PiCaretDown } from "react-icons/pi";

const ACCENT = {
  sky:    { logo: "bg-sky-500 shadow-sky-500/30",     avatar: "from-sky-400 to-sky-600 shadow-sky-500/20",    active: "bg-sky-500/15 text-sky-400 ring-sky-500/20",    ring: "ring-sky-500/30",    text: "text-sky-400",    dot: "bg-sky-500" },
  emerald:{ logo: "bg-emerald-500 shadow-emerald-500/30", avatar: "from-emerald-400 to-emerald-600 shadow-emerald-500/20", active: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/20", ring: "ring-emerald-500/30", text: "text-emerald-400", dot: "bg-emerald-500" },
  violet: { logo: "bg-violet-500 shadow-violet-500/30",  avatar: "from-violet-400 to-violet-600 shadow-violet-500/20",  active: "bg-violet-500/15 text-violet-400 ring-violet-500/20",  ring: "ring-violet-500/30",  text: "text-violet-400",  dot: "bg-violet-500" },
};

const DashboardShell = ({
  user, role, accentColor = "sky",
  navGroups = [], children,
  profilePath, onLogout,
}) => {
  const [sidebarOpen, setSidebar] = useState(false);
  const [showLogout,  setShowLogout]  = useState(false);
  const [showDropdown, setDropdown]   = useState(false);
  const dropRef = useRef(null);
  const navigate = useNavigate();

  const ac      = ACCENT[accentColor] || ACCENT.sky;
  const initials = user?.name?.charAt(0)?.toUpperCase() ?? "?";

  // Close dropdown on outside click
  useEffect(() => {
    const h = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropdown(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // ── Sidebar content (shared between desktop + mobile drawer) ──────────────
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo row */}
      <div className="h-14 flex items-center gap-3 px-4 border-b border-white/[0.06] flex-shrink-0">
        <div className={`${ac.logo} p-1.5 rounded-lg shadow flex-shrink-0`}>
          <PiGraduationCap className="text-white" size={17} />
        </div>
        <p className="text-white font-bold text-sm tracking-wider leading-none">Alumni Portal</p>
        {/* Close button — mobile only */}
        <button
          onClick={() => setSidebar(false)}
          className="ml-auto lg:hidden p-1 text-slate-500 hover:text-white"
        >
          <FaTimes size={14} />
        </button>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.heading}>
            <p className="text-slate-600 text-[10px] font-bold tracking-widest uppercase px-2 mb-1.5">
              {group.heading}
            </p>
            <div className="space-y-0.5">
              {group.links.map(({ label, path, icon: Icon, badge }) => (
                <NavLink
                  key={path}
                  to={path}
                  onClick={() => setSidebar(false)}
                  className={({ isActive }) =>
                    `relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? `${ac.active} ring-1`
                        : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
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
      <div className="px-3 py-3 border-t border-white/[0.06]">
        <button
          onClick={() => { setSidebar(false); setShowLogout(true); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <FaSignOutAlt size={14} />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 flex">

      {/* ── DESKTOP SIDEBAR (always visible ≥ lg) ── */}
      <aside className="hidden lg:flex flex-col w-56 xl:w-60 flex-shrink-0 bg-slate-900 border-r border-white/[0.06] fixed top-0 left-0 h-full z-30">
        <SidebarContent />
      </aside>

      {/* ── MOBILE BACKDROP ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebar(false)}
        />
      )}

      {/* ── MOBILE SIDEBAR DRAWER ── */}
      <aside
        className={`fixed top-0 left-0 h-full w-60 z-50 flex flex-col bg-slate-900 border-r border-white/[0.06] transform transition-transform duration-300 ease-in-out lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent />
      </aside>

      {/* ── MAIN AREA ── */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-56 xl:ml-60">

        {/* ── SLIM TOP BAR ── */}
        <header className="sticky top-0 z-20 h-14 flex items-center justify-between px-4 sm:px-5 bg-slate-900/95 backdrop-blur border-b border-white/[0.06]">
          {/* Hamburger (mobile only) */}
          <button
            onClick={() => setSidebar(true)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <FaBars size={16} />
          </button>

          {/* Page brand (desktop — sidebar already shows it) */}
          <div className="hidden lg:flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${ac.dot}`} />
            <span className="text-slate-400 text-xs font-medium tracking-widest uppercase">{role} Dashboard</span>
          </div>

          {/* Right side: name + avatar dropdown */}
          <div className="flex items-center gap-2.5 ml-auto">
            <div className="text-right hidden sm:block leading-tight">
              <p className="text-white text-sm font-semibold">{user?.name}</p>
              <p className={`${ac.text} text-[10px] tracking-widest uppercase font-medium`}>{role}</p>
            </div>

            {/* Avatar dropdown */}
            <div className="relative" ref={dropRef}>
              <button
                onClick={() => setDropdown((p) => !p)}
                className="flex items-center gap-1"
              >
                <div className={`w-8 h-8 rounded-xl overflow-hidden shadow`}>
                  {user?.profilePhoto?.url ? (
                    <img src={user.profilePhoto.url} alt={user.name} className="w-full h-full object-cover"/>
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${ac.avatar} flex items-center justify-center text-white font-bold text-sm`}>
                      {initials}
                    </div>
                  )}
                </div>
                <PiCaretDown
                  size={12}
                  className={`text-slate-500 transition-transform duration-200 ${showDropdown ? "rotate-180" : ""}`}
                />
              </button>

              {showDropdown && (
                <div className="absolute right-0 top-full mt-2 w-44 bg-slate-900 border border-white/[0.07] rounded-xl shadow-2xl overflow-hidden z-50">
                  <button
                    onClick={() => { setDropdown(false); navigate(profilePath); }}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-all text-left"
                  >
                    <PiUserCircle size={16} className={ac.text} />
                    My Profile
                  </button>
                  <div className="h-px bg-white/[0.07]" />
                  <button
                    onClick={() => { setDropdown(false); setShowLogout(true); }}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all text-left"
                  >
                    <FaSignOutAlt size={13} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── PAGE CONTENT ── */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* ── LOGOUT MODAL ── */}
      {showLogout && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/[0.07] rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
              <FaSignOutAlt className="text-red-400" size={18} />
            </div>
            <h3 className="text-white font-bold text-lg">Log out?</h3>
            <p className="text-slate-400 text-sm mt-1 mb-6">Are you sure you want to log out of Alumni Portal?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogout(false)}
                className="flex-1 py-2.5 rounded-lg bg-slate-800 border border-white/[0.07] text-slate-300 text-sm font-semibold hover:bg-slate-700 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => { setShowLogout(false); onLogout(); }}
                className="flex-1 py-2.5 rounded-lg bg-red-500 hover:bg-red-400 text-white text-sm font-bold transition-all shadow shadow-red-500/30"
              >
                Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardShell;
