import React from "react";
import { PiStudent, PiUsers, PiGraduationCap, PiBriefcase } from "react-icons/pi";
import { NavLink } from "react-router-dom";

const MainPage = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">

            <header className="bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 text-white shadow-2xl animate-fade-in">

                <div className="max-w-6xl mx-auto px-6 py-12 md:py-16">

                    <div className="flex items-center gap-4 mb-6 animate-slide-in-left">
                        <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm hover:scale-110 transition-transform duration-300">
                            <PiStudent className="text-3xl" />
                        </div>

                        <h1 className="text-2xl md:text-3xl font-bold">
                            Alumni Student Portal
                        </h1>
                    </div>

                    <p className="text-lg md:text-xl text-white/90 max-w-2xl leading-relaxed animate-slide-in-right">
                        Connect with alumni, find mentors, discover career opportunities,
                        and grow your professional network.
                    </p>

                    <NavLink to='/login' className="inline-block mt-8 bg-white text-purple-700 font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-2xl hover:scale-110 transition-all duration-300 w-full md:w-auto text-center animate-bounce-in">
                        Get Started
                    </NavLink>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 animate-fade-in-up">
                        <PiUsers className="text-4xl text-purple-600 mb-4" />
                        <h3 className="text-xl font-semibold mb-2">Network</h3>
                        <p className="text-gray-600">Connect with 500+ alumni worldwide</p>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
                        <PiGraduationCap className="text-4xl text-pink-600 mb-4" />
                        <h3 className="text-xl font-semibold mb-2">Mentorship</h3>
                        <p className="text-gray-600">Get guidance from industry experts</p>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 animate-fade-in-up" style={{animationDelay: '0.4s'}}>
                        <PiBriefcase className="text-4xl text-indigo-600 mb-4" />
                        <h3 className="text-xl font-semibold mb-2">Opportunities</h3>
                        <p className="text-gray-600">Discover internships and job openings</p>
                    </div>
                </div>
            </main>

            <footer className="text-center text-gray-400 py-6">
                © 2026 Alumni Portal
            </footer>
        </div>
    );
};

export default MainPage;
