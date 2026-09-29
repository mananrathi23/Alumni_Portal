// SharedPeopleDirectory.jsx — searchable directory of students, alumni and
// teachers, with connect buttons and a profile popup.
// Usage: <SharedPeopleDirectory title="People Directory" accentColor="sky" />
import { useState, useEffect, useCallback } from "react";
import { FaLinkedin, FaGithub, FaGlobe } from "react-icons/fa";
import {
  PiUsersThree, PiBriefcase, PiMagnifyingGlass, PiX,
  PiGraduationCap, PiMapPin, PiBuildings, PiStudent,
} from "react-icons/pi";
import axios from "axios";
import { API } from "../utils/api";
import ConnectButton from "./ConnectionButton.jsx";
import { safeUrl } from "../utils/safeUrl";
import { DEPARTMENTS } from "../utils/departments";

const PAGE_SIZE = 20; // per role, per page

const THEMES = {
  sky:     { ring: "focus:ring-sky-500",     toggle: "bg-sky-500",     spinner: "border-sky-500",
             cardHover: "hover:border-sky-500/30 hover:shadow-sky-500/5",         nameHover: "group-hover:text-sky-400" },
  emerald: { ring: "focus:ring-emerald-500", toggle: "bg-emerald-500", spinner: "border-emerald-500",
             cardHover: "hover:border-emerald-500/30 hover:shadow-emerald-500/5", nameHover: "group-hover:text-emerald-400" },
  violet:  { ring: "focus:ring-violet-500",  toggle: "bg-violet-500",  spinner: "border-violet-500",
             cardHover: "hover:border-violet-500/30 hover:shadow-violet-500/5",   nameHover: "group-hover:text-violet-400" },
};

// The whole row (switch + text) toggles; it's a real switch for keyboards and screen readers
const Toggle = ({ on, onChange, label, theme }) => (
  <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)}
    className="flex items-center gap-2.5 cursor-pointer w-fit">
    <span className={`w-9 h-5 rounded-full transition-colors duration-200 flex-shrink-0 relative ${on ? theme.toggle : "bg-slate-700"}`}>
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${on ? "translate-x-4" : "translate-x-0"}`} />
    </span>
    <span className="text-slate-300 text-sm">{label}</span>
  </button>
);

// My connections come from /connections (not paged); apply the page's filters locally
const connectionsAsPeople = (connections, { search, filterRole, department, mentorOnly }) => {
  const q = search.trim().toLowerCase();
  return connections
    .map((c) => ({ ...c.connectedWith, _id: c.connectedWith.id || c.connectedWith._id }))
    .filter((p) => !q || p.name?.toLowerCase().includes(q) || p.department?.toLowerCase().includes(q))
    .filter((p) => filterRole === "All" || p.role === filterRole)
    .filter((p) => department === "All" || p.department === department)
    .filter((p) => !mentorOnly || p.availableForMentorship === true);
};

export default function SharedPeopleDirectory({ title = "People Directory", accentColor = "sky" }) {
  const theme = THEMES[accentColor] || THEMES.sky;
  const [people, setPeople]         = useState([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [hasMore, setHasMore]       = useState(false);
  const [loading, setLoading]       = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch]         = useState("");
  const [filterRole, setFilterRole] = useState("All");
  const [department, setDepartment] = useState("All");
  const [mentorOnly, setMentorOnly] = useState(false);
  const [myConnectionsOnly, setMyConnectionsOnly] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);

  const fetchPage = useCallback((pageToLoad) => {
    const filters = { search, filterRole, department, mentorOnly };
    if (myConnectionsOnly) {
      return axios.get(`${API}/connections`, { withCredentials: true }).then((res) => {
        const list = connectionsAsPeople(res.data.connections || [], filters);
        return { list, total: list.length, hasMore: false };
      });
    }
    const params = { page: pageToLoad, limit: PAGE_SIZE };
    if (search.trim())        params.search     = search.trim();
    if (filterRole !== "All") params.filterRole = filterRole;
    if (department !== "All") params.department = department;
    if (mentorOnly)           params.mentorOnly = "true";
    return axios.get(`${API}/people`, { params, withCredentials: true })
      .then((res) => ({ list: res.data.people || [], total: res.data.total || 0, hasMore: !!res.data.hasMore }));
  }, [search, filterRole, department, mentorOnly, myConnectionsOnly]);

  useEffect(() => {
    let cancelled = false;
    // Debounced so typing in the search box doesn't send a request per keystroke
    const t = setTimeout(() => {
      setLoading(true);
      fetchPage(1)
        .then(({ list, total: count, hasMore: more }) => {
          if (cancelled) return; // a newer search already replaced this one
          setPeople(list);
          setTotal(count);
          setHasMore(more);
          setPage(1);
        })
        .catch(() => { if (!cancelled) setPeople([]); })
        .finally(() => { if (!cancelled) setLoading(false); });
    }, 300);
    return () => { cancelled = true; clearTimeout(t); };
  }, [fetchPage]);

  const loadMore = () => {
    setLoadingMore(true);
    fetchPage(page + 1)
      .then(({ list, hasMore: more }) => {
        setPeople((prev) => {
          const ids = new Set(prev.map((p) => p._id));
          return [...prev, ...list.filter((p) => !ids.has(p._id))];
        });
        setHasMore(more);
        setPage((p) => p + 1);
      })
      .catch(() => { /* keep what is shown */ })
      .finally(() => setLoadingMore(false));
  };

  const selectClass = `px-3 py-2 rounded-lg bg-slate-800 border border-white/[0.07] text-slate-300 text-sm focus:outline-none focus:ring-2 ${theme.ring}`;

  return (
    <div className="max-w-5xl mx-auto space-y-5">

      {/* Page header */}
      <div>
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <p className="text-slate-400 text-sm mt-0.5">
          {loading ? "Loading…" : `Showing ${people.length} of ${total} people`}
        </p>
      </div>

      {/* Filter card */}
      <div className="bg-slate-900 border border-white/[0.07] rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <PiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Search by name or department…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full pl-9 pr-4 py-2 rounded-lg bg-slate-800 border border-white/[0.07] text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 ${theme.ring}`}
            />
          </div>
          <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className={selectClass}>
            <option value="All">All Roles</option>
            <option value="Student">Students</option>
            <option value="Alumni">Alumni</option>
            <option value="Teacher">Teachers</option>
          </select>
          <select value={department} onChange={(e) => setDepartment(e.target.value)} className={selectClass}>
            <option value="All">All Departments</option>
            {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <Toggle on={mentorOnly} onChange={setMentorOnly} label="Available for mentorship only" theme={theme} />
          <Toggle on={myConnectionsOnly} onChange={setMyConnectionsOnly} label="My Connections Only" theme={theme} />
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="min-h-64 flex items-center justify-center">
          <div className={`w-8 h-8 rounded-full border-2 border-t-transparent animate-spin ${theme.spinner}`} />
        </div>
      ) : people.length === 0 ? (
        <div className="min-h-64 flex flex-col items-center justify-center text-center bg-slate-900 border border-white/[0.07] rounded-xl">
          <PiUsersThree size={40} className="text-slate-700 mb-3" />
          <p className="text-slate-400 font-medium">No people found</p>
          <p className="text-slate-600 text-sm mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {people.map((person) => (
              <PersonCard key={person._id} person={person} onViewProfile={setSelectedPerson} theme={theme} />
            ))}
          </div>
          {hasMore && (
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="w-full py-2.5 rounded-lg text-sm text-slate-400 hover:text-white border border-white/[0.06] bg-slate-900 hover:bg-slate-800 transition-all disabled:opacity-60"
            >
              {loadingMore ? "Loading…" : "Load more people"}
            </button>
          )}
        </>
      )}

      {/* Profile detail modal */}
      {selectedPerson && (
        <ProfileModal person={selectedPerson} onClose={() => setSelectedPerson(null)} />
      )}
    </div>
  );
}

