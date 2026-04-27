import { useState, useEffect } from "react";
import { FaLinkedin, FaGithub, FaGlobe } from "react-icons/fa";
import {
  PiUsersThree, PiBriefcase, PiMagnifyingGlass, PiX,
  PiGraduationCap, PiMapPin, PiBuildings, PiStudent,
} from "react-icons/pi";
import axios from "axios";
import ConnectButton from "../ConnectionButton.jsx";

const Students = () => {
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("All");
  const [department, setDepartment] = useState("All");
  const [selectedPerson, setSelectedPerson] = useState(null);

  useEffect(() => {
    const params = {};
    if (search) params.search = search;
    if (filterRole !== "All") params.filterRole = filterRole;
    if (department !== "All") params.department = department;
    setLoading(true);
    axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/people`, { params, withCredentials: true })
      .then((res) => setPeople(res.data.people))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, filterRole, department]);

  const sel = "px-3 py-2 rounded-lg bg-slate-800 border border-white/[0.07] text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500";

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div>
        <h2 className="text-xl font-bold text-white">Connections</h2>
        <p className="text-slate-400 text-sm mt-0.5">{loading ? "Loading…" : `${people.length} people found`}</p>
      </div>
      <div className="bg-slate-900 border border-white/[0.07] rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <PiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input type="text" placeholder="Search by name or department…" value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-800 border border-white/[0.07] text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className={sel}>
            <option value="All">All Roles</option>
            <option value="Student">Students</option>
            <option value="Alumni">Alumni</option>
            <option value="Teacher">Teachers</option>
          </select>
          <select value={department} onChange={(e) => setDepartment(e.target.value)} className={sel}>
            <option value="All">All Departments</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Information Technology">Information Technology</option>
            <option value="Electronics">Electronics</option>
            <option value="Mechanical">Mechanical</option>
            <option value="Civil">Civil</option>
          </select>
        </div>
      </div>
      {loading ? (
        <div className="min-h-64 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
        </div>
      ) : people.length === 0 ? (
        <div className="min-h-64 flex flex-col items-center justify-center bg-slate-900 border border-white/[0.07] rounded-xl">
          <PiUsersThree size={40} className="text-slate-700 mb-3" />
          <p className="text-slate-400 font-medium">No people found</p>
          <p className="text-slate-600 text-sm mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {people.map((p) => <PersonCard key={p._id} person={p} onViewProfile={setSelectedPerson} />)}
        </div>
      )}

      {/* Profile detail modal */}
      {selectedPerson && (
        <ProfileModal person={selectedPerson} onClose={() => setSelectedPerson(null)} />
      )}
    </div>
  );
};

const roleStyle = {
  Student: { badge:"bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/30",     grad:"from-sky-400 to-sky-600" },
  Alumni:  { badge:"bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30", grad:"from-emerald-400 to-teal-600" },
  Teacher: { badge:"bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/30", grad:"from-violet-400 to-violet-600" },
};

const PersonCard = ({ person, onViewProfile }) => {
  const s = roleStyle[person.role] ?? roleStyle.Student;
  return (
    <div className="bg-slate-900 border border-white/[0.07] rounded-xl p-4 space-y-3 hover:border-emerald-500/30 transition-all duration-200">
      {/* Clickable top section → opens profile modal */}
      <button
        onClick={() => onViewProfile(person)}
        className="flex items-start gap-3 w-full text-left group"
      >
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-base flex-shrink-0 shadow group-hover:scale-105 transition-transform overflow-hidden ${!person.profilePhoto?.url ? `bg-gradient-to-br ${s.grad}` : 'bg-slate-800'}`}>
          {person.profilePhoto?.url ? (
            <img src={person.profilePhoto.url} alt={person.name} className="w-full h-full object-cover" />
          ) : (
            person.name?.charAt(0).toUpperCase()
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-white font-semibold text-sm truncate group-hover:text-emerald-400 transition-colors">{person.name}</p>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.badge}`}>{person.role}</span>
        </div>
      </button>

      <div className="text-xs text-slate-500 space-y-1">
        {person.role === "Alumni" && person.currentDesignation && person.currentCompany && (
          <p className="flex items-center gap-1.5"><PiBriefcase className="text-slate-600 flex-shrink-0" /><span className="truncate">{person.currentDesignation} at {person.currentCompany}</span></p>
        )}
        {person.role === "Teacher" && person.designation && <p className="flex items-center gap-1.5"><PiBriefcase className="text-slate-600" />{person.designation}</p>}
        {person.role === "Student" && person.year && <p>🎓 {person.year}</p>}
        {person.department && <p>📚 {person.department}</p>}
      </div>
      {person.skills?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {person.skills.slice(0,3).map((sk,i) => <span key={i} className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-white/[0.06]">{sk}</span>)}
          {person.skills.length > 3 && <span className="text-xs text-slate-600">+{person.skills.length-3}</span>}
        </div>
      )}
      <div className="flex items-center justify-between pt-1 border-t border-white/[0.06]">
        <div className="flex gap-3">
          {person.linkedIn && <a href={person.linkedIn} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-sky-400 transition-colors"><FaLinkedin size={14} /></a>}
          {person.github && <a href={person.github} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-slate-200 transition-colors"><FaGithub size={14} /></a>}
          {person.portfolio && <a href={person.portfolio} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-emerald-400 transition-colors" title="Portfolio"><FaGlobe size={14} /></a>}
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
        {/* Header */}
        <div className={`h-20 bg-gradient-to-br ${s.grad} opacity-20 absolute w-full max-w-md rounded-t-2xl`} />
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
            {/* Role-specific info */}
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
              </>
            )}

            {person.role === "Student" && (
              <>
                {person.year && (
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <PiStudent size={16} className="text-sky-400 flex-shrink-0" />
                    <span>{person.year}</span>
                  </div>
                )}
              </>
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

            {/* Social links */}
            <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
              <div className="flex gap-3">
                {person.linkedIn && (
                  <a href={person.linkedIn} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 transition-colors">
                    <FaLinkedin size={14} /> LinkedIn
                  </a>
                )}
                {person.github && (
                  <a href={person.github} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
                    <FaGithub size={14} /> GitHub
                  </a>
                )}
                {person.portfolio && (
                  <a href={person.portfolio} target="_blank" rel="noreferrer"
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

export default Students;
