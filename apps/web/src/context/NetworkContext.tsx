"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import { WifiOff, AlertTriangle, RefreshCw, X } from "lucide-react";
import { OfflineFallback } from "../components/OfflineFallback";
import type { OfflineFallbackKind } from "../components/OfflineFallback";

export type NetworkState = "ONLINE" | "OFFLINE" | "SLOW" | "RECOVERING";

interface NetworkContextType {
  status: NetworkState;
  isOnline: boolean;
  isOffline: boolean;
  isSlow: boolean;
  isRecovering: boolean;
  latencyMs: number | null;
  lastOnlineAt: Date | null;
  /** Returns true if API is reachable. Updates status accordingly. */
  checkConnection: () => Promise<boolean>;
  /** The specific kind of network problem (for OfflineFallback display). */
  networkErrorKind: OfflineFallbackKind;
  isOfflineModalOpen?: boolean;
  openOfflineModal?: () => void;
  closeOfflineModal?: () => void;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/+$/, "");

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<NetworkState>("ONLINE");
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [lastOnlineAt, setLastOnlineAt] = useState<Date | null>(new Date());
  // Track specific error kind for OfflineFallback messaging
  const [networkErrorKind, setNetworkErrorKind] = useState<OfflineFallbackKind>("OFFLINE");
  const prevStatusRef = useRef<NetworkState>("ONLINE");
  const backoffDelayRef = useRef<number>(3000);

  /**
   * Health ping against /health to determine real backend connectivity and latency.
   */
  const checkConnection = useCallback(async (): Promise<boolean> => {
    if (typeof window !== "undefined" && !navigator.onLine) {
      setStatus("OFFLINE");
      setIsOffline(true);
      setNetworkErrorKind("OFFLINE");
      return false;
    }

    const start = performance.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
      const res = await fetch(`${API_BASE}/health`, {
        method: "GET",
        signal: controller.signal,
        cache: "no-store",
      });

      clearTimeout(timeoutId);
      const duration = Math.round(performance.now() - start);
      setLatencyMs(duration);

      if (res.ok) {
        setLastOnlineAt(new Date());
        backoffDelayRef.current = 3000;

        if (duration > 1800) {
          setStatus("SLOW");
        } else {
          setStatus("ONLINE");
        }

        prevStatusRef.current = "ONLINE";
        return true;
      } else {
        setNetworkErrorKind("API_DOWN");
        setStatus("OFFLINE");
        setIsOffline(true);
        prevStatusRef.current = "OFFLINE";
        return false;
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      setLatencyMs(null);

      // Distinguish timeout vs network failure
      const isTimeout = err?.name === "AbortError";
      const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

      if (isTimeout) {
        setNetworkErrorKind("TIMEOUT");
      } else if (!isOnline) {
        setNetworkErrorKind("OFFLINE");
      } else {
        setNetworkErrorKind("API_DOWN");
      }

      setStatus("OFFLINE");
      setIsOffline(true);
      prevStatusRef.current = "OFFLINE";
      return false;
    }
  }, []);

  // Event listeners for browser online/offline & network errors
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!navigator.onLine) {
      setIsOffline(true);
      setStatus("OFFLINE");
      setNetworkErrorKind("OFFLINE");
    } else {
      // Initial connection check
      checkConnection();
    }

    const handleBrowserOnline = () => {
      setStatus("RECOVERING");
      prevStatusRef.current = "RECOVERING";
      // Background ping to check if API is up
      checkConnection();
    };

    const handleBrowserOffline = () => {
      setStatus("OFFLINE");
      setIsOffline(true);
      setNetworkErrorKind("OFFLINE");
      prevStatusRef.current = "OFFLINE";
      setLatencyMs(null);
    };

    const handleNetworkError = (event: Event) => {
      // Read the error kind from the event detail if available (emitted by fetchWithAuth)
      const detail = (event as CustomEvent).detail;
      const kind: OfflineFallbackKind =
        detail?.kind === "TIMEOUT"
          ? "TIMEOUT"
          : detail?.kind === "API_DOWN" || (typeof navigator !== "undefined" && navigator.onLine)
          ? "API_DOWN"
          : "OFFLINE";

      setNetworkErrorKind(kind);
      setStatus("OFFLINE");
      setIsOffline(true);
      prevStatusRef.current = "OFFLINE";
    };

    window.addEventListener("online", handleBrowserOnline);
    window.addEventListener("offline", handleBrowserOffline);
    window.addEventListener("devflow:network_error", handleNetworkError);

    return () => {
      window.removeEventListener("online", handleBrowserOnline);
      window.removeEventListener("offline", handleBrowserOffline);
      window.removeEventListener("devflow:network_error", handleNetworkError);
    };
  }, [checkConnection]);

  // Periodic heartbeat when online
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (status === "ONLINE" || status === "SLOW") {
      // Normal online heartbeat: ping every 45s
      timer = setInterval(() => {
        checkConnection();
      }, 45000);
    } else if (isOffline) {
      // Offline: exponential backoff polling up to 30s to detect server availability in background
      timer = setTimeout(() => {
        checkConnection().then((success) => {
          if (!success) {
            backoffDelayRef.current = Math.min(backoffDelayRef.current * 1.5, 30000);
          }
        });
      }, backoffDelayRef.current);
    }

    return () => clearTimeout(timer);
  }, [status, isOffline, checkConnection]);

  // Lock body scroll when full-page network error screen is active
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (isOffline) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOffline]);

  /**
   * Called when user hits the "Try again" button on the full size network error page.
   * Verifies connectivity, and on success, loads the page from where network was lost.
   */
  const handleRetry = useCallback(async () => {
    const isBackOnline = await checkConnection();
    if (!isBackOnline) {
      throw new Error("Unable to reach DevFlow servers");
    }

    setIsOffline(false);
    setStatus("ONLINE");
    prevStatusRef.current = "ONLINE";

    // Load the page from where the network was lost, starting from that page
    if (typeof window !== "undefined") {
      if (window.location.pathname === "/offline") {
        if (window.history.length > 1) {
          window.history.back();
        } else {
          window.location.href = "/dashboard";
        }
      } else {
        window.location.reload();
      }
    }
  }, [checkConnection]);

  return (
    <NetworkContext.Provider
      value={{
        status,
        isOnline: status === "ONLINE",
        isOffline,
        isSlow: status === "SLOW",
        isRecovering: status === "RECOVERING",
        latencyMs,
        lastOnlineAt,
        checkConnection,
        networkErrorKind,
        isOfflineModalOpen: false,
        openOfflineModal: () => {},
        closeOfflineModal: () => {},
      }}
    >
      {/* When network is lost, hide all other pages completely */}
      <div className={isOffline ? "hidden" : "contents"} aria-hidden={isOffline}>
        {children}
      </div>

      {/* Full size network error page taking over the entire screen */}
      {isOffline && (
        <div
          className="fixed inset-0 z-[99999] w-screen h-screen bg-white dark:bg-slate-950 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label="Network error"
        >
          <OfflineFallback
            title="Something went wrong"
            kind={networkErrorKind}
            fullPage={true}
            onRetry={handleRetry}
          />
        </div>
      )}
    </NetworkContext.Provider>
  );
}

export function useNetworkStatus(): NetworkContextType {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error("useNetworkStatus must be used within a NetworkProvider");
  }
  return context;
}

/**
 * Deprecated: Bottom-right banner deleted in favor of full-page network error screen.
 */
export function NetworkStatusBanner() {
  return null;
}

/**
 * Deprecated: Offline modal deleted in favor of full-page network error screen.
 */
export function OfflineModal(_props?: any) {
  return null;
}
