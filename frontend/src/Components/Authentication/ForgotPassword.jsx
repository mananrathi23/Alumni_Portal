import React, { useState } from 'react';
import { useForm } from "react-hook-form";
import axios from "axios";
import { toast } from "react-toastify";
import { MdMarkEmailRead } from "react-icons/md";
import { motion } from 'framer-motion';

const ForgotPassword = ({ onBack }) => {
  const [email, setEmail] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const [mailSent, setmailSent] = useState(false)

  const onSubmit = async (data) => {
    await axios
      .post("http://localhost:4000/api/v1/user/password/forgot",
        { email: data.email },
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        }
      )
      .then((res) => {
        toast.success(res.data.message);
        setEmail(data.email);
        setmailSent(true);
      })
      .catch((error) => {
        toast.error(error.response?.data?.message || "Something went wrong");
      });
  };

  if(mailSent){
    return (
      <motion.div 
        className="w-full flex flex-col items-center gap-4 text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div 
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-full text-5xl shadow-lg shadow-purple-500/50"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
        >
          <MdMarkEmailRead />
        </motion.div>
        <motion.h2 
          className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Email Sent!
        </motion.h2>
        <motion.p 
          className="text-slate-400 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          A password reset link has been sent to
        </motion.p>
        <motion.p 
          className="text-purple-400 font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {email}
        </motion.p>
        <motion.p 
          className="text-slate-500 text-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Please check your inbox and follow the link to reset your password.
        </motion.p>
        <motion.button
          onClick={onBack}
          className="relative w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold overflow-hidden shadow-lg shadow-purple-500/30 transition-all duration-300"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          whileHover={{ scale: 1.02, boxShadow: "0 20px 40px -12px rgba(168, 85, 247, 0.5)" }}
          whileTap={{ scale: 0.98 }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600"
            initial={{ x: "100%" }}
            whileHover={{ x: 0 }}
            transition={{ duration: 0.3 }}
          />
          <span className="relative z-10">Back to Login</span>
        </motion.button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-4">
      <motion.div 
        className="text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Reset Password
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Enter your email and we'll send you a reset link.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <label className="block mb-2 text-sm font-medium text-slate-300">Email</label>
        <input
          type="email"
          placeholder="Enter your email"
          className="w-full p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-200 placeholder-slate-500 outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 focus:bg-slate-800/80 transition-all duration-300 hover:bg-slate-800/70 hover:border-slate-600/50"
          {...register("email", { required: { value: true, message: "Email is required" } })}
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
        className="flex gap-4 pt-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <motion.button
          type="button"
          onClick={onBack}
          className="w-1/2 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-300 font-semibold transition-all duration-300 hover:bg-slate-800/70 hover:border-slate-600/50"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Back
        </motion.button>
        <motion.button
          disabled={isSubmitting}
          type="submit"
          className="relative w-1/2 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold overflow-hidden shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
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
            {isSubmitting ? "Sending..." : "Send Reset Link"}
          </span>
        </motion.button>
      </motion.div>
    </form>
  );
};

export default ForgotPassword;