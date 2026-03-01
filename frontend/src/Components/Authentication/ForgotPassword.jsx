import React, { useState } from 'react';
import { useForm } from "react-hook-form";
import axios from "axios";
import { toast } from "react-toastify";
import { MdMarkEmailRead } from "react-icons/md";

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
      <div className="w-full flex flex-col items-center gap-4 text-center">
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-full text-5xl shadow-lg">
          <MdMarkEmailRead />
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Email Sent!
        </h2>
        <p className="text-gray-500 text-sm">
          A password reset link has been sent to
        </p>
        <p className="text-purple-600 font-medium">{email}</p>
        <p className="text-gray-400 text-xs">
          Please check your inbox and follow the link to reset your password.
        </p>
        <button
          onClick={onBack}
          className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-500 via-purple-600 to-pink-500 text-white hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold"
        >
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Reset Password
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Enter your email and we'll send you a reset link.
        </p>
      </div>

      <div>
        <label className="block mb-1 text-sm font-medium">Email</label>
        <input
          type="email"
          placeholder="Enter your email"
          className="w-full p-3 rounded-lg bg-gray-50 border border-gray-200 outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 hover:bg-gray-100"
          {...register("email", { required: { value: true, message: "Email is required" } })}
        />
        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
      </div>

      <div className="flex gap-4 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="w-1/2 py-3 rounded-lg bg-gradient-to-r from-gray-500 to-gray-600 text-white hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold"
        >
          Back
        </button>
        <button
          disabled={isSubmitting}
          type="submit"
          className="w-1/2 py-3 rounded-lg bg-gradient-to-r from-purple-500 via-purple-600 to-pink-500 text-white hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Sending..." : "Send Reset Link"}
        </button>
      </div>
    </form>
  );
};

export default ForgotPassword;