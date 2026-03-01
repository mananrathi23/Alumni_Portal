import { NavLink, useNavigate } from "react-router-dom";
import { FaGraduationCap, FaSignOutAlt } from "react-icons/fa";
import { FaBars } from "react-icons/fa";
import { useState } from "react";

const Header = ({ student }) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const handleLogout = () => {
    // 🔴 Backend later:
    // localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <header className="w-full bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between">
      {/* LEFT */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMenuOpen(true)}
          className="lg:hidden text-gray-600 hover:text-gray-900"
        >
          <FaBars size={20} />
        </button>
        <div className="bg-purple-600 text-white p-2 rounded-lg">
          <FaGraduationCap size={18} />
        </div>

        <span className="text-lg font-semibold text-gray-800 hidden sm:block">
          Alumni Portal
        </span>
      </div>
      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden">
          <div className="bg-white w-64 h-full p-4">
            <button
              onClick={() => setMenuOpen(false)}
              className="mb-4 text-sm text-gray-500"
            >
              Close
            </button>

            <nav className="flex flex-col gap-2">
              <NavLink to="/student/dashboard">Dashboard</NavLink>
              <NavLink to="/student/forum">Forum</NavLink>
              <NavLink to="/student/messages">Messages</NavLink>
              <NavLink to="/student/alumni">Alumni</NavLink>
              <NavLink to="/student/requests">Requests</NavLink>
              <NavLink to="/student/jobs">Jobs</NavLink>
              <NavLink to="/student/events">Events</NavLink>
            </nav>
          </div>
        </div>
      )}
      {/* CENTER NAV */}
      <nav className="hidden lg:flex items-center gap-1">
        {[
          ["Dashboard", "/student/dashboard"],
          ["Forum", "/student/forum"],
          ["Messages", "/student/messages"],
          ["Alumni", "/student/alumni"],
          ["Requests", "/student/requests"],
          ["Jobs", "/student/jobs"],
          ["Events", "/student/events"],
        ].map(([label, path]) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `px-3 py-2 rounded-lg text-sm font-medium transition ${
                isActive
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>

      {/* RIGHT */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-semibold text-gray-800">{student.name}</p>
          <p className="text-xs text-gray-500">Student</p>
        </div>

        <img
          src="https://i.pravatar.cc/40"
          alt="profile"
          className="w-8 h-8 rounded-full border"
        />

        <button
          onClick={handleLogout}
          className="text-gray-500 hover:text-red-500 transition"
        >
          <FaSignOutAlt />
        </button>
      </div>
    </header>
  );
};

export default Header;