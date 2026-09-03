"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import {
  Layers,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  Kanban,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Globe,
} from "lucide-react";

function GoogleIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

function FeatureList() {
  const features = [
    {
      icon: <Sparkles className="w-5 h-5 text-indigo-600" />,
      title: "AI-Powered Issue Tracking",
      desc: "Smart automation, intelligent task breakdowns, and live collaboration.",
    },
    {
      icon: <Kanban className="w-5 h-5 text-blue-600" />,
      title: "Clean Kanban Boards",
      desc: "Visual workflow with smooth drag-and-drop and real-time status tracking.",
    },
    {
      icon: <Calendar className="w-5 h-5 text-emerald-600" />,
      title: "Sprint Management",
      desc: "Track velocity, burndown progress, and release targets effortlessly.",
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-violet-600" />,
      title: "Enterprise-Ready RBAC",
      desc: "Granular permissions for Admins, Project Managers, Developers, and Viewers.",
    },
  ];

  return (
    <div className="space-y-4">
      {features.map((feature, idx) => (
        <div
          key={idx}
          className="flex items-start gap-3.5 p-3.5 rounded-xl bg-white/80 border border-slate-200/80 shadow-2xs transition-all hover:bg-white"
        >
          <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 shrink-0">
            {feature.icon}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900">{feature.title}</h4>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{feature.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function MarketingPanel() {
  return (
    <aside className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-50/50 via-slate-50 to-white p-12 xl:p-16 flex-col justify-between border-r border-slate-200 relative overflow-hidden">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
          <Layers className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            DevFlow
          </span>
        </div>
      </div>

      {/* Main Pitch */}
      <div className="max-w-md my-auto py-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Next-Gen AI Issue Tracker</span>
        </div>

        <h2 className="text-3xl xl:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-3">
          Intelligent issue tracking for modern teams.
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed mb-6">
          Sign in seamlessly with Google or Email. Synchronize your teams, sprints, and tasks across devices in real time.
        </p>

        {/* Features List */}
        <FeatureList />
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-slate-200/60">
        <span>©2026 DevFlow India.</span>
        <div className="flex items-center gap-3">
          <Link href="/legal/privacy" className="hover:text-indigo-600 transition-colors">
            Privacy
          </Link>
          <Link href="/legal/terms" className="hover:text-indigo-600 transition-colors">
            Terms
          </Link>
        </div>
      </div>
    </aside>
  );
}

interface InputFieldProps {
  label: React.ReactNode;
  icon: React.ReactNode;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  rightIcon?: React.ReactNode;
  onRightClick?: () => void;
}

function InputField({
  label,
  icon,
  type,
  value,
  onChange,
  placeholder,
  required = true,
  disabled = false,
  rightIcon,
  onRightClick,
}: InputFieldProps) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          {icon}
        </div>
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className="block w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition disabled:opacity-50 text-sm"
        />
        {rightIcon && (
          <button
            type="button"
            onClick={onRightClick}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            {rightIcon}
          </button>
        )}
      </div>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const {
    user,
    loading: authLoading,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    resetPassword,
  } = useAuth();

  const [isSignup, setIsSignup] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Email form state
  const [fullName, setFullName] = useState("");
  const [workspaceUrl, setWorkspaceUrl] = useState("");
  const [role, setRole] = useState("DEVELOPER");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Redirect to dashboard if logged in
  useEffect(() => {
    if (!authLoading && user) {
      const defaultView = localStorage.getItem("preferredDefaultView");
      const targetRoute = defaultView === "kanban" ? "/dashboard/board" : "/dashboard";
      router.push(targetRoute);
    }
  }, [user, authLoading, router]);

  // Clean error when switching sign in/up/forgot password
  useEffect(() => {
    setError("");
    setSuccessMsg("");
  }, [isSignup, isForgotPassword]);

  // Handle Google Sign-in
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    try {
      await signInWithGoogle();
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Google Sign-In Error:", err);
      setError(err.message || "Failed to sign in with Google.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Email / Password Auth
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isSignup) {
        await signUpWithEmail(fullName || "DevFlow User", email, password, role, workspaceUrl);
        setSuccessMsg("Account created! Redirecting to dashboard...");
      } else {
        await signInWithEmail(email, password);
        setSuccessMsg("Signed in! Redirecting to dashboard...");
      }
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Email Auth Error:", err);
      const code = err.code;
      if (code === "auth/invalid-credential" || code === "auth/user-not-found" || code === "auth/wrong-password") {
        setError("Invalid email or password. If this is a new account, please click 'Sign up'.");
      } else if (code === "auth/email-already-in-use") {
        setError("This email is already registered. Please sign in instead.");
      } else if (code === "auth/weak-password") {
        setError("Password should be at least 6 characters.");
      } else {
        setError(err.message || "Authentication failed. Please check your credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Password Reset
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await resetPassword(email);
      setSuccessMsg("Password reset email sent! Check your inbox.");
      setIsForgotPassword(false);
    } catch (err: any) {
      console.error("Reset Password Error:", err);
      setError(err.message || "Failed to send reset email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 flex flex-col lg:flex-row antialiased">
      {/* Left Marketing Panel */}
      <MarketingPanel />

      {/* Right Authentication Panel */}
      <main className="w-full lg:w-1/2 min-h-screen flex items-center justify-center bg-slate-50 px-4 py-8 sm:px-8 lg:px-12">
        <div className="w-full max-w-md animate-fade-in">
          {/* Main Auth Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xl">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white lg:hidden">
                  <Layers className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {isForgotPassword
                    ? "Reset your password"
                    : isSignup
                    ? "Create an account"
                    : "Welcome back"}
                </h2>
              </div>
              <p className="text-slate-600 text-sm">
                {isForgotPassword
                  ? "Enter your email to receive a password reset link."
                  : isSignup
                  ? "Start managing issues with AI"
                  : "Sign in to access your DevFlow workspaces"}
              </p>
            </div>

            {!isForgotPassword && (
              <>
                {/* Google Sign-in Button */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-lg text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 shadow-2xs hover:shadow-xs transition-all disabled:opacity-50 cursor-pointer mb-5"
                >
                  <GoogleIcon className="w-5 h-5" />
                  <span>Continue with Google</span>
                </button>

                {/* Divider */}
                <div className="relative flex items-center justify-center mb-5">
                  <div className="border-t border-slate-200 w-full" />
                  <span className="bg-white px-3 text-xs uppercase tracking-wider text-slate-400 font-medium shrink-0">
                    Or continue with email
                  </span>
                  <div className="border-t border-slate-200 w-full" />
                </div>
              </>
            )}

            {/* Notifications / Alerts */}
            {error && (
              <div className="mb-4 p-3 rounded-lg text-xs bg-red-50 border border-red-200 text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3 rounded-lg text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* ── EMAIL / PASSWORD FORM ── */}
            {isForgotPassword ? (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <InputField
                  label="Email Address"
                  icon={<Mail className="w-4 h-4" />}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alice@devflow.io"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 flex justify-center items-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 shadow-sm transition-all disabled:opacity-75 cursor-pointer"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Send Reset Link"
                  )}
                </button>
                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => setIsForgotPassword(false)}
                    className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition cursor-pointer"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleEmailAuth} className="space-y-4">
                {isSignup ? (
                  <>
                    <InputField
                      label="Full Name"
                      icon={<User className="w-4 h-4" />}
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Jane Doe"
                      disabled={loading}
                      required={isSignup}
                    />

                    <InputField
                      label="Work Email"
                      icon={<Mail className="w-4 h-4" />}
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jane@company.com"
                      disabled={loading}
                    />

                    <InputField
                      label="Password"
                      icon={<Lock className="w-4 h-4" />}
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      rightIcon={showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      onRightClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                    />

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Workspace URL
                      </label>
                      <div className="relative flex rounded-lg border border-slate-300 bg-white focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 overflow-hidden shadow-2xs">
                        <input
                          type="text"
                          value={workspaceUrl}
                          onChange={(e) => setWorkspaceUrl(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                          placeholder="my-company"
                          required={isSignup}
                          disabled={loading}
                          className="block w-full px-3.5 py-2.5 bg-transparent text-slate-900 placeholder-slate-400 outline-none text-sm font-normal"
                        />
                        <div className="flex items-center px-3.5 bg-slate-50 border-l border-slate-200 text-slate-500 text-xs font-mono select-none">
                          .devflow.io
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <InputField
                      label="Email Address"
                      icon={<Mail className="w-4 h-4" />}
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alice@devflow.io"
                      disabled={loading}
                    />

                    <InputField
                      label={
                        <div className="flex items-center justify-between w-full">
                          <span>Password</span>
                          <button
                            type="button"
                            onClick={() => setIsForgotPassword(true)}
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition cursor-pointer"
                          >
                            Forgot password?
                          </button>
                        </div>
                      }
                      icon={<Lock className="w-4 h-4" />}
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      rightIcon={showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      onRightClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                    />
                  </>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 flex justify-center items-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 shadow-sm transition-all disabled:opacity-75 cursor-pointer"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      {isSignup ? "Create Account" : "Sign In"}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

          </div>

          {/* Toggle Sign Up / Sign In */}
          {!isForgotPassword && (
            <div className="mt-5 text-center text-sm text-slate-600">
              {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                type="button"
                onClick={() => setIsSignup(!isSignup)}
                disabled={loading}
                className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSignup ? "Log in" : "Sign up"}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
