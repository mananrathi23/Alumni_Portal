import React from "react";
import { useNavigate } from "react-router-dom";
import { PiStar, PiX, PiArrowRight, PiCheck } from "react-icons/pi";

const CHECKLIST = [
  { label: "Enrollment Number", key: "enrollmentNumber" },
  { label: "Department",        key: "department",   check: (v) => v && v !== "Not Set" },
  { label: "Year",              key: "year" },
  { label: "Bio",               key: "bio" },
];

const ProfileIncompleteModal = ({ student, onClose }) => {
  const navigate = useNavigate();

  const goToProfile = () => {
    onClose();
    navigate("/student/profile");
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-white/[0.07] rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">

        {/* Top accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-amber-400 to-orange-500" />

        <div className="p-6">
          {/* Close */}
          <div className="flex items-start justify-between mb-4">
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <PiStar size={22} className="text-amber-400" />
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-all"
            >
              <PiX size={16} />
            </button>
          </div>

          <h3 className="text-white font-bold text-lg leading-tight">
            Complete your profile
          </h3>
          <p className="text-slate-400 text-sm mt-1 mb-5">
            A complete profile helps alumni and teachers connect with you more easily.
          </p>

          {/* Checklist */}
          <div className="space-y-2 mb-6">
            {CHECKLIST.map(({ label, key, check }) => {
              const val = student?.[key];
              const done = check ? check(val) : !!val;
              return (
                <div key={key} className="flex items-center gap-3">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                    done
                      ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400"
                      : "bg-slate-800 border border-white/[0.07] text-slate-600"
                  }`}>
                    {done ? <PiCheck size={11} /> : "·"}
                  </span>
                  <span className={`text-sm ${done ? "text-slate-400 line-through" : "text-slate-300"}`}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg bg-slate-800 border border-white/[0.07] text-slate-400 text-sm font-semibold hover:text-white hover:bg-slate-700 transition-all"
            >
              Later
            </button>
            <button
              onClick={goToProfile}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-white text-sm font-bold transition-all shadow shadow-amber-500/30"
            >
              Complete Now <PiArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileIncompleteModal;
