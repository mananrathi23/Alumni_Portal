import React, { useContext } from "react";
import { useForm } from "react-hook-form";
import { useParams, useNavigate } from "react-router-dom";
import { Context } from "../../main";
import axios from "axios";
import { toast } from "react-toastify";

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
      <div>
        <label className="block mb-1 text-sm font-medium">Enter OTP</label>
        <input
          type="number"
          placeholder="Enter your OTP"
          className="w-full p-3 rounded-lg bg-gray-50 border border-gray-200 outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 hover:bg-gray-100"
          {...register("otp", {
            required: { value: true, message: "OTP is required" },
            minLength: { value: 4, message: "OTP must be at least 4 digits" },
          })}
        />
        {errors.otp && (
          <p className="text-red-500 text-sm mt-1">{errors.otp.message}</p>
        )}
      </div>

      <button
        disabled={isSubmitting}
        type="submit"
        className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-500 via-purple-600 to-pink-500 text-white hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Verifying..." : "Verify OTP"}
      </button>

      <p className="text-sm text-gray-500 text-center">
        Didn't receive the OTP?{" "}
        <button
          type="button"
          onClick={() => navigateTo(-1)}
          className="text-purple-600 hover:text-purple-800 font-medium"
        >
          Go Back
        </button>
      </p>
    </form>
  );
};

const OtpVerification = () => {
  const { email, phone } = useParams();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center px-4 py-8">
      <div className="bg-white/90 backdrop-blur-sm w-full max-w-lg p-6 md:p-10 rounded-3xl shadow-2xl border border-white/20 flex flex-col items-center gap-6">
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            OTP Verification
          </h2>
          <p className="text-gray-500 text-sm mt-2">
            Enter the OTP sent to your {email ? "email" : "phone"}
          </p>
        </div>
        <OtpForm email={email} phone={phone} />
      </div>
    </div>
  );
};

export default OtpVerification;