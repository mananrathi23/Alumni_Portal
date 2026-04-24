import { useState, useEffect, useRef, useContext } from "react";
import axios from "axios";
import { NavLink, useNavigate } from "react-router-dom";
import { FaSignOutAlt, FaTimes, FaBars } from "react-icons/fa";
import {
  PiChalkboardTeacher, PiHouseLine, PiChatsCircle, PiEnvelope,
  PiUsersThree, PiHandshake, PiBriefcase, PiCalendarCheck,
  PiUserCircle, PiCaretDown,
} from "react-icons/pi";
import { Context } from "../../main";

const NAV_LINKS = [
  { label: "Dashboard",   path: "/teacher/dashboard",  icon: PiHouseLine },
  { label: "Forum",       path: "/teacher/forum",       icon: PiChatsCircle },
  { label: "Messages",    path: "/teacher/messages",    icon: PiEnvelope },
  { label: "Connections", path: "/teacher/students",    icon: PiUsersThree },
  { label: "Our Students", path: "/teacher/batchmates",  icon: PiUsersThree },
  { label: "Mentorship",  path: "/teacher/mentorship",  icon: PiHandshake },
  { label: "Jobs",        path: "/teacher/jobs",        icon: PiBriefcase },
  { label: "Events",      path: "/teacher/events",      icon: PiCalendarCheck },
];

