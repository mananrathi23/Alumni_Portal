import { PiHandshake, PiUsersThree } from "react-icons/pi";
import { useNavigate } from "react-router-dom";
const Mentorship = () => {
  const navigate = useNavigate();
  const requests = [];
  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div><h2 className="text-xl font-bold text-white">Mentorship Requests</h2><p className="text-slate-400 text-sm mt-0.5">Students who want you as their mentor</p></div>
        {requests.length > 0 && <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5"><span className="text-emerald-400 text-xs font-semibold">{requests.length} Pending</span></div>}
      </div>
      {requests.length === 0 && <div className="min-h-72 flex flex-col items-center justify-center text-center bg-slate-900 border border-white/[0.07] rounded-xl px-6"><div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center mb-4"><PiHandshake size={28} className="text-slate-600" /></div><p className="text-slate-300 font-semibold">No mentorship requests yet</p><p className="text-slate-500 text-sm mt-1 max-w-xs">Students will send you requests once you're visible in the alumni directory.</p><button onClick={() => navigate("/alumni/students")} className="mt-5 flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-semibold hover:bg-emerald-500/20 transition-all"><PiUsersThree size={16} /> View Connections</button></div>}
    </div>
  );
};
export default Mentorship;
