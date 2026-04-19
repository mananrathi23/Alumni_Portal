import { useState } from "react";
import axios from "axios";
import { FaGoogle, FaLinkedin } from "react-icons/fa";
import { PiCircleNotch } from "react-icons/pi";

const BASE = "http://localhost:4000/api/v1/oauth";

const SocialLogin = ({ selectedRole }) => {
  const [loadingGoogle,   setLoadingGoogle]   = useState(false);
  const [loadingLinkedIn, setLoadingLinkedIn] = useState(false);

  const handleGoogle = async () => {
    setLoadingGoogle(true);
    try {
      const res = await axios.get(`${BASE}/google/url`, {
        params: { role: selectedRole || "Student" },
      });
      window.location.href = res.data.url;
    } catch {
      setLoadingGoogle(false);
      alert("Could not start Google sign-in. Make sure SOCIAL_GOOGLE_CLIENT_ID is set in backend .env");
    }
  };

  const handleLinkedIn = async () => {
    setLoadingLinkedIn(true);
    try {
      const res = await axios.get(`${BASE}/linkedin/url`, {
        params: { role: selectedRole || "Alumni" },
      });
      window.location.href = res.data.url;
    } catch {
      setLoadingLinkedIn(false);
      alert("Could not start LinkedIn sign-in. Make sure LINKEDIN_CLIENT_ID is set in backend .env");
    }
  };

  const btnCls = "w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-lg bg-slate-800 border border-white/10 hover:border-sky-500/40 hover:bg-slate-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="w-full space-y-3">
      <button onClick={handleGoogle} disabled={loadingGoogle || loadingLinkedIn} className={btnCls}>
        {loadingGoogle
          ? <PiCircleNotch size={18} className="text-red-400 animate-spin"/>
          : <FaGoogle size={18} className="text-red-400"/>
        }
        <span className="text-slate-300 text-sm font-medium">
          {loadingGoogle ? "Redirecting…" : "Continue with Google"}
        </span>
      </button>

      <button onClick={handleLinkedIn} disabled={loadingGoogle || loadingLinkedIn} className={btnCls}>
        {loadingLinkedIn
          ? <PiCircleNotch size={18} className="text-sky-400 animate-spin"/>
          : <FaLinkedin size={18} className="text-sky-400"/>
        }
        <span className="text-slate-300 text-sm font-medium">
          {loadingLinkedIn ? "Redirecting…" : "Continue with LinkedIn"}
        </span>
      </button>

      {/* Divider */}
      <div className="relative py-1">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center">
          <span className="px-3 bg-slate-900/80 text-slate-500 text-xs tracking-widest uppercase">
            Or continue with email
          </span>
        </div>
      </div>
    </div>
  );
};

export default SocialLogin;
