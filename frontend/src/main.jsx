import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import AppWrapper from "./AppWrapper.jsx";
import './index.css';
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

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppWrapper />
  </StrictMode>
);
