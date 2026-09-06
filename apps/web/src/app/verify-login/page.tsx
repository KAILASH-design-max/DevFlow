"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getSafeRedirectUrl } from "@/lib/security";
import { OtpInputGroup } from "@/components/OtpInputGroup";
import { ShieldCheck, ArrowLeft, RefreshCw, AlertCircle, CheckCircle2, Loader2, MailCheck } from "lucide-react";
import toast from "react-hot-toast";

function VerifyLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verifyLoginOtp, resendOtp } = useAuth();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [expiresIn, setExpiresIn] = useState(300);
  const [resendCooldown, setResendCooldown] = useState(60);

  useEffect(() => {
    const queryEmail = searchParams.get("email");
    if (queryEmail) {
      setEmail(queryEmail);
    } else {
      const stored = sessionStorage.getItem("devflow_auth_email");
      if (stored) setEmail(stored);
    }
  }, [searchParams]);

  useEffect(() => {
    const timer = setInterval(() => {
      setExpiresIn((prev) => (prev > 0 ? prev - 1 : 0));
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const redirectUrl = getSafeRedirectUrl(searchParams.get("redirect"));

  const handleVerify = async (submittedCode?: string) => {
    const codeToVerify = submittedCode || code;
    if (!codeToVerify || codeToVerify.length !== 6) {
      setError("Please enter the complete 6-digit sign-in code.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await verifyLoginOtp(email, codeToVerify);
      setSuccess(true);
      toast.success("Sign in verified! Redirecting...");
      sessionStorage.removeItem("devflow_auth_email");
      router.replace(redirectUrl);
    } catch (err: any) {
      setError(err?.message || "Invalid or expired sign-in code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (val: string) => {
    setCode(val);
    if (error) setError(null);
    if (val.length === 6) {
      handleVerify(val);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resending) return;

    setResending(true);
    setError(null);

    try {
      await resendOtp({
        email,
        purpose: "LOGIN",
      });

      toast.success("A fresh 6-digit sign-in code has been sent to your email!");
      setResendCooldown(60);
      setExpiresIn(300);
      setCode("");
    } catch (err: any) {
      setError(err?.message || "Failed to resend sign-in code. Please try again.");
    } finally {
      setResending(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
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
          <div className="text-center mb-5">
            <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white">Sign In Verification</h2>
            <p className="mt-1.5 text-xs text-slate-400">
              Enter the 6-digit sign-in code sent to:
            </p>
            <p className="text-sm font-semibold text-indigo-300 mt-0.5 break-all">
              {email || "your email address"}
            </p>
          </div>

          {/* Prominent sent confirmation banner */}
          <div className="mb-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2.5">
            <MailCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>We've sent a 6-digit sign-in code to your email. Check your inbox and spam folder.</span>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Authentication successful! Accessing workspace...</span>
            </div>
          )}

          <div className="my-6">
            <OtpInputGroup
              value={code}
              onChange={handleCodeChange}
              disabled={loading || success}
              hasError={Boolean(error)}
              autoFocus
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 mb-6 px-1">
            <span>
              Expires in:{" "}
              <strong className={expiresIn < 60 ? "text-amber-400" : "text-slate-300"}>
                {formatTime(expiresIn)}
              </strong>
            </span>
            {expiresIn === 0 && (
              <span className="text-red-400 font-semibold">Code expired</span>
            )}
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => handleVerify()}
              disabled={loading || code.length !== 6 || success}
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying Code...
                </>
              ) : (
                "Verify & Sign In"
              )}
            </button>

            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0 || resending || success}
              className="w-full py-2.5 px-4 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-medium border border-slate-700/60 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resending ? "animate-spin" : ""}`} />
              {resendCooldown > 0
                ? `Resend code in ${resendCooldown}s`
                : resending
                ? "Sending code..."
                : "Resend Code"}
            </button>
          </div>

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

export default function VerifyLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      }
    >
      <VerifyLoginForm />
    </Suspense>
  );
}
