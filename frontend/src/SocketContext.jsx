// frontend/src/SocketContext.jsx
import { createContext, useContext, useEffect, useRef, useState, useMemo } from "react";
import { io } from "socket.io-client";
import { Context } from "./main";

export const SocketContext = createContext({ socketRef: { current: null }, isSocketReady: false });

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useContext(Context);
  const socketRef = useRef(null);
  const [isSocketReady, setIsSocketReady] = useState(false);

  useEffect(() => {
    // Cleanup old socket
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsSocketReady(false);
    }

    // Wait for REAL user data — isAuthenticated must be true (not undefined, not false)
    if (isAuthenticated !== true || !user?._id) {
      return;
    }

    const socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_BACKEND_URL;
    const socket = io(`${socketUrl}`, {
      withCredentials: true,
      transports: ["websocket"], // Fix 7: websocket only — polling sends HTTP every 25s per user
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

export const useSocket = () => useContext(SocketContext);