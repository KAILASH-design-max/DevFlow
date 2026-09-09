"use client";

import React, { useState, useEffect, useId } from "react";
import { RefreshCw, WifiOff } from "lucide-react";

// ─── Inline SVG illustration ──────────────────────────────────────────────────
// Rendered locally — no external image fetch that could itself fail offline.
function NetworkOfflineIllustration({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      {/* Ground / shadow ellipse */}
      <ellipse cx="100" cy="148" rx="56" ry="8" fill="currentColor" opacity="0.07" />

      {/* Cloud body */}
      <path
        d="M140 96H68a24 24 0 0 1-4-47.6A32 32 0 0 1 126 52a20 20 0 0 1 14 34z"
        fill="currentColor"
        opacity="0.12"
      />
      <path
        d="M140 96H68a24 24 0 0 1-4-47.6A32 32 0 0 1 126 52a20 20 0 0 1 14 34z"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.3"
      />

      {/* WiFi arc outer */}
      <path
        d="M72 108c7.5-7.5 17.8-12 29-12s21.5 4.5 29 12"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        opacity="0.25"
      />
      {/* WiFi arc middle */}
      <path
        d="M80 116c5-5 11.8-8 21-8s16 3 21 8"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        opacity="0.25"
      />
      {/* WiFi dot */}
      <circle cx="101" cy="126" r="4" fill="currentColor" opacity="0.3" />

      {/* Red X over the wifi */}
      <line x1="84" y1="102" x2="118" y2="136" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
      <line x1="118" y1="102" x2="84" y2="136" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// ─── Error kind ───────────────────────────────────────────────────────────────

export type OfflineFallbackKind = "OFFLINE" | "API_DOWN" | "TIMEOUT" | "UNREACHABLE" | "GENERIC";

function getMessage(kind: OfflineFallbackKind, overrideMessage?: string): string {
  if (overrideMessage) return overrideMessage;
  switch (kind) {
    case "OFFLINE":
      return "No Internet connection. Make sure that Wi-Fi or mobile data is turned on, then try again.";
    case "API_DOWN":
      return "DevFlow servers are temporarily unreachable. Your connection appears to be working. Please try again shortly.";
    case "TIMEOUT":
      return "The request timed out. Please check your network connection and try again.";
    case "UNREACHABLE":
      return "Unable to reach DevFlow servers. Please check your internet connection and try again.";
    default:
      return "No Internet connection. Make sure that Wi-Fi or mobile data is turned on, then try again.";
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OfflineFallbackProps {
  /** Page title shown as the main heading. */
  title?: string;
  /** Override the body message. Defaults are chosen by `kind`. */
  message?: string;
  /** The type of network problem. Controls default messaging and icon colour. */
  kind?: OfflineFallbackKind;
  /** Custom retry callback. When omitted, component pings /health and reloads. */
  onRetry?: () => Promise<void> | void;
  /** Whether to use full-screen layout. Default true. */
  fullPage?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function OfflineFallback({
  title = "Something went wrong",
  message,
  kind = "OFFLINE",
  onRetry,
  fullPage = true,
}: OfflineFallbackProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [failedAttempt, setFailedAttempt] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Prevent concurrent retries
  const isRetryingRef = React.useRef(false);

  // Live-region ID for screen-reader announcements
  const statusId = useId();

  // Listen for online event to show a hint
  const [browserOnline, setBrowserOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onOnline = () => setBrowserOnline(true);
    const onOffline = () => setBrowserOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const resolvedMessage = getMessage(kind, message);

  const handleRetry = async () => {
    if (isRetryingRef.current) return;
    isRetryingRef.current = true;
    setIsChecking(true);
    setFailedAttempt(false);

    try {
      if (onRetry) {
        await onRetry();
      } else {
        // Default: check browser online status first, then ping health endpoint
        if (typeof window !== "undefined" && !navigator.onLine) {
          throw new Error("navigator.onLine is false");
        }

        const apiBase = (
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
        ).replace(/\/+$/, "");
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        let ok = false;
        try {
          const res = await fetch(`${apiBase}/health`, {
            method: "GET",
            signal: controller.signal,
            cache: "no-store",
          });
          clearTimeout(timeoutId);
          ok = res.ok;
        } catch {
          clearTimeout(timeoutId);
        }

        if (ok) {
          // Connectivity restored — reload current page
          window.location.reload();
          return;
        }

        throw new Error("Still unreachable");
      }

      setRetryCount((c) => c + 1);
    } catch {
      setFailedAttempt(true);
      setTimeout(() => setFailedAttempt(false), 3000);
    } finally {
      setIsChecking(false);
      isRetryingRef.current = false;
    }
  };

  // ── Layout classes ─────────────────────────────────────────────────────────
  const containerClasses = fullPage
    ? "min-h-screen w-full flex items-center justify-center p-6 bg-white dark:bg-slate-950 font-sans transition-colors duration-200"
    : "w-full py-16 px-6 flex items-center justify-center bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 font-sans transition-colors duration-200";

  return (
    <div
      className={containerClasses}
      role="alert"
      aria-live="assertive"
      aria-labelledby={`${statusId}-heading`}
      aria-describedby={`${statusId}-message`}
    >
      <div className="max-w-sm w-full mx-auto flex flex-col items-center text-center gap-0">

        {/* Illustration */}
        <div className="mb-6 flex items-center justify-center">
          <div className="relative">
            {/* Soft background circle */}
            <div className="w-36 h-36 rounded-full bg-slate-100 dark:bg-slate-800/60 flex items-center justify-center">
              <NetworkOfflineIllustration className="w-28 h-28 text-slate-400 dark:text-slate-500" />
            </div>

            {/* Offline indicator badge */}
            <div className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/60 border-2 border-white dark:border-slate-950 flex items-center justify-center shadow-sm">
              <WifiOff className="w-4 h-4 text-red-500 dark:text-red-400" aria-hidden="true" />
            </div>
          </div>
        </div>

        {/* Heading */}
        <h1
          id={`${statusId}-heading`}
          className="text-[26px] sm:text-[28px] font-semibold tracking-tight text-slate-900 dark:text-white mb-3 leading-tight"
        >
          {title}
        </h1>

        {/* Message */}
        <p
          id={`${statusId}-message`}
          className="text-slate-500 dark:text-slate-400 text-sm sm:text-base leading-relaxed max-w-xs mb-8"
        >
          {resolvedMessage}
        </p>

        {/* Browser came back online hint */}
        {browserOnline && kind === "OFFLINE" && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-4 animate-in fade-in duration-200">
            ✓ Connection detected — tap Try again to reconnect.
          </p>
        )}

        {/* Try again button */}
        <button
          id={`${statusId}-retry`}
          onClick={handleRetry}
          disabled={isChecking}
          aria-busy={isChecking}
          aria-label={isChecking ? "Checking connection, please wait" : "Try again"}
          className="inline-flex items-center justify-center gap-2 px-10 py-3 rounded-full bg-[#355bdc] hover:bg-[#2849be] active:bg-[#1f3aa0] text-white text-base font-medium transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#355bdc] focus-visible:ring-offset-2 cursor-pointer"
        >
          {isChecking ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />
              <span>Checking connection…</span>
            </>
          ) : (
            <span>Try again</span>
          )}
        </button>

        {/* Screen-reader live region for status announcements */}
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {isChecking ? "Checking connection, please wait." : ""}
          {failedAttempt ? "Still unable to connect. Please check your network." : ""}
          {retryCount > 0 && !isChecking && !failedAttempt ? "Connection check complete." : ""}
        </div>

        {/* Visible failure feedback */}
        {failedAttempt && (
          <div
            role="status"
            className="mt-4 flex items-center gap-2 text-xs font-medium text-amber-600 dark:text-amber-400 animate-in fade-in duration-200"
          >
            <WifiOff className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Still unable to connect. Please check your network cables or Wi‑Fi settings.</span>
          </div>
        )}
      </div>
    </div>
  );
}
