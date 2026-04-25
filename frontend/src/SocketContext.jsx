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
      return;
    }

    const socket = io(`${import.meta.env.VITE_BACKEND_URL}`, {
      withCredentials: true,
      transports: ["websocket", "polling"],
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

  return (
    <SocketContext.Provider value={{ socketRef, isSocketReady }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);