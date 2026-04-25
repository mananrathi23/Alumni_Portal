// SharedBatchmates.jsx — Class groups for Students/Alumni, Department groups for Teachers
// Props: role, accentColor

import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  PiUsersThree, PiGraduationCap, PiCaretDown, PiCaretUp,
  PiMagnifyingGlass, PiCircleNotch, PiBriefcase, PiChalkboardTeacher,
  PiLinkedinLogo, PiGithubLogo, PiLink, PiHandshake,
} from "react-icons/pi";

const API = "http://localhost:4000/api/v1/batchmates";

const ROLE_AVATAR = {
  Student: "bg-gradient-to-br from-sky-400 to-sky-600",
  Alumni:  "bg-gradient-to-br from-emerald-400 to-emerald-600",
  Teacher: "bg-gradient-to-br from-violet-400 to-violet-600",
};
const ROLE_BADGE = {
  Student: "bg-sky-500/15 text-sky-400 border-sky-500/25",
  Alumni:  "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  Teacher: "bg-violet-500/15 text-violet-400 border-violet-500/25",
};

// ── Person Card ───────────────────────────────────────────────────────────────
function PersonCard({ person }) {
  const r    = person.role || "Student";
  const init = (person.name || "?").charAt(0).toUpperCase();

  return (
    <div className="bg-slate-800/60 border border-white/[0.06] rounded-xl p-4 flex items-stretch gap-3 hover:border-white/[0.12] transition-all">
      <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-bold text-sm ${ROLE_AVATAR[r] || ROLE_AVATAR.Student}`}>
        {init}
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-white font-semibold text-sm truncate">{person.name}</p>
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border flex-shrink-0 ${ROLE_BADGE[r] || ROLE_BADGE.Student}`}>{r}</span>
        </div>

        {/* Role-specific subtitle */}
        {r === "Student" && (
          <p className="text-slate-500 text-xs mt-0.5">{person.department} · {person.year}</p>
        )}
        {r === "Alumni" && (
          <p className="text-slate-500 text-xs mt-0.5 truncate">
            {person.currentDesignation && `${person.currentDesignation}`}
            {person.currentCompany && ` @ ${person.currentCompany}`}
            {!person.currentDesignation && !person.currentCompany && person.department}
          </p>
        )}
        {r === "Teacher" && (
          <p className="text-slate-500 text-xs mt-0.5">{person.designation || "Faculty"} · {person.department}</p>
        )}

        {/* Bio snippet */}
        {person.bio && (
          <p className="text-slate-600 text-xs mt-1 line-clamp-1 leading-relaxed">{person.bio}</p>
        )}

        {/* Skills */}
        {person.skills?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {person.skills.slice(0, 3).map(s => (
              <span key={s} className="px-1.5 py-0.5 rounded-md bg-slate-700/60 text-slate-400 text-[10px]">{s}</span>
            ))}
            {person.skills.length > 3 && (
              <span className="text-slate-600 text-[10px] px-1">+{person.skills.length - 3}</span>
            )}
          </div>
        )}

        {/* Links */}
        <div className="pt-2">
          <div className="flex items-center gap-2">
            {person.linkedIn && (
              <a href={person.linkedIn} target="_blank" rel="noreferrer"
                className="text-slate-600 hover:text-sky-400 transition-colors"
                title="LinkedIn"
              >
                <PiLinkedinLogo size={14}/>
              </a>
            )}
            {person.github && (
              <a href={person.github} target="_blank" rel="noreferrer"
                className="text-slate-600 hover:text-white transition-colors"
                title="GitHub"
              >
                <PiGithubLogo size={14}/>
              </a>
            )}
            {person.portfolio && (
              <a href={person.portfolio} target="_blank" rel="noreferrer"
                className="text-slate-600 hover:text-emerald-400 transition-colors"
                title="Portfolio"
              >
                <PiLink size={14}/>
              </a>
            )}
            {person.availableForMentorship && (
              <span className="flex items-center gap-1 text-[9px] text-emerald-400 font-semibold ml-1">
                <PiHandshake size={11}/> Mentor
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Collapsible Group ─────────────────────────────────────────────────────────
function BatchGroup({ group, accentColor, defaultOpen = false }) {
  const [open, setOpen]     = useState(defaultOpen);
  const [search, setSearch] = useState("");

  const filtered = search
    ? group.members.filter(m =>
        (m.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (m.department || "").toLowerCase().includes(search.toLowerCase()) ||
        (m.currentCompany || "").toLowerCase().includes(search.toLowerCase())
      )
    : group.members;

  const ringColor = { sky:"ring-sky-500/30", emerald:"ring-emerald-500/30", violet:"ring-violet-500/30" }[accentColor] || "ring-sky-500/30";
  const badgeBg   = { sky:"bg-sky-500/15 text-sky-400", emerald:"bg-emerald-500/15 text-emerald-400", violet:"bg-violet-500/15 text-violet-400" }[accentColor] || "bg-sky-500/15 text-sky-400";

  return (
    <div className={`bg-slate-900 border border-white/[0.07] rounded-xl overflow-hidden ${open ? `ring-1 ${ringColor}` : ""}`}>
      {/* Group header — click to expand */}
      <button
        onClick={() => setOpen(p => !p)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-800/40 transition-all">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${badgeBg.split(" ")[0]}`}>
            {group.label.includes("Alumni") || group.label.includes("Class")
              ? <PiGraduationCap size={18} className={badgeBg.split(" ")[1]}/>
              : group.label.includes("Department")
              ? <PiChalkboardTeacher size={18} className={badgeBg.split(" ")[1]}/>
              : <PiUsersThree size={18} className={badgeBg.split(" ")[1]}/>
            }
          </div>
          <div>
            <p className="text-white font-semibold text-sm">{group.label}</p>
            <p className="text-slate-500 text-xs">{group.count} member{group.count !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Avatar stack preview */}
          <div className="hidden sm:flex -space-x-2">
            {group.members.slice(0, 4).map((m, i) => (
              <div key={i} className={`w-6 h-6 rounded-full border border-slate-900 flex items-center justify-center text-white text-[9px] font-bold ${ROLE_AVATAR[m.role] || ROLE_AVATAR.Student}`}>
                {(m.name || "?").charAt(0)}
              </div>
            ))}
            {group.count > 4 && (
              <div className="w-6 h-6 rounded-full border border-slate-900 bg-slate-700 flex items-center justify-center text-slate-400 text-[8px] font-bold">
                +{group.count - 4}
              </div>
            )}
          </div>
          {open ? <PiCaretUp size={16} className="text-slate-400"/> : <PiCaretDown size={16} className="text-slate-400"/>}
        </div>
      </button>

      {/* Expanded content */}
      {open && (
        <div className="px-5 pb-5 space-y-3">
          {/* Search within group */}
          {group.members.length > 4 && (
            <div className="relative">
              <PiMagnifyingGlass size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder={`Search in ${group.label}…`}
                className="w-full pl-8 pr-4 py-2 rounded-lg bg-slate-800 border border-white/[0.07] text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"/>
            </div>
          )}
          {filtered.length === 0
            ? <p className="text-slate-600 text-sm text-center py-4">No members match your search.</p>
            : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filtered.map(m => <PersonCard key={m._id} person={m}/>)}
              </div>
            )
          }
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function SharedBatchmates({ role, accentColor = "sky" }) {
  const [sections, setSections]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [globalSearch, setGSearch] = useState("");

  useEffect(() => {
    axios.get(API, { withCredentials: true })
      .then(res => setSections(res.data.sections || []))
      .catch(() => toast.error("Failed to load batchmates."))
      .finally(() => setLoading(false));
  }, []);

  // Global search flattens all members
  const allMembers = sections.flatMap(s => s.groups.flatMap(g => g.members));
  const searchResults = globalSearch
    ? allMembers.filter(m =>
        (m.name || "").toLowerCase().includes(globalSearch.toLowerCase()) ||
        (m.department || "").toLowerCase().includes(globalSearch.toLowerCase()) ||
        (m.currentCompany || "").toLowerCase().includes(globalSearch.toLowerCase()) ||
        (m.skills || []).some(s => s.toLowerCase().includes(globalSearch.toLowerCase()))
      )
    : null;

  const totalCount = allMembers.length;

  const titleMap = {
    Student: { title: "Batchmates",          sub: "Your batch and alumni network grouped by year" },
    Alumni:  { title: "Alumni Network",      sub: "All alumni grouped by graduating class" },
    Teacher: { title: "Department Members",  sub: "Faculty and staff grouped by department" },
  };
  const { title, sub } = titleMap[role] || titleMap.Student;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <p className="text-slate-400 text-sm mt-0.5">{sub}</p>
        </div>
        {!loading && totalCount > 0 && (
          <span className="text-xs font-bold px-3 py-1.5 rounded-full border bg-slate-800 border-white/[0.07] text-slate-300 self-start sm:self-auto">
            {totalCount} member{totalCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Global search */}
      <div className="relative">
        <PiMagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
        <input value={globalSearch} onChange={e => setGSearch(e.target.value)}
          placeholder="Search across all groups…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900 border border-white/[0.07] text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"/>
      </div>

      {/* Content */}
      {loading ? (
        <div className="min-h-60 flex items-center justify-center">
          <PiCircleNotch size={28} className="text-slate-500 animate-spin"/>
        </div>
      ) : globalSearch && searchResults ? (
        // Search results grid
        <div className="space-y-3">
          <p className="text-slate-500 text-sm">{searchResults.length} result{searchResults.length !== 1 ? "s" : ""} for "{globalSearch}"</p>
          {searchResults.length === 0
            ? <div className="min-h-40 flex items-center justify-center text-slate-500 text-sm">No matches found.</div>
            : <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{searchResults.map(m => <PersonCard key={m._id} person={m}/>)}</div>
          }
        </div>
      ) : sections.length === 0 ? (
        <div className="min-h-60 flex flex-col items-center justify-center text-center bg-slate-900 border border-white/[0.07] rounded-xl">
          <PiUsersThree size={32} className="text-slate-600 mb-3"/>
          <p className="text-slate-300 font-semibold">No batchmates yet</p>
          <p className="text-slate-500 text-sm mt-1">Users will appear here once they join and verify their accounts.</p>
        </div>
      ) : (
        // Grouped sections
        sections.map(section => (
          <div key={section.title} className="space-y-2">
            {sections.length > 1 && (
              <h3 className="text-slate-400 text-xs font-bold tracking-widest uppercase px-1">{section.title}</h3>
            )}
            {section.groups.map((g, i) => (
              <BatchGroup key={g.key} group={g} accentColor={accentColor} defaultOpen={i === 0 && section.groups.length === 1}/>
            ))}
          </div>
        ))
      )}
    </div>
  );
}
