import { useState } from "react";
import {
  PiHandshake, PiClock, PiPlus, PiTrash,
  PiCheck, PiX, PiChatCircleText, PiStar, PiStarFill,
  PiClockCountdown, PiToggleLeft, PiToggleRight,
  PiCalendarBlank, PiNotePencil, PiBookOpen,
  PiWarning, PiChalkboardTeacher,
} from "react-icons/pi";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const GOAL_LABELS = {
  career: "Career Guidance",
  resume: "Resume Review",
  interview: "Interview Prep",
  technical: "Technical Help",
  general: "General Advice",
};

const MOCK_REQUESTS = [
  {
    id: "r1", studentName: "Sahil Verma", department: "Computer Science", year: "2nd Year",
    goal: "technical", note: "Struggling with OS concepts and compiler design. Would love guidance.",
    requestedSlot: { day: "Tue", time: "4:00 PM" }, requestedAt: "3h ago", status: "Pending",
  },
  {
    id: "r2", studentName: "Anjali Rao", department: "Information Technology", year: "3rd Year",
    goal: "career", note: "Want to understand research vs industry path after graduation.",
    requestedSlot: { day: "Thu", time: "5:00 PM" }, requestedAt: "2d ago", status: "Pending",
  },
  {
    id: "r3", studentName: "Dev Malhotra", department: "Electronics", year: "4th Year",
    goal: "interview", note: "Gate exam preparation, need study roadmap.",
    requestedSlot: { day: "Fri", time: "3:00 PM" }, requestedAt: "4d ago", status: "Accepted",
  },
];

const MOCK_HISTORY = [
  {
    id: "h1", studentName: "Ritika Singh", goal: "technical", sessionDate: "Mar 20, 2026",
    rating: 5, feedback: "Sir explained everything so clearly. Really helped with my project.",
    notes: "Student working on ML project. Suggested reading Bishop's Pattern Recognition book.",
  },
];

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

