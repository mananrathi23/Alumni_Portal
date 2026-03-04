import React, { useContext, useState } from "react";
import { useForm } from "react-hook-form";
import { Context } from "../../main.jsx";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { motion } from 'framer-motion';

const Register = ({selectedRole}) => {
  const { isAuthenticated } = useContext(Context);
  const navigateTo = useNavigate();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      verificationMethod: "email",
    }
  });

  const handleRegister = async (data) => {
    if (data.password !== data.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    data.phone = `+91${data.phone}`;
    data.role = selectedRole;
    await axios
      .post("http://localhost:4000/api/v1/user/register", data, {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      })
      .then((res) => {
        toast.success(res.data.message);
        navigateTo(`/otp-verification/${data.email}/${data.phone}`);
      })
      .catch((error) => {
        console.log("REGISTER ERROR:", error.response?.data);
        toast.error(error.response?.data?.message || "Registration failed");
      });
  };

  return (
    <form
      onSubmit={handleSubmit((data) => handleRegister(data))}
      className="w-full space-y-4"
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <label className="block mb-2 text-sm font-medium text-slate-300">Full Name</label>
        <input
          type="text"
          placeholder="Enter your Name"
          className="w-full p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-200 placeholder-slate-500 outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 focus:bg-slate-800/80 transition-all duration-300 hover:bg-slate-800/70 hover:border-slate-600/50"
          {...register("name", {
            required: { value: true, message: "Name is required" },
          })}
        />
        {errors.name && (
          <motion.p 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-400 text-sm mt-1"
          >
            {errors.name.message}
          </motion.p>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <label className="block mb-2 text-sm font-medium text-slate-300">Email</label>
        <input
          type="email"
          placeholder="Enter your email"
          className="w-full p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-200 placeholder-slate-500 outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 focus:bg-slate-800/80 transition-all duration-300 hover:bg-slate-800/70 hover:border-slate-600/50"
          {...register("email", {
            required: { value: true, message: "Email is required" },
          })}
        />
        {errors.email && (
          <motion.p 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-400 text-sm mt-1"
          >
            {errors.email.message}
          </motion.p>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <label className="block mb-2 text-sm font-medium text-slate-300">Phone No.</label>
        <div className="flex items-center w-full rounded-xl bg-slate-800/50 border border-slate-700/50 focus-within:ring-2 focus-within:ring-purple-500/50 focus-within:border-purple-500/50 transition-all duration-300 hover:bg-slate-800/70 hover:border-slate-600/50">
          <span className="pl-3 pr-2 text-slate-400 font-medium">+91</span>
          <input
            type="number"
            placeholder="Enter your Phone No."
            className="w-full p-3 bg-transparent text-slate-200 placeholder-slate-500 outline-none"
            {...register("phone", {
              required: { value: true, message: "Phone No. is required" },
            })}
          />
        </div>
        {errors.phone && (
          <motion.p 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-400 text-sm mt-1"
          >
            {errors.phone.message}
          </motion.p>
        )}
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <label className="block mb-2 text-sm font-medium text-slate-300">Department</label>
        <select
          className="w-full p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-200 outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 focus:bg-slate-800/80 transition-all duration-300 hover:bg-slate-800/70 hover:border-slate-600/50"
          {...register("department", { required: "Department is required" })}
        >
          <option value="" className="bg-slate-800">Select Department</option>

          {selectedRole === "Teacher" ? (
            <>
              <option value="Mathematics" className="bg-slate-800">Mathematics</option>
              <option value="Electrical" className="bg-slate-800">Electrical</option>
              <option value="Computer Science" className="bg-slate-800">Computer Science</option>
              <option value="Mechanical" className="bg-slate-800">Mechanical</option>
            </>
          ) : (
            <>
              <option value="BCA" className="bg-slate-800">BCA</option>
              <option value="BTech" className="bg-slate-800">BTech</option>
              <option value="BBA" className="bg-slate-800">BBA</option>
              <option value="BDes" className="bg-slate-800">BDes</option>
            </>
          )}
        </select>
        {errors.department && (
          <motion.p 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-400 text-sm mt-1"
          >
            {errors.department.message}
          </motion.p>
        )}
      </motion.div>
      {selectedRole === "Student" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <label className="block mb-2 text-sm font-medium text-slate-300">Year</label>
          <select
            className="w-full p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-200 outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 focus:bg-slate-800/80 transition-all duration-300 hover:bg-slate-800/70 hover:border-slate-600/50"
            {...register("year", { required: "Year is required" })}
          >
            <option value="" className="bg-slate-800">Select Year</option>

            {watch("department") === "BBA" || watch("department") === "BCA" ? (
              <>
                <option value="1st Year" className="bg-slate-800">1st Year</option>
                <option value="2nd Year" className="bg-slate-800">2nd Year</option>
                <option value="3rd Year" className="bg-slate-800">3rd Year</option>
              </>
            ) : (
              <>
                <option value="1st Year" className="bg-slate-800">1st Year</option>
                <option value="2nd Year" className="bg-slate-800">2nd Year</option>
                <option value="3rd Year" className="bg-slate-800">3rd Year</option>
                <option value="4th Year" className="bg-slate-800">4th Year</option>
              </>
            )}
          </select>
          {errors.year && (
            <motion.p 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-400 text-sm mt-1"
            >
              {errors.year.message}
            </motion.p>
          )}
        </motion.div>
      )}
      {selectedRole === "Alumni" && (
        <>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <label className="block mb-2 text-sm font-medium text-slate-300">Graduation Year</label>
            <input
              type="number"
              placeholder="Enter graduation year"
              className="w-full p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-200 placeholder-slate-500 outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 focus:bg-slate-800/80 transition-all duration-300 hover:bg-slate-800/70 hover:border-slate-600/50"
              {...register("graduationYear", { required: "Required" })}
            />
            {errors.graduationYear && (
              <motion.p 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-400 text-sm mt-1"
              >
                {errors.graduationYear.message}
              </motion.p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <label className="block mb-2 text-sm font-medium text-slate-300">Current Company</label>
            <input
              type="text"
              placeholder="Enter company name"
              className="w-full p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-200 placeholder-slate-500 outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 focus:bg-slate-800/80 transition-all duration-300 hover:bg-slate-800/70 hover:border-slate-600/50"
              {...register("company", { required: "Required" })}
            />
            {errors.company && (
              <motion.p 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-400 text-sm mt-1"
              >
                {errors.company.message}
              </motion.p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <label className="block mb-2 text-sm font-medium text-slate-300">Current Role</label>
            <input
              type="text"
              placeholder="Enter job role"
              className="w-full p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-200 placeholder-slate-500 outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 focus:bg-slate-800/80 transition-all duration-300 hover:bg-slate-800/70 hover:border-slate-600/50"
              {...register("jobRole", { required: "Required" })}
            />
            {errors.jobRole && (
              <motion.p 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-400 text-sm mt-1"
              >
                {errors.jobRole.message}
              </motion.p>
            )}
          </motion.div>
        </>
      )}
      {selectedRole === "Teacher" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <label className="block mb-2 text-sm font-medium text-slate-300">Designation</label>
          <input
            type="text"
            placeholder="Enter designation"
            className="w-full p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-200 placeholder-slate-500 outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 focus:bg-slate-800/80 transition-all duration-300 hover:bg-slate-800/70 hover:border-slate-600/50"
            {...register("designation", { required: "Required" })}
          />
          {errors.designation && (
            <motion.p 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-400 text-sm mt-1"
            >
              {errors.designation.message}
            </motion.p>
          )}
        </motion.div>
      )}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
      >
        <label className="block mb-2 text-sm font-medium text-slate-300">Password</label>
        <input
          type="password"
          placeholder="Enter your password"
          className="w-full p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-200 placeholder-slate-500 outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 focus:bg-slate-800/80 transition-all duration-300 hover:bg-slate-800/70 hover:border-slate-600/50"
          {...register("password", {
            required: { value: true, message: "Password is required" },
            minLength: {
              value: 8,
              message: "Password must be at least 8 characters",
            },
          })}
        />
        {errors.password && (
          <motion.p 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-400 text-sm mt-1"
          >
            {errors.password.message}
          </motion.p>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <label className="block mb-2 text-sm font-medium text-slate-300">
          Confirm Password
        </label>
        <input
          type="password"
          placeholder="Confirm your password"
          className="w-full p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-200 placeholder-slate-500 outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 focus:bg-slate-800/80 transition-all duration-300 hover:bg-slate-800/70 hover:border-slate-600/50"
          {...register("confirmPassword", {
            required: { value: true, message: "Please confirm your password" },
            validate: (value) =>
              value === watch("password") || "Passwords don't match",
          })}
        />
        {errors.confirmPassword && (
          <motion.p 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-400 text-sm mt-1"
          >
            {errors.confirmPassword.message}
          </motion.p>
        )}
      </motion.div>
      <motion.button
        disabled={isSubmitting}
        type="submit"
        className="relative w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold overflow-hidden shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        whileHover={!isSubmitting ? { scale: 1.02, boxShadow: "0 20px 40px -12px rgba(168, 85, 247, 0.5)" } : {}}
        whileTap={!isSubmitting ? { scale: 0.98 } : {}}
      >
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600"
          initial={{ x: "100%" }}
          whileHover={!isSubmitting ? { x: 0 } : {}}
          transition={{ duration: 0.3 }}
        />
        <span className="relative z-10">
          {isSubmitting ? "Creating Account..." : "Sign Up"}
        </span>
      </motion.button>
    </form>
  );
};

export default Register;