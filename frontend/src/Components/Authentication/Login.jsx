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
  const { setIsAuthenticated, setUser } = useContext(Context);
  const navigateTo = useNavigate();

  const handleLogin = async (data) => {
    data.role = selectedRole;
    await axios
      .post("http://localhost:4000/api/v1/user/login", data, {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      })
      .then((res) => {
        toast.success(res.data.message);
        setIsAuthenticated(true);
        setUser(res.data.user);
        if (selectedRole === "Student") navigateTo("/student/dashboard");
        else if (selectedRole === "Teacher") navigateTo("/teacher/dashboard");
        else if (selectedRole === "Alumni")  navigateTo("/alumni/dashboard");
        else if (selectedRole === "Admin")   navigateTo("/admin/dashboard");
        else navigateTo("/");
      })
      .catch((error) => {
        toast.error(error.response.data.message);
      });
  };

  if (showForgotPassword) {
    return <ForgotPassword onBack={() => setShowForgotPassword(false)} selectedRole={selectedRole} />;
  }

  return (
    <form onSubmit={handleSubmit(handleLogin)} className="w-full space-y-4">

      {/* Email */}
      <div>
        <label className="block mb-1 text-sm font-medium text-slate-300">Email</label>
        <input
          type="email"
          placeholder="Enter your email"
          className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-white/10 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-200"
          {...register("email", { required: { value: true, message: "Email is required" } })}
        />
        {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
      </div>

      {/* Password */}
      <div>
        <label className="block mb-1 text-sm font-medium text-slate-300">Password</label>
        <input
          type="password"
          placeholder="Enter your password"
          className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-white/10 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-200"
          {...register("password", {
            required: { value: true, message: "Password is required" },
            minLength: { value: 6, message: "Password must be at least 6 characters" },
          })}
        />
        {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
      </div>

      {/* Forgot */}
      <div className="text-right">
        <button
          type="button"
          onClick={() => setShowForgotPassword(true)}
          className="text-sm text-sky-400 hover:text-sky-300 font-medium transition-colors duration-200"
        >
          Forgot Password?
        </button>
      </div>

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
