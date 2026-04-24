import React, { useState, useContext } from "react";
import { useOutletContext } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { Context } from "../../main";
import ProfilePhotoUpload from "../ProfilePhotoUpload.jsx";
import {
  PiPencilSimple, PiCheck, PiX, PiLinkedinLogo,
  PiGithubLogo, PiBriefcase, PiGraduationCap, PiStar, PiUser,
  PiEnvelope, PiMapPin, PiBuildings,
} from "react-icons/pi";

const DEPARTMENTS = ["Computer Science","Information Technology","Electronics","Mechanical","Civil","Other"];
const INDUSTRIES  = ["Technology","Finance","Healthcare","Education","Manufacturing","Consulting","Other"];

export const isAlumniProfileComplete = u =>
  !!(u?.department && u.department !== "Not Set" && u?.currentCompany && u?.bio && u?.graduationYear);

const inp = "w-full px-3 py-2.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all";
const lbl = "block text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-1.5";

const Field = ({ label, value, children }) => (
  <div>
    <p className={lbl}>{label}</p>
    {children || <p className="text-slate-700 text-sm">{value || <span className="text-slate-400">Not set</span>}</p>}
  </div>
);

const Profile = () => {
  const { alumni, setAlumni } = useOutletContext();
  const { setUser, theme } = useContext(Context);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [skillInput, setSkillInput] = useState("");

  const [form, setForm] = useState({
    department: alumni?.department || "",
    degree: alumni?.degree || "",
    enrollmentYear: alumni?.enrollmentYear || "",
    graduationYear: alumni?.graduationYear || "",
    currentCompany: alumni?.currentCompany || "",
    currentDesignation: alumni?.currentDesignation || "",
    currentLocation: alumni?.currentLocation || "",
    industry: alumni?.industry || "",
    bio: alumni?.bio || "",
    linkedIn: alumni?.linkedIn || "",
    github: alumni?.github || "",
    skills: alumni?.skills || [],
    availableForMentorship: alumni?.availableForMentorship || false,
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !form.skills.includes(s)) set("skills", [...form.skills, s]);
    setSkillInput("");
  };
  const removeSkill = s => set("skills", form.skills.filter(x => x !== s));

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await axios.put(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:4000"}/api/v1/user/update-profile`, form,
        { withCredentials: true, headers: { "Content-Type": "application/json" } });
      toast.success("Profile updated!");
      setUser(res.data.user);
      setAlumni(res.data.user);
      setEditing(false);
    } catch (err) { toast.error(err.response?.data?.message || "Something went wrong"); }
    finally { setLoading(false); }
  };

  const complete = isAlumniProfileComplete(alumni);

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">My Profile</h2>
          <p className="text-slate-500 text-sm mt-0.5">{complete ? "Profile complete ✓" : "Complete your profile to appear in searches"}</p>
        </div>
        {!editing ? (
          <button onClick={() => setEditing(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-semibold hover:bg-emerald-500/20 transition-all">
            <PiPencilSimple size={15}/> Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 border border-white/[0.07] text-slate-700 text-sm font-medium hover:bg-slate-700 transition-all">
              <PiX size={14}/> Cancel
            </button>
            <button onClick={handleSave} disabled={loading} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold transition-all shadow shadow-emerald-500/30 disabled:opacity-50">
              <PiCheck size={14}/> {loading ? "Saving…" : "Save Changes"}
            </button>
          </div>
        )}
      </div>

      {!complete && !editing && (
        <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
          <PiStar size={16} className="text-amber-400 flex-shrink-0"/>
          <p className="text-amber-300 text-sm flex-1">Complete your profile to appear in alumni searches and mentor matching.</p>
          <button onClick={() => setEditing(true)} className="text-xs text-amber-400 font-bold hover:text-amber-300 whitespace-nowrap">Complete →</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">

        {/* LEFT: Identity */}
        <div className="space-y-4">
          <div className="relative rounded-2xl overflow-hidden"
            style={{ background: theme === "dark"
              ? "linear-gradient(145deg, #0f1f14 0%, #064e3b 50%, #065f46 100%)"
              : "linear-gradient(145deg, #ecfdf5 0%, #d1fae5 50%, #bbf7d0 100%)" }}>
            <div className="absolute inset-0 opacity-[0.04]"
              style={{ backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)", backgroundSize: "24px 24px" }}/>
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-25 pointer-events-none"
              style={{ background: "radial-gradient(circle, #10b981, transparent 70%)" }}/>
            <div className="relative z-10 p-6 flex flex-col items-center text-center gap-4">
              <ProfilePhotoUpload user={alumni} accentColor="emerald"
                onUploaded={(photo) => {
                  setUser((prev) => (prev ? { ...prev, profilePhoto: photo } : prev));
                  setAlumni((prev) => (prev ? { ...prev, profilePhoto: photo } : prev));
                }}/>
              <div>
                <p className={`font-bold text-lg leading-tight ${theme === "dark" ? "text-white" : "text-slate-950"}`}>{alumni?.name}</p>
                <span className="inline-flex items-center gap-1.5 mt-1 text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <PiGraduationCap size={11}/> Alumni
                </span>
                {complete && <div className="flex items-center justify-center gap-1 mt-2 text-[10px] text-emerald-400"><PiCheck size={11}/> Profile complete</div>}
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2"><PiEnvelope size={14} className="text-slate-500"/><p className="text-slate-500 text-xs truncate">{alumni?.email}</p></div>
            {alumni?.currentCompany && <div className="flex items-center gap-2"><PiBuildings size={14} className="text-slate-500"/><p className="text-slate-500 text-xs">{alumni.currentCompany}</p></div>}
            {alumni?.currentLocation && <div className="flex items-center gap-2"><PiMapPin size={14} className="text-slate-500"/><p className="text-slate-500 text-xs">{alumni.currentLocation}</p></div>}
            {alumni?.enrollmentYear && <div className="flex items-center gap-2"><PiStar size={14} className="text-slate-500"/><p className="text-slate-500 text-xs">Class of {alumni.enrollmentYear}</p></div>}
            {(alumni?.linkedIn || alumni?.github) && (
              <div className="flex gap-2 pt-1">
                {alumni.linkedIn && <a href={alumni.linkedIn} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300"><PiLinkedinLogo size={13}/> LinkedIn</a>}
                {alumni.github && <a href={alumni.github} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"><PiGithubLogo size={13}/> GitHub</a>}
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3"><PiBriefcase size={14} className="text-emerald-400"/><h3 className="text-slate-800 font-semibold text-sm">Skills</h3></div>
            <div className="flex flex-wrap gap-1.5">
              {(editing ? form.skills : alumni?.skills ?? []).map(s => (
                <span key={s} className="flex items-center gap-1 text-xs bg-emerald-50 text-emerald-600 border border-emerald-200 px-2.5 py-1 rounded-full">
                  {s}{editing && <button onClick={() => removeSkill(s)} className="text-emerald-500/60 hover:text-red-400 ml-0.5"><PiX size={10}/></button>}
                </span>
              ))}
              {!editing && !alumni?.skills?.length && <p className="text-slate-400 text-xs">No skills yet</p>}
            </div>
            {editing && (
              <div className="flex gap-2 mt-3">
                <input type="text" placeholder="Add skill…" value={skillInput} onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSkill())} className={`${inp} flex-1 text-xs py-2`}/>
                <button onClick={addSkill} className="px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition-all">Add</button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Fields */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center"><PiBriefcase size={14} className="text-emerald-400"/></div>
              <h3 className="text-slate-800 font-semibold text-sm">Professional Information</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label:"Department",          key:"department",         type:"select", opts:DEPARTMENTS },
                { label:"Degree",              key:"degree",             placeholder:"e.g. B.Tech" },
                { label:"Enrollment Year",     key:"enrollmentYear",     placeholder:"e.g. 2018", type:"number" },
                { label:"Graduation Year",     key:"graduationYear",     placeholder:"e.g. 2022", type:"number" },
                { label:"Current Company",     key:"currentCompany",     placeholder:"e.g. Google" },
                { label:"Current Designation", key:"currentDesignation", placeholder:"e.g. Software Engineer" },
                { label:"Current Location",    key:"currentLocation",    placeholder:"e.g. Bangalore" },
                { label:"Industry",            key:"industry",           type:"select", opts:INDUSTRIES },
              ].map(({ label, key, placeholder, type, opts }) => (
                <Field key={key} label={label} value={type==="number" ? (alumni?.[key] ? String(alumni[key]) : undefined) : alumni?.[key]}>
                  {editing && (type === "select" ? (
                    <select value={form[key]} onChange={e => set(key, e.target.value)} className={inp}>
                      <option value="">Select {label}</option>
                      {opts.map(o => <option key={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input type={type||"text"} placeholder={placeholder} value={form[key]} onChange={e => set(key, type==="number" ? (e.target.value ? Number(e.target.value) : "") : e.target.value)} className={inp}/>
                  ))}
                </Field>
              ))}
            </div>
            {editing && (
              <div className="mt-4 flex items-center gap-3 pt-3 border-t border-white/[0.06]">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <div onClick={() => set("availableForMentorship", !form.availableForMentorship)}
                    className={`w-9 h-5 rounded-full transition-all ${form.availableForMentorship ? "bg-emerald-500" : "bg-slate-700"} relative flex-shrink-0`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${form.availableForMentorship ? "left-4" : "left-0.5"}`}/>
                  </div>
                  <span className="text-slate-700 text-sm">Available for Mentorship</span>
                </label>
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-violet-500/15 border border-violet-500/25 flex items-center justify-center"><PiUser size={14} className="text-violet-400"/></div>
              <h3 className="text-slate-800 font-semibold text-sm">About Me</h3>
            </div>
            {editing ? (
              <><textarea rows={4} placeholder="Share your journey, expertise, and what you can offer as a mentor…"
                value={form.bio} onChange={e => set("bio", e.target.value)} className={`${inp} resize-none`} maxLength={500}/>
              <p className="text-slate-400 text-xs text-right mt-1">{form.bio.length}/500</p></>
            ) : <p className="text-slate-700 text-sm leading-relaxed">{alumni?.bio || <span className="text-slate-400">No bio added yet.</span>}</p>}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-sky-500/15 border border-sky-500/25 flex items-center justify-center"><PiLinkedinLogo size={14} className="text-sky-400"/></div>
              <h3 className="text-slate-800 font-semibold text-sm">Social Links</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[{label:"LinkedIn",key:"linkedIn",placeholder:"https://linkedin.com/in/…"},{label:"GitHub",key:"github",placeholder:"https://github.com/…"}].map(({label,key,placeholder}) => (
                <Field key={key} label={label} value={alumni?.[key]}>
                  {alumni?.[key] && !editing && <a href={alumni[key]} target="_blank" rel="noreferrer" className="text-sky-400 text-sm hover:underline truncate block">{alumni[key]}</a>}
                  {editing && <input type="url" placeholder={placeholder} value={form[key]} onChange={e => set(key, e.target.value)} className={inp}/>}
                </Field>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Profile;
