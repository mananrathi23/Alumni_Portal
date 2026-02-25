import React from "react";
import { FaRegCommentDots } from "react-icons/fa";

const Requests = () => {
  /* =====================================
     FRONTEND ONLY (TEMPORARY)
     =====================================
     🔴 Backend later:
     - fetch mentorship requests for logged-in student
     - status: pending / accepted / rejected
  */

  // TEMP: no requests
  const requests = [];

  return (
    <div className="bg-white rounded-xl border p-6 space-y-6">

      {/*HEADER*/}
      <div>
        <h2 className="text-xl font-semibold text-gray-800">
          My Mentorship Requests
        </h2>
        <p className="text-sm text-gray-500">
          Track your mentorship requests to alumni
        </p>
      </div>

      {/*CONTENT*/}
      <div className="min-h-[260px] flex flex-col items-center justify-center text-center text-gray-500">

        {requests.length === 0 ? (
          <>
            <FaRegCommentDots className="text-5xl text-gray-300 mb-4" />
            <p className="font-medium">
              No mentorship requests yet
            </p>
            <p className="text-sm mt-1">
              Browse the alumni directory and request mentorship
            </p>
          </>
        ) : (
          /* 🔴 Backend later:
             map request cards here */
          <></>
        )}

      </div>

    </div>
  );
};

export default Requests;