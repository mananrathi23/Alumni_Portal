import { createContext, StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import './index.css'
import { SocketProvider } from "./SocketContext.jsx";

export const Context = createContext({
  isAuthenticated: false,
  setIsAuthenticated: () => { },
  user: null,
  setUser: () => { },
});

const AppWrapper = () => {
  const [isAuthenticated, setIsAuthenticated] = useState();
  const [user, setUser] = useState(null);

  return (
    <Context.Provider
      value={{ isAuthenticated, setIsAuthenticated, user, setUser }}
    >
      <SocketProvider>
        <App />
      </SocketProvider>
    </Context.Provider>
  );
};

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppWrapper />
  </StrictMode>
);