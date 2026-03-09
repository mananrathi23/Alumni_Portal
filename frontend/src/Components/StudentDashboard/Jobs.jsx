import React, { useState } from "react";
import { PiBriefcase, PiMagnifyingGlass } from "react-icons/pi";

const FILTERS = ["All Opportunities", "Full-time", "Part-time", "Internships"];

const Jobs = () => {
  const [search, setSearch]           = useState("");
  const [activeFilter, setActiveFilter] = useState("All Opportunities");

  // 🔴 Backend later: jobs from API
  const jobs = [];

  return (
    <div className="max-w-4xl mx-auto space-y-5">

      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white">Job & Internship Board</h2>
        <p className="text-slate-400 text-sm mt-0.5">Explore opportunities shared by alumni</p>
      </div>

      {/* Search + filters */}
      <div className="bg-slate-900 border border-white/[0.07] rounded-xl p-4 space-y-3">
        <div className="relative">
          <PiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input
            type="text"
            placeholder="Search jobs by title, company, or skill…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-slate-800 border border-white/[0.07] text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-150 ${
                activeFilter === f
                  ? "bg-sky-500 text-white shadow shadow-sky-500/30"
                  : "bg-slate-800 text-slate-400 border border-white/[0.07] hover:text-white hover:border-sky-500/30"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {jobs.length === 0 ? (
        <div className="min-h-72 flex flex-col items-center justify-center text-center bg-slate-900 border border-white/[0.07] rounded-xl">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
            <PiBriefcase size={28} className="text-slate-600" />
          </div>
          <p className="text-slate-300 font-semibold">No opportunities yet</p>
          <p className="text-slate-500 text-sm mt-1">Check back later for new postings from alumni</p>
        </div>
      ) : (
        // 🔴 Backend later: map job cards here
        <></>
      )}
    </div>
  );
};

export default Jobs;
