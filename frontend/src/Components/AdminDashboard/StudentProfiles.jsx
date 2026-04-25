import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Context } from "../../main";
import { FaLinkedin, FaGithub, FaGlobe } from "react-icons/fa";
import {
  PiUsersThree,
  PiMagnifyingGlass,
  PiX,
  PiStudent,
  PiBriefcase,
} from "react-icons/pi";

export default function StudentProfiles() {
  const { theme } = useContext(Context);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [classOf, setClassOf] = useState("All");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const params = { filterRole: "Student" };
    if (search) params.search = search;
    setLoading(true);
    axios
      .get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/people`, { params, withCredentials: true })
      .then((res) => setStudents(res.data.people || []))
      .catch(() => toast.error("Failed to load student profiles."))
      .finally(() => setLoading(false));
  }, [search]);

  const classOptions = Array.from(
    new Set(
      (students || [])
        .map((s) => s.enrollmentYear)
        .filter((y) => typeof y === "number" && !Number.isNaN(y))
    )
  ).sort((a, b) => b - a);

  const filtered = classOf === "All"
    ? students
    : students.filter((s) => String(s.enrollmentYear) === String(classOf));

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
            Student Profiles
          </h2>
          <p className={`${theme === "dark" ? "text-slate-400" : "text-slate-500"} text-sm mt-1`}>
            {loading ? "Loading…" : `${students.length} students found`}
          </p>
        </div>
      </div>

      <div className={`rounded-xl border p-4 ${theme === "dark" ? "bg-slate-900 border-white/[0.07]" : "bg-white border-slate-200"}`}>
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <PiMagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search students by name or department…"
              className={`w-full pl-9 pr-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                theme === "dark"
                  ? "bg-slate-800 border-white/[0.07] text-slate-200 placeholder-slate-500"
                  : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"
              }`}
            />
          </div>
          <select
            value={classOf}
            onChange={(e) => setClassOf(e.target.value)}
            className={`px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 ${
              theme === "dark"
                ? "bg-slate-800 border-white/[0.07] text-slate-200"
                : "bg-slate-50 border-slate-200 text-slate-900"
            }`}
          >
            <option value="All">All Classes</option>
            {classOptions.map((y) => (
              <option key={y} value={String(y)}>Class of {y}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="min-h-64 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className={`min-h-64 flex flex-col items-center justify-center text-center rounded-xl border ${theme === "dark" ? "bg-slate-900 border-white/[0.07]" : "bg-white border-slate-200"}`}>
          <PiUsersThree size={40} className="text-slate-600 mb-3" />
          <p className={`${theme === "dark" ? "text-slate-300" : "text-slate-700"} font-medium`}>No students found</p>
          <p className="text-slate-500 text-sm mt-1">Try adjusting your search</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((s) => (
            <button
              key={s._id}
              onClick={() => setSelected(s)}
              className={`text-left rounded-xl border p-4 space-y-3 transition-all hover:shadow-lg ${
                theme === "dark"
                  ? "bg-slate-900 border-white/[0.07] hover:border-rose-500/30"
                  : "bg-white border-slate-200 hover:border-rose-400"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white font-bold text-base flex-shrink-0">
                  {s.name?.charAt(0)?.toUpperCase() || "S"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`${theme === "dark" ? "text-white" : "text-slate-900"} font-semibold text-sm truncate`}>
                    {s.name}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {s.department || "—"}{s.year ? ` · ${s.year}` : ""}{s.enrollmentYear ? ` · Class of ${s.enrollmentYear}` : ""}
                  </p>
                </div>
              </div>

              {s.skills?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {s.skills.slice(0, 4).map((sk) => (
                    <span key={sk} className="text-xs bg-slate-800/60 text-slate-300 px-2 py-0.5 rounded-full border border-white/[0.06]">
                      {sk}
                    </span>
                  ))}
                  {s.skills.length > 4 && <span className="text-xs text-slate-500">+{s.skills.length - 4}</span>}
                </div>
              )}

              <div className="flex items-center gap-3 pt-1 border-t border-white/[0.06]">
                {s.linkedIn && <FaLinkedin className="text-slate-500" size={14} />}
                {s.github && <FaGithub className="text-slate-500" size={14} />}
                {s.portfolio && <FaGlobe className="text-slate-500" size={14} />}
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div
            className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden ${theme === "dark" ? "bg-slate-900 border-white/[0.07]" : "bg-white border-slate-200"}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 relative">
              <button onClick={() => setSelected(null)} className="absolute top-4 right-4 p-2 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-all">
                <PiX size={16} />
              </button>

              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                  {selected.name?.charAt(0)?.toUpperCase() || "S"}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className={`${theme === "dark" ? "text-white" : "text-slate-900"} font-bold text-lg leading-tight`}>
                    {selected.name}
                  </h3>
                  <div className="text-sm text-slate-500 mt-1 space-y-0.5">
                    {selected.department && <p>📚 {selected.department}</p>}
                    {selected.year && <p className="flex items-center gap-1.5"><PiStudent size={14} className="text-slate-500" /> {selected.year}</p>}
                  </div>
                </div>
              </div>

              {selected.bio && (
                <p className="mt-4 text-sm text-slate-400 bg-slate-800/60 border border-white/[0.06] rounded-xl px-4 py-3 leading-relaxed">
                  {selected.bio}
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {selected.linkedIn && (
                  <a href={selected.linkedIn} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 hover:bg-sky-500/20 transition-all">
                    <FaLinkedin size={14} /> LinkedIn
                  </a>
                )}
                {selected.github && (
                  <a href={selected.github} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-lg bg-slate-700/40 border border-white/[0.07] text-slate-200 hover:bg-slate-700/60 transition-all">
                    <FaGithub size={14} /> GitHub
                  </a>
                )}
                {selected.portfolio && (
                  <a href={selected.portfolio} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all">
                    <FaGlobe size={14} /> Portfolio
                  </a>
                )}
              </div>

              {selected.skills?.length > 0 && (
                <div className="mt-5">
                  <div className="flex items-center gap-2 mb-2 text-xs font-bold tracking-widest uppercase text-slate-500">
                    <PiBriefcase size={14} /> Skills
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selected.skills.map((sk) => (
                      <span key={sk} className="text-xs bg-slate-800 text-slate-200 px-2.5 py-1 rounded-full border border-white/[0.06]">
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

