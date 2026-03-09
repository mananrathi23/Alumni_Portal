import { useState } from "react";
import { PiMagnifyingGlass, PiEnvelope, PiChatsCircle } from "react-icons/pi";
const Messages = () => {
  const [search, setSearch] = useState("");
  const conversations = [];
  return (
    <div className="max-w-5xl mx-auto"><div className="bg-slate-900 border border-white/[0.07] rounded-xl overflow-hidden" style={{height:"calc(100vh - 7rem)"}}>
      <div className="flex h-full">
        <div className="w-full sm:w-72 lg:w-80 flex flex-col border-r border-white/[0.07] flex-shrink-0">
          <div className="px-4 pt-4 pb-3 border-b border-white/[0.07]"><h2 className="text-white font-bold text-base mb-3">Messages</h2>
            <div className="relative"><PiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={15} /><input type="text" placeholder="Search conversations…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-8 pr-3 py-2 rounded-lg bg-slate-800 border border-white/[0.07] text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
          </div>
          <div className="flex-1 overflow-y-auto">{conversations.length === 0 && <div className="flex flex-col items-center justify-center h-full text-center px-6"><div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mb-3"><PiEnvelope size={22} className="text-slate-600" /></div><p className="text-slate-400 font-medium text-sm">No conversations yet</p><p className="text-slate-600 text-xs mt-1">Student messages will appear here</p></div>}</div>
        </div>
        <div className="hidden sm:flex flex-1 flex-col items-center justify-center text-center px-8"><div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mb-4"><PiChatsCircle size={30} className="text-slate-600" /></div><p className="text-slate-300 font-semibold">Select a conversation</p><p className="text-slate-500 text-sm mt-1">Connect with students looking for guidance</p></div>
      </div>
    </div></div>
  );
};
export default Messages;
