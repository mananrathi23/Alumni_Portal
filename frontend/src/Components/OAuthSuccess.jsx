import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { useContext } from "react";
import { Context } from "../main";

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
      import("react-toastify").then(({ toast }) => {
        toast.error(errorMsg);
      });
      navigate("/login");
      return;
    }

    const role = params.get("role") || "Student";
    const token = params.get("token");

    if (token) {
      localStorage.setItem("alumniToken", token);
    }

    axios
      .get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user/me`, { withCredentials: true })
      .then((res) => {
        setIsAuthenticated(true);
        setUser(res.data.user);
        if (role === "Student") navigate("/student/dashboard");
        else if (role === "Alumni")  navigate("/alumni/dashboard");
        else if (role === "Teacher") navigate("/teacher/dashboard");
        else if (role === "Admin")   navigate("/admin/dashboard");
        else navigate("/");
      })
      .catch(() => navigate("/login"));
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
