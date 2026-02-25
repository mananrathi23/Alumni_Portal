import { NavLink, useNavigate } from "react-router-dom";
import { FaGraduationCap, FaSignOutAlt } from "react-icons/fa";

const Header = ({ student }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // 🔴 Backend later:
    // localStorage.removeItem("token");
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
          <p className="text-sm font-semibold text-gray-800">
            {student.name}
          </p>
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