const TimeSlotManager = ({ slots, onChange }) => {
  const [day, setDay] = useState("Mon");
  const [time, setTime] = useState("10:00 AM");
  const times = ["9:00 AM","10:00 AM","11:00 AM","12:00 PM","2:00 PM","3:00 PM","4:00 PM","5:00 PM","6:00 PM"];

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
            className="bg-slate-800 border border-white/[0.07] text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500">
            {DAYS.map((d) => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1 font-medium">Time</p>
          <select value={time} onChange={(e) => setTime(e.target.value)}
            className="bg-slate-800 border border-white/[0.07] text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500">
            {times.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <button onClick={addSlot}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-500/15 border border-violet-500/30 text-violet-400 text-sm font-semibold hover:bg-violet-500/25 transition-all">
          <PiPlus size={14} /> Add Slot
        </button>
      </div>
      {slots.length === 0
        ? <p className="text-slate-600 text-sm italic py-2">No time slots added yet.</p>
        : (
          <div className="flex flex-wrap gap-2 mt-1">
            {slots.map((s) => (
              <div key={s.id}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold ${
                  s.booked ? "bg-slate-800/50 border-slate-700 text-slate-500" : "bg-slate-800 border-white/[0.07] text-slate-200"
                }`}>
                <PiCalendarBlank size={12} className={s.booked ? "text-slate-600" : "text-violet-400"} />
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

const NotesModal = ({ request, onClose, onSave }) => {
  const [notes, setNotes] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-white/[0.07] rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-white font-bold">Session Notes</h3>
            <p className="text-slate-500 text-xs mt-0.5">For {request.studentName} · Private</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-all"><PiX size={16} /></button>
        </div>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
          placeholder="Key takeaways, action items, follow-up topics…" rows={5}
          className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-white/[0.07] text-slate-200 placeholder-slate-500 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500" />
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg bg-slate-800 border border-white/[0.07] text-slate-300 text-sm font-semibold hover:bg-slate-700 transition-all">Cancel</button>
          <button onClick={() => { onSave(notes); onClose(); }}
            className="flex-1 py-2.5 rounded-lg bg-violet-500 hover:bg-violet-400 text-white text-sm font-bold transition-all shadow shadow-violet-500/30">
            Save Notes
          </button>
        </div>
      </div>
    </div>
  );
};

const Mentorship = () => {
  const [tab, setTab] = useState("requests");
  const [requests, setRequests] = useState(MOCK_REQUESTS);
  const [history] = useState(MOCK_HISTORY);
  const [notesTarget, setNotesTarget] = useState(null);
  const [available, setAvailable] = useState(true);
  const [maxMentees, setMaxMentees] = useState(4);
  const [slots, setSlots] = useState([
    { id: "Tue-4:00 PM", day: "Tue", time: "4:00 PM", booked: true },
    { id: "Thu-5:00 PM", day: "Thu", time: "5:00 PM", booked: false },
    { id: "Fri-3:00 PM", day: "Fri", time: "3:00 PM", booked: false },
  ]);

  const pending = requests.filter((r) => r.status === "Pending");
  const active  = requests.filter((r) => r.status === "Accepted");

  const respond = (id, status) => {
    setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
    if (status === "Accepted") {
      const req = requests.find((r) => r.id === id);
      if (req) {
        setSlots((prev) => prev.map((s) =>
          s.day === req.requestedSlot.day && s.time === req.requestedSlot.time ? { ...s, booked: true } : s
        ));
      }
    }
  };

  const TABS = [
    { key: "requests", label: "Requests", count: pending.length },
    { key: "settings", label: "My Settings", count: null },
    { key: "history",  label: "History",  count: history.length },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-5">
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
          { label: "Pending", value: pending.length, color: "amber" },
          { label: "Active", value: active.length, color: "violet" },
          { label: "Completed", value: history.length, color: "sky" },
        ].map(({ label, value, color }) => {
          const c = { amber: "text-amber-400 bg-amber-500/10 border-amber-500/20", violet: "text-violet-400 bg-violet-500/10 border-violet-500/20", sky: "text-sky-400 bg-sky-500/10 border-sky-500/20" }[color];
          return (
            <div key={label} className={`rounded-xl p-4 border ${c} text-center`}>
              <p className={`text-2xl font-bold ${c.split(" ")[0]}`}>{value}</p>
              <p className="text-slate-400 text-xs mt-0.5 font-medium">{label}</p>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-900 border border-white/[0.07] rounded-xl p-1">
        {TABS.map(({ key, label, count }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === key ? "bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/30" : "text-slate-400 hover:text-white"
            }`}>
            {label}
            {count !== null && count > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tab === key ? "bg-violet-500/30 text-violet-300" : "bg-slate-700 text-slate-400"}`}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Requests tab */}
      {tab === "requests" && (
        <div className="space-y-3">
          {requests.length === 0 && (
            <div className="min-h-60 flex flex-col items-center justify-center text-center bg-slate-900 border border-white/[0.07] rounded-xl px-6">
              <PiChalkboardTeacher size={28} className="text-slate-600 mb-3" />
              <p className="text-slate-300 font-semibold">No requests yet</p>
              <p className="text-slate-500 text-sm mt-1">Enable availability in Settings for students to find you.</p>
            </div>
          )}

          {pending.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 font-semibold tracking-widest uppercase mb-2 px-1">Pending Requests</p>
              <div className="space-y-3">
                {pending.map((r) => {
                  const slotTaken = slots.find((s) => s.day === r.requestedSlot.day && s.time === r.requestedSlot.time && s.booked);
                  return (
                    <div key={r.id} className="bg-slate-900 border border-white/[0.07] rounded-xl p-4 sm:p-5 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {r.studentName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-white font-semibold text-sm">{r.studentName}</p>
                            <p className="text-slate-500 text-xs">{r.year} · {r.department}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <GoalBadge goal={r.goal} />
                          <span className="text-slate-600 text-xs">{r.requestedAt}</span>
                        </div>
                      </div>
                      {r.note && (
                        <p className="text-slate-400 text-sm bg-slate-800/60 border border-white/[0.04] rounded-lg px-3 py-2 leading-relaxed">"{r.note}"</p>
                      )}
                      <div className="flex items-center gap-2">
                        <PiClock size={13} className="text-slate-500" />
                        <span className="text-slate-400 text-xs">Requested: <span className="text-slate-200 font-medium">{r.requestedSlot.day} · {r.requestedSlot.time}</span></span>
                        {slotTaken && <span className="flex items-center gap-1 text-amber-400 text-xs font-semibold ml-2"><PiWarning size={12} /> Slot Booked</span>}
                      </div>
                      {slotTaken && (
                        <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                          <PiWarning size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
                          <p className="text-amber-300 text-xs">This slot is already booked. Accepting will notify the student to pick a different time.</p>
                        </div>
                      )}
                      <div className="flex gap-2 pt-1">
                        <button onClick={() => respond(r.id, "Rejected")}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold hover:bg-red-500/20 transition-all">
                          <PiX size={14} /> Decline
                        </button>
                        <button onClick={() => respond(r.id, "Accepted")}
                          className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-violet-500 hover:bg-violet-400 text-white text-sm font-bold transition-all shadow shadow-violet-500/30">
                          <PiCheck size={14} /> Accept & Book Slot
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {active.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 font-semibold tracking-widest uppercase mb-2 px-1 mt-4">Active Mentorships</p>
              <div className="space-y-3">
                {active.map((r) => (
                  <div key={r.id} className="bg-slate-900 border border-violet-500/20 rounded-xl p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center text-white font-bold text-sm">
                          {r.studentName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-white font-semibold text-sm">{r.studentName}</p>
                          <p className="text-slate-500 text-xs">{r.year} · {r.department}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <GoalBadge goal={r.goal} />
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/25">Active</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/[0.05]">
                      <PiClock size={13} className="text-slate-500" />
                      <span className="text-slate-400 text-xs">Slot: <span className="text-slate-200 font-medium">{r.requestedSlot.day} · {r.requestedSlot.time}</span></span>
                      <div className="flex gap-2 ml-auto">
                        <button onClick={() => setNotesTarget(r)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-white/[0.07] text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-all">
                          <PiNotePencil size={13} /> Add Notes
                        </button>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/15 border border-violet-500/30 text-violet-400 text-xs font-semibold hover:bg-violet-500/25 transition-all">
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

      {/* Settings tab */}
      {tab === "settings" && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-white/[0.07] rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-semibold text-sm">Available for Mentorship</p>
                <p className="text-slate-500 text-xs mt-0.5">Students can find and request you as a mentor when enabled</p>
              </div>
              <button onClick={() => setAvailable((p) => !p)}>
                {available ? <PiToggleRight size={36} className="text-violet-400" /> : <PiToggleLeft size={36} className="text-slate-600" />}
              </button>
            </div>
          </div>
          <div className="bg-slate-900 border border-white/[0.07] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-white font-semibold text-sm">Weekly Mentee Limit</p>
                <p className="text-slate-500 text-xs mt-0.5">Max students you can mentor per week</p>
              </div>
              <span className="text-2xl font-bold text-violet-400">{maxMentees}</span>
            </div>
            <input type="range" min={1} max={10} value={maxMentees} onChange={(e) => setMaxMentees(Number(e.target.value))} className="w-full accent-violet-500" />
            <div className="flex justify-between text-xs text-slate-600 mt-1"><span>1</span><span>5</span><span>10</span></div>
            <p className="text-xs text-slate-500 mt-2">Currently <span className="text-violet-400 font-semibold">{active.length}</span> of <span className="text-violet-400 font-semibold">{maxMentees}</span> slots used</p>
          </div>
          <div className="bg-slate-900 border border-white/[0.07] rounded-xl p-5">
            <div className="mb-4">
              <p className="text-white font-semibold text-sm">Available Time Slots</p>
              <p className="text-slate-500 text-xs mt-0.5">Students can only request during these windows.</p>
            </div>
            <TimeSlotManager slots={slots} onChange={setSlots} />
          </div>
          <button className="w-full py-3 rounded-xl bg-violet-500 hover:bg-violet-400 text-white text-sm font-bold transition-all shadow shadow-violet-500/30">
            Save Settings
          </button>
        </div>
      )}

      {/* History tab */}
      {tab === "history" && (
        <div className="space-y-3">
          {history.length === 0 ? (
            <div className="min-h-60 flex flex-col items-center justify-center text-center bg-slate-900 border border-white/[0.07] rounded-xl px-6">
              <PiClockCountdown size={28} className="text-slate-600 mb-3" />
              <p className="text-slate-300 font-semibold">No sessions completed yet</p>
            </div>
          ) : (
            history.map((h) => (
              <div key={h.id} className="bg-slate-900 border border-white/[0.07] rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white font-bold text-sm">
                      {h.studentName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">{h.studentName}</p>
                      <p className="text-slate-500 text-xs">{h.sessionDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <GoalBadge goal={h.goal} />
                    <StarRating rating={h.rating} />
                  </div>
                </div>
                {h.feedback && (
                  <p className="text-slate-400 text-sm bg-slate-800/60 border border-white/[0.04] rounded-lg px-3 py-2 leading-relaxed italic">"{h.feedback}"</p>
                )}
                {h.notes && (
                  <div className="flex items-start gap-2 bg-violet-500/5 border border-violet-500/15 rounded-lg px-3 py-2">
                    <PiNotePencil size={13} className="text-violet-400 mt-0.5 flex-shrink-0" />
                    <p className="text-slate-400 text-xs leading-relaxed">{h.notes}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {notesTarget && (
        <NotesModal request={notesTarget} onClose={() => setNotesTarget(null)} onSave={(n) => console.log("Notes:", n)} />
      )}
    </div>
  );
};

export default Mentorship;
