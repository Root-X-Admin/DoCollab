import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRightIcon, PlayCircleIcon } from "@heroicons/react/24/outline";
import api from "../lib/api";

const tags = [
  "YouTube Educators",
  "Instagram Artists",
  "Fitness Coaches",
  "Gaming Streamers",
  "Podcasters",
];

function LandingPage() {
  const navigate = useNavigate();
  const [checkingSession, setCheckingSession] = useState(true);

  // 🔐 If user already logged in, redirect from "/" to "/app/discover"
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await api.get("/auth/me");
        if (res.data && res.data.email) {
          navigate("/app/discover");
          return;
        }
      } catch (err) {
        // 401 / not authenticated → just show normal landing
      } finally {
        setCheckingSession(false);
      }
    };

    checkSession();
  }, [navigate]);

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-black text-slate-100">
        <div className="text-sm text-slate-400">Checking your session...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-slate-100">
      {/* Top nav */}
      <header className="flex items-center justify-between px-6 md:px-10 py-4 border-b border-white/5 backdrop-blur">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-brand-500/20 border border-brand-500/50 flex items-center justify-center">
            <span className="text-xs font-semibold tracking-tight text-brand-100">
              DC
            </span>
          </div>
          <span className="font-semibold tracking-tight text-sm md:text-base">
            DoCollab
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="text-xs md:text-sm text-slate-300 hover:text-white transition"
          >
            Log in
          </Link>
          <Link
            to="/register"
            className="text-xs md:text-sm px-4 py-2 rounded-full bg-brand-500 hover:bg-brand-600 text-white font-medium shadow-lg shadow-brand-500/30 transition"
          >
            Join as Creator
          </Link>
        </div>
      </header>

      {/* Hero section */}
      <main className="px-6 md:px-10 py-10 md:py-16">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-16 items-center">
          {/* Left: text */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <p className="text-[10px] md:text-xs uppercase tracking-[0.25em] text-slate-400 mb-4">
              Creator-to-Creator Matchmaking Network
            </p>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-white mb-4">
              Collaborate{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-emerald-400">
                smarter
              </span>
              , not harder.
            </h1>

            <p className="text-sm md:text-base text-slate-300 mb-6 md:mb-8 max-w-xl">
              DoCollab matches you with verified creators in your niche based on
              audience, platform, and goals—so you can skip the cold DMs and
              get straight to meaningful collaborations.
            </p>

            <div className="flex flex-wrap items-center gap-3 mb-8">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand-500 hover:bg-brand-600 text-sm font-medium shadow-xl shadow-brand-500/40 transition"
              >
                Get started free
                <ArrowRightIcon className="w-4 h-4" />
              </Link>

              <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 text-xs md:text-sm text-slate-200 transition">
                <PlayCircleIcon className="w-5 h-5" />
                See how it works
              </button>

              <p className="w-full text-[11px] text-slate-500 mt-1">
                No brands. No agencies. Just creators helping creators grow.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Right: animated card cluster */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
            className="relative"
          >
            {/* Glow circles */}
            <div className="pointer-events-none absolute -top-6 -left-6 h-32 w-32 rounded-full bg-brand-500/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-8 -right-6 h-40 w-40 rounded-full bg-emerald-500/30 blur-3xl" />

            <div className="relative grid gap-4">
              {/* Main “match” card */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="rounded-3xl bg-white/5 border border-white/10 p-5 backdrop-blur-xl shadow-2xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-medium text-slate-300">
                    Smart Match • 92% fit
                  </span>
                  <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                    Verified
                  </span>
                </div>

                <div className="flex gap-4 items-center mb-4">
                  <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-brand-400 to-emerald-400 flex items-center justify-center text-xs font-semibold">
                    AY
                  </div>
                  <div>
                    <p className="text-sm font-medium">TechWithAyush</p>
                    <p className="text-[11px] text-slate-400">
                      YouTube • Dev & Cybersecurity
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl bg-black/40 border border-white/10 px-4 py-3 mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-slate-400 mb-1">
                      Suggested collaboration
                    </p>
                    <p className="text-xs text-slate-100">
                      3-part YouTube series + IG reels cross-promo
                    </p>
                  </div>
                  <button className="text-[11px] px-3 py-1 rounded-full bg-brand-500/80 hover:bg-brand-600 text-white font-medium transition">
                    View brief
                  </button>
                </div>

                <div className="flex justify-between text-[11px] text-slate-400">
                  <p>Audience: 10k–50k • EN</p>
                  <p>Trust score: 4.8/5</p>
                </div>
              </motion.div>

              {/* Floating smaller cards */}
              <motion.div
                initial={{ y: 16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.35, duration: 0.5 }}
                className="flex gap-3"
              >
                <div className="flex-1 rounded-2xl bg-white/5 border border-white/10 p-3">
                  <p className="text-[11px] text-slate-400 mb-1">
                    Live now
                  </p>
                  <p className="text-xs text-slate-100 mb-2">
                    37 creators are looking for collabs in{" "}
                    <span className="text-brand-300">Cybersecurity</span>
                  </p>
                  <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full w-2/3 bg-gradient-to-r from-brand-400 to-emerald-400" />
                  </div>
                </div>
                <div className="w-28 rounded-2xl bg-white/5 border border-white/10 p-3 text-[11px]">
                  <p className="text-slate-400 mb-1">Avg. reply time</p>
                  <p className="text-slate-100 font-medium">under 24h</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

export default LandingPage;
