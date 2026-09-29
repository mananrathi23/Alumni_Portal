import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { useContext } from "react";
import { toast } from "react-toastify";
import { Context } from "../context";
import { API } from "../utils/api";

/**
 * OAuthSuccess
 * Landing page after Google / LinkedIn OAuth redirect.
 * Reads the role from query params, fetches /me, updates context, redirects to dashboard.
 */
const OAuthSuccess = () => {
  const [params]    = useSearchParams();
  const navigate    = useNavigate();
  const { setIsAuthenticated, setUser } = useContext(Context);
  
  // Need to import toast from react-toastify
  // We'll import it at the top of the file

  useEffect(() => {
    const errorMsg = params.get("error");
    if (errorMsg) {
      toast.error(errorMsg);
      navigate("/login", { replace: true });
      return;
    }

    const role = params.get("role") || "Student";
    const token = params.get("token");

    if (token) {
      localStorage.setItem("alumniToken", token);
    }

    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    axios
      .get(`${API}/user/me`, { withCredentials: true, headers })
      .then((res) => {
        setIsAuthenticated(true);
        setUser(res.data.user);
        // replace: this page's URL carries the login token — keep it out of history
        const dashboards = { Student: "/student/dashboard", Alumni: "/alumni/dashboard", Teacher: "/teacher/dashboard", Admin: "/admin/dashboard" };
        navigate(dashboards[role] || "/", { replace: true });
      })
      .catch(() => navigate("/login", { replace: true }));
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-sky-500 border-t-transparent animate-spin" />
        <p className="text-slate-400 text-sm">Completing sign-in…</p>
      </div>
    </div>
  );
};

export default OAuthSuccess;
