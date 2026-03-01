import React from 'react';
import { FaGoogle, FaLinkedin } from "react-icons/fa";

const SocialLogin = () => {
  const handleSocialLogin = (provider) => {
    console.log(`Logging in with ${provider}`);
  };

  return (
    <div className="w-full space-y-3">
      <button
        onClick={() => handleSocialLogin('google')}
        className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 hover:shadow-md transition-all duration-300"
      >
        <FaGoogle className="text-red-500" size={20} />
        <span className="text-gray-700 font-medium">Continue with Google</span>
      </button>

      <button
        onClick={() => handleSocialLogin('linkedin')}
        className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 hover:shadow-md transition-all duration-300"
      >
        <FaLinkedin className="text-blue-600" size={20} />
        <span className="text-gray-700 font-medium">Continue with LinkedIn</span>
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
  );
};

export default SocialLogin;