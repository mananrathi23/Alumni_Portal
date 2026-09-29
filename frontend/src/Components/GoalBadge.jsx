// GoalBadge.jsx — coloured pill for a mentorship goal ("career", "resume", …)
import { PiBookOpen } from "react-icons/pi";
import { GOAL_LABELS } from "../utils/mentorship";

const GOAL_COLORS = {
  career: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  resume: "bg-sky-500/15 text-sky-400 border-sky-500/25",
  interview: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  technical: "bg-violet-500/15 text-violet-400 border-violet-500/25",
  general: "bg-slate-500/15 text-slate-400 border-slate-500/25",
};

export default function GoalBadge({ goal }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${GOAL_COLORS[goal] || GOAL_COLORS.general}`}>
      <PiBookOpen size={11} />{GOAL_LABELS[goal] || goal}
    </span>
  );
}
