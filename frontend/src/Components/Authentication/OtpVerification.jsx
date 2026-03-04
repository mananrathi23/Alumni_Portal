import React, { useContext } from "react";
import { useForm } from "react-hook-form";
import { useParams, useNavigate } from "react-router-dom";
import { Context } from "../../main";
import axios from "axios";
import { toast } from "react-toastify";
import { motion } from 'framer-motion';

const OtpForm = ({ email, phone }) => {
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
        "http://localhost:4000/api/v1/user/otp-verification",
        { email, phone, otp: data.otp },
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        }
      )
      .then((res) => {
        toast.success(res.data.message);
        setIsAuthenticated(true);
        setUser(res.data.user);
        navigateTo("/");
      })
      .catch((error) => {
        toast.error(error.response?.data?.message || "Something went wrong");
      });
  };

  return (
    <form onSubmit={handleSubmit(handleOtpVerification)} className="w-full space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <label className="block mb-2 text-sm font-medium text-slate-300">Enter OTP</label>
        <input
          type="number"
          placeholder="Enter your OTP"
          className="w-full p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-200 placeholder-slate-500 outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 focus:bg-slate-800/80 transition-all duration-300 hover:bg-slate-800/70 hover:border-slate-600/50"
          {...register("otp", {
            required: { value: true, message: "OTP is required" },
            minLength: { value: 4, message: "OTP must be at least 4 digits" },
          })}
        />
        {errors.otp && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-400 text-sm mt-1"
          >
            {errors.otp.message}
          </motion.p>
        )}
      </motion.div>

      <motion.button
        disabled={isSubmitting}
        type="submit"
        className="relative w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold overflow-hidden shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
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
          {isSubmitting ? "Verifying..." : "Verify OTP"}
        </span>
      </motion.button>

      <motion.p
        className="text-sm text-slate-400 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        Didn't receive the OTP?{" "}
        <button
          type="button"
          onClick={() => navigateTo(-1)}
          className="text-purple-400 hover:text-purple-300 font-medium transition-colors duration-200"
        >
          Go Back
        </button>
      </motion.p>
    </form>
  );
};

const OtpVerification = () => {
  const { email, phone } = useParams();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950 flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <motion.div
        className="relative bg-slate-900/80 backdrop-blur-xl w-full max-w-lg p-6 md:p-10 rounded-3xl shadow-2xl border border-slate-800/50 flex flex-col items-center gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            OTP Verification
          </h2>
          <p className="text-slate-400 text-sm mt-2">
            Enter the OTP sent to your {email ? "email" : "phone"}
          </p>
        </motion.div>
        <OtpForm email={email} phone={phone} />
      </motion.div>
    </div>
  );
};

export default OtpVerification;