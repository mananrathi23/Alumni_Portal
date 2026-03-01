import React, { useState, useContext } from "react";
import { PiStudent } from "react-icons/pi";
import { useNavigate, Navigate } from "react-router-dom";
import { Context } from "../../main";
import Login from "./Login";
import Register from "./Register";
import RoleSelection from "./RoleSelection";
import SocialLogin from "./SocialLogin";

const Auth = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useContext(Context);
  const [isLogin, setIsLogin] = useState(true);

  if (isAuthenticated) {
    return <Navigate to={"/student"} />;
  }

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
        <SocialLogin/>
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
        <RoleSelection/>
        {isLogin ? <Login /> : <Register />}
      </div>
    </div>
  );
};

export default Auth;