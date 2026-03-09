import React, { useState } from "react";
import { PiCalendarCheck } from "react-icons/pi";

const TABS = ["Upcoming", "My Events", "Past"];

const Events = () => {
  const [activeTab, setActiveTab] = useState("Upcoming");

  // 🔴 Backend later: events from API
  const upcomingEvents = [];
  const myEvents       = [];
  const pastEvents     = [];

  const countMap = { "Upcoming": upcomingEvents.length, "My Events": myEvents.length, "Past": pastEvents.length };
  const emptyMsg = {
    "Upcoming":  ["No upcoming events",     "Check back later for new events"],
    "My Events": ["No registered events",   "Events you register for will appear here"],
    "Past":      ["No past events",         "Past events will be listed here"],
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Events Calendar</h2>
          <p className="text-slate-400 text-sm mt-0.5">Network and learn at alumni-student events</p>
        </div>
        <div className="inline-flex items-center gap-2 bg-sky-500/10 border border-sky-500/20 rounded-full px-4 py-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
          <span className="text-sky-400 text-xs font-semibold">{upcomingEvents.length} Upcoming</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-900 border border-white/[0.07] rounded-xl p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all duration-150 ${
              activeTab === tab
                ? "bg-sky-500 text-white shadow shadow-sky-500/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            {tab}{countMap[tab] > 0 ? ` (${countMap[tab]})` : ""}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-72 flex flex-col items-center justify-center text-center bg-slate-900 border border-white/[0.07] rounded-xl">
        <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
          <PiCalendarCheck size={28} className="text-slate-600" />
        </div>
        <p className="text-slate-300 font-semibold">{emptyMsg[activeTab][0]}</p>
        <p className="text-slate-500 text-sm mt-1">{emptyMsg[activeTab][1]}</p>
        {/* 🔴 Backend later: map event cards */}
      </div>

    </div>
  );
};

export default Events;
