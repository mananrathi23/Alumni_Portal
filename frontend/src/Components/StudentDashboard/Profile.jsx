import React, { useState, useContext } from "react";
import { useOutletContext } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { Context } from "../../main";
import ProfilePhotoUpload from "../ProfilePhotoUpload.jsx";
import {
  PiGraduationCap, PiPencilSimple, PiCheck, PiX,
  PiLinkedinLogo, PiGithubLogo, PiLink, PiBriefcase, PiStar, PiUser,
  PiEnvelope, PiIdentificationCard,
} from "react-icons/pi";

const DEPARTMENTS = ["Computer Science","Information Technology","Electronics","Mechanical","Civil","Other"];
const YEARS = ["1st Year","2nd Year","3rd Year","4th Year"];

export const isProfileComplete = (student) =>
  !!(student?.department && student.department !== "Not Set" && student?.year && student?.enrollmentNumber && student?.bio);

const inp = "w-full px-3 py-2.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all";
const lbl = "block text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-1.5";

const Field = ({ label, value, children }) => (
  <div>
    <p className={lbl}>{label}</p>
    {children || <p className="text-slate-700 text-sm">{value || <span className="text-slate-400">Not set</span>}</p>}
  </div>
);

const Profile = () => {
  const { student, setStudent }  = useOutletContext();
  const { setUser, theme }  = useContext(Context);
  const [editing, setEditing]       = useState(false);
  const [loading, setLoading]       = useState(false);
  const [skillInput, setSkillInput] = useState("");

  const [form, setForm] = useState({
    department: student?.department || "",
    year: student?.year || "",
    enrollmentNumber: student?.enrollmentNumber || "",
    cgpa: student?.cgpa || "",
    enrollmentYear: student?.enrollmentYear || "",
    bio: student?.bio || "",
    linkedIn: student?.linkedIn || "",
    github: student?.github || "",
    portfolio: student?.portfolio || "",
    skills: student?.skills || [],
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
      const res = await axios.put("http://localhost:4000/api/v1/user/update-profile",
        { ...form, cgpa: form.cgpa ? Number(form.cgpa) : undefined, enrollmentYear: form.enrollmentYear ? Number(form.enrollmentYear) : undefined },
        { withCredentials: true, headers: { "Content-Type": "application/json" } }
      );
      toast.success("Profile updated!");
      setUser(res.data.user);
      setStudent(res.data.user);
      setEditing(false);
    } catch (err) { toast.error(err.response?.data?.message || "Something went wrong"); }
    finally { setLoading(false); }
  };

  const complete = isProfileComplete(student);

  return (
    <div className="max-w-5xl mx-auto space-y-5">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">My Profile</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            {complete ? "Your profile is complete ✓" : "Complete your profile so others can find you"}
          </p>
        </div>
        {!editing ? (
          <button onClick={() => setEditing(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400 text-sm font-semibold hover:bg-sky-500/20 transition-all">
            <PiPencilSimple size={15}/> Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg ${theme === "dark" ? "bg-slate-800 border border-white/[0.07] text-slate-300 hover:bg-slate-700" : "bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200"} text-sm font-medium transition-all`}>
              <PiX size={14}/> Cancel
            </button>
            <button onClick={handleSave} disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-sm font-bold transition-all shadow shadow-sky-500/30 disabled:opacity-50">
              <PiCheck size={14}/> {loading ? "Saving…" : "Save Changes"}
            </button>
          </div>
        )}
      </div>

      {/* Incomplete banner */}
      {!complete && !editing && (
        <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
          <PiStar size={16} className="text-amber-400 flex-shrink-0"/>
          <p className="text-amber-300 text-sm flex-1">Complete your profile — add department, enrollment number, and bio.</p>
          <button onClick={() => setEditing(true)} className="text-xs text-amber-400 font-bold hover:text-amber-300 whitespace-nowrap">Complete →</button>
        </div>
      )}

      {/* ── Main 2-col layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">

        {/* ── LEFT: Identity card ── */}
        <div className="space-y-4">
          {/* Photo + name hero card */}
          <div className="relative rounded-2xl overflow-hidden"
            style={{ background: theme === "dark"
              ? "linear-gradient(145deg, #0f172a 0%, #1e3a5f 50%, #0c4a6e 100%)"
              : "linear-gradient(145deg, #eff6ff 0%, #dbeafe 50%, #bfdbfe 100%)" }}>
            {/* Grid decoration */}
            <div className="absolute inset-0 opacity-[0.04]"
              style={{ backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)", backgroundSize: "24px 24px" }}/>
            {/* Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-30 pointer-events-none"
              style={{ background: "radial-gradient(circle, #0ea5e9, transparent 70%)" }}/>

            <div className="relative z-10 p-6 flex flex-col items-center text-center gap-4">
              {/* Photo upload */}
              <ProfilePhotoUpload
                user={student}
                accentColor="sky"
                onUploaded={(photo) => {
                  setUser((prev) => (prev ? { ...prev, profilePhoto: photo } : prev));
                  setStudent((prev) => (prev ? { ...prev, profilePhoto: photo } : prev));
                }}
              />
              {/* Name + role */}
              <div>
                <p className={theme === "dark" ? "text-white font-bold text-lg leading-tight" : "text-slate-950 font-bold text-lg leading-tight"}>{student?.name}</p>
                <span className="inline-flex items-center gap-1.5 mt-1 text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  <PiGraduationCap size={11}/> Student
                </span>
                {complete && (
                  <div className="flex items-center justify-center gap-1 mt-2 text-[10px] text-emerald-400">
                    <PiCheck size={11}/> Profile complete
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick info card */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <PiEnvelope size={14} className="text-slate-500 flex-shrink-0"/>
              <p className="text-slate-500 text-xs truncate">{student?.email}</p>
            </div>
            {student?.department && student.department !== "Not Set" && (
              <div className="flex items-center gap-2">
                <PiGraduationCap size={14} className="text-slate-500 flex-shrink-0"/>
                <p className="text-slate-500 text-xs">{student.department}</p>
              </div>
            )}
            {student?.year && (
              <div className="flex items-center gap-2">
                <PiIdentificationCard size={14} className="text-slate-500 flex-shrink-0"/>
                <p className="text-slate-500 text-xs">{student.year}</p>
              </div>
            )}
            {student?.enrollmentYear && (
              <div className="flex items-center gap-2">
                <PiStar size={14} className="text-slate-500 flex-shrink-0"/>
                <p className="text-slate-500 text-xs">Class of {student.enrollmentYear}</p>
              </div>
            )}
            {student?.cgpa > 0 && (
              <div className="flex items-center gap-2">
                <PiBriefcase size={14} className="text-slate-500 flex-shrink-0"/>
                <p className="text-slate-500 text-xs">CGPA: <span className="text-white font-semibold">{student.cgpa}</span></p>
              </div>
            )}
            {/* Social links */}
            {(student?.linkedIn || student?.github || student?.portfolio) && (
              <div className="flex gap-2 pt-1">
                {student.linkedIn && (
                  <a href={student.linkedIn} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 transition-colors">
                    <PiLinkedinLogo size={13}/> LinkedIn
                  </a>
                )}
                {student.github && (
                  <a href={student.github} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors">
                    <PiGithubLogo size={13}/> GitHub
                  </a>
                )}
                {student.portfolio && (
                  <a href={student.portfolio} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors">
                    <PiLink size={13}/> Portfolio
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Skills card */}
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <PiBriefcase size={14} className="text-sky-400"/>
              <h3 className="text-slate-800 font-semibold text-sm">Skills</h3>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(editing ? form.skills : student?.skills ?? []).map(skill => (
                <span key={skill} className="flex items-center gap-1 text-xs bg-sky-50 text-sky-600 border border-sky-200 px-2.5 py-1 rounded-full">
                  {skill}
                  {editing && <button onClick={() => removeSkill(skill)} className="text-sky-500/60 hover:text-red-400 transition-colors ml-0.5"><PiX size={10}/></button>}
                </span>
              ))}
              {!editing && !student?.skills?.length && <p className="text-slate-400 text-xs">No skills yet</p>}
            </div>
            {editing && (
              <div className="flex gap-2 mt-3">
                <input type="text" placeholder="Add skill…" value={skillInput}
                  onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSkill())}
                  className={`${inp} flex-1 text-xs py-2`}/>
                <button onClick={addSkill} className="px-3 py-2 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-semibold hover:bg-sky-500/20 transition-all">Add</button>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Form fields ── */}
        <div className="space-y-4">

          {/* Academic info */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-sky-500/15 border border-sky-500/25 flex items-center justify-center flex-shrink-0">
                <PiGraduationCap size={14} className="text-sky-400"/>
              </div>
              <h3 className="text-slate-800 font-semibold text-sm">Academic Information</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Enrollment Number" value={student?.enrollmentNumber}>
                {editing && <input type="text" placeholder="e.g. 2023Btech060" value={form.enrollmentNumber} onChange={e => set("enrollmentNumber", e.target.value)} className={inp}/>}
              </Field>
              <Field label="Enrollment Year (Class of)" value={student?.enrollmentYear ? `Class of ${student.enrollmentYear}` : undefined}>
                {editing && <input type="number" placeholder="e.g. 2022" min="2000" max="2040" value={form.enrollmentYear} onChange={e => set("enrollmentYear", e.target.value ? Number(e.target.value) : "")} className={inp}/>}
              </Field>
              <Field label="Department" value={student?.department !== "Not Set" ? student?.department : undefined}>
                {editing && (
                  <select value={form.department} onChange={e => set("department", e.target.value)} className={inp}>
                    <option value="">Select department</option>
                    {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                  </select>
                )}
              </Field>
              <Field label="Year" value={student?.year}>
                {editing && (
                  <select value={form.year} onChange={e => set("year", e.target.value)} className={inp}>
                    <option value="">Select year</option>
                    {YEARS.map(y => <option key={y}>{y}</option>)}
                  </select>
                )}
              </Field>
              <Field label="CGPA" value={student?.cgpa ? String(student.cgpa) : undefined}>
                {editing && <input type="number" step="0.01" min="0" max="10" placeholder="e.g. 8.5" value={form.cgpa} onChange={e => set("cgpa", e.target.value)} className={inp}/>}
              </Field>
            </div>
          </div>

          {/* Bio */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-violet-500/15 border border-violet-500/25 flex items-center justify-center flex-shrink-0">
                <PiUser size={14} className="text-violet-400"/>
              </div>
              <h3 className="text-slate-800 font-semibold text-sm">About Me</h3>
            </div>
            {editing ? (
              <>
                <textarea rows={4} placeholder="Tell others about yourself — your interests, goals, and what you're working on…"
                  value={form.bio} onChange={e => set("bio", e.target.value)}
                  className={`${inp} resize-none`} maxLength={500}/>
                <p className="text-slate-400 text-xs text-right mt-1">{form.bio.length}/500</p>
              </>
            ) : (
              <p className="text-slate-700 text-sm leading-relaxed">
                {student?.bio || <span className="text-slate-400">No bio added yet. Click Edit Profile to add one.</span>}
              </p>
            )}
          </div>

          {/* Social links */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center flex-shrink-0">
                <PiLinkedinLogo size={14} className="text-emerald-400"/>
              </div>
              <h3 className="text-slate-800 font-semibold text-sm">Social Links</h3>
            </div>
            <div className="space-y-3">
              <Field label="LinkedIn" value={student?.linkedIn}>
                {student?.linkedIn && !editing && (
                  <a href={student.linkedIn} target="_blank" rel="noreferrer" className="text-sky-400 text-sm hover:underline flex items-center gap-1.5">
                    <PiLinkedinLogo size={14}/> {student.linkedIn}
                  </a>
                )}
                {editing && <input type="url" placeholder="https://linkedin.com/in/yourname" value={form.linkedIn} onChange={e => set("linkedIn", e.target.value)} className={inp}/>}
              </Field>
              <Field label="GitHub" value={student?.github}>
                {student?.github && !editing && (
                  <a href={student.github} target="_blank" rel="noreferrer" className="text-slate-700 text-sm hover:underline flex items-center gap-1.5">
                    <PiGithubLogo size={14}/> {student.github}
                  </a>
                )}
                {editing && <input type="url" placeholder="https://github.com/yourname" value={form.github} onChange={e => set("github", e.target.value)} className={inp}/>}
              </Field>
              <Field label="Portfolio" value={student?.portfolio}>
                {student?.portfolio && !editing && (
                  <a href={student.portfolio} target="_blank" rel="noreferrer" className="text-emerald-600 text-sm hover:underline flex items-center gap-1.5">
                    <PiLink size={14}/> {student.portfolio}
                  </a>
                )}
                {editing && <input type="url" placeholder="https://your-portfolio.com" value={form.portfolio} onChange={e => set("portfolio", e.target.value)} className={inp}/>}
              </Field>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Profile;
