import React, { useState ,useContext} from "react";
import { useForm } from "react-hook-form";
import ForgotPassword from "./ForgotPassword";
import { Context } from "../../main";
import { useNavigate, Navigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { motion } from 'framer-motion';

const Login = () => {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
    const [showForgotPassword, setShowForgotPassword] = useState(false);

    const { setIsAuthenticated, setUser } = useContext(Context);
    const navigateTo = useNavigate();

        const handleLogin = async (data) => {
                console.log("LOGIN DATA SENT:", data);
                await axios
                    .post("http://localhost:4000/api/v1/user/login", data, {
                        withCredentials: true,
                        headers: {
                            "Content-Type": "application/json",
                        },
                    })
                    .then((res) => {
                        toast.success(res.data.message);
                        setIsAuthenticated(true);
                        setUser(res.data.user);
                        navigateTo("/");
                    })
                    .catch((error) => {
                        const backendMessage = error.response?.data?.message;
                        console.log("FULL LOGIN ERROR:", error);
                        console.log("SERVER RESPONSE:", error.response);
                        console.log("SERVER MESSAGE:", backendMessage);
                        toast.error(backendMessage || "Login failed");
                    });
        };

    if (showForgotPassword) {
        return <ForgotPassword onBack={() => setShowForgotPassword(false)} />;
    }

    return (
        <form onSubmit={handleSubmit((data)=>handleLogin(data))} className="w-full space-y-4">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <label className="block mb-2 text-sm font-medium text-slate-300">Email</label>
                <input
                    type="email"
                    placeholder="Enter your email"
                    className="w-full p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-200 placeholder-slate-500 outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 focus:bg-slate-800/80 transition-all duration-300 hover:bg-slate-800/70 hover:border-slate-600/50"
                    {...register("email", { required: { value: true, message: "Email is required" } })}
                />
                {errors.email && (
                    <motion.p 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-400 text-sm mt-1"
                    >
                        {errors.email.message}
                    </motion.p>
                )}
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <label className="block mb-2 text-sm font-medium text-slate-300">Password</label>
                <input
                    type="password"
                    placeholder="Enter your password"
                    className="w-full p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-200 placeholder-slate-500 outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 focus:bg-slate-800/80 transition-all duration-300 hover:bg-slate-800/70 hover:border-slate-600/50"
                    {...register("password", {
                        required: { value: true, message: "Password is required" },
                        minLength: { value: 6, message: "Password must be at least 6 characters" }
                    })}
                />
                {errors.password && (
                    <motion.p 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-400 text-sm mt-1"
                    >
                        {errors.password.message}
                    </motion.p>
                )}
            </motion.div>

            <motion.div 
                className="text-right"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
            >
                <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-purple-400 hover:text-purple-300 font-medium transition-colors duration-200"
                >
                    Forgot Password?
                </button>
            </motion.div>

            <motion.button
                disabled={isSubmitting}
                type="submit"
                className="relative w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold overflow-hidden shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                whileHover={!isSubmitting ? { scale: 1.02, boxShadow: "0 20px 40px -12px rgba(168, 85, 247, 0.5)" } : {}}
                whileTap={!isSubmitting ? { scale: 0.98 } : {}}
            >
                <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600"
                    initial={{ x: "100%" }}
                    whileHover={!isSubmitting ? { x: 0 } : {}}
                    transition={{ duration: 0.3 }}
                />
                <span className="relative z-10">
                    {isSubmitting ? "Signing In..." : "Sign In"}
                </span>
            </motion.button>
        </form>
    );
};

export default Login;