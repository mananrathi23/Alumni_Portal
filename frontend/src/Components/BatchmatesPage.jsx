import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  PiUsersThree, PiMagnifyingGlass, PiGraduationCap,
  PiBriefcase, PiX, PiStudent,
} from "react-icons/pi";

// ── Avatar ────────────────────────────────────────────────────────────────────
const Avatar = ({ name, role }) => {
  const cls = role === "Alumni"
    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
    : "bg-sky-500/20 text-sky-400 border-sky-500/30";
  return (
    <div className={`w-10 h-10 rounded-full border flex items-center justify-center text-sm font-bold flex-shrink-0 ${cls}`}>
      {name?.charAt(0)?.toUpperCase() ?? "?"}
    </div>
  );
};

// ── Role badge ────────────────────────────────────────────────────────────────
const RoleBadge = ({ role }) => {
  const cls = role === "Alumni"
    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
    : "bg-sky-500/10 text-sky-400 border-sky-500/20";
  return (
    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${cls}`}>
      {role}
    </span>
  );
};

// ── User card ─────────────────────────────────────────────────────────────────
const UserCard = ({ user }) => (
  <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50 border border-white/[0.05] hover:bg-slate-800 transition-colors">
    <Avatar name={user.name} role={user.role} />
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2 flex-wrap">
        <p className="text-sm font-semibold text-white truncate">{user.name}</p>
        <RoleBadge role={user.role} />
      </div>
      <p className="text-xs text-slate-400 mt-0.5 truncate">
        {user.department || "—"}
        {user.currentDesignation ? ` · ${user.currentDesignation}` : ""}
      </p>
      {user.currentCompany && (
        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
          <PiBriefcase size={11} /> {user.currentCompany}
        </p>
      )}
      {user.bio && (
        <p className="text-xs text-slate-500 mt-1 line-clamp-1">{user.bio}</p>
      )}
    </div>
  </div>
);

// ── Batch card ────────────────────────────────────────────────────────────────
const BatchCard = ({ batch, accentColor }) => {
  const [open, setOpen] = useState(false);
  const shown = open ? batch.members : batch.members.slice(0, 4);

  const studentCount = batch.members.filter((m) => m.role === "Student").length;
  const alumniCount  = batch.members.filter((m) => m.role === "Alumni").length;

  const accent = {
    sky:    { border: "border-sky-500/30 bg-sky-500/5",     title: "text-sky-400",     sub: "bg-sky-500/10 text-sky-300" },
    emerald:{ border: "border-emerald-500/30 bg-emerald-500/5", title: "text-emerald-400", sub: "bg-emerald-500/10 text-emerald-300" },
    violet: { border: "border-violet-500/30 bg-violet-500/5", title: "text-violet-400",  sub: "bg-violet-500/10 text-violet-300" },
  }[accentColor] || { border: "border-sky-500/30 bg-sky-500/5", title: "text-sky-400", sub: "bg-sky-500/10 text-sky-300" };

  const title = batch.year ? `Class of ${batch.year}` : "Enrollment Year Not Set";

  return (
    <div className={`rounded-xl border ${accent.border} overflow-hidden`}>
      {/* Card header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.03] transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <PiGraduationCap className={`text-xl ${accent.title}`} />
          <div>
            <p className={`text-sm font-bold ${accent.title}`}>{title}</p>
            {/* Breakdown chips */}
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {studentCount > 0 && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  {studentCount} Student{studentCount !== 1 ? "s" : ""}
                </span>
              )}
              {alumniCount > 0 && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {alumniCount} Alumni
                </span>
              )}
            </div>
          </div>
        </div>
        <span className={`text-sm ${accent.title} transition-transform duration-200 inline-block ${open ? "rotate-180" : ""}`}>
          ▾
        </span>
      </button>

      {/* Members */}
      <div className="px-4 pb-4 space-y-2">
        {shown.map((u) => <UserCard key={u._id} user={u} />)}
        {!open && batch.members.length > 4 && (
          <button
            onClick={() => setOpen(true)}
            className="w-full text-xs text-slate-400 hover:text-slate-200 py-2 text-center border border-white/[0.05] rounded-lg hover:bg-white/[0.03] transition-colors"
          >
            + {batch.members.length - 4} more — Show all
          </button>
        )}
        {open && batch.members.length > 4 && (
          <button
            onClick={() => setOpen(false)}
            className="w-full text-xs text-slate-400 hover:text-slate-200 py-2 text-center border border-white/[0.05] rounded-lg hover:bg-white/[0.03] transition-colors"
          >
            Show less
          </button>
        )}
      </div>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
/**
 * Props:
 *   accentColor — "sky" | "emerald" | "violet"
 *   pageTitle   — heading text
 *   pageDesc    — subheading text
 *   viewerRole  — "Teacher" | "Student" | "Alumni" (passed to backend for future filtering)
 */
const BatchmatesPage = ({
  accentColor = "sky",
  pageTitle   = "Batchmates",
  pageDesc    = "Browse students and alumni grouped by their enrollment year",
  viewerRole  = "Student",
}) => {
  const [batches,    setBatches]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [totalUsers, setTotalUsers] = useState(0);

  const fetchBatches = useCallback(async () => {
    setLoading(true);
    try {
      const params = { viewerRole };
      if (search.trim()) params.search = search.trim();

      const res = await axios.get("http://localhost:4000/api/v1/batchmates", {
        params,
        withCredentials: true,
      });
      setBatches(res.data.batches    || []);
      setTotalUsers(res.data.totalUsers || 0);
    } catch {
      setBatches([]);
    } finally {
      setLoading(false);
    }
  }, [search, viewerRole]);

  // Debounced fetch on search change
  useEffect(() => {
    const t = setTimeout(fetchBatches, 350);
    return () => clearTimeout(t);
  }, [fetchBatches]);

  const accentCls = {
    sky:    { ring: "focus:ring-sky-500",    text: "text-sky-400",     spinBorder: "border-sky-500" },
    emerald:{ ring: "focus:ring-emerald-500",text: "text-emerald-400", spinBorder: "border-emerald-500" },
    violet: { ring: "focus:ring-violet-500", text: "text-violet-400",  spinBorder: "border-violet-500" },
  }[accentColor] || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className={`text-xl font-bold text-white flex items-center gap-2`}>
          <PiUsersThree className={accentCls.text} />
          {pageTitle}
        </h2>
        <p className="text-slate-400 text-sm mt-0.5">{pageDesc}</p>
      </div>

      {/* Search bar */}
      <div className="relative max-w-md">
        <PiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name…"
          className={`w-full pl-9 pr-9 py-2.5 rounded-lg bg-slate-800 border border-white/[0.07] text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 ${accentCls.ring} transition-all`}
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
          >
            <PiX size={14} />
          </button>
        )}
      </div>

      {/* Stats row */}
      {!loading && (
        <div className="flex items-center gap-4 flex-wrap text-xs text-slate-500">
          <span>{totalUsers} member{totalUsers !== 1 ? "s" : ""}</span>
          <span>·</span>
          <span>{batches.filter((b) => b.year !== null).length} batch{batches.filter((b) => b.year !== null).length !== 1 ? "es" : ""}</span>
          {search && <span>· results for "<span className="text-slate-300">{search}</span>"</span>}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className={`w-8 h-8 rounded-full border-2 border-t-transparent animate-spin ${accentCls.spinBorder}`} />
        </div>
      ) : batches.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <PiUsersThree className="text-4xl mx-auto mb-3 opacity-30" />
          <p className="text-sm">
            {search ? `No results for "${search}"` : "No members found yet."}
          </p>
          {!search && (
            <p className="text-xs mt-1 text-slate-600">
            Members appear here once they fill in their enrollment year during signup.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {batches.map((batch) => (
            <BatchCard
              key={batch.year ?? "unset"}
              batch={batch}
              accentColor={accentColor}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BatchmatesPage;
