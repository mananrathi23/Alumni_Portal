import { useState } from "react";
import {
  PiHandshake, PiMagnifyingGlass, PiStar, PiStarFill,
  PiBriefcase, PiGraduationCap, PiClock, PiCheck, PiX,
  PiChatCircleText, PiClockCountdown, PiBookOpen,
  PiCalendarBlank, PiArrowRight, PiInfo, PiWarningCircle,
  PiNotePencil,
} from "react-icons/pi";

const GOAL_OPTIONS = [
  { value: "career",    label: "Career Guidance",  desc: "Explore paths, industries, and long-term direction" },
  { value: "resume",    label: "Resume Review",     desc: "Feedback on your CV for better opportunities" },
  { value: "interview", label: "Interview Prep",    desc: "Mock interviews, DSA, and HR rounds" },
  { value: "technical", label: "Technical Help",    desc: "Concepts, projects, and subject clarity" },
  { value: "general",   label: "General Advice",    desc: "Open-ended guidance and life decisions" },
];

const GOAL_LABELS = {
  career: "Career Guidance", resume: "Resume Review",
  interview: "Interview Prep", technical: "Technical Help", general: "General Advice",
};

// Mock mentor list
const MOCK_MENTORS = [
  {
    id: "m1", name: "Aarav Kumar", role: "Alumni", batch: "2022",
    company: "Google", designation: "SDE II", department: "Computer Science",
    skills: ["DSA", "System Design", "React"], bio: "Passionate about helping juniors crack top product companies. Happy to guide on DSA and system design.",
    rating: 4.9, sessions: 24, availableSlots: [
      { id: "s1", day: "Wed", time: "5:00 PM", booked: false },
      { id: "s2", day: "Sat", time: "11:00 AM", booked: false },
    ],
    availableForMentorship: true,
  },
  {
    id: "m2", name: "Dr. Sunita Verma", role: "Teacher", batch: null,
    company: null, designation: "Associate Professor", department: "Computer Science",
    skills: ["ML", "Research", "GATE"], bio: "Guiding students in academic research and competitive exams. Specialised in Machine Learning.",
    rating: 4.7, sessions: 40, availableSlots: [
      { id: "s3", day: "Tue", time: "4:00 PM", booked: false },
      { id: "s4", day: "Thu", time: "3:00 PM", booked: true },
    ],
    availableForMentorship: true,
  },
  {
    id: "m3", name: "Priya Nair", role: "Alumni", batch: "2021",
    company: "Flipkart", designation: "Product Manager", department: "Information Technology",
    skills: ["Product", "Career", "Startups"], bio: "Ex-engineer turned PM. Can help you decide between engineering and product paths.",
    rating: 4.8, sessions: 18, availableSlots: [
      { id: "s5", day: "Mon", time: "7:00 PM", booked: false },
    ],
    availableForMentorship: true,
  },
];

const MOCK_ACTIVE = [
  {
    id: "a1", mentorName: "Aarav Kumar", mentorRole: "Alumni", goal: "interview",
    slot: { day: "Wed", time: "5:00 PM" }, acceptedAt: "2d ago", chatEnabled: true,
  },
];

const MOCK_HISTORY = [
  {
    id: "h1", mentorName: "Dr. Sunita Verma", mentorRole: "Teacher", goal: "technical",
    sessionDate: "Mar 15, 2026", myRating: 0, mentorNotes: "Student is making great progress. Suggested reading research papers on transformers.",
  },
];

