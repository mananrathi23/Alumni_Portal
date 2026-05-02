import { useState, useEffect, useContext } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { useSocket } from "../../SocketContext";
import { Context } from "../../main";
import {
  PiHandshake, PiClock, PiPlus, PiCheck, PiX, PiChatCircleText,
  PiClockCountdown, PiToggleLeft, PiToggleRight,
  PiCalendarBlank, PiBookOpen, PiWarning, PiCircleNotch,
  PiGoogleLogo, PiCheckCircle, PiStar,
} from "react-icons/pi";

import RestrictedAccess from "../RestrictedAccess";

const API = `${import.meta.env.VITE_BACKEND_URL}/api/v1/mentorship`;
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ── Mentor Score & Badge component ────────────────────────────────────────────
const MentorScoreBadge = ({ score = 0, stats = {} }) => {
  const badge =
    score >= 8.5 ? { label: "🏆 Elite Mentor", cls: "bg-amber-500/15 text-amber-300 border-amber-500/30" } :
      score >= 6.5 ? { label: "⭐ Expert Mentor", cls: "bg-orange-500/15 text-orange-300 border-orange-500/30" } :
        score >= 4.5 ? { label: "🌟 Rising Mentor", cls: "bg-sky-500/15 text-sky-300 border-sky-500/30" } :
          score >= 2.0 ? { label: "🌱 New Mentor", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" } :
            { label: "Mentor", cls: "bg-slate-700 text-slate-400 border-slate-600" };

  return (
    <div className="bg-slate-900 border border-white/[0.07] rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-white font-semibold text-sm flex items-center gap-2">
          <PiStar className="text-amber-400" /> Your Mentor Score
        </p>
        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${badge.cls}`}>
          {badge.label}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-center">
          <p className="text-3xl font-bold text-white">{score.toFixed(1)}</p>
          <p className="text-slate-500 text-[10px] mt-0.5">out of 10</p>
        </div>
        <div className="flex-1 space-y-1.5">
          {[
            { label: "Rating", val: stats.averageRating ? `${stats.averageRating}★` : "—", w: ((stats.averageRating || 0) / 5) * 100 },
            { label: "Sessions", val: stats.totalSessions || 0, w: Math.min(((stats.totalSessions || 0) / 20) * 100, 100) },
            { label: "Jobs/Events", val: `${stats.jobsPosted || 0}/${stats.eventsOrganized || 0}`, w: Math.min(((stats.jobsPosted || 0) + (stats.eventsOrganized || 0)) / 20 * 100, 100) },
          ].map(({ label, val, w }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="text-slate-500 text-[10px] w-20 flex-shrink-0">{label}</span>
              <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${w}%` }} />
              </div>
              <span className="text-slate-400 text-[10px] w-10 text-right">{val}</span>
            </div>
          ))}
        </div>
      </div>
      <p className="text-slate-600 text-[10px]">
        Score improves with mentee ratings, completed sessions, jobs posted, and events organised.
      </p>
    </div>
  );
};
const TIMES = ["9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM", "8:00 PM", "9:00 PM"];
const GOAL_LABELS = {
  career: "Career Guidance", resume: "Resume Review",
  interview: "Interview Prep", technical: "Technical Help", general: "General Advice",
};

