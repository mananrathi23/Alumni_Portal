import React from "react";
import { FaGoogle, FaLinkedin } from "react-icons/fa";

const SocialLogin = () => {
  const handleSocialLogin = (provider) => {
    console.log(`Logging in with ${provider}`);
  };

  return (
    <div className="w-full space-y-3">
      <button
        onClick={() => handleSocialLogin("google")}
        className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-lg bg-slate-800 border border-white/10 hover:border-sky-500/40 hover:bg-slate-700 transition-all duration-200"
      >
        <FaGoogle className="text-red-400" size={18} />
        <span className="text-slate-300 text-sm font-medium">Continue with Google</span>
      </button>

      <button
        onClick={() => handleSocialLogin("linkedin")}
        className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-lg bg-slate-800 border border-white/10 hover:border-sky-500/40 hover:bg-slate-700 transition-all duration-200"
      >
        <FaLinkedin className="text-sky-400" size={18} />
        <span className="text-slate-300 text-sm font-medium">Continue with LinkedIn</span>
      </button>

      {/* Divider */}
      <div className="relative py-1">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center">
          <span className="px-3 bg-slate-900/80 text-slate-500 text-xs tracking-widest uppercase">
            Or continue with email
          </span>
        </div>
      </div>
    </div>
  );
};

export default SocialLogin;
