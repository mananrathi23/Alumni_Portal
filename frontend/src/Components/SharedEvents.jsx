// SharedEvents.jsx — Events system for all roles
// canPost = true for Alumni, Teacher, Admin

import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Context } from "../main";
import {
  PiCalendarCheck, PiPlus, PiX, PiMapPin, PiLink, PiCircleNotch,
  PiClock, PiUser, PiCalendarBlank, PiCheck, PiTrash, PiPencilSimple,
  PiWarningCircle,
} from "react-icons/pi";

import RestrictedAccess from "./RestrictedAccess";

const API = `${import.meta.env.VITE_BACKEND_URL || "http://localhost:4000"}/api/v1/events`;
const EVENT_TYPES = ["seminar","workshop","webinar","hackathon","reunion","placement","other"];
const POSTER_ROLES = ["Admin", "Alumni", "Teacher"];

// today and max date (1 year ahead) for date inputs
const todayStr = () => new Date().toISOString().slice(0,10);
const maxDateStr = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0,10);
};

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-IN", { weekday:"short", day:"numeric", month:"short", year:"numeric" });
}
function daysUntil(iso) {
  const diff = Math.ceil((new Date(iso) - Date.now()) / 86400000);
  if (diff < 0) return null;
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return `In ${diff} days`;
}

