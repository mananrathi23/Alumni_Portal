import React, { useState } from "react";
import { PiStudent } from "react-icons/pi";
import { FaUserGraduate, FaGoogle, FaLinkedin } from "react-icons/fa";
import { GiTeacher } from "react-icons/gi";
import { MdAdminPanelSettings } from "react-icons/md";
import { useForm } from "react-hook-form";
import { NavLink } from "react-router-dom";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [selectedRole, setSelectedRole] = useState("Alumni");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

const onSubmit = async (data) => {
  const payload = {
    email: data.email,
    password: data.password,
    role: selectedRole,
    fullName: data.fullName
  };

  const url = isLogin
    ? "http://localhost:12000/login"
    : "http://localhost:12000/signup";

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const result = await res.json();

    if (result.message) {
      alert(result.message);
    } else {
      alert(result.error);
    }
  } catch (err) {
    alert("Server error");
  }
};



  const handleSocialLogin = (provider) => {
    console.log(`Logging in with ${provider}`);
  };

  const roles = [
    { name: "Student", icon: <PiStudent size={24} /> },
    { name: "Alumni", icon: <FaUserGraduate size={24} /> },
    { name: "Teacher", icon: <GiTeacher size={24} /> },
    { name: "Admin", icon: <MdAdminPanelSettings size={24} /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center px-4 py-8">
      <div className="bg-white/90 backdrop-blur-sm w-full max-w-lg p-6 md:p-10 rounded-3xl shadow-2xl border border-white/20 flex flex-col items-center gap-6 animate-fade-in-up">

        {/* Logo */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-full text-3xl shadow-lg hover:scale-110 transition-transform duration-300 animate-bounce">
          <PiStudent />
        </div>

        {/* Heading */}
        <div className="text-center animate-fade-in">
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Alumni-Student Portal
          </h1>
          <p className="text-gray-600 mt-2 text-sm md:text-base">
            Connect, learn, and grow together
          </p>
        </div>

        {/* Auth Mode Toggle */}
        <div className="w-full flex rounded-lg bg-gray-100 p-1">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-300 ${
              isLogin
                ? "bg-white text-purple-600 shadow-sm"
                : "text-gray-600 hover:text-purple-600"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-300 ${
              !isLogin
                ? "bg-white text-purple-600 shadow-sm"
                : "text-gray-600 hover:text-purple-600"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Social Login Buttons */}
        <div className="w-full space-y-3">
          <button
            onClick={() => handleSocialLogin('google')}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 hover:shadow-md transition-all duration-300"
          >
            <FaGoogle className="text-red-500" size={20} />
            <span className="text-gray-700 font-medium">
              Continue with Google
            </span>
          </button>

          <button
            onClick={() => handleSocialLogin('linkedin')}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 hover:shadow-md transition-all duration-300"
          >
            <FaLinkedin className="text-blue-600" size={20} />
            <span className="text-gray-700 font-medium">
              Continue with LinkedIn
            </span>
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with email</span>
            </div>
          </div>
        </div>

        {/* Role Selection */}
        <div className="w-full">
          <p className="mb-3 font-medium">Select Your Role</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {roles.map((role) => (
              <div
                key={role.name}
                onClick={() => setSelectedRole(role.name)}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105
                ${selectedRole === role.name
                    ? "bg-gradient-to-br from-purple-100 to-pink-100 border-purple-500 text-purple-600 shadow-md"
                    : "bg-gray-50 border-gray-200 hover:border-purple-400 hover:bg-purple-50"
                  }`}
              >
                {role.icon}
                <span className="mt-2 text-sm">{role.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-4">
          {!isLogin && (
            <div>
              <label className="block mb-1 text-sm font-medium">Full Name</label>
              <input
                type="text"
                placeholder="Enter your full name"
                className="w-full p-3 rounded-lg bg-gray-50 border border-gray-200 outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 hover:bg-gray-100"
                {...register("fullName", {
                  required: !isLogin && { value: true, message: "Full name is required" }
                })}
              />
              {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName.message}</p>}
            </div>
          )}

          <div>
            <label className="block mb-1 text-sm font-medium">Email</label>
            <input
              type="email"
              placeholder={`${selectedRole}@company.com`}
              className="w-full p-3 rounded-lg bg-gray-50 border border-gray-200 outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 hover:bg-gray-100"
              {...register("email", { required: { value: true, message: "Email is required" } })}
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
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

          {!isLogin && (
            <div>
              <label className="block mb-1 text-sm font-medium">Confirm Password</label>
              <input
                type="password"
                placeholder="Confirm your password"
                className="w-full p-3 rounded-lg bg-gray-50 border border-gray-200 outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 hover:bg-gray-100"
                {...register("confirmPassword", {
                  required: !isLogin && { value: true, message: "Please confirm your password" },
                  validate: !isLogin && ((value) => value === watch('password') || "Passwords don't match")
                })}
              />
              {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>}
            </div>
          )}

          <div className="w-full flex flex-col md:flex-row gap-4 mt-6">
            <NavLink to="/" className="inline-block w-full md:w-1/2 py-3 text-center rounded-lg bg-gradient-to-r from-gray-500 to-gray-600 text-white hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold">
              Back
            </NavLink>
            <button
              disabled={isSubmitting}
              type="submit"
              className="w-full md:w-1/2 py-3 rounded-lg bg-gradient-to-r from-purple-500 via-purple-600 to-pink-500 text-white hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting
                ? (isLogin ? "Signing In..." : "Creating Account...")
                : (isLogin ? "Sign In" : "Sign Up")
              }
            </button>
          </div>
        </form>

        <p className="text-sm text-gray-500 text-center">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-purple-600 hover:text-purple-800 font-medium ml-1"
          >
            {isLogin ? "Sign up here" : "Sign in here"}
          </button>
        </p>

        <p className="text-sm text-gray-500">
          Demo: Select a role and enter any email to continue
        </p>
      </div>
    </div>
  );
};

export default Auth;