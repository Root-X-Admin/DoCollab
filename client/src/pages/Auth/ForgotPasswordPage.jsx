import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../lib/api";

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await api.post("/auth/forgot-password", { email });
      setMessage(res.data.message || "OTP sent. Check your email.");
      setStep(2);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to send OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await api.post("/auth/reset-password", {
        email,
        otp,
        newPassword,
      });
      setMessage(res.data.message || "Password updated");

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to reset password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl bg-black/50 border border-white/10 shadow-2xl p-6 md:p-8 text-slate-100">
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-xl bg-brand-500/20 border border-brand-500/50 flex items-center justify-center">
              <span className="text-xs font-semibold tracking-tight text-brand-100">
                DC
              </span>
            </div>
            <span className="font-semibold tracking-tight text-sm">
              DoCollab
            </span>
          </Link>

          <h1 className="text-xl font-semibold mb-1">
            {step === 1 ? "Reset your password" : "Enter OTP & new password"}
          </h1>
          <p className="text-xs text-slate-400">
            {step === 1
              ? "We’ll send a 6-digit OTP to your registered email."
              : "Check your email for the OTP, then set a new password."}
          </p>
        </div>

        {error && (
          <div className="mb-3 text-[11px] text-red-300 bg-red-500/10 border border-red-500/40 rounded-xl px-3 py-2">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-3 text-[11px] text-emerald-300 bg-emerald-500/10 border border-emerald-500/40 rounded-xl px-3 py-2">
            {message}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs mb-1 text-slate-300">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl bg-black/60 border border-white/15 px-3 py-2 text-xs outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                placeholder="you@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 rounded-2xl bg-brand-500 hover:bg-brand-600 text-xs font-medium py-2.5 shadow-lg shadow-brand-500/40 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs mb-1 text-slate-300">
                Email address
              </label>
              <input
                type="email"
                disabled
                value={email}
                className="w-full rounded-2xl bg-black/40 border border-white/10 px-3 py-2 text-xs text-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs mb-1 text-slate-300">
                6-digit OTP
              </label>
              <input
                type="text"
                maxLength={6}
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full rounded-2xl bg-black/60 border border-white/15 px-3 py-2 text-xs outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 tracking-[0.3em]"
                placeholder="······"
              />
            </div>

            <div>
              <label className="block text-xs mb-1 text-slate-300">
                New password
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-2xl bg-black/60 border border-white/15 px-3 py-2 text-xs outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 rounded-2xl bg-brand-500 hover:bg-brand-600 text-xs font-medium py-2.5 shadow-lg shadow-brand-500/40 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Updating password..." : "Update password"}
            </button>
          </form>
        )}

        <div className="mt-4 text-[11px] text-slate-400 flex justify-between">
          <Link to="/login" className="hover:text-slate-200">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
