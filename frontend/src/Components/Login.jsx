import React, { useState } from "react";
import { PiStudent } from "react-icons/pi";
import { FaUserGraduate } from "react-icons/fa";
import { GiTeacher } from "react-icons/gi";
import { MdAdminPanelSettings } from "react-icons/md";
import { useForm } from "react-hook-form"
import { NavLink } from "react-router-dom";

const Login = () => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm()

  const onSubmit = async (data) => {
  const loginData = {
    email: data.email,
    password: data.password,
    role: selectedRole
  };

  try {
    const res = await fetch("http://localhost:12000/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(loginData)
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



  const [selectedRole, setSelectedRole] = useState("Alumni");

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

        {/* Email Input */}
        <form onSubmit={handleSubmit(onSubmit)} className="w-full">
          <div className="w-full">
            <label className="block mb-1 text-sm font-medium">Email</label>
            <input
              type="email"
              placeholder={`${selectedRole}@company.com`}
              className="w-full p-3 rounded-lg bg-gray-50 border border-gray-200 outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 hover:bg-gray-100"
              {...register("email", { required: { value: true, message: "Email is required" } },

              )}
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
          </div>

          
          <div className="w-full">
            <label className="block mb-1 text-sm font-medium">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              className="w-full p-3 rounded-lg bg-gray-50 border border-gray-200 outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 hover:bg-gray-100"
              {...register("password", { required: { value: true, message: "Password is required" } })}
            />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
          </div>

          
          <div className="w-full flex flex-col md:flex-row gap-4 mt-6">
            <NavLink to="/" className="inline-block w-full md:w-1/2 py-3 text-center rounded-lg bg-gradient-to-r from-gray-500 to-gray-600 text-white hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold">
              Back
            </NavLink>
            <button disabled={isSubmitting} type="submit" className="w-full md:w-1/2 py-3 rounded-lg bg-gradient-to-r from-purple-500 via-purple-600 to-pink-500 text-white hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
              {isSubmitting ? "Signing In..." : "Sign In"}
            </button>
          </div>
        </form>

        
        <p className="text-sm text-gray-500">
          Demo: Select a role and enter any email to continue
        </p>
      </div>
    </div>
  );
};

export default Login;