// ── Event Form Modal ──────────────────────────────────────────────────────────
function EventModal({ existing, onClose, onSaved, accentColor }) {
  const isEdit = !!existing;
  const [form, setForm] = useState({
    title:                existing?.title                || "",
    description:          existing?.description          || "",
    date:                 existing?.date ? existing.date.slice(0,10) : "",
    time:                 existing?.time                 || "",
    location:             existing?.location             || "",
    link:                 existing?.link                 || "",
    type:                 existing?.type                 || "other",
    audience:             existing?.audience             || "All",
    registrationDeadline: existing?.registrationDeadline
      ? existing.registrationDeadline.slice(0,10) : "",
  });
  const [saving, setSaving] = useState(false);
  const set = (k,v) => setForm(p => ({ ...p, [k]: v }));

  const btnCls = {
    sky:"bg-sky-500 hover:bg-sky-400",
    emerald:"bg-emerald-500 hover:bg-emerald-400",
    violet:"bg-violet-500 hover:bg-violet-400",
    rose:"bg-rose-500 hover:bg-rose-400",
  }[accentColor] || "bg-sky-500";
  const inp = "w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-white/[0.07] text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all";
  const lbl = "block text-xs font-semibold text-slate-400 tracking-widest uppercase mb-1.5";

  const today  = todayStr();
  const maxDate = maxDateStr();

  const save = async () => {
    if (!form.title.trim())        { toast.error("Title is required."); return; }
    if (!form.description.trim())  { toast.error("Description is required."); return; }
    if (!form.date)                { toast.error("Date is required."); return; }
    if (!form.time.trim())         { toast.error("Time is required."); return; }
    if (!form.location.trim() && !form.link.trim()) {
      toast.error("Provide location or online link."); return;
    }
    // Frontend date guards
    if (form.date <= today) { toast.error("Event date must be in the future."); return; }
    if (form.date > maxDate) { toast.error("Event cannot be more than 1 year ahead."); return; }
    if (form.registrationDeadline) {
      if (form.registrationDeadline <= today) {
        toast.error("Registration deadline must be in the future."); return;
      }
      if (form.registrationDeadline >= form.date) {
        toast.error("Registration deadline must be before the event date."); return;
      }
    }

    setSaving(true);
    try {
      if (isEdit) {
        await axios.put(`${API}/${existing._id}`, form, { withCredentials: true });
      } else {
        await axios.post(API, form, { withCredentials: true });
      }
      toast.success(isEdit ? "Event updated!" : "Event created!");
      onSaved(); onClose();
    } catch(e) { toast.error(e.response?.data?.message || "Failed."); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-white/[0.07] rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
          <div>
            <h2 className="text-white font-bold">{isEdit ? "Edit Event" : "Create Event"}</h2>
            <p className="text-slate-500 text-xs mt-0.5">All times are in Indian Standard Time</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800"><PiX size={18}/></button>
        </div>

        <div className="px-5 py-5 space-y-4">
          <div>
            <label className={lbl}>Title *</label>
            <input value={form.title} onChange={e => set("title",e.target.value)} placeholder="Event title…" className={inp}/>
          </div>
          <div>
            <label className={lbl}>Description *</label>
            <textarea value={form.description} onChange={e => set("description",e.target.value)} rows={3} placeholder="What's this event about?" className={`${inp} resize-none`}/>
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Event Date *</label>
              <input type="date" value={form.date}
                min={new Date(Date.now()+86400000).toISOString().slice(0,10)}
                max={maxDate}
                onChange={e => set("date",e.target.value)} className={inp}/>
              <p className="text-slate-600 text-[10px] mt-1">Must be future, max 1 year ahead</p>
            </div>
            <div>
              <label className={lbl}>Time *</label>
              <input type="text" value={form.time} onChange={e => set("time",e.target.value)} placeholder="e.g. 3:00 PM" className={inp}/>
            </div>
          </div>

          {/* Registration Deadline */}
          <div>
            <label className={lbl}>Registration Deadline <span className="text-slate-600 normal-case font-normal">(optional)</span></label>
            <input type="date" value={form.registrationDeadline}
              min={new Date(Date.now()+86400000).toISOString().slice(0,10)}
              max={form.date || maxDate}
              onChange={e => set("registrationDeadline",e.target.value)} className={inp}/>
            <p className="text-slate-600 text-[10px] mt-1">Last date for participants to register — must be before event date</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Event Type</label>
              <select value={form.type} onChange={e => set("type",e.target.value)} className={inp}>
                {EVENT_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Target Audience</label>
              <select value={form.audience} onChange={e => set("audience",e.target.value)} className={inp}>
                {["All", "Student", "Alumni", "Teacher"].map(a => <option key={a} value={a}>{a === "All" ? "Post to All" : `Only ${a}s`}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={lbl}>Physical Location</label>
            <input value={form.location} onChange={e => set("location",e.target.value)} placeholder="Room / hall / address" className={inp}/>
          </div>
          <div>
            <label className={lbl}>Online Link</label>
            <input value={form.link} onChange={e => set("link",e.target.value)} placeholder="https://meet.google.com/…" className={inp}/>
          </div>
          <p className="text-slate-600 text-xs">* At least one of physical location or online link is required</p>
        </div>

        <div className="flex justify-end gap-3 px-5 pb-5">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-800 border border-white/[0.07] text-slate-300 text-sm font-medium hover:bg-slate-700 transition-all">Cancel</button>
          <button onClick={save} disabled={saving} className={`px-5 py-2 rounded-lg text-white text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-50 ${btnCls}`}>
            {saving && <PiCircleNotch size={14} className="animate-spin"/>}
            {isEdit ? "Save Changes" : "Create Event"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Event Card ────────────────────────────────────────────────────────────────
function EventCard({ event, currentUser, canPost, onEdit, onDelete, onToggleRegister, isRegistered }) {
  const now         = new Date();
  const isPast      = new Date(event.date) < now;
  const isOrganizer = event.organizer?.id === currentUser?._id?.toString()
                   || event.organizer?.id?.toString() === currentUser?._id?.toString();
  const countdown   = !isPast ? daysUntil(event.date) : null;

  const deadlinePassed = event.registrationDeadline && new Date(event.registrationDeadline) < now;
  const registrationOpen = !isPast && !deadlinePassed;

  const typeColors = {
    seminar:"bg-sky-500/15 text-sky-400 border-sky-500/25",
    workshop:"bg-violet-500/15 text-violet-400 border-violet-500/25",
    webinar:"bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
    hackathon:"bg-amber-500/15 text-amber-400 border-amber-500/25",
    reunion:"bg-pink-500/15 text-pink-400 border-pink-500/25",
    placement:"bg-orange-500/15 text-orange-400 border-orange-500/25",
    other:"bg-slate-500/15 text-slate-400 border-slate-500/25",
  };

  return (
    <div className={`bg-slate-900 border rounded-xl p-4 sm:p-5 space-y-3 ${isPast ? "border-white/[0.04] opacity-70" : "border-white/[0.07]"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${typeColors[event.type]||typeColors.other}`}>
              {event.type}
            </span>
            {event.audience && event.audience !== "All" && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-500/15 text-slate-400 border border-slate-500/25">
                {event.audience}s Only
              </span>
            )}
            {countdown && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                {countdown}
              </span>
            )}
            {isRegistered && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/25">
                ✓ Registered
              </span>
            )}
            {deadlinePassed && !isPast && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/25 flex items-center gap-1">
                <PiWarningCircle size={10}/> Registration Closed
              </span>
            )}
          </div>
          <h3 className="text-white font-semibold text-base">{event.title}</h3>
          <p className="text-slate-400 text-sm mt-1 leading-relaxed line-clamp-2">{event.description}</p>
        </div>
        {isOrganizer && (
          <div className="flex gap-1 flex-shrink-0">
            <button onClick={onEdit} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-all"><PiPencilSimple size={14}/></button>
            <button onClick={onDelete} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"><PiTrash size={14}/></button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-400">
        <div className="flex items-center gap-1.5"><PiCalendarBlank size={13} className="text-slate-500"/>{formatDate(event.date)}</div>
        <div className="flex items-center gap-1.5"><PiClock size={13} className="text-slate-500"/>{event.time}</div>
        {event.location && <div className="flex items-center gap-1.5"><PiMapPin size={13} className="text-slate-500"/>{event.location}</div>}
        {event.link && <a href={event.link} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sky-400 hover:underline"><PiLink size={13}/>Join Online</a>}
        <div className="flex items-center gap-1.5"><PiUser size={13} className="text-slate-500"/>{event.organizer?.name} · {event.organizer?.role}</div>
      </div>

      {/* Registration deadline notice */}
      {event.registrationDeadline && !isPast && (
        <div className={`flex items-center gap-1.5 text-xs rounded-lg px-3 py-1.5 w-fit ${
          deadlinePassed
            ? "bg-red-500/10 text-red-400 border border-red-500/20"
            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
        }`}>
          <PiCalendarBlank size={12}/>
          {deadlinePassed ? "Registration closed" : `Register by ${formatDate(event.registrationDeadline)}`}
        </div>
      )}

      {/* Register button — only for non-past, non-admin, non-organizer, registration open */}
      {!isPast && currentUser?.role !== "Admin" && !isOrganizer && (
        <div className="pt-1">
          <button
            onClick={onToggleRegister}
            disabled={!registrationOpen && !isRegistered}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              isRegistered
                ? "bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20"
                : "bg-sky-500/10 border border-sky-500/30 text-sky-400 hover:bg-sky-500/20"
            }`}
          >
            {isRegistered ? <><PiX size={14}/> Unregister</> : <><PiCheck size={14}/> Register</>}
          </button>
        </div>
      )}

      {/* Registered Students List for Admins & Organizers */}
      {(currentUser?.role === "Admin" || isOrganizer) && event.registeredStudents?.length > 0 && (
        <div className="mt-3 pt-3 border-t border-white/[0.04]">
          <p className="text-xs font-semibold text-slate-400 mb-2">Registered Students ({event.registeredStudents.length})</p>
          <div className="flex flex-wrap gap-2">
            {event.registeredStudents.map((s, i) => (
              <span key={i} className="text-[10px] px-2 py-1 rounded-md bg-slate-800 border border-white/[0.05] text-slate-300">
                {s.name || "Unknown"} {s.department && s.department !== "Not Set" ? `(${s.department})` : ""}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function SharedEvents({ role, accentColor = "sky" }) {
  const { user }               = useContext(Context);
  const canPost                = POSTER_ROLES.includes(role);
  const [tab, setTab]          = useState("upcoming");
  const [events, setEvents]    = useState([]);
  const [loading, setLoading]  = useState(true);
  const [showModal, setModal]  = useState(false);
  const [editing, setEditing]  = useState(null);
  const [registered, setReg]   = useState({});

  const btnCls = {
    sky:"bg-sky-500 hover:bg-sky-400 shadow-sky-500/30",
    emerald:"bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/30",
    violet:"bg-violet-500 hover:bg-violet-400 shadow-violet-500/30",
    rose:"bg-rose-500 hover:bg-rose-400 shadow-rose-500/30",
  }[accentColor] || "bg-sky-500 hover:bg-sky-400";

  const fetchEvents = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const view = tab === "mine" ? "mine" : tab;
      const res  = await axios.get(API, { params: { view }, withCredentials: true });
      setEvents(res.data.events || []);
      if (role === "Student") {
        const map = {};
        (res.data.events || []).forEach(e => {
          map[e._id] = (e.registeredStudents || []).map(s => typeof s === 'object' ? String(s._id) : String(s)).includes(user?._id?.toString());
        });
        setReg(map);
      }
    } catch { toast.error("Failed to load events."); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchEvents(true); }, [tab]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!editing && !showModal) {
        fetchEvents(false);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [tab, editing, showModal]);

  if (user && user.role !== "Admin" && !user.adminVerified) {
    return <RestrictedAccess />;
  }

  const deleteEvent = async (id) => {
    if (!window.confirm("Delete this event?")) return;
    try {
      await axios.delete(`${API}/${id}`, { withCredentials: true });
      setEvents(p => p.filter(e => e._id !== id));
      toast.success("Event removed.");
    } catch(e) { toast.error(e.response?.data?.message || "Failed."); }
  };

  const toggleRegister = async (id) => {
    try {
      const res = await axios.post(`${API}/${id}/register`, {}, { withCredentials: true });
      setReg(p => ({ ...p, [id]: res.data.registered }));
      toast.success(res.data.message);
      fetchEvents(false); // Refetch events to update registered students count and list
    } catch(e) { toast.error(e.response?.data?.message || "Failed."); }
  };

  const TABS = [
    { key:"upcoming", label:"Upcoming" },
    { key:"past",     label:"Past" },
    ...(canPost ? [{ key:"mine", label:"My Events" }] : []),
  ];

  const tabActiveCls = {
    sky:"bg-sky-500 text-white",
    emerald:"bg-emerald-500 text-white",
    violet:"bg-violet-500 text-white",
    rose:"bg-rose-500 text-white",
  }[accentColor] || "bg-sky-500 text-white";

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Events</h2>
          <p className="text-slate-400 text-sm mt-0.5">Seminars, workshops, placements and more</p>
        </div>
        {canPost && (
          <button onClick={() => setModal(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold transition-all shadow self-start sm:self-auto ${btnCls}`}>
            <PiPlus size={15}/> Create Event
          </button>
        )}
      </div>

      <div className="flex gap-1 bg-slate-900 border border-white/[0.07] rounded-xl p-1 w-fit">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${tab===t.key ? `${tabActiveCls} shadow` : "text-slate-400 hover:text-white hover:bg-slate-800"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="min-h-48 flex items-center justify-center"><PiCircleNotch size={28} className="text-slate-500 animate-spin"/></div>
      ) : events.length === 0 ? (
        <div className="min-h-64 flex flex-col items-center justify-center text-center bg-slate-900 border border-white/[0.07] rounded-xl">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center mb-4"><PiCalendarCheck size={28} className="text-slate-600"/></div>
          <p className="text-slate-300 font-semibold">No {tab} events</p>
          <p className="text-slate-500 text-sm mt-1">{canPost ? "Create one to get started!" : "Check back later."}</p>
          {canPost && <button onClick={() => setModal(true)} className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400 text-sm font-semibold hover:bg-sky-500/20 transition-all"><PiPlus size={14}/> Create Event</button>}
        </div>
      ) : (
        <div className="space-y-3">
          {events.map(e => (
            <EventCard key={e._id} event={e} currentUser={user} canPost={canPost}
              isRegistered={registered[e._id] || false}
              onEdit={() => setEditing(e)}
              onDelete={() => deleteEvent(e._id)}
              onToggleRegister={() => toggleRegister(e._id)}
            />
          ))}
        </div>
      )}

      {(showModal || editing) && (
        <EventModal
          existing={editing}
          accentColor={accentColor}
          onClose={() => { setModal(false); setEditing(null); }}
          onSaved={() => { setModal(false); setEditing(null); fetchEvents(); }}
        />
      )}
    </div>
  );
}
