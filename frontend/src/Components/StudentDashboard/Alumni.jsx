import React, { useState } from "react";
import { FaSearch } from "react-icons/fa";

const Alumni = () => {
  /* =====================================
     FRONTEND STATE (TEMPORARY)
     =====================================
     🔴 Backend later:
     - alumni list will come from API
     - filters will be applied server-side
  */
  const [search, setSearch] = useState("");
  const [company, setCompany] = useState("All");
  const [major, setMajor] = useState("All");
  const [mentorshipOnly, setMentorshipOnly] = useState(false);

  // TEMP: empty alumni list
  const alumni = [];

  return (
    <div className="bg-white rounded-xl border p-6 space-y-6">

      {/*HEADER*/}
      <div>
        <h2 className="text-xl font-semibold text-gray-800">
          Alumni Directory
        </h2>
        <p className="text-sm text-gray-500">
          Connect with {alumni.length} alumni from various industries
        </p>
      </div>

      {/*FILTER BAR*/}
      <div className="flex flex-col lg:flex-row gap-4">

        {/* Search */}
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            placeholder="Search alumni..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            /* 🔴 Backend:
               debounce + query API */
          />
        </div>

        {/* Company Filter */}
        <select
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          className="px-4 py-2 border rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="All">All Companies</option>
          {/* 🔴 Backend: map companies */}
        </select>

        {/* Major Filter */}
        <select
          value={major}
          onChange={(e) => setMajor(e.target.value)}
          className="px-4 py-2 border rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="All">All Majors</option>
          {/* 🔴 Backend: map majors */}
        </select>
      </div>

      {/*CHECKBOX*/}
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={mentorshipOnly}
          onChange={(e) => setMentorshipOnly(e.target.checked)}
          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
        />
        Show only available for mentorship
        {/* 🔴 Backend: filter by mentorship flag */}
      </label>

      {/*RESULTS*/}
      <div className="min-h-[200px] flex flex-col items-center justify-center text-center text-gray-500">

        {alumni.length === 0 ? (
          <>
            <p className="font-medium">No alumni found</p>
            <p className="text-sm mt-1">
              Try adjusting your filters
            </p>
          </>
        ) : (
          /* 🔴 Backend later:
             map alumni cards here */
          <></>
        )}

      </div>

    </div>
  );
};

export default Alumni;