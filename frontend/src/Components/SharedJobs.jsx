// SharedJobs.jsx — Jobs/Internship board for all roles
// canPost = true for Alumni, Teacher, Admin

import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Context } from "../main";
import {
  PiBriefcase, PiPlus, PiX, PiMagnifyingGlass, PiCircleNotch,
  PiLink, PiBuildings, PiListChecks, PiPencilSimple, PiTrash,
  PiCalendarBlank, PiUser,
} from "react-icons/pi";

import RestrictedAccess from "./RestrictedAccess";

const API = "http://localhost:4000/api/v1/jobs";
const POSTER_ROLES = ["Admin", "Alumni", "Teacher"];
const JOB_TYPES = ["full-time","part-time","internship","contract","remote"];
const TYPE_COLORS = {
  "full-time":   "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  "part-time":   "bg-sky-500/15 text-sky-400 border-sky-500/25",
  "internship":  "bg-amber-500/15 text-amber-400 border-amber-500/25",
  "contract":    "bg-violet-500/15 text-violet-400 border-violet-500/25",
  "remote":      "bg-teal-500/15 text-teal-400 border-teal-500/25",
};

function formatDeadline(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  const diff = Math.ceil((d - Date.now()) / 86400000);
  if (diff < 0) return { text: "Deadline passed", urgent: false, expired: true };
  if (diff === 0) return { text: "Deadline: Today", urgent: true, expired: false };
  if (diff <= 3)  return { text: `${diff}d left`, urgent: true, expired: false };
  return { text: `Deadline: ${d.toLocaleDateString("en-IN", { day:"numeric", month:"short" })}`, urgent: false, expired: false };
}

