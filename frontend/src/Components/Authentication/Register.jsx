import React, { useContext } from "react";
import { useForm } from "react-hook-form";
import { Context } from "../../main.jsx";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const Register = () => {
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
  });;

  const handleRegister = async (data) => {
    data.phone = `+91${data.phone}`;
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
        toast.error(error.response.data.message);
      });
  };

  return (
    <form onSubmit={handleSubmit((data) => handleRegister(data))} className="w-full space-y-4">
      <div>
        <label className="block mb-1 text-sm font-medium">Full Name</label>
        <input
          type="text"
          placeholder="Enter your Name"
          className="w-full p-3 rounded-lg bg-gray-50 border border-gray-200 outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 hover:bg-gray-100"
          {...register("name", {
            required: { value: true, message: "Name is required" }
          })}
        />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
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

      <div>
        <label className="block mb-1 text-sm font-medium">Phone No.</label>
        <div className="flex items-center w-full rounded-lg bg-gray-50 border border-gray-200 focus-within:ring-2 focus-within:ring-purple-400 transition-all duration-300 hover:bg-gray-100">
          <span className="pl-3 pr-2 text-gray-500 font-medium">+91</span>
          <input
            type="number"
            placeholder="Enter your Phone No."
            className="w-full p-3 bg-transparent outline-none"
            {...register("phone", { required: { value: true, message: "Phone No. is required" } })}
          />
        </div>
        {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
      </div>

      <div>
        <label className="block mb-1 text-sm font-medium">Password</label>
        <input
          type="password"
          placeholder="Enter your password"
          className="w-full p-3 rounded-lg bg-gray-50 border border-gray-200 outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 hover:bg-gray-100"
          {...register("password", {
            required: { value: true, message: "Password is required" },
            minLength: { value: 6, message: "Password must be at least 6 characters" }
          })}
        />
        {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
      </div>

      <div>
        <label className="block mb-1 text-sm font-medium">Confirm Password</label>
        <input
          type="password"
          placeholder="Confirm your password"
          className="w-full p-3 rounded-lg bg-gray-50 border border-gray-200 outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 hover:bg-gray-100"
          {...register("confirmPassword", {
            required: { value: true, message: "Please confirm your password" },
            validate: (value) => value === watch("password") || "Passwords don't match"
          })}
        />
        {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>}
      </div>

      <button
        disabled={isSubmitting}
        type="submit"
        className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-500 via-purple-600 to-pink-500 text-white hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Creating Account..." : "Sign Up"}
      </button>
    </form>
  );
};

export default Register;