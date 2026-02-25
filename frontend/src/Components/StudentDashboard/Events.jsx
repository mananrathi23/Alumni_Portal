import React, { useState } from "react";
import { FaCalendarAlt } from "react-icons/fa";

const Events = () => {

  /* =====================================
     FRONTEND STATE (TEMPORARY)
     =====================================
     🔴 Backend later:
     - events fetched from API
     - counts derived from backend
  */
  const [activeTab, setActiveTab] = useState("Upcoming");

  // TEMP: empty events
  const upcomingEvents = [];
  const myEvents = [];
  const pastEvents = [];

  return (
    <div className="bg-white rounded-xl border p-6 space-y-6">

      {/*HEADER*/}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            Events Calendar
          </h2>
          <p className="text-sm text-gray-500">
            Network and learn at alumni-student events
          </p>
        </div>

        {/* Count Badge */}
        <div className="px-4 py-1.5 rounded-full border text-sm font-medium text-gray-700 bg-gray-50">
          {upcomingEvents.length} Upcoming Events
          {/* 🔴 Backend: upcoming events count */}
        </div>
      </div>

      {/*TABS*/}
      <div className="flex flex-wrap gap-2 bg-gray-100 p-1 rounded-full w-fit">

        <button
          onClick={() => setActiveTab("Upcoming")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition
            ${
              activeTab === "Upcoming"
                ? "bg-white shadow text-gray-900"
                : "text-gray-600 hover:text-gray-900"
            }`}
        >
          Upcoming Events
        </button>

        <button
          onClick={() => setActiveTab("My")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition
            ${
              activeTab === "My"
                ? "bg-white shadow text-gray-900"
                : "text-gray-600 hover:text-gray-900"
            }`}
        >
          My Events ({myEvents.length})
          {/* 🔴 Backend: my registered events */}
        </button>

        <button
          onClick={() => setActiveTab("Past")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition
            ${
              activeTab === "Past"
                ? "bg-white shadow text-gray-900"
                : "text-gray-600 hover:text-gray-900"
            }`}
        >
          Past Events
        </button>

      </div>

      {/*CONTENT*/}
      <div className="min-h-[260px] flex flex-col items-center justify-center text-center text-gray-500">

        {activeTab === "Upcoming" && upcomingEvents.length === 0 && (
          <>
            <FaCalendarAlt className="text-5xl text-gray-300 mb-4" />
            <p className="font-medium">No upcoming events</p>
            <p className="text-sm mt-1">
              Check back later for new events
            </p>
          </>
        )}

        {activeTab === "My" && myEvents.length === 0 && (
          <>
            <FaCalendarAlt className="text-5xl text-gray-300 mb-4" />
            <p className="font-medium">No registered events</p>
            <p className="text-sm mt-1">
              Events you register for will appear here
            </p>
          </>
        )}

        {activeTab === "Past" && pastEvents.length === 0 && (
          <>
            <FaCalendarAlt className="text-5xl text-gray-300 mb-4" />
            <p className="font-medium">No past events</p>
            <p className="text-sm mt-1">
              Past events will be listed here
            </p>
          </>
        )}

        {/* 🔴 Backend later:
            - map event cards here based on activeTab */}
      </div>

    </div>
  );
};

export default Events;