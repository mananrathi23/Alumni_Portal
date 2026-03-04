import React, { useState, useContext } from "react";
import { PiStudent } from "react-icons/pi";
import { useNavigate, Navigate } from "react-router-dom";
import { Context } from "../../main";
import Login from "./Login";
import Register from "./Register";
import RoleSelection from "./RoleSelection";
import SocialLogin from "./SocialLogin";
import { motion } from 'framer-motion';

const Auth = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useContext(Context);
  const [selectedRole, setSelectedRole] = useState("Alumni");
  const [isLogin, setIsLogin] = useState(true);

  if (isAuthenticated) {
    return <Navigate to={"/student"} />;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-purple-950 flex items-center justify-center px-4 py-8 relative overflow-hidden">
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
        {/* Logo */}
        <motion.div
          className="bg-linear-to-r from-purple-600 to-pink-600 text-white p-4 rounded-full text-3xl shadow-lg shadow-purple-500/50"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          whileHover={{ scale: 1.1, rotate: 360 }}
        >
          <PiStudent />
        </motion.div>

        {/* Heading */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className="text-2xl md:text-3xl font-bold bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Alumni-Student Portal
          </h1>
          <p className="text-slate-400 mt-2 text-sm md:text-base">
            Connect, learn, and grow together
          </p>
        </motion.div>

        <SocialLogin />

        {/* Auth Mode Toggle */}
        <motion.div
          className="w-full flex rounded-xl bg-slate-800/50 p-1 border border-slate-700/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
              isLogin
                ? "bg-linear-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30"
                : "text-slate-400 hover:text-slate-300"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
              !isLogin
                ? "bg-linear-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30"
                : "text-slate-400 hover:text-slate-300"
            }`}
          >
            Sign Up
          </button>
        </motion.div>

        <RoleSelection
          selectedRole={selectedRole}
          setSelectedRole={setSelectedRole}
        />

        {isLogin ? (
          <Login selectedRole={selectedRole} />
        ) : (
          <Register selectedRole={selectedRole} />
        )}
      </motion.div>
    </div>
  );
};

export default Auth;