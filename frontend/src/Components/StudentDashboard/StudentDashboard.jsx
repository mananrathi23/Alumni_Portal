import React from "react";
import Header from "./Header";
import { FaUsers, FaBriefcase } from "react-icons/fa";
import { FiMessageSquare } from "react-icons/fi";
import { MdEvent } from "react-icons/md";
import DashboardHome from "./DashboardHome";

const StudentDashboard = () => {

  /* =========================================
     TEMPORARY FRONTEND DATA (REMOVE LATER)
     =========================================
     🔴 BACKEND INTEGRATION NOTES:
     - Fetch student details after login
     - Replace this object with API response
     - Example:
         const student = response.data
  */
  const student = {
    name: "Michael Chen",        // 🔴 Replace with backend name
    department: "Computer Science", // 🔴 Replace with backend department
    year: "Junior",              // 🔴 Replace with backend year
    stats: {
      alumniCount: 3,            // 🔴 From backend
      openPositions: 4,          // 🔴 From backend
      discussions: 3,            // 🔴 From backend
      events: 3                  // 🔴 From backend
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />

      <main className="p-4 sm:p-6">
        <DashboardHome />
      </main>
    </div>
  );
};

export default StudentDashboard;