const Header = ({ teacher }) => {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const { theme } = useContext(Context);
  const [mobileOpen, setMobileOpen]           = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDropdown, setShowDropdown]       = useState(false);
  const [pendingCount, setPendingCount]       = useState(0);

  const handleLogout = () => { setShowDropdown(false); setShowLogoutConfirm(true); };
  const confirmLogout = () => { setShowLogoutConfirm(false); navigate("/login"); };
  const cancelLogout  = () => setShowLogoutConfirm(false);
  const initials = teacher?.name?.charAt(0).toUpperCase() ?? "T";

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:4000"}/api/v1/connection/pending`, { withCredentials: true })
      .then((res) => setPendingCount(res.data.requests?.length ?? 0))
      .catch(() => setPendingCount(0));
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-40 h-14 flex items-center justify-between px-4 sm:px-5 backdrop-blur border-b ${theme === "dark" ? "bg-slate-900/95 border-white/[0.07]" : "bg-white/95 border-slate-200/70"}`}>
        {/* Left */}
        <div className="flex items-center gap-2">
          <button className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            onClick={() => setMobileOpen(true)}><FaBars size={16} /></button>
          <button onClick={() => navigate("/teacher/dashboard")} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="bg-violet-500 p-1.5 rounded-lg shadow shadow-violet-500/30">
              <PiChalkboardTeacher className="text-white" size={16} />
            </div>
            <span className={`${theme === "dark" ? "text-white" : "text-slate-950"} font-bold text-sm tracking-wider hidden sm:block`}>TEACHER PORTAL</span>
          </button>
        </div>

        {/* Center nav */}
        <nav className="hidden lg:flex items-center gap-0.5">
          {NAV_LINKS.map(({ label, path }) => (
            <NavLink key={path} to={path}
              className={({ isActive }) =>
                `relative px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-150 ${
                  isActive ? "bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/30"
                           : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"}`}>
              {label}
              {label === "Connections" && pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                  {pendingCount > 9 ? "9+" : pendingCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Right */}
        <div className="flex items-center gap-2.5">
          <div className="text-right hidden sm:block leading-tight">
            <p className={`${theme === "dark" ? "text-white" : "text-black"} text-sm font-semibold`}>{teacher?.name}</p>
            <p className={`${theme === "dark" ? "text-violet-400" : "text-violet-600"} text-xs tracking-widest uppercase font-medium`}>Teacher</p>
          </div>
          <div className="relative" ref={dropdownRef}>
            <button onClick={() => setShowDropdown((p) => !p)} className="flex items-center gap-1">
              <div className="relative">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center text-white font-bold text-sm shadow shadow-violet-500/20">
                  {initials}
                </div>
                {pendingCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1 ring-2 ring-slate-900 leading-none">
                    {pendingCount > 9 ? "9+" : pendingCount}
                  </span>
                )}
              </div>
              <PiCaretDown size={12} className={`text-slate-500 transition-transform duration-200 ${showDropdown ? "rotate-180" : ""}`} />
            </button>
            {showDropdown && (
              <div className={`absolute right-0 top-full mt-2 w-44 rounded-xl shadow-2xl overflow-hidden z-50 ${theme === "dark" ? "bg-slate-900 border border-white/[0.07]" : "bg-white border border-slate-200/70"}`}>
                <button onClick={() => { setShowDropdown(false); navigate("/teacher/profile"); }}
                  className={`w-full flex items-center gap-2.5 px-4 py-3 text-sm ${theme === "dark" ? "text-slate-300 hover:bg-slate-800 hover:text-white" : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"} transition-all text-left`}>
                  <PiUserCircle size={16} className="text-violet-400" /> My Profile
                </button>
                <div className="h-px bg-white/[0.07]" />
                <button onClick={handleLogout}
                  className={`w-full flex items-center gap-2.5 px-4 py-3 text-sm ${theme === "dark" ? "text-slate-400 hover:bg-red-500/10 hover:text-red-400" : "text-slate-700 hover:bg-red-500/10 hover:text-red-400"} transition-all text-left`}>
                  <FaSignOutAlt size={13} /> Logout
                </button>
              </div>
            )}
          </div>
          <button onClick={handleLogout} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all" title="Logout">
            <FaSignOutAlt size={14} />
          </button>
        </div>
      </header>

      {/* Mobile backdrop */}
      <div onClick={() => setMobileOpen(false)}
        className={`fixed inset-0 z-50 bg-black/70 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`} />

      {/* Mobile drawer */}
      <aside className={`fixed top-0 left-0 h-full w-64 z-50 flex flex-col ${theme === "dark" ? "bg-slate-900 border-r border-white/[0.07]" : "bg-white border-r border-slate-200/70"} transform transition-transform duration-300 ease-in-out lg:hidden ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className={`h-14 flex items-center justify-between px-4 border-b ${theme === "dark" ? "border-white/[0.07]" : "border-slate-200/70"} flex-shrink-0`}>
          <div className="flex items-center gap-2">
            <div className="bg-violet-500 p-1.5 rounded-lg"><PiChalkboardTeacher className="text-white" size={16} /></div>
            <span className={`${theme === "dark" ? "text-white" : "text-black"} font-bold text-sm tracking-wider`}>TEACHER PORTAL</span>
          </div>
          <button onClick={() => setMobileOpen(false)} className={`p-1.5 rounded-lg ${theme === "dark" ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"} transition`}>
            <FaTimes size={15} />
          </button>
        </div>
        <div className="px-4 py-4 border-b border-white/[0.07]">
          <button onClick={() => { setMobileOpen(false); navigate("/teacher/profile"); }} className="flex items-center gap-3 w-full hover:opacity-80 transition-opacity">
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center text-white font-bold text-base shadow shadow-violet-500/20">
                {initials}
              </div>
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-slate-900">
                  {pendingCount > 9 ? "9+" : pendingCount}
                </span>
              )}
            </div>
            <div className="min-w-0 text-left">
              <p className={`${theme === "dark" ? "text-white" : "text-black"} text-sm font-semibold truncate`}>{teacher?.name}</p>
              <p className="text-violet-400 text-xs font-medium tracking-widest uppercase">View Profile →</p>
            </div>
          </button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="text-slate-600 text-xs font-semibold tracking-widest uppercase px-3 mb-2">Menu</p>
          {NAV_LINKS.map(({ label, path, icon: Icon }) => (
            <NavLink key={path} to={path} onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive ? "bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/30"
                           : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"}`}>
              <Icon size={17} className="flex-shrink-0" />
              {label}
              {label === "Connections" && pendingCount > 0 && (
                <span className="ml-auto w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {pendingCount > 9 ? "9+" : pendingCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="px-3 py-3 border-t border-white/[0.07]">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-all border border-transparent hover:border-red-500/20">
            <FaSignOutAlt size={14} /> Logout
          </button>
        </div>
      </aside>

      {/* Logout confirm modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/[0.07] rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
              <FaSignOutAlt className="text-red-400" size={18} />
            </div>
            <h3 className="text-white font-bold text-lg">Log out?</h3>
            <p className="text-slate-400 text-sm mt-1 mb-6">Are you sure you want to log out of Teacher Portal?</p>
            <div className="flex gap-3">
              <button onClick={cancelLogout} className="flex-1 py-2.5 rounded-lg bg-slate-800 border border-white/[0.07] text-slate-300 text-sm font-semibold hover:bg-slate-700 transition-all">Cancel</button>
              <button onClick={confirmLogout} className="flex-1 py-2.5 rounded-lg bg-red-500 hover:bg-red-400 text-white text-sm font-bold transition-all shadow shadow-red-500/30">Yes, Log Out</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
export default Header;