const GoalBadge = ({ goal }) => {
  const c = {
    career: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
    resume: "bg-sky-500/15 text-sky-400 border-sky-500/25",
    interview: "bg-amber-500/15 text-amber-400 border-amber-500/25",
    technical: "bg-violet-500/15 text-violet-400 border-violet-500/25",
    general: "bg-slate-500/15 text-slate-400 border-slate-500/25",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${c[goal] || c.general}`}>
      <PiBookOpen size={11} />{GOAL_LABELS[goal] || goal}
    </span>
  );
};

const TimeSlotManager = ({ slots, onChange }) => {
  const [day, setDay] = useState("Mon");
  const [time, setTime] = useState("10:00 AM");
  const addSlot = () => {
    if (!slots.find(s => s.day === day && s.time === time)) {
      onChange([...slots, { id: `${day}-${time}`, day, time, booked: false }]);
    }
  };
  const removeSlot = (id) => onChange(slots.filter(s => s.id !== id));
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-end">
        <div>
          <p className="text-xs text-slate-500 mb-1 font-medium">Day</p>
          <select value={day} onChange={e => setDay(e.target.value)}
            className="bg-slate-800 border border-white/[0.07] text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500">
            {DAYS.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1 font-medium">Time</p>
          <select value={time} onChange={e => setTime(e.target.value)}
            className="bg-slate-800 border border-white/[0.07] text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500">
            {TIMES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <button onClick={addSlot}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-sm font-semibold hover:bg-emerald-500/25 transition-all">
          <PiPlus size={14} /> Add Slot
        </button>
      </div>
      {slots.length === 0
        ? <p className="text-slate-600 text-sm italic py-2">No time slots added yet.</p>
        : (
          <div className="flex flex-wrap gap-2 mt-1">
            {slots.map(s => (
              <div key={s.id}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold ${s.booked
                    ? "bg-slate-800/50 border-slate-700 text-slate-500"
                    : "bg-slate-800 border-white/[0.07] text-slate-200"
                  }`}>
                <PiCalendarBlank size={12} className={s.booked ? "text-slate-600" : "text-emerald-400"} />
                {s.day} · {s.time}
                {s.booked
                  ? <span className="text-amber-400 text-[10px] font-bold ml-1">BOOKED</span>
                  : <button onClick={() => removeSlot(s.id)} className="ml-1 text-slate-600 hover:text-red-400 transition-colors"><PiX size={12} /></button>
                }
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
};

