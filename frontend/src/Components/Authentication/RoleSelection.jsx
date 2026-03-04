import React from 'react';
import { PiStudent } from "react-icons/pi";
import { FaUserGraduate } from "react-icons/fa";
import { GiTeacher } from "react-icons/gi";
import { motion } from 'framer-motion';

const RoleSelection = ({ selectedRole, setSelectedRole }) => {

  const roles = [
    { name: "Student", icon: <PiStudent size={24} /> },
    { name: "Alumni", icon: <FaUserGraduate size={24} /> },
    { name: "Teacher", icon: <GiTeacher size={24} /> },
  ];

  return (
    <div className="w-full">
      <p className="mb-4 font-medium text-slate-300">Select Your Role</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {roles.map((role, index) => (
          <motion.div
            key={role.name}
            onClick={() => setSelectedRole(role.name)}
            className={`flex flex-col items-center justify-center p-4 rounded-xl border cursor-pointer transition-all duration-300 
            ${
            selectedRole === role.name
            ? "bg-gradient-to-br from-purple-900/40 to-pink-900/40 border-purple-500/60 text-purple-300 shadow-lg shadow-purple-500/20"
            : "bg-slate-800/30 border-slate-700/30 text-slate-400 hover:border-purple-500/40 hover:bg-slate-800/50 hover:text-slate-300"
            }`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + index * 0.1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            {role.icon}
            <span className="mt-2 text-sm">{role.name}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default RoleSelection;
