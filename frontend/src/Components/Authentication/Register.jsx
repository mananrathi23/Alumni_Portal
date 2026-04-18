import React, { useContext } from "react";
import { useForm } from "react-hook-form";
import { Context } from "../../main.jsx";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const NEEDS_YEAR = ["Student", "Alumni"];

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
    if (data.enrollmentYear) data.enrollmentYear = Number(data.enrollmentYear);

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

  const inp = "w-full px-4 py-3 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-200";
  const lbl = "block mb-1 text-sm font-medium text-slate-600 dark:text-slate-300";
  const err = "text-red-400 text-xs mt-1";

  const currentYear = new Date().getFullYear();
  const needsYear   = NEEDS_YEAR.includes(selectedRole);

  // Alumni entered in past, Student will enter in future (or current)
  const isAlumni        = selectedRole === "Alumni";
  const yearLabel       = "Enrollment Year";
  const yearHint        = isAlumni
    ? "The year you enrolled — used to group you in your 'Class of' batch"
    : "The year you enrolled in the programme — used to group you with your batchmates";
  const yearPlaceholder = isAlumni ? `e.g. ${currentYear - 4}` : `e.g. ${currentYear - 1}`;
  const minYear         = 1980;
  const maxYear         = currentYear;

  return (
    <form onSubmit={handleSubmit(handleRegister)} className="w-full space-y-4">

      {/* Full Name */}
      <div>
        <label className={lbl}>Full Name</label>
        <input
          type="text"
          placeholder="Enter your name"
          className={inp}
          {...register("name", { required: "Name is required" })}
        />
        {errors.name && <p className={err}>{errors.name.message}</p>}
      </div>

      {/* Email */}
      <div>
        <label className={lbl}>Email</label>
        <input
          type="email"
          placeholder="Enter your email"
          className={inp}
          {...register("email", { required: "Email is required" })}
        />
        {errors.email && <p className={err}>{errors.email.message}</p>}
      </div>

      {/* Phone */}
      <div>
        <label className={lbl}>Phone No.</label>
        <div className="flex items-center w-full rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 focus-within:ring-2 focus-within:ring-sky-500 transition-all duration-200">
          <span className="pl-4 pr-2 text-slate-400 font-medium text-sm">+91</span>
          <input
            type="number"
            placeholder="Enter your phone number"
            className="w-full py-3 pr-4 bg-transparent outline-none text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
            {...register("phone", { required: "Phone No. is required" })}
          />
        </div>
        {errors.phone && <p className={err}>{errors.phone.message}</p>}
      </div>

      {/* Enrollment Year — Student and Alumni only */}
      {needsYear && (
        <div>
          <label className={lbl}>
            {yearLabel}
            <span className="text-red-400 ml-1">*</span>
          </label>
          <input
            type="number"
            placeholder={yearPlaceholder}
            className={inp}
            {...register("enrollmentYear", {
              required: `${yearLabel} is required — this groups you with your "Class of" batch`,
              min: { value: minYear, message: `Year must be after ${minYear}` },
              max: { value: maxYear, message: `Year cannot be in the future` },
            })}
          />
          <p className="text-slate-500 text-xs mt-1">{yearHint}</p>
          {errors.enrollmentYear && <p className={err}>{errors.enrollmentYear.message}</p>}
        </div>
      )}

      {/* Password */}
      <div>
        <label className={lbl}>Password</label>
        <input
          type="password"
          placeholder="Enter your password"
          className={inp}
          {...register("password", {
            required: "Password is required",
            minLength: { value: 8, message: "Password must be at least 8 characters" },
          })}
        />
        {errors.password && <p className={err}>{errors.password.message}</p>}
      </div>

      {/* Confirm Password */}
      <div>
        <label className={lbl}>Confirm Password</label>
        <input
          type="password"
          placeholder="Confirm your password"
          className={inp}
          {...register("confirmPassword", {
            required: "Please confirm your password",
            validate: (value) => value === watch("password") || "Passwords don't match",
          })}
        />
        {errors.confirmPassword && <p className={err}>{errors.confirmPassword.message}</p>}
      </div>

      {/* Role info */}
      <p className="text-xs text-slate-500 text-center">
        Registering as <span className="font-semibold text-sky-400">{selectedRole}</span>
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
