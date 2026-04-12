import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { useSocket } from "../../SocketContext";
import { Context } from "../../main";
import {
  PiHandshake, PiMagnifyingGlass, PiStar, PiStarFill,
  PiClock, PiX, PiChatCircleText, PiClockCountdown,
  PiBookOpen, PiCalendarBlank, PiArrowRight, PiInfo,
  PiWarningCircle, PiCircleNotch,
} from "react-icons/pi";

const API = "http://localhost:4000/api/v1/mentorship";

const GOAL_OPTIONS = [
  { value:"career",    label:"Career Guidance",  desc:"Explore paths, industries, and long-term direction" },
  { value:"resume",    label:"Resume Review",     desc:"Feedback on your CV for better opportunities" },
  { value:"interview", label:"Interview Prep",    desc:"Mock interviews, DSA, and HR rounds" },
  { value:"technical", label:"Technical Help",    desc:"Concepts, projects, and subject clarity" },
  { value:"general",   label:"General Advice",    desc:"Open-ended guidance and life decisions" },
];
const GOAL_LABELS = { career:"Career Guidance", resume:"Resume Review", interview:"Interview Prep", technical:"Technical Help", general:"General Advice" };

const GoalBadge = ({ goal }) => {
  const c = { career:"bg-emerald-500/15 text-emerald-400 border-emerald-500/25", resume:"bg-sky-500/15 text-sky-400 border-sky-500/25", interview:"bg-amber-500/15 text-amber-400 border-amber-500/25", technical:"bg-violet-500/15 text-violet-400 border-violet-500/25", general:"bg-slate-500/15 text-slate-400 border-slate-500/25" };
  return <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${c[goal]||c.general}`}><PiBookOpen size={10}/>{GOAL_LABELS[goal]||goal}</span>;
};

const StarRatingInput = ({ value, onChange }) => (
  <div className="flex gap-1">
    {[1,2,3,4,5].map(s => (
      <button key={s} onClick={() => onChange(s)}>
        {s<=value ? <PiStarFill size={20} className="text-amber-400"/> : <PiStar size={20} className="text-slate-600 hover:text-amber-300 transition-colors"/>}
      </button>
    ))}
  </div>
);

// ── Request Modal ──────────────────────────────────────────────────────────────
const RequestModal = ({ mentor, onClose, onSuccess }) => {
  const [goal, setGoal]         = useState("career");
  const [selectedSlot, setSlot] = useState(null);
  const [note, setNote]         = useState("");
  const [sending, setSending]   = useState(false);

  const availableSlots = (mentor.availableSlots || mentor.mentorshipSlots || []).filter(s => !s.booked);

  const send = async () => {
    if (!selectedSlot) return;
    setSending(true);
    try {
      await axios.post(`${API}/requests`, {
        mentorId: mentor._id,
        goal,
        slot: { day: selectedSlot.day, time: selectedSlot.time },
        note,
      }, { withCredentials: true });
      toast.success(`Request sent to ${mentor.name}!`);
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send request.");
    } finally { setSending(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-white/[0.07] rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div><h3 className="text-white font-bold">Request Mentorship</h3><p className="text-slate-500 text-xs mt-0.5">from {mentor.name}</p></div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-all"><PiX size={16}/></button>
        </div>

        <div className="mb-5">
          <p className="text-xs text-slate-400 font-semibold tracking-widest uppercase mb-2">What do you need help with?</p>
          <div className="space-y-2">
            {GOAL_OPTIONS.map(g => (
              <button key={g.value} onClick={() => setGoal(g.value)}
                className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${goal===g.value?"bg-sky-500/10 border-sky-500/30":"bg-slate-800/50 border-white/[0.05] hover:bg-slate-800"}`}>
                <div className={`w-3.5 h-3.5 rounded-full border-2 mt-0.5 flex-shrink-0 ${goal===g.value?"border-sky-400 bg-sky-400":"border-slate-600"}`}/>
                <div><p className={`text-sm font-semibold ${goal===g.value?"text-sky-300":"text-slate-300"}`}>{g.label}</p><p className="text-slate-500 text-xs mt-0.5">{g.desc}</p></div>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <p className="text-xs text-slate-400 font-semibold tracking-widest uppercase mb-2">Choose a Time Slot</p>
          {availableSlots.length === 0 ? (
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
              <PiWarningCircle size={14} className="text-amber-400 flex-shrink-0"/>
              <p className="text-amber-300 text-xs">No free slots available right now.</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {availableSlots.map(s => (
                <button key={s.id||`${s.day}-${s.time}`} onClick={() => setSlot(s)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-semibold transition-all ${selectedSlot===s?"bg-sky-500/15 border-sky-500/30 text-sky-300":"bg-slate-800 border-white/[0.07] text-slate-300 hover:border-sky-500/20"}`}>
                  <PiCalendarBlank size={13} className={selectedSlot===s?"text-sky-400":"text-slate-500"}/>{s.day} · {s.time}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mb-5">
          <p className="text-xs text-slate-400 font-semibold tracking-widest uppercase mb-2">Add a Note <span className="text-slate-600 normal-case font-normal">(optional)</span></p>
          <textarea value={note} onChange={e => setNote(e.target.value)}
            placeholder="Brief context about your situation…" rows={3}
            className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-white/[0.07] text-slate-200 placeholder-slate-500 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sky-500"/>
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg bg-slate-800 border border-white/[0.07] text-slate-300 text-sm font-semibold hover:bg-slate-700 transition-all">Cancel</button>
          <button disabled={!selectedSlot||sending} onClick={send}
            className="flex-1 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-sm font-bold transition-all shadow shadow-sky-500/30 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {sending && <PiCircleNotch size={14} className="animate-spin"/>}
            {sending ? "Sending…" : "Send Request"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Mentor Card ───────────────────────────────────────────────────────────────
const MentorCard = ({ mentor, onRequest, matchScore, matchBreakdown }) => {
  const slots     = mentor.availableSlots || mentor.mentorshipSlots || [];
  const freeSlots = slots.filter(s => !s.booked);
  const roleColor = mentor.role === "Alumni" ? "emerald" : "violet";

  // Badge from server (smart-match) or compute locally from score
  const score = mentor.mentorStats?.score || 0;
  const badge = mentor.badge || (
    score >= 8.5 ? "🏆 Elite Mentor" :
    score >= 6.5 ? "⭐ Expert Mentor" :
    score >= 4.5 ? "🌟 Rising Mentor" :
    score >= 2.0 ? "🌱 New Mentor" : null
  );

  const badgeCls = {
    "🏆 Elite Mentor":  "bg-amber-500/15 text-amber-300 border-amber-500/30",
    "⭐ Expert Mentor": "bg-orange-500/15 text-orange-300 border-orange-500/30",
    "🌟 Rising Mentor": "bg-sky-500/15 text-sky-300 border-sky-500/30",
    "🌱 New Mentor":    "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  }[badge] || "bg-slate-700 text-slate-400 border-slate-600";

  return (
    <div className="bg-slate-900 border border-white/[0.07] rounded-xl overflow-hidden">
      <div className="p-4 sm:p-5">
        {/* Match score banner */}
        {matchScore !== undefined && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-sky-500/10 border border-sky-500/20">
            <div className="flex items-center justify-between">
              <span className="text-sky-400 text-xs font-bold">Match Score: {matchScore} pts</span>
              <span className="text-sky-300 text-[10px]">Best match for your profile</span>
            </div>
            {matchBreakdown?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {matchBreakdown.map((b, i) => (
                  <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400">{b}</span>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {mentor.profilePhoto?.url ? (
              <img src={mentor.profilePhoto.url} alt={mentor.name}
                className="w-10 h-10 rounded-xl object-cover flex-shrink-0"/>
            ) : (
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-base flex-shrink-0 ${roleColor==="emerald"?"bg-gradient-to-br from-emerald-400 to-emerald-600":"bg-gradient-to-br from-violet-400 to-violet-600"}`}>
                {mentor.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-white font-semibold text-sm">{mentor.name}</p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleColor==="emerald"?"bg-emerald-500/15 text-emerald-400 border-emerald-500/25":"bg-violet-500/15 text-violet-400 border-violet-500/25"}`}>
                  {mentor.role}
                </span>
                {badge && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeCls}`}>
                    {badge}
                  </span>
                )}
              </div>
              <p className="text-slate-500 text-xs mt-0.5">
                {mentor.currentDesignation||mentor.designation||""}
                {mentor.currentCompany && <span> · {mentor.currentCompany}</span>}
                {mentor.department && <span className="text-slate-600"> · {mentor.department}</span>}
              </p>
            </div>
          </div>
        </div>

        {mentor.bio && <p className="text-slate-400 text-xs leading-relaxed mt-3 line-clamp-2">{mentor.bio}</p>}

        {(mentor.skills||[]).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {mentor.skills.slice(0,5).map(s => (
              <span key={s} className="px-2 py-0.5 rounded-md bg-slate-800 border border-white/[0.05] text-slate-400 text-xs font-medium">{s}</span>
            ))}
          </div>
        )}

        {/* Stats row */}
        {mentor.mentorStats?.averageRating > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-700 border border-slate-600 text-slate-300 text-[10px] font-semibold">
              ★ {mentor.mentorStats.averageRating} ({mentor.mentorStats.totalRatings} review{mentor.mentorStats.totalRatings !== 1 ? "s" : ""})
            </span>
            {mentor.mentorStats.totalSessions > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-700 border border-slate-600 text-slate-300 text-[10px] font-semibold">
                🎓 {mentor.mentorStats.totalSessions} session{mentor.mentorStats.totalSessions !== 1 ? "s" : ""}
              </span>
            )}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-700 border border-slate-600 text-slate-300 text-[10px] font-semibold">
              Score: {score.toFixed(1)}/10
            </span>
          </div>
        )}

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.05]">
          <div className="flex items-center gap-2">
            <PiClock size={12} className="text-slate-600"/>
            <span className="text-slate-500 text-xs">
              {freeSlots.length > 0
                ? <span className="text-emerald-400 font-medium">{freeSlots.length} free slot{freeSlots.length>1?"s":""}</span>
                : <span className="text-slate-600">No slots available</span>}
            </span>
          </div>
          <button onClick={() => onRequest(mentor)} disabled={freeSlots.length===0}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all ${freeSlots.length>0?"bg-sky-500/15 border border-sky-500/30 text-sky-400 hover:bg-sky-500/25":"bg-slate-800 border border-slate-700 text-slate-600 cursor-not-allowed"}`}>
            <PiHandshake size={14}/> Request
          </button>
        </div>

        {freeSlots.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {freeSlots.map(s => (
              <div key={s.id||`${s.day}-${s.time}`}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium bg-slate-800 border-white/[0.07] text-slate-300">
                <PiCalendarBlank size={11} className="text-sky-400"/>
                {s.day} · {s.time}
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
  const { user }             = useContext(Context);
  const navigate             = useNavigate();
  const { socketRef, isSocketReady } = useSocket();

  const [tab, setTab]               = useState("find");
  const [mentors, setMentors]       = useState([]);
  const [requests, setRequests]     = useState([]);
  const [loadingMentors, setLoadingMentors] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [search, setSearch]         = useState("");
  const [filterRole, setFilterRole] = useState("All");
  const [requestTarget, setRequestTarget] = useState(null);
  const [rateTarget, setRateTarget]       = useState(null);

  // ── Smart match state ──────────────────────────────────────────────────────
  const [smartMode,    setSmartMode]    = useState(false);
  const [smartResults, setSmartResults] = useState([]);
  const [smartLoading, setSmartLoading] = useState(false);
  const [smartGoal,    setSmartGoal]    = useState("career");
  const [matchBasis,   setMatchBasis]   = useState([]);

  const runSmartMatch = async () => {
    setSmartLoading(true);
    setSmartMode(true);
    try {
      const res = await axios.get(`${API}/smart-match`, {
        params: { goal: smartGoal },
        withCredentials: true,
      });
      setSmartResults(res.data.mentors || []);
      setMatchBasis(res.data.matchBasis || []);
      if (!res.data.mentors?.length) {
        toast.info("No strong matches found yet. Try browsing all mentors.");
      }
    } catch {
      toast.error("Smart match failed. Try again.");
    } finally {
      setSmartLoading(false);
    }
  };

  const clearSmartMatch = () => {
    setSmartMode(false);
    setSmartResults([]);
  };

  const fetchMentors = async () => {
    setLoadingMentors(true);
    try {
      const res = await axios.get(`${API}/mentors`, { withCredentials: true });
      setMentors((res.data.mentors || []).map(m => ({
        ...m,
        skills:         Array.isArray(m.skills) ? m.skills : [],
        availableSlots: m.availableSlots || m.mentorshipSlots || [],
      })));
    } catch { toast.error("Failed to load mentors."); setMentors([]); }
    finally { setLoadingMentors(false); }
  };

  const fetchRequests = async () => {
    setLoadingRequests(true);
    try {
      const res = await axios.get(`${API}/requests`, { withCredentials: true });
      setRequests(res.data.requests || []);
    } catch { setRequests([]); }
    finally { setLoadingRequests(false); }
  };

  useEffect(() => { fetchMentors(); fetchRequests(); }, []);

  // ── Socket listeners ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!isSocketReady || !socketRef.current) return;
    const socket = socketRef.current;

    // Mentor accepted our request
    const onAccepted = (data) => {
      toast.success(`🎉 ${data.mentorName} accepted your mentorship request! Chat is now enabled.`);
      fetchRequests();
      fetchMentors(); // refresh slot state
    };

    // Mentor rejected our request
    const onRejected = (data) => {
      toast.info(`${data.mentorName} couldn't accept your request. Try another slot or mentor.`);
      fetchRequests();
    };

    // Our slot was taken by another student (auto-rejected)
    const onSlotTaken = (data) => {
      toast.warn(`⚡ The ${data.slot?.day} ${data.slot?.time} slot with ${data.mentorName} was just taken! Please choose another.`);
      fetchRequests();
      fetchMentors();
    };

    // Session marked complete
    const onCompleted = (data) => {
      toast.info(`Session with ${data.mentorName} is now complete. You can leave a rating!`);
      fetchRequests();
    };

    socket.on("mentorship:accepted",  onAccepted);
    socket.on("mentorship:rejected",  onRejected);
    socket.on("mentorship:slot_taken", onSlotTaken);
    socket.on("mentorship:completed", onCompleted);

    return () => {
      socket.off("mentorship:accepted",  onAccepted);
      socket.off("mentorship:rejected",  onRejected);
      socket.off("mentorship:slot_taken", onSlotTaken);
      socket.off("mentorship:completed", onCompleted);
    };
  }, [isSocketReady]);

  const filtered = mentors.filter(m => {
    const q = search.toLowerCase();
    return (
      (!search || (m.name||"").toLowerCase().includes(q) || (m.department||"").toLowerCase().includes(q) || (m.skills||[]).some(s=>s.toLowerCase().includes(q)) || (m.currentCompany||"").toLowerCase().includes(q)) &&
      (filterRole === "All" || m.role === filterRole)
    );
  });

  const activeRequests  = requests.filter(r => r.status === "Accepted");
  const historyRequests = requests.filter(r => ["Completed","Rejected","Cancelled"].includes(r.status));

  const TABS = [
    { key:"find",    label:"Find Mentor",  count: null },
    { key:"active",  label:"My Sessions",  count: activeRequests.length },
    { key:"history", label:"History",      count: historyRequests.length },
  ];



  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div><h2 className="text-xl font-bold text-white">Mentorship</h2><p className="text-slate-400 text-sm mt-0.5">Connect with alumni and teachers for guidance</p></div>
        {activeRequests.length > 0 && <span className="text-xs font-bold px-3 py-1 rounded-full border bg-sky-500/15 border-sky-500/30 text-sky-400">{activeRequests.length} Active Session{activeRequests.length>1?"s":""}</span>}
      </div>

      <div className="flex gap-1 bg-slate-900 border border-white/[0.07] rounded-xl p-1">
        {TABS.map(({key,label,count}) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${tab===key?"bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/30":"text-slate-400 hover:text-white"}`}>
            {label}
            {count!==null&&count>0&&<span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tab===key?"bg-sky-500/30 text-sky-300":"bg-slate-700 text-slate-400"}`}>{count}</span>}
          </button>
        ))}
      </div>

      {/* ── Find Mentor ── */}
      {tab === "find" && (
        <div className="space-y-4">

          {/* ── Smart Match Panel ── */}
          <div className="bg-slate-900 border border-sky-500/20 rounded-xl p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-white font-semibold text-sm flex items-center gap-2">
                  <PiClockCountdown className="text-sky-400" size={16}/> Smart Mentor Match
                </p>
                <p className="text-slate-500 text-xs mt-0.5">
                  Find mentors best suited to your branch, skills, and goal
                </p>
              </div>
              {smartMode && (
                <button onClick={clearSmartMatch}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-white px-2 py-1 rounded-lg border border-white/[0.07] hover:bg-slate-800 transition-all">
                  <PiX size={12}/> Clear
                </button>
              )}
            </div>

            {/* Goal selector */}
            <div className="flex flex-wrap gap-2">
              {GOAL_OPTIONS.map(g => (
                <button key={g.value} onClick={() => setSmartGoal(g.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    smartGoal === g.value
                      ? "bg-sky-500/15 text-sky-400 border-sky-500/30"
                      : "bg-slate-800 text-slate-400 border-white/[0.06] hover:text-white"
                  }`}>
                  {g.label}
                </button>
              ))}
            </div>

            <button
              onClick={runSmartMatch}
              disabled={smartLoading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-sm font-bold transition-all shadow shadow-sky-500/20 disabled:opacity-50"
            >
              {smartLoading
                ? <><PiCircleNotch size={15} className="animate-spin"/> Finding matches…</>
                : <><PiInfo size={15}/> Find My Best Mentors</>
              }
            </button>

            {/* Match basis explanation */}
            {matchBasis.length > 0 && (
              <div className="pt-1">
                <p className="text-slate-500 text-[10px] font-semibold tracking-widest uppercase mb-1.5">Matching based on:</p>
                <div className="flex flex-wrap gap-1.5">
                  {matchBasis.map((b, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-white/[0.05]">{b}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Smart match results */}
          {smartMode && !smartLoading && (
            <div>
              <p className="text-sky-400 text-xs font-semibold mb-3">
                {smartResults.length > 0
                  ? `${smartResults.length} mentor${smartResults.length !== 1 ? "s" : ""} matched for "${GOAL_OPTIONS.find(g => g.value === smartGoal)?.label}"`
                  : "No matches found. Try a different goal or complete your profile with skills and department."}
              </p>
              {smartResults.length > 0 && (
                <div className="space-y-3">
                  {smartResults.map(m => (
                    <MentorCard key={m._id} mentor={m} onRequest={setRequestTarget}
                      matchScore={m.matchScore} matchBreakdown={m.matchBreakdown}/>
                  ))}
                </div>
              )}
              <div className="mt-3 pt-3 border-t border-white/[0.06]">
                <p className="text-slate-600 text-xs text-center">
                  ↓ All available mentors are shown below
                </p>
              </div>
            </div>
          )}

          {/* Regular search + filter */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <PiMagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, skill, or department…"
                className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-slate-900 border border-white/[0.07] text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"/>
            </div>
            <div className="flex gap-1 bg-slate-900 border border-white/[0.07] rounded-lg p-1">
              {["All","Alumni","Teacher"].map(r => (
                <button key={r} onClick={() => setFilterRole(r)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${filterRole===r?"bg-sky-500/15 text-sky-400":"text-slate-500 hover:text-slate-300"}`}>{r}</button>
              ))}
            </div>
          </div>

          {loadingMentors ? (
            <div className="min-h-48 flex items-center justify-center"><PiCircleNotch size={28} className="text-sky-400 animate-spin"/></div>
          ) : filtered.length === 0 ? (
            <div className="min-h-48 flex flex-col items-center justify-center text-center bg-slate-900 border border-white/[0.07] rounded-xl px-6">
              <PiHandshake size={24} className="text-slate-600 mb-2"/>
              <p className="text-slate-400 text-sm">{mentors.length===0?"No mentors available yet. Alumni and teachers need to enable availability.":"No mentors match your search."}</p>
            </div>
          ) : (
            <div className="space-y-3">{filtered.map(m => <MentorCard key={m._id} mentor={m} onRequest={setRequestTarget}/>)}</div>
          )}
        </div>
      )}

      {/* ── My Sessions ── */}
      {tab === "active" && (
        <div className="space-y-3">
          {loadingRequests ? (
            <div className="min-h-48 flex items-center justify-center"><PiCircleNotch size={28} className="text-sky-400 animate-spin"/></div>
          ) : activeRequests.length === 0 ? (
            <div className="min-h-60 flex flex-col items-center justify-center text-center bg-slate-900 border border-white/[0.07] rounded-xl px-6">
              <PiHandshake size={28} className="text-slate-600 mb-3"/>
              <p className="text-slate-300 font-semibold">No active sessions</p>
              <p className="text-slate-500 text-sm mt-1">Send a request to a mentor to get started.</p>
              <button onClick={() => setTab("find")} className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400 text-sm font-semibold hover:bg-sky-500/20 transition-all">Browse Mentors <PiArrowRight size={14}/></button>
            </div>
          ) : (
            activeRequests.map(s => (
              <div key={s._id} className="bg-slate-900 border border-sky-500/20 rounded-xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm ${s.mentor?.role==="Alumni"?"bg-gradient-to-br from-emerald-400 to-emerald-600":"bg-gradient-to-br from-violet-400 to-violet-600"}`}>{s.mentor?.name?.charAt(0)||"?"}</div>
                    <div><p className="text-white font-semibold text-sm">{s.mentor?.name}</p><p className="text-slate-500 text-xs">{s.mentor?.role}</p></div>
                  </div>
                  <div className="flex items-center gap-2"><GoalBadge goal={s.goal}/><span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/25">Active</span></div>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <PiClock size={12} className="text-slate-600"/>
                  Slot: <span className="text-slate-200 font-medium ml-1">{s.slot?.day} · {s.slot?.time}</span>
                  <span className="text-slate-600 ml-2">Accepted {s.respondedAt ? new Date(s.respondedAt).toLocaleDateString() : "--"}</span>
                </div>
                <div className="flex items-start gap-2 bg-sky-500/5 border border-sky-500/15 rounded-lg p-3">
                  <PiInfo size={13} className="text-sky-400 flex-shrink-0 mt-0.5"/>
                  <p className="text-slate-400 text-xs leading-relaxed">Chat is enabled — use it to coordinate and share meeting links.</p>
                </div>
                <button onClick={() => navigate(`/student/messages?session=${s._id}`)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-400 text-sm font-bold hover:bg-sky-500/25 transition-all w-full justify-center">
                  <PiChatCircleText size={15}/> Open Chat with {s.mentor?.name}
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── History ── */}
      {tab === "history" && (
        <div className="space-y-3">
          {loadingRequests ? (
            <div className="min-h-48 flex items-center justify-center"><PiCircleNotch size={28} className="text-sky-400 animate-spin"/></div>
          ) : historyRequests.length === 0 ? (
            <div className="min-h-60 flex flex-col items-center justify-center text-center bg-slate-900 border border-white/[0.07] rounded-xl px-6">
              <PiClockCountdown size={28} className="text-slate-600 mb-3"/><p className="text-slate-300 font-semibold">No history entries yet</p>
            </div>
          ) : (
            historyRequests.map(h => (
              <div key={h._id} className="bg-slate-900 border border-white/[0.07] rounded-xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white font-bold text-sm">{h.mentor?.name?.charAt(0)||"?"}</div>
                    <div><p className="text-white font-semibold text-sm">{h.mentor?.name}</p><p className="text-slate-500 text-xs">{h.mentor?.role} · {h.status}</p></div>
                  </div>
                  <GoalBadge goal={h.goal}/>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <PiClock size={12}/> {h.slot?.day} · {h.slot?.time} · {new Date(h.createdAt).toLocaleDateString()}
                </div>
                {h.status === "Completed" && h.rating?.value && (
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map(s => <span key={s} className={s <= h.rating.value ? "text-amber-400 text-sm" : "text-slate-600 text-sm"}>★</span>)}
                    <span className="text-slate-500 text-xs ml-1">Your rating</span>
                    {h.rating.feedback && <span className="text-slate-600 text-xs ml-1">· "{h.rating.feedback.slice(0,40)}{h.rating.feedback.length > 40 ? '...' : ''}"</span>}
                  </div>
                )}
                {h.status === "Completed" && !h.rating?.value && (
                  <button onClick={() => setRateTarget({ ...h, mentorName: h.mentor?.name })}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold hover:bg-amber-500/20 transition-all">
                    <PiStar size={13}/> Rate this session
                  </button>
                )}
                {h.rating && (
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map(s => s<=h.rating ? <PiStarFill key={s} size={13} className="text-amber-400"/> : <PiStar key={s} size={13} className="text-slate-600"/>)}
                    <span className="text-slate-500 text-xs ml-1">Your rating</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Request modal */}
      {requestTarget && (
        <RequestModal
          mentor={requestTarget}
          onClose={() => setRequestTarget(null)}
          onSuccess={() => { fetchRequests(); fetchMentors(); }}
        />
      )}

      {/* Rate modal */}
      {rateTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/[0.07] rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <div><h3 className="text-white font-bold">Rate Your Session</h3><p className="text-slate-500 text-xs mt-0.5">with {rateTarget.mentorName}</p></div>
              <button onClick={() => setRateTarget(null)} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800"><PiX size={16}/></button>
            </div>
            <div className="flex justify-center mb-5">
              <StarRatingInput value={rateTarget.pendingRating||0} onChange={v => setRateTarget(p => ({ ...p, pendingRating: v }))}/>
            </div>
            <textarea placeholder="What did you find most helpful? (optional)" rows={3}
              className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-white/[0.07] text-slate-200 placeholder-slate-500 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500 mb-4"
              onChange={e => setRateTarget(p => ({ ...p, feedback: e.target.value }))}/>
            <div className="flex gap-2">
              <button onClick={() => setRateTarget(null)} className="flex-1 py-2.5 rounded-lg bg-slate-800 border border-white/[0.07] text-slate-300 text-sm font-semibold hover:bg-slate-700 transition-all">Skip</button>
              <button disabled={!rateTarget.pendingRating}
                onClick={async () => {
                  try {
                    await axios.post(
                      `http://localhost:4000/api/v1/mentorship/requests/${rateTarget._id}/rate`,
                      { value: rateTarget.pendingRating, feedback: rateTarget.feedback || "" },
                      { withCredentials: true }
                    );
                    setRequests(prev => prev.map(r => r._id === rateTarget._id
                      ? { ...r, rating: { value: rateTarget.pendingRating, feedback: rateTarget.feedback || "" } }
                      : r
                    ));
                    toast.success("Rating submitted! Thank you for your feedback.");
                  } catch(err) {
                    toast.error(err.response?.data?.message || "Failed to submit rating.");
                  } finally {
                    setRateTarget(null);
                  }
                }}
                className="flex-1 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-white text-sm font-bold transition-all shadow shadow-amber-500/30 disabled:opacity-40 disabled:cursor-not-allowed">
                Submit Rating
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Mentorship;
