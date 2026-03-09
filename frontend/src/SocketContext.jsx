// frontend/src/SocketContext.jsx
import { createContext, useContext, useEffect, useRef, useState } from "react";
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
      console.log("⏳ Socket waiting — isAuthenticated:", isAuthenticated, "userId:", user?._id);
      return;
    }

    console.log("🔌 Connecting socket for user:", user._id);

    const socket = io("http://localhost:4000", {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket.id);
      socket.emit("register", user._id);
      console.log("✅ Registered userId:", user._id);
      setIsSocketReady(true);
    });

    socket.on("connect_error", (err) => {
      console.error("❌ Socket error:", err.message);
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

  return (
    <SocketContext.Provider value={{ socketRef, isSocketReady }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);