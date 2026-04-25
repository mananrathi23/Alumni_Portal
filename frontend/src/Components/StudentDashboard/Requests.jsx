// Requests.jsx — Student's sent mentorship requests tracker
// Shows all statuses: Pending, Accepted, Rejected, Cancelled with actions

import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../../SocketContext";
import {
  PiHandshake, PiUsersThree, PiClock, PiX, PiCheck,
  PiChatCircleText, PiArrowRight, PiCircleNotch,
  PiCalendarBlank, PiBookOpen, PiWarningCircle, PiHourglassMedium,
} from "react-icons/pi";

const API = `${import.meta.env.VITE_BACKEND_URL}/api/v1/mentorship`;

const GOAL_LABELS = {
  career: "Career Guidance", resume: "Resume Review",
  interview: "Interview Prep", technical: "Technical Help", general: "General Advice",
};

const STATUS_CFG = {
  Pending:   { bg: "bg-amber-500/10 border-amber-500/25",   text: "text-amber-400",  dot: "bg-amber-400 animate-pulse", label: "Pending" },
  Accepted:  { bg: "bg-emerald-500/10 border-emerald-500/25", text: "text-emerald-400", dot: "bg-emerald-400", label: "Accepted" },
  Rejected:  { bg: "bg-red-500/10 border-red-500/25",       text: "text-red-400",    dot: "bg-red-400",    label: "Declined" },
  Cancelled: { bg: "bg-slate-700/50 border-slate-600/50",   text: "text-slate-500",  dot: "bg-slate-500",  label: "Cancelled" },
  Completed: { bg: "bg-sky-500/10 border-sky-500/25",       text: "text-sky-400",    dot: "bg-sky-400",    label: "Completed" },
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
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${c[goal]||c.general}`}>
      <PiBookOpen size={10}/>{GOAL_LABELS[goal]||goal}
    </span>
  );
};

const Requests = () => {
  const navigate = useNavigate();
  const { socketRef, isSocketReady } = useSocket();

  const [requests, setRequests]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState("All");
  const [cancelling, setCancelling] = useState(null);

  const fetchRequests = async () => {
    try {
      const res = await axios.get(`${API}/requests`, { withCredentials: true });
      setRequests(res.data.requests || []);
    } catch { toast.error("Failed to load requests."); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRequests(); }, []);

  // Real-time: refresh when status changes
  useEffect(() => {
    if (!isSocketReady || !socketRef.current) return;
    const socket = socketRef.current;
    const refresh = () => fetchRequests();
    socket.on("mentorship:accepted",   refresh);
    socket.on("mentorship:rejected",   refresh);
    socket.on("mentorship:slot_taken", refresh);
    socket.on("mentorship:completed",  refresh);
    return () => {
      socket.off("mentorship:accepted",   refresh);
      socket.off("mentorship:rejected",   refresh);
      socket.off("mentorship:slot_taken", refresh);
      socket.off("mentorship:completed",  refresh);
    };
  }, [isSocketReady]);

  const cancel = async (id) => {
    setCancelling(id);
    try {
      await axios.delete(`${API}/requests/${id}/cancel`, { withCredentials: true });
      setRequests(prev => prev.map(r => r._id === id ? { ...r, status: "Cancelled" } : r));
      toast.success("Request withdrawn.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cancel.");
    } finally { setCancelling(null); }
  };

  const FILTERS = ["All", "Pending", "Accepted", "Rejected"];
  const filtered = filter === "All" ? requests : requests.filter(r => r.status === filter);

  const counts = FILTERS.reduce((acc, f) => ({
    ...acc,
    [f]: f === "All" ? requests.length : requests.filter(r => r.status === f).length,
  }), {});

  if (loading) return (
    <div className="min-h-60 flex items-center justify-center">
      <PiCircleNotch size={28} className="text-sky-400 animate-spin"/>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">My Mentorship Requests</h2>
          <p className="text-slate-400 text-sm mt-0.5">Track all your sent requests</p>
        </div>
        <button onClick={() => navigate("/student/mentorship")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400 text-sm font-semibold hover:bg-sky-500/20 transition-all self-start sm:self-auto">
          <PiHandshake size={15}/> Find Mentors
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-slate-900 border border-white/[0.07] rounded-xl p-1">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              filter === f ? "bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/30" : "text-slate-400 hover:text-white"
            }`}>
            {f}
            {counts[f] > 0 && (
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${filter===f?"bg-sky-500/30 text-sky-300":"bg-slate-700 text-slate-400"}`}>
                {counts[f]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Request cards */}
      {filtered.length === 0 ? (
        <div className="min-h-60 flex flex-col items-center justify-center text-center bg-slate-900 border border-white/[0.07] rounded-xl px-6">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
            <PiHandshake size={28} className="text-slate-600"/>
          </div>
          <p className="text-slate-300 font-semibold">No {filter !== "All" ? filter.toLowerCase() : ""} requests</p>
          <p className="text-slate-500 text-sm mt-1 max-w-xs">
            {filter === "All"
              ? "Send a mentorship request to get started."
              : `No ${filter.toLowerCase()} requests yet.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => {
            const cfg = STATUS_CFG[r.status] || STATUS_CFG.Pending;
            return (
              <div key={r._id} className="bg-slate-900 border border-white/[0.07] rounded-xl p-4 sm:p-5 space-y-3">

                {/* Top row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
                      r.mentor?.role === "Alumni"
                        ? "bg-gradient-to-br from-emerald-400 to-emerald-600"
                        : "bg-gradient-to-br from-violet-400 to-violet-600"
                    }`}>
                      {r.mentor?.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-white font-semibold text-sm">{r.mentor?.name || "Mentor"}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          r.mentor?.role === "Alumni"
                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25"
                            : "bg-violet-500/15 text-violet-400 border-violet-500/25"
                        }`}>{r.mentor?.role}</span>
                      </div>
                      <p className="text-slate-500 text-xs mt-0.5">
                        Requested {new Date(r.createdAt || r.requestedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Status badge */}
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold flex-shrink-0 ${cfg.bg} ${cfg.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}/>
                    {cfg.label}
                  </div>
                </div>

                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-3">
                  <GoalBadge goal={r.goal}/>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <PiCalendarBlank size={12} className="text-slate-600"/>
                    <span>{r.slot?.day} · {r.slot?.time}</span>
                  </div>
                </div>

                {/* Note */}
                {r.note && (
                  <p className="text-slate-400 text-sm bg-slate-800/60 border border-white/[0.04] rounded-lg px-3 py-2 leading-relaxed italic">
                    "{r.note}"
                  </p>
                )}

                {/* Status-specific actions */}
                {r.status === "Pending" && (
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <PiHourglassMedium size={13} className="text-amber-400"/>
                      Waiting for mentor response
                    </div>
                    <button
                      onClick={() => cancel(r._id)}
                      disabled={cancelling === r._id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-all disabled:opacity-50">
                      {cancelling === r._id
                        ? <PiCircleNotch size={12} className="animate-spin"/>
                        : <PiX size={12}/>
                      }
                      Withdraw
                    </button>
                  </div>
                )}

                {r.status === "Accepted" && (
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 bg-emerald-500/5 border border-emerald-500/15 rounded-lg px-3 py-2">
                      <PiCheck size={13} className="text-emerald-400 flex-shrink-0 mt-0.5"/>
                      <p className="text-emerald-300 text-xs leading-relaxed">
                        Request accepted! Chat is open — coordinate your session and share a meeting link there.
                      </p>
                    </div>
                    <button onClick={() => navigate(`/student/messages?session=${r._id}`)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-sm font-bold hover:bg-emerald-500/25 transition-all w-full justify-center">
                      <PiChatCircleText size={15}/> Open Chat with {r.mentor?.name}
                    </button>
                  </div>
                )}

                {r.status === "Rejected" && (
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <PiWarningCircle size={13} className="text-slate-600"/>
                      This request wasn't accepted — try another mentor or slot
                    </div>
                    <button onClick={() => navigate("/student/mentorship")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold hover:bg-sky-500/20 transition-all">
                      Find Another <PiArrowRight size={12}/>
                    </button>
                  </div>
                )}

                {r.status === "Completed" && (
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <PiCheck size={12} className="text-sky-400"/>
                    Session completed {r.completedAt ? `on ${new Date(r.completedAt).toLocaleDateString()}` : ""}
                    {!r.rating?.value && (
                      <button onClick={() => navigate(`/student/mentorship`)}
                        className="ml-auto flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold hover:bg-amber-500/20 transition-all">
                        ★ Rate Session
                      </button>
                    )}
                    {r.rating?.value && (
                      <div className="ml-auto flex items-center gap-1">
                        {[1,2,3,4,5].map(s =>
                          <span key={s} className={s <= r.rating.value ? "text-amber-400" : "text-slate-600"}>★</span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Requests;
