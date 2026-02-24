// src/Components/StudentDashboard/Forum.jsx

import React, { useState } from "react";
import { FaPlus, FaSearch } from "react-icons/fa";

const Forum = () => {

  /* ===============================
     FRONTEND STATE (TEMPORARY)
     ===============================
     🔴 Backend change later:
     - posts will come from API
     - filters & search will query backend
  */
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  const posts = [];

  const filters = ["All", "Discussions", "Questions", "Announcements"];

  return (
    <div className="bg-white rounded-xl border p-6 space-y-6">

      {/*HEADER*/}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            Discussion Forum
          </h2>
          <p className="text-sm text-gray-500">
            Connect, ask questions, and share knowledge
          </p>
        </div>

        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition"
          /* 🔴 Backend later:
             - open modal
             - create new post */
        >
          <FaPlus size={12} />
          New Post
        </button>
      </div>

      {/*SEARCH*/}
      <div className="relative">
        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
        <input
          type="text"
          placeholder="Search posts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          /* 🔴 Backend later:
             - debounce
             - query API */
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

      {/*POSTS AREA*/}
      <div className="min-h-[200px] flex flex-col items-center justify-center text-center text-gray-500">
        {posts.length === 0 ? (
          <>
            <p className="font-medium">No posts found</p>
            <p className="text-sm mt-1">
              Be the first to start a discussion!
            </p>
          </>
        ) : (
          /* 🔴 Backend later:
             - map posts here */
          <></>
        )}
      </div>

    </div>
  );
};

export default Forum;