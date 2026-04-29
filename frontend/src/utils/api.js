// Fix 11: Central API base URL utility
// All components should import from here instead of using hardcoded localhost URLs.
export const API_BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
export const API = `${API_BASE}/api/v1`;
