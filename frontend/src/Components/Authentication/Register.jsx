import React, { useContext } from "react";
import { useForm } from "react-hook-form";
import { Context } from "../../main.jsx";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const Register = ({ selectedRole }) => {
  const { isAuthenticated } = useContext(Context);
  const navigateTo = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

  const handleRegister = async (data) => {
    data.phone = `+91${data.phone}`;
    data.role = selectedRole;
    data.verificationMethod = "email";

    await axios
      .post("http://localhost:4000/api/v1/user/register", data, {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      })
      .then((res) => {
        toast.success(res.data.message);
        navigateTo(`/otp-verification/${data.email}/${data.phone}/${selectedRole}`);
      })
      .catch((error) => {
        toast.error(error.response?.data?.message || "Something went wrong");
      });
  };

  const inputClass = "w-full px-4 py-3 rounded-lg bg-slate-800 border border-white/10 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-200";
  const labelClass = "block mb-1 text-sm font-medium text-slate-300";
  const errorClass = "text-red-400 text-xs mt-1";

  return (
    <form onSubmit={handleSubmit(handleRegister)} className="w-full space-y-4">

      {/* Full Name */}
      <div>
        <label className={labelClass}>Full Name</label>
        <input
          type="text"
          placeholder="Enter your name"
          className={inputClass}
          {...register("name", { required: "Name is required" })}
        />
        {errors.name && <p className={errorClass}>{errors.name.message}</p>}
      </div>

      {/* Email */}
      <div>
        <label className={labelClass}>Email</label>
        <input
          type="email"
          placeholder="Enter your email"
          className={inputClass}
          {...register("email", { required: "Email is required" })}
        />
        {errors.email && <p className={errorClass}>{errors.email.message}</p>}
      </div>

      {/* Phone */}
      <div>
        <label className={labelClass}>Phone No.</label>
        <div className="flex items-center w-full rounded-lg bg-slate-800 border border-white/10 focus-within:ring-2 focus-within:ring-sky-500 transition-all duration-200">
          <span className="pl-4 pr-2 text-slate-400 font-medium text-sm">+91</span>
          <input
            type="number"
            placeholder="Enter your phone number"
            className="w-full py-3 pr-4 bg-transparent outline-none text-white placeholder-slate-500"
            {...register("phone", { required: "Phone No. is required" })}
          />
        </div>
        {errors.phone && <p className={errorClass}>{errors.phone.message}</p>}
      </div>

      {/* Password */}
      <div>
        <label className={labelClass}>Password</label>
        <input
          type="password"
          placeholder="Enter your password"
          className={inputClass}
          {...register("password", {
            required: "Password is required",
            minLength: { value: 8, message: "Password must be at least 8 characters" },
          })}
        />
        {errors.password && <p className={errorClass}>{errors.password.message}</p>}
      </div>

      {/* Confirm Password */}
      <div>
        <label className={labelClass}>Confirm Password</label>
        <input
          type="password"
          placeholder="Confirm your password"
          className={inputClass}
          {...register("confirmPassword", {
            required: "Please confirm your password",
            validate: (value) => value === watch("password") || "Passwords don't match",
          })}
        />
        {errors.confirmPassword && <p className={errorClass}>{errors.confirmPassword.message}</p>}
      </div>

      {/* Role info */}
      <p className="text-xs text-slate-500 text-center">
        Registering as{" "}
        <span className="font-semibold text-sky-400">{selectedRole}</span>
      </p>

      <button
        disabled={isSubmitting}
        type="submit"
        className="w-full py-3 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-bold text-sm tracking-widest uppercase transition-all duration-200 shadow-md hover:shadow-sky-500/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Creating Account..." : "Sign Up"}
      </button>
    </form>
  );
};

export default Register;