// ── Goal Badge ─────────────────────────────────────────────────────────────────
const GoalBadge = ({ goal, size = "sm" }) => {
  const colors = {
    career: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
    resume: "bg-sky-500/15 text-sky-400 border-sky-500/25",
    interview: "bg-amber-500/15 text-amber-400 border-amber-500/25",
    technical: "bg-violet-500/15 text-violet-400 border-violet-500/25",
    general: "bg-slate-500/15 text-slate-400 border-slate-500/25",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colors[goal] || colors.general}`}>
      <PiBookOpen size={10} /> {GOAL_LABELS[goal]}
    </span>
  );
};

// ── Star Rating (interactive) ──────────────────────────────────────────────────
const StarRatingInput = ({ value, onChange }) => (
  <div className="flex gap-1">
    {[1,2,3,4,5].map((s) => (
      <button key={s} onClick={() => onChange(s)}>
        {s <= value
          ? <PiStarFill size={20} className="text-amber-400" />
          : <PiStar size={20} className="text-slate-600 hover:text-amber-300 transition-colors" />
        }
      </button>
    ))}
  </div>
);

// ── Request Modal ──────────────────────────────────────────────────────────────
const RequestModal = ({ mentor, onClose, onSend }) => {
  const [goal, setGoal] = useState("career");
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [note, setNote] = useState("");
  const availableSlots = mentor.availableSlots.filter((s) => !s.booked);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-white/[0.07] rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-white font-bold">Request Mentorship</h3>
            <p className="text-slate-500 text-xs mt-0.5">from {mentor.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-all">
            <PiX size={16} />
          </button>
        </div>

        {/* Goal selection */}
        <div className="mb-5">
          <p className="text-xs text-slate-400 font-semibold tracking-widest uppercase mb-2">What do you need help with?</p>
          <div className="space-y-2">
            {GOAL_OPTIONS.map((g) => (
              <button key={g.value} onClick={() => setGoal(g.value)}
                className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                  goal === g.value
                    ? "bg-sky-500/10 border-sky-500/30"
                    : "bg-slate-800/50 border-white/[0.05] hover:bg-slate-800"
                }`}>
                <div className={`w-3.5 h-3.5 rounded-full border-2 mt-0.5 flex-shrink-0 transition-colors ${goal === g.value ? "border-sky-400 bg-sky-400" : "border-slate-600"}`} />
                <div>
                  <p className={`text-sm font-semibold ${goal === g.value ? "text-sky-300" : "text-slate-300"}`}>{g.label}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{g.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Slot selection */}
        <div className="mb-5">
          <p className="text-xs text-slate-400 font-semibold tracking-widest uppercase mb-2">Choose a Time Slot</p>
          {availableSlots.length === 0 ? (
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
              <PiWarningCircle size={14} className="text-amber-400 flex-shrink-0" />
              <p className="text-amber-300 text-xs">No free slots available right now. Check back later.</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {availableSlots.map((s) => (
                <button key={s.id} onClick={() => setSelectedSlot(s)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-semibold transition-all ${
                    selectedSlot?.id === s.id
                      ? "bg-sky-500/15 border-sky-500/30 text-sky-300"
                      : "bg-slate-800 border-white/[0.07] text-slate-300 hover:border-sky-500/20"
                  }`}>
                  <PiCalendarBlank size={13} className={selectedSlot?.id === s.id ? "text-sky-400" : "text-slate-500"} />
                  {s.day} · {s.time}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Note */}
        <div className="mb-5">
          <p className="text-xs text-slate-400 font-semibold tracking-widest uppercase mb-2">Add a Note <span className="text-slate-600 normal-case font-normal">(optional)</span></p>
          <textarea value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="Brief context about your situation or what you're hoping to achieve…"
            rows={3}
            className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-white/[0.07] text-slate-200 placeholder-slate-500 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sky-500" />
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg bg-slate-800 border border-white/[0.07] text-slate-300 text-sm font-semibold hover:bg-slate-700 transition-all">
            Cancel
          </button>
          <button
            disabled={!selectedSlot}
            onClick={() => { onSend({ goal, slot: selectedSlot, note }); onClose(); }}
            className="flex-1 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-sm font-bold transition-all shadow shadow-sky-500/30 disabled:opacity-40 disabled:cursor-not-allowed">
            Send Request
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Rate Modal ─────────────────────────────────────────────────────────────────
const RateModal = ({ session, onClose, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-white/[0.07] rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-white font-bold">Rate Your Session</h3>
            <p className="text-slate-500 text-xs mt-0.5">with {session.mentorName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-all"><PiX size={16} /></button>
        </div>
        <div className="flex justify-center mb-5">
          <StarRatingInput value={rating} onChange={setRating} />
        </div>
        <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)}
          placeholder="What did you find most helpful? (optional)"
          rows={3}
          className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-white/[0.07] text-slate-200 placeholder-slate-500 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500 mb-4" />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg bg-slate-800 border border-white/[0.07] text-slate-300 text-sm font-semibold hover:bg-slate-700 transition-all">Skip</button>
          <button disabled={rating === 0} onClick={() => { onSubmit(rating, feedback); onClose(); }}
            className="flex-1 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-white text-sm font-bold transition-all shadow shadow-amber-500/30 disabled:opacity-40 disabled:cursor-not-allowed">
            Submit Rating
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Mentor Card ────────────────────────────────────────────────────────────────
const MentorCard = ({ mentor, onRequest }) => {
  const [expanded, setExpanded] = useState(false);
  const freeSlots = mentor.availableSlots.filter((s) => !s.booked);

  return (
    <div className="bg-slate-900 border border-white/[0.07] rounded-xl overflow-hidden">
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-base flex-shrink-0 ${
              mentor.role === "Alumni"
                ? "bg-gradient-to-br from-emerald-400 to-emerald-600"
                : "bg-gradient-to-br from-violet-400 to-violet-600"
            }`}>
              {mentor.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-white font-semibold text-sm">{mentor.name}</p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  mentor.role === "Alumni"
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25"
                    : "bg-violet-500/15 text-violet-400 border-violet-500/25"
                }`}>{mentor.role}</span>
              </div>
              <p className="text-slate-500 text-xs mt-0.5">
                {mentor.designation}
                {mentor.company && <span> · {mentor.company}</span>}
                {mentor.batch && <span className="text-slate-600"> · Class of {mentor.batch}</span>}
              </p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="flex items-center gap-1 justify-end">
              <PiStarFill size={12} className="text-amber-400" />
              <span className="text-amber-400 text-xs font-bold">{mentor.rating}</span>
            </div>
            <p className="text-slate-600 text-[10px] mt-0.5">{mentor.sessions} sessions</p>
          </div>
        </div>

        <p className="text-slate-400 text-xs leading-relaxed mt-3">{mentor.bio}</p>

        <div className="flex flex-wrap gap-1.5 mt-3">
          {mentor.skills.map((s) => (
            <span key={s} className="px-2 py-0.5 rounded-md bg-slate-800 border border-white/[0.05] text-slate-400 text-xs font-medium">{s}</span>
          ))}
        </div>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.05]">
          <div className="flex items-center gap-2">
            <PiClock size={12} className="text-slate-600" />
            <span className="text-slate-500 text-xs">
              {freeSlots.length > 0
                ? <span className="text-emerald-400 font-medium">{freeSlots.length} slot{freeSlots.length > 1 ? "s" : ""} free</span>
                : <span className="text-slate-600">No slots available</span>
              }
            </span>
            <button onClick={() => setExpanded((p) => !p)} className="text-slate-600 hover:text-slate-400 text-xs underline ml-1 transition-colors">
              {expanded ? "Hide" : "View slots"}
            </button>
          </div>
          <button
            onClick={() => onRequest(mentor)}
            disabled={freeSlots.length === 0}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              freeSlots.length > 0
                ? "bg-sky-500/15 border border-sky-500/30 text-sky-400 hover:bg-sky-500/25"
                : "bg-slate-800 border border-slate-700 text-slate-600 cursor-not-allowed"
            }`}>
            <PiHandshake size={14} /> Request
          </button>
        </div>

        {expanded && (
          <div className="mt-3 flex flex-wrap gap-2">
            {mentor.availableSlots.map((s) => (
              <div key={s.id}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium ${
                  s.booked
                    ? "bg-slate-800/40 border-slate-700/50 text-slate-600"
                    : "bg-slate-800 border-white/[0.07] text-slate-300"
                }`}>
                <PiCalendarBlank size={11} className={s.booked ? "text-slate-600" : "text-sky-400"} />
                {s.day} · {s.time}
                {s.booked && <span className="text-[10px] text-slate-600 ml-1">Booked</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
const Mentorship = () => {
  const [tab, setTab] = useState("find");
  const [mentors] = useState(MOCK_MENTORS);
  const [active] = useState(MOCK_ACTIVE);
  const [history, setHistory] = useState(MOCK_HISTORY);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("All");
  const [requestTarget, setRequestTarget] = useState(null);
  const [rateTarget, setRateTarget] = useState(null);

  const filtered = mentors.filter((m) => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.skills.some((s) => s.toLowerCase().includes(search.toLowerCase())) ||
      m.department.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === "All" || m.role === filterRole;
    return matchSearch && matchRole;
  });

  const TABS = [
    { key: "find",    label: "Find Mentor",  count: null },
    { key: "active",  label: "My Sessions",  count: active.length },
    { key: "history", label: "History",      count: history.length },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Mentorship</h2>
          <p className="text-slate-400 text-sm mt-0.5">Connect with alumni and teachers for guidance</p>
        </div>
        {active.length > 0 && (
          <span className="text-xs font-bold px-3 py-1 rounded-full border bg-sky-500/15 border-sky-500/30 text-sky-400">
            {active.length} Active Session{active.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-900 border border-white/[0.07] rounded-xl p-1">
        {TABS.map(({ key, label, count }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === key ? "bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/30" : "text-slate-400 hover:text-white"
            }`}>
            {label}
            {count !== null && count > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tab === key ? "bg-sky-500/30 text-sky-300" : "bg-slate-700 text-slate-400"}`}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Find Mentor ── */}
      {tab === "find" && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <PiMagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, skill, or department…"
                className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-slate-900 border border-white/[0.07] text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
            <div className="flex gap-1 bg-slate-900 border border-white/[0.07] rounded-lg p-1">
              {["All", "Alumni", "Teacher"].map((r) => (
                <button key={r} onClick={() => setFilterRole(r)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    filterRole === r ? "bg-sky-500/15 text-sky-400" : "text-slate-500 hover:text-slate-300"
                  }`}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="min-h-48 flex flex-col items-center justify-center text-center bg-slate-900 border border-white/[0.07] rounded-xl px-6">
              <PiHandshake size={24} className="text-slate-600 mb-2" />
              <p className="text-slate-400 text-sm">No mentors found matching your search.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((m) => (
                <MentorCard key={m.id} mentor={m} onRequest={setRequestTarget} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Active Sessions ── */}
      {tab === "active" && (
        <div className="space-y-3">
          {active.length === 0 ? (
            <div className="min-h-60 flex flex-col items-center justify-center text-center bg-slate-900 border border-white/[0.07] rounded-xl px-6">
              <PiHandshake size={28} className="text-slate-600 mb-3" />
              <p className="text-slate-300 font-semibold">No active sessions</p>
              <p className="text-slate-500 text-sm mt-1">Send a request to a mentor to get started.</p>
              <button onClick={() => setTab("find")}
                className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400 text-sm font-semibold hover:bg-sky-500/20 transition-all">
                Browse Mentors <PiArrowRight size={14} />
              </button>
            </div>
          ) : (
            active.map((s) => (
              <div key={s.id} className="bg-slate-900 border border-sky-500/20 rounded-xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white font-bold text-sm">
                      {s.mentorName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">{s.mentorName}</p>
                      <p className="text-slate-500 text-xs">{s.mentorRole}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <GoalBadge goal={s.goal} />
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/25">Active</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <PiClock size={12} className="text-slate-600" />
                  Slot: <span className="text-slate-200 font-medium">{s.slot.day} · {s.slot.time}</span>
                  <span className="text-slate-600 ml-2">Accepted {s.acceptedAt}</span>
                </div>

                <div className="flex items-start gap-2 bg-sky-500/5 border border-sky-500/15 rounded-lg p-3">
                  <PiInfo size={13} className="text-sky-400 flex-shrink-0 mt-0.5" />
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Your chat is now enabled. You can discuss session details, share links (Google Meet, Zoom, etc.) directly in the chat.
                  </p>
                </div>

                <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-400 text-sm font-bold hover:bg-sky-500/25 transition-all w-full justify-center">
                  <PiChatCircleText size={15} /> Open Chat with {s.mentorName}
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── History ── */}
      {tab === "history" && (
        <div className="space-y-3">
          {history.length === 0 ? (
            <div className="min-h-60 flex flex-col items-center justify-center text-center bg-slate-900 border border-white/[0.07] rounded-xl px-6">
              <PiClockCountdown size={28} className="text-slate-600 mb-3" />
              <p className="text-slate-300 font-semibold">No past sessions yet</p>
            </div>
          ) : (
            history.map((h) => (
              <div key={h.id} className="bg-slate-900 border border-white/[0.07] rounded-xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white font-bold text-sm">
                      {h.mentorName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">{h.mentorName}</p>
                      <p className="text-slate-500 text-xs">{h.mentorRole} · {h.sessionDate}</p>
                    </div>
                  </div>
                  <GoalBadge goal={h.goal} />
                </div>

                {h.mentorNotes && (
                  <div className="flex items-start gap-2 bg-slate-800/50 border border-white/[0.05] rounded-lg px-3 py-2">
                    <PiNotePencil size={12} className="text-slate-500 mt-0.5 flex-shrink-0" />
                    <p className="text-slate-500 text-xs leading-relaxed italic">{h.mentorNotes}</p>
                  </div>
                )}

                {h.myRating === 0 ? (
                  <button onClick={() => setRateTarget(h)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold hover:bg-amber-500/20 transition-all">
                    <PiStar size={13} /> Rate this session
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    {[1,2,3,4,5].map((s) => s <= h.myRating
                      ? <PiStarFill key={s} size={13} className="text-amber-400" />
                      : <PiStar key={s} size={13} className="text-slate-600" />
                    )}
                    <span className="text-slate-500 text-xs">Your rating</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Modals */}
      {requestTarget && (
        <RequestModal
          mentor={requestTarget}
          onClose={() => setRequestTarget(null)}
          onSend={(data) => console.log("Request sent:", requestTarget.name, data)}
        />
      )}
      {rateTarget && (
        <RateModal
          session={rateTarget}
          onClose={() => setRateTarget(null)}
          onSubmit={(rating, feedback) => {
            setHistory((prev) => prev.map((h) => h.id === rateTarget.id ? { ...h, myRating: rating } : h));
          }}
        />
      )}
    </div>
  );
};

export default Mentorship;
