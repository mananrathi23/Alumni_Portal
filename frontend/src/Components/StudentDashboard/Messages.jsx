// src/Components/StudentDashboard/Messages.jsx

import React, { useState } from "react";
import { FaSearch } from "react-icons/fa";

const Messages = () => {
  /* =====================================
     FRONTEND STATE (TEMPORARY)
     =====================================
     🔴 Backend later:
     - conversations fetched from API
     - selected conversation handled by id
  */
  const [search, setSearch] = useState("");

  // TEMP: no conversations yet
  const conversations = [];

  return (
    <div className="bg-white border rounded-xl h-[calc(100vh-140px)] flex overflow-hidden">

      {/*LEFT PANEL*/}
      <div className="w-full md:w-1/3 border-r p-4 flex flex-col gap-4">

        <h2 className="text-lg font-semibold text-gray-800">
          Messages
        </h2>

        {/* Search */}
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            /* 🔴 Backend:
               debounce + filter conversations */
          />
        </div>

        {/* Conversation List */}
        <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500">
          {conversations.length === 0 ? (
            <>
              <p className="font-medium">No conversations yet</p>
              <p className="text-sm mt-1">
                Start connecting with alumni!
              </p>
            </>
          ) : (
            /* 🔴 Backend later:
               map conversation items here */
            <></>
          )}
        </div>
      </div>

      {/*RIGHT PANEL*/}
      <div className="hidden md:flex flex-1 items-center justify-center text-center text-gray-500 px-6">
        <div>
          <p className="font-medium">
            Select a conversation to start messaging
          </p>
          <p className="text-sm mt-1">
            Connect with alumni to grow your network
          </p>
        </div>
      </div>

    </div>
  );
};

export default Messages;