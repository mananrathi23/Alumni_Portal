import React, { useState } from 'react';
import { PiStudent } from "react-icons/pi";
import { FaUserGraduate } from "react-icons/fa";
import { GiTeacher } from "react-icons/gi";
import { MdAdminPanelSettings } from "react-icons/md";

const RoleSelection = () => {
  const [selectedRole, setSelectedRole] = useState("Alumni");

  const roles = [
    { name: "Student", icon: <PiStudent size={24} /> },
    { name: "Alumni", icon: <FaUserGraduate size={24} /> },
    { name: "Teacher", icon: <GiTeacher size={24} /> },
    { name: "Admin", icon: <MdAdminPanelSettings size={24} /> },
  ];

  return (
    <div className="w-full">
      <p className="mb-3 font-medium">Select Your Role</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {roles.map((role) => (
          <div
            key={role.name}
            onClick={() => setSelectedRole(role.name)}
            className={`flex flex-col items-center justify-center p-4 rounded-xl border cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105
              ${selectedRole === role.name
                ? "bg-gradient-to-br from-purple-100 to-pink-100 border-purple-500 text-purple-600 shadow-md"
                : "bg-gray-50 border-gray-200 hover:border-purple-400 hover:bg-purple-50"
              }`}
          >
            {role.icon}
            <span className="mt-2 text-sm">{role.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoleSelection;