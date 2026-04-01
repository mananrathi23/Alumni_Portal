import React from "react";
import { PiHandshake, PiUsersThree } from "react-icons/pi";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";

const Requests = () => {
  const navigate = useNavigate();

const [requests, setRequests] = useState([]);

useEffect(() => {
  axios.get("http://localhost:4000/api/v1/mentorship/requests", {
    withCredentials: true
  })
  .then(res => setRequests(res.data.requests))
}, []);

  return (
    <div className="max-w-4xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">My Mentorship Requests</h2>
          <p className="text-slate-400 text-sm mt-0.5">Track your requests to alumni mentors</p>
        </div>
        {requests.length > 0 && (
          <div className="inline-flex items-center gap-2 bg-sky-500/10 border border-sky-500/20 rounded-full px-4 py-1.5">
            <span className="text-sky-400 text-xs font-semibold">{requests.length} Request{requests.length !== 1 ? "s" : ""}</span>
          </div>
        )}
      </div>

      {/* Content */}
      {requests.length === 0 ? (
        <div className="min-h-72 flex flex-col items-center justify-center text-center bg-slate-900 border border-white/[0.07] rounded-xl px-6">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
            <PiHandshake size={28} className="text-slate-600" />
          </div>
          <p className="text-slate-300 font-semibold">No mentorship requests yet</p>
          <p className="text-slate-500 text-sm mt-1 max-w-xs">
            Browse the alumni directory and send a mentorship request to someone in your field.
          </p>
          <button
            onClick={() => navigate("/student/alumni")}
            className="mt-5 flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400 text-sm font-semibold hover:bg-sky-500/20 transition-all"
          >
            <PiUsersThree size={16} /> Browse Alumni
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => {
            const mentorName = r?.mentor?.name || "Unknown Mentor";
            const statusColor = {
              Pending: "bg-amber-500/10 text-amber-300 border-amber-500/20",
              Accepted: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
              Rejected: "bg-red-500/10 text-red-300 border-red-500/20",
              Cancelled: "bg-slate-600/10 text-slate-300 border-slate-500/20",
            }[r.status] || "bg-slate-700/10 text-slate-300 border-slate-600/20";

            return (
              <div key={r._id || r.id} className="bg-slate-900 border border-white/[0.07] rounded-xl p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                      {(mentorName || "?").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">{mentorName}</p>
                      <p className="text-slate-500 text-xs">Goal: {r.goal || "N/A"}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${statusColor}`}>{r.status || "Unknown"}</span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-400">
                  <div className="bg-slate-800/60 border border-white/[0.04] rounded-lg px-3 py-2">
                    <p className="font-semibold text-slate-200">Slot</p>
                    <p>{r?.slot?.day || "?"} · {r?.slot?.time || "?"}</p>
                  </div>
                  <div className="bg-slate-800/60 border border-white/[0.04] rounded-lg px-3 py-2">
                    <p className="font-semibold text-slate-200">Requested</p>
                    <p>{new Date(r.requestedAt || Date.now()).toLocaleString()}</p>
                  </div>
                </div>

                {r.note && (
                  <p className="text-slate-400 text-sm bg-slate-800/60 border border-white/[0.04] rounded-lg px-3 py-2 mt-3">
                    "{r.note}"
                  </p>
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
