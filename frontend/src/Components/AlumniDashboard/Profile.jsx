import React, { useState, useContext } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { Context } from "../../main";
import ProfilePhotoUpload from "../ProfilePhotoUpload.jsx";
import {
  PiPencilSimple, PiCheck, PiX, PiLinkedinLogo,
  PiGithubLogo, PiBriefcase, PiGraduationCap, PiStar, PiUser,
} from "react-icons/pi";

const DEPARTMENTS = ["Computer Science","Information Technology","Electronics","Mechanical","Civil","Other"];
const INDUSTRIES  = ["Technology","Finance","Healthcare","Education","Manufacturing","Consulting","Other"];

export const isAlumniProfileComplete = (u) =>
  !!(u?.department && u.department !== "Not Set" && u?.currentCompany && u?.bio && u?.graduationYear);

const Profile = () => {
  const { alumni } = useOutletContext();
  const { setUser } = useContext(Context);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [skillInput, setSkillInput] = useState("");

  const [form, setForm] = useState({
    department:          alumni?.department || "",
    degree:              alumni?.degree || "",
    enrollmentYear:      alumni?.enrollmentYear || "",
    graduationYear:      alumni?.graduationYear || "",
    currentCompany:      alumni?.currentCompany || "",
    currentDesignation:  alumni?.currentDesignation || "",
    currentLocation:     alumni?.currentLocation || "",
    industry:            alumni?.industry || "",
    bio:                 alumni?.bio || "",
    linkedIn:            alumni?.linkedIn || "",
    github:              alumni?.github || "",
    skills:              alumni?.skills || [],
    availableForMentorship: alumni?.availableForMentorship || false,
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

  const complete = isAlumniProfileComplete(alumni);
  const inp = "w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-white/[0.07] text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all";
  const lbl = "block text-xs font-semibold text-slate-400 tracking-widest uppercase mb-1.5";

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">My Profile</h2>
          <p className="text-slate-400 text-sm mt-0.5">{complete ? "Profile complete ✓" : "Complete your profile to appear in searches"}</p>
        </div>
        {!editing ? (
          <button onClick={() => setEditing(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-semibold hover:bg-emerald-500/20 transition-all">
            <PiPencilSimple size={15} /> Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 border border-white/[0.07] text-slate-300 text-sm font-medium hover:bg-slate-700 transition-all">
              <PiX size={14} /> Cancel
            </button>
            <button onClick={handleSave} disabled={loading} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold transition-all shadow shadow-emerald-500/30 disabled:opacity-50">
              <PiCheck size={14} /> {loading ? "Saving…" : "Save"}
            </button>
          </div>
        )}
      </div>

      {/* Profile Photo */}
      <div className="bg-slate-900 border border-white/[0.07] rounded-xl p-5 flex justify-center">
        <ProfilePhotoUpload
          user={alumni}
          accentColor="emerald"
          onUploaded={(photo) => setUser((prev) => ({ ...prev, profilePhoto: photo }))}
        />
      </div>

      {!complete && !editing && (
        <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
          <PiStar size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-amber-300 text-sm font-semibold">Profile incomplete</p>
            <p className="text-amber-400/70 text-xs mt-0.5">Add your current company, department, and bio.</p>
          </div>
          <button onClick={() => setEditing(true)} className="text-xs text-amber-400 font-semibold hover:text-amber-300">Complete →</button>
        </div>
      )}

      {/* Avatar card */}
      <div className="bg-slate-900 border border-white/[0.07] rounded-xl p-5 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-emerald-500/20 flex-shrink-0">
          {alumni?.name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-white font-bold text-lg leading-tight">{alumni?.name}</p>
          <p className="text-emerald-400 text-xs font-medium tracking-widest uppercase mt-0.5">Alumni</p>
          <p className="text-slate-500 text-xs mt-1">{alumni?.email}</p>
        </div>
        {complete && <span className="ml-auto flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full font-semibold"><PiCheck size={12} /> Complete</span>}
      </div>

      {/* Academic & Career */}
      <div className="bg-slate-900 border border-white/[0.07] rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1"><PiGraduationCap size={16} className="text-emerald-400" /><h3 className="text-white font-semibold text-sm">Academic & Career</h3></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: "Department", key: "department", type: "select", opts: DEPARTMENTS },
            { label: "Degree", key: "degree", placeholder: "e.g. B.Tech" },
            { label: "Enrollment Year", key: "enrollmentYear", placeholder: "e.g. 2018", type: "number" },
            { label: "Graduation Year", key: "graduationYear", placeholder: "e.g. 2022", type: "number" },
            { label: "Current Company", key: "currentCompany", placeholder: "e.g. Google" },
            { label: "Current Designation", key: "currentDesignation", placeholder: "e.g. Software Engineer" },
            { label: "Current Location", key: "currentLocation", placeholder: "e.g. Bangalore" },
            { label: "Industry", key: "industry", type: "select", opts: INDUSTRIES },
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
                  <input type={type || "text"} placeholder={placeholder} value={form[key]}
                    onChange={(e) => set(key, e.target.value)} className={inp} />
                )
              ) : (
                <p className="text-slate-300 text-sm">{alumni?.[key] || <span className="text-slate-600">Not set</span>}</p>
              )}
            </div>
          ))}
        </div>
        {/* Mentorship toggle */}
        <div>
          <label className={lbl}>Mentorship</label>
          {editing ? (
            <label className="flex items-center gap-2.5 cursor-pointer w-fit">
              <div onClick={() => set("availableForMentorship", !form.availableForMentorship)}
                className={`w-9 h-5 rounded-full transition-colors flex-shrink-0 relative ${form.availableForMentorship ? "bg-emerald-500" : "bg-slate-700"}`}>
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.availableForMentorship ? "translate-x-4" : ""}`} />
              </div>
              <span className="text-slate-300 text-sm">Available for mentorship</span>
            </label>
          ) : (
            <p className={`text-sm font-medium ${alumni?.availableForMentorship ? "text-emerald-400" : "text-slate-500"}`}>
              {alumni?.availableForMentorship ? "✓ Available for mentorship" : "Not available"}
            </p>
          )}
        </div>
      </div>

      {/* Bio */}
      <div className="bg-slate-900 border border-white/[0.07] rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 mb-1"><PiUser size={16} className="text-emerald-400" /><h3 className="text-white font-semibold text-sm">About</h3></div>
        {editing ? (
          <>
            <textarea rows={3} placeholder="Write about your experience and how you can help students…"
              value={form.bio} onChange={(e) => set("bio", e.target.value)} className={`${inp} resize-none`} maxLength={500} />
            <p className="text-slate-600 text-xs text-right">{form.bio.length}/500</p>
          </>
        ) : <p className="text-slate-300 text-sm leading-relaxed">{alumni?.bio || <span className="text-slate-600">No bio added yet.</span>}</p>}
      </div>

      {/* Skills */}
      <div className="bg-slate-900 border border-white/[0.07] rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 mb-1"><PiBriefcase size={16} className="text-emerald-400" /><h3 className="text-white font-semibold text-sm">Skills</h3></div>
        <div className="flex flex-wrap gap-2">
          {(editing ? form.skills : alumni?.skills ?? []).map((s) => (
            <span key={s} className="flex items-center gap-1.5 text-xs bg-slate-800 text-slate-300 px-3 py-1.5 rounded-full border border-white/[0.07]">
              {s}
              {editing && <button onClick={() => removeSkill(s)} className="text-slate-500 hover:text-red-400 transition-colors"><PiX size={11} /></button>}
            </span>
          ))}
          {!editing && !alumni?.skills?.length && <p className="text-slate-600 text-sm">No skills added.</p>}
        </div>
        {editing && (
          <div className="flex gap-2">
            <input type="text" placeholder="Add a skill" value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
              className={`${inp} flex-1`} />
            <button onClick={addSkill} className="px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-semibold hover:bg-emerald-500/20 transition-all">Add</button>
          </div>
        )}
      </div>

      {/* Social */}
      <div className="bg-slate-900 border border-white/[0.07] rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1"><PiLinkedinLogo size={16} className="text-emerald-400" /><h3 className="text-white font-semibold text-sm">Social Links</h3></div>
        {[{ label: "LinkedIn URL", key: "linkedIn", Icon: PiLinkedinLogo, color: "text-sky-400", placeholder: "https://linkedin.com/in/yourname" },
          { label: "GitHub URL",   key: "github",   Icon: PiGithubLogo,   color: "text-slate-300", placeholder: "https://github.com/yourname" }].map(({ label, key, Icon, color, placeholder }) => (
          <div key={key}>
            <label className={lbl}>{label}</label>
            {editing ? (
              <input type="url" placeholder={placeholder} value={form[key]} onChange={(e) => set(key, e.target.value)} className={inp} />
            ) : alumni?.[key] ? (
              <a href={alumni[key]} target="_blank" rel="noreferrer" className={`${color} text-sm hover:underline flex items-center gap-1.5`}><Icon size={14} />{alumni[key]}</a>
            ) : <p className="text-slate-600 text-sm">Not set</p>}
          </div>
        ))}
      </div>
    </div>
  );
};
export default Profile;
