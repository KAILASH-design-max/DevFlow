"use client";

/**
 * /offline — Dedicated network error page
 *
 * Rendered when:
 *  - Service Worker intercepts a navigation and detects the user is offline
 *  - The user is manually redirected here via router.push("/offline")
 *  - The Next.js middleware detects a network error during SSR
 *
 * Security: This page does NOT bypass auth. It only renders a static
 * connectivity error UI. Authentication state is preserved.
 */

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OfflineFallback } from "../../components/OfflineFallback";
import type { OfflineFallbackKind } from "../../components/OfflineFallback";

export default function OfflinePage() {
  const router = useRouter();
  const [kind, setKind] = useState<OfflineFallbackKind>("OFFLINE");

  // Determine whether the browser is actually offline or just can't reach the API
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!navigator.onLine) {
      setKind("OFFLINE");
    } else {
      // Browser claims to be online — the API may be unreachable
      const apiBase = (
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
      ).replace(/\/+$/, "");

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      fetch(`${apiBase}/health`, {
        method: "GET",
        signal: controller.signal,
        cache: "no-store",
      })
        .then((res) => {
          clearTimeout(timeout);
          if (res.ok) {
            // API is actually reachable — go back
            router.back();
          } else {
            setKind("API_DOWN");
          }
        })
        .catch(() => {
          clearTimeout(timeout);
          // Fetch itself failed — could be offline or API unreachable
          setKind(navigator.onLine ? "API_DOWN" : "OFFLINE");
        });
    }
  }, [router]);

  const handleRetry = async () => {
    if (typeof window === "undefined") return;

    const apiBase = (
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
    ).replace(/\/+$/, "");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    let ok = false;
    try {
      const res = await fetch(`${apiBase}/health`, {
        method: "GET",
        signal: controller.signal,
        cache: "no-store",
      });
      clearTimeout(timeout);
      ok = res.ok;
    } catch {
      clearTimeout(timeout);
    }

    if (ok) {
      // Go back to wherever the user came from
      router.back();
    } else {
      // Update kind in case the situation changed (e.g., now truly offline)
      setKind(navigator.onLine ? "API_DOWN" : "OFFLINE");
      throw new Error("Still unreachable");
    }
  };

  return (
    <main className="min-h-screen w-full" aria-label="Network error page">
      <OfflineFallback
        title="Something went wrong"
        kind={kind}
        fullPage={true}
        onRetry={handleRetry}
      />
    </main>
  );
}
