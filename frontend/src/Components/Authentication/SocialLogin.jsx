import React from 'react';
import { FaGoogle, FaLinkedin } from "react-icons/fa";
import { motion } from 'framer-motion';

const SocialLogin = () => {
  const handleSocialLogin = (provider) => {
    console.log(`Logging in with ${provider}`);
  };

  return (
    <div className="w-full space-y-3">
      <motion.button
        onClick={() => handleSocialLogin('google')}
        className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-slate-700/50 bg-slate-800/50 text-slate-200 hover:bg-slate-800/70 hover:border-slate-600/50 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <FaGoogle className="text-red-400" size={20} />
        <span className="font-medium">Continue with Google</span>
      </motion.button>

      <motion.button
        onClick={() => handleSocialLogin('linkedin')}
        className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-slate-700/50 bg-slate-800/50 text-slate-200 hover:bg-slate-800/70 hover:border-slate-600/50 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <FaLinkedin className="text-blue-400" size={20} />
        <span className="font-medium">Continue with LinkedIn</span>
      </motion.button>

      <motion.div 
        className="relative"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-700/50"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-3 bg-slate-900 text-slate-500">Or continue with email</span>
        </div>
      </motion.div>
    </div>
  );
};

export default SocialLogin;
