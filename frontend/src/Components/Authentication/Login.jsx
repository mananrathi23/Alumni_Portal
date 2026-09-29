import React, { useState, useContext } from "react";
import { useForm } from "react-hook-form";
import ForgotPassword from "./ForgotPassword";
import { Context } from "../../main";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const Login = ({ selectedRole }) => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const { setIsAuthenticated, setUser } = useContext(Context);
  const navigateTo = useNavigate();

  const handleLogin = async (data) => {
    data.role        = selectedRole;
    data.keepSignedIn = keepSignedIn;

    await axios
      .post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user/login`, data, {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      })
      .then((res) => {
        toast.success(res.data.message);
        localStorage.setItem("alumniToken", res.data.token);
        setIsAuthenticated(true);
        setUser(res.data.user);
        if (selectedRole === "Student") navigateTo("/student/dashboard");
        else if (selectedRole === "Teacher") navigateTo("/teacher/dashboard");
        else if (selectedRole === "Alumni")  navigateTo("/alumni/dashboard");
        else if (selectedRole === "Admin")   navigateTo("/admin/dashboard");
        else navigateTo("/");
      })
      .catch((error) => {
        toast.error(error.response?.data?.message || "Login failed.");
      });
  };

  if (showForgotPassword) {
    return <ForgotPassword onBack={() => setShowForgotPassword(false)} selectedRole={selectedRole} />;
  }

  const inp = "w-full px-4 py-3 rounded-lg bg-slate-800 border border-white/10 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-200";

  return (
    <form onSubmit={handleSubmit(handleLogin)} className="w-full space-y-4">

      {/* Email */}
      <div>
        <label className="block mb-1 text-sm font-medium text-slate-300">Email</label>
        <input
          type="email"
          placeholder="Enter your email"
          className={inp}
          {...register("email", { required: "Email is required" })}
        />
        {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
      </div>

      {/* Password */}
      <div>
        <label className="block mb-1 text-sm font-medium text-slate-300">Password</label>
        <input
          type="password"
          placeholder="Enter your password"
          className={inp}
          {...register("password", {
            required: "Password is required",
            minLength: { value: 6, message: "Password must be at least 6 characters" },
          })}
        />
        {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
      </div>

      {/* Keep me signed in + Forgot password row */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2.5 cursor-pointer group">
          <div
            onClick={() => setKeepSignedIn(p => !p)}
            className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all duration-150 ${
              keepSignedIn
                ? "bg-sky-500 border-sky-500"
                : "border-slate-600 group-hover:border-slate-400"
            }`}
          >
            {keepSignedIn && (
              <svg viewBox="0 0 12 12" fill="none" className="w-2.5 h-2.5">
                <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
          <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors select-none">
            Keep me signed in
          </span>
        </label>

        <button
          type="button"
          onClick={() => setShowForgotPassword(true)}
          className="text-sm text-sky-400 hover:text-sky-300 font-medium transition-colors"
        >
          Forgot Password?
        </button>
      </div>

      {/* Keep signed in hint */}
      {keepSignedIn && (
        <p className="text-xs text-slate-500 -mt-2 pl-0.5">
          You will stay signed in for 30 days on this device.
        </p>
      )}

      <button
        disabled={isSubmitting}
        type="submit"
        className="w-full py-3 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-bold text-sm tracking-widest uppercase transition-all duration-200 shadow-md hover:shadow-sky-500/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Signing In..." : "Sign In"}
      </button>
    </form>
  );
};

export default Login;
