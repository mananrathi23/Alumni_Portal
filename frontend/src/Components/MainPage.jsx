import React from "react";
import { PiUsers, PiGraduationCap, PiBriefcase } from "react-icons/pi";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";

const MainPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl"></div>

      <div className="relative z-10">
        {/* Hero Section */}
        <div className="container mx-auto px-6 pt-20 pb-28 text-center">
          <div className="inline-flex items-center justify-center mb-6">
            <motion.div
              className="relative"
              animate={{ rotate: 360 }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              <PiGraduationCap className="w-12 h-12 text-purple-400" />

              {/* glow behind hat */}
              <motion.div
                className="absolute inset-0 bg-purple-500/30 blur-xl rounded-full"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
              />
            </motion.div>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-200 via-pink-200 to-purple-200 bg-clip-text text-transparent">
            Alumni Student Portal
          </h1>

          <p className="text-lg md:text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            Connect with alumni, find mentors, discover career opportunities,
            and grow your professional network.
          </p>

          <NavLink
            to="/login"
            className="inline-block px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-white font-semibold text-lg shadow-2xl shadow-purple-500/40 hover:scale-105 transition"
          >
            Get Started
          </NavLink>
        </div>

        {/* Feature Cards */}
        <div className="container mx-auto px-6 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Network */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition duration-500"></div>

              <div className="relative bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-8 hover:border-purple-500/50 transition">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-purple-500/50">
                  <PiUsers className="text-white text-2xl" />
                </div>

                <h3 className="text-2xl font-bold text-white mb-3">Network</h3>

                <p className="text-slate-400">
                  Connect with 500+ alumni worldwide
                </p>
              </div>
            </div>

            {/* Mentorship */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-600/20 to-purple-600/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition duration-500"></div>

              <div className="relative bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-8 hover:border-pink-500/50 transition">
                <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-pink-500/50">
                  <PiGraduationCap className="text-white text-2xl" />
                </div>

                <h3 className="text-2xl font-bold text-white mb-3">
                  Mentorship
                </h3>

                <p className="text-slate-400">
                  Get guidance from industry experts
                </p>
              </div>
            </div>

            {/* Opportunities */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition duration-500"></div>

              <div className="relative bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-8 hover:border-blue-500/50 transition">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/50">
                  <PiBriefcase className="text-white text-2xl" />
                </div>

                <h3 className="text-2xl font-bold text-white mb-3">
                  Opportunities
                </h3>

                <p className="text-slate-400">
                  Discover internships and job openings
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-slate-500 py-8">
          © 2026 Alumni Portal
        </footer>
      </div>
    </div>
  );
};

export default MainPage;