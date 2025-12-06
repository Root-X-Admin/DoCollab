import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../lib/api";
import GoogleAuthButton from "../../components/GoogleAuthButton";

const TOKEN_KEY = "docollab_token";

function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState("");

  // 🔐 If user already logged in (JWT exists), redirect to dashboard
  useEffect(() => {
    setCheckingSession(false);
  }, []);


  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/login", form);
      const { token } = res.data || {};
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      }
      navigate("/app/discover");
    } catch (err) {
      setError(
        err.response?.data?.message || "Invalid credentials. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-black px-4">
        <div className="text-sm text-slate-400">
          Checking your session...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-black px-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-2xl text-slate-100">
        <div className="mb-6">
          <Link
            to="/"
            className="text-xs text-slate-400 hover:text-slate-200 inline-flex items-center gap-2"
          >
            ← Back to home
          </Link>
          <h1 className="mt-3 text-2xl font-semibold text-white">
            Welcome back
          </h1>
          <p className="text-sm text-slate-400">
            Log in to access your creator matches and collaborations.
          </p>
        </div>

        {error && (
          <div className="mb-4 text-xs text-red-300 bg-red-500/10 border border-red-500/40 rounded-xl px-3 py-2">
            {error}
          </div>
        )}

        <form className="space-y-4 mb-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs text-slate-300 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 text-sm text-slate-100 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs text-slate-300 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 text-sm text-slate-100 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              placeholder="••••••••"
              required
            />
            <div className="mt-1 text-[11px] text-right">
              <Link
                to="/forgot-password"
                className="text-brand-300 hover:text-brand-200"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-sm font-medium text-white py-2.5 transition shadow-lg shadow-brand-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <div className="flex items-center gap-2 my-3">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-[10px] text-slate-500 uppercase tracking-[0.2em]">
            or
          </span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <GoogleAuthButton
          mode="login"
          onSuccess={() => navigate("/app/discover")}
          onError={(msg) => setError(msg)}
        />

        <p className="mt-4 text-xs text-slate-400 text-center">
          New to DoCollab?{" "}
          <Link
            to="/register"
            className="text-brand-300 hover:text-brand-200 font-medium"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
