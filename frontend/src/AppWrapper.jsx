// AppWrapper.jsx — the app's root providers: session/theme Context and the socket.
import { useEffect, useState, useMemo } from "react";
import { Context } from "./context";
import { SocketProvider } from "./SocketContext.jsx";
import App from "./App.jsx";

const AppWrapper = () => {
  const [isAuthenticated, setIsAuthenticated] = useState();
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem("theme");
      if (saved === "dark" || saved === "light") return saved;
      return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } catch {
      return "light";
    }
  });

  useEffect(() => {
    document.body.classList.toggle("dark", theme === "dark");
    document.body.classList.toggle("light", theme === "light");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  const contextValue = useMemo(() => ({
    isAuthenticated, setIsAuthenticated, user, setUser, theme, toggleTheme
  }), [isAuthenticated, user, theme]);

  return (
    <Context.Provider value={contextValue}>
      <SocketProvider>
        <App />
      </SocketProvider>
    </Context.Provider>
  );
};

export default AppWrapper;
