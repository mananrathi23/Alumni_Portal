import { useEffect, useState, useContext } from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";
import { Context } from "../main";

/**
 * ProtectedRoute
 * Wraps any route that requires authentication (and optional role check).
 *
 * Usage:
 *   <ProtectedRoute allowedRole="Student">
 *     <StudentLayout />
 *   </ProtectedRoute>
 *
 * Props:
 *   allowedRole  — "Student" | "Alumni" | "Teacher" | "Admin" (optional)
 *   children     — the element to render if authenticated
 */
const ProtectedRoute = ({ children, allowedRole }) => {
  const [status, setStatus] = useState("loading"); // "loading" | "ok" | "unauth" | "forbidden"
  const { setIsAuthenticated, setUser } = useContext(Context);

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user/me`, { withCredentials: true })
      .then((res) => {
        const role = res.data.user?.role;
        // Fix 12: Populate global Context so child components don't re-fetch /me
        setUser(res.data.user);
        setIsAuthenticated(true);
        if (allowedRole && role !== allowedRole) {
          setStatus("forbidden");
        } else {
          setStatus("ok");
        }
      })
      .catch(() => {
        setIsAuthenticated(false);
        setUser(null);
        setStatus("unauth");
      });
  }, [allowedRole, setIsAuthenticated, setUser]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-sky-500 border-t-transparent animate-spin" />
          <p className="text-slate-500 text-sm">Verifying session…</p>
        </div>
      </div>
    );
  }

  if (status === "unauth") return <Navigate to="/login" replace />;

  if (status === "forbidden") {
    // Redirect to their correct dashboard based on cookie role
    // Since we can't read the role here easily, just go to login
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
