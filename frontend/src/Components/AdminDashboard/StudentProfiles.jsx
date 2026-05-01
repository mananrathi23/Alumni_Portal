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
  const [department, setDepartment] = useState("All");
  const [year, setYear] = useState("All");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    setLoading(true);
    axios
      .get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/admin/users`, { withCredentials: true })
      .then((res) => {
        // Filter: only admin-verified, non-blocked students
        const allStudents = (res.data.users || []).filter(
          (u) => u.role === "Student" && u.adminVerified === true && !u.isBlocked
        );
        setStudents(allStudents);
      })
      .catch(() => toast.error("Failed to load student profiles."))
      .finally(() => setLoading(false));
  }, []); // load once on mount — search/filters are client-side

  const classOptions = Array.from(
    new Set(
      (students || [])
        .map((s) => s.enrollmentYear)
        .filter((y) => typeof y === "number" && !Number.isNaN(y))
    )
  ).sort((a, b) => b - a);

  const deptOptions = Array.from(
    new Set(
      (students || [])
        .map((s) => s.department)
        .filter(Boolean)
    )
  ).sort();

  const yearOptions = Array.from(
    new Set(
      (students || [])
        .map((s) => s.year)
        .filter(Boolean)
    )
  ).sort();

  const filtered = students.filter((s) => {
    if (search) {
      const q = search.toLowerCase();
      const matchName = s.name?.toLowerCase().includes(q);
      const matchDept = s.department?.toLowerCase().includes(q);
      if (!matchName && !matchDept) return false;
    }
    if (classOf !== "All" && String(s.enrollmentYear) !== String(classOf)) return false;
    if (department !== "All" && s.department !== department) return false;
    if (year !== "All" && s.year !== year) return false;
    return true;
  });

  const activeFilters = [classOf, department, year].filter(v => v !== "All").length;
  const clearFilters = () => { setClassOf("All"); setDepartment("All"); setYear("All"); setSearch(""); };

  const selectCls = `px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 ${
    theme === "dark"
      ? "bg-slate-800 border-white/[0.07] text-slate-200"
      : "bg-slate-50 border-slate-200 text-slate-900"
  }`;

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
            Student Profiles
          </h2>
          <p className={`${theme === "dark" ? "text-slate-400" : "text-slate-500"} text-sm mt-1`}>
            {loading ? "Loading…" : `${filtered.length} of ${students.length} students`}
          </p>
        </div>
        {(activeFilters > 0 || search) && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 border border-rose-500/30 hover:border-rose-500/60 px-3 py-1.5 rounded-lg transition-all"
          >
            <PiX size={12} /> Clear filters {activeFilters > 0 && `(${activeFilters})`}
          </button>
        )}
      </div>

      <div className={`rounded-xl border p-4 ${theme === "dark" ? "bg-slate-900 border-white/[0.07]" : "bg-white border-slate-200"}`}>
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <PiMagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search students by name or department…"
              className={`w-full pl-9 pr-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 ${theme === "dark"
                  ? "bg-slate-800 border-white/[0.07] text-slate-200 placeholder-slate-500"
                  : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"
                }`}
            />
          </div>
          {/* Department */}
          <select value={department} onChange={(e) => setDepartment(e.target.value)} className={selectCls}>
            <option value="All">All Departments</option>
            {deptOptions.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          {/* Study Year */}
          <select value={year} onChange={(e) => setYear(e.target.value)} className={selectCls}>
            <option value="All">All Years</option>
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          {/* Class of (enrollment year) */}
          <select
            value={classOf}
            onChange={(e) => setClassOf(e.target.value)}
            className={selectCls}
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
        <div className={`overflow-hidden rounded-xl border ${theme === "dark" ? "bg-slate-900 border-white/[0.07]" : "bg-white border-slate-200"}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b ${theme === "dark" ? "border-white/[0.06] bg-slate-800/50" : "border-slate-200 bg-slate-50"}`}>
                  <th className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>Student</th>
                  <th className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>Department & Year</th>
                  <th className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>Skills</th>
                  <th className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-right ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>Links</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/[0.06]">
                {filtered.map((s) => (
                  <tr
                    key={s._id}
                    onClick={() => setSelected(s)}
                    className={`group cursor-pointer transition-colors ${theme === "dark" ? "hover:bg-slate-800/50" : "hover:bg-slate-50"}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {s.name?.charAt(0)?.toUpperCase() || "S"}
                        </div>
                        <div>
                          <p className={`font-medium text-sm ${theme === "dark" ? "text-white" : "text-slate-900"}`}>{s.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className={`text-sm ${theme === "dark" ? "text-slate-300" : "text-slate-600"}`}>
                        {s.department || "—"}
                      </p>
                      <p className={`text-xs ${theme === "dark" ? "text-slate-500" : "text-slate-400"}`}>
                        {s.year ? `${s.year}` : ""}{s.enrollmentYear ? ` · Class of ${s.enrollmentYear}` : ""}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {s.skills?.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {s.skills.slice(0, 3).map((sk) => (
                            <span key={sk} className="text-[10px] uppercase tracking-wider bg-slate-800/60 text-slate-300 px-1.5 py-0.5 rounded border border-white/[0.06]">
                              {sk}
                            </span>
                          ))}
                          {s.skills.length > 3 && <span className="text-xs text-slate-500">+{s.skills.length - 3}</span>}
                        </div>
                      ) : (
                        <span className={`text-xs ${theme === "dark" ? "text-slate-600" : "text-slate-400"}`}>—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {s.linkedIn && <FaLinkedin className={`text-slate-400 group-hover:text-sky-500 transition-colors`} size={16} />}
                        {s.github && <FaGithub className={`text-slate-400 group-hover:text-slate-200 transition-colors`} size={16} />}
                        {s.portfolio && <FaGlobe className={`text-slate-400 group-hover:text-emerald-500 transition-colors`} size={16} />}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

