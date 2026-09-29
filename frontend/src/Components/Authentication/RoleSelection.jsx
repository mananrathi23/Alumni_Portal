import React from "react";
import { PiGraduationCap } from "react-icons/pi";
import { FaUserGraduate } from "react-icons/fa";
import { GiTeacher } from "react-icons/gi";
import { MdAdminPanelSettings } from "react-icons/md";

const ALL_ROLES = [
  { name: "Student", icon: <PiGraduationCap size={22} /> },
  { name: "Alumni",  icon: <FaUserGraduate size={22} /> },
  { name: "Teacher", icon: <GiTeacher size={22} /> },
  { name: "Admin",   icon: <MdAdminPanelSettings size={22} /> },
];

// Admin hidden during Sign Up
const REGISTER_ROLES = ALL_ROLES.filter((r) => r.name !== "Admin");

const RoleSelection = ({ selectedRole, setSelectedRole, isLogin }) => {
  const roles = isLogin ? ALL_ROLES : REGISTER_ROLES;

  return (
    <div className="w-full">
      <p className="mb-3 text-sm font-semibold text-slate-400 tracking-widest uppercase">
        Select Your Role
      </p>
      <div className={`grid gap-3 ${isLogin ? "grid-cols-2 md:grid-cols-4" : "grid-cols-3"}`}>
        {roles.map((role) => (
          <div
            key={role.name}
            onClick={() => setSelectedRole(role.name)}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border cursor-pointer transition-all duration-200 hover:-translate-y-0.5
              ${selectedRole === role.name
                ? "bg-sky-500/20 border-sky-500 text-sky-400 shadow-md shadow-sky-500/20"
                : "bg-slate-800 border-white/10 text-slate-400 hover:border-sky-500/50 hover:text-slate-200"
              }`}
          >
            {role.icon}
            <span className="mt-1.5 text-xs font-medium">{role.name}</span>
          </div>
        ))}
      </div>

      {!isLogin && (
        <p className="mt-2 text-xs text-slate-600 text-center">
          Admin accounts are created by the system administrator only.
        </p>
      )}
    </div>
  );
};

export default RoleSelection;
