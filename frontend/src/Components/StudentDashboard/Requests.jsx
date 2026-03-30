import React, { useState } from "react";
import {
  PiHandshake, PiUsersThree, PiClock, PiCheck, PiX,
  PiClockCountdown, PiBookOpen, PiCalendarBlank,
  PiArrowRight, PiHourglassMedium, PiWarningCircle,
  PiChatCircleText,
} from "react-icons/pi";
import { useNavigate } from "react-router-dom";

const GOAL_LABELS = {
  career: "Career Guidance",
  resume: "Resume Review",
  interview: "Interview Prep",
  technical: "Technical Help",
  general: "General Advice",
};

const MOCK_REQUESTS = [
  {
    id: "req1",
    mentorName: "Aarav Kumar",
    mentorRole: "Alumni",
    mentorCompany: "Google",
    mentorDesignation: "SDE II",
    goal: "interview",
    note: "Preparing for product-based companies. Need help with DSA rounds and system design.",
    requestedSlot: { day: "Wed", time: "5:00 PM" },
    sentAt: "2 hours ago",
    status: "Pending",
  },
  {
    id: "req2",
    mentorName: "Priya Nair",
    mentorRole: "Alumni",
    mentorCompany: "Flipkart",
    mentorDesignation: "Product Manager",
    goal: "career",
    note: "Confused between SDE and PM roles. Would love your perspective.",
    requestedSlot: { day: "Mon", time: "7:00 PM" },
    sentAt: "1 day ago",
    status: "Accepted",
  },
  {
    id: "req3",
    mentorName: "Dr. Sunita Verma",
    mentorRole: "Teacher",
    mentorCompany: null,
    mentorDesignation: "Associate Professor",
    goal: "technical",
    note: "Need guidance on my final year ML project.",
    requestedSlot: { day: "Thu", time: "3:00 PM" },
    sentAt: "3 days ago",
    status: "Rejected",
  },
];

const STATUS_CONFIG = {
  Pending: {
    label: "Pending", bg: "bg-amber-500/10 border-amber-500/20",
    text: "text-amber-400", dot: "bg-amber-400", icon: PiHourglassMedium,
  },
  Accepted: {
    label: "Accepted", bg: "bg-emerald-500/10 border-emerald-500/20",
    text: "text-emerald-400", dot: "bg-emerald-400", icon: PiCheck,
  },
  Rejected: {
    label: "Declined", bg: "bg-red-500/10 border-red-500/20",
    text: "text-red-400", dot: "bg-red-400", icon: PiX,
  },
  Expired: {
    label: "Expired", bg: "bg-slate-800 border-slate-700",
    text: "text-slate-500", dot: "bg-slate-600", icon: PiClockCountdown,
  },
};

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
      <PiBookOpen size={10} /> {GOAL_LABELS[goal]}
    </span>
  );
};

