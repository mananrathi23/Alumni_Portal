// Requests.jsx — Student's incoming & sent connection requests

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useSocket } from "../../SocketContext";
import {
  PiUsersThree, PiCheck, PiX, PiCircleNotch,
  PiArrowRight, PiClock, PiHandshake,
} from "react-icons/pi";

const API = `${import.meta.env.VITE_BACKEND_URL}/api/v1/connection`;

const Avatar = ({ name, size = "w-10 h-10" }) => (
  <div className={`${size} rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
    {name?.charAt(0)?.toUpperCase() || "?"}
  </div>
);

const RoleBadge = ({ role }) => {
  const c = {
    Alumni:  "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
    Teacher: "bg-violet-500/15  text-violet-400  border-violet-500/25",
    Student: "bg-sky-500/15    text-sky-400     border-sky-500/25",
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${c[role] || c.Student}`}>
      {role}
    </span>
  );
};

const Requests = () => {
  const { socketRef, isSocketReady } = useSocket();
  const [tab, setTab] = useState("incoming");
  const [incoming, setIncoming] = useState([]);
  const [sent, setSent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null); // id of request being acted on

  const fetchPending = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/pending`, { withCredentials: true });
      setIncoming(res.data.incoming || []);
      setSent(res.data.outgoing || []);
    } catch {
      toast.error("Failed to load requests.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  // Real-time updates
  useEffect(() => {
    if (!isSocketReady || !socketRef.current) return;
    const socket = socketRef.current;
    const refresh = () => fetchPending();
    socket.on("connection:new",      refresh);
    socket.on("connection:accepted", refresh);
    socket.on("connection:rejected", refresh);
    socket.on("connection:withdrawn",refresh);
    return () => {
      socket.off("connection:new",      refresh);
      socket.off("connection:accepted", refresh);
      socket.off("connection:rejected", refresh);
      socket.off("connection:withdrawn",refresh);
    };
  }, [isSocketReady, fetchPending]);

  const respond = async (requestId, action) => {
    setActing(requestId);
    const status = action === "accept" ? "Accepted" : "Rejected";
    try {
      await axios.put(`${API}/${requestId}/respond`, { status }, { withCredentials: true });
      toast.success(status === "Accepted" ? "Connection accepted!" : "Request declined.");
      fetchPending();
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed.");
    } finally {
      setActing(null); }
  };

  const withdraw = async (requestId) => {
    setActing(requestId);
    try {
      await axios.delete(`${API}/${requestId}/withdraw`, { withCredentials: true });
      toast.success("Request withdrawn.");
      fetchPending();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to withdraw.");
    } finally {
      setActing(null); }
  };

  const tabs = [
    { key: "incoming", label: "Incoming", count: incoming.length },
    { key: "sent",     label: "Sent",     count: sent.length },
  ];

  const EmptyState = ({ msg }) => (
    <div className="min-h-56 flex flex-col items-center justify-center text-center bg-slate-900 border border-white/[0.07] rounded-xl px-6">
      <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
        <PiUsersThree size={28} className="text-slate-600" />
      </div>
      <p className="text-slate-300 font-semibold">No requests</p>
      <p className="text-slate-500 text-sm mt-1">{msg}</p>
    </div>
  );

  if (loading) return (
    <div className="min-h-60 flex items-center justify-center">
      <PiCircleNotch size={28} className="text-sky-400 animate-spin" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-5">

      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white">Connection Requests</h2>
        <p className="text-slate-400 text-sm mt-0.5">Manage incoming and sent connection requests</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-900 border border-white/[0.07] rounded-xl p-1">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              tab === t.key
                ? "bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/30"
                : "text-slate-400 hover:text-white"
            }`}>
            {t.label}
            {t.count > 0 && (
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                tab === t.key ? "bg-sky-500/30 text-sky-300" : "bg-slate-700 text-slate-400"
              }`}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Incoming */}
      {tab === "incoming" && (
        incoming.length === 0
          ? <EmptyState msg="No one has sent you a connection request yet." />
          : (
            <div className="space-y-3">
              {incoming.map(req => (
                <div key={req._id} className="bg-slate-900 border border-white/[0.07] rounded-xl p-4 sm:p-5 flex items-center gap-4">
                  <Avatar name={req.sender?.name} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white font-semibold text-sm">{req.sender?.name}</p>
                      <RoleBadge role={req.sender?.role} />
                    </div>
                    <div className="flex items-center gap-1 text-slate-600 text-xs mt-1">
                      <PiClock size={11} />
                      {new Date(req.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => respond(req._id, "reject")}
                      disabled={acting === req._id}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-all disabled:opacity-50">
                      {acting === req._id ? <PiCircleNotch size={12} className="animate-spin" /> : <PiX size={12} />}
                      Decline
                    </button>
                    <button
                      onClick={() => respond(req._id, "accept")}
                      disabled={acting === req._id}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-400 text-xs font-semibold hover:bg-sky-500/25 transition-all disabled:opacity-50">
                      {acting === req._id ? <PiCircleNotch size={12} className="animate-spin" /> : <PiCheck size={12} />}
                      Accept
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
      )}

      {/* Sent */}
      {tab === "sent" && (
        sent.length === 0
          ? <EmptyState msg="You haven't sent any connection requests yet." />
          : (
            <div className="space-y-3">
              {sent.map(req => (
                <div key={req._id} className="bg-slate-900 border border-white/[0.07] rounded-xl p-4 sm:p-5 flex items-center gap-4">
                  <Avatar name={req.receiver?.name} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white font-semibold text-sm">{req.receiver?.name}</p>
                      <RoleBadge role={req.receiver?.role} />
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="flex items-center gap-1 text-amber-400 text-xs">
                        <PiHandshake size={11} /> Pending
                      </span>
                      <span className="text-slate-600 text-xs">·</span>
                      <span className="text-slate-600 text-xs flex items-center gap-1">
                        <PiClock size={11} />
                        {new Date(req.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => withdraw(req._id)}
                    disabled={acting === req._id}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 border border-white/[0.07] text-slate-400 text-xs font-semibold hover:text-red-400 hover:border-red-500/20 hover:bg-red-500/10 transition-all disabled:opacity-50 flex-shrink-0">
                    {acting === req._id ? <PiCircleNotch size={12} className="animate-spin" /> : <PiX size={12} />}
                    Withdraw
                  </button>
                </div>
              ))}
            </div>
          )
      )}
    </div>
  );
};

export default Requests;
