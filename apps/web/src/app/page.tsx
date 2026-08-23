"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "../lib/api";
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
} from "lucide-react";

function FeatureList() {
  const features = [
    {
      icon: <Sparkles className="w-5 h-5 text-indigo-600" />,
      title: "AI Issue Breakdown",
      desc: "Turn vague bug reports into structured, actionable engineering tasks instantly.",
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
      title: "Role-Based Access",
      desc: "Granular permissions for Admins, Tech Leads, Developers, QA, and Viewers.",
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
          <span className="ml-2 text-[10px] font-mono font-semibold uppercase tracking-wider bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
            v2.4
          </span>
        </div>
      </div>

      {/* Main Pitch */}
      <div className="max-w-md my-auto py-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Clarity-First Issue Tracking</span>
        </div>

        <h2 className="text-3xl xl:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-3">
          Simple, fast, and intelligent project management.
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed mb-6">
          Everything your engineering team needs without the visual clutter. Uncluttered boards, high-contrast clarity, and built-in AI assistance.
        </p>

        {/* Features List */}
        <FeatureList />
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-slate-200/60">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>No credit card required</span>
        </div>
        <span>Enterprise-ready RBAC</span>
      </div>
    </aside>
  );
}

interface InputFieldProps {
  label: string;
  icon: React.ReactNode;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  rightIcon?: React.ReactNode;
  onRightClick?: () => void;
  disabled?: boolean;
}

function InputField({
  label,
  icon,
  type = "text",
  placeholder,
  value,
  onChange,
  rightIcon,
  onRightClick,
  disabled,
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
          required
          disabled={disabled}
          className={`block w-full ${
            rightIcon ? "pr-10" : "pr-3.5"
          } pl-10 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition disabled:opacity-50 text-sm`}
        />
        {rightIcon && (
          <button
            type="button"
            onClick={onRightClick}
            disabled={disabled}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition-colors disabled:opacity-50"
          >
            {rightIcon}
          </button>
        )}
      </div>
    </div>
  );
}

interface LoginFormProps {
  switchToSignup: () => void;
  onSubmit: (email: string, password: string) => Promise<void>;
  loading: boolean;
  error: string;
  onQuickFillDemo: () => void;
}

function LoginForm({
  switchToSignup,
  onSubmit,
  loading,
  error,
  onQuickFillDemo,
}: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("alice@devflow.io");
  const [password, setPassword] = useState("Password123");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(email, password);
  };

  return (
    <div className="w-full max-w-md animate-fade-in">
      {/* Login Card Container */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xl">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Welcome back
          </h2>
          <p className="text-slate-600 text-sm mt-1">
            Sign in to your DevFlow workspace
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-lg text-xs bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
            <span className="truncate">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 flex justify-center items-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 shadow-sm transition-all disabled:opacity-75 cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Sign in
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Auto-Fill Hint */}
        <div
          onClick={() => {
            setEmail("alice@devflow.io");
            setPassword("Password123");
            onQuickFillDemo();
          }}
          className="mt-6 p-2.5 rounded-lg bg-indigo-50/70 border border-indigo-100 text-center text-xs text-slate-700 flex items-center justify-center gap-1.5 cursor-pointer hover:bg-indigo-100/70 transition"
          title="Click to fill demo credentials"
        >
          <span className="font-semibold text-indigo-700">✨ Click to auto-fill:</span>
          <span className="text-slate-800 font-mono text-[11px]">
            alice@devflow.io
          </span>
          <span className="text-slate-400">/</span>
          <span className="text-slate-800 font-mono text-[11px]">
            Password123
          </span>
        </div>
      </div>

      {/* Switch to Signup */}
      <div className="mt-6 text-center text-sm text-slate-600">
        Don't have an account?{" "}
        <button
          onClick={switchToSignup}
          disabled={loading}
          className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors disabled:opacity-50 cursor-pointer"
        >
          Sign up
        </button>
      </div>
    </div>
  );
}

interface SignupFormProps {
  switchToLogin: () => void;
  onSubmit: (name: string, email: string, password: string) => Promise<void>;
  loading: boolean;
  error: string;
}

function SignupForm({
  switchToLogin,
  onSubmit,
  loading,
  error,
}: SignupFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [workspace, setWorkspace] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(fullName, email, password);
  };

  return (
    <div className="w-full max-w-md animate-fade-in">
      {/* Signup Card Container */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xl">
        {/* Header */}
        <div className="p-8 pb-5 border-b border-slate-100">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Create an account
          </h2>
          <p className="text-slate-600 text-sm mt-1">
            Start managing issues with AI in seconds
          </p>
        </div>

        {error && (
          <div className="px-8 pt-4">
            <div className="p-3 rounded-lg text-xs bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
              <span className="truncate">{error}</span>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="p-8 pt-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <InputField
              label="Full Name"
              icon={<User className="w-4 h-4" />}
              placeholder="Jane Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={loading}
            />

            <InputField
              label="Work Email"
              icon={<Mail className="w-4 h-4" />}
              type="email"
              placeholder="jane@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />

            <InputField
              label="Password"
              icon={<Lock className="w-4 h-4" />}
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              rightIcon={showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              onRightClick={() => setShowPassword(!showPassword)}
              disabled={loading}
            />

            {/* Workspace Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Workspace URL
              </label>
              <div className="flex rounded-lg shadow-2xs">
                <input
                  type="text"
                  value={workspace}
                  onChange={(e) => setWorkspace(e.target.value)}
                  placeholder="my-team"
                  required
                  disabled={loading}
                  className="flex-1 min-w-0 bg-white border border-slate-300 text-slate-900 rounded-l-lg px-3.5 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none disabled:opacity-50"
                />
                <span className="inline-flex items-center px-3 rounded-r-lg border border-l-0 border-slate-300 bg-slate-50 text-slate-500 text-xs font-mono">
                  .devflow.io
                </span>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex justify-center items-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 shadow-sm transition-all disabled:opacity-75 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/80 text-center">
          <p className="text-sm text-slate-600">
            Already have an account?{" "}
            <button
              onClick={switchToLogin}
              disabled={loading}
              className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Log in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (email: string, password: string) => {
    setLoading(true);
    setError("");

    try {
      const res = await authApi.login(email, password);
      if (res.success) {
        localStorage.setItem("accessToken", res.data.accessToken);
        localStorage.setItem("token", res.data.accessToken);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        
        // Check preferred default view (Dashboard vs Kanban)
        const defaultView = localStorage.getItem("preferredDefaultView");
        const targetRoute = defaultView === "kanban" ? "/dashboard/board" : "/dashboard";
        router.push(targetRoute);
      } else {
        setError(res.error || "Invalid credentials");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (
    name: string,
    email: string,
    password: string
  ) => {
    setLoading(true);
    setError("");

    try {
      const res = await authApi.register(name, email, password);
      if (res.success) {
        setIsSignup(false);
        setError("");
      } else {
        setError(res.error || "Registration failed");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
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
        {isSignup ? (
          <SignupForm
            switchToLogin={() => {
              setIsSignup(false);
              setError("");
            }}
            onSubmit={handleRegister}
            loading={loading}
            error={error}
          />
        ) : (
          <LoginForm
            switchToSignup={() => {
              setIsSignup(true);
              setError("");
            }}
            onSubmit={handleLogin}
            loading={loading}
            error={error}
            onQuickFillDemo={() => setError("")}
          />
        )}
      </main>
    </div>
  );
}
