// frontend/src/Components/ConnectButton.jsx
import React, { useState, useEffect, useRef, useContext } from "react";
import axios from "axios";
import { Context } from "../main";
import { useSocket } from "../SocketContext";

const ConnectButton = ({ targetId, targetRole, targetName, onStatusChange }) => {
  const { user } = useContext(Context);
  const { socketRef, isSocketReady } = useSocket();

  const [status, setStatus]               = useState("None");
  const [connectionId, setConnectionId]   = useState(null);
  const [iSentIt, setISentIt]             = useState(false);
  const [loading, setLoading]             = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // ── Use a ref to always access the latest connectionId in socket callbacks ──
  const connectionIdRef = useRef(null);
  useEffect(() => {
    connectionIdRef.current = connectionId;
  }, [connectionId]);

  // ── Fetch initial status on mount ───────────────────────────────────────
  useEffect(() => {
    if (!targetId) return;
    axios
      .get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/connections/status/${targetId}`, {
        withCredentials: true,
      })
      .then((res) => {
        setStatus(res.data.status);
        setConnectionId(res.data.connectionId);
        setISentIt(res.data.isSender);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [targetId]);

  // ── Real-time socket listeners ───────────────────────────────────────────
  useEffect(() => {
    const socket = socketRef?.current;
    if (!isSocketReady || !socket) return;

    const onNewRequest = (data) => {
      if (data.sender.id.toString() === targetId.toString()) {
        setStatus("Pending");
        setConnectionId(data.connectionId);
        setISentIt(false);
        if (onStatusChange) onStatusChange("Pending");
      }
    };

    const onAccepted = (data) => {
      // Use ref to get current connectionId — avoids stale closure
      if (data.connectionId?.toString() === connectionIdRef.current?.toString()) {
        setStatus("Accepted");
        if (onStatusChange) onStatusChange("Accepted");
      }
    };

    const onRejected = (data) => {
      if (data.connectionId?.toString() === connectionIdRef.current?.toString()) {
        setStatus("Rejected");
        setConnectionId(null);
        if (onStatusChange) onStatusChange("Rejected");
      }
    };

    const onWithdrawn = (data) => {
      if (data.sender?.id?.toString() === targetId.toString()) {
        setStatus("None");
        setConnectionId(null);
        setISentIt(false);
        if (onStatusChange) onStatusChange("None");
      }
    };

    const onRemoved = (data) => {
      if (data.connectionId?.toString() === connectionIdRef.current?.toString()) {
        setStatus("None");
        setConnectionId(null);
        setISentIt(false);
        if (onStatusChange) onStatusChange("None");
      }
    };

    socket.on("connection:new_request", onNewRequest);
    socket.on("connection:accepted",    onAccepted);
    socket.on("connection:rejected",    onRejected);
    socket.on("connection:withdrawn",   onWithdrawn);
    socket.on("connection:removed",     onRemoved);

    return () => {
      socket.off("connection:new_request", onNewRequest);
      socket.off("connection:accepted",    onAccepted);
      socket.off("connection:rejected",    onRejected);
      socket.off("connection:withdrawn",   onWithdrawn);
      socket.off("connection:removed",     onRemoved);
    };
  }, [isSocketReady, socketRef, targetId, onStatusChange]);

  // ── Local state helper ───────────────────────────────────────────────────
  const updateStatus = (newStatus, newConnectionId = null, sentByMe = false) => {
    setStatus(newStatus);
    setConnectionId(newConnectionId);
    setISentIt(sentByMe);
    if (onStatusChange) onStatusChange(newStatus);
  };

  // ── API Actions ──────────────────────────────────────────────────────────
  const sendRequest = async () => {
    setActionLoading(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/connections/send`,
        { receiverId: targetId, receiverRole: targetRole, receiverName: targetName },
        { withCredentials: true }
      );
      updateStatus("Pending", res.data.request._id, true);
    } catch {
      // silent — toast handled by parent if needed
    } finally {
      setActionLoading(false);
    }
  };

  const withdraw = async () => {
    setActionLoading(true);
    try {
      await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/connections/${connectionId}/withdraw`,
        { withCredentials: true }
      );
      updateStatus("None", null, false);
    } catch {
      // silent
    } finally {
      setActionLoading(false);
    }
  };

  const respond = async (action) => {
    setActionLoading(true);
    try {
      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/connections/${connectionId}/respond`,
        { status: action },
        { withCredentials: true }
      );
      updateStatus(action === "Accepted" ? "Accepted" : "Rejected", connectionId, false);
    } catch {
      // silent
    } finally {
      setActionLoading(false);
    }
  };

  const remove = async () => {
    setActionLoading(true);
    try {
      await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/connections/${connectionId}/remove`,
        { withCredentials: true }
      );
      updateStatus("None", null, false);
    } catch {
      // silent
    } finally {
      setActionLoading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  if (loading) {
    return <button disabled className="px-4 py-2 rounded-lg text-sm bg-gray-100 text-gray-400 cursor-not-allowed">...</button>;
  }

  if (actionLoading) {
    return <button disabled className="px-4 py-2 rounded-lg text-sm bg-gray-100 text-gray-500 cursor-not-allowed">Wait...</button>;
  }

  // ── Guard: current user is blocked ───────────────────────────────────────
  if (user?.isBlocked) {
    return (
      <div className="group relative inline-block">
        <button
          disabled
          className="w-28 py-2 rounded-lg text-sm font-medium bg-red-100 text-red-400 cursor-not-allowed"
        >
          🚫 Blocked
        </button>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 w-56 text-center text-xs text-white bg-gray-800 rounded-lg px-3 py-2 shadow-lg pointer-events-none">
          Your account has been blocked. Please contact the administrator.
        </div>
      </div>
    );
  }

  // ── Guard: current user is not yet admin-verified ────────────────────────
  if (!user?.adminVerified) {
    return (
      <div className="group relative inline-block">
        <button
          disabled
          className="w-28 py-2 rounded-lg text-sm font-medium bg-amber-100 text-amber-500 cursor-not-allowed"
        >
          ⏳ Pending
        </button>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 w-64 text-center text-xs text-white bg-gray-800 rounded-lg px-3 py-2 shadow-lg pointer-events-none">
          You need to be verified by the admin before sending connection requests.
        </div>
      </div>
    );
  }

  if (status === "Accepted") {
    return (
      <button
        onClick={remove}
        className="w-28 py-2 rounded-lg text-sm font-medium bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-600 transition-all duration-200 group"
      >
        <span className="group-hover:hidden">✓ Connected</span>
        <span className="hidden group-hover:inline">Remove</span>
      </button>
    );
  }

  if (status === "Pending" && iSentIt) {
    return (
      <button
        onClick={withdraw}
        className="w-28 py-2 rounded-lg text-sm font-medium bg-yellow-100 text-yellow-700 hover:bg-yellow-200 transition-all duration-200"
      >
        Withdraw
      </button>
    );
  }

  if (status === "Pending" && !iSentIt) {
    return (
      <div className="flex gap-2">
        <button
          onClick={() => respond("Accepted")}
          className="w-[54px] py-2 rounded-lg text-sm font-medium bg-green-500 text-white hover:bg-green-600 transition-all duration-200"
        >
          Accept
        </button>
        <button
          onClick={() => respond("Rejected")}
          className="w-[54px] py-2 rounded-lg text-sm font-medium bg-red-100 text-red-600 hover:bg-red-200 transition-all duration-200"
        >
          Reject
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={sendRequest}
      className="w-28 py-2 rounded-lg text-sm font-medium bg-sky-500 text-white hover:bg-sky-400 transition-all duration-200"
    >
      + Connect
    </button>
  );
};

export default ConnectButton;