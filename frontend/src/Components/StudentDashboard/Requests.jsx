import React from "react";
import { PiHandshake, PiUsersThree } from "react-icons/pi";
import { useNavigate } from "react-router-dom";

const Requests = () => {
  const navigate = useNavigate();

  // 🔴 Backend later: mentorship requests from API
  const requests = [];

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
        // 🔴 Backend later: map request cards
        <></>
      )}
    </div>
  );
};

export default Requests;
