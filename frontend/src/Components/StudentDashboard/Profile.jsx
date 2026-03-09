import React, { useState, useContext } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { Context } from "../../main";
import {
  PiGraduationCap, PiPencilSimple, PiCheck, PiX,
  PiLinkedinLogo, PiGithubLogo, PiBriefcase,
  PiStar, PiUser,
} from "react-icons/pi";

const DEPARTMENTS = [
  "Computer Science", "Information Technology", "Electronics",
  "Mechanical", "Civil", "Other",
];
const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

/* ── helper: is profile complete? ── */
export const isProfileComplete = (student) => {
  return !!(
    student?.department && student.department !== "Not Set" &&
    student?.year &&
    student?.enrollmentNumber &&
    student?.bio
  );
};

const Profile = () => {
  const { student } = useOutletContext();
  const { setUser } = useContext(Context);
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [skillInput, setSkillInput] = useState("");

  const [form, setForm] = useState({
    department:       student?.department || "",
    year:             student?.year || "",
    enrollmentNumber: student?.enrollmentNumber || "",
    section:          student?.section || "",
    cgpa:             student?.cgpa || "",
    bio:              student?.bio || "",
    linkedIn:         student?.linkedIn || "",
    github:           student?.github || "",
    skills:           student?.skills || [],
  });

  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !form.skills.includes(s)) {
      set("skills", [...form.skills, s]);
    }
    setSkillInput("");
  };

  const removeSkill = (skill) =>
    set("skills", form.skills.filter((s) => s !== skill));

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await axios.put(
        "http://localhost:4000/api/v1/user/update-profile",
        { ...form, cgpa: form.cgpa ? Number(form.cgpa) : undefined },
        { withCredentials: true, headers: { "Content-Type": "application/json" } }
      );
      toast.success("Profile updated successfully!");
      setUser(res.data.user);
      setEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const complete = isProfileComplete(student);

  const inputClass = "w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-white/[0.07] text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all";
  const labelClass = "block text-xs font-semibold text-slate-400 tracking-widest uppercase mb-1.5";

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">My Profile</h2>
          <p className="text-slate-400 text-sm mt-0.5">
            {complete
              ? "Your profile is complete ✓"
              : "Complete your profile so others can find you"}
          </p>
        </div>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400 text-sm font-semibold hover:bg-sky-500/20 transition-all"
          >
            <PiPencilSimple size={15} /> Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setEditing(false)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 border border-white/[0.07] text-slate-300 text-sm font-medium hover:bg-slate-700 transition-all"
            >
              <PiX size={14} /> Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-sm font-bold transition-all shadow shadow-sky-500/30 disabled:opacity-50"
            >
              <PiCheck size={14} /> {loading ? "Saving…" : "Save"}
            </button>
          </div>
        )}
      </div>

      {/* Incomplete banner */}
      {!complete && !editing && (
        <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
          <PiStar size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-300 text-sm font-semibold">Profile incomplete</p>
            <p className="text-amber-400/70 text-xs mt-0.5">
              Add your enrollment number, department, and bio to complete your profile.
            </p>
          </div>
          <button
            onClick={() => setEditing(true)}
            className="ml-auto text-xs text-amber-400 font-semibold hover:text-amber-300 whitespace-nowrap"
          >
            Complete →
          </button>
        </div>
      )}

      {/* Avatar + name card */}
      <div className="bg-slate-900 border border-white/[0.07] rounded-xl p-5 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-sky-500/20 flex-shrink-0">
          {student?.name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-white font-bold text-lg leading-tight">{student?.name}</p>
          <p className="text-sky-400 text-xs font-medium tracking-widest uppercase mt-0.5">Student</p>
          <p className="text-slate-500 text-xs mt-1">{student?.email}</p>
        </div>
        {complete && (
          <span className="ml-auto flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full font-semibold">
            <PiCheck size={12} /> Complete
          </span>
        )}
      </div>

      {/* Academic Info */}
      <div className="bg-slate-900 border border-white/[0.07] rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <PiGraduationCap size={16} className="text-sky-400" />
          <h3 className="text-white font-semibold text-sm">Academic Information</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Enrollment */}
          <div>
            <label className={labelClass}>Enrollment Number</label>
            {editing ? (
              <input type="text" placeholder="e.g. 21CS001" value={form.enrollmentNumber}
                onChange={(e) => set("enrollmentNumber", e.target.value)} className={inputClass} />
            ) : (
              <p className="text-slate-300 text-sm">{student?.enrollmentNumber || <span className="text-slate-600">Not set</span>}</p>
            )}
          </div>

          {/* Department */}
          <div>
            <label className={labelClass}>Department</label>
            {editing ? (
              <select value={form.department} onChange={(e) => set("department", e.target.value)} className={inputClass}>
                <option value="">Select department</option>
                {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
              </select>
            ) : (
              <p className="text-slate-300 text-sm">{student?.department || <span className="text-slate-600">Not set</span>}</p>
            )}
          </div>

          {/* Year */}
          <div>
            <label className={labelClass}>Year</label>
            {editing ? (
              <select value={form.year} onChange={(e) => set("year", e.target.value)} className={inputClass}>
                <option value="">Select year</option>
                {YEARS.map((y) => <option key={y}>{y}</option>)}
              </select>
            ) : (
              <p className="text-slate-300 text-sm">{student?.year || <span className="text-slate-600">Not set</span>}</p>
            )}
          </div>

          {/* Section */}
          <div>
            <label className={labelClass}>Section</label>
            {editing ? (
              <input type="text" placeholder="e.g. A" value={form.section}
                onChange={(e) => set("section", e.target.value)} className={inputClass} />
            ) : (
              <p className="text-slate-300 text-sm">{student?.section || <span className="text-slate-600">Not set</span>}</p>
            )}
          </div>

          {/* CGPA */}
          <div>
            <label className={labelClass}>CGPA</label>
            {editing ? (
              <input type="number" step="0.01" min="0" max="10" placeholder="e.g. 8.5"
                value={form.cgpa} onChange={(e) => set("cgpa", e.target.value)} className={inputClass} />
            ) : (
              <p className="text-slate-300 text-sm">{student?.cgpa || <span className="text-slate-600">Not set</span>}</p>
            )}
          </div>
        </div>
      </div>

      {/* Bio */}
      <div className="bg-slate-900 border border-white/[0.07] rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <PiUser size={16} className="text-sky-400" />
          <h3 className="text-white font-semibold text-sm">About</h3>
        </div>
        {editing ? (
          <>
            <textarea rows={3} placeholder="Write a short bio about yourself…"
              value={form.bio} onChange={(e) => set("bio", e.target.value)}
              className={`${inputClass} resize-none`} maxLength={500} />
            <p className="text-slate-600 text-xs text-right">{form.bio.length}/500</p>
          </>
        ) : (
          <p className="text-slate-300 text-sm leading-relaxed">
            {student?.bio || <span className="text-slate-600">No bio added yet.</span>}
          </p>
        )}
      </div>

      {/* Skills */}
      <div className="bg-slate-900 border border-white/[0.07] rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <PiBriefcase size={16} className="text-sky-400" />
          <h3 className="text-white font-semibold text-sm">Skills</h3>
        </div>

        <div className="flex flex-wrap gap-2">
          {(editing ? form.skills : student?.skills ?? []).map((skill) => (
            <span key={skill}
              className="flex items-center gap-1.5 text-xs bg-slate-800 text-slate-300 px-3 py-1.5 rounded-full border border-white/[0.07]">
              {skill}
              {editing && (
                <button onClick={() => removeSkill(skill)} className="text-slate-500 hover:text-red-400 transition-colors ml-0.5">
                  <PiX size={11} />
                </button>
              )}
            </span>
          ))}
          {!editing && student?.skills?.length === 0 && (
            <p className="text-slate-600 text-sm">No skills added yet.</p>
          )}
        </div>

        {editing && (
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add a skill (e.g. React)"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
              className={`${inputClass} flex-1`}
            />
            <button onClick={addSkill}
              className="px-4 py-2 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400 text-sm font-semibold hover:bg-sky-500/20 transition-all">
              Add
            </button>
          </div>
        )}
      </div>

      {/* Social Links */}
      <div className="bg-slate-900 border border-white/[0.07] rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <PiLinkedinLogo size={16} className="text-sky-400" />
          <h3 className="text-white font-semibold text-sm">Social Links</h3>
        </div>

        <div className="space-y-3">
          <div>
            <label className={labelClass}>LinkedIn URL</label>
            {editing ? (
              <input type="url" placeholder="https://linkedin.com/in/yourname"
                value={form.linkedIn} onChange={(e) => set("linkedIn", e.target.value)} className={inputClass} />
            ) : student?.linkedIn ? (
              <a href={student.linkedIn} target="_blank" rel="noreferrer"
                className="text-sky-400 text-sm hover:underline flex items-center gap-1.5">
                <PiLinkedinLogo size={14} /> {student.linkedIn}
              </a>
            ) : (
              <p className="text-slate-600 text-sm">Not set</p>
            )}
          </div>

          <div>
            <label className={labelClass}>GitHub URL</label>
            {editing ? (
              <input type="url" placeholder="https://github.com/yourname"
                value={form.github} onChange={(e) => set("github", e.target.value)} className={inputClass} />
            ) : student?.github ? (
              <a href={student.github} target="_blank" rel="noreferrer"
                className="text-slate-300 text-sm hover:underline flex items-center gap-1.5">
                <PiGithubLogo size={14} /> {student.github}
              </a>
            ) : (
              <p className="text-slate-600 text-sm">Not set</p>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default Profile;
