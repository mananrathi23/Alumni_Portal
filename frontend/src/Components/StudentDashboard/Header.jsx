import React from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { FaGraduationCap, FaSignOutAlt } from "react-icons/fa";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  /* ===============================
     TEMPORARY FRONTEND DATA
     ===============================
     🔴 Backend change later:
     Replace this object with API / token data
  */
  const student = {
    name: "Michael Chen", // backend will provide this
    role: "Student",     // backend role
    profilePic: "https://i.pravatar.cc/40"
  };
  const handleLogout = () => {

  // 🔴 Backend change later:
  // - Clear auth token (localStorage/sessionStorage)
  // - Clear user context/state

  navigate("/login");
};

  return (
    <header className="w-full bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between">
      {/* LEFT */}
      <div className="flex items-center gap-3">
        <div className="bg-purple-600 text-white p-2 rounded-lg">
          <FaGraduationCap size={18} />
        </div>
        <span className="text-lg font-semibold text-gray-800 hidden sm:block">
          Alumni Portal
        </span>
      </div>

      {/* CENTER NAV (hidden on small screens) */}
      <nav className="hidden lg:flex items-center gap-1">
        <NavLink
          to="/student/dashboard"
          className={({ isActive }) =>
            `px-3 py-2 rounded-lg text-sm font-medium transition ${
              isActive
                ? "bg-gray-900 text-white"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`
          }
        >
          Dashboard
        </NavLink>

        <NavLink
          to="/student/forum"
          className={({ isActive }) =>
            `px-3 py-2 rounded-lg text-sm font-medium transition ${
              isActive
                ? "bg-gray-900 text-white"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`
          }
        >
          Forum
        </NavLink>

        <NavLink
          to="/student/alumni"
          className={({ isActive }) =>
            `px-3 py-2 rounded-lg text-sm font-medium transition ${
              isActive
                ? "bg-gray-900 text-white"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`
          }
        >
          Alumni
        </NavLink>

        <NavLink
          to="/student/jobs"
          className={({ isActive }) =>
            `px-3 py-2 rounded-lg text-sm font-medium transition ${
              isActive
                ? "bg-gray-900 text-white"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`
          }
        >
          Jobs
        </NavLink>

        <NavLink
          to="/student/events"
          className={({ isActive }) =>
            `px-3 py-2 rounded-lg text-sm font-medium transition ${
              isActive
                ? "bg-gray-900 text-white"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`
          }
        >
          Events
        </NavLink>
      </nav>

      {/* RIGHT */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-semibold text-gray-800">
            {student.name}
            {/* 🔴 Backend: replace with fetched user name */}
          </p>
          <p className="text-xs text-gray-500">
            {student.role}
            {/* 🔴 Backend: role from auth */}
          </p>
        </div>

        <img
          src={student.profilePic}
          alt="profile"
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border"
          /* 🔴 Backend: profile image URL */
        />

        <button
          onClick={handleLogout}
          className="text-gray-500 hover:text-red-500 transition"
          title="Logout"
        >
          <FaSignOutAlt />
        </button>
      </div>
    </header>
  );
};

export default Header;