import { createContext, StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import './index.css';
import { SocketProvider } from "./SocketContext.jsx";
import axios from "axios";

// ── SETUP AXIOS INTERCEPTORS FOR BEARER TOKEN ────────────────────────────────
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("alumniToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // If /user/me returns 400/401, clear the invalid token to prevent infinite loops
    if (
      (error.response?.status === 400 || error.response?.status === 401) &&
      error.config?.url?.includes("/user/me")
    ) {
      localStorage.removeItem("alumniToken");
    }
    return Promise.reject(error);
  }
);

export const Context = createContext({
  isAuthenticated: false,
  setIsAuthenticated: () => {},
  user: null,
  setUser: () => {},
  theme: "light",
  toggleTheme: () => {},
});

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

  return (
    <Context.Provider value={{ isAuthenticated, setIsAuthenticated, user, setUser, theme, toggleTheme }}>
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
