import React, { useContext } from "react";
import { useForm } from "react-hook-form";
import { useParams, useNavigate } from "react-router-dom";
import { Context } from "../../main";
import { PiGraduationCap } from "react-icons/pi";
import axios from "axios";
import { toast } from "react-toastify";

const OtpForm = ({ email, phone, role }) => {
  const navigateTo = useNavigate();
  const { setIsAuthenticated, setUser } = useContext(Context);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const handleOtpVerification = async (data) => {
    await axios
      .post(
        `${import.meta.env.VITE_BACKEND_URL || "http://localhost:4000"}/api/v1/user/otp-verification`,
        { email, phone, otp: data.otp, role },
        { withCredentials: true, headers: { "Content-Type": "application/json" } }
      )
      .then((res) => {
        toast.success(res.data.message);
        setIsAuthenticated(true);
        const verifiedUser = res.data.user;
        setUser(verifiedUser);
        const r = verifiedUser.role;
        if (r === "Student") navigateTo("/student/dashboard");
        else if (r === "Teacher") navigateTo("/teacher/dashboard");
        else if (r === "Alumni") navigateTo("/alumni/dashboard");
        else if (r === "Admin") navigateTo("/admin/dashboard");
        else navigateTo("/");
      })
      .catch((error) => {
        toast.error(error.response?.data?.message || "Something went wrong");
      });
  };

  return (
    <form onSubmit={handleSubmit(handleOtpVerification)} className="w-full space-y-4">
      <div>
        <label className="block mb-1 text-sm font-medium text-slate-300">Enter OTP</label>
        <input
          type="number"
          placeholder="_ _ _ _"
          className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-white/10 text-white placeholder-slate-600 outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-200 text-center text-xl tracking-[0.4em]"
          {...register("otp", {
            required: { value: true, message: "OTP is required" },
            minLength: { value: 4, message: "OTP must be at least 4 digits" },
          })}
        />
        {errors.otp && <p className="text-red-400 text-xs mt-1">{errors.otp.message}</p>}
      </div>

      <button
        disabled={isSubmitting}
        type="submit"
        className="w-full py-3 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-bold text-sm tracking-widest uppercase transition-all duration-200 shadow-md hover:shadow-sky-500/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Verifying..." : "Verify OTP"}
      </button>

      <p className="text-sm text-slate-500 text-center">
        Didn't receive the OTP?{" "}
        <button
          type="button"
          onClick={() => navigateTo(-1)}
          className="text-sky-400 hover:text-sky-300 font-medium transition-colors duration-200"
        >
          Go Back
        </button>
      </p>
    </form>
  );
};

const OtpVerification = () => {
  const { email, phone, role } = useParams();

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
            <div className="text-sky-400 text-4xl mb-4">✉</div>
            <h2 className="text-2xl font-bold text-white mb-2">Almost there!</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              We've sent a One-Time Password to verify your identity.
              Check your inbox and enter the code to complete registration.
            </p>
          </div>
          <p className="text-slate-500 text-xs leading-relaxed">
            The OTP is valid for a limited time. If you don't see it in your inbox,
            check your spam folder or go back to resend.
          </p>
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
              <h2 className="text-2xl font-bold text-white">OTP Verification</h2>
              <p className="text-slate-400 text-sm mt-1">
                Enter the code sent to your{" "}
                <span className="text-sky-400 font-medium">{email ? "email" : "phone"}</span>
              </p>
              {email && (
                <p className="text-slate-500 text-xs mt-1 truncate">{email}</p>
              )}
            </div>
            <OtpForm email={email} phone={phone} role={role} />
          </div>
        </div>
      </div>

    </div>
  );
};

export default OtpVerification;
