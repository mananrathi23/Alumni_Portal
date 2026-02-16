import React from "react";
import { PiStudent } from "react-icons/pi";
import { NavLink } from "react-router-dom";

const MainPage = () => {
    return (
        <div className="min-h-screen bg-gray-50">

            <header className="bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 text-white shadow-xl">

                <div className="max-w-6xl mx-auto px-6 py-12 md:py-16">

                    <div className="flex items-center gap-4 mb-6">
                        <div className="bg-white/20 p-3 rounded-xl">
                            <PiStudent className="text-3xl" />
                        </div>

                        <h1 className="text-2xl md:text-3xl font-bold">
                            Alumni Student Portal
                        </h1>
                    </div>

                    <p className="text-lg md:text-xl text-white/90 max-w-2xl leading-relaxed">
                        Connect with alumni, find mentors, discover career opportunities,
                        and grow your professional network.
                    </p>

                    <NavLink to='/login' className="inline-block mt-8 bg-white text-purple-700 font-semibold px-6 py-3 rounded-xl shadow-md hover:shadow-lg hover:scale-110 transition duration-200">
                        Get Started
                    </NavLink>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-10">
                <p className="text-gray-500">Stats Section will go here…</p>
            </main>

            <footer className="text-center text-gray-400 py-6">
                © 2026 Alumni Portal
            </footer>
        </div>
    );
};

export default MainPage;