const Mentorship = () => {
  const { alumni, refreshAlumni } = useOutletContext();
  const navigate = useNavigate();
  const { user } = useContext(Context);
  const { socketRef, isSocketReady } = useSocket();

  const [tab, setTab] = useState("requests");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSaving] = useState(false);
  const [weeklyLimit, setWeeklyLimit] = useState(alumni?.weeklyLimit || 5);
  const [weeklyStats, setWeeklyStats] = useState(null);
  const [mentorStats, setMentorStats] = useState(alumni?.mentorStats || null);
  const [respondingId, setRespondingId] = useState(null);

  // Google Calendar link state
  const [googleLinked, setGoogleLinked] = useState(false);
  const [linkingGoogle, setLinkingGoogle] = useState(false);

  const [available, setAvailable] = useState(alumni?.availableForMentorship ?? false);
  const [slots, setSlots] = useState(
    (alumni?.mentorshipSlots || []).map(s => ({ ...s, id: s.id || `${s.day}-${s.time}` }))
  );

  useEffect(() => {
    if (alumni) {
      setAvailable(alumni.availableForMentorship ?? false);
      setSlots((alumni.mentorshipSlots || []).map(s => ({ ...s, id: s.id || `${s.day}-${s.time}` }))); if (alumni.mentorStats) setMentorStats(alumni.mentorStats);
    }
  }, [alumni]);

  const fetchRequests = async () => {
    try {
      const res = await axios.get(`${API}/requests`, { withCredentials: true });
      setRequests(res.data.requests || []);
    } catch { toast.error("Failed to load requests."); }
    finally { setLoading(false); }
  };

  // Check if this mentor has already linked Google Calendar
  const fetchGoogleStatus = async () => {
    try {
      const res = await axios.get(`${API}/auth/status`, { withCredentials: true });
      setGoogleLinked(res.data.linked);
    } catch { /* silent */ }
  };

  const fetchStats = async () => {
    try {
      const r = await axios.get(`${API}/my-stats`, { withCredentials: true });
      setWeeklyStats(r.data.weeklyCount ?? 0);
      setWeeklyLimit(r.data.weeklyLimit || 5);
      setMentorStats(r.data.stats || null);
      if (refreshAlumni) refreshAlumni();
    } catch { }
  };

  useEffect(() => {
    fetchRequests();
    fetchGoogleStatus();
    fetchStats();
  }, []);

  // ── Google Calendar link handler ─────────────────────────────────────────
  const handleLinkGoogle = async () => {
    setLinkingGoogle(true);
    // Clear any old signal
    localStorage.removeItem("google-linked");

    try {
      const res = await axios.get(`${API}/auth/google`, { withCredentials: true });
      window.open(res.data.url, "_blank", "width=520,height=640");

      // Poll localStorage for the signal set by /google-linked page
      const checkInterval = setInterval(() => {
        if (localStorage.getItem("google-linked")) {
          clearInterval(checkInterval);
          localStorage.removeItem("google-linked");
          setGoogleLinked(true);
          setLinkingGoogle(false);
          toast.success("✅ Google Calendar linked! Meet links will now be auto-generated.");
        }
      }, 800);

      // Give up after 5 minutes
      setTimeout(() => {
        clearInterval(checkInterval);
        setLinkingGoogle(false);
        // Re-check from server in case it succeeded silently
        fetchGoogleStatus();
      }, 5 * 60 * 1000);

    } catch {
      toast.error("Failed to connect to Google. Please try again.");
      setLinkingGoogle(false);
    }
  };

  useEffect(() => {
    if (!isSocketReady || !socketRef.current) return;
    const socket = socketRef.current;
    const onNew = (data) => { toast.info(`📩 New request from ${data.student?.name}!`); fetchRequests(); };
    const onCancelled = (data) => { toast.info(`${data.studentName} cancelled their request.`); fetchRequests(); };
    const onResponded = () => fetchRequests();
    const onCompleted = (data) => {
      if (data?.studentName) toast.info(`Session with ${data.studentName} marked completed.`);
      fetchRequests();
      fetchStats();
    };
    const onRating = (data) => {
      toast.success(`⭐ New feedback received${data?.studentName ? ` from ${data.studentName}` : ""}.`);
      fetchRequests();
      fetchStats();
    };
    socket.on("mentorship:new_request", onNew);
    socket.on("mentorship:request_cancelled", onCancelled);
    socket.on("mentorship:request_responded", onResponded);
    socket.on("mentorship:completed", onCompleted);
    socket.on("mentorship:rating_submitted", onRating);
    return () => {
      socket.off("mentorship:new_request", onNew);
      socket.off("mentorship:request_cancelled", onCancelled);
      socket.off("mentorship:request_responded", onResponded);
      socket.off("mentorship:completed", onCompleted);
      socket.off("mentorship:rating_submitted", onRating);
    };
  }, [isSocketReady]);

  const respond = async (id, status) => {
    setRespondingId(id);
    try {
      const res = await axios.put(`${API}/requests/${id}/respond`, { status }, { withCredentials: true });
      setRequests(prev => prev.map(r => r._id === id ? res.data.mentorship : r));
      if (status === "Accepted") {
        const acc = requests.find(r => r._id === id);
        if (acc) setSlots(prev => prev.map(s =>
          s.day === acc.slot?.day && s.time === acc.slot?.time ? { ...s, booked: true } : s
        ));
        const link = res.data.mentorship?.meetingLink;
        if (link) toast.success(`✅ Request accepted! Meet link: ${link}`);
        else toast.success("✅ Request accepted! Share a meeting link via chat.");
      } else {
        toast.success("Request declined.");
      }
    } catch (err) { toast.error(err.response?.data?.message || "Failed."); }
    finally { setRespondingId(null); }
  };

  const completeSession = async (id) => {
    try {
      await axios.put(`${API}/requests/${id}/complete`, {}, { withCredentials: true });
      const comp = requests.find(r => r._id === id);
      setRequests(prev => prev.map(r => r._id === id ? { ...r, status: "Completed" } : r));
      if (comp) setSlots(prev => prev.map(s =>
        s.day === comp.slot?.day && s.time === comp.slot?.time ? { ...s, booked: false } : s
      ));
      toast.success("Session marked as completed.");
    } catch (err) { toast.error(err.response?.data?.message || "Failed."); }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await Promise.all([
        axios.put(`${API}/settings`, { availableForMentorship: available, mentorshipSlots: slots }, { withCredentials: true }),
        axios.put(`${API}/weekly-limit`, { weeklyLimit }, { withCredentials: true }),
      ]);
      toast.success("Settings saved.");
      // ✅ Refresh parent layout so header badge reflects new availability
      if (refreshAlumni) refreshAlumni();
    } catch (err) { toast.error(err.response?.data?.message || "Failed to save."); }
    finally { setSaving(false); }
  };

  const pending = requests.filter(r => r.status === "Pending");
  const active = requests.filter(r => r.status === "Accepted");
  const completed = requests.filter(r => r.status === "Completed");
  const TABS = [
    { key: "requests", label: "Requests", count: pending.length },
    { key: "settings", label: "My Settings", count: null },
    { key: "history", label: "History", count: completed.length },
  ];

  if (user && user.role !== "Admin" && !user.adminVerified) {
    return <RestrictedAccess />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Mentorship</h2>
          <p className="text-slate-400 text-sm mt-0.5">Manage your availability, requests, and sessions</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-3 py-1 rounded-full border ${available ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400" : "bg-slate-800 border-slate-700 text-slate-500"}`}>
            {available ? "● Available" : "○ Unavailable"}
          </span>
          {pending.length > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">{pending.length} Pending</span>
          )}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Pending", value: pending.length, color: "amber" },
          { label: "Active", value: active.length, color: "emerald" },
          { label: "Completed", value: completed.length, color: "sky" },
        ].map(({ label, value, color }) => {
          const c = {
            amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
            emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
            sky: "text-sky-400 bg-sky-500/10 border-sky-500/20",
          }[color];
          return (
            <div key={label} className={`rounded-xl p-4 border ${c} text-center`}>
              <p className={`text-2xl font-bold ${c.split(" ")[0]}`}>{value}</p>
              <p className="text-slate-400 text-xs mt-0.5 font-medium">{label}</p>
            </div>
          );
        })}
      </div>

      {/* Mentor Score & Badge */}
      {weeklyStats !== null && (
        <MentorScoreBadge score={(mentorStats || alumni?.mentorStats)?.score || 0}
          stats={mentorStats || alumni?.mentorStats || {}} />
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-900 border border-white/[0.07] rounded-xl p-1">
        {TABS.map(({ key, label, count }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${tab === key ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30" : "text-slate-400 hover:text-white"
              }`}>
            {label}
            {count !== null && count > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tab === key ? "bg-emerald-500/30 text-emerald-300" : "bg-slate-700 text-slate-400"
                }`}>{count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── REQUESTS TAB ── */}
      {tab === "requests" && (
        <div className="space-y-3">
          {loading ? (
            <div className="min-h-48 flex items-center justify-center">
              <PiCircleNotch size={28} className="text-emerald-400 animate-spin" />
            </div>
          ) : requests.length === 0 ? (
            <div className="min-h-60 flex flex-col items-center justify-center text-center bg-slate-900 border border-white/[0.07] rounded-xl px-6">
              <PiHandshake size={28} className="text-slate-600 mb-3" />
              <p className="text-slate-300 font-semibold">No requests yet</p>
              <p className="text-slate-500 text-sm mt-1">Enable availability in Settings so students can find you.</p>
            </div>
          ) : (
            <>
              {pending.length > 0 && (
                <>
                  <p className="text-xs text-slate-500 font-semibold tracking-widest uppercase mb-2 px-1">Pending Requests</p>
                  {pending.map(r => {
                    const slotTaken = slots.find(s => s.day === r.slot?.day && s.time === r.slot?.time && s.booked);
                    const isResponding = respondingId === r._id;
                    return (
                      <div key={r._id} className="bg-slate-900 border border-white/[0.07] rounded-xl p-4 sm:p-5 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                              {r.student?.name?.charAt(0) || "?"}
                            </div>
                            <div>
                              <p className="text-white font-semibold text-sm">{r.student?.name}</p>
                              <p className="text-slate-500 text-xs">{r.student?.year} · {r.student?.department}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <GoalBadge goal={r.goal} />
                            <span className="text-slate-600 text-xs">{new Date(r.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {r.note && (
                          <p className="text-slate-400 text-sm bg-slate-800/60 border border-white/[0.04] rounded-lg px-3 py-2 leading-relaxed">"{r.note}"</p>
                        )}

                        <div className="flex items-center gap-2">
                          <PiClock size={13} className="text-slate-500" />
                          <span className="text-slate-400 text-xs">
                            Requested: <span className="text-slate-200 font-medium">{r.slot?.day} · {r.slot?.time}</span>
                          </span>
                          {slotTaken && (
                            <span className="flex items-center gap-1 text-amber-400 text-xs font-semibold ml-2">
                              <PiWarning size={12} /> Slot Booked
                            </span>
                          )}
                        </div>

                        {/* Google not linked — gentle nudge */}
                        {!googleLinked && (
                          <div className="flex items-start gap-2 bg-sky-500/10 border border-sky-500/20 rounded-lg p-3">
                            <span className="text-sky-400 text-xs">💡 Link Google Calendar in Settings to auto-generate a Meet link when you accept.</span>
                          </div>
                        )}

                        {slotTaken && (
                          <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                            <PiWarning size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
                            <p className="text-amber-300 text-xs">This slot is already booked. Accepting will fail — ask the student to choose another time.</p>
                          </div>
                        )}

                        <div className="flex gap-2 pt-1">
                          <button onClick={() => respond(r._id, "Rejected")} disabled={isResponding}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold hover:bg-red-500/20 transition-all disabled:opacity-50">
                            <PiX size={14} /> Decline
                          </button>
                          <button onClick={() => respond(r._id, "Accepted")} disabled={isResponding || !!slotTaken}
                            className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold transition-all shadow shadow-emerald-500/30 disabled:opacity-50">
                            {isResponding ? <PiCircleNotch size={14} className="animate-spin" /> : <PiCheck size={14} />}
                            Accept & Book Slot
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {active.length > 0 && (
                <>
                  <p className="text-xs text-slate-500 font-semibold tracking-widest uppercase mb-2 px-1 mt-4">Active Mentorships</p>
                  {active.map(r => (
                    <div key={r._id} className="bg-slate-900 border border-emerald-500/20 rounded-xl p-4 sm:p-5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                            {r.student?.name?.charAt(0) || "?"}
                          </div>
                          <div>
                            <p className="text-white font-semibold text-sm">{r.student?.name}</p>
                            <p className="text-slate-500 text-xs">{r.student?.year} · {r.student?.department}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <GoalBadge goal={r.goal} />
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">Active</span>
                        </div>
                      </div>

                      {/* Show auto-generated Meet link if available */}
                      {r.meetingLink && (
                        <div className="mt-3 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
                          <PiCheckCircle size={14} className="text-emerald-400 flex-shrink-0" />
                          <a href={r.meetingLink} target="_blank" rel="noreferrer"
                            className="text-emerald-400 text-xs font-semibold hover:underline truncate">
                            {r.meetingLink}
                          </a>
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/[0.05]">
                        <PiClock size={13} className="text-slate-500" />
                        <span className="text-slate-400 text-xs">Slot: <span className="text-slate-200 font-medium">{r.slot?.day} · {r.slot?.time}</span></span>
                        <div className="flex gap-2 ml-auto">
                          <button onClick={() => completeSession(r._id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-white/[0.07] text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-all">
                            <PiCheck size={13} /> Mark Complete
                          </button>
                          <button onClick={() => navigate(`/alumni/messages?session=${r._id}`)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/25 transition-all">
                            <PiChatCircleText size={13} /> Open Chat
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* ── SETTINGS TAB ── */}
      {tab === "settings" && (
        <div className="space-y-4">

          {/* ── Google Calendar Card ── */}
          <div className="bg-slate-900 border border-white/[0.07] rounded-xl p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-white font-semibold text-sm flex items-center gap-2">
                  Google Calendar
                  {googleLinked && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                      ✓ Linked
                    </span>
                  )}
                </p>
                <p className="text-slate-500 text-xs mt-0.5">
                  {googleLinked
                    ? "Meet links are auto-generated when you accept requests."
                    : "Link once to auto-generate Google Meet links when you accept requests."
                  }
                </p>
              </div>
              {googleLinked ? (
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-sm font-semibold">
                  <PiCheckCircle size={16} /> Connected
                </div>
              ) : (
                <button
                  onClick={handleLinkGoogle}
                  disabled={linkingGoogle}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400 text-sm font-semibold hover:bg-blue-500/25 transition-all disabled:opacity-50 whitespace-nowrap">
                  {linkingGoogle
                    ? <PiCircleNotch size={14} className="animate-spin" />
                    : <PiGoogleLogo size={14} />
                  }
                  {linkingGoogle ? "Connecting…" : "Link Google"}
                </button>
              )}
            </div>
          </div>

          {/* ── Available for Mentorship ── */}
          <div className="bg-slate-900 border border-white/[0.07] rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-semibold text-sm">Available for Mentorship</p>
                <p className="text-slate-500 text-xs mt-0.5">Students can find and request you when enabled</p>
              </div>
              <button onClick={() => setAvailable(p => !p)}>
                {available
                  ? <PiToggleRight size={36} className="text-emerald-400" />
                  : <PiToggleLeft size={36} className="text-slate-600" />
                }
              </button>
            </div>
          </div>

          {/* ── Weekly limit ── */}
          <div className="bg-slate-900 border border-white/[0.07] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-white font-semibold text-sm">Weekly Session Limit</p>
                <p className="text-slate-500 text-xs mt-0.5">Max mentorship sessions you'll accept per week</p>
              </div>
              <span className="text-2xl font-bold text-emerald-400">{weeklyLimit}</span>
            </div>
            <input type="range" min={1} max={20} value={weeklyLimit}
              onChange={e => setWeeklyLimit(Number(e.target.value))}
              className="w-full accent-emerald-500" />
            <div className="flex justify-between text-xs text-slate-600 mt-1"><span>1</span><span>10</span><span>20</span></div>
            {weeklyStats !== null && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>{weeklyStats} of {weeklyLimit} sessions this week</span>
                  <span className={weeklyStats >= weeklyLimit ? "text-red-400 font-semibold" : "text-emerald-400"}>
                    {weeklyStats >= weeklyLimit ? "Limit reached" : `${weeklyLimit - weeklyStats} remaining`}
                  </span>
                </div>
                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${weeklyStats >= weeklyLimit ? "bg-red-500" : "bg-emerald-500"}`}
                    style={{ width: `${Math.min((weeklyStats / weeklyLimit) * 100, 100)}%` }} />
                </div>
              </div>
            )}
          </div>

          {/* ── Time Slots ── */}
          <div className="bg-slate-900 border border-white/[0.07] rounded-xl p-5">
            <div className="mb-4">
              <p className="text-white font-semibold text-sm">Available Time Slots</p>
              <p className="text-slate-500 text-xs mt-0.5">Students can only request during these times.</p>
            </div>
            <TimeSlotManager slots={slots} onChange={setSlots} />
          </div>

          <button onClick={saveSettings} disabled={savingSettings}
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold transition-all shadow shadow-emerald-500/30 disabled:opacity-50 flex items-center justify-center gap-2">
            {savingSettings && <PiCircleNotch size={16} className="animate-spin" />}
            {savingSettings ? "Saving…" : "Save Settings"}
          </button>
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {tab === "history" && (
        <div className="space-y-3">
          {completed.length === 0 ? (
            <div className="min-h-60 flex flex-col items-center justify-center text-center bg-slate-900 border border-white/[0.07] rounded-xl px-6">
              <PiClockCountdown size={28} className="text-slate-600 mb-3" />
              <p className="text-slate-300 font-semibold">No sessions completed yet</p>
            </div>
          ) : completed.map(h => (
            <div key={h._id} className="bg-slate-900 border border-white/[0.07] rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white font-bold text-sm">
                    {h.student?.name?.charAt(0) || "?"}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{h.student?.name}</p>
                    <p className="text-slate-500 text-xs">{new Date(h.completedAt || h.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <GoalBadge goal={h.goal} />
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <PiClock size={12} /> {h.slot?.day} · {h.slot?.time}
              </div>
              {h.rating?.value && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(s => (
                      <span key={s} className={s <= h.rating.value ? "text-amber-400 text-sm" : "text-slate-600 text-sm"}>★</span>
                    ))}
                    <span className="text-slate-500 text-xs ml-1">Student rating</span>
                  </div>
                  {h.rating.feedback && (
                    <p className="text-slate-500 text-xs italic bg-slate-800/50 rounded-lg px-3 py-2">"{h.rating.feedback}"</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Mentorship;