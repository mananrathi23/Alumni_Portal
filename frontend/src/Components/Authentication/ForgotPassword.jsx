import React, { useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { toast } from "react-toastify";
import { MdMarkEmailRead } from "react-icons/md";

// accepts selectedRole from Login.jsx
const ForgotPassword = ({ onBack, selectedRole }) => {
  const [email, setEmail] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const [mailSent, setMailSent] = useState(false);

  const onSubmit = async (data) => {
    await axios
      .post(
        `${import.meta.env.VITE_BACKEND_URL || "http://localhost:4000"}/api/v1/user/password/forgot`,
        { email: data.email, role: selectedRole },
        { withCredentials: true, headers: { "Content-Type": "application/json" } }
      )
      .then((res) => {
        toast.success(res.data.message);
        setEmail(data.email);
        setMailSent(true);
      })
      .catch((error) => {
        toast.error(error.response?.data?.message || "Something went wrong");
      });
  };

  const inputClass = "w-full px-4 py-3 rounded-lg bg-slate-800 border border-white/10 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-200";

  if (mailSent) {
    return (
      <div className="w-full flex flex-col items-center gap-5 text-center py-2">
        <div className="bg-sky-500/20 border border-sky-500/40 text-sky-400 p-5 rounded-xl text-5xl shadow-md">
          <MdMarkEmailRead />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Email Sent!</h2>
          <p className="text-slate-400 text-sm">A password reset link has been sent to</p>
          <p className="text-sky-400 font-semibold mt-1">{email}</p>
          <p className="text-slate-500 text-xs mt-2">
            Please check your inbox and follow the link to reset your password.
          </p>
        </div>
        <button
          onClick={onBack}
          className="w-full py-3 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-bold text-sm tracking-widest uppercase transition-all duration-200 hover:-translate-y-0.5"
        >
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-bold text-white">Reset Password</h2>
        <p className="text-sm text-slate-400 mt-1">
          Enter your email and we'll send you a reset link.
        </p>
      </div>

      <div>
        <label className="block mb-1 text-sm font-medium text-slate-300">Email</label>
        <input
          type="email"
          placeholder="Enter your email"
          className={inputClass}
          {...register("email", { required: { value: true, message: "Email is required" } })}
        />
        {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
      </div>

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onBack}
          className="w-1/2 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 border border-white/10 text-slate-300 font-semibold text-sm transition-all duration-200"
        >
          Back
        </button>
        <button
          disabled={isSubmitting}
          type="submit"
          className="w-1/2 py-3 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-bold text-sm tracking-wide uppercase transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Sending..." : "Send Link"}
        </button>
      </div>
    </form>
  );
};

export default ForgotPassword;
