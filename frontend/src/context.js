// context.js — app-wide session and theme state (provided by AppWrapper in main.jsx).
// Kept out of main.jsx so components don't import the app entry point.
import { createContext } from "react";

export const Context = createContext({
  isAuthenticated: false,
  setIsAuthenticated: () => {},
  user: null,
  setUser: () => {},
  theme: "light",
  toggleTheme: () => {},
});
