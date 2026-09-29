// NewsTicker.jsx — scrolling announcement banner
// Shown at the very top of every dashboard layout (below the fixed header)
// Admin sees a "Manage" button; others see read-only ticker

import { useState, useEffect, useRef, useContext } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Context } from "../main";
import { PiMegaphone, PiX, PiPlus, PiTrash, PiCaretRight } from "react-icons/pi";

const API = `${import.meta.env.VITE_BACKEND_URL}/api/v1/announcements`;

const TYPE_STYLES = {
  info:    { bar: "bg-sky-500/10 border-sky-500/30",    text: "text-sky-300",    dot: "bg-sky-400",    icon: "📢" },
  warning: { bar: "bg-amber-500/10 border-amber-500/30", text: "text-amber-300",  dot: "bg-amber-400",  icon: "⚠️" },
  success: { bar: "bg-emerald-500/10 border-emerald-500/30", text: "text-emerald-300", dot: "bg-emerald-400", icon: "✅" },
  urgent:  { bar: "bg-red-500/10 border-red-500/30",    text: "text-red-300",    dot: "bg-red-400",    icon: "🚨" },
};

// ── Admin Panel to post/delete announcements ─────────────────────────────────
function AdminPanel({ onClose, onRefresh }) {
  const [text, setText]     = useState("");
  const [type, setType]     = useState("info");
  const [expires, setExp]   = useState("");
  const [saving, setSaving] = useState(false);
  const [list, setList]     = useState([]);

  const load = async () => {
    try {
      const res = await axios.get(API, { withCredentials: true });
      setList(res.data.announcements || []);
    } catch {}
  };

  useEffect(() => { load(); }, []);

  const post = async () => {
    if (!text.trim()) { toast.error("Text is required."); return; }
    setSaving(true);
    try {
      await axios.post(API, {
        text:      text.trim(),
        type,
        expiresAt: expires || null,
      }, { withCredentials: true });
      toast.success("Announcement posted!");
      setText(""); setType("info"); setExp("");
      load(); onRefresh();
    } catch(e) { toast.error(e.response?.data?.message || "Failed."); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    try {
      await axios.delete(`${API}/${id}`, { withCredentials: true });
      toast.success("Announcement removed.");
      load(); onRefresh();
    } catch(e) { toast.error(e.response?.data?.message || "Failed."); }
  };

  const inp = "w-full px-3 py-2 rounded-lg bg-slate-800 border border-white/[0.07] text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-white/[0.07] rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
          <div className="flex items-center gap-2">
            <PiMegaphone size={18} className="text-sky-400"/>
            <div><h2 className="text-white font-bold text-sm">Manage Announcements</h2><p className="text-slate-500 text-xs">Post news visible to all users</p></div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800"><PiX size={16}/></button>
        </div>

        {/* Post form */}
        <div className="px-5 py-4 border-b border-white/[0.07] space-y-3">
          <textarea value={text} onChange={e => setText(e.target.value)} rows={2}
            maxLength={300}
            placeholder="Type your announcement… (max 300 chars)"
            className={`${inp} resize-none`}/>
          <p className="text-slate-600 text-[10px] text-right">{text.length}/300</p>
          <div className="flex gap-2">
            <select value={type} onChange={e => setType(e.target.value)} className={`flex-1 ${inp}`}>
              <option value="info">📢 Info</option>
              <option value="warning">⚠️ Warning</option>
              <option value="success">✅ Success</option>
              <option value="urgent">🚨 Urgent</option>
            </select>
            <input type="datetime-local" value={expires} onChange={e => setExp(e.target.value)}
              title="Expires at (optional)"
              className={`flex-1 ${inp}`}/>
          </div>
          <button onClick={post} disabled={saving || !text.trim()}
            className="w-full py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-sm font-bold transition-all disabled:opacity-40 flex items-center justify-center gap-2">
            {saving ? "Posting…" : <><PiPlus size={14}/> Post Announcement</>}
          </button>
        </div>

        {/* Existing list */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
          {list.length === 0
            ? <p className="text-slate-600 text-sm text-center py-4">No active announcements.</p>
            : list.map(a => {
              const s = TYPE_STYLES[a.type] || TYPE_STYLES.info;
              return (
                <div key={a._id} className={`flex items-start gap-3 p-3 rounded-xl border ${s.bar}`}>
                  <span className="text-base flex-shrink-0">{s.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${s.text} leading-relaxed`}>{a.text}</p>
                    <p className="text-slate-600 text-[10px] mt-1">{new Date(a.createdAt).toLocaleString()}</p>
                  </div>
                  <button onClick={() => remove(a._id)}
                    className="p-1 rounded text-slate-600 hover:text-red-400 transition-colors flex-shrink-0">
                    <PiTrash size={13}/>
                  </button>
                </div>
              );
            })
          }
        </div>
      </div>
    </div>
  );
}

// ── Main Ticker Component ─────────────────────────────────────────────────────
export default function NewsTicker() {
  const { user }                    = useContext(Context);
  const [announcements, setAnn]     = useState([]);
  const [current, setCurrent]       = useState(0);
  const [showPanel, setPanel]       = useState(false);
  const [dismissed, setDismissed]   = useState(false);
  const tickerRef                   = useRef(null);
  const isAdmin = user?.role === "Admin" || user?.constructor?.name === "Admin";

  const load = async () => {
    try {
      const res = await axios.get(API, { withCredentials: true });
      const list = res.data.announcements || [];
      setAnn(list);
      if (list.length > 0) setDismissed(false);
    } catch {}
  };

  useEffect(() => { load(); }, []);

  // Auto-rotate every 2 seconds
  useEffect(() => {
    if (announcements.length <= 1) return;
    const id = setInterval(() => setCurrent(p => (p + 1) % announcements.length), 2000);
    return () => clearInterval(id);
  }, [announcements.length]);

  if (dismissed || (announcements.length === 0 && !isAdmin)) return null;

  const ann = announcements[current];
  const style = ann ? (TYPE_STYLES[ann.type] || TYPE_STYLES.info) : TYPE_STYLES.info;

  return (
    <>
      <div className={`w-full border-b flex items-center gap-3 px-4 py-2 ${ann ? style.bar : "bg-slate-800/50 border-white/[0.07]"}`}
        style={{ minHeight: "36px" }}>

        {/* Icon + pulse dot */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {ann
            ? <span className="text-base leading-none">{style.icon}</span>
            : <PiMegaphone size={15} className="text-slate-500"/>
          }
          {announcements.length > 1 && (
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${style.dot}`}/>
          )}
        </div>

        {/* Text — scrolling marquee */}
        <div className="flex-1 min-w-0 overflow-hidden">
          {ann ? (
            <div className="overflow-hidden whitespace-nowrap" ref={tickerRef}>
              <span
                className={`inline-block text-xs font-medium ${style.text}`}
                style={{ animation: "tickerScroll 9.6s linear infinite" }}
              >
                {ann.text}&nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;{ann.text}
              </span>
            </div>
          ) : (
            <p className="text-xs text-slate-600 italic">No announcements — post one to notify all users.</p>
          )}
        </div>

        {/* Right side: count + controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {announcements.length > 1 && (
            <div className="flex items-center gap-1">
              {announcements.map((_, i) => (
                <button key={i} onClick={() => setCurrent(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${i === current ? style.dot : "bg-slate-700"}`}/>
              ))}
            </div>
          )}
          {isAdmin && (
            <button onClick={() => setPanel(true)}
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-800 border border-white/[0.07] text-slate-400 hover:text-white text-[10px] font-semibold transition-all">
              <PiMegaphone size={11}/> Manage
            </button>
          )}
          {ann && (
            <button onClick={() => {
              if (announcements.length > 1) setCurrent(p => (p + 1) % announcements.length);
              else setDismissed(true);
            }} className="p-1 rounded text-slate-600 hover:text-white transition-colors">
              {announcements.length > 1 ? <PiCaretRight size={13}/> : <PiX size={12}/>}
            </button>
          )}
        </div>
      </div>

      {showPanel && (
        <AdminPanel
          onClose={() => setPanel(false)}
          onRefresh={load}
        />
      )}
    </>
  );
}
