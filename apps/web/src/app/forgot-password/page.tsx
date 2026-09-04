"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Mail, ArrowLeft, ArrowRight, KeyRound, AlertCircle, Loader2, CheckCircle2, RefreshCw } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { forgotPasswordOtp, resendOtp } = useAuth();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentSuccess, setSentSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await forgotPasswordOtp(email.trim());
      sessionStorage.setItem("devflow_reset_email", email.trim());
      setSentSuccess(true);
    } catch (err: any) {
      setError(err?.message || "Failed to send reset instructions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resending || !email.trim()) return;
    setResending(true);
    setError(null);
    try {
      await resendOtp({
        email: email.trim(),
        purpose: "PASSWORD_RESET",
      });
    } catch (err: any) {
      setError(err?.message || "Failed to resend reset link. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-indigo-500 selection:text-white">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/25">
            DF
          </div>
          <span className="text-2xl font-extrabold text-white tracking-tight">DevFlow</span>
        </div>
      </div>

      <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-900/80 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-2xl border border-slate-800/80 sm:px-10">
          {sentSuccess ? (
            <div className="text-center py-2">
              <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/10 animate-in fade-in zoom-in-95">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Reset Link Sent!</h2>
              <p className="text-xs text-slate-400 mb-2">
                We have sent password reset instructions to:
              </p>
              <div className="inline-block px-3.5 py-1.5 rounded-full bg-slate-950/80 border border-slate-700/80 text-indigo-300 font-semibold text-xs mb-4">
                {email}
              </div>
              <p className="text-xs text-slate-400 mb-6 max-w-xs mx-auto">
                Please check your inbox (and spam folder) to proceed with resetting your password.
              </p>

              <div className="space-y-3">
                <Link
                  href="/login"
                  className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2"
                >
                  <span>Back to Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <button
                  type="button"
                  disabled={resending}
                  onClick={handleResend}
                  className="w-full py-2.5 px-4 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white font-medium rounded-xl text-xs border border-slate-700/60 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${resending ? "animate-spin" : ""}`} />
                  <span>{resending ? "Resending Code..." : "Resend Verification Code"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSentSuccess(false)}
                  className="text-xs text-slate-400 hover:text-indigo-400 transition-colors pt-2 block mx-auto"
                >
                  Use a different email address
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-white">Reset Account Password</h2>
                <p className="mt-1.5 text-xs text-slate-400">
                  Enter your email address and we&apos;ll send you a 6-digit OTP to reset your password.
                </p>
              </div>

              {error && (
                <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Registered Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex@company.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-700/70 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending Reset Code...
                    </>
                  ) : (
                    <>
                      Send 6-Digit Reset Code
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center justify-center">
            <Link
              href="/login"
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
