import React, { useState, useContext } from "react";
import { PiGraduationCap, PiUsersThree, PiBriefcase, PiHandshake, PiCalendarCheck } from "react-icons/pi";
import { Navigate } from "react-router-dom";
import { Context } from "../../main";
import Login from "./Login";
import Register from "./Register";
import RoleSelection from "./RoleSelection";
import SocialLogin from "./SocialLogin";

/* Left panel feature bullets — only features that exist in the project */
const FEATURES = [
  { icon: <PiUsersThree size={20} />, text: "Connect with alumni across industries & cohorts" },
  { icon: <PiHandshake size={20} />,  text: "Find mentors who guide your career journey" },
  { icon: <PiBriefcase size={20} />,  text: "Discover exclusive job & internship listings" },
  { icon: <PiCalendarCheck size={20} />, text: "Attend events, meetups & annual reunions" },
];

const Auth = () => {
  const { isAuthenticated, user } = useContext(Context);
  const [isLogin, setIsLogin] = useState(true);
  const [selectedRole, setSelectedRole] = useState("Student");

  const handleToggle = (loginMode) => {
    setIsLogin(loginMode);
    setSelectedRole("Student");
  };

  if (isAuthenticated && user) {
    const role = user.role;
    if (role === "Student") return <Navigate to="/student/dashboard" />;
    if (role === "Teacher") return <Navigate to="/teacher/dashboard" />;
    if (role === "Admin")   return <Navigate to="/admin/dashboard" />;
    if (role === "Alumni")  return <Navigate to="/alumni/dashboard" />;
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* ══════════════════════════════════════════
          LEFT PANEL — Branding & Features
      ══════════════════════════════════════════ */}
      <div
        className="hidden lg:flex lg:w-1/2 xl:w-5/12 flex-col justify-between p-10 xl:p-14 relative overflow-hidden"
        style={{ background: "linear-gradient(155deg, #0f172a 0%, #1e3a5f 50%, #0c4a6e 100%)" }}
      >
        {/* Background grid */}
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        {/* Glow orbs */}
        <div className="absolute top-10 right-0 w-80 h-80 rounded-full opacity-20 pointer-events-none"
          style={{ background: "radial-gradient(circle, #0ea5e9 0%, transparent 70%)" }} />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(circle, #38bdf8 0%, transparent 70%)" }} />

        {/* Top: Logo + name */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="bg-sky-500 p-2.5 rounded-lg">
            <PiGraduationCap className="text-white text-xl" />
          </div>
          <div>
            <p className="text-white font-bold text-sm tracking-wider">ALUMNI PORTAL</p>
            <p className="text-slate-400 text-xs tracking-widest uppercase">Student Network</p>
          </div>
        </div>

        {/* Middle: Headline + features */}
        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight mb-4"
              style={{ letterSpacing: "-0.02em" }}>
              Your campus network,<br />
              <span className="text-sky-400">extended for life.</span>
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              Join thousands of students and alumni building meaningful careers
              and lasting relationships through the Alumni Student Portal.
            </p>
          </div>

          {/* Feature list */}
          <ul className="space-y-4">
            {FEATURES.map((f, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-0.5 flex-shrink-0 bg-sky-500/20 border border-sky-500/30 text-sky-400 p-1.5 rounded-lg">
                  {f.icon}
                </span>
                <span className="text-slate-300 text-sm leading-relaxed">{f.text}</span>
              </li>
            ))}
          </ul>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 pt-2">
            {[
              { v: "10K+", l: "Alumni" },
              { v: "500+", l: "Mentors" },
              { v: "1.2K+", l: "Jobs" },
            ].map((s, i) => (
              <div key={i} className="text-center bg-white/5 border border-white/10 rounded-xl py-3">
                <p className="text-sky-400 font-extrabold text-lg leading-none">{s.v}</p>
                <p className="text-slate-500 text-xs mt-1 tracking-widest uppercase">{s.l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: Footer note */}
        <p className="relative z-10 text-slate-600 text-xs">
          © 2026 Alumni Portal — All Rights Reserved
        </p>
      </div>

      {/* ══════════════════════════════════════════
          RIGHT PANEL — Auth Form
      ══════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col bg-slate-950 lg:overflow-y-auto">

        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 px-5 py-4 border-b border-white/10"
          style={{ background: "linear-gradient(135deg, #0f172a, #1e3a5f)" }}>
          <div className="bg-sky-500 p-2 rounded-lg">
            <PiGraduationCap className="text-white text-lg" />
          </div>
          <p className="text-white font-bold text-sm tracking-wider">ALUMNI PORTAL</p>
        </div>

        <div className="flex-1 flex items-start lg:items-center justify-center px-5 sm:px-10 py-8 lg:py-12">
          <div className="w-full max-w-md">

            {/* Form heading */}
            <div className="mb-7">
              <h2 className="text-2xl font-bold text-white">
                {isLogin ? "Welcome back" : "Create your account"}
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                {isLogin
                  ? "Sign in to your Alumni Portal account"
                  : "Join the Alumni Student Portal today"}
              </p>
            </div>

            {/* Social login */}
            <SocialLogin />

            {/* Sign In / Sign Up toggle */}
            <div className="flex rounded-lg bg-slate-800 p-1 border border-white/10 mb-6">
              <button
                onClick={() => handleToggle(true)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold tracking-wide transition-all duration-200 ${
                  isLogin ? "bg-sky-500 text-white shadow" : "text-slate-400 hover:text-white"
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => handleToggle(false)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold tracking-wide transition-all duration-200 ${
                  !isLogin ? "bg-sky-500 text-white shadow" : "text-slate-400 hover:text-white"
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Role selection */}
            <RoleSelection
              selectedRole={selectedRole}
              setSelectedRole={setSelectedRole}
              isLogin={isLogin}
            />

            {/* Form */}
            <div className="mt-5">
              {isLogin
                ? <Login selectedRole={selectedRole} />
                : <Register selectedRole={selectedRole} />
              }
            </div>

          </div>
        </div>
      </div>

    </div>
  );
};

export default Auth;
