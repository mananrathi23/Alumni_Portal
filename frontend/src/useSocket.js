// useSocket.js — access the shared Socket.io connection opened by SocketProvider.
import { createContext, useContext } from "react";

export const SocketContext = createContext({ socketRef: { current: null }, isSocketReady: false });

export const useSocket = () => useContext(SocketContext);
