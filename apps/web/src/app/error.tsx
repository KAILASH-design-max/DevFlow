"use client";

/**
 * error.tsx — Next.js App Router route-level error boundary
 *
 * This catches errors thrown by Server/Client Components within this
 * route segment. It correctly differentiates:
 *
 *   NetworkError  → Show offline/network-error page
 *   Regular Error → Show generic application error page
 *
 * It does NOT intercept 401/403/404/500 HTTP responses — those are
 * caught by the API client and rethrown as plain Errors with HTTP
 * status messages, so they render as generic errors here.
 *
 * SECURITY: This page never bypasses auth or exposes raw stack traces.
 */

import React, { useEffect, useState } from "react";
import { OfflineFallback } from "../components/OfflineFallback";
import type { OfflineFallbackKind } from "../components/OfflineFallback";
import { isNetworkError } from "../lib/network-error";

export default function GlobalRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [offlineKind, setOfflineKind] = useState<OfflineFallbackKind | null>(null);

  useEffect(() => {
    // Log for server-side observability (never expose to users)
    console.error("[DevFlow] Route error caught by boundary:", error);

    // Determine if this is a genuine connectivity error
    if (isNetworkError(error)) {
      // Typed NetworkError — use the specific kind
      setOfflineKind(error.kind as OfflineFallbackKind);
      return;
    }

    // Heuristic fallback for untyped network-ish errors
    // (e.g., from server components that don't use fetchWithAuth)
    const msg = error.message?.toLowerCase() ?? "";
    const looksLikeNetworkError =
      (typeof window !== "undefined" && !navigator.onLine) ||
      msg.includes("failed to fetch") ||
      msg.includes("network request failed") ||
      msg.includes("networkerror") ||
      msg.includes("load failed") ||
      (msg.includes("fetch") && msg.includes("connect")) ||
      msg.includes("econnrefused") ||
      msg.includes("timeout") ||
      msg.includes("timed out") ||
      msg.includes("unreachable");

    // IMPORTANT: Do NOT classify 401/403/404/500 messages as network errors
    const isHttpError =
      msg.includes("401") ||
      msg.includes("403") ||
      msg.includes("404") ||
      msg.includes("422") ||
      msg.includes("500") ||
      msg.includes("unauthorized") ||
      msg.includes("forbidden") ||
      msg.includes("not found") ||
      msg.includes("validation") ||
      msg.includes("request failed with status");

    if (looksLikeNetworkError && !isHttpError) {
      const isOnline =
        typeof navigator !== "undefined" ? navigator.onLine : true;
      setOfflineKind(isOnline ? "UNREACHABLE" : "OFFLINE");
    } else {
      setOfflineKind(null);
    }
  }, [error]);

  const handleRetry = async () => {
    if (typeof window !== "undefined") {
      if (!navigator.onLine) {
        throw new Error("Still offline");
      }
      const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/+$/, "");
      try {
        const res = await fetch(`${apiBase}/health`, { cache: "no-store" });
        if (!res.ok) throw new Error("API unreachable");
      } catch {
        throw new Error("Still unreachable");
      }
      // Connection restored: reload the current page from where the network was lost
      window.location.reload();
    } else {
      reset();
    }
  };

  // ── Network/connectivity error ──────────────────────────────────────────────
  if (offlineKind !== null) {
    return (
      <OfflineFallback
        title="Something went wrong"
        kind={offlineKind}
        onRetry={handleRetry}
        fullPage={true}
      />
    );
  }

  // ── Generic application error ───────────────────────────────────────────────
  // Safe user-facing message — never expose raw error details or digests
  const safeMessage =
    error.message &&
    !error.message.includes("digest") &&
    !error.message.includes("NEXT_") &&
    error.message.length < 200
      ? error.message
      : "An unexpected error occurred. Please try again.";

  return (
    <OfflineFallback
      title="Something went wrong"
      message={safeMessage}
      kind="GENERIC"
      onRetry={handleRetry}
      fullPage={true}
    />
  );
}