// ── Job Form Modal ────────────────────────────────────────────────────────────
function JobModal({ existing, onClose, onSaved, accentColor }) {
  const isEdit = !!existing;
  const [form, setForm] = useState({
    company:     existing?.company     || "",
    role:        existing?.role        || "",
    description: existing?.description || "",
    eligibility: existing?.eligibility || "",
    link:        existing?.link        || "",
    type:        existing?.type        || "full-time",
    skills:      existing?.skills?.join(", ") || "",
    deadline:    existing?.deadline ? existing.deadline.slice(0,10) : "",
  });
  const [saving, setSaving] = useState(false);
  const set = (k,v) => setForm(p => ({ ...p, [k]: v }));
  const btnClass = { sky:"bg-sky-500 hover:bg-sky-400", emerald:"bg-emerald-500 hover:bg-emerald-400", violet:"bg-violet-500 hover:bg-violet-400" }[accentColor] || "bg-sky-500";
  const inp = "w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-white/[0.07] text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500";
  const lbl = "block text-xs font-semibold text-slate-400 tracking-widest uppercase mb-1.5";

  const save = async () => {
    if (!form.company.trim()) { toast.error("Company name is required."); return; }
    if (!form.role.trim())    { toast.error("Role/position is required."); return; }
    if (!form.description.trim()) { toast.error("Description is required."); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        skills: form.skills ? form.skills.split(",").map(s => s.trim()).filter(Boolean) : [],
        deadline: form.deadline || null,
      };
      if (isEdit) {
        await axios.put(`${API}/${existing._id}`, payload, { withCredentials: true });
      } else {
        await axios.post(API, payload, { withCredentials: true });
      }
      toast.success(isEdit ? "Job updated!" : "Job posted!");
      onSaved();
      onClose();
    } catch(e) { toast.error(e.response?.data?.message || "Failed."); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-white/[0.07] rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
          <div><h2 className="text-white font-bold">{isEdit ? "Edit Job" : "Post a Job"}</h2><p className="text-slate-500 text-xs mt-0.5">Share an opportunity with students</p></div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800"><PiX size={18}/></button>
        </div>
        <div className="px-5 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className={lbl}>Company *</label><input value={form.company} onChange={e => set("company",e.target.value)} placeholder="Company name" className={inp}/></div>
            <div><label className={lbl}>Role *</label><input value={form.role} onChange={e => set("role",e.target.value)} placeholder="SDE, PM, Analyst…" className={inp}/></div>
          </div>
          <div><label className={lbl}>Type</label>
            <select value={form.type} onChange={e => set("type",e.target.value)} className={inp}>
              {JOB_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
            </select>
          </div>
          <div><label className={lbl}>Description *</label><textarea value={form.description} onChange={e => set("description",e.target.value)} rows={4} placeholder="Responsibilities, culture, role details…" className={`${inp} resize-none`}/></div>
          <div><label className={lbl}>Eligibility</label><textarea value={form.eligibility} onChange={e => set("eligibility",e.target.value)} rows={2} placeholder="CGPA, branch, batch requirements…" className={`${inp} resize-none`}/></div>
          <div><label className={lbl}>Required Skills <span className="text-slate-600 normal-case font-normal">(comma-separated)</span></label><input value={form.skills} onChange={e => set("skills",e.target.value)} placeholder="React, Node.js, Python" className={inp}/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={lbl}>Apply Link</label><input value={form.link} onChange={e => set("link",e.target.value)} placeholder="https://…" className={inp}/></div>
            <div><label className={lbl}>Application Deadline</label><input type="date" value={form.deadline} min={new Date(Date.now()+86400000).toISOString().slice(0,10)} onChange={e => set("deadline",e.target.value)} className={inp}/><p className="text-slate-600 text-[10px] mt-1">Must be a future date</p></div>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-5 pb-5">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-800 border border-white/[0.07] text-slate-300 text-sm font-medium hover:bg-slate-700 transition-all">Cancel</button>
          <button onClick={save} disabled={saving} className={`px-5 py-2 rounded-lg text-white text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-50 ${btnClass}`}>
            {saving && <PiCircleNotch size={14} className="animate-spin"/>}
            {isEdit ? "Save Changes" : "Post Job"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Job Card ──────────────────────────────────────────────────────────────────
function JobCard({ job, currentUser, onEdit, onDelete }) {
  const isPoster    = job.postedBy?.id === currentUser?._id?.toString() || job.postedBy?.id?.toString() === currentUser?._id?.toString();
  const deadline    = formatDeadline(job.deadline);
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-slate-900 border border-white/[0.07] rounded-xl p-4 sm:p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${TYPE_COLORS[job.type]||TYPE_COLORS["full-time"]}`}>
              {job.type.charAt(0).toUpperCase()+job.type.slice(1)}
            </span>
            {deadline && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                deadline.expired ? "bg-slate-700 text-slate-500 border-slate-600"
                  : deadline.urgent ? "bg-red-500/15 text-red-400 border-red-500/25"
                  : "bg-slate-700 text-slate-400 border-slate-600"
              }`}>{deadline.text}</span>
            )}
          </div>
          <h3 className="text-white font-semibold text-base">{job.role}</h3>
          <div className="flex items-center gap-2 mt-1">
            <PiBuildings size={13} className="text-slate-500"/>
            <span className="text-slate-300 text-sm font-medium">{job.company}</span>
          </div>
        </div>
        {isPoster && (
          <div className="flex gap-1 flex-shrink-0">
            <button onClick={onEdit} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-all"><PiPencilSimple size={14}/></button>
            <button onClick={onDelete} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"><PiTrash size={14}/></button>
          </div>
        )}
      </div>

      <p className={`text-slate-400 text-sm leading-relaxed ${!expanded ? "line-clamp-2" : ""}`}>{job.description}</p>

      {job.description?.length > 120 && (
        <button onClick={() => setExpanded(p => !p)} className="text-sky-400 text-xs font-semibold hover:underline">
          {expanded ? "Show less" : "Read more"}
        </button>
      )}

      {job.eligibility && (
        <div className="flex items-start gap-2 bg-slate-800/60 border border-white/[0.04] rounded-lg px-3 py-2">
          <PiListChecks size={14} className="text-slate-500 mt-0.5 flex-shrink-0"/>
          <p className="text-slate-400 text-xs leading-relaxed">{job.eligibility}</p>
        </div>
      )}

      {job.skills?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {job.skills.map(s => <span key={s} className="px-2 py-0.5 rounded-md bg-slate-800 border border-white/[0.05] text-slate-400 text-xs font-medium">{s}</span>)}
        </div>
      )}

      <div className="flex items-center justify-between pt-1 border-t border-white/[0.05]">
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1"><PiUser size={12}/>{job.postedBy?.name} · {job.postedBy?.role}</div>
          <div className="flex items-center gap-1"><PiCalendarBlank size={12}/>{new Date(job.createdAt).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</div>
        </div>
        {job.link && (
          <a href={job.link} target="_blank" rel="noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-bold hover:bg-sky-500/20 transition-all">
            <PiLink size={13}/> Apply Now
          </a>
        )}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function SharedJobs({ role, accentColor = "sky" }) {
  const { user }             = useContext(Context);
  const canPost              = POSTER_ROLES.includes(role);
  const [jobs, setJobs]      = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]  = useState("");
  const [typeFilter, setType] = useState("all");
  const [showMine, setMine]  = useState(false);
  const [showModal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const btnClass = { sky:"bg-sky-500 hover:bg-sky-400 shadow-sky-500/30", emerald:"bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/30", violet:"bg-violet-500 hover:bg-violet-400 shadow-violet-500/30" }[accentColor] || "bg-sky-500 hover:bg-sky-400";

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API, {
        params: { search: search || undefined, type: typeFilter !== "all" ? typeFilter : undefined, mine: showMine ? "true" : undefined },
        withCredentials: true,
      });
      setJobs(res.data.jobs || []);
    } catch { toast.error("Failed to load jobs."); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchJobs(); }, [search, typeFilter, showMine]);

  if (user && user.role !== "Admin" && !user.adminVerified) {
    return <RestrictedAccess />;
  }

  const deleteJob = async (id) => {
    try {
      await axios.delete(`${API}/${id}`, { withCredentials: true });
      setJobs(p => p.filter(j => j._id !== id));
      toast.success("Job removed.");
    } catch(e) { toast.error(e.response?.data?.message || "Failed."); }
  };

  const TYPE_FILTERS = ["all", ...JOB_TYPES];
  const filterBtnActive = { sky:"bg-sky-500 text-white", emerald:"bg-emerald-500 text-white", violet:"bg-violet-500 text-white" }[accentColor] || "bg-sky-500 text-white";

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Job & Internship Board</h2>
          <p className="text-slate-400 text-sm mt-0.5">{jobs.length} opportunit{jobs.length !== 1 ? "ies" : "y"} available</p>
        </div>
        <div className="flex items-center gap-2">
          {canPost && (
            <>
              <button onClick={() => setMine(p => !p)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${showMine ? `${filterBtnActive} border-transparent` : "bg-slate-800 text-slate-400 border-white/[0.07] hover:text-white"}`}>
                My Posts
              </button>
              <button onClick={() => setModal(true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold transition-all shadow ${btnClass}`}>
                <PiPlus size={15}/> Post Job
              </button>
            </>
          )}
        </div>
      </div>

      {/* Search + filters */}
      <div className="bg-slate-900 border border-white/[0.07] rounded-xl p-4 space-y-3">
        <div className="relative">
          <PiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={15}/>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by role, company, or skill…"
            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-slate-800 border border-white/[0.07] text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"/>
        </div>
        <div className="flex flex-wrap gap-2">
          {TYPE_FILTERS.map(t => (
            <button key={t} onClick={() => setType(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                typeFilter === t
                  ? (t === "all" ? "bg-slate-600 text-white border-slate-500" : `${TYPE_COLORS[t]} shadow`)
                  : "bg-slate-800 text-slate-500 border-slate-700 hover:text-slate-300"
              }`}>
              {t === "all" ? "All" : t.charAt(0).toUpperCase()+t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Job cards */}
      {loading ? (
        <div className="min-h-48 flex items-center justify-center"><PiCircleNotch size={28} className="text-slate-500 animate-spin"/></div>
      ) : jobs.length === 0 ? (
        <div className="min-h-64 flex flex-col items-center justify-center text-center bg-slate-900 border border-white/[0.07] rounded-xl">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center mb-4"><PiBriefcase size={28} className="text-slate-600"/></div>
          <p className="text-slate-300 font-semibold">No jobs found</p>
          <p className="text-slate-500 text-sm mt-1">{canPost ? "Post an opportunity for students!" : "Check back for new postings."}</p>
          {canPost && <button onClick={() => setModal(true)} className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400 text-sm font-semibold hover:bg-sky-500/20 transition-all"><PiPlus size={14}/> Post Job</button>}
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map(j => (
            <JobCard key={j._id} job={j} currentUser={user}
              onEdit={() => setEditing(j)}
              onDelete={() => deleteJob(j._id)}
            />
          ))}
        </div>
      )}

      {(showModal || editing) && (
        <JobModal
          existing={editing}
          accentColor={accentColor}
          onClose={() => { setModal(false); setEditing(null); }}
          onSaved={() => { setModal(false); setEditing(null); fetchJobs(); }}
        />
      )}
    </div>
  );
}
