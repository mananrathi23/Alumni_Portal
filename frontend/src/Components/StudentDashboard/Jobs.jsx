// src/Components/StudentDashboard/Jobs.jsx

import React, { useState } from "react";
import { FaSearch, FaBriefcase } from "react-icons/fa";

const Jobs = () => {

  /* =====================================
     FRONTEND STATE (TEMPORARY)
     =====================================
     🔴 Backend later:
     - jobs list from API
     - filters applied server-side
  */
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  // TEMP: empty jobs list
  const jobs = [];

  const filters = ["All Opportunities", "Full-time", "Part-time", "Internships"];

  return (
    <div className="bg-white rounded-xl border p-6 space-y-6">

      {/*HEADER*/}
      <div>
        <h2 className="text-xl font-semibold text-gray-800">
          Job & Internship Board
        </h2>
        <p className="text-sm text-gray-500">
          Explore opportunities shared by alumni
        </p>
      </div>

      {/*SEARCH*/}
      <div className="relative">
        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
        <input
          type="text"
          placeholder="Search jobs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          /* 🔴 Backend later:
             debounce + query API */
        />
      </div>

      {/*FILTER TABS*/}
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition
              ${
                activeFilter === filter
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/*RESULTS*/}
      <div className="min-h-[260px] flex flex-col items-center justify-center text-center text-gray-500">

        {jobs.length === 0 ? (
          <>
            <FaBriefcase className="text-5xl text-gray-300 mb-4" />
            <p className="font-medium">No opportunities found</p>
            <p className="text-sm mt-1">
              Check back later for new postings
            </p>
          </>
        ) : (
          /* 🔴 Backend later:
             map job cards here */
          <></>
        )}

      </div>

    </div>
  );
};

export default Jobs;