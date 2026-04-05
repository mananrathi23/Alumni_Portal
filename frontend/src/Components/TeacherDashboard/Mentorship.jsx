import { useState, useEffect, useContext } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { useSocket } from "../../SocketContext";
import { Context } from "../../main";
import {
  PiHandshake, PiClock, PiPlus, PiCheck, PiX, PiChatCircleText,
  PiStar, PiStarFill, PiClockCountdown, PiToggleLeft, PiToggleRight,
  PiCalendarBlank, PiNotePencil, PiBookOpen, PiWarning, PiChalkboardTeacher,
  PiCircleNotch,
} from "react-icons/pi";

const API  = "http://localhost:4000/api/v1/mentorship";
const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const TIMES = ["9:00 AM","10:00 AM","11:00 AM","12:00 PM","2:00 PM","3:00 PM","4:00 PM","5:00 PM","6:00 PM","7:00 PM"];
const GOAL_LABELS = {
  career:"Career Guidance", resume:"Resume Review",
  interview:"Interview Prep", technical:"Technical Help", general:"General Advice",
};

const GoalBadge = ({ goal }) => {
  const c = {
    career:"bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
    resume:"bg-sky-500/15 text-sky-400 border-sky-500/25",
    interview:"bg-amber-500/15 text-amber-400 border-amber-500/25",
    technical:"bg-violet-500/15 text-violet-400 border-violet-500/25",
    general:"bg-slate-500/15 text-slate-400 border-slate-500/25",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${c[goal]||c.general}`}>
      <PiBookOpen size={11}/>{GOAL_LABELS[goal]||goal}
    </span>
  );
};

const TimeSlotManager = ({ slots, onChange }) => {
  const [day, setDay]   = useState("Mon");
  const [time, setTime] = useState("10:00 AM");

  const addSlot = () => {
    if (!slots.find(s => s.day === day && s.time === time)) {
      const id = `${day}-${time}`;
      onChange([...slots, { id, day, time, booked: false }]);
    }
  };
  const removeSlot = (id) => onChange(slots.filter(s => s.id !== id));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-end">
        <div>
          <p className="text-xs text-slate-500 mb-1 font-medium">Day</p>
          <select value={day} onChange={e => setDay(e.target.value)}
            className="bg-slate-800 border border-white/[0.07] text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500">
            {DAYS.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1 font-medium">Time</p>
          <select value={time} onChange={e => setTime(e.target.value)}
            className="bg-slate-800 border border-white/[0.07] text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500">
            {TIMES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <button onClick={addSlot}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-500/15 border border-violet-500/30 text-violet-400 text-sm font-semibold hover:bg-violet-500/25 transition-all">
          <PiPlus size={14}/> Add Slot
        </button>
      </div>
      {slots.length === 0
        ? <p className="text-slate-600 text-sm italic py-2">No time slots added yet.</p>
        : (
          <div className="flex flex-wrap gap-2 mt-1">
            {slots.map(s => (
              <div key={s.id}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold ${
                  s.booked ? "bg-slate-800/50 border-slate-700 text-slate-500" : "bg-slate-800 border-white/[0.07] text-slate-200"
                }`}>
                <PiCalendarBlank size={12} className={s.booked ? "text-slate-600" : "text-violet-400"}/>
                {s.day} · {s.time}
                {s.booked
                  ? <span className="text-amber-400 text-[10px] font-bold ml-1">BOOKED</span>
                  : <button onClick={() => removeSlot(s.id)} className="ml-1 text-slate-600 hover:text-red-400 transition-colors"><PiX size={12}/></button>
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
  const { teacher }          = useOutletContext();
  const navigate             = useNavigate();
  const { user }             = useContext(Context);
  const { socketRef, isSocketReady } = useSocket();

  const [tab, setTab]               = useState("requests");
  const [requests, setRequests]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [respondingId, setRespondingId]     = useState(null);
  const [notesTarget, setNotesTarget]       = useState(null);
  const [weeklyLimit, setWeeklyLimit]       = useState(teacher?.weeklyLimit || 5);
  const [mentorStats, setMentorStats]   = useState(null);
  const [weeklyStats, setWeeklyStats]       = useState(null);

  // Settings — initialise from teacher object
  const [available, setAvailable] = useState(teacher?.availableForMentorship ?? false);
  const [slots, setSlots]         = useState(
    (teacher?.mentorshipSlots || []).map(s => ({ ...s, id: s.id || `${s.day}-${s.time}` }))
  );

  // ── Fetch requests ────────────────────────────────────────────────────────
  const fetchRequests = async () => {
    try {
      const res = await axios.get(`${API}/requests`, { withCredentials: true });
      setRequests(res.data.requests || []);
    } catch { toast.error("Failed to load mentorship requests."); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchRequests();
    fetchSettings();
    axios.get("http://localhost:4000/api/v1/mentorship/my-stats", { withCredentials: true })
      .then(r => { setWeeklyStats(r.data.weeklyCount ?? 0); setMentorStats(r.data.stats); })
      .catch(() => {});
  }, []);

  // ── Socket listeners for real-time updates ────────────────────────────────
  useEffect(() => {
    if (!isSocketReady || !socketRef.current) return;
    const socket = socketRef.current;

    const onNewRequest = (data) => {
      toast.info(`📩 New mentorship request from ${data.student?.name || "a student"}!`);
      fetchRequests();
    };
    const onCancelled = (data) => {
      toast.info(`${data.studentName} cancelled their mentorship request.`);
      fetchRequests();
    };
    const onResponded = () => fetchRequests();

    socket.on("mentorship:new_request",       onNewRequest);
    socket.on("mentorship:request_cancelled", onCancelled);
    socket.on("mentorship:request_responded", onResponded);

    return () => {
      socket.off("mentorship:new_request",       onNewRequest);
      socket.off("mentorship:request_cancelled", onCancelled);
      socket.off("mentorship:request_responded", onResponded);
    };
  }, [isSocketReady]);

  // ── Respond to a request ──────────────────────────────────────────────────
  const respond = async (id, status) => {
    setRespondingId(id);
    try {
      const res = await axios.put(`${API}/requests/${id}/respond`, { status }, { withCredentials: true });
      setRequests(prev => prev.map(r => r._id === id ? res.data.mentorship : r));
      // Also update slot state to reflect booking
      if (status === "Accepted") {
        const accepted = requests.find(r => r._id === id);
        if (accepted) {
          setSlots(prev => prev.map(s =>
            s.day === accepted.slot?.day && s.time === accepted.slot?.time ? { ...s, booked: true } : s
          ));
        }
      }
      toast.success(`Request ${status === "Accepted" ? "accepted ✅" : "declined"}.`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to respond.");
    } finally { setRespondingId(null); }
  };

  // ── Complete a session ────────────────────────────────────────────────────
  const completeSession = async (id) => {
    try {
      await axios.put(`${API}/requests/${id}/complete`, {}, { withCredentials: true });
      setRequests(prev => prev.map(r => r._id === id ? { ...r, status: "Completed" } : r));
      const completed = requests.find(r => r._id === id);
      if (completed) {
        setSlots(prev => prev.map(s =>
          s.day === completed.slot?.day && s.time === completed.slot?.time ? { ...s, booked: false } : s
        ));
      }
      toast.success("Session marked as completed.");
    } catch (err) { toast.error(err.response?.data?.message || "Failed."); }
  };

  // ── Save settings ─────────────────────────────────────────────────────────
  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      await Promise.all([
        axios.put(`${API}/settings`, { availableForMentorship: available, mentorshipSlots: slots }, { withCredentials: true }),
        axios.put(`${API}/weekly-limit`, { weeklyLimit }, { withCredentials: true }),
      ]);
      toast.success("Settings saved.");
    } catch (err) { toast.error(err.response?.data?.message || "Failed to save settings."); }
    finally { setSavingSettings(false); }
  };

  const pending   = requests.filter(r => r.status === "Pending");
  const active    = requests.filter(r => r.status === "Accepted");
  const completed = requests.filter(r => r.status === "Completed");

  const TABS = [
    { key:"requests", label:"Requests",    count: pending.length },
    { key:"settings", label:"My Settings", count: null },
    { key:"history",  label:"History",     count: completed.length },
  ];

  // ── If chat is open, show it ───────────────────────────────────────────────


  return (
    <div className="max-w-4xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Mentorship</h2>
          <p className="text-slate-400 text-sm mt-0.5">Guide students with your expertise</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-3 py-1 rounded-full border ${available ? "bg-violet-500/15 border-violet-500/30 text-violet-400" : "bg-slate-800 border-slate-700 text-slate-500"}`}>
            {available ? "● Available" : "○ Unavailable"}
          </span>
          {pending.length > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">{pending.length} Pending</span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label:"Pending",   value: pending.length,   color:"amber" },
          { label:"Active",    value: active.length,    color:"violet" },
          { label:"Completed", value: completed.length, color:"sky" },
        ].map(({ label, value, color }) => {
          const c = { amber:"text-amber-400 bg-amber-500/10 border-amber-500/20", violet:"text-violet-400 bg-violet-500/10 border-violet-500/20", sky:"text-sky-400 bg-sky-500/10 border-sky-500/20" }[color];
          return (
            <div key={label} className={`rounded-xl p-4 border ${c} text-center`}>
              <p className={`text-2xl font-bold ${c.split(" ")[0]}`}>{value}</p>
              <p className="text-slate-400 text-xs mt-0.5 font-medium">{label}</p>
            </div>
          );
        })}
      </div>

      {/* ── Mentor performance stats ── */}
      {mentorStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label:"Avg Rating", value: mentorStats.averageRating > 0 ? `${mentorStats.averageRating}★` : "—", sub: `${mentorStats.totalRatings} review${mentorStats.totalRatings !== 1 ? "s" : ""}` },
            { label:"Sessions", value: mentorStats.totalSessions, sub:"completed" },
            { label:"Accept Rate", value: `${mentorStats.acceptanceRate}%`, sub:"of requests" },
            { label:"Rank Score", value: mentorStats.score > 0 ? mentorStats.score.toFixed(1) : "—", sub: mentorStats.score >= 4 ? "⭐ Top Mentor" : mentorStats.score >= 3 ? "🔥 Rising" : "New" },
          ].map(({label, value, sub}) => (
            <div key={label} className="bg-slate-900 border border-white/[0.07] rounded-xl p-3 text-center">
              <p className="text-violet-400 text-lg font-bold">{value}</p>
              <p className="text-slate-400 text-[11px] font-medium">{label}</p>
              <p className="text-slate-600 text-[10px]">{sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-900 border border-white/[0.07] rounded-xl p-1">
        {TABS.map(({ key, label, count }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === key ? "bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/30" : "text-slate-400 hover:text-white"
            }`}>
            {label}
            {count !== null && count > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tab === key ? "bg-violet-500/30 text-violet-300" : "bg-slate-700 text-slate-400"}`}>{count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── REQUESTS TAB ── */}
      {tab === "requests" && (
        <div className="space-y-3">
          {loading ? (
            <div className="min-h-48 flex items-center justify-center">
              <PiCircleNotch size={28} className="text-violet-400 animate-spin"/>
            </div>
          ) : requests.length === 0 ? (
            <div className="min-h-60 flex flex-col items-center justify-center text-center bg-slate-900 border border-white/[0.07] rounded-xl px-6">
              <PiChalkboardTeacher size={28} className="text-slate-600 mb-3"/>
              <p className="text-slate-300 font-semibold">No requests yet</p>
              <p className="text-slate-500 text-sm mt-1">Enable availability in Settings so students can find you.</p>
            </div>
          ) : (
            <>
              {/* Pending */}
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
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                              {r.student?.name?.charAt(0) || "?"}
                            </div>
                            <div>
                              <p className="text-white font-semibold text-sm">{r.student?.name}</p>
                              <p className="text-slate-500 text-xs">{r.student?.year} · {r.student?.department}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <GoalBadge goal={r.goal}/>
                            <span className="text-slate-600 text-xs">{new Date(r.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {r.note && (
                          <p className="text-slate-400 text-sm bg-slate-800/60 border border-white/[0.04] rounded-lg px-3 py-2 leading-relaxed">"{r.note}"</p>
                        )}

                        <div className="flex items-center gap-2">
                          <PiClock size={13} className="text-slate-500"/>
                          <span className="text-slate-400 text-xs">
                            Requested: <span className="text-slate-200 font-medium">{r.slot?.day} · {r.slot?.time}</span>
                          </span>
                          {slotTaken && (
                            <span className="flex items-center gap-1 text-amber-400 text-xs font-semibold ml-2">
                              <PiWarning size={12}/> Slot Booked
                            </span>
                          )}
                        </div>

                        {slotTaken && (
                          <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                            <PiWarning size={14} className="text-amber-400 flex-shrink-0 mt-0.5"/>
                            <p className="text-amber-300 text-xs">This slot is already booked. Accepting will fail — ask the student to choose another time.</p>
                          </div>
                        )}

                        <div className="flex gap-2 pt-1">
                          <button onClick={() => respond(r._id, "Rejected")} disabled={isResponding}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold hover:bg-red-500/20 transition-all disabled:opacity-50">
                            <PiX size={14}/> Decline
                          </button>
                          <button onClick={() => respond(r._id, "Accepted")} disabled={isResponding || !!slotTaken}
                            className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-violet-500 hover:bg-violet-400 text-white text-sm font-bold transition-all shadow shadow-violet-500/30 disabled:opacity-50">
                            {isResponding ? <PiCircleNotch size={14} className="animate-spin"/> : <PiCheck size={14}/>}
                            Accept & Book Slot
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {/* Active */}
              {active.length > 0 && (
                <>
                  <p className="text-xs text-slate-500 font-semibold tracking-widest uppercase mb-2 px-1 mt-4">Active Mentorships</p>
                  {active.map(r => (
                    <div key={r._id} className="bg-slate-900 border border-violet-500/20 rounded-xl p-4 sm:p-5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center text-white font-bold text-sm">
                            {r.student?.name?.charAt(0) || "?"}
                          </div>
                          <div>
                            <p className="text-white font-semibold text-sm">{r.student?.name}</p>
                            <p className="text-slate-500 text-xs">{r.student?.year} · {r.student?.department}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <GoalBadge goal={r.goal}/>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/25">Active</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/[0.05]">
                        <PiClock size={13} className="text-slate-500"/>
                        <span className="text-slate-400 text-xs">Slot: <span className="text-slate-200 font-medium">{r.slot?.day} · {r.slot?.time}</span></span>
                        <div className="flex gap-2 ml-auto">
                          <button onClick={() => completeSession(r._id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-white/[0.07] text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-all">
                            <PiCheck size={13}/> Mark Complete
                          </button>
                          <button onClick={() => navigate(`/teacher/messages?session=${r._id}`)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/15 border border-violet-500/30 text-violet-400 text-xs font-semibold hover:bg-violet-500/25 transition-all">
                            <PiChatCircleText size={13}/> Open Chat
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
          <div className="bg-slate-900 border border-white/[0.07] rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-semibold text-sm">Available for Mentorship</p>
                <p className="text-slate-500 text-xs mt-0.5">Students can find and request you when enabled</p>
              </div>
              <button onClick={() => setAvailable(p => !p)}>
                {available ? <PiToggleRight size={36} className="text-violet-400"/> : <PiToggleLeft size={36} className="text-slate-600"/>}
              </button>
            </div>
          </div>

          <div className="bg-slate-900 border border-white/[0.07] rounded-xl p-5">
            <div className="mb-4">
              <p className="text-white font-semibold text-sm">Available Time Slots</p>
              <p className="text-slate-500 text-xs mt-0.5">Students can only request sessions during these times. Booked slots are locked.</p>
            </div>
            <TimeSlotManager slots={slots} onChange={setSlots}/>
          </div>

          <button onClick={saveSettings} disabled={savingSettings}
            className="w-full py-3 rounded-xl bg-violet-500 hover:bg-violet-400 text-white text-sm font-bold transition-all shadow shadow-violet-500/30 disabled:opacity-50 flex items-center justify-center gap-2">
            {savingSettings && <PiCircleNotch size={16} className="animate-spin"/>}
            {savingSettings ? "Saving…" : "Save Settings"}
          </button>
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {tab === "history" && (
        <div className="space-y-3">
          {completed.length === 0 ? (
            <div className="min-h-60 flex flex-col items-center justify-center text-center bg-slate-900 border border-white/[0.07] rounded-xl px-6">
              <PiClockCountdown size={28} className="text-slate-600 mb-3"/>
              <p className="text-slate-300 font-semibold">No sessions completed yet</p>
            </div>
          ) : (
            completed.map(h => (
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
                  <GoalBadge goal={h.goal}/>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <PiClock size={12}/> {h.slot?.day} · {h.slot?.time}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Mentorship;
