import React, { useState, useEffect } from "react";
import { PiGraduationCap, PiUsersThree, PiBriefcase, PiHandshake, PiCalendarCheck } from "react-icons/pi";
import { NavLink } from "react-router-dom";

const MainPage = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const features = [
    {
      icon: <PiHandshake className="text-3xl" />,
      title: "Find a Mentor",
      desc: "Get paired with seasoned professionals who guide your career with real-world insight.",
    },
    {
      icon: <PiUsersThree className="text-3xl" />,
      title: "Grow Your Network",
      desc: "Connect with thousands of alumni across industries, cohorts, and continents.",
    },
    {
      icon: <PiBriefcase className="text-3xl" />,
      title: "Career Opportunities",
      desc: "Explore exclusive job listings posted by alumni and partner employers.",
    },
    {
      icon: <PiCalendarCheck className="text-3xl" />,
      title: "Events & Reunions",
      desc: "Stay engaged through alumni meetups, webinars, and annual reunions.",
    },
  ];

  const stats = [
    { value: "10,000+", label: "Alumni Members" },
    { value: "500+", label: "Active Mentors" },
    { value: "1,200+", label: "Job Listings" },
    { value: "40+", label: "Countries" },
  ];

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>

      {/* ── NAVBAR ── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-slate-900 shadow-lg" : "bg-slate-900/60 backdrop-blur-md"
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="bg-sky-500 p-2 rounded-lg flex items-center justify-center">
                <PiGraduationCap className="text-white text-xl" />
              </div>
              <div className="hidden sm:block">
                <p className="text-white font-bold text-sm tracking-wider">ALUMNI PORTAL</p>
                <p className="text-slate-400 text-xs tracking-widest uppercase">Student Network</p>
              </div>
              <p className="sm:hidden text-white font-bold text-sm tracking-wider">ALUMNI PORTAL</p>
            </div>

            {/* Desktop CTA */}
            <div className="hidden sm:block">
              <NavLink
                to="/login"
                className="bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold tracking-widest uppercase px-6 py-2.5 rounded transition-all duration-200 shadow-md hover:shadow-sky-500/40 hover:-translate-y-0.5"
              >
                Get Started
              </NavLink>
            </div>

            {/* Mobile hamburger */}
            <button
              className="sm:hidden text-white p-2 flex flex-col justify-center gap-1"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <span className={`block w-5 h-0.5 bg-white transition-all duration-200 ${menuOpen ? "rotate-45 translate-y-1.5" : ""}`} />
              <span className={`block w-5 h-0.5 bg-white transition-all duration-200 ${menuOpen ? "opacity-0" : ""}`} />
              <span className={`block w-5 h-0.5 bg-white transition-all duration-200 ${menuOpen ? "-rotate-45 -translate-y-1.5" : ""}`} />
            </button>
          </div>

          {/* Mobile dropdown */}
          {menuOpen && (
            <div className="sm:hidden pb-4 border-t border-white/10 pt-4">
              <NavLink
                to="/login"
                className="block bg-sky-500 hover:bg-sky-400 text-white text-center text-xs font-bold tracking-widest uppercase px-6 py-3 rounded transition-colors duration-200"
                onClick={() => setMenuOpen(false)}
              >
                Get Started
              </NavLink>
            </div>
          )}
        </div>
      </nav>

      {/* ── HERO ── */}
      <header
        className="relative overflow-hidden flex items-center pt-16"
        style={{
          minHeight: "100svh",
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 45%, #0c4a6e 100%)",
        }}
      >
        {/* Glow blobs */}
        <div
          className="absolute top-1/4 right-0 w-64 h-64 sm:w-96 sm:h-96 rounded-full opacity-20 pointer-events-none"
          style={{ background: "radial-gradient(circle, #0ea5e9 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-16 left-0 w-56 h-56 sm:w-72 sm:h-72 rounded-full opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(circle, #38bdf8 0%, transparent 70%)" }}
        />

        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* Bottom fade into page */}
        <div
          className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, transparent, #f1f5f9)" }}
        />

        {/* Hero text */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32 w-full">
          <div className="max-w-2xl">

            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 border border-sky-400/30 bg-sky-500/10">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
              <span className="text-sky-300 text-xs font-medium tracking-widest uppercase">
                Official Alumni Network
              </span>
            </div>

            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6"
              style={{ letterSpacing: "-0.02em" }}
            >
              Connect.{" "}
              <span className="text-sky-400">Grow.</span>
              <br className="hidden sm:block" />
              {" "}Thrive Together.
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed mb-10 max-w-lg">
              Connect with alumni, find mentors, discover career opportunities,
              and grow your professional network — all in one place.
            </p>

            <NavLink
              to="/login"
              className="inline-block bg-sky-500 hover:bg-sky-400 text-white font-bold text-sm tracking-widest uppercase px-8 py-4 rounded shadow-lg transition-all duration-200 hover:-translate-y-1 hover:shadow-sky-500/40"
            >
              Get Started →
            </NavLink>
          </div>
        </div>
      </header>

      {/* ── STATS BAR ── */}
      <div className="bg-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-white/10">
            {stats.map((s, i) => (
              <div key={i} className="px-4 sm:px-6 py-6 sm:py-8 text-center">
                <p className="text-2xl sm:text-3xl font-extrabold text-sky-400 leading-none">{s.value}</p>
                <p className="text-xs text-slate-500 tracking-widest uppercase mt-2">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FEATURES ── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">

        {/* Section header */}
        <div className="text-center mb-12 sm:mb-16">
          <p className="text-xs font-semibold text-sky-500 tracking-widest uppercase mb-3">
            What We Offer
          </p>
          <h2
            className="text-2xl sm:text-3xl font-bold text-slate-800"
            style={{ letterSpacing: "-0.02em" }}
          >
            Everything you need to succeed
          </h2>
          <div className="w-12 h-1 bg-sky-500 rounded mx-auto mt-4" />
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {features.map((f, i) => (
            <div
              key={i}
              className="bg-white rounded-lg p-6 sm:p-7 border-t-4 border-transparent hover:border-sky-500 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1 group cursor-default"
            >
              <div className="text-sky-500 mb-4 group-hover:scale-110 transition-transform duration-200 inline-block">
                {f.icon}
              </div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-2">{f.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Stats placeholder */}
        <div className="mt-10 sm:mt-14 bg-white rounded-lg p-6 sm:p-10 border border-slate-100 shadow-sm">
          <p className="text-slate-400 text-sm text-center tracking-wide">Stats Section will go here…</p>
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer className="bg-slate-900 text-slate-500 text-center py-5 text-xs tracking-widest uppercase">
        © 2026 Alumni Portal — All Rights Reserved
      </footer>

    </div>
  );
};

export default MainPage;
