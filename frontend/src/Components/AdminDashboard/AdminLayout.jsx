import { useEffect, useState, useContext } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { Context } from "../../main";
import ThemeToggle from "../ThemeToggle.jsx";
import {
  PiGraduationCap, PiHouseLine, PiNewspaper, PiUsersThree,
  PiCalendarCheck, PiBriefcase, PiSignOut,
  PiShieldCheck, PiList, PiX, PiHeadset,
} from "react-icons/pi";

const NAV = [
  { label: "Dashboard", path: "/admin/dashboard", icon: PiHouseLine },
  { label: "News",      path: "/admin/news",      icon: PiNewspaper,  perm: "manageNews" },
  { label: "Events",    path: "/admin/events",    icon: PiCalendarCheck, perm: "manageEvents" },
  { label: "Jobs",      path: "/admin/jobs",      icon: PiBriefcase,  perm: "manageJobs" },
  { label: "Students",  path: "/admin/students",  icon: PiUsersThree, perm: "viewStudents" },
  { label: "Users",     path: "/admin/users",     icon: PiGraduationCap, perm: "manageUsers" },
  { label: "Support",   path: "/admin/support",   icon: PiHeadset,    perm: "manageUsers" },
];

const AdminLayout = () => {
  const [admin, setAdmin]       = useState(null);
  const [mobileOpen, setMobile] = useState(false);
  const navigate = useNavigate();
  const { setIsAuthenticated, setUser, theme } = useContext(Context);

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user/me`, { withCredentials: true })
      .then((res) => {
        setIsAuthenticated(true);
        setUser(res.data.user);
        setAdmin(res.data.user);
      })
      .catch(() => {
        setIsAuthenticated(false);
        setUser(null);
        navigate("/login");
      });
  }, [navigate, setIsAuthenticated, setUser]);

  const handleLogout = async () => {
    try {
      await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user/logout`, { withCredentials: true });
    } catch {}
    setIsAuthenticated(false);
    setUser(null);
    navigate("/login");
    toast.info("Logged out.");
  };

  if (!admin) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === "dark" ? "bg-slate-950" : "bg-slate-50"}`}>
        <div className="w-10 h-10 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const visibleNav = NAV.filter((n) => !n.perm || admin?.permissions?.[n.perm] === true);

  const renderSidebar = (mobile = false) => (
    <aside className={`${mobile ? "flex" : "hidden md:flex"} flex-col h-full w-64 ${theme === "dark" ? "bg-slate-900 border-r border-white/[0.06]" : "bg-white border-r border-slate-200/70"} p-4`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-2 py-3 mb-6">
        <div className="bg-rose-500 p-2 rounded-lg">
          <PiShieldCheck className="text-white text-lg" />
        </div>
        <div>
          <p className={`${theme === "dark" ? "text-white" : "text-slate-950"} font-bold text-sm tracking-wide`}>Admin Panel</p>
          <p className={`${theme === "dark" ? "text-rose-400" : "text-rose-600"} text-xs font-medium`}>{admin.name}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {visibleNav.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            onClick={() => setMobile(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-rose-500/15 text-rose-400 border border-rose-500/20"
                  : "text-slate-600 hover:text-slate-950 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800"
              }`
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-slate-200/70 dark:border-white/[0.06]">
        <ThemeToggle size="sm" />
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all mt-2"
      >
        <PiSignOut size={17} />
        Logout
      </button>
    </aside>
  );

  return (
    <div className={`min-h-screen flex ${theme === "dark" ? "bg-slate-950" : "bg-white"}`}>
      {/* Desktop sidebar */}
      {renderSidebar(false)}

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobile(false)} />
          <div className="relative z-10 h-full">
            {renderSidebar(true)}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <header className={`md:hidden flex items-center justify-between px-4 h-14 ${theme === "dark" ? "bg-slate-900 border-b border-white/[0.06]" : "bg-white/95 border-b border-slate-200/70"}`}>
          <div className="flex items-center gap-2">
            <PiShieldCheck className="text-rose-400 text-lg" />
            <span className={`${theme === "dark" ? "text-white" : "text-slate-950"} font-bold text-sm`}>Admin Panel</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle size="sm" />
            <button onClick={() => setMobile(true)} className="text-slate-400 hover:text-white">
              <PiList size={22} />
            </button>
          </div>
        </header>

        <main className={`flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto ${theme === "dark" ? "bg-slate-950" : "bg-slate-50"}`}>
          <Outlet context={{ admin }} />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
