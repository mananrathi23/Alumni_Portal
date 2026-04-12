import React, { useState, useContext } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { Context } from "../../main";
import ProfilePhotoUpload from "../ProfilePhotoUpload.jsx";
import {
  PiPencilSimple, PiCheck, PiX, PiLinkedinLogo,
  PiGithubLogo, PiBriefcase, PiStar, PiUser,
} from "react-icons/pi";

const DEPARTMENTS  = ["Computer Science","Information Technology","Electronics","Mechanical","Civil","Other"];
const DESIGNATIONS = ["Professor","Associate Professor","Assistant Professor","Lecturer","HOD","Other"];

export const isTeacherProfileComplete = (u) =>
  !!(u?.department && u.department !== "Not Set" &&
     u?.designation && u.designation !== "Not Set" &&
     u?.employeeId && u?.bio);

const Profile = () => {
  const { teacher } = useOutletContext();
  const { setUser } = useContext(Context);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [skillInput, setSkillInput] = useState("");

  const [form, setForm] = useState({
    department:  teacher?.department  || "",
    designation: teacher?.designation || "",
    employeeId:  teacher?.employeeId  || "",
    joiningYear: teacher?.joiningYear || "",
    bio:         teacher?.bio         || "",
    linkedIn:    teacher?.linkedIn    || "",
    github:      teacher?.github      || "",
    skills:      teacher?.skills      || [],
  });

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !form.skills.includes(s)) set("skills", [...form.skills, s]);
    setSkillInput("");
  };
  const removeSkill = (s) => set("skills", form.skills.filter((x) => x !== s));

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await axios.put("http://localhost:4000/api/v1/user/update-profile", form,
        { withCredentials: true, headers: { "Content-Type": "application/json" } });
      toast.success("Profile updated!");
      setUser(res.data.user);
      setEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally { setLoading(false); }
  };

  const complete = isTeacherProfileComplete(teacher);
  const inp = "w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-white/[0.07] text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all";
  const lbl = "block text-xs font-semibold text-slate-400 tracking-widest uppercase mb-1.5";

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">My Profile</h2>
          <p className="text-slate-400 text-sm mt-0.5">{complete ? "Profile complete ✓" : "Complete your profile to connect with students"}</p>
        </div>
        {!editing ? (
          <button onClick={() => setEditing(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-500/10 border border-violet-500/30 text-violet-400 text-sm font-semibold hover:bg-violet-500/20 transition-all">
            <PiPencilSimple size={15} /> Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 border border-white/[0.07] text-slate-300 text-sm font-medium hover:bg-slate-700 transition-all">
              <PiX size={14} /> Cancel
            </button>
            <button onClick={handleSave} disabled={loading} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-500 hover:bg-violet-400 text-white text-sm font-bold transition-all shadow shadow-violet-500/30 disabled:opacity-50">
              <PiCheck size={14} /> {loading ? "Saving…" : "Save"}
            </button>
          </div>
        )}
      </div>

      {/* Profile Photo */}
      <div className="bg-slate-900 border border-white/[0.07] rounded-xl p-5 flex justify-center">
        <ProfilePhotoUpload
          user={teacher}
          accentColor="violet"
          onUploaded={(photo) => setUser((prev) => ({ ...prev, profilePhoto: photo }))}
        />
      </div>

      {!complete && !editing && (
        <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
          <PiStar size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-amber-300 text-sm font-semibold">Profile incomplete</p>
            <p className="text-amber-400/70 text-xs mt-0.5">Add your department, designation, employee ID and bio.</p>
          </div>
          <button onClick={() => setEditing(true)} className="text-xs text-amber-400 font-semibold hover:text-amber-300">Complete →</button>
        </div>
      )}

      {/* Avatar card */}
      <div className="bg-slate-900 border border-white/[0.07] rounded-xl p-5 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-violet-500/20 flex-shrink-0">
          {teacher?.name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-white font-bold text-lg leading-tight">{teacher?.name}</p>
          <p className="text-violet-400 text-xs font-medium tracking-widest uppercase mt-0.5">Teacher</p>
          <p className="text-slate-500 text-xs mt-1">{teacher?.email}</p>
        </div>
        {complete && <span className="ml-auto flex items-center gap-1.5 text-xs text-violet-400 bg-violet-500/10 border border-violet-500/20 px-3 py-1.5 rounded-full font-semibold"><PiCheck size={12} /> Complete</span>}
      </div>

      {/* Professional info */}
      <div className="bg-slate-900 border border-white/[0.07] rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1"><PiBriefcase size={16} className="text-violet-400" /><h3 className="text-white font-semibold text-sm">Professional Info</h3></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: "Department",   key: "department",  type: "select", opts: DEPARTMENTS },
            { label: "Designation",  key: "designation", type: "select", opts: DESIGNATIONS },
            { label: "Employee ID",  key: "employeeId",  placeholder: "e.g. EMP-1234" },
          ].map(({ label, key, placeholder, type, opts }) => (
            <div key={key}>
              <label className={lbl}>{label}</label>
              {editing ? (
                type === "select" ? (
                  <select value={form[key]} onChange={(e) => set(key, e.target.value)} className={inp}>
                    <option value="">Select {label}</option>
                    {opts.map((o) => <option key={o}>{o}</option>)}
                  </select>
                ) : (
                  <input type="text" placeholder={placeholder} value={form[key]} onChange={(e) => set(key, e.target.value)} className={inp} />
                )
              ) : (
                <p className="text-slate-300 text-sm">{teacher?.[key] || <span className="text-slate-600">Not set</span>}</p>
              )}
            </div>
          ))}

          {/* Joining Year */}
          <div>
            <label className={lbl}>Year Joined Institution</label>
            {editing ? (
              <input
                type="number"
                placeholder="e.g. 2015"
                min="1970"
                max={new Date().getFullYear()}
                value={form.joiningYear}
                onChange={(e) => set("joiningYear", e.target.value ? Number(e.target.value) : "")}
                className={inp}
              />
            ) : (
              <p className="text-slate-300 text-sm">
                {teacher?.joiningYear ? `Joined ${teacher.joiningYear}` : <span className="text-slate-600">Not set</span>}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Bio */}
      <div className="bg-slate-900 border border-white/[0.07] rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 mb-1"><PiUser size={16} className="text-violet-400" /><h3 className="text-white font-semibold text-sm">About</h3></div>
        {editing ? (
          <>
            <textarea rows={3} placeholder="Write about your teaching experience and research interests…"
              value={form.bio} onChange={(e) => set("bio", e.target.value)} className={`${inp} resize-none`} maxLength={500} />
            <p className="text-slate-600 text-xs text-right">{form.bio.length}/500</p>
          </>
        ) : <p className="text-slate-300 text-sm leading-relaxed">{teacher?.bio || <span className="text-slate-600">No bio added yet.</span>}</p>}
      </div>

      {/* Skills */}
      <div className="bg-slate-900 border border-white/[0.07] rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 mb-1"><PiBriefcase size={16} className="text-violet-400" /><h3 className="text-white font-semibold text-sm">Subjects / Skills</h3></div>
        <div className="flex flex-wrap gap-2">
          {(editing ? form.skills : teacher?.skills ?? []).map((s) => (
            <span key={s} className="flex items-center gap-1.5 text-xs bg-slate-800 text-slate-300 px-3 py-1.5 rounded-full border border-white/[0.07]">
              {s}
              {editing && <button onClick={() => removeSkill(s)} className="text-slate-500 hover:text-red-400 transition-colors"><PiX size={11} /></button>}
            </span>
          ))}
          {!editing && !teacher?.skills?.length && <p className="text-slate-600 text-sm">No skills added.</p>}
        </div>
        {editing && (
          <div className="flex gap-2">
            <input type="text" placeholder="Add a subject or skill" value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
              className={`${inp} flex-1`} />
            <button onClick={addSkill} className="px-4 py-2 rounded-lg bg-violet-500/10 border border-violet-500/30 text-violet-400 text-sm font-semibold hover:bg-violet-500/20 transition-all">Add</button>
          </div>
        )}
      </div>

      {/* Social */}
      <div className="bg-slate-900 border border-white/[0.07] rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1"><PiLinkedinLogo size={16} className="text-violet-400" /><h3 className="text-white font-semibold text-sm">Social Links</h3></div>
        {[{ label: "LinkedIn URL", key: "linkedIn", Icon: PiLinkedinLogo, color: "text-sky-400", placeholder: "https://linkedin.com/in/yourname" },
          { label: "GitHub URL",   key: "github",   Icon: PiGithubLogo,   color: "text-slate-300", placeholder: "https://github.com/yourname" }].map(({ label, key, Icon, color, placeholder }) => (
          <div key={key}>
            <label className={lbl}>{label}</label>
            {editing ? (
              <input type="url" placeholder={placeholder} value={form[key]} onChange={(e) => set(key, e.target.value)} className={inp} />
            ) : teacher?.[key] ? (
              <a href={teacher[key]} target="_blank" rel="noreferrer" className={`${color} text-sm hover:underline flex items-center gap-1.5`}><Icon size={14} />{teacher[key]}</a>
            ) : <p className="text-slate-600 text-sm">Not set</p>}
          </div>
        ))}
      </div>
    </div>
  );
};
export default Profile;