const Requests = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState(MOCK_REQUESTS);
  const [filter, setFilter] = useState("All");

  const counts = {
    All: requests.length,
    Pending: requests.filter((r) => r.status === "Pending").length,
    Accepted: requests.filter((r) => r.status === "Accepted").length,
  };

  const filtered = filter === "All" ? requests : requests.filter((r) => r.status === filter);

  const withdraw = (id) => setRequests((prev) => prev.filter((r) => r.id !== id));

  return (
    <div className="max-w-4xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">My Mentorship Requests</h2>
          <p className="text-slate-400 text-sm mt-0.5">Track all requests you've sent to mentors</p>
        </div>
        <button
          onClick={() => navigate("/student/mentorship")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400 text-sm font-semibold hover:bg-sky-500/20 transition-all self-start sm:self-auto"
        >
          <PiHandshake size={15} /> Find a Mentor
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Sent", value: requests.length, color: "sky" },
          { label: "Pending", value: counts.Pending, color: "amber" },
          { label: "Accepted", value: counts.Accepted, color: "emerald" },
        ].map(({ label, value, color }) => {
          const c = {
            sky: "text-sky-400 bg-sky-500/10 border-sky-500/20",
            amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
            emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
          }[color];
          return (
            <div key={label} className={`rounded-xl p-4 border ${c} text-center`}>
              <p className={`text-2xl font-bold ${c.split(" ")[0]}`}>{value}</p>
              <p className="text-slate-400 text-xs mt-0.5 font-medium">{label}</p>
            </div>
          );
        })}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-slate-900 border border-white/[0.07] rounded-xl p-1">
        {["All", "Pending", "Accepted"].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
              filter === f ? "bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/30" : "text-slate-400 hover:text-white"
            }`}>
            {f}
            {counts[f] > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${filter === f ? "bg-sky-500/30 text-sky-300" : "bg-slate-700 text-slate-400"}`}>
                {counts[f]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="min-h-60 flex flex-col items-center justify-center text-center bg-slate-900 border border-white/[0.07] rounded-xl px-6 py-10">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
            <PiHandshake size={28} className="text-slate-600" />
          </div>
          <p className="text-slate-300 font-semibold">No requests here</p>
          <p className="text-slate-500 text-sm mt-1 max-w-xs">Go to Mentorship to browse mentors and send requests.</p>
          <button onClick={() => navigate("/student/mentorship")}
            className="mt-5 flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400 text-sm font-semibold hover:bg-sky-500/20 transition-all">
            <PiUsersThree size={16} /> Browse Mentors <PiArrowRight size={13} />
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const s = STATUS_CONFIG[r.status];
            return (
              <div key={r.id}
                className={`bg-slate-900 border rounded-xl p-4 sm:p-5 space-y-3 ${r.status === "Accepted" ? "border-emerald-500/20" : "border-white/[0.07]"}`}>

                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-base flex-shrink-0 ${
                      r.mentorRole === "Alumni" ? "bg-gradient-to-br from-emerald-400 to-emerald-600" : "bg-gradient-to-br from-violet-400 to-violet-600"
                    }`}>
                      {r.mentorName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-white font-semibold text-sm">{r.mentorName}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          r.mentorRole === "Alumni" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25" : "bg-violet-500/15 text-violet-400 border-violet-500/25"
                        }`}>{r.mentorRole}</span>
                      </div>
                      <p className="text-slate-500 text-xs mt-0.5">{r.mentorDesignation}{r.mentorCompany && ` · ${r.mentorCompany}`}</p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold flex-shrink-0 ${s.bg} ${s.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${s.dot} ${r.status === "Pending" ? "animate-pulse" : ""}`} />
                    {s.label}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <GoalBadge goal={r.goal} />
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <PiCalendarBlank size={12} className="text-slate-600" />
                    Requested: <span className="text-slate-200 font-medium ml-1">{r.requestedSlot.day} · {r.requestedSlot.time}</span>
                  </div>
                  <span className="text-slate-600 text-xs ml-auto">Sent {r.sentAt}</span>
                </div>

                {r.note && (
                  <p className="text-slate-400 text-sm bg-slate-800/60 border border-white/[0.04] rounded-lg px-3 py-2 leading-relaxed italic">"{r.note}"</p>
                )}

                {r.status === "Pending" && (
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <PiHourglassMedium size={13} className="text-amber-400" />
                      Auto-cancels if no response in 48 hrs
                    </div>
                    <button onClick={() => withdraw(r.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-all">
                      <PiX size={12} /> Withdraw
                    </button>
                  </div>
                )}

                {r.status === "Accepted" && (
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 bg-emerald-500/5 border border-emerald-500/15 rounded-lg px-3 py-2">
                      <PiCheck size={13} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                      <p className="text-emerald-300 text-xs leading-relaxed">
                        Request accepted! Chat is now enabled — share meeting links and coordinate there.
                      </p>
                    </div>
                    <button onClick={() => navigate("/student/messages")}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-sm font-bold hover:bg-emerald-500/25 transition-all w-full justify-center">
                      <PiChatCircleText size={15} /> Open Chat with {r.mentorName}
                    </button>
                  </div>
                )}

                {r.status === "Rejected" && (
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <PiWarningCircle size={13} className="text-slate-600" />
                      You can request a different mentor
                    </div>
                    <button onClick={() => navigate("/student/mentorship")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold hover:bg-sky-500/20 transition-all">
                      Find Another <PiArrowRight size={12} />
                    </button>
                  </div>
                )}

                {r.status === "Expired" && (
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <PiClockCountdown size={13} className="text-slate-600" />
                      Request expired after 48 hours
                    </div>
                    <button onClick={() => navigate("/student/mentorship")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold hover:bg-sky-500/20 transition-all">
                      Try Again <PiArrowRight size={12} />
                    </button>
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