const roleStyle = {
  Student: { badge: "bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/30",    grad: "from-sky-400 to-sky-600"     },
  Alumni:  { badge: "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30", grad: "from-emerald-400 to-teal-600" },
  Teacher: { badge: "bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/30",  grad: "from-violet-400 to-violet-600" },
};

const PersonCard = ({ person, onViewProfile, theme }) => {
  const style = roleStyle[person.role] ?? roleStyle.Student;

  return (
    <div className={`bg-slate-900 border border-white/[0.07] rounded-xl p-4 space-y-3 transition-all duration-200 hover:shadow-lg ${theme.cardHover}`}>
      {/* Clickable top row → opens profile modal */}
      <button onClick={() => onViewProfile(person)} className="flex items-start gap-3 w-full text-left group">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-base flex-shrink-0 shadow group-hover:scale-105 transition-transform overflow-hidden ${!person.profilePhoto?.url ? `bg-gradient-to-br ${style.grad}` : 'bg-slate-800'}`}>
          {person.profilePhoto?.url ? (
            <img src={person.profilePhoto.url} alt={person.name} className="w-full h-full object-cover" />
          ) : (
            person.name?.charAt(0).toUpperCase()
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-white font-semibold text-sm truncate transition-colors ${theme.nameHover}`}>{person.name}</p>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${style.badge}`}>
            {person.role}
          </span>
        </div>
      </button>

      {/* Details */}
      <div className="text-xs text-slate-500 space-y-1">
        {person.role === "Alumni" && (
          <>
            {person.currentDesignation && person.currentCompany && (
              <p className="flex items-center gap-1.5">
                <PiBriefcase className="text-slate-600 flex-shrink-0" />
                <span className="truncate">{person.currentDesignation} at {person.currentCompany}</span>
              </p>
            )}
            {person.graduationYear && <p className="text-slate-600">🎓 Class of {person.graduationYear}</p>}
            {person.availableForMentorship && (
              <p className="text-emerald-400 font-semibold">✓ Available for mentorship</p>
            )}
          </>
        )}
        {person.role === "Teacher" && person.designation && (
          <p className="flex items-center gap-1.5">
            <PiBriefcase className="text-slate-600 flex-shrink-0" />{person.designation}
          </p>
        )}
        {person.role === "Student" && person.year && <p className="text-slate-500">🎓 {person.year}</p>}
        {person.department && <p className="text-slate-500">📚 {person.department}</p>}
      </div>

      {/* Skills */}
      {person.skills?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {person.skills.slice(0, 3).map((skill, i) => (
            <span key={i} className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-white/[0.06]">
              {skill}
            </span>
          ))}
          {person.skills.length > 3 && (
            <span className="text-xs text-slate-600">+{person.skills.length - 3}</span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-white/[0.06]">
        <div className="flex gap-3">
          {person.linkedIn && (
            <a href={safeUrl(person.linkedIn)} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-sky-400 transition-colors">
              <FaLinkedin size={14} />
            </a>
          )}
          {person.github && (
            <a href={safeUrl(person.github)} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-slate-200 transition-colors">
              <FaGithub size={14} />
            </a>
          )}
          {person.portfolio && (
            <a href={safeUrl(person.portfolio)} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-emerald-400 transition-colors" title="Portfolio">
              <FaGlobe size={14} />
            </a>
          )}
        </div>
        <ConnectButton targetId={person._id} targetRole={person.role} targetName={person.name} />
      </div>
    </div>
  );
};

// ── Profile detail modal ────────────────────────────────────────────────────
const ProfileModal = ({ person, onClose }) => {
  const s = roleStyle[person.role] ?? roleStyle.Student;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-slate-900 border border-white/[0.07] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-1.5 rounded-lg transition-all"
          >
            <PiX size={16} />
          </button>

          {/* Avatar + Name */}
          <div className="flex items-center gap-4 mb-5">
            {person.profilePhoto?.url ? (
              <img src={person.profilePhoto.url} alt={person.name}
                className="w-16 h-16 rounded-2xl object-cover shadow-lg border-2 border-white/10" />
            ) : (
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${s.grad} flex items-center justify-center text-white font-bold text-2xl shadow-lg`}>
                {person.name?.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h3 className="text-white font-bold text-lg leading-tight">{person.name}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.badge}`}>{person.role}</span>
              {person.department && (
                <p className="text-slate-400 text-xs mt-1">📚 {person.department}</p>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="space-y-3">
            {person.role === "Alumni" && (
              <>
                {(person.currentDesignation || person.currentCompany) && (
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <PiBuildings size={16} className="text-emerald-400 flex-shrink-0" />
                    <span>{[person.currentDesignation, person.currentCompany].filter(Boolean).join(" at ")}</span>
                  </div>
                )}
                {person.graduationYear && (
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <PiGraduationCap size={16} className="text-emerald-400 flex-shrink-0" />
                    <span>Class of {person.graduationYear}</span>
                  </div>
                )}
                {person.industry && (
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <PiBriefcase size={16} className="text-emerald-400 flex-shrink-0" />
                    <span>{person.industry}</span>
                  </div>
                )}
                {person.availableForMentorship && (
                  <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-1.5">
                    ✓ Available for mentorship
                  </div>
                )}
              </>
            )}

            {person.role === "Student" && person.year && (
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <PiStudent size={16} className="text-sky-400 flex-shrink-0" />
                <span>{person.year}</span>
              </div>
            )}

            {person.role === "Teacher" && (
              <>
                {person.designation && (
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <PiBriefcase size={16} className="text-violet-400 flex-shrink-0" />
                    <span>{person.designation}</span>
                  </div>
                )}
                {person.experience && (
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <PiMapPin size={16} className="text-violet-400 flex-shrink-0" />
                    <span>{person.experience} years experience</span>
                  </div>
                )}
              </>
            )}

            {/* Bio */}
            {person.bio && (
              <p className="text-slate-400 text-sm bg-slate-800/60 border border-white/[0.05] rounded-lg px-3 py-2 leading-relaxed">
                {person.bio}
              </p>
            )}

            {/* Skills */}
            {person.skills?.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-2">Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {person.skills.map((sk, i) => (
                    <span key={i} className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full border border-white/[0.06]">{sk}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Social + Connect */}
            <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
              <div className="flex gap-3">
                {person.linkedIn && (
                  <a href={safeUrl(person.linkedIn)} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 transition-colors">
                    <FaLinkedin size={14} /> LinkedIn
                  </a>
                )}
                {person.github && (
                  <a href={safeUrl(person.github)} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
                    <FaGithub size={14} /> GitHub
                  </a>
                )}
                {person.portfolio && (
                  <a href={safeUrl(person.portfolio)} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
                    <FaGlobe size={14} /> Portfolio
                  </a>
                )}
              </div>
              <ConnectButton targetId={person._id} targetRole={person.role} targetName={person.name} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
