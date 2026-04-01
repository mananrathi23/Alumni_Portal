import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import {
  PiHandshake, PiUsersThree, PiClock, PiPlus, PiTrash,
  PiCheck, PiX, PiChatCircleText, PiStar, PiStarFill,
  PiClockCountdown, PiToggleLeft, PiToggleRight,
  PiCalendarBlank, PiNotePencil, PiArrowRight,
  PiWarning, PiUserCircle, PiBookOpen,
} from "react-icons/pi";
import axios from "axios";

// ── Mock data ─────────────────────────────────────────────────────────────────
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const GOAL_LABELS = {
  career: "Career Guidance",
  resume: "Resume Review",
  interview: "Interview Prep",
  technical: "Technical Help",
  general: "General Advice",
};



// ── Sub-components ─────────────────────────────────────────────────────────────

const GoalBadge = ({ goal }) => {
  const colors = {
    career: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
    resume: "bg-sky-500/15 text-sky-400 border-sky-500/25",
    interview: "bg-amber-500/15 text-amber-400 border-amber-500/25",
    technical: "bg-violet-500/15 text-violet-400 border-violet-500/25",
    general: "bg-slate-500/15 text-slate-400 border-slate-500/25",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colors[goal] || colors.general}`}>
      <PiBookOpen size={11} /> {GOAL_LABELS[goal]}
    </span>
  );
};

const StarRating = ({ rating }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((s) =>
      s <= rating
        ? <PiStarFill key={s} size={13} className="text-amber-400" />
        : <PiStar key={s} size={13} className="text-slate-600" />
    )}
  </div>
);

// ── Time Slot Manager ──────────────────────────────────────────────────────────
const TimeSlotManager = ({ slots, onChange }) => {
  const [day, setDay] = useState("Mon");
  const [time, setTime] = useState("10:00 AM");

  const times = [
    "9:00 AM","10:00 AM","11:00 AM","12:00 PM",
    "2:00 PM","3:00 PM","4:00 PM","5:00 PM","6:00 PM","7:00 PM",
  ];

  const addSlot = () => {
    const key = `${day}-${time}`;
    if (!slots.find((s) => s.day === day && s.time === time)) {
      onChange([...slots, { id: key, day, time, booked: false }]);
    }
  };

  const removeSlot = (id) => onChange(slots.filter((s) => s.id !== id));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-end">
        <div>
          <p className="text-xs text-slate-500 mb-1 font-medium">Day</p>
          <select value={day} onChange={(e) => setDay(e.target.value)}
            className="bg-slate-800 border border-white/[0.07] text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500">
            {DAYS.map((d) => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1 font-medium">Time</p>
          <select value={time} onChange={(e) => setTime(e.target.value)}
            className="bg-slate-800 border border-white/[0.07] text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500">
            {times.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <button onClick={addSlot}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-sm font-semibold hover:bg-emerald-500/25 transition-all">
          <PiPlus size={14} /> Add Slot
        </button>
      </div>

      {slots.length === 0 ? (
        <p className="text-slate-600 text-sm italic py-2">No time slots added yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2 mt-1">
          {slots.map((s) => (
            <div key={s.id}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold ${
                s.booked
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
      )}
    </div>
  );
};

// ── Notes Modal ────────────────────────────────────────────────────────────────
const NotesModal = ({ request, onClose, onSave }) => {
  const [notes, setNotes] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-white/[0.07] rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-white font-bold">Session Notes</h3>
            <p className="text-slate-500 text-xs mt-0.5">For {request.student?.name || request.studentName || "Unknown student"} · Private</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-all"><PiX size={16} /></button>
        </div>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
          placeholder="Key takeaways, action items, follow-up topics…"
          rows={5}
          className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-white/[0.07] text-slate-200 placeholder-slate-500 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg bg-slate-800 border border-white/[0.07] text-slate-300 text-sm font-semibold hover:bg-slate-700 transition-all">Cancel</button>
          <button onClick={() => { onSave(notes); onClose(); }}
            className="flex-1 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold transition-all shadow shadow-emerald-500/30">
            Save Notes
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
const Mentorship = () => {
  const { alumni } = useOutletContext();
  const [tab, setTab] = useState("requests"); // requests | settings | history
  const [requests, setRequests] = useState([]);
  const [history, setHistory] = useState([]);
  const [notesTarget, setNotesTarget] = useState(null);
  const [available, setAvailable] = useState(alumni?.availableForMentorship ?? false);
  const [maxMentees, setMaxMentees] = useState(3);
  const [slots, setSlots] = useState(
    (alumni?.mentorshipSlots || []).map((s) => ({ id: s.id || `${s.day}-${s.time}`, ...s })),
  );
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    if (!alumni) return;
    setAvailable(alumni.availableForMentorship ?? false);
    setSlots((alumni.mentorshipSlots || []).map((s) => ({ id: s.id || `${s.day}-${s.time}`, ...s })));
  }, [alumni]);

  const fetchRequests = async () => {
    try {
      const res = await axios.get("http://localhost:4000/api/v1/mentorship/requests", { withCredentials: true });
      setRequests(res.data.requests || []);
    } catch (err) {
      console.error("Failed to fetch mentorship requests", err);
      setRequests([]);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    setHistory(requests.filter((r) => r.status === "Completed"));
  }, [requests]);

  const pending = requests.filter((r) => r.status === "Pending");
  const active  = requests.filter((r) => r.status === "Accepted");

  const respond = (id, status) => {
    axios
      .put(
        `http://localhost:4000/api/v1/mentorship/requests/${id}/respond`,
        { status },
        { withCredentials: true },
      )
      .then((res) => {
        setRequests((prev) =>
          prev.map((r) => (r._id === id ? res.data.mentorship : r)),
        );
      })
      .catch((err) => {
        console.log(err);
        alert(err.response?.data?.message || "Error");
      });
  };

  const TABS = [
    { key: "requests", label: "Requests", count: pending.length },
    { key: "settings", label: "My Settings", count: null },
    { key: "history",  label: "History",  count: history.length },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Mentorship</h2>
          <p className="text-slate-400 text-sm mt-0.5">
            Manage your availability, requests, and sessions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full border ${available ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400" : "bg-slate-800 border-slate-700 text-slate-500"}`}
          >
            {available ? "● Available" : "○ Unavailable"}
          </span>
          {pending.length > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              {pending.length} Pending
            </span>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Pending", value: pending.length, color: "amber" },
          { label: "Active", value: active.length, color: "emerald" },
          { label: "Completed", value: history.length, color: "sky" },
        ].map(({ label, value, color }) => {
          const c = {
            amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
            emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
            sky: "text-sky-400 bg-sky-500/10 border-sky-500/20",
          }[color];
          return (
            <div
              key={label}
              className={`rounded-xl p-4 border ${c} text-center`}
            >
              <p className={`text-2xl font-bold ${c.split(" ")[0]}`}>{value}</p>
              <p className="text-slate-400 text-xs mt-0.5 font-medium">
                {label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-900 border border-white/[0.07] rounded-xl p-1">
        {TABS.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === key
                ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {label}
            {count !== null && count > 0 && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tab === key ? "bg-emerald-500/30 text-emerald-300" : "bg-slate-700 text-slate-400"}`}
              >
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── TAB: REQUESTS ── */}
      {tab === "requests" && (
        <div className="space-y-3">
          {requests.length === 0 && (
            <div className="min-h-60 flex flex-col items-center justify-center text-center bg-slate-900 border border-white/[0.07] rounded-xl px-6">
              <PiHandshake size={28} className="text-slate-600 mb-3" />
              <p className="text-slate-300 font-semibold">No requests yet</p>
              <p className="text-slate-500 text-sm mt-1">
                Students will reach out once you're marked available.
              </p>
            </div>
          )}

          {/* Pending */}
          {pending.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 font-semibold tracking-widest uppercase mb-2 px-1">
                Pending Requests
              </p>
              <div className="space-y-3">
                {pending.map((r) => {
                  const requestedSlot = r?.requestedSlot || {};
                  const slotTaken = requestedSlot.day && requestedSlot.time
                    ? slots.find(
                        (s) =>
                          s.day === requestedSlot.day &&
                          s.time === requestedSlot.time &&
                          s.booked,
                      )
                    : false;
                  return (
                    <div
                      key={r._id || r.id}
                      className="bg-slate-900 border border-white/[0.07] rounded-xl p-4 sm:p-5 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {(r.student?.name || r.studentName || "?").charAt(0)}
                          </div>
                          <div>
                            <p className="text-white font-semibold text-sm">
                              {r.student?.name || r.studentName || "Unknown student"}
                            </p>
                            <p className="text-slate-500 text-xs">
                              {r.student?.year || r.year || "?"} · {r.student?.department || r.department || "?"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <GoalBadge goal={r.goal} />
                          <span className="text-slate-600 text-xs">
                            {r.requestedAt}
                          </span>
                        </div>
                      </div>

                      {r.note && (
                        <p className="text-slate-400 text-sm bg-slate-800/60 border border-white/[0.04] rounded-lg px-3 py-2 leading-relaxed">
                          "{r.note}"
                        </p>
                      )}

                      <div className="flex items-center gap-2">
                        <PiClock size={13} className="text-slate-500" />
                        <span className="text-slate-400 text-xs">
                          Requested:{" "}
                          <span className="text-slate-200 font-medium">
                            {(requestedSlot.day || "Unknown")} · {(requestedSlot.time || "Unknown")}
                          </span>
                        </span>
                        {slotTaken && (
                          <span className="flex items-center gap-1 text-amber-400 text-xs font-semibold ml-2">
                            <PiWarning size={12} /> Slot Booked
                          </span>
                        )}
                      </div>

                      {slotTaken && (
                        <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                          <PiWarning
                            size={14}
                            className="text-amber-400 flex-shrink-0 mt-0.5"
                          />
                          <p className="text-amber-300 text-xs">
                            This slot is already booked. Accepting will notify
                            the student to choose a different slot.
                          </p>
                        </div>
                      )}

                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => respond(r._id || r.id, "Rejected")}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold hover:bg-red-500/20 transition-all"
                        >
                          <PiX size={14} /> Decline
                        </button>
                        <button
                          onClick={() => respond(r._id, "Accepted")}
                          className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold transition-all shadow shadow-emerald-500/30"
                        >
                          <PiCheck size={14} /> Accept & Book Slot
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active */}
          {active.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 font-semibold tracking-widest uppercase mb-2 px-1 mt-4">
                Active Mentorships
              </p>
              <div className="space-y-3">
                {active.map((r) => (
                  <div
                    key={r._id}
                    className="bg-slate-900 border border-emerald-500/20 rounded-xl p-4 sm:p-5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                          {(r.student?.name || r.studentName || "?").charAt(0)}
                        </div>
                        <div>
                          <p className="text-white font-semibold text-sm">{r.student?.name || r.studentName || "Unknown student"}</p>
                          <p className="text-slate-500 text-xs">
                            {r.student?.year || r.year || "?"} · {r.student?.department || r.department || "?"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <GoalBadge goal={r.goal} />
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                          Active
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/[0.05]">
                      <PiClock size={13} className="text-slate-500" />
                      <span className="text-slate-400 text-xs">
                        Slot:{" "}
                        <span className="text-slate-200 font-medium">
                          {(r.requestedSlot?.day || "Unknown")} · {(r.requestedSlot?.time || "Unknown")}
                        </span>
                      </span>
                      <div className="flex gap-2 ml-auto">
                        <button
                          onClick={() => setNotesTarget(r)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-white/[0.07] text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-all"
                        >
                          <PiNotePencil size={13} /> Add Notes
                        </button>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/25 transition-all">
                          <PiChatCircleText size={13} /> Open Chat
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: SETTINGS ── */}
      {tab === "settings" && (
        <div className="space-y-4">
          {/* Availability toggle */}
          <div className="bg-slate-900 border border-white/[0.07] rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-semibold text-sm">
                  Available for Mentorship
                </p>
                <p className="text-slate-500 text-xs mt-0.5">
                  When on, students can find and request you as a mentor
                </p>
              </div>
              <button
                onClick={() => {
                  const newVal = !available;
                  setAvailable(newVal);

                  axios
                    .put(
                      "http://localhost:4000/api/v1/mentorship/settings",
                      { availableForMentorship: newVal },
                      { withCredentials: true },
                    )
                    .then(() => {
                      alert(`Mentorship availability is now ${newVal ? "enabled" : "disabled"}.`);
                    })
                    .catch((err) => {
                      console.error("Availability toggle save failed:", err);
                      const serverMessage = err.response?.data?.message;
                      const statusCode = err.response?.status;
                      alert(`Error updating availability${statusCode ? ` (HTTP ${statusCode})` : ""}: ${serverMessage || err.message || "Unknown error"}`);
                      setAvailable(!newVal); // rollback on fail
                    });
                }}
                className="flex-shrink-0"
              >
                {available ? (
                  <PiToggleRight size={36} className="text-emerald-400" />
                ) : (
                  <PiToggleLeft size={36} className="text-slate-600" />
                )}
              </button>
            </div>
          </div>

          {/* Weekly mentee limit */}
          <div className="bg-slate-900 border border-white/[0.07] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-white font-semibold text-sm">
                  Weekly Mentee Limit
                </p>
                <p className="text-slate-500 text-xs mt-0.5">
                  Max students you can actively mentor per week
                </p>
              </div>
              <span className="text-2xl font-bold text-emerald-400">
                {maxMentees}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={maxMentees}
              onChange={(e) => setMaxMentees(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />
            <div className="flex justify-between text-xs text-slate-600 mt-1">
              <span>1</span>
              <span>5</span>
              <span>10</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Currently{" "}
              <span className="text-emerald-400 font-semibold">
                {active.length}
              </span>{" "}
              of{" "}
              <span className="text-emerald-400 font-semibold">
                {maxMentees}
              </span>{" "}
              slots used
            </p>
          </div>

          {/* Free time slots */}
          <div className="bg-slate-900 border border-white/[0.07] rounded-xl p-5">
            <div className="mb-4">
              <p className="text-white font-semibold text-sm">
                Available Time Slots
              </p>
              <p className="text-slate-500 text-xs mt-0.5">
                Students can only request sessions during these times. Booked
                slots are locked until the session ends.
              </p>
            </div>
            <TimeSlotManager slots={slots} onChange={setSlots} />
          </div>

          <button
            onClick={async () => {
              setSavingSettings(true);
              try {
                await axios.put(
                  "http://localhost:4000/api/v1/mentorship/settings",
                  {
                    availableForMentorship: available,
                    mentorshipSlots: slots,
                  },
                  { withCredentials: true },
                );
                alert("Mentorship settings saved.");
                fetchRequests();
              } catch (err) {
                console.error("Mentorship settings save failed:", err);
                const serverMessage = err.response?.data?.message;
                const statusCode = err.response?.status;
                alert(`Error saving settings${statusCode ? ` (HTTP ${statusCode})` : ""}: ${serverMessage || err.message || "Unknown error"}`);
              } finally {
                setSavingSettings(false);
              }
            }}
            disabled={savingSettings}
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold transition-all shadow shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {savingSettings ? "Saving..." : "Save Settings"}
          </button>
        </div>
      )}

      {/* ── TAB: HISTORY ── */}
      {tab === "history" && (
        <div className="space-y-3">
          {history.length === 0 ? (
            <div className="min-h-60 flex flex-col items-center justify-center text-center bg-slate-900 border border-white/[0.07] rounded-xl px-6">
              <PiClockCountdown size={28} className="text-slate-600 mb-3" />
              <p className="text-slate-300 font-semibold">
                No sessions completed yet
              </p>
              <p className="text-slate-500 text-sm mt-1">
                Your mentorship history will appear here.
              </p>
            </div>
          ) : (
            history.map((h) => (
              <div
                key={h.id}
                className="bg-slate-900 border border-white/[0.07] rounded-xl p-5 space-y-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white font-bold text-sm">
                      {(h.student?.name || h.studentName || "?").charAt(0)}
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">{h.student?.name || h.studentName || "Unknown student"}</p>
                      <p className="text-slate-500 text-xs">{h.sessionDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <GoalBadge goal={h.goal} />
                    <StarRating rating={h.rating} />
                  </div>
                </div>
                {h.feedback && (
                  <p className="text-slate-400 text-sm bg-slate-800/60 border border-white/[0.04] rounded-lg px-3 py-2 leading-relaxed italic">
                    "{h.feedback}"
                  </p>
                )}
                {h.notes && (
                  <div className="flex items-start gap-2 bg-sky-500/5 border border-sky-500/15 rounded-lg px-3 py-2">
                    <PiNotePencil
                      size={13}
                      className="text-sky-400 mt-0.5 flex-shrink-0"
                    />
                    <p className="text-slate-400 text-xs leading-relaxed">
                      {h.notes}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Notes modal */}
      {notesTarget && (
        <NotesModal
          request={notesTarget}
          onClose={() => setNotesTarget(null)}
          onSave={(notes) => console.log("Notes saved:", notes)}
        />
      )}
    </div>
  );
};

export default Mentorship;
