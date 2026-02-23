import React from "react";
import { FaUsers, FaBriefcase, FaComments, FaCalendarAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const DashboardHome = () => {
  const navigate = useNavigate();

  // 🔴 Backend change later
  const student = {
    name: "Michael Chen",
    department: "Computer Science",
    year: "Junior",
  };

  const stats = {
    alumni: 3,
    jobs: 4,
    forum: 3,
    events: 3,
  };

  return (
    <div className="space-y-6">

      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
        <h2 className="text-2xl font-semibold">
          Welcome back, {student.name}!
        </h2>
        <p className="mt-1 text-white/90">
          {student.department} • {student.year}
        </p>
        <p className="mt-4 text-white/90">
          Connect with alumni, explore opportunities, and grow your network.
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Alumni */}
        <div
          onClick={() => navigate("/student/alumni")}
          className="bg-white border rounded-xl p-5 cursor-pointer hover:shadow-md transition flex justify-between"
        >
          <div>
            <p className="text-gray-500">Alumni Network</p>
            <p className="text-2xl font-semibold">{stats.alumni}</p>
          </div>
          <FaUsers className="text-indigo-500 text-2xl" />
        </div>

        {/* Jobs */}
        <div
          onClick={() => navigate("/student/jobs")}
          className="bg-white border rounded-xl p-5 cursor-pointer hover:shadow-md transition flex justify-between"
        >
          <div>
            <p className="text-gray-500">Open Positions</p>
            <p className="text-2xl font-semibold">{stats.jobs}</p>
          </div>
          <FaBriefcase className="text-green-500 text-2xl" />
        </div>

        {/* Forum */}
        <div
          onClick={() => navigate("/student/forum")}
          className="bg-white border rounded-xl p-5 cursor-pointer hover:shadow-md transition flex justify-between"
        >
          <div>
            <p className="text-gray-500">Active Discussions</p>
            <p className="text-2xl font-semibold">{stats.forum}</p>
          </div>
          <FaComments className="text-blue-500 text-2xl" />
        </div>

        {/* Events */}
        <div
          onClick={() => navigate("/student/events")}
          className="bg-white border rounded-xl p-5 cursor-pointer hover:shadow-md transition flex justify-between"
        >
          <div>
            <p className="text-gray-500">Upcoming Events</p>
            <p className="text-2xl font-semibold">{stats.events}</p>
          </div>
          <FaCalendarAlt className="text-purple-500 text-2xl" />
        </div>

      </div>
    </div>
  );
};

export default DashboardHome;