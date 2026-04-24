import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { PiGraduationCap, PiUsersThree, PiBriefcase, PiHandshake, PiCalendarCheck, PiSpeakerHigh } from "react-icons/pi";
import { NavLink } from "react-router-dom";
import ThemeToggle from "./ThemeToggle.jsx";
import { Context } from "../main.jsx";

// ── NEWS TICKER ──────────────────────────────────────────────────────────────
// Alternating colours for news items (red → green → amber → sky → repeat)
const NEWS_COLORS = ["#f87171", "#34d399", "#fbbf24", "#38bdf8"];

const NewsTicker = () => {
  const [news, setNews] = useState([]);

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:4000"}/api/v1/news`)
      .then((res) => setNews(res.data.news || []))
      .catch(() => setNews([]));
  }, []);

  if (!news.length) return null;

  // Build array of formatted items
  const items = news.map((n) => {
    const desc = n.description?.trim();
    return desc
      ? `${n.title} (${desc.slice(0, 100)}${desc.length > 100 ? "…" : ""})`
      : n.title;
  });

  // Render coloured spans — repeat 4× for seamless loop
  const renderItems = (keyOffset = 0) =>
    items.map((text, i) => (
      <span key={`${keyOffset}-${i}`} className="inline-flex items-center gap-2">
        <span
          style={{ color: NEWS_COLORS[i % NEWS_COLORS.length] }}
          className="font-semibold"
        >
          {text}
        </span>
        <span className="text-slate-500 mx-2">•</span>
      </span>
    ));

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] h-9 flex items-center overflow-hidden"
      style={{ background: "linear-gradient(90deg, #0f172a 0%, #0c1a2e 100%)", borderBottom: "1px solid rgba(56,189,248,0.15)" }}>
      {/* Label */}
      <div className="flex-shrink-0 flex items-center gap-2 px-4 h-full border-r border-sky-500/30"
        style={{ background: "rgba(14,165,233,0.12)" }}>
        <PiSpeakerHigh className="text-sky-400" size={14} />
        <span className="text-sky-400 text-[10px] font-bold tracking-widest uppercase whitespace-nowrap">News</span>
      </div>

      {/* Scrolling strip — full remaining width */}
      <div className="flex-1 overflow-hidden">
        <div
          className="flex whitespace-nowrap items-center text-sm"
          style={{ animation: "news-ticker 55s linear infinite" }}
        >
          <span className="px-6">{renderItems(0)}</span>
          <span className="px-6">{renderItems(1)}</span>
          <span className="px-6">{renderItems(2)}</span>
          <span className="px-6">{renderItems(3)}</span>
        </div>
      </div>
      <style>{`
        @keyframes news-ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-25%); }
        }
      `}</style>
    </div>
  );
};

