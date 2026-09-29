// frontend/src/SocketContext.jsx
import { useContext, useEffect, useRef, useState, useMemo } from "react";
import { SocketContext } from "./useSocket";
import { io } from "socket.io-client";
import { Context } from "./context";


export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useContext(Context);
  const socketRef = useRef(null);
  const [isSocketReady, setIsSocketReady] = useState(false);

  useEffect(() => {
    // The previous socket (if any) was already closed by this effect's cleanup below.
    // Wait for REAL user data — isAuthenticated must be true (not undefined, not false)
    if (isAuthenticated !== true || !user?._id) {
      return;
    }

    const socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_BACKEND_URL;
    let token = null;
    try { token = localStorage.getItem("alumniToken"); } catch { /* storage blocked: the cookie still authenticates */ }
    const socket = io(`${socketUrl}`, {
      withCredentials: true,
      transports: ["websocket"], // Fix 7: websocket only — polling sends HTTP every 25s per user
      auth: token ? { token } : {}, // the server verifies this before joining the user's room
    });

    socket.on("connect", () => {
      socket.emit("register", user._id);
      setIsSocketReady(true);
    });

    socket.on("disconnect", () => {
      setIsSocketReady(false);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsSocketReady(false);
    };
  }, [isAuthenticated, user?._id]);

  const contextValue = useMemo(() => ({ socketRef, isSocketReady }), [isSocketReady]);

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};
