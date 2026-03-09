import React, { useContext, useState } from "react";
import axios from "axios";
import { Navigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Context } from "../../main";
import { PiGraduationCap } from "react-icons/pi";

const ResetPassword = () => {
  const { isAuthenticated, setIsAuthenticated, setUser } = useContext(Context);
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleResetPassword = async (e) => {
    e.preventDefault();
    await axios
      .put(
        `http://localhost:4000/api/v1/user/password/reset/${token}`,
        { password, confirmPassword },
        { withCredentials: true, headers: { "Content-Type": "application/json" } }
      )
      .then((res) => {
        toast.success(res.data.message);
        setIsAuthenticated(true);
        setUser(res.data.user);
      })
      .catch((error) => {
        toast.error(error.response?.data?.message || "Something went wrong");
      });
  };

  if (isAuthenticated) return <Navigate to={"/"} />;

  const inputClass = "w-full px-4 py-3 rounded-lg bg-slate-800 border border-white/10 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-200";

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* Left panel */}
      <div
        className="hidden lg:flex lg:w-1/2 xl:w-5/12 flex-col justify-between p-10 xl:p-14 relative overflow-hidden"
        style={{ background: "linear-gradient(155deg, #0f172a 0%, #1e3a5f 50%, #0c4a6e 100%)" }}
      >
        <div className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }} />
        <div className="absolute top-10 right-0 w-80 h-80 rounded-full opacity-20 pointer-events-none"
          style={{ background: "radial-gradient(circle, #0ea5e9 0%, transparent 70%)" }} />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="bg-sky-500 p-2.5 rounded-lg">
            <PiGraduationCap className="text-white text-xl" />
          </div>
          <div>
            <p className="text-white font-bold text-sm tracking-wider">ALUMNI PORTAL</p>
            <p className="text-slate-400 text-xs tracking-widest uppercase">Student Network</p>
          </div>
        </div>

        {/* Message */}
        <div className="relative z-10 space-y-5">
          <div className="bg-sky-500/10 border border-sky-500/20 rounded-2xl p-6">
            <div className="text-sky-400 text-4xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-white mb-2">Secure your account</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Choose a strong new password to protect your Alumni Portal account.
              Make sure it's something only you know.
            </p>
          </div>
          <ul className="space-y-2">
            {[
              "At least 8 characters long",
              "Mix of letters and numbers",
              "Avoid common or reused passwords",
            ].map((tip, i) => (
              <li key={i} className="flex items-center gap-2 text-slate-500 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500/60 flex-shrink-0" />
                {tip}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-slate-600 text-xs">© 2026 Alumni Portal</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col bg-slate-950">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 px-5 py-4 border-b border-white/10"
          style={{ background: "linear-gradient(135deg, #0f172a, #1e3a5f)" }}>
          <div className="bg-sky-500 p-2 rounded-lg">
            <PiGraduationCap className="text-white text-lg" />
          </div>
          <p className="text-white font-bold text-sm tracking-wider">ALUMNI PORTAL</p>
        </div>

        <div className="flex-1 flex items-center justify-center px-5 sm:px-10 py-12">
          <div className="w-full max-w-md">
            <div className="mb-7">
              <h2 className="text-2xl font-bold text-white">Reset Password</h2>
              <p className="text-slate-400 text-sm mt-1">Enter your new password below.</p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block mb-1 text-sm font-medium text-slate-300">New Password</label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-slate-300">Confirm Password</label>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-bold text-sm tracking-widest uppercase transition-all duration-200 shadow-md hover:shadow-sky-500/40 hover:-translate-y-0.5"
              >
                Reset Password
              </button>
            </form>
          </div>
        </div>
      </div>

    </div>
  );
};

export default ResetPassword;
