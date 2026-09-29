// ProfileIncompleteModal.jsx — "complete your profile" prompt shown by each role
// layout until the fields in REQUIRED_PROFILE_FIELDS are filled in.
// Props: role ("Student" | "Alumni" | "Teacher"), user, onClose
import { useNavigate } from "react-router-dom";
import { PiStar, PiX, PiArrowRight, PiCheck } from "react-icons/pi";
import { REQUIRED_PROFILE_FIELDS, isFieldComplete } from "../utils/profileCompletion";

const THEME = {
  Student: {
    bar: "from-amber-400 to-orange-500", icon: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    done: "bg-emerald-500/20 border-emerald-500/30 text-emerald-400", button: "bg-amber-500 hover:bg-amber-400 shadow-amber-500/30",
  },
  Alumni: {
    bar: "from-emerald-400 to-teal-500", icon: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    done: "bg-emerald-500/20 border-emerald-500/30 text-emerald-400", button: "bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/30",
  },
  Teacher: {
    bar: "from-violet-400 to-violet-600", icon: "bg-violet-500/10 border-violet-500/20 text-violet-400",
    done: "bg-violet-500/20 border-violet-500/30 text-violet-400", button: "bg-violet-500 hover:bg-violet-400 shadow-violet-500/30",
  },
};

export default function ProfileIncompleteModal({ role, user, onClose }) {
  const navigate = useNavigate();
  const theme = THEME[role] || THEME.Student;

  const goToProfile = () => {
    onClose();
    navigate(`/${role.toLowerCase()}/profile`);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-white/[0.07] rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className={`h-1 w-full bg-gradient-to-r ${theme.bar}`} />

        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className={`w-11 h-11 rounded-xl border flex items-center justify-center ${theme.icon}`}>
              <PiStar size={22} />
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
            Please complete your profile so that the admin can verify you, otherwise you cannot use the complete features of the portal.
          </p>

          <div className="space-y-2 mb-6">
            {(REQUIRED_PROFILE_FIELDS[role] || []).map(({ label, key }) => {
              const done = isFieldComplete(user, key);
              return (
                <div key={key} className="flex items-center gap-3">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold border ${
                    done ? theme.done : "bg-slate-800 border-white/[0.07] text-slate-600"
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

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg bg-slate-800 border border-white/[0.07] text-slate-400 text-sm font-semibold hover:text-white hover:bg-slate-700 transition-all"
            >
              Later
            </button>
            <button
              onClick={goToProfile}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-white text-sm font-bold transition-all shadow ${theme.button}`}
            >
              Complete Now <PiArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
