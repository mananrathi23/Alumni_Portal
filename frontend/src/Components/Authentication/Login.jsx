import React, { useState ,useContext} from "react";
import { useForm } from "react-hook-form";
import ForgotPassword from "./ForgotPassword";
import { Context } from "../../main";
import { useNavigate, Navigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";


const Login = () => {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
    const [showForgotPassword, setShowForgotPassword] = useState(false);

    const { setIsAuthenticated, setUser } = useContext(Context);
    const navigateTo = useNavigate();

    const handleLogin = async (data) => {
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
                toast.error(error.response.data.message);
            });
    };

    if (showForgotPassword) {
        return <ForgotPassword onBack={() => setShowForgotPassword(false)} />;
    }

    return (
        <form onSubmit={handleSubmit((data)=>handleLogin(data))} className="w-full space-y-4">
            <div>
                <label className="block mb-1 text-sm font-medium">Email</label>
                <input
                    type="email"
                    placeholder="Enter your email"
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

            <div className="text-right">
                <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-purple-600 hover:text-purple-800 font-medium"
                >
                    Forgot Password?
                </button>
            </div>

            <button
                disabled={isSubmitting}
                type="submit"
                className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-500 via-purple-600 to-pink-500 text-white hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isSubmitting ? "Signing In..." : "Sign In"}
            </button>
        </form>
    );
};

export default Login;