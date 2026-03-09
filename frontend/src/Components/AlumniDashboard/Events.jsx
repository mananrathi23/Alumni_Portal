import { useState } from "react";
import { PiCalendarCheck } from "react-icons/pi";
const TABS = ["Upcoming","Past","My Events"];
const Events = () => {
  const [activeTab, setActiveTab] = useState("Upcoming");
  const events = [];
  const emptyMsg = { "Upcoming":["No upcoming events","Check back later for events"], "Past":["No past events","Past events will appear here"], "My Events":["No registered events","Events you join will appear here"] };
  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div><h2 className="text-xl font-bold text-white">Events</h2><p className="text-slate-400 text-sm mt-0.5">College events, reunions and networking opportunities</p></div>
      <div className="flex gap-1 bg-slate-900 border border-white/[0.07] rounded-xl p-1 w-fit">
        {TABS.map((t) => <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${activeTab===t ? "bg-emerald-500 text-white shadow shadow-emerald-500/30" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}>{t}</button>)}
      </div>
      <div className="min-h-72 flex flex-col items-center justify-center text-center bg-slate-900 border border-white/[0.07] rounded-xl"><div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center mb-4"><PiCalendarCheck size={28} className="text-slate-600" /></div><p className="text-slate-300 font-semibold">{emptyMsg[activeTab][0]}</p><p className="text-slate-500 text-sm mt-1">{emptyMsg[activeTab][1]}</p></div>
    </div>
  );
};
export default Events;