// ── MAIN PAGE ────────────────────────────────────────────────────────────────
const MainPage = () => {
  const [scrolled, setScrolled] = useState(false);
  const { theme } = useContext(Context);
  const [menuOpen, setMenuOpen] = useState(false);
  const [news, setNews] = useState([]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:4000"}/api/v1/news`)
      .then((res) => setNews(res.data.news || []))
      .catch(() => {});
  }, []);

  const features = [
    { icon: <PiHandshake className="text-3xl" />, title: "Find a Mentor", desc: "Get paired with seasoned professionals who guide your career with real-world insight." },
    { icon: <PiUsersThree className="text-3xl" />, title: "Grow Your Network", desc: "Connect with thousands of alumni across industries, cohorts, and continents." },
    { icon: <PiBriefcase className="text-3xl" />, title: "Career Opportunities", desc: "Explore exclusive job listings posted by alumni and partner employers." },
    { icon: <PiCalendarCheck className="text-3xl" />, title: "Events & Reunions", desc: "Stay engaged through alumni meetups, webinars, and annual reunions." },
  ];

  const stats = [
    { value: "10,000+", label: "Alumni Members" },
    { value: "500+",    label: "Active Mentors" },
    { value: "1,200+", label: "Job Listings" },
    { value: "40+",    label: "Countries" },
  ];

  const hasNews = news.length > 0;

  return (
    <div
      className={`min-h-screen ${theme === "dark" ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-950"}`}
      style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}
    >
      <NewsTicker />

      {/* ── NAVBAR ── */}
      <nav
        className={`fixed ${hasNews ? "top-9" : "top-0"} left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? theme === "dark"
              ? "bg-slate-950 shadow-2xl shadow-slate-950/30"
              : "bg-white shadow-lg shadow-slate-900/10"
            : theme === "dark"
              ? "bg-slate-950/95 backdrop-blur-md"
              : "bg-white/85 backdrop-blur-md"
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-sky-500 p-2 rounded-lg flex items-center justify-center">
                <PiGraduationCap className="text-white text-xl" />
              </div>
              <div className="hidden sm:block">
                <p className="text-white font-bold text-sm tracking-wider">
                  ALUMNI PORTAL
                </p>
                <p className="text-slate-400 text-xs tracking-widest uppercase">
                  Student Network
                </p>
              </div>
              <p className="sm:hidden text-white font-bold text-sm tracking-wider">
                ALUMNI PORTAL
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <ThemeToggle />
              <NavLink
                to="/login"
                className="bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold tracking-widest uppercase px-6 py-2.5 rounded transition-all duration-200 shadow-md hover:shadow-sky-500/40 hover:-translate-y-0.5"
              >
                Get Started
              </NavLink>
            </div>
            <button
              className="sm:hidden text-white p-2 flex flex-col justify-center gap-1"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <span
                className={`block w-5 h-0.5 bg-white transition-all duration-200 ${menuOpen ? "rotate-45 translate-y-1.5" : ""}`}
              />
              <span
                className={`block w-5 h-0.5 bg-white transition-all duration-200 ${menuOpen ? "opacity-0" : ""}`}
              />
              <span
                className={`block w-5 h-0.5 bg-white transition-all duration-200 ${menuOpen ? "-rotate-45 -translate-y-1.5" : ""}`}
              />
            </button>
          </div>
          {menuOpen && (
            <div className="sm:hidden pb-4 border-t border-white/10 pt-4">
              <NavLink
                to="/login"
                className="block bg-sky-500 hover:bg-sky-400 text-white text-center text-xs font-bold tracking-widest uppercase px-6 py-3 rounded"
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
        className="relative overflow-hidden flex items-center"
        style={{
          minHeight: "100svh",
          paddingTop: hasNews ? "6.25rem" : "4rem",
          background:
            theme === "dark"
              ? "linear-gradient(135deg, #020617 0%, #0c172a 45%, #112d45 100%)"
              : "linear-gradient(135deg, #eff6ff 0%, #dbeafe 45%, #bae6fd 100%)",
        }}
      >
        <div
          className="absolute top-1/4 right-0 w-64 h-64 sm:w-96 sm:h-96 rounded-full opacity-20 pointer-events-none"
          style={{
            background: "radial-gradient(circle, #0ea5e9 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-16 left-0 w-56 h-56 sm:w-72 sm:h-72 rounded-full opacity-10 pointer-events-none"
          style={{
            background: "radial-gradient(circle, #38bdf8 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
          style={{
            background:
              theme === "dark"
                ? "linear-gradient(to bottom, transparent, rgba(15,23,42,0.16))"
                : "linear-gradient(to bottom, transparent, #f1f5f9)",
          }}
        />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32 w-full">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 border border-sky-400/30 bg-sky-500/10 text-slate-100">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
              <span
                className={`${theme === "dark" ? "text-white" : "text-black"} text-xs font-medium tracking-widest uppercase`}
              >
                Official Alumni Network
              </span>
            </div>
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6"
              style={{ letterSpacing: "-0.02em" }}
            >
              <span
                className={theme === "dark" ? "text-white" : "text-slate-950"}
              >
                Connect.
              </span>{" "}
              <span className="text-sky-400">Grow.</span>
              <br className="hidden sm:block" />{" "}
              <span
                className={
                  theme === "dark" ? "text-slate-100" : "text-slate-950"
                }
              >
                Thrive Together.
              </span>
            </h1>
            <p
              className={`${theme === "dark" ? "text-slate-300" : "text-slate-700"} text-base sm:text-lg leading-relaxed mb-10 max-w-lg`}
            >
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
      <div
        className={
          theme === "dark"
            ? "bg-slate-900"
            : "bg-white shadow-inner shadow-slate-200/80"
        }
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-200/70 dark:divide-white/10">
            {stats.map((s, i) => (
              <div key={i} className="px-4 sm:px-6 py-6 sm:py-8 text-center">
                <p className="text-2xl sm:text-3xl font-extrabold text-sky-400 leading-none">
                  {s.value}
                </p>
                <p className="text-xs text-slate-500 tracking-widest uppercase mt-2">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── ANNOUNCEMENTS SECTION (if news exists) ── */}
      {hasNews && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="mb-6">
            <p className="text-xs font-semibold text-sky-500 tracking-widest uppercase mb-1">
              Announcements
            </p>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              Latest News
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {news.slice(0, 6).map((n) => (
              <div
                key={n._id}
                className="bg-white dark:bg-slate-900 rounded-lg p-5 border border-slate-100 dark:border-white/[0.08] shadow-sm dark:shadow-none hover:shadow-md transition-shadow"
              >
                <p className="text-xs text-sky-500 font-semibold tracking-widest uppercase mb-2">
                  {new Date(n.date).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-2 leading-snug">
                  {n.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">
                  {n.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── FEATURES ── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {features.map((f, i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 rounded-lg p-6 sm:p-7 border-t-4 border-transparent hover:border-sky-500 shadow-sm dark:shadow-none hover:shadow-md transition-all duration-200 hover:-translate-y-1 group cursor-default"
            >
              <div className="text-sky-500 mb-4 group-hover:scale-110 transition-transform duration-200 inline-block">
                {f.icon}
              </div>
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-widest mb-2">
                {f.title}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </main>

      <footer
        className={
          theme === "dark"
            ? "bg-slate-900 text-slate-500"
            : "bg-slate-100 text-slate-600" +
              " text-center py-5 text-xs tracking-widest uppercase"
        }
      >
        © 2026 Alumni Portal — All Rights Reserved
      </footer>
    </div>
  );
};

export default MainPage;
