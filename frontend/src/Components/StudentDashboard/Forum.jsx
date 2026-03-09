import React, { useState } from "react";
import { PiPlus, PiMagnifyingGlass, PiChatsCircle } from "react-icons/pi";
import CreatePostModal from "./CreatePostModal";

const FILTERS = ["All", "Discussions", "Questions", "Announcements"];

const Forum = () => {
  const [search, setSearch]           = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [showModal, setShowModal]       = useState(false);

  // 🔴 Backend later: posts from API
  const posts = [];

  return (
    <div className="max-w-4xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Discussion Forum</h2>
          <p className="text-slate-400 text-sm mt-0.5">Connect, ask questions, and share knowledge</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold tracking-wide transition-all shadow shadow-sky-500/30 hover:-translate-y-0.5 self-start sm:self-auto"
        >
          <PiPlus size={15} />
          New Post
        </button>
      </div>

      {/* Search + filters */}
      <div className="bg-slate-900 border border-white/[0.07] rounded-xl p-4 space-y-3">
        <div className="relative">
          <PiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input
            type="text"
            placeholder="Search posts…"
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

      {/* Posts area */}
      {posts.length === 0 ? (
        <div className="min-h-64 flex flex-col items-center justify-center text-center bg-slate-900 border border-white/[0.07] rounded-xl">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
            <PiChatsCircle size={28} className="text-slate-600" />
          </div>
          <p className="text-slate-300 font-semibold">No posts yet</p>
          <p className="text-slate-500 text-sm mt-1">Be the first to start a discussion!</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400 text-sm font-semibold hover:bg-sky-500/20 transition-all"
          >
            <PiPlus size={14} /> Start a discussion
          </button>
        </div>
      ) : (
        // 🔴 Backend later: map posts
        <></>
      )}

      {showModal && <CreatePostModal onClose={() => setShowModal(false)} />}
    </div>
  );
};

export default Forum;
