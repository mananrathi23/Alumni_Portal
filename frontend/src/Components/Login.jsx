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

  const onSubmit = (data) => console.log(data)

  const [selectedRole, setSelectedRole] = useState("Alumni");

  const roles = [
    { name: "Student", icon: <PiStudent size={24} /> },
    { name: "Alumni", icon: <FaUserGraduate size={24} /> },
    { name: "Teacher", icon: <GiTeacher size={24} /> },
    { name: "Admin", icon: <MdAdminPanelSettings size={24} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-200 flex items-center justify-center">
      <div className="bg-white w-[600px] p-10 rounded-2xl shadow-xl flex flex-col items-center gap-6">

        {/* Logo */}
        <div className="bg-purple-600 text-white p-4 rounded-full text-3xl">
          <PiStudent />
        </div>

        {/* Heading */}
        <div className="text-center">
          <h1 className="text-2xl font-semibold">
            Alumni-Student Portal
          </h1>
          <p className="text-gray-500 mt-2">
            Connect, learn, and grow together
          </p>
        </div>

        {/* Role Selection */}
        <div className="w-full">
          <p className="mb-3 font-medium">Select Your Role</p>
          <div className="grid grid-cols-4 gap-4">
            {roles.map((role) => (
              <div
                key={role.name}
                onClick={() => setSelectedRole(role.name)}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border cursor-pointer transition 
                ${selectedRole === role.name
                    ? "bg-purple-100 border-purple-500 text-purple-600"
                    : "bg-gray-50 border-gray-200 hover:border-purple-400"
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
              className="w-full p-3 rounded-lg bg-gray-100 outline-none focus:ring-2 focus:ring-purple-400"
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
              className="w-full p-3 rounded-lg bg-gray-100 outline-none focus:ring-2 focus:ring-purple-400"
              {...register("password", { required: { value: true, message: "Password is required" } })}
            />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
          </div>

          
          <div className="w-full flex gap-4 mt-6">
            <NavLink to="/" className="inline-block w-1/2 py-3 text-center rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:shadow-lg hover:scale-105 transition duration-200">
              Back
            </NavLink>
            <button disabled={isSubmitting} type="submit" className="w-1/2 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:shadow-lg hover:scale-105 transition duration-200">
              Sign In
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
